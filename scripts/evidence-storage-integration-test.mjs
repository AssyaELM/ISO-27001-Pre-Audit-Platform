import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { deriveGapAnalysis } from "../lib/assessment/gap-analysis.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const [filename, testOverrides] of [[".env.local", false], [".env.assessment-test.local", true]]) {
  const file = path.join(root, filename);
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && (testOverrides || process.env[match[1].trim()] === undefined)) process.env[match[1].trim()] = match[2].trim();
  }
}

const env = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  service: process.env.SUPABASE_SERVICE_ROLE_KEY,
  emailA: process.env.TEST_USER_A_EMAIL,
  passwordA: process.env.TEST_USER_A_PASSWORD,
  emailB: process.env.TEST_USER_B_EMAIL,
  passwordB: process.env.TEST_USER_B_PASSWORD,
  workspaceA: process.env.TEST_WORKSPACE_A_ID,
  workspaceB: process.env.TEST_WORKSPACE_B_ID,
  app: process.env.TEST_APP_BASE_URL ?? "http://127.0.0.1:3103",
};

if (Object.values(env).some((value) => !value)) {
  console.log("NOT VERIFIED — test environment unavailable (Supabase, two test users, workspaces and app URL are required).");
  process.exit(0);
}

try {
  await fetch(`${env.app}/api/evidence?workspaceId=${encodeURIComponent(env.workspaceA)}`, { signal: AbortSignal.timeout(5000) });
} catch {
  console.log("NOT VERIFIED — test environment unavailable (the NormCore test server is not reachable).");
  process.exit(0);
}

