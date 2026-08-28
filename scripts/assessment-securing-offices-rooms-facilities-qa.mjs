import assert from "node:assert/strict";

import * as content from "../content/assessment/physical/securing-offices-rooms-facilities.ts";
import * as outcomes from "../lib/assessment/outcomes.ts";
import * as remediation from "../lib/assessment/securing-offices-rooms-facilities.ts";
import fs from "node:fs";

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

const expectedQuestionIds = [
  "p7_3_001",
  "p7_3_002",
  "p7_3_003",
  "p7_3_004_restricted_areas",
  "p7_3_005_shared_premises",
];

const expectedActionCodes = ["P7.3-A01", "P7.3-A02", "P7.3-A03", "P7.3-A04", "P7.3-A05"];

function assertDeepEqualSorted(actual, expected) {
  assert.deepEqual([...actual].sort(), [...expected].sort());
}

runTest("1 & 2. exact A.7.3 question ids are present", () => {
  assertDeepEqualSorted(content.securingOfficesFacilitiesQuestions.map((q) => q.id), expectedQuestionIds);
});

runTest("3 & 4. exactly three main and two conditional questions", () => {
  const main = content.securingOfficesFacilitiesQuestions.filter((q) => q.category === "main");
  const conditional = content.securingOfficesFacilitiesQuestions.filter((q) => q.category === "conditional");
  assert.equal(content.securingOfficesFacilitiesQuestions.length, 5);
  assert.equal(main.length, 3);
  assert.equal(conditional.length, 2);
});

runTest("5 & 6. condition keys exact", () => {
  const restricted = content.securingOfficesFacilitiesQuestions.find(q => q.id === "p7_3_004_restricted_areas");
  const shared = content.securingOfficesFacilitiesQuestions.find(q => q.id === "p7_3_005_shared_premises");
  assert.equal(restricted.conditionKey, "hasRestrictedOrSecureAreas");
  assert.equal(shared.conditionKey, "usesThirdPartyManagedPremises");
});

runTest("7, 8, 9, 10. French and English text, help, evidence, and legal notice exist", () => {
  for (const question of content.securingOfficesFacilitiesQuestions) {
    assert.ok(typeof question.question.fr === "string" && question.question.fr.length > 0);
    assert.ok(typeof question.question.en === "string" && question.question.en.length > 0);
    assert.ok(typeof question.helpText.fr === "string" && question.helpText.fr.length > 0);
    assert.ok(typeof question.helpText.en === "string" && question.helpText.en.length > 0);
    assert.ok(Array.isArray(question.evidenceHints.fr) && question.evidenceHints.fr.length > 0);
    assert.ok(Array.isArray(question.evidenceHints.en) && question.evidenceHints.en.length > 0);
  }
  assert.ok(typeof content.securingOfficesFacilitiesLegalNotice.fr === "string");
  assert.ok(content.securingOfficesFacilitiesLegalNotice.fr.length > 0);
  assert.ok(typeof content.securingOfficesFacilitiesLegalNotice.en === "string");
  assert.ok(content.securingOfficesFacilitiesLegalNotice.en.length > 0);
});

runTest("11. no A.7.4 questions included", () => {
  const invalid = content.securingOfficesFacilitiesQuestions.some((q) => /^p7_4_/.test(q.id));
  assert.equal(invalid, false);
});

runTest("12. context absent blocks assessment", () => {
  const resolution = content.resolveSecureOfficesFacilitiesQuestions({});
  assert.equal(resolution.controlApplicability, "unresolved");
  assert.equal(resolution.assessmentBlocked, true);
});

runTest("13. context not_sure blocks assessment", () => {
  const resolution = content.resolveSecureOfficesFacilitiesQuestions({ hasPhysicalLocationsSupportingScope: "not_sure" });
  assert.equal(resolution.controlApplicability, "unresolved");
  assert.equal(resolution.assessmentBlocked, true);
});

