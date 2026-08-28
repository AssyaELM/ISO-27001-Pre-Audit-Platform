import { requireSuperAdmin, superAdminErrorResponse } from "@/lib/super-admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    await requireSuperAdmin();
    const url = new URL(request.url);
    const action = url.searchParams.get("action")?.trim() ?? "";
    const workspaceId = url.searchParams.get("organization")?.trim() ?? "";
    const from = url.searchParams.get("from")?.trim() ?? "";
    const to = url.searchParams.get("to")?.trim() ?? "";
    const admin = createAdminClient();
    let query = admin.from("admin_activity_log").select("id,admin_user_id,workspace_id,action,result,created_at,details").order("created_at", { ascending: false }).limit(500);
    if (action) query = query.eq("action", action);
    if (workspaceId) query = query.eq("workspace_id", workspaceId);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", `${to}T23:59:59.999Z`);
    const [{ data: events, error }, { data: workspaces }, usersResult] = await Promise.all([
      query,
      admin.from("workspaces").select("id,name"),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    if (error) throw error;
    const names = new Map((workspaces ?? []).map((item) => [item.id, item.name]));
    const admins = new Map(usersResult.data.users.map((user) => [user.id, String(user.user_metadata?.full_name ?? user.email ?? "Not available")]));
    return Response.json({ items: (events ?? []).map((event) => ({
      ...event,
      adminName: event.admin_user_id ? admins.get(event.admin_user_id) ?? "Not available" : "NormCore System",
      organizationName: event.workspace_id ? names.get(event.workspace_id) ?? "Archived organization" : String(event.details?.requesterEmail ?? "Not available"),
    })) });
  } catch (cause) {
    return superAdminErrorResponse(cause);
  }
}
