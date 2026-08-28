import { deriveAssessmentOutcome, type ScreeningAnswerValue } from "./outcomes.ts";
import {
  type A63AssessmentContext,
  type A63QuestionResolution,
  type AwarenessTrainingQuestionId,
  AWARENESS_TRAINING_GAP_CODES,
  awarenessTrainingQuestions,
  awarenessTrainingQuestionIds,
  resolveAwarenessTrainingQuestions,
  AWARENESS_TRAINING_PLAN_CODE,
} from "../../content/assessment/people/awareness-training.ts";

export type LocalizedText = {
  fr: string;
  en: string;
};

export type ClarificationRecord = {
  questionId: AwarenessTrainingQuestionId;
  question: LocalizedText;
  questionFr: string;
  questionEn: string;
};

export type AwarenessTrainingSubActionStatus = "none" | "active" | "resolved";

export type AwarenessTrainingSubActionDefinition = {
  actionCode: string;
  sourceQuestionId: AwarenessTrainingQuestionId;
  title: LocalizedText;
  partialGapCode: string;
  fullGapCode: string;
  partialGapTitle: LocalizedText;
  fullGapTitle: LocalizedText;
  partialGapDescription: LocalizedText;
  fullGapDescription: LocalizedText;
  recommendedActions: LocalizedText;
  partialPriority: "medium" | "high";
  fullPriority: "medium" | "high";
  owners: string[];
  closureEvidence: LocalizedText;
  closureCriteria: LocalizedText;
};

export type AwarenessTrainingResponseInput = {
  questionId: AwarenessTrainingQuestionId;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  justification?: string;
  evidenceStatus?: Parameters<typeof deriveAssessmentOutcome>[0]["evidenceStatus"];
};

export type AwarenessTrainingRemediationAction = AwarenessTrainingSubActionDefinition & {
  status: AwarenessTrainingSubActionStatus;
  gapType: "partial" | "full";
  partialGapCode: string;
  fullGapCode: string;
};

export type DeriveAwarenessTrainingRemediationPlanResult = {
  planCode: typeof AWARENESS_TRAINING_PLAN_CODE;
  title: LocalizedText;
  activeActions: ReadonlyArray<AwarenessTrainingRemediationAction>;
  clarifications: ReadonlyArray<ClarificationRecord>;
  applicabilityReviews: ReadonlyArray<AwarenessTrainingQuestionId>;
  unresolvedConditions: A63QuestionResolution["unresolvedConditions"];
};

