import { AI_DOCUMENT_LABELS, type AiDocumentRegistryEntry } from "./registry.ts";
import type { DocumentSectionSpec, DocumentTemplateSpec, InputDefinition, TemplateSource } from "./information-security-policy.ts";

export const BACKUP_AND_RECOVERY_POLICY_DOCUMENT_TYPE = "backup_and_recovery_policy" as const;
export const BACKUP_AND_RECOVERY_POLICY_TEMPLATE_VERSION = "1.0.0";

const section = (
  id: string,
  order: number,
  label: string,
  generationMode: DocumentSectionSpec["generationMode"],
  sources: TemplateSource[],
  requiredInputs: string[] = [],
  optionalInputs: string[] = [],
  allowOmission = false,
  structure?: DocumentSectionSpec["structure"],
): DocumentSectionSpec => ({ id, order, label, generationMode, sources, requiredInputs, optionalInputs, allowOmission, structure });

const required = (id: string, label: string, sources: TemplateSource[]): InputDefinition => ({ id, label, sources, required: true, neverInvent: true });
const optional = (id: string, label: string, sources: TemplateSource[]): InputDefinition => ({ id, label, sources, required: false, neverInvent: true });

export const BACKUP_AND_RECOVERY_POLICY_WORKFLOW = [
  "identify_scope_criticality",
  "define_backup_requirements",
  "schedule_create_backup",
  "store_protect_backup",
  "monitor_execution",
  "handle_failures",
  "initiate_recovery",
  "restore",
  "validate_integrity_usability",
  "record_evidence",
  "review_improve",
] as const;

export const BACKUP_AND_RECOVERY_TERMS = {
  backup: "A retained copy of information or a system state that may be used for restoration.",
  restore: "The controlled retrieval of backed-up information or a system state.",
  recovery: "The coordinated return of information or services to an acceptable operating condition.",
  recovery_point_objective: "The maximum data-loss point that the organization has explicitly accepted for a recovery need.",
  recovery_time_objective: "The recovery timeframe that the organization has explicitly established for a recovery need.",
  retention: "The period for which a backup copy is kept before approved disposal or replacement.",
  backup_copy: "A specific protected instance created by a backup activity.",
  restore_test: "A documented exercise that verifies whether a selected backup can be restored and used as intended.",
} as const;

export const BACKUP_AND_RECOVERY_PRINCIPLES = [
  "risk_based_scope", "recoverability", "integrity", "confidentiality", "availability",
  "appropriate_separation", "least_privilege_access", "monitoring", "testing", "traceability", "continual_improvement",
] as const;

export const BACKUP_AND_RECOVERY_POLICY_BUSINESS_RULES = {
  documentControlFields: ["organization_name", "document_id", "document_owner", "version", "classification", "status", "effective_date", "review_date", "prepared_by", "reviewed_by", "approved_by", "approval_date", "revision_history"],
  purpose: ["reduce_information_loss_or_corruption_risk", "maintain_availability", "restore_according_to_business_needs", "verify_recoverability"],
  possibleScopeCategories: ["information", "data", "systems", "applications", "databases", "configurations", "software", "cloud_saas_data", "endpoints", "third_party_hosted_data"],
  genericRoles: ["Management", "Policy Owner", "System/Data Owners", "Backup/Recovery personnel", "IT/technical personnel", "Users", "Suppliers/third parties if applicable"],
  backupScopeAndCriticality: ["assets_data_in_scope", "criticality", "business_impact", "information_classification_when_known", "backup_necessity", "exclusions_with_justification"],
  strategyCapabilities: ["backup_type_method", "backup_coverage", "strategy", "dependencies", "automation_when_known", "full_incremental_differential_when_used"],
  scheduleCapabilities: ["frequency_cadence", "schedule", "retention", "criticality_rpo_relationship", "exceptions"],
  storageCapabilities: ["storage_location", "production_separation", "offsite_remote_copy_when_applicable", "media_storage_types", "physical_logical_protection", "transfer_protection", "common_failure_resilience"],
  accessAndEncryptionCapabilities: ["restricted_access", "authorization", "least_privilege", "encryption_at_rest_when_applicable", "encryption_in_transit_when_applicable", "key_management_separation_when_known"],
  monitoringCapabilities: ["job_monitoring", "success_failure_status", "alerts_notifications_when_known", "failure_investigation", "retry_corrective_handling", "escalation", "records_logs"],
  recoveryCapabilities: ["rpo", "rto", "recovery_priorities", "business_needs", "criticality_risk_relationship", "dependencies"],
  restorationCapabilities: ["recovery_trigger", "suitable_backup_selection", "authorization", "restore_execution", "integrity_completeness_validation", "return_to_service", "outcome_recording"],
  testingCapabilities: ["restore_testing", "file_level_test_when_applicable", "system_level_test_when_applicable", "integrity_validation", "successful_failed_outcome", "elapsed_recovery_time_when_measured", "corrective_action", "test_evidence"],
  recordTypes: ["backup_logs", "failure_records", "restore_test_records", "recovery_records", "access_records", "exceptions", "approvals", "version_history"],
  reviewTriggers: ["planned_review", "significant_changes", "backup_failure", "recovery_incident", "versioning", "approval", "revision_history"],
  distinctions: ["backup_success_log_is_not_restore_test_evidence", "backup_execution_does_not_prove_recoverability"],
} as const;

