import assert from "node:assert/strict";

import * as infra from "../content/assessment-infrastructure.ts";
import * as content from "../content/assessment/people/event-reporting.ts";
import * as outcomes from "../lib/assessment/outcomes.ts";
import * as remediation from "../lib/assessment/event-reporting.ts";

function runTest(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
    return true;
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error?.message ?? error);
    throw error;
  }
}

function sorted(values) {
  return [...values].sort();
}

function containsAll(arr, target) {
  return arr.includes(target);
}

const expectedIds = [
  "p6_8_001",
  "p6_8_002",
  "p6_8_003",
  "p6_8_004_external",
];

const mappings = [
  {
    questionId: "p6_8_001",
    partialGap: "A6_8_MECHANISM_PARTIAL",
    fullGap: "A6_8_MECHANISM_ABSENT",
    action: "P6.8-A01",
  },
  {
    questionId: "p6_8_002",
    partialGap: "A6_8_AWARENESS_PARTIAL",
    fullGap: "A6_8_AWARENESS_ABSENT",
    action: "P6.8-A02",
  },
  {
    questionId: "p6_8_003",
    partialGap: "A6_8_TRACEABILITY_PARTIAL",
    fullGap: "A6_8_TRACEABILITY_ABSENT",
    action: "P6.8-A03",
  },
  {
    questionId: "p6_8_004_external",
    partialGap: "A6_8_EXTERNAL_REPORTING_PARTIAL",
    fullGap: "A6_8_EXTERNAL_REPORTING_ABSENT",
    action: "P6.8-A04",
  },
];

const conditionalId = "p6_8_004_external";

const requiredMandatoryQuestionsFr = [
  "Votre organisation a-t-elle défini un mécanisme simple et accessible indiquant quels événements ou faiblesses doivent être signalés, par quels canaux et avec quel niveau d’urgence ?",
  "Les personnes concernées savent-elles reconnaître et signaler rapidement un événement ou une faiblesse suspectée, sans devoir déterminer elles-mêmes s’il s’agit d’un incident confirmé ?",
  "Les signalements reçus sont-ils horodatés, enregistrés, accusés réception et transmis aux responsables appropriés, et le mécanisme est-il périodiquement vérifié ou amélioré ?",
];

const requiredMandatoryQuestionsEn = [
  "Has your organization defined a simple and accessible mechanism specifying which information security events or weaknesses should be reported, through which channels, and with what level of urgency?",
  "Do the relevant people know how to recognize and promptly report a suspected information security event or weakness without having to determine whether it is a confirmed incident?",
  "Are received reports timestamped, recorded, acknowledged, and handed to the appropriate owners, and is the reporting mechanism periodically checked or improved?",
];

const requiredConditionalQuestionFr =
  "Les fournisseurs, consultants, partenaires ou autres parties externes pertinentes disposent-ils d’un canal approprié pour signaler rapidement les événements ou faiblesses liés au périmètre ?";
const requiredConditionalQuestionEn =
  "Do suppliers, consultants, partners, or other relevant external parties have an appropriate channel for promptly reporting events or weaknesses related to the scope?";

const forbiddenDuplications = ["full duplication a.5.25", "full duplication a.5.26"];

runTest("01 - exactly four A.6.8 definitions", () => {
  assert.equal(content.eventReportingQuestions.length, 4);
  assert.deepEqual(sorted(content.eventReportingQuestions.map((q) => q.id)), sorted(expectedIds));
});

runTest("02 - only exact IDs are present", () => {
  assert.deepEqual(sorted(content.eventReportingQuestions.map((q) => q.id)), sorted(expectedIds));
});

runTest("03 - exactly three mandatory and one conditional question", () => {
  const mandatory = content.eventReportingQuestions.filter((q) => q.category === "mandatory");
  const conditional = content.eventReportingQuestions.filter((q) => q.category === "conditional_external");
  assert.equal(mandatory.length, 3);
  assert.equal(conditional.length, 1);
  assert.deepEqual(sorted(mandatory.map((q) => q.id)), sorted(["p6_8_001", "p6_8_002", "p6_8_003"]));
  assert.deepEqual(sorted(conditional.map((q) => q.id)), [conditionalId]);
});

