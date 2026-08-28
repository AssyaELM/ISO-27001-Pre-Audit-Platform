import { resolveAwarenessTrainingQuestions } from "../../content/assessment/people/awareness-training.ts";
import { resolveEventReportingQuestions } from "../../content/assessment/people/event-reporting.ts";
import { resolveSecurityOfAssetsOffPremisesQuestions } from "../../content/assessment/physical/security-of-assets-off-premises.ts";
import { resolveStorageMediaQuestions } from "../../content/assessment/physical/storage-media.ts";
import { resolveOrganizationalControl, type OrganizationalContext } from "../assessment/organizational-controls.ts";
import { resolveTechnologicalAssessmentContext, resolveTechnologicalControl } from "../assessment/technological-controls.ts";
import { BACKUP_AND_RECOVERY_POLICY_DOCUMENT_TYPE, BACKUP_AND_RECOVERY_POLICY_SPEC, BACKUP_AND_RECOVERY_POLICY_TEMPLATE_VERSION } from "./backup-and-recovery-policy.ts";
import { BACKUP_AND_RECOVERY_POLICY_ASSESSMENT_MAPPING, BACKUP_AND_RECOVERY_POLICY_ASSESSMENT_MAPPING_VERSION, type BackupAndRecoveryPolicyRelevance } from "./backup-and-recovery-policy-assessment-mapping.ts";

export const BACKUP_AND_RECOVERY_POLICY_GENERATION_CONTRACT_VERSION = "1.0.0";
type AssessmentAnswer = "implemented" | "partially_implemented" | "not_implemented" | "not_sure" | "not_applicable";
type ImplementationState = "implemented" | "partial" | "absent" | "uncertain" | "not_applicable";
type ContextDecision = "yes" | "no" | "not_sure" | undefined;
type SemanticGroup = "rolesAndResponsibilities" | "backupScopeAndCriticality" | "backupRequirementsAndStrategy" | "scheduleAndRetention" | "storageSeparationAndProtection" | "accessControlAndEncryption" | "monitoringAndFailureHandling" | "recoveryRequirementsAndObjectives" | "restorationAndRecovery" | "recoveryTestingAndValidation" | "recordsExceptionsAndEvidence";

