import { assessmentAnswerValues } from "../../assessment-infrastructure.ts";

export type AssessmentLocale = "fr" | "en";
export type AssessmentAnswerValue = (typeof assessmentAnswerValues)[number];

export type ContextDecision = "yes" | "no" | "not_sure";

export type PostEmploymentConditionKey = "hasEmploymentRoleChanges" | "hasRelevantExternalParties";

export type PostEmploymentQuestionCategory =
  | "mandatory"
  | "conditional_role_change"
  | "conditional_external";

export type PostEmploymentQuestionType =
  | "policy_process"
  | "application"
  | "proof_traceability"
  | "conditional";

export type PostEmploymentResponsibilitiesQuestionId =
  | "p6_5_001"
  | "p6_5_002"
  | "p6_5_003"
  | "p6_5_004_role_change"
  | "p6_5_005_external";

export type PostEmploymentResponsibilitiesQuestion = {
  id: PostEmploymentResponsibilitiesQuestionId;
  category: PostEmploymentQuestionCategory;
  type: PostEmploymentQuestionType;
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
  conditionKey?: PostEmploymentConditionKey;
  gapCodes: {
    partial: string;
    full: string;
  };
};

export type A65AssessmentContext = {
  hasEmploymentRoleChanges?: ContextDecision;
  hasRelevantExternalParties?: ContextDecision;
};

export type A65QuestionResolution = {
  questionIds: PostEmploymentResponsibilitiesQuestionId[];
  unresolvedConditions: PostEmploymentConditionKey[];
  hiddenQuestionIds: PostEmploymentResponsibilitiesQuestionId[];
};

export const POST_EMPLOYMENT_RESPONSIBILITIES_PLAN_CODE =
  "A6_5_POST_EMPLOYMENT_RESPONSIBILITIES_PLAN";

const postEmploymentResponsibilitiesAnswerValues: ReadonlyArray<AssessmentAnswerValue> = [...assessmentAnswerValues];

export const POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES = {
  p6_5_001: {
    partial: "A6_5_SURVIVING_DUTIES_PARTIAL",
    full: "A6_5_SURVIVING_DUTIES_ABSENT",
  },
  p6_5_002: {
    partial: "A6_5_TERMINATION_PROCESS_PARTIAL",
    full: "A6_5_TERMINATION_PROCESS_ABSENT",
  },
  p6_5_003: {
    partial: "A6_5_EXECUTION_EVIDENCE_PARTIAL",
    full: "A6_5_EXECUTION_EVIDENCE_ABSENT",
  },
  p6_5_004_role_change: {
    partial: "A6_5_ROLE_CHANGE_PARTIAL",
    full: "A6_5_ROLE_CHANGE_ABSENT",
  },
  p6_5_005_external: {
    partial: "A6_5_EXTERNAL_EXIT_PARTIAL",
    full: "A6_5_EXTERNAL_EXIT_ABSENT",
  },
} as const;

export const postEmploymentResponsibilitiesQuestionIds = {
  mandatory: ["p6_5_001", "p6_5_002", "p6_5_003"] as const,
  conditionalRoleChange: "p6_5_004_role_change",
  conditionalExternal: "p6_5_005_external",
} as const;

