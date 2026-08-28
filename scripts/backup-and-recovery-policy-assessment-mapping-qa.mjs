import assert from "node:assert/strict";
import { organizationalControls } from "../content/assessment/organizational/organizational-controls.ts";
import { awarenessTrainingQuestions, resolveAwarenessTrainingQuestions } from "../content/assessment/people/awareness-training.ts";
import { eventReportingQuestions, resolveEventReportingQuestions } from "../content/assessment/people/event-reporting.ts";
import { securityOfAssetsOffPremisesQuestions, resolveSecurityOfAssetsOffPremisesQuestions } from "../content/assessment/physical/security-of-assets-off-premises.ts";
import { storageMediaQuestions, resolveStorageMediaQuestions } from "../content/assessment/physical/storage-media.ts";
import { technologicalControls } from "../content/assessment/technological/technological-controls.generated.ts";
import { resolveOrganizationalControl } from "../lib/assessment/organizational-controls.ts";
import { resolveTechnologicalAssessmentContext, resolveTechnologicalControl } from "../lib/assessment/technological-controls.ts";
import {
  BACKUP_AND_RECOVERY_POLICY_ASSESSMENT_MAPPING,
  BACKUP_AND_RECOVERY_POLICY_ASSESSMENT_MAPPING_VERSION,
  BACKUP_AND_RECOVERY_POLICY_SECTION_COVERAGE,
} from "../lib/ai-documents/backup-and-recovery-policy-assessment-mapping.ts";

