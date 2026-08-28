const assert = await import("node:assert/strict");

const { strict: assertStrict } = assert;

const screening = await import("../content/assessment/people/screening.ts");
const outcomes = await import("../lib/assessment/outcomes.ts");
const remediation = await import("../lib/assessment/remediation.ts");
const screeningResolver = await import("../lib/assessment/screening.ts");

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

const answerValues = screening.screeningAnswerValues;

const mandatoryQuestions = screening.screeningQuestions.filter((q) => q.category === "mandatory");
const conditionalQuestions = screening.screeningQuestions.filter((q) => q.category !== "mandatory");

runTest("4 mandatory questions exist", () => {
  assertStrict.equal(mandatoryQuestions.length, 4);
  assertStrict.deepEqual(
    mandatoryQuestions.map((q) => q.id),
    ["p6_1_001", "p6_1_002", "p6_1_003", "p6_1_004"]
  );
});

runTest("Q4 uses the approved proof traceability wording", () => {
  const q4 = screening.screeningQuestions.find((question) => question.id === "p6_1_004");
  assertStrict.equal(q4?.type, "proof_traceability");
  assertStrict.equal(q4?.question.fr, "Votre organisation conserve-t-elle des preuves permettant de démontrer que les vérifications de screening requises ont été réalisées et que les résultats, exceptions ou problèmes identifiés ont été correctement traités ?");
  assertStrict.equal(q4?.question.en, "Does your organization retain evidence demonstrating that required screening checks were performed and that identified results, exceptions, or issues were appropriately handled?");
});

runTest("exact authorized question ids are present", () => {
  const expectedIds = [
    "p6_1_001",
    "p6_1_002",
    "p6_1_003",
    "p6_1_004",
    "p6_1_005_external",
    "p6_1_005_role_change",
  ];
  const actualIds = [...screening.screeningQuestions.map((q) => q.id)].sort();
  assertStrict.deepEqual(actualIds, [...expectedIds].sort());
});

runTest("2 conditional questions exist", () => {
  assertStrict.equal(conditionalQuestions.length, 2);
  const ids = conditionalQuestions.map((q) => q.id).sort();
  assertStrict.deepEqual(ids, ["p6_1_005_external", "p6_1_005_role_change"].sort());
});

runTest("screening resolver covers visibility combinations", () => {
  const cases = [
    [{ hasExternalPersonnel: "yes", hasSensitiveRoleChanges: "yes" }, 6, [], false],
    [{ hasExternalPersonnel: "yes", hasSensitiveRoleChanges: "no" }, 5, [], false],
    [{ hasExternalPersonnel: "no", hasSensitiveRoleChanges: "yes" }, 5, [], false],
    [{ hasExternalPersonnel: "no", hasSensitiveRoleChanges: "no" }, 4, [], false],
    [{ hasExternalPersonnel: undefined, hasSensitiveRoleChanges: "no" }, 4, ["hasExternalPersonnel"], true],
    [{ hasExternalPersonnel: "no", hasSensitiveRoleChanges: undefined }, 4, ["hasSensitiveRoleChanges"], true],
    [{ hasExternalPersonnel: "not_sure", hasSensitiveRoleChanges: "not_sure" }, 4, ["hasExternalPersonnel", "hasSensitiveRoleChanges"], true],
  ];
  for (const [context, count, unresolved, blocked] of cases) {
    const result = screeningResolver.resolveScreeningQuestions(context);
    assertStrict.equal(result.questionIds.length, count);
    assertStrict.deepEqual(result.unresolvedConditions, unresolved);
    assertStrict.equal(result.assessmentBlocked, blocked);
  }
});

