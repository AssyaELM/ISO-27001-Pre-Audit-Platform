import assert from "node:assert/strict";
import * as content from "../content/assessment/physical/physical-entry.ts";
import * as outcomes from "../lib/assessment/outcomes.ts";
import * as remediation from "../lib/assessment/physical-entry.ts";

function normalizeText(value) { return String(value).normalize("NFD").replace(/[^\w\s]/gu, "").toLowerCase(); }

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
 "p7_2_001",
 "p7_2_002",
 "p7_2_003",
 "p7_2_004_visitors_deliveries",
];

const expectedMainQuestionIds = ["p7_2_001", "p7_2_002", "p7_2_003"];
const expectedActionCodes = ["P7.2-A01", "P7.2-A02", "P7.2-A03", "P7.2-A04"];
const expectedGapCodes = [
 "A7_2_AUTHORIZATION_PARTIAL",
 "A7_2_AUTHORIZATION_ABSENT",
 "A7_2_ENTRY_CONTROL_PARTIAL",
 "A7_2_ENTRY_CONTROL_ABSENT",
 "A7_2_ACCESS_TRACEABILITY_PARTIAL",
 "A7_2_ACCESS_TRACEABILITY_ABSENT",
 "A7_2_VISITOR_DELIVERY_PARTIAL",
 "A7_2_VISITOR_DELIVERY_ABSENT",
];

const expectedAnswers = [
 "implemented",
 "partially_implemented",
 "not_implemented",
 "not_sure",
 "not_applicable",
];

function normalizeSet(items) {
 return [...items].sort();
}

runTest("1 ï¿½ Exactly four IDs are present", () => {
 assert.equal(content.physicalEntryQuestions.length, 4);
 assert.deepEqual(normalizeSet(content.physicalEntryQuestions.map((q) => q.id)), normalizeSet(expectedQuestionIds));
});

runTest("2 ï¿½ Exact question IDs set", () => {
 assert.deepEqual(content.physicalEntryQuestions.map((q) => q.id).sort(), expectedQuestionIds.slice().sort());
});

runTest("3 ï¿½ Three main questions and one conditional question", () => {
 const main = content.physicalEntryQuestions.filter((q) => q.category === "main").map((q) => q.id);
 const conditional = content.physicalEntryQuestions.filter((q) => q.category === "conditional_visitors").map((q) => q.id);
 assert.deepEqual(normalizeSet(main), normalizeSet(expectedMainQuestionIds));
 assert.deepEqual(conditional, ["p7_2_004_visitors_deliveries"]);
});

runTest("4 ï¿½ Condition key is exactly receivesVisitorsOrDeliveries", () => {
 assert.equal(content.A72QuestionIds.conditionalVisitors, "p7_2_004_visitors_deliveries");
 const questionWithCondition = content.physicalEntryQuestions.find((q) => q.id === "p7_2_004_visitors_deliveries");
 assert.equal(questionWithCondition?.conditionKey, "receivesVisitorsOrDeliveries");
});

runTest("5 ï¿½ Exactly five answer options used", () => {
 assert.deepEqual(expectedAnswers, [
   "implemented",
   "partially_implemented",
   "not_implemented",
   "not_sure",
   "not_applicable",
 ]);
 for (const question of content.physicalEntryQuestions) {
   assert.deepEqual(question.responseOptions, expectedAnswers);
 }
});

runTest("6 — Exact French labels for 5 answers", () => {
 assert.equal(normalizeText(content.A72_ANSWER_LABELS.fr.implemented), "implemente");
 assert.equal(normalizeText(content.A72_ANSWER_LABELS.fr.partially_implemented), "partiellement implemente");
 assert.ok(normalizeText(content.A72_ANSWER_LABELS.fr.not_implemented).startsWith("non impl"));
 assert.equal(content.A72_ANSWER_LABELS.fr.not_sure, "Je ne sais pas");
 assert.equal(content.A72_ANSWER_LABELS.fr.not_applicable, "Non applicable");
});

