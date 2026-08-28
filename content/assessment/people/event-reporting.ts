import { assessmentAnswerValues } from "../../assessment-infrastructure.ts";

export type ContextDecision = "yes" | "no" | "not_sure";

export type AssessmentLocale = "fr" | "en";
export type AssessmentAnswerValue = (typeof assessmentAnswerValues)[number];

export type EventReportingQuestionCategory = "mandatory" | "conditional_external";

export type EventReportingQuestionType =
  | "policy_process"
  | "application"
  | "proof_traceability"
  | "conditional";

export type EventReportingQuestionId =
  | "p6_8_001"
  | "p6_8_002"
  | "p6_8_003"
  | "p6_8_004_external";

export type EventReportingConditionKey = "hasRelevantExternalParties";

export type EventReportingQuestion = {
  id: EventReportingQuestionId;
  category: EventReportingQuestionCategory;
  type: EventReportingQuestionType;
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
  conditionKey?: EventReportingConditionKey;
  gapCodes: {
    partial: string;
    full: string;
  };
};

export type A68AssessmentContext = {
  hasRelevantExternalParties?: ContextDecision;
};

export type A68QuestionResolution = {
  questionIds: EventReportingQuestionId[];
  hiddenQuestionIds: EventReportingQuestionId[];
  unresolvedConditions: EventReportingConditionKey[];
  unresolvedConditionQuestions: EventReportingQuestionId[];
};

export const A6_8_EVENT_REPORTING_PLAN_CODE = "A6_8_EVENT_REPORTING_PLAN";

const eventReportingAnswerValues: ReadonlyArray<AssessmentAnswerValue> = [...assessmentAnswerValues];

export const EVENT_REPORTING_GAP_CODES = {
  p6_8_001: {
    partial: "A6_8_MECHANISM_PARTIAL",
    full: "A6_8_MECHANISM_ABSENT",
  },
  p6_8_002: {
    partial: "A6_8_AWARENESS_PARTIAL",
    full: "A6_8_AWARENESS_ABSENT",
  },
  p6_8_003: {
    partial: "A6_8_TRACEABILITY_PARTIAL",
    full: "A6_8_TRACEABILITY_ABSENT",
  },
  p6_8_004_external: {
    partial: "A6_8_EXTERNAL_REPORTING_PARTIAL",
    full: "A6_8_EXTERNAL_REPORTING_ABSENT",
  },
} as const;

export const eventReportingQuestionIds = {
  mandatory: ["p6_8_001", "p6_8_002", "p6_8_003"] as const,
  conditionalExternal: "p6_8_004_external" as const,
} as const;

