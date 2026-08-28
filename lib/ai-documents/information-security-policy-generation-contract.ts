import { organizationalControls } from "../../content/assessment/organizational/organizational-controls.ts";
import { employmentTermsQuestions, resolveEmploymentTermsQuestions } from "../../content/assessment/people/employment-terms.ts";
import { awarenessTrainingQuestions, resolveAwarenessTrainingQuestions } from "../../content/assessment/people/awareness-training.ts";
import { disciplinaryProcessQuestions, resolveDisciplinaryProcessQuestions } from "../../content/assessment/people/disciplinary-process.ts";
import { confidentialityAgreementsQuestions, resolveConfidentialityAgreementsQuestions } from "../../content/assessment/people/confidentiality-agreements.ts";
import { remoteWorkingQuestions, resolveRemoteWorkingQuestions } from "../../content/assessment/people/remote-working.ts";
import { eventReportingQuestions, resolveEventReportingQuestions } from "../../content/assessment/people/event-reporting.ts";
import { resolveOrganizationalControl, type OrganizationalContext } from "../assessment/organizational-controls.ts";
import { INFORMATION_SECURITY_POLICY_SPEC, INFORMATION_SECURITY_POLICY_TEMPLATE_VERSION, INFORMATION_SECURITY_POLICY_DOCUMENT_TYPE, INFORMATION_SECURITY_PRINCIPLES } from "./information-security-policy.ts";
import { canonicalAiDocumentType, type AiDocumentRegistryEntry } from "./registry.ts";

export const INFORMATION_SECURITY_POLICY_GENERATION_CONTRACT_VERSION = "1.0.0";
export const INFORMATION_SECURITY_POLICY_ASSESSMENT_MAPPING_VERSION = "1.0.0";

type Theme = "organizational" | "people";
type Relevance = "DIRECTLY_RELEVANT" | "CONTEXTUALLY_RELEVANT";
type QuestionType = "policy_process" | "application" | "proof_traceability" | "conditional";
type ContextValue = "yes" | "no" | "not_sure" | undefined;
type AssessmentAnswer = "implemented" | "partially_implemented" | "not_implemented" | "not_sure" | "not_applicable";

export type InformationSecurityPolicyAssessmentMappingEntry = {
  theme: Theme;
  controlId: string;
  questionId: string;
  questionType: QuestionType;
  relevance: Relevance;
  policySections: readonly string[];
  conditionKey?: string;
  visibilityRule: "visible_when_applicable" | "visible_when_condition_yes";
};

type MappingSeed = readonly [string, QuestionType, Relevance, readonly string[], string?];
const org = (controlId: string, rows: readonly MappingSeed[]) => rows.map(([questionId, questionType, relevance, policySections, conditionKey]) => ({ theme: "organizational" as const, controlId, questionId, questionType, relevance, policySections, ...(conditionKey ? { conditionKey, visibilityRule: "visible_when_condition_yes" as const } : { visibilityRule: "visible_when_applicable" as const }) }));
const people = (controlId: string, rows: readonly MappingSeed[]) => rows.map(([questionId, questionType, relevance, policySections, conditionKey]) => ({ theme: "people" as const, controlId, questionId, questionType, relevance, policySections, ...(conditionKey ? { conditionKey, visibilityRule: "visible_when_condition_yes" as const } : { visibilityRule: "visible_when_applicable" as const }) }));

