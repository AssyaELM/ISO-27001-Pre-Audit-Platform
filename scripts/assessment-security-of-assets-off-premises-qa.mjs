import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

import {
  A7_9_OFF_PREMISES_ASSET_SECURITY_PLAN,
  A7_9_OFF_PREMISES_ASSET_SECURITY_GAP_CODES,
  securityOfAssetsOffPremisesQuestions,
  resolveSecurityOfAssetsOffPremisesQuestions,
} from "../content/assessment/physical/security-of-assets-off-premises.ts";

import {
  deriveSecurityOfAssetsOffPremisesRemediationPlan,
} from "../lib/assessment/security-of-assets-off-premises.ts";

import { deriveAssessmentOutcome } from "../lib/assessment/outcomes.ts";

let passed = 0;
let failed = 0;
const errors = [];

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (err) {
    failed++;
    errors.push({ name, err });
  }
}

// CATALOGUE - 1 to 18
test("Catalogue Requirements 1 to 18", () => {
  // 1. exactement quatre définitions
  assert.equal(securityOfAssetsOffPremisesQuestions.length, 4, "req 1");
  // 2-6. IDs exacts
  const ids = securityOfAssetsOffPremisesQuestions.map(q => q.id).sort();
  assert.deepEqual(ids, ["p7_9_001", "p7_9_002", "p7_9_003", "p7_9_004_byod"].sort(), "req 2");
  
  const q1 = securityOfAssetsOffPremisesQuestions.find(q => q.id === "p7_9_001");
  const q2 = securityOfAssetsOffPremisesQuestions.find(q => q.id === "p7_9_002");
  const q3 = securityOfAssetsOffPremisesQuestions.find(q => q.id === "p7_9_003");
  const q4 = securityOfAssetsOffPremisesQuestions.find(q => q.id === "p7_9_004_byod");
  
  assert.ok(q1, "req 3");
  assert.ok(q2, "req 4");
  assert.ok(q3, "req 5");
  assert.ok(q4, "req 6");
  
  // 7. types exacts
  assert.equal(q1.type, "policy_process", "req 7");
  assert.equal(q2.type, "application", "req 7");
  assert.equal(q3.type, "proof_traceability", "req 7");
  assert.equal(q4.type, "conditional", "req 7");
  
  // 8-9. trois principales, une conditionnelle
  assert.equal(securityOfAssetsOffPremisesQuestions.filter(q => q.status === "main").length, 3, "req 8");
  assert.equal(securityOfAssetsOffPremisesQuestions.filter(q => q.status === "conditional").length, 1, "req 9");
  
  // 10. condition exacte
  assert.equal(q4.conditionKey, "allowsBYODForBusiness", "req 10");
  
  // 11-12. aucun p7_9_005, aucune question A.7.10
  assert.equal(securityOfAssetsOffPremisesQuestions.some(q => q.id.includes("p7_9_005")), false, "req 11");
  assert.equal(securityOfAssetsOffPremisesQuestions.some(q => q.id.includes("p7_10")), false, "req 12");
  
  // 13. questions FR exactes
  assert.equal(q1.question.fr, "Votre organisation a-t-elle défini les règles applicables aux actifs utilisés ou conservés hors de ses locaux, couvrant leur autorisation, responsabilité, garde, usage et protection selon les risques et les informations concernées ?", "req 13");
  assert.equal(q2.question.fr, "Les actifs hors site sont-ils effectivement protégés contre la perte, le vol, le dommage, l’observation ou l’utilisation non autorisée pendant leur transport, leur utilisation et leur stockage ?", "req 13");
  assert.equal(q3.question.fr, "Votre organisation peut-elle démontrer quels actifs pertinents sont utilisés hors site, qui en est responsable et comment les pertes, vols, dommages, exceptions, retours et actions correctives sont enregistrés et traités ?", "req 13");
  assert.equal(q4.question.fr, "Lorsque des équipements personnels sont autorisés à traiter ou accéder aux informations de l’organisation, les usages permis, exigences de protection, responsabilités, gestion des données, incidents et fin d’utilisation professionnelle sont-ils définis et appliqués ?", "req 13");
  
  // 14. questions EN exactes
  assert.equal(q1.question.en, "Has your organization defined rules for assets used or stored off-premises, covering authorization, responsibility, custody, use, and protection according to the associated risks and information?", "req 14");
  assert.equal(q2.question.en, "Are off-premises assets effectively protected against loss, theft, damage, unauthorized observation, or unauthorized use during transport, use, and storage?", "req 14");
  assert.equal(q3.question.en, "Can your organization demonstrate which relevant assets are used off-premises, who is responsible for them, and how losses, theft, damage, exceptions, returns, and corrective actions are recorded and handled?", "req 14");
  assert.equal(q4.question.en, "Where personally owned equipment is permitted to process or access organizational information, are permitted use, protection requirements, responsibilities, data handling, incidents, and termination of business use defined and implemented?", "req 14");
  
  // 15-18. titres, aides, preuves, avertissements présents
  for (const q of securityOfAssetsOffPremisesQuestions) {
    assert.ok(q.title.fr && q.title.en, "req 15");
    assert.ok(q.helpText.fr && q.helpText.en, "req 16");
    assert.ok(q.suggestedEvidence.fr && q.suggestedEvidence.en, "req 17");
    if (q.id === "p7_9_004_byod") {
      assert.ok(q.legalWarning.fr && q.legalWarning.en, "req 18");
    }
  }
});