runTest("04 - exact condition key", () => {
  const conditional = content.eventReportingQuestions.find((q) => q.id === conditionalId);
  assert.equal(conditional?.conditionKey, "hasRelevantExternalParties");
});

runTest("05 - answer options are exactly five technical values", () => {
  assert.deepEqual(infra.assessmentAnswerValues, [
    "implemented",
    "partially_implemented",
    "not_implemented",
    "not_sure",
    "not_applicable",
  ]);
});

runTest("06 - not_assessed is not an answer option", () => {
  assert.equal(infra.assessmentAnswerValues.includes("not_assessed"), false);
});

runTest("07 - all question IDs (FR/EN), help and evidence fields exist", () => {
  for (const q of content.eventReportingQuestions) {
    assert.equal(typeof q.question.fr, "string");
    assert.equal(typeof q.question.en, "string");
    assert.equal(typeof q.helpText.fr, "string");
    assert.equal(typeof q.helpText.en, "string");
    assert.equal(Array.isArray(q.evidenceHints.fr), true);
    assert.equal(Array.isArray(q.evidenceHints.en), true);
  }
});

runTest("08 - exact FR/EN legal warning exists", () => {
  assert.equal(typeof content.eventReportingLegalNotice.fr, "string");
  assert.equal(typeof content.eventReportingLegalNotice.en, "string");
  assert.equal(content.eventReportingLegalNotice.fr.includes("NormCore ne fournit aucun conseil juridique"), true);
  assert.equal(content.eventReportingLegalNotice.en.includes("NormCore does not provide personalized legal advice"), true);
});

runTest("09 - without context: three visible questions", () => {
  const resolution = content.resolveEventReportingQuestions({});
  assert.deepEqual(sorted(resolution.questionIds), sorted(["p6_8_001", "p6_8_002", "p6_8_003"]));
  assert.deepEqual(sorted(resolution.hiddenQuestionIds), sorted([conditionalId]));
  assert.deepEqual(resolution.unresolvedConditions, ["hasRelevantExternalParties"]);
});

runTest("10 - context yes: four questions visible", () => {
  const resolution = content.resolveEventReportingQuestions({ hasRelevantExternalParties: "yes" });
  assert.deepEqual(sorted(resolution.questionIds), sorted(expectedIds));
  assert.deepEqual(resolution.hiddenQuestionIds, []);
  assert.deepEqual(resolution.unresolvedConditions, []);
});

runTest("11 - context no: conditional hidden", () => {
  const resolution = content.resolveEventReportingQuestions({ hasRelevantExternalParties: "no" });
  assert.deepEqual(sorted(resolution.questionIds), sorted(["p6_8_001", "p6_8_002", "p6_8_003"]));
  assert.deepEqual(sorted(resolution.hiddenQuestionIds), sorted([conditionalId]));
  assert.deepEqual(resolution.unresolvedConditions, []);
});

runTest("12 - context not_sure: unresolved condition persists", () => {
  const resolution = content.resolveEventReportingQuestions({ hasRelevantExternalParties: "not_sure" });
  assert.deepEqual(sorted(resolution.questionIds), sorted(["p6_8_001", "p6_8_002", "p6_8_003"]));
  assert.deepEqual(sorted(resolution.hiddenQuestionIds), sorted([conditionalId]));
  assert.deepEqual(sorted(resolution.unresolvedConditions), ["hasRelevantExternalParties"]);
});

runTest("13 - get helpers include all questions", () => {
  const all = content.getAllEventReportingQuestions("en");
  assert.equal(all.length, 4);
  assert.deepEqual(sorted(all.map((q) => q.id)), sorted(expectedIds));
});

runTest("14 - isEventReportingQuestion works", () => {
  assert.equal(content.isEventReportingQuestion(conditionalId), true);
  assert.equal(content.isEventReportingQuestion("p6_8_999"), false);
});

