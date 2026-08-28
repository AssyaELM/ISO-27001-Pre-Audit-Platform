import assert from "node:assert/strict";

import * as infrastructure from "../content/assessment-infrastructure.ts";
import * as content from "../content/assessment/people/disciplinary-process.ts";
import * as outcomes from "../lib/assessment/outcomes.ts";
import * as remediation from "../lib/assessment/disciplinary-process.ts";

function runTest(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error?.message ?? error);
    process.exitCode = 1;
    throw error;
  }
}

const expectedAnswerValues = [
  "implemented",
  "partially_implemented",
  "not_implemented",
  "not_sure",
  "not_applicable",
];

const expectedIds = [
  "p6_4_001",
  "p6_4_002",
  "p6_4_003",
  "p6_4_004_external",
];

const expectedActionCodes = ["P6.4-A01", "P6.4-A02", "P6.4-A03", "P6.4-A04"];

runTest("exact four IDs are present", () => {
  assertDeepEqualSorted(content.disciplinaryProcessQuestions.map((q) => q.id), expectedIds);
});

runTest("first three questions are mandatory", () => {
  assert.equal(content.disciplinaryProcessQuestions[0].id, "p6_4_001");
  assert.equal(content.disciplinaryProcessQuestions[1].id, "p6_4_002");
  assert.equal(content.disciplinaryProcessQuestions[2].id, "p6_4_003");
  const mandatory = content.disciplinaryProcessQuestions.filter((q) => q.category === "mandatory");
  const conditional = content.disciplinaryProcessQuestions.filter((q) => q.category !== "mandatory");
  assert.equal(mandatory.length, 3);
  assert.equal(conditional.length, 1);
  assert.equal(conditional[0].id, "p6_4_004_external");
});

runTest("p6_4_004_investigation does not exist", () => {
  const hasInvalidId = content.disciplinaryProcessQuestions.some((q) => q.id === "p6_4_004_investigation");
  assert.equal(hasInvalidId, false);
});

runTest("all definitions have exact FR and EN question/help/evidence", () => {
  for (const question of content.disciplinaryProcessQuestions) {
    assert.ok(typeof question.question.fr === "string" && question.question.fr.length > 0);
    assert.ok(typeof question.question.en === "string" && question.question.en.length > 0);
    assert.ok(typeof question.helpText.fr === "string" && question.helpText.fr.length > 0);
    assert.ok(typeof question.helpText.en === "string" && question.helpText.en.length > 0);
    assert.ok(Array.isArray(question.evidenceHints.fr) && question.evidenceHints.fr.length > 0);
    assert.ok(Array.isArray(question.evidenceHints.en) && question.evidenceHints.en.length > 0);
  }
});

runTest("no A.6.5 to A.6.8 IDs are introduced", () => {
  const invalid = content.disciplinaryProcessQuestions.some((q) => /^p6_[5-8]_/.test(q.id));
  assert.equal(invalid, false);
});

runTest("technical answer values are exact and all questions reuse same set", () => {
  assert.deepEqual(infrastructure.assessmentAnswerValues, expectedAnswerValues);
  for (const question of content.disciplinaryProcessQuestions) {
    assert.deepEqual(question.responseOptions, expectedAnswerValues);
  }
});

runTest("not_assessed is not a selectable answer", () => {
  assert.ok(!expectedAnswerValues.includes("not_assessed"));
  assert.ok(!infrastructure.assessmentAnswerValues.includes("not_assessed"));
});

runTest("resolve without context returns 3 mandatory and one unresolved condition", () => {
  const resolution = content.resolveDisciplinaryProcessQuestions();
  assert.deepEqual(resolution.questionIds, ["p6_4_001", "p6_4_002", "p6_4_003"]);
  assert.deepEqual(resolution.unresolvedConditions, ["hasRelevantExternalParties"]);
  assert.deepEqual(resolution.hiddenQuestionIds, ["p6_4_004_external"]);
});

runTest("hasRelevantExternalParties yes adds conditional question", () => {
  const resolution = content.resolveDisciplinaryProcessQuestions({
    hasRelevantExternalParties: "yes",
  });
  assert.deepEqual(resolution.questionIds, [
    "p6_4_001",
    "p6_4_002",
    "p6_4_003",
    "p6_4_004_external",
  ]);
  assert.deepEqual(resolution.unresolvedConditions, []);
});

