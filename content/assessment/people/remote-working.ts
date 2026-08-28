import { assessmentAnswerValues } from "../../assessment-infrastructure.ts";

export type AssessmentLocale = "fr" | "en";
export type AssessmentAnswerValue = (typeof assessmentAnswerValues)[number];

export type ContextDecision = "yes" | "no" | "not_sure";

export type RemoteWorkingConditionKey =
  | "hasRemoteWorking"
  | "hasBYODDevices"
  | "hasHigherRiskLocations";

export type RemoteWorkingQuestionCategory =
  | "mandatory"
  | "conditional_byod"
  | "conditional_high_risk_locations";

export type RemoteWorkingQuestionType =
  | "policy_process"
  | "application"
  | "proof_traceability"
  | "conditional";

export type RemoteWorkingQuestionId =
  | "p6_7_001"
  | "p6_7_002"
  | "p6_7_003"
  | "p6_7_004_byod"
  | "p6_7_005_high_risk_locations";

export type RemoteWorkingQuestion = {
  id: RemoteWorkingQuestionId;
  category: RemoteWorkingQuestionCategory;
  type: RemoteWorkingQuestionType;
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
  conditionKey?: RemoteWorkingConditionKey;
  gapCodes: {
    partial: string;
    full: string;
  };
};

export type A67AssessmentContext = {
  hasRemoteWorking?: ContextDecision;
  hasBYODDevices?: ContextDecision;
  hasHigherRiskLocations?: ContextDecision;
};

export type A67QuestionResolution = {
  questionIds: RemoteWorkingQuestionId[];
  unresolvedConditions: RemoteWorkingConditionKey[];
  hiddenQuestionIds: RemoteWorkingQuestionId[];
  controlApplicability: "applicable" | "not_applicable" | "unknown";
};

export const REMOTE_WORKING_PLAN_CODE = "A6_7_REMOTE_WORKING_PLAN";

const remoteWorkingAnswerValues: ReadonlyArray<AssessmentAnswerValue> = [...assessmentAnswerValues];

export const REMOTE_WORKING_GAP_CODES = {
  p6_7_001: {
    partial: "A6_7_FRAMEWORK_PARTIAL",
    full: "A6_7_FRAMEWORK_ABSENT",
  },
  p6_7_002: {
    partial: "A6_7_MEASURES_PARTIAL",
    full: "A6_7_MEASURES_ABSENT",
  },
  p6_7_003: {
    partial: "A6_7_EVIDENCE_REVIEW_PARTIAL",
    full: "A6_7_EVIDENCE_REVIEW_ABSENT",
  },
  p6_7_004_byod: {
    partial: "A6_7_BYOD_PARTIAL",
    full: "A6_7_BYOD_ABSENT",
  },
  p6_7_005_high_risk_locations: {
    partial: "A6_7_HIGH_RISK_LOCATIONS_PARTIAL",
    full: "A6_7_HIGH_RISK_LOCATIONS_ABSENT",
  },
} as const;

export const remoteWorkingQuestionIds = {
  mandatory: ["p6_7_001", "p6_7_002", "p6_7_003"] as const,
  conditionalByod: "p6_7_004_byod",
  conditionalHigherRiskLocations: "p6_7_005_high_risk_locations",
} as const;

