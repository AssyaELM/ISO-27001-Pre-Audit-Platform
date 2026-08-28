import type { ScreeningAnswerValue } from "./outcomes.ts";
import { deriveAssessmentOutcome } from "./outcomes.ts";
import { 
  type SupportingUtilitiesQuestionId,
  type SupportingUtilitiesQuestion,
  supportingUtilitiesQuestions,
  A7_11_SUPPORTING_UTILITIES_PLAN,
} from "../../content/assessment/physical/supporting-utilities.ts";

export type LocalizedText = {
  fr: string;
  en: string;
};

export type A711PlanOwnership =
  | "Facilities"
  | "IT Operations"
  | "Information Security"
  | "Business Continuity"
  | "Infrastructure"
  | "Supplier Management";

export type A711SubActionStatus = "active" | "resolved";

type Priority = "low" | "medium" | "high";

export type A711SubActionDefinition = {
  actionCode: string;
  sourceQuestionId: SupportingUtilitiesQuestionId;
  partialTitle: LocalizedText;
  fullTitle: LocalizedText;
  partialDescription: LocalizedText;
  fullDescription: LocalizedText;
  recommendedActions: LocalizedText;
  partialPriority: Priority;
  fullPriority: Priority;
  owners: ReadonlyArray<A711PlanOwnership>;
  closureEvidence: LocalizedText;
  closureCriteria: LocalizedText;
  partialGapCode: string;
  fullGapCode: string;
};

export type A711ResponseInput = {
  questionId: SupportingUtilitiesQuestionId;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  justification?: string;
  evidenceStatus?: Parameters<typeof deriveAssessmentOutcome>[0]["evidenceStatus"];
};

export type A711DerivedSubAction = A711SubActionDefinition & {
  status: A711SubActionStatus;
  gapType: "partial" | "full";
  gapCode: string;
  priority: Priority;
};
export type A711ResolutionResult = {
  controlApplicability: "applicable" | "not_applicable";
  controlReviewState: "none" | "clarification_required" | "applicability_review_required";
  requiresControlJustification: boolean;
  questionIds: SupportingUtilitiesQuestionId[];
  hiddenQuestionIds: SupportingUtilitiesQuestionId[];
  unresolvedConditions: string[];
  assessmentBlocked: boolean;
};

export function resolveSupportingUtilitiesQuestions(): A711ResolutionResult {
  return {
    controlApplicability: "applicable",
    controlReviewState: "none",
    requiresControlJustification: false,
    questionIds: [
      "p7_11_001",
      "p7_11_002",
      "p7_11_003"
    ],
    hiddenQuestionIds: [],
    unresolvedConditions: [],
    assessmentBlocked: false,
  };
}

export type A711RemediationPlanResult = {
  planCode: typeof A7_11_SUPPORTING_UTILITIES_PLAN;
  title: LocalizedText;
  controlApplicability: "applicable" | "not_applicable";
  controlReviewState: "none" | "clarification_required" | "applicability_review_required";
  requiresControlJustification: boolean;
  assessmentBlocked: boolean;
  unresolvedConditions: string[];
  visibleQuestionIds: SupportingUtilitiesQuestionId[];
  hiddenQuestionIds: SupportingUtilitiesQuestionId[];
  activeActions: A711DerivedSubAction[];
  clarifications: Array<{ questionId: SupportingUtilitiesQuestionId; question: LocalizedText }>;
  applicabilityReviews: LocalizedText[];
};

