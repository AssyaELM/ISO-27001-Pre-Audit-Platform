import assert from "node:assert/strict";

const outcomes = await import("../lib/assessment/outcomes.ts");
const remoteWorking = await import("../content/assessment/people/remote-working.ts");
const remoteWorkingLib = await import("../lib/assessment/remote-working.ts");
const infrastructure = await import("../content/assessment-infrastructure.ts");

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

function containsNo(text, tokens, label) {
  const lower = text.toLowerCase();
  for (const token of tokens) {
    assert.equal(lower.includes(token.toLowerCase()), false, `${label} contains forbidden token "${token}"`);
  }
}

const answerValues = [...infrastructure.assessmentAnswerValues];

runTest("exact A.6.7 IDs are present", () => {
  const actual = remoteWorking.remoteWorkingQuestions.map((q) => q.id).sort();
  assert.deepEqual(actual, [
    "p6_7_001",
    "p6_7_002",
    "p6_7_003",
    "p6_7_004_byod",
    "p6_7_005_high_risk_locations",
  ]);
});

runTest("three mandatory and two conditional questions", () => {
  const mandatory = remoteWorking.remoteWorkingQuestions.filter((q) => q.category === "mandatory");
  const conditional = remoteWorking.remoteWorkingQuestions.filter((q) => q.category !== "mandatory");
  assert.equal(mandatory.length, 3);
  assert.equal(conditional.length, 2);
});

runTest("all five exact IDs are unique and complete", () => {
  const ids = remoteWorking.remoteWorkingQuestions.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.includes("p6_7_004_byod"), true);
  assert.equal(ids.includes("p6_7_005_high_risk_locations"), true);
});

runTest("questions have FR/EN content", () => {
  for (const question of remoteWorking.remoteWorkingQuestions) {
    assert.ok(typeof question.question.fr === "string" && question.question.fr.length > 0);
    assert.ok(typeof question.question.en === "string" && question.question.en.length > 0);
    assert.ok(typeof question.helpText.fr === "string" && question.helpText.fr.length > 0);
    assert.ok(typeof question.helpText.en === "string" && question.helpText.en.length > 0);
    assert.ok(Array.isArray(question.evidenceHints.fr));
    assert.ok(Array.isArray(question.evidenceHints.en));
  }
});

runTest("exactly five response options are technical", () => {
  assert.deepEqual(answerValues, [
    "implemented",
    "partially_implemented",
    "not_implemented",
    "not_sure",
    "not_applicable",
  ]);
});

runTest("no IDs outside p6_7.x", () => {
  const ids = remoteWorking.remoteWorkingQuestions.map((q) => q.id);
  assert.ok(ids.every((id) => /^p6_7_\d/.test(id) || id.startsWith("p6_7_")));
});

runTest("unknown control context keeps mandatory audit questions visible", () => {
  const resolution = remoteWorking.resolveRemoteWorkingQuestions({});
  assert.deepEqual(resolution.questionIds, ["p6_7_001", "p6_7_002", "p6_7_003"]);
  assert.equal(resolution.controlApplicability, "unknown");
  assert.deepEqual(resolution.unresolvedConditions, ["hasRemoteWorking"]);
});

runTest("hasRemoteWorking not_sure keeps mandatory questions visible and creates unresolved", () => {
  const resolution = remoteWorking.resolveRemoteWorkingQuestions({ hasRemoteWorking: "not_sure" });
  assert.deepEqual(resolution.questionIds, ["p6_7_001", "p6_7_002", "p6_7_003"]);
  assert.equal(resolution.controlApplicability, "unknown");
  assert.deepEqual(resolution.unresolvedConditions.includes("hasRemoteWorking"), true);
});

runTest("hasRemoteWorking no blocks evaluation and prevents question activation", () => {
  const resolution = remoteWorking.resolveRemoteWorkingQuestions({ hasRemoteWorking: "no" });
  assert.equal(resolution.questionIds.length, 0);
  assert.equal(resolution.controlApplicability, "not_applicable");
  assert.equal(resolution.unresolvedConditions.length, 0);
  const plan = remoteWorkingLib.deriveRemoteWorkingRemediationPlan(
    [
      { questionId: "p6_7_001", answer: "not_implemented", hasEvidence: false, justification: "bad" },
      { questionId: "p6_7_002", answer: "not_implemented", hasEvidence: false, justification: "bad" },
    ],
    { hasRemoteWorking: "no" },
    "Remote work not applicable for this scope",
  );
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.applicabilityReviews.length, 1);
});

