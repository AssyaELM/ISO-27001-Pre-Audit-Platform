import { requireSuperAdmin, superAdminErrorResponse } from "@/lib/super-admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { expiresInDays, generateActivationToken, hashActivationToken, writeAdminActivity } from "@/lib/super-admin/data";
import { invitationEmail } from "@/lib/email/templates/invitation-email";
import { sendNormCoreEmail } from "@/lib/email/mailer";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await requireSuperAdmin();
    const { id } = await params;
    const admin = createAdminClient();
    const { data: profile, error: readError } = await admin.from("organization_admin_profiles").select("primary_email,status,invitation_status").eq("workspace_id", id).maybeSingle();
    if (readError) throw readError;
    if (!profile || profile.status === "deleted") return Response.json({ error: "Organization not found" }, { status: 404 });
    const body = await request.json().catch(() => ({})) as { token?: string };
    let token = body.token?.trim().toUpperCase() ?? "";
    if (!/^[A-Z2-9]{12}$/.test(token)) {
      token = generateActivationToken();
      const now = new Date().toISOString();
      const { error: revokeError } = await admin.from("activation_tokens").update({ status: "revoked", revoked_at: now }).eq("workspace_id", id).eq("status", "pending");
      if (revokeError) throw revokeError;
      const { error: tokenError } = await admin.from("activation_tokens").insert({ workspace_id: id, token_hash: hashActivationToken(token), token_preview: token.slice(-4), expires_at: expiresInDays(), created_by: identity.user.id });
      if (tokenError) throw tokenError;
      await writeAdminActivity({ adminUserId: identity.user.id, workspaceId: id, action: "token_regenerated" });
    }
    const { data: workspace, error: workspaceError } = await admin.from("workspaces").select("name").eq("id", id).maybeSingle();
    if (workspaceError) throw workspaceError;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(request.url).origin;
    const emailResult = await sendNormCoreEmail({ to: profile.primary_email, ...invitationEmail(workspace?.name ?? "your organization", token, appUrl) });
    const now = new Date().toISOString();
    if (!emailResult.sent) {
      await admin.from("organization_admin_profiles").update({ invitation_status: "failed", last_activity_at: now }).eq("workspace_id", id);
      await writeAdminActivity({ adminUserId: identity.user.id, workspaceId: id, action: profile.invitation_status === "sent" ? "invitation_resent" : "invitation_sent", result: "failed" });
      await writeAdminActivity({ adminUserId: identity.user.id, workspaceId: id, action: "invitation_email_failed", result: "failed", details: { email: profile.primary_email, reason: emailResult.reason } });
      return Response.json({ error: emailResult.reason }, { status: 502 });
    }
    await admin.from("organization_admin_profiles").update({ activation_status: "invitation_sent", invitation_status: "sent", last_activity_at: now }).eq("workspace_id", id);
    await writeAdminActivity({ adminUserId: identity.user.id, workspaceId: id, action: profile.invitation_status === "sent" ? "invitation_resent" : "invitation_sent" });
    await writeAdminActivity({ adminUserId: identity.user.id, workspaceId: id, action: "invitation_email_sent" });
    return Response.json({ ok: true });
  } catch (cause) {
    return superAdminErrorResponse(cause);
  }
}
