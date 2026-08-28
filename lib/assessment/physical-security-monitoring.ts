import type { ScreeningAnswerValue } from "./outcomes.ts";
import {
  type A74AssessmentContext,
  type A74QuestionResolution,
  type PhysicalSecurityMonitoringQuestionId,
  PHYSICAL_SECURITY_MONITORING_PLAN_CODE,
  physicalSecurityMonitoringQuestions,
  type PhysicalSecurityMonitoringQuestion,
  PHYSICAL_SECURITY_MONITORING_GAP_CODES,
  resolvePhysicalSecurityMonitoringQuestions,
} from "../../content/assessment/physical/physical-security-monitoring.ts";
import { deriveAssessmentOutcome } from "./outcomes.ts";

export type LocalizedText = {
  fr: string;
  en: string;
};

export type A74PlanOwnership =
  | "Facilities"
  | "Information Security"
  | "Physical Security"
  | "Security Operations"
  | "GRC"
  | "IT"
  | "Site Owners"
  | "Privacy"
  | "Legal"
  | "HR"
  | "Supplier Manager";

export type A74SubActionStatus = "active" | "resolved";

type Priority = "low" | "medium" | "high";

export type A74SubActionDefinition = {
  actionCode: string;
  sourceQuestionId: PhysicalSecurityMonitoringQuestionId;
  title: LocalizedText;
  partialGap: LocalizedText;
  fullGap: LocalizedText;
  partialDescription: LocalizedText;
  fullDescription: LocalizedText;
  recommendedActions: LocalizedText;
  partialPriority: Priority;
  fullPriority: Priority;
  owners: ReadonlyArray<A74PlanOwnership>;
  closureEvidence: LocalizedText;
  closureCriteria: LocalizedText;
  partialGapCode: string;
  fullGapCode: string;
};

export type A74ResponseInput = {
  questionId: PhysicalSecurityMonitoringQuestionId;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  justification?: string;
  evidenceStatus?: Parameters<typeof deriveAssessmentOutcome>[0]["evidenceStatus"];
};

export type A74DerivedSubAction = A74SubActionDefinition & {
  status: A74SubActionStatus;
  gapType: "partial" | "full";
  gapCode: string;
  priority: Priority;
};

export type A74RemediationPlanResult = {
  planCode: typeof PHYSICAL_SECURITY_MONITORING_PLAN_CODE;
  title: LocalizedText;
  controlApplicability: A74QuestionResolution["controlApplicability"];
  controlReviewState: A74QuestionResolution["controlReviewState"];
  requiresControlJustification: boolean;
  assessmentBlocked: boolean;
  unresolvedConditions: A74QuestionResolution["unresolvedConditions"];
  visibleQuestionIds: PhysicalSecurityMonitoringQuestionId[];
  hiddenQuestionIds: PhysicalSecurityMonitoringQuestionId[];
  activeActions: ReadonlyArray<A74DerivedSubAction>;
  clarifications: ReadonlyArray<{ questionId: PhysicalSecurityMonitoringQuestionId; question: LocalizedText }>;
  applicabilityReviews: ReadonlyArray<LocalizedText>;
};

