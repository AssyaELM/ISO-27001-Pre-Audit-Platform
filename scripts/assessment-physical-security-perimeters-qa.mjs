import assert from "node:assert/strict";

import * as infrastructure from "../content/assessment-infrastructure.ts";
import * as content from "../content/assessment/physical/physical-security-perimeters.ts";
import * as outcomes from "../lib/assessment/outcomes.ts";
import * as remediation from "../lib/assessment/physical-security-perimeters.ts";

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

const expectedQuestionIds = [
  "p7_1_001",
  "p7_1_002",
  "p7_1_003",
  "p7_1_004_third_party",
];

const expectedActionCodes = ["P7.1-A01", "P7.1-A02", "P7.1-A03", "P7.1-A04"];

function assertDeepEqualSorted(actual, expected) {
  assert.deepEqual([...actual].sort(), [...expected].sort());
}

runTest("exact A.7.1 question ids are present", () => {
  assertDeepEqualSorted(content.physicalSecurityPerimeterQuestions.map((q) => q.id), expectedQuestionIds);
});

runTest("exactly four ids and expected question categories", () => {
  const mandatory = content.physicalSecurityPerimeterQuestions.filter((q) => q.category === "mandatory");
  const conditional = content.physicalSecurityPerimeterQuestions.filter((q) => q.category === "conditional_third_party");
  assert.equal(content.physicalSecurityPerimeterQuestions.length, 4);
  assert.equal(mandatory.length, 3);
  assert.equal(conditional.length, 1);
  assert.equal(conditional[0].id, "p7_1_004_third_party");
});

runTest("no unexpected A.6.2-A.6.8 ids are included", () => {
  const invalid = content.physicalSecurityPerimeterQuestions.some((q) => /^p6_[2-8]_/.test(q.id));
  assert.equal(invalid, false);
});

runTest("French and English question/help/evidence fields exist for all", () => {
  for (const question of content.physicalSecurityPerimeterQuestions) {
    assert.ok(typeof question.question.fr === "string" && question.question.fr.length > 0);
    assert.ok(typeof question.question.en === "string" && question.question.en.length > 0);
    assert.ok(typeof question.helpText.fr === "string" && question.helpText.fr.length > 0);
    assert.ok(typeof question.helpText.en === "string" && question.helpText.en.length > 0);
    assert.ok(Array.isArray(question.evidenceHints.fr) && question.evidenceHints.fr.length > 0);
    assert.ok(Array.isArray(question.evidenceHints.en) && question.evidenceHints.en.length > 0);
  }
  assert.ok(typeof content.physicalSecurityPerimetersLegalNotice.fr === "string");
  assert.ok(content.physicalSecurityPerimetersLegalNotice.fr.length > 0);
  assert.ok(typeof content.physicalSecurityPerimetersLegalNotice.en === "string");
  assert.ok(content.physicalSecurityPerimetersLegalNotice.en.length > 0);
});

runTest("technical answer set is exactly required 5 values", () => {
  assert.deepEqual(infrastructure.assessmentAnswerValues, expectedAnswerValues);
  for (const question of content.physicalSecurityPerimeterQuestions) {
    assert.deepEqual(question.responseOptions, expectedAnswerValues);
  }
});

runTest("not_assessed is not an allowed answer", () => {
  assert.ok(!expectedAnswerValues.includes("not_assessed"));
  assert.ok(!infrastructure.assessmentAnswerValues.includes("not_assessed"));
});

runTest("exact gap codes are defined", () => {
  const gapCodes = Object.keys(content.PHYSICAL_SECURITY_PERIMETER_GAP_CODES);
  assertDeepEqualSorted(gapCodes, expectedQuestionIds);
  assert.equal(content.PHYSICAL_SECURITY_PERIMETER_GAP_CODES.p7_1_001.partial, "A7_1_PERIMETER_DEFINITION_PARTIAL");
  assert.equal(content.PHYSICAL_SECURITY_PERIMETER_GAP_CODES.p7_1_001.full, "A7_1_PERIMETER_DEFINITION_ABSENT");
  assert.equal(content.PHYSICAL_SECURITY_PERIMETER_GAP_CODES.p7_1_002.partial, "A7_1_PERIMETER_PROTECTION_PARTIAL");
  assert.equal(content.PHYSICAL_SECURITY_PERIMETER_GAP_CODES.p7_1_002.full, "A7_1_PERIMETER_PROTECTION_ABSENT");
  assert.equal(content.PHYSICAL_SECURITY_PERIMETER_GAP_CODES.p7_1_003.partial, "A7_1_PERIMETER_ASSURANCE_PARTIAL");
  assert.equal(content.PHYSICAL_SECURITY_PERIMETER_GAP_CODES.p7_1_003.full, "A7_1_PERIMETER_ASSURANCE_ABSENT");
  assert.equal(content.PHYSICAL_SECURITY_PERIMETER_GAP_CODES.p7_1_004_third_party.partial, "A7_1_THIRD_PARTY_PERIMETER_PARTIAL");
  assert.equal(content.PHYSICAL_SECURITY_PERIMETER_GAP_CODES.p7_1_004_third_party.full, "A7_1_THIRD_PARTY_PERIMETER_ABSENT");
});