export type BackupAndRecoveryAssessmentResponse = { theme: "organizational" | "people" | "physical" | "technological"; controlId: string; questionId: string; answer: AssessmentAnswer; justification?: string | null };
export type BackupAndRecoverySourceTrace = { sourceType: "assessment" | "workspace" | "evidence_metadata" | "ai_documents_registry" | "document_setup"; sourceId: string; controlId?: string; relevance?: BackupAndRecoveryPolicyRelevance; implementationState?: ImplementationState; sourceField?: string };
export type BackupAndRecoverySemanticFact = { capability: string; implementationState: ImplementationState; policySections: readonly string[]; source: BackupAndRecoverySourceTrace };
export type BackupAndRecoveryMissingInput = { key: string; label: string; sectionId: string; required: boolean; expectedType: "text" | "date" | "workspace_member"; reason: string; allowedValues?: readonly string[] };
export type BackupAndRecoverySourceConflict = { key: string; candidates: readonly { value: unknown; source: BackupAndRecoverySourceTrace }[]; resolution: "resolved_by_source_priority" | "unresolved"; selectedSource?: BackupAndRecoverySourceTrace };
export type BackupAndRecoveryEvidenceMetadata = { id: string; documentType?: string | null; version?: string | null; owner?: string | null; effectiveDate?: string | null; reviewDate?: string | null; reviewState?: string | null };
export type BackupAndRecoveryPolicyGenerationInput = {
  workspace?: { organizationName?: string; documentOwner?: string };
  documentSetup?: Record<string, unknown>;
  evidenceMetadata?: readonly BackupAndRecoveryEvidenceMetadata[];
  registry?: readonly { documentType: string; status?: string; activeDocument?: { id: string; version?: string | null; documentOwnerId?: string | null; reviewDate?: string | null } }[];
  assessment?: { responses: readonly BackupAndRecoveryAssessmentResponse[]; organizationalContext?: OrganizationalContext; peopleContext?: Record<string, ContextDecision>; physicalContext?: Record<string, ContextDecision>; technologicalContext?: { persisted?: Record<string, unknown>; onboarding?: Record<string, unknown>; shared?: Record<string, unknown>; crossTheme?: Record<string, unknown> } };
};
export type BackupAndRecoveryPolicyGenerationContext = {
  documentType: typeof BACKUP_AND_RECOVERY_POLICY_DOCUMENT_TYPE; templateVersion: typeof BACKUP_AND_RECOVERY_POLICY_TEMPLATE_VERSION; mappingVersion: typeof BACKUP_AND_RECOVERY_POLICY_ASSESSMENT_MAPPING_VERSION; generationContractVersion: typeof BACKUP_AND_RECOVERY_POLICY_GENERATION_CONTRACT_VERSION;
  currentFacts: readonly BackupAndRecoverySemanticFact[]; policyIntent: { mayDefineNormativeRequirementsLater: true; currentStateIsNotPolicyStatement: true }; assessmentFacts: readonly BackupAndRecoverySemanticFact[]; semanticFacts: Record<SemanticGroup, readonly BackupAndRecoverySemanticFact[]>; knownInputs: Record<string, unknown>; missingInputs: readonly BackupAndRecoveryMissingInput[]; conflicts: readonly BackupAndRecoverySourceConflict[]; sectionReadiness: Record<string, "ready" | "partial" | "blocked">; sourcePriority: typeof BACKUP_AND_RECOVERY_POLICY_SPEC.sourcePriority; sourceTrace: readonly BackupAndRecoverySourceTrace[]; prohibitedInferences: readonly string[];
  backupScopeAndCriticality: { assetExists: "unknown"; backupRequiredForAsset: "unknown"; criticalityState?: ImplementationState; cloudContext: boolean | "unknown"; regulatedDataContext: boolean | "unknown" };
  backupRequirementsAndStrategy: { backupProcessState?: ImplementationState; requirementsState?: ImplementationState; strategyState?: ImplementationState; backupFrequencyDefined: boolean | "unknown"; knownBackupFrequency: "unknown"; retentionRequirementsExist: boolean | "unknown"; knownRetentionRequirements: "unknown" };
  storageSeparationAndProtection: { protectionState?: ImplementationState; separationState?: ImplementationState; removableMediaContext: boolean | "unknown"; cloudContext: boolean | "unknown" };
  accessControlAndEncryption: { accessRestrictionState?: ImplementationState; cryptographicRequirementsState?: ImplementationState; backupEncryptionExplicitlyConfirmed: "unknown"; encryptionMethodKnown: "unknown" };
  monitoringAndFailureHandling: { monitoringProcessState?: ImplementationState; failureHandlingState?: ImplementationState; backupExecutionEvidenceState?: ImplementationState; restoreRecoveryTestEvidenceState?: ImplementationState; backupSuccessDoesNotProveRecoverability: true };
  recoveryRequirementsAndObjectives: { rpoDefined: boolean | "unknown"; rpoValue: "unknown"; rtoDefined: boolean | "unknown"; rtoValue: "unknown" };
  restorationAndRecovery: { restorationProcessState?: ImplementationState; criticalRunbookContext: boolean | "unknown"; alternateOperationsContext: boolean | "unknown" };
  recoveryTestingAndValidation: { restoreTestingState?: ImplementationState; testingApproachKnown: "unknown"; testingFrequencyKnown: "unknown"; recoveryObjectivesEvaluated?: ImplementationState };
};