const A74_ACTIONS: Record<string, A74SubActionDefinition> = {
  "P7.4-A01": {
    actionCode: "P7.4-A01",
    sourceQuestionId: "p7_4_001",
    title: {
      fr: "Stratégie de surveillance",
      en: "Monitoring strategy",
    },
    partialGap: {
      fr: "Stratégie de surveillance physique incomplète",
      en: "Incomplete physical monitoring strategy",
    },
    fullGap: {
      fr: "Absence de stratégie de surveillance physique",
      en: "No physical monitoring strategy",
    },
    partialDescription: {
      fr: "Une approche existe, mais certains locaux, scénarios, périodes, moyens, responsables, alertes, modalités de réponse, indisponibilités, dépendances tierces ou exigences de vie privée ne sont pas complètement définis.",
      en: "An approach exists, but certain premises, scenarios, periods, methods, responsibilities, alerts, response arrangements, outages, third-party dependencies, or privacy requirements are not fully defined.",
    },
    fullDescription: {
      fr: "L’organisation ne dispose d’aucune approche documentée permettant de déterminer quels locaux doivent être surveillés, dans quels scénarios, par quels moyens et avec quelle réponse.",
      en: "The organization has no documented approach for determining which premises should be monitored, for which scenarios, using which methods, and with what response.",
    },
    recommendedActions: {
      fr: "- inventorier les locaux et zones pertinents ;\n- identifier les scénarios d’intrusion ou d’accès non autorisé ;\n- définir les objectifs de détection et dissuasion ;\n- définir les périodes nécessitant une couverture ;\n- sélectionner des moyens proportionnés aux risques ;\n- attribuer les propriétaires ;\n- définir le routage des alertes ;\n- définir l’analyse, l’escalade et la réponse ;\n- traiter les indisponibilités et pannes ;\n- clarifier les responsabilités des bailleurs et fournisseurs ;\n- examiner les exigences de vie privée et de protection des données ;\n- documenter les exceptions et mesures compensatoires ;\n- définir les changements déclenchant une revue ;\n- approuver et versionner l’approche.",
      en: "- inventory relevant premises and areas;\n- identify intrusion or unauthorized-access scenarios;\n- define detection and deterrence objectives;\n- define periods requiring coverage;\n- select methods proportionate to risk;\n- assign owners;\n- define alert routing;\n- define assessment, escalation, and response;\n- address outages and failures;\n- clarify landlord and provider responsibilities;\n- review privacy and data-protection requirements;\n- document exceptions and compensating controls;\n- define changes triggering review;\n- approve and version the approach.",
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["Physical Security", "Facilities", "Information Security"],
    closureEvidence: {
      fr: "Une stratégie approuvée couvre les locaux, scénarios, périodes, responsabilités et modalités de réponse pertinents en fonction des risques.",
      en: "An approved strategy covers relevant premises, scenarios, periods, responsibilities, and response arrangements according to risk.",
    },
    closureCriteria: {
      fr: "Une stratégie approuvée couvre les locaux, scénarios, périodes, responsabilités et modalités de réponse pertinents en fonction des risques.",
      en: "An approved strategy covers relevant premises, scenarios, periods, responsibilities, and response arrangements according to risk.",
    },
    partialGapCode: "A7_4_MONITORING_DESIGN_PARTIAL",
    fullGapCode: "A7_4_MONITORING_DESIGN_ABSENT",
  },
  "P7.4-A02": {
    actionCode: "P7.4-A02",
    sourceQuestionId: "p7_4_002",
    title: {
      fr: "Fonctionnement et réponse",
      en: "Operation and response",
    },
    partialGap: {
      fr: "Fonctionnement ou réponse du dispositif de surveillance incomplet",
      en: "Incomplete monitoring operation or response",
    },
    fullGap: {
      fr: "Surveillance physique non opérationnelle",
      en: "Physical monitoring is not operational",
    },
    partialDescription: {
      fr: "Des moyens de surveillance existent, mais certaines zones, périodes, protections contre l’altération, détections de panne, alertes, analyses, escalades ou réponses ne fonctionnent pas de manière cohérente.",
      en: "Monitoring arrangements exist, but certain areas, periods, tamper protection, failure detection, alerts, assessments, escalations, or responses do not operate consistently.",
    },
    fullDescription: {
      fr: "Les locaux nécessitant une surveillance ne disposent d’aucun moyen opérationnel permettant de détecter les accès non autorisés et de déclencher une réponse appropriée.",
      en: "Premises requiring monitoring have no operational arrangement capable of detecting unauthorized access and triggering an appropriate response.",
    },
    recommendedActions: {
      fr: "- vérifier la couverture des zones et points pertinents ;\n- configurer ou corriger les moyens retenus ;\n- vérifier leur activation pendant les périodes prévues ;\n- protéger les dispositifs et configurations contre l’altération ;\n- détecter les pannes et indisponibilités ;\n- tester le routage des alertes ;\n- désigner les destinataires ;\n- définir l’analyse et l’escalade ;\n- appliquer les modalités de réponse ;\n- documenter les alertes et décisions pertinentes ;\n- gérer les faux positifs ;\n- définir les mesures compensatoires pendant une panne ;\n- corriger les défauts ;\n- vérifier le fonctionnement après correction.",
      en: "- verify coverage of relevant areas and points;\n- configure or remediate selected arrangements;\n- verify activation during intended periods;\n- protect devices and configurations against tampering;\n- detect failures and unavailability;\n- test alert routing;\n- assign recipients;\n- define assessment and escalation;\n- apply response arrangements;\n- document relevant alerts and decisions;\n- manage false positives;\n- define compensating controls during outages;\n- remediate defects;\n- verify operation after remediation.",
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["Physical Security", "Facilities", "IT", "Site Owners"],
    closureEvidence: {
      fr: "Un test ou événement échantillonné démontre qu’une alerte est détectée, transmise, analysée, traitée et clôturée selon les modalités définies.",
      en: "A sampled test or event demonstrates that an alert is detected, routed, assessed, handled, and closed according to defined arrangements.",
    },
    closureCriteria: {
      fr: "Un test ou événement échantillonné démontre qu’une alerte est détectée, transmise, analysée, traitée et clôturée selon les modalités définies.",
      en: "A sampled test or event demonstrates that an alert is detected, routed, assessed, handled, and closed according to defined arrangements.",
    },
    partialGapCode: "A7_4_MONITORING_OPERATION_PARTIAL",
    fullGapCode: "A7_4_MONITORING_OPERATION_ABSENT",
  },
  "P7.4-A03": {
    actionCode: "P7.4-A03",
    sourceQuestionId: "p7_4_003",
    title: {
      fr: "Traçabilité et amélioration",
      en: "Traceability and improvement",
    },
    partialGap: {
      fr: "Traçabilité ou amélioration du dispositif incomplète",
      en: "Incomplete monitoring traceability or improvement",
    },
    fullGap: {
      fr: "Absence de preuve de fonctionnement et de maintien du dispositif",
      en: "No evidence that monitoring operates and is maintained",
    },
    partialDescription: {
      fr: "Certaines preuves sont conservées, mais les tests, maintenances, pannes, alertes, incidents, changements, exceptions, actions correctives ou décisions de clôture ne sont pas entièrement traçables.",
      en: "Some evidence is retained, but tests, maintenance, failures, alerts, incidents, changes, exceptions, corrective actions, or closure decisions are not fully traceable.",
    },
    fullDescription: {
      fr: "L’organisation ne peut pas démontrer que le dispositif de surveillance est testé, maintenu, utilisé lors des alertes et amélioré lorsque des défauts sont identifiés.",
      en: "The organization cannot demonstrate that monitoring arrangements are tested, maintained, used when alerts occur, and improved when defects are identified.",
    },
    recommendedActions: {
      fr: "- définir les preuves minimales ;\n- organiser des tests proportionnés ;\n- documenter les maintenances et contrôles d’état ;\n- enregistrer les pannes et restaurations ;\n- conserver les alertes, analyses et escalades pertinentes ;\n- documenter les incidents ;\n- contrôler les changements de configuration ou couverture ;\n- enregistrer les exceptions et mesures compensatoires ;\n- créer et attribuer les actions correctives ;\n- vérifier les corrections ;\n- enregistrer les enseignements ;\n- suivre les actions jusqu’à clôture ;\n- conserver les validations de clôture.",
      en: "- define minimum evidence;\n- arrange proportionate tests;\n- document maintenance and health checks;\n- record outages and restoration;\n- retain relevant alerts, assessments, and escalations;\n- document incidents;\n- control configuration or coverage changes;\n- record exceptions and compensating controls;\n- create and assign corrective actions;\n- verify remediation;\n- record lessons learned;\n- track actions to closure;\n- retain closure approvals.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Security Operations", "Facilities", "GRC", "Site Owners"],
    closureEvidence: {
      fr: "Un échantillon permet de retracer un test, une panne ou une alerte depuis sa détection jusqu’à sa correction et sa clôture.",
      en: "A sample traces a test, outage, or alert from detection through remediation and closure.",
    },
    closureCriteria: {
      fr: "Un échantillon permet de retracer un test, une panne ou une alerte depuis sa détection jusqu’à sa correction et sa clôture.",
      en: "A sample traces a test, outage, or alert from detection through remediation and closure.",
    },
    partialGapCode: "A7_4_MONITORING_TRACEABILITY_PARTIAL",
    fullGapCode: "A7_4_MONITORING_TRACEABILITY_ABSENT",
  },
  "P7.4-A04": {
    actionCode: "P7.4-A04",
    sourceQuestionId: "p7_4_004_personal_data",
    title: {
      fr: "Vie privée et données",
      en: "Privacy and personal data",
    },
    partialGap: {
      fr: "Gouvernance incomplète des données de surveillance",
      en: "Incomplete governance of monitoring personal data",
    },
    fullGap: {
      fr: "Données de surveillance traitées sans gouvernance appropriée",
      en: "Monitoring personal data is processed without appropriate governance",
    },
    partialDescription: {
      fr: "La surveillance permet d’identifier ou suivre des personnes, mais certaines finalités, bases juridiques, évaluations de nécessité, informations, restrictions d’accès, conservations, suppressions ou procédures de droits ne sont pas complètement définies ou appliquées.",
      en: "Monitoring identifies or tracks individuals, but certain purposes, lawful bases, necessity assessments, notices, access restrictions, retention, deletion, or rights procedures are not fully defined or implemented.",
    },
    fullDescription: {
      fr: "Un dispositif identifie ou suit des personnes sans documentation suffisante de sa finalité, de sa légitimité, de sa proportionnalité, de ses accès, de sa conservation et des droits applicables.",
      en: "Monitoring identifies or tracks individuals without sufficient documentation of its purpose, legitimacy, proportionality, access, retention, and applicable rights.",
    },
    recommendedActions: {
      fr: "- inventorier les dispositifs et données collectées ;\n- identifier les personnes concernées ;\n- définir les finalités ;\n- déterminer la base juridique avec les fonctions compétentes ;\n- évaluer la nécessité et la proportionnalité ;\n- réaliser une analyse d’impact lorsqu’elle est requise ;\n- fournir les informations ou signalisations appropriées ;\n- limiter et tracer les accès ;\n- protéger les données contre l’usage ou la copie non autorisés ;\n- définir une conservation justifiée ;\n- mettre en œuvre la suppression ;\n- encadrer la consultation et la divulgation ;\n- gérer les demandes et droits applicables ;\n- documenter le traitement ;\n- encadrer les prestataires ;\n- réévaluer le dispositif lors des changements.",
      en: "- inventory monitoring arrangements and collected data;\n- identify affected individuals;\n- define purposes;\n- determine the lawful basis with competent functions;\n- assess necessity and proportionality;\n- perform an impact assessment where required;\n- provide appropriate notices or signage;\n- restrict and trace access;\n- protect data against unauthorized use or copying;\n- define justified retention;\n- implement deletion;\n- govern access and disclosure;\n- handle applicable requests and rights;\n- document processing;\n- govern providers;\n- reassess arrangements when changes occur.",
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["Privacy", "Legal", "Information Security", "Facilities", "HR"],
    closureEvidence: {
      fr: "Le traitement des données de surveillance est documenté, approuvé, proportionné, protégé et appliqué conformément aux exigences juridiques identifiées.",
      en: "Processing of monitoring personal data is documented, approved, proportionate, protected, and operated according to identified legal requirements.",
    },
    closureCriteria: {
      fr: "Le traitement des données de surveillance est documenté, approuvé, proportionné, protégé et appliqué conformément aux exigences juridiques identifiées.",
      en: "Processing of monitoring personal data is documented, approved, proportionate, protected, and operated according to identified legal requirements.",
    },
    partialGapCode: "A7_4_MONITORING_PRIVACY_PARTIAL",
    fullGapCode: "A7_4_MONITORING_PRIVACY_ABSENT",
  },
  "P7.4-A05": {
    actionCode: "P7.4-A05",
    sourceQuestionId: "p7_4_005_third_party",
    title: {
      fr: "Surveillance par un tiers",
      en: "Third-party monitoring",
    },
    partialGap: {
      fr: "Assurance incomplète de la surveillance fournie par un tiers",
      en: "Incomplete assurance over third-party-provided monitoring",
    },
    fullGap: {
      fr: "Absence d’assurance sur la surveillance fournie par un tiers",
      en: "No assurance over third-party-provided monitoring",
    },
    partialDescription: {
      fr: "Un tiers fournit la surveillance, mais certaines zones, périodes, responsabilités, alertes, notifications, maintenances, preuves, changements ou exceptions ne sont pas complètement couverts.",
      en: "A third party provides monitoring, but certain areas, periods, responsibilities, alerts, notifications, maintenance, evidence, changes, or exceptions are not fully covered.",
    },
    fullDescription: {
      fr: "L’organisation dépend d’un bailleur, opérateur ou prestataire pour la surveillance physique sans responsabilités documentées ni preuve vérifiable du service fourni.",
      en: "The organization relies on a landlord, operator, or provider for physical monitoring without documented responsibilities or verifiable evidence of the service provided.",
    },
    recommendedActions: {
      fr: "- inventorier les sites et services de surveillance tiers ;\n- identifier les propriétaires contractuels ;\n- documenter les zones et périodes couvertes ;\n- clarifier les responsabilités ;\n- définir le routage et les destinataires des alertes ;\n- définir les notifications d’incident ;\n- encadrer les pannes, tests et maintenances ;\n- garantir un accès approprié aux journaux, images ou rapports ;\n- vérifier les conditions de conservation et divulgation ;\n- identifier les sous-traitants ;\n- intégrer les exigences aux contrats ou baux ;\n- obtenir des preuves pertinentes ;\n- vérifier le périmètre des certifications ;\n- enregistrer les incidents, changements et exceptions ;\n- suivre les écarts ;\n- revoir l’assurance lors des changements.",
      en: "- inventory third-party monitoring sites and services;\n- identify contract owners;\n- document covered areas and periods;\n- clarify responsibilities;\n- define alert routing and recipients;\n- define incident notifications;\n- govern outages, tests, and maintenance;\n- ensure appropriate access to logs, images, or reports;\n- verify retention and disclosure conditions;\n- identify subcontractors;\n- incorporate requirements into agreements or leases;\n- obtain relevant evidence;\n- verify certification scope;\n- record incidents, changes, and exceptions;\n- track gaps;\n- review assurance when changes occur.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Facilities", "Supplier Manager", "Legal", "Information Security"],
    closureEvidence: {
      fr: "Chaque dépendance tierce dispose de responsabilités, couverture, alertes, notifications et preuves clairement documentées et vérifiables.",
      en: "Each third-party dependency has clearly documented and verifiable responsibilities, coverage, alerts, notifications, and evidence.",
    },
    closureCriteria: {
      fr: "Chaque dépendance tierce dispose de responsabilités, couverture, alertes, notifications et preuves clairement documentées et vérifiables.",
      en: "Each third-party dependency has clearly documented and verifiable responsibilities, coverage, alerts, notifications, and evidence.",
    },
    partialGapCode: "A7_4_THIRD_PARTY_MONITORING_PARTIAL",
    fullGapCode: "A7_4_THIRD_PARTY_MONITORING_ABSENT",
  }
} as const;

const actionByQuestionId = new Map<PhysicalSecurityMonitoringQuestionId, A74SubActionDefinition>(
  Object.values(A74_ACTIONS).map((action) => [action.sourceQuestionId, action]),
);

const questionClarifications: Record<PhysicalSecurityMonitoringQuestionId, LocalizedText> = {
  "p7_4_001": {
    fr: "Demander à Facilities, à la sécurité physique et à la sécurité de l’information quels locaux et scénarios nécessitent une surveillance et quelle réponse est attendue.",
    en: "Ask Facilities, Physical Security, and Information Security which premises and scenarios require monitoring and what response is expected.",
  },
  "p7_4_002": {
    fr: "Tester avec Facilities ou la sécurité physique un moyen de surveillance et son routage d’alerte jusqu’au destinataire et à la réponse prévue.",
    en: "Test a monitoring arrangement and its alert routing with Facilities or Physical Security through to the intended recipient and response.",
  },
  "p7_4_003": {
    fr: "Identifier où sont conservés les tests, maintenances, alertes, incidents, changements, exceptions et validations de clôture.",
    en: "Identify where tests, maintenance, alerts, incidents, changes, exceptions, and closure approvals are retained.",
  },
  "p7_4_004_personal_data": {
    fr: "Demander aux fonctions vie privée et juridique quelles données personnelles sont collectées, pour quelle finalité, selon quelle base et pendant combien de temps.",
    en: "Ask Privacy and Legal which personal data is collected, for which purpose, under which basis, and for how long.",
  },
  "p7_4_005_third_party": {
    fr: "Demander au gestionnaire du site et au propriétaire du contrat quelle surveillance est fournie, comment les alertes sont transmises et quelles preuves sont accessibles.",
    en: "Ask the site operator and contract owner which monitoring is provided, how alerts are routed, and which evidence is accessible.",
  },
};

const questionQuestionMap = new Map<PhysicalSecurityMonitoringQuestionId, PhysicalSecurityMonitoringQuestion>(
  physicalSecurityMonitoringQuestions.map((question) => [question.id, question]),
);

export function derivePhysicalSecurityMonitoringRemediationPlan(
  responses: A74ResponseInput[],
  context: A74AssessmentContext = {},
  controlApplicabilityJustification?: string,
): A74RemediationPlanResult {
  const resolution = resolvePhysicalSecurityMonitoringQuestions(context);
  const latestResponses = new Map<PhysicalSecurityMonitoringQuestionId, A74ResponseInput>();

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
      planCode: PHYSICAL_SECURITY_MONITORING_PLAN_CODE,
      title: {
        fr: "Définir, exploiter et démontrer une surveillance physique proportionnée des locaux pertinents",
        en: "Define, operate, and demonstrate proportionate physical monitoring of relevant premises",
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
      planCode: PHYSICAL_SECURITY_MONITORING_PLAN_CODE,
      title: {
        fr: "Définir, exploiter et démontrer une surveillance physique proportionnée des locaux pertinents",
        en: "Define, operate, and demonstrate proportionate physical monitoring of relevant premises",
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

  const activeActionsByCode = new Map<string, A74DerivedSubAction>();
  const clarifications: Array<{ questionId: PhysicalSecurityMonitoringQuestionId; question: LocalizedText }> = [];
  const applicabilityReviews: LocalizedText[] = [];
  const visibleIds = new Set<PhysicalSecurityMonitoringQuestionId>(resolution.questionIds);

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
    planCode: PHYSICAL_SECURITY_MONITORING_PLAN_CODE,
    title: {
      fr: "Définir, exploiter et démontrer une surveillance physique proportionnée des locaux pertinents",
      en: "Define, operate, and demonstrate proportionate physical monitoring of relevant premises",
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
  A74_ACTIONS as physicalSecurityMonitoringActions,
  type A74ResponseInput as physicalSecurityMonitoringResponseInput,
  PHYSICAL_SECURITY_MONITORING_GAP_CODES as physicalSecurityMonitoringGapCodes,
};
