import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

for (const filename of [".env.local", ".env.assessment-test.local"]) {
  const file = path.join(process.cwd(), filename);
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    if (process.env[key] === undefined) process.env[key] = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
  }
}

test("Assessment answers select immediately and preserve required N/A persistence", async ({ page, baseURL }) => {
  const email = process.env.TEST_USER_A_EMAIL;
  const password = process.env.TEST_USER_A_PASSWORD;
  test.skip(!email || !password, "Assessment test credentials are required.");

  await page.addInitScript(() => localStorage.setItem("normcore-language", "en"));
  const login = await page.request.post(`${baseURL}/api/auth/login`, { data: { email, password } });
  expect(login.ok()).toBe(true);
  await page.goto(`${baseURL}/assessment/technological/a8-1`, { waitUntil: "domcontentloaded" });

  const notApplicable = page.getByRole("button", { name: "Not applicable", exact: true }).first();
  await expect(notApplicable).toBeEnabled();
  const question = page.locator("article").filter({ has: notApplicable }).first();
  const implemented = question.getByRole("button", { name: "Implemented", exact: true });
  const partiallyImplemented = question.getByRole("button", { name: "Partially implemented", exact: true });
  const notImplemented = question.getByRole("button", { name: "Not implemented", exact: true });
  const notSure = question.getByRole("button", { name: "Not sure", exact: true });
  const justificationLabel = question.getByText("Required justification for Not applicable", { exact: true });

  await implemented.click();
  await expect(implemented).toHaveClass(/answerSelected/);
  await notApplicable.click();
  await expect(notApplicable).toHaveClass(/answerSelected/);
  await expect(justificationLabel).toBeVisible();

  await notImplemented.click();
  await expect(notImplemented).toHaveClass(/answerSelected/);
  await expect(justificationLabel).toBeHidden();

  for (const choice of [implemented, partiallyImplemented, notImplemented, notSure, notApplicable]) {
    const startedAt = Date.now();
    await choice.click();
    await expect(choice).toHaveClass(/answerSelected/);
    expect(Date.now() - startedAt).toBeLessThan(750);
  }
  await expect(justificationLabel).toBeVisible();

  const saveJustification = question.getByRole("button", { name: "Save justification", exact: true });
  await expect(saveJustification).toBeDisabled();

  const justification = `Automated N/A interaction QA ${Date.now()}`;
  await question.locator("textarea").fill(justification);
  await expect(saveJustification).toBeEnabled();
  const saved = page.waitForResponse((response) => {
    if (!response.url().includes("/api/assessment/responses") || response.request().method() !== "POST") return false;
    try {
      const payload = response.request().postDataJSON();
      return payload.answer === "not_applicable" && payload.justification === justification;
    } catch {
      return false;
    }
  });
  await saveJustification.click();
  expect((await saved).ok()).toBe(true);

  await page.reload({ waitUntil: "domcontentloaded" });
  const persistedNotApplicable = page.getByRole("button", { name: "Not applicable", exact: true }).first();
  await expect(persistedNotApplicable).toHaveClass(/answerSelected/);
  await expect(page.getByText("Required justification for Not applicable", { exact: true }).first()).toBeVisible();
});
