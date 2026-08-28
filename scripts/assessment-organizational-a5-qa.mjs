import assert from "node:assert/strict";
import fs from "node:fs";

import { assessmentAnswerValues, assessmentThemes } from "../content/assessment-infrastructure.ts";
import { organizationalControls } from "../content/assessment/organizational/organizational-controls.ts";
import {
  deriveOrganizationalOutcome,
  deriveOrganizationalRemediationPlan,
  resolveOrganizationalAssessmentContext,
  resolveOrganizationalControl,
} from "../lib/assessment/organizational-controls.ts";
import { POST as assessmentResponsesPost } from "../app/api/assessment/responses/route.ts";

const canonicalPath = process.env.NORMCORE_ORGANIZATIONAL_README
  ?? "C:/Users/HP/Downloads/README-NORMCORE-ORGANIZATIONAL-A5.1-A5.10-CANONICAL-AUG2026.md";
const readme = fs.readFileSync(canonicalPath, "utf8");
const batchCanonicalPath = process.env.NORMCORE_ORGANIZATIONAL_A511_A520_README
  ?? "C:/Users/HP/Downloads/ORGANIZATIONAL-CONTROLS-A511-A520-NORMCORE-SPEC-AUG-2026.md";
const batchReadme = fs.readFileSync(batchCanonicalPath, "utf8");
const finalBatchCanonicalPath = process.env.NORMCORE_ORGANIZATIONAL_A521_A530_README
  ?? "C:/Users/HP/Downloads/ORGANIZATIONAL-CONTROLS-A521-A530-NORMCORE-SPEC-AUG-2026(1).md";
const finalBatchReadme = fs.readFileSync(finalBatchCanonicalPath, "utf8");
const terminalBatchCanonicalPath = process.env.NORMCORE_ORGANIZATIONAL_A531_A537_README
  ?? "C:/Users/HP/Downloads/README-NORMCORE-ORGANIZATIONAL-A5.31-A5.37-FINAL-CANONICAL-AUGUST-2026.md";
fs.readFileSync(terminalBatchCanonicalPath, "utf8");
const legacyControls = organizationalControls.filter((control) => Number(control.id.split("-")[1]) <= 10);
const batchControls = organizationalControls.filter((control) => {
  const number = Number(control.id.split("-")[1]);
  return number >= 11 && number <= 20;
});
const finalBatchControls = organizationalControls.filter((control) => {
  const number = Number(control.id.split("-")[1]);
  return number >= 21 && number <= 30;
});
const terminalBatchControls = organizationalControls.filter((control) => {
  const number = Number(control.id.split("-")[1]);
  return number >= 31 && number <= 37;
});

assert.ok(assessmentThemes.includes("organizational"), "canonical Organizational API theme is accepted");
assert.deepEqual(
  assessmentAnswerValues,
  ["implemented", "partially_implemented", "not_implemented", "not_sure", "not_applicable"],
  "exact five NormCore answers",
);
assert.equal(organizationalControls.length, 37, "A.5.1-A.5.37 controls");
assert.equal(legacyControls.length, 10, "A.5.1-A.5.10 controls remain present");
assert.equal(batchControls.length, 10, "A.5.11-A.5.20 controls");
assert.equal(finalBatchControls.length, 10, "A.5.21-A.5.30 controls");
assert.equal(terminalBatchControls.length, 7, "A.5.31-A.5.37 controls");

const allQuestions = legacyControls.flatMap((control) => control.questions);
const mainQuestions = allQuestions.filter((item) => item.type !== "conditional");
const conditionalQuestions = allQuestions.filter((item) => item.type === "conditional");
const quickContexts = legacyControls.flatMap((control) => control.quickContext);
assert.equal(mainQuestions.length, 30, "30 principal questions");
assert.equal(conditionalQuestions.length, 6, "6 conditional questions");
assert.equal(quickContexts.length, 7, "7 Quick Context questions");
assert.equal(new Set(allQuestions.map((item) => item.id)).size, 36, "unique question IDs");

for (const control of legacyControls) {
  assert.ok(readme.includes(`# ${control.code} — ${control.name}`), `${control.code}: exact name`);
  assert.equal(control.questions.filter((item) => item.type !== "conditional").length, 3, `${control.code}: three principal questions`);

  for (const item of control.questions) {
    if (item.type === "conditional") {
      assert.ok(readme.includes(`### ${item.id} — visible si \`${item.conditionKey} == yes\``), `${item.id}: exact conditional ID/key`);
    } else {
      assert.ok(readme.includes(`### ${item.id} — \`${item.type}\``), `${item.id}: exact ID/type`);
      assert.equal(item.conditionKey, null, `${item.id}: no condition on principal question`);
    }
    for (const exact of [
      item.question.fr,
      item.question.en,
      item.partial.gapCode,
      item.partial.gap,
      item.partial.remediation,
      item.absent.gapCode,
      item.absent.gap,
      item.absent.remediation,
      ...(item.evidence ? [item.evidence] : []),
    ]) {
      assert.ok(readme.includes(exact), `${item.id}: README parity: ${exact}`);
    }
  }

  for (const quickContext of control.quickContext) {
    assert.ok(readme.includes(`**conditionKey:** \`${quickContext.key}\``), `${control.code}: Quick Context key`);
    assert.ok(readme.includes(`**FR:** ${quickContext.question.fr}`), `${control.code}: Quick Context FR`);
    assert.ok(readme.includes(`**EN:** ${quickContext.question.en}`), `${control.code}: Quick Context EN`);
  }

  const unresolved = resolveOrganizationalControl(control.id, {});
  if (control.id === "a5-8") {
    assert.equal(unresolved.questionIds.length, 3, "A.5.8 unresolved still exposes principal questions");
  } else {
    assert.equal(unresolved.questionIds.length, 3, `${control.code}: unresolved Quick Context still exposes principal questions`);
  }
  assert.equal(unresolved.assessmentBlocked, false, `${control.code}: unresolved Quick Context does not block principal assessment`);
  assert.equal(unresolved.requiredQuickContextQuestions.length, control.quickContext.length, `${control.code}: unresolved Quick Context exposed first`);

  const positiveContext = Object.fromEntries(control.quickContext.map((item) => [item.key, "yes"]));
  const positive = resolveOrganizationalControl(control.id, positiveContext);
  assert.equal(positive.questionIds.length, 3 + control.questions.filter((item) => item.type === "conditional").length, `${control.code}: positive condition visibility`);
  assert.equal(positive.requiredQuickContextQuestions.length, 0, `${control.code}: known context suppresses Quick Context`);

  const negativeContext = Object.fromEntries(control.quickContext.map((item) => [item.key, "no"]));
  const negative = resolveOrganizationalControl(control.id, negativeContext);
  if (control.id === "a5-8") {
    assert.equal(negative.controlApplicability, "not_applicable", "A.5.8 no proposes control-level N/A");
    assert.equal(negative.requiresControlJustification, true, "A.5.8 no requires justification");
    assert.equal(negative.assessmentBlocked, true, "A.5.8 exclusion is not auto-accepted");
    assert.equal(resolveOrganizationalControl(control.id, negativeContext, "No in-scope projects; SoA review pending").assessmentBlocked, false, "A.5.8 justification unblocks review, not auto-validation");
  } else {
    assert.equal(negative.questionIds.length, 3, `${control.code}: negative condition hides only conditional question`);
  }

  for (const item of control.questions) {
    const visibleContext = Object.fromEntries(control.quickContext.map((quickContext) => [quickContext.key, "yes"]));
    const base = { questionId: item.id, hasEvidence: false };
    const implemented = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "implemented" }], visibleContext);
    assert.equal(implemented.gapActions.length, 0, `${item.id}: implemented -> no gap`);
    assert.equal(implemented.reviewState, "none", `${item.id}: implemented -> no review`);

    const partial = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "partially_implemented" }], visibleContext);
    assert.deepEqual(
      partial.gapActions[0] && {
        gapCode: partial.gapActions[0].gapCode,
        gapType: partial.gapActions[0].gapType,
        gap: partial.gapActions[0].gap,
        remediation: partial.gapActions[0].remediation,
      },
      { gapCode: item.partial.gapCode, gapType: "partial", gap: item.partial.gap, remediation: item.partial.remediation },
      `${item.id}: PARTIAL gap/remediation`,
    );

    const absent = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "not_implemented" }], visibleContext);
    assert.deepEqual(
      absent.gapActions[0] && {
        gapCode: absent.gapActions[0].gapCode,
        gapType: absent.gapActions[0].gapType,
        gap: absent.gapActions[0].gap,
        remediation: absent.gapActions[0].remediation,
      },
      { gapCode: item.absent.gapCode, gapType: "full", gap: item.absent.gap, remediation: item.absent.remediation },
      `${item.id}: ABSENT gap/FULL remediation`,
    );
    assert.equal(deriveOrganizationalRemediationPlan(control.id, absent)[0].actions[0].remediation, item.absent.remediation, `${item.id}: remediation plan parity`);

    const unsure = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "not_sure" }], visibleContext);
    assert.equal(unsure.reviewState, "clarification_required", `${item.id}: not_sure clarification`);
    assert.equal(unsure.gapActions.length, 0, `${item.id}: not_sure no definitive gap`);

    const unjustifiedNa = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "not_applicable" }], visibleContext);
    assert.equal(unjustifiedNa.invalidResponses[0]?.errorCode, "not_applicable_requires_justification", `${item.id}: N/A justification mandatory`);
    const justifiedNa = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "not_applicable", justification: "Risk/SoA applicability review" }], visibleContext);
    assert.equal(justifiedNa.reviewState, "applicability_review_required", `${item.id}: N/A applicability review`);
    assert.equal(justifiedNa.gapActions.length, 0, `${item.id}: N/A no automatic gap`);
  }
}

