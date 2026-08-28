import type { ScreeningAnswerValue } from "./outcomes.ts";
import {
  type A67AssessmentContext,
  type A67QuestionResolution,
  type RemoteWorkingQuestionId,
  REMOTE_WORKING_GAP_CODES,
  REMOTE_WORKING_PLAN_CODE,
  remoteWorkingQuestions,
  resolveRemoteWorkingQuestions,
} from "../../content/assessment/people/remote-working.ts";
import { deriveAssessmentOutcome } from "./outcomes.ts";

export type LocalizedText = {
  fr: string;
  en: string;
};

export type RemoteWorkingPlanOwnership =
  | "Information Security"
  | "IT"
  | "Facilities"
  | "Managers"
  | "HR"
  | "Legal"
  | "Privacy"
  | "Travel"
  | "Supplier Manager"
  | "Procurement"
  | "GRC";

export type RemoteWorkingSubActionStatus = "none" | "active" | "resolved";

export type RemoteWorkingSubActionDefinition = {
  actionCode: string;
  sourceQuestionId: RemoteWorkingQuestionId;
  title: LocalizedText;
  partialGapTitle: LocalizedText;
  partialGapDescription: LocalizedText;
  fullGapTitle: LocalizedText;
  fullGapDescription: LocalizedText;
  recommendedActions: LocalizedText;
  priority:
    | "low"
    | "medium"
    | "high"
    | {
        partial: "low" | "medium" | "high";
        full: "low" | "medium" | "high";
      };
  owners: ReadonlyArray<RemoteWorkingPlanOwnership>;
  closureEvidence: LocalizedText;
  closureCriteria: LocalizedText;
  partialGapCode: string;
  fullGapCode: string;
};

export type RemoteWorkingRemediationAction = RemoteWorkingSubActionDefinition & {
  status: RemoteWorkingSubActionStatus;
  gapType: "partial" | "full";
  gapCode: string;
};

export type RemoteWorkingResponseInput = {
  questionId: RemoteWorkingQuestionId;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  justification?: string;
  evidenceStatus?: Parameters<typeof deriveAssessmentOutcome>[0]["evidenceStatus"];
};

export type RemoteWorkingClarificationRecord = {
  questionId: RemoteWorkingQuestionId;
  question: LocalizedText;
  questionFr: string;
  questionEn: string;
};

export type DeriveRemoteWorkingRemediationPlanResult = {
  planCode: typeof REMOTE_WORKING_PLAN_CODE;
  title: LocalizedText;
  controlApplicability: "applicable" | "not_applicable" | "unknown";
  controlReviewState: "none" | "clarification_required" | "applicability_review_required";
  assessmentBlocked: boolean;
  activeActions: ReadonlyArray<RemoteWorkingRemediationAction>;
  clarifications: ReadonlyArray<RemoteWorkingClarificationRecord>;
  applicabilityReviews: ReadonlyArray<string>;
  unresolvedConditions: A67QuestionResolution["unresolvedConditions"];
};