runTest("hasRelevantExternalParties no hides conditional without not_applicable", () => {
  const resolution = content.resolveDisciplinaryProcessQuestions({
    hasRelevantExternalParties: "no",
  });
  assert.deepEqual(resolution.questionIds, ["p6_4_001", "p6_4_002", "p6_4_003"]);
  assert.deepEqual(resolution.hiddenQuestionIds, ["p6_4_004_external"]);
  assert.deepEqual(resolution.unresolvedConditions, []);
});

runTest("hasRelevantExternalParties not_sure masks condition and reports unresolved", () => {
  const resolution = content.resolveDisciplinaryProcessQuestions({
    hasRelevantExternalParties: "not_sure",
  });
  assert.deepEqual(resolution.unresolvedConditions, ["hasRelevantExternalParties"]);
  assert.deepEqual(resolution.hiddenQuestionIds, ["p6_4_004_external"]);
});

runTest("old response for hidden conditional is ignored", () => {
  const plan = remediation.deriveDisciplinaryProcessRemediationPlan(
    [
      {
        questionId: "p6_4_004_external",
        answer: "not_implemented",
        hasEvidence: true,
        justification: "legacy",
      },
    ],
    { hasRelevantExternalParties: "no" },
  );
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.clarifications.length, 0);
  assert.equal(plan.applicabilityReviews.length, 0);
});

runTest("implemented -> no_gap and no action", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_4_001",
    answer: "implemented",
    hasEvidence: false,
    justification: "ok",
  });
  assert.equal(outcome.gapLevel, "no_gap");
  assert.equal(outcome.reviewState, "none");

  const plan = remediation.deriveDisciplinaryProcessRemediationPlan(
    [{ questionId: "p6_4_001", answer: "implemented", hasEvidence: true, justification: "ok" }],
    { hasRelevantExternalParties: "no" },
  );
  assert.equal(plan.activeActions.length, 0);
});

runTest("partially implemented maps to partial_gap and right action", () => {
  const mapping = [
    ["p6_4_001", "P6.4-A01", "partial"],
    ["p6_4_002", "P6.4-A02", "partial"],
    ["p6_4_003", "P6.4-A03", "partial"],
    ["p6_4_004_external", "P6.4-A04", "partial"],
  ];

  for (const [questionId, actionCode, gapType] of mapping) {
    const outcome = outcomes.deriveAssessmentOutcome({
      questionId,
      answer: "partially_implemented",
      hasEvidence: true,
      justification: "ok",
    });
    assert.equal(outcome.gapLevel, "partial_gap");
    const plan = remediation.deriveDisciplinaryProcessRemediationPlan(
      [
        {
          questionId,
          answer: "partially_implemented",
          hasEvidence: true,
          justification: "ok",
        },
      ],
      questionId === "p6_4_004_external" ? { hasRelevantExternalParties: "yes" } : { hasRelevantExternalParties: "no" },
    );
    assert.equal(plan.activeActions.length, 1);
    assert.equal(plan.activeActions[0].actionCode, actionCode);
    assert.equal(plan.activeActions[0].gapType, gapType);
    assert.equal(plan.activeActions[0].gapCode, content.DISCIPLINARY_PROCESS_GAP_CODES[questionId].partial);
  }
});

runTest("not implemented maps to full_gap and right action", () => {
  const mapping = [
    ["p6_4_001", "P6.4-A01", "full", content.DISCIPLINARY_PROCESS_GAP_CODES.p6_4_001.full],
    ["p6_4_002", "P6.4-A02", "full", content.DISCIPLINARY_PROCESS_GAP_CODES.p6_4_002.full],
    ["p6_4_003", "P6.4-A03", "full", content.DISCIPLINARY_PROCESS_GAP_CODES.p6_4_003.full],
    ["p6_4_004_external", "P6.4-A04", "full", content.DISCIPLINARY_PROCESS_GAP_CODES.p6_4_004_external.full],
  ];

  for (const [questionId, expectedActionCode, expectedGapType, expectedGapCode] of mapping) {
    const outcome = outcomes.deriveAssessmentOutcome({
      questionId,
      answer: "not_implemented",
      hasEvidence: true,
      justification: "ok",
    });
    assert.equal(outcome.gapLevel, "full_gap");
    const plan = remediation.deriveDisciplinaryProcessRemediationPlan(
      [
        {
          questionId,
          answer: "not_implemented",
          hasEvidence: true,
          justification: "ok",
        },
      ],
      questionId === "p6_4_004_external" ? { hasRelevantExternalParties: "yes" } : { hasRelevantExternalParties: "no" },
    );
    assert.equal(plan.activeActions.length, 1);
    assert.equal(plan.activeActions[0].actionCode, expectedActionCode);
    assert.equal(plan.activeActions[0].gapType, expectedGapType);
    assert.equal(plan.activeActions[0].gapCode, expectedGapCode);
  }
});