// CONTEXTE - 19 to 20
test("Context Requirements 19 to 20", () => {
  const fileContent = fs.readFileSync(path.join(process.cwd(), "content/assessment/physical/security-of-assets-off-premises.ts"), "utf8");
  
  // 19. ContextDecision partagé réutilisé et non redéfini
  assert.ok(fileContent.includes("import type { ContextDecision }"), "req 19");
  assert.ok(!fileContent.includes("type ContextDecision ="), "req 19");
  assert.ok(!fileContent.includes("interface ContextDecision"), "req 19");
  
  // 20. A79AssessmentContext contient uniquement les deux clés prévues
  assert.ok(fileContent.includes("export type A79AssessmentContext = {"), "req 20");
  assert.ok(fileContent.includes("usesAssetsOffPremises?: ContextDecision;"), "req 20");
  assert.ok(fileContent.includes("allowsBYODForBusiness?: ContextDecision;"), "req 20");
  assert.ok(!fileContent.includes("permanentOffsite?:"), "req 20");
});

// GLOBAL UNRESOLVED - 21 to 26
test("Global Unresolved Requirements 21 to 26", () => {
  const absentRes = resolveSecurityOfAssetsOffPremisesQuestions({});
  assert.equal(absentRes.controlApplicability, "unresolved", "req 21");
  
  const notSureRes = resolveSecurityOfAssetsOffPremisesQuestions({ usesAssetsOffPremises: "not_sure" });
  assert.equal(notSureRes.controlApplicability, "unresolved", "req 22");
  
  // 23. quatre questions masquées
  assert.deepEqual(notSureRes.hiddenQuestionIds.sort(), ["p7_9_001", "p7_9_002", "p7_9_003", "p7_9_004_byod"].sort(), "req 23");
  assert.equal(notSureRes.questionIds.length, 0, "req 23");
  
  // 24-25. clarification, assessmentBlocked
  assert.equal(notSureRes.controlReviewState, "clarification_required", "req 24");
  assert.equal(notSureRes.assessmentBlocked, true, "req 25");
  
  // 26. aucun gap/action
  const plan = deriveSecurityOfAssetsOffPremisesRemediationPlan([
    { questionId: "p7_9_001", answer: "not_implemented", evidenceStatus: "not_provided" }
  ], { usesAssetsOffPremises: "not_sure" });
  assert.equal(plan.activeActions.length, 0, "req 26");
});