runTest("7 ï¿½ Exact English labels for 5 answers", () => {
 assert.equal(content.A72_ANSWER_LABELS.en.implemented, "Implemented");
 assert.equal(content.A72_ANSWER_LABELS.en.partially_implemented, "Partially implemented");
 assert.equal(content.A72_ANSWER_LABELS.en.not_implemented, "Not implemented");
 assert.equal(content.A72_ANSWER_LABELS.en.not_sure, "Not sure");
 assert.equal(content.A72_ANSWER_LABELS.en.not_applicable, "Not applicable");
});

runTest("8 ï¿½ not_assessed is not an answer", () => {
 assert.ok(!content.physicalEntryQuestions.some((q) => q.responseOptions.includes("not_assessed")));
});

runTest("9 ï¿½ Mapping p7_2_001 exact", () => {
 assert.equal(content.PHYSICAL_ENTRY_GAP_CODES["p7_2_001"].partial, "A7_2_AUTHORIZATION_PARTIAL");
 assert.equal(content.PHYSICAL_ENTRY_GAP_CODES["p7_2_001"].full, "A7_2_AUTHORIZATION_ABSENT");
});

runTest("10 ï¿½ Mapping p7_2_002 exact", () => {
 assert.equal(content.PHYSICAL_ENTRY_GAP_CODES["p7_2_002"].partial, "A7_2_ENTRY_CONTROL_PARTIAL");
 assert.equal(content.PHYSICAL_ENTRY_GAP_CODES["p7_2_002"].full, "A7_2_ENTRY_CONTROL_ABSENT");
});

runTest("11 ï¿½ Mapping p7_2_003 exact", () => {
 assert.equal(content.PHYSICAL_ENTRY_GAP_CODES["p7_2_003"].partial, "A7_2_ACCESS_TRACEABILITY_PARTIAL");
 assert.equal(content.PHYSICAL_ENTRY_GAP_CODES["p7_2_003"].full, "A7_2_ACCESS_TRACEABILITY_ABSENT");
});

runTest("12 ï¿½ Mapping p7_2_004_visitors_deliveries exact", () => {
 assert.equal(content.PHYSICAL_ENTRY_GAP_CODES["p7_2_004_visitors_deliveries"].partial, "A7_2_VISITOR_DELIVERY_PARTIAL");
 assert.equal(content.PHYSICAL_ENTRY_GAP_CODES["p7_2_004_visitors_deliveries"].full, "A7_2_VISITOR_DELIVERY_ABSENT");
});

runTest("13 ï¿½ Eight gap codes are exact", () => {
 const codes = Object.values(content.PHYSICAL_ENTRY_GAP_CODES).flatMap((entry) => [entry.partial, entry.full]);
 assert.deepEqual(normalizeSet(codes), normalizeSet(expectedGapCodes));
});

runTest("14 ï¿½ Action codes exist", () => {
 assert.deepEqual(normalizeSet(Object.values(remediation.physicalEntryActions).map((a) => a.actionCode)), normalizeSet(expectedActionCodes));
});

runTest("15 ï¿½ Plan code exact", () => {
 assert.equal(content.PHYSICAL_ENTRY_PLAN_CODE, "A7_2_PHYSICAL_ENTRY_PLAN");
});

runTest("16 ï¿½ French plan title exact", () => {
 assert.equal(
   normalizeText(content.PHYSICAL_ENTRY_PLAN_TITLE.fr),
   normalizeText("Autoriser contrôler et démontrer les accès physiques aux zones pertinentes"),
 );
});

runTest("17 ï¿½ English plan title exact", () => {
 assert.equal(
   content.PHYSICAL_ENTRY_PLAN_TITLE.en,
   "Authorize, control, and demonstrate physical access to relevant areas",
 );
});

runTest("18 ï¿½ Legal warning exists (FR + EN) and no personalized legal advice claim", () => {
 assert.ok(typeof content.physicalEntryLegalNotice.fr === "string" && content.physicalEntryLegalNotice.fr.length > 30);
 assert.ok(typeof content.physicalEntryLegalNotice.en === "string" && content.physicalEntryLegalNotice.en.length > 30);
 assert.ok(/conseil juridique personnalis\u00e9/i.test(content.physicalEntryLegalNotice.fr));
 assert.ok(/personalized legal advice/i.test(content.physicalEntryLegalNotice.en));
});

