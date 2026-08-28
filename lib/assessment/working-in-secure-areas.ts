import type { ScreeningAnswerValue } from "./outcomes.ts";
import {
  type A76AssessmentContext,
  type A76QuestionResolution,
  type WorkingInSecureAreasQuestionId,
  WORKING_IN_SECURE_AREAS_PLAN_CODE,
  workingInSecureAreasQuestions,
  type WorkingInSecureAreasQuestion,
  WORKING_IN_SECURE_AREAS_GAP_CODES,
  resolveWorkingInSecureAreasQuestions,
} from "../../content/assessment/physical/working-in-secure-areas.ts";
import { deriveAssessmentOutcome } from "./outcomes.ts";

export type LocalizedText = {
  fr: string;
  en: string;
};

export type A76PlanOwnership =
  | "Physical Security"
  | "Facilities"
  | "Information Security"
  | "Area Owner"
  | "Supplier Manager"
  | "GRC";

export type A76SubActionStatus = "active" | "resolved";

type Priority = "low" | "medium" | "high";

export type A76SubActionDefinition = {
  actionCode: string;
  sourceQuestionId: WorkingInSecureAreasQuestionId;
  title: LocalizedText;
  partialGap: LocalizedText;
  fullGap: LocalizedText;
  partialDescription: LocalizedText;
  fullDescription: LocalizedText;
  recommendedActions: LocalizedText;
  partialPriority: Priority;
  fullPriority: Priority;
  owners: ReadonlyArray<A76PlanOwnership>;
  closureEvidence: LocalizedText;
  closureCriteria: LocalizedText;
  partialGapCode: string;
  fullGapCode: string;
};

export type A76ResponseInput = {
  questionId: WorkingInSecureAreasQuestionId;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  justification?: string;
  evidenceStatus?: Parameters<typeof deriveAssessmentOutcome>[0]["evidenceStatus"];
};

export type A76DerivedSubAction = A76SubActionDefinition & {
  status: A76SubActionStatus;
  gapType: "partial" | "full";
  gapCode: string;
  priority: Priority;
};

export type A76RemediationPlanResult = {
  planCode: typeof WORKING_IN_SECURE_AREAS_PLAN_CODE;
  title: LocalizedText;
  controlApplicability: A76QuestionResolution["controlApplicability"];
  controlReviewState: A76QuestionResolution["controlReviewState"];
  requiresControlJustification: boolean;
  assessmentBlocked: boolean;
  unresolvedConditions: A76QuestionResolution["unresolvedConditions"];
  visibleQuestionIds: WorkingInSecureAreasQuestionId[];
  hiddenQuestionIds: WorkingInSecureAreasQuestionId[];
  activeActions: ReadonlyArray<A76DerivedSubAction>;
  clarifications: ReadonlyArray<{ questionId: WorkingInSecureAreasQuestionId; question: LocalizedText }>;
  applicabilityReviews: ReadonlyArray<LocalizedText>;
};

