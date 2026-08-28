import assert from "node:assert/strict";

import * as infrastructure from "../content/assessment-infrastructure.ts";
import * as content from "../content/assessment/people/post-employment-responsibilities.ts";
import * as outcomes from "../lib/assessment/outcomes.ts";
import * as remediation from "../lib/assessment/post-employment-responsibilities.ts";

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

const expectedIds = [
  "p6_5_001",
  "p6_5_002",
  "p6_5_003",
  "p6_5_004_role_change",
  "p6_5_005_external",
];

const mandatoryIds = ["p6_5_001", "p6_5_002", "p6_5_003"];
const conditionalRoleChangeId = "p6_5_004_role_change";
const conditionalExternalId = "p6_5_005_external";

const expectedActionCodes = ["P6.5-A01", "P6.5-A02", "P6.5-A03", "P6.5-A04", "P6.5-A05"];
const expectedPlanCode = content.POST_EMPLOYMENT_RESPONSIBILITIES_PLAN_CODE;

runTest("exact five IDs are present", () => {
  assert.deepEqual(sorted(content.postEmploymentResponsibilitiesQuestions.map((q) => q.id)), sorted(expectedIds));
});

runTest("exact five IDs expected for A.6.5 only", () => {
  assert.equal(content.postEmploymentResponsibilitiesQuestions.length, 5);
  for (const questionId of expectedIds) {
    assert.ok(content.postEmploymentResponsibilitiesQuestionIds.mandatory.includes(questionId) || [conditionalRoleChangeId, conditionalExternalId].includes(questionId));
  }
});

runTest("three mandatory questions exist", () => {
  const mandatory = content.postEmploymentResponsibilitiesQuestions.filter((q) => q.category === "mandatory").map((q) => q.id);
  assert.deepEqual(sorted(mandatory), sorted(mandatoryIds));
});

runTest("conditional questions exist and are mapped", () => {
  const conditional = content.postEmploymentResponsibilitiesQuestions.filter((q) => q.category !== "mandatory");
  const conditionalIds = conditional.map((q) => q.id).sort();
  assert.deepEqual(conditionalIds, [conditionalRoleChangeId, conditionalExternalId].sort());
  assert.equal(content.postEmploymentResponsibilitiesQuestionIds.conditionalRoleChange, conditionalRoleChangeId);
  assert.equal(content.postEmploymentResponsibilitiesQuestionIds.conditionalExternal, conditionalExternalId);
});

runTest("each definition has FR and EN question/help/evidence", () => {
  for (const question of content.postEmploymentResponsibilitiesQuestions) {
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
  assert.ok(typeof content.postEmploymentResponsibilitiesLegalNotice.fr === "string");
  assert.ok(typeof content.postEmploymentResponsibilitiesLegalNotice.en === "string");
  assert.ok(content.postEmploymentResponsibilitiesLegalNotice.fr.length > 0);
  assert.ok(content.postEmploymentResponsibilitiesLegalNotice.en.length > 0);
});

runTest("no A.6.6+ ids are introduced", () => {
  const invalid = content.postEmploymentResponsibilitiesQuestions.some((q) => /^p6_[6-9]_/.test(q.id));
  assert.equal(invalid, false);
});

runTest("technical answers are exact supported values", () => {
  assert.deepEqual(infrastructure.assessmentAnswerValues, expectedAnswerValues);
});

runTest("not_assessed is never a selectable answer", () => {
  assert.equal(infrastructure.assessmentAnswerValues.includes("not_assessed"), false);
});

runTest("resolve without context returns only mandatory questions and unresolved 2 conditions", () => {
  const resolution = content.resolvePostEmploymentResponsibilitiesQuestions({});
  assert.deepEqual(sorted(resolution.questionIds), sorted(mandatoryIds));
  assert.deepEqual(sorted(resolution.hiddenQuestionIds), sorted([conditionalRoleChangeId, conditionalExternalId]));
  assert.deepEqual(sorted(resolution.unresolvedConditions), ["hasEmploymentRoleChanges", "hasRelevantExternalParties"].sort());
});

runTest("hasEmploymentRoleChanges yes adds only role-change conditionally question", () => {
  const resolution = content.resolvePostEmploymentResponsibilitiesQuestions({ hasEmploymentRoleChanges: "yes" });
  assert.deepEqual(
    resolution.questionIds.includes(conditionalRoleChangeId),
    true,
    "role-change conditional missing when yes",
  );
  assert.deepEqual(resolution.questionIds.includes(conditionalExternalId), false);
});

runTest("hasRelevantExternalParties yes adds only external conditional question", () => {
  const resolution = content.resolvePostEmploymentResponsibilitiesQuestions({ hasRelevantExternalParties: "yes" });
  assert.deepEqual(
    resolution.questionIds.includes(conditionalExternalId),
    true,
    "external conditional missing when yes",
  );
  assert.deepEqual(resolution.questionIds.includes(conditionalRoleChangeId), false);
});

runTest("both yes returns five selected questions", () => {
  const resolution = content.resolvePostEmploymentResponsibilitiesQuestions({
    hasEmploymentRoleChanges: "yes",
    hasRelevantExternalParties: "yes",
  });
  assert.equal(resolution.questionIds.length, 5);
});

runTest("no value hides conditional and adds no applicability review", () => {
  const resolution = content.resolvePostEmploymentResponsibilitiesQuestions({
    hasEmploymentRoleChanges: "no",
    hasRelevantExternalParties: "no",
  });
  assert.deepEqual(sorted(resolution.hiddenQuestionIds), sorted([conditionalRoleChangeId, conditionalExternalId]));
  assert.deepEqual(resolution.unresolvedConditions.length, 0);
});

runTest("not_sure keeps condition hidden and unresolved", () => {
  const resolution = content.resolvePostEmploymentResponsibilitiesQuestions({
    hasEmploymentRoleChanges: "not_sure",
    hasRelevantExternalParties: "not_sure",
  });
  assert.deepEqual(sorted(resolution.unresolvedConditions), ["hasEmploymentRoleChanges", "hasRelevantExternalParties"]);
  assert.deepEqual(sorted(resolution.hiddenQuestionIds), sorted([conditionalRoleChangeId, conditionalExternalId]));
});

runTest("implemented produces no_gap and no active action", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_5_001",
    answer: "implemented",
    hasEvidence: false,
    justification: "ok",
  });
  assert.equal(outcome.gapLevel, "no_gap");
  assert.equal(outcome.reviewState, "none");

  const plan = remediation.derivePostEmploymentResponsibilitiesRemediationPlan(
    [{ questionId: "p6_5_001", answer: "implemented", hasEvidence: true, justification: "ok" }],
    { hasEmploymentRoleChanges: "no", hasRelevantExternalParties: "no" },
  );
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.applicabilityReviews.length, 0);
});