const expectedConditions = new Map([
  ["p5_19_005_critical_supplier", "dependsOnCriticalSuppliers"], ["p5_20_006_critical_supplier_clauses", "dependsOnCriticalSuppliers"], ["p5_22_005_provider_incident", "hasExperiencedSupplierSecurityIncident"], ["p5_23_004_critical_exit", "hasCriticalCloudServices"], ["p5_23_005_sensitive_data", "cloudProcessesSensitiveOrRegulatedData"], ["p5_29_004_emergency_access", "usesEmergencyOrBreakGlassAccess"], ["p5_29_005_alternate_operations", "usesAlternateSitesOrManualFallback"], ["p5_30_004_backup_alignment", "hasBackupsForCriticalSystems"], ["p5_30_005_redundancy_alignment", "hasRedundancyForCriticalServices"], ["p5_30_006_cloud_supplier_continuity", "hasCriticalCloudServices"], ["o5_31_004_contractual", "hasMaterialSecurityContractualObligations"], ["o5_33_004_longterm", "hasLongTermOrRegulatedRecords"], ["o5_37_004_critical_runbooks", "hasCriticalInfrequentOrHighRiskOperations"], ["p6_3_004_role_based", "hasRolesRequiringSpecializedTraining"], ["p6_8_004_external", "hasRelevantExternalParties"], ["p7_10_004_removable_media", "usesRemovableOrPortableStorageMedia"], ["p8_13_004_cloud", "usesCloudHostedCriticalDataOrSystems"], ["p8_13_005_personal_data", "backupsContainPersonalOrRegulatedData"], ["p8_15_004_external_platforms", "usesExternallyHostedCriticalSystems"],
]);
const runtime = {
  organizational: organizationalControls,
  people: [{ id: "a6-3", questions: awarenessTrainingQuestions }, { id: "a6-8", questions: eventReportingQuestions }],
  physical: [{ id: "a7-9", questions: securityOfAssetsOffPremisesQuestions }, { id: "a7-10", questions: storageMediaQuestions }],
  technological: technologicalControls,
};
const mapping = BACKUP_AND_RECOVERY_POLICY_ASSESSMENT_MAPPING;
assert.equal(BACKUP_AND_RECOVERY_POLICY_ASSESSMENT_MAPPING_VERSION, "1.0.0");
assert.equal(mapping.length, 85);
assert.equal(mapping.filter((item) => item.theme === "organizational").length, 58);
assert.equal(mapping.filter((item) => item.theme === "people").length, 5);
assert.equal(mapping.filter((item) => item.theme === "physical").length, 7);
assert.equal(mapping.filter((item) => item.theme === "technological").length, 15);
assert.equal(mapping.filter((item) => item.relevance === "DIRECTLY_RELEVANT").length, 40);
assert.equal(mapping.filter((item) => item.relevance === "CONTEXTUALLY_RELEVANT").length, 45);
assert.equal(new Set(mapping.map((item) => item.questionId)).size, 85);
for (const item of mapping) {
  const control = runtime[item.theme].find((candidate) => candidate.id === item.controlId);
  assert.ok(control, `Missing runtime control: ${item.theme}/${item.controlId}`);
  const question = control.questions.find((candidate) => candidate.id === item.questionId);
  assert.ok(question, `Missing runtime question: ${item.questionId}`);
  assert.equal(item.questionType, question.type, `Question type mismatch: ${item.questionId}`);
  assert.equal(item.conditionKey ?? null, question.conditionKey ?? null, `Condition key mismatch: ${item.questionId}`);
  assert.equal(item.excludeWhenHidden, Boolean(question.conditionKey), `Visibility contract mismatch: ${item.questionId}`);
}
const conditional = mapping.filter((item) => item.conditionKey);
assert.equal(conditional.length, 19);
assert.deepEqual(new Map(conditional.map((item) => [item.questionId, item.conditionKey])), expectedConditions);
assert.equal(conditional.every((item) => item.excludeWhenHidden), true);
const removable = mapping.filter((item) => item.questionId === "p7_10_004_removable_media");
assert.equal(removable.length, 1);
assert.deepEqual(removable[0].policySections, ["backup_storage_separation_and_protection", "records_exceptions_and_evidence"]);
assert.equal(Object.keys(BACKUP_AND_RECOVERY_POLICY_SECTION_COVERAGE).length, 17);
assert.equal(BACKUP_AND_RECOVERY_POLICY_SECTION_COVERAGE.document_control, "STATIC_OR_OTHER_SOURCE");
assert.equal(BACKUP_AND_RECOVERY_POLICY_SECTION_COVERAGE.purpose, "NO_ASSESSMENT_FACT_REQUIRED");
assert.equal(BACKUP_AND_RECOVERY_POLICY_SECTION_COVERAGE.policy_review_and_approval, "STATIC_OR_OTHER_SOURCE");
for (const item of conditional) {
  const yes = { [item.conditionKey]: "yes" };
  const no = { [item.conditionKey]: "no" };
  const visible = item.theme === "organizational" ? resolveOrganizationalControl(item.controlId, yes).questionIds
    : item.theme === "people" ? (item.controlId === "a6-3" ? resolveAwarenessTrainingQuestions(yes).questionIds : resolveEventReportingQuestions(yes).questionIds)
      : item.theme === "physical" ? resolveStorageMediaQuestions(yes).questionIds
        : resolveTechnologicalControl(item.controlId, resolveTechnologicalAssessmentContext(yes)).questionIds;
  const hidden = item.theme === "organizational" ? resolveOrganizationalControl(item.controlId, no).questionIds
    : item.theme === "people" ? (item.controlId === "a6-3" ? resolveAwarenessTrainingQuestions(no).questionIds : resolveEventReportingQuestions(no).questionIds)
      : item.theme === "physical" ? resolveStorageMediaQuestions(no).questionIds
        : resolveTechnologicalControl(item.controlId, resolveTechnologicalAssessmentContext(no)).questionIds;
  assert.equal(visible.includes(item.questionId), true, `Conditional not visible for yes: ${item.questionId}`);
  assert.equal(hidden.includes(item.questionId), false, `Conditional visible for no: ${item.questionId}`);
}
assert.equal(resolveSecurityOfAssetsOffPremisesQuestions({ usesAssetsOffPremises: "yes" }).questionIds.includes("p7_9_001"), true);
console.log("BACKUP AND RECOVERY POLICY MAPPING QA: PASS");