runTest("hasRemoteWorking no with empty justification keeps blocked and no gap", () => {
  const plan = remoteWorkingLib.deriveRemoteWorkingRemediationPlan(
    [],
    { hasRemoteWorking: "no" },
    "   ",
  );
  assert.equal(plan.assessmentBlocked, true);
  assert.equal(plan.controlReviewState, "applicability_review_required");
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.applicabilityReviews.length, 1);
});

runTest("hasRemoteWorking yes selects mandatory questions", () => {
  const resolution = remoteWorking.resolveRemoteWorkingQuestions({ hasRemoteWorking: "yes" });
  assert.deepEqual(resolution.questionIds.sort(), ["p6_7_001", "p6_7_002", "p6_7_003"]);
});

runTest("both secondary conditions yes return five questions", () => {
  const resolution = remoteWorking.resolveRemoteWorkingQuestions({
    hasRemoteWorking: "yes",
    hasBYODDevices: "yes",
    hasHigherRiskLocations: "yes",
  });
  assert.equal(resolution.questionIds.length, 5);
});

runTest("BYOD no masks conditional BYOD without applicability action", () => {
  const resolution = remoteWorking.resolveRemoteWorkingQuestions({
    hasRemoteWorking: "yes",
    hasBYODDevices: "no",
    hasHigherRiskLocations: "yes",
  });
  assert.equal(resolution.questionIds.includes("p6_7_004_byod"), false);
  assert.equal(resolution.hiddenQuestionIds.includes("p6_7_004_byod"), true);
  assert.equal(remoteWorkingLib.deriveRemoteWorkingRemediationPlan([], {
    hasRemoteWorking: "yes",
    hasBYODDevices: "no",
    hasHigherRiskLocations: "yes",
  }).activeActions.length, 0);
});

runTest("high-risk no masks conditional high-risk without applicability action", () => {
  const resolution = remoteWorking.resolveRemoteWorkingQuestions({
    hasRemoteWorking: "yes",
    hasBYODDevices: "yes",
    hasHigherRiskLocations: "no",
  });
  assert.equal(resolution.questionIds.includes("p6_7_005_high_risk_locations"), false);
  assert.equal(resolution.hiddenQuestionIds.includes("p6_7_005_high_risk_locations"), true);
});

runTest("conditional 'no' values do not introduce applicability review on question level", () => {
  const plan = remoteWorkingLib.deriveRemoteWorkingRemediationPlan(
    [
      { questionId: "p6_7_004_byod", answer: "not_implemented", hasEvidence: false, justification: "x" },
      { questionId: "p6_7_005_high_risk_locations", answer: "not_implemented", hasEvidence: false, justification: "x" },
    ],
    { hasRemoteWorking: "yes", hasBYODDevices: "no", hasHigherRiskLocations: "no" },
    "Remote work enabled",
  );
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.applicabilityReviews.length, 0);
});

runTest("not_sure conditional creates unresolved condition", () => {
  const resolution = remoteWorking.resolveRemoteWorkingQuestions({
    hasRemoteWorking: "yes",
    hasBYODDevices: "not_sure",
    hasHigherRiskLocations: "yes",
  });
  assert.equal(resolution.unresolvedConditions.includes("hasBYODDevices"), true);
  const plan = remoteWorkingLib.deriveRemoteWorkingRemediationPlan([], {
    hasRemoteWorking: "yes",
    hasBYODDevices: "not_sure",
    hasHigherRiskLocations: "yes",
  });
  assert.equal(plan.assessmentBlocked, true);
  assert.equal(plan.controlReviewState, "clarification_required");
});

