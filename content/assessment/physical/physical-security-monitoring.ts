import { assessmentAnswerValues } from "../../assessment-infrastructure.ts";

export type AssessmentLocale = "fr" | "en";
export type AssessmentAnswerValue = (typeof assessmentAnswerValues)[number];

export type ContextDecision = "yes" | "no" | "not_sure";

export type A74AssessmentContext = {
  hasPhysicalLocationsSupportingScope?: ContextDecision;
  usesIdentifiablePhysicalMonitoring?: ContextDecision;
  usesThirdPartyManagedPremises?: ContextDecision;
};

export type PhysicalSecurityMonitoringQuestionCategory =
  | "main"
  | "conditional";

export type PhysicalSecurityMonitoringQuestionId =
  | "p7_4_001"
  | "p7_4_002"
  | "p7_4_003"
  | "p7_4_004_personal_data"
  | "p7_4_005_third_party";

export type A74ConditionKey = "hasPhysicalLocationsSupportingScope" | "usesIdentifiablePhysicalMonitoring" | "usesThirdPartyManagedPremises";

export type A74QuestionResolution = {
  controlApplicability: "applicable" | "not_applicable" | "unresolved";
  controlReviewState: "none" | "clarification_required" | "applicability_review_required";
  requiresControlJustification: boolean;
  questionIds: PhysicalSecurityMonitoringQuestionId[];
  hiddenQuestionIds: PhysicalSecurityMonitoringQuestionId[];
  unresolvedConditions: A74ConditionKey[];
  assessmentBlocked: boolean;
};

export type PhysicalSecurityMonitoringQuestion = {
  id: PhysicalSecurityMonitoringQuestionId;
  category: PhysicalSecurityMonitoringQuestionCategory;
  index: number;
  question: {
    fr: string;
    en: string;
  };
  helpText: {
    fr: string;
    en: string;
  };
  evidenceHints: {
    fr: string[];
    en: string[];
  };
  responseOptions: ReadonlyArray<AssessmentAnswerValue>;
  conditionKey?: A74ConditionKey;
};

export const PHYSICAL_SECURITY_MONITORING_PLAN_CODE = "A7_4_PHYSICAL_SECURITY_MONITORING_PLAN";

export const PHYSICAL_SECURITY_MONITORING_ANSWER_VALUES: ReadonlyArray<AssessmentAnswerValue> = [...assessmentAnswerValues];

export const a74QuestionIds = {
  main: ["p7_4_001", "p7_4_002", "p7_4_003"] as const,
  personalData: "p7_4_004_personal_data" as const,
  thirdParty: "p7_4_005_third_party" as const,
} as const;

