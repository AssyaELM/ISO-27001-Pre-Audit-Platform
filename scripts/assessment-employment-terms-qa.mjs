import assert from "node:assert/strict";

const terms = await import("../content/assessment/people/employment-terms.ts");
const remediation = await import("../lib/assessment/employment-terms.ts");

function test(name, fn) { try { fn(); console.log(`PASS ${name}`); } catch (error) { console.error(`FAIL ${name}`); throw error; } }

test("catalogue has four main questions and two variants", () => {
  assert.deepEqual(terms.employmentTermsQuestions.map((q) => q.id), ["p6_2_001", "p6_2_002", "p6_2_003", "p6_2_004", "p6_2_005_external", "p6_2_005_change"]);
  assert.equal(terms.employmentTermsQuestions.filter((q) => q.category === "mandatory").length, 4);
});

test("approved main wording and proof type are present", () => {
  const q1 = terms.employmentTermsQuestionById("p6_2_001");
  const q4 = terms.employmentTermsQuestionById("p6_2_004");
  assert.equal(q1?.question.en, "Has your organization defined the information security responsibilities that must be included in applicable employment or engagement agreements?");
  assert.equal(q4?.type, "proof_traceability");
  assert.equal(q4?.question.en, "Does your organization retain evidence identifying the accepted agreement, its version, its date, and the person or personnel category concerned?");
});

test("external conditional has priority and one maximum variant", () => {
  const cases = [
    [{ hasExternalPersonnel: "no", hasSignificantChanges: "no" }, 4, undefined],
    [{ hasExternalPersonnel: "yes", hasSignificantChanges: "no" }, 5, "p6_2_005_external"],
    [{ hasExternalPersonnel: "no", hasSignificantChanges: "yes" }, 5, "p6_2_005_change"],
    [{ hasExternalPersonnel: "yes", hasSignificantChanges: "yes" }, 5, "p6_2_005_external"],
  ];
  for (const [context, count, conditional] of cases) {
    const result = terms.resolveEmploymentTermsQuestions(context);
    assert.equal(result.questionIds.length, count);
    assert.equal(result.questionIds.filter((id) => id.startsWith("p6_2_005_")).length, conditional ? 1 : 0);
    if (conditional) assert.ok(result.questionIds.includes(conditional));
  }
});

test("unknown context preserves main questions and hidden stale answers are ignored", () => {
  const result = terms.resolveEmploymentTermsQuestions({ hasExternalPersonnel: "not_sure", hasSignificantChanges: "not_sure" });
  assert.deepEqual(result.questionIds, ["p6_2_001", "p6_2_002", "p6_2_003", "p6_2_004"]);
  const plan = remediation.deriveEmploymentTermsRemediationPlan([{ questionId: "p6_2_005_external", answer: "not_implemented" }], { hasExternalPersonnel: "no", hasSignificantChanges: "no" });
  assert.equal(plan.activeActions.length, 0);
});

console.log("All corrected A.6.2 QA checks passed.");
