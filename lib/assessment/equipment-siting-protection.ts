import type { ScreeningAnswerValue } from "./outcomes.ts";
import {
  type EquipmentSitingProtectionQuestionResolution,
  type EquipmentSitingProtectionQuestionId,
  EQUIPMENT_SITING_PROTECTION_PLAN_CODE,
  equipmentSitingProtectionQuestions,
  type EquipmentSitingProtectionQuestion,
  EQUIPMENT_SITING_PROTECTION_GAP_CODES,
  resolveEquipmentSitingProtectionQuestions,
} from "../../content/assessment/physical/equipment-siting-protection.ts";
import { deriveAssessmentOutcome } from "./outcomes.ts";

export type LocalizedText = {
  fr: string;
  en: string;
};

export type A78PlanOwnership =
  | "Information Security"
  | "Facilities"
  | "IT"
  | "GRC"
  | "Asset Owner";

export type A78SubActionStatus = "active" | "resolved";

type Priority = "low" | "medium" | "high";

export type A78SubActionDefinition = {
  actionCode: string;
  sourceQuestionId: EquipmentSitingProtectionQuestionId;
  title: LocalizedText;
  partialGap: LocalizedText;
  fullGap: LocalizedText;
  partialDescription: LocalizedText;
  fullDescription: LocalizedText;
  recommendedActions: LocalizedText;
  partialPriority: Priority;
  fullPriority: Priority;
  owners: ReadonlyArray<A78PlanOwnership>;
  closureEvidence: LocalizedText;
  closureCriteria: LocalizedText;
  partialGapCode: string;
  fullGapCode: string;
};

export type A78ResponseInput = {
  questionId: EquipmentSitingProtectionQuestionId;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  justification?: string;
  evidenceStatus?: Parameters<typeof deriveAssessmentOutcome>[0]["evidenceStatus"];
};

export type A78DerivedSubAction = A78SubActionDefinition & {
  status: A78SubActionStatus;
  gapType: "partial" | "full";
  gapCode: string;
  priority: Priority;
};

export type A78RemediationPlanResult = {
  planCode: typeof EQUIPMENT_SITING_PROTECTION_PLAN_CODE;
  title: LocalizedText;
  controlApplicability: EquipmentSitingProtectionQuestionResolution["controlApplicability"];
  controlReviewState: EquipmentSitingProtectionQuestionResolution["controlReviewState"];
  requiresControlJustification: boolean;
  assessmentBlocked: boolean;
  unresolvedConditions: EquipmentSitingProtectionQuestionResolution["unresolvedConditions"];
  visibleQuestionIds: EquipmentSitingProtectionQuestionId[];
  hiddenQuestionIds: EquipmentSitingProtectionQuestionId[];
  activeActions: ReadonlyArray<A78DerivedSubAction>;
  clarifications: ReadonlyArray<{ questionId: EquipmentSitingProtectionQuestionId; question: LocalizedText }>;
  applicabilityReviews: ReadonlyArray<LocalizedText>;
};

