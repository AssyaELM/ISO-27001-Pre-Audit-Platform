import { assessmentAnswerValues } from "../../assessment-infrastructure.ts";

export type AssessmentLocale = "fr" | "en";
export type AssessmentAnswerValue = (typeof assessmentAnswerValues)[number];

export type ContextDecision = "yes" | "no" | "not_sure";

export type ConfidentialityAgreementsConditionKey = "hasRelevantExternalParties";

export type ConfidentialityAgreementsQuestionCategory =
  | "mandatory"
  | "conditional_external";

export type ConfidentialityAgreementsQuestionType =
  | "policy_process"
  | "application"
  | "proof_traceability"
  | "conditional";

export type ConfidentialityAgreementsQuestionId =
  | "p6_6_001"
  | "p6_6_002"
  | "p6_6_003"
  | "p6_6_004_external";

export type ConfidentialityAgreementsQuestion = {
  id: ConfidentialityAgreementsQuestionId;
  category: ConfidentialityAgreementsQuestionCategory;
  type: ConfidentialityAgreementsQuestionType;
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
  conditionKey?: ConfidentialityAgreementsConditionKey;
  gapCodes: {
    partial: string;
    full: string;
  };
};

export type A66AssessmentContext = {
  hasRelevantExternalParties?: ContextDecision;
};

export type A66QuestionResolution = {
  questionIds: ConfidentialityAgreementsQuestionId[];
  unresolvedConditions: Array<ConfidentialityAgreementsConditionKey>;
  hiddenQuestionIds: ConfidentialityAgreementsQuestionId[];
};

export const CONFIDENTIALITY_AGREEMENTS_PLAN_CODE = "A6_6_CONFIDENTIALITY_AGREEMENTS_PLAN";

const confidentialityAgreementsAnswerValues: ReadonlyArray<AssessmentAnswerValue> = [
  ...assessmentAnswerValues,
];

export const CONFIDENTIALITY_AGREEMENTS_GAP_CODES = {
  p6_6_001: {
    partial: "A6_6_REQUIREMENTS_PARTIAL",
    full: "A6_6_REQUIREMENTS_ABSENT",
  },
  p6_6_002: {
    partial: "A6_6_EXECUTION_PARTIAL",
    full: "A6_6_EXECUTION_ABSENT",
  },
  p6_6_003: {
    partial: "A6_6_REGISTER_REVIEW_PARTIAL",
    full: "A6_6_REGISTER_REVIEW_ABSENT",
  },
  p6_6_004_external: {
    partial: "A6_6_EXTERNAL_COVERAGE_PARTIAL",
    full: "A6_6_EXTERNAL_COVERAGE_ABSENT",
  },
} as const;

export const confidentialityAgreementsQuestionIds = {
  mandatory: ["p6_6_001", "p6_6_002", "p6_6_003"] as const,
  conditionalExternal: "p6_6_004_external",
} as const;