export const eventReportingQuestions: EventReportingQuestion[] = [
  {
    id: "p6_8_001",
    category: "mandatory",
    type: "policy_process",
    index: 1,
    question: {
      fr: "Votre organisation a-t-elle défini un mécanisme simple et accessible indiquant quels événements ou faiblesses doivent être signalés, par quels canaux et avec quel niveau d’urgence ?",
      en: "Has your organization defined a simple and accessible mechanism specifying which information security events or weaknesses should be reported, through which channels, and with what level of urgency?",
    },
    helpText: {
      fr: "Le mécanisme doit permettre aux personnes concernées de savoir :\n\n- quels événements ou faiblesses doivent être signalés ;\n- quels exemples courants sont concernés ;\n- quel canal utiliser ;\n- quelles informations minimales fournir ;\n- quand utiliser un canal urgent ;\n- qui reçoit le signalement ;\n- comment le rapport est transmis vers l’équipe responsable ;\n- quoi faire pour éviter d’aggraver la situation ;\n- comment signaler une perte ou un vol ;\n- comment signaler une activité ou un comportement suspect.\n\nLes canaux peuvent notamment comprendre :\n\n- une adresse email ;\n- un portail ;\n- un outil de ticketing ;\n- un canal téléphonique ;\n- une fonctionnalité de signalement ;\n- un manager ou point de contact désigné ;\n- un canal fournisseur ou partenaire.\n\nNormCore ne doit pas imposer un canal particulier.\n\nLe niveau de disponibilité et d’urgence doit dépendre des activités et des risques de l’organisation.",
      en: "The mechanism should enable relevant people to understand:\n\n- which events or weaknesses should be reported;\n- common examples;\n- which channel to use;\n- minimum information to provide;\n- when an urgent channel should be used;\n- who receives the report;\n- how the report is handed to the responsible team;\n- what to do to avoid worsening the situation;\n- how to report an error or accidental disclosure;\n- how to report loss or theft;\n- how to report suspicious activity or behaviour.\n\nChannels may include:\n\n- email;\n- a portal;\n- a ticketing tool;\n- telephone;\n- a reporting feature;\n- a designated manager or contact;\n- a supplier or partner channel.\n\nNormCore must not prescribe a particular channel.\n\nAvailability and urgency should reflect the organization’s activities and risks.",
    },
    evidenceHints: {
      fr: [
        "procédure de signalement",
        "adresse ou portail désigné",
        "numéro urgent lorsqu’il est nécessaire",
        "exemples d’événements et faiblesses",
        "instructions destinées aux déclarants",
        "responsabilités",
        "règles de priorité ou d’urgence",
        "chemin d’escalade",
        "publication intranet ou manuel",
        "historique des versions",
        "registre des exceptions",
      ],
      en: [
        "reporting procedure",
        "designated email address or portal",
        "urgent number where necessary",
        "event and weakness examples",
        "reporter instructions",
        "responsibilities",
        "priority or urgency rules",
        "escalation path",
        "intranet or handbook publication",
        "version history",
        "exception register",
      ],
    },
    responseOptions: eventReportingAnswerValues,
    gapCodes: EVENT_REPORTING_GAP_CODES.p6_8_001,
  },
  {
    id: "p6_8_002",
    category: "mandatory",
    type: "application",
    index: 2,
    question: {
      fr: "Les personnes concernées savent-elles reconnaître et signaler rapidement un événement ou une faiblesse suspectée, sans devoir déterminer elles-mêmes s’il s’agit d’un incident confirmé ?",
      en: "Do the relevant people know how to recognize and promptly report a suspected information security event or weakness without having to determine whether it is a confirmed incident?",
    },
    helpText: {
      fr: "Les personnes doivent savoir qu’elles peuvent signaler une situation observée ou suspectée sans devoir mener une investigation ni confirmer qu’un incident a réellement eu lieu.\n\nLes exemples peuvent notamment comprendre :\n\n- un email ou message suspect ;\n- une activité système inhabituelle ;\n- un logiciel ou fichier suspect ;\n- une perte ou un vol d’appareil ;\n- une divulgation accidentelle ;\n- une erreur d’envoi ;\n- un accès inattendu ;\n- un comportement physique suspect ;\n- une faiblesse observée ;\n- une violation apparente de politique ;\n- un document ou appareil laissé sans protection.\n\nLes communications doivent expliquer :\n\n- où signaler ;\n- quelles informations fournir ;\n- le niveau d’urgence ;\n- quoi préserver lorsque cela est possible ;\n- ce qu’il ne faut pas modifier ;\n- ne pas exploiter ou tester une faiblesse sans autorisation ;\n- ne pas attendre d’avoir une certitude complète ;\n- ne pas mener soi-même une investigation non autorisée.\n\nLe mécanisme doit encourager les signalements de bonne foi et éviter de créer une culture qui décourage la déclaration rapide des erreurs honnêtes.\n\nCette formulation ne crée pas une immunité disciplinaire générale. Les cas restent évalués selon A.6.4 et le droit applicable.",
      en: "People should understand that they may report an observed or suspected situation without investigating it themselves or confirming that an incident has occurred.\n\nExamples may include:\n\n- a suspicious email or message;\n- unusual system activity;\n- suspicious software or files;\n- device loss or theft;\n- accidental disclosure;\n- misdirected information;\n- unexpected access;\n- suspicious physical behaviour;\n- an observed weakness;\n- an apparent policy violation;\n- an unprotected document or device.\n\nCommunications should explain:\n\n- where to report;\n- what information to provide;\n- urgency expectations;\n- what to preserve where possible;\n- what not to modify;\n- not to exploit or test a weakness without authorization;\n- not to wait for complete certainty;\n- not to conduct an unauthorized investigation.\n\nThe mechanism should encourage good-faith reporting and avoid creating a culture that discourages prompt reporting of honest mistakes.\n\nThis does not create general disciplinary immunity. Cases remain subject to A.6.4 and applicable law.",
    },
    evidenceHints: {
      fr: [
        "support de sensibilisation",
        "guide de signalement",
        "exemples ou fiches réflexes",
        "contenu d’onboarding",
        "communications périodiques",
        "quiz ou contrôle de connaissance lorsqu’il est utilisé",
        "simulations de phishing lorsqu’elles sont utilisées",
        "entretiens ou sondages",
        "preuve de publication des canaux",
        "statistiques ou tendances de signalement",
        "retours au déclarant lorsqu’ils existent",
      ],
      en: [
        "awareness material",
        "reporting guide",
        "examples or quick-reference material",
        "onboarding content",
        "periodic communications",
        "knowledge checks where used",
        "phishing simulations where used",
        "interviews or surveys",
        "evidence of channel publication",
        "reporting statistics or trends",
        "reporter feedback where available",
      ],
    },
    responseOptions: eventReportingAnswerValues,
    gapCodes: EVENT_REPORTING_GAP_CODES.p6_8_002,
  },
  {
    id: "p6_8_003",
    category: "mandatory",
    type: "proof_traceability",
    index: 3,
    question: {
      fr: "Les signalements reçus sont-ils horodatés, enregistrés, accusés réception et transmis aux responsables appropriés, et le mécanisme est-il périodiquement vérifié ou amélioré ?",
      en: "Are received reports timestamped, recorded, acknowledged, and handed to the appropriate owners, and is the reporting mechanism periodically checked or improved?",
    },
    helpText: {
      fr: "La preuve doit permettre de suivre un signalement depuis sa réception jusqu’à son transfert vers le processus ou responsable approprié.\n\nElle peut notamment contenir :\n\n- la date et l’heure ;\n- le canal utilisé ;\n- la source ou catégorie de déclarant ;\n- une description minimale ;\n- les informations ou actifs concernés ;\n- le niveau d’urgence initial ;\n- l’accusé de réception ;\n- le responsable de triage ou de transfert ;\n- la date de transmission ;\n- les faux positifs et quasi-incidents ;\n- les retours au déclarant lorsqu’ils sont appropriés ;\n- les résultats d’un test du canal ;\n- les actions d’amélioration.\n\nA.6.8 ne doit pas imposer au déclarant de qualifier lui-même l’incident.\n\nLe mécanisme doit transférer les rapports vers l’évaluation appropriée, mais A.6.8 ne doit pas dupliquer entièrement A.5.25 ou A.5.26.\n\nLa fréquence des tests et revues doit être proportionnée. Ne pas imposer une fréquence annuelle universelle.",
      en: "Evidence should make it possible to trace a report from receipt through handover to the appropriate process or owner.\n\nIt may include:\n\n- date and time;\n- channel used;\n- reporter source or category;\n- a minimum description;\n- affected information or assets;\n- initial urgency;\n- acknowledgement;\n- triage or handover owner;\n- handover date;\n- routing issues;\n- false positives and near misses;\n- feedback to the reporter where appropriate;\n- channel-test results;\n- improvement actions.\n\nA.6.8 must not require the reporter to classify the incident.\n\nThe mechanism should hand reports to the appropriate assessment process, but A.6.8 must not fully duplicate A.5.25 or A.5.26.\n\nTesting and review frequency should be proportionate. Do not impose a universal annual frequency.",
    },
    evidenceHints: {
      fr: [
        "tickets ou emails horodatés",
        "journal des événements signalés",
        "accusés de réception",
        "règles de routage",
        "temps ou dates de transmission",
        "propriétaire du signalement",
        "preuve de transfert vers A.5.25",
        "test du canal",
        "incidents de routage",
        "exemples de faux positifs ou quasi-incidents",
        "actions correctives",
        "résultats de revue",
        "retour au déclarant lorsqu’il existe",
      ],
      en: [
        "timestamped tickets or emails",
        "reported-event log",
        "acknowledgements",
        "routing rules",
        "handover times or dates",
        "report owner",
        "evidence of handover to A.5.25",
        "channel test",
        "routing failures",
        "false-positive or near-miss examples",
        "corrective actions",
        "review results",
        "reporter feedback where available",
      ],
    },
    responseOptions: eventReportingAnswerValues,
    gapCodes: EVENT_REPORTING_GAP_CODES.p6_8_003,
  },
  {
    id: "p6_8_004_external",
    category: "conditional_external",
    type: "conditional",
    index: 4,
    question: {
      fr: "Les fournisseurs, consultants, partenaires ou autres parties externes pertinentes disposent-ils d’un canal approprié pour signaler rapidement les événements ou faiblesses liés au périmètre ?",
      en: "Do suppliers, consultants, partners, or other relevant external parties have an appropriate channel for promptly reporting events or weaknesses related to the scope?",
    },
    helpText: {
      fr: "Les parties externes peuvent notamment comprendre :\n\n- les fournisseurs ;\n- les sous-traitants ;\n- les consultants ;\n- les freelances ;\n- les partenaires ;\n- les prestataires cloud ou technologiques ;\n- les clients lorsqu’un canal est prévu ;\n- les visiteurs ou participants externes pertinents.\n\nLe dispositif peut notamment définir :\n\n- le canal à utiliser ;\n- le point de contact ;\n- les informations minimales ;\n- les situations urgentes ;\n- les obligations contractuelles de notification ;\n- les délais lorsqu’ils sont définis par le contrat ou le risque ;\n- le routage interne ;\n- la protection des informations reçues ;\n- l’accusé de réception ;\n- la coordination avec le propriétaire du contrat ;\n- les tests ou vérifications de joignabilité.\n\nNormCore ne doit pas imposer le même canal à toutes les parties externes.",
      en: "External parties may include:\n\n- suppliers;\n- subcontractors;\n- consultants;\n- freelancers;\n- partners;\n- cloud or technology providers;\n- customers where a channel is provided;\n- relevant visitors or external participants.\n\nThe arrangements may define:\n\n- the reporting channel;\n- the contact point;\n- minimum information;\n- urgent situations;\n- contractual notification obligations;\n- timeframes where defined by contract or risk;\n- internal routing;\n- protection of received information;\n- acknowledgement;\n- coordination with the contract owner;\n- channel availability checks.\n\nNormCore must not require the same channel for every external party.",
    },
    evidenceHints: {
      fr: [
        "contrats fournisseurs",
        "clauses de signalement",
        "portail ou adresse fournisseur",
        "procédure fournisseur",
        "matrice des contacts",
        "obligations de notification",
        "instruction dans un MSA ou SOW",
        "registre des parties externes",
        "exemple expurgé de signalement",
        "preuve de test ou de joignabilité",
        "accusé de réception",
        "registre des exceptions",
      ],
      en: [
        "supplier contracts",
        "reporting clauses",
        "supplier portal or email address",
        "supplier procedure",
        "contact matrix",
        "notification obligations",
        "MSA or SOW instruction",
        "external-party register",
        "redacted report example",
        "channel test or availability evidence",
        "acknowledgement",
        "exception register",
      ],
    },
    responseOptions: eventReportingAnswerValues,
    conditionKey: "hasRelevantExternalParties",
    gapCodes: EVENT_REPORTING_GAP_CODES.p6_8_004_external,
  },
];

