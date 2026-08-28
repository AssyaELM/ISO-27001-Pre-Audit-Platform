import assert from "node:assert/strict";
import { organizationalControls } from "../content/assessment/organizational/organizational-controls.ts";
import { awarenessTrainingQuestions } from "../content/assessment/people/awareness-training.ts";
import { disciplinaryProcessQuestions } from "../content/assessment/people/disciplinary-process.ts";
import { eventReportingQuestions } from "../content/assessment/people/event-reporting.ts";
import { technologicalControls } from "../content/assessment/technological/technological-controls.generated.ts";
import {
  INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING,
  INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING_VERSION,
} from "../lib/ai-documents/incident-management-procedure-assessment-mapping.ts";

const expectedConditionalKeys = new Map([
  ["p5_5_004_deadlines", "hasMandatoryAuthorityNotificationObligations"],
  ["p5_6_004_sharing", "sharesSecurityInformationWithExternalGroups"],
  ["p5_7_004_provider", "usesExternalThreatIntelligenceProvider"],
  ["p5_19_005_critical_supplier", "dependsOnCriticalSuppliers"],
  ["p5_20_004_sensitive_data_clauses", "suppliersProcessSensitiveOrPersonalData"],
  ["p5_20_006_critical_supplier_clauses", "dependsOnCriticalSuppliers"],
  ["p5_22_005_provider_incident", "hasExperiencedSupplierSecurityIncident"],
  ["p5_23_005_sensitive_data", "cloudProcessesSensitiveOrRegulatedData"],
  ["p5_24_004_external_ir", "usesExternalIncidentResponseProvider"],
  ["p5_25_004_high_volume", "usesAutomatedSecurityMonitoring"],
  ["p5_26_004_real_incident", "hasExperiencedSecurityIncidents"],
  ["p5_27_004_incident_sample", "hasExperiencedSecurityIncidents"],
  ["p5_28_004_external_forensics", "usesExternalIncidentResponseProvider"],
  ["p5_28_005_cloud_evidence", "usesCloudServicesInScope"],
  ["p5_29_004_emergency_access", "usesEmergencyOrBreakGlassAccess"],
  ["p5_29_005_alternate_operations", "usesAlternateSitesOrManualFallback"],
  ["o5_31_004_contractual", "hasMaterialSecurityContractualObligations"],
  ["p6_3_004_role_based", "hasRolesRequiringSpecializedTraining"],
  ["p6_3_005_external", "hasRelevantExternalParties"],
  ["p6_8_004_external", "hasRelevantExternalParties"],
  ["p8_13_004_cloud", "usesCloudHostedCriticalDataOrSystems"],
  ["p8_15_004_external_platforms", "usesExternallyHostedCriticalSystems"],
  ["p8_16_004_managed_monitoring", "usesManagedSecurityMonitoring"],
  ["p8_16_005_legacy", "hasLegacySystemsWithMonitoringLimitations"],
  ["p8_17_004_legacy", "hasSystemsWithoutStandardTimeSync"],
]);

const runtimeByTheme = {
  organizational: organizationalControls,
  people: [
    { id: "a6-3", questions: awarenessTrainingQuestions },
    { id: "a6-4", questions: disciplinaryProcessQuestions },
    { id: "a6-8", questions: eventReportingQuestions },
  ],
  technological: technologicalControls,
};

assert.equal(INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING_VERSION, "1.0.0");
assert.equal(INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING.length, 82);
assert.equal(INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING.filter((entry) => entry.theme === "organizational").length, 57);
assert.equal(INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING.filter((entry) => entry.theme === "people").length, 11);
assert.equal(INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING.filter((entry) => entry.theme === "technological").length, 14);
assert.equal(INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING.filter((entry) => entry.relevance === "DIRECTLY_RELEVANT").length, 41);
assert.equal(INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING.filter((entry) => entry.relevance === "CONTEXTUALLY_RELEVANT").length, 41);
assert.equal(new Set(INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING.map((entry) => entry.questionId)).size, 82);
assert.equal(INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING.some((entry) => entry.theme === "physical"), false);
assert.deepEqual(
  new Set(INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING.map((entry) => entry.controlId)),
  new Set(["a5-2", "a5-5", "a5-6", "a5-7", "a5-19", "a5-20", "a5-22", "a5-23", "a5-24", "a5-25", "a5-26", "a5-27", "a5-28", "a5-29", "a5-30", "a5-31", "a5-33", "a6-3", "a6-4", "a6-8", "a8-13", "a8-15", "a8-16", "a8-17"]),
);

for (const mapping of INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING) {
  const control = runtimeByTheme[mapping.theme].find((candidate) => candidate.id === mapping.controlId);
  assert.ok(control, `Missing runtime control: ${mapping.theme}/${mapping.controlId}`);
  const question = control.questions.find((candidate) => candidate.id === mapping.questionId);
  assert.ok(question, `Missing runtime question: ${mapping.questionId}`);
  assert.equal(mapping.questionType, question.type, `Question type mismatch: ${mapping.questionId}`);
  assert.equal(mapping.conditionKey ?? null, question.conditionKey ?? null, `Condition key mismatch: ${mapping.questionId}`);
  assert.equal(mapping.excludeWhenHidden, Boolean(question.conditionKey), `Hidden-answer rule mismatch: ${mapping.questionId}`);
}

const conditionalEntries = INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING.filter((entry) => entry.conditionKey);
assert.equal(conditionalEntries.length, 25);
assert.deepEqual(new Map(conditionalEntries.map((entry) => [entry.questionId, entry.conditionKey])), expectedConditionalKeys);
assert.equal(conditionalEntries.every((entry) => entry.excludeWhenHidden), true);

console.log("INCIDENT MANAGEMENT PROCEDURE MAPPING QA: PASS");