export const physicalSecurityMonitoringQuestions: PhysicalSecurityMonitoringQuestion[] = [
  {
    id: "p7_4_001",
    category: "main",
    index: 1,
    question: {
      fr: "Votre organisation a-t-elle défini une approche permettant une surveillance continue appropriée des locaux pertinents, précisant les objectifs, zones, périodes, moyens, responsables, alertes et modalités de réponse selon le risque ?",
      en: "Has your organization defined an approach for appropriate continuous monitoring of relevant premises, specifying objectives, areas, periods, methods, responsibilities, alerts, and response arrangements according to risk?",
    },
    helpText: {
      fr: "La surveillance continue doit être comprise comme une surveillance appropriée aux scénarios et périodes définis par les risques.\n\nElle ne signifie pas automatiquement :\n\n- un enregistrement vidéo permanent ;\n- une présence humaine permanente ;\n- un fonctionnement 24 heures sur 24 ;\n- une surveillance de tous les locaux ;\n- une surveillance des postes de travail ou des personnes.\n\nL’approche peut notamment définir :\n\n- les locaux et zones concernés ;\n- les scénarios d’intrusion ou d’accès non autorisé ;\n- les périodes occupées et inoccupées ;\n- les objectifs de détection et de dissuasion ;\n- les moyens de surveillance retenus ;\n- les responsables ;\n- le routage des alertes ;\n- les modalités d’analyse et d’escalade ;\n- les indisponibilités du dispositif ;\n- les mesures compensatoires ;\n- les responsabilités des bailleurs ou fournisseurs ;\n- les exigences de protection des données et de respect de la vie privée ;\n- les changements déclenchant une revue.\n\nLes moyens peuvent notamment comprendre, selon le risque :\n\n- une alarme ;\n- des capteurs ;\n- des journaux de contrôle d’accès ;\n- une réception ;\n- un gardiennage ;\n- une ronde ;\n- un dispositif vidéo ;\n- une télésurveillance ;\n- des mesures compensatoires.\n\nAucun moyen particulier n’est obligatoire isolément.",
      en: "Continuous monitoring means monitoring appropriate to the scenarios and periods identified through risk assessment.\n\nIt does not automatically mean:\n\n- permanent video recording;\n- permanent human presence;\n- 24-hour operation;\n- monitoring every area;\n- monitoring workstations or individuals.\n\nThe approach may define:\n\n- relevant premises and areas;\n- intrusion or unauthorized-access scenarios;\n- occupied and unoccupied periods;\n- detection and deterrence objectives;\n- selected monitoring methods;\n- responsible owners;\n- alert routing;\n- assessment and escalation arrangements;\n- monitoring-system outages;\n- compensating controls;\n- landlord or provider responsibilities;\n- privacy and data-protection requirements;\n- changes triggering review.\n\nDepending on risk, methods may include:\n\n- alarms;\n- sensors;\n- physical access logs;\n- reception arrangements;\n- guards;\n- patrols;\n- video monitoring;\n- remote monitoring;\n- compensating controls.\n\nNo particular method is universally required on its own.",
    },
    evidenceHints: {
      fr: [
        "stratégie ou procédure de surveillance physique",
        "analyse des scénarios d’intrusion",
        "cartographie des zones surveillées",
        "matrice zones–moyens–responsables",
        "description des périodes couvertes",
        "schéma de routage des alertes",
        "procédure d’escalade",
        "responsabilités du bailleur ou fournisseur",
        "analyse de risques",
        "exceptions et mesures compensatoires",
        "approbation et historique des versions",
      ],
      en: [
        "physical monitoring strategy or procedure",
        "intrusion-scenario analysis",
        "map of monitored areas",
        "area-to-method-to-owner matrix",
        "description of covered periods",
        "alert-routing diagram",
        "escalation procedure",
        "landlord or provider responsibilities",
        "risk assessment",
        "exceptions and compensating controls",
        "approval and version history",
      ],
    },
    responseOptions: PHYSICAL_SECURITY_MONITORING_ANSWER_VALUES,
  },
  {
    id: "p7_4_002",
    category: "main",
    index: 2,
    question: {
      fr: "Les moyens de surveillance sélectionnés fonctionnent-ils comme prévu, sont-ils protégés contre l’altération ou l’indisponibilité, et les alertes donnent-elles lieu à une analyse et une réponse appropriées ?",
      en: "Do the selected monitoring arrangements operate as intended, remain protected against tampering or unavailability, and result in appropriate assessment and response when alerts occur?",
    },
    helpText: {
      fr: "Le contrôle doit vérifier le fonctionnement réel du dispositif retenu, sans imposer une technologie particulière.\n\nSelon le contexte, cela peut couvrir :\n\n- la couverture des points et zones pertinents ;\n- l’activation aux périodes prévues ;\n- l’état des alarmes, capteurs, caméras ou autres moyens lorsqu’ils existent ;\n- la protection contre l’altération ou la désactivation non autorisée ;\n- la détection d’une panne ou indisponibilité ;\n- le routage des alertes ;\n- la disponibilité d’un destinataire approprié ;\n- l’analyse de l’alerte ;\n- l’escalade ;\n- la réponse ;\n- la conservation d’une trace proportionnée ;\n- la gestion des faux positifs ;\n- les incidents ;\n- les mesures compensatoires pendant une panne.\n\nUne réponse appropriée ne signifie pas nécessairement une intervention humaine immédiate pour chaque événement. Elle doit correspondre au risque et aux modalités approuvées.",
      en: "The control should assess whether the selected arrangements operate in practice, without prescribing a particular technology.\n\nDepending on context, this may cover:\n\n- coverage of relevant points and areas;\n- activation during intended periods;\n- status of alarms, sensors, cameras, or other methods where used;\n- protection against unauthorized tampering or disabling;\n- detection of failure or unavailability;\n- alert routing;\n- availability of an appropriate recipient;\n- alert assessment;\n- escalation;\n- response;\n- proportionate record keeping;\n- false-positive handling;\n- incidents;\n- compensating controls during outages.\n\nAn appropriate response does not necessarily require immediate human intervention for every event. It should reflect risk and approved arrangements.",
    },
    evidenceHints: {
      fr: [
        "test d’une alarme ou d’un capteur",
        "preuve d’état ou de disponibilité",
        "test de routage d’une alerte",
        "échantillon d’une alerte traitée",
        "journal d’incident",
        "ticket de panne ou maintenance",
        "protection des configurations",
        "preuve d’une mesure compensatoire",
        "validation après correction",
        "rapport du prestataire",
      ],
      en: [
        "alarm or sensor test",
        "status or availability evidence",
        "alert-routing test",
        "sample handled alert",
        "incident record",
        "outage or maintenance ticket",
        "configuration-protection evidence",
        "compensating-control evidence",
        "post-remediation validation",
        "provider report",
      ],
    },
    responseOptions: PHYSICAL_SECURITY_MONITORING_ANSWER_VALUES,
  },
  {
    id: "p7_4_003",
    category: "main",
    index: 3,
    question: {
      fr: "Les journaux, tests, maintenances, alertes, incidents, revues et actions d’amélioration du dispositif de surveillance sont-ils conservés et traçables ?",
      en: "Are monitoring logs, tests, maintenance activities, alerts, incidents, reviews, and improvement actions retained and traceable?",
    },
    helpText: {
      fr: "Les preuves doivent être adaptées aux moyens réellement utilisés et aux risques.\n\nElles peuvent notamment couvrir :\n\n- les tests fonctionnels ;\n- les contrôles d’état ;\n- les maintenances ;\n- les pannes ;\n- les alertes ;\n- les analyses ;\n- les escalades ;\n- les incidents ;\n- les faux positifs pertinents ;\n- les changements de configuration ;\n- les changements d’aménagement ou de couverture ;\n- les exceptions ;\n- les mesures compensatoires ;\n- les actions correctives ;\n- les validations de clôture ;\n- les enseignements tirés.\n\nLa fréquence des tests, maintenances et revues doit être proportionnée aux risques, aux moyens utilisés, aux recommandations applicables et aux changements.\n\nNe pas imposer une fréquence mensuelle, trimestrielle ou annuelle universelle.",
      en: "Evidence should be appropriate to the monitoring methods actually used and the associated risks.\n\nIt may cover:\n\n- functional tests;\n- health checks;\n- maintenance;\n- failures;\n- alerts;\n- assessments;\n- escalations;\n- incidents;\n- relevant false positives;\n- configuration changes;\n- layout or coverage changes;\n- exceptions;\n- compensating controls;\n- corrective actions;\n- closure approvals;\n- lessons learned.\n\nTesting, maintenance, and review frequency should reflect risks, selected methods, applicable recommendations, and changes.\n\nDo not impose a universal monthly, quarterly, or annual frequency.",
    },
    evidenceHints: {
      fr: [
        "journaux ou rapports de surveillance",
        "rapports de tests",
        "tickets de maintenance",
        "preuve de panne et de restauration",
        "alertes et décisions associées",
        "incidents",
        "changement de configuration",
        "revue de couverture",
        "registre des exceptions",
        "action corrective",
        "preuve et validation de clôture",
      ],
      en: [
        "monitoring logs or reports",
        "test reports",
        "maintenance tickets",
        "outage and restoration evidence",
        "alerts and associated decisions",
        "incidents",
        "configuration changes",
        "coverage review",
        "exception register",
        "corrective action",
        "closure evidence and approval",
      ],
    },
    responseOptions: PHYSICAL_SECURITY_MONITORING_ANSWER_VALUES,
  },
  {
    id: "p7_4_004_personal_data",
    category: "conditional",
    index: 4,
    question: {
      fr: "Lorsque la surveillance permet d’identifier ou de suivre des personnes, sa finalité, sa base juridique, sa nécessité, sa proportionnalité, sa transparence, ses accès, sa conservation et les droits des personnes sont-ils documentés et appliqués ?",
      en: "Where monitoring identifies or tracks individuals, are its purpose, legal basis, necessity, proportionality, transparency, access, retention, and individual rights documented and implemented?",
    },
    helpText: {
      fr: "Cette question s’applique lorsque le dispositif collecte ou permet de déduire des informations concernant des personnes identifiables.\n\nCela peut notamment inclure :\n\n- la vidéosurveillance ;\n- les images ou enregistrements ;\n- les journaux nominatifs de badges ;\n- les données biométriques ;\n- les journaux de visiteurs ;\n- les données de localisation ou de déplacement ;\n- les rapports de gardiennage nominatifs ;\n- la surveillance susceptible d’évaluer le comportement des travailleurs.\n\nLe dispositif doit être examiné selon le droit applicable et peut nécessiter :\n\n- une finalité définie ;\n- une base juridique ;\n- une évaluation de nécessité et de proportionnalité ;\n- une analyse d’impact lorsque requise ;\n- une information ou signalisation appropriée ;\n- une limitation des accès ;\n- une protection contre l’usage non autorisé ;\n- une durée de conservation justifiée ;\n- des règles de consultation, copie ou divulgation ;\n- la gestion des droits ou demandes applicables ;\n- un registre ou une documentation du traitement ;\n- une revue en cas de changement.\n\nNe pas imposer :\n\n- une analyse d’impact dans tous les cas ;\n- une durée fixe de conservation ;\n- un consentement dans tous les cas ;\n- une vidéosurveillance ;\n- une biométrie ;\n- une surveillance des travailleurs.",
      en: "This question applies where monitoring collects or enables the inference of information about identifiable individuals.\n\nThis may include:\n\n- video surveillance;\n- images or recordings;\n- named badge logs;\n- biometric data;\n- visitor logs;\n- location or movement information;\n- named guard reports;\n- monitoring capable of evaluating worker behavior.\n\nArrangements should be reviewed under applicable law and may require:\n\n- a defined purpose;\n- a lawful basis;\n- necessity and proportionality assessment;\n- an impact assessment where required;\n- appropriate notices or signage;\n- access restrictions;\n- protection against unauthorized use;\n- justified retention;\n- rules for access, copying, or disclosure;\n- handling applicable rights or requests;\n- processing documentation;\n- review when arrangements change.\n\nDo not universally require:\n\n- an impact assessment in every case;\n- a fixed retention period;\n- consent in every case;\n- video surveillance;\n- biometrics;\n- worker monitoring.",
    },
    evidenceHints: {
      fr: [
        "registre ou description du traitement",
        "finalité et base juridique",
        "analyse de nécessité et proportionnalité",
        "analyse d’impact lorsqu’elle est requise",
        "avis juridique ou vie privée",
        "signalisation ou information",
        "matrice des accès aux données",
        "paramètres ou règle de conservation",
        "preuve de suppression",
        "procédure de demande ou divulgation",
        "contrat avec le prestataire",
        "revue après changement",
      ],
      en: [
        "processing record or description",
        "purpose and lawful basis",
        "necessity and proportionality assessment",
        "impact assessment where required",
        "legal or privacy review",
        "notice or signage",
        "data-access matrix",
        "retention setting or rule",
        "deletion evidence",
        "request or disclosure procedure",
        "provider agreement",
        "post-change review",
      ],
    },
    responseOptions: PHYSICAL_SECURITY_MONITORING_ANSWER_VALUES,
    conditionKey: "usesIdentifiablePhysicalMonitoring",
  },
  {
    id: "p7_4_005_third_party",
    category: "conditional",
    index: 5,
    question: {
      fr: "Lorsque la surveillance est assurée par un bailleur, un opérateur de site ou un prestataire de sécurité, la couverture, le routage des alertes, la notification des incidents, l’accès aux preuves et les responsabilités sont-ils documentés et vérifiés ?",
      en: "Where monitoring is provided by a landlord, site operator, or security provider, are coverage, alert routing, incident notification, access to evidence, and responsibilities documented and verified?",
    },
    helpText: {
      fr: "Le dispositif peut notamment définir :\n\n- les sites et zones couverts ;\n- les périodes de surveillance ;\n- les moyens fournis ;\n- les responsabilités respectives ;\n- le routage et les destinataires des alertes ;\n- les délais ou modalités de notification prévus au contrat ;\n- la gestion des pannes ;\n- les maintenances et tests ;\n- l’accès aux journaux, images ou rapports ;\n- les conditions de consultation et de divulgation ;\n- la conservation des preuves ;\n- les incidents ;\n- les changements de service ;\n- les sous-traitants ;\n- les exceptions et mesures compensatoires ;\n- les revues de fournisseur.\n\nUne certification ou un contrat ne constitue pas automatiquement une preuve suffisante. L’assurance doit être pertinente pour le site, le service et les responsabilités évalués.",
      en: "Arrangements may define:\n\n- covered sites and areas;\n- monitoring periods;\n- provided methods;\n- respective responsibilities;\n- alert routing and recipients;\n- contractual incident-notification arrangements;\n- outage handling;\n- maintenance and testing;\n- access to logs, images, or reports;\n- access and disclosure conditions;\n- evidence retention;\n- incidents;\n- service changes;\n- subcontractors;\n- exceptions and compensating controls;\n- supplier reviews.\n\nA certification or agreement is not automatically sufficient evidence. Assurance should be relevant to the site, service, and responsibilities being assessed.",
    },
    evidenceHints: {
      fr: [
        "bail ou contrat",
        "matrice de responsabilités",
        "description de la couverture",
        "procédure de notification",
        "schéma de routage des alertes",
        "rapport de test ou maintenance",
        "rapport d’incident",
        "preuve d’accès aux journaux ou enregistrements",
        "certification et périmètre associé",
        "rapport d’assurance",
        "revue du fournisseur",
        "exception et action de suivi",
      ],
      en: [
        "lease or agreement",
        "responsibility matrix",
        "coverage description",
        "notification procedure",
        "alert-routing diagram",
        "test or maintenance report",
        "incident report",
        "evidence of access to logs or recordings",
        "certification and associated scope",
        "assurance report",
        "supplier review",
        "exception and follow-up action",
      ],
    },
    responseOptions: PHYSICAL_SECURITY_MONITORING_ANSWER_VALUES,
    conditionKey: "usesThirdPartyManagedPremises",
  },
];