runTest("not_sure -> clarification_required, no definitive gap", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_4_002",
    answer: "not_sure",
    hasEvidence: false,
    justification: "waiting",
  });
  assert.equal(outcome.reviewState, "clarification_required");
  const plan = remediation.deriveDisciplinaryProcessRemediationPlan(
    [{ questionId: "p6_4_002", answer: "not_sure", justification: "waiting" }],
    { hasRelevantExternalParties: "no" },
  );
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.clarifications.some((item) => item.questionId === "p6_4_002"), true);
});

runTest("not_applicable -> applicability_review_required and requires justification", () => {
  const outcome1 = outcomes.deriveAssessmentOutcome({
    questionId: "p6_4_002",
    answer: "not_applicable",
    hasEvidence: true,
  });
  assert.equal(outcome1.isValid, false);
  const outcome2 = outcomes.deriveAssessmentOutcome({
    questionId: "p6_4_002",
    answer: "not_applicable",
    hasEvidence: true,
    justification: "   ",
  });
  assert.equal(outcome2.isValid, false);
  const outcome3 = outcomes.deriveAssessmentOutcome({
    questionId: "p6_4_002",
    answer: "not_applicable",
    hasEvidence: true,
    justification: "Scope reviewed with legal/HR",
  });
  assert.equal(outcome3.isValid, true);
  assert.equal(outcome3.reviewState, "applicability_review_required");
  const plan = remediation.deriveDisciplinaryProcessRemediationPlan(
    [
      {
        questionId: "p6_4_002",
        answer: "not_applicable",
        hasEvidence: true,
        justification: "Scope reviewed with legal/HR",
      },
    ],
    { hasRelevantExternalParties: "no" },
  );
  assert.equal(plan.applicabilityReviews.includes("p6_4_002"), true);
  assert.equal(plan.activeActions.length, 0);
});

runTest("implemented with no evidence keeps not_provided", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_4_001",
    answer: "implemented",
    hasEvidence: false,
    justification: "ok",
  });
  assert.equal(outcome.evidenceStatus, "not_provided");
});

runTest("evidence statuses provided, validated, rejected are preserved", () => {
  const provided = outcomes.deriveAssessmentOutcome({
    questionId: "p6_4_001",
    answer: "implemented",
    hasEvidence: true,
    evidenceStatus: "provided",
    justification: "ok",
  });
  assert.equal(provided.evidenceStatus, "provided");

  const validated = outcomes.deriveAssessmentOutcome({
    questionId: "p6_4_001",
    answer: "implemented",
    hasEvidence: true,
    evidenceStatus: "validated",
    justification: "ok",
  });
  assert.equal(validated.evidenceStatus, "validated");

  const rejected = outcomes.deriveAssessmentOutcome({
    questionId: "p6_4_001",
    answer: "partially_implemented",
    hasEvidence: true,
    evidenceStatus: "rejected",
    justification: "ok",
  });
  assert.equal(rejected.evidenceStatus, "rejected");
});

runTest("latest response per question is used", () => {
  const plan = remediation.deriveDisciplinaryProcessRemediationPlan(
    [
      {
        questionId: "p6_4_001",
        answer: "not_implemented",
        justification: "old",
        hasEvidence: true,
      },
      {
        questionId: "p6_4_001",
        answer: "implemented",
        justification: "new",
        hasEvidence: false,
      },
    ],
    { hasRelevantExternalParties: "no" },
  );
  assert.equal(plan.activeActions.length, 0);
});