export const confidentialityAgreementsQuestions: ConfidentialityAgreementsQuestion[] = [
  {
    id: "p6_6_001",
    category: "mandatory",
    type: "policy_process",
    index: 1,
    question: {
      fr: "Votre organisation a-t-elle défini dans quelles situations un accord de confidentialité ou de non-divulgation est requis, ainsi que le contenu approprié aux informations, aux rôles et aux relations concernées ?",
      en: "Has your organization defined when a confidentiality or non-disclosure agreement is required and the content appropriate to the information, roles, and relationships concerned?",
    },
    helpText: {
      fr: "Le processus doit permettre d'identifier :\n\nles informations nécessitant une protection contractuelle ;\nles populations et relations concernées ;\nles situations dans lesquelles un accord est requis ;\nsi une clause intégrée à un contrat est suffisante ou si un accord autonome est nécessaire ;\nles modèles et clauses adaptés ;\nles fonctions chargées de leur approbation ;\nles événements déclenchant une révision.\n\nLes critères peuvent dépendre de la classification des informations, du rôle, du niveau d’accès, de la relation contractuelle, du pays, des obligations clients et du droit applicable.\n\nUn NDA autonome n’est pas obligatoire dans tous les cas. Une clause de confidentialité intégrée peut être appropriée.",
      en: "The process should identify:\n\ninformation requiring contractual protection;\ncircumstances requiring an agreement;\ncriteria determining whether an incorporated clause is sufficient or a standalone agreement is needed;\nappropriate templates and clauses;\napproval responsibilities;\ncritical events triggering review.\n\nCriteria may depend on information classification, role, access, contractual relationship, jurisdiction, customer obligations, and applicable law.\n\nA standalone NDA is not required in every case. An incorporated confidentiality clause may be appropriate.",
    },
    evidenceHints: {
      fr: [
        "politique de confidentialité",
        "procédure de gestion des accords",
        "critères de nécessité",
        "matrice rôle–information–accord",
        "classification de l’information",
        "modèles de clauses ou d’accords",
        "validation juridique",
        "historique des versions",
        "règles de révision",
        "registre des exceptions",
      ],
      en: [
        "confidentiality policy",
        "agreement-management procedure",
        "necessity criteria",
        "role-information-agreement matrix",
        "information-classification scheme",
        "agreement or clause templates",
        "legal approval",
        "version history",
        "review rules",
        "exception register",
      ],
    },
    responseOptions: confidentialityAgreementsAnswerValues,
    gapCodes: CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_001,
  },
  {
    id: "p6_6_002",
    category: "mandatory",
    type: "application",
    index: 2,
    question: {
      fr: "Lorsque cela est requis, les personnes concernées signent-elles un accord approprié avant l’accès ou la divulgation des informations, avec des obligations adaptées à la relation et au droit applicable ?",
      en: "Where required, do the relevant people sign an appropriate agreement before accessing or receiving the information, with obligations suited to the relationship and applicable law?",
    },
    helpText: {
      fr: "Selon le contexte, l’accord peut couvrir :\n\nla définition des informations confidentielles ;\nle périmètre et les utilisations autorisées ;\nles restrictions de divulgation ;\nles responsabilités de protection ;\nles informations appartenant à des tiers ;\nle signalement d’une divulgation ou violation ;\nla restitution, suppression ou destruction ;\nles obligations postérieures à la relation ;\nles conséquences ou recours applicables ;\nle droit applicable.\n\nL’accord peut être signé physiquement, électroniquement ou accepté par une autre méthode juridiquement valable. Aucun outil de signature particulier ne doit être imposé.",
      en: "Depending on the context, the agreement may cover:\n\nthe definition of confidential information;\nscope and permitted use;\ndisclosure restrictions;\nprotection responsibilities;\nthird-party information;\nreporting unauthorized disclosure or breach;\nreturn, deletion, or destruction;\npost-relationship duties;\navailable remedies;\ngoverning law.\n\nThe agreement may be signed physically, electronically, or accepted through another legally valid method. No particular signature tool should be required.",
    },
    evidenceHints: {
      fr: [
        "modèle approuvé",
        "contrat avec clause de confidentialité",
        "NDA autonome lorsqu’il est nécessaire",
        "exemple expurgé d’un accord signé",
        "preuve d’acceptation",
        "métadonnées de signature lorsqu’elles existent",
        "checklist d’onboarding ou de contractualisation",
        "registre des accords manquants",
        "exceptions approuvées",
        "validation juridique",
      ],
      en: [
        "approved template",
        "contract containing a confidentiality clause",
        "standalone NDA where required",
        "redacted executed agreement",
        "acceptance evidence",
        "signature metadata where available",
        "onboarding or contracting checklist",
        "missing-agreement register",
        "approved exceptions",
        "legal approval",
      ],
    },
    responseOptions: confidentialityAgreementsAnswerValues,
    gapCodes: CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_002,
  },
  {
    id: "p6_6_003",
    category: "mandatory",
    type: "proof_traceability",
    index: 3,
    question: {
      fr: "Votre organisation conserve-t-elle un registre traçable des accords signés et les réexamine-t-elle lorsqu’un changement de relation, d’information, de risque, de politique ou de droit peut affecter leur adéquation ?",
      en: "Does your organization retain a traceable register of signed agreements and review them when changes in relationships, information, risk, policy, or law may affect their adequacy?",
    },
    helpText: {
      fr: "Le registre peut notamment conserver :\n\nla personne ou l’entité concernée ;\nla catégorie de relation ;\nle type d’accord ou de clause ;\nle modèle et sa version ;\nle périmètre couvert ;\nles dates de transmission, signature et entrée en vigueur ;\nla date d’expiration lorsqu’elle existe ;\nle propriétaire et le statut ;\nles exceptions ;\nl’historique de révision ou de remplacement.\n\nLa révision peut être périodique selon une fréquence proportionnée ou déclenchée par un changement de rôle, de relation, de périmètre, de classification, de politique, de loi, de contrat ou par un incident.\n\n",
      en: "The register may retain:\n\nthe relevant person or entity;\nrelationship category;\nagreement or clause type;\ntemplate and version;\ncovered scope;\ntransmission, signature, and effective dates;\nexpiration date where applicable;\nowner and status;\nexceptions;\nreview or replacement history.\n\nReview may occur periodically at a proportionate frequency or be triggered by a change in role, relationship, scope, classification, policy, law, contract, or an incident.\n\n",
    },
    evidenceHints: {
      fr: [
        "registre des accords",
        "liste des signataires",
        "versions et dates",
        "date de signature ou d’acceptation",
        "périmètre couvert",
        "échéance lorsqu’elle existe",
        "statut de chaque accord",
        "historique de revue",
        "compte rendu de revue juridique",
        "preuve d’avenant ou de remplacement",
        "registre des exceptions",
        "règles d’accès et de conservation",
      ],
      en: [
        "agreement register",
        "signatory list",
        "versions and dates",
        "signature or acceptance date",
        "covered scope",
        "expiration where applicable",
        "agreement status",
        "review history",
        "legal review record",
        "amendment or replacement evidence",
        "exception register",
        "access and retention rules",
      ],
    },
    responseOptions: confidentialityAgreementsAnswerValues,
    gapCodes: CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_003,
  },
  {
    id: "p6_6_004_external",
    category: "conditional_external",
    type: "conditional",
    index: 4,
    question: {
      fr: "Les consultants, fournisseurs, partenaires et autres parties externes qui accèdent à des informations confidentielles sont-ils couverts par des accords adaptés et démontrables ?",
      en: "Are consultants, suppliers, partners, and other external parties that access confidential information covered by appropriate and demonstrable agreements?",
    },
    helpText: {
      fr: "Les parties externes peuvent comprendre :\n\nconsultants ;\nfreelances ;\ntravailleurs temporaires ;\nfournisseurs et sous-traitants ;\npartenaires commerciaux ;\nmembres externes de conseils ou comités ;\nvisiteurs recevant des informations confidentielles ;\nparticipants à un projet commun ;\ninvestisseurs ou acquéreurs potentiels.\n\nLa protection peut prendre la forme d’une clause contractuelle, d’un NDA autonome, d’un accord mutuel ou d’un engagement spécifique.\nElle doit être proportionnée aux informations, accès, risques, juridictions, sous-traitants et obligations applicables.",
      en: "External parties may include:\n\nconsultants;\ntemporary workers;\nfreelancers;\nsuppliers and subcontractors;\nbusiness partners;\nexternal board or committee members;\nvisitors receiving confidential information;\njoint-project participants;\npotential investors or acquirers.\n\nProtection may take the form of a contractual clause, standalone NDA, mutual NDA, or specific undertaking.\nIt should be proportionate to the information, access, risks, jurisdictions, subcontractors, and applicable obligations.",
    },
    evidenceHints: {
      fr: [
        "registre des parties externes",
        "contrats fournisseurs",
        "accords de prestation",
        "NDA mutuels ou unilatéraux",
        "clauses de confidentialité",
        "liste des sous-traitants",
        "preuve de signature ou d’acceptation",
        "checklist fournisseur",
        "correspondance entre accès et accord",
        "registre des exceptions",
        "preuve de révision ou renouvellement",
        "exemple expurgé",
      ],
      en: [
        "external-party register",
        "supplier contracts",
        "service agreements",
        "mutual or one-way NDAs",
        "confidentiality clauses",
        "subcontractor list",
        "signature or acceptance evidence",
        "supplier checklist",
        "mapping between access and agreement",
        "exception register",
        "review or renewal evidence",
        "redacted sample",
      ],
    },
    responseOptions: confidentialityAgreementsAnswerValues,
    conditionKey: "hasRelevantExternalParties",
    gapCodes: CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_004_external,
  },
];