const expectedBatchConditionalIds = {
  "a5-11": ["p5_11_004_remote_return", "p5_11_005_byod_exit", "p5_11_006_external_return"],
  "a5-12": ["p5_12_004_external_classification"],
  "a5-13": ["p5_13_004_digital_labels", "p5_13_005_physical_labels"],
  "a5-14": ["p5_14_004_external_transfer", "p5_14_005_physical_transfer", "p5_14_006_verbal_transfer"],
  "a5-15": ["p5_15_004_third_party_access"],
  "a5-16": ["p5_16_004_non_human_identities", "p5_16_005_shared_identities"],
  "a5-17": ["p5_17_004_default_credentials", "p5_17_005_machine_secrets"],
  "a5-18": ["p5_18_004_privileged_rights", "p5_18_005_third_party_rights"],
  "a5-19": ["p5_19_004_supplier_access_risk", "p5_19_005_critical_supplier"],
  "a5-20": ["p5_20_004_sensitive_data_clauses", "p5_20_005_access_clauses", "p5_20_006_critical_supplier_clauses"],
};
const expectedBatchConditionalDetails = {
  p5_11_004_remote_return: { conditionKey: "hasRemoteOrOffsiteAssetReturns", en: "Are secure remote return/transport, chain-of-custody, remote lock/wipe where appropriate and exception arrangements defined and applied?", fr: "Les modalités de restitution/transport sécurisés à distance, chaîne de garde, verrouillage/effacement à distance lorsque pertinent et gestion des exceptions sont-elles définies et appliquées ?" },
  p5_11_005_byod_exit: { conditionKey: "allowsBYOD", en: "Does offboarding/role change ensure organizational data and access are removed or otherwise protected from personal devices, with appropriate evidence?", fr: "Le départ ou changement de rôle garantit-il la suppression ou protection des données et accès de l’organisation sur les appareils personnels, avec preuves appropriées ?" },
  p5_11_006_external_return: { conditionKey: "assignsAssetsToExternalParties", en: "Are return/recovery obligations applied to contractors and external parties when their engagement changes or ends?", fr: "Les obligations de restitution/récupération sont-elles appliquées aux prestataires et parties externes lorsque leur engagement change ou prend fin ?" },
  p5_12_004_external_classification: { conditionKey: "receivesExternallyClassifiedInformation", en: "Are rules defined to interpret, map and preserve the originator’s classification and handling requirements?", fr: "Des règles sont-elles définies pour interpréter, mapper et préserver la classification et les exigences de traitement de l’émetteur ?" },
  p5_13_004_digital_labels: { conditionKey: "usesDigitalDocumentOrCollaborationPlatforms", en: "Are appropriate visible markings and/or metadata labels used where they add value, with persistence/change/automation rules where applicable?", fr: "Des marquages visibles et/ou métadonnées appropriés sont-ils utilisés lorsque cela apporte de la valeur, avec règles de persistance/modification/automatisation le cas échéant ?" },
  p5_13_005_physical_labels: { conditionKey: "handlesClassifiedPhysicalInformation", en: "Are recognisable physical labelling methods and handling exceptions defined and applied?", fr: "Des méthodes d’étiquetage physique reconnaissables et des exceptions de traitement sont-elles définies et appliquées ?" },
  p5_14_004_external_transfer: { conditionKey: "transfersInformationToExternalParties", en: "Are security responsibilities, permitted methods, confidentiality and necessary transfer requirements agreed before sensitive exchange?", fr: "Les responsabilités de sécurité, méthodes autorisées, exigences de confidentialité et autres exigences nécessaires au transfert sont-elles convenues avant l’échange sensible ?" },
  p5_14_005_physical_transfer: { conditionKey: "usesPhysicalTransferForSensitiveInformation", en: "Are packaging, custody, authorised carrier/recipient, loss handling and media/document protection defined/applied?", fr: "L’emballage, la garde, le transporteur/destinataire autorisé, le traitement des pertes et la protection des supports/documents sont-ils définis et appliqués ?" },
  p5_14_006_verbal_transfer: { conditionKey: "usesVerbalTransferOfSensitiveInformation", en: "Are rules defined for participant verification and avoiding inappropriate locations/channels?", fr: "Des règles sont-elles définies pour vérifier les participants et éviter les lieux ou canaux inappropriés ?" },
  p5_15_004_third_party_access: { conditionKey: "grantsThirdPartyAccess", en: "Are scope, authorization, duration, supervision and termination requirements explicitly controlled?", fr: "Le périmètre, l’autorisation, la durée, la supervision et la fin des accès externes sont-ils explicitement contrôlés ?" },
  p5_16_004_non_human_identities: { conditionKey: "usesNonHumanIdentities", en: "Are owners, purpose, lifecycle, permissions, credential dependencies and retirement of non-human identities managed?", fr: "Les responsables, la finalité, le cycle de vie, les permissions, les dépendances d’identifiants et le retrait des identités non humaines sont-ils gérés ?" },
  p5_16_005_shared_identities: { conditionKey: "usesSharedOrGenericAccounts", en: "Are shared or generic identities formally justified, approved, attributable through compensating controls, reconsidered and removed when unnecessary?", fr: "Les identités partagées ou génériques sont-elles formellement justifiées, approuvées, attribuables par des contrôles compensatoires, réexaminées et supprimées lorsqu’elles ne sont plus nécessaires ?" },
  p5_17_004_default_credentials: { conditionKey: "usesVendorSuppliedInitialCredentials", en: "Are vendor/default credentials changed, disabled or otherwise secured before or immediately upon operational use according to defined rules?", fr: "Les informations d’authentification fournisseur/par défaut sont-elles modifiées, désactivées ou autrement sécurisées avant ou immédiatement lors de la mise en service opérationnelle selon des règles définies ?" },
  p5_17_005_machine_secrets: { conditionKey: "usesMachineSecretsOrApiKeys", en: "Are ownership, protected storage, issuance, rotation/replacement, revocation and access to machine secrets or API keys managed according to risk?", fr: "La responsabilité, le stockage protégé, l’émission, la rotation/le remplacement, la révocation et l’accès aux secrets machines ou clés API sont-ils gérés selon le risque ?" },
  p5_18_004_privileged_rights: { conditionKey: "hasPrivilegedAccessRights", en: "Are privileged rights subject to explicitly approved scope, enhanced review and prompt revocation or adjustment?", fr: "Le périmètre des droits privilégiés est-il explicitement approuvé, soumis à une revue renforcée et rapidement révoqué ou ajusté ?" },
  p5_18_005_third_party_rights: { conditionKey: "grantsThirdPartyAccess", en: "Are expiry or termination conditions and continuing-business-need confirmation enforced for third-party access rights?", fr: "Les conditions d’expiration ou de fin et la confirmation du besoin métier continu sont-elles appliquées aux droits des fournisseurs/prestataires ?" },
  p5_19_004_supplier_access_risk: { conditionKey: "suppliersAccessOrgInformationOrSystems", en: "Are specific risks, access boundaries and required safeguards identified before supplier access and revisited on change?", fr: "Les risques spécifiques, limites d’accès et protections requises sont-ils identifiés avant l’accès fournisseur et réexaminés lors des changements ?" },
  p5_19_005_critical_supplier: { conditionKey: "dependsOnCriticalSuppliers", en: "Does treatment address dependency/concentration, resilience, incident cooperation and viable transition/exit needs proportionate to risk?", fr: "Le traitement couvre-t-il la dépendance/concentration, la résilience, la coopération en cas d’incident et des besoins viables de transition/sortie proportionnés au risque ?" },
  p5_20_004_sensitive_data_clauses: { conditionKey: "suppliersProcessSensitiveOrPersonalData", en: "Do agreements define relevant data protection, confidentiality, processing/location, sub-processing, transfer, return/deletion and incident-cooperation requirements?", fr: "Les accords définissent-ils les exigences pertinentes de protection des données, confidentialité, traitement/localisation, sous-traitance, transfert, restitution/suppression et coopération en cas d’incident ?" },
  p5_20_005_access_clauses: { conditionKey: "suppliersAccessOrgInformationOrSystems", en: "Do agreements define authorized scope, security responsibilities, personnel expectations, termination and assurance/verification rights as appropriate?", fr: "Les accords définissent-ils le périmètre autorisé, les responsabilités de sécurité, les attentes envers le personnel, la fin de l’accès et les droits d’assurance/vérification lorsque pertinent ?" },
  p5_20_006_critical_supplier_clauses: { conditionKey: "dependsOnCriticalSuppliers", en: "Do agreements address security-related continuity, material changes, incident escalation/cooperation, assurance and transition/exit obligations proportionate to dependency/risk?", fr: "Les accords couvrent-ils la continuité liée à la sécurité, les changements significatifs, l’escalade/cooperation en cas d’incident, l’assurance et les obligations de transition/sortie proportionnées à la dépendance et au risque ?" },
};
const expectedCanonicalConditionalFragments = {
  p5_14_004_external_transfer: "security responsibilities, permitted methods, confidentiality and necessary transfer requirements agreed before sensitive exchange",
  p5_14_005_physical_transfer: "packaging, custody, authorised carrier/recipient, loss handling and media/document protection defined/applied",
  p5_14_006_verbal_transfer: "rules for participant verification and avoiding inappropriate locations/channels",
  p5_16_004_non_human_identities: "owners, purpose, lifecycle, permissions, credential dependencies and retirement managed",
  p5_16_005_shared_identities: "formally justified, approved, attributable through compensating controls, reconsidered and removed when unnecessary",
  p5_17_004_default_credentials: "changed, disabled or otherwise secured before/immediately upon operational use according to defined rules",
  p5_17_005_machine_secrets: "ownership, protected storage, issuance, rotation/replacement, revocation and access to secrets managed according to risk",
  p5_18_004_privileged_rights: "explicitly approved scope, enhanced review and prompt revocation/adjustment",
  p5_18_005_third_party_rights: "expiry/termination conditions and continuing-business-need confirmation enforced",
  p5_19_004_supplier_access_risk: "specific risks, access boundaries and required safeguards identified before access and revisited on change",
  p5_19_005_critical_supplier: "treatment addresses dependency/concentration, resilience, incident cooperation and viable transition/exit needs proportionate to risk",
  p5_20_004_sensitive_data_clauses: "agreements define relevant data protection, confidentiality, processing/location, sub-processing, transfer, return/deletion and incident-cooperation requirements",
  p5_20_005_access_clauses: "agreements define authorized scope, security responsibilities, personnel expectations, termination and assurance/verification rights as appropriate",
  p5_20_006_critical_supplier_clauses: "agreements address security-related continuity, material changes, incident escalation/cooperation, assurance and transition/exit obligations proportionate to dependency/risk",
};
const batchQuestions = batchControls.flatMap((control) => control.questions);
assert.equal(batchQuestions.filter((item) => item.type !== "conditional").length, 30, "A.5.11-A.5.20: 30 mandatory questions");
assert.equal(batchQuestions.filter((item) => item.type === "conditional").length, 21, "A.5.11-A.5.20: 21 conditional questions");
assert.equal(batchControls.flatMap((control) => control.quickContext).length, 23, "A.5.11-A.5.20: reused and local Quick Context definitions");
assert.equal(new Set(batchQuestions.map((item) => item.id)).size, 51, "A.5.11-A.5.20: unique assessed-question IDs");

