import { strict as assert } from "node:assert";
import * as infrastructure from "../content/assessment-infrastructure.ts";
import * as awareness from "../content/assessment/people/awareness-training.ts";
import * as outcomes from "../lib/assessment/outcomes.ts";
import * as remediation from "../lib/assessment/awareness-training.ts";

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

const expectedIds = [
  "p6_3_001",
  "p6_3_002",
  "p6_3_003",
  "p6_3_004_role_based",
  "p6_3_005_external",
];

const expectedAnswerValues = [
  "implemented",
  "partially_implemented",
  "not_implemented",
  "not_sure",
  "not_applicable",
];

runTest("exact authorized question IDs are present", () => {
  assert.deepEqual(
    [...awareness.awarenessTrainingQuestions.map((q) => q.id)].sort(),
    [...expectedIds].sort(),
  );
});

runTest("three mandatory questions exist", () => {
  const mandatory = awareness.awarenessTrainingQuestions.filter((q) => q.category === "mandatory");
  assert.deepEqual(
    mandatory.map((q) => q.id).sort(),
    ["p6_3_001", "p6_3_002", "p6_3_003"].sort(),
  );
});

runTest("approved P.A.P. types and exact main wording are present", () => {
  const byId = new Map(awareness.awarenessTrainingQuestions.map((question) => [question.id, question]));
  assert.equal(byId.get("p6_3_001")?.type, "policy_process");
  assert.equal(byId.get("p6_3_002")?.type, "application");
  assert.equal(byId.get("p6_3_003")?.type, "proof_traceability");
  assert.equal(byId.get("p6_3_004_role_based")?.type, "conditional");
  assert.equal(byId.get("p6_3_005_external")?.type, "conditional");
  assert.equal(byId.get("p6_3_003")?.question.en, "Does your organization retain traceable evidence of assignment and completion, and use appropriate results to verify understanding or improve the program?");
  assert.equal(byId.get("p6_3_003")?.question.fr, "Votre organisation conserve-t-elle des preuves traçables de l’attribution et de la réalisation des actions, et utilise-t-elle des résultats appropriés pour vérifier la compréhension ou améliorer le programme ?");
});

runTest("two conditional questions exist", () => {
  const conditional = awareness.awarenessTrainingQuestions.filter((q) => q.category !== "mandatory");
  assert.deepEqual(
    conditional.map((q) => q.id).sort(),
    ["p6_3_004_role_based", "p6_3_005_external"].sort(),
  );
});

runTest("plan code is exactly A6_3_AWARENESS_TRAINING_PLAN", () => {
  const plan = remediation.deriveAwarenessTrainingRemediationPlan([], {
    hasRolesRequiringSpecializedTraining: "no",
    hasRelevantExternalParties: "no",
  });
  assert.equal(plan.planCode, "A6_3_AWARENESS_TRAINING_PLAN");
});

runTest("exactly two condition keys are required keys", () => {
  const resolution = awareness.resolveAwarenessTrainingQuestions({
    hasRolesRequiringSpecializedTraining: "not_sure",
    hasRelevantExternalParties: "not_sure",
  });
  assert.deepEqual(
    resolution.unresolvedConditions.sort(),
    ["hasRolesRequiringSpecializedTraining", "hasRelevantExternalParties"].sort(),
  );
});

