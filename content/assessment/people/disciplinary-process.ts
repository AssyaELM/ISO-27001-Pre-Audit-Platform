import { assessmentAnswerValues } from "../../assessment-infrastructure.ts";

export type AssessmentLocale = "fr" | "en";
export type AssessmentAnswerValue = (typeof assessmentAnswerValues)[number];

export type ContextDecision = "yes" | "no" | "not_sure";

export type A64AssessmentContext = {
  hasRelevantExternalParties?: ContextDecision;
};

export type A64QuestionResolution = {
  questionIds: DisciplinaryProcessQuestionId[];
  unresolvedConditions: Array<"hasRelevantExternalParties">;
  hiddenQuestionIds: DisciplinaryProcessQuestionId[];
};

export type DisciplinaryProcessQuestionId =
  | "p6_4_001"
  | "p6_4_002"
  | "p6_4_003"
  | "p6_4_004_external";

export type DisciplinaryProcessQuestionCategory =
  | "mandatory"
  | "conditional_external";

export type DisciplinaryProcessQuestion = {
  id: DisciplinaryProcessQuestionId;
  category: DisciplinaryProcessQuestionCategory;
  type: "policy_process" | "application" | "proof_traceability" | "conditional";
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
  conditionKey?: "hasRelevantExternalParties";
  legalNotice?: {
    fr: string;
    en: string;
  };
};

export const DISCIPLINARY_PROCESS_PLAN_CODE = "A6_4_DISCIPLINARY_PROCESS_PLAN";

const disciplinaryProcessAnswerValues: ReadonlyArray<AssessmentAnswerValue> = [...assessmentAnswerValues];

export const disciplinaryProcessQuestionIds = {
  mandatory: ["p6_4_001", "p6_4_002", "p6_4_003"] as const,
  conditionalExternal: "p6_4_004_external",
} as const;

