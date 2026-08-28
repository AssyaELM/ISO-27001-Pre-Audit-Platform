import { organizationalControls } from "../../content/assessment/organizational/organizational-controls.ts";
import { awarenessTrainingQuestions } from "../../content/assessment/people/awareness-training.ts";
import { eventReportingQuestions } from "../../content/assessment/people/event-reporting.ts";
import { securityOfAssetsOffPremisesQuestions } from "../../content/assessment/physical/security-of-assets-off-premises.ts";
import { storageMediaQuestions } from "../../content/assessment/physical/storage-media.ts";
import { technologicalControls } from "../../content/assessment/technological/technological-controls.generated.ts";

export const BACKUP_AND_RECOVERY_POLICY_ASSESSMENT_MAPPING_VERSION = "1.0.0";
export type BackupAndRecoveryPolicyTheme = "organizational" | "people" | "physical" | "technological";
export type BackupAndRecoveryPolicyRelevance = "DIRECTLY_RELEVANT" | "CONTEXTUALLY_RELEVANT";
export type BackupAndRecoveryPolicyAssessmentMappingEntry = {
  theme: BackupAndRecoveryPolicyTheme;
  controlId: string;
  questionId: string;
  questionType: string;
  relevance: BackupAndRecoveryPolicyRelevance;
  policySections: readonly string[];
  conditionKey?: string;
  excludeWhenHidden: boolean;
};
type RuntimeQuestion = { id: string; type: string; conditionKey?: string | null };

const makeEntry = (theme: BackupAndRecoveryPolicyTheme, controlId: string, question: RuntimeQuestion, relevance: BackupAndRecoveryPolicyRelevance, policySections: readonly string[]): BackupAndRecoveryPolicyAssessmentMappingEntry => ({
  theme, controlId, questionId: question.id, questionType: question.type, relevance, policySections,
  ...(question.conditionKey ? { conditionKey: question.conditionKey } : {}), excludeWhenHidden: Boolean(question.conditionKey),
});
const select = (questions: readonly RuntimeQuestion[], ids?: readonly string[]) => questions.filter((question) => !ids || ids.includes(question.id));
const organizational = (controlId: string, relevance: BackupAndRecoveryPolicyRelevance, policySections: readonly string[], ids?: readonly string[]) => {
  const control = organizationalControls.find((item) => item.id === controlId); if (!control) throw new Error(`Missing organizational control ${controlId}`);
  return select(control.questions, ids).map((question) => makeEntry("organizational", controlId, question, relevance, policySections));
};
const peopleCatalog = { "a6-3": awarenessTrainingQuestions, "a6-8": eventReportingQuestions } as const;
const people = (controlId: keyof typeof peopleCatalog, relevance: BackupAndRecoveryPolicyRelevance, policySections: readonly string[], ids?: readonly string[]) => select(peopleCatalog[controlId], ids).map((question) => makeEntry("people", controlId, question, relevance, policySections));
const physicalCatalog = { "a7-9": securityOfAssetsOffPremisesQuestions, "a7-10": storageMediaQuestions } as const;
const physical = (controlId: keyof typeof physicalCatalog, relevance: BackupAndRecoveryPolicyRelevance, policySections: readonly string[], ids?: readonly string[]) => select(physicalCatalog[controlId], ids).map((question) => makeEntry("physical", controlId, question, relevance, policySections));
const technological = (controlId: string, relevance: BackupAndRecoveryPolicyRelevance, policySections: readonly string[], ids?: readonly string[]) => {
  const control = technologicalControls.find((item) => item.id === controlId); if (!control) throw new Error(`Missing technological control ${controlId}`);
  return select(control.questions, ids).map((question) => makeEntry("technological", controlId, question, relevance, policySections));
};