runTest("A.6.3 mapping is exactly preserved for every question", () => {
  assert.equal(awareness.AWARENESS_TRAINING_GAP_CODES.p6_3_001.partial, "A6_3_PROGRAM_PARTIAL");
  assert.equal(awareness.AWARENESS_TRAINING_GAP_CODES.p6_3_001.full, "A6_3_PROGRAM_ABSENT");
  assert.equal(awareness.AWARENESS_TRAINING_GAP_CODES.p6_3_002.partial, "A6_3_DELIVERY_UPDATES_PARTIAL");
  assert.equal(awareness.AWARENESS_TRAINING_GAP_CODES.p6_3_002.full, "A6_3_DELIVERY_UPDATES_ABSENT");
  assert.equal(awareness.AWARENESS_TRAINING_GAP_CODES.p6_3_003.partial, "A6_3_EVIDENCE_EFFECTIVENESS_PARTIAL");
  assert.equal(awareness.AWARENESS_TRAINING_GAP_CODES.p6_3_003.full, "A6_3_EVIDENCE_EFFECTIVENESS_ABSENT");
  assert.equal(awareness.AWARENESS_TRAINING_GAP_CODES.p6_3_004_role_based.partial, "A6_3_ROLE_BASED_PARTIAL");
  assert.equal(awareness.AWARENESS_TRAINING_GAP_CODES.p6_3_004_role_based.full, "A6_3_ROLE_BASED_ABSENT");
  assert.equal(awareness.AWARENESS_TRAINING_GAP_CODES.p6_3_005_external.partial, "A6_3_EXTERNAL_COVERAGE_PARTIAL");
  assert.equal(awareness.AWARENESS_TRAINING_GAP_CODES.p6_3_005_external.full, "A6_3_EXTERNAL_COVERAGE_ABSENT");
});

runTest("gap mapping produces correct remediation action codes", () => {
  const pairs = [
    { id: "p6_3_001", code: "P6.3-A01" },
    { id: "p6_3_002", code: "P6.3-A02" },
    { id: "p6_3_003", code: "P6.3-A03" },
    { id: "p6_3_004_role_based", code: "P6.3-A04" },
    { id: "p6_3_005_external", code: "P6.3-A05" },
  ];
  const expected = pairs.map((pair) => pair.code);
  const plan = remediation.deriveAwarenessTrainingRemediationPlan(
    pairs.map((pair) => ({
      questionId: pair.id,
      answer: "not_implemented",
      justification: "ok",
      hasEvidence: true,
    })),
    {
      hasRolesRequiringSpecializedTraining: "yes",
      hasRelevantExternalParties: "yes",
    },
  );
  assert.equal(plan.activeActions.length, expected.length);
  assert.deepEqual(
    plan.activeActions.map((item) => item.actionCode).sort(),
    expected.sort(),
  );
});

runTest("all question texts exist in fr/en", () => {
  for (const question of awareness.awarenessTrainingQuestions) {
    assert.ok(typeof question.question.fr === "string" && question.question.fr.length > 0);
    assert.ok(typeof question.question.en === "string" && question.question.en.length > 0);
    assert.ok(typeof question.helpText.fr === "string" && question.helpText.fr.length > 0);
    assert.ok(typeof question.helpText.en === "string" && question.helpText.en.length > 0);
  }
});

runTest("technical answers are exactly the five supported values", () => {
  assert.deepEqual(infrastructure.assessmentAnswerValues, expectedAnswerValues);
  for (const question of awareness.awarenessTrainingQuestions) {
    assert.deepEqual(question.responseOptions, expectedAnswerValues);
  }
});

runTest("no question beyond authorized A.6.3 ids is present", () => {
  const unauthorized = awareness.awarenessTrainingQuestions.some(
    (question) => !expectedIds.includes(question.id),
  );
  assert.equal(unauthorized, false);
});

runTest("not_assessed is not selectable", () => {
  assert.ok(!infrastructure.assessmentAnswerValues.includes("not_assessed"));
});

runTest("resolveAwarenessTrainingQuestions without context returns only mandatory and 2 unresolved", () => {
  const resolution = awareness.resolveAwarenessTrainingQuestions({});
  assert.deepEqual(
    resolution.questionIds.sort(),
    ["p6_3_001", "p6_3_002", "p6_3_003"].sort(),
  );
  assert.deepEqual(
    resolution.unresolvedConditions.sort(),
    ["hasRolesRequiringSpecializedTraining", "hasRelevantExternalParties"].sort(),
  );
});