const questionMap = new Map(
  eventReportingQuestions.map((question) => [question.id, question] as const),
);

export function resolveEventReportingQuestions(
  context: A68AssessmentContext = {},
): A68QuestionResolution {
  const questionIds: EventReportingQuestionId[] = [...eventReportingQuestionIds.mandatory];
  const hiddenQuestionIds: EventReportingQuestionId[] = [];
  const unresolvedConditions: EventReportingConditionKey[] = [];
  const unresolvedConditionQuestions: EventReportingQuestionId[] = [];
  if (context.hasRelevantExternalParties === "yes") {
    questionIds.push(eventReportingQuestionIds.conditionalExternal);
  } else if (context.hasRelevantExternalParties === "no") {
    hiddenQuestionIds.push(eventReportingQuestionIds.conditionalExternal);
  } else {
    hiddenQuestionIds.push(eventReportingQuestionIds.conditionalExternal);
    unresolvedConditions.push("hasRelevantExternalParties");
    unresolvedConditionQuestions.push(eventReportingQuestionIds.conditionalExternal);
  }

  return {
    questionIds,
    hiddenQuestionIds,
    unresolvedConditions,
    unresolvedConditionQuestions,
  };
}

export function getEventReportingQuestion(
  questionId: string,
  locale: AssessmentLocale,
) {
  const question = questionMap.get(questionId as EventReportingQuestionId);
  if (!question) {
    throw new Error(`Unknown A.6.8 question id: ${questionId}`);
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

export function getAllEventReportingQuestions(locale: AssessmentLocale = "en") {
  return eventReportingQuestions.map((question) => ({
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

export function isEventReportingQuestion(
  questionId: string,
): questionId is EventReportingQuestionId {
  return questionMap.has(questionId as EventReportingQuestionId);
}

export const eventReportingLegalNotice = {
  fr: "Les mécanismes de signalement, la protection de l'identité du déclarant, les obligations de notification, les délais contractuels ou réglementaires, la conservation des signalements et les éventuelles mesures disciplinaires dépendent du pays, du droit du travail, du droit de la vie privée, des contrats et des obligations sectorielles applicables. Les procédures concernées doivent être validées par les fonctions juridiques, RH, sécurité et vie privée compétentes.\n\nNormCore ne fournit aucun conseil juridique personnalisé.",
  en: "Reporting mechanisms, protection of reporter identity, notification duties, contractual or regulatory timeframes, report retention, and potential disciplinary measures depend on the country, employment law, privacy law, applicable contracts, and sector-specific obligations. Relevant procedures should be reviewed by competent legal, HR, security, and privacy functions.\n\nNormCore does not provide personalized legal advice.",
};
