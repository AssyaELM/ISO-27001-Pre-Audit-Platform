import assert from "node:assert/strict";

import * as infra from "../content/assessment-infrastructure.ts";
import * as content from "../content/assessment/people/confidentiality-agreements.ts";
import * as outcomes from "../lib/assessment/outcomes.ts";
import * as remediation from "../lib/assessment/confidentiality-agreements.ts";

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

function sorted(values) {
  return [...values].sort();
}

function ensureNoPhrase(text, phrase, message) {
  assert.ok(!text.toLowerCase().includes(phrase.toLowerCase()), message);
}

const expectedAnswerValues = [
  "implemented",
  "partially_implemented",
  "not_implemented",
  "not_sure",
  "not_applicable",
];

const expectedIds = ["p6_6_001", "p6_6_002", "p6_6_003", "p6_6_004_external"];
const expectedActionCodes = ["P6.6-A01", "P6.6-A02", "P6.6-A03", "P6.6-A04"];
const conditionalId = "p6_6_004_external";

runTest("exact four IDs are present", () => {
  assert.deepEqual(sorted(content.confidentialityAgreementsQuestions.map((q) => q.id)), sorted(expectedIds));
});

runTest("exactly four definitions", () => {
  assert.equal(content.confidentialityAgreementsQuestions.length, 4);
});

runTest("three mandatory questions and one conditional exist", () => {
  const mandatory = content.confidentialityAgreementsQuestions.filter((q) => q.category === "mandatory").map((q) => q.id);
  assert.deepEqual(sorted(mandatory), sorted(["p6_6_001", "p6_6_002", "p6_6_003"]));
  const conditional = content.confidentialityAgreementsQuestions.filter((q) => q.category === "conditional_external").map((q) => q.id);
  assert.deepEqual(conditional, [conditionalId]);
});

runTest("each definition has FR and EN question/help/evidence", () => {
  for (const question of content.confidentialityAgreementsQuestions) {
    assert.ok(typeof question.question.fr === "string" && question.question.fr.length > 0);
    assert.ok(typeof question.question.en === "string" && question.question.en.length > 0);
    assert.ok(typeof question.helpText.fr === "string" && question.helpText.fr.length > 0);
    assert.ok(typeof question.helpText.en === "string" && question.helpText.en.length > 0);
    assert.ok(Array.isArray(question.evidenceHints.fr) && question.evidenceHints.fr.length > 0);
    assert.ok(Array.isArray(question.evidenceHints.en) && question.evidenceHints.en.length > 0);
    assert.deepEqual(question.responseOptions, expectedAnswerValues);
  }
});

runTest("legal notice exists in FR and EN", () => {
  assert.ok(typeof content.confidentialityAgreementsLegalNotice.fr === "string");
  assert.ok(typeof content.confidentialityAgreementsLegalNotice.en === "string");
  assert.ok(content.confidentialityAgreementsLegalNotice.fr.length > 0);
  assert.ok(content.confidentialityAgreementsLegalNotice.en.length > 0);
});

runTest("technical answers are exact supported values", () => {
  assert.deepEqual(infra.assessmentAnswerValues, expectedAnswerValues);
});

runTest("not_assessed is never a selectable answer", () => {
  assert.equal(infra.assessmentAnswerValues.includes("not_assessed"), false);
});

runTest("without context returns only 3 mandatory and unresolved condition", () => {
  const resolution = content.resolveConfidentialityAgreementsQuestions({});
  assert.deepEqual(sorted(resolution.questionIds), sorted(["p6_6_001", "p6_6_002", "p6_6_003"]));
  assert.deepEqual(sorted(resolution.hiddenQuestionIds), [conditionalId]);
  assert.deepEqual(sorted(resolution.unresolvedConditions), ["hasRelevantExternalParties"]);
});