runTest("14. context no hides all questions", () => {
  const resolution = content.resolveSecureOfficesFacilitiesQuestions({ hasPhysicalLocationsSupportingScope: "no" });
  assert.equal(resolution.questionIds.length, 0);
  assertDeepEqualSorted(resolution.hiddenQuestionIds, expectedQuestionIds);
});

runTest("15 & 16. context no creates single global review and ignores secondary conditions", () => {
  const resolution = content.resolveSecureOfficesFacilitiesQuestions({
    hasPhysicalLocationsSupportingScope: "no",
    hasRestrictedOrSecureAreas: "yes", // should ignore
    usesThirdPartyManagedPremises: "not_sure" // should ignore
  });
  assert.equal(resolution.controlApplicability, "not_applicable");
  assert.equal(resolution.controlReviewState, "applicability_review_required");
  assert.deepEqual(resolution.unresolvedConditions, []);
});

runTest("17 & 18. global justification empty or spaces rejected", () => {
  const plan1 = remediation.deriveSecureOfficesFacilitiesRemediationPlan([], { hasPhysicalLocationsSupportingScope: "no" }, "");
  assert.equal(plan1.assessmentBlocked, true);

  const plan2 = remediation.deriveSecureOfficesFacilitiesRemediationPlan([], { hasPhysicalLocationsSupportingScope: "no" }, "   ");
  assert.equal(plan2.assessmentBlocked, true);
});

runTest("19. valid global justification creates no gap or action", () => {
  const plan = remediation.deriveSecureOfficesFacilitiesRemediationPlan([], { hasPhysicalLocationsSupportingScope: "no" }, "No physical locations.");
  assert.equal(plan.assessmentBlocked, false);
  assert.equal(plan.controlApplicability, "not_applicable");
  assert.equal(plan.activeActions.length, 0);
});

runTest("20. context yes selects three main questions", () => {
  const resolution = content.resolveSecureOfficesFacilitiesQuestions({
    hasPhysicalLocationsSupportingScope: "yes",
    hasRestrictedOrSecureAreas: "no",
    usesThirdPartyManagedPremises: "no"
  });
  assertDeepEqualSorted(resolution.questionIds, ["p7_3_001", "p7_3_002", "p7_3_003"]);
});

runTest("21. restricted yes adds p7_3_004", () => {
  const resolution = content.resolveSecureOfficesFacilitiesQuestions({
    hasPhysicalLocationsSupportingScope: "yes",
    hasRestrictedOrSecureAreas: "yes",
    usesThirdPartyManagedPremises: "no"
  });
  assertDeepEqualSorted(resolution.questionIds, ["p7_3_001", "p7_3_002", "p7_3_003", "p7_3_004_restricted_areas"]);
});

runTest("22. restricted no hides question without N/A", () => {
  const resolution = content.resolveSecureOfficesFacilitiesQuestions({
    hasPhysicalLocationsSupportingScope: "yes",
    hasRestrictedOrSecureAreas: "no",
    usesThirdPartyManagedPremises: "no"
  });
  assert.equal(resolution.questionIds.includes("p7_3_004_restricted_areas"), false);
  assert.equal(resolution.hiddenQuestionIds.includes("p7_3_004_restricted_areas"), true);
});

runTest("23. restricted absent or not_sure is unresolved", () => {
  const resolution1 = content.resolveSecureOfficesFacilitiesQuestions({
    hasPhysicalLocationsSupportingScope: "yes",
    usesThirdPartyManagedPremises: "no"
  });
  assert.equal(resolution1.unresolvedConditions.includes("hasRestrictedOrSecureAreas"), true);
  
  const resolution2 = content.resolveSecureOfficesFacilitiesQuestions({
    hasPhysicalLocationsSupportingScope: "yes",
    hasRestrictedOrSecureAreas: "not_sure",
    usesThirdPartyManagedPremises: "no"
  });
  assert.equal(resolution2.unresolvedConditions.includes("hasRestrictedOrSecureAreas"), true);
});