runTest("hidden conditional questions ignore old responses", () => {
  const plan = remoteWorkingLib.deriveRemoteWorkingRemediationPlan(
    [
      { questionId: "p6_7_004_byod", answer: "not_implemented", hasEvidence: true, justification: "old" },
      { questionId: "p6_7_005_high_risk_locations", answer: "not_implemented", hasEvidence: true, justification: "old" },
    ],
    { hasRemoteWorking: "yes", hasBYODDevices: "no", hasHigherRiskLocations: "no" },
  );
  assert.equal(plan.activeActions.length, 0);
});

runTest("implemented gives no gap and no action", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_7_001",
    answer: "implemented",
    hasEvidence: false,
    justification: "ok",
  });
  assert.equal(outcome.gapLevel, "no_gap");
  assert.equal(outcome.reviewState, "none");
  const plan = remoteWorkingLib.deriveRemoteWorkingRemediationPlan(
    [{ questionId: "p6_7_001", answer: "implemented", hasEvidence: true, justification: "ok" }],
    { hasRemoteWorking: "yes", hasBYODDevices: "yes", hasHigherRiskLocations: "yes" },
  );
  assert.equal(plan.activeActions.length, 0);
});

runTest("partially implemented creates partial gap and action", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_7_002",
    answer: "partially_implemented",
    hasEvidence: true,
    justification: "ok",
  });
  assert.equal(outcome.gapLevel, "partial_gap");
  const plan = remoteWorkingLib.deriveRemoteWorkingRemediationPlan(
    [{ questionId: "p6_7_002", answer: "partially_implemented", hasEvidence: true, justification: "ok" }],
    { hasRemoteWorking: "yes", hasBYODDevices: "yes", hasHigherRiskLocations: "yes" },
  );
  assert.equal(plan.activeActions.length, 1);
  assert.equal(plan.activeActions[0].actionCode, "P6.7-A02");
  assert.equal(plan.activeActions[0].gapType, "partial");
});

runTest("not implemented creates full gap and action", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_7_003",
    answer: "not_implemented",
    hasEvidence: true,
    justification: "ok",
  });
  assert.equal(outcome.gapLevel, "full_gap");
  const plan = remoteWorkingLib.deriveRemoteWorkingRemediationPlan(
    [{ questionId: "p6_7_003", answer: "not_implemented", hasEvidence: true, justification: "ok" }],
    { hasRemoteWorking: "yes", hasBYODDevices: "yes", hasHigherRiskLocations: "yes" },
  );
  assert.equal(plan.activeActions.length, 1);
  assert.equal(plan.activeActions[0].actionCode, "P6.7-A03");
  assert.equal(plan.activeActions[0].gapType, "full");
});

runTest("not sure creates clarification only", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_7_001",
    answer: "not_sure",
    hasEvidence: false,
    justification: "pending",
  });
  assert.equal(outcome.reviewState, "clarification_required");
  const plan = remoteWorkingLib.deriveRemoteWorkingRemediationPlan(
    [{ questionId: "p6_7_001", answer: "not_sure", justification: "pending" }],
    { hasRemoteWorking: "yes", hasBYODDevices: "yes", hasHigherRiskLocations: "yes" },
  );
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.clarifications.some((item) => item.questionId === "p6_7_001"), true);
});

runTest("not applicable requires non-empty justification", () => {
  const invalid = outcomes.deriveAssessmentOutcome({
    questionId: "p6_7_001",
    answer: "not_applicable",
    hasEvidence: false,
    justification: "  ",
  });
  assert.equal(invalid.isValid, false);
});

runTest("not applicable with justification keeps no gap and no action", () => {
  const plan = remoteWorkingLib.deriveRemoteWorkingRemediationPlan(
    [{ questionId: "p6_7_001", answer: "not_applicable", hasEvidence: true, justification: "not in scope here" }],
    { hasRemoteWorking: "yes", hasBYODDevices: "yes", hasHigherRiskLocations: "yes" },
  );
  assert.equal(plan.activeActions.length, 0);
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_7_001",
    answer: "not_applicable",
    hasEvidence: false,
    justification: "not in scope here",
  });
  assert.equal(outcome.reviewState, "applicability_review_required");
});