const normalizedSource = batchReadme.toLocaleLowerCase("en").replace(/\s+/g, " ");
for (const control of batchControls) {
  assert.ok(batchReadme.includes(`# ${control.code} — ${control.name}`), `${control.code}: exact canonical order/name`);
  const mandatory = control.questions.filter((item) => item.type !== "conditional");
  const conditional = control.questions.filter((item) => item.type === "conditional");
  assert.deepEqual(
    mandatory.map((item) => item.id),
    [1, 2, 3].map((number) => `p5_${control.id.slice(3)}_00${number}`),
    `${control.code}: canonical backend ID convention`,
  );
  assert.deepEqual(conditional.map((item) => item.id), expectedBatchConditionalIds[control.id], `${control.code}: conditional IDs`);
  assert.deepEqual(mandatory.map((item) => item.type), ["policy_process", "application", "proof_traceability"], `${control.code}: mandatory types`);

  for (const item of mandatory) {
    assert.ok(batchReadme.includes(item.question.en), `${item.id}: exact canonical EN`);
    assert.ok(batchReadme.includes(item.question.fr), `${item.id}: exact canonical FR`);
    assert.equal(item.conditionKey, null, `${item.id}: mandatory question is unconditional`);
  }
  for (const item of conditional) {
    const expected = expectedBatchConditionalDetails[item.id];
    assert.ok(expected, `${item.id}: exact conditional fixture exists`);
    assert.deepEqual(
      { conditionKey: item.conditionKey, en: item.question.en, fr: item.question.fr },
      expected,
      `${item.id}: exact conditionKey and EN/FR wording`,
    );
    const family = item.partial.gapCode.replace(/_PARTIAL$/, "");
    const canonicalLine = batchReadme.split(/\r?\n/).find((line) => line.includes(`\`${family}\``));
    assert.ok(canonicalLine, `${item.id}: canonical conditional line/family`);
    const canonicalFragment = expectedCanonicalConditionalFragments[item.id];
    if (canonicalFragment) {
      assert.ok(canonicalLine.includes(canonicalFragment), `${item.id}: exact canonical conditional requirement`);
    } else {
      assert.ok(canonicalLine.includes(item.question.en), `${item.id}: exact canonical conditional EN`);
      assert.ok(canonicalLine.includes(item.question.fr), `${item.id}: exact canonical conditional FR`);
    }
  }
  for (const item of control.questions) {
    const family = item.partial.gapCode.replace(/_PARTIAL$/, "");
    assert.equal(item.absent.gapCode, `${family}_ABSENT`, `${item.id}: ABSENT gap family`);
    assert.ok(batchReadme.includes(family), `${item.id}: gap family in canonical README`);
    assert.ok(normalizedSource.includes(item.partial.remediation.toLocaleLowerCase("en")), `${item.id}: PARTIAL remediation parity`);
    assert.ok(normalizedSource.includes(item.absent.remediation.toLocaleLowerCase("en")), `${item.id}: ABSENT remediation parity`);
    if (item.evidence) assert.ok(normalizedSource.includes(item.evidence.toLocaleLowerCase("en")), `${item.id}: evidence parity`);
  }
  for (const quickContext of control.quickContext) {
    assert.ok(batchReadme.includes(quickContext.key), `${control.code}/${quickContext.key}: canonical context key`);
    assert.ok(batchReadme.includes(quickContext.question.en), `${control.code}/${quickContext.key}: Quick Context EN`);
    assert.ok(batchReadme.includes(quickContext.question.fr), `${control.code}/${quickContext.key}: Quick Context FR`);
  }

  const unresolved = resolveOrganizationalControl(control.id, {});
  assert.deepEqual(unresolved.questionIds, mandatory.map((item) => item.id), `${control.code}: unresolved context leaves mains visible`);
  assert.equal(unresolved.assessmentBlocked, false, `${control.code}: unresolved context does not block mandatory questions`);
  assert.equal(unresolved.requiredQuickContextQuestions.length, control.quickContext.length, `${control.code}: only unresolved Quick Context returned`);

  const allYes = Object.fromEntries(control.quickContext.map((item) => [item.key, "yes"]));
  const yesResolution = resolveOrganizationalControl(control.id, allYes);
  assert.deepEqual(yesResolution.questionIds, control.questions.map((item) => item.id), `${control.code}: all yes shows all conditionals`);
  assert.equal(yesResolution.requiredQuickContextQuestions.length, 0, `${control.code}: resolved context hides Quick Context`);

  const allNo = Object.fromEntries(control.quickContext.map((item) => [item.key, "no"]));
  const noResolution = resolveOrganizationalControl(control.id, allNo);
  if (control.applicabilityKey) {
    assert.equal(noResolution.controlApplicability, "not_applicable", `${control.code}: explicit whole-control N/A`);
    assert.deepEqual(noResolution.questionIds, [], `${control.code}: accepted applicability fact hides assessed questions`);
  } else {
    assert.deepEqual(noResolution.questionIds, mandatory.map((item) => item.id), `${control.code}: no hides only conditionals`);
  }

  const allNotSure = Object.fromEntries(control.quickContext.map((item) => [item.key, "not_sure"]));
  const notSureResolution = resolveOrganizationalControl(control.id, allNotSure);
  assert.deepEqual(notSureResolution.questionIds, mandatory.map((item) => item.id), `${control.code}: not_sure hides conditionals but leaves mains`);
  assert.equal(notSureResolution.requiredQuickContextQuestions.length, control.quickContext.length, `${control.code}: not_sure remains unresolved`);

  if (control.quickContext.length > 1) {
    const firstResolved = { [control.quickContext[0].key]: "yes" };
    const partialResolution = resolveOrganizationalControl(control.id, firstResolved);
    assert.deepEqual(
      partialResolution.requiredQuickContextQuestions.map((item) => item.key),
      control.quickContext.slice(1).map((item) => item.key),
      `${control.code}: returns only still-unresolved Quick Context`,
    );
  }

  for (const item of control.questions) {
    const base = { questionId: item.id };
    const implemented = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "implemented" }], allYes);
    assert.equal(implemented.gapActions.length, 0, `${item.id}: implemented -> no gap`);
    const partial = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "partially_implemented" }], allYes);
    assert.equal(partial.gapActions[0]?.gapCode, item.partial.gapCode, `${item.id}: partial gap`);
    assert.equal(partial.gapActions[0]?.remediation, item.partial.remediation, `${item.id}: partial remediation`);
    const absent = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "not_implemented" }], allYes);
    assert.equal(absent.gapActions[0]?.gapCode, item.absent.gapCode, `${item.id}: absent gap`);
    assert.equal(absent.gapActions[0]?.remediation, item.absent.remediation, `${item.id}: full remediation`);
    const unsure = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "not_sure" }], allYes);
    assert.equal(unsure.reviewState, "clarification_required", `${item.id}: not_sure clarification`);
    assert.equal(unsure.gapActions.length, 0, `${item.id}: not_sure no gap`);
    const invalidNa = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "not_applicable" }], allYes);
    assert.equal(invalidNa.invalidResponses[0]?.errorCode, "not_applicable_requires_justification", `${item.id}: N/A justification required`);
    const validNa = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "not_applicable", justification: "Written risk/SoA justification" }], allYes);
    assert.equal(validNa.reviewState, "applicability_review_required", `${item.id}: N/A review required`);
    assert.equal(validNa.gapActions.length, 0, `${item.id}: N/A no gap`);
  }
}