export const remoteWorkingQuestions: RemoteWorkingQuestion[] = [
  {
    id: "p6_7_001",
    category: "mandatory",
    type: "policy_process",
    index: 1,
    question: {
      fr: "Votre organisation a-t-elle évalué les risques du travail à distance et défini des règles couvrant les personnes, lieux, appareils, accès, informations et responsabilités concernés ?",
      en: "Has your organization assessed the risks of remote working and defined rules covering the people, locations, devices, access, information, and responsibilities involved?",
    },
    helpText: {
      fr: "Cette question vérifie que le cadre de travail à distance est adapté au risque, clair sur ce qui est couvert, et approuvé avant sa mise en application.",
      en: "This checks that the remote-working framework is risk-based, clear about what is covered, and approved before being applied.",
    },
    evidenceHints: {
      fr: [
        "périmètre du travail à distance",
        "analyse de risques",
        "utilisateurs et populations",
        "inventaire des lieux",
        "inventaire des appareils",
        "classification des informations",
        "rôles et responsabilités",
        "droits d’accès et traitement",
        "support et reporting",
        "exceptions approuvées",
        "preuves d'approbation",
      ],
      en: [
        "remote-working scope",
        "risk assessment",
        "users and populations",
        "location inventory",
        "device inventory",
        "information classification",
        "roles and responsibilities",
        "access and handling rights",
        "support and reporting",
        "approved exceptions",
        "approval evidence",
      ],
    },
    responseOptions: remoteWorkingAnswerValues,
    gapCodes: REMOTE_WORKING_GAP_CODES.p6_7_001,
  },
  {
    id: "p6_7_002",
    category: "mandatory",
    type: "application",
    index: 2,
    question: {
      fr: "Les mesures de sécurité définies pour le travail à distance sont-elles effectivement appliquées et communiquées, de manière adaptée aux risques physiques, techniques et informationnels ?",
      en: "Are the defined security measures for remote working actually implemented and communicated in a manner appropriate to the physical, technical, and information-security risks?",
    },
    helpText: {
      fr: "Cette question vérifie que les mesures ne restent pas sur le papier : elles doivent être appliquées et contrôlées.",
      en: "This checks that measures are not only documented; they are actually applied and monitored.",
    },
    evidenceHints: {
      fr: [
        "procédure de déploiement des mesures",
        "mesures par population",
        "dispositifs techniques",
        "mesures physiques",
        "couverture des appareils",
        "échantillonnage de contrôle",
        "exceptions et compensations",
        "registres d’écarts",
      ],
      en: [
        "control rollout procedure",
        "measure-by-population list",
        "technical controls",
        "physical controls",
        "device coverage",
        "control sampling",
        "exceptions and compensating controls",
        "deviation logs",
      ],
    },
    responseOptions: remoteWorkingAnswerValues,
    gapCodes: REMOTE_WORKING_GAP_CODES.p6_7_002,
  },
  {
    id: "p6_7_003",
    category: "mandatory",
    type: "proof_traceability",
    index: 3,
    question: {
      fr: "Votre organisation conserve-t-elle des preuves de l’application des mesures de travail à distance, contrôle-t-elle les exceptions et révise-t-elle son dispositif après des changements, incidents ou évolutions de risque ?",
      en: "Does your organization retain evidence of the implementation of remote-working measures, control exceptions, and review the arrangements following changes, incidents, or changes in risk?",
    },
    helpText: {
      fr: "Cette question vérifie la preuve réelle : conservation, traçabilité et cohérence des décisions de contrôle.",
      en: "This checks for real evidence: retention, traceability, and consistent control decisions.",
    },
    evidenceHints: {
      fr: [
        "registre des revues",
        "preuves d’incidents traités",
        "preuves d’exceptions approuvées",
        "preuves de contrôles",
        "preuves de clôture d’actions",
        "droits d’accès aux preuves",
        "échantillon de conformité",
      ],
      en: [
        "review register",
        "incident evidence",
        "approved exception evidence",
        "control evidence",
        "closure evidence",
        "proof access governance",
        "compliance sample",
      ],
    },
    responseOptions: remoteWorkingAnswerValues,
    gapCodes: REMOTE_WORKING_GAP_CODES.p6_7_003,
  },
  {
    id: "p6_7_004_byod",
    category: "conditional_byod",
    type: "conditional",
    index: 4,
    question: {
      fr: "Lorsque des appareils personnels sont autorisés pour le travail à distance, des exigences de sécurité, de séparation, de support, de surveillance et de traitement des données sont-elles définies et appliquées ?",
      en: "When personally-owned devices are permitted for remote work, are security, separation, support, monitoring, and data-handling requirements defined and implemented?",
    },
    helpText: {
      fr: "L’évaluation se base sur l’usage réel d’appareils personnels et sur la manière dont leur gestion est définie par population, accès et type de risque.",
      en: "The evaluation is based on actual use of personal devices and on how their handling is defined by population, access, and risk type.",
    },
    evidenceHints: {
      fr: [
        "liste des usages BYOD réels",
        "appareils et versions autorisées",
        "règles de séparation des données",
        "processus de sécurité minimum",
        "gestion de la fin de relation",
        "perte, vol, compromission",
        "règles de surveillance validées",
      ],
      en: [
        "real BYOD usage list",
        "authorized device classes",
        "data separation rules",
        "minimum security requirements",
        "termination actions",
        "loss, theft, compromise handling",
        "reviewed monitoring rules",
      ],
    },
    responseOptions: remoteWorkingAnswerValues,
    conditionKey: "hasBYODDevices",
    gapCodes: REMOTE_WORKING_GAP_CODES.p6_7_004_byod,
  },
  {
    id: "p6_7_005_high_risk_locations",
    category: "conditional_high_risk_locations",
    type: "conditional",
    index: 5,
    question: {
      fr: "Lorsque le travail est réalisé depuis des lieux publics, partagés, internationaux ou présentant un risque accru, des mesures supplémentaires adaptées sont-elles définies et communiquées ?",
      en: "When remote work takes place from public, shared, international, or otherwise higher-risk locations, are appropriate additional measures defined and communicated?",
    },
    helpText: {
      fr: "La question s’applique quand l’organisation identifie un vrai risque lié aux lieux, déplacements ou juridictions.",
      en: "The question applies when the organization identifies real risk linked to locations, travel, or jurisdictions.",
    },
    evidenceHints: {
      fr: [
        "matrice des lieux à risque",
        "procédures de permission",
        "restrictions par scénario",
        "mesures additionnelles",
        "contacts de support",
        "journal des incidents de contexte mobile",
        "retour d’expérience",
      ],
      en: [
        "higher-risk location matrix",
        "permission procedures",
        "scenario-based restrictions",
        "additional controls",
        "support contacts",
        "mobile-context incident log",
        "lessons learned",
      ],
    },
    responseOptions: remoteWorkingAnswerValues,
    conditionKey: "hasHigherRiskLocations",
    gapCodes: REMOTE_WORKING_GAP_CODES.p6_7_005_high_risk_locations,
  },
];