export const postEmploymentResponsibilitiesQuestions: PostEmploymentResponsibilitiesQuestion[] = [
  {
    id: "p6_5_001",
    category: "mandatory",
    type: "policy_process",
    index: 1,
    question: {
      fr: "Les responsabilités et obligations de sécurité qui continuent après un départ, ou qui doivent être adaptées lors d’un changement de fonction, sont-elles clairement définies ?",
      en: "Are the information security responsibilities and duties that continue after termination, or that must be adapted following a change of role, clearly defined?",
    },
    helpText: {
      fr: "Cette question vérifie que l’organisation a déterminé quelles obligations restent applicables après la fin ou la modification de la relation.\n\nSelon le rôle, les informations et le droit applicable, ces obligations peuvent notamment concerner :\n- la confidentialité;\n- la non-divulgation;\n- la propriété intellectuelle;\n- la protection des informations détenues ou mémorisées;\n- la restitution ou la suppression d’informations;\n- l'interdiction d’utiliser certains actifs, comptes ou accès;\n- la conservation ou la destruction de copies;\n- la coopération liée à un événement ou à une enquête;\n- d’autres responsabilités contractuelles ou réglementaires applicables.\n\nLes obligations doivent être proportionnées et juridiquement appropriées.\n\nLe contrôle ne fixe pas une durée universelle. Certaines obligations peuvent avoir une durée définie, tandis que d’autres peuvent continuer aussi longtemps que l’information reste protégée ou selon le droit applicable.",
      en: "This question checks whether the organization has determined which information security responsibilities continue after the relationship ends or changes.\n\nDepending on the role, information, and applicable law, these responsibilities may include:\n- confidentiality;\n- non-disclosure;\n- intellectual property protection;\n- protection of information retained or remembered;\n- return or deletion of information;\n- prohibition on using former assets, accounts, or access;\n- retention or destruction of copies;\n- cooperation concerning an event or investigation;\n- other applicable contractual or regulatory responsibilities.\n\nResponsibilities should be proportionate and legally appropriate.\n\nThe control does not prescribe a universal duration. Some obligations may have a defined period, while others may continue for as long as the information remains protected or as required by applicable law.",
    },
    evidenceHints: {
      fr: [
        "contrats ou accords d’engagement",
        "clauses de confidentialité",
        "accords de non-divulgation",
        "politique de départ ou de mobilité",
        "clauses relatives à la propriété intellectuelle",
        "modèle de lettre ou de rappel de sortie",
        "matrice rôle–information–obligation",
        "validation juridique",
        "historique des versions",
      ],
      en: [
        "employment or engagement agreements",
        "confidentiality clauses",
        "non-disclosure agreements",
        "termination or mobility policy",
        "intellectual property clauses",
        "exit reminder or letter template",
        "role-information-obligation matrix",
        "legal approval",
        "version history",
      ],
    },
    responseOptions: postEmploymentResponsibilitiesAnswerValues,
    gapCodes: POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_001,
  },
  {
    id: "p6_5_002",
    category: "mandatory",
    type: "application",
    index: 2,
    question: {
      fr: "Un processus coordonné de départ déclenche-t-il, lors d’un départ, la communication des obligations persistantes, l’ajustement ou la suppression des accès, la restitution des actifs et le transfert des responsabilités nécessaires ?",
      en: "Does a coordinated process trigger, upon termination, communication of continuing obligations, adjustment or removal of access, return of assets, and any necessary transfer of responsibilities?",
    },
    helpText: {
      fr: "Le processus doit coordonner les fonctions concernées, par exemple :\n- les ressources humaines;\n- le manager;\n- l’équipe IT ou IAM;\n- la sécurité de l’information;\n- les achats ou propriétaires de contrats;\n- les responsables des actifs;\n- les services généraux ou la sécurité physique;\n- le juridique, lorsque nécessaire.\n\nLe processus peut notamment couvrir :\n- le déclenchement officiel du départ;\n- la date et les conditions de fin;\n- les départs planifiés et urgents;\n- le retrait ou l’ajustement des accès logiques et physiques;\n- la restitution des équipements, badges, clés et supports;\n- le transfert des responsabilités et connaissances nécessaires;\n- le traitement des informations détenues par la personne;\n- le rappel des obligations persistantes;\n- les exceptions et contrôles compensatoires;\n- la confirmation de clôture.\n\nNormCore ne doit pas imposer un délai universel identique.\n\nLe moment des actions doit être déterminé selon :\n- le type de départ;\n- le risque;\n- les accès détenus;\n- la sensibilité des informations;\n- les exigences légales et contractuelles;\n- le processus approuvé par l’organisation.",
      en: "The process should coordinate relevant functions, for example:\n- Human Resources;\n- the manager;\n- IT or IAM;\n- Information Security;\n- Procurement or contract owners;\n- asset owners;\n- Facilities or physical security;\n- Legal, where necessary.\n\nThe process may cover:\n- the official termination trigger;\n- the end date and termination conditions;\n- planned and urgent terminations;\n- removal or adjustment of logical and physical access;\n- return of equipment, badges, keys, and media;\n- necessary transfer of responsibilities and knowledge;\n- handling of information held by the individual;\n- reminders of continuing obligations;\n- exceptions and compensating controls;\n- closure confirmation.\n\nNormCore should not impose one universal timeframe.\n\nThe timing of actions should be determined according to:\n- the type of termination;\n- risk;\n- access held;\n- information sensitivity;\n- legal and contractual requirements;\n- the organization’s approved process.",
    },
    evidenceHints: {
      fr: [
        "procédure de départ",
        "checklist d’offboarding",
        "matrice des rôles",
        "notification RH–manager–IT",
        "ticket de désactivation",
        "demande de révocation des accès",
        "registre ou formulaire de restitution des actifs",
        "transfert de responsabilités",
        "rappel des obligations persistantes",
        "procédure pour départ urgent",
        "registre des exceptions",
        "confirmation de clôture",
      ],
      en: [
        "termination procedure",
        "offboarding checklist",
        "responsibility matrix",
        "HR-manager-IT notification",
        "deactivation ticket",
        "access removal request",
        "asset-return register or form",
        "responsibility handover",
        "reminder of continuing duties",
        "urgent termination procedure",
        "exception register",
        "closure confirmation",
      ],
    },
    responseOptions: postEmploymentResponsibilitiesAnswerValues,
    gapCodes: POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_002,
  },
  {
    id: "p6_5_003",
    category: "mandatory",
    type: "proof_traceability",
    index: 3,
    question: {
      fr: "Votre organisation conserve-t-elle une preuve traçable des actions de sécurité réalisées lors des départs, avec les dates, responsables, statuts et éventuelles exceptions ?",
      en: "Does your organization retain traceable evidence of the security actions performed during terminations, including dates, owners, statuses, and any exceptions?",
    },
    helpText: {
      fr: "La preuve doit permettre de relier un départ aux actions prévues et réalisées.\n\nSelon le processus, elle peut notamment identifier :\n- la personne ou la relation concernée;\n- le type de départ;\n- la date de notification;\n- la date effective de fin;\n- les propriétaires des actions;\n- les comptes ou accès concernés;\n- les actifs à restituer;\n- les responsabilités à transférer;\n- les obligations rappelées;\n- la date et le statut de chaque action;\n- les retards;\n- les exceptions;\n- les contrôles compensatoires;\n- la validation finale.\n\nLes preuves doivent être protégées, car elles peuvent contenir des données RH, juridiques ou de sécurité sensibles.",
      en: "Evidence should allow a termination to be linked to the planned and performed actions.\n\nDepending on the process, it may identify:\n- the person or relationship concerned;\n- the type of departure;\n- the notification date;\n- the effective end date;\n- action owners;\n- affected accounts or access;\n- assets to be returned;\n- responsibilities to transfer;\n- duties communicated;\n- the date and status of each action;\n- delays;\n- exceptions;\n- compensating controls;\n- final approval.\n\nEvidence should be protected because it may contain sensitive HR, legal, or security information.",
    },
    evidenceHints: {
      fr: [
        "checklist clôturée",
        "ticket ou workflow d’offboarding",
        "dates RH et dates des actions",
        "confirmations de désactivation",
        "preuve de restitution des actifs",
        "confirmation du manager",
        "preuve de rappel des obligations",
        "registre des exceptions",
        "approbation de clôture",
        "échantillon expurgé d’un départ récent",
        "rapport de contrôle interne",
      ],
      en: [
        "completed checklist",
        "offboarding ticket or workflow",
        "HR dates and action dates",
        "deactivation confirmations",
        "asset-return evidence",
        "manager confirmation",
        "evidence that continuing duties were communicated",
        "exception register",
        "closure approval",
        "redacted sample of a recent termination",
        "internal control report",
      ],
    },
    responseOptions: postEmploymentResponsibilitiesAnswerValues,
    gapCodes: POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_003,
  },
  {
    id: "p6_5_004_role_change",
    category: "conditional_role_change",
    type: "conditional",
    index: 4,
    question: {
      fr: "Lors d’un changement de fonction, les anciennes responsabilités et les accès devenus inutiles sont-ils réexaminés ou retirés, et les nouvelles responsabilités de sécurité sont-elles communiquées ?",
      en: "Following a change of role, are previous responsibilities and unnecessary access reviewed or removed, and are the new information security responsibilities communicated?",
    },
    helpText: {
      fr: "Un changement de fonction peut comprendre :\n- une promotion;\n- une mutation interne;\n- un transfert vers un autre service;\n- une modification importante de responsabilités;\n- une modification du niveau d’accès;\n- une affectation temporaire;\n- un changement de statut ou de périmètre.\n\nLe processus doit permettre de vérifier :\n- les anciennes responsabilités;\n- les anciens accès;\n- les droits devenus inutiles;\n- les responsabilités transférées;\n- les nouveaux accès requis;\n- les nouvelles obligations de sécurité;\n- les formations ou informations complémentaires nécessaires;\n- les éventuels documents ou accords à mettre à jour.\n\nLe contrôle ne demande pas nécessairement une nouvelle signature dans tous les cas. Une réacceptation ou une mise à jour documentaire est attendue lorsque le risque, le droit, le contrat ou le changement le justifie.",
      en: "A change of role may include:\n- a promotion;\n- an internal transfer;\n- a move to another department;\n- a significant change in responsibilities;\n- a change in access level;\n- a temporary assignment;\n- a change in status or scope.\n\nThe process should review:\n- previous responsibilities;\n- previous access;\n- rights that are no longer required;\n- transferred responsibilities;\n- newly required access;\n- new information security responsibilities;\n- additional documents or agreements to update.\n\nThe control does not necessarily require a new signature in every case. Re-acknowledgement or document updates are expected where justified by risk, law, contract, or the nature of the change.",
    },
    evidenceHints: {
      fr: [
        "procédure de mobilité interne",
        "workflow “mover”",
        "notification RH–manager–IT",
        "comparaison des anciens et nouveaux droits",
        "demande de retrait des droits devenus inutiles",
        "approbation des nouveaux droits",
        "nouvelle description de fonction",
        "communication des responsabilités",
        "formation complémentaire",
        "mise à jour ou réacceptation d’un document",
        "preuve de clôture",
      ],
      en: [
        "internal mobility procedure",
        "mover workflow",
        "HR-manager-IT notification",
        "comparison of previous and new access",
        "request to remove unnecessary rights",
        "approval of new rights",
        "updated job description",
        "communication of responsibilities",
        "additional training",
        "document update or re-acknowledgement",
        "closure evidence",
      ],
    },
    responseOptions: postEmploymentResponsibilitiesAnswerValues,
    conditionKey: "hasEmploymentRoleChanges",
    gapCodes: POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_004_role_change,
  },
  {
    id: "p6_5_005_external",
    category: "conditional_external",
    type: "conditional",
    index: 5,
    question: {
      fr: "La fin ou la modification d’un engagement avec un consultant, un intérimaire ou un autre intervenant externe déclenche-t-elle les actions de sécurité et les rappels d’obligations appropriés ?",
      en: "Does the termination or change of an engagement with a consultant, temporary worker, or other external party trigger the appropriate security actions and reminders of continuing obligations?",
    },
    helpText: {
      fr: "Le processus peut être déclenché par :\n- la fin d’un contrat;\n- la fin d’une mission;\n- un changement de fournisseur;\n- une modification du périmètre du service;\n- le remplacement d’un consultant;\n- la suppression ou modification d’un accès;\n- une suspension ou résiliation anticipée.\n\nLes actions peuvent notamment concerner :\n- la notification des responsables internes;\n- la suppression ou modification des accès;\n- la restitution des actifs;\n- la restitution, suppression ou transfert des informations;\n- la confirmation par le fournisseur;\n- le rappel des obligations persistantes;\n- la gestion des sous-traitants;\n- la gestion des prolongations ou exceptions;\n- la conservation de la preuve de clôture.\n\nLe processus doit être adapté à la relation contractuelle et au risque.",
      en: "The process may be triggered by:\n- contract termination;\n- completion of an assignment;\n- a change of supplier;\n- a change in service scope;\n- replacement of a consultant;\n- removal or modification of access;\n- suspension or early termination.\n\nActions may include:\n- notification of internal owners;\n- access removal or modification;\n- return of assets;\n- return, deletion, or transfer of information;\n- supplier confirmation;\n- subcontractor handling;\n- extensions and exceptions management;\n- retention of closure evidence.\n\nThe process should be appropriate to the contractual relationship and risk.",
    },
    evidenceHints: {
      fr: [
        "inventaire des parties externes",
        "propriétaires des contrats",
        "événements déclencheurs de fin ou modification",
        "dates contractuelles liées aux accès et actifs",
        "notifications IT et sécurité",
        "retrait ou modification des accès",
        "retour ou suppression d’informations",
        "rappels d’obligations",
        "confirmations du fournisseur",
        "preuves de clôture",
        "échantillon de fin de mission",
      ],
      en: [
        "external-party inventory",
        "contract owners",
        "termination and change triggers",
        "contractual dates linked to access and assets",
        "IT/security notifications",
        "access removal or modification",
        "information return, deletion, or transfer",
        "reminders of continuing duties",
        "supplier confirmations",
        "closure evidence",
        "sample of completed engagements",
      ],
    },
    responseOptions: postEmploymentResponsibilitiesAnswerValues,
    conditionKey: "hasRelevantExternalParties",
    gapCodes: POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_005_external,
  },
];

