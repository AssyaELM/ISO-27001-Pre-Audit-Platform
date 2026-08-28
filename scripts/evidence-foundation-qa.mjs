import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  EVIDENCE_MAX_FILE_SIZE,
  generatedStoragePath,
  sanitizeOriginalFilename,
  validateEvidenceFile,
} from "../lib/evidence/files.ts";
import { validateCanonicalQuestionIdentity } from "../lib/evidence/catalog.ts";
import { deriveGapAnalysis } from "../lib/assessment/gap-analysis.ts";
import { readCanonicalEvidenceMetrics } from "../lib/evidence/repository.ts";
import { organizationalControls } from "../content/assessment/organizational/organizational-controls.ts";
import { evidenceRouteError } from "../lib/evidence/http.ts";
import { documentReviewState, validateDocumentMetadata } from "../lib/evidence/metadata.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
let passed = 0;

async function test(name, fn) {
  await fn();
  passed += 1;
  console.log(`PASS ${name}`);
}

await test("canonical catalogs accept real questions and reject invented identities", () => {
  assert.deepEqual(validateCanonicalQuestionIdentity({ themeId: "people", controlId: "a6-1", questionId: "p6_1_001" }), {
    themeId: "people", controlId: "a6-1", questionId: "p6_1_001",
  });
  assert.equal(validateCanonicalQuestionIdentity({ themeId: "people", controlId: "a6-1", questionId: "invented" }), null);
  assert.equal(validateCanonicalQuestionIdentity({ themeId: "people", controlId: "a6-99", questionId: "p6_1_001" }), null);
  assert.equal(validateCanonicalQuestionIdentity({ themeId: "invented", controlId: "a6-1", questionId: "p6_1_001" }), null);
});

await test("safe PDF upload validates content as well as declared MIME", async () => {
  const pdf = new File([new TextEncoder().encode("%PDF-1.7\nNormCore evidence")], "policy.pdf", { type: "application/pdf" });
  const result = await validateEvidenceFile(pdf);
  assert.equal(result.mimeType, "application/pdf");
  assert.equal(result.originalFilename, "policy.pdf");
  await assert.rejects(
    validateEvidenceFile(new File(["not a pdf"], "fake.pdf", { type: "application/pdf" })),
    /does not match/,
  );
});

await test("MIME allowlist and maximum size are enforced", async () => {
  await assert.rejects(validateEvidenceFile(new File(["x"], "x.exe", { type: "application/octet-stream" })), /Unsupported/);
  const oversized = new File([new Uint8Array(EVIDENCE_MAX_FILE_SIZE + 1)], "large.txt", { type: "text/plain" });
  await assert.rejects(validateEvidenceFile(oversized), /10 MiB/);
});

await test("user names cannot become paths and generated paths are collision-safe", () => {
  assert.equal(sanitizeOriginalFilename("../../secret\\policy?.pdf"), "policy_.pdf");
  const first = generatedStoragePath("11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222", "pdf");
  const second = generatedStoragePath("11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222", "pdf");
  assert.match(first, /^11111111-1111-1111-1111-111111111111\/22222222-2222-2222-2222-222222222222\/[0-9a-f-]+\.pdf$/);
  assert.notEqual(first, second);
});

await test("legacy evidence_reference and response review_status never create provided Evidence", () => {
  const base = { controlId: "a6-1", questionId: "p6_1_001", theme: "people", answer: "not_implemented" };
  const legacy = deriveGapAnalysis([{ ...base, evidenceReference: "https://legacy.invalid/file", reviewStatus: "validated" }]);
  assert.equal(legacy[0]?.evidenceStatus, "not_provided");
  const canonical = deriveGapAnalysis([{ ...base, evidenceReference: null, hasCanonicalEvidence: true }]);
  assert.equal(canonical[0]?.evidenceStatus, "provided");
});

await test("Assessment upserts preserve legacy data when evidenceReference is omitted", () => {
  const responses = read("lib/assessment/responses.ts");
  assert.match(responses, /input\.evidenceReference !== undefined/);
  assert.doesNotMatch(responses, /evidence_reference:\s*input\.evidenceReference\s*\?\?\s*null/);
});

await test("migration defines private storage, cross-workspace FK, RLS and binary-only foundation", () => {
  const sql = read("supabase/migrations/20260810170000_create_evidence_foundation.sql");
  for (const required of [
    "create table if not exists public.evidence_items",
    "create table if not exists public.evidence_question_links",
    "foreign key (evidence_id, workspace_id)",
    "unique (evidence_id, workspace_id, theme_id, control_id, question_id)",
    "public.current_user_can_access_workspace(workspace_id)",
    "insert into storage.buckets",
    "'evidence',\n  'evidence',\n  false",
    "evidence_storage_select",
  ]) assert.ok(sql.includes(required), `missing migration contract: ${required}`);
  assert.doesNotMatch(sql, /evidence_status|validated_by|rejected_by|reviewer_id/);
  assert.doesNotMatch(sql, /create policy evidence_storage_(insert|update|delete)/);
  assert.match(sql, /grant select on table public\.evidence_items to authenticated/);
  assert.doesNotMatch(sql, /grant select, insert.*evidence_items to authenticated/);
  assert.match(read("lib/supabase/admin.ts"), /SUPABASE_SERVICE_ROLE_KEY/);
  const serviceGrant = read("supabase/migrations/20260811100000_grant_evidence_service_role.sql");
  assert.match(serviceGrant, /grant select, insert, update, delete on table public\.evidence_items to service_role/);
  assert.match(serviceGrant, /grant select, insert, update, delete on table public\.evidence_question_links to service_role/);
});

