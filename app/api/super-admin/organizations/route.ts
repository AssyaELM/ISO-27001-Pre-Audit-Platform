import { randomUUID } from "node:crypto";
import { requireSuperAdmin, superAdminErrorResponse } from "@/lib/super-admin/auth";
import { expiresInDays, generateActivationToken, hashActivationToken, loadOrganizations, publicOrganization, writeAdminActivity } from "@/lib/super-admin/data";
import { createAdminClient } from "@/lib/supabase/admin";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: Request) {
  try {
    await requireSuperAdmin();
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim().toLowerCase() ?? "";
    const status = url.searchParams.get("status")?.trim() ?? "";
    const activation = url.searchParams.get("activation")?.trim() ?? "";
    const onboarding = url.searchParams.get("onboarding")?.trim() ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize")) || 10));
    const all = await loadOrganizations();
    const filtered = all.filter((item) =>
      (!search || item.name.toLowerCase().includes(search) || item.primary_email.toLowerCase().includes(search))
      && (!status || item.status === status)
      && (!activation || item.activation_status === activation)
      && (!onboarding || item.onboarding_status === onboarding));
    const start = (page - 1) * pageSize;
    return Response.json({ items: filtered.slice(start, start + pageSize).map(publicOrganization), total: filtered.length, page, pageSize });
  } catch (cause) {
    return superAdminErrorResponse(cause);
  }
}

export async function POST(request: Request) {
  let createdUserId = "";
  let createdNewAuthUser = false;
  let workspaceId = "";
  try {
    const identity = await requireSuperAdmin();
    const body = await request.json() as { name?: string; primaryEmail?: string };
    const name = body.name?.trim() ?? "";
    const primaryEmail = body.primaryEmail?.trim().toLowerCase() ?? "";
    if (name.length < 2 || name.length > 160) return Response.json({ error: "Organization name must contain 2 to 160 characters." }, { status: 400 });
    if (!emailPattern.test(primaryEmail) || primaryEmail.length > 254) return Response.json({ error: "A valid primary email is required." }, { status: 400 });

    const admin = createAdminClient();
    const { data: duplicate, error: duplicateError } = await admin
      .from("organization_admin_profiles")
      .select("workspace_id")
      .eq("primary_email", primaryEmail)
      .neq("status", "deleted")
      .limit(1)
      .maybeSingle();
    if (duplicateError) throw duplicateError;
    if (duplicate) return Response.json({ error: "An active organization already uses this primary email." }, { status: 409 });

    const { data: deletedProfile, error: deletedProfileError } = await admin
      .from("organization_admin_profiles")
      .select("workspace_id")
      .eq("primary_email", primaryEmail)
      .eq("status", "deleted")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (deletedProfileError) throw deletedProfileError;

    let deletedOwnerId = "";
    if (deletedProfile) {
      const { data: deletedWorkspace, error: deletedWorkspaceError } = await admin
        .from("workspaces")
        .select("owner_id")
        .eq("id", deletedProfile.workspace_id)
        .maybeSingle();
      if (deletedWorkspaceError) throw deletedWorkspaceError;
      deletedOwnerId = deletedWorkspace?.owner_id ?? "";
    }

    const userResult = await admin.auth.admin.createUser({ email: primaryEmail, email_confirm: false, user_metadata: { normcore_provisioned: true } });
    if (userResult.error || !userResult.data.user) {
      if (!deletedOwnerId) {
        const duplicateEmail = userResult.error?.message.toLowerCase().includes("already") || userResult.error?.status === 422;
        return Response.json({ error: duplicateEmail ? "An account already exists for this primary email." : (userResult.error?.message ?? "Unable to prepare organization access.") }, { status: duplicateEmail ? 409 : 400 });
      }
      const deletedUserResult = await admin.auth.admin.getUserById(deletedOwnerId);
      if (deletedUserResult.error || !deletedUserResult.data.user || deletedUserResult.data.user.email?.toLowerCase() !== primaryEmail) {
        return Response.json({ error: "Unable to prepare organization access." }, { status: 400 });
      }
      createdUserId = deletedOwnerId;
    } else {
      createdUserId = userResult.data.user.id;
      createdNewAuthUser = true;
    }
    workspaceId = randomUUID();
    const { error: workspaceError } = await admin.from("workspaces").insert({ id: workspaceId, name, owner_id: createdUserId });
    if (workspaceError) throw workspaceError;
    const { error: profileError } = await admin.from("organization_admin_profiles").insert({
      workspace_id: workspaceId,
      primary_email: primaryEmail,
      status: "pending_activation",
      activation_status: "pending",
      onboarding_status: "not_started",
      onboarding_progress: 0,
      invitation_status: "pending",
      last_activity_at: new Date().toISOString(),
      created_by: identity.user.id,
    });
    if (profileError) throw profileError;

    const token = generateActivationToken();
    const { error: tokenError } = await admin.from("activation_tokens").insert({
      workspace_id: workspaceId,
      token_hash: hashActivationToken(token),
      token_preview: token.slice(-4),
      expires_at: expiresInDays(),
      created_by: identity.user.id,
    });
    if (tokenError) throw tokenError;
    await writeAdminActivity({ adminUserId: identity.user.id, workspaceId, action: "organization_created" });
    await writeAdminActivity({ adminUserId: identity.user.id, workspaceId, action: "activation_token_generated" });
    return Response.json({ organization: { id: workspaceId, name, primaryEmail }, token, tokenVisibleOnce: true }, { status: 201 });
  } catch (cause) {
    if (createdNewAuthUser && createdUserId) {
      const admin = createAdminClient();
      if (workspaceId) {
        await admin.from("activation_tokens").delete().eq("workspace_id", workspaceId);
        await admin.from("admin_activity_log").delete().eq("workspace_id", workspaceId);
        await admin.from("organization_admin_profiles").delete().eq("workspace_id", workspaceId);
        await admin.from("workspaces").delete().eq("id", workspaceId);
      }
      await admin.auth.admin.deleteUser(createdUserId);
    }
    return superAdminErrorResponse(cause);
  }
}