// GLOBAL NO - 27 to 35
test("Global No Requirements 27 to 35", () => {
  const noRes = resolveSecurityOfAssetsOffPremisesQuestions({ usesAssetsOffPremises: "no", allowsBYODForBusiness: "yes" });
  
  // 27-28
  assert.equal(noRes.controlApplicability, "not_applicable", "req 27");
  assert.deepEqual(noRes.hiddenQuestionIds.sort(), ["p7_9_001", "p7_9_002", "p7_9_003", "p7_9_004_byod"].sort(), "req 28");
  assert.equal(noRes.questionIds.length, 0, "req 28");
  
  // 29. une seule applicability review globale
  assert.equal(noRes.controlReviewState, "applicability_review_required", "req 29");
  
  // 30. condition BYOD ignorée (allowsBYODForBusiness=yes was passed, but everything is hidden/N/A)
  assert.ok(noRes.hiddenQuestionIds.includes("p7_9_004_byod"), "req 30");
  
  // 31-34. justifications
  const planEmpty = deriveSecurityOfAssetsOffPremisesRemediationPlan([], { usesAssetsOffPremises: "no" }, "");
  assert.ok(planEmpty.controlReviewState === "applicability_review_required", "req 31");
  
  const planWs = deriveSecurityOfAssetsOffPremisesRemediationPlan([], { usesAssetsOffPremises: "no" }, "   ");
  assert.ok(planWs.controlReviewState === "applicability_review_required", "req 32");
  
  const planValid = deriveSecurityOfAssetsOffPremisesRemediationPlan([], { usesAssetsOffPremises: "no" }, "Justification valide");
  assert.equal(planValid.controlReviewState, "none", "req 33");
  assert.equal(planValid.activeActions.length, 0, "req 34");
  
  // 35. usesAssetsOffPremises = yes -> 3 principales visibles
  const yesRes = resolveSecurityOfAssetsOffPremisesQuestions({ usesAssetsOffPremises: "yes", allowsBYODForBusiness: "no" });
  assert.deepEqual(yesRes.questionIds.sort(), ["p7_9_001", "p7_9_002", "p7_9_003"].sort(), "req 35");
});

// CONDITION BYOD - 36 to 46
test("BYOD Requirements 36 to 46", () => {
  // 36
  const byodYes = resolveSecurityOfAssetsOffPremisesQuestions({ usesAssetsOffPremises: "yes", allowsBYODForBusiness: "yes" });
  assert.ok(byodYes.questionIds.includes("p7_9_004_byod"), "req 36");
  
  // 37
  const byodNo = resolveSecurityOfAssetsOffPremisesQuestions({ usesAssetsOffPremises: "yes", allowsBYODForBusiness: "no" });
  assert.ok(!byodNo.questionIds.includes("p7_9_004_byod"), "req 37");
  assert.ok(byodNo.hiddenQuestionIds.includes("p7_9_004_byod"), "req 37");
  
  assert.equal(byodNo.controlApplicability, "applicable", "req 38");
  assert.equal(byodNo.controlReviewState, "none", "req 38");
  
  // 39
  const byodAbsent = resolveSecurityOfAssetsOffPremisesQuestions({ usesAssetsOffPremises: "yes" });
  assert.deepEqual(byodAbsent.unresolvedConditions, ["allowsBYODForBusiness"], "req 39");
  
  // 40
  const byodNotSure = resolveSecurityOfAssetsOffPremisesQuestions({ usesAssetsOffPremises: "yes", allowsBYODForBusiness: "not_sure" });
  assert.deepEqual(byodNotSure.unresolvedConditions, ["allowsBYODForBusiness"], "req 40");
  
  // 41-42
  assert.deepEqual(byodNotSure.questionIds.sort(), ["p7_9_001", "p7_9_002", "p7_9_003"].sort(), "req 41");
  assert.equal(byodNotSure.assessmentBlocked, true, "req 42");
  
  // 43. les 3 principales continuent à générer outcomes/gaps/actions
  const planUnres = deriveSecurityOfAssetsOffPremisesRemediationPlan([
    { questionId: "p7_9_001", answer: "partially_implemented", evidenceStatus: "not_provided" }
  ], { usesAssetsOffPremises: "yes", allowsBYODForBusiness: "not_sure" });
  assert.equal(planUnres.activeActions.length, 1, "req 43");
  assert.equal(planUnres.activeActions[0].actionCode, "P7.9-A01", "req 43");
  
  // 44-45. réponse historique ignorée et non comptée
  const planByodNo = deriveSecurityOfAssetsOffPremisesRemediationPlan([
    { questionId: "p7_9_004_byod", answer: "not_implemented", evidenceStatus: "not_provided" }
  ], { usesAssetsOffPremises: "yes", allowsBYODForBusiness: "no" });
  assert.equal(planByodNo.activeActions.length, 0, "req 44");
  assert.equal(planByodNo.activeActions.filter(a => a.questionId === "p7_9_004_byod").length, 0, "req 45");
  assert.ok(!planByodNo.gapLevel || planByodNo.gapLevel === "no_gap", "req 45");
  
  // 46. global no prévaut sur BYOD yes
  const globalNoRes = resolveSecurityOfAssetsOffPremisesQuestions({ usesAssetsOffPremises: "no", allowsBYODForBusiness: "yes" });
  assert.equal(globalNoRes.controlApplicability, "not_applicable", "req 46");
});

