import type { ScreeningAnswerValue } from "./outcomes.ts";
import {
  type A75AssessmentContext,
  type A75QuestionResolution,
  type PhysicalEnvironmentalThreatQuestionId,
  PHYSICAL_ENVIRONMENTAL_THREATS_PLAN_CODE,
  physicalEnvironmentalThreatQuestions,
  type PhysicalEnvironmentalThreatQuestion,
  PHYSICAL_ENVIRONMENTAL_THREATS_GAP_CODES,
  resolvePhysicalEnvironmentalThreatQuestions,
} from "../../content/assessment/physical/physical-environmental-threats.ts";
import { deriveAssessmentOutcome } from "./outcomes.ts";

export type LocalizedText = {
  fr: string;
  en: string;
};

export type A75PlanOwnership =
  | "Facilities"
  | "Information Security"
  | "Risk"
  | "Business Continuity"
  | "Health and Safety"
  | "Physical Security"
  | "GRC"
  | "Procurement"
  | "Supplier Manager";

export type A75SubActionStatus = "active" | "resolved";

type Priority = "low" | "medium" | "high";

export type A75SubActionDefinition = {
  actionCode: string;
  sourceQuestionId: PhysicalEnvironmentalThreatQuestionId;
  title: LocalizedText;
  partialGap: LocalizedText;
  fullGap: LocalizedText;
  partialDescription: LocalizedText;
  fullDescription: LocalizedText;
  recommendedActions: LocalizedText;
  partialPriority: Priority;
  fullPriority: Priority;
  owners: ReadonlyArray<A75PlanOwnership>;
  closureEvidence: LocalizedText;
  closureCriteria: LocalizedText;
  partialGapCode: string;
  fullGapCode: string;
};

export type A75ResponseInput = {
  questionId: PhysicalEnvironmentalThreatQuestionId;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  justification?: string;
  evidenceStatus?: Parameters<typeof deriveAssessmentOutcome>[0]["evidenceStatus"];
};

export type A75DerivedSubAction = A75SubActionDefinition & {
  status: A75SubActionStatus;
  gapType: "partial" | "full";
  gapCode: string;
  priority: Priority;
};

export type A75RemediationPlanResult = {
  planCode: typeof PHYSICAL_ENVIRONMENTAL_THREATS_PLAN_CODE;
  title: LocalizedText;
  controlApplicability: A75QuestionResolution["controlApplicability"];
  controlReviewState: A75QuestionResolution["controlReviewState"];
  requiresControlJustification: boolean;
  assessmentBlocked: boolean;
  unresolvedConditions: A75QuestionResolution["unresolvedConditions"];
  visibleQuestionIds: PhysicalEnvironmentalThreatQuestionId[];
  hiddenQuestionIds: PhysicalEnvironmentalThreatQuestionId[];
  activeActions: ReadonlyArray<A75DerivedSubAction>;
  clarifications: ReadonlyArray<{ questionId: PhysicalEnvironmentalThreatQuestionId; question: LocalizedText }>;
  applicabilityReviews: ReadonlyArray<LocalizedText>;
};