const expectedFinalBatchConditionalIds = {
  "a5-21": ["p5_21_004_upstream", "p5_21_005_components", "p5_21_006_continuity"],
  "a5-22": ["p5_22_004_critical", "p5_22_005_provider_incident"],
  "a5-23": ["p5_23_004_critical_exit", "p5_23_005_sensitive_data", "p5_23_006_shadow_it"],
  "a5-24": ["p5_24_004_external_ir"],
  "a5-25": ["p5_25_004_high_volume"],
  "a5-26": ["p5_26_004_real_incident"],
  "a5-27": ["p5_27_004_incident_sample"],
  "a5-28": ["p5_28_004_external_forensics", "p5_28_005_cloud_evidence"],
  "a5-29": ["p5_29_004_emergency_access", "p5_29_005_alternate_operations"],
  "a5-30": ["p5_30_004_backup_alignment", "p5_30_005_redundancy_alignment", "p5_30_006_cloud_supplier_continuity"],
};
const expectedFinalBatchControlApplicability = {
  "a5-21": "usesIctSuppliersInScope",
  "a5-22": "usesIctSuppliersInScope",
  "a5-23": "usesCloudServicesInScope",
  "a5-30": "dependsOnIctForCriticalActivities",
};
const finalBatchQuestions = finalBatchControls.flatMap((control) => control.questions);
assert.equal(finalBatchQuestions.filter((item) => item.type !== "conditional").length, 30, "A.5.21-A.5.30: 30 mandatory questions");
assert.equal(finalBatchQuestions.filter((item) => item.type === "conditional").length, 19, "A.5.21-A.5.30: 19 conditional questions");
assert.equal(finalBatchControls.flatMap((control) => control.quickContext).length, 9, "A.5.21-A.5.30: 9 canonical Quick Context questions");
assert.equal(new Set(finalBatchQuestions.map((item) => item.id)).size, 49, "A.5.21-A.5.30: unique assessed-question IDs");

const normalizedFinalSource = finalBatchReadme.toLocaleLowerCase("en").replace(/\s+/g, " ");
for (const control of finalBatchControls) {
  assert.ok(finalBatchReadme.split(/\r?\n/).some((line) =>
    line.startsWith(`# ${control.code}`) && line.includes(control.name),
  ), `${control.code}: exact canonical name`);
  const mandatory = control.questions.filter((item) => item.type !== "conditional");
  const conditional = control.questions.filter((item) => item.type === "conditional");
  assert.deepEqual(mandatory.map((item) => item.id), [1, 2, 3].map((number) => `p5_${control.id.slice(3)}_00${number}`), `${control.code}: three canonical main IDs`);
  assert.deepEqual(mandatory.map((item) => item.type), ["policy_process", "application", "proof_traceability"], `${control.code}: main question types`);
  assert.deepEqual(conditional.map((item) => item.id), expectedFinalBatchConditionalIds[control.id], `${control.code}: conditional IDs/order`);
  assert.equal(control.applicabilityKey, expectedFinalBatchControlApplicability[control.id] ?? null, `${control.code}: control-level applicability key`);

  for (const item of mandatory) {
    assert.ok(finalBatchReadme.split(/\r?\n/).some((line) =>
      line.startsWith(`### \`${item.id}\``) && line.includes(`\`${item.type}\``),
    ), `${item.id}: exact ID/type marker`);
    assert.ok(finalBatchReadme.includes(item.question.en), `${item.id}: exact EN wording`);
    assert.ok(finalBatchReadme.includes(item.question.fr), `${item.id}: exact FR wording`);
    assert.equal(item.conditionKey, null, `${item.id}: main question always evaluable`);
  }
  for (const item of conditional) {
    assert.ok(finalBatchReadme.split(/\r?\n/).some((line) =>
      line.startsWith(`### \`${item.id}\``) && line.includes(`condition \`${item.conditionKey} == yes\``),
    ), `${item.id}: exact conditionKey`);
    assert.ok(finalBatchReadme.includes(item.question.en), `${item.id}: exact conditional EN`);
    assert.ok(finalBatchReadme.includes(item.question.fr), `${item.id}: exact conditional FR`);
  }
  for (const quickContext of control.quickContext) {
    assert.ok(finalBatchReadme.includes(quickContext.key), `${control.code}/${quickContext.key}: Quick Context key`);
    assert.ok(finalBatchReadme.includes(quickContext.question.en), `${control.code}/${quickContext.key}: Quick Context EN`);
    assert.ok(finalBatchReadme.includes(quickContext.question.fr), `${control.code}/${quickContext.key}: Quick Context FR`);
    if (quickContext.conditionKey) {
      const unresolved = resolveOrganizationalControl(control.id, {});
      assert.equal(unresolved.requiredQuickContextQuestions.some((item) => item.key === quickContext.key), false, `${control.code}/${quickContext.key}: dependent Quick Context hidden until parent yes`);
    }
  }
  for (const item of control.questions) {
    assert.ok(finalBatchReadme.includes(item.partial.gapCode), `${item.id}: PARTIAL gap code parity`);
    assert.ok(finalBatchReadme.includes(item.absent.gapCode), `${item.id}: ABSENT gap code parity`);
    assert.ok(normalizedFinalSource.includes(item.partial.remediation.toLocaleLowerCase("en")), `${item.id}: partial remediation parity`);
    assert.ok(normalizedFinalSource.includes(item.absent.remediation.toLocaleLowerCase("en")), `${item.id}: full remediation parity`);
    if (item.evidence) assert.ok(normalizedFinalSource.includes(item.evidence.toLocaleLowerCase("en")), `${item.id}: evidence parity`);
  }

  const unresolved = resolveOrganizationalControl(control.id, {});
  assert.deepEqual(unresolved.questionIds, mandatory.map((item) => item.id), `${control.code}: unresolved context leaves main questions visible`);
  assert.equal(unresolved.assessmentBlocked, false, `${control.code}: unresolved ordinary context does not block main questions`);
  const allYes = {
    ...Object.fromEntries(control.quickContext.map((item) => [item.key, "yes"])),
    ...Object.fromEntries(conditional.map((item) => [item.conditionKey, "yes"])),
  };
  const yesResolution = resolveOrganizationalControl(control.id, allYes);
  assert.deepEqual(yesResolution.questionIds, control.questions.map((item) => item.id), `${control.code}: yes context shows conditionals`);
  const allNo = {
    ...Object.fromEntries(control.quickContext.map((item) => [item.key, "no"])),
    ...Object.fromEntries(conditional.map((item) => [item.conditionKey, "no"])),
    ...(control.applicabilityKey ? { [control.applicabilityKey]: "no" } : {}),
  };
  const noResolution = resolveOrganizationalControl(control.id, allNo);
  if (control.applicabilityKey) {
    assert.equal(noResolution.controlApplicability, "not_applicable", `${control.code}: no applicability proposes control-level N/A`);
    assert.equal(noResolution.assessmentBlocked, true, `${control.code}: control-level N/A requires justification`);
    assert.deepEqual(resolveOrganizationalControl(control.id, allNo, "No applicable in-scope dependency.").questionIds, [], `${control.code}: justified N/A keeps questions hidden`);
  } else {
    assert.deepEqual(noResolution.questionIds, mandatory.map((item) => item.id), `${control.code}: no hides only conditionals`);
  }
  const notSure = {
    ...Object.fromEntries(control.quickContext.map((item) => [item.key, "not_sure"])),
    ...Object.fromEntries(conditional.map((item) => [item.conditionKey, "not_sure"])),
  };
  assert.deepEqual(resolveOrganizationalControl(control.id, notSure).questionIds, mandatory.map((item) => item.id), `${control.code}: not_sure hides conditionals`);

  for (const item of control.questions) {
    const base = { questionId: item.id };
    const implemented = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "implemented" }], allYes);
    assert.equal(implemented.gapActions.length, 0, `${item.id}: implemented -> no gap`);
    const partial = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "partially_implemented" }], allYes);
    assert.equal(partial.gapActions[0]?.gapCode, item.partial.gapCode, `${item.id}: PARTIAL gap code`);
    assert.equal(partial.gapActions[0]?.remediation, item.partial.remediation, `${item.id}: PARTIAL remediation`);
    const absent = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "not_implemented" }], allYes);
    assert.equal(absent.gapActions[0]?.gapCode, item.absent.gapCode, `${item.id}: ABSENT gap code`);
    assert.equal(absent.gapActions[0]?.remediation, item.absent.remediation, `${item.id}: ABSENT remediation`);
    const unsure = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "not_sure" }], allYes);
    assert.equal(unsure.reviewState, "clarification_required", `${item.id}: not_sure -> clarification_required`);
    assert.equal(unsure.gapActions.length, 0, `${item.id}: not_sure no gap`);
    assert.equal(deriveOrganizationalOutcome(control.id, [{ ...base, answer: "not_applicable" }], allYes).invalidResponses[0]?.errorCode, "not_applicable_requires_justification", `${item.id}: N/A justification mandatory`);
    const na = deriveOrganizationalOutcome(control.id, [{ ...base, answer: "not_applicable", justification: "Applicability review justification." }], allYes);
    assert.equal(na.reviewState, "applicability_review_required", `${item.id}: N/A review required`);
    assert.equal(na.gapActions.length, 0, `${item.id}: N/A no automatic gap`);
  }
}