runTest("15 - getEventReportingQuestion works", () => {
  const item = content.getEventReportingQuestion("p6_8_002", "fr");
  assert.equal(item.id, "p6_8_002");
  assert.equal(item.question.length > 10, true);
  assert.equal(item.responseOptions.includes("implemented"), true);
});

runTest("16 - implemented outcome is no_gap with no action", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_8_002",
    answer: "implemented",
    hasEvidence: true,
    evidenceStatus: "provided",
    justification: "ok",
  });
  assert.equal(outcome.gapLevel, "no_gap");
  assert.equal(outcome.reviewState, "none");
  assert.equal(outcome.createsGapAction, "none");

  const plan = remediation.deriveEventReportingRemediationPlan([
    { questionId: "p6_8_002", answer: "implemented", hasEvidence: true, justification: "ok", evidenceStatus: "provided" },
  ]);
  assert.equal(plan.activeActions.length, 0);
});

runTest("17 - partially_implemented mapping per question", () => {
  for (const m of mappings) {
    const context = m.questionId === conditionalId ? { hasRelevantExternalParties: "yes" } : {};
    const plan = remediation.deriveEventReportingRemediationPlan([
      { questionId: m.questionId, answer: "partially_implemented", hasEvidence: true, justification: "ok", evidenceStatus: "provided" },
    ], context);
    const action = plan.activeActions.find((a) => a.actionCode === m.action);
    assert.equal(Boolean(action), true);
    assert.equal(action.gapType, "partial");
    assert.equal(action.gapCode, m.partialGap);
  }
});

runTest("18 - not_implemented mapping per question", () => {
  for (const m of mappings) {
    const context = m.questionId === conditionalId ? { hasRelevantExternalParties: "yes" } : {};
    const plan = remediation.deriveEventReportingRemediationPlan([
      { questionId: m.questionId, answer: "not_implemented", hasEvidence: true, justification: "ok", evidenceStatus: "provided" },
    ], context);
    const action = plan.activeActions.find((a) => a.actionCode === m.action);
    assert.equal(Boolean(action), true);
    assert.equal(action.gapType, "full");
    assert.equal(action.gapCode, m.fullGap);
  }
});

runTest("19 - not_sure outcome is clarification only", () => {
  const plan = remediation.deriveEventReportingRemediationPlan([
    { questionId: "p6_8_001", answer: "not_sure", justification: "Need context" },
  ]);
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.applicabilityReviews.includes("p6_8_001"), false);
  assert.equal(plan.clarifications.some((c) => c.questionId === "p6_8_001"), true);
});

runTest("20 - not_applicable with empty justification is invalid", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_8_001",
    answer: "not_applicable",
    hasEvidence: true,
    justification: "   ",
  });
  assert.equal(outcome.isValid, false);
});

runTest("21 - not_applicable with valid justification", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_8_001",
    answer: "not_applicable",
    hasEvidence: true,
    justification: "Not relevant now",
  });
  assert.equal(outcome.reviewState, "applicability_review_required");

  const plan = remediation.deriveEventReportingRemediationPlan([
    { questionId: "p6_8_001", answer: "not_applicable", hasEvidence: true, justification: "Not relevant now" },
  ]);
  assert.equal(plan.activeActions.length, 0);
  assert.equal(plan.applicabilityReviews.includes("p6_8_001"), true);
});

runTest("22 - evidenceStatus defaults to not_provided", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_8_001",
    answer: "implemented",
    hasEvidence: false,
    justification: "ok",
  });
  assert.equal(outcome.evidenceStatus, "not_provided");
});

runTest("23 - evidenceStatus provided preserved", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_8_001",
    answer: "implemented",
    hasEvidence: true,
    evidenceStatus: "provided",
    justification: "ok",
  });
  assert.equal(outcome.evidenceStatus, "provided");
});

