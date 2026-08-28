import { assessmentAnswerValues } from "../../assessment-infrastructure.ts";

export type AssessmentLocale = "fr" | "en";
export type AssessmentAnswerValue = (typeof assessmentAnswerValues)[number];

export type ContextDecision = "yes" | "no" | "not_sure";
export type EmploymentTermsConditionKey = "hasExternalPersonnel" | "hasSignificantChanges";

export type EmploymentTermsQuestionCategory =
  | "mandatory"
  | "conditional_external"
  | "conditional_role_change";

export type EmploymentTermsQuestionId =
  | "p6_2_001"
  | "p6_2_002"
  | "p6_2_003"
  | "p6_2_004"
  | "p6_2_005_external"
  | "p6_2_005_change";

export type EmploymentTermsQuestion = {
  id: EmploymentTermsQuestionId;
  category: EmploymentTermsQuestionCategory;
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
  conditionKey?: EmploymentTermsConditionKey;
  gapCodes: {
    partial: string;
    full: string;
  };
};

export type A62AssessmentContext = {
  hasExternalPersonnel?: ContextDecision;
  hasSignificantChanges?: ContextDecision;
};

export type A62QuestionResolution = {
  questionIds: EmploymentTermsQuestionId[];
  unresolvedConditions: EmploymentTermsConditionKey[];
  hiddenQuestionIds: EmploymentTermsQuestionId[];
};

export const EMPLOYMENT_TERMS_PLAN_CODE = "A6_2_EMPLOYMENT_TERMS_PLAN";

const employmentTermsAnswerValues: ReadonlyArray<AssessmentAnswerValue> = [...assessmentAnswerValues];

export const EMPLOYMENT_TERMS_GAP_CODES = {
  p6_2_001: {
    partial: "A6_2_CONTRACTUAL_FRAMEWORK_PARTIAL",
    full: "A6_2_CONTRACTUAL_FRAMEWORK_ABSENT",
  },
  p6_2_002: {
    partial: "A6_2_ACCEPTANCE_PARTIAL",
    full: "A6_2_ACCEPTANCE_ABSENT",
  },
  p6_2_003: {
    partial: "A6_2_TRACEABILITY_PARTIAL",
    full: "A6_2_TRACEABILITY_ABSENT",
  },
  p6_2_004: {
    partial: "A6_2_TRACEABILITY_PARTIAL",
    full: "A6_2_TRACEABILITY_ABSENT",
  },
  p6_2_005_external: {
    partial: "A6_2_EXTERNAL_PARTIAL",
    full: "A6_2_EXTERNAL_ABSENT",
  },
  p6_2_005_change: {
    partial: "A6_2_CHANGE_PARTIAL",
    full: "A6_2_CHANGE_ABSENT",
  },
} as const;

export const employmentTermsQuestionIds = {
  mandatory: ["p6_2_001", "p6_2_002", "p6_2_003", "p6_2_004"] as const,
  conditionalExternal: "p6_2_005_external",
  conditionalChange: "p6_2_005_change",
} as const;

