import assert from "node:assert/strict";
import fs from "node:fs";
import { technologicalControls } from "../content/assessment/technological/technological-controls.generated.ts";
import { deriveTechnologicalOutcome, deriveTechnologicalRemediationPlan, resolveTechnologicalAssessmentContext, resolveTechnologicalContext, resolveTechnologicalControl } from "../lib/assessment/technological-controls.ts";

const expected = { "a8-1": 2, "a8-2": 3, "a8-3": 1, "a8-4": 2, "a8-5": 1, "a8-6": 1, "a8-7": 1, "a8-8": 2, "a8-9": 1, "a8-10": 2, "a8-11": 2, "a8-12": 2, "a8-13": 2, "a8-14": 1, "a8-15": 1, "a8-16": 2, "a8-17": 1, "a8-18": 1, "a8-19": 1, "a8-20": 2, "a8-21": 1, "a8-22": 2, "a8-23": 2, "a8-24": 2, "a8-25": 2, "a8-26": 2, "a8-27": 2, "a8-28": 2, "a8-29": 2, "a8-30": 2, "a8-31": 2, "a8-32": 2, "a8-33": 2, "a8-34": 2 };
const readme = [
  fs.readFileSync(process.env.NORMCORE_A8_README ?? "C:/Users/HP/Downloads/README-NORMCORE-TECHNOLOGICAL-A8.1-A8.10-DETAILED.md", "utf8"),
  fs.readFileSync(process.env.NORMCORE_A8_LATER_README ?? "C:/Users/HP/Downloads/README-NORMCORE-TECHNOLOGICAL-CONTROLS-A8.11-A8.21.md", "utf8"),
  fs.readFileSync(process.env.NORMCORE_A8_FINAL_README ?? "C:/Users/HP/Downloads/README-NORMCORE-TECHNOLOGICAL-A8.22-A8.34-FINAL-SAME-FORMAT-A8.1-A8.10.md", "utf8"),
].join("\n");
assert.equal(technologicalControls.length, 34);
for (const control of technologicalControls) {
  const main = control.questions.filter((question) => !question.conditionKey);
  const conditional = control.questions.filter((question) => question.conditionKey);
  assert.equal(main.length, 3, `${control.id}: three main questions`);
  assert.equal(conditional.length, expected[control.id], `${control.id}: conditional count`);
  for (const question of control.questions) {
    assert.match(question.id, /^p8_\d+_\d+/); assert.ok(question.question.en && question.question.fr);
    assert.ok(question.partial.gapCode && question.absent.gapCode && question.partial.remediation && question.absent.remediation);
    const sourceType = question.type === "policy_process" ? "Policy / Process" : question.type === "proof_traceability" ? "Proof / Traceability" : question.type === "application" ? "Application" : "condition";
    assert.ok(readme.includes(`### \`${question.id}\` — \`${question.type}\``) || (readme.includes(`\`${question.id}\``) && readme.includes(sourceType)), `${question.id}: exact ID/type in README`);
    assert.ok(readme.includes(question.question.en) && readme.includes(question.question.fr), `${question.id}: exact EN/FR wording`);
    for (const text of [question.partial.gapCode, question.partial.gap, question.partial.remediation, question.absent.gapCode, question.absent.gap, question.absent.remediation]) assert.ok(readme.includes(text), `${question.id}: README parity ${text}`);
  }
  for (const item of control.quickContext) {
    assert.ok(readme.includes(item.key) && readme.includes(item.question.en) && readme.includes(item.question.fr), `${control.id}/${item.key}: exact Quick Context`);
  }
  const unknown = resolveTechnologicalControl(control.id, {});
  assert.equal(unknown.questionIds.length, control.id === "a8-4" ? 3 : 3);
  assert.ok(unknown.unresolvedConditions.length >= (control.id === "a8-4" ? 1 : expected[control.id]));
  const yesContext = Object.fromEntries(control.questions.filter((item) => item.conditionKey).map((item) => [item.conditionKey, "yes"]));
  const yes = resolveTechnologicalControl(control.id, yesContext);
  assert.equal(yes.questionIds.length, 3 + expected[control.id]);
  const no = resolveTechnologicalControl(control.id, Object.fromEntries(control.quickContext.map((item) => [item.key, "no"])));
  if (control.id === "a8-4") assert.equal(no.controlApplicability, "not_applicable"); else assert.equal(no.questionIds.length, 3);
  const target = yes.questionIds[0];
  const hidden = conditional[0]?.id;
  const visibleMainOnly = Object.fromEntries(control.questions.filter((item) => item.conditionKey).map((item) => [item.conditionKey, item.conditionKey === control.applicabilityKey ? "yes" : "no"]));
  const partial = deriveTechnologicalOutcome(control.id, [{ questionId: target, answer: "partially_implemented" }, ...(hidden ? [{ questionId: hidden, answer: "not_implemented" }] : [])], visibleMainOnly);
  assert.equal(partial.gapActions.length, 1, `${control.id}: hidden answers ignored`);
  assert.equal(partial.gapActions[0].gapType, "partial");
  for (const question of control.questions) {
    const visibleContext = Object.fromEntries(control.questions.filter((item) => item.conditionKey).map((item) => [item.conditionKey, "yes"]));
    const implemented = deriveTechnologicalOutcome(control.id, [{ questionId: question.id, answer: "implemented" }], visibleContext);
    assert.equal(implemented.gapActions.length, 0);
    const partialOutcome = deriveTechnologicalOutcome(control.id, [{ questionId: question.id, answer: "partially_implemented" }], visibleContext);
    assert.deepEqual(partialOutcome.gapActions[0] && { gapCode: partialOutcome.gapActions[0].gapCode, gap: partialOutcome.gapActions[0].gap, remediation: partialOutcome.gapActions[0].remediation }, { gapCode: question.partial.gapCode, gap: question.partial.gap, remediation: question.partial.remediation });
    const fullOutcome = deriveTechnologicalOutcome(control.id, [{ questionId: question.id, answer: "not_implemented" }], visibleContext);
    assert.deepEqual(fullOutcome.gapActions[0] && { gapCode: fullOutcome.gapActions[0].gapCode, gap: fullOutcome.gapActions[0].gap, remediation: fullOutcome.gapActions[0].remediation }, { gapCode: question.absent.gapCode, gap: question.absent.gap, remediation: question.absent.remediation });
    assert.equal(deriveTechnologicalRemediationPlan(control.id, partialOutcome)[0].actions[0].remediation, question.partial.remediation);
    assert.equal(deriveTechnologicalOutcome(control.id, [{ questionId: question.id, answer: "not_sure" }], visibleContext).reviewState, "clarification_required");
    assert.equal(deriveTechnologicalOutcome(control.id, [{ questionId: question.id, answer: "not_applicable", justification: "justified" }], visibleContext).reviewState, "applicability_review_required");
  }
}
assert.deepEqual(resolveTechnologicalContext({ allowsBYOD: "no" }, { allowsBYOD: "yes" }, { allowsBYOD: "yes" }), { allowsBYOD: "no" });
assert.deepEqual(resolveTechnologicalContext({}, { allowsBYOD: "yes" }, { allowsBYOD: "no" }), { allowsBYOD: "yes" });
assert.deepEqual(resolveTechnologicalContext({ allowsBYOD: "not_sure" }, { allowsBYOD: "yes" }, {}), { allowsBYOD: "not_sure" });
assert.equal(resolveTechnologicalAssessmentContext({}, {}, { allowsBYODForBusiness: "yes" }).allowsBYOD, "yes");
assert.equal(resolveTechnologicalAssessmentContext({}, {}, { usesRemovableOrPortableStorageMedia: "no" }).usesPhysicalStorageMediaRequiringSecureErasure, "no");
assert.equal(resolveTechnologicalAssessmentContext({}, {}, {}, { has_byod_devices: "yes" }).hasBYODDevices, "yes");
assert.equal(resolveTechnologicalAssessmentContext({}, {}, {}, { hasRemoteWorking: "yes" }).usesRemoteWork, "yes");
assert.equal(resolveTechnologicalAssessmentContext({}, {}, { usesCloudInfrastructure: "yes" }).usesCloudArchitecture, "yes");
const a812Unknown = resolveTechnologicalControl("a8-12", {});
assert.deepEqual(a812Unknown.requiredQuickContextQuestions.map((item) => item.key).sort(), ["hasBYODDevices", "hasExternalPartiesAccessingSensitiveInformation"].sort());
assert.equal(resolveTechnologicalControl("a8-12", { hasBYODDevices: "yes", hasExternalPartiesAccessingSensitiveInformation: "no" }).requiredQuickContextQuestions.length, 0);
const a84 = resolveTechnologicalControl("a8-4", { hasInScopeSourceCode: "not_sure" });
assert.equal(a84.assessmentBlocked, true); assert.deepEqual(a84.requiredQuickContextQuestions.map((item) => item.key), ["hasInScopeSourceCode"]);
console.log("All technological A.8.1–A.8.34 backend QA checks passed.");