runTest("24 - evidenceStatus validated preserved", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_8_001",
    answer: "implemented",
    hasEvidence: true,
    evidenceStatus: "validated",
    justification: "ok",
  });
  assert.equal(outcome.evidenceStatus, "validated");
});

runTest("25 - evidenceStatus rejected preserved", () => {
  const outcome = outcomes.deriveAssessmentOutcome({
    questionId: "p6_8_001",
    answer: "implemented",
    hasEvidence: true,
    evidenceStatus: "rejected",
    justification: "ok",
  });
  assert.equal(outcome.evidenceStatus, "rejected");
});

runTest("26 - latest response by question is used", () => {
  const plan = remediation.deriveEventReportingRemediationPlan([
    { questionId: "p6_8_001", answer: "not_implemented", hasEvidence: true, justification: "old" },
    { questionId: "p6_8_001", answer: "implemented", hasEvidence: true, justification: "new" },
  ]);
  assert.equal(plan.activeActions.find((a) => a.actionCode === "P6.8-A01"), undefined);
});

runTest("27 - hidden conditional old response ignored", () => {
  const plan = remediation.deriveEventReportingRemediationPlan([
    { questionId: conditionalId, answer: "not_implemented", hasEvidence: true, justification: "old" },
  ], { hasRelevantExternalParties: "no" });
  assert.equal(plan.activeActions.length, 0);
});

runTest("28 - deduplicate actions by actionCode", () => {
  const plan = remediation.deriveEventReportingRemediationPlan([
    { questionId: "p6_8_001", answer: "not_implemented", hasEvidence: true, justification: "first" },
    { questionId: "p6_8_001", answer: "not_implemented", hasEvidence: true, justification: "second" },
  ]);
  assert.equal(plan.activeActions.filter((a) => a.actionCode === "P6.8-A01").length, 1);
});

runTest("29 - implemented after full removes action", () => {
  const plan = remediation.deriveEventReportingRemediationPlan([
    { questionId: "p6_8_001", answer: "not_implemented", hasEvidence: true, justification: "bad" },
    { questionId: "p6_8_001", answer: "implemented", hasEvidence: true, justification: "resolved" },
  ]);
  assert.equal(plan.activeActions.find((a) => a.actionCode === "P6.8-A01"), undefined);
});

runTest("30 - partial to full updates same action", () => {
  const plan = remediation.deriveEventReportingRemediationPlan([
    { questionId: "p6_8_001", answer: "partially_implemented", hasEvidence: true, justification: "partial" },
    { questionId: "p6_8_001", answer: "not_implemented", hasEvidence: true, justification: "full" },
  ]);
  const action = plan.activeActions.find((a) => a.actionCode === "P6.8-A01");
  assert.equal(action.gapType, "full");
  assert.equal(action.gapCode, "A6_8_MECHANISM_ABSENT");
});

runTest("31 - unresolved condition creates clarification and records condition", () => {
  const plan = remediation.deriveEventReportingRemediationPlan([]);
  assert.equal(plan.unresolvedConditions.includes("hasRelevantExternalParties"), true);
  assert.equal(plan.clarifications.find((c) => c.questionId === conditionalId) !== undefined, true);
});

runTest("32 - no mandatory condition when unresolved", () => {
  const plan = remediation.deriveEventReportingRemediationPlan([
    { questionId: conditionalId, answer: "not_implemented", hasEvidence: true, justification: "x" },
  ], {});
  assert.equal(plan.activeActions.every((a) => a.actionCode !== "P6.8-A04"), true);
  assert.equal(plan.unresolvedConditions.includes("hasRelevantExternalParties"), true);
});

runTest("33 - four action codes exact", () => {
  const plan = remediation.deriveEventReportingRemediationPlan([
    ...mappings.slice(0, 3).map((m) => ({ questionId: m.questionId, answer: "not_implemented", hasEvidence: true, justification: "x" })),
    { questionId: conditionalId, answer: "not_implemented", hasEvidence: true, justification: "x" },
  ], { hasRelevantExternalParties: "yes" });
  const actionCodes = [...new Set(plan.activeActions.map((a) => a.actionCode))];
  assert.deepEqual(sorted(actionCodes), ["P6.8-A01", "P6.8-A02", "P6.8-A03", "P6.8-A04"].sort());
});