const implementationState = (answer: AssessmentAnswer): ImplementationState => answer === "partially_implemented" ? "partial" : answer === "not_implemented" ? "absent" : answer === "not_sure" ? "uncertain" : answer;
const flag = (value: ContextDecision): boolean | "unknown" => value === "yes" ? true : value === "no" ? false : "unknown";
const groupsFor = (sections: readonly string[]): SemanticGroup[] => {
  const result = new Set<SemanticGroup>();
  const groupBySection: Record<string, SemanticGroup> = { roles_and_responsibilities: "rolesAndResponsibilities", backup_scope_and_criticality: "backupScopeAndCriticality", backup_requirements_and_strategy: "backupRequirementsAndStrategy", backup_schedule_and_retention: "scheduleAndRetention", backup_storage_separation_and_protection: "storageSeparationAndProtection", access_control_and_encryption: "accessControlAndEncryption", backup_monitoring_and_failure_handling: "monitoringAndFailureHandling", recovery_requirements_and_objectives: "recoveryRequirementsAndObjectives", restoration_and_recovery_process: "restorationAndRecovery", recovery_testing_and_validation: "recoveryTestingAndValidation", records_exceptions_and_evidence: "recordsExceptionsAndEvidence" };
  for (const section of sections) { const group = groupBySection[section]; if (group) result.add(group); }
  return [...result];
};
function visibleQuestionIds(input: BackupAndRecoveryPolicyGenerationInput): Map<string, Set<string>> {
  const organizational = input.assessment?.organizationalContext ?? {}; const people = input.assessment?.peopleContext ?? {}; const physical = input.assessment?.physicalContext ?? {}; const tech = input.assessment?.technologicalContext ?? {};
  const technological = resolveTechnologicalAssessmentContext(tech.persisted, tech.onboarding, tech.shared, tech.crossTheme); const visible = new Map<string, Set<string>>();
  for (const mapping of BACKUP_AND_RECOVERY_POLICY_ASSESSMENT_MAPPING) { const key = `${mapping.theme}:${mapping.controlId}`; if (visible.has(key)) continue;
    const questionIds = mapping.theme === "organizational" ? resolveOrganizationalControl(mapping.controlId as never, organizational).questionIds : mapping.theme === "technological" ? resolveTechnologicalControl(mapping.controlId as never, technological).questionIds : mapping.controlId === "a6-3" ? resolveAwarenessTrainingQuestions(people as never).questionIds : mapping.controlId === "a6-8" ? resolveEventReportingQuestions(people as never).questionIds : mapping.controlId === "a7-9" ? resolveSecurityOfAssetsOffPremisesQuestions(physical as never).questionIds : resolveStorageMediaQuestions(physical as never).questionIds;
    visible.set(key, new Set(questionIds)); }
  return visible;
}
const present = (value: unknown) => typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
const sourceRank: Record<BackupAndRecoverySourceTrace["sourceType"], number> = { workspace: 0, assessment: 1, evidence_metadata: 2, ai_documents_registry: 3, document_setup: 4 };
const inputLabels: Record<string, string> = { organization_name: "Organization name" };
const inputSections: Record<string, string> = { organization_name: "document_control" };
function resolveKnownInputs(input: BackupAndRecoveryPolicyGenerationInput) {
  const candidates = new Map<string, Array<{ value: unknown; source: BackupAndRecoverySourceTrace }>>();
  const add = (key: string, value: unknown, source: BackupAndRecoverySourceTrace) => { if (present(value)) (candidates.get(key) ?? candidates.set(key, []).get(key)!).push({ value, source }); };
  add("organization_name", input.workspace?.organizationName, { sourceType: "workspace", sourceId: "organization_name", sourceField: "organizationName" });
  add("document_owner", input.workspace?.documentOwner, { sourceType: "workspace", sourceId: "document_owner", sourceField: "documentOwner" });
  for (const [key, value] of Object.entries(input.documentSetup ?? {})) add(key, value, { sourceType: "document_setup", sourceId: key, sourceField: key });
  for (const evidence of input.evidenceMetadata ?? []) {
    if (evidence.documentType !== BACKUP_AND_RECOVERY_POLICY_DOCUMENT_TYPE) continue;
    add("document_owner", evidence.owner, { sourceType: "evidence_metadata", sourceId: evidence.id, sourceField: "owner" });
    add("effective_date", evidence.effectiveDate, { sourceType: "evidence_metadata", sourceId: evidence.id, sourceField: "effectiveDate" });
    add("review_date", evidence.reviewDate, { sourceType: "evidence_metadata", sourceId: evidence.id, sourceField: "reviewDate" });
  }
  const document = input.registry?.find((item) => item.documentType === BACKUP_AND_RECOVERY_POLICY_DOCUMENT_TYPE)?.activeDocument;
  if (document) {
    add("version", document.version, { sourceType: "ai_documents_registry", sourceId: document.id, sourceField: "version" });
    add("document_owner", document.documentOwnerId, { sourceType: "ai_documents_registry", sourceId: document.id, sourceField: "documentOwnerId" });
    add("review_date", document.reviewDate, { sourceType: "ai_documents_registry", sourceId: document.id, sourceField: "reviewDate" });
  }
  const knownInputs: Record<string, unknown> = {}; const conflicts: BackupAndRecoverySourceConflict[] = []; const trace: BackupAndRecoverySourceTrace[] = [];
  for (const [key, options] of candidates) {
    const ordered = [...options].sort((left, right) => sourceRank[left.source.sourceType] - sourceRank[right.source.sourceType] || left.source.sourceId.localeCompare(right.source.sourceId));
    const topRank = sourceRank[ordered[0].source.sourceType]; const top = ordered.filter((item) => sourceRank[item.source.sourceType] === topRank); const topValues = new Set(top.map((item) => JSON.stringify(item.value)));
    if (topValues.size > 1) { conflicts.push({ key, candidates: ordered, resolution: "unresolved" }); continue; }
    const selected = top[0]; knownInputs[key] = selected.value; trace.push(selected.source);
    if (new Set(ordered.map((item) => JSON.stringify(item.value))).size > 1) conflicts.push({ key, candidates: ordered, resolution: "resolved_by_source_priority", selectedSource: selected.source });
  }
  return { knownInputs, conflicts, trace };
}
function sectionReadiness(facts: readonly BackupAndRecoverySemanticFact[], knownInputs: Record<string, unknown>): Record<string, "ready" | "partial" | "blocked"> {
  const readiness = {} as Record<string, "ready" | "partial" | "blocked">;
  for (const section of BACKUP_AND_RECOVERY_POLICY_SPEC.sections) {
    if (section.id === "document_control") readiness[section.id] = present(knownInputs.organization_name) ? "ready" : "blocked";
    else if (["purpose", "terms_and_definitions", "backup_and_recovery_principles"].includes(section.id)) readiness[section.id] = "ready";
    else readiness[section.id] = facts.some((fact) => fact.policySections.includes(section.id)) ? "ready" : "partial";
  }
  return readiness;
}
export function prepareBackupAndRecoveryPolicyGenerationContext(input: BackupAndRecoveryPolicyGenerationInput): BackupAndRecoveryPolicyGenerationContext {
  const responseByQuestion = new Map((input.assessment?.responses ?? []).map((response) => [`${response.theme}:${response.questionId}`, response])); const visible = visibleQuestionIds(input); const currentFacts: BackupAndRecoverySemanticFact[] = [];
  for (const mapping of BACKUP_AND_RECOVERY_POLICY_ASSESSMENT_MAPPING) { const response = responseByQuestion.get(`${mapping.theme}:${mapping.questionId}`); if (!response || !visible.get(`${mapping.theme}:${mapping.controlId}`)?.has(mapping.questionId) || (response.answer === "not_applicable" && !response.justification?.trim())) continue; const state = implementationState(response.answer); currentFacts.push({ capability: mapping.questionId, implementationState: state, policySections: mapping.policySections, source: { sourceType: "assessment", sourceId: mapping.questionId, controlId: mapping.controlId, relevance: mapping.relevance, implementationState: state } }); }
  const semanticFacts = { rolesAndResponsibilities: [], backupScopeAndCriticality: [], backupRequirementsAndStrategy: [], scheduleAndRetention: [], storageSeparationAndProtection: [], accessControlAndEncryption: [], monitoringAndFailureHandling: [], recoveryRequirementsAndObjectives: [], restorationAndRecovery: [], recoveryTestingAndValidation: [], recordsExceptionsAndEvidence: [] } as Record<SemanticGroup, BackupAndRecoverySemanticFact[]>;
  for (const fact of currentFacts) for (const group of groupsFor(fact.policySections)) semanticFacts[group].push(fact);
  const state = (questionId: string) => currentFacts.find((fact) => fact.source.sourceId === questionId)?.implementationState;
  const resolvedInputs = resolveKnownInputs(input);
  const missingInputs: BackupAndRecoveryMissingInput[] = BACKUP_AND_RECOVERY_POLICY_SPEC.requiredInputs
    .filter((definition) => !present(resolvedInputs.knownInputs[definition.id]))
    .map((definition) => ({ key: definition.id, label: inputLabels[definition.id] ?? definition.label, sectionId: inputSections[definition.id] ?? "document_control", required: true, expectedType: "text", reason: resolvedInputs.conflicts.some((conflict) => conflict.key === definition.id) ? "Conflicting explicit sources require resolution." : "No explicit permitted source is available." }));
  const org = input.assessment?.organizationalContext ?? {}; const physical = input.assessment?.physicalContext ?? {}; const shared = input.assessment?.technologicalContext?.shared ?? {};
  return { documentType: BACKUP_AND_RECOVERY_POLICY_DOCUMENT_TYPE, templateVersion: BACKUP_AND_RECOVERY_POLICY_TEMPLATE_VERSION, mappingVersion: BACKUP_AND_RECOVERY_POLICY_ASSESSMENT_MAPPING_VERSION, generationContractVersion: BACKUP_AND_RECOVERY_POLICY_GENERATION_CONTRACT_VERSION, currentFacts, policyIntent: { mayDefineNormativeRequirementsLater: true, currentStateIsNotPolicyStatement: true }, assessmentFacts: currentFacts, semanticFacts, knownInputs: resolvedInputs.knownInputs, missingInputs, conflicts: resolvedInputs.conflicts, sectionReadiness: sectionReadiness(currentFacts, resolvedInputs.knownInputs), sourcePriority: BACKUP_AND_RECOVERY_POLICY_SPEC.sourcePriority, sourceTrace: [...currentFacts.map((fact) => fact.source), ...resolvedInputs.trace], prohibitedInferences: BACKUP_AND_RECOVERY_POLICY_SPEC.forbiddenInferences,
    backupScopeAndCriticality: { assetExists: "unknown", backupRequiredForAsset: "unknown", criticalityState: state("p5_9_003"), cloudContext: flag((shared.usesCloudHostedCriticalDataOrSystems ?? org.usesCloudServicesInScope) as ContextDecision), regulatedDataContext: flag(org.cloudProcessesSensitiveOrRegulatedData as ContextDecision) },
    backupRequirementsAndStrategy: { backupProcessState: state("p8_13_001"), requirementsState: state("p8_13_002"), strategyState: state("p8_13_003"), backupFrequencyDefined: "unknown", knownBackupFrequency: "unknown", retentionRequirementsExist: state("o5_33_001") === "implemented" ? true : state("o5_33_001") === "absent" ? false : "unknown", knownRetentionRequirements: "unknown" },
    storageSeparationAndProtection: { protectionState: state("p8_13_003"), separationState: state("p8_13_003"), removableMediaContext: flag(physical.usesRemovableOrPortableStorageMedia), cloudContext: flag(shared.usesCloudHostedCriticalDataOrSystems as ContextDecision) }, accessControlAndEncryption: { accessRestrictionState: state("p5_15_002"), cryptographicRequirementsState: state("p8_24_001"), backupEncryptionExplicitlyConfirmed: "unknown", encryptionMethodKnown: "unknown" }, monitoringAndFailureHandling: { monitoringProcessState: state("p8_16_001"), failureHandlingState: state("p8_13_002"), backupExecutionEvidenceState: state("p8_13_003"), restoreRecoveryTestEvidenceState: state("p8_13_004"), backupSuccessDoesNotProveRecoverability: true }, recoveryRequirementsAndObjectives: { rpoDefined: "unknown", rpoValue: "unknown", rtoDefined: "unknown", rtoValue: "unknown" }, restorationAndRecovery: { restorationProcessState: state("p8_13_004"), criticalRunbookContext: flag(org.hasCriticalInfrequentOrHighRiskOperations as ContextDecision), alternateOperationsContext: flag(org.usesAlternateSitesOrManualFallback as ContextDecision) }, recoveryTestingAndValidation: { restoreTestingState: state("p8_13_005"), testingApproachKnown: "unknown", testingFrequencyKnown: "unknown", recoveryObjectivesEvaluated: state("p5_30_002") } };
}
export function validateBackupAndRecoveryPolicyGenerationContextCore(): string[] { const errors: string[] = []; if (BACKUP_AND_RECOVERY_POLICY_ASSESSMENT_MAPPING.length !== 85) errors.push("mapping count"); if (BACKUP_AND_RECOVERY_POLICY_ASSESSMENT_MAPPING.filter((item) => item.conditionKey).length !== 19) errors.push("conditional count"); if (new Set(BACKUP_AND_RECOVERY_POLICY_ASSESSMENT_MAPPING.map((item) => item.questionId)).size !== 85) errors.push("duplicate mapping"); return errors; }
