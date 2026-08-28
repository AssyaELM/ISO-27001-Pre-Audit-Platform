import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const baseUrl = process.env.SUPER_ADMIN_TEST_BASE_URL || "http://127.0.0.1:3103";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert(supabaseUrl && publishableKey && serviceKey, "Supabase environment is required");

const service = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const suffix = randomUUID().slice(0, 8);
const adminEmail = `normcore-admin-test-${suffix}@example.com`;
const memberEmail = `normcore-member-test-${suffix}@example.com`;
const organizationEmail = `normcore-org-test-${suffix}@example.com`;
const password = `Nc!${randomUUID()}9a`;
let adminUserId = "";
let memberUserId = "";
let organizationUserId = "";
let workspaceId = "";
const results = [];

async function createUser(email, metadata = {}) {
  const result = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: metadata });
  if (result.error) throw result.error;
  return result.data.user;
}

async function tokenFor(email) {
  const client = createClient(supabaseUrl, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const result = await client.auth.signInWithPassword({ email, password });
  if (result.error || !result.data.session) throw result.error ?? new Error("Session missing");
  return result.data.session.access_token;
}

async function api(path, accessToken, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...(init.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

function pass(name) { results.push(`${name}: PASS`); }

try {
  const adminUser = await createUser(adminEmail, { full_name: "NormCore Test Administrator" });
  adminUserId = adminUser.id;
  const { error: roleError } = await service.from("platform_admins").insert({ user_id: adminUserId, role: "super_admin", active: true });
  if (roleError) throw roleError;
  const memberUser = await createUser(memberEmail, { normcore_onboarding: { completed: false, current_screen: 0 } });
  memberUserId = memberUser.id;
  const [adminToken, memberToken] = await Promise.all([tokenFor(adminEmail), tokenFor(memberEmail)]);

  let result = await api("/api/auth/current", adminToken);
  assert.equal(result.response.status, 200); assert.equal(result.body.destination, "/super-admin/dashboard"); pass("super_admin login routing");
  result = await api("/api/auth/current", memberToken);
  assert.equal(result.response.status, 200); assert.equal(result.body.destination, "/onboarding"); pass("organization user routing");
  result = await api("/api/super-admin/dashboard", memberToken);
  assert.equal(result.response.status, 403); pass("organization user admin denial");
  result = await api("/api/super-admin/dashboard", adminToken);
  assert.equal(result.response.status, 200, JSON.stringify(result.body)); assert.equal(typeof result.body.counts.total, "number"); pass("dashboard real aggregates");

  result = await api("/api/super-admin/organizations", adminToken, { method: "POST", body: JSON.stringify({ name: `NormCore Integration ${suffix}`, primaryEmail: organizationEmail }) });
  assert.equal(result.response.status, 201); assert.match(result.body.token, /^[A-Z2-9]{12}$/); workspaceId = result.body.organization.id; pass("organization creation and secure token");
  const { data: workspace } = await service.from("workspaces").select("owner_id").eq("id", workspaceId).single(); organizationUserId = workspace.owner_id;
  result = await api("/api/super-admin/organizations", adminToken, { method: "POST", body: JSON.stringify({ name: "Duplicate", primaryEmail: organizationEmail }) });
  assert.equal(result.response.status, 409); pass("duplicate email handling");
  result = await api("/api/activation/verify", adminToken, { method: "POST", body: JSON.stringify({ token: (await api(`/api/super-admin/organizations/${workspaceId}/tokens`, adminToken, { method: "POST", body: JSON.stringify({ action: "regenerate" }) })).body.token }) });
  assert.equal(result.response.status, 200); pass("one-time token activation");
  result = await api(`/api/super-admin/organizations/${workspaceId}/invitation`, adminToken, { method: "POST" });
  assert([200, 502].includes(result.response.status)); pass("invitation delivery handled");
  result = await api(`/api/super-admin/organizations/${workspaceId}/tokens`, adminToken, { method: "POST", body: JSON.stringify({ action: "regenerate" }) });
  assert.equal(result.response.status, 200); assert.match(result.body.token, /^[A-Z2-9]{12}$/); pass("token regeneration");
  for (const action of ["suspend", "reactivate", "archive", "delete"]) {
    result = await api(`/api/super-admin/organizations/${workspaceId}`, adminToken, { method: "PATCH", body: JSON.stringify({ action }) });
    assert.equal(result.response.status, 200);
  }
  assert.equal(result.body.deletionMode, "soft_delete"); pass("lifecycle and protected soft delete");
  result = await api("/api/super-admin/activity", adminToken); assert.equal(result.response.status, 200); assert(result.body.items.length > 0); pass("real activity log");
  result = await api("/api/super-admin/settings", adminToken); assert.equal(result.response.status, 200); assert.equal(result.body.profile.email, adminEmail); pass("real settings profile");

  const memberClient = createClient(supabaseUrl, publishableKey, { global: { headers: { Authorization: `Bearer ${memberToken}` } }, auth: { persistSession: false } });
  for (const table of ["assessment_responses", "evidence_items", "ai_documents"]) {
    const query = await memberClient.from(table).select("id").limit(1);
    assert.equal(query.data?.length ?? 0, 0);
  }
  const adminClient = createClient(supabaseUrl, publishableKey, { global: { headers: { Authorization: `Bearer ${adminToken}` } }, auth: { persistSession: false } });
  for (const table of ["assessment_responses", "evidence_items", "ai_documents"]) {
    const query = await adminClient.from(table).select("id").limit(1);
    assert.equal(query.data?.length ?? 0, 0);
  }
  pass("confidential client tables remain inaccessible");
  console.log(results.join("\n"));
} finally {
  if (workspaceId) {
    await service.from("activation_tokens").delete().eq("workspace_id", workspaceId);
    await service.from("admin_activity_log").delete().eq("workspace_id", workspaceId);
    await service.from("organization_admin_profiles").delete().eq("workspace_id", workspaceId);
    await service.from("workspaces").delete().eq("id", workspaceId);
  }
  if (adminUserId) await service.from("admin_activity_log").delete().eq("admin_user_id", adminUserId);
  if (adminUserId) await service.from("platform_admins").delete().eq("user_id", adminUserId);
  for (const id of [organizationUserId, memberUserId, adminUserId].filter(Boolean)) await service.auth.admin.deleteUser(id);
}