runTest("partially_implemented maps exact gap + action code", () => {
  const mapping = [
    ["p6_5_001", "P6.5-A01", content.POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_001.partial],
    ["p6_5_002", "P6.5-A02", content.POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_002.partial],
    ["p6_5_003", "P6.5-A03", content.POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_003.partial],
    ["p6_5_004_role_change", "P6.5-A04", content.POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_004_role_change.partial],
    ["p6_5_005_external", "P6.5-A05", content.POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_005_external.partial],
  ];
  for (const [questionId, actionCode, expectedGapCode] of mapping) {
    const context =
      questionId === "p6_5_004_role_change"
        ? { hasEmploymentRoleChanges: "yes", hasRelevantExternalParties: "no" }
        : questionId === "p6_5_005_external"
          ? { hasEmploymentRoleChanges: "no", hasRelevantExternalParties: "yes" }
          : { hasEmploymentRoleChanges: "no", hasRelevantExternalParties: "no" };
    const outcome = outcomes.deriveAssessmentOutcome({
      questionId,
      answer: "partially_implemented",
      hasEvidence: true,
      justification: "ok",
    });
    assert.equal(outcome.gapLevel, "partial_gap");
    const plan = remediation.derivePostEmploymentResponsibilitiesRemediationPlan(
      [{ questionId, answer: "partially_implemented", hasEvidence: true, justification: "ok" }],
      context,
    );
    assert.equal(plan.activeActions.length, 1);
    assert.equal(plan.activeActions[0].actionCode, actionCode);
    assert.equal(plan.activeActions[0].gapType, "partial");
    assert.equal(plan.activeActions[0].gapCode, expectedGapCode);
  }
});

runTest("not_implemented maps exact gap + action code", () => {
  const mapping = [
    ["p6_5_001", "P6.5-A01", content.POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_001.full],
    ["p6_5_002", "P6.5-A02", content.POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_002.full],
    ["p6_5_003", "P6.5-A03", content.POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_003.full],
    ["p6_5_004_role_change", "P6.5-A04", content.POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_004_role_change.full],
    ["p6_5_005_external", "P6.5-A05", content.POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_005_external.full],
  ];
  for (const [questionId, actionCode, expectedGapCode] of mapping) {
    const context =
      questionId === "p6_5_004_role_change"
        ? { hasEmploymentRoleChanges: "yes", hasRelevantExternalParties: "no" }
        : questionId === "p6_5_005_external"
          ? { hasEmploymentRoleChanges: "no", hasRelevantExternalParties: "yes" }
          : { hasEmploymentRoleChanges: "no", hasRelevantExternalParties: "no" };
    const outcome = outcomes.deriveAssessmentOutcome({
      questionId,
      answer: "not_implemented",
      hasEvidence: true,
      justification: "ok",
    });
    assert.equal(outcome.gapLevel, "full_gap");
    const plan = remediation.derivePostEmploymentResponsibilitiesRemediationPlan(
      [{ questionId, answer: "not_implemented", hasEvidence: true, justification: "ok" }],
      context,
    );
    assert.equal(plan.activeActions.length, 1);
    assert.equal(plan.activeActions[0].actionCode, actionCode);
    assert.equal(plan.activeActions[0].gapType, "full");
    assert.equal(plan.activeActions[0].gapCode, expectedGapCode);
  }
});