const A76_ACTIONS: Record<string, A76SubActionDefinition> = {
  "P7.6-A01": {
    actionCode: "P7.6-A01",
    sourceQuestionId: "p7_6_001",
    title: {
      fr: "Règles de travail en zones sécurisées",
      en: "Secure-area working rules"
    },
    partialGap: {
      fr: "Règles de travail en zones sécurisées incomplètes",
      en: "Incomplete secure-area working rules"
    },
    fullGap: {
      fr: "Absence de règles de travail en zones sécurisées",
      en: "No secure-area working rules"
    },
    partialDescription: {
      fr: "Des règles existent, mais certaines zones, activités, responsabilités, restrictions, exceptions ou situations pertinentes ne sont pas correctement couvertes ou communiquées.",
      en: "Rules exist, but certain relevant areas, activities, responsibilities, restrictions, exceptions, or situations are not properly covered or communicated."
    },
    fullDescription: {
      fr: "L’organisation utilise des zones restreintes ou sécurisées sans disposer de règles documentées adaptées aux activités, informations, équipements et risques qui y sont associés.",
      en: "The organization uses restricted or secure areas without documented working rules appropriate to the associated activities, information, equipment, and risks."
    },
    recommendedActions: {
      fr: "- inventorier les zones restreintes ou sécurisées pertinentes ;\n- identifier leurs propriétaires et activités ;\n- identifier les informations et équipements concernés ;\n- définir les responsabilités des personnes qui y travaillent ;\n- définir les activités autorisées ;\n- déterminer les restrictions réellement nécessaires ;\n- traiter l’exposition d’informations ;\n- encadrer appareils, supports ou outils lorsque pertinent ;\n- définir les exceptions ;\n- définir les mesures compensatoires ;\n- intégrer les situations d’incident et de changement ;\n- préserver les exigences de santé-sécurité et d’urgence ;\n- faire approuver et communiquer les règles.",
      en: "- inventory relevant restricted or secure areas;\n- identify their owners and activities;\n- identify relevant information and equipment;\n- define responsibilities for people working there;\n- define permitted activities;\n- determine necessary restrictions;\n- address information exposure;\n- govern devices, media, or tools where relevant;\n- define exceptions;\n- define compensating controls;\n- address incidents and changes;\n- preserve health, safety, and emergency requirements;\n- approve and communicate the rules."
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Physical Security", "Facilities", "Information Security", "Area Owner"],
    closureEvidence: {
      fr: "Chaque zone sécurisée pertinente dispose de règles approuvées, proportionnées au risque, connues des personnes concernées et reliées à des responsabilités claires.",
      en: "Each relevant secure area has approved, risk-proportionate rules known to the relevant people and linked to clear responsibilities."
    },
    closureCriteria: {
      fr: "Chaque zone sécurisée pertinente dispose de règles approuvées, proportionnées au risque, connues des personnes concernées et reliées à des responsabilités claires.",
      en: "Each relevant secure area has approved, risk-proportionate rules known to the relevant people and linked to clear responsibilities."
    },
    partialGapCode: "A7_6_WORKING_RULES_PARTIAL",
    fullGapCode: "A7_6_WORKING_RULES_ABSENT"
  },
  "P7.6-A02": {
    actionCode: "P7.6-A02",
    sourceQuestionId: "p7_6_002",
    title: {
      fr: "Application des pratiques de travail sécurisées",
      en: "Application of secure working practices"
    },
    partialGap: {
      fr: "Application incomplète des pratiques de travail sécurisées",
      en: "Incomplete application of secure working practices"
    },
    fullGap: {
      fr: "Pratiques de travail sécurisées non appliquées",
      en: "Secure working practices are not applied"
    },
    partialDescription: {
      fr: "Les règles sont définies mais ne sont pas appliquées de manière cohérente dans certaines zones, activités ou situations.",
      en: "Rules are defined but are not applied consistently across certain areas, activities, or situations."
    },
    fullDescription: {
      fr: "Les zones sécurisées sont utilisées sans mise en œuvre effective des pratiques nécessaires pour protéger les informations, équipements ou activités qui s’y trouvent.",
      en: "Secure areas are used without effective application of the practices needed to protect the information, equipment, or activities within them."
    },
    recommendedActions: {
      fr: "- comparer les pratiques réelles aux règles approuvées ;\n- identifier les zones ou activités non couvertes ;\n- corriger les informations inutilement exposées ;\n- corriger les usages non autorisés d’appareils ou supports lorsque pertinent ;\n- encadrer les travaux techniques selon le risque ;\n- faire appliquer les restrictions réellement nécessaires ;\n- documenter les exceptions ;\n- mettre en place des mesures compensatoires lorsque nécessaire ;\n- traiter les défauts ou incidents ;\n- vérifier les corrections.",
      en: "- compare actual practice with approved rules;\n- identify uncovered areas or activities;\n- remediate unnecessary information exposure;\n- address unauthorized device or media use where relevant;\n- govern technical work according to risk;\n- apply necessary restrictions;\n- document exceptions;\n- implement compensating controls where necessary;\n- address defects or incidents;\n- verify remediation."
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["Area Owner", "Physical Security", "Facilities", "Information Security"],
    closureEvidence: {
      fr: "Un échantillon de zones ou activités démontre que les règles applicables sont réellement respectées et que les écarts identifiés ont été corrigés.",
      en: "A sample of areas or activities demonstrates that applicable rules are actually followed and identified deviations have been remediated."
    },
    closureCriteria: {
      fr: "Un échantillon de zones ou activités démontre que les règles applicables sont réellement respectées et que les écarts identifiés ont été corrigés.",
      en: "A sample of areas or activities demonstrates that applicable rules are actually followed and identified deviations have been remediated."
    },
    partialGapCode: "A7_6_SECURE_PRACTICES_PARTIAL",
    fullGapCode: "A7_6_SECURE_PRACTICES_ABSENT"
  },
  "P7.6-A03": {
    actionCode: "P7.6-A03",
    sourceQuestionId: "p7_6_003",
    title: {
      fr: "Preuves et assurance des pratiques en zones sécurisées",
      en: "Evidence and assurance for secure-area working"
    },
    partialGap: {
      fr: "Preuves et assurance des zones sécurisées incomplètes",
      en: "Incomplete secure-area assurance evidence"
    },
    fullGap: {
      fr: "Absence de preuve d’application des règles de zone sécurisée",
      en: "No evidence of secure-area rule operation"
    },
    partialDescription: {
      fr: "Les pratiques existent mais les communications, vérifications, exceptions, incidents, changements, corrections ou clôtures ne sont pas suffisamment traçables.",
      en: "Practices exist, but communications, checks, exceptions, incidents, changes, remediation, or closure are not sufficiently traceable."
    },
    fullDescription: {
      fr: "L’organisation ne peut pas démontrer que les règles de travail en zones sécurisées sont communiquées, appliquées, vérifiées et corrigées.",
      en: "The organization cannot demonstrate that secure-area working rules are communicated, applied, checked, and remediated."
    },
    recommendedActions: {
      fr: "- définir les preuves minimales nécessaires ;\n- conserver les versions et approbations des règles ;\n- conserver les communications pertinentes ;\n- conserver les briefings ou acknowledgments lorsqu’utilisés ;\n- enregistrer les vérifications proportionnées ;\n- enregistrer les exceptions ;\n- documenter les incidents ;\n- documenter les changements significatifs ;\n- attribuer les actions correctives ;\n- conserver les preuves de correction ;\n- conserver les validations de clôture.",
      en: "- define minimum necessary evidence;\n- retain rule versions and approvals;\n- retain relevant communications;\n- retain briefings or acknowledgements where used;\n- record proportionate checks;\n- record exceptions;\n- document incidents;\n- document significant changes;\n- assign corrective actions;\n- retain remediation evidence;\n- retain closure approvals."
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Physical Security", "Facilities", "GRC", "Area Owner"],
    closureEvidence: {
      fr: "Un échantillon permet de retracer une règle, sa communication, une vérification ou un écart et, lorsque nécessaire, sa correction jusqu’à la clôture.",
      en: "A sample allows a rule, its communication, a check or deviation, and where necessary its remediation to be traced through closure."
    },
    closureCriteria: {
      fr: "Un échantillon permet de retracer une règle, sa communication, une vérification ou un écart et, lorsque nécessaire, sa correction jusqu’à la clôture.",
      en: "A sample allows a rule, its communication, a check or deviation, and where necessary its remediation to be traced through closure."
    },
    partialGapCode: "A7_6_ASSURANCE_PARTIAL",
    fullGapCode: "A7_6_ASSURANCE_ABSENT"
  },
  "P7.6-A04": {
    actionCode: "P7.6-A04",
    sourceQuestionId: "p7_6_004_visitors_contractors",
    title: {
      fr: "Interventions de visiteurs et prestataires en zones sécurisées",
      en: "Visitor and contractor work in secure areas"
    },
    partialGap: {
      fr: "Encadrement incomplet des visiteurs ou prestataires en zone sécurisée",
      en: "Incomplete control of visitors or contractors in secure areas"
    },
    fullGap: {
      fr: "Absence d’encadrement des visiteurs ou prestataires en zone sécurisée",
      en: "No control of visitors or contractors in secure areas"
    },
    partialDescription: {
      fr: "Des visiteurs ou prestataires travaillent dans des zones sécurisées mais certaines autorisations, responsabilités, activités, restrictions, supervisions, obligations de confidentialité ou fins d’intervention ne sont pas correctement maîtrisées.",
      en: "Visitors or contractors work in secure areas, but certain authorizations, responsibilities, activities, restrictions, supervision arrangements, confidentiality obligations, or work completion activities are not properly controlled."
    },
    fullDescription: {
      fr: "Des intervenants externes peuvent travailler dans des zones sécurisées sans cadre documenté adapté au risque.",
      en: "External parties can work in secure areas without a documented framework appropriate to the risk."
    },
    recommendedActions: {
      fr: "- identifier les types d’intervenants concernés ;\n- définir un responsable ou hôte ;\n- autoriser les zones et activités nécessaires ;\n- documenter la nature des travaux ;\n- préciser les équipements et outils admis lorsque pertinent ;\n- appliquer les obligations de confidentialité nécessaires ;\n- définir les restrictions justifiées ;\n- utiliser une supervision ou escorte lorsque le risque l’exige ;\n- documenter les exceptions ;\n- gérer les incidents ;\n- confirmer la fin de l’intervention ;\n- récupérer les moyens d’accès temporaires lorsqu’ils existent.",
      en: "- identify relevant external-party types;\n- define an accountable host or owner;\n- authorize necessary areas and activities;\n- document the nature of the work;\n- define permitted devices and tools where relevant;\n- apply necessary confidentiality obligations;\n- define justified restrictions;\n- use supervision or escort where risk requires it;\n- document exceptions;\n- handle incidents;\n- confirm completion of work;\n- recover temporary access means where used."
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Facilities", "Area Owner", "Supplier Manager", "Physical Security"],
    closureEvidence: {
      fr: "Un échantillon d’intervention externe démontre que la personne, son activité, ses zones autorisées et les mesures de sécurité appropriées ont été clairement encadrées jusqu’à la fin de l’intervention.",
      en: "A sample external-party intervention demonstrates that the individual, their activity, permitted areas, and appropriate security measures were clearly controlled through completion."
    },
    closureCriteria: {
      fr: "Un échantillon d’intervention externe démontre que la personne, son activité, ses zones autorisées et les mesures de sécurité appropriées ont été clairement encadrées jusqu’à la fin de l’intervention.",
      en: "A sample external-party intervention demonstrates that the individual, their activity, permitted areas, and appropriate security measures were clearly controlled through completion."
    },
    partialGapCode: "A7_6_VISITOR_CONTRACTOR_PARTIAL",
    fullGapCode: "A7_6_VISITOR_CONTRACTOR_ABSENT"
  }
} as const;

const actionByQuestionId = new Map<WorkingInSecureAreasQuestionId, A76SubActionDefinition>(
  Object.values(A76_ACTIONS).map((action) => [action.sourceQuestionId, action]),
);

const questionClarifications: Record<WorkingInSecureAreasQuestionId, LocalizedText> = {
  "p7_6_001": {
    fr: "Demander aux propriétaires de zones, Facilities et Information Security quelles zones nécessitent des règles renforcées, quelles activités y sont réalisées et quels risques doivent être maîtrisés.",
    en: "Ask area owners, Facilities, and Information Security which areas require enhanced working rules, which activities take place there, and which risks need to be controlled."
  },
  "p7_6_002": {
    fr: "Observer ou revoir avec le propriétaire de zone comment les règles sont réellement appliquées pendant les activités habituelles et exceptionnelles.",
    en: "Review with the area owner how the rules are actually applied during normal and exceptional activities."
  },
  "p7_6_003": {
    fr: "Identifier avec Facilities, Physical Security ou le propriétaire de zone où sont conservées les preuves montrant que les règles fonctionnent réellement.",
    en: "Identify with Facilities, Physical Security, or the area owner where evidence showing that the rules operate in practice is retained."
  },
  "p7_6_004_visitors_contractors": {
    fr: "Demander au propriétaire de zone ou à Facilities comment les prestataires et visiteurs qui doivent réellement travailler dans une zone sécurisée sont autorisés et encadrés.",
    en: "Ask the area owner or Facilities how visitors and contractors who actually need to work in a secure area are authorized and controlled."
  }
};

const questionQuestionMap = new Map<WorkingInSecureAreasQuestionId, WorkingInSecureAreasQuestion>(
  workingInSecureAreasQuestions.map((question) => [question.id, question]),
);

export function deriveWorkingInSecureAreasRemediationPlan(
  responses: A76ResponseInput[],
  context: A76AssessmentContext = {},
  controlApplicabilityJustification?: string,
): A76RemediationPlanResult {
  const resolution = resolveWorkingInSecureAreasQuestions(context);
  const latestResponses = new Map<WorkingInSecureAreasQuestionId, A76ResponseInput>();

  for (const response of responses) {
    if (!questionQuestionMap.has(response.questionId)) continue;
    latestResponses.set(response.questionId, response);
  }

  const isControlApplicableNo = resolution.controlApplicability === "not_applicable";
  const isControlUnresolved = resolution.controlApplicability === "unresolved";
  const controlJustification = controlApplicabilityJustification?.trim() ?? "";

  if (isControlApplicableNo) {
    const isBlocked = !controlJustification;
    return {
      planCode: WORKING_IN_SECURE_AREAS_PLAN_CODE,
      title: {
        fr: "Définir, appliquer et démontrer des pratiques de travail sûres dans les zones sécurisées",
        en: "Define, apply, and demonstrate secure working practices in secure areas"
      },
      controlApplicability: "not_applicable",
      controlReviewState: "applicability_review_required",
      requiresControlJustification: true,
      assessmentBlocked: isBlocked,
      unresolvedConditions: resolution.unresolvedConditions,
      visibleQuestionIds: resolution.questionIds,
      hiddenQuestionIds: resolution.hiddenQuestionIds,
      activeActions: [],
      clarifications: [],
      applicabilityReviews: isBlocked
        ? []
        : [{ fr: controlApplicabilityJustification ?? "", en: controlApplicabilityJustification ?? "" }],
    };
  }

  if (isControlUnresolved) {
    return {
      planCode: WORKING_IN_SECURE_AREAS_PLAN_CODE,
      title: {
        fr: "Définir, appliquer et démontrer des pratiques de travail sûres dans les zones sécurisées",
        en: "Define, apply, and demonstrate secure working practices in secure areas"
      },
      controlApplicability: "unresolved",
      controlReviewState: "clarification_required",
      requiresControlJustification: false,
      assessmentBlocked: true,
      unresolvedConditions: resolution.unresolvedConditions,
      visibleQuestionIds: resolution.questionIds,
      hiddenQuestionIds: resolution.hiddenQuestionIds,
      activeActions: [],
      clarifications: [],
      applicabilityReviews: [],
    };
  }

  const activeActionsByCode = new Map<string, A76DerivedSubAction>();
  const clarifications: Array<{ questionId: WorkingInSecureAreasQuestionId; question: LocalizedText }> = [];
  const applicabilityReviews: LocalizedText[] = [];
  const visibleIds = new Set<WorkingInSecureAreasQuestionId>(resolution.questionIds);

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
    planCode: WORKING_IN_SECURE_AREAS_PLAN_CODE,
    title: {
      fr: "Définir, appliquer et démontrer des pratiques de travail sûres dans les zones sécurisées",
      en: "Define, apply, and demonstrate secure working practices in secure areas"
    },
    controlApplicability: "applicable",
    controlReviewState: resolution.controlReviewState,
    requiresControlJustification: resolution.requiresControlJustification,
    assessmentBlocked: resolution.assessmentBlocked,
    unresolvedConditions: resolution.unresolvedConditions,
    visibleQuestionIds: [...resolution.questionIds],
    hiddenQuestionIds: [...resolution.hiddenQuestionIds],
    activeActions,
    clarifications: [...clarifications],
    applicabilityReviews,
  };
}

export {
  A76_ACTIONS as workingInSecureAreasActions,
  type A76ResponseInput as workingInSecureAreasResponseInput,
  WORKING_IN_SECURE_AREAS_GAP_CODES as workingInSecureAreasGapCodes,
};
