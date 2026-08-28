import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { organizationalControls } from "../content/assessment/organizational/organizational-controls.ts";
import {
  deriveOrganizationalPresentation,
  deriveOrganizationalPresentationFromOnboarding,
  isOrganizationalControlId,
  markOrganizationalControlActivity,
  organizationalStartHref,
  ORGANIZATIONAL_CONTROL_JUSTIFICATIONS_KEY,
} from "../lib/assessment/organizational-presentation.ts";
import { resolveOrganizationalControl } from "../lib/assessment/organizational-controls.ts";

assert.equal(organizationalControls.length, 37, "frontend navigation uses all 37 canonical controls");
assert.equal(organizationalStartHref(), `/assessment/organizational/${organizationalControls[0].id}`);
assert.equal(isOrganizationalControlId("a5-37"), true);
assert.equal(isOrganizationalControlId("a5-999"), false, "prefix-only control IDs are rejected");

const a53 = organizationalControls.find((control) => control.id === "a5-3");
assert.ok(a53);
const unresolvedA53 = resolveOrganizationalControl("a5-3", {});
assert.ok(unresolvedA53.unresolvedConditions.length > 0, "fixture has unresolved Quick Context");
const completedA53Responses = unresolvedA53.questionIds.map((questionId) => ({
  controlId: "a5-3",
  questionId,
  answer: "implemented",
  answeredAt: "2026-08-10T10:00:00.000Z",
}));
let presentation = deriveOrganizationalPresentation({ responses: completedA53Responses });
assert.equal(presentation.controls.find((control) => control.id === "a5-3")?.status, "completed");
assert.equal(presentation.completedControlCount, 1, "unresolved Quick Context does not block completion");
assert.equal(presentation.progress, Math.round(100 / 37), "Quick Context is excluded from progress");

const conditionalA53 = a53.questions.find((question) => question.conditionKey);
assert.ok(conditionalA53);
presentation = deriveOrganizationalPresentation({
  persistedOrganizational: { cannotFullySegregateDuties: "no" },
  responses: [
    ...resolveOrganizationalControl("a5-3", { cannotFullySegregateDuties: "no" }).questionIds.map((questionId) => ({
      controlId: "a5-3",
      questionId,
      answer: "implemented",
    })),
    {
      controlId: "a5-3",
      questionId: conditionalA53.id,
      answer: "not_implemented",
      evidenceReference: "stale-hidden-evidence",
    },
  ],
});
assert.equal(presentation.activeResponses.some((response) => response.questionId === conditionalA53.id), false);
assert.equal(presentation.controls.find((control) => control.id === "a5-3")?.status, "completed", "hidden gap does not affect status");

const a58 = organizationalControls.find((control) => control.id === "a5-8");
assert.ok(a58?.applicabilityKey);
const controlNaJustification = "No in-scope assets require this control; SoA review required.";
const naPersisted = markOrganizationalControlActivity({
  [a58.applicabilityKey]: "no",
  [ORGANIZATIONAL_CONTROL_JUSTIFICATIONS_KEY]: { "a5-8": controlNaJustification },
}, "a5-8", "2026-08-10T11:00:00.000Z");
presentation = deriveOrganizationalPresentation({ persistedOrganizational: naPersisted });
assert.equal(presentation.controls.find((control) => control.id === "a5-8")?.status, "review");
assert.equal(presentation.controls.find((control) => control.id === "a5-8")?.started, true);
assert.equal(presentation.continueHref, "/assessment/organizational/a5-8");

presentation = deriveOrganizationalPresentation({
  persistedOrganizational: { ...naPersisted, [a58.applicabilityKey]: "yes" },
});
assert.equal(presentation.controls.find((control) => control.id === "a5-8")?.status, "inProgress", "no to yes reactivates assessed questions");
assert.ok((presentation.controls.find((control) => control.id === "a5-8")?.visibleQuestionCount ?? 0) > 0);

const quickContextOnly = markOrganizationalControlActivity({}, "a5-12", "2026-08-10T12:00:00.000Z");
presentation = deriveOrganizationalPresentation({ persistedOrganizational: quickContextOnly });
assert.equal(presentation.controls.find((control) => control.id === "a5-12")?.started, true);
assert.equal(presentation.continueHref, "/assessment/organizational/a5-12", "Quick Context-only activity drives Continue");

presentation = deriveOrganizationalPresentation({
  responses: [
    { controlId: "a5-4", questionId: "unknown", answer: "implemented", answeredAt: "2026-08-10T09:00:00.000Z" },
    { controlId: "a5-2", questionId: "unknown", answer: "implemented", answeredAt: "2026-08-10T13:00:00.000Z" },
    { controlId: "a5-999", questionId: "unknown", answer: "implemented", answeredAt: "2026-08-10T14:00:00.000Z" },
  ],
});
assert.equal(presentation.continueHref, "/assessment/organizational/a5-2", "Continue uses the latest canonical control only");

presentation = deriveOrganizationalPresentation({
  persistedOrganizational: {
    [a58.applicabilityKey]: "no",
    [ORGANIZATIONAL_CONTROL_JUSTIFICATIONS_KEY]: { "a5-8": controlNaJustification },
  },
  responses: [{
    controlId: "a5-2",
    questionId: "unknown",
    answer: "implemented",
    answeredAt: "2026-08-10T13:00:00.000Z",
  }],
});
assert.equal(presentation.continueHref, "/assessment/organizational/a5-2", "dated activity wins over legacy N/A without a timestamp");

const onboardingPresentation = deriveOrganizationalPresentationFromOnboarding({
  assessment_context: { organizational: quickContextOnly },
});
assert.equal(onboardingPresentation.continueHref, "/assessment/organizational/a5-12");

const assessmentSource = await readFile(new URL("../components/assessment/assessment-theme-page.tsx", import.meta.url), "utf8");
const dashboardSource = await readFile(new URL("../components/dashboard/dashboard-page.tsx", import.meta.url), "utf8");
const organizationalPageSource = await readFile(new URL("../app/assessment/organizational/[controlId]/page.tsx", import.meta.url), "utf8");
assert.ok(assessmentSource.includes("organizationalStartHref()"));
assert.ok(dashboardSource.includes("organizationalStartHref()"));
assert.ok(assessmentSource.includes("organizational.progress"));
assert.ok(dashboardSource.includes("organizational.progress"));
assert.equal(assessmentSource.includes('firstHref: "/assessment/organizational/a5-1"'), false);
assert.equal(dashboardSource.includes('organizational: "/assessment/organizational/a5-1"'), false);
assert.equal(dashboardSource.includes("Math.min(100, responses.length)"), false, "response count is not a progress percentage");
assert.ok(
  organizationalPageSource.includes('saveContext(control.applicabilityKey, "yes")'),
  "control-level N/A exposes an explicit no-to-yes reactivation action",
);

console.log("All Organizational frontend regression QA checks passed.");