const A75_ACTIONS: Record<string, A75SubActionDefinition> = {
  "P7.5-A01": {
    actionCode: "P7.5-A01",
    sourceQuestionId: "p7_5_001",
    title: {
      fr: "Évaluation des menaces",
      en: "Threat assessment",
    },
    partialGap: {
      fr: "Évaluation des menaces physiques et environnementales incomplète",
      en: "Incomplete physical and environmental threat assessment",
    },
    fullGap: {
      fr: "Absence d’évaluation des menaces physiques et environnementales",
      en: "No physical and environmental threat assessment",
    },
    partialDescription: {
      fr: "Une évaluation existe, mais certains sites, dépendances, actifs, services, menaces naturelles, accidentelles ou malveillantes, évolutions locales, conditions climatiques, propriétaires ou décisions de traitement ne sont pas complètement couverts.",
      en: "An assessment exists, but certain sites, dependencies, assets, services, natural, accidental, or malicious threats, local changes, climate-related conditions, owners, or treatment decisions are not fully covered.",
    },
    fullDescription: {
      fr: "L’organisation ne dispose d’aucune évaluation documentée permettant de déterminer quelles menaces physiques ou environnementales peuvent affecter ses sites, dépendances, informations, équipements, personnes ou services.",
      en: "The organization has no documented assessment for determining which physical or environmental threats could affect its sites, dependencies, information, equipment, people, or services.",
    },
    recommendedActions: {
      fr: "- inventorier les sites et dépendances physiques ;\n- relier les sites aux actifs, informations et services concernés ;\n- identifier les menaces naturelles, accidentelles et malveillantes ;\n- examiner la localisation et l’environnement voisin ;\n- examiner les incidents et quasi-incidents ;\n- utiliser des données de risques pertinentes ;\n- examiner les conditions climatiques lorsqu’elles sont pertinentes ;\n- évaluer la vraisemblance et l’impact ;\n- prendre en compte les changements du site ou de son usage ;\n- attribuer les propriétaires des risques ;\n- documenter les traitements, acceptations et mesures compensatoires ;\n- faire approuver et versionner les évaluations.",
      en: "- inventory sites and physical dependencies;\n- link sites to relevant assets, information, and services;\n- identify natural, accidental, and malicious threats;\n- review the location and neighboring environment;\n- review incidents and near misses;\n- use relevant risk information;\n- assess climate-related conditions where relevant;\n- evaluate likelihood and impact;\n- consider changes in site or use;\n- assign risk owners;\n- document treatments, acceptances, and compensating controls;\n- approve and version assessments.",
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["Facilities", "Risk", "Information Security", "Business Continuity"],
    closureEvidence: {
      fr: "Chaque site ou dépendance physique pertinente dispose d’une évaluation approuvée, reliée aux actifs et services concernés, avec des propriétaires et décisions de traitement identifiables.",
      en: "Each relevant site or physical dependency has an approved assessment linked to the relevant assets and services, with identifiable owners and treatment decisions.",
    },
    closureCriteria: {
      fr: "Chaque site ou dépendance physique pertinente dispose d’une évaluation approuvée, reliée aux actifs et services concernés, avec des propriétaires et décisions de traitement identifiables.",
      en: "Each relevant site or physical dependency has an approved assessment linked to the relevant assets and services, with identifiable owners and treatment decisions.",
    },
    partialGapCode: "A7_5_THREAT_ASSESSMENT_PARTIAL",
    fullGapCode: "A7_5_THREAT_ASSESSMENT_ABSENT",
  },
  "P7.5-A02": {
    actionCode: "P7.5-A02",
    sourceQuestionId: "p7_5_002",
    title: {
      fr: "Mesures de protection",
      en: "Protective measures",
    },
    partialGap: {
      fr: "Mesures de protection physiques ou environnementales incomplètes",
      en: "Incomplete physical or environmental protective measures",
    },
    fullGap: {
      fr: "Absence de mesures adaptées aux menaces identifiées",
      en: "No appropriate measures for identified threats",
    },
    partialDescription: {
      fr: "Des mesures existent, mais certains risques, sites, actifs, scénarios, périodes, moyens de détection, modalités de réponse, dispositions de récupération ou coordinations avec la sécurité des personnes ne sont pas traités de manière cohérente.",
      en: "Measures exist, but certain risks, sites, assets, scenarios, periods, detection methods, response arrangements, recovery arrangements, or coordination with life safety are not addressed consistently.",
    },
    fullDescription: {
      fr: "Des menaces physiques ou environnementales significatives ont été identifiées, mais aucune mesure proportionnée ne permet de prévenir, détecter, traiter ou récupérer après leur réalisation.",
      en: "Significant physical or environmental threats have been identified, but no proportionate measures are in place to prevent, detect, respond to, or recover from them.",
    },
    recommendedActions: {
      fr: "- comparer les protections existantes aux risques évalués ;\n- identifier les risques non traités ou insuffisamment traités ;\n- définir des mesures proportionnées de prévention ;\n- définir les moyens de détection et d’alerte nécessaires ;\n- définir la réponse aux incidents ;\n- protéger les personnes et les voies d’évacuation ;\n- coordonner les mesures avec les plans d’urgence ;\n- coordonner les mesures avec la continuité et la récupération ;\n- définir les modalités de mise en sécurité des actifs ;\n- intégrer les responsabilités des bailleurs et fournisseurs ;\n- documenter les mesures compensatoires ;\n- attribuer les actions ;\n- tester et vérifier les corrections.",
      en: "- compare existing protections with assessed risks;\n- identify untreated or insufficiently treated risks;\n- define proportionate preventive measures;\n- define necessary detection and alerting;\n- define incident response;\n- protect people and evacuation routes;\n- coordinate measures with emergency plans;\n- coordinate measures with continuity and recovery;\n- define arrangements for safeguarding assets;\n- incorporate landlord and supplier responsibilities;\n- document compensating controls;\n- assign actions;\n- test and verify remediation.",
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["Facilities", "Health and Safety", "Physical Security", "Business Continuity"],
    closureEvidence: {
      fr: "Les risques physiques et environnementaux prioritaires disposent de traitements approuvés et démontrables, compatibles avec la sécurité des personnes, les urgences et la continuité d’activité.",
      en: "Priority physical and environmental risks have approved and demonstrable treatments compatible with life safety, emergency, and business continuity arrangements.",
    },
    closureCriteria: {
      fr: "Les risques physiques et environnementaux prioritaires disposent de traitements approuvés et démontrables, compatibles avec la sécurité des personnes, les urgences et la continuité d’activité.",
      en: "Priority physical and environmental risks have approved and demonstrable treatments compatible with life safety, emergency, and business continuity arrangements.",
    },
    partialGapCode: "A7_5_PROTECTIVE_MEASURES_PARTIAL",
    fullGapCode: "A7_5_PROTECTIVE_MEASURES_ABSENT",
  },
  "P7.5-A03": {
    actionCode: "P7.5-A03",
    sourceQuestionId: "p7_5_003",
    title: {
      fr: "Tests et assurance",
      en: "Testing and assurance",
    },
    partialGap: {
      fr: "Tests et assurance des protections incomplets",
      en: "Incomplete testing and assurance of protective measures",
    },
    fullGap: {
      fr: "Absence de preuve d’efficacité des protections",
      en: "No evidence of protective-measure effectiveness",
    },
    partialDescription: {
      fr: "Certaines inspections, maintenances ou vérifications sont réalisées, mais les tests, exercices, incidents, quasi-incidents, exceptions, enseignements, corrections ou décisions de clôture ne sont pas entièrement traçables.",
      en: "Some inspections, maintenance, or checks are performed, but tests, exercises, incidents, near misses, exceptions, lessons learned, remediation, or closure decisions are not fully traceable.",
    },
    fullDescription: {
      fr: "L’organisation ne peut pas démontrer que les protections contre les menaces physiques et environnementales sont inspectées, testées, maintenues et corrigées lorsque des défauts sont identifiés.",
      en: "The organization cannot demonstrate that protections against physical and environmental threats are inspected, tested, maintained, and remediated when defects are identified.",
    },
    recommendedActions: {
      fr: "- définir les preuves minimales attendues ;\n- organiser des inspections proportionnées aux risques ;\n- définir les tests nécessaires ;\n- définir les maintenances applicables ;\n- organiser des exercices lorsque justifiés ;\n- conserver les résultats ;\n- enregistrer les incidents et quasi-incidents ;\n- enregistrer les pannes et indisponibilités ;\n- documenter les exceptions et mesures compensatoires ;\n- consigner les enseignements ;\n- créer et attribuer les actions correctives ;\n- vérifier les corrections ;\n- suivre les actions jusqu’à clôture ;\n- conserver les validations de clôture.",
      en: "- define minimum expected evidence;\n- arrange inspections proportionate to risk;\n- define required testing;\n- define applicable maintenance;\n- conduct exercises where justified;\n- retain results;\n- record incidents and near misses;\n- record failures and unavailability;\n- document exceptions and compensating controls;\n- record lessons learned;\n- create and assign corrective actions;\n- verify remediation;\n- track actions to closure;\n- retain closure approvals.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Facilities", "Business Continuity", "GRC", "Health and Safety"],
    closureEvidence: {
      fr: "Un échantillon permet de retracer une inspection, un test, un exercice ou un incident depuis son résultat jusqu’à la correction et la validation de clôture.",
      en: "A sample traces an inspection, test, exercise, or incident from its result through remediation and closure approval.",
    },
    closureCriteria: {
      fr: "Un échantillon permet de retracer une inspection, un test, un exercice ou un incident depuis son résultat jusqu’à la correction et la validation de clôture.",
      en: "A sample traces an inspection, test, exercise, or incident from its result through remediation and closure approval.",
    },
    partialGapCode: "A7_5_TESTING_ASSURANCE_PARTIAL",
    fullGapCode: "A7_5_TESTING_ASSURANCE_ABSENT",
  },
  "P7.5-A04": {
    actionCode: "P7.5-A04",
    sourceQuestionId: "p7_5_004_third_party",
    title: {
      fr: "Résilience des installations tierces",
      en: "Third-party facility resilience",
    },
    partialGap: {
      fr: "Assurance incomplète sur la résilience des installations tierces",
      en: "Incomplete assurance over third-party facility resilience",
    },
    fullGap: {
      fr: "Absence d’assurance sur la résilience des installations tierces",
      en: "No assurance over third-party facility resilience",
    },
    partialDescription: {
      fr: "Un tiers fournit ou gère des installations pertinentes, mais certaines responsabilités, menaces, protections, maintenances, tests, notifications, preuves, changements ou actions de suivi ne sont pas complètement documentés ou vérifiables.",
      en: "A third party provides or manages relevant facilities, but certain responsibilities, threats, protections, maintenance, testing, notifications, evidence, changes, or follow-up actions are not fully documented or verifiable.",
    },
    fullDescription: {
      fr: "L’organisation dépend d’un bailleur, centre de données ou fournisseur pour des installations pertinentes sans responsabilités documentées ni preuve vérifiable de leur protection contre les menaces physiques et environnementales.",
      en: "The organization relies on a landlord, data centre, or supplier for relevant facilities without documented responsibilities or verifiable evidence of protection against physical and environmental threats.",
    },
    recommendedActions: {
      fr: "- inventorier les installations tierces pertinentes ;\n- identifier les services et actifs dépendants ;\n- identifier les propriétaires des contrats ;\n- documenter les responsabilités partagées ;\n- intégrer les exigences physiques et environnementales aux contrats ;\n- obtenir les descriptions des protections ;\n- obtenir les rapports de tests et maintenances pertinents ;\n- vérifier le périmètre des certifications ou rapports d’assurance ;\n- définir les notifications d’incident et de changement ;\n- examiner les plans de continuité et récupération ;\n- identifier les sous-traitants critiques ;\n- documenter les exceptions et mesures compensatoires ;\n- créer les actions de suivi ;\n- revoir les preuves lors des changements.",
      en: "- inventory relevant third-party facilities;\n- identify dependent services and assets;\n- identify contract owners;\n- document shared responsibilities;\n- incorporate physical and environmental requirements into agreements;\n- obtain descriptions of protective measures;\n- obtain relevant testing and maintenance reports;\n- verify the scope of certifications or assurance reports;\n- define incident and change notifications;\n- review continuity and recovery arrangements;\n- identify critical subcontractors;\n- document exceptions and compensating controls;\n- create follow-up actions;\n- review evidence when changes occur.",
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["Procurement", "Supplier Manager", "Facilities", "Business Continuity"],
    closureEvidence: {
      fr: "Chaque dépendance tierce pertinente dispose de responsabilités, protections, tests, notifications et preuves de résilience documentés, pertinents et vérifiables.",
      en: "Each relevant third-party dependency has documented, relevant, and verifiable responsibilities, protections, testing, notifications, and resilience evidence.",
    },
    closureCriteria: {
      fr: "Chaque dépendance tierce pertinente dispose de responsabilités, protections, tests, notifications et preuves de résilience documentés, pertinents et vérifiables.",
      en: "Each relevant third-party dependency has documented, relevant, and verifiable responsibilities, protections, testing, notifications, and resilience evidence.",
    },
    partialGapCode: "A7_5_THIRD_PARTY_RESILIENCE_PARTIAL",
    fullGapCode: "A7_5_THIRD_PARTY_RESILIENCE_ABSENT",
  },
} as const;

const actionByQuestionId = new Map<PhysicalEnvironmentalThreatQuestionId, A75SubActionDefinition>(
  Object.values(A75_ACTIONS).map((action) => [action.sourceQuestionId, action]),
);

const questionClarifications: Record<PhysicalEnvironmentalThreatQuestionId, LocalizedText> = {
  "p7_5_001": {
    fr: "Demander à Facilities, Risk, Information Security et Business Continuity quels sites et dépendances soutiennent le SMSI et quelles menaces pourraient interrompre ou endommager leurs activités.",
    en: "Ask Facilities, Risk, Information Security, and Business Continuity which sites and dependencies support the ISMS and which threats could disrupt or damage their activities.",
  },
  "p7_5_002": {
    fr: "Examiner avec Facilities, santé-sécurité et Business Continuity comment les menaces prioritaires sont actuellement prévenues, détectées, traitées et couvertes en récupération.",
    en: "Review with Facilities, Health and Safety, and Business Continuity how priority threats are currently prevented, detected, handled, and addressed in recovery.",
  },
  "p7_5_003": {
    fr: "Identifier où sont conservés les inspections, tests, maintenances, exercices, incidents, quasi-incidents, exceptions, enseignements et validations de clôture.",
    en: "Identify where inspections, tests, maintenance, exercises, incidents, near misses, exceptions, lessons learned, and closure approvals are retained.",
  },
  "p7_5_004_third_party": {
    fr: "Demander au propriétaire du contrat, au bailleur ou au fournisseur quelles menaces sont couvertes, quelles protections sont exploitées, quels tests sont réalisés et quelles preuves sont accessibles.",
    en: "Ask the contract owner, landlord, or supplier which threats are addressed, which protections are operated, which tests are performed, and which evidence is available.",
  },
};

const questionQuestionMap = new Map<PhysicalEnvironmentalThreatQuestionId, PhysicalEnvironmentalThreatQuestion>(
  physicalEnvironmentalThreatQuestions.map((question) => [question.id, question]),
);

export function derivePhysicalEnvironmentalThreatRemediationPlan(
  responses: A75ResponseInput[],
  context: A75AssessmentContext = {},
  controlApplicabilityJustification?: string,
): A75RemediationPlanResult {
  const resolution = resolvePhysicalEnvironmentalThreatQuestions(context);
  const latestResponses = new Map<PhysicalEnvironmentalThreatQuestionId, A75ResponseInput>();

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
      planCode: PHYSICAL_ENVIRONMENTAL_THREATS_PLAN_CODE,
      title: {
        fr: "Évaluer, traiter et démontrer la maîtrise des menaces physiques et environnementales",
        en: "Assess, address, and demonstrate control of physical and environmental threats",
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
      planCode: PHYSICAL_ENVIRONMENTAL_THREATS_PLAN_CODE,
      title: {
        fr: "Évaluer, traiter et démontrer la maîtrise des menaces physiques et environnementales",
        en: "Assess, address, and demonstrate control of physical and environmental threats",
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

  const activeActionsByCode = new Map<string, A75DerivedSubAction>();
  const clarifications: Array<{ questionId: PhysicalEnvironmentalThreatQuestionId; question: LocalizedText }> = [];
  const applicabilityReviews: LocalizedText[] = [];
  const visibleIds = new Set<PhysicalEnvironmentalThreatQuestionId>(resolution.questionIds);

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
    planCode: PHYSICAL_ENVIRONMENTAL_THREATS_PLAN_CODE,
    title: {
      fr: "Évaluer, traiter et démontrer la maîtrise des menaces physiques et environnementales",
      en: "Assess, address, and demonstrate control of physical and environmental threats",
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
};

export {
  A75_ACTIONS as physicalEnvironmentalThreatActions,
  type A75ResponseInput as physicalEnvironmentalThreatResponseInput,
  PHYSICAL_ENVIRONMENTAL_THREATS_GAP_CODES as physicalEnvironmentalThreatGapCodes,
};