const A711_ACTIONS: Record<string, A711SubActionDefinition> = {
  "P7.11-A01": {
    actionCode: "P7.11-A01",
    sourceQuestionId: "p7_11_001",
    partialTitle: {
      fr: "Exigences relatives aux services de support incomplètes",
      en: "Incomplete supporting utility requirements"
    },
    fullTitle: {
      fr: "Absence de gouvernance des services de support",
      en: "No supporting utility governance"
    },
    partialDescription: {
      fr: "Les principales dépendances aux services de support sont connues, mais certains sites, utilities, niveaux de criticité, responsabilités ou scénarios de défaillance ne sont pas suffisamment couverts.",
      en: "The main supporting-utility dependencies are known, but some sites, utilities, criticality levels, responsibilities, or failure scenarios are not sufficiently covered."
    },
    fullDescription: {
      fr: "L’organisation ne dispose pas d’une approche structurée permettant d’identifier les services de support dont dépendent ses équipements et de définir les exigences de protection ou de continuité nécessaires.",
      en: "The organization has no structured approach for identifying the supporting utilities on which its equipment depends or defining the necessary protection and continuity requirements."
    },
    recommendedActions: {
      fr: "- identifier les utilities pertinentes par environnement ou site ;\n- identifier les équipements et services dépendants ;\n- évaluer leur criticité ;\n- identifier les principales conséquences d’une défaillance ;\n- identifier les dépendances croisées pertinentes ;\n- définir les besoins de protection et continuité ;\n- clarifier les responsabilités internes ;\n- clarifier les responsabilités bailleur/datacenter/hébergeur/fournisseur ;\n- documenter les exceptions ;\n- définir les mesures compensatoires lorsque nécessaire ;\n- communiquer les responsabilités aux fonctions concernées.",
      en: "- identify relevant utilities by environment or site;\n- identify dependent equipment and services;\n- assess their criticality;\n- identify the main consequences of failure;\n- identify relevant interdependencies;\n- define protection and continuity needs;\n- clarify internal responsibilities;\n- clarify landlord/data-center/hosting/supplier responsibilities;\n- document exceptions;\n- define compensating controls where necessary;\n- communicate responsibilities to relevant functions."
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Facilities", "IT Operations", "Information Security", "Business Continuity"],
    closureEvidence: {
      fr: "Les utilities pertinentes, leurs dépendances et responsabilités sont identifiées et des exigences de protection/continuité proportionnées sont définies pour les équipements et services concernés.",
      en: "Relevant supporting utilities, dependencies, and responsibilities are identified and proportionate protection/continuity requirements are defined for affected equipment and services."
    },
    closureCriteria: {
      fr: "Les utilities pertinentes, leurs dépendances et responsabilités sont identifiées et des exigences de protection/continuité proportionnées sont définies pour les équipements et services concernés.",
      en: "Relevant supporting utilities, dependencies, and responsibilities are identified and proportionate protection/continuity requirements are defined for affected equipment and services."
    },
    partialGapCode: "A7_11_UTILITY_REQUIREMENTS_PARTIAL",
    fullGapCode: "A7_11_UTILITY_REQUIREMENTS_ABSENT"
  },
  "P7.11-A02": {
    actionCode: "P7.11-A02",
    sourceQuestionId: "p7_11_002",
    partialTitle: {
      fr: "Protection contre les défaillances des services de support incomplète",
      en: "Incomplete protection against supporting utility failures"
    },
    fullTitle: {
      fr: "Absence de protection proportionnée contre les défaillances des services de support",
      en: "No proportionate protection against supporting utility failures"
    },
    partialDescription: {
      fr: "Des mesures sont en place, mais certains équipements critiques, scénarios de défaillance ou besoins de disponibilité restent insuffisamment protégés.",
      en: "Measures are in place, but some critical equipment, failure scenarios, or availability needs remain insufficiently protected."
    },
    fullDescription: {
      fr: "Une défaillance significative d’un service de support peut interrompre ou affecter les équipements de traitement de l’information sans mesure de protection ou continuité proportionnée.",
      en: "A significant supporting-utility failure can interrupt or affect information-processing equipment without proportionate protection or continuity measures."
    },
    recommendedActions: {
      fr: "- comparer les mesures existantes aux scénarios de défaillance pertinents ;\n- identifier les points de défaillance significatifs ;\n- vérifier les besoins de capacité ;\n- sélectionner des mesures proportionnées aux besoins de disponibilité ;\n- considérer alimentation temporaire ou alternative lorsque pertinente ;\n- considérer bascule ou redondance lorsque pertinente ;\n- considérer arrêt contrôlé lorsque pertinent ;\n- considérer connectivité alternative lorsque pertinente ;\n- utiliser monitoring ou alarmes lorsque le risque le justifie ;\n- tenir compte des protections fournies par un tiers ;\n- documenter exceptions et mesures compensatoires ;\n- vérifier que les mesures retenues atteignent le résultat attendu.",
      en: "- compare existing measures with relevant failure scenarios;\n- identify significant failure points;\n- verify capacity needs;\n- select measures proportionate to availability requirements;\n- consider temporary or alternative power where relevant;\n- consider failover or redundancy where relevant;\n- consider controlled shutdown where relevant;\n- consider alternative connectivity where relevant;\n- use monitoring or alarms where justified by risk;\n- account for protections provided by third parties;\n- document exceptions and compensating controls;\n- verify that selected measures achieve the expected outcome."
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["Facilities", "IT Operations", "Infrastructure", "Information Security"],
    closureEvidence: {
      fr: "Un échantillon de scénarios significatifs démontre que les mesures retenues réduisent de manière proportionnée l’impact d’une défaillance des services de support.",
      en: "A sample of significant scenarios demonstrates that selected measures proportionately reduce the impact of supporting-utility failures."
    },
    closureCriteria: {
      fr: "Un échantillon de scénarios significatifs démontre que les mesures retenues réduisent de manière proportionnée l’impact d’une défaillance des services de support.",
      en: "A sample of significant scenarios demonstrates that selected measures proportionately reduce the impact of supporting-utility failures."
    },
    partialGapCode: "A7_11_UTILITY_PROTECTION_PARTIAL",
    fullGapCode: "A7_11_UTILITY_PROTECTION_ABSENT"
  },
  "P7.11-A03": {
    actionCode: "P7.11-A03",
    sourceQuestionId: "p7_11_003",
    partialTitle: {
      fr: "Assurance des services de support incomplète",
      en: "Incomplete supporting utility assurance"
    },
    fullTitle: {
      fr: "Absence de preuve sur l’efficacité des protections des services de support",
      en: "No evidence of supporting utility protection effectiveness"
    },
    partialDescription: {
      fr: "Les protections existent mais certains tests, maintenances, alertes, incidents, preuves fournisseur, exceptions ou actions correctives ne sont pas suffisamment traçables.",
      en: "Protections exist, but some tests, maintenance activities, alerts, incidents, supplier evidence, exceptions, or corrective actions are not sufficiently traceable."
    },
    fullDescription: {
      fr: "L’organisation ne peut pas démontrer que les protections contre les défaillances des services de support sont testées, maintenues et suivies de manière adaptée au risque.",
      en: "The organization cannot demonstrate that protections against supporting-utility failures are appropriately tested, maintained, and tracked according to risk."
    },
    recommendedActions: {
      fr: "- définir quels dispositifs ou services nécessitent un test ;\n- définir une fréquence proportionnée au risque ;\n- conserver les résultats des tests pertinents ;\n- tracer les opérations de maintenance ;\n- conserver les alertes ou historiques de monitoring lorsqu’ils sont utilisés ;\n- enregistrer les défaillances réelles ;\n- conserver les preuves fournisseurs appropriées ;\n- suivre les SLA ou engagements pertinents ;\n- documenter les exceptions ;\n- attribuer les actions correctives ;\n- vérifier leur clôture ;\n- réévaluer les protections après changement significatif.",
      en: "- define which arrangements or services require testing;\n- define a frequency proportionate to risk;\n- retain relevant test results;\n- trace maintenance activities;\n- retain alerts or monitoring history where used;\n- record actual failures;\n- retain appropriate supplier evidence;\n- track relevant SLAs or commitments;\n- document exceptions;\n- assign corrective actions;\n- verify closure;\n- reassess protections after significant change."
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Facilities", "IT Operations", "Information Security", "Supplier Management"],
    closureEvidence: {
      fr: "Les protections pertinentes disposent de preuves démontrant leur test, maintenance et suivi, et les anomalies ou actions correctives significatives sont clôturées.",
      en: "Relevant protections have evidence demonstrating testing, maintenance, and tracking, and significant anomalies or corrective actions are closed."
    },
    closureCriteria: {
      fr: "Les protections pertinentes disposent de preuves démontrant leur test, maintenance et suivi, et les anomalies ou actions correctives significatives sont clôturées.",
      en: "Relevant protections have evidence demonstrating testing, maintenance, and tracking, and significant anomalies or corrective actions are closed."
    },
    partialGapCode: "A7_11_UTILITY_ASSURANCE_PARTIAL",
    fullGapCode: "A7_11_UTILITY_ASSURANCE_ABSENT"
  }
} as const;

const actionByQuestionId = new Map<SupportingUtilitiesQuestionId, A711SubActionDefinition>(
  Object.values(A711_ACTIONS).map((action) => [action.sourceQuestionId, action]),
);

const questionClarifications: Record<SupportingUtilitiesQuestionId, LocalizedText> = {
  "p7_11_001": {
    fr: "Merci de clarifier si les services de support critiques ont été identifiés.",
    en: "Please clarify if critical supporting utilities have been identified."
  },
  "p7_11_002": {
    fr: "Merci de clarifier quelles mesures de protection sont en place contre les défaillances.",
    en: "Please clarify what protection measures are in place against failures."
  },
  "p7_11_003": {
    fr: "Merci de clarifier comment l’efficacité des protections est démontrée.",
    en: "Please clarify how the effectiveness of protections is demonstrated."
  }
};

const questionQuestionMap = new Map<SupportingUtilitiesQuestionId, SupportingUtilitiesQuestion>(
  supportingUtilitiesQuestions.map((question) => [question.id, question]),
);

export function deriveSupportingUtilitiesRemediationPlan(
  responses: A711ResponseInput[],
): A711RemediationPlanResult {
  const resolution = resolveSupportingUtilitiesQuestions();
  const latestResponses = new Map<SupportingUtilitiesQuestionId, A711ResponseInput>();

  for (const response of responses) {
    if (!questionQuestionMap.has(response.questionId)) continue;
    latestResponses.set(response.questionId, response);
  }

  const activeActionsByCode = new Map<string, A711DerivedSubAction>();
  const clarifications: Array<{ questionId: SupportingUtilitiesQuestionId; question: LocalizedText }> = [];
  const applicabilityReviews: LocalizedText[] = [];
  const visibleIds = new Set<SupportingUtilitiesQuestionId>(resolution.questionIds);

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
      applicabilityReviews.push({ fr: response.justification?.trim() ?? "", en: response.justification?.trim() ?? "" });
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
        priority
      });
    } else {
      existing.gapType = gapType;
      existing.gapCode = gapCode;
      existing.priority = priority;
    }
  }

  const activeActions = [...activeActionsByCode.values()];
  return {
    planCode: A7_11_SUPPORTING_UTILITIES_PLAN,
    title: {
      fr: "Identifier, protéger et démontrer la résilience des services de support",
      en: "Identify, protect, and demonstrate supporting utility resilience"
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
  A711_ACTIONS as supportingUtilitiesActions,
  type A711ResponseInput as supportingUtilitiesResponseInput,
};