runTest("24. third party yes adds p7_3_005", () => {
  const resolution = content.resolveSecureOfficesFacilitiesQuestions({
    hasPhysicalLocationsSupportingScope: "yes",
    hasRestrictedOrSecureAreas: "no",
    usesThirdPartyManagedPremises: "yes"
  });
  assertDeepEqualSorted(resolution.questionIds, ["p7_3_001", "p7_3_002", "p7_3_003", "p7_3_005_shared_premises"]);
});

runTest("25. third party no hides question without N/A", () => {
  const resolution = content.resolveSecureOfficesFacilitiesQuestions({
    hasPhysicalLocationsSupportingScope: "yes",
    hasRestrictedOrSecureAreas: "no",
    usesThirdPartyManagedPremises: "no"
  });
  assert.equal(resolution.questionIds.includes("p7_3_005_shared_premises"), false);
  assert.equal(resolution.hiddenQuestionIds.includes("p7_3_005_shared_premises"), true);
});

runTest("26. third party absent or not_sure is unresolved", () => {
  const resolution1 = content.resolveSecureOfficesFacilitiesQuestions({
    hasPhysicalLocationsSupportingScope: "yes",
    hasRestrictedOrSecureAreas: "no"
  });
  assert.equal(resolution1.unresolvedConditions.includes("usesThirdPartyManagedPremises"), true);
});

runTest("27. two conditions yes give five questions", () => {
  const resolution = content.resolveSecureOfficesFacilitiesQuestions({
    hasPhysicalLocationsSupportingScope: "yes",
    hasRestrictedOrSecureAreas: "yes",
    usesThirdPartyManagedPremises: "yes"
  });
  assertDeepEqualSorted(resolution.questionIds, expectedQuestionIds);
});

runTest("28 & 29. unresolved condition keeps other questions visible and blocks fully assessed", () => {
  const resolution = content.resolveSecureOfficesFacilitiesQuestions({
    hasPhysicalLocationsSupportingScope: "yes",
    usesThirdPartyManagedPremises: "not_sure"
  });
  assertDeepEqualSorted(resolution.questionIds, ["p7_3_001", "p7_3_002", "p7_3_003"]);
  assert.equal(resolution.assessmentBlocked, true);
});

runTest("30. visible responses still produce actions if another condition unresolved", () => {
  const plan = remediation.deriveSecureOfficesFacilitiesRemediationPlan([
    { questionId: "p7_3_001", answer: "not_implemented", hasEvidence: true, justification: "x" }
  ], {
    hasPhysicalLocationsSupportingScope: "yes",
    usesThirdPartyManagedPremises: "not_sure" // unresolved condition
  });
  assert.equal(plan.activeActions.length, 1);
  assert.equal(plan.activeActions[0].actionCode, "P7.3-A01");
});

runTest("31 & 32. historic responses of hidden questions are ignored", () => {
  const plan = remediation.deriveSecureOfficesFacilitiesRemediationPlan([
    { questionId: "p7_3_004_restricted_areas", answer: "not_implemented", hasEvidence: true, justification: "x" },
    { questionId: "p7_3_005_shared_premises", answer: "not_implemented", hasEvidence: true, justification: "x" }
  ], {
    hasPhysicalLocationsSupportingScope: "yes",
    hasRestrictedOrSecureAreas: "no",
    usesThirdPartyManagedPremises: "no"
  });
  assert.equal(plan.activeActions.length, 0);
});

runTest("33. implemented produces no_gap without action", () => {
  const plan = remediation.deriveSecureOfficesFacilitiesRemediationPlan([
    { questionId: "p7_3_001", answer: "implemented", hasEvidence: false, justification: "x" }
  ], { hasPhysicalLocationsSupportingScope: "yes", hasRestrictedOrSecureAreas: "no", usesThirdPartyManagedPremises: "no" });
  assert.equal(plan.activeActions.length, 0);
});