export const employmentTermsQuestions: EmploymentTermsQuestion[] = [
  {
    id: "p6_2_001",
    category: "mandatory",
    type: "policy_process",
    index: 1,
    question: {
      fr: "Votre organisation a-t-elle défini les responsabilités de sécurité de l’information qui doivent être incluses dans les contrats ou autres accords d’engagement applicables ?",
      en: "Has your organization defined the information security responsibilities that must be included in applicable employment or engagement agreements?",
    },
    helpText: {
      fr: "Cette question vérifie que les responsabilités de sécurité du personnel et de l'organisation sont définies dans des contrats, avenants, annexes ou autres accords d'engagement applicables, et pas uniquement dans une politique interne sans lien contractuel.",
      en: "This checks whether the information security responsibilities of personnel and the organization are defined in applicable contracts, schedules, annexes, or other engagement agreements, rather than existing only in an internal policy with no contractual connection.",
    },
    evidenceHints: {
      fr: [
        "modèle de contrat ou d'accord",
        "annexe de sécurité",
        "matrice responsabilités–clauses",
        "charte incorporée à l'accord",
        "procédure RH contractuelle",
        "historique des versions",
        "validation RH ou juridique",
      ],
      en: [
        "contract or agreement template",
        "security annex",
        "responsibility-to-clause matrix",
        "policy incorporated into the agreement",
        "HR contractual procedure",
        "version history",
        "HR or legal approval",
      ],
    },
    responseOptions: employmentTermsAnswerValues,
    gapCodes: EMPLOYMENT_TERMS_GAP_CODES.p6_2_001,
  },
  {
    id: "p6_2_002",
    category: "mandatory",
    type: "application",
    index: 2,
    question: {
      fr: "Les accords applicables précisent-ils clairement les responsabilités de sécurité du personnel et celles de l’organisation, d’une manière adaptée au rôle, aux accès et aux informations concernées ?",
      en: "Do the applicable agreements clearly state the information security responsibilities of both personnel and the organization, in a way that is appropriate to the role, access, and information involved?",
    },
    helpText: {
      fr: "Cette question vérifie que les conditions ne restent pas dans un modèle inutilisé et qu'une méthode permet de démontrer leur communication et leur acceptation.",
      en: "This checks whether the terms are actually communicated and accepted rather than remaining in an unused template, and whether that acceptance can be demonstrated.",
    },
    evidenceHints: {
      fr: [
        "contrat ou accord accepté",
        "certificat de signature",
        "acceptation numérique enregistrée",
        "checklist d'onboarding",
        "validation RH",
        "ticket d'attribution d'accès",
        "dates d'acceptation et d'activation",
        "registre des exceptions",
      ],
      en: [
        "accepted contract or agreement",
        "signature certificate",
        "recorded digital acceptance",
        "onboarding checklist",
        "HR approval",
        "access-provisioning ticket",
        "acceptance and activation dates",
        "exception register",
      ],
    },
    responseOptions: employmentTermsAnswerValues,
    gapCodes: EMPLOYMENT_TERMS_GAP_CODES.p6_2_002,
  },
  {
    id: "p6_2_003",
    category: "mandatory",
    type: "application",
    index: 3,
    question: {
      fr: "Les conditions de sécurité applicables sont-elles communiquées et formellement acceptées au plus tard au début de l’engagement, et avant l’attribution des accès sensibles lorsque le processus l’exige ?",
      en: "Are the applicable security terms communicated and formally accepted no later than the start of the engagement, and before sensitive access is granted when required by the process?",
    },
    helpText: {
      fr: "Cette question vérifie que l'organisation peut retrouver le document applicable, sa version, sa date d'acceptation, la personne ou population concernée et les éventuelles exceptions.",
      en: "This checks whether the organization can retrieve the applicable document, its version, acceptance date, the person or population concerned, and any exceptions.",
    },
    evidenceHints: {
      fr: [
        "registre des accords",
        "contrat ou avenant expurgé",
        "certificat de signature électronique",
        "historique des versions",
        "liste de population et statut",
        "référence de dossier RH",
        "registre des exceptions",
        "règles d'accès et de conservation",
      ],
      en: [
        "agreement register",
        "redacted contract or amendment",
        "electronic-signature certificate",
        "version history",
        "population and status list",
        "HR record reference",
        "exception register",
        "access and retention rules",
      ],
    },
    responseOptions: employmentTermsAnswerValues,
    gapCodes: EMPLOYMENT_TERMS_GAP_CODES.p6_2_003,
  },
  {
    id: "p6_2_004",
    category: "mandatory",
    type: "proof_traceability",
    index: 4,
    question: {
      fr: "Votre organisation conserve-t-elle une preuve permettant d’identifier l’accord accepté, sa version, sa date et la personne ou catégorie de personnel concernée ?",
      en: "Does your organization retain evidence identifying the accepted agreement, its version, its date, and the person or personnel category concerned?",
    },
    helpText: {
      fr: "Cette question vérifie que l'organisation peut retrouver la preuve de l'accord accepté, sa version, sa date et la personne ou catégorie de personnel concernée.",
      en: "This checks whether the organization can retrieve evidence of the accepted agreement, its version, its date, and the relevant person or personnel category.",
    },
    evidenceHints: {
      fr: [
        "registre des accords",
        "accord accepté expurgé",
        "certificat de signature électronique",
        "historique des versions",
        "référence de dossier RH",
        "preuve d'acceptation",
        "registre des exceptions",
      ],
      en: [
        "agreement register",
        "redacted accepted agreement",
        "electronic-signature certificate",
        "version history",
        "HR record reference",
        "acceptance evidence",
        "exception register",
      ],
    },
    responseOptions: employmentTermsAnswerValues,
    gapCodes: EMPLOYMENT_TERMS_GAP_CODES.p6_2_004,
  },
  {
    id: "p6_2_005_external",
    category: "conditional_external",
    type: "conditional",
    index: 5,
    question: { fr: "Les prestataires, consultants, intérimaires et autres personnels externes sont-ils couverts par des obligations de sécurité adaptées à leur relation contractuelle et à leur niveau d’accès ?", en: "Are contractors, consultants, temporary workers, and other external personnel covered by security obligations appropriate to their contractual relationship and level of access?" },
    helpText: { fr: "Cette question est affichée uniquement lorsque du personnel externe avec un accès pertinent est utilisé.", en: "This question is displayed only when external personnel with relevant access is used." },
    evidenceHints: { fr: ["contrat de prestation", "clauses de sécurité fournisseur"], en: ["service agreement", "supplier security clauses"] },
    responseOptions: employmentTermsAnswerValues,
    conditionKey: "hasExternalPersonnel",
    gapCodes: EMPLOYMENT_TERMS_GAP_CODES.p6_2_005_external,
  },
  {
    id: "p6_2_005_change",
    category: "conditional_role_change",
    type: "conditional",
    index: 5,
    question: {
      fr: "Les conditions de sécurité sont-elles réexaminées et, lorsque nécessaire, mises à jour ou réacceptées à la suite d’un changement important de rôle, de politique, de loi ou de contrat ?",
      en: "Are security terms reviewed and, where necessary, updated or re-accepted following a significant change in role, policy, law, or contractual relationship?",
    },
    helpText: {
      fr: "Une nouvelle signature n'est pas nécessaire après chaque modification mineure. L'organisation doit déterminer si le changement nécessite une simple communication, une nouvelle acceptation, un avenant ou un nouvel accord.",
      en: "A new signature is not required after every minor change. The organization should determine whether the change requires communication, renewed acceptance, an amendment, or a new agreement.",
    },
    evidenceHints: {
      fr: [
        "critères de revue",
        "procédure de modification",
        "journal des changements",
        "avis RH ou juridique",
        "avenant",
        "preuve de réacceptation",
        "décision documentée de non-mise à jour",
      ],
      en: [
        "review criteria",
        "change procedure",
        "change log",
        "HR or legal advice",
        "amendment",
        "renewed acceptance evidence",
        "documented decision not to update",
      ],
    },
    responseOptions: employmentTermsAnswerValues,
    conditionKey: "hasSignificantChanges",
    gapCodes: EMPLOYMENT_TERMS_GAP_CODES.p6_2_005_change,
  },
];