const questionMap = new Map(physicalSecurityMonitoringQuestions.map((q) => [q.id, q]));

export const PHYSICAL_SECURITY_MONITORING_GAP_CODES = {
  "p7_4_001": {
    partial: "A7_4_MONITORING_DESIGN_PARTIAL",
    full: "A7_4_MONITORING_DESIGN_ABSENT",
  },
  "p7_4_002": {
    partial: "A7_4_MONITORING_OPERATION_PARTIAL",
    full: "A7_4_MONITORING_OPERATION_ABSENT",
  },
  "p7_4_003": {
    partial: "A7_4_MONITORING_TRACEABILITY_PARTIAL",
    full: "A7_4_MONITORING_TRACEABILITY_ABSENT",
  },
  "p7_4_004_personal_data": {
    partial: "A7_4_MONITORING_PRIVACY_PARTIAL",
    full: "A7_4_MONITORING_PRIVACY_ABSENT",
  },
  "p7_4_005_third_party": {
    partial: "A7_4_THIRD_PARTY_MONITORING_PARTIAL",
    full: "A7_4_THIRD_PARTY_MONITORING_ABSENT",
  },
} as const;

export function resolvePhysicalSecurityMonitoringQuestions(
  context: A74AssessmentContext = {},
): A74QuestionResolution {
  const questionIds: PhysicalSecurityMonitoringQuestionId[] = [];
  const hiddenQuestionIds: PhysicalSecurityMonitoringQuestionId[] = [];
  const unresolvedConditions: A74ConditionKey[] = [];
  const hasPhysicalLocations = context.hasPhysicalLocationsSupportingScope;

  if (hasPhysicalLocations === "yes") {
    questionIds.push(...a74QuestionIds.main);
  } else {
    hiddenQuestionIds.push(...a74QuestionIds.main);
  }

  if (hasPhysicalLocations === "yes") {
    if (context.usesIdentifiablePhysicalMonitoring === "yes") {
      questionIds.push(a74QuestionIds.personalData);
    } else {
      hiddenQuestionIds.push(a74QuestionIds.personalData);
      if (context.usesIdentifiablePhysicalMonitoring !== "no") {
        unresolvedConditions.push("usesIdentifiablePhysicalMonitoring");
      }
    }

    if (context.usesThirdPartyManagedPremises === "yes") {
      questionIds.push(a74QuestionIds.thirdParty);
    } else {
      hiddenQuestionIds.push(a74QuestionIds.thirdParty);
      if (context.usesThirdPartyManagedPremises !== "no") {
        unresolvedConditions.push("usesThirdPartyManagedPremises");
      }
    }
  } else if (hasPhysicalLocations === "no") {
    hiddenQuestionIds.push(a74QuestionIds.personalData, a74QuestionIds.thirdParty);
  } else {
    hiddenQuestionIds.push(a74QuestionIds.personalData, a74QuestionIds.thirdParty);
    if (!unresolvedConditions.includes("hasPhysicalLocationsSupportingScope")) {
      unresolvedConditions.push("hasPhysicalLocationsSupportingScope");
    }
  }

  const unique = (values: PhysicalSecurityMonitoringQuestionId[]) => [...new Set(values)] as PhysicalSecurityMonitoringQuestionId[];

  if (hasPhysicalLocations === "yes") {
    return {
      controlApplicability: "applicable",
      controlReviewState: unresolvedConditions.length > 0 ? "clarification_required" : "none",
      requiresControlJustification: false,
      questionIds: unique(questionIds),
      hiddenQuestionIds: unique(hiddenQuestionIds),
      unresolvedConditions,
      assessmentBlocked: unresolvedConditions.length > 0,
    };
  }

  if (hasPhysicalLocations === "no") {
    return {
      controlApplicability: "not_applicable",
      controlReviewState: "applicability_review_required",
      requiresControlJustification: true,
      questionIds: unique(questionIds),
      hiddenQuestionIds: unique(hiddenQuestionIds),
      unresolvedConditions: [],
      assessmentBlocked: true, 
    };
  }

  return {
    controlApplicability: "unresolved",
    controlReviewState: "clarification_required",
    requiresControlJustification: false,
    questionIds: unique(questionIds),
    hiddenQuestionIds: unique(hiddenQuestionIds),
    unresolvedConditions,
    assessmentBlocked: true,
  };
}