const questionMap = new Map(
  confidentialityAgreementsQuestions.map((question) => [question.id, question] as const),
);

export function resolveConfidentialityAgreementsQuestions(
  context: A66AssessmentContext = {},
): A66QuestionResolution {
  const questionIds: ConfidentialityAgreementsQuestionId[] = [
    ...confidentialityAgreementsQuestionIds.mandatory,
  ];
  const hiddenQuestionIds: ConfidentialityAgreementsQuestionId[] = [];
  const unresolvedConditions: ConfidentialityAgreementsConditionKey[] = [];

  if (context.hasRelevantExternalParties === "yes") {
    questionIds.push(confidentialityAgreementsQuestionIds.conditionalExternal);
  } else if (context.hasRelevantExternalParties === "no") {
    hiddenQuestionIds.push(confidentialityAgreementsQuestionIds.conditionalExternal);
  } else {
    hiddenQuestionIds.push(confidentialityAgreementsQuestionIds.conditionalExternal);
    unresolvedConditions.push("hasRelevantExternalParties");
  }

  return {
    questionIds,
    unresolvedConditions,
    hiddenQuestionIds,
  };
}

export function getConfidentialityAgreementQuestion(
  questionId: string,
  locale: AssessmentLocale,
) {
  const question = questionMap.get(questionId as ConfidentialityAgreementsQuestionId);
  if (!question) {
    throw new Error(`Unknown A.6.6 question id: ${questionId}`);
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

export function getAllConfidentialityAgreementsQuestions(locale: AssessmentLocale = "en") {
  return confidentialityAgreementsQuestions.map((question) => ({
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

export function isConfidentialityAgreementsQuestion(
  questionId: string,
): questionId is ConfidentialityAgreementsQuestionId {
  return questionMap.has(questionId as ConfidentialityAgreementsQuestionId);
}

export const confidentialityAgreementsLegalNotice = {
  fr: "Les accords de confidentialité, leur portée, leur durée, leur opposabilité, les obligations postérieures à la relation, les recours disponibles et les règles de conservation dépendent du pays, du statut de la personne, du droit du travail, du droit des contrats, des conventions collectives et du droit de la vie privée applicables. Les modèles et processus concernés doivent être validés par les fonctions juridiques, RH et vie privée compétentes.\n\nNormCore ne fournit aucun conseil juridique personnalisé.",
  en: "Confidentiality agreements, their scope, duration, enforceability, post-relationship obligations, available remedies, and retention requirements depend on the country, the person’s legal status, employment law, contract law, collective agreements, and applicable privacy law. Relevant templates and processes should be reviewed by competent legal, HR, and privacy functions.\n\nNormCore does not provide personalized legal advice.",
};


