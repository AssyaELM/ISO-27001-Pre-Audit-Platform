import { resolveAwarenessTrainingQuestions } from "../../content/assessment/people/awareness-training.ts";
import { resolveDisciplinaryProcessQuestions } from "../../content/assessment/people/disciplinary-process.ts";
import { resolveEventReportingQuestions } from "../../content/assessment/people/event-reporting.ts";
import { resolveOrganizationalControl, type OrganizationalContext } from "../assessment/organizational-controls.ts";
import { resolveTechnologicalAssessmentContext, resolveTechnologicalControl } from "../assessment/technological-controls.ts";
import {
  INCIDENT_MANAGEMENT_PROCEDURE_DOCUMENT_TYPE,
  INCIDENT_MANAGEMENT_PROCEDURE_SPEC,
  INCIDENT_MANAGEMENT_PROCEDURE_TEMPLATE_VERSION,
} from "./incident-management-procedure.ts";
import {
  INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING,
  INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING_VERSION,
  type IncidentManagementProcedureRelevance,
} from "./incident-management-procedure-assessment-mapping.ts";
import type { AiDocumentRegistryEntry } from "./registry.ts";

export const INCIDENT_MANAGEMENT_PROCEDURE_GENERATION_CONTRACT_VERSION = "1.0.0";

type AssessmentAnswer = "implemented" | "partially_implemented" | "not_implemented" | "not_sure" | "not_applicable";
type ImplementationState = "implemented" | "partial" | "absent" | "uncertain" | "not_applicable";
type ContextDecision = "yes" | "no" | "not_sure" | undefined;
type SemanticGroup =
  | "rolesAndResponsibilities" | "preparationAndReadiness" | "reporting" | "eventAssessment"
  | "incidentDeclaration" | "classificationAndPrioritization" | "escalationAndCommunication"
  | "investigation" | "containmentAndCorrectiveAction" | "recoveryAndClosure" | "evidenceHandling"
  | "lessonsLearned" | "recordsAndMonitoring";

export type IncidentManagementAssessmentResponse = {
  theme: "organizational" | "people" | "technological" | "physical";
  controlId: string;
  questionId: string;
  answer: AssessmentAnswer;
  justification?: string | null;
};

export type IncidentManagementSourceTrace = {
  sourceType: "assessment" | "workspace" | "evidence_metadata" | "ai_documents_registry" | "document_setup" | "static_template";
  sourceId: string;
  controlId?: string;
  relevance?: IncidentManagementProcedureRelevance;
  implementationState?: ImplementationState;
  sourceField?: string;
};

export type IncidentManagementSemanticFact = {
  capability: string;
  implementationState: ImplementationState;
  procedureSections: readonly string[];
  source: IncidentManagementSourceTrace;
};

export type IncidentManagementProcedureGenerationContext = {
  templateVersion: typeof INCIDENT_MANAGEMENT_PROCEDURE_TEMPLATE_VERSION;
  mappingVersion: typeof INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING_VERSION;
  generationContractVersion: typeof INCIDENT_MANAGEMENT_PROCEDURE_GENERATION_CONTRACT_VERSION;
  documentType: typeof INCIDENT_MANAGEMENT_PROCEDURE_DOCUMENT_TYPE;
  currentFacts: readonly IncidentManagementSemanticFact[];
  procedureIntent: { mayDefineNormativeRequirementsLater: true; currentStateIsNotProcedureStatement: true };
  assessmentFacts: readonly IncidentManagementSemanticFact[];
  semanticFacts: Record<SemanticGroup, readonly IncidentManagementSemanticFact[]>;
  eventModel: { reportedEventIsNotConfirmedIncident: true; assessmentState?: ImplementationState; incidentDeclarationState?: ImplementationState };
  knownInputs: Record<string, unknown>;
  missingInputs: readonly IncidentManagementMissingInput[];
  conflicts: readonly IncidentManagementSourceConflict[];
  sectionReadiness: Record<string, "ready" | "partial" | "blocked">;
  sourcePriority: typeof INCIDENT_MANAGEMENT_PROCEDURE_SPEC.sourcePriority;
  knownContext: { notificationObligationsExist: boolean | "unknown"; knownNotificationRequirements: unknown; reportingChannels: unknown; metricsProcessExists: boolean | "unknown"; knownMetrics: "unknown" };
  sourceTrace: readonly IncidentManagementSourceTrace[];
  prohibitedInferences: readonly string[];
  generationSnapshot: { sourceSnapshot: readonly IncidentManagementSourceTrace[]; generatedAt: null; provider: null; model: null };
};

