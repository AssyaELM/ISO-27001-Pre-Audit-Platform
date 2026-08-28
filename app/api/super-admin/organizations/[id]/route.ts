import { requireSuperAdmin, superAdminErrorResponse } from "@/lib/super-admin/auth";
import { loadOrganizations, publicOrganization, writeAdminActivity } from "@/lib/super-admin/data";
import { createAdminClient } from "@/lib/supabase/admin";

const allowedActions = new Set(["suspend", "reactivate", "archive", "delete"]);

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    const organization = (await loadOrganizations(true)).find((item) => item.id === id);
    if (!organization || organization.status === "deleted") return Response.json({ error: "Organization not found" }, { status: 404 });
    const admin = createAdminClient();
    const [{ data: token, error: tokenError }, { data: activity, error: activityError }] = await Promise.all([
      admin.from("activation_tokens").select("id,token_preview,status,created_at,expires_at,used_at,revoked_at").eq("workspace_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      admin.from("admin_activity_log").select("id,action,result,created_at,details").eq("workspace_id", id).order("created_at", { ascending: false }).limit(12),
    ]);
    if (tokenError) throw tokenError;
    if (activityError) throw activityError;
    return Response.json({ organization: publicOrganization(organization), token, activity: activity ?? [] });
  } catch (cause) {
    return superAdminErrorResponse(cause);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json() as { action?: string };
    const action = body.action ?? "";
    if (!allowedActions.has(action)) return Response.json({ error: "Unsupported organization action" }, { status: 400 });
    const current = (await loadOrganizations(true)).find((item) => item.id === id);
    if (!current || current.status === "deleted") return Response.json({ error: "Organization not found" }, { status: 404 });

    const updates: Record<string, unknown> = { last_activity_at: new Date().toISOString() };
    if (action === "suspend") updates.status = "suspended";
    if (action === "reactivate") updates.status = current.activation_status === "activated" ? "active" : "pending_activation";
    if (action === "archive") { updates.status = "archived"; updates.archived_at = new Date().toISOString(); }
    if (action === "delete") { updates.status = "deleted"; updates.deleted_at = new Date().toISOString(); }
    const admin = createAdminClient();
    const { error } = await admin.from("organization_admin_profiles").update(updates).eq("workspace_id", id);
    if (error) throw error;
    const logAction = {
      suspend: "organization_suspended",
      reactivate: "organization_reactivated",
      archive: "organization_archived",
      delete: "organization_deleted",
    }[action] as string;
    await writeAdminActivity({ adminUserId: identity.user.id, workspaceId: id, action: logAction });
    return Response.json({ ok: true, status: updates.status, deletionMode: action === "delete" ? "soft_delete" : undefined });
  } catch (cause) {
    return superAdminErrorResponse(cause);
  }
}