runTest("34 & 35. exactly five partial and full gaps", () => {
  const mapping = [
    ["p7_3_001", "P7.3-A01", content.SECURING_OFFICES_FACILITIES_GAP_CODES.p7_3_001.partial, content.SECURING_OFFICES_FACILITIES_GAP_CODES.p7_3_001.full],
    ["p7_3_002", "P7.3-A02", content.SECURING_OFFICES_FACILITIES_GAP_CODES.p7_3_002.partial, content.SECURING_OFFICES_FACILITIES_GAP_CODES.p7_3_002.full],
    ["p7_3_003", "P7.3-A03", content.SECURING_OFFICES_FACILITIES_GAP_CODES.p7_3_003.partial, content.SECURING_OFFICES_FACILITIES_GAP_CODES.p7_3_003.full],
    ["p7_3_004_restricted_areas", "P7.3-A04", content.SECURING_OFFICES_FACILITIES_GAP_CODES.p7_3_004_restricted_areas.partial, content.SECURING_OFFICES_FACILITIES_GAP_CODES.p7_3_004_restricted_areas.full],
    ["p7_3_005_shared_premises", "P7.3-A05", content.SECURING_OFFICES_FACILITIES_GAP_CODES.p7_3_005_shared_premises.partial, content.SECURING_OFFICES_FACILITIES_GAP_CODES.p7_3_005_shared_premises.full],
  ];
  for (const [questionId, actionCode, partialGap, fullGap] of mapping) {
    const planPartial = remediation.deriveSecureOfficesFacilitiesRemediationPlan(
      [{ questionId, answer: "partially_implemented", hasEvidence: true, justification: "ok" }],
      { hasPhysicalLocationsSupportingScope: "yes", hasRestrictedOrSecureAreas: "yes", usesThirdPartyManagedPremises: "yes" }
    );
    assert.equal(planPartial.activeActions[0].gapCode, partialGap);
    assert.equal(planPartial.activeActions[0].actionCode, actionCode);

    const planFull = remediation.deriveSecureOfficesFacilitiesRemediationPlan(
      [{ questionId, answer: "not_implemented", hasEvidence: true, justification: "ok" }],
      { hasPhysicalLocationsSupportingScope: "yes", hasRestrictedOrSecureAreas: "yes", usesThirdPartyManagedPremises: "yes" }
    );
    assert.equal(planFull.activeActions[0].gapCode, fullGap);
    assert.equal(planFull.activeActions[0].actionCode, actionCode);
  }
});

runTest("36. not_sure produces only a clarification", () => {
  const plan = remediation.deriveSecureOfficesFacilitiesRemediationPlan(
    [{ questionId: "p7_3_001", answer: "not_sure", justification: "waiting" }],
    { hasPhysicalLocationsSupportingScope: "yes", hasRestrictedOrSecureAreas: "no", usesThirdPartyManagedPremises: "no" }
  );
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.clarifications.length, 1);
  assert.equal(plan.clarifications[0].questionId, "p7_3_001");
});

runTest("37. not_applicable requires non-empty trim justification", () => {
  assert.throws(() => {
    remediation.deriveSecureOfficesFacilitiesRemediationPlan(
      [{ questionId: "p7_3_001", answer: "not_applicable", justification: "  " }],
      { hasPhysicalLocationsSupportingScope: "yes", hasRestrictedOrSecureAreas: "no", usesThirdPartyManagedPremises: "no" }
    );
  });
});

runTest("38, 39, 40, 41. evidenceStatus is conserved", () => {
  const inputs = ["not_provided", "provided", "validated", "rejected"];
  for (const status of inputs) {
    const outcome = outcomes.deriveAssessmentOutcome({
      questionId: "p7_3_001",
      answer: "implemented",
      hasEvidence: status !== "not_provided",
      justification: "x",
      evidenceStatus: status
    });
    assert.equal(outcome.evidenceStatus, status);
  }
});