export type IncidentManagementMissingInput = {
  key: string;
  label: string;
  sectionId: string;
  required: boolean;
  expectedType: "text" | "date" | "workspace_member";
  reason: string;
  provenance: readonly IncidentManagementSourceTrace[];
};

export type IncidentManagementSourceConflict = {
  key: string;
  candidates: readonly { value: unknown; source: IncidentManagementSourceTrace }[];
  resolution: "resolved_by_source_priority" | "unresolved";
  selectedSource?: IncidentManagementSourceTrace;
};

export type IncidentManagementEvidenceMetadata = {
  id: string;
  documentType?: string | null;
  classification?: string | null;
  documentOwnerId?: string | null;
  reviewDate?: string | null;
};

export type IncidentManagementProcedureGenerationInput = {
  workspace?: { organizationName?: string };
  documentSetup?: Record<string, unknown>;
  evidenceMetadata?: readonly IncidentManagementEvidenceMetadata[];
  registry?: readonly AiDocumentRegistryEntry[];
  assessment?: {
    responses: readonly IncidentManagementAssessmentResponse[];
    organizationalContext?: OrganizationalContext;
    peopleContext?: Record<string, ContextDecision>;
    technologicalContext?: { persisted?: Record<string, unknown>; onboarding?: Record<string, unknown>; shared?: Record<string, unknown>; crossTheme?: Record<string, unknown> };
  };
};

const implementationState = (answer: AssessmentAnswer): ImplementationState =>
  answer === "partially_implemented" ? "partial" : answer === "not_implemented" ? "absent" : answer === "not_sure" ? "uncertain" : answer;

const semanticGroupsFor = (sections: readonly string[]): SemanticGroup[] => {
  const groups = new Set<SemanticGroup>();
  for (const section of sections) {
    if (section === "roles_and_responsibilities") groups.add("rolesAndResponsibilities");
    if (section === "preparation_and_readiness") groups.add("preparationAndReadiness");
    if (section === "event_and_incident_reporting") groups.add("reporting");
    if (section === "event_assessment_and_incident_declaration") { groups.add("eventAssessment"); groups.add("incidentDeclaration"); }
    if (section === "classification_severity_and_prioritization") groups.add("classificationAndPrioritization");
    if (section === "escalation_and_communication") groups.add("escalationAndCommunication");
    if (section === "investigation_and_diagnosis") groups.add("investigation");
    if (section === "containment_eradication_and_corrective_action") groups.add("containmentAndCorrectiveAction");
    if (section === "recovery_and_closure") groups.add("recoveryAndClosure");
    if (section === "evidence_collection_and_preservation") groups.add("evidenceHandling");
    if (section === "post_incident_review_and_lessons_learned") groups.add("lessonsLearned");
    if (section === "records_monitoring_and_metrics") groups.add("recordsAndMonitoring");
  }
  return [...groups];
};

const present = (value: unknown) => typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
const requiredSection: Record<string, string> = {
  organization_name: "document_control", classification: "document_control", approved_by: "procedure_review_and_approval", review_date: "procedure_review_and_approval",
};
const requiredType: Record<string, IncidentManagementMissingInput["expectedType"]> = {
  organization_name: "text", classification: "text", approved_by: "workspace_member", review_date: "date",
};
const sourceRank: Record<IncidentManagementSourceTrace["sourceType"], number> = {
  workspace: 0, assessment: 1, evidence_metadata: 2, ai_documents_registry: 3, document_setup: 4, static_template: 6,
};

