import { assessmentAnswerValues } from "../../assessment-infrastructure.ts";

export type AssessmentLocale = "fr" | "en";
export type AssessmentAnswerValue = (typeof assessmentAnswerValues)[number];

export type ContextDecision = "yes" | "no" | "not_sure";

export type A63AssessmentContext = {
  hasRolesRequiringSpecializedTraining?: ContextDecision;
  hasRelevantExternalParties?: ContextDecision;
};

export type A63ConditionKey =
  | "hasRolesRequiringSpecializedTraining"
  | "hasRelevantExternalParties";

export type A63QuestionResolution = {
  questionIds: AwarenessTrainingQuestionId[];
  unresolvedConditions: A63ConditionKey[];
  hiddenQuestionIds: AwarenessTrainingQuestionId[];
};

export type AwarenessTrainingQuestionCategory =
  | "mandatory"
  | "conditional_role_based"
  | "conditional_external";

export type AwarenessTrainingQuestionId =
  | "p6_3_001"
  | "p6_3_002"
  | "p6_3_003"
  | "p6_3_004_role_based"
  | "p6_3_005_external";

export type AwarenessTrainingQuestion = {
  id: AwarenessTrainingQuestionId;
  category: AwarenessTrainingQuestionCategory;
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
  conditionKey?: A63ConditionKey;
  gapCodes: {
    partial: string;
    full: string;
  };
};

export const AWARENESS_TRAINING_PLAN_CODE = "A6_3_AWARENESS_TRAINING_PLAN";

const awarenessTrainingAnswerValues: ReadonlyArray<AssessmentAnswerValue> = [...assessmentAnswerValues];

export const AWARENESS_TRAINING_GAP_CODES = {
  p6_3_001: {
    partial: "A6_3_PROGRAM_PARTIAL",
    full: "A6_3_PROGRAM_ABSENT",
  },
  p6_3_002: {
    partial: "A6_3_DELIVERY_UPDATES_PARTIAL",
    full: "A6_3_DELIVERY_UPDATES_ABSENT",
  },
  p6_3_003: {
    partial: "A6_3_EVIDENCE_EFFECTIVENESS_PARTIAL",
    full: "A6_3_EVIDENCE_EFFECTIVENESS_ABSENT",
  },
  p6_3_004_role_based: {
    partial: "A6_3_ROLE_BASED_PARTIAL",
    full: "A6_3_ROLE_BASED_ABSENT",
  },
  p6_3_005_external: {
    partial: "A6_3_EXTERNAL_COVERAGE_PARTIAL",
    full: "A6_3_EXTERNAL_COVERAGE_ABSENT",
  },
} as const;

export const awarenessTrainingQuestionIds = {
  mandatory: ["p6_3_001", "p6_3_002", "p6_3_003"] as const,
  conditionalRoleBased: "p6_3_004_role_based",
  conditionalExternal: "p6_3_005_external",
} as const;

