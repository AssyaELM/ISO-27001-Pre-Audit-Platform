import type { ScreeningAnswerValue } from "./outcomes.ts";
import {
  type ClearDeskClearScreenQuestionResolution,
  type ClearDeskClearScreenQuestionId,
  CLEAR_DESK_CLEAR_SCREEN_PLAN_CODE,
  clearDeskClearScreenQuestions,
  type ClearDeskClearScreenQuestion,
  CLEAR_DESK_CLEAR_SCREEN_GAP_CODES,
  resolveClearDeskScreenQuestions,
} from "../../content/assessment/physical/clear-desk-clear-screen.ts";
import { deriveAssessmentOutcome } from "./outcomes.ts";

export type LocalizedText = {
  fr: string;
  en: string;
};

export type A77PlanOwnership =
  | "Information Security"
  | "HR"
  | "Facilities"
  | "IT"
  | "Managers"
  | "GRC";

export type A77SubActionStatus = "active" | "resolved";

type Priority = "low" | "medium" | "high";

export type A77SubActionDefinition = {
  actionCode: string;
  sourceQuestionId: ClearDeskClearScreenQuestionId;
  title: LocalizedText;
  partialGap: LocalizedText;
  fullGap: LocalizedText;
  partialDescription: LocalizedText;
  fullDescription: LocalizedText;
  recommendedActions: LocalizedText;
  partialPriority: Priority;
  fullPriority: Priority;
  owners: ReadonlyArray<A77PlanOwnership>;
  closureEvidence: LocalizedText;
  closureCriteria: LocalizedText;
  partialGapCode: string;
  fullGapCode: string;
};

export type A77ResponseInput = {
  questionId: ClearDeskClearScreenQuestionId;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  justification?: string;
  evidenceStatus?: Parameters<typeof deriveAssessmentOutcome>[0]["evidenceStatus"];
};

export type A77DerivedSubAction = A77SubActionDefinition & {
  status: A77SubActionStatus;
  gapType: "partial" | "full";
  gapCode: string;
  priority: Priority;
};

export type A77RemediationPlanResult = {
  planCode: typeof CLEAR_DESK_CLEAR_SCREEN_PLAN_CODE;
  title: LocalizedText;
  controlApplicability: ClearDeskClearScreenQuestionResolution["controlApplicability"];
  controlReviewState: ClearDeskClearScreenQuestionResolution["controlReviewState"];
  requiresControlJustification: boolean;
  assessmentBlocked: boolean;
  unresolvedConditions: ClearDeskClearScreenQuestionResolution["unresolvedConditions"];
  visibleQuestionIds: ClearDeskClearScreenQuestionId[];
  hiddenQuestionIds: ClearDeskClearScreenQuestionId[];
  activeActions: ReadonlyArray<A77DerivedSubAction>;
  clarifications: ReadonlyArray<{ questionId: ClearDeskClearScreenQuestionId; question: LocalizedText }>;
  applicabilityReviews: ReadonlyArray<LocalizedText>;
};

