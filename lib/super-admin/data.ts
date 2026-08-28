import { createHash, randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const TOKEN_LENGTH = 12;
const TOKEN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateActivationToken() {
  return Array.from({ length: TOKEN_LENGTH }, () => TOKEN_ALPHABET[randomInt(0, TOKEN_ALPHABET.length)]).join("");
}

export function hashActivationToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function expiresInDays(days = 7) {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

export async function writeAdminActivity(input: {
  adminUserId: string | null;
  workspaceId?: string | null;
  action: string;
  result?: "success" | "failed";
  details?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("admin_activity_log").insert({
    admin_user_id: input.adminUserId,
    workspace_id: input.workspaceId ?? null,
    action: input.action,
    result: input.result ?? "success",
    details: input.details ?? {},
  });
  if (error) throw error;
}

export async function loadOrganizations(includeDeleted = false) {
  const admin = createAdminClient();
  const [{ data: workspaces, error: workspaceError }, { data: profiles, error: profileError }] = await Promise.all([
    admin.from("workspaces").select("id,name,owner_id,created_at,updated_at").order("created_at", { ascending: false }),
    admin.from("organization_admin_profiles").select("workspace_id,primary_email,status,activation_status,onboarding_status,onboarding_progress,invitation_status,last_activity_at,archived_at,deleted_at,created_at,updated_at"),
  ]);
  if (workspaceError) throw workspaceError;
  if (profileError) throw profileError;
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.workspace_id, profile]));
  return (workspaces ?? []).flatMap((workspace) => {
    const profile = profileMap.get(workspace.id);
    if (!profile || (!includeDeleted && profile.status === "deleted")) return [];
    return [{ ...workspace, ...profile }];
  });
}

export function publicOrganization(row: Awaited<ReturnType<typeof loadOrganizations>>[number]) {
  return {
    id: row.id,
    name: row.name,
    primaryEmail: row.primary_email,
    status: row.status,
    activationStatus: row.activation_status,
    onboardingStatus: row.onboarding_status,
    onboardingProgress: row.onboarding_progress,
    invitationStatus: row.invitation_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastActivityAt: row.last_activity_at,
    archivedAt: row.archived_at,
  };
}
