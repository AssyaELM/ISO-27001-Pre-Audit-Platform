import type { ScreeningAnswerValue } from "./outcomes.ts";
import {
  type A65AssessmentContext,
  type A65QuestionResolution,
  type PostEmploymentResponsibilitiesQuestionId,
  POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES,
  postEmploymentResponsibilitiesQuestions,
  POST_EMPLOYMENT_RESPONSIBILITIES_PLAN_CODE,
  postEmploymentResponsibilitiesQuestionIds,
  resolvePostEmploymentResponsibilitiesQuestions,
  type PostEmploymentConditionKey,
} from "../../content/assessment/people/post-employment-responsibilities.ts";
import { deriveAssessmentOutcome } from "./outcomes.ts";

export type LocalizedText = {
  fr: string;
  en: string;
};

export type PostEmploymentResponsibilitiesRemediationOwnership =
  | "HR"
  | "IT-IAM"
  | "Records Management"
  | "Privacy"
  | "Management"
  | "Information Security"
  | "Legal"
  | "Procurement"
  | "Contract Owner"
  | "Role Owner";

export type PostEmploymentResponsibilitiesActionStatus = "none" | "active" | "resolved";

export type PostEmploymentResponsibilitiesSubActionDefinition = {
  actionCode: string;
  sourceQuestionId: PostEmploymentResponsibilitiesQuestionId;
  title: LocalizedText;
  partialGapTitle: LocalizedText;
  partialGapDescription: LocalizedText;
  fullGapTitle: LocalizedText;
  fullGapDescription: LocalizedText;
  recommendedActions: LocalizedText;
  partialPriority: "low" | "medium" | "high";
  fullPriority: "low" | "medium" | "high";
  owners: ReadonlyArray<PostEmploymentResponsibilitiesRemediationOwnership>;
  closureEvidence: LocalizedText;
  closureCriteria: LocalizedText;
  partialGapCode: string;
  fullGapCode: string;
};

export type PostEmploymentResponsibilitiesRemediationAction = PostEmploymentResponsibilitiesSubActionDefinition & {
  status: PostEmploymentResponsibilitiesActionStatus;
  gapType: "partial" | "full";
  gapCode: string;
};

export type PostEmploymentResponsibilitiesResponseInput = {
  questionId: PostEmploymentResponsibilitiesQuestionId;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  justification?: string;
  evidenceStatus?: Parameters<typeof deriveAssessmentOutcome>[0]["evidenceStatus"];
};

export type ClarificationRecord = {
  questionId: PostEmploymentResponsibilitiesQuestionId;
  question: LocalizedText;
  questionFr: string;
  questionEn: string;
};

export type DerivePostEmploymentResponsibilitiesRemediationPlanResult = {
  planCode: typeof POST_EMPLOYMENT_RESPONSIBILITIES_PLAN_CODE;
  title: LocalizedText;
  activeActions: ReadonlyArray<PostEmploymentResponsibilitiesRemediationAction>;
  clarifications: ReadonlyArray<ClarificationRecord>;
  applicabilityReviews: ReadonlyArray<PostEmploymentResponsibilitiesQuestionId>;
  unresolvedConditions: A65QuestionResolution["unresolvedConditions"];
};