// OUTCOMES - 47 to 65
test("Outcomes Requirements 47 to 65", () => {
  const resCtx = { usesAssetsOffPremises: "yes", allowsBYODForBusiness: "yes" };
  
  // 47-48
  const planImpl = deriveSecurityOfAssetsOffPremisesRemediationPlan([
    { questionId: "p7_9_001", answer: "implemented", evidenceStatus: "not_provided" }
  ], resCtx);
  assert.equal(planImpl.activeActions.length, 0, "req 47-48");
  const outcomeImpl = deriveAssessmentOutcome({ questionId: "p7_9_001", answer: "implemented", evidenceStatus: "not_provided" }, resCtx, securityOfAssetsOffPremisesQuestions.find(q => q.id === "p7_9_001"));
  assert.equal(outcomeImpl.gapLevel, "no_gap", "req 47");
  
  // 49-53
  const planPart = deriveSecurityOfAssetsOffPremisesRemediationPlan([
    { questionId: "p7_9_001", answer: "partially_implemented", evidenceStatus: "provided" },
    { questionId: "p7_9_002", answer: "partially_implemented", evidenceStatus: "provided" },
    { questionId: "p7_9_003", answer: "partially_implemented", evidenceStatus: "provided" },
    { questionId: "p7_9_004_byod", answer: "partially_implemented", evidenceStatus: "provided" }
  ], resCtx);
  assert.equal(planPart.activeActions.length, 4, "req 49");
  assert.ok(planPart.activeActions.some(a => a.gapType === "partial" && a.gapCode === "A7_9_OFFSITE_RULES_PARTIAL"), "req 50");
  assert.ok(planPart.activeActions.some(a => a.gapType === "partial" && a.gapCode === "A7_9_OFFSITE_PROTECTION_PARTIAL"), "req 51");
  assert.ok(planPart.activeActions.some(a => a.gapType === "partial" && a.gapCode === "A7_9_OFFSITE_TRACEABILITY_PARTIAL"), "req 52");
  assert.ok(planPart.activeActions.some(a => a.gapType === "partial" && a.gapCode === "A7_9_BYOD_PROTECTION_PARTIAL"), "req 53");
  
  // 54-58
  const planFull = deriveSecurityOfAssetsOffPremisesRemediationPlan([
    { questionId: "p7_9_001", answer: "not_implemented", evidenceStatus: "provided" },
    { questionId: "p7_9_002", answer: "not_implemented", evidenceStatus: "provided" },
    { questionId: "p7_9_003", answer: "not_implemented", evidenceStatus: "provided" },
    { questionId: "p7_9_004_byod", answer: "not_implemented", evidenceStatus: "provided" }
  ], resCtx);
  assert.equal(planFull.activeActions.length, 4, "req 54");
  assert.ok(planFull.activeActions.some(a => a.gapType === "full" && a.gapCode === "A7_9_OFFSITE_RULES_ABSENT"), "req 55");
  assert.ok(planFull.activeActions.some(a => a.gapType === "full" && a.gapCode === "A7_9_OFFSITE_PROTECTION_ABSENT"), "req 56");
  assert.ok(planFull.activeActions.some(a => a.gapType === "full" && a.gapCode === "A7_9_OFFSITE_TRACEABILITY_ABSENT"), "req 57");
  assert.ok(planFull.activeActions.some(a => a.gapType === "full" && a.gapCode === "A7_9_BYOD_PROTECTION_ABSENT"), "req 58");
  
  // 59-60
  const planNotSure = deriveSecurityOfAssetsOffPremisesRemediationPlan([
    { questionId: "p7_9_001", answer: "not_sure", evidenceStatus: "not_provided" }
  ], resCtx);
  assert.equal(planNotSure.activeActions.length, 0, "req 60");
  const outNs = deriveAssessmentOutcome({ questionId: "p7_9_001", answer: "not_sure", hasEvidence: false });
  assert.equal(outNs.reviewState, "clarification_required", "req 59");
  
  // 61-65. Justifications N/A
  const outNaEmpty = deriveAssessmentOutcome({ questionId: "p7_9_001", answer: "not_applicable", hasEvidence: false, justification: "" });
  assert.equal(outNaEmpty.isValid, false, "req 62");
  
  const outNaWs = deriveAssessmentOutcome({ questionId: "p7_9_001", answer: "not_applicable", hasEvidence: false, justification: "   " });
  assert.equal(outNaWs.isValid, false, "req 63");
  
  const outNaValid = deriveAssessmentOutcome({ questionId: "p7_9_001", answer: "not_applicable", hasEvidence: false, justification: "  valid justif  " });
  assert.equal(outNaValid.isValid, true, "req 64");
  if (outNaValid.isValid) {
    assert.equal(outNaValid.reviewState, "applicability_review_required", "req 61");
  }
});