export const INFORMATION_SECURITY_POLICY_ASSESSMENT_MAPPING: readonly InformationSecurityPolicyAssessmentMappingEntry[] = [
  ...org("a5-1", [["p5_1_001","policy_process","DIRECTLY_RELEVANT",["purpose","scope","management_commitment","information_security_policy_framework"]],["p5_1_002","application","DIRECTLY_RELEVANT",["communication_and_availability"]],["p5_1_003","proof_traceability","DIRECTLY_RELEVANT",["review_and_continual_improvement"]]]),
  ...org("a5-2", [["p5_2_001","policy_process","DIRECTLY_RELEVANT",["roles_and_responsibilities"]],["p5_2_002","application","DIRECTLY_RELEVANT",["roles_and_responsibilities"]],["p5_2_003","proof_traceability","DIRECTLY_RELEVANT",["roles_and_responsibilities","review_and_continual_improvement"]]]),
  ...org("a5-3", [["p5_3_001","policy_process","CONTEXTUALLY_RELEVANT",["roles_and_responsibilities"]],["p5_3_002","application","CONTEXTUALLY_RELEVANT",["roles_and_responsibilities"]],["p5_3_003","proof_traceability","CONTEXTUALLY_RELEVANT",["policy_compliance_and_exceptions"]],["p5_3_004_compensating","conditional","CONTEXTUALLY_RELEVANT",["policy_compliance_and_exceptions"],"cannotFullySegregateDuties"]]),
  ...org("a5-4", [["p5_4_001","policy_process","DIRECTLY_RELEVANT",["management_commitment"]],["p5_4_002","application","DIRECTLY_RELEVANT",["management_commitment","communication_and_availability"]],["p5_4_003","proof_traceability","DIRECTLY_RELEVANT",["monitoring_and_performance_evaluation"]]]),
  ...org("a5-5", [["p5_5_001","policy_process","CONTEXTUALLY_RELEVANT",["legal_regulatory_and_contractual_requirements"]],["p5_5_004_deadlines","conditional","CONTEXTUALLY_RELEVANT",["legal_regulatory_and_contractual_requirements"],"hasMandatoryAuthorityNotificationObligations"]]),
  ...org("a5-7", [["p5_7_001","policy_process","CONTEXTUALLY_RELEVANT",["information_security_risk_management"]],["p5_7_002","application","CONTEXTUALLY_RELEVANT",["information_security_risk_management"]],["p5_7_003","proof_traceability","CONTEXTUALLY_RELEVANT",["monitoring_and_performance_evaluation"]]]),
  ...org("a5-31", [["o5_31_001","policy_process","DIRECTLY_RELEVANT",["legal_regulatory_and_contractual_requirements"]],["o5_31_002","application","DIRECTLY_RELEVANT",["legal_regulatory_and_contractual_requirements","review_and_continual_improvement"]],["o5_31_003","proof_traceability","DIRECTLY_RELEVANT",["legal_regulatory_and_contractual_requirements","information_security_policy_framework"]],["o5_31_004_contractual","conditional","DIRECTLY_RELEVANT",["legal_regulatory_and_contractual_requirements"],"hasMaterialSecurityContractualObligations"],["o5_31_005_crypto_crossborder","conditional","DIRECTLY_RELEVANT",["legal_regulatory_and_contractual_requirements"],"hasCrossBorderOrCryptographyLegalExposure"]]),
  ...org("a5-33", [["o5_33_001","policy_process","CONTEXTUALLY_RELEVANT",["legal_regulatory_and_contractual_requirements"]],["o5_33_004_longterm","conditional","CONTEXTUALLY_RELEVANT",["legal_regulatory_and_contractual_requirements"],"hasLongTermOrRegulatedRecords"]]),
  ...org("a5-34", [["o5_34_001","policy_process","DIRECTLY_RELEVANT",["legal_regulatory_and_contractual_requirements"]],["o5_34_002","application","DIRECTLY_RELEVANT",["scope","legal_regulatory_and_contractual_requirements"]],["o5_34_003","proof_traceability","DIRECTLY_RELEVANT",["monitoring_and_performance_evaluation"]],["o5_34_004_dpo","conditional","DIRECTLY_RELEVANT",["roles_and_responsibilities"],"requiresFormalPrivacyOfficerOrDPO"],["o5_34_005_dpia","conditional","DIRECTLY_RELEVANT",["information_security_risk_management"],"conductsHighRiskPIIProcessing"],["o5_34_006_processors_transfers","conditional","DIRECTLY_RELEVANT",["legal_regulatory_and_contractual_requirements"],"usesPIIProcessorsOrCrossBorderTransfers"]]),
  ...org("a5-35", [["o5_35_001","policy_process","DIRECTLY_RELEVANT",["monitoring_and_performance_evaluation","review_and_continual_improvement"]],["o5_35_002","application","DIRECTLY_RELEVANT",["monitoring_and_performance_evaluation"]],["o5_35_003","proof_traceability","DIRECTLY_RELEVANT",["monitoring_and_performance_evaluation","review_and_continual_improvement"]],["o5_35_004_significant_change","conditional","DIRECTLY_RELEVANT",["review_and_continual_improvement"],"hasSignificantISMSChangeSinceLastIndependentReview"]]),
  ...org("a5-36", [["o5_36_001","policy_process","DIRECTLY_RELEVANT",["monitoring_and_performance_evaluation"]],["o5_36_002","application","DIRECTLY_RELEVANT",["policy_compliance_and_exceptions"]],["o5_36_003","proof_traceability","DIRECTLY_RELEVANT",["monitoring_and_performance_evaluation","review_and_continual_improvement"]],["o5_36_004_technical","conditional","DIRECTLY_RELEVANT",["monitoring_and_performance_evaluation"],"hasTechnicalSystemsRequiringComplianceReview"]]),
  ...people("a6-2", [["p6_2_001","policy_process","CONTEXTUALLY_RELEVANT",["roles_and_responsibilities"]],["p6_2_005_external","conditional","CONTEXTUALLY_RELEVANT",["legal_regulatory_and_contractual_requirements"],"hasExternalPersonnel"],["p6_2_005_change","conditional","CONTEXTUALLY_RELEVANT",["review_and_continual_improvement"],"hasSignificantChanges"]]),
  ...people("a6-3", [["p6_3_001","policy_process","DIRECTLY_RELEVANT",["security_awareness_and_competence"]],["p6_3_002","application","DIRECTLY_RELEVANT",["security_awareness_and_competence"]],["p6_3_003","proof_traceability","DIRECTLY_RELEVANT",["security_awareness_and_competence","monitoring_and_performance_evaluation"]],["p6_3_004_role_based","conditional","DIRECTLY_RELEVANT",["security_awareness_and_competence"],"hasRolesRequiringSpecializedTraining"],["p6_3_005_external","conditional","DIRECTLY_RELEVANT",["security_awareness_and_competence"],"hasRelevantExternalParties"]]),
  ...people("a6-4", [["p6_4_001","policy_process","CONTEXTUALLY_RELEVANT",["policy_compliance_and_exceptions"]],["p6_4_002","application","CONTEXTUALLY_RELEVANT",["communication_and_availability"]],["p6_4_004_external","conditional","CONTEXTUALLY_RELEVANT",["policy_compliance_and_exceptions"],"hasRelevantExternalParties"]]),
  ...people("a6-6", [["p6_6_001","policy_process","CONTEXTUALLY_RELEVANT",["legal_regulatory_and_contractual_requirements"]],["p6_6_004_external","conditional","CONTEXTUALLY_RELEVANT",["legal_regulatory_and_contractual_requirements"],"hasRelevantExternalParties"]]),
  ...people("a6-7", [["p6_7_001","policy_process","CONTEXTUALLY_RELEVANT",["scope"]],["p6_7_004_byod","conditional","CONTEXTUALLY_RELEVANT",["scope"],"hasBYODDevices"],["p6_7_005_high_risk_locations","conditional","CONTEXTUALLY_RELEVANT",["scope"],"hasHigherRiskLocations"]]),
  ...people("a6-8", [["p6_8_001","policy_process","CONTEXTUALLY_RELEVANT",["communication_and_availability"]],["p6_8_004_external","conditional","CONTEXTUALLY_RELEVANT",["communication_and_availability"],"hasRelevantExternalParties"]]),
];