export const REMOTE_WORKING_ACTIONS: Record<string, RemoteWorkingSubActionDefinition> = {
  "P6.7-A01": {
    actionCode: "P6.7-A01",
    sourceQuestionId: "p6_7_001",
    title: {
      fr: "Cadre de travail à distance",
      en: "Remote-working framework",
    },
    partialGapTitle: {
      fr: "Cadre de travail à distance incomplet",
      en: "Incomplete remote-working framework",
    },
    partialGapDescription: {
      fr: "Des règles existent, mais le périmètre, l’analyse de risques, les populations, lieux, appareils, informations, responsabilités ou exceptions ne sont pas entièrement définis.",
      en: "Rules exist, but scope, risk analysis, populations, locations, devices, information, responsibilities, or exceptions are not fully defined.",
    },
    fullGapTitle: {
      fr: "Absence de cadre de sécurité pour le travail à distance",
      en: "No information security framework for remote working",
    },
    fullGapDescription: {
      fr: "L’organisation autorise ou pratique le travail à distance sans avoir défini de cadre de sécurité fondé sur les risques.",
      en: "The organization permits or performs remote work without a risk-based security framework.",
    },
    recommendedActions: {
      fr: "Définir le périmètre du travail à distance; identifier les populations et activités; analyser les menaces et risques; définir lieux, appareils et informations concernées; attribuer les responsabilités; définir règles d’accès et de traitement; définir support et signalement; définir les exceptions; aligner avec les obligations légales et contractuelles; approuver, communiquer, et versionner le cadre.",
      en: "Define remote-working scope; identify populations and activities; assess threats and risks; define relevant locations, devices, and information; assign responsibilities; define access and handling rules; define support and reporting; define exceptions; align with legal and contractual requirements; approve, communicate, and version the framework.",
    },
    priority: { partial: "medium", full: "high" },
    owners: ["Information Security", "IT", "HR", "Privacy"],
    closureEvidence: {
      fr: "Un cadre approuvé relie les règles de travail à distance à une analyse de risques et attribue les responsabilités.",
      en: "An approved framework links remote-working rules to a risk assessment and assigns responsibilities.",
    },
    closureCriteria: {
      fr: "Un cadre approuvé relie les règles de travail à distance à une analyse de risques et attribue les responsabilités.",
      en: "An approved framework links remote-working rules to a risk assessment and assigns responsibilities.",
    },
    partialGapCode: REMOTE_WORKING_GAP_CODES.p6_7_001.partial,
    fullGapCode: REMOTE_WORKING_GAP_CODES.p6_7_001.full,
  },
  "P6.7-A02": {
    actionCode: "P6.7-A02",
    sourceQuestionId: "p6_7_002",
    title: {
      fr: "Mesures de sécurité applicables",
      en: "Implemented remote-working measures",
    },
    partialGapTitle: {
      fr: "Mesures de travail à distance partiellement appliquées",
      en: "Remote-working measures are partially applied",
    },
    partialGapDescription: {
      fr: "Des mesures sont définies, mais ne sont pas appliquées, communiquées ou contrôlées de façon cohérente pour toutes les populations, informations, appareils ou situations.",
      en: "Measures are defined, but are not consistently implemented, communicated, or controlled across relevant populations, information, devices, or scenarios.",
    },
    fullGapTitle: {
      fr: "Absence de mesures adaptées pour le travail à distance",
      en: "No appropriate remote-working security measures",
    },
    fullGapDescription: {
      fr: "Aucune mesure proportionnée n’est mise en œuvre pour traiter les risques liés au travail à distance.",
      en: "No proportionate measures are implemented to address remote-working physical, technical, and information risks.",
    },
    recommendedActions: {
      fr: "Comparer les mesures existantes aux risques; identifier les populations et appareils non couverts; traiter les écarts physiques, techniques et informationnels; sélectionner des mesures proportionnées; communiquer les exigences; fournir les moyens nécessaires; traiter les exceptions; vérifier un échantillon; documenter les contrôles compensatoires; suivre les écarts jusqu’à clore.",
      en: "Compare existing measures with risk; identify uncovered populations and devices; address physical, technical, and information gaps; select proportionate measures; communicate requirements; provide necessary resources; address exceptions; review a sample; document compensating controls; track gaps to closure.",
    },
    priority: {
      partial: "medium",
      full: "high",
    },
    owners: ["IT", "Information Security", "Facilities", "Managers"],
    closureEvidence: {
      fr: "Un échantillon montre que les mesures sélectionnées sont effectivement appliquées aux populations et scénarios concernées.",
      en: "A sample demonstrates that selected measures are effectively applied to relevant populations and scenarios.",
    },
    closureCriteria: {
      fr: "Un échantillon montre que les mesures sélectionnées sont effectivement appliquées aux populations et scénarios concernées.",
      en: "A sample demonstrates that selected measures are effectively applied to relevant populations and scenarios.",
    },
    partialGapCode: REMOTE_WORKING_GAP_CODES.p6_7_002.partial,
    fullGapCode: REMOTE_WORKING_GAP_CODES.p6_7_002.full,
  },
  "P6.7-A03": {
    actionCode: "P6.7-A03",
    sourceQuestionId: "p6_7_003",
    title: {
      fr: "Preuve et revue",
      en: "Evidence and review",
    },
    partialGapTitle: {
      fr: "Preuves ou révisions du dispositif incomplètes",
      en: "Incomplete evidence or review of remote-working arrangements",
    },
    partialGapDescription: {
      fr: "Certaines preuves sont disponibles, mais les exceptions, rapports, incidents, revues, actions correctives ou décisions de clôture ne sont pas entièrement traçables.",
      en: "Some evidence is available, but exceptions, reports, incidents, reviews, corrective actions, or closure decisions are not fully traceable.",
    },
    fullGapTitle: {
      fr: "Absence de suivi et de preuve du travail à distance",
      en: "No monitoring or evidence of remote-working arrangements",
    },
    fullGapDescription: {
      fr: "L’organisation ne peut pas démontrer que ses mesures fonctionnent, que les exceptions sont contrôlées ou que le dispositif est révisé après un changement ou un incident.",
      en: "The organization cannot demonstrate that its measures operate, exceptions are controlled, or arrangements are reviewed after change or incident.",
    },
    recommendedActions: {
      fr: "Définir les preuves minimales attendues; associer les preuves aux populations et appareils; conserver attestations, rapports et configurations pertinentes; enregistrer exceptions et contrôles compensatoires; enregistrer les incidents liés au travail à distance; définir événements déclencheurs de revue; documenter décisions et actions correctives; contrôler l’accès aux preuves; vérifier un échantillon; suivre les actions jusqu’à clôture.",
      en: "Define minimum expected evidence; link evidence to relevant populations and devices; retain relevant attestations, reports, and configurations; record exceptions and compensating controls; record remote-working incidents; define review triggers; document decisions and corrective actions; control access to evidence; review a sample; track actions to closure.",
    },
    priority: { partial: "medium", full: "high" },
    owners: ["Information Security", "IT", "GRC", "Privacy"],
    closureEvidence: {
      fr: "Un échantillon démontre l’application des mesures, la gestion des exceptions et les revues après changement ou incident.",
      en: "A sample demonstrates implementation of measures, exception management, and reviews following change or incident.",
    },
    closureCriteria: {
      fr: "Un échantillon démontre l’application des mesures, la gestion des exceptions et les revues après changement ou incident.",
      en: "A sample demonstrates implementation of measures, exception management, and reviews following change or incident.",
    },
    partialGapCode: REMOTE_WORKING_GAP_CODES.p6_7_003.partial,
    fullGapCode: REMOTE_WORKING_GAP_CODES.p6_7_003.full,
  },
  "P6.7-A04": {
    actionCode: "P6.7-A04",
    sourceQuestionId: "p6_7_004_byod",
    title: {
      fr: "Gestion BYOD",
      en: "BYOD management",
    },
    partialGapTitle: {
      fr: "Gestion BYOD incomplète",
      en: "Incomplete BYOD security management",
    },
    partialGapDescription: {
      fr: "Le BYOD est autorisé, mais certaines exigences concernant les appareils, la séparation, le support, la surveillance, les données, la perte, le vol, la fin de relation sont incomplètes ou incohérentes.",
      en: "BYOD is permitted, but some requirements for devices, separation, support, monitoring, data handling, loss, theft, or termination are incomplete or inconsistent.",
    },
    fullGapTitle: {
      fr: "Appareils personnels non encadrés",
      en: "Personal devices are not governed",
    },
    fullGapDescription: {
      fr: "Des appareils personnels sont utilisés pour le travail à distance sans règles de sécurité, de traitement des données et de protection de la vie privée adaptées.",
      en: "Personal devices are used for remote work without appropriate security, data-handling, and privacy requirements.",
    },
    recommendedActions: {
      fr: "Identifier les usages BYOD réels; définir appareils et usages autorisés; établir exigences minimales; définir séparation des données; définir règles de mise à jour, stockage et sauvegarde; définir support; définir traitement d’une perte, d’un vol ou d’une compromission; définir les règles de surveillance et leur transparence; définir les actions de fin de relation; valider juridiquement les mesures; communiquer les règles; traiter les exceptions; vérifier un échantillon.",
      en: "Identify actual BYOD use; define authorized devices and uses; establish minimum requirements; define data separation; define update, storage, and backup rules; define support; define handling of loss, theft, or compromise; define monitoring arrangements and transparency; define end-of-relationship actions; obtain legal review; communicate requirements; address exceptions; review a sample.",
    },
    priority: { partial: "high", full: "high" },
    owners: ["IT", "Information Security", "Privacy", "Legal"],
    closureEvidence: {
      fr: "Chaque appareil personnel autorisé relève de règles approuvées, proportionnées et juridiquement validées.",
      en: "Each authorized personal device is governed by approved, proportionate, and legally reviewed requirements.",
    },
    closureCriteria: {
      fr: "Chaque appareil personnel autorisé relève de règles approuvées, proportionnées et juridiquement validées.",
      en: "Each authorized personal device is governed by approved, proportionate, and legally reviewed requirements.",
    },
    partialGapCode: REMOTE_WORKING_GAP_CODES.p6_7_004_byod.partial,
    fullGapCode: REMOTE_WORKING_GAP_CODES.p6_7_004_byod.full,
  },
  "P6.7-A05": {
    actionCode: "P6.7-A05",
    sourceQuestionId: "p6_7_005_high_risk_locations",
    title: {
      fr: "Lieux à risque élevé",
      en: "Higher-risk locations and travel",
    },
    partialGapTitle: {
      fr: "Lieux et déplacements à risque partiellement encadrés",
      en: "Higher-risk locations and travel are partially governed",
    },
    partialGapDescription: {
      fr: "Certains scénarios à risque sont couverts, mais les consignes, restrictions, mesures supplémentaires, responsabilités ou signalement sont incomplètes.",
      en: "Some higher-risk scenarios are covered, but guidance, restrictions, additional measures, responsibilities, or reporting are incomplete.",
    },
    fullGapTitle: {
      fr: "Absence de mesures pour les lieux et déplacements à risque",
      en: "No measures for higher-risk locations or travel",
    },
    fullGapDescription: {
      fr: "Le travail est réalisé depuis des lieux ou pays présentant un risque accru sans mesures supplémentaires adaptées.",
      en: "Work is performed from higher-risk locations or countries without appropriate additional measures.",
    },
    recommendedActions: {
      fr: "Identifier les scénarios et lieux à risque; définir les méthodes d’évaluation; préciser restrictions et autorisations; définir les mesures supplémentaires; couvrir écrans, conversations, réseaux, documents et équipements; traiter transports et frontières; définir contacts d’assistance; définir le signalement; communiquer consignes avant déplacement; enregistrer exceptions; revoir incidents et retours d’expérience.",
      en: "Identify higher-risk scenarios and locations; define assessment methods; specify restrictions and approvals; define additional measures; cover screens, conversations, networks, documents, and equipment; address transport and borders; define support contacts; define reporting; communicate guidance before travel/activity; record exceptions; review incidents and lessons learned.",
    },
    priority: { partial: "medium", full: "high" },
    owners: ["Information Security", "Travel", "Legal", "Managers"],
    closureEvidence: {
      fr: "Les scénarios à risque identifiés disposent de consignes et mesures proportionnées, communiquées aux personnes concernées.",
      en: "Identified higher-risk scenarios have proportionate guidance and measures communicated to relevant people.",
    },
    closureCriteria: {
      fr: "Les scénarios à risque identifiés disposent de consignes et mesures proportionnées, communiquées aux personnes concernées.",
      en: "Identified higher-risk scenarios have proportionate guidance and measures communicated to relevant people.",
    },
    partialGapCode: REMOTE_WORKING_GAP_CODES.p6_7_005_high_risk_locations.partial,
    fullGapCode: REMOTE_WORKING_GAP_CODES.p6_7_005_high_risk_locations.full,
  },
};