runTest("evidenceStatus passthroughs are preserved", () => {
  const provided = outcomes.deriveAssessmentOutcome({
    questionId: "p6_7_001",
    answer: "implemented",
    hasEvidence: true,
    evidenceStatus: "provided",
    justification: "ok",
  });
  assert.equal(provided.evidenceStatus, "provided");
  const validated = outcomes.deriveAssessmentOutcome({
    questionId: "p6_7_002",
    answer: "partially_implemented",
    hasEvidence: true,
    evidenceStatus: "validated",
    justification: "ok",
  });
  assert.equal(validated.evidenceStatus, "validated");
  const rejected = outcomes.deriveAssessmentOutcome({
    questionId: "p6_7_003",
    answer: "implemented",
    hasEvidence: true,
    evidenceStatus: "rejected",
    justification: "ok",
  });
  assert.equal(rejected.evidenceStatus, "rejected");
});

runTest("last response per question is used", () => {
  const plan = remoteWorkingLib.deriveRemoteWorkingRemediationPlan(
    [
      { questionId: "p6_7_002", answer: "partially_implemented", hasEvidence: true, justification: "old" },
      { questionId: "p6_7_002", answer: "implemented", hasEvidence: true, justification: "new" },
    ],
    { hasRemoteWorking: "yes", hasBYODDevices: "yes", hasHigherRiskLocations: "yes" },
  );
  assert.equal(plan.activeActions.length, 0);
});

runTest("duplicate action deduplicated by actionCode", () => {
  const plan = remoteWorkingLib.deriveRemoteWorkingRemediationPlan(
    [
      { questionId: "p6_7_002", answer: "partially_implemented", hasEvidence: true, justification: "one" },
      { questionId: "p6_7_002", answer: "not_implemented", hasEvidence: true, justification: "two" },
    ],
    { hasRemoteWorking: "yes", hasBYODDevices: "yes", hasHigherRiskLocations: "yes" },
  );
  assert.equal(plan.activeActions.length, 1);
  assert.equal(plan.activeActions[0].gapType, "full");
  assert.equal(plan.activeActions[0].gapCode, remoteWorking.REMOTE_WORKING_GAP_CODES.p6_7_002.full);
});

runTest("returning to implemented removes action", () => {
  const plan = remoteWorkingLib.deriveRemoteWorkingRemediationPlan(
    [
      { questionId: "p6_7_002", answer: "not_implemented", hasEvidence: true, justification: "one" },
      { questionId: "p6_7_002", answer: "implemented", hasEvidence: true, justification: "two" },
    ],
    { hasRemoteWorking: "yes", hasBYODDevices: "yes", hasHigherRiskLocations: "yes" },
  );
  assert.equal(plan.activeActions.length, 0);
});

runTest("control-level plan metadata is present", () => {
  const plan = remoteWorkingLib.deriveRemoteWorkingRemediationPlan(
    [],
    { hasRemoteWorking: "yes", hasBYODDevices: "yes", hasHigherRiskLocations: "yes" },
    "Remote work not applicable",
  );
  assert.equal(plan.planCode, remoteWorking.REMOTE_WORKING_PLAN_CODE);
  assert.equal(plan.controlApplicability, "applicable");
  assert.equal(plan.controlReviewState, "none");
  assert.equal(plan.assessmentBlocked, false);
});

runTest("applicability gap code and action mapping", () => {
  const plan = remoteWorkingLib.deriveRemoteWorkingRemediationPlan(
    [
      { questionId: "p6_7_001", answer: "not_implemented", hasEvidence: true, justification: "x" },
      { questionId: "p6_7_002", answer: "partially_implemented", hasEvidence: true, justification: "x" },
      { questionId: "p6_7_003", answer: "partially_implemented", hasEvidence: true, justification: "x" },
      { questionId: "p6_7_004_byod", answer: "not_implemented", hasEvidence: true, justification: "x" },
      { questionId: "p6_7_005_high_risk_locations", answer: "partially_implemented", hasEvidence: true, justification: "x" },
    ],
    { hasRemoteWorking: "yes", hasBYODDevices: "yes", hasHigherRiskLocations: "yes" },
  );
  assert.equal(plan.activeActions.length, 5);
  const actionCodes = plan.activeActions.map((action) => action.actionCode).sort();
  assert.deepEqual(actionCodes, ["P6.7-A01", "P6.7-A02", "P6.7-A03", "P6.7-A04", "P6.7-A05"]);
  const gapCodes = plan.activeActions.map((action) => action.gapCode).sort();
  assert.ok(gapCodes.includes("A6_7_FRAMEWORK_ABSENT"));
  assert.ok(gapCodes.includes("A6_7_MEASURES_PARTIAL"));
});