async function session(email, password) {
  const response = await fetch(`${env.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: env.key, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data.access_token !== "string") {
    throw new Error(typeof data.error_description === "string" ? data.error_description : "Password grant failed");
  }
  const client = createClient(env.url, env.key, {
    global: { headers: { Authorization: `Bearer ${data.access_token}` } },
  });
  return { client, token: data.access_token, userId: data.user?.id };
}

async function api(token, pathname, options = {}) {
  const response = await fetch(`${env.app}${pathname}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

let a;
let b;
try {
  a = await session(env.emailA, env.passwordA);
} catch {
  console.log("NOT VERIFIED — test environment unavailable (test authentication could not be established).");
  process.exit(0);
}
try {
  b = await session(env.emailB, env.passwordB);
} catch {
  console.log("NOT VERIFIED - test environment unavailable (test user B authentication could not be established).");
  process.exit(0);
}
let evidenceId = "";

try {
  const answerPayload = { workspaceId: env.workspaceA, theme: "people", controlId: "a6-1", questionId: "p6_1_002", answer: "not_implemented" };
  const answer = await api(a.token, "/api/assessment/responses", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(answerPayload),
  });
  assert.equal(answer.response.status, 200, JSON.stringify(answer.body));
  const baselineAssessment = await api(a.token, `/api/assessment/responses?workspaceId=${env.workspaceA}`);
  const baselineResponse = baselineAssessment.body.responses.find((row) => row.questionId === "p6_1_002");
  assert.equal(baselineResponse.answer, "not_implemented");
  assert.equal(baselineResponse.hasCanonicalEvidence, false);
  const baselineGap = deriveGapAnalysis(baselineAssessment.body.responses).find((item) => item.questionId === "p6_1_002");
  assert.equal(baselineGap.status, "full_gap");
  assert.equal(baselineGap.evidenceStatus, "not_provided");

  const invalidMime = new FormData();
  invalidMime.set("workspaceId", env.workspaceA);
  invalidMime.set("themeId", "people");
  invalidMime.set("controlId", "a6-1");
  invalidMime.set("questionId", "p6_1_001");
  invalidMime.set("file", new File(["executable"], "bad.exe", { type: "application/octet-stream" }));
  assert.equal((await api(a.token, "/api/evidence", { method: "POST", body: invalidMime })).response.status, 400);

  const invalidQuestion = new FormData();
  invalidQuestion.set("workspaceId", env.workspaceA);
  invalidQuestion.set("themeId", "people");
  invalidQuestion.set("controlId", "a6-1");
  invalidQuestion.set("questionId", "invented_question");
  invalidQuestion.set("file", new File(["safe"], "safe.txt", { type: "text/plain" }));
  assert.equal((await api(a.token, "/api/evidence", { method: "POST", body: invalidQuestion })).response.status, 400);

  const invalidDate = new FormData();
  invalidDate.set("workspaceId", env.workspaceA);
  invalidDate.set("effectiveDate", "2026-02-30");
  invalidDate.set("file", new File(["safe"], "invalid-date.txt", { type: "text/plain" }));
  assert.equal((await api(a.token, "/api/evidence", { method: "POST", body: invalidDate })).response.status, 400);

  const reversedDates = new FormData();
  reversedDates.set("workspaceId", env.workspaceA);
  reversedDates.set("effectiveDate", "2026-08-10");
  reversedDates.set("reviewDate", "2026-08-09");
  reversedDates.set("file", new File(["safe"], "reversed-dates.txt", { type: "text/plain" }));
  assert.equal((await api(a.token, "/api/evidence", { method: "POST", body: reversedDates })).response.status, 400);

  const crossWorkspaceOwner = new FormData();
  crossWorkspaceOwner.set("workspaceId", env.workspaceA);
  crossWorkspaceOwner.set("documentOwnerId", b.userId);
  crossWorkspaceOwner.set("file", new File(["safe"], "cross-owner.txt", { type: "text/plain" }));
  assert.equal((await api(a.token, "/api/evidence", { method: "POST", body: crossWorkspaceOwner })).response.status, 400);

  const oversized = new FormData();
  oversized.set("workspaceId", env.workspaceA);
  oversized.set("themeId", "people");
  oversized.set("controlId", "a6-1");
  oversized.set("questionId", "p6_1_001");
  oversized.set("file", new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.txt", { type: "text/plain" }));
  assert.equal((await api(a.token, "/api/evidence", { method: "POST", body: oversized })).response.status, 400);

  const csvForm = new FormData();
  csvForm.set("workspaceId", env.workspaceA);
  csvForm.set("themeId", "people");
  csvForm.set("controlId", "a6-1");
  csvForm.set("questionId", "p6_1_003");
  csvForm.set("file", new File(["control,status\nA.6.1,provided\n"], "evidence.csv", { type: "text/csv" }));
  const csvUpload = await api(a.token, "/api/evidence", { method: "POST", body: csvForm });
  assert.equal(csvUpload.response.status, 201, JSON.stringify(csvUpload.body));
  assert.equal(csvUpload.body.evidence.mimeType, "text/csv");
  assert.equal(csvUpload.body.evidence.documentType, null);
  assert.equal(csvUpload.body.evidence.documentVersion, null);
  assert.equal(csvUpload.body.evidence.effectiveDate, null);
  assert.equal(csvUpload.body.evidence.reviewDate, null);
  assert.equal(csvUpload.body.evidence.documentOwnerId, null);
  assert.equal((await api(a.token, `/api/evidence/${csvUpload.body.evidence.id}?workspaceId=${env.workspaceA}`, { method: "DELETE" })).response.status, 200);

  const typedForm = new FormData();
  typedForm.set("workspaceId", env.workspaceA);
  typedForm.set("documentType", "information_security_policy");
  typedForm.set("file", new File(["typed evidence"], "typed.txt", { type: "text/plain" }));
  const typedUpload = await api(a.token, "/api/evidence", { method: "POST", body: typedForm });
  assert.equal(typedUpload.response.status, 201, JSON.stringify(typedUpload.body));
  assert.equal(typedUpload.body.evidence.documentType, "information_security_policy");
  const typedRefresh = await api(a.token, `/api/evidence?workspaceId=${env.workspaceA}`);
  assert.equal(typedRefresh.body.evidence.find((item) => item.id === typedUpload.body.evidence.id)?.documentType, "information_security_policy");
  assert.equal((await api(a.token, `/api/evidence/${typedUpload.body.evidence.id}?workspaceId=${env.workspaceA}`, { method: "DELETE" })).response.status, 200);

  const pdfBytes = new TextEncoder().encode("%PDF-1.7\nNormCore integration evidence");
  const form = new FormData();
  form.set("workspaceId", env.workspaceA);
  form.set("themeId", "people");
  form.set("controlId", "a6-1");
  form.set("questionId", "p6_1_001");
  form.set("documentType", "access_control_policy");
  form.set("documentVersion", "v2.1");
  form.set("effectiveDate", "2026-08-10");
  form.set("reviewDate", "2027-08-10");
  form.set("documentOwnerId", a.userId);
  form.set("file", new File([pdfBytes], "../policy.pdf", { type: "application/pdf" }));
  const upload = await api(a.token, "/api/evidence", { method: "POST", body: form });
  assert.equal(upload.response.status, 201, JSON.stringify(upload.body));
  evidenceId = upload.body.evidence.id;
  assert.equal(upload.body.evidence.mimeType, "application/pdf");
  assert.equal(upload.body.evidence.originalFilename, "policy.pdf");
  assert.equal(upload.body.evidence.sizeBytes, pdfBytes.byteLength);
  assert.equal(upload.body.evidence.documentType, "access_control_policy");
  assert.equal(upload.body.evidence.documentVersion, "v2.1");
  assert.equal(upload.body.evidence.effectiveDate, "2026-08-10");
  assert.equal(upload.body.evidence.reviewDate, "2027-08-10");
  assert.equal(upload.body.evidence.documentOwnerId, a.userId);
  assert.equal(upload.body.evidence.documentReviewState, "current");
  assert.match(upload.body.evidence.storagePath, new RegExp(`^${env.workspaceA}/${evidenceId}/`));
  assert.equal(upload.body.link.questionId, "p6_1_001");

  const patchedMetadata = await api(a.token, `/api/evidence/${evidenceId}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId: env.workspaceA, documentVersion: "v2.2" }),
  });
  assert.equal(patchedMetadata.response.status, 200, JSON.stringify(patchedMetadata.body));
  assert.equal(patchedMetadata.body.evidence.documentVersion, "v2.2");
  const restoredMetadata = await api(a.token, `/api/evidence/${evidenceId}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId: env.workspaceA, documentVersion: "v2.1" }),
  });
  assert.equal(restoredMetadata.response.status, 200, JSON.stringify(restoredMetadata.body));

  const directItem = await a.client.from("evidence_items").select("*").eq("id", evidenceId).single();
  assert.equal(directItem.error, null);
  assert.equal(directItem.data.workspace_id, env.workspaceA);
  assert.equal(directItem.data.storage_bucket, "evidence");
  assert.equal(directItem.data.document_type, "access_control_policy");
  assert.equal(directItem.data.document_owner_id, a.userId);
  const directLinks = await a.client.from("evidence_question_links").select("*").eq("evidence_id", evidenceId);
  assert.equal(directLinks.error, null);
  assert.equal(directLinks.data.length, 1);
  const storageAfterUpload = await a.client.storage.from("evidence").list(`${env.workspaceA}/${evidenceId}`);
  assert.equal(storageAfterUpload.error, null);
  assert.equal(storageAfterUpload.data.length, 1);

  const list = await api(a.token, `/api/evidence?workspaceId=${env.workspaceA}&questionId=p6_1_001`);
  assert.equal(list.response.status, 200);
  assert.ok(list.body.evidence.some((item) => item.id === evidenceId));
  assert.equal("signedUrl" in list.body.evidence.find((item) => item.id === evidenceId), false);

  const crossList = await api(b.token, `/api/evidence?workspaceId=${env.workspaceA}`);
  assert.equal(crossList.response.status, 403);
  const crossOwnList = await api(b.token, `/api/evidence?workspaceId=${env.workspaceB}`);
  assert.equal(crossOwnList.response.status, 200);
  assert.equal(crossOwnList.body.evidence.some((item) => item.id === evidenceId), false);
  const directCrossItems = await b.client.from("evidence_items").select("id").eq("workspace_id", env.workspaceA);
  assert.equal(directCrossItems.error, null);
  assert.equal(directCrossItems.data.length, 0);

  const link = await api(a.token, `/api/evidence/${evidenceId}/links`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId: env.workspaceA, themeId: "people", controlId: "a6-1", questionId: "p6_1_002" }),
  });
  assert.equal(link.response.status, 201, JSON.stringify(link.body));
  const metadataAfterLink = await a.client.from("evidence_items").select("document_type,document_version,effective_date,review_date,document_owner_id").eq("id", evidenceId).single();
  assert.deepEqual(metadataAfterLink.data, { document_type: "access_control_policy", document_version: "v2.1", effective_date: "2026-08-10", review_date: "2027-08-10", document_owner_id: a.userId });
  const duplicate = await api(a.token, `/api/evidence/${evidenceId}/links`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId: env.workspaceA, themeId: "people", controlId: "a6-1", questionId: "p6_1_002" }),
  });
  assert.equal(duplicate.response.status, 409);
  const storageAfterSecondLink = await a.client.storage.from("evidence").list(`${env.workspaceA}/${evidenceId}`);
  assert.equal(storageAfterSecondLink.data.length, 1);

  const crossLink = await api(b.token, `/api/evidence/${evidenceId}/links`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId: env.workspaceA, themeId: "people", controlId: "a6-1", questionId: "p6_1_003" }),
  });
  assert.equal(crossLink.response.status, 403);
  const crossReplaceForm = new FormData();
  crossReplaceForm.set("workspaceId", env.workspaceA);
  crossReplaceForm.set("file", new File(["cross"], "cross.txt", { type: "text/plain" }));
  assert.equal((await api(b.token, `/api/evidence/${evidenceId}/replace`, { method: "POST", body: crossReplaceForm })).response.status, 403);
  assert.equal((await api(b.token, `/api/evidence/${evidenceId}?workspaceId=${env.workspaceA}`, { method: "DELETE" })).response.status, 403);

  const crossDownload = await api(b.token, `/api/evidence/${evidenceId}/download?workspaceId=${env.workspaceA}`);
  assert.equal(crossDownload.response.status, 403);
  const download = await api(a.token, `/api/evidence/${evidenceId}/download?workspaceId=${env.workspaceA}`);
  assert.equal(download.response.status, 200);
  assert.match(download.body.signedUrl, /^https?:\/\//);
  assert.equal(download.body.expiresIn, 60);
  assert.match(download.body.signedUrl, /\/object\/sign\/evidence\//);
  const downloaded = await fetch(download.body.signedUrl);
  assert.equal(downloaded.status, 200);
  assert.deepEqual(new Uint8Array(await downloaded.arrayBuffer()), pdfBytes);

  const unlink = await api(a.token, `/api/evidence/${evidenceId}/links/${upload.body.link.id}?workspaceId=${env.workspaceA}`, { method: "DELETE" });
  assert.equal(unlink.response.status, 200);
  assert.equal(unlink.body.remainingLinks, 1);
  const stillDownloadable = await api(a.token, `/api/evidence/${evidenceId}/download?workspaceId=${env.workspaceA}`);
  assert.equal(stillDownloadable.response.status, 200);

  const assessment = await api(a.token, `/api/assessment/responses?workspaceId=${env.workspaceA}`);
  const linkedResponse = assessment.body.responses.find((row) => row.questionId === "p6_1_002");
  assert.equal(linkedResponse.answer, "not_implemented");
  assert.equal(linkedResponse.hasCanonicalEvidence, true);
  const gapWithEvidence = deriveGapAnalysis(assessment.body.responses).find((item) => item.questionId === "p6_1_002");
  assert.equal(gapWithEvidence.status, "full_gap");
  assert.equal(gapWithEvidence.evidenceStatus, "provided");
  const dashboardMetrics = await api(a.token, `/api/evidence?workspaceId=${env.workspaceA}`);
  assert.equal(dashboardMetrics.body.metrics.providedQuestionCount, 1);

  const remediation = await api(a.token, `/api/remediation/actions?workspaceId=${env.workspaceA}&locale=en`);
  assert.equal(remediation.response.status, 200, JSON.stringify(remediation.body));
  const action = remediation.body.actions.find((row) => row.questionId === "p6_1_002");
  assert.equal(action?.evidenceStatus, "provided");

  const replacement = new FormData();
  replacement.set("workspaceId", env.workspaceA);
  replacement.set("file", new File(["replacement evidence"], "replacement.txt", { type: "text/plain" }));
  const replaced = await api(a.token, `/api/evidence/${evidenceId}/replace`, { method: "POST", body: replacement });
  assert.equal(replaced.response.status, 200, JSON.stringify(replaced.body));
  assert.equal(replaced.body.evidence.mimeType, "text/plain");
  assert.equal(replaced.body.evidence.id, evidenceId);
  assert.equal(replaced.body.evidence.documentType, "access_control_policy");
  assert.equal(replaced.body.evidence.documentVersion, "v2.1");
  assert.equal(replaced.body.evidence.effectiveDate, "2026-08-10");
  assert.equal(replaced.body.evidence.reviewDate, "2027-08-10");
  assert.equal(replaced.body.evidence.documentOwnerId, a.userId);
  assert.notEqual(replaced.body.evidence.storagePath, upload.body.evidence.storagePath);
  const storageAfterReplace = await a.client.storage.from("evidence").list(`${env.workspaceA}/${evidenceId}`);
  assert.equal(storageAfterReplace.error, null);
  assert.deepEqual(storageAfterReplace.data.map((item) => item.name), [replaced.body.evidence.storagePath.split("/").at(-1)]);

  const deleted = await api(a.token, `/api/evidence/${evidenceId}?workspaceId=${env.workspaceA}`, { method: "DELETE" });
  assert.equal(deleted.response.status, 200, JSON.stringify(deleted.body));
  evidenceId = "";
  const afterDelete = await api(a.token, `/api/evidence?workspaceId=${env.workspaceA}&questionId=p6_1_002`);
  assert.equal(afterDelete.body.evidence.length, 0);
  assert.deepEqual(afterDelete.body.metrics, { evidenceCount: 0, linkCount: 0, providedQuestionCount: 0 });
  const linksAfterDelete = await a.client.from("evidence_question_links").select("id").eq("evidence_id", upload.body.evidence.id);
  assert.equal(linksAfterDelete.data.length, 0);
  const storageAfterDelete = await a.client.storage.from("evidence").list(`${env.workspaceA}/${upload.body.evidence.id}`);
  assert.equal(storageAfterDelete.data.length, 0);
  const assessmentAfterDelete = await api(a.token, `/api/assessment/responses?workspaceId=${env.workspaceA}`);
  const responseAfterDelete = assessmentAfterDelete.body.responses.find((row) => row.questionId === "p6_1_002");
  assert.equal(responseAfterDelete.answer, "not_implemented");
  assert.equal(responseAfterDelete.hasCanonicalEvidence, false);
  const gapAfterDelete = deriveGapAnalysis(assessmentAfterDelete.body.responses).find((item) => item.questionId === "p6_1_002");
  assert.equal(gapAfterDelete.status, "full_gap");
  assert.equal(gapAfterDelete.evidenceStatus, "not_provided");
  const remediationAfterDelete = await api(a.token, `/api/remediation/actions?workspaceId=${env.workspaceA}&locale=en`);
  assert.equal(remediationAfterDelete.body.actions.find((row) => row.questionId === "p6_1_002")?.evidenceStatus, "not_provided");

  console.log("PASS Evidence Storage integration: validations, upload, metadata, persistence, RLS, signed bytes, multi-link, unlink, Assessment, Gap, Dashboard, Remediation, replace and orphan-free delete.");
} finally {
  if (evidenceId) await api(a.token, `/api/evidence/${evidenceId}?workspaceId=${env.workspaceA}`, { method: "DELETE" });
  await a.client.auth.signOut();
  await b.client.auth.signOut();
}
