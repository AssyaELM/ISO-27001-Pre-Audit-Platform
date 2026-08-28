import { requireSuperAdmin, superAdminErrorResponse } from "@/lib/super-admin/auth";
import { loadOrganizations, publicOrganization } from "@/lib/super-admin/data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await requireSuperAdmin();
    const admin = createAdminClient();
    const [organizations, activityResult] = await Promise.all([
      loadOrganizations(),
      admin.from("admin_activity_log").select("id,action,result,workspace_id,created_at,details").order("created_at", { ascending: false }).limit(6),
    ]);
    if (activityResult.error) throw activityResult.error;
    const names = new Map(organizations.map((item) => [item.id, item.name]));
    const counts = {
      total: organizations.length,
      active: organizations.filter((item) => item.status === "active").length,
      pendingActivation: organizations.filter((item) => item.activation_status !== "activated" && item.status !== "archived").length,
      onboardingInProgress: organizations.filter((item) => item.onboarding_status === "in_progress").length,
      onboardingCompleted: organizations.filter((item) => item.onboarding_status === "completed").length,
      suspended: organizations.filter((item) => item.status === "suspended").length,
    };
    return Response.json({
      counts,
      byStatus: {
        active: counts.active,
        pending: organizations.filter((item) => item.status === "pending_activation").length,
        suspended: counts.suspended,
        archived: organizations.filter((item) => item.status === "archived").length,
      },
      onboarding: {
        completed: counts.onboardingCompleted,
        inProgress: counts.onboardingInProgress,
        notStarted: organizations.filter((item) => item.onboarding_status === "not_started").length,
      },
      recentOrganizations: organizations.slice(0, 5).map(publicOrganization),
      recentActivity: (activityResult.data ?? []).map((item) => ({ ...item, organizationName: item.workspace_id ? names.get(item.workspace_id) ?? null : String(item.details?.requesterEmail ?? "Access request") })),
    });
  } catch (cause) {
    return superAdminErrorResponse(cause);
  }
}