runTest("hasRelevantExternalParties yes returns four questions", () => {
  const resolution = content.resolveConfidentialityAgreementsQuestions({ hasRelevantExternalParties: "yes" });
  assert.equal(resolution.questionIds.length, 4);
  assert.equal(resolution.questionIds.includes(conditionalId), true);
  assert.equal(resolution.hiddenQuestionIds.length, 0);
  assert.equal(resolution.unresolvedConditions.length, 0);
});

runTest("hasRelevantExternalParties no hides conditional and unresolved empty", () => {
  const resolution = content.resolveConfidentialityAgreementsQuestions({ hasRelevantExternalParties: "no" });
  assert.deepEqual(sorted(resolution.questionIds), sorted(["p6_6_001", "p6_6_002", "p6_6_003"]));
  assert.deepEqual(sorted(resolution.hiddenQuestionIds), [conditionalId]);
  assert.deepEqual(resolution.unresolvedConditions, []);
});

runTest("hasRelevantExternalParties not_sure hides conditional and unresolved condition", () => {
  const resolution = content.resolveConfidentialityAgreementsQuestions({ hasRelevantExternalParties: "not_sure" });
  assert.deepEqual(sorted(resolution.questionIds), sorted(["p6_6_001", "p6_6_002", "p6_6_003"]));
  assert.deepEqual(sorted(resolution.hiddenQuestionIds), [conditionalId]);
  assert.deepEqual(sorted(resolution.unresolvedConditions), ["hasRelevantExternalParties"]);
});

runTest("implemented maps no gap and no action", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_6_001",
    answer: "implemented",
    hasEvidence: false,
    justification: "ok",
  });
  assert.equal(outcome.gapLevel, "no_gap");
  assert.equal(outcome.reviewState, "none");
  const plan = remediation.deriveConfidentialityAgreementsRemediationPlan(
    [{ questionId: "p6_6_001", answer: "implemented", hasEvidence: true, justification: "ok" }],
    { hasRelevantExternalParties: "no" },
  );
  assert.equal(plan.activeActions.length, 0);
});

runTest("partially_implemented exact mapping + action codes", () => {
  const mapping = [
    ["p6_6_001", "P6.6-A01", content.CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_001.partial],
    ["p6_6_002", "P6.6-A02", content.CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_002.partial],
    ["p6_6_003", "P6.6-A03", content.CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_003.partial],
    ["p6_6_004_external", "P6.6-A04", content.CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_004_external.partial],
  ];
  for (const [questionId, actionCode, expectedGapCode] of mapping) {
    const plan = remediation.deriveConfidentialityAgreementsRemediationPlan(
      [{ questionId, answer: "partially_implemented", hasEvidence: true, justification: "ok" }],
      questionId === conditionalId ? { hasRelevantExternalParties: "yes" } : {},
    );
    assert.equal(plan.activeActions.length, 1);
    assert.equal(plan.activeActions[0].actionCode, actionCode);
    assert.equal(plan.activeActions[0].gapType, "partial");
    assert.equal(plan.activeActions[0].gapCode, expectedGapCode);
  }
});

runTest("not_implemented exact mapping + action codes", () => {
  const mapping = [
    ["p6_6_001", "P6.6-A01", content.CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_001.full],
    ["p6_6_002", "P6.6-A02", content.CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_002.full],
    ["p6_6_003", "P6.6-A03", content.CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_003.full],
    ["p6_6_004_external", "P6.6-A04", content.CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_004_external.full],
  ];
  for (const [questionId, actionCode, expectedGapCode] of mapping) {
    const plan = remediation.deriveConfidentialityAgreementsRemediationPlan(
      [{ questionId, answer: "not_implemented", hasEvidence: true, justification: "ok" }],
      questionId === conditionalId ? { hasRelevantExternalParties: "yes" } : {},
    );
    assert.equal(plan.activeActions.length, 1);
    assert.equal(plan.activeActions[0].actionCode, actionCode);
    assert.equal(plan.activeActions[0].gapType, "full");
    assert.equal(plan.activeActions[0].gapCode, expectedGapCode);
  }
});