// Persisted Organizational -> onboarding -> shared/cross-theme -> Quick Context.
let resolved = resolveOrganizationalAssessmentContext(
  { allowsBYODForBusiness: "no" },
  { allowsBYODForBusiness: "yes" },
  { allowsBYODForBusiness: "yes" },
  {},
);
assert.equal(resolved.context.allowsBYODForBusiness, "no");
assert.equal(resolved.sources.allowsBYODForBusiness, "organizational_persisted");
resolved = resolveOrganizationalAssessmentContext({}, { allowsBYODForBusiness: "no" }, { allowsBYOD: "yes" }, {});
assert.equal(resolved.context.allowsBYODForBusiness, "no");
assert.equal(resolved.sources.allowsBYODForBusiness, "onboarding");
resolved = resolveOrganizationalAssessmentContext({}, {}, {}, { hasBYODDevices: "yes" });
assert.equal(resolved.context.allowsBYODForBusiness, "yes", "People/Technological BYOD semantic reuse");
assert.equal(resolved.sources.allowsBYODForBusiness, "shared_context");
resolved = resolveOrganizationalAssessmentContext({}, {}, { usesCloudArchitecture: "yes" }, {});
assert.equal(resolved.context.usesCloudOrExternallyManagedAssets, "yes", "Technological/cloud semantic reuse");
resolved = resolveOrganizationalAssessmentContext({}, { managesNonSoftwareProjectsInIsmsScope: "yes" }, {}, {});
assert.equal(resolved.context.managesProjectsInIsmsScope, "yes", "A.5.8 non-software project context");
resolved = resolveOrganizationalAssessmentContext({}, { company_size: "1-10" }, {}, {});
assert.equal(resolved.context.cannotFullySegregateDuties, undefined, "A.5.3 is not inferred from company size");
resolved = resolveOrganizationalAssessmentContext({}, { subscribesToSecurityBulletins: "yes" }, {}, {});
assert.equal(resolved.context.sharesSecurityInformationWithExternalGroups, undefined, "A.5.6 is not inferred from bulletin subscription");
resolved = resolveOrganizationalAssessmentContext({ allowsBYODForBusiness: "not_sure" }, { allowsBYOD: "yes" }, {}, {});
assert.equal(resolved.context.allowsBYODForBusiness, "not_sure", "persisted not_sure remains unresolved instead of being overwritten");