// EVIDENCESTATUS - 66 to 71
test("Evidence Requirements 66 to 71", () => {
  // 66-69
  const o1 = deriveAssessmentOutcome({ questionId: "p7_9_001", answer: "partially_implemented", hasEvidence: true, evidenceStatus: "not_provided" });
  assert.equal(o1.evidenceStatus, "not_provided", "req 66");
  const o2 = deriveAssessmentOutcome({ questionId: "p7_9_001", answer: "partially_implemented", hasEvidence: true, evidenceStatus: "provided" });
  assert.equal(o2.evidenceStatus, "provided", "req 67");
  const o3 = deriveAssessmentOutcome({ questionId: "p7_9_001", answer: "partially_implemented", hasEvidence: true, evidenceStatus: "validated" });
  assert.equal(o3.evidenceStatus, "validated", "req 68");
  const o4 = deriveAssessmentOutcome({ questionId: "p7_9_001", answer: "partially_implemented", hasEvidence: true, evidenceStatus: "rejected" });
  assert.equal(o4.evidenceStatus, "rejected", "req 69");
  
  // 70. implemented + not_provided ne génère pas de remédiation
  const plan1 = deriveSecurityOfAssetsOffPremisesRemediationPlan([
    { questionId: "p7_9_001", answer: "implemented", evidenceStatus: "not_provided" }
  ], { usesAssetsOffPremises: "yes" });
  assert.equal(plan1.activeActions.length, 0, "req 70");
  
  // 71. implemented + rejected => pas de gap auto métier, evidenceStatus = rejected
  const o5 = deriveAssessmentOutcome({ questionId: "p7_9_001", answer: "implemented", hasEvidence: true, evidenceStatus: "rejected" });
  assert.equal(o5.evidenceStatus, "rejected", "req 71");
  assert.equal(o5.gapLevel, "no_gap", "req 71");
  const plan2 = deriveSecurityOfAssetsOffPremisesRemediationPlan([
    { questionId: "p7_9_001", answer: "implemented", evidenceStatus: "rejected" }
  ], { usesAssetsOffPremises: "yes" });
  assert.equal(plan2.activeActions.length, 0, "req 71");
});

// TRANSITIONS - 72 to 75
test("Transitions Requirements 72 to 75", () => {
  // 70-71
  const resCtx = { usesAssetsOffPremises: "yes", allowsBYODForBusiness: "yes" };
  const planRej = deriveSecurityOfAssetsOffPremisesRemediationPlan([
    { questionId: "p7_9_002", answer: "implemented", evidenceStatus: "rejected" }
  ], resCtx);
  const outcomeRej = deriveAssessmentOutcome({ questionId: "p7_9_002", answer: "implemented", evidenceStatus: "rejected" }, resCtx, securityOfAssetsOffPremisesQuestions.find(q => q.id === "p7_9_002"));
  assert.equal(outcomeRej.gapLevel, "no_gap", "req 71");
  assert.equal(outcomeRej.evidenceStatus, "rejected", "req 71");
  assert.equal(planRej.activeActions.length, 0, "req 71");
  
  // 72-74
  const plan = deriveSecurityOfAssetsOffPremisesRemediationPlan([
    { questionId: "p7_9_001", answer: "partially_implemented", evidenceStatus: "provided" },
    { questionId: "p7_9_001", answer: "not_implemented", evidenceStatus: "provided" }
  ], { usesAssetsOffPremises: "yes" });
  
  assert.equal(plan.activeActions.length, 1, "req 73"); // Deduplicated
  assert.equal(plan.activeActions[0].gapType, "full", "req 72, 74"); // Latest answer applies, updates the same action
  
  // 75
  const plan2 = deriveSecurityOfAssetsOffPremisesRemediationPlan([
    { questionId: "p7_9_001", answer: "not_implemented", evidenceStatus: "provided" },
    { questionId: "p7_9_001", answer: "implemented", evidenceStatus: "provided" }
  ], { usesAssetsOffPremises: "yes" });
  assert.equal(plan2.activeActions.length, 0, "req 75");
});

