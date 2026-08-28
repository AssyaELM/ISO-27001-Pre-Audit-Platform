import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";

const baseUrl = process.env.ACCESS_REQUEST_TEST_BASE_URL || "http://127.0.0.1:3103";
const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const suffix = randomUUID().slice(0, 8);
const adminEmail = `normcore-request-visual-admin-${suffix}@example.com`;
const requesterEmail = `normcore-request-visual-user-${suffix}@example.com`;
const password = `Nc!${randomUUID()}9a`;
let adminId = "";
let requesterId = "";
let browser;

try {
  const created = await service.auth.admin.createUser({ email: adminEmail, password, email_confirm: true, user_metadata: { full_name: "Request Visual Admin" } });
  if (created.error || !created.data.user) throw created.error ?? new Error("Admin creation failed");
  adminId = created.data.user.id;
  const role = await service.from("platform_admins").insert({ user_id: adminId, role: "super_admin", active: true });
  if (role.error) throw role.error;
  const signup = await fetch(`${baseUrl}/api/auth/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Recent Access Request", email: requesterEmail, password, language: "en" }) });
  const signupBody = await signup.json();
  assert.equal(signup.status, 201, JSON.stringify(signupBody));
  requesterId = (await service.from("access_requests").select("auth_user_id").eq("id", signupBody.requestId).single()).data.auth_user_id;

  browser = await chromium.launch({ headless: true, executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(`${baseUrl}/login?next=/super-admin/dashboard`, { waitUntil: "networkidle" });
  await page.locator('input[name="email"]').fill(adminEmail);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/super-admin/dashboard", { timeout: 20_000 });
  const bell = page.getByRole("button", { name: /pending access requests/i });
  await bell.click();
  await page.getByText("Recent Access Request", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Approve" }).waitFor();
  await page.getByRole("button", { name: "Reject" }).waitFor();
  const output = path.resolve("qa/super-admin");
  await mkdir(output, { recursive: true });
  await page.screenshot({ path: path.join(output, "access-requests-notifications.png"), fullPage: false });
  console.log("Notification badge and review panel: PASS");
} finally {
  if (browser) await browser.close();
  await service.from("admin_activity_log").delete().contains("details", { requesterEmail });
  if (adminId) await service.from("admin_activity_log").delete().eq("admin_user_id", adminId);
  if (adminId) await service.from("platform_admins").delete().eq("user_id", adminId);
  if (requesterId) await service.auth.admin.deleteUser(requesterId);
  if (adminId) await service.auth.admin.deleteUser(adminId);
}