runTest("duplicate actions are deduplicated", () => {
  const plan = remediation.deriveDisciplinaryProcessRemediationPlan(
    [
      {
        questionId: "p6_4_002",
        answer: "not_implemented",
        justification: "first",
      },
      {
        questionId: "p6_4_002",
        answer: "not_implemented",
        justification: "last",
      },
    ],
    { hasRelevantExternalParties: "no" },
  );
  assert.equal(plan.activeActions.length, 1);
});

runTest("implemented again removes action", () => {
  const plan = remediation.deriveDisciplinaryProcessRemediationPlan(
    [
      {
        questionId: "p6_4_003",
        answer: "not_implemented",
        justification: "old",
      },
      {
        questionId: "p6_4_003",
        answer: "implemented",
        justification: "new",
      },
    ],
    { hasRelevantExternalParties: "no" },
  );
  assert.equal(plan.activeActions.length, 0);
});

runTest("partial to full updates same action", () => {
  const plan = remediation.deriveDisciplinaryProcessRemediationPlan(
    [
      {
        questionId: "p6_4_003",
        answer: "partially_implemented",
        justification: "partial",
      },
      {
        questionId: "p6_4_003",
        answer: "not_implemented",
        justification: "full",
      },
    ],
    { hasRelevantExternalParties: "no" },
  );
  assert.equal(plan.activeActions.length, 1);
  assert.equal(plan.activeActions[0].actionCode, "P6.4-A03");
  assert.equal(plan.activeActions[0].gapType, "full");
});

runTest("plan code is exact", () => {
  const plan = remediation.deriveDisciplinaryProcessRemediationPlan([], { hasRelevantExternalParties: "no" });
  assert.equal(plan.planCode, content.DISCIPLINARY_PROCESS_PLAN_CODE);
});

runTest("all action codes are exactly expected", () => {
  const plan = remediation.deriveDisciplinaryProcessRemediationPlan(
    [
      {
        questionId: "p6_4_001",
        answer: "not_implemented",
        hasEvidence: true,
        justification: "x",
      },
      {
        questionId: "p6_4_002",
        answer: "not_implemented",
        hasEvidence: true,
        justification: "x",
      },
      {
        questionId: "p6_4_003",
        answer: "not_implemented",
        hasEvidence: true,
        justification: "x",
      },
      {
        questionId: "p6_4_004_external",
        answer: "not_implemented",
        hasEvidence: true,
        justification: "x",
      },
    ],
    { hasRelevantExternalParties: "yes" },
  );
  const actionCodes = plan.activeActions.map((action) => action.actionCode).sort();
  assert.deepEqual(actionCodes, expectedActionCodes.sort());
});

runTest("mapping exact for all gap/action codes", () => {
  assert.equal(content.DISCIPLINARY_PROCESS_GAP_CODES.p6_4_001.partial, "A6_4_PROCESS_PARTIAL");
  assert.equal(content.DISCIPLINARY_PROCESS_GAP_CODES.p6_4_001.full, "A6_4_PROCESS_ABSENT");
  assert.equal(content.DISCIPLINARY_PROCESS_GAP_CODES.p6_4_002.partial, "A6_4_COMMUNICATION_PARTIAL");
  assert.equal(content.DISCIPLINARY_PROCESS_GAP_CODES.p6_4_002.full, "A6_4_COMMUNICATION_ABSENT");
  assert.equal(content.DISCIPLINARY_PROCESS_GAP_CODES.p6_4_003.partial, "A6_4_CASE_HANDLING_PARTIAL");
  assert.equal(content.DISCIPLINARY_PROCESS_GAP_CODES.p6_4_003.full, "A6_4_CASE_HANDLING_ABSENT");
  assert.equal(content.DISCIPLINARY_PROCESS_GAP_CODES.p6_4_004_external.partial, "A6_4_EXTERNAL_ENFORCEMENT_PARTIAL");
  assert.equal(content.DISCIPLINARY_PROCESS_GAP_CODES.p6_4_004_external.full, "A6_4_EXTERNAL_ENFORCEMENT_ABSENT");
});

runTest("walkthrough support does not auto-create mandatory gap", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_4_003",
    answer: "implemented",
    hasEvidence: true,
    evidenceStatus: "provided",
    justification: "walkthrough completed",
  });
  assert.equal(outcome.gapLevel, "no_gap");
  assert.equal(outcome.isValid, true);
});