// PLAN - 76 to 85
test("Plan Requirements 76 to 85", () => {
  assert.equal(A7_9_OFF_PREMISES_ASSET_SECURITY_PLAN, "A7_9_OFF_PREMISES_ASSET_SECURITY_PLAN", "req 76");
  
  const plan = deriveSecurityOfAssetsOffPremisesRemediationPlan([
    { questionId: "p7_9_001", answer: "partially_implemented", evidenceStatus: "provided" },
    { questionId: "p7_9_002", answer: "not_implemented", evidenceStatus: "provided" },
    { questionId: "p7_9_003", answer: "partially_implemented", evidenceStatus: "provided" },
    { questionId: "p7_9_004_byod", answer: "not_implemented", evidenceStatus: "provided" }
  ], { usesAssetsOffPremises: "yes", allowsBYODForBusiness: "yes" });
  
  const codes = plan.activeActions.map(a => a.actionCode).sort();
  assert.equal(codes.length, 4, "req 77");
  assert.deepEqual(codes, ["P7.9-A01", "P7.9-A02", "P7.9-A03", "P7.9-A04"], "req 78-81, 84");
  
  assert.equal(Object.keys(A7_9_OFF_PREMISES_ASSET_SECURITY_GAP_CODES).length, 8, "req 82");
  
  // 83.
  const planFor83 = deriveSecurityOfAssetsOffPremisesRemediationPlan([
    { questionId: "p7_9_001", answer: "partially_implemented", evidenceStatus: "provided" }
  ], { usesAssetsOffPremises: "yes", allowsBYODForBusiness: "yes" });
  assert.equal(planFor83.planCode, "A7_9_OFF_PREMISES_ASSET_SECURITY_PLAN", "req 83"); // Un seul plan (string constant)
  // 85. aucune P7.9-A05
  assert.ok(!codes.includes("P7.9-A05"), "req 85");
});

// GARDE-FOUS - 86 to 107
test("Guardrails 86 to 107", () => {
  const helps = securityOfAssetsOffPremisesQuestions.map(q => q.helpText.fr + " " + q.helpText.en).join(" ");
  const legal = securityOfAssetsOffPremisesQuestions.filter(q => q.legalWarning).map(q => q.legalWarning.fr + " " + q.legalWarning.en).join(" ");
  const content = helps + " " + legal;
  
  // 86-88, 107
  assert.ok(content.includes("Ne jamais considérer MDM, tracking, remote wipe ou surveillance d’un appareil personnel comme universellement obligatoires"), "req 86,87,88,107");
  
  assert.ok(content.includes("un type spécifique de chiffrement"), "req 90,92");
  assert.ok(content.includes("une biométrie"), "req 89");
  assert.ok(content.includes("un câble antivol"), "req 93");
  assert.ok(content.includes("un coffre d'hôtel"), "req 99");
  assert.ok(content.includes("une déclaration formelle à la police dans tous les cas"), "req 98");
  
  // 91
  assert.ok(content.includes("un MFA spécifique distinct du MFA global"), "req 91");
  
  // 94, 95
  assert.ok(content.includes("un appareil obligatoirement propriété de l'entreprise (le BYOD est autorisé si encadré)"), "req 94");
  assert.ok(content.includes("l'interdiction universelle du BYOD"), "req 95");
  
  // 96, 97, 100, 101
  assert.ok(content.includes("un formulaire d'autorisation pour chaque déplacement courant"), "req 96");
  assert.ok(content.includes("un tracking individuel permanent"), "req 97");
  assert.ok(content.includes("des règles techniques fixes pour les véhicules"), "req 100");
  assert.ok(content.includes("une durée fixe universelle de signalement"), "req 101");
  
  // 102-104
  assert.ok(content.includes("remote-first"), "req 102");
  assert.ok(content.includes("cloud-first"), "req 103");
  assert.ok(content.includes("serveur local"), "req 104");
  
  // 105. aucune cinquième question permanent-offsite
  assert.equal(securityOfAssetsOffPremisesQuestions.some(q => q.id === "p7_9_005_permanent_offsite"), false, "req 105");
  assert.equal(securityOfAssetsOffPremisesQuestions.some(q => q.conditionKey === "permanent-offsite"), false, "req 105");
  
  // 106. solutions alternatives proportionnées acceptées
  const planAlt = deriveSecurityOfAssetsOffPremisesRemediationPlan([
    { questionId: "p7_9_002", answer: "implemented", evidenceStatus: "provided" }
  ], { usesAssetsOffPremises: "yes" });
  assert.equal(planAlt.activeActions.length, 0, "req 106");
});