runTest("not_sure creates only clarification and no action", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_6_002",
    answer: "not_sure",
    hasEvidence: false,
    justification: "need context",
  });
  assert.equal(outcome.reviewState, "clarification_required");
  const plan = remediation.deriveConfidentialityAgreementsRemediationPlan([
    { questionId: "p6_6_002", answer: "not_sure", justification: "need context" },
  ]);
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.clarifications.some((entry) => entry.questionId === "p6_6_002"), true);
});

runTest("not_applicable requires non-empty justification and creates applicability review", () => {
  const outcomeEmpty = outcomes.deriveAssessmentOutcome({
    questionId: "p6_6_001",
    answer: "not_applicable",
    hasEvidence: false,
  });
  assert.equal(outcomeEmpty.isValid, false);

  const outcomeSpaces = outcomes.deriveAssessmentOutcome({
    questionId: "p6_6_001",
    answer: "not_applicable",
    hasEvidence: false,
    justification: "   ",
  });
  assert.equal(outcomeSpaces.isValid, false);

  const outcomeOk = outcomes.deriveAssessmentOutcome({
    questionId: "p6_6_001",
    answer: "not_applicable",
    hasEvidence: true,
    justification: "Scope is not applicable for current legal setup.",
  });
  assert.equal(outcomeOk.reviewState, "applicability_review_required");
  const plan = remediation.deriveConfidentialityAgreementsRemediationPlan([
    {
      questionId: "p6_6_001",
      answer: "not_applicable",
      hasEvidence: true,
      justification: "Scope is not applicable for current legal setup.",
    },
  ]);
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.applicabilityReviews.includes("p6_6_001"), true);
});

runTest("evidence status defaults and preserves validated and rejected", () => {
  const noEvidence = outcomes.deriveAssessmentOutcome({
    questionId: "p6_6_002",
    answer: "implemented",
    hasEvidence: false,
    justification: "ok",
  });
  assert.equal(noEvidence.evidenceStatus, "not_provided");

  const provided = outcomes.deriveAssessmentOutcome({
    questionId: "p6_6_003",
    answer: "implemented",
    hasEvidence: true,
    evidenceStatus: "provided",
    justification: "ok",
  });
  assert.equal(provided.evidenceStatus, "provided");

  const validated = outcomes.deriveAssessmentOutcome({
    questionId: "p6_6_003",
    answer: "partially_implemented",
    hasEvidence: true,
    evidenceStatus: "validated",
    justification: "ok",
  });
  assert.equal(validated.evidenceStatus, "validated");

  const rejected = outcomes.deriveAssessmentOutcome({
    questionId: "p6_6_003",
    answer: "implemented",
    hasEvidence: true,
    evidenceStatus: "rejected",
    justification: "ok",
  });
  assert.equal(rejected.evidenceStatus, "rejected");
});

runTest("hidden conditional old response ignored", () => {
  const plan = remediation.deriveConfidentialityAgreementsRemediationPlan(
    [{ questionId: conditionalId, answer: "not_implemented", hasEvidence: true, justification: "legacy" }],
    { hasRelevantExternalParties: "no" },
  );
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.clarifications.length, 0);
});

runTest("last response per question is used", () => {
  const plan = remediation.deriveConfidentialityAgreementsRemediationPlan(
    [
      { questionId: "p6_6_001", answer: "not_implemented", hasEvidence: true, justification: "old" },
      { questionId: "p6_6_001", answer: "implemented", hasEvidence: true, justification: "new" },
    ],
    {},
  );
  assert.equal(plan.activeActions.length, 0);
});