runTest("19 ï¿½ No A.7.3 questions", () => {
 assert.ok(content.physicalEntryQuestions.every((question) => /^p7_2_/.test(question.id)));
});

runTest("20 ï¿½ resolve: physical locations unknown is unresolved and blocked", () => {
 const resolution = content.resolvePhysicalEntryQuestions();
 assert.equal(resolution.controlApplicability, "unresolved");
 assert.equal(resolution.assessmentBlocked, true);
 assert.equal(resolution.controlReviewState, "clarification_required");
 assert.ok(resolution.unresolvedConditions.includes("hasPhysicalLocationsSupportingScope"));
});

runTest("21 ï¿½ resolve: physical locations not_sure blocks", () => {
 const resolution = content.resolvePhysicalEntryQuestions({ hasPhysicalLocationsSupportingScope: "not_sure" });
 assert.equal(resolution.controlApplicability, "unresolved");
 assert.equal(resolution.assessmentBlocked, true);
});

runTest("22 ï¿½ resolve: physical locations no masks all questions", () => {
 const resolution = content.resolvePhysicalEntryQuestions({ hasPhysicalLocationsSupportingScope: "no" });
 assert.equal(resolution.controlApplicability, "not_applicable");
 assert.equal(resolution.assessmentBlocked, true);
 assert.deepEqual(normalizeSet(resolution.questionIds), []);
 assert.deepEqual(normalizeSet(resolution.hiddenQuestionIds), normalizeSet(expectedQuestionIds));
});

runTest("23 ï¿½ resolve: physical locations yes + visitors no keeps 3 questions", () => {
 const resolution = content.resolvePhysicalEntryQuestions({
   hasPhysicalLocationsSupportingScope: "yes",
   receivesVisitorsOrDeliveries: "no",
 });
 assert.equal(resolution.controlApplicability, "applicable");
 assert.equal(resolution.assessmentBlocked, false);
 assert.equal(resolution.controlReviewState, "none");
 assert.deepEqual(normalizeSet(resolution.questionIds), normalizeSet(expectedMainQuestionIds));
});

runTest("24 ï¿½ resolve: physical locations yes + visitors yes returns 4 questions", () => {
 const resolution = content.resolvePhysicalEntryQuestions({
   hasPhysicalLocationsSupportingScope: "yes",
   receivesVisitorsOrDeliveries: "yes",
 });
 assert.equal(resolution.controlApplicability, "applicable");
 assert.equal(resolution.assessmentBlocked, false);
 assert.equal(resolution.controlReviewState, "none");
 assert.deepEqual(normalizeSet(resolution.questionIds), normalizeSet(expectedQuestionIds));
});

runTest("25 ï¿½ resolve: visitors unknown masks conditional and leaves unresolved condition", () => {
 const resolution = content.resolvePhysicalEntryQuestions({
   hasPhysicalLocationsSupportingScope: "yes",
 });
 assert.equal(resolution.controlApplicability, "applicable");
 assert.equal(resolution.assessmentBlocked, true);
 assert.equal(resolution.controlReviewState, "clarification_required");
 assert.ok(resolution.unresolvedConditions.includes("receivesVisitorsOrDeliveries"));
});

runTest("26 ï¿½ physical control blocked when locations no and justification empty", () => {
 const plan = remediation.derivePhysicalEntryRemediationPlan([], { hasPhysicalLocationsSupportingScope: "no" });
 assert.equal(plan.controlApplicability, "not_applicable");
 assert.equal(plan.requiresControlJustification, true);
 assert.equal(plan.assessmentBlocked, true);
 assert.equal(plan.activeActions.length, 0);
});

runTest("27 ï¿½ physical control not blocked when locations no with valid justification", () => {
 const plan = remediation.derivePhysicalEntryRemediationPlan(
   [],
   { hasPhysicalLocationsSupportingScope: "no" },
   "Le champ physique n'est pas dans le pï¿½rimï¿½tre",
 );
 assert.equal(plan.controlApplicability, "not_applicable");
 assert.equal(plan.assessmentBlocked, false);
 assert.equal(plan.applicabilityReviews.length, 1);
 assert.equal(plan.activeActions.length, 0);
});