export const disciplinaryProcessQuestions: DisciplinaryProcessQuestion[] = [
  {
    id: "p6_4_001",
    category: "mandatory",
    type: "policy_process",
    index: 1,
    question: {
      fr: "Votre organisation a-t-elle formalisé un processus disciplinaire couvrant les violations des politiques de sécurité de l'information, avec des rôles, des étapes, des critères d'évaluation et les exigences juridiques applicables ?",
      en: "Has your organization formalized a disciplinary process covering information security policy violations, including roles, process steps, assessment criteria, and applicable legal requirements?",
    },
    helpText: {
      fr: "Le processus peut être intégré à la procédure disciplinaire RH générale. Il n'est pas nécessaire de créer une procédure disciplinaire séparée uniquement pour la sécurité de l'information.\n\nIl doit néanmoins permettre d'identifier :\n- les violations de sécurité couvertes\n- les rôles de RH, du management, de la sécurité et du juridique\n- le déclenchement et les étapes du processus\n- les modalités d'établissement des faits\n- les critères utilisés pour évaluer une situation\n- l'autorité chargée de prendre la décision\n- les règles de protection et de conservation des dossiers\n- les exigences légales, contractuelles et conventionnelles applicables",
      en: "The process may be integrated into the organization’s general HR disciplinary procedure. A separate information-security-only disciplinary procedure is not required.\n\nIt should nevertheless identify:\n- the information security violations covered\n- HR, management, security, and legal roles\n- process triggers and steps\n- arrangements for establishing the facts\n- criteria used to assess a case\n- the decision-making authority\n- record protection and retention rules\n- applicable legal, contractual, and collective requirements",
    },
    evidenceHints: {
      fr: [
        "politique ou procédure disciplinaire",
        "règlement intérieur ou manuel du personnel",
        "procédure RH intégrant les violations de sécurité",
        "rôles et responsabilités",
        "catégories indicatives de violations",
        "procédure d'enquête ou d'établissement des faits",
        "règles de décision et d'escalade",
        "validation RH ou juridique",
        "historique des versions",
      ],
      en: [
        "disciplinary policy or procedure",
        "employee handbook or internal rules",
        "HR procedure covering information security violations",
        "roles and responsibilities",
        "indicative violation categories",
        "investigation or fact-finding procedure",
        "decision and escalation rules",
        "HR or legal approval",
        "version history",
      ],
    },
    responseOptions: disciplinaryProcessAnswerValues,
    legalNotice: {
      fr: "Les enquêtes internes, mesures disciplinaires, droits de représentation, règles de preuve, mécanismes de recours, sanctions et durées de conservation dépendent du pays, du statut de la personne, du droit du travail, des conventions collectives et des contrats applicables. Le processus doit être revu par les fonctions RH et juridiques compétentes.",
      en: "Internal investigations, disciplinary measures, representation rights, evidentiary rules, appeal mechanisms, sanctions, and retention periods depend on the country, the person’s legal status, employment law, collective agreements, and applicable contracts. The process should be reviewed by competent HR and legal functions.",
    },
  },
  {
    id: "p6_4_002",
    category: "mandatory",
    type: "application",
    index: 2,
    question: {
      fr: "L’existence du processus et les conséquences possibles d’une violation de sécurité sont-elles clairement communiquées aux personnes concernées avant qu’une mesure disciplinaire ne soit nécessaire ?",
      en: "Are the disciplinary process and the possible consequences of an information security violation clearly communicated to the relevant people before disciplinary action becomes necessary?",
    },
    helpText: {
      fr: "La communication doit intervenir avant qu’une violation soit traitée, afin que les personnes connaissent les règles et les conséquences possibles.\n\nLes méthodes peuvent comprendre :\n- un manuel du personnel\n- un règlement intérieur\n- un contrat ou accord applicable\n- une politique publiée\n- l'onboarding\n- une sensibilisation\n- une communication destinée aux managers\n- un accusé de réception, lorsque celui-ci est approprié.\n\nUne signature ou un accusé de lecture n’est pas l’unique méthode possible. La preuve doit être adaptée au droit applicable et au mécanisme de communication retenu.",
      en: "Communication should take place before a violation is handled so that relevant people understand the rules and possible consequences.\n\nMethods may include:\n- an employee handbook\n- workplace rules\n- an applicable contract or agreement\n- a published policy\n- onboarding\n- awareness activities\n- manager communications\n- an acknowledgement, where appropriate.\n\nA signature or acknowledgement is not the only possible method. Evidence should be appropriate to applicable law and the communication method selected.",
    },
    evidenceHints: {
      fr: [
        "version publiée de la procédure",
        "manuel ou règlement",
        "communication RH",
        "contenu d'onboarding",
        "support de sensibilisation",
        "accusé de réception lorsqu'il est utilisé",
        "historique de publication",
        "instructions destinées aux managers",
        "registre des exceptions",
      ],
      en: [
        "published procedure",
        "handbook or workplace rules",
        "HR communication",
        "onboarding content",
        "awareness material",
        "acknowledgement where used",
        "publication history",
        "manager instructions",
        "exception register",
      ],
    },
    responseOptions: disciplinaryProcessAnswerValues,
  },
  {
    id: "p6_4_003",
    category: "mandatory",
    type: "proof_traceability",
    index: 3,
    question: {
      fr: "Les violations présumées ou confirmées sont-elles examinées et traitées de manière documentée, équitable, cohérente et proportionnée, avec des dossiers protégés et traçables ?",
      en: "Are suspected or confirmed violations examined and handled in a documented, fair, consistent, and proportionate manner, with protected and traceable records?",
    },
    helpText: {
      fr: "Cette question couvre l'établissement des faits, la coordination entre les fonctions concernées, la décision et la conservation d'une trace appropriée.\n\nLe processus doit éviter de considérer automatiquement une alerte technique comme une faute personnelle confirmée.\n\nSelon le droit et le contexte applicables, il peut notamment comprendre :\n- l'enregistrement de la violation présumée\n- une évaluation initiale\n- la collecte proportionnée des informations disponibles\n- la distinction entre incident technique et comportement individuel\n- la possibilité pour la personne concernée de fournir des explications\n- la consultation de RH, du management, de la sécurité ou du juridique\n- une décision motivée\n- une réponse cohérente et proportionnée\n- la conservation sécurisée du dossier\n- les voies de réexamen ou de recours applicables\n\nUne mesure disciplinaire n’est pas obligatoire après chaque examen. Le résultat peut être :\n- aucune action disciplinaire\n- une clarification\n- un accompagnement ou une formation\n- une mesure RH appropriée\n- une restriction d’accès\n- une autre mesure autorisée par le droit applicable",
      en: "This question covers fact-finding, coordination between relevant functions, the decision, and retention of an appropriate record.\n\nThe process should not automatically treat a technical alert as a confirmed personal violation.\n\nDepending on applicable law and context, it may include:\n- logging the suspected violation\n- an initial assessment\n- proportionate collection of available information\n- distinguishing a technical incident from individual behaviour\n- allowing the person concerned to provide an explanation\n- consultation with HR, management, security, or legal functions\n- a reasoned decision\n- a consistent and proportionate response\n- secure case-record retention\n- applicable review or appeal arrangements.\n\nDisciplinary action is not mandatory following every assessment. Outcomes may include:\n- no disciplinary action\n- clarification\n- coaching or training\n- an appropriate HR measure\n- access restriction\n- another measure permitted by applicable law.",
    },
    evidenceHints: {
      fr: [
        "workflow enquête–décision–clôture",
        "incident ou dossier anonymisé",
        "plan ou rapport d'établissement des faits",
        "éléments pris en compte",
        "décision et justification",
        "validation RH ou juridique",
        "lien contrôlé avec le registre d'incidents",
        "règles d'accès et de conservation",
        "registre d'exceptions",
        "exercice ou walkthrough lorsque aucun cas réel n’existe",
      ],
      en: [
        "investigation-decision-closure workflow",
        "anonymized incident or case file",
        "fact-finding plan or report",
        "information considered",
        "decision and rationale",
        "HR or legal validation",
        "controlled link to incident register",
        "access and retention rules",
        "exception register",
        "exercise or walkthrough where no real case exists",
      ],
    },
    responseOptions: disciplinaryProcessAnswerValues,
    legalNotice: {
      fr: "Les enquêtes internes, mesures disciplinaires, droits de représentation, règles de preuve, mécanismes de recours, sanctions et durées de conservation dépendent du pays, du statut de la personne, du droit du travail, des conventions collectives et des contrats applicables. Le processus doit être revu par les fonctions RH et juridiques compétentes.",
      en: "Internal investigations, disciplinary measures, representation rights, evidentiary rules, appeal mechanisms, sanctions, and retention periods depend on the country, the person’s legal status, employment law, collective agreements, and applicable contracts. The process should be reviewed by competent HR and legal functions.",
    },
  },
  {
    id: "p6_4_004_external",
    category: "conditional_external",
    type: "conditional",
    index: 4,
    question: {
      fr: "Pour les consultants, prestataires et autres parties externes pertinentes, les accords prévoient-ils des mécanismes documentés permettant de traiter les violations de sécurité de manière équivalente et proportionnée ?",
      en: "For consultants, contractors, and other relevant external parties, do the applicable agreements provide documented mechanisms for handling information security violations in an equivalent and proportionate manner?",
    },
    helpText: {
      fr: "Une organisation ne peut pas nécessairement appliquer son processus disciplinaire RH à une personne employée par une autre entité.\n\nLe mécanisme peut donc être contractuel et prévoir, selon la relation :\n- la notification du fournisseur ou employeur\n- une enquête coordonnée\n- une demande d'action corrective\n- une formation complémentaire\n- une restriction ou suppression d’accès\n- une demande de remplacement\n- la suspension ou la résiliation de l'engagement\n- une escalade juridique appropriée\n\nIl n’est pas nécessaire que les mécanismes soient identiques à ceux des salariés. Ils doivent être adaptés à la relation et au risque.",
      en: "An organization may not be able to apply its employee disciplinary process to a person employed by another entity.\n\nThe mechanism may therefore be contractual and may provide for:\n- notification of the supplier or employer\n- a coordinated investigation\n- a corrective-action request\n- additional training\n- access restriction or removal\n- a replacement request\n- suspension or termination of the engagement\n- appropriate legal escalation.\n\nThe mechanisms do not need to be identical to those applying to employees. They should be appropriate to the relationship and risk.",
    },
    evidenceHints: {
      fr: [
        "contrats fournisseurs",
        "accords de prestation",
        "clauses de sécurité",
        "conditions de résiliation",
        "procédure d'escalade fournisseur",
        "rôles du propriétaire du contrat",
        "exemple anonymisé ou exercice",
        "registre des décisions",
      ],
      en: [
        "supplier contracts",
        "service agreements",
        "security clauses",
        "termination provisions",
        "supplier escalation procedure",
        "contract-owner responsibilities",
        "anonymized example or exercise",
        "decision register",
      ],
    },
    responseOptions: disciplinaryProcessAnswerValues,
    conditionKey: "hasRelevantExternalParties",
    legalNotice: {
      fr: "Les enquêtes internes, mesures disciplinaires, droits de représentation, règles de preuve, mécanismes de recours, sanctions et durées de conservation dépendent du pays, du statut de la personne, du droit du travail, des conventions collectives et des contrats applicables. Le processus doit être revu par les fonctions RH et juridiques compétentes.",
      en: "Internal investigations, disciplinary measures, representation rights, evidentiary rules, appeal mechanisms, sanctions, and retention periods depend on the country, the person’s legal status, employment law, collective agreements, and applicable contracts. The process should be reviewed by competent HR and legal functions.",
    },
  },
];