runTest("hidden conditional responses are ignored while main responses remain visible", () => {
  const resolution = screeningResolver.resolveScreeningQuestions({ hasExternalPersonnel: "no", hasSensitiveRoleChanges: "no" });
  const visible = screeningResolver.filterVisibleScreeningResponses([
    { questionId: "p6_1_001", answer: "partially_implemented" },
    { questionId: "p6_1_005_external", answer: "not_implemented" },
    { questionId: "p6_1_005_role_change", answer: "not_implemented" },
  ], resolution);
  assertStrict.deepEqual(visible.map((row) => row.questionId), ["p6_1_001"]);
  const outcome = outcomes.deriveAssessmentOutcome({ questionId: visible[0].questionId, answer: visible[0].answer, justification: "x" });
  assertStrict.equal(outcome.gapLevel, "partial_gap");
});

runTest("French and English labels exist for all questions and answers", () => {
  for (const question of screening.screeningQuestions) {
    assertStrict.ok(typeof question.question.fr === "string" && question.question.fr.length > 0);
    assertStrict.ok(typeof question.question.en === "string" && question.question.en.length > 0);
    assertStrict.ok(typeof question.helpText.fr === "string" && question.helpText.fr.length > 0);
    assertStrict.ok(typeof question.helpText.en === "string" && question.helpText.en.length > 0);
  }

  const fr = Object.keys(screening.screeningAnswerLabels.fr);
  const en = Object.keys(screening.screeningAnswerLabels.en);
  assertStrict.deepEqual(fr.sort(), [...answerValues].sort());
  assertStrict.deepEqual(en.sort(), [...answerValues].sort());
});

runTest("No A.6.2-A.6.8 questions added", () => {
  const allIds = screening.screeningQuestions.map((question) => question.id);
  assertStrict.ok(!allIds.some((id) => /^p6_[2-8]_\d{3}$/.test(id)));
});

runTest("Technical answers are exactly the five supported values", () => {
  assertStrict.deepEqual(answerValues, [
    "implemented",
    "partially_implemented",
    "not_implemented",
    "not_sure",
    "not_applicable",
  ]);
  for (const question of screening.screeningQuestions) {
    assertStrict.deepEqual(question.responseOptions, answerValues);
  }
});

runTest("not_assessed is not an answer option", () => {
  assertStrict.ok(!answerValues.includes("not_assessed"));
  for (const value of answerValues) {
    assertStrict.notEqual(value, "not_assessed");
  }
});

runTest("partially_implemented maps to partial_gap", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_1_001",
    answer: "partially_implemented",
    hasEvidence: true,
    justification: "ok",
  });
  assertStrict.equal(outcome.isValid, true);
  assertStrict.equal(outcome.gapLevel, "partial_gap");
});

runTest("not_implemented maps to full_gap", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_1_001",
    answer: "not_implemented",
    hasEvidence: true,
    justification: "ok",
  });
  assertStrict.equal(outcome.isValid, true);
  assertStrict.equal(outcome.gapLevel, "full_gap");
});

runTest("not_sure creates clarification_required", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_1_001",
    answer: "not_sure",
    hasEvidence: false,
    justification: "waiting",
  });
  assertStrict.equal(outcome.isValid, true);
  assertStrict.equal(outcome.reviewState, "clarification_required");
});

runTest("not_applicable without justification is invalid", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_1_001",
    answer: "not_applicable",
    hasEvidence: false,
    justification: undefined,
  });
  assertStrict.equal(outcome.isValid, false);
  assertStrict.equal(outcome.errorCode, "not_applicable_requires_justification");
});

runTest("not_applicable with empty or whitespace justification is invalid", () => {
  const outcome1 = outcomes.deriveAssessmentOutcome({
    questionId: "p6_1_001",
    answer: "not_applicable",
    hasEvidence: true,
    justification: "",
  });
  assertStrict.equal(outcome1.isValid, false);
  assertStrict.equal(outcome1.errorCode, "not_applicable_requires_justification");

  const outcome2 = outcomes.deriveAssessmentOutcome({
    questionId: "p6_1_001",
    answer: "not_applicable",
    hasEvidence: true,
    justification: "   ",
  });
  assertStrict.equal(outcome2.isValid, false);
  assertStrict.equal(outcome2.errorCode, "not_applicable_requires_justification");
});