// A.5.11-A.5.20 precedence: persisted -> onboarding -> cross-theme -> shared -> Quick Context.
resolved = resolveOrganizationalAssessmentContext(
  { allowsBYODForBusiness: "yes" },
  { allowsBYOD: "no" },
  { allowsBYOD: "no" },
  { allowsBYOD: "no" },
);
assert.equal(resolved.context.allowsBYOD, "yes", "A.5.11 reuses persisted A.5.10 BYOD context first");
assert.equal(resolved.sources.allowsBYOD, "organizational_persisted");
resolved = resolveOrganizationalAssessmentContext(
  {},
  { grantsThirdPartyAccess: "no" },
  { grantsThirdPartyAccess: "no" },
  { thirdPartyPrivilegedAccess: "yes" },
);
assert.equal(resolved.context.grantsThirdPartyAccess, "no", "onboarding precedes cross-theme supplier-access facts");
assert.equal(resolved.sources.grantsThirdPartyAccess, "onboarding");
resolved = resolveOrganizationalAssessmentContext(
  {},
  {},
  { grantsThirdPartyAccess: "no" },
  { thirdPartyPrivilegedAccess: "yes" },
);
assert.equal(resolved.context.grantsThirdPartyAccess, "yes", "cross-theme precedes shared context for the new batch");
assert.equal(resolved.sources.grantsThirdPartyAccess, "cross_theme_context");
resolved = resolveOrganizationalAssessmentContext({}, {}, {}, { usesSharedPrivilegedAccounts: "yes" });
assert.equal(resolved.context.usesSharedOrGenericAccounts, "yes", "A.5.16 reuses positive A.8.2 shared-account context");
assert.equal(resolved.context.hasPrivilegedAccessRights, "yes", "A.5.18 reuses positive A.8.2 privileged context");
resolved = resolveOrganizationalAssessmentContext({}, {}, {}, { usesSharedPrivilegedAccounts: "no" });
assert.equal(resolved.context.usesSharedOrGenericAccounts, undefined, "a negative narrow A.8.2 fact does not over-infer broad shared-account context");
assert.equal(resolved.context.hasPrivilegedAccessRights, undefined, "a negative narrow A.8.2 fact does not over-infer absence of all privileged rights");
resolved = resolveOrganizationalAssessmentContext({}, {}, {}, {
  usesExternallyHostedCriticalSystems: "yes",
  hasExternalPartiesAccessingSensitiveInformation: "yes",
});
assert.equal(resolved.context.usesInScopeSuppliersOrExternalServices, "yes", "A.5.19 reuses relevant Technological supplier context");
assert.equal(resolved.context.suppliersAccessOrgInformationOrSystems, "yes", "A.5.19/A.5.20 reuse supplier-access context");
assert.equal(resolved.context.dependsOnCriticalSuppliers, "yes", "A.5.19/A.5.20 reuse critical external-service context");
resolved = resolveOrganizationalAssessmentContext({}, {}, {}, { hasRelevantExternalParties: "yes" });
assert.equal(resolved.context.grantsThirdPartyAccess, "yes", "People hasRelevantExternalParties=yes reuses A.5.15/A.5.18 context");
assert.equal(resolveOrganizationalControl("a5-15", resolved.context).requiredQuickContextQuestions.length, 0, "known People access context suppresses A.5.15 Quick Context");
resolved = resolveOrganizationalAssessmentContext({}, {}, {}, { has_external_personnel: "no" });
assert.equal(resolved.context.grantsThirdPartyAccess, "no", "persisted People has_external_personnel=no normalizes to no third-party access");
assert.equal(resolveOrganizationalControl("a5-18", resolved.context).requiredQuickContextQuestions.some((item) => item.key === "grantsThirdPartyAccess"), false, "known People no suppresses A.5.18 third-party Quick Context");
resolved = resolveOrganizationalAssessmentContext({}, {}, {}, {
  usesExternallyHostedCriticalSystems: "yes",
  supplierSubprocessorsAllowed: "yes",
  hasSupplierSecurityIncidents: "yes",
});
assert.equal(resolved.context.usesIctSuppliersInScope, "yes", "A.5.21/A.5.22 reuse ICT supplier context");
assert.equal(resolved.context.hasCriticalIctSuppliers, "yes", "A.5.21/A.5.22 reuse critical supplier context");
assert.equal(resolved.context.hasSupplierSubprocessorsOrFourthParties, "yes", "A.5.21 reuses subprocessor/fourth-party context");
assert.equal(resolved.context.hasExperiencedSupplierSecurityIncident, "yes", "A.5.22 reuses supplier incident context");
assert.equal(resolveOrganizationalControl("a5-21", resolved.context).questionIds.includes("p5_21_004_upstream"), true, "A.5.21 upstream branch from reused context");
assert.equal(resolveOrganizationalControl("a5-22", resolved.context).questionIds.includes("p5_22_005_provider_incident"), true, "A.5.22 supplier incident branch from reused context");
assert.equal(resolveOrganizationalControl("a5-22", resolved.context).requiredQuickContextQuestions.some((item) => item.key === "hasExperiencedSupplierSecurityIncident"), false, "A.5.22 known supplier incident context suppresses Quick Context");
assert.equal(resolveOrganizationalControl("a5-22", {}).requiredQuickContextQuestions.some((item) => item.key === "hasExperiencedSupplierSecurityIncident"), true, "A.5.22 unknown supplier incident context asks Quick Context");
assert.equal(resolveOrganizationalControl("a5-22", { hasExperiencedSupplierSecurityIncident: "not_sure" }).requiredQuickContextQuestions.some((item) => item.key === "hasExperiencedSupplierSecurityIncident"), true, "A.5.22 not_sure supplier incident context remains unresolved");
assert.equal(resolveOrganizationalControl("a5-22", { hasExperiencedSupplierSecurityIncident: "no" }).questionIds.includes("p5_22_005_provider_incident"), false, "A.5.22 no supplier incident hides conditional");
assert.equal(resolveOrganizationalControl("a5-22", { hasExperiencedSupplierSecurityIncident: "no" }).requiredQuickContextQuestions.some((item) => item.key === "hasExperiencedSupplierSecurityIncident"), false, "A.5.22 no supplier incident suppresses Quick Context");
assert.equal(resolveOrganizationalControl("a5-22", { hasExperiencedSupplierSecurityIncident: "yes" }).questionIds.includes("p5_22_005_provider_incident"), true, "A.5.22 yes supplier incident shows conditional");
resolved = resolveOrganizationalAssessmentContext({}, {}, {}, {
  usesCloudArchitecture: "yes",
  usesCloudHostedCriticalDataOrSystems: "yes",
  usesCloudForSensitiveData: "yes",
});
assert.equal(resolved.context.usesCloudServicesInScope, "yes", "A.5.23/A.5.28 reuse cloud context");
assert.equal(resolved.context.hasCriticalCloudServices, "yes", "A.5.23/A.5.30 reuse critical cloud context");
assert.equal(resolved.context.cloudProcessesSensitiveOrRegulatedData, "yes", "A.5.23 reuses sensitive cloud context");
assert.equal(resolveOrganizationalControl("a5-23", resolved.context).requiredQuickContextQuestions.length, 0, "known cloud context suppresses Quick Context");
resolved = resolveOrganizationalAssessmentContext({}, {}, {}, {
  usesExternalForensicsProvider: "yes",
  hasRecentSecurityIncidents: "yes",
  usesSIEM: "yes",
  usesBreakGlassPrivilegedAccess: "yes",
  usesManualFallback: "yes",
});
assert.equal(resolved.context.usesExternalIncidentResponseProvider, "yes", "A.5.24/A.5.28 reuse external IR provider context");
assert.equal(resolved.context.hasExperiencedSecurityIncidents, "yes", "A.5.26/A.5.27 reuse real incident context");
assert.equal(resolved.context.usesAutomatedSecurityMonitoring, "yes", "A.5.25 reuses monitoring context");
assert.equal(resolved.context.usesEmergencyOrBreakGlassAccess, "yes", "A.5.29 reuses break-glass context");
assert.equal(resolved.context.usesAlternateSitesOrManualFallback, "yes", "A.5.29 reuses alternate/manual fallback context");
assert.equal(resolveOrganizationalControl("a5-26", resolved.context).requiredQuickContextQuestions.some((item) => item.key === "hasExperiencedSecurityIncidents"), false, "A.5.26 known incident context suppresses Quick Context");
assert.equal(resolveOrganizationalControl("a5-26", {}).requiredQuickContextQuestions.some((item) => item.key === "hasExperiencedSecurityIncidents"), true, "A.5.26 unknown incident context asks Quick Context");
assert.equal(resolveOrganizationalControl("a5-26", { hasExperiencedSecurityIncidents: "not_sure" }).requiredQuickContextQuestions.some((item) => item.key === "hasExperiencedSecurityIncidents"), true, "A.5.26 not_sure incident context remains unresolved");
assert.equal(resolveOrganizationalControl("a5-26", { hasExperiencedSecurityIncidents: "no" }).questionIds.includes("p5_26_004_real_incident"), false, "A.5.26 no incident hides conditional");
assert.equal(resolveOrganizationalControl("a5-26", { hasExperiencedSecurityIncidents: "no" }).requiredQuickContextQuestions.some((item) => item.key === "hasExperiencedSecurityIncidents"), false, "A.5.26 no incident suppresses Quick Context");
assert.equal(resolveOrganizationalControl("a5-26", { hasExperiencedSecurityIncidents: "yes" }).questionIds.includes("p5_26_004_real_incident"), true, "A.5.26 yes incident shows conditional");
resolved = resolveOrganizationalAssessmentContext({}, {}, {}, {
  hasCriticalIctDependencies: "yes",
  hasRecoveryObjectives: "yes",
  criticalBackupsConfigured: "yes",
  criticalServicesHaveRedundancy: "yes",
  usesCloudHostedCriticalDataOrSystems: "yes",
});
assert.equal(resolved.context.dependsOnIctForCriticalActivities, "yes", "A.5.30 reuses continuity/critical ICT dependency context");
assert.equal(resolved.context.hasDefinedRtoRpo, "yes", "A.5.30 reuses RTO/RPO context");
assert.equal(resolved.context.hasBackupsForCriticalSystems, "yes", "A.5.30 reuses A.8.13 backup context");
assert.equal(resolved.context.hasRedundancyForCriticalServices, "yes", "A.5.30 reuses A.8.14 redundancy context");
assert.equal(resolveOrganizationalControl("a5-30", resolved.context).questionIds.includes("p5_30_004_backup_alignment"), true, "A.5.30 backup branch from A.8.13 context");

// Hidden conditional responses never affect outcomes, gaps, remediations, or counts.
for (const control of organizationalControls) {
  const conditional = control.questions.find((item) => item.type === "conditional");
  if (!conditional) continue;
  const context = { [conditional.conditionKey]: "no" };
  const outcome = deriveOrganizationalOutcome(control.id, [
    { questionId: control.questions[0].id, answer: "implemented" },
    { questionId: conditional.id, answer: "not_implemented" },
  ], context);
  assert.equal(outcome.gapActions.length, 0, `${conditional.id}: hidden gap ignored`);
  assert.equal(outcome.evaluatedResponseCount, 1, `${conditional.id}: hidden response ignored in counts`);
  assert.deepEqual(outcome.ignoredHiddenResponseIds, [conditional.id], `${conditional.id}: hidden response reported as ignored`);
  assert.deepEqual(deriveOrganizationalRemediationPlan(control.id, outcome), [], `${conditional.id}: hidden remediation ignored`);
}