export const DISCIPLINARY_PROCESS_GAP_CODES = {
  p6_4_001: {
    partial: "A6_4_PROCESS_PARTIAL",
    full: "A6_4_PROCESS_ABSENT",
  },
  p6_4_002: {
    partial: "A6_4_COMMUNICATION_PARTIAL",
    full: "A6_4_COMMUNICATION_ABSENT",
  },
  p6_4_003: {
    partial: "A6_4_CASE_HANDLING_PARTIAL",
    full: "A6_4_CASE_HANDLING_ABSENT",
  },
  p6_4_004_external: {
    partial: "A6_4_EXTERNAL_ENFORCEMENT_PARTIAL",
    full: "A6_4_EXTERNAL_ENFORCEMENT_ABSENT",
  },
} as const;

const questionMap = new Map(disciplinaryProcessQuestions.map((question) => [question.id, question] as const));

export function getDisciplinaryProcessQuestion(questionId: string, locale: AssessmentLocale) {
  const question = questionMap.get(questionId as DisciplinaryProcessQuestionId);
  if (!question) {
    throw new Error(`Unknown A.6.4 question id: ${questionId}`);
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

export function getAllDisciplinaryProcessQuestions(locale: AssessmentLocale = "en") {
  return disciplinaryProcessQuestions.map((question) => ({
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

export function isPeopleDisciplinaryProcessQuestion(
  questionId: string,
): questionId is DisciplinaryProcessQuestionId {
  return questionMap.has(questionId as DisciplinaryProcessQuestionId);
}

export function resolveDisciplinaryProcessQuestions(
  context: A64AssessmentContext = {},
): A64QuestionResolution {
  const questionIds: DisciplinaryProcessQuestionId[] = [
    ...disciplinaryProcessQuestionIds.mandatory,
  ];
  const hiddenQuestionIds: DisciplinaryProcessQuestionId[] = [];
  const unresolvedConditions: Array<"hasRelevantExternalParties"> = [];

  if (context.hasRelevantExternalParties === "yes") {
    questionIds.push(disciplinaryProcessQuestionIds.conditionalExternal);
  } else {
    hiddenQuestionIds.push(disciplinaryProcessQuestionIds.conditionalExternal);
    if (context.hasRelevantExternalParties === "not_sure" || typeof context.hasRelevantExternalParties === "undefined") {
      unresolvedConditions.push("hasRelevantExternalParties");
    }
  }

  return {
    questionIds,
    unresolvedConditions,
    hiddenQuestionIds,
  };
}