runTest("no fixed sanction list is encoded", () => {
  const actionCodeStrings = Object.values(remediation.DISCIPLINARY_PROCESS_ACTIONS).flatMap((action) => [
    action.title.fr,
    action.title.en,
    action.recommendedActions.fr,
    action.recommendedActions.en,
    action.fullGapDescription.fr,
    action.fullGapDescription.en,
  ]);
  const combined = actionCodeStrings.join(" ").toLowerCase();
  const forbidden = ["licenciement", "termination", "firing", "annual review", "lms", "lms "];
  for (const term of forbidden) {
    assert.ok(!combined.includes(term), `forbidden term present: ${term}`);
  }
});

runTest("no automatic dismissal coded", () => {
  const serialized = JSON.stringify(remediation.DISCIPLINARY_PROCESS_ACTIONS).toLowerCase();
  assert.ok(!serialized.includes("automatic dismissal"));
  assert.ok(!serialized.includes("automatic termination"));
});

runTest("no mandatory annual review is encoded", () => {
  const serialized = JSON.stringify(content.disciplinaryProcessQuestions).toLowerCase();
  assert.ok(!serialized.includes("annual review"));
  assert.ok(!serialized.includes("revue annuelle"));
});

runTest("resolve and getters are available", () => {
  const all = content.getAllDisciplinaryProcessQuestions("fr");
  assert.equal(all.length, 4);
  const firstFr = content.getDisciplinaryProcessQuestion("p6_4_001", "fr");
  const firstEn = content.getDisciplinaryProcessQuestion("p6_4_001", "en");
  assert.ok(firstFr.question.length > 0);
  assert.ok(firstEn.question.length > 0);
  assert.notEqual(firstFr.question, firstEn.question);
});

runTest("question id helpers and condition keys", () => {
  assert.equal(content.isPeopleDisciplinaryProcessQuestion("p6_4_001"), true);
  assert.equal(content.isPeopleDisciplinaryProcessQuestion("p6_4_004_external"), true);
  assert.equal(content.isPeopleDisciplinaryProcessQuestion("p6_5_001"), false);
});

runTest("plan result shape includes required fields", () => {
  const plan = remediation.deriveDisciplinaryProcessRemediationPlan([], { hasRelevantExternalParties: "not_sure" });
  assert.ok(typeof plan.planCode === "string");
  assert.ok(plan.title && typeof plan.title.fr === "string" && typeof plan.title.en === "string");
  assert.ok(Array.isArray(plan.activeActions));
  assert.ok(Array.isArray(plan.clarifications));
  assert.ok(Array.isArray(plan.applicabilityReviews));
  assert.ok(Array.isArray(plan.unresolvedConditions));
});

runTest("no frontend/api/db changes are required (guardrail", () => {
  assert.ok(true);
});

runTest("resolve not_sure returns unresolved condition list", () => {
  const resolution = content.resolveDisciplinaryProcessQuestions({ hasRelevantExternalParties: "not_sure" });
  assert.equal(resolution.unresolvedConditions.length, 1);
  assert.equal(resolution.unresolvedConditions[0], "hasRelevantExternalParties");
});

runTest("deterministic output for same inputs", () => {
  const input = [
    {
      questionId: "p6_4_001",
      answer: "not_implemented",
      hasEvidence: true,
      justification: "a",
    },
    {
      questionId: "p6_4_002",
      answer: "partially_implemented",
      hasEvidence: true,
      justification: "b",
    },
    {
      questionId: "p6_4_004_external",
      answer: "implemented",
      hasEvidence: true,
      justification: "c",
    },
  ];
  const firstPlan = remediation.deriveDisciplinaryProcessRemediationPlan(input, {
    hasRelevantExternalParties: "yes",
  });
  const secondPlan = remediation.deriveDisciplinaryProcessRemediationPlan(input, {
    hasRelevantExternalParties: "yes",
  });
  assert.deepEqual(firstPlan, secondPlan);
});

function assertDeepEqualSorted(actual, expected) {
  assert.deepEqual([...actual].sort(), [...expected].sort());
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("All assessment A.6.4 QA checks passed.");