export const BACKUP_AND_RECOVERY_POLICY_CONDITIONAL_INPUTS = [
  { id: "offsite_or_separate_storage", condition: "separation_strategy_applicable" },
  { id: "encryption_requirements", condition: "encryption_requirements_explicitly_defined" },
  { id: "rpo_value", condition: "rpo_defined" },
  { id: "rto_value", condition: "rto_defined" },
  { id: "exception_approver", condition: "backup_exception_requires_approval" },
] as const;

export const BACKUP_AND_RECOVERY_POLICY_INPUT_CLASSIFICATION = {
  organization_name: { classification: "required", omissible: false },
  document_id: { classification: "optional", omissible: true }, document_owner: { classification: "optional", omissible: true }, version: { classification: "optional", omissible: true }, classification: { classification: "optional", omissible: true }, status: { classification: "optional", omissible: true }, effective_date: { classification: "optional", omissible: true }, review_date: { classification: "optional", omissible: true }, prepared_by: { classification: "optional", omissible: true }, reviewed_by: { classification: "optional", omissible: true }, approved_by: { classification: "optional", omissible: true }, approval_date: { classification: "optional", omissible: true }, revision_history: { classification: "optional", omissible: true },
  backup_scope: { classification: "optional", omissible: true }, critical_assets_or_data: { classification: "optional", omissible: true }, backup_owner: { classification: "optional", omissible: true }, backup_roles: { classification: "optional", omissible: true }, backup_strategy: { classification: "optional", omissible: true }, backup_type: { classification: "optional", omissible: true }, backup_frequency: { classification: "optional", omissible: true }, retention_requirements: { classification: "optional", omissible: true }, storage_requirements: { classification: "optional", omissible: true }, access_requirements: { classification: "optional", omissible: true }, monitoring_requirements: { classification: "optional", omissible: true }, failure_escalation: { classification: "optional", omissible: true }, restore_process: { classification: "optional", omissible: true }, recovery_test_approach: { classification: "optional", omissible: true },
  offsite_or_separate_storage: { classification: "conditional", omissible: true }, encryption_requirements: { classification: "conditional", omissible: true }, rpo_value: { classification: "conditional", omissible: true }, rto_value: { classification: "conditional", omissible: true }, recovery_test_frequency: { classification: "conditional", omissible: true }, exception_approver: { classification: "conditional", omissible: true }, exception_reason: { classification: "conditional", omissible: true }, exception_affected_scope: { classification: "conditional", omissible: true }, exception_risk: { classification: "conditional", omissible: true }, compensating_control: { classification: "conditional", omissible: true }, exception_expiry_or_review_date: { classification: "conditional", omissible: true },
} as const;