export const awarenessTrainingQuestions: AwarenessTrainingQuestion[] = [
  {
    id: "p6_3_001",
    category: "mandatory",
    type: "policy_process",
    index: 1,
    question: {
      fr: "Votre organisation a-t-elle défini et documenté un programme de sensibilisation, d’éducation et de formation à la sécurité de l'information précisant les populations concernées, les objectifs, les responsabilités, les contenus et les modalités de mise à jour ?",
      en: "Has your organization defined and documented an information security awareness, education and training program specifying the audiences, objectives, responsibilities, content, and update arrangements?",
    },
    helpText: {
      fr: "Cette question vérifie qu’un cadre commun définit les personnes concernées, les responsables du programme, les objectifs d’apprentissage, les sujets généraux et spécialisés, les méthodes de diffusion, les moments de formation et de mise à jour ainsi que les règles de suivi des retards et exceptions.",
      en: "This checks whether a common framework defines the relevant audiences, program ownership, learning objectives, general and specialized topics, delivery methods, training and update triggers, and overdue completion and exception handling.",
    },
    evidenceHints: {
      fr: [
        "programme ou politique de sensibilisation et de formation",
        "plan de formation",
        "matrice population–rôle–contenu",
        "inventaire des contenus",
        "calendrier ou règles de déclenchement",
        "rôles et responsabilités",
        "historique des versions",
        "approbation du programme",
      ],
      en: [
        "awareness and training program or policy",
        "training plan",
        "audience-role-content matrix",
        "content inventory",
        "schedule or triggering rules",
        "roles and responsibilities",
        "version history",
        "program approval",
      ],
    },
    responseOptions: awarenessTrainingAnswerValues,
    gapCodes: AWARENESS_TRAINING_GAP_CODES.p6_3_001,
  },
  {
    id: "p6_3_002",
    category: "mandatory",
    type: "application",
    index: 2,
    question: {
      fr: "Les actions prévues sont-elles effectivement attribuées et délivrées aux personnes concernées au début de leur engagement, aux moments planifiés et lors de changements pertinents, avec un contenu adapté à leur fonction ?",
      en: "Are the planned activities actually assigned and delivered to the relevant people at the start of their engagement, at planned intervals, and following relevant changes, with content appropriate to their job function?",
    },
    helpText: {
      fr: "Les actions doivent être réellement exécutées, et non seulement prévues dans un document.\n\nLes changements pertinents peuvent comprendre :\n\n- une nouvelle politique ou procédure ;\n- un changement de rôle ;\n- un nouveau système ;\n- une nouvelle menace ;\n- un incident ou une faiblesse observée ;\n- une modification légale ou réglementaire pertinente.",
      en: "The activities should actually be delivered rather than merely described in a document.\n\nRelevant changes may include:\n\n- a new policy or procedure;\n- a role change;\n- a new system;\n- an emerging threat;\n- an incident or observed weakness;\n- a relevant legal or regulatory change.",
    },
    evidenceHints: {
      fr: [
        "affectations de formation",
        "feuilles de présence",
        "rapports de complétion",
        "certificats",
        "communications de sensibilisation",
        "accusés de réception de mises à jour",
        "rappels et escalades",
        "registre des exceptions",
        "exemple de mise à jour après un changement",
      ],
      en: [
        "training assignments",
        "attendance records",
        "completion reports",
        "certificates",
        "awareness communications",
        "acknowledgements of updates",
        "reminders and escalation records",
        "exception register",
        "example of an update following a change",
      ],
    },
    responseOptions: awarenessTrainingAnswerValues,
    gapCodes: AWARENESS_TRAINING_GAP_CODES.p6_3_002,
  },
  {
    id: "p6_3_003",
    category: "mandatory",
    type: "proof_traceability",
    index: 3,
    question: {
      fr: "Votre organisation conserve-t-elle des preuves traçables de l’attribution et de la réalisation des actions, et utilise-t-elle des résultats appropriés pour vérifier la compréhension ou améliorer le programme ?",
      en: "Does your organization retain traceable evidence of assignment and completion, and use appropriate results to verify understanding or improve the program?",
    },
    helpText: {
      fr: "La preuve doit permettre d’identifier, selon le type d’activité :\n\n- la personne ou la population concernée ;\n- le contenu attribué ;\n- la version du contenu ;\n- la date d’attribution ;\n- la date de réalisation ;\n- le statut ;\n- les exceptions éventuelles ;\n- les résultats ou décisions d’amélioration.\n\nLa vérification peut être proportionnée et reposer sur un ou plusieurs moyens, par exemple :\n\n- quiz ;\n- entretien ;\n- mise en situation ;\n- simulation ;\n- retour utilisateur ;\n- tendance d’incidents ;\n- observation d’audit ;\n- revue des résultats.\n\nAucun de ces moyens n’est obligatoire individuellement.",
      en: "Evidence should identify, depending on the activity:\n\n- the person or population concerned;\n- the assigned content;\n- the content version;\n- the assignment date;\n- the completion date;\n- the status;\n- any exceptions;\n- results or improvement decisions.\n\nVerification may be proportionate and may use one or more methods, such as:\n\n- quizzes;\n- interviews;\n- practical scenarios;\n- simulations;\n- participant feedback;\n- incident trends;\n- audit observations;\n- results reviews.\n\nNo individual method is mandatory.",
    },
    evidenceHints: {
      fr: [
        "registre de formation",
        "historique des affectations",
        "rapport de complétion",
        "version des supports",
        "résultats de quiz ou exercices lorsqu’ils sont utilisés",
        "rapport de revue du programme",
        "actions d’amélioration",
        "registre des exceptions",
        "indicateurs de suivi",
      ],
      en: [
        "training register",
        "assignment history",
        "completion report",
        "training-content versions",
        "quiz or exercise results where used",
        "program review report",
        "improvement actions",
        "exception register",
        "monitoring indicators",
      ],
    },
    responseOptions: awarenessTrainingAnswerValues,
    gapCodes: AWARENESS_TRAINING_GAP_CODES.p6_3_003,
  },
  {
    id: "p6_3_004_role_based",
    category: "conditional_role_based",
    type: "conditional",
    index: 4,
    question: {
      fr: "Pour les rôles présentant des responsabilités ou des risques de sécurité particuliers, des formations complémentaires adaptées sont-elles définies, attribuées et actualisées ?",
      en: "For roles with specific information security responsibilities or risks, are appropriate additional training activities defined, assigned, and kept current?",
    },
    helpText: {
      fr: "La formation spécialisée complète la sensibilisation générale. Elle doit correspondre aux tâches, responsabilités, accès et risques réels du rôle.\n\nElle ne signifie pas que tous les rôles doivent recevoir une formation technique approfondie.",
      en: "Specialized training supplements general awareness. It should correspond to the role’s actual duties, responsibilities, access, and risks.\n\nIt does not mean that every role requires advanced technical training.",
    },
    evidenceHints: {
      fr: [
        "matrice rôle–risque–formation",
        "parcours spécialisés",
        "supports techniques ou métiers",
        "affectations et complétions",
        "critères de changement de rôle",
        "exemples de mise à jour",
        "résultats ou évaluations pertinentes",
      ],
      en: [
        "role-risk-training matrix",
        "specialized learning tracks",
        "technical or business-role materials",
        "assignments and completions",
        "role-change criteria",
        "examples of updates",
        "relevant results or assessments",
      ],
    },
    responseOptions: awarenessTrainingAnswerValues,
    conditionKey: "hasRolesRequiringSpecializedTraining",
    gapCodes: AWARENESS_TRAINING_GAP_CODES.p6_3_004_role_based,
  },
  {
    id: "p6_3_005_external",
    category: "conditional_external",
    type: "conditional",
    index: 5,
    question: {
      fr: "Les prestataires, intérimaires et autres parties externes pertinentes reçoivent-ils une sensibilisation ou une formation adaptée, ou une assurance équivalente, en fonction de leurs accès et responsabilités ?",
      en: "Do contractors, temporary workers, and other relevant external parties receive appropriate awareness or training, or equivalent assurance, based on their access and responsibilities?",
    },
    helpText: {
      fr: "L’organisation peut :\n\n- fournir directement sa formation ;\n- accepter une formation équivalente fournie par l’employeur ou le fournisseur ;\n- obtenir une attestation appropriée ;\n- imposer contractuellement des exigences de formation.\n\nLe niveau de preuve dépend du rôle, des accès et de la criticité.",
      en: "The organization may:\n\n- provide its own training;\n- accept equivalent training delivered by the employer or supplier;\n- obtain an appropriate attestation;\n- impose contractual training requirements.\n\nThe level of assurance depends on the role, access, and criticality.",
    },
    evidenceHints: {
      fr: [
        "liste des parties externes concernées",
        "affectations de formation",
        "rapports de complétion",
        "attestations du fournisseur",
        "clauses contractuelles",
        "matrice de couverture",
        "registre des exceptions",
        "preuve de renouvellement ou de mise à jour",
      ],
      en: [
        "list of relevant external parties",
        "training assignments",
        "completion reports",
        "supplier attestations",
        "contractual clauses",
        "coverage matrix",
        "exception register",
        "renewal or update evidence",
      ],
    },
    responseOptions: awarenessTrainingAnswerValues,
    conditionKey: "hasRelevantExternalParties",
    gapCodes: AWARENESS_TRAINING_GAP_CODES.p6_3_005_external,
  },
];