export type AssessmentGenerationResponse = { theme: Theme | "physical" | "technological"; controlId: string; questionId: string; answer: AssessmentAnswer; justification?: string | null };
export type FactSourceTrace = { sourceType: "assessment" | "workspace" | "evidence_metadata" | "ai_documents_registry" | "document_setup" | "static_template"; sourceId: string; controlId?: string; responseState?: AssessmentAnswer; relevance?: Relevance; confidence: "explicit" | "derived" };
export type AssessmentFact = { capability: string; implementationState: "implemented" | "partial" | "absent" | "uncertain" | "not_applicable"; policyIntentAllowed: boolean; source: FactSourceTrace; policySections: readonly string[] };
export type MissingInput = { key: string; label: string; sectionId: string; required: boolean; reason: string; expectedType: "text" | "date" | "workspace_member" | "objectives" | "requirements" | "roles"; provenance: readonly FactSourceTrace[] };
export type SourceConflict = { key: string; values: readonly { value: unknown; source: FactSourceTrace }[] };
export type InformationSecurityPolicyGenerationContext = {
  template: { documentType: typeof INFORMATION_SECURITY_POLICY_DOCUMENT_TYPE; version: string };
  generationContract: { id: "information_security_policy_generation_contract"; version: string; mappingVersion: string };
  documentMetadata: Record<string, unknown>;
  organization: { name?: string };
  scope: { value?: string; exclusions?: string[] };
  managementCommitment: { processState?: AssessmentFact["implementationState"] };
  objectives: { objectivesProcessExists?: boolean; actualObjectives?: unknown };
  riskManagement: { processState?: AssessmentFact["implementationState"] };
  rolesAndResponsibilities: { processState?: AssessmentFact["implementationState"] };
  policyFramework: { referenceableDocuments: readonly string[]; draftDocuments: readonly string[] };
  awarenessAndCompetence: { programmeState?: AssessmentFact["implementationState"] };
  legalRegulatoryContractual: { legalRegisterExists?: boolean; knownApplicableRequirements?: unknown };
  monitoringAndEvaluation: { monitoringProcessExists?: boolean; specificMetrics: "unknown" };
  complianceAndExceptions: { processState?: AssessmentFact["implementationState"] };
  communication: { communicationProcessExists?: boolean; knownChannels?: unknown };
  reviewAndImprovement: { plannedReviewExists?: boolean; reviewDate?: string; reviewFrequency: "unknown" };
  currentFacts: readonly AssessmentFact[];
  policyIntent: { normativeRequirementsMayBeGeneratedLater: true; currentStateMustNotBePresentedAsPolicyState: true };
  assessmentFacts: readonly AssessmentFact[];
  missingInputs: readonly MissingInput[];
  conflicts: readonly SourceConflict[];
  sectionReadiness: Record<string, "ready" | "partial" | "blocked">;
  prohibitedInferences: readonly string[];
  sourceTrace: readonly FactSourceTrace[];
  knownInputs: Record<string, unknown>;
  semanticFacts: Record<string, unknown[]>;
};