runTest("question helpers return localized question", () => {
  const fr = content.getPhysicalSecurityPerimeterQuestion("p7_1_001", "fr");
  const en = content.getPhysicalSecurityPerimeterQuestion("p7_1_001", "en");
  assert.equal(fr.id, "p7_1_001");
  assert.equal(en.id, "p7_1_001");
  assert.notEqual(fr.question, en.question);
  assert.equal(content.isPhysicalSecurityPerimeterQuestion("p7_1_002"), true);
  assert.equal(content.isPhysicalSecurityPerimeterQuestion("p6_1_001"), false);
});

runTest("all questions are retrievable in both locales", () => {
  const allFr = content.getAllPhysicalSecurityPerimeterQuestions("fr");
  const allEn = content.getAllPhysicalSecurityPerimeterQuestions("en");
  assert.equal(allFr.length, 4);
  assert.equal(allEn.length, 4);
  assert.equal(allFr[0].question.length > 0, true);
});

runTest("plan code is exactly A7_1_PHYSICAL_SECURITY_PERIMETERS_PLAN", () => {
  const plan = remediation.derivePhysicalSecurityPerimetersRemediationPlan([], { hasPhysicalLocationsSupportingScope: "yes" });
  assert.equal(plan.planCode, content.PHYSICAL_SECURITY_PERIMETERS_PLAN_CODE);
});

runTest("resolve with no context is unresolved + blocked", () => {
  const resolution = content.resolvePhysicalSecurityPerimeterQuestions();
  assert.equal(resolution.controlApplicability, "unresolved");
  assert.equal(resolution.controlReviewState, "clarification_required");
  assert.equal(resolution.assessmentBlocked, true);
  assert.equal(resolution.questionIds.length, 0);
  assert.deepEqual(resolution.hiddenQuestionIds.sort(), [...expectedQuestionIds].sort());
  assertDeepEqualSorted(resolution.unresolvedConditions, ["hasPhysicalLocationsSupportingScope", "usesThirdPartyManagedPremises"]);
});

runTest("resolve with hasPhysicalLocationsSupportingScope=yes and third-party=no", () => {
  const resolution = content.resolvePhysicalSecurityPerimeterQuestions({
    hasPhysicalLocationsSupportingScope: "yes",
    usesThirdPartyManagedPremises: "no",
  });
  assert.equal(resolution.controlApplicability, "applicable");
  assert.equal(resolution.controlReviewState, "none");
  assert.equal(resolution.assessmentBlocked, false);
  assertDeepEqualSorted(resolution.questionIds, ["p7_1_001", "p7_1_002", "p7_1_003"]);
  assert.deepEqual(resolution.hiddenQuestionIds, ["p7_1_004_third_party"]);
  assert.deepEqual(resolution.unresolvedConditions, []);
});

runTest("resolve with hasPhysicalLocationsSupportingScope=yes and third-party=yes", () => {
  const resolution = content.resolvePhysicalSecurityPerimeterQuestions({
    hasPhysicalLocationsSupportingScope: "yes",
    usesThirdPartyManagedPremises: "yes",
  });
  assertDeepEqualSorted(resolution.questionIds, expectedQuestionIds);
  assert.deepEqual(resolution.hiddenQuestionIds, []);
  assert.deepEqual(resolution.unresolvedConditions, []);
});

runTest("resolve with hasPhysicalLocationsSupportingScope=no sets control not applicable", () => {
  const resolution = content.resolvePhysicalSecurityPerimeterQuestions({
    hasPhysicalLocationsSupportingScope: "no",
  });
  assert.equal(resolution.controlApplicability, "not_applicable");
  assert.equal(resolution.controlReviewState, "applicability_review_required");
  assert.equal(resolution.requiresControlJustification, true);
  assert.equal(resolution.assessmentBlocked, true);
  assert.deepEqual(resolution.questionIds, []);
  assertDeepEqualSorted(resolution.hiddenQuestionIds, expectedQuestionIds);
});