export const BACKUP_AND_RECOVERY_POLICY_SPEC: DocumentTemplateSpec<typeof BACKUP_AND_RECOVERY_POLICY_DOCUMENT_TYPE> = {
  documentType: BACKUP_AND_RECOVERY_POLICY_DOCUMENT_TYPE,
  label: AI_DOCUMENT_LABELS.backup_and_recovery_policy,
  version: BACKUP_AND_RECOVERY_POLICY_TEMPLATE_VERSION,
  sourcePriority: ["workspace", "assessment", "evidence", "ai_documents_registry", "document_setup", "derived", "static_template"],
  requiredInputs: [required("organization_name", "Organization name", ["workspace"])],
  optionalInputs: [
    optional("document_id", "Document ID", ["ai_documents_registry", "document_setup"]), optional("document_owner", "Document owner", ["workspace", "evidence", "ai_documents_registry", "document_setup"]), optional("version", "Version", ["ai_documents_registry", "document_setup"]), optional("classification", "Document classification", ["evidence", "ai_documents_registry", "document_setup"]), optional("status", "Document status", ["ai_documents_registry", "document_setup"]), optional("effective_date", "Effective date", ["evidence", "ai_documents_registry", "document_setup"]), optional("review_date", "Review date", ["evidence", "ai_documents_registry", "document_setup"]), optional("prepared_by", "Prepared by", ["document_setup"]), optional("reviewed_by", "Reviewed by", ["document_setup"]), optional("approved_by", "Approver", ["document_setup"]), optional("approval_date", "Approval date", ["document_setup"]), optional("revision_history", "Revision history", ["ai_documents_registry", "document_setup"]),
    optional("backup_scope", "Backup scope", ["assessment", "document_setup"]), optional("backup_owner", "Backup owner", ["workspace", "document_setup"]), optional("backup_roles", "Backup roles", ["assessment", "document_setup"]), optional("critical_assets_or_data", "Critical assets or data", ["assessment", "document_setup"]), optional("backup_strategy", "Backup strategy", ["assessment", "document_setup"]), optional("backup_type", "Backup type", ["assessment", "document_setup"]), optional("backup_frequency", "Backup frequency", ["assessment", "document_setup"]), optional("retention_requirements", "Retention requirements", ["assessment", "document_setup"]), optional("storage_requirements", "Storage requirements", ["assessment", "document_setup"]), optional("offsite_or_separate_storage", "Offsite or separate storage", ["assessment", "document_setup"]), optional("access_requirements", "Access requirements", ["assessment", "document_setup"]), optional("encryption_requirements", "Encryption requirements", ["assessment", "document_setup"]), optional("monitoring_requirements", "Monitoring requirements", ["assessment", "document_setup"]), optional("failure_escalation", "Failure escalation", ["assessment", "document_setup"]),
    optional("rpo_defined", "RPO defined", ["assessment", "document_setup"]), optional("rpo_value", "RPO value", ["assessment", "document_setup"]), optional("rto_defined", "RTO defined", ["assessment", "document_setup"]), optional("rto_value", "RTO value", ["assessment", "document_setup"]), optional("restore_process", "Restore process", ["assessment", "document_setup"]), optional("recovery_test_approach", "Recovery test approach", ["assessment", "document_setup"]), optional("recovery_test_frequency", "Recovery test frequency", ["assessment", "document_setup"]), optional("exception_reason", "Exception reason", ["document_setup"]), optional("exception_affected_scope", "Exception affected scope", ["document_setup"]), optional("exception_risk", "Exception risk", ["document_setup"]), optional("compensating_control", "Compensating control", ["document_setup"]), optional("exception_approver", "Exception approver", ["document_setup"]), optional("exception_expiry_or_review_date", "Exception expiry or review date", ["document_setup"]),
  ],
  forbiddenInferences: ["DevOps Lead", "Backup Administrator", "named persons", "backup software/vendor", "cloud provider", "tape", "NAS", "disk", "storage location", "3-2-1", "GFS", "full/incremental/differential", "immutable/offline backup", "specific AES sizes", "specific TLS versions", "specific RPO values", "specific RTO values", "SIEM", "monitoring tool", "alert deadline", "backup platform", "alternate site name", "bare-metal restore", "VM restore", "checksum algorithm"],
  validationRules: ["exact document type", "exact 17-section order", "unique section ids and orders", "canonical backup and recovery workflow"],
  sections: [
    section("document_control", 1, "Document Control", "deterministic", ["workspace", "evidence", "ai_documents_registry", "document_setup"], ["organization_name"], ["document_id", "document_owner", "version", "classification", "status", "effective_date", "review_date", "prepared_by", "reviewed_by", "approved_by", "approval_date", "revision_history"], false, { requiredBlocks: ["table"], minTableRows: 4 }),
    section("purpose", 2, "Purpose", "ai_later", ["workspace", "document_setup"], ["organization_name"], [], false, { requiredBlocks: ["paragraph"] }),
    section("scope", 3, "Scope", "ai_later", ["workspace", "document_setup"], ["organization_name"], ["backup_scope"], true, { requiredBlocks: ["paragraph"] }),
    section("terms_and_definitions", 4, "Terms and Definitions", "static", ["static_template"]),
    section("backup_and_recovery_principles", 5, "Backup and Recovery Principles", "static", ["static_template"]),
    section("roles_and_responsibilities", 6, "Roles and Responsibilities", "ai_later", ["workspace", "document_setup"], [], ["backup_owner", "backup_roles"], true, { requiredBlocks: ["table"], minTableRows: 2 }),
    section("backup_scope_and_criticality", 7, "Backup Scope and Criticality", "ai_later", ["assessment", "document_setup"], [], ["backup_scope", "critical_assets_or_data"], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("backup_requirements_and_strategy", 8, "Backup Requirements and Strategy", "ai_later", ["assessment", "document_setup"], [], ["backup_strategy", "backup_type"], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("backup_schedule_and_retention", 9, "Backup Schedule and Retention", "ai_later", ["assessment", "document_setup"], [], ["backup_frequency", "retention_requirements"], true, { requiredBlocks: ["paragraph", "table"], minBlocks: 2 }),
    section("backup_storage_separation_and_protection", 10, "Backup Storage, Separation and Protection", "ai_later", ["assessment", "document_setup"], [], ["storage_requirements", "offsite_or_separate_storage"], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("access_control_and_encryption", 11, "Access Control and Encryption", "ai_later", ["assessment", "document_setup"], [], ["access_requirements", "encryption_requirements"], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("backup_monitoring_and_failure_handling", 12, "Backup Monitoring and Failure Handling", "ai_later", ["assessment", "document_setup"], [], ["monitoring_requirements", "failure_escalation"], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("recovery_requirements_and_objectives", 13, "Recovery Requirements and Objectives", "ai_later", ["assessment", "document_setup"], [], ["rpo_defined", "rpo_value", "rto_defined", "rto_value"], true, { requiredBlocks: ["paragraph", "table"], minBlocks: 2 }),
    section("restoration_and_recovery_process", 14, "Restoration and Recovery Process", "ai_later", ["assessment", "document_setup"], [], ["restore_process"], true, { requiredBlocks: ["paragraph", "numbered_list"], minBlocks: 2 }),
    section("recovery_testing_and_validation", 15, "Recovery Testing and Validation", "ai_later", ["assessment", "document_setup"], [], ["recovery_test_approach", "recovery_test_frequency"], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("records_exceptions_and_evidence", 16, "Records, Exceptions and Evidence", "ai_later", ["evidence", "document_setup"], [], ["exception_reason", "exception_affected_scope", "exception_risk", "compensating_control", "exception_approver", "exception_expiry_or_review_date"], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("policy_review_and_approval", 17, "Policy Review and Approval", "deterministic", ["evidence", "ai_documents_registry", "document_setup"], [], ["approved_by", "review_date"], true, { requiredBlocks: ["table"] }),
  ],
};

export type BackupAndRecoveryPolicyPreparationSnapshot = {
  workspaceId: string;
  workspace?: { organizationName?: string; documentOwner?: string };
  assessmentFacts?: Record<string, unknown>;
  evidenceMetadata?: { classification?: string; effectiveDate?: string; reviewDate?: string; documentOwner?: string };
  registry?: readonly AiDocumentRegistryEntry[];
  documentSetup?: Record<string, unknown>;
};

export type BackupAndRecoveryPolicyMissingInput = {
  key: string;
  sectionId: string;
  required: boolean;
  expectedType: "text";
  reason: string;
};

export type BackupAndRecoveryPolicyPreparation = {
  templateVersion: string;
  knownInputs: Record<string, unknown>;
  missingInputs: readonly BackupAndRecoveryPolicyMissingInput[];
  sourceMap: Record<string, TemplateSource>;
  sectionReadiness: Record<string, "ready" | "partial" | "blocked">;
  recoveryObjectives: { rpoDefined: boolean | "unknown"; rpoValue: unknown | "unknown"; rtoDefined: boolean | "unknown"; rtoValue: unknown | "unknown" };
};

const present = (value: unknown) => typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
const record = (value: unknown) => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
const inputSection: Record<string, string> = { organization_name: "document_control" };

export function prepareBackupAndRecoveryPolicyContext(snapshot: BackupAndRecoveryPolicyPreparationSnapshot): BackupAndRecoveryPolicyPreparation {
  const assessment = record(snapshot.assessmentFacts);
  const setup = record(snapshot.documentSetup);
  const registryEntry = snapshot.registry?.find((entry) => entry.documentType === BACKUP_AND_RECOVERY_POLICY_DOCUMENT_TYPE);
  const registryDocument = registryEntry?.activeDocument;
  const candidates: Record<TemplateSource, Record<string, unknown>> = {
    workspace: { organization_name: snapshot.workspace?.organizationName, document_owner: snapshot.workspace?.documentOwner },
    assessment,
    evidence: { classification: snapshot.evidenceMetadata?.classification, effective_date: snapshot.evidenceMetadata?.effectiveDate, review_date: snapshot.evidenceMetadata?.reviewDate, document_owner: snapshot.evidenceMetadata?.documentOwner },
    ai_documents_registry: { document_id: registryDocument?.id, document_owner: registryDocument?.documentOwnerId, review_date: registryDocument?.reviewDate, version: registryDocument?.version, status: registryEntry?.status, revision_history: registryDocument?.updatedAt },
    document_setup: setup,
    derived: {},
    static_template: {},
  };
  const definitions = [...BACKUP_AND_RECOVERY_POLICY_SPEC.requiredInputs, ...BACKUP_AND_RECOVERY_POLICY_SPEC.optionalInputs];
  const knownInputs: Record<string, unknown> = {};
  const sourceMap: Record<string, TemplateSource> = {};
  for (const definition of definitions) {
    const source = BACKUP_AND_RECOVERY_POLICY_SPEC.sourcePriority.find((candidate) => definition.sources.includes(candidate) && present(candidates[candidate][definition.id]));
    if (source) { knownInputs[definition.id] = candidates[source][definition.id]; sourceMap[definition.id] = source; }
  }
  const missingInputs = BACKUP_AND_RECOVERY_POLICY_SPEC.requiredInputs
    .filter((definition) => !present(knownInputs[definition.id]))
    .map((definition) => ({ key: definition.id, sectionId: inputSection[definition.id] ?? "document_control", required: true, expectedType: "text" as const, reason: "No explicit permitted source is available." }));
  const sectionReadiness = {} as Record<string, "ready" | "partial" | "blocked">;
  for (const section of BACKUP_AND_RECOVERY_POLICY_SPEC.sections) {
    const requiredMissing = section.requiredInputs.some((id) => !present(knownInputs[id]));
    const optionalMissing = section.optionalInputs.some((id) => !present(knownInputs[id]));
    sectionReadiness[section.id] = requiredMissing ? (section.allowOmission ? "partial" : "blocked") : optionalMissing ? "partial" : "ready";
  }
  const objectiveDefined = (value: unknown): boolean | "unknown" => value === true ? true : value === false ? false : "unknown";
  return {
    templateVersion: BACKUP_AND_RECOVERY_POLICY_TEMPLATE_VERSION, knownInputs, missingInputs, sourceMap, sectionReadiness,
    recoveryObjectives: {
      rpoDefined: objectiveDefined(knownInputs.rpo_defined), rpoValue: present(knownInputs.rpo_value) ? knownInputs.rpo_value : "unknown",
      rtoDefined: objectiveDefined(knownInputs.rto_defined), rtoValue: present(knownInputs.rto_value) ? knownInputs.rto_value : "unknown",
    },
  };
}

export function validateBackupAndRecoveryPolicySpec(
  spec: DocumentTemplateSpec<typeof BACKUP_AND_RECOVERY_POLICY_DOCUMENT_TYPE> = BACKUP_AND_RECOVERY_POLICY_SPEC,
): string[] {
  const errors: string[] = [];
  if (spec.documentType !== BACKUP_AND_RECOVERY_POLICY_DOCUMENT_TYPE || spec.version !== BACKUP_AND_RECOVERY_POLICY_TEMPLATE_VERSION) errors.push("identity");
  if (spec.sections.length !== 17 || spec.sections.some((item, index) => item.order !== index + 1)) errors.push("order");
  if (new Set(spec.sections.map((item) => item.id)).size !== 17 || new Set(spec.sections.map((item) => item.order)).size !== 17) errors.push("duplicate");
  if (BACKUP_AND_RECOVERY_POLICY_WORKFLOW.length !== 11) errors.push("workflow");
  if (spec.sections.some((item) => !spec.sourcePriority.every((source) => typeof source === "string") || item.sources.some((source) => !spec.sourcePriority.includes(source)))) errors.push("sources");
  const inputIds = new Set([...spec.requiredInputs, ...spec.optionalInputs].map((input) => input.id));
  if (spec.sections.some((item) => item.requiredInputs.some((id) => !inputIds.has(id)) || item.optionalInputs.some((id) => !inputIds.has(id)))) errors.push("inputs");
  if ([...spec.requiredInputs, ...spec.optionalInputs].some((input) => !input.neverInvent)) errors.push("inference");
  return errors;
}