export type GenerationContractInput = {
  workspace?: { organizationName?: string; ismsScope?: string; scopeExclusions?: string[]; organizationContext?: { country?: string; sector?: string; company_size?: string } };
  documentSetup?: Record<string, unknown>;
  registry?: readonly AiDocumentRegistryEntry[];
  assessment?: { responses: readonly AssessmentGenerationResponse[]; organizationalContext?: OrganizationalContext; peopleContext?: Record<string, ContextValue> };
};

const present = (value: unknown) => typeof value === "string" ? value.trim().length > 0 : Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null;
const state = (answer: AssessmentAnswer): AssessmentFact["implementationState"] => answer === "partially_implemented" ? "partial" : answer === "not_implemented" ? "absent" : answer === "not_sure" ? "uncertain" : answer;
const capability = (questionId: string) => questionId.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "").toLowerCase();
function nextDocumentVersion(registry: readonly AiDocumentRegistryEntry[]): string {
  const versions = registry
    .filter((entry) => entry.documentType === INFORMATION_SECURITY_POLICY_DOCUMENT_TYPE)
    .map((entry) => entry.activeDocument?.version ?? "")
    .map((value) => value.match(/^v?(\d+)$/i)?.[1])
    .filter((value): value is string => Boolean(value))
    .map(Number);
  return `V${(versions.length ? Math.max(...versions) : 0) + 1}`;
}
const sectionForInput: Record<string, string> = { organization_name: "document_control", document_classification: "document_control", approver: "approval", policy_owner: "document_control", review_plan: "review_and_continual_improvement", security_objectives: "information_security_objectives", security_roles: "roles_and_responsibilities", legal_requirements: "legal_regulatory_and_contractual_requirements" };
const expectedType: Record<string, MissingInput["expectedType"]> = { approver: "workspace_member", review_plan: "date", security_objectives: "objectives", security_roles: "roles", legal_requirements: "requirements" };