const questionMap = new Map(awarenessTrainingQuestions.map((question) => [question.id, question] as const));

export const awarenessTrainingQuestionById = (questionId: AwarenessTrainingQuestionId) => questionMap.get(questionId);

export function getAwarenessTrainingQuestion(questionId: string, locale: AssessmentLocale) {
  const question = questionMap.get(questionId as AwarenessTrainingQuestionId);
  if (!question) {
    throw new Error(`Unknown A.6.3 question id: ${questionId}`);
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

export function getAllAwarenessTrainingQuestions(locale: AssessmentLocale = "en") {
  return awarenessTrainingQuestions.map((question) => ({
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

export function isAwarenessTrainingQuestion(questionId: string): questionId is AwarenessTrainingQuestionId {
  return questionMap.has(questionId as AwarenessTrainingQuestionId);
}

export function resolveAwarenessTrainingQuestions(context: A63AssessmentContext = {}): A63QuestionResolution {
  const questionIds: AwarenessTrainingQuestionId[] = [...awarenessTrainingQuestionIds.mandatory];
  const hiddenQuestionIds: AwarenessTrainingQuestionId[] = [];
  const unresolvedConditions: A63ConditionKey[] = [];

  if (context.hasRolesRequiringSpecializedTraining === "yes") {
    questionIds.push(awarenessTrainingQuestionIds.conditionalRoleBased);
  } else if (context.hasRolesRequiringSpecializedTraining === "no") {
    hiddenQuestionIds.push(awarenessTrainingQuestionIds.conditionalRoleBased);
  } else {
    hiddenQuestionIds.push(awarenessTrainingQuestionIds.conditionalRoleBased);
    unresolvedConditions.push("hasRolesRequiringSpecializedTraining");
  }

  if (context.hasRelevantExternalParties === "yes") {
    questionIds.push(awarenessTrainingQuestionIds.conditionalExternal);
  } else if (context.hasRelevantExternalParties === "no") {
    hiddenQuestionIds.push(awarenessTrainingQuestionIds.conditionalExternal);
  } else {
    hiddenQuestionIds.push(awarenessTrainingQuestionIds.conditionalExternal);
    unresolvedConditions.push("hasRelevantExternalParties");
  }

  return {
    questionIds,
    unresolvedConditions,
    hiddenQuestionIds,
  };
}
