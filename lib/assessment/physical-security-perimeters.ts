import type { ScreeningAnswerValue } from "./outcomes.ts";
import {
  type A71AssessmentContext,
  type A71QuestionResolution,
  type A71QuestionId,
  PHYSICAL_SECURITY_PERIMETERS_PLAN_CODE,
  physicalSecurityPerimeterQuestions,
  type PhysicalSecurityPerimeterQuestion,
  PHYSICAL_SECURITY_PERIMETER_GAP_CODES,
  resolvePhysicalSecurityPerimeterQuestions,
} from "../../content/assessment/physical/physical-security-perimeters.ts";
import { deriveAssessmentOutcome } from "./outcomes.ts";

export type LocalizedText = {
  fr: string;
  en: string;
};

export type A71PlanOwnership =
  | "Facilities"
  | "Information Security"
  | "Site Owners"
  | "Physical Security"
  | "GRC"
  | "Supplier Manager"
  | "Procurement"
  | "Legal"
  | "Privacy"
  | "Health and Safety";

export type A71SubActionStatus = "active" | "resolved";

type Priority = "low" | "medium" | "high";

export type A71SubActionDefinition = {
  actionCode: string;
  sourceQuestionId: A71QuestionId;
  title: LocalizedText;
  partialGap: LocalizedText;
  fullGap: LocalizedText;
  partialDescription: LocalizedText;
  fullDescription: LocalizedText;
  recommendedActions: LocalizedText;
  priority: Priority;
  owners: ReadonlyArray<A71PlanOwnership>;
  closureEvidence: LocalizedText;
  closureCriteria: LocalizedText;
  partialGapCode: string;
  fullGapCode: string;
};

export type A71ResponseInput = {
  questionId: A71QuestionId;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  justification?: string;
  evidenceStatus?: Parameters<typeof deriveAssessmentOutcome>[0]["evidenceStatus"];
};

export type A71DerivedSubAction = A71SubActionDefinition & {
  status: A71SubActionStatus;
  gapType: "partial" | "full";
  gapCode: string;
};

export type A71RemediationPlanResult = {
  planCode: typeof PHYSICAL_SECURITY_PERIMETERS_PLAN_CODE;
  title: LocalizedText;
  controlApplicability: A71QuestionResolution["controlApplicability"];
  controlReviewState: A71QuestionResolution["controlReviewState"];
  requiresControlJustification: boolean;
  assessmentBlocked: boolean;
  unresolvedConditions: A71QuestionResolution["unresolvedConditions"];
  visibleQuestionIds: A71QuestionId[];
  hiddenQuestionIds: A71QuestionId[];
  activeActions: ReadonlyArray<A71DerivedSubAction>;
  clarifications: ReadonlyArray<{ questionId: A71QuestionId; question: LocalizedText }>;
  applicabilityReviews: ReadonlyArray<LocalizedText>;
};