runTest("context yes/no for conditional questions", () => {
  const withRoleYes = awareness.resolveAwarenessTrainingQuestions({
    hasRolesRequiringSpecializedTraining: "yes",
    hasRelevantExternalParties: "no",
  });
  assert.ok(withRoleYes.questionIds.includes("p6_3_004_role_based"));
  assert.ok(!withRoleYes.questionIds.includes("p6_3_005_external"));

  const withExternalYes = awareness.resolveAwarenessTrainingQuestions({
    hasRolesRequiringSpecializedTraining: "no",
    hasRelevantExternalParties: "yes",
  });
  assert.ok(!withExternalYes.questionIds.includes("p6_3_004_role_based"));
  assert.ok(withExternalYes.questionIds.includes("p6_3_005_external"));
});

runTest("both context yes returns five questions", () => {
  const resolution = awareness.resolveAwarenessTrainingQuestions({
    hasRolesRequiringSpecializedTraining: "yes",
    hasRelevantExternalParties: "yes",
  });
  assert.equal(resolution.questionIds.length, 5);
});

runTest("all required visibility combinations and stale answers are handled", () => {
  const resolve = awareness.resolveAwarenessTrainingQuestions;
  assert.equal(resolve({ hasRolesRequiringSpecializedTraining: "no", hasRelevantExternalParties: "no" }).questionIds.length, 3);
  assert.equal(resolve({ hasRolesRequiringSpecializedTraining: "yes", hasRelevantExternalParties: "no" }).questionIds.length, 4);
  assert.equal(resolve({ hasRolesRequiringSpecializedTraining: "no", hasRelevantExternalParties: "yes" }).questionIds.length, 4);
  const unresolved = resolve({ hasRolesRequiringSpecializedTraining: "not_sure", hasRelevantExternalParties: "yes" });
  assert.equal(unresolved.questionIds.length, 4);
  assert.ok(unresolved.unresolvedConditions.includes("hasRolesRequiringSpecializedTraining"));
  assert.ok(unresolved.hiddenQuestionIds.includes("p6_3_004_role_based"));
});

runTest("visible question order supports contiguous UI numbering", () => {
  const ids = (role, external) => awareness.resolveAwarenessTrainingQuestions({
    hasRolesRequiringSpecializedTraining: role,
    hasRelevantExternalParties: external,
  }).questionIds;
  assert.deepEqual(ids("not_sure", "yes"), ["p6_3_001", "p6_3_002", "p6_3_003", "p6_3_005_external"]);
  assert.deepEqual(ids("yes", "yes"), ["p6_3_001", "p6_3_002", "p6_3_003", "p6_3_004_role_based", "p6_3_005_external"]);
  assert.deepEqual(ids("no", "yes"), ["p6_3_001", "p6_3_002", "p6_3_003", "p6_3_005_external"]);
  assert.deepEqual(ids("yes", "no"), ["p6_3_001", "p6_3_002", "p6_3_003", "p6_3_004_role_based"]);
  assert.deepEqual(ids("no", "no"), ["p6_3_001", "p6_3_002", "p6_3_003"]);
});

runTest("conditioned content never enforces annual frequency, LMS, universal completion or access blocking", () => {
  const q = awareness.awarenessTrainingQuestions.find((item) => item.id === "p6_3_002");
  if (!q) throw new Error("missing p6_3_002");
  const concatenated = [
    q.question.fr.toLowerCase(),
    q.question.en.toLowerCase(),
    q.helpText.fr.toLowerCase(),
    q.helpText.en.toLowerCase(),
  ].join(" ");
  assert.ok(!concatenated.includes("annuel") && !concatenated.includes("annual"));
  assert.ok(!concatenated.includes("lms"));
  assert.ok(!concatenated.includes("bloquer") && !concatenated.includes("bloque"));
  assert.ok(!/taux d?e compl[ée]t/iu.test(concatenated));
});