export const postEmploymentResponsibilitiesLegalNotice = {
  fr: "Les obligations postérieures à l’emploi ou à l’engagement, leur durée, leur opposabilité, les modalités de restitution ou de suppression des informations, la surveillance des comptes et la conservation des dossiers dépendent du pays, du droit du travail, des contrats, des conventions collectives et du droit de la vie privée applicables. Les documents et processus concernés doivent être validés par les fonctions RH, juridiques et vie privée compétentes.",
  en: "Post-employment or post-engagement duties, their duration and enforceability, information-return or deletion arrangements, account monitoring, and record retention depend on the country, applicable employment law, contracts, collective agreements, and privacy law. Relevant documents and processes should be reviewed by competent HR, legal, and privacy functions.",
};

const questionMap = new Map(
  postEmploymentResponsibilitiesQuestions.map((question) => [question.id, question] as const),
);

export function getPostEmploymentResponsibilitiesQuestion(questionId: string, locale: AssessmentLocale) {
  const question = questionMap.get(questionId as PostEmploymentResponsibilitiesQuestionId);
  if (!question) {
    throw new Error(`Unknown A.6.5 question id: ${questionId}`);
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

export function getAllPostEmploymentResponsibilitiesQuestions(locale: AssessmentLocale = "en") {
  return postEmploymentResponsibilitiesQuestions.map((question) => ({
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

export function isPostEmploymentResponsibilitiesQuestion(
  questionId: string,
): questionId is PostEmploymentResponsibilitiesQuestionId {
  return questionMap.has(questionId as PostEmploymentResponsibilitiesQuestionId);
}

export function resolvePostEmploymentResponsibilitiesQuestions(
  context: A65AssessmentContext = {},
): A65QuestionResolution {
  const questionIds: PostEmploymentResponsibilitiesQuestionId[] = [
    ...postEmploymentResponsibilitiesQuestionIds.mandatory,
  ];
  const hiddenQuestionIds: PostEmploymentResponsibilitiesQuestionId[] = [];
  const unresolvedConditions: PostEmploymentConditionKey[] = [];

  if (context.hasEmploymentRoleChanges === "yes") {
    questionIds.push(postEmploymentResponsibilitiesQuestionIds.conditionalRoleChange);
  } else if (context.hasEmploymentRoleChanges === "no") {
    hiddenQuestionIds.push(postEmploymentResponsibilitiesQuestionIds.conditionalRoleChange);
  } else {
    hiddenQuestionIds.push(postEmploymentResponsibilitiesQuestionIds.conditionalRoleChange);
    unresolvedConditions.push("hasEmploymentRoleChanges");
  }

  if (context.hasRelevantExternalParties === "yes") {
    questionIds.push(postEmploymentResponsibilitiesQuestionIds.conditionalExternal);
  } else if (context.hasRelevantExternalParties === "no") {
    hiddenQuestionIds.push(postEmploymentResponsibilitiesQuestionIds.conditionalExternal);
  } else {
    hiddenQuestionIds.push(postEmploymentResponsibilitiesQuestionIds.conditionalExternal);
    unresolvedConditions.push("hasRelevantExternalParties");
  }

  return {
    questionIds,
    unresolvedConditions,
    hiddenQuestionIds,
  };
}
