import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/workspaces/authenticated-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePostAuthDestination } from "@/lib/auth/destination";
import { accessRequestStatusForUser, blockedAccessMessage } from "@/lib/auth/access-request";

export async function GET(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data: platformAdmin } = await createAdminClient()
      .from("platform_admins")
      .select("role,active")
      .eq("user_id", user.id)
      .maybeSingle();
    const isSuperAdmin = platformAdmin?.role === "super_admin" && platformAdmin.active === true;
    const accessStatus = isSuperAdmin ? "legacy" : await accessRequestStatusForUser(user);
    if (accessStatus === "pending" || accessStatus === "rejected") {
      return NextResponse.json({
        error: blockedAccessMessage(accessStatus),
        accessStatus,
        destination: `/access-status?status=${accessStatus}`,
      }, { status: 403 });
    }
    const nextPath = new URL(request.url).searchParams.get("next") ?? undefined;
    return NextResponse.json({
      userId: user.id,
      email: user.email ?? "",
      metadata: user.user_metadata ?? {},
      role: isSuperAdmin ? "super_admin" : "organization_user",
      accessStatus,
      destination: isSuperAdmin ? "/super-admin/dashboard" : resolvePostAuthDestination(nextPath, user.user_metadata),
    });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Authentication required" }, { status: 401 });
  }
}
