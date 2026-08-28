import type { ScreeningAnswerValue } from "./outcomes.ts";
import { deriveAssessmentOutcome } from "./outcomes.ts";
import {
  type CablingSecurityQuestionId,
  type CablingSecurityQuestion,
  cablingSecurityQuestions,
  A7_12_CABLING_SECURITY_PLAN,
  A7_12_CABLING_SECURITY_GAP_CODES,
} from "../../content/assessment/physical/cabling-security.ts";

export type LocalizedText = { fr: string; en: string };

export type A712PlanOwnership =
  | "Facilities"
  | "IT Operations"
  | "Information Security"
  | "Network";

export type A712SubActionStatus = "active" | "resolved";
type Priority = "low" | "medium" | "high";

export type A712SubActionDefinition = {
  actionCode: string;
  sourceQuestionId: CablingSecurityQuestionId;
  partialTitle: LocalizedText;
  fullTitle: LocalizedText;
  partialDescription: LocalizedText;
  fullDescription: LocalizedText;
  recommendedActions: LocalizedText;
  partialPriority: Priority;
  fullPriority: Priority;
  owners: ReadonlyArray<A712PlanOwnership>;
  closureCriteria: LocalizedText;
  partialGapCode: string;
  fullGapCode: string;
};

export type A712ResponseInput = {
  questionId: CablingSecurityQuestionId;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  justification?: string;
  evidenceStatus?: Parameters<typeof deriveAssessmentOutcome>[0]["evidenceStatus"];
};

export type A712DerivedSubAction = A712SubActionDefinition & {
  status: A712SubActionStatus;
  gapType: "partial" | "full";
  gapCode: string;
  priority: Priority;
};

export type A712ResolutionResult = {
  controlApplicability: "applicable" | "not_applicable";
  controlReviewState: "none" | "clarification_required" | "applicability_review_required";
  requiresControlJustification: boolean;
  questionIds: CablingSecurityQuestionId[];
  hiddenQuestionIds: CablingSecurityQuestionId[];
  unresolvedConditions: string[];
  assessmentBlocked: boolean;
};

export function resolveCablingSecurityQuestions(): A712ResolutionResult {
  return {
    controlApplicability: "applicable",
    controlReviewState: "none",
    requiresControlJustification: false,
    questionIds: ["p7_12_001", "p7_12_002", "p7_12_003"],
    hiddenQuestionIds: [],
    unresolvedConditions: [],
    assessmentBlocked: false,
  };
}

export type A712RemediationPlanResult = {
  planCode: typeof A7_12_CABLING_SECURITY_PLAN;
  title: LocalizedText;
  controlApplicability: "applicable" | "not_applicable";
  controlReviewState: "none" | "clarification_required" | "applicability_review_required";
  requiresControlJustification: boolean;
  assessmentBlocked: boolean;
  unresolvedConditions: string[];
  visibleQuestionIds: CablingSecurityQuestionId[];
  hiddenQuestionIds: CablingSecurityQuestionId[];
  activeActions: A712DerivedSubAction[];
  clarifications: Array<{ questionId: CablingSecurityQuestionId; question: LocalizedText }>;
  applicabilityReviews: LocalizedText[];
};

