import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  activeRemediationGaps,
  isOverdue,
  remediationMetrics,
  remediationSourceKey,
} from "../lib/remediation/actions.ts";

const gap = (status, overrides = {}) => ({
  id: `organizational:a5-1:q1:${status}`,
  theme: "organizational",
  controlId: "a5-1",
  controlCode: "A.5.1",
  controlTitle: "Policies for information security",
  questionId: "q1",
  question: "Canonical question",
  answer: status === "full_gap" ? "not_implemented" : status === "partial_gap" ? "partially_implemented" : "not_sure",
  status,
  gapCode: "A5_1_Q1",
  evidenceStatus: "not_provided",
  href: "/assessment/organizational/a5-1#q1",
  ...overrides,
});

const candidates = activeRemediationGaps([
  gap("full_gap"),
  gap("partial_gap", { questionId: "q2", gapCode: "A5_1_Q2" }),
  gap("clarification_required", { questionId: "q3", gapCode: undefined }),
  gap("applicability_review_required", { questionId: "q4", gapCode: undefined }),
]);
assert.equal(candidates.length, 2, "only full and partial active gaps create remediation actions");
assert.deepEqual(candidates.map((item) => item.status), ["full_gap", "partial_gap"]);

const firstKey = remediationSourceKey(candidates[0]);
assert.equal(firstKey, "organizational:a5-1:q1:A5_1_Q1:full_gap");
assert.equal(remediationSourceKey({ ...candidates[0] }), firstKey, "source identity is deterministic");
assert.throws(() => remediationSourceKey(gap("clarification_required")), /Only active full or partial gaps/);

const now = new Date("2026-08-10T10:00:00Z");
const workflows = [
  { status: "todo", dueDate: "2026-08-09" },
  { status: "in_progress", dueDate: "2026-08-11" },
  { status: "completed", dueDate: "2026-08-01" },
];
assert.equal(isOverdue(workflows[0], now), true);
assert.equal(isOverdue(workflows[1], now), false);
assert.equal(isOverdue(workflows[2], now), false, "completed actions are never overdue");
assert.deepEqual(remediationMetrics(workflows, now), { open: 2, todo: 1, inProgress: 1, completed: 1, overdue: 1, total: 3 });

const ui = readFileSync(new URL("../components/remediation/remediation-plan-view.tsx", import.meta.url), "utf8");
const api = readFileSync(new URL("../app/api/remediation/actions/route.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20260810140000_create_remediation_actions.sql", import.meta.url), "utf8");
for (const forbidden of ["ACME", "Nora Bennett", "Liam Hart", "Maya Chen", "mockData", "sampleData", "demoData"]) {
  assert.equal(ui.includes(forbidden), false, `UI must not contain mockup data: ${forbidden}`);
  assert.equal(api.includes(forbidden), false, `API must not contain mockup data: ${forbidden}`);
}
assert.match(api, /deriveGapAnalysis/);
assert.match(api, /activeRemediationGaps/);
assert.match(api, /readAssessmentResponses/);
assert.doesNotMatch(api, /clarification_required.*insert|applicability_review_required.*insert/s);
assert.match(migration, /unique \(workspace_id, source_key\)/);
assert.match(migration, /status in \('todo', 'in_progress', 'completed'\)/);
assert.match(migration, /enable row level security/);
assert.match(migration, /source identity is immutable/);

console.log("Remediation Plan deterministic QA: PASS");

