import { organizationalControls } from "../../content/assessment/organizational/organizational-controls.ts";
import { awarenessTrainingQuestions } from "../../content/assessment/people/awareness-training.ts";
import { disciplinaryProcessQuestions } from "../../content/assessment/people/disciplinary-process.ts";
import { eventReportingQuestions } from "../../content/assessment/people/event-reporting.ts";
import { technologicalControls } from "../../content/assessment/technological/technological-controls.generated.ts";

export const INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING_VERSION = "1.0.0";

export type IncidentManagementProcedureTheme = "organizational" | "people" | "technological";
export type IncidentManagementProcedureRelevance = "DIRECTLY_RELEVANT" | "CONTEXTUALLY_RELEVANT";

export type IncidentManagementProcedureAssessmentMappingEntry = {
  theme: IncidentManagementProcedureTheme;
  controlId: string;
  questionId: string;
  questionType: string;
  relevance: IncidentManagementProcedureRelevance;
  procedureSections: readonly string[];
  conditionKey?: string;
  excludeWhenHidden: boolean;
};

type RuntimeQuestion = {
  id: string;
  type: string;
  conditionKey?: string | null;
};

const entry = (
  theme: IncidentManagementProcedureTheme,
  controlId: string,
  question: RuntimeQuestion,
  relevance: IncidentManagementProcedureRelevance,
  procedureSections: readonly string[],
): IncidentManagementProcedureAssessmentMappingEntry => ({
  theme,
  controlId,
  questionId: question.id,
  questionType: question.type,
  relevance,
  procedureSections,
  ...(question.conditionKey ? { conditionKey: question.conditionKey } : {}),
  excludeWhenHidden: Boolean(question.conditionKey),
});

const selected = (questions: readonly RuntimeQuestion[], ids?: readonly string[]) =>
  questions.filter((question) => !ids || ids.includes(question.id));

const organizational = (
  controlId: string,
  relevance: IncidentManagementProcedureRelevance,
  procedureSections: readonly string[],
  ids?: readonly string[],
) => {
  const control = organizationalControls.find((candidate) => candidate.id === controlId);
  if (!control) throw new Error(`Missing organizational control ${controlId}`);
  return selected(control.questions, ids).map((question) => entry("organizational", controlId, question, relevance, procedureSections));
};

const peopleCatalog = {
  "a6-3": awarenessTrainingQuestions,
  "a6-4": disciplinaryProcessQuestions,
  "a6-8": eventReportingQuestions,
} as const;

const people = (
  controlId: keyof typeof peopleCatalog,
  relevance: IncidentManagementProcedureRelevance,
  procedureSections: readonly string[],
  ids?: readonly string[],
) => selected(peopleCatalog[controlId], ids).map((question) => entry("people", controlId, question, relevance, procedureSections));

const technological = (
  controlId: string,
  relevance: IncidentManagementProcedureRelevance,
  procedureSections: readonly string[],
  ids?: readonly string[],
) => {
  const control = technologicalControls.find((candidate) => candidate.id === controlId);
  if (!control) throw new Error(`Missing technological control ${controlId}`);
  return selected(control.questions, ids).map((question) => entry("technological", controlId, question, relevance, procedureSections));
};