const questionMap = new Map(employmentTermsQuestions.map((question) => [question.id, question] as const));

export const employmentTermsQuestionById = (questionId: EmploymentTermsQuestionId) => questionMap.get(questionId);

export function getEmploymentTermsQuestion(questionId: string, locale: AssessmentLocale) {
  const question = questionMap.get(questionId as EmploymentTermsQuestionId);
  if (!question) {
    throw new Error(`Unknown A.6.2 question id: ${questionId}`);
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

export function getAllEmploymentTermsQuestions(locale: AssessmentLocale = "en") {
  return employmentTermsQuestions.map((question) => ({
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

export function isEmploymentTermsQuestion(questionId: string): questionId is EmploymentTermsQuestionId {
  return questionMap.has(questionId as EmploymentTermsQuestionId);
}

export function resolveEmploymentTermsQuestions(context: A62AssessmentContext = {}): A62QuestionResolution {
  const questionIds: EmploymentTermsQuestionId[] = [...employmentTermsQuestionIds.mandatory];
  const hiddenQuestionIds: EmploymentTermsQuestionId[] = [];
  const unresolvedConditions: EmploymentTermsConditionKey[] = [];

  if (context.hasExternalPersonnel === "yes") {
    questionIds.push(employmentTermsQuestionIds.conditionalExternal);
    hiddenQuestionIds.push(employmentTermsQuestionIds.conditionalChange);
    return { questionIds, unresolvedConditions, hiddenQuestionIds };
  } else if (context.hasExternalPersonnel === "no") {
    hiddenQuestionIds.push(employmentTermsQuestionIds.conditionalExternal);
  } else {
    hiddenQuestionIds.push(employmentTermsQuestionIds.conditionalExternal);
    unresolvedConditions.push("hasExternalPersonnel");
  }

  if (context.hasSignificantChanges === "yes") {
    questionIds.push(employmentTermsQuestionIds.conditionalChange);
  } else if (context.hasSignificantChanges === "no") {
    hiddenQuestionIds.push(employmentTermsQuestionIds.conditionalChange);
  } else {
    hiddenQuestionIds.push(employmentTermsQuestionIds.conditionalChange);
    unresolvedConditions.push("hasSignificantChanges");
  }

  return {
    questionIds,
    unresolvedConditions,
    hiddenQuestionIds,
  };
}