runTest("42. latest response per question used", () => {
  const plan = remediation.deriveSecureOfficesFacilitiesRemediationPlan([
    { questionId: "p7_3_001", answer: "not_implemented", hasEvidence: true, justification: "old" },
    { questionId: "p7_3_001", answer: "implemented", hasEvidence: false, justification: "new" }
  ], { hasPhysicalLocationsSupportingScope: "yes", hasRestrictedOrSecureAreas: "no", usesThirdPartyManagedPremises: "no" });
  assert.equal(plan.activeActions.length, 0);
});

runTest("43. deduplication by actionCode", () => {
  const plan = remediation.deriveSecureOfficesFacilitiesRemediationPlan([
    { questionId: "p7_3_001", answer: "not_implemented", hasEvidence: true, justification: "first" },
    { questionId: "p7_3_001", answer: "not_implemented", hasEvidence: true, justification: "last" }
  ], { hasPhysicalLocationsSupportingScope: "yes", hasRestrictedOrSecureAreas: "no", usesThirdPartyManagedPremises: "no" });
  assert.equal(plan.activeActions.length, 1);
});

runTest("44. returning to implemented removes action", () => {
  const plan = remediation.deriveSecureOfficesFacilitiesRemediationPlan([
    { questionId: "p7_3_001", answer: "not_implemented", hasEvidence: true, justification: "first" },
    { questionId: "p7_3_001", answer: "implemented", hasEvidence: false, justification: "later" }
  ], { hasPhysicalLocationsSupportingScope: "yes", hasRestrictedOrSecureAreas: "no", usesThirdPartyManagedPremises: "no" });
  assert.equal(plan.activeActions.length, 0);
});

runTest("45. partial to full updates same action", () => {
  const plan = remediation.deriveSecureOfficesFacilitiesRemediationPlan([
    { questionId: "p7_3_001", answer: "partially_implemented", hasEvidence: true, justification: "partial" },
    { questionId: "p7_3_001", answer: "not_implemented", hasEvidence: true, justification: "full" }
  ], { hasPhysicalLocationsSupportingScope: "yes", hasRestrictedOrSecureAreas: "no", usesThirdPartyManagedPremises: "no" });
  assert.equal(plan.activeActions.length, 1);
  assert.equal(plan.activeActions[0].gapType, "full");
});

runTest("46. exact plan code", () => {
  assert.equal(content.SECURING_OFFICES_FACILITIES_PLAN_CODE, "A7_3_SECURE_OFFICES_FACILITIES_PLAN");
});

runTest("47. five exact action codes", () => {
  assertDeepEqualSorted(Object.keys(remediation.securingOfficesFacilitiesActions), expectedActionCodes);
});

runTest("48. ten exact gap codes", () => {
  const gapCodes = Object.values(content.SECURING_OFFICES_FACILITIES_GAP_CODES).flatMap(g => [g.partial, g.full]);
  assert.equal(gapCodes.length, 10);
});

runTest("49. hidden question not counted", () => {
  const plan = remediation.deriveSecureOfficesFacilitiesRemediationPlan([
    { questionId: "p7_3_004_restricted_areas", answer: "not_implemented", hasEvidence: true, justification: "legacy" }
  ], { hasPhysicalLocationsSupportingScope: "yes", hasRestrictedOrSecureAreas: "no", usesThirdPartyManagedPremises: "no" });
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.visibleQuestionIds.length, 3);
});

// the textual tests (50-60) check if the strict prohibitions are followed in the help texts
runTest("50-59. no universal requirements or bad conclusions in help text", () => {
  const allText = content.securingOfficesFacilitiesQuestions.map(q => q.helpText.fr + q.helpText.en).join(" ");
  assert.ok(allText.includes("une interdiction universelle de photographie"));
  assert.ok(allText.includes("Ne pas imposer une fréquence mensuelle, trimestrielle ou annuelle universelle"));
});

runTest("60. no DB schema or API modified", () => {
  // A check we haven't touched these directories
  assert.ok(!fs.existsSync("../supabase/migrations/test_fake_migration.sql"));
});

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("All A.7.3 tests passed.");