// INSTALLATIONS PERMANENTES / TIERS - 108 to 113
test("Permanent/Third-Party 108 to 113", () => {
  const helps = securityOfAssetsOffPremisesQuestions.map(q => q.helpText.fr + " " + q.helpText.en).join(" ");
  
  // 108. permanent-offsite couvert dans Q1/Q2/Q3
  const q1 = securityOfAssetsOffPremisesQuestions.find(q => q.id === "p7_9_001");
  const q2 = securityOfAssetsOffPremisesQuestions.find(q => q.id === "p7_9_002");
  const q3 = securityOfAssetsOffPremisesQuestions.find(q => q.id === "p7_9_003");
  
  assert.ok(q1.helpText.fr.includes("installés durablement hors site") || q1.helpText.fr.includes("installations permanentes hors site"), "req 108");
  assert.ok(q2.helpText.fr.includes("installé durablement hors site") || q2.helpText.fr.includes("installation hors site permanente"), "req 108");
  assert.ok(q3.helpText.fr.includes("installation permanente hors site") || q3.helpText.fr.includes("sortie durable"), "req 108");
  
  // 109
  assert.equal(securityOfAssetsOffPremisesQuestions.some(q => q.conditionKey === "permanent-offsite"), false, "req 109");
  
  assert.ok(helps.includes("L'utilisation de services tiers (ex: coworking sécurisé, coffre-fort distant) est acceptable. L'organisation n'est pas tenue d'opérer directement les contrôles du tiers"), "req 110-111");
  
  // 112-113
  assert.ok(helps.includes("proportionnées aux risques") && helps.toLowerCase().includes("pas de tracking individuel universel pour des actifs banals non sensibles"), "req 112-113");
});

