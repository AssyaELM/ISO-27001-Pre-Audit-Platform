import type { ScreeningAnswerValue } from "./outcomes.ts";
import {
  type A64AssessmentContext,
  type A64QuestionResolution,
  type DisciplinaryProcessQuestionId,
  DISCIPLINARY_PROCESS_PLAN_CODE,
  disciplinaryProcessQuestions,
  DISCIPLINARY_PROCESS_GAP_CODES,
  resolveDisciplinaryProcessQuestions,
} from "../../content/assessment/people/disciplinary-process.ts";
import { deriveAssessmentOutcome } from "./outcomes.ts";

export type LocalizedText = {
  fr: string;
  en: string;
};

export type DisciplinaryPlanOwnership =
  | "HR"
  | "Management"
  | "Legal"
  | "Information Security"
  | "Procurement"
  | "Contract Owner"
  | "Managers";

export type DisciplinaryActionStatus = "none" | "active" | "resolved";

export type DisciplinarySubActionDefinition = {
  actionCode: string;
  sourceQuestionId: DisciplinaryProcessQuestionId;
  title: LocalizedText;
  partialGapTitle: LocalizedText;
  partialGapDescription: LocalizedText;
  fullGapTitle: LocalizedText;
  fullGapDescription: LocalizedText;
  recommendedActions: LocalizedText;
  partialPriority: "low" | "medium" | "high";
  fullPriority: "low" | "medium" | "high";
  owners: ReadonlyArray<DisciplinaryPlanOwnership>;
  closureEvidence: LocalizedText;
  closureCriteria: LocalizedText;
  partialGapCode: string;
  fullGapCode: string;
};

export type DisciplinaryRemediationAction = DisciplinarySubActionDefinition & {
  status: DisciplinaryActionStatus;
  gapType: "partial" | "full";
  gapCode: string;
};

export type DisciplinaryProcessResponseInput = {
  questionId: DisciplinaryProcessQuestionId;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  justification?: string;
  evidenceStatus?: Parameters<typeof deriveAssessmentOutcome>[0]["evidenceStatus"];
};

export type ClarificationRecord = {
  questionId: DisciplinaryProcessQuestionId;
  question: LocalizedText;
};

export type DeriveDisciplinaryProcessRemediationPlanResult = {
  planCode: typeof DISCIPLINARY_PROCESS_PLAN_CODE;
  title: LocalizedText;
  activeActions: ReadonlyArray<DisciplinaryRemediationAction>;
  clarifications: ReadonlyArray<ClarificationRecord>;
  applicabilityReviews: ReadonlyArray<DisciplinaryProcessQuestionId>;
  unresolvedConditions: A64QuestionResolution["unresolvedConditions"];
};

