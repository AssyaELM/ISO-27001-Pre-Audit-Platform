import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { test, expect } from "@playwright/test";

const root = process.cwd();
const envFiles = [path.join(root, ".env.local"), path.join(root, ".env.assessment-test.local")];
const localEnvFile = path.join(root, ".env.assessment-test.local");

function loadEnvFromFiles() {
  for (const file of envFiles) {
    if (!existsSync(file)) continue;
    const raw = readFileSync(file, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const equals = trimmed.indexOf("=");
      if (equals === -1) continue;
      const key = trimmed.slice(0, equals).trim();
      const value = trimmed.slice(equals + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = value.replace(/^['"]|['"]$/g, "");
      }
    }
  }
}

function assertEnvLoaded() {
  loadEnvFromFiles();
  if (!existsSync(localEnvFile)) {
    throw new Error(
      "Missing .env.assessment-test.local: required for explicit test credentials and workspace settings.",
    );
  }
}

async function assertAppReachable(baseUrl) {
  const response = await fetch(baseUrl);
  if (!response || response.status >= 500) {
    throw new Error(`App base URL not reachable: ${baseUrl} (HTTP ${response?.status ?? "offline"})`);
  }
}

function makeQuestionId(scope) {
  return `rls_test_${scope}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

async function loginPage(page, baseUrl, email, password) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  const submit = page.locator('button[type="submit"]');
  await submit.click();
  await page.waitForLoadState("networkidle");

  const targetPath = new URL(page.url()).pathname;
  if (targetPath.includes("/login")) {
    throw new Error(`Login failed for ${email}`);
  }

  await page.waitForTimeout(500);
  return { authenticatedPath: new URL(page.url()).pathname };
}

async function callAssessmentApi(page, baseUrl, method, payload) {
  const workspaceId = payload?.workspaceId;
  const endpoint =
    method === "GET" && workspaceId
      ? `${baseUrl}/api/assessment/responses?workspaceId=${encodeURIComponent(workspaceId)}`
      : `${baseUrl}/api/assessment/responses`;

  const res = await page.evaluate(
    async ({ endpoint, method, payload }) => {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "content-type": "application/json",
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });

      const text = await response.text();
      let body = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
      return { status: response.status, body };
    },
    { endpoint, method, payload },
  );

  return res;
}

function isCrossWorkspaceReadAllowed(status, body) {
  if (status === 401 || status === 403) return true;
  if (status !== 200) return false;
  return Array.isArray(body?.responses) && body.responses.length === 0;
}

async function resolveWorkspaceForUser(client, emailLabel) {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    throw new Error(`Could not resolve identity for ${emailLabel}`);
  }

  const { data, error } = await client
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`workspaces lookup failed for ${emailLabel}: ${error.message}`);
  }

  if (data && data.length > 0) return data[0].id;
  return null;
}

async function signInAndCreateClient(email, password, supabaseUrl, publishableKey) {
  const client = createClient(supabaseUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data?.session || !data.user) {
    throw new Error(`Authentication failed for ${email}: ${error?.message ?? "no session"}`);
  }

  return { client, userId: data.user.id };
}

async function cleanupByIds(client, ids) {
  if (!ids.length) return;
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  if (!uniqueIds.length) return;

  const { data: rows, error: selectError } = await client
    .from("assessment_responses")
    .select("id,question_id")
    .in("id", uniqueIds);

  if (selectError) return;

  const safeIds = (rows ?? [])
    .filter((row) => typeof row.question_id === "string" && row.question_id.startsWith("rls_test_"))
    .map((row) => row.id);

  if (!safeIds.length) return;
  await client.from("assessment_responses").delete().in("id", safeIds);
}

test("Assessment API RLS with browser sessions and cookie auth", async ({ browser }) => {
  assertEnvLoaded();

  const {
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    TEST_USER_A_EMAIL,
    TEST_USER_A_PASSWORD,
    TEST_USER_B_EMAIL,
    TEST_USER_B_PASSWORD,
    TEST_WORKSPACE_A_ID,
    TEST_WORKSPACE_B_ID,
    TEST_APP_BASE_URL = "http://127.0.0.1:3103",
  } = process.env;

  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "TEST_USER_A_EMAIL",
    "TEST_USER_A_PASSWORD",
    "TEST_USER_B_EMAIL",
    "TEST_USER_B_PASSWORD",
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing environment variable ${key}`);
    }
  }

  await assertAppReachable(TEST_APP_BASE_URL);

  const browserContextA = await browser.newContext({
    baseURL: TEST_APP_BASE_URL,
  });
  const browserContextB = await browser.newContext({
    baseURL: TEST_APP_BASE_URL,
  });
  const pageA = await browserContextA.newPage();
  const pageB = await browserContextB.newPage();

  const createdByA = [];
  const createdByB = [];

  const supabaseA = await signInAndCreateClient(
    TEST_USER_A_EMAIL,
    TEST_USER_A_PASSWORD,
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const supabaseB = await signInAndCreateClient(
    TEST_USER_B_EMAIL,
    TEST_USER_B_PASSWORD,
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  let workspaceA = await resolveWorkspaceForUser(supabaseA.client, "User A");
  let workspaceB = await resolveWorkspaceForUser(supabaseB.client, "User B");

  if (!workspaceA && TEST_WORKSPACE_A_ID) workspaceA = TEST_WORKSPACE_A_ID;
  if (!workspaceB && TEST_WORKSPACE_B_ID) workspaceB = TEST_WORKSPACE_B_ID;

  if (!workspaceA || !workspaceB) {
    throw new Error("Could not resolve workspaces automatically and fallback workspace ids are missing.");
  }

  if (workspaceA === workspaceB) {
    throw new Error("Workspace A and B are identical; need two distinct workspaces for cross-tenant checks.");
  }

  await loginPage(pageA, TEST_APP_BASE_URL, TEST_USER_A_EMAIL, TEST_USER_A_PASSWORD);
  await loginPage(pageB, TEST_APP_BASE_URL, TEST_USER_B_EMAIL, TEST_USER_B_PASSWORD);

  const qA = makeQuestionId("a");
  const qAInvalid = makeQuestionId("invalid");
  const qANa = makeQuestionId("na");
  const qAValid = makeQuestionId("naok");
  const qBBaseline = makeQuestionId("b");

  const expectScenario = (label, ok, detail = "") => {
    console.log(`${ok ? "PASS" : "FAIL"} ${label}${detail ? ` - ${detail}` : ""}`);
    expect(ok).toBeTruthy();
  };

  const readAWorkspaceA = await callAssessmentApi(pageA, TEST_APP_BASE_URL, "GET", { workspaceId: workspaceA });
  expectScenario("API GET workspace A by A returns 200", readAWorkspaceA.status === 200);

  const postInvalid = await callAssessmentApi(pageA, TEST_APP_BASE_URL, "POST", {
    workspaceId: workspaceA,
    theme: "people",
    controlId: "6.1",
    questionId: qAInvalid,
    answer: "almost_ok",
  });
  expectScenario("API POST invalid answer rejected", postInvalid.status === 400);

  const postNaNoJust = await callAssessmentApi(pageA, TEST_APP_BASE_URL, "POST", {
    workspaceId: workspaceA,
    theme: "people",
    controlId: "6.2",
    questionId: qANa,
    answer: "not_applicable",
    justification: "",
  });
  expectScenario("API POST not_applicable without justification rejected", postNaNoJust.status === 400);

  const postNaOk = await callAssessmentApi(pageA, TEST_APP_BASE_URL, "POST", {
    workspaceId: workspaceA,
    theme: "people",
    controlId: "6.2",
    questionId: qAValid,
    answer: "not_applicable",
    justification: "Not in scope for test workspace.",
  });
  expectScenario("API POST not_applicable with justification accepted", postNaOk.status === 200);
  if (postNaOk.body?.id) {
    createdByA.push(postNaOk.body.id);
  }

  const postA = await callAssessmentApi(pageA, TEST_APP_BASE_URL, "POST", {
    workspaceId: workspaceA,
    theme: "people",
    controlId: "6.1",
    questionId: qA,
    answer: "implemented",
  });
  expectScenario("API POST owner A in workspace A accepted", postA.status === 200);
  const aResponseId = postA.body?.id;
  if (aResponseId) {
    createdByA.push(aResponseId);
  }

  const patchSubmitted = await callAssessmentApi(pageA, TEST_APP_BASE_URL, "PATCH", {
    responseId: aResponseId,
    reviewStatus: "submitted",
  });
  expectScenario("API PATCH owner A draft->submitted", patchSubmitted.status === 200);

  const patchValidated = await callAssessmentApi(pageA, TEST_APP_BASE_URL, "PATCH", {
    responseId: aResponseId,
    reviewStatus: "validated",
  });
  expectScenario("API PATCH owner A submitted->validated", patchValidated.status === 200);

  const crossGetAFromB = await callAssessmentApi(pageA, TEST_APP_BASE_URL, "GET", { workspaceId: workspaceB });
  const crossReadAllowed = isCrossWorkspaceReadAllowed(crossGetAFromB.status, crossGetAFromB.body);
  expectScenario("API GET workspace B from A blocked (empty or 401/403)", crossReadAllowed);

  const crossPostAtoB = await callAssessmentApi(pageA, TEST_APP_BASE_URL, "POST", {
    workspaceId: workspaceB,
    theme: "people",
    controlId: "6.8",
    questionId: makeQuestionId("crossAtoB"),
    answer: "implemented",
  });
  const crossPostBlocked = [400, 401, 403].includes(crossPostAtoB.status);
  expectScenario("API POST workspace B from A blocked", crossPostBlocked);

  const readBWorkspaceB = await callAssessmentApi(pageB, TEST_APP_BASE_URL, "GET", { workspaceId: workspaceB });
  expectScenario("API GET workspace B by B returns 200", readBWorkspaceB.status === 200);

  const postB = await callAssessmentApi(pageB, TEST_APP_BASE_URL, "POST", {
    workspaceId: workspaceB,
    theme: "people",
    controlId: "6.1",
    questionId: qBBaseline,
    answer: "implemented",
  });
  expectScenario("API POST owner B in workspace B accepted", postB.status === 200);
  if (postB.body?.id) {
    createdByB.push(postB.body.id);
  }

  const crossGetBFromA = await callAssessmentApi(pageB, TEST_APP_BASE_URL, "GET", { workspaceId: workspaceA });
  const crossReadAallowed = isCrossWorkspaceReadAllowed(crossGetBFromA.status, crossGetBFromA.body);
  expectScenario("API GET workspace A from B blocked (empty or 401/403)", crossReadAallowed);

  const crossPostBtoA = await callAssessmentApi(pageB, TEST_APP_BASE_URL, "POST", {
    workspaceId: workspaceA,
    theme: "people",
    controlId: "6.8",
    questionId: makeQuestionId("crossBtoA"),
    answer: "implemented",
  });
  expectScenario("API POST workspace A from B blocked", [400, 401, 403].includes(crossPostBtoA.status));

  const patchByB = await callAssessmentApi(pageB, TEST_APP_BASE_URL, "PATCH", {
    responseId: aResponseId,
    reviewStatus: "rejected",
  });
  expectScenario("API PATCH A response by B blocked", [400, 401, 403].includes(patchByB.status));

  await browserContextA.close();
  await browserContextB.close();

  await cleanupByIds(supabaseA.client, createdByA);
  await cleanupByIds(supabaseB.client, createdByB);
  await supabaseA.client.auth.signOut();
  await supabaseB.client.auth.signOut();
});