const A71_ACTIONS: Record<string, A71SubActionDefinition> = {
  "P7.1-A01": {
    actionCode: "P7.1-A01",
    sourceQuestionId: "p7_1_001",
    title: {
      fr: "Définir les périmètres physiques",
      en: "Define physical perimeters",
    },
    partialGap: {
      fr: "Définition incomplète des périmètres physiques",
      en: "Incomplete definition of physical security perimeters",
    },
    fullGap: {
      fr: "Périmètres physiques non identifiés",
      en: "Physical security perimeters are not identified",
    },
    partialDescription: {
      fr: "Certains sites ou zones sont identifiés, mais le périmètre, les limites, les actifs, les niveaux de sensibilité, les propriétaires ou les dépendances tierces ne sont pas complètement documentés.",
      en: "Some sites or areas are identified, but scope, boundaries, assets, sensitivity levels, owners, or third-party dependencies are not fully documented.",
    },
    fullDescription: {
      fr: "L’organisation ne dispose d’aucune définition documentée des limites physiques protégeant les zones contenant des informations ou actifs associés.",
      en: "The organization has no documented definition of the physical boundaries protecting areas containing information or associated assets.",
    },
    recommendedActions: {
      fr: "Inventorier les sites et installations ; identifier les informations et actifs ; identifier les zones et limites ; cartographier les points de passage ; lier les protections aux risques ; attribuer les propriétaires ; documenter les dépendances tierces ; définir les déclencheurs de mise à jour ; approuver et versionner les plans.",
      en: "Inventory sites and facilities; identify information and associated assets; identify areas and boundaries; map access points; link protection to risk; assign owners; document third-party dependencies; define update triggers; approve and version plans.",
    },
    priority: "medium",
    owners: ["Facilities", "Information Security", "Site Owners"],
    closureEvidence: {
      fr: "Tous les périmètres pertinents sont documentés, approuvés et reliés aux actifs et risques concernés.",
      en: "All relevant perimeters are documented, approved, and linked to relevant assets and risks.",
    },
    closureCriteria: {
      fr: "Les réponses aux questions de périmètre sont complètes et actualisées.",
      en: "Perimeter scope and controls are fully covered and up to date.",
    },
    partialGapCode: "A7_1_PERIMETER_DEFINITION_PARTIAL",
    fullGapCode: "A7_1_PERIMETER_DEFINITION_ABSENT",
  },
  "P7.1-A02": {
    actionCode: "P7.1-A02",
    sourceQuestionId: "p7_1_002",
    title: {
      fr: "Protéger les limites physiques",
      en: "Protect physical boundaries",
    },
    partialGap: {
      fr: "Protection incomplète des limites physiques",
      en: "Incomplete protection of physical boundaries",
    },
    fullGap: {
      fr: "Limites physiques non protégées",
      en: "Physical boundaries are not protected",
    },
    partialDescription: {
      fr: "Le périmètre est défini mais certaines protections sont insuffisantes au regard des risques ou des usages.",
      en: "Perimeter exists but current protections are insufficient relative to risk and use.",
    },
    fullDescription: {
      fr: "Aucun dispositif cohérent et proportionné n’est appliqué aux limites et points de passage définis.",
      en: "No coherent and proportionate protections are effectively applied on the defined boundaries and access points.",
    },
    recommendedActions: {
      fr: "Inspecter les limites et points de passage ; comparer les protections aux risques ; identifier les ouvertures ou contournements ; traiter les défauts prioritaires ; protéger les issues conformément à la sécurité des personnes ; documenter les mesures compensatoires ; organiser la maintenance ; vérifier les corrections.",
      en: "Inspect boundaries and access points; compare protection with risk; identify openings or bypasses; remediate priority defects; protect emergency exits consistently with life-safety constraints; document compensating controls; arrange maintenance; verify corrections.",
    },
    priority: "high",
    owners: ["Facilities", "Physical Security", "Information Security"],
    closureEvidence: {
      fr: "Les limites et points de passage présentent des protections cohérentes avec les risques et les contraintes de sécurité des personnes.",
      en: "Boundaries and access points have protection consistent with risk and life-safety constraints.",
    },
    closureCriteria: {
      fr: "Les écarts connus des limites et points de passage sont corrigés selon une planification de maintenance.",
      en: "Known gaps on boundaries and access points are corrected through a maintenance plan.",
    },
    partialGapCode: "A7_1_PERIMETER_PROTECTION_PARTIAL",
    fullGapCode: "A7_1_PERIMETER_PROTECTION_ABSENT",
  },
  "P7.1-A03": {
    actionCode: "P7.1-A03",
    sourceQuestionId: "p7_1_003",
    title: {
      fr: "Assurer le maintien des périmètres",
      en: "Assure perimeter maintenance",
    },
    partialGap: {
      fr: "Assurance et suivi des périmètres incomplets",
      en: "Incomplete perimeter assurance and follow-up",
    },
    fullGap: {
      fr: "Absence de preuve de maintien des périmètres",
      en: "No evidence that perimeters are maintained",
    },
    partialDescription: {
      fr: "Des preuves existent mais elles ne couvrent pas l’ensemble des changements et défauts selon une logique de risque.",
      en: "Evidence exists but does not cover changes and defects consistently based on risk.",
    },
    fullDescription: {
      fr: "Aucune preuve crédible du maintien des périmètres (vérifications, corrections, exceptions, clôtures) n’est conservée.",
      en: "No credible evidence of perimeter maintenance is retained (checks, corrections, exceptions, closures).",
    },
    recommendedActions: {
      fr: "Définir les preuves minimales ; planifier des inspections proportionnées ; enregistrer les défauts et changements ; relier les réparations aux constats ; enregistrer les exceptions ; documenter les contrôles compensatoires ; attribuer les actions ; suivre les corrections jusqu’à clôture.",
      en: "Define minimum evidence; schedule proportionate inspections; record defects and changes; link repairs to findings; record exceptions; document compensating controls; assign actions; track corrections to closure.",
    },
    priority: "high",
    owners: ["Facilities", "GRC", "Site Owners"],
    closureEvidence: {
      fr: "Un échantillon montre qu’un défaut ou changement est détecté, attribué, corrigé et clos.",
      en: "A sample demonstrates that a defect or change is detected, assigned, remediated, and closed.",
    },
    closureCriteria: {
      fr: "La preuve de maintien est cohérente et exploitable pour les revues du contrôle.",
      en: "Maintenance evidence is coherent and reviewable.",
    },
    partialGapCode: "A7_1_PERIMETER_ASSURANCE_PARTIAL",
    fullGapCode: "A7_1_PERIMETER_ASSURANCE_ABSENT",
  },
  "P7.1-A04": {
    actionCode: "P7.1-A04",
    sourceQuestionId: "p7_1_004_third_party",
    title: {
      fr: "Assurer la couverture des périmètres tiers",
      en: "Assure third-party perimeter coverage",
    },
    partialGap: {
      fr: "Assurance incomplète des périmètres gérés par des tiers",
      en: "Incomplete assurance over third-party-managed perimeters",
    },
    fullGap: {
      fr: "Absence d’assurance sur les périmètres gérés par des tiers",
      en: "No assurance over third-party-managed perimeters",
    },
    partialDescription: {
      fr: "La répartition et la preuve des responsabilités sont partiellement établies.",
      en: "Responsibility allocation and proof of controls are partially established.",
    },
    fullDescription: {
      fr: "Aucune preuve de couverture ni de responsabilités documentées pour les dépendances tiers.",
      en: "No documented ownership or assurance exists for relevant third-party dependencies.",
    },
    recommendedActions: {
      fr: "Inventorier les locaux et installations tiers ; identifier les propriétaires contractuels ; clarifier les responsabilités ; intégrer les exigences aux accords ; obtenir les preuves pertinentes ; vérifier le périmètre des certifications ; documenter les exceptions ; suivre les incidents et changements ; revoir les écarts identifiés.",
      en: "Inventory third-party premises and facilities; identify contractual owners; clarify responsibilities; include requirements in agreements; obtain relevant evidence; verify certification scope; document exceptions; track incidents and changes; review identified gaps.",
    },
    priority: "high",
    owners: ["Procurement", "Facilities", "Supplier Manager", "Information Security"],
    closureEvidence: {
      fr: "Chaque dépendance physique tierce pertinente dispose de responsabilités claires et d’une assurance adaptée et vérifiable.",
      en: "Each relevant third-party physical dependency has clear responsibilities and appropriate, verifiable assurance.",
    },
    closureCriteria: {
      fr: "Le contrat et la preuve opérationnelle démontrent la couverture effective du périmètre tiers.",
      en: "Contract and operational evidence demonstrate effective third-party perimeter coverage.",
    },
    partialGapCode: "A7_1_THIRD_PARTY_PERIMETER_PARTIAL",
    fullGapCode: "A7_1_THIRD_PARTY_PERIMETER_ABSENT",
  },
} as const;