const A712_ACTIONS: Record<string, A712SubActionDefinition> = {
  "P7.12-A01": {
    actionCode: "P7.12-A01",
    sourceQuestionId: "p7_12_001",
    partialTitle: {
      fr: "Exigences de protection du câblage incomplètes",
      en: "Incomplete cabling protection requirements"
    },
    fullTitle: {
      fr: "Absence d’exigences de protection du câblage",
      en: "No cabling protection requirements"
    },
    partialDescription: {
      fr: "Des exigences de protection du câblage existent, mais certains sites, chemins, types de câbles, points de terminaison, risques ou responsabilités ne sont pas suffisamment couverts.",
      en: "Cabling protection requirements exist, but some sites, routes, cable types, termination points, risks, or responsibilities are not sufficiently covered."
    },
    fullDescription: {
      fr: "L’organisation ne dispose pas d’exigences structurées permettant de protéger le câblage pertinent contre l’interception, l’interférence, la manipulation ou les dommages physiques.",
      en: "The organization has no structured requirements for protecting relevant cabling against interception, interference, tampering, or physical damage."
    },
    recommendedActions: {
      fr: [
        "identifier les câbles et chemins pertinents ;",
        "identifier les zones exposées ;",
        "identifier les points d’entrée, raccordement et terminaison pertinents ;",
        "identifier les principaux risques d’interception, interférence, manipulation ou dommage ;",
        "déterminer la criticité des services supportés ;",
        "définir les exigences de protection proportionnées ;",
        "clarifier les responsabilités Facilities/IT ;",
        "clarifier les responsabilités bailleur/installateur/opérateur ;",
        "intégrer la sécurité du câblage aux travaux et changements pertinents ;",
        "documenter les exceptions ;",
        "définir des mesures compensatoires lorsque nécessaire."
      ].join("\n- "),
      en: [
        "identify relevant cables and routes;",
        "identify exposed areas;",
        "identify relevant entry, junction, and termination points;",
        "identify major interception, interference, tampering, or damage risks;",
        "determine the criticality of supported services;",
        "define proportionate protection requirements;",
        "clarify Facilities/IT responsibilities;",
        "clarify landlord/installer/operator responsibilities;",
        "integrate cabling security into relevant work and changes;",
        "document exceptions;",
        "define compensating controls where necessary."
      ].join("\n- ")
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Facilities", "IT Operations", "Network", "Information Security"],
    closureCriteria: {
      fr: "Les câbles, chemins et points pertinents sont identifiés et des exigences de protection proportionnées aux risques et responsabilités correspondantes sont définies.",
      en: "Relevant cables, routes, and points are identified and protection requirements proportionate to risks and corresponding responsibilities are defined."
    },
    partialGapCode: A7_12_CABLING_SECURITY_GAP_CODES.A7_12_CABLING_REQUIREMENTS_PARTIAL,
    fullGapCode: A7_12_CABLING_SECURITY_GAP_CODES.A7_12_CABLING_REQUIREMENTS_ABSENT
  },
  "P7.12-A02": {
    actionCode: "P7.12-A02",
    sourceQuestionId: "p7_12_002",
    partialTitle: {
      fr: "Protection effective du câblage incomplète",
      en: "Incomplete effective cabling protection"
    },
    fullTitle: {
      fr: "Absence de protection effective du câblage",
      en: "No effective cabling protection"
    },
    partialDescription: {
      fr: "La majorité du câblage pertinent est protégée, mais certains tronçons, chemins, armoires ou points de terminaison restent insuffisamment protégés contre l’accès non autorisé, l’interférence ou les dommages.",
      en: "Most relevant cabling is protected, but some sections, routes, cabinets, or termination points remain insufficiently protected against unauthorized access, interference, or damage."
    },
    fullDescription: {
      fr: "Des câbles ou points de raccordement pertinents peuvent être interceptés, manipulés, perturbés ou endommagés sans mesure de protection proportionnée.",
      en: "Relevant cables or connection points may be intercepted, tampered with, interfered with, or damaged without proportionate protective measures."
    },
    recommendedActions: {
      fr: [
        "inspecter les chemins et points exposés ;",
        "comparer la protection existante aux risques identifiés ;",
        "réduire l’exposition physique lorsque nécessaire ;",
        "protéger mécaniquement les tronçons exposés lorsque approprié ;",
        "restreindre l’accès aux points sensibles lorsque nécessaire ;",
        "séparer les chemins lorsque l’interférence le justifie ;",
        "utiliser blindage ou fibre uniquement lorsque cela constitue une mesure appropriée ;",
        "protéger les points d’entrée ou raccordement pertinents ;",
        "traiter les risques d’arrachement, coupure ou manipulation ;",
        "prendre en compte les mesures fournies par un bailleur ou opérateur ;",
        "documenter les exceptions ;",
        "mettre en œuvre des mesures compensatoires ;",
        "vérifier que la protection obtenue répond effectivement au risque."
      ].join("\n- "),
      en: [
        "inspect exposed routes and points;",
        "compare existing protection with identified risks;",
        "reduce physical exposure where necessary;",
        "mechanically protect exposed sections where appropriate;",
        "restrict access to sensitive points where necessary;",
        "segregate routes where interference warrants it;",
        "use shielding or fiber only where this is an appropriate measure;",
        "protect relevant entry or junction points;",
        "address accidental disconnection, cutting, or tampering risks;",
        "account for measures provided by landlords or operators;",
        "document exceptions;",
        "implement compensating controls;",
        "verify that achieved protection effectively addresses the risk."
      ].join("\n- ")
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["Facilities", "IT Operations", "Network", "Information Security"],
    closureCriteria: {
      fr: "Un échantillon des chemins et points pertinents démontre que les risques d’interception, interférence, accès non autorisé et dommage sont réduits de manière proportionnée.",
      en: "A sample of relevant routes and points demonstrates that risks of interception, interference, unauthorized access, and damage are proportionately reduced."
    },
    partialGapCode: A7_12_CABLING_SECURITY_GAP_CODES.A7_12_CABLING_PROTECTION_PARTIAL,
    fullGapCode: A7_12_CABLING_SECURITY_GAP_CODES.A7_12_CABLING_PROTECTION_ABSENT
  },
  "P7.12-A03": {
    actionCode: "P7.12-A03",
    sourceQuestionId: "p7_12_003",
    partialTitle: {
      fr: "Assurance et traçabilité du câblage incomplètes",
      en: "Incomplete cabling assurance and traceability"
    },
    fullTitle: {
      fr: "Absence de preuve sur la sécurité du câblage",
      en: "No evidence of cabling security"
    },
    partialDescription: {
      fr: "Les protections existent mais certaines installations, modifications, inspections, anomalies, responsabilités tierces ou actions correctives ne sont pas suffisamment documentées ou suivies.",
      en: "Protections exist, but some installations, changes, inspections, anomalies, third-party responsibilities, or corrective actions are not sufficiently documented or tracked."
    },
    fullDescription: {
      fr: "L’organisation ne peut pas démontrer de manière proportionnée comment le câblage pertinent est installé, protégé, modifié ou suivi lorsqu’un défaut ou incident affecte sa sécurité.",
      en: "The organization cannot proportionately demonstrate how relevant cabling is installed, protected, changed, or tracked when a defect or incident affects its security."
    },
    recommendedActions: {
      fr: [
        "déterminer quelles installations nécessitent une traçabilité ;",
        "maintenir les plans ou schémas utiles lorsque nécessaires ;",
        "tracer les changements significatifs ;",
        "conserver les rapports de travaux pertinents ;",
        "enregistrer les défauts ou dommages significatifs ;",
        "documenter les incidents ;",
        "conserver les responsabilités bailleur/installateur/opérateur ;",
        "conserver les inspections lorsqu’elles sont justifiées ;",
        "utiliser l’étiquetage lorsqu’il améliore réellement le contrôle et la maintenance sûre ;",
        "attribuer les actions correctives ;",
        "suivre leur clôture ;",
        "mettre à jour la documentation après changement significatif lorsque nécessaire."
      ].join("\n- "),
      en: [
        "determine which installations require traceability;",
        "maintain useful plans or diagrams where needed;",
        "trace significant changes;",
        "retain relevant work reports;",
        "record significant defects or damage;",
        "document incidents;",
        "retain landlord/installer/operator responsibilities;",
        "retain inspections where justified;",
        "use labeling where it genuinely improves control and safe maintenance;",
        "assign corrective actions;",
        "track their closure;",
        "update documentation following significant change where necessary."
      ].join("\n- ")
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Facilities", "IT Operations", "Network", "Information Security"],
    closureCriteria: {
      fr: "Les installations et changements pertinents sont suffisamment traçables et les défauts, incidents ou actions correctives significatifs disposent d’une preuve de suivi et de clôture.",
      en: "Relevant installations and changes are sufficiently traceable, and significant defects, incidents, or corrective actions have evidence of tracking and closure."
    },
    partialGapCode: A7_12_CABLING_SECURITY_GAP_CODES.A7_12_CABLING_ASSURANCE_PARTIAL,
    fullGapCode: A7_12_CABLING_SECURITY_GAP_CODES.A7_12_CABLING_ASSURANCE_ABSENT
  }
} as const;

const actionByQuestionId = new Map<CablingSecurityQuestionId, A712SubActionDefinition>(
  Object.values(A712_ACTIONS).map((action) => [action.sourceQuestionId, action]),
);

const questionQuestionMap = new Map<CablingSecurityQuestionId, CablingSecurityQuestion>(
  cablingSecurityQuestions.map((question) => [question.id, question]),
);

export function deriveCablingSecurityOutcome(
  responses: A712ResponseInput[],
  resolution: A712ResolutionResult
): { reviewState: string; gapActions: A712DerivedSubAction[] } {
  const latestResponses = new Map<CablingSecurityQuestionId, A712ResponseInput>();

  for (const response of responses) {
    if (!questionQuestionMap.has(response.questionId)) continue;
    latestResponses.set(response.questionId, response);
  }

  const activeActionsByCode = new Map<string, A712DerivedSubAction>();
  let reviewState = resolution.controlReviewState;
  const visibleIds = new Set<CablingSecurityQuestionId>(resolution.questionIds);

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
      if (outcome.errorCode === "not_applicable_requires_justification") {
        reviewState = "applicability_review_required";
        continue;
      }
      continue;
    }

    if (outcome.reviewState === "clarification_required") {
      reviewState = "clarification_required";
    }
    if (outcome.reviewState === "applicability_review_required") {
      reviewState = "applicability_review_required";
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

  return { reviewState, gapActions: [...activeActionsByCode.values()] };
}

export function deriveCablingSecurityRemediationPlan(
  outcome: { reviewState: string; gapActions: A712DerivedSubAction[] }
): Array<{ planCode: string; actions: Array<{ actionCode: string, title: LocalizedText, description: LocalizedText, remediationSteps: LocalizedText, closureCriteria: LocalizedText, priority: string, recommendedOwner?: string }> }> {
  if (outcome.gapActions.length === 0) return [];

  const plan = {
    planCode: A7_12_CABLING_SECURITY_PLAN,
    actions: [] as Array<{
      actionCode: string;
      title: LocalizedText;
      description: LocalizedText;
      priority: string;
      recommendedOwner?: string;
      remediationSteps: LocalizedText;
      closureCriteria: LocalizedText;
    }>,
  };

  for (const action of outcome.gapActions) {
    plan.actions.push({
      actionCode: action.actionCode,
      title: action.gapType === "partial" ? action.partialTitle : action.fullTitle,
      description: action.gapType === "partial" ? action.partialDescription : action.fullDescription,
      priority: action.priority,
      recommendedOwner: action.gapType === "full" ? action.owners.join(" / ") : undefined,
      remediationSteps: action.recommendedActions,
      closureCriteria: action.closureCriteria
    });
  }

  return [plan];
}