export const INCIDENT_MANAGEMENT_PROCEDURE_ASSESSMENT_MAPPING: readonly IncidentManagementProcedureAssessmentMappingEntry[] = [
  ...organizational("a5-2", "DIRECTLY_RELEVANT", ["roles_and_responsibilities"]),
  ...organizational("a5-5", "DIRECTLY_RELEVANT", ["escalation_and_communication"], ["p5_5_001", "p5_5_002", "p5_5_004_deadlines"]),
  ...organizational("a5-5", "CONTEXTUALLY_RELEVANT", ["records_monitoring_and_metrics"], ["p5_5_003"]),
  ...organizational("a5-6", "CONTEXTUALLY_RELEVANT", ["preparation_and_readiness"]),
  ...organizational("a5-7", "CONTEXTUALLY_RELEVANT", ["preparation_and_readiness"]),
  ...organizational("a5-19", "CONTEXTUALLY_RELEVANT", ["recovery_and_closure"], ["p5_19_005_critical_supplier"]),
  ...organizational("a5-20", "CONTEXTUALLY_RELEVANT", ["escalation_and_communication"], ["p5_20_002", "p5_20_004_sensitive_data_clauses", "p5_20_006_critical_supplier_clauses"]),
  ...organizational("a5-22", "CONTEXTUALLY_RELEVANT", ["post_incident_review_and_lessons_learned"], ["p5_22_005_provider_incident"]),
  ...organizational("a5-23", "CONTEXTUALLY_RELEVANT", ["recovery_and_closure"], ["p5_23_002", "p5_23_003", "p5_23_005_sensitive_data"]),
  ...organizational("a5-24", "DIRECTLY_RELEVANT", ["preparation_and_readiness", "event_and_incident_reporting"]),
  ...organizational("a5-25", "DIRECTLY_RELEVANT", ["event_assessment_and_incident_declaration", "classification_severity_and_prioritization"]),
  ...organizational("a5-26", "DIRECTLY_RELEVANT", ["containment_eradication_and_corrective_action", "recovery_and_closure"]),
  ...organizational("a5-27", "DIRECTLY_RELEVANT", ["post_incident_review_and_lessons_learned"]),
  ...organizational("a5-28", "DIRECTLY_RELEVANT", ["evidence_collection_and_preservation"]),
  ...organizational("a5-29", "CONTEXTUALLY_RELEVANT", ["recovery_and_closure"], ["p5_29_002", "p5_29_003", "p5_29_004_emergency_access", "p5_29_005_alternate_operations"]),
  ...organizational("a5-30", "CONTEXTUALLY_RELEVANT", ["recovery_and_closure"], ["p5_30_002", "p5_30_003"]),
  ...organizational("a5-31", "CONTEXTUALLY_RELEVANT", ["escalation_and_communication", "records_monitoring_and_metrics"], ["o5_31_001", "o5_31_002", "o5_31_003", "o5_31_004_contractual"]),
  ...organizational("a5-33", "CONTEXTUALLY_RELEVANT", ["records_monitoring_and_metrics", "evidence_collection_and_preservation"], ["o5_33_001", "o5_33_002", "o5_33_003"]),

  ...people("a6-3", "CONTEXTUALLY_RELEVANT", ["preparation_and_readiness"]),
  ...people("a6-4", "CONTEXTUALLY_RELEVANT", ["escalation_and_communication"], ["p6_4_001", "p6_4_002"]),
  ...people("a6-8", "DIRECTLY_RELEVANT", ["event_and_incident_reporting", "records_monitoring_and_metrics"]),

  ...technological("a8-13", "DIRECTLY_RELEVANT", ["recovery_and_closure"], ["p8_13_003"]),
  ...technological("a8-13", "CONTEXTUALLY_RELEVANT", ["recovery_and_closure"], ["p8_13_002", "p8_13_004_cloud"]),
  ...technological("a8-15", "DIRECTLY_RELEVANT", ["evidence_collection_and_preservation", "records_monitoring_and_metrics"]),
  ...technological("a8-16", "DIRECTLY_RELEVANT", ["event_assessment_and_incident_declaration", "investigation_and_diagnosis", "records_monitoring_and_metrics"]),
  ...technological("a8-17", "CONTEXTUALLY_RELEVANT", ["investigation_and_diagnosis", "evidence_collection_and_preservation"], ["p8_17_003", "p8_17_004_legacy"]),
];

export const INCIDENT_MANAGEMENT_PROCEDURE_SECTION_COVERAGE = {
  document_control: "STATIC_OR_OTHER_SOURCE",
  purpose: "NO_ASSESSMENT_FACT_REQUIRED",
  scope: "STATIC_OR_OTHER_SOURCE",
  terms_and_definitions: "NO_ASSESSMENT_FACT_REQUIRED",
  incident_management_principles: "NO_ASSESSMENT_FACT_REQUIRED",
  roles_and_responsibilities: "ASSESSMENT_SUPPORTED",
  preparation_and_readiness: "ASSESSMENT_SUPPORTED",
  event_and_incident_reporting: "ASSESSMENT_SUPPORTED",
  event_assessment_and_incident_declaration: "ASSESSMENT_SUPPORTED",
  classification_severity_and_prioritization: "ASSESSMENT_SUPPORTED",
  escalation_and_communication: "ASSESSMENT_SUPPORTED",
  investigation_and_diagnosis: "ASSESSMENT_SUPPORTED",
  containment_eradication_and_corrective_action: "ASSESSMENT_SUPPORTED",
  recovery_and_closure: "ASSESSMENT_SUPPORTED",
  evidence_collection_and_preservation: "ASSESSMENT_SUPPORTED",
  post_incident_review_and_lessons_learned: "ASSESSMENT_SUPPORTED",
  records_monitoring_and_metrics: "ASSESSMENT_SUPPORTED",
  procedure_review_and_approval: "STATIC_OR_OTHER_SOURCE",
} as const;