runTest("implemented creates no remediation action", () => {
  const plan = remediation.deriveScreeningRemediationPlan([
    { questionId: "p6_1_001", answer: "implemented", hasEvidence: true, justification: "ok" },
  ]);
  assertStrict.equal(plan.subActions.length, 0);
});

runTest("implemented with no evidence gives evidence_status not_provided", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_1_001",
    answer: "implemented",
    hasEvidence: false,
    justification: "ok",
  });
  assertStrict.equal(outcome.evidenceStatus, "not_provided");
});

runTest("evidence status supports validated and rejected states", () => {
  const outcomeValidated = outcomes.deriveAssessmentOutcome({
    questionId: "p6_1_001",
    answer: "implemented",
    evidenceStatus: "validated",
    hasEvidence: true,
    justification: "ok",
  });
  assertStrict.equal(outcomeValidated.evidenceStatus, "validated");

  const outcomeRejected = outcomes.deriveAssessmentOutcome({
    questionId: "p6_1_001",
    answer: "partially_implemented",
    evidenceStatus: "rejected",
    justification: "ok",
  });
  assertStrict.equal(outcomeRejected.evidenceStatus, "rejected");
});

runTest("main remediation plan does not duplicate actions", () => {
  const plan = remediation.deriveScreeningRemediationPlan([
    { questionId: "p6_1_001", answer: "not_implemented", hasEvidence: true, justification: "x" },
    { questionId: "p6_1_001", answer: "partially_implemented", hasEvidence: true, justification: "y" },
    { questionId: "p6_1_001", answer: "partially_implemented", hasEvidence: true, justification: "z" },
  ]);
  assertStrict.equal(plan.subActions.length, 1);
  assertStrict.equal(plan.subActions[0].actionCode, "P6.1-A01");
});

runTest("implemented again removes remediation action", () => {
  const plan = remediation.deriveScreeningRemediationPlan([
    { questionId: "p6_1_002", answer: "not_implemented", hasEvidence: true, justification: "x" },
    { questionId: "p6_1_002", answer: "implemented", hasEvidence: true, justification: "y" },
  ]);
  assertStrict.equal(plan.subActions.length, 0);
});

runTest("derive functions are deterministic", () => {
  const firstPlan = remediation.deriveScreeningRemediationPlan([
    { questionId: "p6_1_004", answer: "partially_implemented", hasEvidence: false, justification: "x" },
    { questionId: "p6_1_005_external", answer: "not_implemented", hasEvidence: false, justification: "y" },
  ]);
  const secondPlan = remediation.deriveScreeningRemediationPlan([
    { questionId: "p6_1_004", answer: "partially_implemented", hasEvidence: false, justification: "x" },
    { questionId: "p6_1_005_external", answer: "not_implemented", hasEvidence: false, justification: "y" },
  ]);

  assertStrict.deepEqual(firstPlan, secondPlan);
  const firstOutcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_1_003",
    answer: "partially_implemented",
    hasEvidence: false,
    justification: "x",
  });
  const secondOutcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_1_003",
    answer: "partially_implemented",
    hasEvidence: false,
    justification: "x",
  });
  assertStrict.deepEqual(firstOutcome, secondOutcome);
});

runTest("getScreeningQuestion supports fr and en", () => {
  const fr = screening.getScreeningQuestion("p6_1_001", "fr");
  const en = screening.getScreeningQuestion("p6_1_001", "en");
  assertStrict.equal(fr.id, "p6_1_001");
  assertStrict.equal(en.id, "p6_1_001");
  assertStrict.notEqual(fr.question, en.question);
});

runTest("deriveScreeningRemediationPlan returns A6_1 plan title and code", () => {
  const plan = remediation.deriveScreeningRemediationPlan([]);
  assertStrict.equal(plan.planCode, "A6_1_SCREENING_PLAN");
  assertStrict.equal(typeof plan.title.en, "string");
  assertStrict.equal(typeof plan.title.fr, "string");
});

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("All screening QA checks passed.");