const actionByQuestionId = new Map<A71QuestionId, A71SubActionDefinition>(
  Object.values(A71_ACTIONS).map((action) => [action.sourceQuestionId, action]),
);

const questionClarifications: Record<A71QuestionId, LocalizedText> = {
  "p7_1_001": {
    fr: "Identifier avec Facilities et la sécurité quels locaux ou installations contiennent ou protègent des informations et actifs relevant du SMSI.",
    en: "Identify with Facilities and Information Security which premises or facilities contain or protect information and assets within the ISMS scope.",
  },
  "p7_1_002": {
    fr: "Effectuer un walkthrough des limites et points de passage avec Facilities et le propriétaire du site.",
    en: "Conduct a walkthrough of boundaries and access points with Facilities and the site owner.",
  },
  "p7_1_003": {
    fr: "Identifier où sont conservés les plans, inspections, tickets de réparation, exceptions et validations de clôture.",
    en: "Identify where plans, inspections, repair tickets, exceptions, and closure approvals are retained.",
  },
  "p7_1_004_third_party": {
    fr: "Demander au propriétaire du contrat quelles protections sont fournies, quelles preuves sont disponibles, et quelles responsabilités restent internes.",
    en: "Ask the contract owner which protections are provided, which evidence is available, and which responsibilities remain internal.",
  },
};