runTest("28 ï¿½ condition no masks conditional and no action", () => {
 const plan = remediation.derivePhysicalEntryRemediationPlan(
   [{ questionId: "p7_2_004_visitors_deliveries", answer: "not_implemented", hasEvidence: true, justification: "legacy" }],
   { hasPhysicalLocationsSupportingScope: "yes", receivesVisitorsOrDeliveries: "no" },
 );
 assert.equal(plan.visibleQuestionIds.includes("p7_2_004_visitors_deliveries"), false);
 assert.equal(plan.activeActions.length, 0);
});

runTest("29 ï¿½ visitor condition ignored when locations no even if provided", () => {
 const plan = remediation.derivePhysicalEntryRemediationPlan(
   [
     { questionId: "p7_2_004_visitors_deliveries", answer: "not_implemented", hasEvidence: true, justification: "x" },
     { questionId: "p7_2_001", answer: "partially_implemented", hasEvidence: true, justification: "x" },
   ],
   { hasPhysicalLocationsSupportingScope: "no" },
   "Not applicable",
 );
 assert.equal(plan.controlApplicability, "not_applicable");
 assert.equal(plan.activeActions.length, 0);
});

runTest("30 ï¿½ historical masked question is ignored", () => {
 const plan = remediation.derivePhysicalEntryRemediationPlan(
   [
     { questionId: "p7_2_004_visitors_deliveries", answer: "not_implemented", hasEvidence: true, justification: "legacy" },
     { questionId: "p7_2_001", answer: "not_implemented", hasEvidence: true, justification: "now" },
   ],
   { hasPhysicalLocationsSupportingScope: "yes", receivesVisitorsOrDeliveries: "no" },
 );
 assert.equal(plan.activeActions.length, 1);
 assert.equal(plan.activeActions[0].actionCode, "P7.2-A01");
});

runTest("31 ï¿½ unresolved context prevents assessed plan", () => {
 const plan = remediation.derivePhysicalEntryRemediationPlan(
   [{ questionId: "p7_2_001", answer: "not_implemented", hasEvidence: true, justification: "x" }],
   {},
 );
 assert.equal(plan.controlApplicability, "unresolved");
 assert.equal(plan.assessmentBlocked, true);
 assert.equal(plan.activeActions.length, 0);
});

runTest("32 ï¿½ implemented returns no action", () => {
 const outcome = outcomes.deriveAssessmentOutcome({ questionId: "p7_2_001", answer: "implemented", hasEvidence: false, justification: "just" });
 assert.equal(outcome.createsGapAction, "none");
 const plan = remediation.derivePhysicalEntryRemediationPlan(
   [{ questionId: "p7_2_001", answer: "implemented", hasEvidence: false, justification: "just" }],
   { hasPhysicalLocationsSupportingScope: "yes" },
 );
 assert.equal(plan.activeActions.length, 0);
});

runTest("33 ï¿½ partially_implemented produces partial for all questions", () => {
 for (const questionId of expectedMainQuestionIds.concat(["p7_2_004_visitors_deliveries"])) {
   const plan = remediation.derivePhysicalEntryRemediationPlan(
     [{ questionId, answer: "partially_implemented", hasEvidence: true, justification: "ok" }],
     { hasPhysicalLocationsSupportingScope: "yes", receivesVisitorsOrDeliveries: "yes" },
   );
   assert.equal(plan.activeActions.length, 1);
   assert.equal(plan.activeActions[0].gapType, "partial");
   assert.equal(
     plan.activeActions[0].gapCode,
     content.PHYSICAL_ENTRY_GAP_CODES[questionId].partial,
   );
 }
});

runTest("34 ï¿½ not_implemented produces full for all questions", () => {
 for (const questionId of expectedMainQuestionIds.concat(["p7_2_004_visitors_deliveries"])) {
   const plan = remediation.derivePhysicalEntryRemediationPlan(
     [{ questionId, answer: "not_implemented", hasEvidence: true, justification: "ok" }],
     { hasPhysicalLocationsSupportingScope: "yes", receivesVisitorsOrDeliveries: "yes" },
   );
   assert.equal(plan.activeActions.length, 1);
   assert.equal(plan.activeActions[0].gapType, "full");
   assert.equal(
     plan.activeActions[0].gapCode,
     content.PHYSICAL_ENTRY_GAP_CODES[questionId].full,
   );
 }
});

