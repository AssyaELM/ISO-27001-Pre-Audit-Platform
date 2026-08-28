import { resolveOrganizationalControl } from "../assessment/organizational-controls.ts";
import { resolveTechnologicalAssessmentContext, resolveTechnologicalControl } from "../assessment/technological-controls.ts";
import { resolveAwarenessTrainingQuestions } from "../../content/assessment/people/awareness-training.ts";
import { resolveEventReportingQuestions } from "../../content/assessment/people/event-reporting.ts";
import { resolveSecurityOfAssetsOffPremisesQuestions } from "../../content/assessment/physical/security-of-assets-off-premises.ts";
import { resolveStorageMediaQuestions } from "../../content/assessment/physical/storage-media.ts";
import {
  INFORMATION_ASSET_MANAGEMENT_POLICY_DOCUMENT_TYPE,
  INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC,
  INFORMATION_ASSET_MANAGEMENT_POLICY_TEMPLATE_VERSION,
} from "./information-asset-management-policy.ts";
import {
  INFORMATION_ASSET_MANAGEMENT_POLICY_ASSESSMENT_MAPPING,
  INFORMATION_ASSET_MANAGEMENT_POLICY_ASSESSMENT_MAPPING_VERSION,
} from "./information-asset-management-policy-assessment-mapping.ts";

export const INFORMATION_ASSET_MANAGEMENT_POLICY_GENERATION_CONTRACT_VERSION = "1.0.0";

type Answer = "implemented" | "partially_implemented" | "not_implemented" | "not_sure" | "not_applicable";
type ImplementationState = "implemented" | "partial" | "absent" | "uncertain" | "not_applicable";
type ContextDecision = "yes" | "no" | "not_sure" | undefined;
type Readiness = "ready" | "partial" | "blocked";
type SourceType = "workspace" | "assessment" | "evidence_metadata" | "ai_documents_registry" | "document_setup";
type InformationAssetManagementPolicyRelevance = typeof INFORMATION_ASSET_MANAGEMENT_POLICY_ASSESSMENT_MAPPING[number]["relevance"];

export type InformationAssetManagementPolicyAssessmentResponse = {
  theme: "organizational" | "people" | "physical" | "technological";
  controlId: string;
  questionId: string;
  answer: Answer;
  justification?: string | null;
};

export type InformationAssetManagementPolicySourceTrace = {
  sourceType: SourceType;
  sourceId: string;
  controlId?: string;
  relevance?: InformationAssetManagementPolicyRelevance;
  implementationState?: ImplementationState;
  sourceField?: string;
};

export type InformationAssetManagementPolicySemanticFact = {
  capability: string;
  implementationState: ImplementationState;
  policySections: readonly string[];
  source: InformationAssetManagementPolicySourceTrace;
};

export type InformationAssetManagementPolicyMissingInput = {
  key: string;
  label: string;
  sectionId: string;
  required: boolean;
  expectedType: "text" | "date" | "workspace_member";
  reason: string;
  allowedValues?: readonly string[];
};

export type InformationAssetManagementPolicyConflict = {
  key: string;
  values: readonly { value: unknown; source: InformationAssetManagementPolicySourceTrace }[];
  sources: readonly InformationAssetManagementPolicySourceTrace[];
  affectedSections: readonly string[];
  resolutionStatus: "resolved_by_source_priority" | "unresolved";
  selectedSource?: InformationAssetManagementPolicySourceTrace;
};

export type InformationAssetManagementPolicyEvidenceMetadata = {
  id: string;
  documentType?: string | null;
  version?: string | null;
  owner?: string | null;
  effectiveDate?: string | null;
  reviewDate?: string | null;
  reviewState?: string | null;
};

export type InformationAssetManagementPolicyGenerationInput = {
  workspace?: { organizationName?: string; documentOwner?: string; facts?: Record<string, unknown> };
  documentSetup?: Record<string, unknown>;
  evidenceMetadata?: readonly InformationAssetManagementPolicyEvidenceMetadata[];
  registry?: readonly { documentType: string; status?: string; activeDocument?: { id: string; version?: string | null; documentOwnerId?: string | null; reviewDate?: string | null } }[];
  assessment?: {
    responses: readonly InformationAssetManagementPolicyAssessmentResponse[];
    context?: Record<string, ContextDecision>;
    facts?: Record<string, unknown>;
    technologicalContext?: { persisted?: Record<string, unknown>; onboarding?: Record<string, unknown>; shared?: Record<string, unknown>; crossTheme?: Record<string, unknown> };
  };
};

