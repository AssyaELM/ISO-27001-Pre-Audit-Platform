import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const baseUrl = process.env.SUPER_ADMIN_TEST_BASE_URL || "http://127.0.0.1:3103";
const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const suffix = randomUUID().slice(0, 8);
const email = `normcore-visual-admin-${suffix}@example.com`;
const password = `Nc!${randomUUID()}7a`;
let userId = "";
let browser;
try {
  const created = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "NormCore Visual QA", normcore_onboarding: { completed: true } } });
  if (created.error) throw created.error;
  userId = created.data.user.id;
  const role = await service.from("platform_admins").insert({ user_id: userId, role: "super_admin", active: true });
  if (role.error) throw role.error;
  const output = path.resolve("qa/super-admin");
  await mkdir(output, { recursive: true });
  browser = await chromium.launch({ headless: true, executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(`${baseUrl}/login?next=/super-admin/dashboard`, { waitUntil: "networkidle" });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 20000 });
  await page.goto(`${baseUrl}/super-admin/dashboard`, { waitUntil: "networkidle" });
  const routes = ["dashboard", "organizations", "organizations/new", "invitations", "activity", "settings"];
  for (const route of routes) {
    await page.goto(`${baseUrl}/super-admin/${route}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(output, `${route.replace("/", "-")}.png`), fullPage: true });
    console.log(`${route}: ${await page.locator("h1").first().textContent()}`);
  }
  await page.goto(`${baseUrl}/super-admin/organizations`, { waitUntil: "networkidle" });
  const firstDetail = page.locator('tbody a[href^="/super-admin/organizations/"]').first();
  if (await firstDetail.count()) {
    const detailHref = await firstDetail.getAttribute("href");
    if (detailHref) await page.goto(`${baseUrl}${detailHref}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(output, "organization-detail.png"), fullPage: true });
    console.log(`organization-detail: ${await page.locator("h1").first().textContent()}`);
  }
} finally {
  if (browser) await browser.close();
  if (userId) {
    await service.from("admin_activity_log").delete().eq("admin_user_id", userId);
    await service.from("platform_admins").delete().eq("user_id", userId);
    await service.auth.admin.deleteUser(userId);
  }
}