runTest("34 - exact 8 gap codes", () => {
  const declared = content.EVENT_REPORTING_GAP_CODES;
  const expectedGapCodes = [
    "A6_8_MECHANISM_PARTIAL",
    "A6_8_MECHANISM_ABSENT",
    "A6_8_AWARENESS_PARTIAL",
    "A6_8_AWARENESS_ABSENT",
    "A6_8_TRACEABILITY_PARTIAL",
    "A6_8_TRACEABILITY_ABSENT",
    "A6_8_EXTERNAL_REPORTING_PARTIAL",
    "A6_8_EXTERNAL_REPORTING_ABSENT",
  ];
  const actualGapCodes = [
    declared.p6_8_001.partial,
    declared.p6_8_001.full,
    declared.p6_8_002.partial,
    declared.p6_8_002.full,
    declared.p6_8_003.partial,
    declared.p6_8_003.full,
    declared.p6_8_004_external.partial,
    declared.p6_8_004_external.full,
  ].sort();
  assert.deepEqual(actualGapCodes, expectedGapCodes.sort());
});

runTest("35 - exact mapping per question", () => {
  for (const m of mappings) {
    const action = remediation.EVENT_REPORTING_ACTIONS[m.action];
    assert.equal(content.EVENT_REPORTING_GAP_CODES[m.questionId].partial, m.partialGap);
    assert.equal(content.EVENT_REPORTING_GAP_CODES[m.questionId].full, m.fullGap);
    assert.equal(action.sourceQuestionId, m.questionId);
  }
});

runTest("36 - exact questions and conditional IDs", () => {
  for (const id of expectedIds) {
    assert.equal(content.eventReportingQuestions.some((q) => q.id === id), true);
  }
  assert.equal(expectedIds.includes("p6_8_004_external"), true);
});

runTest("37 - exact three mandatory questions content", () => {
  const frMandatory = content.eventReportingQuestions
    .filter((q) => q.category === "mandatory")
    .map((q) => q.question.fr);
  const enMandatory = content.eventReportingQuestions
    .filter((q) => q.category === "mandatory")
    .map((q) => q.question.en);
  for (const q of requiredMandatoryQuestionsFr) assert.equal(containsAll(frMandatory, q), true);
  for (const q of requiredMandatoryQuestionsEn) assert.equal(containsAll(enMandatory, q), true);
});

runTest("38 - exact conditional question content", () => {
  const conditional = content.eventReportingQuestions.find((q) => q.id === conditionalId);
  assert.equal(conditional.question.fr, requiredConditionalQuestionFr);
  assert.equal(conditional.question.en, requiredConditionalQuestionEn);
});

runTest("39 - no mandatory hotline/anonymous/Teams/Slack channel", () => {
  const payload = JSON.stringify({
    questions: content.eventReportingQuestions,
    actions: remediation.EVENT_REPORTING_ACTIONS,
    legal: content.eventReportingLegalNotice,
  }).toLowerCase();
  const forbidden = ["hotline", "24/7", "anonymous", "anonyme", "teams", "slack"];
  for (const token of forbidden) {
    assert.equal(payload.includes(token), false, `forbidden token found: ${token}`);
  }
});

runTest("40 - no mandatory tool imposition (ITSM/SOC/SIEM/Phish button)", () => {
  const payload = JSON.stringify({
    questions: content.eventReportingQuestions,
    actions: remediation.EVENT_REPORTING_ACTIONS,
  }).toLowerCase();
  const forbidden = [" report phish", "phishing button"];
  for (const token of forbidden) {
    assert.equal(payload.includes(token), false, `forbidden token found: ${token}`);
  }
  assert.equal(payload.includes("must use itsm"), false);
  assert.equal(payload.includes("mandatory itsm"), false);
  assert.equal(payload.includes("obligatoire itsm"), false);
  assert.equal(payload.includes("must use soc"), false);
  assert.equal(payload.includes("mandatory soc"), false);
  assert.equal(payload.includes("must use siem"), false);
  assert.equal(payload.includes("mandatory siem"), false);
});