export type InformationAssetManagementPolicyGenerationContext = {
  documentType: typeof INFORMATION_ASSET_MANAGEMENT_POLICY_DOCUMENT_TYPE;
  templateVersion: typeof INFORMATION_ASSET_MANAGEMENT_POLICY_TEMPLATE_VERSION;
  mappingVersion: typeof INFORMATION_ASSET_MANAGEMENT_POLICY_ASSESSMENT_MAPPING_VERSION;
  generationContractVersion: typeof INFORMATION_ASSET_MANAGEMENT_POLICY_GENERATION_CONTRACT_VERSION;
  currentFacts: readonly InformationAssetManagementPolicySemanticFact[];
  policyIntent: { mayDefineNormativeRequirementsLater: true; currentStateIsNotPolicyStatement: true };
  assessmentFacts: readonly InformationAssetManagementPolicySemanticFact[];
  semanticFacts: Record<string, readonly InformationAssetManagementPolicySemanticFact[]>;
  knownInputs: Record<string, unknown>;
  missingInputs: readonly InformationAssetManagementPolicyMissingInput[];
  conflicts: readonly InformationAssetManagementPolicyConflict[];
  sectionReadiness: Record<string, Readiness>;
  sourcePriority: typeof INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC.sourcePriority;
  sourceTrace: readonly InformationAssetManagementPolicySourceTrace[];
  prohibitedInferences: readonly string[];
  assetInventory: { assetInventoryExists: boolean | "unknown"; ownershipAssigned: ImplementationState | "unknown" };
  classification: { classificationDefined: boolean | "unknown"; classificationApplied: ImplementationState | "unknown"; classificationSchemeKnown: boolean | "unknown"; criticalityEvaluated: ImplementationState | "unknown" };
  offPremisesAndByod: { allowsBYOD: boolean | "unknown"; allowsBYODForBusiness: boolean | "unknown"; usesEndpointsOffPremises: boolean | "unknown" };
  semanticGenerationContext: { facts: readonly InformationAssetManagementPolicySemanticFact[]; knownInputs: Record<string, unknown>; policyIntent: { mayDefineNormativeRequirementsLater: true; currentStateIsNotPolicyStatement: true } };
};

