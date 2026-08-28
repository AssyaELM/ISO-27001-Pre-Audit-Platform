import type { ScreeningAnswerValue } from "./outcomes.ts";
import { deriveAssessmentOutcome } from "./outcomes.ts";
import {
  type EquipmentMaintenanceQuestionId,
  type EquipmentMaintenanceQuestion,
  equipmentMaintenanceQuestions,
  A7_13_EQUIPMENT_MAINTENANCE_PLAN,
  A7_13_EQUIPMENT_MAINTENANCE_GAP_CODES,
} from "../../content/assessment/physical/equipment-maintenance.ts";

export type LocalizedText = { fr: string; en: string };
type Priority = "low" | "medium" | "high";
type Ownership = "Facilities" | "IT Operations" | "Information Security" | "Supplier Management";

export type A713ResponseInput = { questionId: EquipmentMaintenanceQuestionId; answer: ScreeningAnswerValue; hasEvidence?: boolean; justification?: string; evidenceStatus?: Parameters<typeof deriveAssessmentOutcome>[0]["evidenceStatus"] };
export type A713ResolutionResult = { controlApplicability: "applicable"; controlReviewState: "none"; requiresControlJustification: false; questionIds: EquipmentMaintenanceQuestionId[]; hiddenQuestionIds: EquipmentMaintenanceQuestionId[]; unresolvedConditions: string[]; assessmentBlocked: false };
type SubAction = { actionCode: string; sourceQuestionId: EquipmentMaintenanceQuestionId; partialTitle: LocalizedText; fullTitle: LocalizedText; partialDescription: LocalizedText; fullDescription: LocalizedText; recommendedActions: LocalizedText; closureCriteria: LocalizedText; partialPriority: Priority; fullPriority: Priority; owners: readonly Ownership[]; partialGapCode: string; fullGapCode: string };
export type A713DerivedSubAction = SubAction & { status: "active"; gapType: "partial" | "full"; gapCode: string; priority: Priority };

export function resolveEquipmentMaintenanceQuestions(): A713ResolutionResult {
  return { controlApplicability: "applicable", controlReviewState: "none", requiresControlJustification: false, questionIds: ["p7_13_001", "p7_13_002", "p7_13_003"], hiddenQuestionIds: [], unresolvedConditions: [], assessmentBlocked: false };
}