runTest("35 ï¿½ not_sure creates clarification only", () => {
 const plan = remediation.derivePhysicalEntryRemediationPlan(
   [{ questionId: "p7_2_002", answer: "not_sure", hasEvidence: false, justification: "x" }],
   { hasPhysicalLocationsSupportingScope: "yes", receivesVisitorsOrDeliveries: "no" },
 );
 assert.equal(plan.activeActions.length, 0);
 assert.equal(plan.clarifications.some((item) => item.questionId === "p7_2_002"), true);
});

runTest("36 ï¿½ not_applicable requires non-empty trimmed justification", () => {
 assert.equal(
   outcomes.deriveAssessmentOutcome({ questionId: "p7_2_003", answer: "not_applicable", justification: "", hasEvidence: false }).isValid,
   false,
 );
 assert.equal(
   outcomes.deriveAssessmentOutcome({ questionId: "p7_2_003", answer: "not_applicable", justification: "   ", hasEvidence: false }).isValid,
   false,
 );
 assert.equal(
   outcomes.deriveAssessmentOutcome({ questionId: "p7_2_003", answer: "not_applicable", justification: "Scope excluded", hasEvidence: false }).isValid,
   true,
 );
});

runTest("37 ï¿½ plan with valid not_applicable keeps no gap and no action", () => {
 const plan = remediation.derivePhysicalEntryRemediationPlan(
   [{ questionId: "p7_2_002", answer: "not_applicable", justification: "Not relevant", hasEvidence: true }],
   { hasPhysicalLocationsSupportingScope: "yes", receivesVisitorsOrDeliveries: "yes" },
 );
 assert.equal(plan.activeActions.length, 0);
 assert.equal(plan.clarifications.length, 0);
 assert.equal(plan.applicabilityReviews.length, 0);
});

runTest("38 ï¿½ evidenceStatus not_provided default", () => {
 const outcome = outcomes.deriveAssessmentOutcome({ questionId: "p7_2_001", answer: "implemented", hasEvidence: false, justification: "x" });
 assert.equal(outcome.evidenceStatus, "not_provided");
});

runTest("39 ï¿½ evidenceStatus provided preserved", () => {
 const outcome = outcomes.deriveAssessmentOutcome({
   questionId: "p7_2_001",
   answer: "partially_implemented",
   hasEvidence: true,
   evidenceStatus: "provided",
   justification: "x",
 });
 assert.equal(outcome.evidenceStatus, "provided");
});

runTest("40 ï¿½ evidenceStatus validated preserved", () => {
 const outcome = outcomes.deriveAssessmentOutcome({
   questionId: "p7_2_001",
   answer: "partially_implemented",
   hasEvidence: true,
   evidenceStatus: "validated",
   justification: "x",
 });
 assert.equal(outcome.evidenceStatus, "validated");
});

runTest("41 ï¿½ evidenceStatus rejected preserved", () => {
 const outcome = outcomes.deriveAssessmentOutcome({
   questionId: "p7_2_001",
   answer: "partially_implemented",
   hasEvidence: true,
   evidenceStatus: "rejected",
   justification: "x",
 });
 assert.equal(outcome.evidenceStatus, "rejected");
});

runTest("42 ï¿½ last response per question wins", () => {
 const plan = remediation.derivePhysicalEntryRemediationPlan(
   [
     { questionId: "p7_2_002", answer: "not_implemented", hasEvidence: true, justification: "old" },
     { questionId: "p7_2_002", answer: "implemented", hasEvidence: true, justification: "new" },
   ],
   { hasPhysicalLocationsSupportingScope: "yes", receivesVisitorsOrDeliveries: "yes" },
 );
 assert.equal(plan.activeActions.length, 0);
});