export function getPhysicalSecurityMonitoringQuestion(questionId: string, locale: AssessmentLocale) {
  const question = questionMap.get(questionId as PhysicalSecurityMonitoringQuestionId);
  if (!question) {
    throw new Error(`Unknown A.7.4 question id: ${questionId}`);
  }
  return {
    id: question.id,
    category: question.category,
    index: question.index,
    question: question.question[locale],
    helpText: question.helpText[locale],
    responseOptions: [...question.responseOptions],
  };
}

export function getAllPhysicalSecurityMonitoringQuestions(locale: AssessmentLocale = "en") {
  return physicalSecurityMonitoringQuestions.map((question) => ({
    id: question.id,
    category: question.category,
    index: question.index,
    question: question.question[locale],
    helpText: question.helpText[locale],
    responseOptions: [...question.responseOptions],
    evidenceHints: [...question.evidenceHints.fr, ...question.evidenceHints.en],
  }));
}

export function isPhysicalSecurityMonitoringQuestion(questionId: string): boolean {
  return questionMap.has(questionId as PhysicalSecurityMonitoringQuestionId);
}

export const physicalSecurityMonitoringLegalNotice = {
  fr: "Les dispositifs de surveillance physique, alarmes, journaux d’accès, vidéosurveillance, capteurs, gardiennage, contrôle des travailleurs, signalisation, durées de conservation, accès aux enregistrements et partage avec des tiers dépendent du pays, du droit du travail, de la protection des données, des règles de sécurité des personnes, des contrats immobiliers, des conventions collectives et des obligations sectorielles applicables. Les dispositifs concernés doivent être validés par les fonctions Facilities, juridique, vie privée, RH, santé-sécurité et sécurité de l’information compétentes.\n\nNormCore ne fournit aucun conseil juridique personnalisé.",
  en: "Physical monitoring arrangements, alarms, access logs, video surveillance, sensors, guarding, worker monitoring, notices, retention periods, access to recordings, and sharing with third parties depend on the country, employment law, data protection law, life-safety requirements, property agreements, collective agreements, and applicable sector-specific obligations. Relevant arrangements should be reviewed by competent Facilities, Legal, Privacy, HR, Health and Safety, and Information Security functions.\n\nNormCore does not provide personalized legal advice.",
};