runTest("derive plan when control not applicable without justification is blocked", () => {
  const plan = remediation.derivePhysicalSecurityPerimetersRemediationPlan(
    [
      {
        questionId: "p7_1_004_third_party",
        answer: "not_implemented",
        hasEvidence: true,
        justification: "legacy",
      },
    ],
    { hasPhysicalLocationsSupportingScope: "no" },
  );
  assert.equal(plan.assessmentBlocked, true);
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.visibleQuestionIds.length, 0);
  assert.equal(plan.hiddenQuestionIds.length, 4);
  assert.equal(plan.clarifications.length, 0);
  assert.deepEqual(plan.applicabilityReviews, []);
});

runTest("derive plan when control not applicable with justification is not blocked", () => {
  const plan = remediation.derivePhysicalSecurityPerimetersRemediationPlan(
    [],
    { hasPhysicalLocationsSupportingScope: "no" },
    "P�rim�tres hors scope par d�cision de l'organisation",
  );
  assert.equal(plan.assessmentBlocked, false);
  assert.equal(plan.controlApplicability, "not_applicable");
  assert.equal(plan.controlReviewState, "applicability_review_required");
  assert.equal(plan.requiresControlJustification, true);
  assert.equal(plan.activeActions.length, 0);
});

runTest("derive plan with unresolved context adds no actions", () => {
  const plan = remediation.derivePhysicalSecurityPerimetersRemediationPlan(
    [
      {
        questionId: "p7_1_001",
        answer: "not_implemented",
        hasEvidence: true,
        justification: "x",
      },
    ],
    {},
  );
  assert.equal(plan.controlApplicability, "unresolved");
  assert.equal(plan.controlReviewState, "clarification_required");
  assert.equal(plan.assessmentBlocked, true);
  assert.deepEqual(plan.activeActions, []);
});

runTest("implemented response creates no action", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p7_1_001",
    answer: "implemented",
    hasEvidence: false,
    justification: "ok",
  });
  assert.equal(outcome.gapLevel, "no_gap");
  const plan = remediation.derivePhysicalSecurityPerimetersRemediationPlan(
    [{ questionId: "p7_1_001", answer: "implemented", hasEvidence: false, justification: "ok" }],
    { hasPhysicalLocationsSupportingScope: "yes" },
  );
  assert.equal(plan.activeActions.length, 0);
});

runTest("partially_implemented mapping -> partial gap and expected action", () => {
  const mapping = [
    ["p7_1_001", "P7.1-A01", content.PHYSICAL_SECURITY_PERIMETER_GAP_CODES.p7_1_001.partial],
    ["p7_1_002", "P7.1-A02", content.PHYSICAL_SECURITY_PERIMETER_GAP_CODES.p7_1_002.partial],
    ["p7_1_003", "P7.1-A03", content.PHYSICAL_SECURITY_PERIMETER_GAP_CODES.p7_1_003.partial],
    ["p7_1_004_third_party", "P7.1-A04", content.PHYSICAL_SECURITY_PERIMETER_GAP_CODES.p7_1_004_third_party.partial],
  ];
  for (const [questionId, actionCode, gapCode] of mapping) {
    const outcome = outcomes.deriveAssessmentOutcome({
      questionId,
      answer: "partially_implemented",
      hasEvidence: true,
      justification: "ok",
    });
    assert.equal(outcome.gapLevel, "partial_gap");
    const plan = remediation.derivePhysicalSecurityPerimetersRemediationPlan(
      [
        {
          questionId,
          answer: "partially_implemented",
          hasEvidence: true,
          justification: "ok",
        },
      ],
      { hasPhysicalLocationsSupportingScope: "yes", usesThirdPartyManagedPremises: "yes" },
    );
    assert.equal(plan.activeActions.length, 1);
    assert.equal(plan.activeActions[0].actionCode, actionCode);
    assert.equal(plan.activeActions[0].gapType, "partial");
    assert.equal(plan.activeActions[0].gapCode, gapCode);
  }
});