await test("all required backend routes and the Evidence Room entry route exist", () => {
  for (const file of [
    "app/api/evidence/route.ts",
    "app/api/evidence/[id]/links/route.ts",
    "app/api/evidence/[id]/links/[linkId]/route.ts",
    "app/api/evidence/[id]/download/route.ts",
    "app/api/evidence/[id]/replace/route.ts",
    "app/api/evidence/[id]/route.ts",
  ]) assert.equal(fs.existsSync(path.join(root, file)), true, `${file} missing`);
  assert.equal(fs.existsSync(path.join(root, "app/evidence-room/page.tsx")), true);
  const uploadRoute = read("app/api/evidence/route.ts");
  assert.match(uploadRoute, /const hasLinkIdentity = Object\.values\(identityInput\)\.some\(Boolean\)/);
  assert.match(uploadRoute, /evidenceStatus: identity \? "provided" : "not_provided"/);
});

await test("Gap Analysis and Remediation consume canonical Evidence flags", () => {
  const gap = read("lib/assessment/gap-analysis.ts");
  const remediation = read("app/api/remediation/actions/route.ts");
  const assessment = read("app/api/assessment/responses/route.ts");
  assert.match(gap, /row\.hasCanonicalEvidence \? "provided" : "not_provided"/);
  assert.match(remediation, /withCanonicalEvidence/);
  assert.match(assessment, /withCanonicalEvidence/);
  assert.match(read("lib/evidence/repository.ts"), /readCanonicalEvidenceMetrics/);
  assert.doesNotMatch(gap, /row\.evidenceReference\?\.trim\(\) \? "provided"/);
});

await test("Dashboard, Gap Analysis and Remediation share the canonical Evidence source", () => {
  const dashboard = read("components/dashboard/dashboard-page.tsx");
  const remediation = read("app/api/remediation/actions/route.ts");
  assert.match(dashboard, /\/api\/evidence\?workspaceId=/);
  assert.match(dashboard, /metrics\.providedQuestionCount/);
  assert.doesNotMatch(dashboard, /evidence_reference|evidenceReference/);
  assert.match(remediation, /hasCanonicalEvidence: row\.hasCanonicalEvidence/);
  assert.doesNotMatch(remediation, /evidenceReference: row\.evidenceReference/);
});

await test("canonical Dashboard metrics exclude hidden conditional questions", async () => {
  const control = organizationalControls.find((candidate) => candidate.questions.some((question) => question.conditionKey));
  const conditional = control?.questions.find((question) => question.conditionKey);
  assert.ok(control && conditional?.conditionKey);
  const links = [
    { evidence_id: "e-visible", theme_id: "organizational", control_id: "a5-1", question_id: "p5_1_001" },
    { evidence_id: "e-hidden", theme_id: "organizational", control_id: control.id, question_id: conditional.id },
  ];
  const query = {
    select() { return this; },
    eq() { return Promise.resolve({ data: links, error: null }); },
  };
  const client = { from() { return query; } };
  const metrics = await readCanonicalEvidenceMetrics(client, "workspace-test", {
    assessment_context: { organizational: { [conditional.conditionKey]: "no" } },
  });
  assert.deepEqual(metrics, { evidenceCount: 1, linkCount: 1, providedQuestionCount: 1 });
});

await test("PostgREST duplicate-link errors map to HTTP 409", async () => {
  const response = evidenceRouteError({ code: "23505", message: "duplicate key value violates unique constraint" }, "fallback");
  assert.equal(response.status, 409);
});

await test("document metadata validation is optional, canonical and date-safe", () => {
  assert.deepEqual(validateDocumentMetadata({}), {
    documentType: null, documentVersion: null, effectiveDate: null, reviewDate: null, documentOwnerId: null,
  });
  assert.equal(validateDocumentMetadata({ documentType: "access_control_policy" }).documentType, "access_control_policy");
  assert.throws(() => validateDocumentMetadata({ documentType: "invented" }), /not supported/);
  assert.throws(() => validateDocumentMetadata({ effectiveDate: "2026-02-30" }), /valid date/);
  assert.throws(() => validateDocumentMetadata({ effectiveDate: "2026-08-10", reviewDate: "2026-08-09" }), /on or after/);
});

await test("document review state is deterministic and AI-free", () => {
  const today = new Date("2026-08-11T12:00:00.000Z");
  assert.equal(documentReviewState(null, today), "unknown");
  assert.equal(documentReviewState("2026-08-11", today), "current");
  assert.equal(documentReviewState("2026-08-10", today), "review_overdue");
});

await test("document metadata migration constrains types, dates and workspace owner", () => {
  const sql = read("supabase/migrations/20260811143000_add_evidence_document_metadata.sql");
  for (const required of ["document_type", "document_version", "effective_date", "review_date", "document_owner_id", "evidence_document_owner_in_workspace", "review_date >= effective_date"]) {
    assert.ok(sql.includes(required), `missing document metadata contract: ${required}`);
  }
  assert.doesNotMatch(sql, /missing|draft|finalized|already_available/i);
  const itemRoute = read("app/api/evidence/[id]/route.ts");
  assert.match(itemRoute, /export async function PATCH/);
  assert.match(read("app/api/evidence/[id]/replace/route.ts"), /storage_path: nextPath/);
  assert.doesNotMatch(read("app/api/evidence/[id]/replace/route.ts"), /document_type:/);
});

console.log(`Evidence foundation QA: ${passed} tests passed.`);