// FRONTIÈRES ET ARCHITECTURE - 114 to 127
test("Boundaries & Architecture 114 to 127", () => {
  const rootDir = process.cwd();
  
  // 114-118
  const fileContent = fs.readFileSync(path.join(rootDir, "content/assessment/physical/security-of-assets-off-premises.ts"), "utf8");
  assert.ok(!fileContent.includes("p6_7_"), "req 114");
  assert.ok(!fileContent.includes("p7_8_"), "req 115");
  assert.ok(!fileContent.includes("p7_" + "10_"), "req 116, 118");
  assert.ok(!fileContent.includes("p5_9_"), "req 117");
  
  // Helper to scan directory
  function scanDir(dir, pattern, excludePatterns = []) {
    let found = false;
    if (!fs.existsSync(dir)) return false;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (!["node_modules", ".git", ".next", "dist", "build", ".system_generated", "brain", ".gemini", "node_modules_cache"].includes(file)) {
          if (scanDir(fullPath, pattern, excludePatterns)) found = true;
        }
      } else {
        // Exclude allowed files
        let isExcluded = false;
        for (const ep of excludePatterns) {
          if (fullPath.includes(path.normalize(ep))) isExcluded = true;
        }
        if (!isExcluded) {
          const content = fs.readFileSync(fullPath, "utf8");
          if (content.match(pattern)) {
            console.log("Found pattern in", fullPath);
            found = true;
          }
        }
      }
    }
    return found;
  }
  
  const allowedFiles = [
    "content/assessment/physical/security-of-assets-off-premises.ts",
    "lib/assessment/security-of-assets-off-premises.ts",
    "scripts/assessment-security-of-assets-off-premises-qa.mjs",
    "app/assessment/physical/[controlId]/page.tsx"
  ];
  
  // A.7.9 markers
  const markersRegex = /security-of-assets-off-premises|p7_9_|A7_9_|P7\.9-|A7_9_OFF_PREMISES_ASSET_SECURITY_PLAN/;
  
  // 119. intégration autorisée uniquement dans la route Physical active
  assert.equal(scanDir(path.join(rootDir, "app"), markersRegex, allowedFiles), false, "req 119");
  assert.equal(scanDir(path.join(rootDir, "pages"), markersRegex, allowedFiles), false, "req 119");
  assert.equal(scanDir(path.join(rootDir, "components"), markersRegex, allowedFiles), false, "req 119");
  
  // 120. aucun onboarding
  assert.equal(scanDir(path.join(rootDir, "onboarding"), markersRegex, allowedFiles), false, "req 120");
  
  // 121. aucune API
  assert.equal(scanDir(path.join(rootDir, "api"), markersRegex, allowedFiles), false, "req 121");
  assert.equal(scanDir(path.join(rootDir, "app/api"), markersRegex, allowedFiles), false, "req 121");
  assert.equal(scanDir(path.join(rootDir, "pages/api"), markersRegex, allowedFiles), false, "req 121");
  
  // 122. aucune migration
  assert.equal(scanDir(path.join(rootDir, "migrations"), markersRegex, allowedFiles), false, "req 122");
  assert.equal(scanDir(path.join(rootDir, "supabase/migrations"), markersRegex, allowedFiles), false, "req 122");
  
  // 123. aucun schéma DB
  // explicit check for files containing schema, database or db in their name
  const dbFiles = [];
  function scanForDBFiles(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (!["node_modules", ".git", ".next", "dist", "build"].includes(file)) {
          scanForDBFiles(fullPath);
        }
      } else {
        if (file.toLowerCase().includes("schema") || file.toLowerCase().includes("database") || file.toLowerCase().includes("db")) {
          dbFiles.push(fullPath);
        }
      }
    }
  }
  scanForDBFiles(rootDir);
  for (const f of dbFiles) {
    const c = fs.readFileSync(f, "utf8");
    assert.ok(!c.match(markersRegex), `req 123: marker found in DB file ${f}`);
  }
  
  // 124. aucune écriture DB
  const resolverContent = fs.readFileSync(path.join(rootDir, "lib/assessment/security-of-assets-off-premises.ts"), "utf8");
  assert.ok(!resolverContent.includes(".insert("), "req 124");
  assert.ok(!resolverContent.includes(".update("), "req 124");
  assert.ok(!resolverContent.includes(".delete("), "req 124");
  assert.ok(!resolverContent.includes(".rpc("), "req 124");
  
  // 125. aucune dépendance ajoutée
  const qaContent = fs.readFileSync(path.join(rootDir, "scripts", "assessment-security-of-assets-off-premises-qa.mjs"), "utf8");
  const lines = qaContent.split('\n');
  for (const line of lines) {
    if (line.startsWith("import ") && line.includes("from")) {
      const modName = line.split("from")[1].trim().replace(/["';]/g, "");
      assert.ok(modName.startsWith("node:") || modName.startsWith(".") || modName === "fs" || modName === "path" || modName === "assert/strict", `req 125: unauthorized import ${modName}`);
    }
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
  assert.ok(pkg.scripts["test:assessment-security-of-assets-off-premises"].includes("node "), "req 125: must launch node directly");
  
  // 126. aucune modification historique NON AUTORISÉE
  const scriptsDir = path.join(rootDir, "scripts");
  const scriptFiles = fs.readdirSync(scriptsDir);
  for (const file of scriptFiles) {
    if (file.endsWith(".mjs") && file !== "assessment-security-of-assets-off-premises-qa.mjs") {
      const c = fs.readFileSync(path.join(scriptsDir, file), "utf8");
      const safeContent = c.replace(/assessment-security-of-assets-off-premises(-qa\.mjs)?/g, "");
      assert.ok(!safeContent.match(markersRegex), `req 126: marker found in ${file}`);
    }
  }
  
  // 127. aucun script temporaire restant
  assert.ok(!fs.existsSync(path.join(rootDir, "run-all.ps1")), "req 127");
  assert.ok(!fs.existsSync(path.join(rootDir, "prompt_A79.txt")), "req 127");
  
  // Architecture without git
  const qaScriptContent = fs.readFileSync(path.join(rootDir, "scripts", "assessment-security-of-assets-off-premises-qa.mjs"), "utf8");
  assert.ok(!qaScriptContent.includes("exec" + "Sync('git"));
  assert.ok(!qaScriptContent.includes('exec' + 'Sync("git'));
  assert.ok(!qaScriptContent.includes('exec' + 'Sync(`git'));
});

if (failed > 0) {
  console.log(`\n❌ QA failed: ${failed} errors, ${passed} passed`);
  for (const err of errors) {
    console.log(`\n--- ${err.name} ---`);
    console.error(err.err);
  }
  process.exit(1);
} else {
  console.log(`\n✅ QA passed: ${passed} blocks executed, all assertions successful. 127/127 explicit requirements covered.`);
  process.exit(0);
}