runTest("not_implemented mapping -> full gap and expected action", () => {
  const mapping = [
    ["p7_1_001", "P7.1-A01", content.PHYSICAL_SECURITY_PERIMETER_GAP_CODES.p7_1_001.full],
    ["p7_1_002", "P7.1-A02", content.PHYSICAL_SECURITY_PERIMETER_GAP_CODES.p7_1_002.full],
    ["p7_1_003", "P7.1-A03", content.PHYSICAL_SECURITY_PERIMETER_GAP_CODES.p7_1_003.full],
    ["p7_1_004_third_party", "P7.1-A04", content.PHYSICAL_SECURITY_PERIMETER_GAP_CODES.p7_1_004_third_party.full],
  ];
  for (const [questionId, actionCode, gapCode] of mapping) {
    const outcome = outcomes.deriveAssessmentOutcome({
      questionId,
      answer: "not_implemented",
      hasEvidence: true,
      justification: "ok",
    });
    assert.equal(outcome.gapLevel, "full_gap");
    const plan = remediation.derivePhysicalSecurityPerimetersRemediationPlan(
      [
        {
          questionId,
          answer: "not_implemented",
          hasEvidence: true,
          justification: "ok",
        },
      ],
      { hasPhysicalLocationsSupportingScope: "yes", usesThirdPartyManagedPremises: "yes" },
    );
    const targetAction = plan.activeActions.find((action) => action.actionCode === actionCode);
    assert.equal(typeof targetAction, "object");
    assert.equal(targetAction?.gapType, "full");
    assert.equal(targetAction?.gapCode, gapCode);
  }
});

runTest("not_sure does not create a remediation action but asks clarification", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p7_1_002",
    answer: "not_sure",
    hasEvidence: false,
    justification: "waiting",
  });
  assert.equal(outcome.reviewState, "clarification_required");
  const plan = remediation.derivePhysicalSecurityPerimetersRemediationPlan(
    [{ questionId: "p7_1_002", answer: "not_sure", justification: "waiting" }],
    { hasPhysicalLocationsSupportingScope: "yes", usesThirdPartyManagedPremises: "no" },
  );
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.clarifications.some((item) => item.questionId === "p7_1_002"), true);
});

runTest("not_applicable without justification is invalid", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p7_1_002",
    answer: "not_applicable",
    hasEvidence: false,
    justification: "",
  });
  assert.equal(outcome.isValid, false);
  const outcome2 = outcomes.deriveAssessmentOutcome({
    questionId: "p7_1_002",
    answer: "not_applicable",
    hasEvidence: false,
    justification: "   ",
  });
  assert.equal(outcome2.isValid, false);
});

runTest("not_applicable with valid justification is applicability review", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p7_1_002",
    answer: "not_applicable",
    hasEvidence: true,
    justification: "Scope limited by facility risk policy.",
  });
  assert.equal(outcome.isValid, true);
  assert.equal(outcome.reviewState, "applicability_review_required");
  const plan = remediation.derivePhysicalSecurityPerimetersRemediationPlan(
    [
      {
        questionId: "p7_1_002",
        answer: "not_applicable",
        hasEvidence: true,
        justification: "Scope limited by facility risk policy.",
      },
    ],
    { hasPhysicalLocationsSupportingScope: "yes", usesThirdPartyManagedPremises: "no" },
  );
  assert.equal(plan.activeActions.length, 0);
  assert.deepEqual(plan.clarifications, []);
});

runTest("evidenceStatus defaults and preserves all explicit states", () => {
  const outcomeNoEvidence = outcomes.deriveAssessmentOutcome({
    questionId: "p7_1_001",
    answer: "implemented",
    hasEvidence: false,
    justification: "x",
  });
  assert.equal(outcomeNoEvidence.evidenceStatus, "not_provided");

  const outcomeProvided = outcomes.deriveAssessmentOutcome({
    questionId: "p7_1_001",
    answer: "implemented",
    hasEvidence: true,
    evidenceStatus: "provided",
    justification: "x",
  });
  assert.equal(outcomeProvided.evidenceStatus, "provided");

  const outcomeValidated = outcomes.deriveAssessmentOutcome({
    questionId: "p7_1_001",
    answer: "implemented",
    hasEvidence: true,
    evidenceStatus: "validated",
    justification: "x",
  });
  assert.equal(outcomeValidated.evidenceStatus, "validated");

  const outcomeRejected = outcomes.deriveAssessmentOutcome({
    questionId: "p7_1_001",
    answer: "partially_implemented",
    hasEvidence: true,
    evidenceStatus: "rejected",
    justification: "x",
  });
  assert.equal(outcomeRejected.evidenceStatus, "rejected");
});

runTest("old hidden conditional response is ignored when condition is no", () => {
  const plan = remediation.derivePhysicalSecurityPerimetersRemediationPlan(
    [
      {
        questionId: "p7_1_004_third_party",
        answer: "not_implemented",
        hasEvidence: true,
        justification: "legacy",
      },
    ],
    { hasPhysicalLocationsSupportingScope: "yes", usesThirdPartyManagedPremises: "no" },
  );
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.visibleQuestionIds.includes("p7_1_004_third_party"), false);
});