const questionQuestionMap = new Map<A71QuestionId, PhysicalSecurityPerimeterQuestion>(
  physicalSecurityPerimeterQuestions.map((question) => [question.id, question]),
);

export function derivePhysicalSecurityPerimetersRemediationPlan(
  responses: A71ResponseInput[],
  context: A71AssessmentContext = {},
  controlApplicabilityJustification?: string,
): A71RemediationPlanResult {
  const resolution = resolvePhysicalSecurityPerimeterQuestions(context);
  const latestResponses = new Map<A71QuestionId, A71ResponseInput>();

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
      planCode: PHYSICAL_SECURITY_PERIMETERS_PLAN_CODE,
      title: {
        fr: "Identifier, protéger et maintenir les périmètres physiques des zones contenant des informations et actifs associés",
        en: "Identify, protect, and maintain physical security perimeters for areas containing information and associated assets",
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
      planCode: PHYSICAL_SECURITY_PERIMETERS_PLAN_CODE,
      title: {
        fr: "Identifier, protéger et maintenir les périmètres physiques des zones contenant des informations et actifs associés",
        en: "Identify, protect, and maintain physical security perimeters for areas containing information and associated assets",
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

  const activeActionsByCode = new Map<string, A71DerivedSubAction>();
  const clarifications: Array<{ questionId: A71QuestionId; question: LocalizedText }> = [];
  const applicabilityReviews: LocalizedText[] = [];
  const visibleIds = new Set<A71QuestionId>(resolution.questionIds);

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

    if (outcome.createsGapAction === "none") continue;

    const subAction = actionByQuestionId.get(response.questionId);
    if (!subAction) continue;

    const gapType = outcome.createsGapAction === "partial" ? "partial" : "full";
    const gapCode = gapType === "partial" ? subAction.partialGapCode : subAction.fullGapCode;
    const existing = activeActionsByCode.get(subAction.actionCode);
    if (!existing) {
      activeActionsByCode.set(subAction.actionCode, {
        ...subAction,
        status: "active",
        gapType,
        gapCode,
      });
    } else {
      existing.gapType = gapType;
      existing.gapCode = gapCode;
    }
  }

  const activeActions = [...activeActionsByCode.values()];
  return {
    planCode: PHYSICAL_SECURITY_PERIMETERS_PLAN_CODE,
    title: {
      fr: "Identifier, protéger et maintenir les périmètres physiques des zones contenant des informations et actifs associés",
      en: "Identify, protect, and maintain physical security perimeters for areas containing information and associated assets",
    },
    controlApplicability: "applicable",
    controlReviewState: resolution.controlReviewState,
    requiresControlJustification: resolution.requiresControlJustification,
    assessmentBlocked: false,
    unresolvedConditions: resolution.unresolvedConditions,
    visibleQuestionIds: [...resolution.questionIds],
    hiddenQuestionIds: [...resolution.hiddenQuestionIds],
    activeActions,
    clarifications: [...clarifications],
    applicabilityReviews,
  };
};

export {
  A71_ACTIONS as physicalSecurityPerimetersActions,
  type A71ResponseInput as physicalSecurityPerimeterResponseInput,
  PHYSICAL_SECURITY_PERIMETER_GAP_CODES as physicalSecurityPerimeterGapCodes,
};