function resolveKnownInputs(input: IncidentManagementProcedureGenerationInput, assessmentNotification: boolean | "unknown") {
  const candidates = new Map<string, Array<{ value: unknown; source: IncidentManagementSourceTrace }>>();
  const add = (key: string, value: unknown, source: IncidentManagementSourceTrace) => {
    if (!present(value)) return;
    const bucket = candidates.get(key) ?? [];
    bucket.push({ value, source }); candidates.set(key, bucket);
  };
  add("organization_name", input.workspace?.organizationName, { sourceType: "workspace", sourceId: "organization_name", sourceField: "organizationName" });
  for (const [key, value] of Object.entries(input.documentSetup ?? {})) add(key, value, { sourceType: "document_setup", sourceId: key, sourceField: key });
  for (const evidence of input.evidenceMetadata ?? []) {
    if (evidence.documentType !== INCIDENT_MANAGEMENT_PROCEDURE_DOCUMENT_TYPE) continue;
    add("classification", evidence.classification, { sourceType: "evidence_metadata", sourceId: evidence.id, sourceField: "classification" });
    add("document_owner", evidence.documentOwnerId, { sourceType: "evidence_metadata", sourceId: evidence.id, sourceField: "documentOwnerId" });
    add("review_date", evidence.reviewDate, { sourceType: "evidence_metadata", sourceId: evidence.id, sourceField: "reviewDate" });
  }
  const registryDocument = input.registry?.find((item) => item.documentType === INCIDENT_MANAGEMENT_PROCEDURE_DOCUMENT_TYPE)?.activeDocument;
  if (registryDocument) {
    add("document_owner", registryDocument.documentOwnerId, { sourceType: "ai_documents_registry", sourceId: registryDocument.id, sourceField: "documentOwnerId" });
    add("review_date", registryDocument.reviewDate, { sourceType: "ai_documents_registry", sourceId: registryDocument.id, sourceField: "reviewDate" });
  }
  if (assessmentNotification !== "unknown") add("notification_obligations", assessmentNotification, { sourceType: "assessment", sourceId: "hasMandatoryAuthorityNotificationObligations", sourceField: "organizationalContext" });

  const knownInputs: Record<string, unknown> = {};
  const conflicts: IncidentManagementSourceConflict[] = [];
  const trace: IncidentManagementSourceTrace[] = [];
  for (const [key, options] of candidates) {
    const ranks = [...new Set(options.map((option) => sourceRank[option.source.sourceType]))].sort((a, b) => a - b);
    const topRank = ranks[0];
    const top = options.filter((option) => sourceRank[option.source.sourceType] === topRank);
    const topValues = new Set(top.map((option) => JSON.stringify(option.value)));
    if (topValues.size > 1) {
      conflicts.push({ key, candidates: options, resolution: "unresolved" });
      continue;
    }
    const selected = top[0];
    knownInputs[key] = selected.value;
    trace.push(selected.source);
    if (new Set(options.map((option) => JSON.stringify(option.value))).size > 1) {
      conflicts.push({ key, candidates: options, resolution: "resolved_by_source_priority", selectedSource: selected.source });
    }
  }
  return { knownInputs, conflicts, trace };
}

function readinessFor(
  facts: readonly IncidentManagementSemanticFact[],
  knownInputs: Record<string, unknown>,
): Record<string, "ready" | "partial" | "blocked"> {
  const readiness = {} as Record<string, "ready" | "partial" | "blocked">;
  const hasSectionFact = (section: string) => facts.some((fact) => fact.procedureSections.includes(section));
  for (const section of INCIDENT_MANAGEMENT_PROCEDURE_SPEC.sections) {
    if (section.id === "document_control") {
      readiness[section.id] = ["organization_name", "classification"].every((key) => present(knownInputs[key])) ? "ready" : "blocked";
    } else if (section.id === "procedure_review_and_approval") {
      readiness[section.id] = ["approved_by", "review_date"].every((key) => present(knownInputs[key])) ? "ready" : "blocked";
    } else if (["terms_and_definitions", "incident_management_principles", "purpose"].includes(section.id)) {
      readiness[section.id] = "ready";
    } else if (section.id === "scope") {
      readiness[section.id] = present(knownInputs.scope) ? "ready" : "partial";
    } else if (hasSectionFact(section.id)) {
      readiness[section.id] = "ready";
    } else {
      readiness[section.id] = "partial";
    }
  }
  return readiness;
}