// Canonical special-case regressions.
assert.equal(resolveOrganizationalControl("a5-3", { cannotFullySegregateDuties: "yes" }).questionIds.includes("p5_3_004_compensating"), true);
assert.equal(resolveOrganizationalControl("a5-3", { cannotFullySegregateDuties: "no" }).hiddenQuestionIds.includes("p5_3_004_compensating"), true);
assert.equal(resolveOrganizationalControl("a5-3", { cannotFullySegregateDuties: "not_sure" }).questionIds.length, 3);
assert.ok(organizationalControls.find((control) => control.id === "a5-5").questions[2].question.en.includes("without requiring that a real incident has already occurred"), "A.5.5 no prior real incident required");
assert.equal(resolveOrganizationalControl("a5-9", { usesCloudOrExternallyManagedAssets: "yes" }).questionIds.includes("p5_9_004_external"), true, "A.5.9 SaaS/cloud/third-party branch");
assert.ok(organizationalControls.find((control) => control.id === "a5-9").questions[0].question.en.includes("information and other associated assets"), "A.5.9 includes information assets");
assert.ok(organizationalControls.find((control) => control.id === "a5-10").questions[0].question.en.includes("handling procedures"), "A.5.10 includes handling");
assert.equal(resolveOrganizationalControl("a5-10", { allowsBYODForBusiness: "yes" }).questionIds.includes("p5_10_004_byod"), true, "A.5.10 BYOD branch");

// Real Assessment API handler flow for the A.5.8 control-level N/A path.
const workspaceId = "00000000-0000-0000-0000-000000000058";
let userMetadata = {
  normcore_onboarding: {
    workspace_creation_id: workspaceId,
    preserved_onboarding_value: "keep-me",
    assessment_context: {
      shared_context: { preservedSharedFact: "yes" },
      organizational: {
        managesProjectsInIsmsScope: "no",
        preservedOrganizationalFact: "keep-me-too",
      },
    },
  },
};
let metadataUpdates = 0;
let responseUpserts = 0;
const responseRows = [];

function dbRow(payload) {
  return {
    id: "10000000-0000-0000-0000-000000000058",
    ...payload,
    responded_by: "20000000-0000-0000-0000-000000000058",
    responded_at: "2026-08-10T12:00:00.000Z",
    validated_by: null,
    validated_at: null,
    created_at: "2026-08-10T12:00:00.000Z",
    updated_at: "2026-08-10T12:00:00.000Z",
  };
}