runTest("not_sure creates clarification_required and no action", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_5_002",
    answer: "not_sure",
    hasEvidence: false,
    justification: "awaiting context",
  });
  assert.equal(outcome.reviewState, "clarification_required");
  const plan = remediation.derivePostEmploymentResponsibilitiesRemediationPlan([
    { questionId: "p6_5_002", answer: "not_sure", justification: "awaiting context" },
  ]);
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.clarifications.some((entry) => entry.questionId === "p6_5_002"), true);
  assert.equal(plan.applicabilityReviews.length, 0);
});

runTest("not_applicable requires non-empty justification", () => {
  const outcome1 = outcomes.deriveAssessmentOutcome({
    questionId: "p6_5_003",
    answer: "not_applicable",
    hasEvidence: false,
  });
  assert.equal(outcome1.isValid, false);
  const outcome2 = outcomes.deriveAssessmentOutcome({
    questionId: "p6_5_003",
    answer: "not_applicable",
    hasEvidence: false,
    justification: "   ",
  });
  assert.equal(outcome2.isValid, false);
});

runTest("not_applicable with justification creates applicability review and no action", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_5_003",
    answer: "not_applicable",
    hasEvidence: true,
    justification: "Covered by legal classification for this role.",
  });
  assert.equal(outcome.reviewState, "applicability_review_required");
  const plan = remediation.derivePostEmploymentResponsibilitiesRemediationPlan(
    [{ questionId: "p6_5_003", answer: "not_applicable", hasEvidence: true, justification: "Legal exception accepted." }],
    { hasEmploymentRoleChanges: "no", hasRelevantExternalParties: "no" },
  );
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.applicabilityReviews.includes("p6_5_003"), true);
});

runTest("evidence status defaults and preserves validated/rejected", () => {
  const noEvidence = outcomes.deriveAssessmentOutcome({
    questionId: "p6_5_001",
    answer: "implemented",
    hasEvidence: false,
    justification: "ok",
  });
  assert.equal(noEvidence.evidenceStatus, "not_provided");

  const provided = outcomes.deriveAssessmentOutcome({
    questionId: "p6_5_002",
    answer: "implemented",
    hasEvidence: true,
    evidenceStatus: "provided",
    justification: "ok",
  });
  assert.equal(provided.evidenceStatus, "provided");

  const validated = outcomes.deriveAssessmentOutcome({
    questionId: "p6_5_002",
    answer: "partially_implemented",
    hasEvidence: true,
    evidenceStatus: "validated",
    justification: "ok",
  });
  assert.equal(validated.evidenceStatus, "validated");

  const rejected = outcomes.deriveAssessmentOutcome({
    questionId: "p6_5_002",
    answer: "implemented",
    hasEvidence: true,
    evidenceStatus: "rejected",
    justification: "ok",
  });
  assert.equal(rejected.evidenceStatus, "rejected");
});

runTest("hidden conditional old response is ignored", () => {
  const plan = remediation.derivePostEmploymentResponsibilitiesRemediationPlan(
    [
      {
        questionId: "p6_5_004_role_change",
        answer: "not_implemented",
        hasEvidence: true,
        justification: "legacy response",
      },
    ],
    { hasEmploymentRoleChanges: "no", hasRelevantExternalParties: "no" },
  );
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.clarifications.length, 0);
});

runTest("last response per question is used", () => {
  const plan = remediation.derivePostEmploymentResponsibilitiesRemediationPlan(
    [
      { questionId: "p6_5_001", answer: "not_implemented", hasEvidence: true, justification: "old" },
      { questionId: "p6_5_001", answer: "implemented", hasEvidence: true, justification: "new" },
    ],
    { hasEmploymentRoleChanges: "no", hasRelevantExternalParties: "no" },
  );
  assert.equal(plan.activeActions.length, 0);
});

runTest("active actions are deduplicated per action code", () => {
  const plan = remediation.derivePostEmploymentResponsibilitiesRemediationPlan(
    [
      { questionId: "p6_5_002", answer: "not_implemented", hasEvidence: true, justification: "old" },
      { questionId: "p6_5_002", answer: "not_implemented", hasEvidence: true, justification: "new" },
      { questionId: "p6_5_002", answer: "partially_implemented", hasEvidence: true, justification: "again" },
    ],
    { hasEmploymentRoleChanges: "no", hasRelevantExternalParties: "no" },
  );
  assert.equal(plan.activeActions.length, 1);
});