export const AWARENESS_TRAINING_ACTIONS: Record<string, AwarenessTrainingSubActionDefinition> = {
  "P6.3-A01": {
    actionCode: "P6.3-A01",
    sourceQuestionId: "p6_3_001",
    title: {
      fr: "Programme de sensibilisation et de formation",
      en: "Awareness and training program",
    },
    partialGapCode: AWARENESS_TRAINING_GAP_CODES.p6_3_001.partial,
    fullGapCode: AWARENESS_TRAINING_GAP_CODES.p6_3_001.full,
    partialGapTitle: {
      fr: "Programme de sensibilisation et de formation incomplet",
      en: "Incomplete awareness and training program",
    },
    fullGapTitle: {
      fr: "Absence de programme structuré de sensibilisation, d’éducation et de formation",
      en: "No structured information security awareness, education and training program",
    },
    partialGapDescription: {
      fr: "Un programme existe, mais son périmètre, ses objectifs, ses responsables, ses populations, ses contenus, ses événements déclencheurs ou ses modalités de suivi ne sont pas entièrement définis.",
      en: "A program exists, but its scope, objectives, owners, audiences, content, trigger events, or monitoring arrangements are not fully defined.",
    },
    fullGapDescription: {
      fr: "L’organisation ne dispose pas d’un cadre documenté définissant qui doit recevoir quelles actions, pourquoi, quand, sous quelle responsabilité et selon quelles règles de mise à jour.",
      en: "The organization has no documented framework defining who should receive which activities, why, when, under whose responsibility, or how the program is kept current.",
    },
    recommendedActions: {
      fr: "Préciser les populations couvertes; analyser leurs responsabilités et risques; désigner un propriétaire et un remplaçant; définir les objectifs du programme; définir un socle général de sensibilisation; identifier les besoins spécialisés; établir une matrice population–rôle–contenu; documenter les méthodes de diffusion; définir une approche périodique et événementielle; définir les règles de retard, d’escalade et d’exception; faire approuver et versionner le programme.",
      en: "Clarify the covered populations; analyze responsibilities and risks; designate owner and backup; define program objectives; define a general awareness baseline; identify specialized needs; establish a population-role-content matrix; document delivery methods; define periodic and event-driven coverage; define overdue, escalation, and exception rules; approve and version the program.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Information Security", "GRC", "HR", "Learning and Development", "Managers"],
    closureEvidence: {
      fr: "Un programme approuvé, versionné et publiquement diffusé, couvrant les responsables, populations et modalités de suivi.",
      en: "An approved and versioned program with clear owners, populations, and monitoring methods.",
    },
    closureCriteria: {
      fr: "Les personnes concernées reçoivent les activités prévues aux moments définis et les changements pertinents déclenchent une mise à jour documentée.",
      en: "Relevant people receive required activities at defined times, and relevant changes trigger documented updates.",
    },
  },
  "P6.3-A02": {
    actionCode: "P6.3-A02",
    sourceQuestionId: "p6_3_002",
    title: {
      fr: "Délivrance et attribution",
      en: "Assignment and delivery",
    },
    partialGapCode: AWARENESS_TRAINING_GAP_CODES.p6_3_002.partial,
    fullGapCode: AWARENESS_TRAINING_GAP_CODES.p6_3_002.full,
    partialGapTitle: {
      fr: "Attribution et livraisons incomplètes ou partiellement réalisées",
      en: "Incomplete assignment and delivery",
    },
    fullGapTitle: {
      fr: "Absence d’actions attribuées/réalisées",
      en: "No required awareness, education and training actions assigned or delivered",
    },
    partialGapDescription: {
      fr: "Certaines actions existent dans des documents, mais les activités ne sont pas toutes attribuées, réalisées ou adaptées au contexte des rôles.",
      en: "Some actions exist in a document, but not all activities are assigned, delivered, or role-adapted.",
    },
    fullGapDescription: {
      fr: "L’organisation ne met pas en œuvre un programme d’attribution et de réalisation opérationnel basé sur les personnes concernées et les rôles.",
      en: "The organization does not operationally assign and deliver required awareness/training activities.",
    },
    recommendedActions: {
      fr: "Établir la population de référence; identifier les personnes ou groupes non couverts; attribuer les activités; définir un délai adapté pour les nouveaux arrivants; établir les modalités de renouvellement; remédier aux activités en retard; adapter le contenu aux fonctions concernées; mettre en place rappels et escalades; enregistrer les exceptions.",
      en: "Establish the target population, identify uncovered people/groups, assign required activities, define a completion window for new joiners, establish refresh arrangements, remediate overdue activities, adapt content, and record exceptions.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Information Security", "HR", "Managers"],
    closureEvidence: {
      fr: "Registres d’attribution et de réalisation montrant la couverture du périmètre avec exceptions contrôlées.",
      en: "Assignment and completion records showing full coverage with controlled exceptions.",
    },
    closureCriteria: {
      fr: "Les personnes concernées reçoivent effectivement les activités aux moments définis, les exceptions sont contrôlées et les changements pertinents déclenchent une mise à jour.",
      en: "Relevant people receive required activities at defined times, exceptions are controlled, and relevant changes trigger updates.",
    },
  },
  "P6.3-A03": {
    actionCode: "P6.3-A03",
    sourceQuestionId: "p6_3_003",
    title: {
      fr: "Preuve et évaluation de l’efficacité",
      en: "Evidence and effectiveness monitoring",
    },
    partialGapCode: AWARENESS_TRAINING_GAP_CODES.p6_3_003.partial,
    fullGapCode: AWARENESS_TRAINING_GAP_CODES.p6_3_003.full,
    partialGapTitle: {
      fr: "Traçabilité ou évaluation incomplète",
      en: "Incomplete traceability or outcome monitoring",
    },
    fullGapTitle: {
      fr: "Absence de preuve démontrable et de suivi des résultats",
      en: "No demonstrable evidence or outcome monitoring",
    },
    partialGapDescription: {
      fr: "Certaines preuves existent, mais elles ne permettent pas d’identifier toutes les dimensions clés (personne, contenu, version, dates, exceptions).",
      en: "Some evidence exists but does not fully identify key dimensions such as people, content, version, dates, or exceptions.",
    },
    fullGapDescription: {
      fr: "L’organisation ne peut pas démontrer ce qui a été attribué ou réalisé et ne peut pas expliquer l’évaluation de l’efficacité.",
      en: "The organization cannot demonstrate what was assigned or completed and cannot show how effectiveness is evaluated.",
    },
    recommendedActions: {
      fr: "Définir les métadonnées minimales, créer un registre, enregistrer personne/population, activité, version, dates et statut, compléter les données manquantes, centraliser les preuves, sélectionner une méthode proportionnée d’évaluation, lier résultats et actions d’amélioration.",
      en: "Define minimum metadata, create a register, record people, activity, version, dates, and status, complete missing data, centralize evidence, choose a proportionate evaluation method, and link outcomes to improvement actions.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Program Owner", "Information Security", "HR-L&D", "GRC", "Privacy"],
    closureEvidence: {
      fr: "Preuves complètes d’attribution, réalisation, dates et décisions d’amélioration par activité.",
      en: "Complete records of assignment, completion, dates, and improvement decisions.",
    },
    closureCriteria: {
      fr: "L’organisation peut démontrer l’attribution et la réalisation des activités et montrer comment les résultats sont utilisés pour améliorer le programme.",
      en: "The organization can demonstrate assignment and completion and show how results are used to improve the program.",
    },
  },
  "P6.3-A04": {
    actionCode: "P6.3-A04",
    sourceQuestionId: "p6_3_004_role_based",
    title: {
      fr: "Formation spécialisée par rôle",
      en: "Role-based specialized training",
    },
    partialGapCode: AWARENESS_TRAINING_GAP_CODES.p6_3_004_role_based.partial,
    fullGapCode: AWARENESS_TRAINING_GAP_CODES.p6_3_004_role_based.full,
    partialGapTitle: {
      fr: "Couverture partielle de la formation spécialisée",
      en: "Incomplete coverage of specialized training needs",
    },
    fullGapTitle: {
      fr: "Absence de formation adaptée aux fonctions sensibles",
      en: "No specialized training tailored to sensitive functions",
    },
    partialGapDescription: {
      fr: "Certaines fonctions ont une formation spécialisée, mais tous les rôles à risque ne sont pas couverts ou contenus/mise à jour sont insuffisants.",
      en: "Some functions have specialized training, but not all relevant high-risk roles are identified or content is up-to-date/consistently assigned.",
    },
    fullGapDescription: {
      fr: "Les fonctions sensibles ne reçoivent qu’une sensibilisation générale sans apprentissage adapté à leurs tâches et risques.",
      en: "Sensitive/specialized functions receive only general awareness without role-appropriate learning.",
    },
    recommendedActions: {
      fr: "Identifier les fonctions nécessitant une formation spécialisée; cartographier leurs tâches, accès et risques; définir objectifs par rôle; sélectionner/adapter contenus; actualiser contenus obsolètes; définir déclencheurs liés aux changements de rôle/système; attribuer correctement les activités; conserver les preuves séparément.",
      en: "Identify roles needing specialized training; map duties, access, and risks; define role-specific objectives; select/adapt content; refresh stale content; define role/system change triggers; consistently assign activities; retain evidence separately.",
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["Information Security", "Role Owners", "HR-L&D", "Technical Management"],
    closureEvidence: {
      fr: "Chaque rôle sensible dispose de contenus adaptés, attribués, actualisés et démontrables.",
      en: "Each relevant role has appropriate, assigned, current, and demonstrable training.",
    },
    closureCriteria: {
      fr: "Chaque rôle nécessitant une formation adaptée est couvert avec des activités assignées, actualisées et évaluées.",
      en: "Each role requiring specialized training is covered with assigned, current, and reviewed activities.",
    },
  },
  "P6.3-A05": {
    actionCode: "P6.3-A05",
    sourceQuestionId: "p6_3_005_external",
    title: {
      fr: "Parties externes",
      en: "External parties",
    },
    partialGapCode: AWARENESS_TRAINING_GAP_CODES.p6_3_005_external.partial,
    fullGapCode: AWARENESS_TRAINING_GAP_CODES.p6_3_005_external.full,
    partialGapTitle: {
      fr: "Couverture incomplète des parties externes pertinentes",
      en: "Incomplete coverage of relevant external parties",
    },
    fullGapTitle: {
      fr: "Parties externes pertinentes non couvertes par le programme",
      en: "Relevant external parties are not covered by the program",
    },
    partialGapDescription: {
      fr: "Certaines parties externes sont couvertes, mais pas toutes selon l’accès ou la criticité.",
      en: "Some external parties are covered, but some categories, suppliers, or access levels lack appropriate training/assurance.",
    },
    fullGapDescription: {
      fr: "Des parties externes peuvent accéder au périmètre sans couverture adaptée ni preuve d’assurance équivalente.",
      en: "Relevant external parties may access scope without appropriate training or traceable equivalent assurance.",
    },
    recommendedActions: {
      fr: "Inventorier les parties externes concernées; classifier accès et risques; définir niveau d’assurance; choisir formation directe ou équivalente; définir contenus minimaux; compléter affectations/attestations; intégrer exigences aux contrats; conserver les preuves; gérer renouvellements et changements d’accès.",
      en: "Inventory relevant external parties, classify access and risks, define assurance level, choose training or equivalent assurance, complete missing assignments/attestations, include requirements in contracts, retain evidence, monitor renewals and access changes.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Information Security", "Procurement", "Supplier Management", "HR", "Contract Owner"],
    closureEvidence: {
      fr: "Liste tenue des parties externes et preuves de sensibilisation/formation ou d’assurance équivalente.",
      en: "Maintained list of relevant external parties and training or equivalent-assurance evidence.",
    },
    closureCriteria: {
      fr: "Toutes les parties externes pertinentes ont une couverture adaptée, traceable et proportionnée.",
      en: "All relevant external parties have appropriate, traceable, and proportionate coverage.",
    },
  },
};

const actionByQuestionId = Object.values(AWARENESS_TRAINING_ACTIONS).reduce(
  (acc, action) => {
    acc[action.sourceQuestionId] = action;
    return acc;
  },
  {} as Record<AwarenessTrainingQuestionId, AwarenessTrainingSubActionDefinition>,
);

const questionToClarificationText: Record<AwarenessTrainingQuestionId, { fr: string; en: string }> = {
  "p6_3_001": {
    fr: "Comparer le programme documenté aux affectations et réalisations récentes, puis vérifier comment sont gérés nouveaux arrivants, retards et changements.",
    en: "Compare the documented program with recent assignments and completions, and verify how new joiners, overdue actions, and changes are managed.",
  },
  "p6_3_002": {
    fr: "Vérifier le référentiel des affectations et la preuve de diffusion lors des événements de changement définis.",
    en: "Verify the assignment registry and evidence of training delivery during defined change events.",
  },
  "p6_3_003": {
    fr: "Identifier le système de référence utilisé pour les traces (personnes, contenus, versions, exceptions, résultats), puis vérifier qui l’examine et avec quelle fréquence.",
    en: "Identify the system used as evidence of record (people, content, versions, exceptions, results), then determine who reviews it and how often.",
  },
  "p6_3_004_role_based": {
    fr: "Identifier les fonctions présentant des responsabilités ou des risques de sécurité spécifiques, puis vérifier quels contenus sont attribués et mis à jour.",
    en: "Identify functions with specific security responsibilities or risks and verify which additional training content is assigned and kept current.",
  },
  "p6_3_005_external": {
    fr: "Demander aux achats, aux responsables fournisseurs ou RH quelles parties externes ont accès au périmètre et quelle assurance de sensibilisation/formation est conservée.",
    en: "Ask Procurement, supplier owners, or HR which external parties have scope access and what awareness/training assurance is retained.",
  },
};

const actionByCodeInternal = Object.values(AWARENESS_TRAINING_ACTIONS).reduce(
  (acc, action) => {
    acc[action.actionCode] = action;
    return acc;
  },
  {} as Record<string, AwarenessTrainingSubActionDefinition>,
);

function getQuestionText(questionId: AwarenessTrainingQuestionId) {
  const question = awarenessTrainingQuestions.find((item) => item.id === questionId);
  return question ? { questionFr: question.question.fr, questionEn: question.question.en } : null;
}

function resolveLatestResponses<T extends { questionId: AwarenessTrainingQuestionId; answer: ScreeningAnswerValue }>(
  responses: readonly T[],
) {
  const latest = new Map<AwarenessTrainingQuestionId, T>();
  for (const response of responses) {
    latest.set(response.questionId, response);
  }
  return latest;
}

function uniqueAppend<T>(values: T[], value: T) {
  if (values.includes(value)) return;
  values.push(value);
}

export function deriveAwarenessTrainingRemediationPlan(
  responses: ReadonlyArray<AwarenessTrainingResponseInput>,
  context?: A63AssessmentContext,
): DeriveAwarenessTrainingRemediationPlanResult {
  const resolved = resolveAwarenessTrainingQuestions(context);
  const visibleSet = new Set(resolved.questionIds);
  const latest = resolveLatestResponses(responses);
  const activeByCode = new Map<string, AwarenessTrainingRemediationAction>();
  const clarifications: ClarificationRecord[] = [];
  const applicabilityReviews: AwarenessTrainingQuestionId[] = [];

  const unresolvedById = new Set<AwarenessTrainingQuestionId>();

  for (const condition of resolved.unresolvedConditions) {
    const questionId =
      condition === "hasRolesRequiringSpecializedTraining"
        ? awarenessTrainingQuestionIds.conditionalRoleBased
        : awarenessTrainingQuestionIds.conditionalExternal;
    const questionText = getQuestionText(questionId);
    if (!questionText) continue;
    const unresolved: ClarificationRecord = {
      questionId,
      question: questionToClarificationText[questionId],
      questionFr: questionText.questionFr,
      questionEn: questionText.questionEn,
    };
    clarifications.push(unresolved);
    unresolvedById.add(questionId);
  }

  for (const response of latest.values()) {
    if (!visibleSet.has(response.questionId)) {
      continue;
    }

    const outcome = deriveAssessmentOutcome({
      questionId: response.questionId,
      answer: response.answer,
      hasEvidence: Boolean(response.hasEvidence),
      evidenceStatus: response.evidenceStatus,
      justification: response.justification,
    });

    if (!outcome.isValid) {
      continue;
    }

    const questionText = getQuestionText(response.questionId);
    if (!questionText) continue;

    if (outcome.reviewState === "applicability_review_required") {
      uniqueAppend(applicabilityReviews, response.questionId);
      continue;
    }

    if (outcome.reviewState === "clarification_required" && !unresolvedById.has(response.questionId)) {
      const clarification: ClarificationRecord = {
        questionId: response.questionId,
        question: questionToClarificationText[response.questionId],
        questionFr: questionText.questionFr,
        questionEn: questionText.questionEn,
      };
      clarifications.push(clarification);
      continue;
    }

    if (outcome.createsGapAction === "none") {
      continue;
    }

    const action = actionByQuestionId[response.questionId];
    if (!action) continue;

    const gapType = outcome.createsGapAction === "partial" ? "partial" : "full";
    const existing = activeByCode.get(action.actionCode);
    if (!existing || existing.gapType !== "full") {
      activeByCode.set(action.actionCode, {
        ...action,
        status: "active",
        gapType,
        partialGapCode: action.partialGapCode,
        fullGapCode: action.fullGapCode,
      });
    } else {
      existing.gapType = gapType;
      existing.status = "active";
    }
  }

  return {
    planCode: AWARENESS_TRAINING_PLAN_CODE,
    title: {
      fr: "Établir et maintenir un programme de sensibilisation, d’éducation et de formation à la sécurité de l’information adapté, continu et démontrable",
      en: "Establish and maintain an appropriate, ongoing, and demonstrable information security awareness, education and training program",
    },
    activeActions: [...activeByCode.values()],
    clarifications,
    applicabilityReviews,
    unresolvedConditions: resolved.unresolvedConditions,
  };
}

export const actionByCode = actionByCodeInternal;