runTest("verification methods are proportionate and optional in p6_3_003", () => {
  const q = awareness.awarenessTrainingQuestions.find((item) => item.id === "p6_3_003");
  if (!q) throw new Error("missing p6_3_003");
  assert.ok(
    q.helpText.fr.includes("Aucun de ces moyens n’est obligatoire individuellement."),
  );
  assert.ok(
    q.helpText.en.includes("No individual method is mandatory."),
  );
  assert.ok(q.helpText.fr.includes("quiz"));
  assert.ok(!q.helpText.en.includes("must"));
  assert.ok(!q.helpText.fr.includes("toujours") || !q.helpText.fr.includes("obligatoire"));
});

runTest("getAwarenessTrainingQuestion returns both locales", () => {
  const fr = awareness.getAwarenessTrainingQuestion("p6_3_001", "fr");
  const en = awareness.getAwarenessTrainingQuestion("p6_3_001", "en");
  assert.ok(typeof fr.question === "string" && fr.question.length > 0);
  assert.ok(typeof en.question === "string" && en.question.length > 0);
  assert.notEqual(fr.question, en.question);
});

runTest("getAwarenessTrainingQuestion uses exact localized phrase for p6_3_005_external", () => {
  const fr = awareness.getAwarenessTrainingQuestion("p6_3_005_external", "fr");
  const en = awareness.getAwarenessTrainingQuestion("p6_3_005_external", "en");
  assert.ok(fr.question.startsWith("Les prestataires"));
  assert.ok(en.question.startsWith("Do contractors"));
  assert.ok(!/LMS|lms|annual|phishing|quarentena/iu.test(fr.question + en.question));
});

runTest("partially_implemented maps to partial_gap and activates expected action", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_3_001",
    answer: "partially_implemented",
    hasEvidence: true,
    justification: "ok",
  });
  assert.equal(outcome.gapLevel, "partial_gap");
  const plan = remediation.deriveAwarenessTrainingRemediationPlan([
    { questionId: "p6_3_001", answer: "partially_implemented", justification: "ok", hasEvidence: true },
  ], { hasRolesRequiringSpecializedTraining: "no", hasRelevantExternalParties: "no" });
  assert.equal(plan.activeActions.length, 1);
  assert.equal(plan.activeActions[0].actionCode, "P6.3-A01");
  assert.equal(plan.activeActions[0].gapType, "partial");
});

runTest("not_implemented maps to full_gap and activates expected action", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_3_001",
    answer: "not_implemented",
    hasEvidence: true,
    justification: "ok",
  });
  assert.equal(outcome.gapLevel, "full_gap");
  const plan = remediation.deriveAwarenessTrainingRemediationPlan([
    { questionId: "p6_3_001", answer: "not_implemented", justification: "ok", hasEvidence: true },
  ], { hasRolesRequiringSpecializedTraining: "no", hasRelevantExternalParties: "no" });
  assert.equal(plan.activeActions.length, 1);
  assert.equal(plan.activeActions[0].actionCode, "P6.3-A01");
  assert.equal(plan.activeActions[0].gapType, "full");
});

runTest("implemented has no remediation action", () => {
  const plan = remediation.deriveAwarenessTrainingRemediationPlan([
    { questionId: "p6_3_001", answer: "implemented", justification: "ok", hasEvidence: true },
  ], { hasRolesRequiringSpecializedTraining: "no", hasRelevantExternalParties: "no" });
  assert.equal(plan.activeActions.length, 0);
});

runTest("not_sure creates clarification and no action", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_3_001",
    answer: "not_sure",
    hasEvidence: false,
    justification: "waiting",
  });
  assert.equal(outcome.reviewState, "clarification_required");
  const plan = remediation.deriveAwarenessTrainingRemediationPlan([
    { questionId: "p6_3_001", answer: "not_sure", justification: "waiting" },
  ], { hasRolesRequiringSpecializedTraining: "no", hasRelevantExternalParties: "no" });
  assert.equal(plan.clarifications.some((item) => item.questionId === "p6_3_001"), true);
  assert.equal(plan.activeActions.length, 0);
});