const questionMap = new Map(remoteWorkingQuestions.map((q) => [q.id, q] as const));

export function getRemoteWorkingQuestion(questionId: string, locale: AssessmentLocale) {
  const question = questionMap.get(questionId as RemoteWorkingQuestionId);
  if (!question) {
    throw new Error(`Unknown A.6.7 question id: ${questionId}`);
  }
  return {
    id: question.id,
    category: question.category,
    type: question.type,
    index: question.index,
    question: question.question[locale],
    helpText: question.helpText[locale],
    responseOptions: [...question.responseOptions],
  };
}

export function getAllRemoteWorkingQuestions(locale: AssessmentLocale = "en") {
  return remoteWorkingQuestions.map((question) => ({
    id: question.id,
    category: question.category,
    type: question.type,
    index: question.index,
    question: question.question[locale],
    helpText: question.helpText[locale],
    responseOptions: [...question.responseOptions],
    evidenceHints: [...question.evidenceHints.fr, ...question.evidenceHints.en],
  }));
}

export function isRemoteWorkingQuestion(questionId: string): questionId is RemoteWorkingQuestionId {
  return questionMap.has(questionId as RemoteWorkingQuestionId);
}

export function resolveRemoteWorkingQuestions(context: A67AssessmentContext = {}): A67QuestionResolution {
  const mandatory = [...remoteWorkingQuestionIds.mandatory];
  const questionIds: RemoteWorkingQuestionId[] = [];
  const hiddenQuestionIds: RemoteWorkingQuestionId[] = [];
  const unresolvedConditions: RemoteWorkingConditionKey[] = [];
  const controlApplicability: "applicable" | "not_applicable" | "unknown" = context.hasRemoteWorking === "yes"
    ? "applicable"
    : context.hasRemoteWorking === "no"
      ? "not_applicable"
      : "unknown";

  if (context.hasRemoteWorking !== "no") {
    questionIds.push(...mandatory);
  } else {
    hiddenQuestionIds.push(...mandatory);
  }

  if (context.hasRemoteWorking === "yes") {
    if (context.hasBYODDevices === "yes") {
      questionIds.push(remoteWorkingQuestionIds.conditionalByod);
    } else {
      hiddenQuestionIds.push(remoteWorkingQuestionIds.conditionalByod);
      if (context.hasBYODDevices !== "no") {
        unresolvedConditions.push("hasBYODDevices");
      }
    }

    if (context.hasHigherRiskLocations === "yes") {
      questionIds.push(remoteWorkingQuestionIds.conditionalHigherRiskLocations);
    } else {
      hiddenQuestionIds.push(remoteWorkingQuestionIds.conditionalHigherRiskLocations);
      if (context.hasHigherRiskLocations !== "no") {
        unresolvedConditions.push("hasHigherRiskLocations");
      }
    }
  } else {
    hiddenQuestionIds.push(
      remoteWorkingQuestionIds.conditionalByod,
      remoteWorkingQuestionIds.conditionalHigherRiskLocations,
    );
    if (context.hasRemoteWorking !== "no") {
      unresolvedConditions.push("hasRemoteWorking");
    }
  }

  if (!unresolvedConditions.includes("hasRemoteWorking") && context.hasRemoteWorking === "no") {
    // global applicability is explicitly resolved, no question-based unresolved condition
  } else if (context.hasRemoteWorking === undefined) {
    if (!unresolvedConditions.includes("hasRemoteWorking")) {
      unresolvedConditions.push("hasRemoteWorking");
    }
  }

  if (context.hasRemoteWorking === "not_sure" && !unresolvedConditions.includes("hasRemoteWorking")) {
    unresolvedConditions.push("hasRemoteWorking");
  }

  return {
    questionIds,
    unresolvedConditions,
    hiddenQuestionIds,
    controlApplicability,
  };
}

export const remoteWorkingLegalNotice = {
  fr: "Les règles de travail à distance, l’utilisation d’appareils personnels, la surveillance des appareils et connexions, la géolocalisation, l’effacement des données, les restrictions de lieux et les transferts internationaux dépendent du pays, du droit du travail, des conventions collectives, du droit de la vie privée et des contrats applicables. Les mesures concernées doivent être validées par les fonctions RH, juridiques et vie privée compétentes.\n\nNormCore ne fournit aucun conseil juridique personnalisé.",
  en: "Remote-working rules, personal-device use, monitoring of devices and connections, location tracking, data deletion, location restrictions, and international transfers depend on the country, employment law, collective agreements, privacy law, and applicable contracts. Relevant measures should be reviewed by competent HR, legal, and privacy functions.\n\nNormCore does not provide personalized legal advice.",
};