runTest("latest response per question is kept", () => {
  const plan = remediation.derivePhysicalSecurityPerimetersRemediationPlan(
    [
      {
        questionId: "p7_1_003",
        answer: "not_implemented",
        hasEvidence: true,
        justification: "old",
      },
      {
        questionId: "p7_1_003",
        answer: "implemented",
        hasEvidence: false,
        justification: "new",
      },
    ],
    { hasPhysicalLocationsSupportingScope: "yes", usesThirdPartyManagedPremises: "no" },
  );
  assert.equal(plan.activeActions.length, 0);
});

runTest("duplicate answers deduplicate one action", () => {
  const plan = remediation.derivePhysicalSecurityPerimetersRemediationPlan(
    [
      { questionId: "p7_1_001", answer: "not_implemented", hasEvidence: true, justification: "first" },
      { questionId: "p7_1_001", answer: "not_implemented", hasEvidence: true, justification: "last" },
    ],
    { hasPhysicalLocationsSupportingScope: "yes", usesThirdPartyManagedPremises: "no" },
  );
  assert.equal(plan.activeActions.length, 1);
  assert.equal(plan.activeActions[0].actionCode, "P7.1-A01");
});

runTest("implemented again removes action", () => {
  const plan = remediation.derivePhysicalSecurityPerimetersRemediationPlan(
    [
      { questionId: "p7_1_002", answer: "not_implemented", hasEvidence: true, justification: "first" },
      { questionId: "p7_1_002", answer: "implemented", hasEvidence: true, justification: "later" },
    ],
    { hasPhysicalLocationsSupportingScope: "yes", usesThirdPartyManagedPremises: "no" },
  );
  assert.equal(plan.activeActions.length, 0);
});

runTest("partial then full updates same action", () => {
  const plan = remediation.derivePhysicalSecurityPerimetersRemediationPlan(
    [
      { questionId: "p7_1_002", answer: "partially_implemented", hasEvidence: true, justification: "partial" },
      { questionId: "p7_1_002", answer: "not_implemented", hasEvidence: true, justification: "full" },
    ],
    { hasPhysicalLocationsSupportingScope: "yes", usesThirdPartyManagedPremises: "no" },
  );
  assert.equal(plan.activeActions.length, 1);
  assert.equal(plan.activeActions[0].actionCode, "P7.1-A02");
  assert.equal(plan.activeActions[0].gapType, "full");
  assert.equal(plan.activeActions[0].gapCode, content.PHYSICAL_SECURITY_PERIMETER_GAP_CODES.p7_1_002.full);
});

runTest("all action codes are exactly expected in full-block set", () => {
  const plan = remediation.derivePhysicalSecurityPerimetersRemediationPlan(
    [
      { questionId: "p7_1_001", answer: "not_implemented", hasEvidence: true, justification: "x" },
      { questionId: "p7_1_002", answer: "not_implemented", hasEvidence: true, justification: "x" },
      { questionId: "p7_1_003", answer: "not_implemented", hasEvidence: true, justification: "x" },
      { questionId: "p7_1_004_third_party", answer: "not_implemented", hasEvidence: true, justification: "x" },
    ],
    { hasPhysicalLocationsSupportingScope: "yes", usesThirdPartyManagedPremises: "yes" },
  );
  assertDeepEqualSorted(plan.activeActions.map((action) => action.actionCode), expectedActionCodes);
});

runTest("deterministic output for same input", () => {
  const input = [
    { questionId: "p7_1_001", answer: "not_implemented", hasEvidence: true, justification: "x" },
    { questionId: "p7_1_002", answer: "partially_implemented", hasEvidence: false, justification: "y" },
    { questionId: "p7_1_003", answer: "implemented", hasEvidence: false, justification: "z" },
  ];
  const first = remediation.derivePhysicalSecurityPerimetersRemediationPlan(input, {
    hasPhysicalLocationsSupportingScope: "yes",
    usesThirdPartyManagedPremises: "yes",
  });
  const second = remediation.derivePhysicalSecurityPerimetersRemediationPlan(input, {
    hasPhysicalLocationsSupportingScope: "yes",
    usesThirdPartyManagedPremises: "yes",
  });
  assert.deepEqual(first, second);
});

runTest("deriveAssessmentOutcome is deterministic for identical data", () => {
  const outcome1 = outcomes.deriveAssessmentOutcome({
    questionId: "p7_1_001",
    answer: "partially_implemented",
    hasEvidence: true,
    justification: "x",
  });
  const outcome2 = outcomes.deriveAssessmentOutcome({
    questionId: "p7_1_001",
    answer: "partially_implemented",
    hasEvidence: true,
    justification: "x",
  });
  assert.deepEqual(outcome1, outcome2);
});

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("All A.7.1 Physical Security Perimeters QA checks passed.");