runTest("implemented again removes prior remediation", () => {
  const plan = remediation.derivePostEmploymentResponsibilitiesRemediationPlan(
    [
      { questionId: "p6_5_003", answer: "not_implemented", hasEvidence: true, justification: "old" },
      { questionId: "p6_5_003", answer: "implemented", hasEvidence: true, justification: "resolved" },
    ],
    { hasEmploymentRoleChanges: "no", hasRelevantExternalParties: "no" },
  );
  assert.equal(plan.activeActions.length, 0);
});

runTest("partial to full updates same action", () => {
  const plan = remediation.derivePostEmploymentResponsibilitiesRemediationPlan(
    [
      { questionId: "p6_5_001", answer: "partially_implemented", hasEvidence: true, justification: "partial" },
      { questionId: "p6_5_001", answer: "not_implemented", hasEvidence: true, justification: "full" },
    ],
    { hasEmploymentRoleChanges: "no", hasRelevantExternalParties: "no" },
  );
  assert.equal(plan.activeActions.length, 1);
  assert.equal(plan.activeActions[0].actionCode, "P6.5-A01");
  assert.equal(plan.activeActions[0].gapType, "full");
  assert.equal(plan.activeActions[0].gapCode, content.POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_001.full);
});

runTest("unresolved conditional produces corresponding clarification", () => {
  const plan = remediation.derivePostEmploymentResponsibilitiesRemediationPlan(
    [],
    { hasEmploymentRoleChanges: "not_sure", hasRelevantExternalParties: "not_sure" },
  );
  assert.equal(plan.unresolvedConditions.length, 2);
  const ids = plan.unresolvedConditions.sort();
  assert.deepEqual(ids, ["hasEmploymentRoleChanges", "hasRelevantExternalParties"]);
  const expected = plan.clarifications.map((item) => item.questionId).sort();
  assert.deepEqual(expected, [conditionalRoleChangeId, conditionalExternalId].sort());
});

runTest("result plan code is exactly A6.5 code", () => {
  const plan = remediation.derivePostEmploymentResponsibilitiesRemediationPlan([]);
  assert.equal(plan.planCode, expectedPlanCode);
});

runTest("action codes set is exact", () => {
  const plan = remediation.derivePostEmploymentResponsibilitiesRemediationPlan(
    [
      { questionId: "p6_5_001", answer: "not_implemented", hasEvidence: true, justification: "x" },
      { questionId: "p6_5_002", answer: "not_implemented", hasEvidence: true, justification: "x" },
      { questionId: "p6_5_003", answer: "not_implemented", hasEvidence: true, justification: "x" },
      { questionId: "p6_5_004_role_change", answer: "not_implemented", hasEvidence: true, justification: "x" },
      { questionId: "p6_5_005_external", answer: "not_implemented", hasEvidence: true, justification: "x" },
    ],
    {
      hasEmploymentRoleChanges: "yes",
      hasRelevantExternalParties: "yes",
    },
  );
  const actions = sorted(plan.activeActions.map((item) => item.actionCode));
  assert.deepEqual(actions, expectedActionCodes);
});

runTest("no universal fixed delays or mandatory exit interview/signature is encoded", () => {
  const concatenated = JSON.stringify(content.postEmploymentResponsibilitiesQuestions);
  ensureNoPhrase(concatenated, "exit interview", "A.6.5 should not encode exit interview as mandatory.");
  ensureNoPhrase(concatenated, "signature de sortie", "A.6.5 should not encode signature de sortie as mandatory.");
  ensureNoPhrase(concatenated, "HRIS", "A.6.5 should not impose HRIS.");
  ensureNoPhrase(concatenated, "ticketing", "A.6.5 should not impose ticketing as mandatory.");
});

runTest("get helpers support both locales and ids are recognized", () => {
  const qFr = content.getPostEmploymentResponsibilitiesQuestion("p6_5_001", "fr");
  const qEn = content.getPostEmploymentResponsibilitiesQuestion("p6_5_001", "en");
  assert.equal(qFr.id, "p6_5_001");
  assert.equal(qEn.id, "p6_5_001");
  assert.notEqual(qFr.question, qEn.question);
  assert.equal(content.isPostEmploymentResponsibilitiesQuestion("p6_5_002"), true);
  assert.equal(content.isPostEmploymentResponsibilitiesQuestion("p6_6_001"), false);
});

runTest("getAll returns all question ids", () => {
  const all = content.getAllPostEmploymentResponsibilitiesQuestions("en");
  assert.equal(all.length, 5);
  assert.deepEqual(
    all.map((question) => question.id).sort(),
    sorted(expectedIds),
  );
});

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("All assessment A.6.5 QA checks passed.");