const fakeClient = {
  auth: {
    async getUser() {
      return { data: { user: { user_metadata: userMetadata } }, error: null };
    },
    async updateUser({ data }) {
      metadataUpdates += 1;
      userMetadata = { ...userMetadata, ...data };
      return { data: { user: { user_metadata: userMetadata } }, error: null };
    },
  },
  from(table) {
    assert.equal(table, "assessment_responses");
    return {
      select() {
        return {
          async eq() {
            return { data: responseRows, error: null };
          },
        };
      },
      upsert(payload) {
        responseUpserts += 1;
        const row = dbRow(payload);
        const existingIndex = responseRows.findIndex((item) =>
          item.workspace_id === payload.workspace_id && item.question_id === payload.question_id,
        );
        if (existingIndex >= 0) responseRows.splice(existingIndex, 1, row);
        else responseRows.push(row);
        return {
          select() {
            return {
              async single() {
                return { data: row, error: null };
              },
            };
          },
        };
      },
    };
  },
};
const fakeClientFactory = async () => fakeClient;
const apiRouteContext = {
  params: Promise.resolve({}),
  clientFactory: fakeClientFactory,
};
const apiRequest = (body) => new Request("http://localhost/api/assessment/responses", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const a58ControlRequest = (overrides = {}) => apiRequest({
  workspaceId,
  theme: "organizational",
  controlId: "a5-8",
  controlApplicability: "not_applicable",
  controlApplicabilityJustification: "No projects affect the current ISMS scope; SoA review required.",
  ...overrides,
});

let apiResponse = await assessmentResponsesPost(
  a58ControlRequest({ controlApplicabilityJustification: "" }),
  apiRouteContext,
);
assert.equal(apiResponse.status, 400, "API rejects A.5.8 control-level N/A without justification");
assert.equal(metadataUpdates, 0, "missing control justification is not persisted");

apiResponse = await assessmentResponsesPost(a58ControlRequest(), apiRouteContext);
assert.equal(apiResponse.status, 200, "API accepts justified A.5.8 control-level N/A");
let apiBody = await apiResponse.json();
assert.equal(apiBody.organizational.outcome.resolution.controlApplicability, "not_applicable");
assert.equal(apiBody.organizational.outcome.resolution.controlReviewState, "applicability_review_required");
assert.equal(apiBody.organizational.outcome.resolution.assessmentBlocked, false, "persisted justification completes the N/A input");
assert.deepEqual(apiBody.organizational.outcome.resolution.questionIds, [], "A.5.8 principal questions remain hidden while context is no");
assert.deepEqual(apiBody.organizational.outcome.gapActions, [], "control-level N/A creates no gaps");
assert.deepEqual(apiBody.organizational.remediationPlan, [], "control-level N/A creates no remediation");
assert.equal(responseUpserts, 0, "control-level N/A does not create a fake question response");
assert.equal(metadataUpdates, 1, "control-level justification is persisted once");
assert.equal(
  userMetadata.normcore_onboarding.assessment_context.organizational.control_applicability_justifications["a5-8"],
  "No projects affect the current ISMS scope; SoA review required.",
  "A.5.8 justification persists in the existing Organizational assessment context",
);
assert.equal(userMetadata.normcore_onboarding.preserved_onboarding_value, "keep-me", "onboarding metadata is preserved");
assert.equal(userMetadata.normcore_onboarding.assessment_context.shared_context.preservedSharedFact, "yes", "shared context is preserved");
assert.equal(userMetadata.normcore_onboarding.assessment_context.organizational.preservedOrganizationalFact, "keep-me-too", "Organizational context is preserved");

apiResponse = await assessmentResponsesPost(apiRequest({
  workspaceId,
  theme: "organizational",
  controlId: "a5-8",
  questionId: "p5_8_001",
  answer: "implemented",
}), apiRouteContext);
assert.equal(apiResponse.status, 400, "A.5.8 principal responses remain rejected while context is no");
assert.equal(responseUpserts, 0, "hidden A.5.8 questions do not count or persist while context is no");

userMetadata.normcore_onboarding.assessment_context.organizational.managesProjectsInIsmsScope = "yes";
apiResponse = await assessmentResponsesPost(apiRequest({
  workspaceId,
  theme: "organizational",
  controlId: "a5-8",
  questionId: "p5_8_001",
  answer: "implemented",
}), apiRouteContext);
assert.equal(apiResponse.status, 200, "A.5.8 principal questions reactivate when context returns to yes");
apiBody = await apiResponse.json();
assert.equal(apiBody.organizational.outcome.resolution.controlApplicability, "applicable", "stale control-level N/A is ignored when context is yes");
assert.deepEqual(apiBody.organizational.outcome.resolution.questionIds, ["p5_8_001", "p5_8_002", "p5_8_003"]);
assert.equal(apiBody.organizational.outcome.evaluatedResponseCount, 1);
assert.equal(apiBody.organizational.outcome.gapActions.length, 0);
assert.equal(responseUpserts, 1, "reactivated principal response is persisted normally");

// A.5.19/A.5.20 use the same real API control-level N/A contract and independent justifications.
userMetadata.normcore_onboarding.assessment_context.organizational.usesInScopeSuppliersOrExternalServices = "no";
const supplierControlRequest = (controlId, justification) => apiRequest({
  workspaceId,
  theme: "organizational",
  controlId,
  controlApplicability: "not_applicable",
  controlApplicabilityJustification: justification,
});

for (const [controlId, writtenJustification] of [
  ["a5-19", "No supplier or external service can affect the current ISMS scope; SoA review required."],
  ["a5-20", "No in-scope supplier relationship exists for an information-security agreement; SoA review required."],
]) {
  apiResponse = await assessmentResponsesPost(
    supplierControlRequest(controlId, writtenJustification),
    apiRouteContext,
  );
  assert.equal(apiResponse.status, 200, `${controlId}: API accepts justified control-level N/A`);
  apiBody = await apiResponse.json();
  assert.equal(apiBody.organizational.outcome.resolution.controlApplicability, "not_applicable");
  assert.equal(apiBody.organizational.outcome.resolution.controlReviewState, "applicability_review_required");
  assert.equal(apiBody.organizational.outcome.resolution.assessmentBlocked, false);
  assert.deepEqual(apiBody.organizational.outcome.resolution.questionIds, []);
  assert.equal(apiBody.organizational.outcome.evaluatedResponseCount, 0, `${controlId}: hidden questions do not score`);
  assert.deepEqual(apiBody.organizational.outcome.gapActions, [], `${controlId}: control N/A creates no gap`);
  assert.deepEqual(apiBody.organizational.remediationPlan, [], `${controlId}: control N/A creates no remediation`);
  assert.equal(
    userMetadata.normcore_onboarding.assessment_context.organizational.control_applicability_justifications[controlId],
    writtenJustification,
    `${controlId}: justification persists in existing Organizational context`,
  );
}
assert.equal(responseUpserts, 1, "A.5.19/A.5.20 control N/A creates no fake assessed response");

// Switching applicability back to yes ignores stale control N/A and persisted answers are reused after reload.
userMetadata.normcore_onboarding.assessment_context.organizational.usesInScopeSuppliersOrExternalServices = "yes";
userMetadata.normcore_onboarding.assessment_context.organizational.suppliersAccessOrgInformationOrSystems = "no";
userMetadata.normcore_onboarding.assessment_context.organizational.dependsOnCriticalSuppliers = "no";
userMetadata.normcore_onboarding.assessment_context.organizational.suppliersProcessSensitiveOrPersonalData = "no";

apiResponse = await assessmentResponsesPost(apiRequest({
  workspaceId,
  theme: "organizational",
  controlId: "a5-19",
  questionId: "p5_19_001",
  answer: "partially_implemented",
}), apiRouteContext);
assert.equal(apiResponse.status, 200, "A.5.19 reactivates when supplier applicability returns to yes");
apiBody = await apiResponse.json();
assert.equal(apiBody.organizational.outcome.resolution.controlApplicability, "applicable");
assert.equal(apiBody.organizational.outcome.gapActions[0]?.gapCode, "A5_19_SUPPLIER_RISK_PROCESS_PARTIAL");

apiResponse = await assessmentResponsesPost(apiRequest({
  workspaceId,
  theme: "organizational",
  controlId: "a5-19",
  questionId: "p5_19_002",
  answer: "not_implemented",
}), apiRouteContext);
assert.equal(apiResponse.status, 200);
apiBody = await apiResponse.json();
assert.equal(apiBody.organizational.outcome.evaluatedResponseCount, 2, "A.5.19 persisted first answer is reused after API reload");
assert.deepEqual(
  apiBody.organizational.outcome.gapActions.map((item) => item.gapCode).sort(),
  ["A5_19_SUPPLIER_RISK_APPLICATION_ABSENT", "A5_19_SUPPLIER_RISK_PROCESS_PARTIAL"].sort(),
  "A.5.19 reload outcome retains both gaps/remediations",
);

apiResponse = await assessmentResponsesPost(apiRequest({
  workspaceId,
  theme: "organizational",
  controlId: "a5-20",
  questionId: "p5_20_001",
  answer: "implemented",
}), apiRouteContext);
assert.equal(apiResponse.status, 200, "A.5.20 reactivates and ignores stale N/A when supplier context returns to yes");
apiBody = await apiResponse.json();
assert.equal(apiBody.organizational.outcome.resolution.controlApplicability, "applicable");
assert.equal(apiBody.organizational.outcome.evaluatedResponseCount, 1);

// A.5.21/A.5.22/A.5.23/A.5.30 use the same real API control-level N/A contract.
Object.assign(userMetadata.normcore_onboarding.assessment_context.organizational, {
  usesIctSuppliersInScope: "no",
  usesCloudServicesInScope: "no",
  dependsOnIctForCriticalActivities: "no",
});
for (const [controlId, writtenJustification] of [
  ["a5-21", "No in-scope ICT product or service supplier exists; SoA review required."],
  ["a5-22", "No supplier service affects in-scope information, assets or services; SoA review required."],
  ["a5-23", "No in-scope information, system or service uses cloud/SaaS/PaaS/IaaS; SoA review required."],
  ["a5-30", "No ICT service or resource supports continuity objectives in the ISMS scope; SoA review required."],
]) {
  apiResponse = await assessmentResponsesPost(
    supplierControlRequest(controlId, writtenJustification),
    apiRouteContext,
  );
  assert.equal(apiResponse.status, 200, `${controlId}: API accepts justified control-level N/A`);
  apiBody = await apiResponse.json();
  assert.equal(apiBody.organizational.outcome.resolution.controlApplicability, "not_applicable", `${controlId}: control N/A resolution`);
  assert.equal(apiBody.organizational.outcome.resolution.controlReviewState, "applicability_review_required", `${controlId}: applicability review`);
  assert.deepEqual(apiBody.organizational.outcome.resolution.questionIds, [], `${controlId}: N/A hides all assessed questions`);
  assert.deepEqual(apiBody.organizational.outcome.gapActions, [], `${controlId}: N/A no gaps`);
  assert.deepEqual(apiBody.organizational.remediationPlan, [], `${controlId}: N/A no remediation`);
  assert.equal(
    userMetadata.normcore_onboarding.assessment_context.organizational.control_applicability_justifications[controlId],
    writtenJustification,
    `${controlId}: justification persists in existing Organizational context`,
  );
}

Object.assign(userMetadata.normcore_onboarding.assessment_context.organizational, {
  usesIctSuppliersInScope: "yes",
  hasSupplierSubprocessorsOrFourthParties: "yes",
  hasCriticalIctSuppliers: "yes",
  usesCloudServicesInScope: "yes",
  hasCriticalCloudServices: "yes",
  dependsOnIctForCriticalActivities: "yes",
  hasDefinedRtoRpo: "yes",
});
userMetadata.normcore_onboarding.assessment_context.technological = {
  criticalBackupsConfigured: "yes",
  criticalServicesHaveRedundancy: "yes",
};
apiResponse = await assessmentResponsesPost(apiRequest({
  workspaceId,
  theme: "organizational",
  controlId: "a5-21",
  questionId: "p5_21_004_upstream",
  answer: "implemented",
}), apiRouteContext);
assert.equal(apiResponse.status, 200, "A.5.21 conditionals reactivate when ICT supplier context returns to yes");
apiBody = await apiResponse.json();
assert.equal(apiBody.organizational.outcome.resolution.controlApplicability, "applicable", "A.5.21 stale N/A ignored after yes");
assert.ok(apiBody.organizational.outcome.resolution.questionIds.includes("p5_21_004_upstream"));

apiResponse = await assessmentResponsesPost(apiRequest({
  workspaceId,
  theme: "organizational",
  controlId: "a5-30",
  questionId: "p5_30_004_backup_alignment",
  answer: "implemented",
}), apiRouteContext);
assert.equal(apiResponse.status, 200, "A.5.30 API reuses real Technological backup context");
apiBody = await apiResponse.json();
assert.equal(apiBody.organizational.outcome.resolution.controlApplicability, "applicable", "A.5.30 stale N/A ignored after yes");
assert.ok(apiBody.organizational.outcome.resolution.questionIds.includes("p5_30_004_backup_alignment"));
assert.ok(apiBody.organizational.outcome.resolution.questionIds.includes("p5_30_005_redundancy_alignment"));

// Actual People persistence namespaces are flattened by the API before Organizational resolution.
delete userMetadata.normcore_onboarding.assessment_context.organizational.grantsThirdPartyAccess;
delete userMetadata.normcore_onboarding.assessment_context.organizational.suppliersAccessOrgInformationOrSystems;
userMetadata.normcore_onboarding.assessment_context.awareness_training = {
  has_relevant_external_parties: "yes",
};
apiResponse = await assessmentResponsesPost(apiRequest({
  workspaceId,
  theme: "organizational",
  controlId: "a5-15",
  questionId: "p5_15_004_third_party_access",
  answer: "implemented",
}), apiRouteContext);
assert.equal(apiResponse.status, 200, "API reuses awareness_training.has_relevant_external_parties");
apiBody = await apiResponse.json();
assert.equal(apiBody.organizational.outcome.resolution.requiredQuickContextQuestions.length, 0, "real persisted People context prevents duplicate A.5.15 Quick Context");
assert.ok(apiBody.organizational.outcome.resolution.questionIds.includes("p5_15_004_third_party_access"));

delete userMetadata.normcore_onboarding.assessment_context.awareness_training;
userMetadata.normcore_onboarding.assessment_context.screening = {
  has_external_personnel: "yes",
};
apiResponse = await assessmentResponsesPost(apiRequest({
  workspaceId,
  theme: "organizational",
  controlId: "a5-18",
  questionId: "p5_18_005_third_party_rights",
  answer: "implemented",
}), apiRouteContext);
assert.equal(apiResponse.status, 200, "API reuses screening.has_external_personnel");
apiBody = await apiResponse.json();
assert.equal(apiBody.organizational.outcome.resolution.requiredQuickContextQuestions.some((item) => item.key === "grantsThirdPartyAccess"), false);
assert.ok(apiBody.organizational.outcome.resolution.questionIds.includes("p5_18_005_third_party_rights"));

console.log("All Organizational A.5.1-A.5.30 backend QA checks passed.");