const implementationState = (answer: Answer): ImplementationState => answer === "partially_implemented" ? "partial" : answer === "not_implemented" ? "absent" : answer === "not_sure" ? "uncertain" : answer;
const present = (value: unknown): boolean => typeof value === "string" ? value.trim().length > 0 : Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null;
const booleanOrUnknown = (value: unknown): boolean | "unknown" => value === true || value === "yes" ? true : value === false || value === "no" ? false : "unknown";
const stableValue = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableValue).join(",")}]`;
  return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableValue((value as Record<string, unknown>)[key])}`).join(",")}}`;
};

const sourceRank: Record<SourceType, number> = { workspace: 0, assessment: 1, evidence_metadata: 2, ai_documents_registry: 3, document_setup: 4 };
const inputDefinitions = [...INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC.requiredInputs, ...INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC.optionalInputs];
const supportedInputKeys = new Set(inputDefinitions.map((input) => input.id));
const sectionInputKeys: Record<string, readonly string[]> = {
  document_control: ["organization_name", "document_owner", "classification"],
  scope: ["asset_categories"], roles_and_responsibilities: ["asset_policy_owner", "asset_owner_model", "custodian_model"],
  asset_categories_and_scope: ["asset_categories"], asset_inventory_and_registration: ["asset_register_exists", "register_owner"],
  asset_ownership_and_accountability: ["asset_owner_model", "custodian_model"], asset_classification_and_criticality: ["classification_defined", "classification_scheme", "criticality_scheme"],
  asset_labelling_and_handling: ["classification_scheme", "removable_media_rules"], acceptable_use_of_assets: ["acceptable_use_rules"],
  asset_lifecycle_management: ["lifecycle_rules"], asset_transfer_and_return: ["return_process"],
  asset_protection_and_off_premises_use: ["off_premises_rules", "removable_media_rules"], secure_reuse_disposal_and_decommissioning: ["reuse_requirements", "disposal_requirements"],
  records_exceptions_monitoring_and_compliance: ["monitoring_review_approach", "exception_approver"], policy_review_and_approval: ["review_date", "approved_by"],
};

function visibleQuestionIds(input: InformationAssetManagementPolicyGenerationInput): Map<string, Set<string>> {
  const assessment = input.assessment;
  const sharedContext = assessment?.context ?? {};
  const technologicalInput = assessment?.technologicalContext ?? {};
  const technologicalContext = resolveTechnologicalAssessmentContext(technologicalInput.persisted ?? sharedContext, technologicalInput.onboarding ?? sharedContext, technologicalInput.shared ?? sharedContext, technologicalInput.crossTheme ?? sharedContext);
  const visible = new Map<string, Set<string>>();
  for (const mapping of INFORMATION_ASSET_MANAGEMENT_POLICY_ASSESSMENT_MAPPING) {
    const key = `${mapping.theme}:${mapping.controlId}`;
    if (visible.has(key)) continue;
    const questionIds = mapping.theme === "organizational"
      ? resolveOrganizationalControl(mapping.controlId as never, sharedContext as never).questionIds
      : mapping.theme === "people"
        ? mapping.controlId === "a6-3" ? resolveAwarenessTrainingQuestions(sharedContext as never).questionIds : mapping.controlId === "a6-8" ? resolveEventReportingQuestions(sharedContext as never).questionIds : []
        : mapping.theme === "physical"
          ? mapping.controlId === "a7-9" ? resolveSecurityOfAssetsOffPremisesQuestions(sharedContext as never).questionIds : mapping.controlId === "a7-10" ? resolveStorageMediaQuestions(sharedContext as never).questionIds : []
          : resolveTechnologicalControl(mapping.controlId as never, technologicalContext).questionIds;
    visible.set(key, new Set(questionIds));
  }
  return visible;
}

function sectionsForInput(key: string): readonly string[] {
  const sections = INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC.sections.filter((section) => section.requiredInputs.includes(key) || section.optionalInputs.includes(key) || sectionInputKeys[section.id]?.includes(key)).map((section) => section.id);
  return sections.length ? sections : ["document_control"];
}

function resolveKnownInputs(input: InformationAssetManagementPolicyGenerationInput) {
  const candidates = new Map<string, Array<{ value: unknown; source: InformationAssetManagementPolicySourceTrace }>>();
  const add = (key: string, value: unknown, source: InformationAssetManagementPolicySourceTrace) => {
    if (supportedInputKeys.has(key) && present(value)) (candidates.get(key) ?? candidates.set(key, []).get(key)!).push({ value, source });
  };
  add("organization_name", input.workspace?.organizationName, { sourceType: "workspace", sourceId: "organization_name", sourceField: "organizationName" });
  add("document_owner", input.workspace?.documentOwner, { sourceType: "workspace", sourceId: "document_owner", sourceField: "documentOwner" });
  for (const [key, value] of Object.entries(input.workspace?.facts ?? {})) add(key, value, { sourceType: "workspace", sourceId: key, sourceField: key });
  for (const [key, value] of Object.entries(input.assessment?.facts ?? {})) add(key, value, { sourceType: "assessment", sourceId: key, sourceField: key });
  for (const [key, value] of Object.entries(input.documentSetup ?? {})) add(key, value, { sourceType: "document_setup", sourceId: key, sourceField: key });
  for (const evidence of input.evidenceMetadata ?? []) {
    if (evidence.documentType !== INFORMATION_ASSET_MANAGEMENT_POLICY_DOCUMENT_TYPE) continue;
    add("document_owner", evidence.owner, { sourceType: "evidence_metadata", sourceId: evidence.id, sourceField: "owner" });
    add("effective_date", evidence.effectiveDate, { sourceType: "evidence_metadata", sourceId: evidence.id, sourceField: "effectiveDate" });
    add("review_date", evidence.reviewDate, { sourceType: "evidence_metadata", sourceId: evidence.id, sourceField: "reviewDate" });
  }
  const registryDocuments = (input.registry ?? []).filter((entry) => entry.documentType === INFORMATION_ASSET_MANAGEMENT_POLICY_DOCUMENT_TYPE && entry.activeDocument).sort((left, right) => (left.activeDocument?.id ?? "").localeCompare(right.activeDocument?.id ?? ""));
  for (const entry of registryDocuments) {
    const document = entry.activeDocument!;
    add("document_id", document.id, { sourceType: "ai_documents_registry", sourceId: document.id, sourceField: "id" });
    add("version", document.version, { sourceType: "ai_documents_registry", sourceId: document.id, sourceField: "version" });
    add("document_owner", document.documentOwnerId, { sourceType: "ai_documents_registry", sourceId: document.id, sourceField: "documentOwnerId" });
    add("review_date", document.reviewDate, { sourceType: "ai_documents_registry", sourceId: document.id, sourceField: "reviewDate" });
  }

  const knownInputs: Record<string, unknown> = {};
  const conflicts: InformationAssetManagementPolicyConflict[] = [];
  const trace: InformationAssetManagementPolicySourceTrace[] = [];
  for (const [key, options] of [...candidates.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const ordered = [...options].sort((left, right) => sourceRank[left.source.sourceType] - sourceRank[right.source.sourceType] || left.source.sourceId.localeCompare(right.source.sourceId) || (left.source.sourceField ?? "").localeCompare(right.source.sourceField ?? ""));
    const rank = sourceRank[ordered[0].source.sourceType];
    const firstRank = ordered.filter((item) => sourceRank[item.source.sourceType] === rank);
    const valuesAtFirstRank = new Set(firstRank.map((item) => stableValue(item.value)));
    const sources = ordered.map((item) => item.source);
    if (valuesAtFirstRank.size > 1) {
      conflicts.push({ key, values: ordered, sources, affectedSections: sectionsForInput(key), resolutionStatus: "unresolved" });
      continue;
    }
    const selected = firstRank[0];
    knownInputs[key] = selected.value;
    trace.push(selected.source);
    if (new Set(ordered.map((item) => stableValue(item.value))).size > 1) conflicts.push({ key, values: ordered, sources, affectedSections: sectionsForInput(key), resolutionStatus: "resolved_by_source_priority", selectedSource: selected.source });
  }
  return { knownInputs, conflicts, trace };
}

function readinessFor(facts: readonly InformationAssetManagementPolicySemanticFact[], knownInputs: Record<string, unknown>, conflicts: readonly InformationAssetManagementPolicyConflict[]): Record<string, Readiness> {
  const readiness = {} as Record<string, Readiness>;
  for (const section of INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC.sections) {
    const requiredMissing = section.requiredInputs.some((key) => !present(knownInputs[key]));
    const unresolvedConflict = conflicts.some((conflict) => conflict.resolutionStatus === "unresolved" && conflict.affectedSections.includes(section.id));
    if (requiredMissing) readiness[section.id] = "blocked";
    else if (unresolvedConflict) readiness[section.id] = "partial";
    else if (["terms_and_definitions", "asset_management_principles"].includes(section.id)) readiness[section.id] = "ready";
    else if (facts.some((fact) => fact.policySections.includes(section.id)) || (sectionInputKeys[section.id] ?? []).some((key) => present(knownInputs[key]))) readiness[section.id] = "ready";
    else readiness[section.id] = "partial";
  }
  return readiness;
}

function stateFor(facts: readonly InformationAssetManagementPolicySemanticFact[], questionId: string): ImplementationState | "unknown" {
  return facts.find((fact) => fact.capability === questionId)?.implementationState ?? "unknown";
}

export function prepareInformationAssetManagementPolicyGenerationContext(input: InformationAssetManagementPolicyGenerationInput): InformationAssetManagementPolicyGenerationContext {
  const responses = input.assessment?.responses ?? [];
  const responseByQuestion = new Map(responses.map((response) => [`${response.theme}:${response.questionId}`, response]));
  const visible = visibleQuestionIds(input);
  const currentFacts: InformationAssetManagementPolicySemanticFact[] = [];
  for (const mapping of INFORMATION_ASSET_MANAGEMENT_POLICY_ASSESSMENT_MAPPING) {
    const response = responseByQuestion.get(`${mapping.theme}:${mapping.questionId}`);
    if (!response || (mapping.conditionKey && !visible.get(`${mapping.theme}:${mapping.controlId}`)?.has(mapping.questionId))) continue;
    if (response.answer === "not_applicable" && !response.justification?.trim()) continue;
    const state = implementationState(response.answer);
    currentFacts.push({ capability: mapping.questionId, implementationState: state, policySections: mapping.policySections, source: { sourceType: "assessment", sourceId: mapping.questionId, controlId: mapping.controlId, relevance: mapping.relevance, implementationState: state } });
  }
  const semanticFacts: Record<string, InformationAssetManagementPolicySemanticFact[]> = {};
  for (const fact of currentFacts) for (const section of fact.policySections) (semanticFacts[section] ??= []).push(fact);
  const resolved = resolveKnownInputs(input);
  const conflictKeys = new Set(resolved.conflicts.filter((conflict) => conflict.resolutionStatus === "unresolved").map((conflict) => conflict.key));
  const missingInputs = INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC.requiredInputs.filter((definition) => !present(resolved.knownInputs[definition.id])).map((definition) => ({ key: definition.id, label: definition.label, sectionId: "document_control", required: true, expectedType: "text" as const, reason: conflictKeys.has(definition.id) ? "Conflicting explicit sources require resolution." : "No explicit permitted source is available." }));
  const context = input.assessment?.context ?? {};
  const sourceTrace = [...currentFacts.map((fact) => fact.source), ...resolved.trace, ...resolved.conflicts.flatMap((conflict) => conflict.sources)].filter((entry, index, all) => all.findIndex((candidate) => `${candidate.sourceType}:${candidate.sourceId}:${candidate.sourceField ?? ""}` === `${entry.sourceType}:${entry.sourceId}:${entry.sourceField ?? ""}`) === index);
  const policyIntent = { mayDefineNormativeRequirementsLater: true, currentStateIsNotPolicyStatement: true } as const;
  return {
    documentType: INFORMATION_ASSET_MANAGEMENT_POLICY_DOCUMENT_TYPE,
    templateVersion: INFORMATION_ASSET_MANAGEMENT_POLICY_TEMPLATE_VERSION,
    mappingVersion: INFORMATION_ASSET_MANAGEMENT_POLICY_ASSESSMENT_MAPPING_VERSION,
    generationContractVersion: INFORMATION_ASSET_MANAGEMENT_POLICY_GENERATION_CONTRACT_VERSION,
    currentFacts,
    policyIntent,
    assessmentFacts: currentFacts,
    semanticFacts,
    knownInputs: resolved.knownInputs,
    missingInputs,
    conflicts: resolved.conflicts,
    sectionReadiness: readinessFor(currentFacts, resolved.knownInputs, resolved.conflicts),
    sourcePriority: INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC.sourcePriority,
    sourceTrace,
    prohibitedInferences: INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC.forbiddenInferences,
    assetInventory: { assetInventoryExists: booleanOrUnknown(resolved.knownInputs.asset_register_exists), ownershipAssigned: stateFor(currentFacts, "o5_9_003") },
    classification: { classificationDefined: booleanOrUnknown(resolved.knownInputs.classification_defined), classificationApplied: stateFor(currentFacts, "o5_12_002"), classificationSchemeKnown: present(resolved.knownInputs.classification_scheme) ? true : "unknown", criticalityEvaluated: stateFor(currentFacts, "o5_12_003") },
    offPremisesAndByod: { allowsBYOD: booleanOrUnknown(context.allowsBYOD), allowsBYODForBusiness: booleanOrUnknown(context.allowsBYODForBusiness), usesEndpointsOffPremises: booleanOrUnknown(context.usesEndpointsOffPremises) },
    semanticGenerationContext: { facts: currentFacts, knownInputs: resolved.knownInputs, policyIntent },
  };
}

export function validateInformationAssetManagementPolicyGenerationContext(): string[] {
  const errors: string[] = [];
  if (INFORMATION_ASSET_MANAGEMENT_POLICY_ASSESSMENT_MAPPING.length !== 137) errors.push("mapping count");
  if (INFORMATION_ASSET_MANAGEMENT_POLICY_ASSESSMENT_MAPPING.filter((entry) => entry.conditionKey).length !== 41) errors.push("conditional count");
  if (new Set(INFORMATION_ASSET_MANAGEMENT_POLICY_ASSESSMENT_MAPPING.map((entry) => entry.questionId)).size !== 137) errors.push("duplicate mapping");
  if (INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC.sections.length !== 18) errors.push("section count");
  return errors;
}