runTest("43 ï¿½ actions deduplicated by actionCode", () => {
 const plan = remediation.derivePhysicalEntryRemediationPlan(
   [
     { questionId: "p7_2_001", answer: "not_implemented", justification: "old", hasEvidence: true },
     { questionId: "p7_2_001", answer: "not_implemented", justification: "new", hasEvidence: true },
   ],
   { hasPhysicalLocationsSupportingScope: "yes", receivesVisitorsOrDeliveries: "yes" },
 );
 assert.equal(plan.activeActions.length, 1);
 assert.equal(plan.activeActions[0].actionCode, "P7.2-A01");
});

runTest("44 ï¿½ implemented after previous non-implemented removes action", () => {
 const plan = remediation.derivePhysicalEntryRemediationPlan(
   [
     { questionId: "p7_2_002", answer: "not_implemented", justification: "old", hasEvidence: true },
     { questionId: "p7_2_002", answer: "implemented", justification: "new", hasEvidence: true },
   ],
   { hasPhysicalLocationsSupportingScope: "yes", receivesVisitorsOrDeliveries: "yes" },
 );
 assert.equal(plan.activeActions.length, 0);
});

runTest("45 ï¿½ partial-to-full updates same action", () => {
 const plan = remediation.derivePhysicalEntryRemediationPlan(
   [
     { questionId: "p7_2_003", answer: "partially_implemented", justification: "old", hasEvidence: true },
     { questionId: "p7_2_003", answer: "not_implemented", justification: "new", hasEvidence: true },
   ],
   { hasPhysicalLocationsSupportingScope: "yes", receivesVisitorsOrDeliveries: "yes" },
 );
 assert.equal(plan.activeActions.length, 1);
 assert.equal(plan.activeActions[0].gapType, "full");
 assert.equal(plan.activeActions[0].gapCode, content.PHYSICAL_ENTRY_GAP_CODES["p7_2_003"].full);
});

runTest("46 ï¿½ no universal badge obligation", () => {
 const dump = JSON.stringify(content.physicalEntryQuestions);
 assert.equal(/badge visiteur obligatoire|badges obligatoires|obligation de badge|visitors? must always wear badge/i.test(dump), false);
});

runTest("47 ï¿½ no universal biometrics", () => {
 const dump = JSON.stringify(content.physicalEntryQuestions);
 assert.equal(/biom\u00e9tr|biometric/i.test(dump), false);
});

runTest("48 ï¿½ no mandatory guard or permanent reception", () => {
 const dump = JSON.stringify(content.physicalEntryQuestions);
 assert.equal(/gardien obligatoire|reception permanente obligatoire|toujours gardien|24\/7|always.*guard/i.test(dump), false);
});

runTest("49 ï¿½ no fixed retention 30/90 days and no mandatory periodic review", () => {
 const dump = JSON.stringify(content.physicalEntryQuestions) + " " + content.physicalEntryLegalNotice.en + " " + content.physicalEntryLegalNotice.fr;
 assert.equal(/\b30\s*(days|jours)\b|\b90\s*(days|jours)\b/i.test(dump), false);
 assert.equal(/revue (mensuelle|quarterly|trimestrielle|annual|annualle|annuelle)/i.test(dump), false);
 assert.equal(/r\u00e9vocation.*en \d+ (hours|heures)/i.test(dump), false);
});

runTest("50 ï¿½ cloud-first does not auto set not_applicable", () => {
 const plan = remediation.derivePhysicalEntryRemediationPlan(
   [
     { questionId: "p7_2_001", answer: "implemented", hasEvidence: true, justification: "legacy" },
     { questionId: "p7_2_002", answer: "implemented", hasEvidence: true, justification: "legacy" },
     { questionId: "p7_2_003", answer: "implemented", hasEvidence: true, justification: "legacy" },
     { questionId: "p7_2_004_visitors_deliveries", answer: "implemented", hasEvidence: true, justification: "legacy" },
   ],
   { hasPhysicalLocationsSupportingScope: "yes", receivesVisitorsOrDeliveries: "yes" },
 );
 assert.equal(plan.activeActions.length, 0);
 assert.equal(plan.controlApplicability, "applicable");
});

if (process.exitCode) {
 process.exit(process.exitCode);
}

console.log("All A.7.2 physical entry QA checks passed.");