export const DISCIPLINARY_PROCESS_ACTIONS: Record<string, DisciplinarySubActionDefinition> = {
  "P6.4-A01": {
    actionCode: "P6.4-A01",
    sourceQuestionId: "p6_4_001",
    title: {
      fr: "Formaliser le processus disciplinaire",
      en: "Formalize the disciplinary process",
    },
    partialGapTitle: {
      fr: "Processus disciplinaire insuffisamment formalisé",
      en: "Disciplinary process insufficiently formalized",
    },
    partialGapDescription: {
      fr: "Des éléments de responsabilité, de déclenchement, d'enquête, de décision et d'objectivité sont partiellement définis ou documentés.",
      en: "Elements of responsibility, triggering, investigation, decision, and consistency are partially defined or documented.",
    },
    fullGapTitle: {
      fr: "Absence de processus disciplinaire",
      en: "No disciplinary process",
    },
    fullGapDescription: {
      fr: "Il n'existe pas de processus disciplinaire formalisé pour les violations de sécurité de l'information.",
      en: "No formal disciplinary process exists for information security policy violations.",
    },
    recommendedActions: {
      fr: "Définir les rôles, les étapes, les critères, les autorités de décision et les exigences légales applicables ; définir le mécanisme de preuve et de conservation ; publier et réviser régulièrement.",
      en: "Define roles, steps, criteria, decision authority and applicable legal requirements; define evidentiary and retention mechanisms; publish and review regularly.",
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["HR", "Management", "Information Security", "Legal"],
    closureEvidence: {
      fr: "Processus documenté et approuvé, publié, avec rôles, déclencheurs, critères et exigences de conservation définis.",
      en: "An approved, published process with defined roles, triggers, criteria, and retention requirements.",
    },
    closureCriteria: {
      fr: "Les violations couvertes disposent d'un chemin de traitement documenté et cohérent, avec rôles et décisions identifiables.",
      en: "Covered violations have a documented and coherent handling path with identifiable roles and decisions.",
    },
    partialGapCode: DISCIPLINARY_PROCESS_GAP_CODES.p6_4_001.partial,
    fullGapCode: DISCIPLINARY_PROCESS_GAP_CODES.p6_4_001.full,
  },
  "P6.4-A02": {
    actionCode: "P6.4-A02",
    sourceQuestionId: "p6_4_002",
    title: {
      fr: "Communiquer le processus et les conséquences",
      en: "Communicate process and consequences",
    },
    partialGapTitle: {
      fr: "Processus ou conséquences partiellement communiqués",
      en: "Process or consequences partially communicated",
    },
    partialGapDescription: {
      fr: "Certaines populations reçoivent l'information, mais la portée, le moment ou la preuve de communication ne sont pas cohérents.",
      en: "Some populations receive the information, but coverage, timing, or evidence of communication is inconsistent.",
    },
    fullGapTitle: {
      fr: "Processus disciplinaire non communiqué",
      en: "Disciplinary process not communicated",
    },
    fullGapDescription: {
      fr: "Les personnes concernées ne disposent d'aucune communication claire sur le processus et les conséquences possibles des violations de sécurité.",
      en: "Relevant people receive no clear communication about the process and the possible consequences of information security violations.",
    },
    recommendedActions: {
      fr: "Identifier les populations concernées, déterminer les méthodes adaptées, publier la version approuvée, intégrer le sujet aux documents RH, enregistrer preuves et exceptions, et mettre à jour la communication.",
      en: "Identify relevant populations, determine suitable methods, publish the approved version, include the topic in applicable HR documents, retain communication evidence and exceptions, and keep communication updated.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["HR", "Managers", "Information Security"],
    closureEvidence: {
      fr: "Versions publiées + preuve de communication adaptée aux publics.",
      en: "Published versions and evidence of communication adapted to audiences.",
    },
    closureCriteria: {
      fr: "Les personnes concernées peuvent retrouver le processus, en expliquer les principes et montrer la communication.",
      en: "Relevant people can find the process, explain its principles, and demonstrate it was communicated.",
    },
    partialGapCode: DISCIPLINARY_PROCESS_GAP_CODES.p6_4_002.partial,
    fullGapCode: DISCIPLINARY_PROCESS_GAP_CODES.p6_4_002.full,
  },
  "P6.4-A03": {
    actionCode: "P6.4-A03",
    sourceQuestionId: "p6_4_003",
    title: {
      fr: "Traiter les cas de façon traçable",
      en: "Handle cases with traceability",
    },
    partialGapTitle: {
      fr: "Traitement ou traçabilité incohérents",
      en: "Inconsistent case handling or traceability",
    },
    partialGapDescription: {
      fr: "Des violations sont examinées, mais l'établissement des faits, la coordination, la proportionnalité, la justification des décisions ou la cohérence entre les cas ne sont pas systématiquement démontrables.",
      en: "Violations are examined, but fact-finding, coordination, proportionality, decision rationale, or consistency across cases is not consistently demonstrable.",
    },
    fullGapTitle: {
      fr: "Absence de traitement disciplinaire documenté",
      en: "No documented disciplinary case handling",
    },
    fullGapDescription: {
      fr: "L’organisation ne dispose d'aucun workflow démontrable permettant d'établir les faits, de prendre une décision proportionnée et de conserver une trace protégée lorsqu'une violation est suspectée ou confirmée.",
      en: "The organization has no demonstrable workflow for establishing the facts, making a proportionate decision, and retaining a protected record when a violation is suspected or confirmed.",
    },
    recommendedActions: {
      fr: "Définir le workflow de signalement, examen, décision et clôture ; définir les triggers d'enquête ; attribuer les responsabilités ; protéger les dossiers ; assurer la cohérence, la proportionnalité et les voies de recours.",
      en: "Define reporting, assessment, decision, and closure workflow; define investigation triggers; assign responsibilities; protect records; ensure consistency, proportionality, and review/appeal mechanisms.",
    },
    partialPriority: "high",
    fullPriority: "high",
    owners: ["HR", "Legal", "Information Security"],
    closureEvidence: {
      fr: "Un cas anonymisé ou un exercice documenté montre l'établissement des faits, la coordination et la conservation sécurisée du dossier.",
      en: "An anonymized case or documented exercise demonstrates fact-finding, coordination, and protected record retention.",
    },
    closureCriteria: {
      fr: "La preuve de traitement montre des décisions cohérentes, proportionnées et protégées selon les situations.",
      en: "Evidence of handling shows consistent, proportionate, and secure decisions across situations.",
    },
    partialGapCode: DISCIPLINARY_PROCESS_GAP_CODES.p6_4_003.partial,
    fullGapCode: DISCIPLINARY_PROCESS_GAP_CODES.p6_4_003.full,
  },
  "P6.4-A04": {
    actionCode: "P6.4-A04",
    sourceQuestionId: "p6_4_004_external",
    title: {
      fr: "Mécanismes applicables aux parties externes",
      en: "Mechanisms applying to external parties",
    },
    partialGapTitle: {
      fr: "Mécanismes externes incomplets",
      en: "Incomplete external-party enforcement mechanisms",
    },
    partialGapDescription: {
      fr: "Certaines parties externes sont couvertes, mais les mécanismes contractuels, responsabilités, escalade, restrictions d’accès ou décisions possibles ne sont pas cohérents.",
      en: "Some external parties are covered, but contractual mechanisms, responsibilities, escalation, access restrictions, or possible decisions are not consistently defined.",
    },
    fullGapTitle: {
      fr: "Absence de mécanisme pour les parties externes",
      en: "No mechanism for external parties",
    },
    fullGapDescription: {
      fr: "Les accords applicables ne prévoient aucun mécanisme permettant de traiter les violations de sécurité commises par les parties externes pertinentes.",
      en: "Applicable agreements provide no mechanism for handling information security violations committed by relevant external parties.",
    },
    recommendedActions: {
      fr: "Inventorier les parties externes, identifier relations et contrats, définir coordinateurs, ajouter mécanismes contractuels, définir actions correctives, prévoir restriction d’accès, règles d’escalade et preuve de décisions.",
      en: "Inventory external parties, identify relationships and contracts, define coordinators, add contractual mechanisms, define corrective actions, provide access restriction/removal, escalation rules, and retain decisions.",
    },
    partialPriority: "medium",
    fullPriority: "high",
    owners: ["Procurement", "Legal", "Contract Owner", "Information Security"],
    closureEvidence: {
      fr: "Toutes les relations externes pertinentes disposent de mécanismes contractuels démontrables.",
      en: "All relevant external relationships have demonstrable contractual enforcement mechanisms.",
    },
    closureCriteria: {
      fr: "Les parties externes pertinentes sont couvertes par des mécanismes contractuels proportionnés, attribués et démontrables.",
      en: "Relevant external parties are covered by proportionate, owned, and demonstrable contractual enforcement mechanisms.",
    },
    partialGapCode: DISCIPLINARY_PROCESS_GAP_CODES.p6_4_004_external.partial,
    fullGapCode: DISCIPLINARY_PROCESS_GAP_CODES.p6_4_004_external.full,
  },
};

const actionByQuestionId = Object.values(DISCIPLINARY_PROCESS_ACTIONS).reduce(
  (acc, action) => {
    acc[action.sourceQuestionId] = action;
    return acc;
  },
  {} as Record<DisciplinaryProcessQuestionId, DisciplinarySubActionDefinition>,
);

const questionById = new Map(
  disciplinaryProcessQuestions.map((question) => [question.id, question]),
);

const questionClarifications: Record<
  DisciplinaryProcessQuestionId,
  {
    fr: string;
    en: string;
  }
> = {
  "p6_4_001": {
    fr: "Vérifier la couverture effective de la procédure disciplinaire, les rôles définis et les preuves de conservation avant de fixer la cartographie des écarts.",
    en: "Verify effective disciplinary-process coverage, defined roles, and retention evidence before fixing the gap map.",
  },
  "p6_4_002": {
    fr: "Vérifier où le processus est publié, quelles populations le reçoivent et l'adéquation des preuves de communication.",
    en: "Check where the process is published, which populations receive it, and adequacy of communication evidence.",
  },
  "p6_4_003": {
    fr: "Revoir avec RH, sécurité et juridique un incident récent ou un scénario de référence pour valider le workflow suivi.",
    en: "Review with HR, security, and legal a recent incident or reference scenario to validate the actual workflow.",
  },
  "p6_4_004_external": {
    fr: "Vérifier dans les contrats et accords quels mécanismes s’appliquent pour les parties externes en cas de violation.",
    en: "Check in contracts and agreements which mechanisms apply for external parties when a security violation occurs.",
  },
};

function getQuestionText(questionId: DisciplinaryProcessQuestionId) {
  const question = disciplinaryProcessQuestions.find((item) => item.id === questionId);
  if (!question) return null;
  return {
    question: {
      fr: question.question.fr,
      en: question.question.en,
    },
  };
}

function resolveLatestResponses<T extends { questionId: DisciplinaryProcessQuestionId; answer: ScreeningAnswerValue }>(
  responses: readonly T[],
) {
  const latest = new Map<DisciplinaryProcessQuestionId, T>();
  for (const response of responses) {
    latest.set(response.questionId, response);
  }
  return latest;
};

export function deriveDisciplinaryProcessRemediationPlan(
  responses: ReadonlyArray<DisciplinaryProcessResponseInput>,
  context: A64AssessmentContext = {},
): DeriveDisciplinaryProcessRemediationPlanResult {
  const resolved = resolveDisciplinaryProcessQuestions(context);
  const visibleSet = new Set<DisciplinaryProcessQuestionId>(resolved.questionIds);
  const latest = resolveLatestResponses(responses);
  const activeByCode = new Map<string, DisciplinaryRemediationAction>();
  const clarifications: ClarificationRecord[] = [];
  const applicabilityReviews: DisciplinaryProcessQuestionId[] = [];
  const unresolvedById = new Set<DisciplinaryProcessQuestionId>();

  for (const condition of resolved.unresolvedConditions) {
    if (condition === "hasRelevantExternalParties") {
      unresolvedById.add("p6_4_004_external");
      const questionText = getQuestionText("p6_4_004_external");
      clarifications.push({
        questionId: "p6_4_004_external",
        question: questionText?.question ?? { fr: "Mécanismes applicables aux parties externes", en: "Mechanisms applying to external parties" },
      });
    }
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
      throw new Error(`Invalid response for question ${response.questionId}: ${outcome.errorCode}`);
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
        question: questionClarifications[response.questionId],
      });
      continue;
    }

    if (outcome.createsGapAction === "none") {
      continue;
    }

    const baseAction = actionByQuestionId[response.questionId];
    if (!baseAction || !questionMapHasQuestion(response.questionId)) {
      continue;
    }

    const gapType = outcome.createsGapAction === "partial" ? "partial" : "full";
    const existing = activeByCode.get(baseAction.actionCode);
    const gapCode =
      gapType === "partial"
        ? baseAction.partialGapCode
        : baseAction.fullGapCode;

    if (!existing) {
      activeByCode.set(baseAction.actionCode, {
        ...baseAction,
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
    planCode: DISCIPLINARY_PROCESS_PLAN_CODE,
    title: {
      fr: "Mettre en place un processus disciplinaire de sécurité de l’information juste, documenté et proportionné",
      en: "Establish a fair, documented, and proportionate information security disciplinary process",
    },
    activeActions: [...activeByCode.values()],
    clarifications,
    applicabilityReviews,
    unresolvedConditions: resolved.unresolvedConditions,
  };
}

function questionMapHasQuestion(questionId: DisciplinaryProcessQuestionId) {
  return questionById.has(questionId);
}

export { DISCIPLINARY_PROCESS_ACTIONS as disciplinaryProcessActionsByCode };