const actionByQuestionId = Object.values(REMOTE_WORKING_ACTIONS).reduce(
  (acc, action) => {
    acc[action.sourceQuestionId] = action;
    return acc;
  },
  {} as Record<RemoteWorkingQuestionId, RemoteWorkingSubActionDefinition>,
);

const questionToClarificationText: Record<RemoteWorkingQuestionId, { fr: string; en: string }> = {
  "p6_7_001": {
    fr: "Identifier avec RH, IT et la sécurité les règles appliquées au travail à distance et vérifier qu’elles sont rattachées à une analyse de risques.",
    en: "Identify with HR, IT, and Security which remote-work rules are used and verify they are linked to a risk assessment.",
  },
  "p6_7_002": {
    fr: "Comparer les règles écrites aux usages effectifs pour un échantillon de travailleurs à distance (appareils, accès, pratiques).",
    en: "Compare written rules with devices, access, and practices for a sample of remote workers.",
  },
  "p6_7_003": {
    fr: "Identifier les preuves, exceptions, incidents et revues actuellement utilisés pour contrôler l’efficacité du dispositif.",
    en: "Identify the evidence, exceptions, incidents, and reviews currently used to control effectiveness of the arrangements.",
  },
  "p6_7_004_byod": {
    fr: "Demander à IT, RH, juridique et vie privée si des appareils personnels accèdent réellement aux informations du périmètre et selon quelles règles.",
    en: "Ask IT, HR, Legal, and Privacy whether personal devices actually access in-scope information and under which rules.",
  },
  "p6_7_005_high_risk_locations": {
    fr: "Identifier les personnes travaillant depuis des lieux publics, partagés, internationaux ou à risque accru et les consignes qui leur sont applicables.",
    en: "Identify people working from public, shared, international, or higher-risk locations and the guidance applying to them.",
  },
};

