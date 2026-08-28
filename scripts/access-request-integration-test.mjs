import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const baseUrl = process.env.ACCESS_REQUEST_TEST_BASE_URL || "http://127.0.0.1:3103";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert(supabaseUrl && publishableKey && serviceKey, "Supabase environment is required");

const service = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const suffix = randomUUID().slice(0, 8);
const password = `Nc!${randomUUID()}9a`;
const pendingEmail = `normcore-request-pending-${suffix}@example.com`;
const rejectedEmail = `normcore-request-rejected-${suffix}@example.com`;
const legacyEmail = `normcore-request-legacy-${suffix}@example.com`;
const adminEmail = `normcore-request-admin-${suffix}@example.com`;
const createdUserIds = [];
const requesterEmails = [pendingEmail, rejectedEmail];
let adminUserId = "";
let approvalEmailSent = false;
const results = [];

async function jsonFetch(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { "Content-Type": "application/json", ...(init.headers || {}) }, redirect: init.redirect ?? "follow" });
  return { response, body: await response.json().catch(() => ({})) };
}
async function tokenSession(email) {
  const client = createClient(supabaseUrl, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const result = await client.auth.signInWithPassword({ email, password });
  if (result.error || !result.data.session) throw result.error ?? new Error("Session missing");
  return result.data.session;
}
async function api(path, token, init = {}) {
  return jsonFetch(path, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) } });
}
function sessionCookie(session) {
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const value = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  return `sb-${projectRef}-auth-token=${value}`;
}
function pass(label) { results.push(`${label}: PASS`); }

try {
  const adminCreated = await service.auth.admin.createUser({ email: adminEmail, password, email_confirm: true, user_metadata: { full_name: "Access Request Test Admin" } });
  if (adminCreated.error || !adminCreated.data.user) throw adminCreated.error ?? new Error("Admin creation failed");
  adminUserId = adminCreated.data.user.id; createdUserIds.push(adminUserId);
  const role = await service.from("platform_admins").insert({ user_id: adminUserId, role: "super_admin", active: true });
  if (role.error) throw role.error;
  const adminToken = (await tokenSession(adminEmail)).access_token;

  let result = await jsonFetch("/api/auth/signup", { method: "POST", body: JSON.stringify({ name: "Pending Request User", email: pendingEmail, password, language: "en" }) });
  assert.equal(result.response.status, 201, JSON.stringify(result.body));
  assert.equal(result.body.status, "pending");
  const pendingRequestId = result.body.requestId;
  const { data: pendingRequest } = await service.from("access_requests").select("auth_user_id,status").eq("id", pendingRequestId).single();
  assert.equal(pendingRequest.status, "pending"); createdUserIds.push(pendingRequest.auth_user_id); pass("Request creation");

  const pendingSession = await tokenSession(pendingEmail);
  result = await api("/api/auth/current", pendingSession.access_token);
  assert.equal(result.response.status, 403); assert.equal(result.body.accessStatus, "pending"); pass("Pending blocked");

  for (const path of ["/dashboard", "/onboarding"]) {
    const response = await fetch(`${baseUrl}${path}`, { headers: { Cookie: sessionCookie(pendingSession) }, redirect: "manual" });
    assert.equal(response.status, 307);
    assert.match(response.headers.get("location") ?? "", /access-status\?status=pending/);
  }
  result = await api("/api/workspaces/progress", pendingSession.access_token, { method: "POST", body: JSON.stringify({ workspaceId: randomUUID(), currentScreen: 1 }), redirect: "manual" });
  assert([401, 403].includes(result.response.status), `Expected protected API denial, received ${result.response.status}`); pass("Direct route protection");

  result = await api("/api/super-admin/access-requests?status=pending&limit=100", adminToken);
  assert.equal(result.response.status, 200); assert(result.body.pendingCount >= 1); assert(result.body.items.some((item) => item.id === pendingRequestId)); pass("Notification badge");

  result = await api(`/api/super-admin/access-requests/${pendingRequestId}`, adminToken, { method: "PATCH", body: JSON.stringify({ action: "approve" }) });
  assert.equal(result.response.status, 200, JSON.stringify(result.body)); assert.equal(result.body.status, "approved"); approvalEmailSent = result.body.emailSent === true; pass("Approve");
  const { data: approvedAudit } = await service.from("admin_activity_log").select("id").eq("action", "access_request_approved").contains("details", { accessRequestId: pendingRequestId }).maybeSingle();
  assert(approvedAudit); pass("Approval audit log");

  result = await api("/api/auth/current", pendingSession.access_token);
  assert.equal(result.response.status, 200, JSON.stringify(result.body)); assert.equal(result.body.destination, "/onboarding");
  const { count: approvedWorkspaceCount } = await service.from("workspaces").select("id", { count: "exact", head: true }).eq("owner_id", pendingRequest.auth_user_id);
  assert.equal(approvedWorkspaceCount, 0); pass("Approved login → onboarding");

  result = await jsonFetch("/api/auth/signup", { method: "POST", body: JSON.stringify({ name: "Rejected Request User", email: rejectedEmail, password, language: "en" }) });
  assert.equal(result.response.status, 201); const rejectedRequestId = result.body.requestId;
  const { data: rejectedRequest } = await service.from("access_requests").select("auth_user_id").eq("id", rejectedRequestId).single(); createdUserIds.push(rejectedRequest.auth_user_id);
  result = await api(`/api/super-admin/access-requests/${rejectedRequestId}`, adminToken, { method: "PATCH", body: JSON.stringify({ action: "reject" }) });
  assert.equal(result.response.status, 200); assert.equal(result.body.status, "rejected");
  const rejectedSession = await tokenSession(rejectedEmail);
  result = await api("/api/auth/current", rejectedSession.access_token); assert.equal(result.response.status, 403); assert.equal(result.body.accessStatus, "rejected"); pass("Reject");

  const legacyCreated = await service.auth.admin.createUser({ email: legacyEmail, password, email_confirm: true, user_metadata: { normcore_onboarding: { completed: false, current_screen: 0 } } });
  if (legacyCreated.error || !legacyCreated.data.user) throw legacyCreated.error ?? new Error("Legacy user creation failed");
  createdUserIds.push(legacyCreated.data.user.id);
  const legacyToken = (await tokenSession(legacyEmail)).access_token;
  result = await api("/api/auth/current", legacyToken); assert.equal(result.response.status, 200); assert.equal(result.body.destination, "/onboarding"); pass("Existing organization flow unchanged");

  result = await api("/api/auth/current", adminToken); assert.equal(result.response.status, 200); assert.equal(result.body.destination, "/super-admin/dashboard"); pass("Super Admin flow unchanged");
  console.log(results.join("\n"));
  console.log(`Approval email: ${approvalEmailSent ? "PASS" : "FAIL (email provider not configured or delivery rejected)"}`);
} finally {
  for (const email of requesterEmails) await service.from("admin_activity_log").delete().contains("details", { requesterEmail: email });
  if (adminUserId) await service.from("admin_activity_log").delete().eq("admin_user_id", adminUserId);
  if (adminUserId) await service.from("platform_admins").delete().eq("user_id", adminUserId);
  for (const userId of [...new Set(createdUserIds)].reverse()) await service.auth.admin.deleteUser(userId);
}