runTest("active actions are deduplicated and updated by gap progression", () => {
  const plan = remediation.deriveConfidentialityAgreementsRemediationPlan(
    [
      { questionId: "p6_6_002", answer: "not_implemented", hasEvidence: true, justification: "old" },
      { questionId: "p6_6_002", answer: "not_implemented", hasEvidence: true, justification: "new" },
      { questionId: "p6_6_002", answer: "partially_implemented", hasEvidence: true, justification: "improved" },
    ],
    {},
  );
  assert.equal(plan.activeActions.length, 1);
  assert.equal(plan.activeActions[0].actionCode, "P6.6-A02");
  assert.equal(plan.activeActions[0].gapType, "partial");
  const planFull = remediation.deriveConfidentialityAgreementsRemediationPlan(
    [
      { questionId: "p6_6_002", answer: "partially_implemented", hasEvidence: true, justification: "improved" },
      { questionId: "p6_6_002", answer: "not_implemented", hasEvidence: true, justification: "full" },
    ],
    {},
  );
  assert.equal(planFull.activeActions.length, 1);
  assert.equal(planFull.activeActions[0].gapType, "full");
  assert.equal(planFull.activeActions[0].gapCode, content.CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_002.full);
});

runTest("implemented after full removes action", () => {
  const plan = remediation.deriveConfidentialityAgreementsRemediationPlan(
    [
      { questionId: "p6_6_003", answer: "not_implemented", hasEvidence: true, justification: "old" },
      { questionId: "p6_6_003", answer: "implemented", hasEvidence: true, justification: "resolved" },
    ],
    {},
  );
  assert.equal(plan.activeActions.length, 0);
});

runTest("questionnaire resolves plan code and action set exact", () => {
  const plan = remediation.deriveConfidentialityAgreementsRemediationPlan(
    [
      { questionId: "p6_6_001", answer: "not_implemented", hasEvidence: true, justification: "x" },
      { questionId: "p6_6_002", answer: "not_implemented", hasEvidence: true, justification: "x" },
      { questionId: "p6_6_003", answer: "not_implemented", hasEvidence: true, justification: "x" },
      { questionId: "p6_6_004_external", answer: "not_implemented", hasEvidence: true, justification: "x" },
    ],
    { hasRelevantExternalParties: "yes" },
  );
  assert.equal(plan.planCode, content.CONFIDENTIALITY_AGREEMENTS_PLAN_CODE);
  assert.deepEqual(sorted(plan.activeActions.map((item) => item.actionCode)), expectedActionCodes);
  assert.equal(plan.activeActions.length, 4);
});

runTest("conditional no generates clarification for unresolved condition", () => {
  const plan = remediation.deriveConfidentialityAgreementsRemediationPlan([], {});
  assert.equal(plan.unresolvedConditions.length, 1);
  assert.equal(plan.clarifications.length, 1);
  assert.equal(plan.clarifications[0].questionId, conditionalId);
});

runTest("no universal NDA or annual review constraints are encoded", () => {
  const concatenated = JSON.stringify(content.confidentialityAgreementsQuestions);
  ensureNoPhrase(concatenated, "NDA autonome obligatoire", "Universal standalone NDA constraint should not be required.");
  ensureNoPhrase(concatenated, "annual review", "Universal annual review constraint should not be required.");
  ensureNoPhrase(concatenated, "electronic signature required", "Universal electronic signature constraint should not be required.");
  ensureNoPhrase(concatenated, "docuSign", "No specific signature tool should be imposed.");
});

runTest("helpers: get and checks", () => {
  const qFr = content.getConfidentialityAgreementQuestion("p6_6_001", "fr");
  const qEn = content.getConfidentialityAgreementQuestion("p6_6_001", "en");
  assert.equal(qFr.id, "p6_6_001");
  assert.equal(qEn.id, "p6_6_001");
  assert.notEqual(qFr.question, qEn.question);
  assert.equal(content.isConfidentialityAgreementsQuestion("p6_6_002"), true);
  assert.equal(content.isConfidentialityAgreementsQuestion("p6_4_001"), false);
});

runTest("all questions returned by getAll", () => {
  const all = content.getAllConfidentialityAgreementsQuestions("en");
  assert.equal(all.length, 4);
  assert.deepEqual(all.map((question) => question.id).sort(), sorted(expectedIds));
});

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("All assessment A.6.6 QA checks passed.");