const actions: Record<string, SubAction> = {
  "P7.13-A01": { actionCode: "P7.13-A01", sourceQuestionId: "p7_13_001", partialTitle: { fr: "Exigences de maintenance incomplètes", en: "Incomplete maintenance requirements" }, fullTitle: { fr: "Absence de cadre de maintenance", en: "No maintenance framework" }, partialDescription: { fr: "Certains équipements, responsables ou modalités de maintenance ne sont pas complètement couverts.", en: "Some equipment, responsibilities, or maintenance arrangements are not fully covered." }, fullDescription: { fr: "La maintenance est essentiellement réactive ou ad hoc, sans cadre, critères ou responsabilités suffisamment définis.", en: "Maintenance is largely reactive or ad hoc, without sufficiently defined framework, criteria, or responsibilities." }, recommendedActions: { fr: "- compléter le périmètre et les modalités selon criticité et risque ;\n- identifier les équipements concernés ;\n- définir exigences, mainteneurs autorisés, déclencheurs et responsabilités.", en: "- complete scope and arrangements according to criticality and risk;\n- identify affected equipment;\n- define requirements, authorized maintainers, triggers, and responsibilities." }, closureCriteria: { fr: "Les équipements concernés, exigences, mainteneurs, déclencheurs et responsabilités sont définis de manière proportionnée.", en: "Affected equipment, requirements, maintainers, triggers, and responsibilities are proportionately defined." }, partialPriority: "medium", fullPriority: "high", owners: ["Facilities", "IT Operations", "Information Security", "Supplier Management"], partialGapCode: A7_13_EQUIPMENT_MAINTENANCE_GAP_CODES.A7_13_MAINTENANCE_REQUIREMENTS_PARTIAL, fullGapCode: A7_13_EQUIPMENT_MAINTENANCE_GAP_CODES.A7_13_MAINTENANCE_REQUIREMENTS_ABSENT },
  "P7.13-A02": { actionCode: "P7.13-A02", sourceQuestionId: "p7_13_002", partialTitle: { fr: "Maintenance sécurisée incomplète", en: "Incomplete secure maintenance" }, fullTitle: { fr: "Absence de maintenance sécurisée", en: "No secure maintenance" }, partialDescription: { fr: "La maintenance est réalisée, mais certains scénarios ou interventions sont insuffisamment protégés.", en: "Maintenance is performed, but some scenarios or interventions are insufficiently protected." }, fullDescription: { fr: "La maintenance ou réparation peut exposer l’équipement ou les informations sans contrôle adapté.", en: "Maintenance or repair can expose equipment or information without appropriate controls." }, recommendedActions: { fr: "- corriger les scénarios concernés : autorisation, accès, données, réparation externe, sortie d’équipement et retour en service ;\n- définir et appliquer les règles de sécurité avant, pendant et après maintenance.", en: "- correct affected scenarios: authorization, access, data, off-site repair, equipment release, and return to service;\n- define and apply security rules before, during, and after maintenance." }, closureCriteria: { fr: "Les scénarios de maintenance pertinents préservent la sécurité des équipements et informations de manière proportionnée.", en: "Relevant maintenance scenarios preserve equipment and information security proportionately." }, partialPriority: "high", fullPriority: "high", owners: ["Facilities", "IT Operations", "Information Security", "Supplier Management"], partialGapCode: A7_13_EQUIPMENT_MAINTENANCE_GAP_CODES.A7_13_SECURE_MAINTENANCE_PARTIAL, fullGapCode: A7_13_EQUIPMENT_MAINTENANCE_GAP_CODES.A7_13_SECURE_MAINTENANCE_ABSENT },
  "P7.13-A03": { actionCode: "P7.13-A03", sourceQuestionId: "p7_13_003", partialTitle: { fr: "Traçabilité de maintenance incomplète", en: "Incomplete maintenance traceability" }, fullTitle: { fr: "Absence de preuve de maintenance sécurisée", en: "No evidence of secure maintenance" }, partialDescription: { fr: "Les opérations sont réalisées mais l’historique ou les preuves sont incomplets.", en: "Activities are performed but history or evidence is incomplete." }, fullDescription: { fr: "Aucune piste de preuve fiable ne permet de démontrer la maintenance sécurisée.", en: "No reliable evidence trail demonstrates secure maintenance." }, recommendedActions: { fr: "- compléter tickets, rapports de maintenance, interventions fournisseurs, défauts, sorties d’équipement et vérifications de remise en service ;\n- établir une traçabilité proportionnée des opérations et corrections.", en: "- complete tickets, maintenance reports, supplier servicing, faults, equipment release, and return-to-service checks;\n- establish proportionate traceability of activities and corrections." }, closureCriteria: { fr: "Les opérations et corrections pertinentes disposent d’une trace proportionnée et exploitable.", en: "Relevant activities and corrections have proportionate, usable traceability." }, partialPriority: "medium", fullPriority: "high", owners: ["Facilities", "IT Operations", "Information Security", "Supplier Management"], partialGapCode: A7_13_EQUIPMENT_MAINTENANCE_GAP_CODES.A7_13_MAINTENANCE_ASSURANCE_PARTIAL, fullGapCode: A7_13_EQUIPMENT_MAINTENANCE_GAP_CODES.A7_13_MAINTENANCE_ASSURANCE_ABSENT },
};
const actionByQuestion = new Map<EquipmentMaintenanceQuestionId, SubAction>(Object.values(actions).map(action => [action.sourceQuestionId, action]));
const questionsById = new Map<EquipmentMaintenanceQuestionId, EquipmentMaintenanceQuestion>(equipmentMaintenanceQuestions.map(question => [question.id, question]));

export function deriveEquipmentMaintenanceOutcome(responses: A713ResponseInput[], resolution: A713ResolutionResult): { reviewState: string; gapActions: A713DerivedSubAction[] } {
  const latest = new Map<EquipmentMaintenanceQuestionId, A713ResponseInput>();
  for (const response of responses) if (questionsById.has(response.questionId)) latest.set(response.questionId, response);
  const active = new Map<string, A713DerivedSubAction>();
  let reviewState: string = resolution.controlReviewState;
  const visible = new Set(resolution.questionIds);
  for (const response of latest.values()) {
    if (!visible.has(response.questionId)) continue;
    const outcome = deriveAssessmentOutcome({ ...response, hasEvidence: Boolean(response.hasEvidence) });
    if (!outcome.isValid) { reviewState = "applicability_review_required"; continue; }
    if (outcome.reviewState !== "none") reviewState = outcome.reviewState;
    if (outcome.createsGapAction === "none") continue;
    const action = actionByQuestion.get(response.questionId);
    if (!action) continue;
    const gapType = outcome.createsGapAction === "partial" ? "partial" : "full";
    active.set(action.actionCode, { ...action, status: "active", gapType, gapCode: gapType === "partial" ? action.partialGapCode : action.fullGapCode, priority: gapType === "partial" ? action.partialPriority : action.fullPriority });
  }
  return { reviewState, gapActions: [...active.values()] };
}

export function deriveEquipmentMaintenanceRemediationPlan(outcome: { reviewState: string; gapActions: A713DerivedSubAction[] }) {
  if (!outcome.gapActions.length) return [];
  return [{ planCode: A7_13_EQUIPMENT_MAINTENANCE_PLAN, actions: outcome.gapActions.map(action => ({ actionCode: action.actionCode, title: action.gapType === "partial" ? action.partialTitle : action.fullTitle, description: action.gapType === "partial" ? action.partialDescription : action.fullDescription, priority: action.priority, recommendedOwner: action.gapType === "full" ? action.owners.join(" / ") : undefined, remediationSteps: action.recommendedActions, closureCriteria: action.closureCriteria })) }];
}