function peopleVisible(controlId: string, context: Record<string, ContextValue>): string[] {
  if (controlId === "a6-2") return resolveEmploymentTermsQuestions(context as never).questionIds;
  if (controlId === "a6-3") return resolveAwarenessTrainingQuestions(context as never).questionIds;
  if (controlId === "a6-4") return resolveDisciplinaryProcessQuestions(context as never).questionIds;
  if (controlId === "a6-6") return resolveConfidentialityAgreementsQuestions(context as never).questionIds;
  if (controlId === "a6-7") return resolveRemoteWorkingQuestions(context as never).questionIds;
  return resolveEventReportingQuestions(context as never).questionIds;
}

function catalogQuestion(controlId: string, questionId: string, theme: Theme) {
  if (theme === "organizational") return organizationalControls.find((control) => control.id === controlId)?.questions.find((question) => question.id === questionId);
  const source = controlId === "a6-2" ? employmentTermsQuestions : controlId === "a6-3" ? awarenessTrainingQuestions : controlId === "a6-4" ? disciplinaryProcessQuestions : controlId === "a6-6" ? confidentialityAgreementsQuestions : controlId === "a6-7" ? remoteWorkingQuestions : eventReportingQuestions;
  return source.find((question) => question.id === questionId);
}

export function validateInformationSecurityPolicyAssessmentMapping(mapping = INFORMATION_SECURITY_POLICY_ASSESSMENT_MAPPING): string[] {
  const errors: string[] = [];
  if (mapping.length !== 57) errors.push(`expected 57 entries, found ${mapping.length}`);
  if (mapping.filter((entry) => entry.theme === "organizational").length !== 39) errors.push("organizational count");
  if (mapping.filter((entry) => entry.theme === "people").length !== 18) errors.push("people count");
  if (mapping.filter((entry) => entry.relevance === "DIRECTLY_RELEVANT").length !== 33) errors.push("direct relevance count");
  if (mapping.filter((entry) => entry.relevance === "CONTEXTUALLY_RELEVANT").length !== 24) errors.push("context relevance count");
  if (new Set(mapping.map((entry) => `${entry.theme}:${entry.questionId}`)).size !== mapping.length) errors.push("duplicate mapping id");
  for (const entry of mapping) {
    const question = catalogQuestion(entry.controlId, entry.questionId, entry.theme);
    if (!question) { errors.push(`missing runtime question:${entry.questionId}`); continue; }
    if (question.type !== entry.questionType) errors.push(`question type mismatch:${entry.questionId}`);
    if ((question.conditionKey ?? undefined) !== entry.conditionKey) errors.push(`condition key mismatch:${entry.questionId}`);
  }
  return errors;
}