const A78_ACTIONS: Record<string, A78SubActionDefinition> = {
  "P7.8-A01": {
    actionCode: "P7.8-A01",
    sourceQuestionId: "p7_8_001",
    title: {
      fr: "Exigences d'implantation et de protection incomplètes",
      en: "Incomplete equipment siting and protection requirements",
    },
    partialGap: {
      fr: "Exigences d'implantation et de protection incomplètes",
      en: "Incomplete equipment siting and protection requirements",
    },
    fullGap: {
      fr: "Absence d'exigences d'implantation et de protection des équipements",
      en: "No equipment siting and protection requirements",
    },
    partialDescription: {
      fr: "Des critères existent, mais certains équipements, sites, responsabilités ou risques physiques pertinents ne sont pas correctement couverts.",
      en: "Criteria exist, but certain relevant equipment, locations, responsibilities, or physical risks are not properly covered.",
    },
    fullDescription: {
      fr: "L'organisation ne dispose pas de critères définis permettant de déterminer comment les équipements pertinents doivent être implantés et protégés en fonction de leur sensibilité, criticité et exposition physique.",
      en: "The organization has no defined criteria for determining how relevant equipment should be sited and protected according to its sensitivity, criticality, and physical exposure.",
    },
    recommendedActions: {
      fr: "- identifier les équipements pertinents ;\n- identifier leurs emplacements ;\n- déterminer leur sensibilité et criticité ;\n- identifier les risques d'accès ou d'observation non autorisés ;\n- identifier les risques de vol et manipulation ;\n- identifier les risques accidentels pertinents ;\n- identifier les conditions environnementales pertinentes ;\n- définir les critères d'implantation ;\n- définir les protections nécessaires ;\n- identifier les responsabilités ;\n- intégrer les sites tiers lorsque pertinent ;\n- définir les exceptions ;\n- définir les mesures compensatoires ;\n- approuver et communiquer les critères.",
      en: "- identify relevant equipment;\n- identify its locations;\n- determine sensitivity and criticality;\n- identify unauthorized access or observation risks;\n- identify theft and handling risks;\n- identify relevant accidental risks;\n- identify relevant environmental conditions;\n- define siting criteria;\n- define necessary protections;\n- assign responsibilities;\n- include third-party sites where relevant;\n- define exceptions;\n- define compensating controls;\n- approve and communicate the criteria.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Facilities", "IT", "Information Security", "Asset Owner"],
    closureEvidence: {
      fr: "Les équipements pertinents disposent de critères d'implantation et de protection documentés, proportionnés à leur criticité et aux risques réels.",
      en: "Relevant equipment has documented siting and protection criteria proportionate to its criticality and actual risks.",
    },
    closureCriteria: {
      fr: "Les équipements pertinents disposent de critères d'implantation et de protection documentés, proportionnés à leur criticité et aux risques réels.",
      en: "Relevant equipment has documented siting and protection criteria proportionate to its criticality and actual risks.",
    },
    partialGapCode: EQUIPMENT_SITING_PROTECTION_GAP_CODES.P7_8_001_PARTIAL,
    fullGapCode: EQUIPMENT_SITING_PROTECTION_GAP_CODES.P7_8_001_FULL,
  },
  "P7.8-A02": {
    actionCode: "P7.8-A02",
    sourceQuestionId: "p7_8_002",
    title: {
      fr: "Protection physique des équipements incomplète",
      en: "Incomplete physical equipment protection",
    },
    partialGap: {
      fr: "Protection physique des équipements incomplète",
      en: "Incomplete physical equipment protection",
    },
    fullGap: {
      fr: "Protection physique des équipements insuffisante ou absente",
      en: "Insufficient or absent physical equipment protection",
    },
    partialDescription: {
      fr: "Les équipements sont généralement positionnés et protégés de manière appropriée, mais certaines expositions, installations ou conditions restent insuffisamment maîtrisées.",
      en: "Equipment is generally positioned and protected appropriately, but certain exposures, installations, or conditions remain insufficiently controlled.",
    },
    fullDescription: {
      fr: "Les équipements pertinents sont implantés ou utilisés sans protection proportionnée contre les risques physiques et environnementaux qui les concernent.",
      en: "Relevant equipment is sited or used without proportionate protection against applicable physical and environmental risks.",
    },
    recommendedActions: {
      fr: "- inspecter les emplacements réels ;\n- comparer la situation aux critères définis ;\n- identifier les équipements inutilement exposés ;\n- traiter l'accès ou l'observation non autorisés ;\n- traiter le risque de vol ou de manipulation ;\n- traiter les risques de choc ou chute ;\n- traiter l'eau ou les liquides lorsque pertinent ;\n- traiter chaleur, froid, poussière, humidité ou vibration lorsque pertinent ;\n- traiter les interférences lorsque pertinentes ;\n- repositionner les équipements lorsque nécessaire ;\n- ajouter des protections proportionnées lorsque nécessaire ;\n- appliquer des mesures compensatoires lorsqu'un déplacement est impossible ;\n- vérifier l'efficacité de la correction.",
      en: "- inspect actual locations;\n- compare conditions with defined criteria;\n- identify unnecessarily exposed equipment;\n- address unauthorized access or observation;\n- address theft or handling risks;\n- address impact or fall risks;\n- address water or liquids where relevant;\n- address heat, cold, dust, humidity, or vibration where relevant;\n- address interference where relevant;\n- reposition equipment where necessary;\n- implement proportionate protections where necessary;\n- apply compensating controls where relocation is not possible;\n- verify remediation effectiveness.",
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["Facilities", "IT", "Asset Owner", "Information Security"],
    closureEvidence: {
      fr: "Un échantillon représentatif démontre que les équipements sont positionnés et protégés conformément aux risques identifiés et que les écarts significatifs ont été corrigés ou compensés.",
      en: "A representative sample demonstrates that equipment is positioned and protected according to identified risks and that significant deviations have been remediated or compensated.",
    },
    closureCriteria: {
      fr: "Un échantillon représentatif démontre que les équipements sont positionnés et protégés conformément aux risques identifiés et que les écarts significatifs ont été corrigés ou compensés.",
      en: "A representative sample demonstrates that equipment is positioned and protected according to identified risks and that significant deviations have been remediated or compensated.",
    },
    partialGapCode: EQUIPMENT_SITING_PROTECTION_GAP_CODES.P7_8_002_PARTIAL,
    fullGapCode: EQUIPMENT_SITING_PROTECTION_GAP_CODES.P7_8_002_FULL,
  },
  "P7.8-A03": {
    actionCode: "P7.8-A03",
    sourceQuestionId: "p7_8_003",
    title: {
      fr: "Assurance et traçabilité de la protection des équipements incomplètes",
      en: "Incomplete equipment protection assurance and traceability",
    },
    partialGap: {
      fr: "Assurance et traçabilité de la protection des équipements incomplètes",
      en: "Incomplete equipment protection assurance and traceability",
    },
    fullGap: {
      fr: "Absence d'assurance sur l'implantation et la protection des équipements",
      en: "No assurance over equipment siting and protection",
    },
    partialDescription: {
      fr: "Les protections existent, mais les inspections, changements, défauts, incidents, exceptions, responsabilités tierces ou corrections ne sont pas suffisamment traçables.",
      en: "Protections exist, but inspections, changes, defects, incidents, exceptions, third-party responsibilities, or remediation are not sufficiently traceable.",
    },
    fullDescription: {
      fr: "L'organisation ne peut pas démontrer que l'implantation et les protections des équipements sont vérifiées, maintenues et réévaluées lorsque des changements ou incidents significatifs surviennent.",
      en: "The organization cannot demonstrate that equipment siting and protections are checked, maintained, and reassessed when significant changes or incidents occur.",
    },
    recommendedActions: {
      fr: "- définir les preuves proportionnées attendues ;\n- conserver les inspections pertinentes ;\n- tracer les déplacements significatifs ;\n- tracer les changements d'aménagement ;\n- enregistrer les défauts de protection ;\n- enregistrer les incidents physiques pertinents ;\n- enregistrer les exceptions ;\n- attribuer les actions correctives ;\n- conserver les preuves de correction ;\n- réévaluer après changement significatif ;\n- documenter les responsabilités de sites tiers lorsque pertinentes ;\n- conserver les preuves fournisseurs appropriées ;\n- suivre les changements communiqués par un tiers ;\n- valider les clôtures.",
      en: "- define proportionate expected evidence;\n- retain relevant inspections;\n- trace significant equipment moves;\n- trace layout changes;\n- record protection defects;\n- record relevant physical incidents;\n- record exceptions;\n- assign corrective actions;\n- retain remediation evidence;\n- reassess after significant change;\n- document third-party site responsibilities where relevant;\n- retain appropriate supplier evidence;\n- track changes communicated by third parties;\n- validate closure.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Facilities", "IT", "GRC", "Information Security", "Asset Owner"],
    closureEvidence: {
      fr: "Un échantillon permet de retracer l'emplacement et la protection d'un équipement, un changement ou écart significatif et, lorsqu'une correction est nécessaire, sa clôture.",
      en: "A sample allows an equipment location and protection, a significant change or deviation, and where remediation is required, its closure to be traced.",
    },
    closureCriteria: {
      fr: "Un échantillon permet de retracer l'emplacement et la protection d'un équipement, un changement ou écart significatif et, lorsqu'une correction est nécessaire, sa clôture.",
      en: "A sample allows an equipment location and protection, a significant change or deviation, and where remediation is required, its closure to be traced.",
    },
    partialGapCode: EQUIPMENT_SITING_PROTECTION_GAP_CODES.P7_8_003_PARTIAL,
    fullGapCode: EQUIPMENT_SITING_PROTECTION_GAP_CODES.P7_8_003_FULL,
  },
} as const;

const actionByQuestionId = new Map<EquipmentSitingProtectionQuestionId, A78SubActionDefinition>(
  Object.values(A78_ACTIONS).map((action) => [action.sourceQuestionId, action]),
);

const questionClarifications: Record<EquipmentSitingProtectionQuestionId, LocalizedText> = {
  p7_8_001: {
    fr: "Identifier avec IT, Facilities, Information Security et les propriétaires d'actifs quels équipements nécessitent des exigences particulières d'implantation ou de protection et pourquoi.",
    en: "Identify with IT, Facilities, Information Security, and asset owners which equipment requires particular siting or protection requirements and why.",
  },
  p7_8_002: {
    fr: "Examiner physiquement ou à partir de preuves appropriées comment les équipements pertinents sont actuellement positionnés et protégés contre les risques réellement présents.",
    en: "Review physically or through appropriate evidence how relevant equipment is currently positioned and protected against actual risks.",
  },
  p7_8_003: {
    fr: "Identifier avec IT, Facilities, les propriétaires d'actifs et les fournisseurs concernés quelles preuves démontrent actuellement le maintien de la protection des équipements.",
    en: "Identify with IT, Facilities, asset owners, and relevant suppliers what evidence currently demonstrates continued equipment protection.",
  },
};

const questionQuestionMap = new Map<EquipmentSitingProtectionQuestionId, EquipmentSitingProtectionQuestion>(
  equipmentSitingProtectionQuestions.map((question) => [question.id, question]),
);

export function deriveEquipmentSitingProtectionRemediationPlan(
  responses: A78ResponseInput[],
): A78RemediationPlanResult {
  const resolution = resolveEquipmentSitingProtectionQuestions();
  const latestResponses = new Map<EquipmentSitingProtectionQuestionId, A78ResponseInput>();

  for (const response of responses) {
    if (!questionQuestionMap.has(response.questionId)) continue;
    latestResponses.set(response.questionId, response);
  }

  const activeActionsByCode = new Map<string, A78DerivedSubAction>();
  const clarifications: Array<{ questionId: EquipmentSitingProtectionQuestionId; question: LocalizedText }> = [];
  const applicabilityReviews: LocalizedText[] = [];
  const visibleIds = new Set<EquipmentSitingProtectionQuestionId>(resolution.questionIds);

  for (const response of latestResponses.values()) {
    if (!visibleIds.has(response.questionId)) continue;

    const outcome = deriveAssessmentOutcome({
      questionId: response.questionId,
      answer: response.answer,
      hasEvidence: Boolean(response.hasEvidence),
      justification: response.justification,
      evidenceStatus: response.evidenceStatus,
    });

    if (!outcome.isValid) {
      throw new Error(`Invalid response for question ${response.questionId}: ${outcome.errorCode}`);
    }

    if (outcome.reviewState === "clarification_required") {
      clarifications.push({
        questionId: response.questionId,
        question: questionClarifications[response.questionId],
      });
    }

    if (outcome.reviewState === "applicability_review_required") {
      applicabilityReviews.push({ fr: response.justification ?? "", en: response.justification ?? "" });
    }

    if (outcome.createsGapAction === "none") continue;

    const subAction = actionByQuestionId.get(response.questionId);
    if (!subAction) continue;

    const gapType = outcome.createsGapAction === "partial" ? "partial" : "full";
    const gapCode = gapType === "partial" ? subAction.partialGapCode : subAction.fullGapCode;
    const priority = gapType === "partial" ? subAction.partialPriority : subAction.fullPriority;
    const existing = activeActionsByCode.get(subAction.actionCode);
    if (!existing) {
      activeActionsByCode.set(subAction.actionCode, {
        ...subAction,
        status: "active",
        gapType,
        gapCode,
        priority,
      });
    } else {
      existing.gapType = gapType;
      existing.gapCode = gapCode;
      existing.priority = priority;
    }
  }

  const activeActions = [...activeActionsByCode.values()];
  return {
    planCode: EQUIPMENT_SITING_PROTECTION_PLAN_CODE,
    title: {
      fr: "Définir, appliquer et démontrer une implantation et une protection appropriées des équipements",
      en: "Define, apply, and demonstrate appropriate equipment siting and protection",
    },
    controlApplicability: "applicable",
    controlReviewState: "none",
    requiresControlJustification: false,
    assessmentBlocked: false,
    unresolvedConditions: [],
    visibleQuestionIds: [...resolution.questionIds],
    hiddenQuestionIds: [],
    activeActions,
    clarifications: [...clarifications],
    applicabilityReviews,
  };
}

export {
  A78_ACTIONS as equipmentSitingProtectionActions,
  type A78ResponseInput as equipmentSitingProtectionResponseInput,
  EQUIPMENT_SITING_PROTECTION_GAP_CODES as equipmentSitingProtectionGapCodes,
};