const A77_ACTIONS: Record<string, A77SubActionDefinition> = {
  "P7.7-A01": {
    actionCode: "P7.7-A01",
    sourceQuestionId: "p7_7_001",
    title: {
      fr: "Règles clear desk et clear screen incomplètes",
      en: "Incomplete clear desk and clear screen rules"
    },
    partialGap: {
      fr: "Règles clear desk et clear screen incomplètes",
      en: "Incomplete clear desk and clear screen rules"
    },
    fullGap: {
      fr: "Absence de règles clear desk et clear screen",
      en: "No clear desk and clear screen rules"
    },
    partialDescription: {
      fr: "Des règles existent, mais certains environnements de travail, types d’informations, situations d’absence, équipements ou modalités de traitement ne sont pas correctement couverts ou communiqués.",
      en: "Rules exist, but certain working environments, information types, unattended situations, equipment, or handling arrangements are not properly covered or communicated."
    },
    fullDescription: {
      fr: "L’organisation ne dispose pas de règles permettant de protéger les informations qui peuvent rester visibles ou accessibles sur les bureaux, écrans et autres espaces de travail lorsqu’ils sont laissés sans surveillance.",
      en: "The organization has no rules for protecting information that may remain visible or accessible on desks, screens, and other workspaces when unattended."
    },
    recommendedActions: {
      fr: "- identifier les environnements de travail pertinents ;\n- identifier les informations nécessitant une protection ;\n- définir les attentes lors d’une absence temporaire ou prolongée ;\n- définir les règles concernant les écrans ;\n- définir les règles concernant les documents lorsqu’ils existent ;\n- définir les règles concernant les impressions lorsqu’elles existent ;\n- définir les règles concernant les tableaux et salles de réunion ;\n- couvrir open spaces, coworking et travail à distance ;\n- définir les exceptions ;\n- définir les mesures compensatoires ;\n- attribuer les responsabilités ;\n- faire approuver et communiquer les règles.",
      en: "- identify relevant working environments;\n- identify information requiring protection;\n- define expectations during temporary or extended absence;\n- define screen-protection rules;\n- define document-handling rules where documents exist;\n- define printing rules where printing exists;\n- define whiteboard and meeting-room rules;\n- cover open-plan offices, coworking, and remote work;\n- define exceptions;\n- define compensating controls;\n- assign responsibilities;\n- approve and communicate the rules."
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Information Security", "HR", "Facilities", "IT"],
    closureEvidence: {
      fr: "Les environnements de travail pertinents disposent de règles proportionnées et communiquées permettant de protéger les informations lorsqu’un espace ou une session est laissé sans surveillance.",
      en: "Relevant working environments have proportionate, communicated rules for protecting information when a workspace or session is left unattended."
    },
    closureCriteria: {
      fr: "Les environnements de travail pertinents disposent de règles proportionnées et communiquées permettant de protéger les informations lorsqu’un espace ou une session est laissé sans surveillance.",
      en: "Relevant working environments have proportionate, communicated rules for protecting information when a workspace or session is left unattended."
    },
    partialGapCode: "A7_7_RULES_PARTIAL",
    fullGapCode: "A7_7_RULES_ABSENT"
  },
  "P7.7-A02": {
    actionCode: "P7.7-A02",
    sourceQuestionId: "p7_7_002",
    title: {
      fr: "Application incomplète des pratiques clear desk et clear screen",
      en: "Incomplete application of clear desk and clear screen practices"
    },
    partialGap: {
      fr: "Application incomplète des pratiques clear desk et clear screen",
      en: "Incomplete application of clear desk and clear screen practices"
    },
    fullGap: {
      fr: "Pratiques clear desk et clear screen non appliquées",
      en: "Clear desk and clear screen practices are not applied"
    },
    partialDescription: {
      fr: "Les règles existent et sont appliquées dans certaines situations, mais des informations sensibles restent encore inutilement visibles ou accessibles dans certains environnements ou lors de certaines absences.",
      en: "Rules exist and are applied in some situations, but sensitive information still remains unnecessarily visible or accessible in certain environments or unattended situations."
    },
    fullDescription: {
      fr: "Les informations sensibles peuvent rester accessibles ou visibles sur les écrans, bureaux ou autres espaces de travail sans protection proportionnée.",
      en: "Sensitive information can remain accessible or visible on screens, desks, or other workspaces without proportionate protection."
    },
    recommendedActions: {
      fr: "- comparer les pratiques réelles aux règles définies ;\n- identifier les situations d’exposition ;\n- mettre en œuvre un verrouillage manuel ou automatique approprié ;\n- ajuster les paramètres techniques lorsque nécessaire ;\n- protéger les impressions sensibles lorsqu’elles existent ;\n- ranger les documents ou supports physiques lorsqu’ils existent ;\n- effacer les tableaux et informations de réunion lorsque nécessaire ;\n- traiter les risques d’observation ;\n- adapter les pratiques aux espaces partagés et au télétravail ;\n- documenter les exceptions ;\n- corriger les écarts ;\n- vérifier la correction.",
      en: "- compare actual practices with defined rules;\n- identify exposure scenarios;\n- implement appropriate manual or automatic locking;\n- adjust technical settings where necessary;\n- protect sensitive printouts where they exist;\n- store documents or physical media where they exist;\n- clear whiteboards and meeting information where necessary;\n- address visual-observation risks;\n- adapt practices to shared and remote environments;\n- document exceptions;\n- remediate deviations;\n- verify remediation."
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Information Security", "IT", "Facilities", "Managers"],
    closureEvidence: {
      fr: "Un échantillon représentatif démontre que les informations ne restent pas inutilement visibles ou accessibles lorsque les espaces ou équipements sont laissés sans surveillance.",
      en: "A representative sample demonstrates that information is not unnecessarily left visible or accessible when workspaces or equipment are unattended."
    },
    closureCriteria: {
      fr: "Un échantillon représentatif démontre que les informations ne restent pas inutilement visibles ou accessibles lorsque les espaces ou équipements sont laissés sans surveillance.",
      en: "A representative sample demonstrates that information is not unnecessarily left visible or accessible when workspaces or equipment are unattended."
    },
    partialGapCode: "A7_7_PRACTICES_PARTIAL",
    fullGapCode: "A7_7_PRACTICES_ABSENT"
  },
  "P7.7-A03": {
    actionCode: "P7.7-A03",
    sourceQuestionId: "p7_7_003",
    title: {
      fr: "Assurance clear desk et clear screen incomplète",
      en: "Incomplete clear desk and clear screen assurance"
    },
    partialGap: {
      fr: "Assurance clear desk et clear screen incomplète",
      en: "Incomplete clear desk and clear screen assurance"
    },
    fullGap: {
      fr: "Absence de preuve sur l’efficacité des pratiques clear desk et clear screen",
      en: "No evidence of clear desk and clear screen effectiveness"
    },
    partialDescription: {
      fr: "Les règles et pratiques existent mais leur communication, application, exceptions, écarts, incidents ou corrections ne sont pas suffisamment traçables.",
      en: "Rules and practices exist, but their communication, operation, exceptions, deviations, incidents, or remediation are not sufficiently traceable."
    },
    fullDescription: {
      fr: "L’organisation ne peut pas démontrer que les règles sont communiquées, appliquées ou vérifiées, ni que les écarts identifiés sont corrigés.",
      en: "The organization cannot demonstrate that rules are communicated, applied, or checked, or that identified deviations are remediated."
    },
    recommendedActions: {
      fr: "- définir les preuves proportionnées attendues ;\n- conserver les versions des règles ;\n- conserver les communications ou formations pertinentes ;\n- conserver les configurations techniques lorsqu’elles existent ;\n- réaliser des vérifications proportionnées lorsque justifié ;\n- enregistrer les exceptions ;\n- enregistrer les incidents et écarts significatifs ;\n- créer les actions correctives nécessaires ;\n- suivre les corrections ;\n- conserver les preuves de résolution et clôture ;\n- réexaminer les règles lorsque les environnements de travail changent.",
      en: "- define proportionate expected evidence;\n- retain rule versions;\n- retain relevant communications or training;\n- retain technical configurations where used;\n- perform proportionate checks where justified;\n- record exceptions;\n- record significant incidents and deviations;\n- create necessary corrective actions;\n- track remediation;\n- retain remediation and closure evidence;\n- reassess rules when working environments change."
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Information Security", "GRC", "IT", "Facilities"],
    closureEvidence: {
      fr: "Un échantillon permet de retracer une règle ou configuration jusqu’à son application réelle et, lorsqu’un écart est détecté, jusqu’à sa correction.",
      en: "A sample allows a rule or configuration to be traced to actual operation and, where a deviation is detected, through remediation."
    },
    closureCriteria: {
      fr: "Un échantillon permet de retracer une règle ou configuration jusqu’à son application réelle et, lorsqu’un écart est détecté, jusqu’à sa correction.",
      en: "A sample allows a rule or configuration to be traced to actual operation and, where a deviation is detected, through remediation."
    },
    partialGapCode: "A7_7_ASSURANCE_PARTIAL",
    fullGapCode: "A7_7_ASSURANCE_ABSENT"
  }
} as const;

const actionByQuestionId = new Map<ClearDeskClearScreenQuestionId, A77SubActionDefinition>(
  Object.values(A77_ACTIONS).map((action) => [action.sourceQuestionId, action]),
);

const questionClarifications: Record<ClearDeskClearScreenQuestionId, LocalizedText> = {
  "p7_7_001": {
    fr: "Demander à Information Security, IT, Facilities et aux responsables métiers quels types d’informations peuvent rester visibles ou accessibles dans les environnements de travail et quelles règles sont déjà appliquées.",
    en: "Ask Information Security, IT, Facilities, and business owners which information may remain visible or accessible in working environments and which rules are already applied."
  },
  "p7_7_002": {
    fr: "Examiner comment les personnes protègent actuellement leurs écrans, documents, impressions, salles de réunion et autres informations lorsqu’elles quittent leur espace de travail.",
    en: "Review how people currently protect screens, documents, printouts, meeting rooms, and other information when leaving their workspace."
  },
  "p7_7_003": {
    fr: "Identifier quelles preuves existent actuellement pour démontrer que les règles clear desk et clear screen sont réellement comprises et appliquées.",
    en: "Identify what evidence currently demonstrates that clear desk and clear screen rules are actually understood and applied."
  }
};

const questionQuestionMap = new Map<ClearDeskClearScreenQuestionId, ClearDeskClearScreenQuestion>(
  clearDeskClearScreenQuestions.map((question) => [question.id, question]),
);

export function deriveClearDeskScreenRemediationPlan(
  responses: A77ResponseInput[],
): A77RemediationPlanResult {
  const resolution = resolveClearDeskScreenQuestions();
  const latestResponses = new Map<ClearDeskClearScreenQuestionId, A77ResponseInput>();

  for (const response of responses) {
    if (!questionQuestionMap.has(response.questionId)) continue;
    latestResponses.set(response.questionId, response);
  }

  const activeActionsByCode = new Map<string, A77DerivedSubAction>();
  const clarifications: Array<{ questionId: ClearDeskClearScreenQuestionId; question: LocalizedText }> = [];
  const applicabilityReviews: LocalizedText[] = [];
  const visibleIds = new Set<ClearDeskClearScreenQuestionId>(resolution.questionIds);

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
    planCode: CLEAR_DESK_CLEAR_SCREEN_PLAN_CODE,
    title: {
      fr: "Définir, appliquer et démontrer des pratiques proportionnées de bureau et d’écran dégagés",
      en: "Define, apply, and demonstrate proportionate clear desk and clear screen practices"
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
  A77_ACTIONS as clearDeskClearScreenActions,
  type A77ResponseInput as clearDeskClearScreenResponseInput,
  CLEAR_DESK_CLEAR_SCREEN_GAP_CODES as clearDeskClearScreenGapCodes,
};