runTest("not_applicable requires non-empty justification", () => {
  const outcome1 = outcomes.deriveAssessmentOutcome({
    questionId: "p6_3_001",
    answer: "not_applicable",
    hasEvidence: true,
    justification: "",
  });
  assert.equal(outcome1.isValid, false);
  const outcome2 = outcomes.deriveAssessmentOutcome({
    questionId: "p6_3_001",
    answer: "not_applicable",
    hasEvidence: true,
    justification: "   ",
  });
  assert.equal(outcome2.isValid, false);
  const outcome3 = outcomes.deriveAssessmentOutcome({
    questionId: "p6_3_001",
    answer: "not_applicable",
    hasEvidence: true,
    justification: "Scope validated by legal/ISMS owner",
  });
  assert.equal(outcome3.isValid, true);
  assert.equal(outcome3.reviewState, "applicability_review_required");
});

runTest("not_applicable appears only in applicabilityReviews", () => {
  const plan = remediation.deriveAwarenessTrainingRemediationPlan([
    {
      questionId: "p6_3_001",
      answer: "not_applicable",
      hasEvidence: true,
      justification: "Non applicable for current operations",
    },
  ], { hasRolesRequiringSpecializedTraining: "no", hasRelevantExternalParties: "no" });
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.applicabilityReviews.includes("p6_3_001"), true);
});

runTest("evidenceStatus validated and rejected are preserved", () => {
  const validated = outcomes.deriveAssessmentOutcome({
    questionId: "p6_3_001",
    answer: "implemented",
    hasEvidence: true,
    evidenceStatus: "validated",
    justification: "ok",
  });
  assert.equal(validated.evidenceStatus, "validated");

  const rejected = outcomes.deriveAssessmentOutcome({
    questionId: "p6_3_001",
    answer: "partially_implemented",
    hasEvidence: true,
    evidenceStatus: "rejected",
    justification: "ok",
  });
  assert.equal(rejected.evidenceStatus, "rejected");
});

runTest("implemented without evidence keeps not_provided", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_3_001",
    answer: "implemented",
    hasEvidence: false,
    justification: "ok",
  });
  assert.equal(outcome.evidenceStatus, "not_provided");
});

runTest("hidden conditional response is ignored in derivation", () => {
  const plan = remediation.deriveAwarenessTrainingRemediationPlan([
    { questionId: "p6_3_004_role_based", answer: "not_implemented", justification: "old", hasEvidence: true },
  ], { hasRolesRequiringSpecializedTraining: "no", hasRelevantExternalParties: "no" });
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.clarifications.length, 0);
});

runTest("latest response per question is used", () => {
  const plan = remediation.deriveAwarenessTrainingRemediationPlan([
    { questionId: "p6_3_002", answer: "partially_implemented", justification: "old", hasEvidence: true },
    { questionId: "p6_3_002", answer: "implemented", justification: "new", hasEvidence: true },
  ], { hasRolesRequiringSpecializedTraining: "no", hasRelevantExternalParties: "no" });
  assert.equal(plan.activeActions.length, 0);
});

runTest("implemented again removes remediation action", () => {
  const plan = remediation.deriveAwarenessTrainingRemediationPlan([
    { questionId: "p6_3_003", answer: "not_implemented", justification: "old", hasEvidence: true },
    { questionId: "p6_3_003", answer: "implemented", justification: "new", hasEvidence: true },
  ], { hasRolesRequiringSpecializedTraining: "no", hasRelevantExternalParties: "no" });
  assert.equal(plan.activeActions.length, 0);
});

runTest("plan code is A6_3_AWARENESS_TRAINING_PLAN", () => {
  const plan = remediation.deriveAwarenessTrainingRemediationPlan([], {
    hasRolesRequiringSpecializedTraining: "no",
    hasRelevantExternalParties: "no",
  });
  assert.equal(plan.planCode, awareness.AWARENESS_TRAINING_PLAN_CODE);
});