export const POST_EMPLOYMENT_RESPONSIBILITIES_ACTIONS: Record<string, PostEmploymentResponsibilitiesSubActionDefinition> = {
  "P6.5-A01": {
    actionCode: "P6.5-A01",
    sourceQuestionId: "p6_5_001",
    title: {
      fr: "Définir les obligations persistantes",
      en: "Define continuing obligations",
    },
    partialGapTitle: {
      fr: "Cadre des obligations persistantes incomplet",
      en: "Incomplete framework for continuing obligations",
    },
    partialGapDescription: {
      fr: "L'organisation a des obligations post-emploi, mais le périmètre des responsabilités, les destinataires et les justifications juridiques ne sont pas entièrement définis ou actualisés.",
      en: "The organization has post-employment obligations, but scope, owners, and legal grounding of responsibilities are not fully defined or updated.",
    },
    fullGapTitle: {
      fr: "Absence d'obligations persistantes définies",
      en: "No defined continuing obligations",
    },
    fullGapDescription: {
      fr: "L’organisation ne documente pas les obligations de sécurité qui continuent après la fin de l’engagement.",
      en: "The organization does not document security obligations that continue after the engagement ends.",
    },
    recommendedActions: {
      fr: "Inventorier les obligations applicables selon rôle, accès et relation; définir ce qui continue, pour combien de temps et selon quel cadre juridique; valider les responsabilités de communication et de conservation; versionner la matrice rôle–obligation.",
      en: "Inventory applicable obligations by role, access, and relationship; define what continues and for how long under what legal framework; validate communication and recordkeeping responsibilities; version a role–obligation matrix.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["HR", "Information Security", "Legal", "Privacy", "Management"],
    closureEvidence: {
      fr: "Un référentiel validé documentant les obligations persistantes, leur portée, leurs durées et leurs bases légales.",
      en: "A validated register documenting continuing obligations, scope, durations, and legal bases.",
    },
    closureCriteria: {
      fr: "L’organisation peut démontrer que les obligations persistantes sont définies, cohérentes et communiquées.",
      en: "The organization can demonstrate that continuing obligations are defined, coherent, and communicated.",
    },
    partialGapCode: POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_001.partial,
    fullGapCode: POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_001.full,
  },
  "P6.5-A02": {
    actionCode: "P6.5-A02",
    sourceQuestionId: "p6_5_002",
    title: {
      fr: "Orchestrer le processus de départ",
      en: "Orchestrate termination process",
    },
    partialGapTitle: {
      fr: "Processus de départ partiellement coordonné",
      en: "Partially coordinated termination process",
    },
    partialGapDescription: {
      fr: "Le processus couvre certains cas, mais le déclenchement, la coordination, les responsables ou les preuves de clôture restent incomplets.",
      en: "The process covers some cases, but triggering, coordination, ownership, or closure evidence is incomplete.",
    },
    fullGapTitle: {
      fr: "Absence de processus coordonné de départ",
      en: "No coordinated termination process",
    },
    fullGapDescription: {
      fr: "L’organisation ne dispose pas d'un mécanisme coordonné liant départ, obligations, accès et restitution.",
      en: "The organization does not have a coordinated mechanism linking termination, obligations, access and return.",
    },
    recommendedActions: {
      fr: "Formaliser le workflow avec déclenchement RH, responsabilités métiers, sécurité et IT; définir les scénarios de départ planifié/urgent; documenter transfert, suppression des accès, restitution et clôture.",
      en: "Formalize a workflow with HR, business, security, and IT responsibilities; define planned/urgent departure scenarios; document transfer, access revocation, return, and closure.",
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["HR", "IT-IAM", "Management", "Information Security"],
    closureEvidence: {
      fr: "Une preuve de processus couverte par les rôles, scénarios et confirmations de clôture pour des départs réels ou récents.",
      en: "Evidence of a process covering roles, scenarios, and closure confirmations for real or recent departures.",
    },
    closureCriteria: {
      fr: "Chaque départ actif et critique suit un parcours coordonné avec preuves de clôture applicables.",
      en: "Each active or critical departure follows a coordinated path with applicable closure evidence.",
    },
    partialGapCode: POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_002.partial,
    fullGapCode: POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_002.full,
  },
  "P6.5-A03": {
    actionCode: "P6.5-A03",
    sourceQuestionId: "p6_5_003",
    title: {
      fr: "Traçabilité de l'exécution",
      en: "Execution traceability",
    },
    partialGapTitle: {
      fr: "Preuve d’exécution incomplète",
      en: "Incomplete execution evidence",
    },
    partialGapDescription: {
      fr: "Certaines sorties sont prouvées, mais sans métadonnées clés ni liaison claire entre personne et actions.",
      en: "Some departures are evidenced, but lack key metadata or clear linkage to person and actions.",
    },
    fullGapTitle: {
      fr: "Absence de preuve d'exécution des actions de départ",
      en: "No evidence of security actions performed during departure",
    },
    fullGapDescription: {
      fr: "L’organisation ne conserve pas de preuve traçable pour démontrer les actions de sécurité réalisées.",
      en: "The organization does not retain traceable proof that required security actions were performed.",
    },
    recommendedActions: {
      fr: "Définir les métadonnées minimales (personne, dates, propriétaire, statut, exceptions), centraliser ou référencer les preuves et préserver la confidentialité des informations sensibles.",
      en: "Define minimum metadata (person, dates, owner, status, exceptions), centralize or reference evidence and preserve confidentiality of sensitive information.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Records Management", "Information Security", "IT-IAM", "HR", "Legal", "Privacy"],
    closureEvidence: {
      fr: "Un échantillon complet de départs montre chaîne d'actions, statuts, responsabilités et exceptions.",
      en: "A complete sample of departures shows action chain, statuses, owners, and exceptions.",
    },
    closureCriteria: {
      fr: "Un départ récent peut être retracé de notification à clôture avec preuves de statuts et exceptions.",
      en: "A recent departure can be traced from notification through closure with status and exception evidence.",
    },
    partialGapCode: POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_003.partial,
    fullGapCode: POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_003.full,
  },
  "P6.5-A04": {
    actionCode: "P6.5-A04",
    sourceQuestionId: "p6_5_004_role_change",
    title: {
      fr: "Gérer les changements de fonction",
      en: "Handle role changes",
    },
    partialGapTitle: {
      fr: "Revue des changements de fonction incomplète",
      en: "Incomplete handling of role changes",
    },
    partialGapDescription: {
      fr: "Les changements sont parfois traités, mais sans révision systématique des anciennes obligations et des anciens droits.",
      en: "Changes are sometimes handled, but without systematic review of previous obligations and obsolete rights.",
    },
    fullGapTitle: {
      fr: "Changements de fonction non encadrés",
      en: "Role changes are not governed",
    },
    fullGapDescription: {
      fr: "L’organisation ne dispose d’aucun processus pour réexaminer les responsabilités et droits lors d’un changement de fonction.",
      en: "The organization has no process for reviewing responsibilities and access when roles change.",
    },
    recommendedActions: {
      fr: "Définir les changements déclencheurs; attribuer les responsabilités RH/manager/IT; enregistrer la date de changement; examiner anciens accès; retirer droits inutiles; approuver nouveaux droits; communiquer nouvelles obligations.",
      en: "Define triggering changes; assign HR/manager/IT responsibilities; record change date; review prior access; remove obsolete rights; approve new rights; communicate new obligations.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["HR", "Management", "IT-IAM", "Information Security", "Role Owner"],
    closureEvidence: {
      fr: "Un changement de fonction récent montre révision des obligations et droits, ainsi que communication adéquate.",
      en: "A recent role change shows reviewed responsibilities and rights and adequate communication.",
    },
    closureCriteria: {
      fr: "Un changement de fonction démontre suppression des obligations ou droits devenus inutiles, approbation des nouveaux droits et communication des nouvelles obligations.",
      en: "A role change demonstrates removal of unnecessary responsibilities or rights, approval of new rights, and communication of new duties.",
    },
    partialGapCode: POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_004_role_change.partial,
    fullGapCode: POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_004_role_change.full,
  },
  "P6.5-A05": {
    actionCode: "P6.5-A05",
    sourceQuestionId: "p6_5_005_external",
    title: {
      fr: "Couverture externe et fin d’engagement",
      en: "External engagement and termination coverage",
    },
    partialGapTitle: {
      fr: "Couverture incomplète des départs externes",
      en: "Incomplete coverage of external-party exits",
    },
    partialGapDescription: {
      fr: "Le déclenchement est parfois correct, mais certaines catégories, sous-traitants, accès ou obligations ne sont pas gérés de manière cohérente.",
      en: "Triggering occurs in some cases, but some categories, subcontractors, access or duties are not handled consistently.",
    },
    fullGapTitle: {
      fr: "Départs externes non encadrés",
      en: "External-party departures are not governed",
    },
    fullGapDescription: {
      fr: "L’organisation ne dispose pas de processus pour déclencher les actions de sécurité requises quand une relation externe se termine ou change.",
      en: "The organization does not have a process for triggering required security actions when an external engagement ends or changes.",
    },
    recommendedActions: {
      fr: "Inventorier les catégories de parties externes, définir les événements déclencheurs, relier dates contractuelles aux accès et actifs, notifier IT et sécurité, retirer ou modifier les accès et conserver preuve de clôture.",
      en: "Inventory external-party categories, define triggering events, link contract dates to access and assets, notify IT and security, remove/modify access, and retain closure evidence.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Procurement", "Contract Owner", "IT-IAM", "Information Security"],
    closureEvidence: {
      fr: "Échantillons de fins de mission externes tracés de notification à clôture des actions sécurité.",
      en: "Samples of external engagement ends traced from notification to security action closure.",
    },
    closureCriteria: {
      fr: "Les fins ou modifications externes déclenchent un workflow approprié documenté et proportionné aux risques.",
      en: "External engagement ends or changes trigger a documented, risk-proportionate workflow.",
    },
    partialGapCode: POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_005_external.partial,
    fullGapCode: POST_EMPLOYMENT_RESPONSIBILITIES_GAP_CODES.p6_5_005_external.full,
  },
};

const actionByQuestionId = Object.values(POST_EMPLOYMENT_RESPONSIBILITIES_ACTIONS).reduce(
  (acc, action) => {
    acc[action.sourceQuestionId] = action;
    return acc;
  },
  {} as Record<PostEmploymentResponsibilitiesQuestionId, PostEmploymentResponsibilitiesSubActionDefinition>,
);

const questionToClarificationText: Record<PostEmploymentResponsibilitiesQuestionId, { fr: string; en: string }> = {
  "p6_5_001": {
    fr: "Identifier le périmètre juridique et contractuel des obligations de fin d’engagement, y compris ce qui continue réellement selon le rôle et les informations.",
    en: "Identify legal and contractual scope of post-employment obligations, including what truly continues by role and information.",
  },
  "p6_5_002": {
    fr: "Décrire le workflow réel d’offboarding, ses responsables et la preuve produite, puis vérifier les cas de départ planifiés et urgents.",
    en: "Describe the real offboarding workflow, its owners and produced evidence, then verify planned and urgent departures.",
  },
  "p6_5_003": {
    fr: "Trouver le système où est conservée la preuve de clôture des départs, ses métadonnées et ses éventuelles exceptions.",
    en: "Find the system where departure closure evidence is kept, its metadata, and any exceptions.",
  },
  "p6_5_004_role_change": {
    fr: "Vérifier la gestion réelle des changements de rôle, les dossiers d’accès avant/après et la preuve de communication des nouvelles obligations.",
    en: "Check actual role-change handling, before/after access files, and proof that new duties were communicated.",
  },
  "p6_5_005_external": {
    fr: "Vérifier avec achats et responsables fournisseurs comment une fin ou modification d’engagement externe est communiquée aux équipes IT/sécurité et documentée.",
    en: "Check with Procurement and contract owners how an external engagement end or change is communicated to IT/security teams and documented.",
  },
};

const questionById = new Map(
  postEmploymentResponsibilitiesQuestions.map((question) => [question.id, question]),
);

function resolveLatestResponses<T extends {
  questionId: PostEmploymentResponsibilitiesQuestionId;
  answer: ScreeningAnswerValue;
}>(responses: readonly T[]) {
  const latest = new Map<PostEmploymentResponsibilitiesQuestionId, T>();
  for (const response of responses) {
    latest.set(response.questionId, response);
  }
  return latest;
}

function getQuestionText(questionId: PostEmploymentResponsibilitiesQuestionId) {
  const question = questionById.get(questionId);
  if (!question) return null;
  return { questionFr: question.question.fr, questionEn: question.question.en };
}

function getConditionQuestionId(condition: PostEmploymentConditionKey) {
  return condition === "hasEmploymentRoleChanges"
    ? postEmploymentResponsibilitiesQuestionIds.conditionalRoleChange
    : postEmploymentResponsibilitiesQuestionIds.conditionalExternal;
}

function questionExists(id: PostEmploymentResponsibilitiesQuestionId) {
  return questionById.has(id);
}

export function derivePostEmploymentResponsibilitiesRemediationPlan(
  responses: ReadonlyArray<PostEmploymentResponsibilitiesResponseInput>,
  context: A65AssessmentContext = {},
): DerivePostEmploymentResponsibilitiesRemediationPlanResult {
  const resolved = resolvePostEmploymentResponsibilitiesQuestions(context);
  const visibleSet = new Set<PostEmploymentResponsibilitiesQuestionId>(resolved.questionIds);
  const latest = resolveLatestResponses(responses);
  const activeByCode = new Map<string, PostEmploymentResponsibilitiesRemediationAction>();
  const clarifications: ClarificationRecord[] = [];
  const applicabilityReviews: PostEmploymentResponsibilitiesQuestionId[] = [];
  const unresolvedById = new Set<PostEmploymentResponsibilitiesQuestionId>();

  for (const unresolvedCondition of resolved.unresolvedConditions) {
    const questionId = getConditionQuestionId(unresolvedCondition);
    const questionText = getQuestionText(questionId);
    if (!questionText) continue;
    unresolvedById.add(questionId);
    clarifications.push({
      questionId,
      question: questionToClarificationText[questionId],
      questionFr: questionText.questionFr,
      questionEn: questionText.questionEn,
    });
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
      if (!applicabilityReviews.includes(response.questionId)) {
        applicabilityReviews.push(response.questionId);
      }
      continue;
    }

    if (outcome.reviewState === "clarification_required" && !unresolvedById.has(response.questionId)) {
      clarifications.push({
        questionId: response.questionId,
        question: questionToClarificationText[response.questionId],
        questionFr: questionText.questionFr,
        questionEn: questionText.questionEn,
      });
      continue;
    }

    if (outcome.createsGapAction === "none") {
      continue;
    }

    const action = actionByQuestionId[response.questionId];
    if (!action || !questionExists(response.questionId)) continue;

    const gapType = outcome.createsGapAction === "partial" ? "partial" : "full";
    const gapCode = gapType === "partial" ? action.partialGapCode : action.fullGapCode;
    const existing = activeByCode.get(action.actionCode);
    if (!existing) {
      activeByCode.set(action.actionCode, {
        ...action,
        status: "active",
        gapType,
        gapCode,
      });
    } else {
      existing.gapType = gapType;
      existing.gapCode = gapCode;
      existing.status = "active";
    }
  }

  return {
    planCode: POST_EMPLOYMENT_RESPONSIBILITIES_PLAN_CODE,
    title: {
      fr: "Gérer les obligations post-emploi et les actions de départ de manière continue, proportionnée et documentée",
      en: "Manage post-employment obligations and departure actions in a continuous, proportionate, and documented way",
    },
    activeActions: [...activeByCode.values()],
    clarifications,
    applicabilityReviews,
    unresolvedConditions: resolved.unresolvedConditions,
  };
}
