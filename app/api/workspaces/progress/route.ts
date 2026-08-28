import { NextResponse } from "next/server";
import { getCurrentUser, isLocalSyntheticUser } from "@/lib/workspaces/authenticated-client";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentUser();
    if (!user || isLocalSyntheticUser(user)) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    const body = await request.json() as { workspaceId?: string; currentScreen?: number; completed?: boolean };
    const workspaceId = body.workspaceId?.trim() ?? "";
    if (!/^[0-9a-f-]{36}$/i.test(workspaceId)) return NextResponse.json({ error: "Valid workspaceId required" }, { status: 400 });
    const admin = createAdminClient();
    const { data: workspace } = await admin.from("workspaces").select("id,owner_id").eq("id", workspaceId).maybeSingle();
    if (!workspace || workspace.owner_id !== user.id) return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
    const currentScreen = Math.min(8, Math.max(0, Math.floor(Number(body.currentScreen) || 0)));
    const completed = body.completed === true;
    const onboardingProgress = completed ? 100 : Math.min(99, Math.round(currentScreen * 100 / 9));
    const onboardingStatus = completed ? "completed" : currentScreen > 0 ? "in_progress" : "not_started";
    const { error } = await admin.from("organization_admin_profiles").upsert({
      workspace_id: workspaceId,
      primary_email: user.email?.toLowerCase() ?? "",
      status: "active",
      activation_status: "activated",
      invitation_status: "used",
      onboarding_status: onboardingStatus,
      onboarding_progress: onboardingProgress,
      last_activity_at: new Date().toISOString(),
    }, { onConflict: "workspace_id" });
    if (error) throw error;
    return NextResponse.json({ onboardingStatus, onboardingProgress });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Unable to update onboarding progress" }, { status: 500 });
  }
}