runTest("all action codes are expected under full visibility", () => {
  const plan = remediation.deriveAwarenessTrainingRemediationPlan(
    [
      { questionId: "p6_3_001", answer: "not_implemented", justification: "ok", hasEvidence: true },
      { questionId: "p6_3_002", answer: "not_implemented", justification: "ok", hasEvidence: true },
      { questionId: "p6_3_003", answer: "not_implemented", justification: "ok", hasEvidence: true },
      { questionId: "p6_3_004_role_based", answer: "not_implemented", justification: "ok", hasEvidence: true },
      { questionId: "p6_3_005_external", answer: "not_implemented", justification: "ok", hasEvidence: true },
    ],
    { hasRolesRequiringSpecializedTraining: "yes", hasRelevantExternalParties: "yes" },
  );
  assert.deepEqual(
    plan.activeActions.map((item) => item.actionCode).sort(),
    ["P6.3-A01", "P6.3-A02", "P6.3-A03", "P6.3-A04", "P6.3-A05"].sort(),
  );
});

runTest("partially implemented mapping per question activates expected action code", () => {
  const data = [
    { id: "p6_3_001", code: "P6.3-A01" },
    { id: "p6_3_002", code: "P6.3-A02" },
    { id: "p6_3_003", code: "P6.3-A03" },
    { id: "p6_3_004_role_based", code: "P6.3-A04" },
    { id: "p6_3_005_external", code: "P6.3-A05" },
  ];
  for (const item of data) {
    const plan = remediation.deriveAwarenessTrainingRemediationPlan(
      [{ questionId: item.id, answer: "partially_implemented", justification: "x", hasEvidence: true }],
      {
        hasRolesRequiringSpecializedTraining: "yes",
        hasRelevantExternalParties: "yes",
      },
    );
    assert.equal(plan.activeActions.length, 1);
    assert.equal(plan.activeActions[0].actionCode, item.code);
    assert.equal(plan.activeActions[0].gapType, "partial");
  }
});

runTest("not implemented mapping per question activates expected action code", () => {
  const data = [
    { id: "p6_3_001", code: "P6.3-A01" },
    { id: "p6_3_002", code: "P6.3-A02" },
    { id: "p6_3_003", code: "P6.3-A03" },
    { id: "p6_3_004_role_based", code: "P6.3-A04" },
    { id: "p6_3_005_external", code: "P6.3-A05" },
  ];
  for (const item of data) {
    const plan = remediation.deriveAwarenessTrainingRemediationPlan(
      [{ questionId: item.id, answer: "not_implemented", justification: "x", hasEvidence: true }],
      {
        hasRolesRequiringSpecializedTraining: "yes",
        hasRelevantExternalParties: "yes",
      },
    );
    assert.equal(plan.activeActions.length, 1);
    assert.equal(plan.activeActions[0].actionCode, item.code);
    assert.equal(plan.activeActions[0].gapType, "full");
  }
});

runTest("derivation is deterministic", () => {
  const input = [
    { questionId: "p6_3_001", answer: "not_implemented", justification: "a", hasEvidence: true },
    { questionId: "p6_3_002", answer: "partially_implemented", justification: "b", hasEvidence: true },
    { questionId: "p6_3_004_role_based", answer: "implemented", justification: "c", hasEvidence: true },
    { questionId: "p6_3_005_external", answer: "implemented", justification: "d", hasEvidence: true },
  ];
  const firstPlan = remediation.deriveAwarenessTrainingRemediationPlan(input, {
    hasRolesRequiringSpecializedTraining: "yes",
    hasRelevantExternalParties: "yes",
  });
  const secondPlan = remediation.deriveAwarenessTrainingRemediationPlan(input, {
    hasRolesRequiringSpecializedTraining: "yes",
    hasRelevantExternalParties: "yes",
  });
  assert.deepEqual(firstPlan, secondPlan);
});

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("All assessment A.6.3 QA checks passed.");