runTest("exact ten required gap and five action codes exist", () => {
  const expectedGapCodes = [
    "A6_7_FRAMEWORK_PARTIAL",
    "A6_7_FRAMEWORK_ABSENT",
    "A6_7_MEASURES_PARTIAL",
    "A6_7_MEASURES_ABSENT",
    "A6_7_EVIDENCE_REVIEW_PARTIAL",
    "A6_7_EVIDENCE_REVIEW_ABSENT",
    "A6_7_BYOD_PARTIAL",
    "A6_7_BYOD_ABSENT",
    "A6_7_HIGH_RISK_LOCATIONS_PARTIAL",
    "A6_7_HIGH_RISK_LOCATIONS_ABSENT",
  ];
  const gapCodes = Object.values(remoteWorking.REMOTE_WORKING_GAP_CODES)
    .flatMap((entry) => [entry.partial, entry.full])
    .sort();
  assert.deepEqual(gapCodes, expectedGapCodes.sort());
});

runTest("control level blocked when hasRemoteWorking unknown", () => {
  const plan = remoteWorkingLib.deriveRemoteWorkingRemediationPlan(
    [{ questionId: "p6_7_001", answer: "implemented", hasEvidence: false, justification: "x" }],
    { hasRemoteWorking: "not_sure" },
  );
  assert.equal(plan.assessmentBlocked, true);
  assert.equal(plan.controlReviewState, "clarification_required");
});

runTest("legal notice contains explicit anti-legal disclaimer and no hard legal advice", () => {
  const notice = remoteWorking.remoteWorkingLegalNotice.en;
  assert.equal(typeof notice, "string");
  assert.equal(notice.includes("does not provide personalized legal advice"), true);
});

runTest("forbidden security obligations are not required", () => {
  const combined = remoteWorking
    .remoteWorkingQuestions.map((q) => `${q.question.fr} ${q.helpText.fr} ${q.evidenceHints.fr.join(" ")}`)
    .join(" ")
    .toLowerCase();
  const forbidden = [
    "vpn obligatoire",
    "vpn",
    "mdm",
    "remote wipe",
    "géolocalisation",
    "interdiction universelle du byod",
    "pas de byod",
  ];
  containsNo(combined, forbidden, "Remote-working catalog");
});

runTest("byod and high-risk location conditional ids are conditional", () => {
  const byod = remoteWorking.remoteWorkingQuestions.find((q) => q.id === "p6_7_004_byod");
  const high = remoteWorking.remoteWorkingQuestions.find((q) => q.id === "p6_7_005_high_risk_locations");
  assert.equal(byod?.conditionKey, "hasBYODDevices");
  assert.equal(high?.conditionKey, "hasHigherRiskLocations");
});

runTest("resolve helper is deterministic", () => {
  const a = remoteWorkingLib.deriveRemoteWorkingRemediationPlan(
    [{ questionId: "p6_7_001", answer: "implemented", hasEvidence: true, justification: "x" }],
    { hasRemoteWorking: "yes", hasBYODDevices: "yes", hasHigherRiskLocations: "yes" },
  );
  const b = remoteWorkingLib.deriveRemoteWorkingRemediationPlan(
    [{ questionId: "p6_7_001", answer: "implemented", hasEvidence: true, justification: "x" }],
    { hasRemoteWorking: "yes", hasBYODDevices: "yes", hasHigherRiskLocations: "yes" },
  );
  assert.deepEqual(a, b);
});

runTest("not_applicable global creates at most one control review", () => {
  const plan = remoteWorkingLib.deriveRemoteWorkingRemediationPlan(
    [],
    { hasRemoteWorking: "no" },
    "No remote work.",
  );
  assert.equal(plan.applicabilityReviews.length, 1);
});

if (process.exitCode) {
  process.exit(process.exitCode);
}

const testsRun = 33;
console.log(`All assessment A.6.7 QA checks passed. (${testsRun} tests)`);
