import { requireSuperAdmin, superAdminErrorResponse } from "@/lib/super-admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    await requireSuperAdmin();
    const status = new URL(request.url).searchParams.get("status")?.trim() ?? "";
    const admin = createAdminClient();
    let query = admin.from("activation_tokens").select("id,workspace_id,token_preview,status,created_at,expires_at,used_at,revoked_at").order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    const [{ data: tokens, error: tokenError }, { data: workspaces, error: workspaceError }, { data: profiles, error: profileError }] = await Promise.all([
      query,
      admin.from("workspaces").select("id,name"),
      admin.from("organization_admin_profiles").select("workspace_id,primary_email,invitation_status,status").neq("status", "deleted"),
    ]);
    if (tokenError) throw tokenError;
    if (workspaceError) throw workspaceError;
    if (profileError) throw profileError;
    const names = new Map((workspaces ?? []).map((item) => [item.id, item.name]));
    const profileMap = new Map((profiles ?? []).map((item) => [item.workspace_id, item]));
    const items = (tokens ?? []).flatMap((token) => {
      const profile = profileMap.get(token.workspace_id);
      if (!profile) return [];
      const effectiveStatus = token.status === "pending" && new Date(token.expires_at) <= new Date() ? "expired" : token.status;
      return [{ ...token, status: effectiveStatus, tokenPreview: `••••••••${token.token_preview}`, organizationName: names.get(token.workspace_id) ?? "Not available", primaryEmail: profile.primary_email, invitationStatus: profile.invitation_status }];
    });
    return Response.json({ items });
  } catch (cause) {
    return superAdminErrorResponse(cause);
  }
}