function visibleQuestionIds(input: IncidentManagementProcedureGenerationInput): Map<string, Set<string>> {
  const assessment = input.assessment ?? { responses: [] };
  const visible = new Map<string, Set<string>>();
  const organizationalContext = assessment.organizationalContext ?? {};
  const peopleContext = assessment.peopleContext ?? {};
  const tech = assessment.technologicalContext ?? {};
  const technologicalContext = resolveTechnologicalAssessmentContext(tech.persisted, tech.onboarding, tech.shared, tech.crossTheme);

  for (const mapping of INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING) {
    const key = `${mapping.theme}:${mapping.controlId}`;
    if (visible.has(key)) continue;
    const questionIds = mapping.theme === "organizational"
      ? resolveOrganizationalControl(mapping.controlId as never, organizationalContext).questionIds
      : mapping.theme === "technological"
        ? resolveTechnologicalControl(mapping.controlId as never, technologicalContext).questionIds
        : mapping.controlId === "a6-3"
          ? resolveAwarenessTrainingQuestions(peopleContext as never).questionIds
          : mapping.controlId === "a6-4"
            ? resolveDisciplinaryProcessQuestions(peopleContext as never).questionIds
            : resolveEventReportingQuestions(peopleContext as never).questionIds;
    visible.set(key, new Set(questionIds));
  }
  return visible;
}