export const BACKUP_AND_RECOVERY_POLICY_ASSESSMENT_MAPPING: readonly BackupAndRecoveryPolicyAssessmentMappingEntry[] = [
  ...organizational("a5-2", "DIRECTLY_RELEVANT", ["roles_and_responsibilities"]),
  ...organizational("a5-9", "DIRECTLY_RELEVANT", ["scope", "backup_scope_and_criticality"], ["p5_9_001", "p5_9_002", "p5_9_003"]),
  ...organizational("a5-12", "DIRECTLY_RELEVANT", ["backup_scope_and_criticality", "backup_storage_separation_and_protection"], ["p5_12_001", "p5_12_002", "p5_12_003"]),
  ...organizational("a5-15", "DIRECTLY_RELEVANT", ["access_control_and_encryption"], ["p5_15_001", "p5_15_002", "p5_15_003"]),
  ...organizational("a5-19", "CONTEXTUALLY_RELEVANT", ["backup_scope_and_criticality"], ["p5_19_001", "p5_19_002", "p5_19_003", "p5_19_005_critical_supplier"]),
  ...organizational("a5-20", "CONTEXTUALLY_RELEVANT", ["backup_requirements_and_strategy", "records_exceptions_and_evidence"], ["p5_20_001", "p5_20_002", "p5_20_003", "p5_20_006_critical_supplier_clauses"]),
  ...organizational("a5-22", "CONTEXTUALLY_RELEVANT", ["backup_monitoring_and_failure_handling"], ["p5_22_001", "p5_22_002", "p5_22_003", "p5_22_005_provider_incident"]),
  ...organizational("a5-23", "CONTEXTUALLY_RELEVANT", ["scope", "backup_storage_separation_and_protection", "recovery_requirements_and_objectives"], ["p5_23_001", "p5_23_002", "p5_23_003", "p5_23_004_critical_exit", "p5_23_005_sensitive_data"]),
  ...organizational("a5-26", "CONTEXTUALLY_RELEVANT", ["restoration_and_recovery_process", "recovery_testing_and_validation"], ["p5_26_001", "p5_26_002", "p5_26_003"]),
  ...organizational("a5-29", "DIRECTLY_RELEVANT", ["recovery_requirements_and_objectives", "restoration_and_recovery_process", "recovery_testing_and_validation"], ["p5_29_001", "p5_29_002", "p5_29_003", "p5_29_004_emergency_access", "p5_29_005_alternate_operations"]),
  ...organizational("a5-30", "DIRECTLY_RELEVANT", ["backup_scope_and_criticality", "backup_requirements_and_strategy", "backup_schedule_and_retention", "backup_storage_separation_and_protection", "recovery_requirements_and_objectives", "restoration_and_recovery_process", "recovery_testing_and_validation"], ["p5_30_001", "p5_30_002", "p5_30_003", "p5_30_004_backup_alignment", "p5_30_005_redundancy_alignment", "p5_30_006_cloud_supplier_continuity"]),
  ...organizational("a5-31", "CONTEXTUALLY_RELEVANT", ["backup_schedule_and_retention", "records_exceptions_and_evidence"], ["o5_31_001", "o5_31_002", "o5_31_003", "o5_31_004_contractual"]),
  ...organizational("a5-33", "DIRECTLY_RELEVANT", ["backup_schedule_and_retention", "backup_storage_separation_and_protection", "records_exceptions_and_evidence"], ["o5_33_001", "o5_33_002", "o5_33_003", "o5_33_004_longterm"]),
  ...organizational("a5-36", "CONTEXTUALLY_RELEVANT", ["records_exceptions_and_evidence"], ["o5_36_001", "o5_36_003"]),
  ...organizational("a5-36", "DIRECTLY_RELEVANT", ["records_exceptions_and_evidence"], ["o5_36_002"]),
  ...organizational("a5-37", "DIRECTLY_RELEVANT", ["restoration_and_recovery_process", "records_exceptions_and_evidence"], ["o5_37_001", "o5_37_002", "o5_37_003"]),
  ...organizational("a5-37", "CONTEXTUALLY_RELEVANT", ["restoration_and_recovery_process", "recovery_testing_and_validation"], ["o5_37_004_critical_runbooks"]),

  ...people("a6-3", "CONTEXTUALLY_RELEVANT", ["roles_and_responsibilities", "recovery_testing_and_validation"], ["p6_3_004_role_based"]),
  ...people("a6-8", "CONTEXTUALLY_RELEVANT", ["backup_monitoring_and_failure_handling", "records_exceptions_and_evidence"]),

  ...physical("a7-9", "CONTEXTUALLY_RELEVANT", ["backup_storage_separation_and_protection", "records_exceptions_and_evidence"], ["p7_9_001", "p7_9_002", "p7_9_003"]),
  ...physical("a7-10", "DIRECTLY_RELEVANT", ["backup_storage_separation_and_protection"], ["p7_10_001", "p7_10_002"]),
  ...physical("a7-10", "DIRECTLY_RELEVANT", ["records_exceptions_and_evidence"], ["p7_10_003"]),
  ...physical("a7-10", "DIRECTLY_RELEVANT", ["backup_storage_separation_and_protection", "records_exceptions_and_evidence"], ["p7_10_004_removable_media"]),

  ...technological("a8-13", "DIRECTLY_RELEVANT", ["scope", "roles_and_responsibilities", "backup_requirements_and_strategy", "backup_schedule_and_retention", "backup_storage_separation_and_protection", "backup_monitoring_and_failure_handling", "access_control_and_encryption", "recovery_testing_and_validation"]),
  ...technological("a8-15", "CONTEXTUALLY_RELEVANT", ["records_exceptions_and_evidence"]),
  ...technological("a8-16", "CONTEXTUALLY_RELEVANT", ["backup_monitoring_and_failure_handling", "records_exceptions_and_evidence"], ["p8_16_001", "p8_16_002", "p8_16_003"]),
  ...technological("a8-24", "CONTEXTUALLY_RELEVANT", ["access_control_and_encryption", "records_exceptions_and_evidence"], ["p8_24_001", "p8_24_002", "p8_24_003"]),
];

export const BACKUP_AND_RECOVERY_POLICY_SECTION_COVERAGE = {
  document_control: "STATIC_OR_OTHER_SOURCE", purpose: "NO_ASSESSMENT_FACT_REQUIRED", scope: "ASSESSMENT_SUPPORTED", terms_and_definitions: "NO_ASSESSMENT_FACT_REQUIRED", backup_and_recovery_principles: "NO_ASSESSMENT_FACT_REQUIRED", roles_and_responsibilities: "ASSESSMENT_SUPPORTED", backup_scope_and_criticality: "ASSESSMENT_SUPPORTED", backup_requirements_and_strategy: "ASSESSMENT_SUPPORTED", backup_schedule_and_retention: "ASSESSMENT_SUPPORTED", backup_storage_separation_and_protection: "ASSESSMENT_SUPPORTED", access_control_and_encryption: "ASSESSMENT_SUPPORTED", backup_monitoring_and_failure_handling: "ASSESSMENT_SUPPORTED", recovery_requirements_and_objectives: "ASSESSMENT_SUPPORTED", restoration_and_recovery_process: "ASSESSMENT_SUPPORTED", recovery_testing_and_validation: "ASSESSMENT_SUPPORTED", records_exceptions_and_evidence: "ASSESSMENT_SUPPORTED", policy_review_and_approval: "STATIC_OR_OTHER_SOURCE",
} as const;