runTest("41 - no fixed annual frequency", () => {
  const payload = JSON.stringify(content.eventReportingQuestions).toLowerCase();
  assert.equal(payload.includes("annual"), true, "word 'annual' can remain only as caution text in the prompt context");
  for (const token of ["once a year", "fréquence annuelle obligatoire"]) {
    assert.equal(payload.includes(token), false);
  }
});

runTest("42 - no universal reporting minimum or volume threshold", () => {
  const payload = JSON.stringify(content.eventReportingQuestions).toLowerCase();
  assert.equal(payload.includes("minimum rate"), false);
  assert.equal(payload.includes("minimum threshold"), false);
  assert.equal(payload.includes("minimum volume"), false);
});

runTest("43 - no declaration that reporter must investigate/classify", () => {
  const payload = JSON.stringify({
    questions: content.eventReportingQuestions,
    actions: remediation.EVENT_REPORTING_ACTIONS,
  }).toLowerCase();
  assert.equal(payload.includes("must classify"), false);
  assert.equal(payload.includes("must investigate"), false);
  assert.equal(payload.includes("do not classify"), false);
  assert.equal(payload.includes("do not investigate"), false);
  assert.equal(payload.includes("must not require the reporter to classify"), true);
  assert.equal(payload.includes("not to conduct an unauthorized investigation"), true);
});

runTest("44 - no duplication of full A.5.25/A.5.26 logic", () => {
  const payload = JSON.stringify({
    questions: content.eventReportingQuestions,
    actions: remediation.EVENT_REPORTING_ACTIONS,
  }).toLowerCase();
  for (const token of forbiddenDuplications) {
    assert.equal(payload.includes(token), false);
  }
  assert.equal(payload.includes("a.5.25"), true);
  assert.equal(payload.includes("a.5.26"), true);
});

runTest("45 - plan mappings for 4 gap codes and 4 actions", () => {
  const plan = remediation.deriveEventReportingRemediationPlan([
    { questionId: "p6_8_001", answer: "not_implemented", hasEvidence: true, justification: "x" },
    { questionId: "p6_8_002", answer: "partially_implemented", hasEvidence: true, justification: "x" },
    { questionId: "p6_8_003", answer: "not_implemented", hasEvidence: true, justification: "x" },
    { questionId: "p6_8_004_external", answer: "partially_implemented", hasEvidence: true, justification: "x" },
  ], { hasRelevantExternalParties: "yes" });
  const gapCodes = [...new Set(plan.activeActions.flatMap((a) => [a.partialGapCode, a.fullGapCode]).filter(Boolean))];
  assert.equal(gapCodes.includes("A6_8_EXTERNAL_REPORTING_PARTIAL"), true);
  assert.deepEqual(plan.activeActions.map((a) => a.actionCode).sort(), ["P6.8-A01", "P6.8-A02", "P6.8-A03", "P6.8-A04"].sort());
});

runTest("46 - plan is pure and deterministic", () => {
  const a = remediation.deriveEventReportingRemediationPlan([
    { questionId: "p6_8_001", answer: "not_implemented", hasEvidence: true, justification: "x" },
  ]);
  const b = remediation.deriveEventReportingRemediationPlan([
    { questionId: "p6_8_001", answer: "not_implemented", hasEvidence: true, justification: "x" },
  ]);
  assert.deepEqual(a.activeActions.map((x) => x.actionCode), b.activeActions.map((x) => x.actionCode));
  assert.deepEqual(a.clarifications.map((x) => x.questionId), b.clarifications.map((x) => x.questionId));
  assert.deepEqual(a.applicabilityReviews, b.applicabilityReviews);
});

console.log(`A.6.8 QA checks completed (46 assertions).`);

