import { headers } from "next/headers";
import { requireSuperAdmin, superAdminErrorResponse } from "@/lib/super-admin/auth";
import { writeAdminActivity } from "@/lib/super-admin/data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const identity = await requireSuperAdmin();
    const requestHeaders = await headers();
    const userAgent = requestHeaders.get("user-agent") ?? "";
    const { data: userResult } = await createAdminClient().auth.admin.getUserById(identity.user.id);
    return Response.json({
      profile: { name: identity.name, email: identity.email, role: "Super Admin", initials: identity.initials },
      security: { twoFactorEnabled: identity.user.factors?.some((factor) => factor.status === "verified") ?? false, lastSignInAt: userResult.user?.last_sign_in_at ?? null },
      session: { userAgent: userAgent || null, location: null },
      preferences: identity.preferences,
    });
  } catch (cause) {
    return superAdminErrorResponse(cause);
  }
}

export async function PATCH(request: Request) {
  try {
    const identity = await requireSuperAdmin();
    const body = await request.json() as { preferences?: Record<string, unknown> };
    const allowed = ["activation_alerts", "weekly_portfolio_summary", "audit_export_reminders"] as const;
    const preferences = Object.fromEntries(allowed.map((key) => [key, body.preferences?.[key] === true]));
    const admin = createAdminClient();
    const { error } = await admin.from("platform_admins").update({ preferences }).eq("user_id", identity.user.id);
    if (error) throw error;
    await writeAdminActivity({ adminUserId: identity.user.id, action: "settings_updated" });
    return Response.json({ preferences });
  } catch (cause) {
    return superAdminErrorResponse(cause);
  }
}