export function prepareIncidentManagementProcedureGenerationContext(input: IncidentManagementProcedureGenerationInput): IncidentManagementProcedureGenerationContext {
  const visible = visibleQuestionIds(input);
  const responses = input.assessment?.responses ?? [];
  const responseByQuestion = new Map(responses.map((response) => [`${response.theme}:${response.questionId}`, response]));
  const currentFacts: IncidentManagementSemanticFact[] = [];

  for (const mapping of INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING) {
    const response = responseByQuestion.get(`${mapping.theme}:${mapping.questionId}`);
    if (!response || !visible.get(`${mapping.theme}:${mapping.controlId}`)?.has(mapping.questionId)) continue;
    if (response.answer === "not_applicable" && !response.justification?.trim()) continue;
    const state = implementationState(response.answer);
    currentFacts.push({
      capability: mapping.questionId,
      implementationState: state,
      procedureSections: mapping.procedureSections,
      source: { sourceType: "assessment", sourceId: mapping.questionId, controlId: mapping.controlId, relevance: mapping.relevance, implementationState: state },
    });
  }

  const semanticFacts = {
    rolesAndResponsibilities: [], preparationAndReadiness: [], reporting: [], eventAssessment: [], incidentDeclaration: [],
    classificationAndPrioritization: [], escalationAndCommunication: [], investigation: [], containmentAndCorrectiveAction: [],
    recoveryAndClosure: [], evidenceHandling: [], lessonsLearned: [], recordsAndMonitoring: [],
  } as Record<SemanticGroup, IncidentManagementSemanticFact[]>;
  for (const fact of currentFacts) for (const group of semanticGroupsFor(fact.procedureSections)) semanticFacts[group].push(fact);

  const stateFor = (questionId: string) => currentFacts.find((fact) => fact.source.sourceId === questionId)?.implementationState;
  const notificationObligationsContext = input.assessment?.organizationalContext?.hasMandatoryAuthorityNotificationObligations;
  const assessmentNotification = notificationObligationsContext === "yes" ? true : notificationObligationsContext === "no" ? false : "unknown";
  const resolvedInputs = resolveKnownInputs(input, assessmentNotification);
  const conflictByKey = new Map(resolvedInputs.conflicts.map((conflict) => [conflict.key, conflict]));
  const missingInputs: IncidentManagementMissingInput[] = INCIDENT_MANAGEMENT_PROCEDURE_SPEC.requiredInputs
    .filter((definition) => !present(resolvedInputs.knownInputs[definition.id]))
    .map((definition) => ({
      key: definition.id,
      label: definition.label,
      sectionId: requiredSection[definition.id] ?? "document_control",
      required: true,
      expectedType: requiredType[definition.id] ?? "text",
      reason: conflictByKey.has(definition.id) ? "Conflicting explicit sources require resolution." : "No explicit permitted source is available.",
      provenance: conflictByKey.get(definition.id)?.candidates.map((candidate) => candidate.source) ?? [],
    }));
  const sourceTrace = [...currentFacts.map((fact) => fact.source), ...resolvedInputs.trace, ...resolvedInputs.conflicts.flatMap((conflict) => conflict.candidates.map((candidate) => candidate.source))]
    .filter((trace, index, all) => all.findIndex((candidate) => `${candidate.sourceType}:${candidate.sourceId}:${candidate.sourceField ?? ""}` === `${trace.sourceType}:${trace.sourceId}:${trace.sourceField ?? ""}`) === index);
  const notificationValue = resolvedInputs.knownInputs.notification_obligations;
  const notificationObligationsExist = notificationValue === true || notificationValue === "yes" ? true : notificationValue === false || notificationValue === "no" ? false : "unknown";
  const metricsState = stateFor("p8_16_001");
  return {
    templateVersion: INCIDENT_MANAGEMENT_PROCEDURE_TEMPLATE_VERSION,
    mappingVersion: INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING_VERSION,
    generationContractVersion: INCIDENT_MANAGEMENT_PROCEDURE_GENERATION_CONTRACT_VERSION,
    documentType: INCIDENT_MANAGEMENT_PROCEDURE_DOCUMENT_TYPE,
    currentFacts,
    procedureIntent: { mayDefineNormativeRequirementsLater: true, currentStateIsNotProcedureStatement: true },
    assessmentFacts: currentFacts,
    semanticFacts,
    knownInputs: resolvedInputs.knownInputs,
    missingInputs,
    conflicts: resolvedInputs.conflicts,
    sectionReadiness: readinessFor(currentFacts, resolvedInputs.knownInputs),
    sourcePriority: INCIDENT_MANAGEMENT_PROCEDURE_SPEC.sourcePriority,
    eventModel: {
      reportedEventIsNotConfirmedIncident: true,
      assessmentState: stateFor("p5_25_001"),
      incidentDeclarationState: stateFor("p5_25_002"),
    },
    knownContext: {
      notificationObligationsExist,
      knownNotificationRequirements: resolvedInputs.knownInputs.external_notification_requirements ?? "unknown",
      reportingChannels: resolvedInputs.knownInputs.reporting_channels ?? "unknown",
      metricsProcessExists: metricsState === "implemented" || metricsState === "partial" ? true : metricsState === "absent" ? false : "unknown",
      knownMetrics: "unknown",
    },
    sourceTrace,
    prohibitedInferences: INCIDENT_MANAGEMENT_PROCEDURE_SPEC.forbiddenInferences,
    generationSnapshot: { sourceSnapshot: sourceTrace, generatedAt: null, provider: null, model: null },
  };
}

export function validateIncidentManagementProcedureGenerationContextCore(): string[] {
  const errors: string[] = [];
  const mapping = INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING;
  if (mapping.length !== 82) errors.push("mapping count");
  if (mapping.some((entry) => entry.controlId.startsWith("a7-"))) errors.push("physical mapping");
  if (new Set(mapping.map((entry) => entry.questionId)).size !== mapping.length) errors.push("duplicate mapping");
  return errors;
}
