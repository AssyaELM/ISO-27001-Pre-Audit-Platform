import assert from "node:assert/strict";
import fs from "node:fs";

import { AI_DOCUMENT_TYPES, buildAiDocumentsRegistry } from "../lib/ai-documents/registry.ts";

const evidence = (overrides = {}) => ({
  id: "e-1", document_type: "access_control_policy", document_version: "v1",
  effective_date: null, review_date: null, document_owner_id: null,
  original_filename: "policy.pdf", created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z", ...overrides,
});
const aiDocument = (overrides = {}) => ({
  id: "d-1", document_type: "access_control_policy", status: "draft", version: "v1",
  created_by: "user-a", created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z", finalized_at: null, ...overrides,
});
const today = new Date("2026-08-11T12:00:00.000Z");
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`PASS ${name}`); }

test("empty workspace returns every canonical missing entry in order", () => {
  const registry = buildAiDocumentsRegistry([], [], today);
  assert.deepEqual(registry.map((entry) => entry.documentType), AI_DOCUMENT_TYPES);
  assert.deepEqual(registry.map((entry) => entry.status), Array(AI_DOCUMENT_TYPES.length).fill("missing"));
  assert.ok(registry.every((entry) => entry.evidenceCount === 0 && entry.activeDocument === null));
});

test("classified Evidence becomes already_available without a copy", () => {
  const entry = buildAiDocumentsRegistry([evidence()], [], today)[1];
  assert.equal(entry.status, "already_available");
  assert.equal(entry.evidenceCount, 1);
  assert.deepEqual(entry.activeDocument, entry.evidenceDocuments[0]);
  assert.equal(entry.activeDocument.source, "evidence");
  assert.equal(entry.activeDocument.id, "e-1");
});

test("other Evidence satisfies no registry type", () => {
  const registry = buildAiDocumentsRegistry([evidence({ document_type: "other" })], [], today);
  assert.ok(registry.every((entry) => entry.status === "missing" && entry.evidenceCount === 0));
});

test("multiple Evidence rows are counted and current Evidence is deterministic", () => {
  const older = evidence({ id: "e-old", updated_at: "2026-02-01T00:00:00Z" });
  const newer = evidence({ id: "e-new", document_version: "v2", updated_at: "2026-03-01T00:00:00Z" });
  const entry = buildAiDocumentsRegistry([older, newer], [], today)[1];
  assert.equal(entry.evidenceCount, 2);
  assert.equal(entry.activeDocument.id, "e-new");
  assert.deepEqual(entry.evidenceDocuments.map((item) => item.id), ["e-new", "e-old"]);
});

test("review state uses Evidence review date only", () => {
  assert.equal(buildAiDocumentsRegistry([evidence({ review_date: "2027-01-01" })], [], today)[1].reviewState, "current");
  assert.equal(buildAiDocumentsRegistry([evidence({ review_date: "2026-01-01" })], [], today)[1].reviewState, "review_overdue");
  assert.equal(buildAiDocumentsRegistry([evidence({ review_date: null })], [], today)[1].reviewState, "unknown");
});

test("deleting the final Evidence recalculates already_available to missing", () => {
  assert.equal(buildAiDocumentsRegistry([evidence()], [], today)[1].status, "already_available");
  assert.equal(buildAiDocumentsRegistry([], [], today)[1].status, "missing");
});

test("draft and finalized statuses are derived from real registry rows", () => {
  assert.equal(buildAiDocumentsRegistry([], [aiDocument()], today)[1].status, "draft");
  const final = aiDocument({ status: "finalized", finalized_at: "2026-05-01T00:00:00Z" });
  assert.equal(buildAiDocumentsRegistry([], [final], today)[1].status, "finalized");
});

test("priority is finalized then draft then available then missing", () => {
  const available = evidence();
  const draft = aiDocument();
  const final = aiDocument({ id: "d-final", status: "finalized", version: "v2", finalized_at: "2026-05-01T00:00:00Z" });
  assert.equal(buildAiDocumentsRegistry([available], [draft, final], today)[1].status, "finalized");
  assert.equal(buildAiDocumentsRegistry([available], [draft], today)[1].status, "draft");
  assert.equal(buildAiDocumentsRegistry([available], [], today)[1].status, "already_available");
  assert.equal(buildAiDocumentsRegistry([], [], today)[1].status, "missing");
});

test("simple versioning preserves rows and selects latest finalized deterministically", () => {
  const v1 = aiDocument({ id: "v1", status: "finalized", version: "v1", finalized_at: "2026-03-01T00:00:00Z" });
  const v2 = aiDocument({ id: "v2", status: "finalized", version: "v2", finalized_at: "2026-04-01T00:00:00Z" });
  const v3 = aiDocument({ id: "v3", status: "draft", version: "v3", updated_at: "2026-05-01T00:00:00Z" });
  const entry = buildAiDocumentsRegistry([], [v1, v2, v3], today)[1];
  assert.equal(entry.status, "finalized");
  assert.equal(entry.activeDocument.id, "v2");
});

test("backend foundation contains no AI calls, generated content or Assessment coupling", () => {
  const sources = [
    fs.readFileSync(new URL("../lib/ai-documents/registry.ts", import.meta.url), "utf8"),
    fs.readFileSync(new URL("../app/api/ai-documents/route.ts", import.meta.url), "utf8"),
    fs.readFileSync(new URL("../supabase/migrations/20260811160000_create_ai_documents_registry.sql", import.meta.url), "utf8"),
  ].join("\n");
  assert.doesNotMatch(sources, /openai|gemini|claude|prompt|generated_content|assessment_responses|gap.analysis|remediation/i);
  assert.match(sources, /status text not null default 'draft'/);
  assert.match(sources, /status in \('draft', 'finalized'\)/);
  assert.doesNotMatch(sources, /insert into public\.ai_documents/i);
});

console.log(`AI Documents Registry QA: ${passed} tests passed.`);