function getQuestionById(questionId: RemoteWorkingQuestionId) {
  const question = remoteWorkingQuestions.find((item) => item.id === questionId);
  if (!question) return null;
  return {
    questionFr: question.question.fr,
    questionEn: question.question.en,
  };
}

function resolveLatestResponses<T extends { questionId: RemoteWorkingQuestionId; answer: ScreeningAnswerValue }>(
  responses: readonly T[],
) {
  const latest = new Map<RemoteWorkingQuestionId, T>();
  for (const response of responses) {
    latest.set(response.questionId, response);
  }
  return latest;
}

function hasNonEmptyJustification(value?: string) {
  return Boolean(value && value.trim().length > 0);
}

export function deriveRemoteWorkingRemediationPlan(
  responses: ReadonlyArray<RemoteWorkingResponseInput>,
  context: A67AssessmentContext = {},
  controlApplicabilityJustification?: string,
): DeriveRemoteWorkingRemediationPlanResult {
  const resolved = resolveRemoteWorkingQuestions(context);
  const visibleSet = new Set<RemoteWorkingQuestionId>(resolved.questionIds);
  const latest = resolveLatestResponses(responses);
  const activeByCode = new Map<string, RemoteWorkingRemediationAction>();
  const clarifications: RemoteWorkingClarificationRecord[] = [];
  const applicabilityReviews: string[] = [];
  const unresolvedConditions = [...resolved.unresolvedConditions];

  const controlApplicability = resolved.controlApplicability;

  const hasValidControlJustification =
    controlApplicability === "not_applicable" && hasNonEmptyJustification(controlApplicabilityJustification);

  if (controlApplicability === "not_applicable" && !hasValidControlJustification) {
    if (applicabilityReviews.length === 0) {
      applicabilityReviews.push("control.hasRemoteWorking");
    }
    return {
      planCode: REMOTE_WORKING_PLAN_CODE,
      title: {
        fr: "Définir, appliquer et démontrer des mesures de sécurité proportionnées pour le travail à distance",
        en: "Define, implement, and demonstrate proportionate security measures for remote working",
      },
      controlApplicability,
      controlReviewState: "applicability_review_required",
      assessmentBlocked: true,
      activeActions: [],
      clarifications: [],
      applicabilityReviews,
      unresolvedConditions,
    };
  }

  if (controlApplicability === "unknown") {
    return {
      planCode: REMOTE_WORKING_PLAN_CODE,
      title: {
        fr: "Définir, appliquer et démontrer des mesures de sécurité proportionnées pour le travail à distance",
        en: "Define, implement, and demonstrate proportionate security measures for remote working",
      },
      controlApplicability,
      controlReviewState: context.hasRemoteWorking === "not_sure" ? "clarification_required" : "applicability_review_required",
      assessmentBlocked: true,
      activeActions: [],
      clarifications: [],
      applicabilityReviews: [],
      unresolvedConditions,
    };
  }

  const controlBlockedForConditions = resolved.unresolvedConditions.includes("hasBYODDevices")
    || resolved.unresolvedConditions.includes("hasHigherRiskLocations");

  if (controlApplicability === "not_applicable") {
    return {
      planCode: REMOTE_WORKING_PLAN_CODE,
      title: {
        fr: "Définir, appliquer et démontrer des mesures de sécurité proportionnées pour le travail à distance",
        en: "Define, implement, and demonstrate proportionate security measures for remote working",
      },
      controlApplicability,
      controlReviewState: "none",
      assessmentBlocked: false,
      activeActions: [],
      clarifications: [],
      applicabilityReviews: ["control.hasRemoteWorking"],
      unresolvedConditions,
    };
  }

  for (const condition of resolved.unresolvedConditions) {
    if (condition === "hasBYODDevices" && hasNonEmptyJustification(context.hasBYODDevices as string)) {
      continue;
    }
    if (condition === "hasHigherRiskLocations" && hasNonEmptyJustification(context.hasHigherRiskLocations as string)) {
      continue;
    }
  }

  if (controlBlockedForConditions) {
      unresolvedConditions.forEach((condition) => {
        if (condition === "hasBYODDevices") {
          const byodQuestion = getQuestionById("p6_7_004_byod");
          if (!byodQuestion) {
            throw new Error("A.6.7 byod question definition is missing");
          }
          clarifications.push({
            questionId: "p6_7_004_byod",
            question: questionToClarificationText.p6_7_004_byod,
            questionFr: byodQuestion.questionFr,
            questionEn: byodQuestion.questionEn,
          });
        }
        if (condition === "hasHigherRiskLocations") {
          const highRiskQuestion = getQuestionById("p6_7_005_high_risk_locations");
          if (!highRiskQuestion) {
            throw new Error("A.6.7 high-risk location question definition is missing");
          }
          clarifications.push({
            questionId: "p6_7_005_high_risk_locations",
            question: questionToClarificationText.p6_7_005_high_risk_locations,
            questionFr: highRiskQuestion.questionFr,
            questionEn: highRiskQuestion.questionEn,
          });
        }
      });
  }

  for (const response of latest.values()) {
    if (!visibleSet.has(response.questionId)) {
      continue;
    }

    const outcome = deriveAssessmentOutcome({
      questionId: response.questionId,
      answer: response.answer,
      hasEvidence: Boolean(response.hasEvidence),
      evidenceStatus: response.evidenceStatus,
      justification: response.justification,
    });

    if (!outcome.isValid) {
      continue;
    }

    if (outcome.reviewState === "clarification_required" && !controlBlockedForConditions) {
      const questionText = getQuestionById(response.questionId);
      if (questionText) {
        clarifications.push({
          questionId: response.questionId,
          question: questionToClarificationText[response.questionId],
          questionFr: questionText.questionFr,
          questionEn: questionText.questionEn,
        });
      }
      continue;
    }

    if (outcome.reviewState === "applicability_review_required") {
      if (!applicabilityReviews.includes(response.questionId)) {
        applicabilityReviews.push(response.questionId);
      }
      continue;
    }

    if (outcome.createsGapAction === "none") {
      continue;
    }

    const baseAction = actionByQuestionId[response.questionId];
    if (!baseAction) continue;

    const gapType = outcome.createsGapAction === "partial" ? "partial" : "full";
    const gapCode = gapType === "partial" ? baseAction.partialGapCode : baseAction.fullGapCode;
    const existing = activeByCode.get(baseAction.actionCode);
    if (!existing) {
      activeByCode.set(baseAction.actionCode, {
        ...baseAction,
        status: "active",
        gapType,
        gapCode,
      });
    } else {
      existing.gapType = gapType;
      existing.gapCode = gapCode;
      existing.status = "active";
    }
  }

  const finalClarifications = [...new Map(clarifications.map((entry) => [entry.questionId, entry])).values()];
  return {
    planCode: REMOTE_WORKING_PLAN_CODE,
    title: {
      fr: "Définir, appliquer et démontrer des mesures de sécurité proportionnées pour le travail à distance",
      en: "Define, implement, and demonstrate proportionate security measures for remote working",
    },
    controlApplicability,
    controlReviewState: controlBlockedForConditions ? "clarification_required" : "none",
    assessmentBlocked: controlBlockedForConditions,
    activeActions: [...activeByCode.values()],
    clarifications: finalClarifications,
    applicabilityReviews,
    unresolvedConditions,
  };
}

export { REMOTE_WORKING_ACTIONS as remoteWorkingActionsByCode };
