import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const envFilesToLoad = [
  path.resolve(scriptDir, "../.env.local"),
  path.resolve(scriptDir, "../.env.assessment-test.local"),
];

async function loadEnvFromFiles() {
  for (const file of envFilesToLoad) {
    const raw = await readFile(file, "utf8").catch(() => "");
    if (!raw) continue;

    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const equals = trimmed.indexOf("=");
      if (equals === -1) continue;

      const key = trimmed.slice(0, equals).trim();
      const value = trimmed.slice(equals + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = value.replace(/^["']|["']$/g, "");
      }
    }
  }
}

await loadEnvFromFiles();

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

const routeSourcePath = path.resolve(scriptDir, "../app/api/assessment/responses/route.ts");
const baseUrl = TEST_APP_BASE_URL;

if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  console.error("FAIL: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  process.exit(1);
}

function record(name, ok, details = "") {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${details ? ` - ${details}` : ""}`);
}

function makeQuestionId(tag = "rls_test") {
  return `rls_test_${tag}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function createTestClient() {
  return createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

async function signInUser(label, email, password) {
  const client = createTestClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data?.session || !data.user) {
    throw new Error(`${label} sign-in failed: ${error?.message ?? "no session"}`);
  }
  return {
    client,
    userId: data.user.id,
    accessToken: data.session.access_token,
  };
}

async function detectRouteAuthMode() {
  const routeSource = await readFile(routeSourcePath, "utf8").catch(() => "");
  if (!routeSource) {
    return { mode: "unknown", reason: "route source unavailable" };
  }

  const hasExplicitBearerParsing =
    /Authorization|authorization|Bearer/i.test(routeSource) ||
    /headers\.get\(["']authorization["']\)/i.test(routeSource);

  const hasCookieServerClient =
    /createServerClient|cookies\(|client\.auth\.getUser/.test(routeSource);

  if (hasExplicitBearerParsing) return { mode: "bearer", reason: "Bearer parsing detected in route source" };
  if (hasCookieServerClient) return { mode: "cookie", reason: "createServerClient cookie-based auth detected" };
  return { mode: "unknown", reason: "No explicit auth strategy detected in route source" };
}

async function assertAppReachable() {
  const url = `${baseUrl}/`;
  const response = await fetch(url, { method: "GET" });
  if (!response.ok && response.status !== 307 && response.status !== 308) {
    throw new Error(`Application not reachable at ${baseUrl} (${response.status})`);
  }
  console.log(`PASS Application reachable at ${baseUrl} (${response.status})`);
}

async function callRoute(method, { accessToken, workspaceId = null, body = undefined }) {
  const apiBase = `${baseUrl}/api/assessment/responses`;
  const endpoint =
    workspaceId && method === "GET" ? `${apiBase}?workspaceId=${encodeURIComponent(workspaceId)}` : apiBase;

  const headers = { "content-type": "application/json" };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(endpoint, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  return { status: response.status, payload };
}

async function dbWorkspaceByOwner(client, userId) {
  const { data, error } = await client
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw new Error(`workspaces lookup failed: ${error.message}`);
  if (Array.isArray(data) && data.length > 0) return data[0].id;
  return null;
}

async function dbListRows(client, workspaceId, questionId = null) {
  let query = client.from("assessment_responses").select("*").eq("workspace_id", workspaceId);
  if (questionId) query = query.eq("question_id", questionId);
  const { data, error } = await query;
  return { data: data ?? [], error };
}

async function dbInsertRow(client, payload) {
  const { data, error } = await client
    .from("assessment_responses")
    .insert(payload)
    .select("id,workspace_id,question_id,review_status")
    .single();
  return { data, error };
}

async function dbUpsertByQuestion(client, payload) {
  const { data, error } = await client
    .from("assessment_responses")
    .upsert(payload, { onConflict: "workspace_id,question_id", ignoreDuplicates: false })
    .select("id,workspace_id,question_id,review_status")
    .single();
  return { data, error };
}

async function dbUpdateReview(client, responseId, reviewStatus) {
  const { data, error } = await client
    .from("assessment_responses")
    .update({ review_status: reviewStatus })
    .eq("id", responseId)
    .select("*")
    .single();
  return { data, error };
}

async function dbDeleteResponse(client, responseId, workspaceId) {
  const { data, error } = await client
    .from("assessment_responses")
    .delete()
    .eq("id", responseId)
    .eq("workspace_id", workspaceId)
    .select("id")
    .maybeSingle();
  return { data, error };
}

function isCrossWorkspaceReadAllowed(result) {
  if (result.error) return { ok: true, reason: `rejected (${result.error.message})` };
  return {
    ok: result.data.length === 0,
    reason: result.data.length === 0 ? "empty (OK per RLS)" : `rows=${result.data.length}`,
  };
}

function cleanupIds(ids) {
  return ids.filter(Boolean);
}

async function main() {
  if (!TEST_USER_A_EMAIL || !TEST_USER_A_PASSWORD || !TEST_USER_B_EMAIL || !TEST_USER_B_PASSWORD) {
    console.error(
      "FAIL: Missing TEST_USER_A_EMAIL, TEST_USER_A_PASSWORD, TEST_USER_B_EMAIL, TEST_USER_B_PASSWORD.",
    );
    process.exit(1);
  }

  await assertAppReachable();
  const apiAuth = await detectRouteAuthMode();
  console.log(`API auth detection: ${apiAuth.mode} (${apiAuth.reason})`);

  const sessionA = await signInUser("User A", TEST_USER_A_EMAIL, TEST_USER_A_PASSWORD);
  const sessionB = await signInUser("User B", TEST_USER_B_EMAIL, TEST_USER_B_PASSWORD);
  record("Authentication user A", true);
  record("Authentication user B", true);

  if (sessionA.userId === sessionB.userId) {
    record("Distinct users", false, "A and B resolve to same auth user id");
  } else {
    record("Distinct users", true);
  }

  let workspaceA = await dbWorkspaceByOwner(sessionA.client, sessionA.userId);
  let workspaceB = await dbWorkspaceByOwner(sessionB.client, sessionB.userId);

  if (!workspaceA && TEST_WORKSPACE_A_ID) workspaceA = TEST_WORKSPACE_A_ID;
  if (!workspaceB && TEST_WORKSPACE_B_ID) workspaceB = TEST_WORKSPACE_B_ID;

  if (!workspaceA || !workspaceB) {
    console.error(
      "FAIL: could not resolve both workspaces through workspaces.owner_id and fallback env ids were missing.",
    );
    process.exit(1);
  }

  const workspaceAResolved = TEST_WORKSPACE_A_ID ? workspaceA === TEST_WORKSPACE_A_ID : true;
  const workspaceBResolved = TEST_WORKSPACE_B_ID ? workspaceB === TEST_WORKSPACE_B_ID : true;
  record("Workspace resolution A", workspaceAResolved, `workspaceId=${workspaceA}`);
  record("Workspace resolution B", workspaceBResolved, `workspaceId=${workspaceB}`);

  const q = {
    qa: makeQuestionId("a"),
    qb: makeQuestionId("b"),
    qc: makeQuestionId("c"),
    qd: makeQuestionId("d"),
    qe: makeQuestionId("e"),
    qf: makeQuestionId("f"),
    qg: makeQuestionId("g"),
    dup: makeQuestionId("dup"),
    route: makeQuestionId("route"),
    wf: makeQuestionId("wf"),
    del: makeQuestionId("del"),
  };

  const createdByA = [];
  const createdByB = [];
  let apiCreatedId = null;

  try {
    const aWorkspaceRead = await dbListRows(sessionA.client, workspaceA);
    record("DB: User A can read workspace A", !aWorkspaceRead.error);

    const bWorkspaceRead = await dbListRows(sessionB.client, workspaceB);
    record("DB: User B can read workspace B", !bWorkspaceRead.error);

    const createA = await dbInsertRow(sessionA.client, {
      workspace_id: workspaceA,
      theme_id: "people",
      control_id: "6.1",
      question_id: q.qa,
      answer: "implemented",
      justification: null,
      comment: null,
      evidence_reference: null,
    });
    record("DB: User A can write workspace A", !createA.error, createA.error?.message);
    if (createA.data?.id) createdByA.push(createA.data.id);

    const createAinB = await dbInsertRow(sessionA.client, {
      workspace_id: workspaceB,
      theme_id: "people",
      control_id: "6.1",
      question_id: q.qb,
      answer: "implemented",
      justification: null,
      comment: null,
      evidence_reference: null,
    });
    record("DB: User A cannot write workspace B", Boolean(createAinB.error), createAinB.error?.message);

    const createBinA = await dbInsertRow(sessionB.client, {
      workspace_id: workspaceA,
      theme_id: "people",
      control_id: "6.2",
      question_id: q.qc,
      answer: "implemented",
      justification: null,
      comment: null,
      evidence_reference: null,
    });
    record("DB: User B cannot write workspace A", Boolean(createBinA.error), createBinA.error?.message);

    const createB = await dbInsertRow(sessionB.client, {
      workspace_id: workspaceB,
      theme_id: "people",
      control_id: "6.2",
      question_id: q.qd,
      answer: "implemented",
      justification: null,
      comment: null,
      evidence_reference: null,
    });
    record("DB: User B can write workspace B", !createB.error, createB.error?.message);
    if (createB.data?.id) createdByB.push(createB.data.id);

    const aReadB = await dbListRows(sessionA.client, workspaceB);
    const bReadA = await dbListRows(sessionB.client, workspaceA);
    const crossReadAResult = isCrossWorkspaceReadAllowed(aReadB);
    const crossReadBResult = isCrossWorkspaceReadAllowed(bReadA);
    record("DB: A cannot read workspace B (RLS)", crossReadAResult.ok, crossReadAResult.reason);
    record("DB: B cannot read workspace A (RLS)", crossReadBResult.ok, crossReadBResult.reason);

    const badNotApplicable = await dbInsertRow(sessionA.client, {
      workspace_id: workspaceA,
      theme_id: "people",
      control_id: "6.3",
      question_id: q.qe,
      answer: "not_applicable",
      justification: "",
      comment: null,
      evidence_reference: null,
    });
    record("DB: not_applicable without justification rejected", Boolean(badNotApplicable.error), badNotApplicable.error?.message);

    const goodNotApplicable = await dbInsertRow(sessionA.client, {
      workspace_id: workspaceA,
      theme_id: "people",
      control_id: "6.3",
      question_id: q.qf,
      answer: "not_applicable",
      justification: "Not in scope for this environment.",
      comment: null,
      evidence_reference: null,
    });
    record("DB: not_applicable with justification accepted", !goodNotApplicable.error, goodNotApplicable.error?.message);
    if (goodNotApplicable.data?.id) createdByA.push(goodNotApplicable.data.id);

    const badAnswer = await dbInsertRow(sessionA.client, {
      workspace_id: workspaceA,
      theme_id: "people",
      control_id: "6.4",
      question_id: q.qg,
      answer: "almost_ok",
      justification: null,
      comment: null,
      evidence_reference: null,
    });
    record("DB: invalid answer value rejected", Boolean(badAnswer.error), badAnswer.error?.message);

    const d0 = await dbUpsertByQuestion(sessionA.client, {
      workspace_id: workspaceA,
      question_id: q.dup,
      theme_id: "people",
      control_id: "6.5",
      answer: "implemented",
      justification: null,
      comment: null,
      evidence_reference: null,
    });
    record("DB: duplicate first upsert accepted", !d0.error, d0.error?.message);
    if (d0.data?.id) createdByA.push(d0.data.id);

    const d1 = await dbUpsertByQuestion(sessionA.client, {
      workspace_id: workspaceA,
      question_id: q.dup,
      theme_id: "people",
      control_id: "6.5",
      answer: "not_implemented",
      justification: null,
      comment: null,
      evidence_reference: null,
    });
    const dupAfter = await dbListRows(sessionA.client, workspaceA, q.dup);
    const duplicateHandled = !d1.error && dupAfter.error === null && dupAfter.data.length === 1;
    record("DB: duplicate workspace+question prevented or updated", duplicateHandled, `upsertStatus=${d1.error ? d1.error.message : "ok"}, rows=${dupAfter.data.length}`);

    const workflow = await dbUpsertByQuestion(sessionA.client, {
      workspace_id: workspaceA,
      question_id: q.wf,
      theme_id: "people",
      control_id: "6.6",
      answer: "implemented",
      justification: null,
      comment: null,
      evidence_reference: null,
    });
    record("DB: owner can create row for workflow test", !workflow.error && !!workflow.data?.id, workflow.error?.message);
    if (workflow.data?.id) {
      createdByA.push(workflow.data.id);
      const submitted = await dbUpdateReview(sessionA.client, workflow.data.id, "submitted");
      const validated = await dbUpdateReview(sessionA.client, workflow.data.id, "validated");
      record(
        "DB: owner can progress draft -> submitted -> validated",
        !submitted.error && submitted.data?.review_status === "submitted" && !validated.error && validated.data?.review_status === "validated",
        `submitted=${submitted.error ? submitted.error.message : "ok"}, validated=${validated.error ? validated.error.message : "ok"}`,
      );

      const blockedUpdate = await dbUpdateReview(sessionB.client, workflow.data.id, "rejected");
      record("DB: other user cannot validate/reject", Boolean(blockedUpdate.error), blockedUpdate.error?.message);
    }

    const deleteCandidate = await dbUpsertByQuestion(sessionA.client, {
      workspace_id: workspaceA,
      question_id: q.del,
      theme_id: "people",
      control_id: "6.7",
      answer: "implemented",
      justification: null,
      comment: null,
      evidence_reference: null,
    });
    if (deleteCandidate.data?.id) {
      createdByA.push(deleteCandidate.data.id);
      const blockedDelete = await dbDeleteResponse(sessionB.client, deleteCandidate.data.id, workspaceA);
      const remains = await dbListRows(sessionA.client, workspaceA, q.del);
      const deleteBlocked =
        Boolean(blockedDelete.error) || (remains.error ? true : remains.data.length === 1);
      record("DB: other user cannot delete", deleteBlocked, blockedDelete.error ? blockedDelete.error.message : `rows=${remains.error ? "n/a" : remains.data.length}`);
    } else {
      record("DB: other user cannot delete", false, deleteCandidate.error?.message ?? "candidate row not created");
    }

    if (apiAuth.mode === "bearer") {
      const apiPostInvalid = await callRoute("POST", {
        accessToken: sessionA.accessToken,
        body: {
          workspaceId: workspaceA,
          theme: "people",
          controlId: "6.8",
          questionId: q.route,
          answer: "invalid_value",
        },
      });
      record("API POST invalid answer rejected", apiPostInvalid.status === 400, `status=${apiPostInvalid.status}`);

      const apiPost = await callRoute("POST", {
        accessToken: sessionA.accessToken,
        body: {
          workspaceId: workspaceA,
          theme: "people",
          controlId: "6.8",
          questionId: q.route,
          answer: "implemented",
        },
      });
      apiCreatedId = apiPost.status === 200 ? apiPost.payload?.id : null;
      if (apiCreatedId) createdByA.push(apiCreatedId);
      record("API POST owner accepted", apiPost.status === 200, `status=${apiPost.status}`);

      const apiGetOwn = await callRoute("GET", { accessToken: sessionA.accessToken, workspaceId: workspaceA });
      record("API GET workspace A", apiGetOwn.status === 200, `status=${apiGetOwn.status}`);

      const apiGetCross = await callRoute("GET", { accessToken: sessionB.accessToken, workspaceId: workspaceA });
      record("API cross-workspace read denied", apiGetCross.status === 401 || apiGetCross.status === 403 || apiGetCross.payload?.responses?.length === 0, `status=${apiGetCross.status}`);

      const apiPatchByB = await callRoute("PATCH", {
        accessToken: sessionB.accessToken,
        body: { responseId: apiCreatedId, reviewStatus: "validated" },
      });
      const apiPatchByA = await callRoute("PATCH", {
        accessToken: sessionA.accessToken,
        body: { responseId: apiCreatedId, reviewStatus: "submitted" },
      });
      record("API PATCH by non-owner denied", apiPatchByB.status === 400 || apiPatchByB.status === 403 || apiPatchByB.status === 401, `status=${apiPatchByB.status}`);
      record("API PATCH owner allowed", apiPatchByA.status === 200, `status=${apiPatchByA.status}`);
    } else {
      console.log("BLOCKED: API auth mode is cookie-based; Node integration harness cannot provide browser cookie auth.");
      record("API GET /api/assessment/responses", false, "blocked (cookie auth required)");
      record("API POST /api/assessment/responses", false, "blocked (cookie auth required)");
      record("API PATCH /api/assessment/responses", false, "blocked (cookie auth required)");
    }
  } finally {
    const cleanup = async (client, ids) => {
      const cleanIds = cleanupIds(ids);
      if (!cleanIds.length) return;
      await client.from("assessment_responses").delete().in("id", cleanIds);
    };

    try {
      await cleanup(sessionA.client, createdByA);
      await cleanup(sessionB.client, createdByB);
    } finally {
      await sessionA.client.auth.signOut();
      await sessionB.client.auth.signOut();
    }
  }
}

await main();
