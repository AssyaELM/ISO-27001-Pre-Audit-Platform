import { requireSuperAdmin, superAdminErrorResponse } from "@/lib/super-admin/auth";
import { expiresInDays, generateActivationToken, hashActivationToken, writeAdminActivity } from "@/lib/super-admin/data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => ({})) as { action?: "regenerate" | "revoke" };
    const action = body.action ?? "regenerate";
    const admin = createAdminClient();
    const { data: organization } = await admin.from("organization_admin_profiles").select("workspace_id,status").eq("workspace_id", id).maybeSingle();
    if (!organization || organization.status === "deleted") return Response.json({ error: "Organization not found" }, { status: 404 });
    const now = new Date().toISOString();
    const { error: revokeError } = await admin.from("activation_tokens").update({ status: "revoked", revoked_at: now }).eq("workspace_id", id).eq("status", "pending");
    if (revokeError) throw revokeError;
    if (action === "revoke") {
      await admin.from("organization_admin_profiles").update({ activation_status: "revoked", invitation_status: "revoked", last_activity_at: now }).eq("workspace_id", id);
      await writeAdminActivity({ adminUserId: identity.user.id, workspaceId: id, action: "token_revoked" });
      return Response.json({ ok: true });
    }
    const token = generateActivationToken();
    const expiresAt = expiresInDays();
    const { error } = await admin.from("activation_tokens").insert({
      workspace_id: id,
      token_hash: hashActivationToken(token),
      token_preview: token.slice(-4),
      expires_at: expiresAt,
      created_by: identity.user.id,
    });
    if (error) throw error;
    await admin.from("organization_admin_profiles").update({ activation_status: "pending", invitation_status: "pending", last_activity_at: now }).eq("workspace_id", id);
    await writeAdminActivity({ adminUserId: identity.user.id, workspaceId: id, action: "token_regenerated" });
    return Response.json({ token, expiresAt, tokenVisibleOnce: true });
  } catch (cause) {
    return superAdminErrorResponse(cause);
  }
}
