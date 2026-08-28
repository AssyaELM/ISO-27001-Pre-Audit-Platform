import { assessmentAnswerValues } from "../../assessment-infrastructure.ts";

export type AssessmentLocale = "fr" | "en";

export type AssessmentAnswerValue = (typeof assessmentAnswerValues)[number];
export type ContextDecision = "yes" | "no" | "not_sure";
export type ScreeningConditionKey = "hasExternalPersonnel" | "hasSensitiveRoleChanges";
export type A61AssessmentContext = {
  hasExternalPersonnel?: ContextDecision;
  hasSensitiveRoleChanges?: ContextDecision;
};

export type A61QuestionResolution = {
  controlApplicability: "applicable";
  controlReviewState: "none";
  requiresControlJustification: false;
  questionIds: string[];
  hiddenQuestionIds: string[];
  unresolvedConditions: ScreeningConditionKey[];
  assessmentBlocked: boolean;
};

export type ScreeningQuestionCategory = "mandatory" | "conditional_external" | "conditional_role_change";

export type ScreeningQuestion = {
  id: string;
  category: ScreeningQuestionCategory;
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
  responseOptions: AssessmentAnswerValue[];
};

export const SCREENING_PLAN_CODE = "A6_1_SCREENING_PLAN";
export const screeningQuestionIds = {
  main: ["p6_1_001", "p6_1_002", "p6_1_003", "p6_1_004"],
  external: "p6_1_005_external",
  roleChange: "p6_1_005_role_change",
} as const;

export const screeningAnswerValues: AssessmentAnswerValue[] = [...assessmentAnswerValues];

export const screeningAnswerLabels = {
  fr: {
    implemented: "Implémenté",
    partially_implemented: "Partiellement implémenté",
    not_implemented: "Non implémenté",
    not_sure: "Je ne sais pas",
    not_applicable: "Non applicable",
  },
  en: {
    implemented: "Implemented",
    partially_implemented: "Partially implemented",
    not_implemented: "Not implemented",
    not_sure: "Not sure",
    not_applicable: "Not applicable",
  },
} as const;

export const screeningQuestions: ScreeningQuestion[] = [
  {
    id: "p6_1_001",
    category: "mandatory",
    type: "policy_process",
    index: 1,
    question: {
      fr: "Votre organisation a-t-elle défini et documenté un processus de vérification préalable des personnes avant leur recrutement ou leur engagement ?",
      en: "Has your organization defined and documented a screening process for people before they are hired or otherwise engaged?",
    },
    helpText: {
      fr: "Cette question vérifie l’existence d’une procédure, d’une checklist ou de règles formelles définissant les vérifications, le périmètre et les responsabilités.",
      en: "This checks whether a procedure, checklist, or formal rules define the required checks, scope, and responsibilities.",
    },
    responseOptions: screeningAnswerValues,
  },
  {
    id: "p6_1_002",
    category: "mandatory",
    type: "application",
    index: 2,
    question: {
      fr: "Les vérifications prévues sont-elles adaptées au risque du poste, au niveau d’accès et à la sensibilité des informations, tout en respectant les lois applicables ?",
      en: "Are the planned checks proportionate to the role's risk, access level, and information sensitivity, while complying with applicable laws?",
    },
    helpText: {
      fr: "Les mêmes vérifications ne doivent pas être appliquées automatiquement à toutes les personnes. Leur nature doit être justifiée par les risques et la législation applicable.",
      en: "The same checks should not automatically be applied to everyone. Their nature should be justified by risk and applicable law.",
    },
    responseOptions: screeningAnswerValues,
  },
  {
    id: "p6_1_003",
    category: "mandatory",
    type: "application",
    index: 3,
    question: {
      fr: "Lorsque des vérifications sont requises, sont-elles terminées avant l’entrée en fonction ou avant l’attribution des accès concernés ?",
      en: "When checks are required, are they completed before the person starts work or before the relevant access is granted?",
    },
    helpText: {
      fr: "Cette question vérifie que le processus est réellement appliqué avant qu’une personne reçoive les accès concernés.",
      en: "This checks whether the process is actually completed before the relevant access is granted.",
    },
    responseOptions: screeningAnswerValues,
  },
  {
    id: "p6_1_004",
    category: "mandatory",
    type: "proof_traceability",
    index: 4,
    question: {
      fr: "Votre organisation conserve-t-elle des preuves permettant de démontrer que les vérifications de screening requises ont été réalisées et que les résultats, exceptions ou problèmes identifiés ont été correctement traités ?",
      en: "Does your organization retain evidence demonstrating that required screening checks were performed and that identified results, exceptions, or issues were appropriately handled?",
    },
    helpText: {
      fr: "La trace peut être une checklist anonymisée, une validation RH ou un statut approuvé. Il n’est pas nécessaire d’exposer toutes les données personnelles du candidat.",
      en: "The record may be an anonymized checklist, HR approval, or an approved status. It is not necessary to expose all of the candidate's personal information.",
    },
    responseOptions: screeningAnswerValues,
  },
  {
    id: "p6_1_005_external",
    category: "conditional_external",
    type: "conditional",
    index: 5,
    question: {
      fr: "Le processus couvre-t-il également les prestataires, intérimaires et autres personnes externes lorsque leur niveau d’accès le justifie ?",
      en: "Does the process also cover contractors, temporary workers, and other external personnel when their level of access makes this appropriate?",
    },
    helpText: {
      fr: "Affiche cette question uniquement quand l’organisation intègre des personnes externes.",
      en: "Display this question only when the organization involves external personnel.",
    },
    responseOptions: screeningAnswerValues,
  },
  {
    id: "p6_1_005_role_change",
    category: "conditional_role_change",
    type: "conditional",
    index: 6,
    question: {
      fr: "Le besoin de nouvelles vérifications est-il réévalué lorsqu’une personne accède à un poste ou à des privilèges significativement plus sensibles ?",
      en: "Is the need for additional screening reassessed when a person moves into a significantly more sensitive role or receives significantly higher privileges?",
    },
    helpText: {
      fr: "Affiche cette question uniquement pour les organisations où des changements de privilèges sensibles sont possibles.",
      en: "Display this question only for organizations where significant sensitive privilege changes are possible.",
    },
    responseOptions: screeningAnswerValues,
  },
];

const questionMap = new Map(screeningQuestions.map((question) => [question.id, question] as const));

export const screeningConditionDefinitions = {
  fr: {
    external: "L’organisation utilise des prestataires, consultants, freelances, intérimaires ou autres personnes externes.",
    roleChange: "L’organisation permet des changements de rôle ou d’accès sensibles.",
  },
  en: {
    external: "The organization engages contractors, consultants, temporary workers, or other external people.",
    roleChange: "The organization allows promotion, role changes, privileged accounts, or significant right increases.",
  },
} as const;

export function getScreeningQuestion(questionId: string, locale: AssessmentLocale) {
  const question = questionMap.get(questionId);
  if (!question) {
    throw new Error(`Unknown A.6.1 question id: ${questionId}`);
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

export function getAllScreeningQuestions(locale: AssessmentLocale = "en") {
  return screeningQuestions.map((question) => ({
    id: question.id,
    category: question.category,
    type: question.type,
    index: question.index,
    question: question.question[locale],
    helpText: question.helpText[locale],
    responseOptions: [...question.responseOptions],
  }));
}

export function isPeopleScreeningQuestion(questionId: string): boolean {
  return questionMap.has(questionId);
}