export function prepareInformationSecurityPolicyGenerationContext(input: GenerationContractInput): InformationSecurityPolicyGenerationContext {
  const setup = input.documentSetup ?? {}; const workspace = input.workspace ?? {}; const assessment = input.assessment ?? { responses: [] };
  const visibleOrg = new Map<string, Set<string>>(); const visiblePeople = new Map<string, Set<string>>();
  for (const entry of INFORMATION_SECURITY_POLICY_ASSESSMENT_MAPPING) {
    if (entry.theme === "organizational" && !visibleOrg.has(entry.controlId)) visibleOrg.set(entry.controlId, new Set(resolveOrganizationalControl(entry.controlId as never, assessment.organizationalContext ?? {}).questionIds));
    if (entry.theme === "people" && !visiblePeople.has(entry.controlId)) visiblePeople.set(entry.controlId, new Set(peopleVisible(entry.controlId, assessment.peopleContext ?? {})));
  }
  const byResponse = new Map(assessment.responses.map((response) => [`${response.theme}:${response.questionId}`, response]));
  const currentFacts: AssessmentFact[] = [];
  for (const entry of INFORMATION_SECURITY_POLICY_ASSESSMENT_MAPPING) {
    const visible = entry.theme === "organizational" ? visibleOrg.get(entry.controlId)?.has(entry.questionId) : visiblePeople.get(entry.controlId)?.has(entry.questionId);
    const response = byResponse.get(`${entry.theme}:${entry.questionId}`);
    if (!visible || !response || (response.answer === "not_applicable" && !response.justification?.trim())) continue;
    currentFacts.push({ capability: capability(entry.questionId), implementationState: state(response.answer), policyIntentAllowed: true, policySections: entry.policySections, source: { sourceType: "assessment", sourceId: entry.questionId, controlId: entry.controlId, responseState: response.answer, relevance: entry.relevance, confidence: "explicit" } });
  }
  const trace: FactSourceTrace[] = [...currentFacts.map((fact) => fact.source)];
  const semanticFacts: Record<string, unknown[]> = {};
  for (const fact of currentFacts) {
    const rawResponse = assessment.responses.find((r) => r.questionId === fact.source.sourceId);
    for (const section of fact.policySections) {
      if (!semanticFacts[section]) semanticFacts[section] = [];
      semanticFacts[section].push({
        implementationState: fact.implementationState,
        assessmentBasis: rawResponse?.answer === "not_applicable" ? "Applicability was reviewed and justified." : "Assessment response recorded.",
        justificationProvided: Boolean(rawResponse?.justification?.trim()),
      });
    }
  }
  const policy = (input.registry ?? []).filter((entry) => ["access_control_policy","information_asset_management_policy","incident_management_procedure","backup_and_recovery_policy"].includes(canonicalAiDocumentType(entry.documentType) ?? ""));
  const referenceableDocuments = policy.filter((entry) => entry.status === "finalized" || entry.status === "already_available").map((entry) => entry.documentType);
  const draftDocuments = policy.filter((entry) => entry.status === "draft").map((entry) => entry.documentType);
  const frameworkDocuments = policy.map((entry) => ({ documentType: canonicalAiDocumentType(entry.documentType) ?? entry.documentType, status: entry.status }));
  for (const entry of policy) trace.push({ sourceType: "ai_documents_registry", sourceId: entry.documentType, confidence: "explicit" });
  const evidencePolicy = (input.registry ?? []).find((entry) => entry.documentType === INFORMATION_SECURITY_POLICY_DOCUMENT_TYPE)?.activeDocument;
  
  // Safe extraction of onboarding
  let onboarding: Record<string, unknown> = {};
  if (assessment && (assessment as Record<string, unknown>).technologicalContext) {
    const tech = (assessment as Record<string, unknown>).technologicalContext as Record<string, unknown>;
    if (tech.onboarding) {
      onboarding = tech.onboarding as Record<string, unknown>;
    }
  }
  
  const candidates: Record<string, Array<{ value: unknown; source: FactSourceTrace }>> = {
    organization_name: workspace.organizationName ? [{ value: workspace.organizationName, source: { sourceType: "workspace", sourceId: "organizationName", confidence: "explicit" } }] : [],
    policy_owner: evidencePolicy?.documentOwnerId ? [{ value: evidencePolicy.documentOwnerId, source: { sourceType: "evidence_metadata", sourceId: evidencePolicy.id, confidence: "explicit" } }] : ((onboarding.assessment_owner as Record<string, unknown>)?.full_name ? [{ value: (onboarding.assessment_owner as Record<string, unknown>).full_name, source: { sourceType: "workspace", sourceId: "onboarding", confidence: "derived" } }] : []),
    approver: (onboarding.assessment_owner as Record<string, unknown>)?.full_name ? [{ value: (onboarding.assessment_owner as Record<string, unknown>).full_name, source: { sourceType: "workspace", sourceId: "onboarding", confidence: "derived" } }] : [],
    document_classification: onboarding.document_classification ? [{ value: onboarding.document_classification, source: { sourceType: "workspace", sourceId: "onboarding", confidence: "explicit" } }] : [],
    review_plan: evidencePolicy?.reviewDate ? [{ value: evidencePolicy.reviewDate, source: { sourceType: "evidence_metadata", sourceId: evidencePolicy.id, confidence: "explicit" } }] : [],
  };
  for (const [key, value] of Object.entries(workspace.organizationContext ?? {})) {
    if (present(value)) candidates[key] = [{ value, source: { sourceType: "workspace", sourceId: `organizationContext.${key}`, confidence: "explicit" } }];
  }
  for (const key of ["organization_name","document_classification","approver","policy_owner","review_plan","security_objectives","security_roles","legal_requirements","scope_exclusions","communication_channel","document_id","version","effective_date","prepared_by","reviewed_by","approved_by","approval_date","revision_history"]) if (present(setup[key])) (candidates[key] ??= []).push({ value: setup[key], source: { sourceType: "document_setup", sourceId: key, confidence: "explicit" } });
  if (workspace.ismsScope) (candidates.scope ??= []).push({ value: workspace.ismsScope, source: { sourceType: "workspace", sourceId: "ismsScope", confidence: "explicit" } });
  if (workspace.scopeExclusions?.length) (candidates.scope_exclusions ??= []).push({ value: workspace.scopeExclusions, source: { sourceType: "workspace", sourceId: "scopeExclusions", confidence: "explicit" } });
  const conflicts: SourceConflict[] = []; const values: Record<string, unknown> = {};
  for (const [key, options] of Object.entries(candidates)) {
      const explicitSetup = options.find(o => o.source.sourceType === "document_setup");
      if (explicitSetup) {
        const distinct = new Set(options.map((item) => JSON.stringify(item.value)));
        if (distinct.size > 1) conflicts.push({ key, values: options });
        values[key] = explicitSetup.value;
        trace.push(explicitSetup.source);
        continue;
      }
      const distinct = new Set(options.map((item) => JSON.stringify(item.value)));
      if (distinct.size > 1) { conflicts.push({ key, values: options }); continue; }
      if (options[0]) { values[key] = options[0].value; trace.push(options[0].source); }
    }
  if (!present(values.document_classification)) {
    values.document_classification = "to be defined";
    trace.push({ sourceType: "document_setup", sourceId: "fallback_classification", confidence: "derived" });
  }
  if (!present(values.review_plan)) {
    values.review_plan = "to be defined";
    trace.push({ sourceType: "document_setup", sourceId: "fallback_review_plan", confidence: "derived" });
  }
  if (!present(values.version)) {
    values.version = nextDocumentVersion(input.registry ?? []);
    trace.push({ sourceType: "ai_documents_registry", sourceId: "next_document_version", confidence: "derived" });
  }

  values.information_security_principles = INFORMATION_SECURITY_PRINCIPLES;
  values.policy_framework_documents = frameworkDocuments;
  const has = (questionId: string, states: AssessmentFact["implementationState"][] = ["implemented","partial"]) => currentFacts.some((fact) => fact.source.sourceId === questionId && states.includes(fact.implementationState));
  const required = INFORMATION_SECURITY_POLICY_SPEC.requiredInputs;
  const missingInputs: MissingInput[] = required.filter((definition) => !present(values[definition.id])).map((definition) => ({ key: definition.id, label: definition.label, sectionId: sectionForInput[definition.id] ?? "document_control", required: true, reason: conflicts.some((conflict) => conflict.key === definition.id) ? "Conflicting explicit sources require resolution." : "No explicit, permitted source is available.", expectedType: expectedType[definition.id] ?? "text", provenance: conflicts.find((conflict) => conflict.key === definition.id)?.values.map((value) => value.source) ?? [] }));
  const readiness: Record<string, "ready" | "partial" | "blocked"> = {};
  for (const section of INFORMATION_SECURITY_POLICY_SPEC.sections) {
    if (section.id === "information_security_principles") { readiness[section.id] = "ready"; continue; }
    const missing = section.requiredInputs.filter((key) => !present(values[key])); readiness[section.id] = missing.length ? (section.allowOmission ? "partial" : "blocked") : "ready";
  }
  return { template: { documentType: INFORMATION_SECURITY_POLICY_DOCUMENT_TYPE, version: INFORMATION_SECURITY_POLICY_TEMPLATE_VERSION }, generationContract: { id: "information_security_policy_generation_contract", version: INFORMATION_SECURITY_POLICY_GENERATION_CONTRACT_VERSION, mappingVersion: INFORMATION_SECURITY_POLICY_ASSESSMENT_MAPPING_VERSION }, documentMetadata: { classification: values.document_classification, documentId: values.document_id, version: values.version, effectiveDate: values.effective_date, reviewDate: values.review_plan, owner: values.policy_owner }, organization: { name: values.organization_name as string | undefined }, scope: { value: values.scope as string | undefined, exclusions: values.scope_exclusions as string[] | undefined }, managementCommitment: { processState: currentFacts.find((fact) => fact.source.sourceId === "p5_4_001")?.implementationState }, objectives: { actualObjectives: values.security_objectives }, riskManagement: { processState: currentFacts.find((fact) => fact.source.sourceId === "p5_7_001")?.implementationState }, rolesAndResponsibilities: { processState: currentFacts.find((fact) => fact.source.sourceId === "p5_2_001")?.implementationState }, policyFramework: { referenceableDocuments, draftDocuments }, awarenessAndCompetence: { programmeState: currentFacts.find((fact) => fact.source.sourceId === "p6_3_001")?.implementationState }, legalRegulatoryContractual: { legalRegisterExists: has("o5_31_001"), knownApplicableRequirements: values.legal_requirements }, monitoringAndEvaluation: { monitoringProcessExists: has("o5_35_001") || has("o5_36_001"), specificMetrics: "unknown" }, complianceAndExceptions: { processState: currentFacts.find((fact) => fact.source.sourceId === "o5_36_002")?.implementationState }, communication: { communicationProcessExists: has("p5_1_002"), knownChannels: values.communication_channel }, reviewAndImprovement: { plannedReviewExists: has("p5_1_003") || has("o5_35_001"), reviewDate: values.review_plan as string | undefined, reviewFrequency: "unknown" }, currentFacts, policyIntent: { normativeRequirementsMayBeGeneratedLater: true, currentStateMustNotBePresentedAsPolicyState: true }, assessmentFacts: currentFacts, missingInputs, conflicts, sectionReadiness: readiness, prohibitedInferences: INFORMATION_SECURITY_POLICY_SPEC.forbiddenInferences, sourceTrace: trace, knownInputs: values, semanticFacts };
}
