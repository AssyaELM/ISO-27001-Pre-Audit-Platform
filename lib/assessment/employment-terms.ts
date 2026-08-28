import type { ScreeningAnswerValue } from "./outcomes.ts";
import {
  type A62AssessmentContext,
  type A62QuestionResolution,
  type EmploymentTermsQuestionId,
  EMPLOYMENT_TERMS_PLAN_CODE,
  employmentTermsQuestions,
  EMPLOYMENT_TERMS_GAP_CODES,
  resolveEmploymentTermsQuestions,
} from "../../content/assessment/people/employment-terms.ts";
import { deriveAssessmentOutcome } from "./outcomes.ts";

export type LocalizedText = {
  fr: string;
  en: string;
};

export type ClarificationRecord = {
  questionId: EmploymentTermsQuestionId;
  question: LocalizedText;
  questionFr: string;
  questionEn: string;
};

export type Ownership = string;

export type EmploymentTermsSubActionStatus = "none" | "active" | "resolved";

export type EmploymentTermsSubActionDefinition = {
  actionCode: string;
  sourceQuestionId: EmploymentTermsQuestionId;
  title: LocalizedText;
  partialGapTitle: LocalizedText;
  partialGapDescription: LocalizedText;
  fullGapTitle: LocalizedText;
  fullGapDescription: LocalizedText;
  recommendedActions: LocalizedText;
  priority:
    | "low"
    | "medium"
    | "high"
    | {
        partial: "low" | "medium" | "high";
        full: "low" | "medium" | "high";
      };
  owners: ReadonlyArray<Ownership>;
  closureEvidence: LocalizedText;
  closureCriteria: LocalizedText;
  gapCodes: {
    partial: string;
    full: string;
  };
};

export type EmploymentTermsRemediationAction = EmploymentTermsSubActionDefinition & {
  status: EmploymentTermsSubActionStatus;
  gapType: "partial" | "full";
};

export type EmploymentTermsResponseInput = {
  questionId: EmploymentTermsQuestionId;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  justification?: string;
  evidenceStatus?: Parameters<typeof deriveAssessmentOutcome>[0]["evidenceStatus"];
};

export type DeriveEmploymentTermsRemediationPlanResult = {
  planCode: typeof EMPLOYMENT_TERMS_PLAN_CODE;
  title: LocalizedText;
  activeActions: ReadonlyArray<EmploymentTermsRemediationAction>;
  clarifications: ReadonlyArray<ClarificationRecord>;
  applicabilityReviews: ReadonlyArray<EmploymentTermsQuestionId>;
  unresolvedConditions: A62QuestionResolution["unresolvedConditions"];
};

export const EMPLOYMENT_TERMS_ACTIONS: Record<string, EmploymentTermsSubActionDefinition> = {
  "P6.2-A01": {
    actionCode: "P6.2-A01",
    sourceQuestionId: "p6_2_001",
    title: { fr: "Cadre contractuel", en: "Contractual framework" },
    partialGapTitle: {
      fr: "Cadre contractuel de sécurité incomplet",
      en: "Incomplete contractual security framework",
    },
    partialGapDescription: {
      fr: "Des responsabilités de sécurité sont présentes, mais elles sont trop générales, ne couvrent pas toutes les parties ou catégories pertinentes, ne sont pas adaptées aux rôles, ou les modèles ne sont pas correctement approuvés et versionnés.",
      en: "Information security responsibilities exist, but are too general, do not cover all relevant parties or categories, are not role-appropriate, or templates are not properly approved and versioned.",
    },
    fullGapTitle: {
      fr: "Absence de responsabilités contractuelles de sécurité",
      en: "No contractual information security responsibilities",
    },
    fullGapDescription: {
      fr: "Les accords applicables ne définissent pas clairement les responsabilités de sécurité de l'information du personnel et de l'organisation.",
      en: "Applicable agreements do not clearly define the information security responsibilities of personnel and the organization.",
    },
    recommendedActions: {
      fr: "Inventorier les contrats, annexes et accords existants; identifier les responsabilités manquantes; distinguer les responsabilités du personnel et de l'organisation; adapter les obligations aux catégories de rôle; déterminer les documents contractuels appropriés; harmoniser les modèles; obtenir une validation RH et juridique; approuver et versionner les documents; traiter les contrats historiques lorsque nécessaire.",
      en: "Inventory existing contracts, annexes, and agreements; identify missing responsibilities; distinguish personnel and organizational responsibilities; adapt obligations to role categories; determine appropriate contractual documents; harmonize templates; obtain HR and legal approval; approve and version the documents; address legacy agreements when necessary.",
    },
    priority: { partial: "medium", full: "high" },
    owners: ["HR", "Legal", "Information Security"],
    closureEvidence: {
      fr: "Un ensemble approuvé et versionné de contrats, annexes ou accords couvre les responsabilités de sécurité applicables.",
      en: "An approved and version-controlled set of contracts, annexes, or agreements covers the applicable information security responsibilities.",
    },
    closureCriteria: {
      fr: "Un ensemble approuvé et versionné de contrats, annexes ou accords couvre les responsabilités de sécurité applicables.",
      en: "An approved and version-controlled set of contracts, annexes, or agreements covers the applicable information security responsibilities.",
    },
    gapCodes: {
      partial: EMPLOYMENT_TERMS_GAP_CODES.p6_2_001.partial,
      full: EMPLOYMENT_TERMS_GAP_CODES.p6_2_001.full,
    },
  },
  "P6.2-A02": {
    actionCode: "P6.2-A02",
    sourceQuestionId: "p6_2_002",
    title: { fr: "Acceptation", en: "Acceptance" },
    partialGapTitle: {
      fr: "Communication ou acceptation contractuelle irrégulière",
      en: "Inconsistent communication or contractual acceptance",
    },
    partialGapDescription: {
      fr: "Les conditions existent, mais certaines personnes les acceptent tardivement, certaines catégories sont omises, les exceptions ne sont pas contrôlées ou des accès sensibles sont parfois attribués avant l'acceptation requise.",
      en: "The terms exist, but some people accept them late, some categories are omitted, exceptions are uncontrolled, or sensitive access is sometimes granted before required acceptance.",
    },
    fullGapTitle: {
      fr: "Absence de mécanisme formel d'acceptation",
      en: "No formal acceptance mechanism",
    },
    fullGapDescription: {
      fr: "Les conditions peuvent exister dans un modèle, mais aucun processus ne démontre qu'elles ont été communiquées et acceptées par les personnes concernées.",
      en: "The terms may exist in a template, but no process demonstrates they were communicated to and accepted by the relevant people.",
    },
    recommendedActions: {
      fr: "Identifier les populations non couvertes; définir les méthodes d'acceptation autorisées; mettre en place un workflow de communication et d'acceptation; intégrer l'étape dans le processus d'engagement; attribuer la validation à RH ou au responsable compétent; enregistrer le document et la date d'acceptation; définir un processus d'exception limité et approuvé; lier l'acceptation aux accès sensibles lorsque nécessaire; régulariser les dossiers incomplets.",
      en: "Identify uncovered populations; define permitted acceptance methods; implement a communication and acceptance workflow; integrate the step into the engagement process; assign validation to HR or the appropriate owner; record the document and acceptance date; define a limited and approved exception process; link acceptance to sensitive access where necessary; remediate incomplete records.",
    },
    priority: { partial: "medium", full: "high" },
    owners: ["HR", "Hiring Manager", "Legal", "IT-IAM"],
    closureEvidence: {
      fr: "Chaque personne concernée reçoit et accepte les conditions applicables selon un processus démontrable.",
      en: "Each relevant person receives and accepts the applicable terms through a demonstrable process.",
    },
    closureCriteria: {
      fr: "Chaque personne concernée reçoit et accepte les conditions applicables selon un processus démontrable.",
      en: "Each relevant person receives and accepts the applicable terms through a demonstrable process.",
    },
    gapCodes: {
      partial: EMPLOYMENT_TERMS_GAP_CODES.p6_2_002.partial,
      full: EMPLOYMENT_TERMS_GAP_CODES.p6_2_002.full,
    },
  },
  "P6.2-A03": {
    actionCode: "P6.2-A03",
    sourceQuestionId: "p6_2_003",
    title: { fr: "Traçabilité", en: "Traceability" },
    partialGapTitle: {
      fr: "Traçabilité contractuelle incomplète",
      en: "Incomplete contractual traceability",
    },
    partialGapDescription: {
      fr: "Des accords existent, mais ils sont dispersés ou leur version, date, population, statut ou preuve d'acceptation n'est pas toujours identifiable.",
      en: "Agreements exist, but they are dispersed or their version, date, population, status, or acceptance evidence cannot always be identified.",
    },
    fullGapTitle: {
      fr: "Absence de preuve des conditions acceptées",
      en: "No evidence of accepted security terms",
    },
    fullGapDescription: {
      fr: "L'organisation ne peut pas démontrer quelle personne a accepté quel accord, à quelle date et dans quelle version.",
      en: "The organization cannot demonstrate which person accepted which agreement, on what date, and in which version.",
    },
    recommendedActions: {
      fr: "Identifier un système de référence; créer ou compléter un registre minimal des accords; enregistrer le document, la version, la date et le statut; associer la preuve à la personne ou population concernée; conserver la preuve de signature ou d'acceptation; assigner le propriétaire du registre; enregistrer les exceptions; appliquer des droits d'accès restreints; définir une conservation conforme au droit applicable; permettre la production d'exemples expurgés pour l'audit.",
      en: "Identify a system of record; create or complete a minimum agreement register; record the document, version, date, and status; associate the evidence with the relevant person or population; retain signature or acceptance evidence; assign register ownership; record exceptions; apply restricted access rights; define retention according to applicable law; support redacted audit samples.",
    },
    priority: { partial: "medium", full: "high" },
    owners: ["HR", "Records Management", "Legal", "Privacy"],
    closureEvidence: {
      fr: "Une preuve complète et retrouvable peut être fournie pour les personnes concernées.",
      en: "Complete and retrievable evidence can be provided for the relevant people.",
    },
    closureCriteria: {
      fr: "Une preuve complète et retrouvable peut être fournie pour les personnes concernées.",
      en: "Complete and retrievable evidence can be provided for the relevant people.",
    },
    gapCodes: {
      partial: EMPLOYMENT_TERMS_GAP_CODES.p6_2_003.partial,
      full: EMPLOYMENT_TERMS_GAP_CODES.p6_2_003.full,
    },
  },
  "P6.2-A04": {
    actionCode: "P6.2-A04",
    sourceQuestionId: "p6_2_005_external",
    title: { fr: "Personnel externe", en: "External personnel" },
    partialGapTitle: {
      fr: "Couverture incomplète du personnel externe",
      en: "Incomplete coverage of external personnel",
    },
    partialGapDescription: {
      fr: "Certaines personnes externes sont couvertes, mais pas toutes celles disposant d'un accès pertinent aux informations, systèmes ou locaux du périmètre.",
      en: "Some external personnel are covered, but not all those with relevant access to in-scope information, systems, or premises.",
    },
    fullGapTitle: {
      fr: "Personnel externe non couvert par des obligations contractuelles de sécurité",
      en: "External personnel are not covered by contractual security obligations",
    },
    fullGapDescription: {
      fr: "Des personnes externes peuvent accéder au périmètre sans obligations contractuelles de sécurité adaptées à leur relation, leur rôle et leurs accès.",
      en: "External personnel may access the scope without contractual security obligations appropriate to their relationship, role, and access.",
    },
    recommendedActions: {
      fr: "Inventorier les catégories de personnel externe; identifier leurs accès et risques; comparer les contrats existants aux exigences internes; définir les obligations par type d'intervenant; mettre à jour les contrats fournisseurs ou individuels; obtenir une acceptation ou une assurance équivalente; intégrer la vérification au processus d'engagement externe; conserver les preuves; traiter les exceptions et accords historiques; revoir les accès lorsque le contrat expire.",
      en: "Inventory external-personnel categories; identify their access and risks; compare existing agreements with internal requirements; define obligations by external-personnel type; update supplier or individual agreements; obtain acceptance or equivalent assurance; integrate verification into the external-engagement process; retain evidence; address exceptions and legacy agreements; review access when the agreement expires.",
    },
    priority: { partial: "medium", full: "high" },
    owners: ["Procurement", "HR", "Legal", "Supplier Manager", "Information Security"],
    closureEvidence: {
      fr: "Tous les personnels externes concernés sont couverts par des obligations contractuelles adaptées et démontrables.",
      en: "All relevant external personnel are covered by appropriate and demonstrable contractual security obligations.",
    },
    closureCriteria: {
      fr: "Tous les personnels externes concernés sont couverts par des obligations contractuelles adaptées et démontrables.",
      en: "All relevant external personnel are covered by appropriate and demonstrable contractual security obligations.",
    },
    gapCodes: {
      partial: EMPLOYMENT_TERMS_GAP_CODES.p6_2_005_external.partial,
      full: EMPLOYMENT_TERMS_GAP_CODES.p6_2_005_external.full,
    },
  },
  "P6.2-A05": {
    actionCode: "P6.2-A05",
    sourceQuestionId: "p6_2_005_change",
    title: { fr: "Changements significatifs", en: "Significant changes" },
    partialGapTitle: {
      fr: "Révision irrégulière des conditions de sécurité",
      en: "Inconsistent review of security terms",
    },
    partialGapDescription: {
      fr: "Les accords sont parfois réexaminés, mais les événements déclencheurs, les responsabilités ou les décisions ne sont pas clairement définis ou tracés.",
      en: "Agreements are sometimes reviewed, but triggering events, responsibilities, or decisions are not clearly defined or traceable.",
    },
    fullGapTitle: {
      fr: "Absence de révision lors des changements significatifs",
      en: "No review following significant changes",
    },
    fullGapDescription: {
      fr: "Les conditions peuvent rester obsolètes après un changement important de rôle, d'accès, de politique, de loi ou de relation contractuelle.",
      en: "The terms may remain outdated after a significant change in role, access, policy, law, or contractual relationship.",
    },
    recommendedActions: {
      fr: "Définir les changements qui déclenchent une revue; attribuer un responsable; surveiller les changements pertinents; évaluer leur impact contractuel; distinguer communication, réacceptation, avenant et nouvel accord; obtenir la validation RH ou juridique; documenter les décisions de mise à jour ou de non-mise à jour; conserver l'historique; traiter les populations et accords hérités.",
      en: "Define changes that trigger a review; assign an owner; monitor relevant changes; assess their contractual impact; distinguish communication, renewed acceptance, amendment, and new agreement; obtain HR or legal validation; document decisions to update or not update; retain decision history; address legacy populations and agreements.",
    },
    priority: { partial: "medium", full: "high" },
    owners: ["HR", "Legal", "Information Security", "Compliance"],
    closureEvidence: {
      fr: "Les changements significatifs déclenchent une revue documentée et, lorsque nécessaire, une mise à jour ou une nouvelle acceptation démontrable.",
      en: "Significant changes trigger a documented review and, where necessary, a demonstrable update or renewed acceptance.",
    },
    closureCriteria: {
      fr: "Les changements significatifs déclenchent une revue documentée et, lorsque nécessaire, une mise à jour ou une nouvelle acceptation démontrable.",
      en: "Significant changes trigger a documented review and, where necessary, a demonstrable update or renewed acceptance.",
    },
    gapCodes: {
      partial: EMPLOYMENT_TERMS_GAP_CODES.p6_2_005_change.partial,
      full: EMPLOYMENT_TERMS_GAP_CODES.p6_2_005_change.full,
    },
  },
};

const actionByQuestionId = Object.values(EMPLOYMENT_TERMS_ACTIONS).reduce(
  (acc, action) => {
    acc[action.sourceQuestionId] = action;
    return acc;
  },
  {} as Record<EmploymentTermsQuestionId, EmploymentTermsSubActionDefinition>
);

const questionToClarificationText: Record<
  EmploymentTermsQuestionId,
  { fr: string; en: string }
> = {
  "p6_2_001": {
    fr: "Demander aux ressources humaines ou au service juridique quels modèles sont utilisés, où les responsabilités de sécurité sont définies et qui valide leur contenu.",
    en: "Ask HR or Legal which agreement templates are used, where information security responsibilities are defined, and who approves their content.",
  },
  "p6_2_002": {
    fr: "Vérifier le processus d'engagement, le système de signature ou d'acceptation et la manière dont RH confirme l'acceptation des conditions.",
    en: "Check the engagement process, signing or acceptance mechanism, and how HR confirms that the applicable terms were accepted.",
  },
  "p6_2_003": {
    fr: "Identifier le système dans lequel les accords acceptés sont conservés, les personnes autorisées à y accéder et les données permettant de retrouver la bonne version.",
    en: "Identify the system where accepted agreements are retained, who may access it, and which metadata identifies the correct version.",
  },
  "p6_2_004": {
    fr: "Identifier la preuve conservée, la version de l’accord et la population concernée.",
    en: "Identify the retained evidence, agreement version, and personnel population concerned.",
  },
  "p6_2_005_external": {
    fr: "Demander aux achats, aux ressources humaines ou aux responsables fournisseurs quels accords couvrent les consultants, intérimaires et autres intervenants externes.",
    en: "Ask Procurement, HR, or supplier managers which agreements cover contractors, temporary workers, and other external personnel.",
  },
  "p6_2_005_change": {
    fr: "Identifier qui vérifie l'impact des changements de rôle, d'accès, de politique ou de loi sur les accords existants.",
    en: "Identify who assesses the impact of role, access, policy, or legal changes on existing agreements.",
  },
};

export const employmentTermsLegalNotice = {
  fr: "Les conditions contractuelles et leur caractère juridiquement opposable varient selon le pays, le type d'engagement et les conventions applicables. Les clauses doivent être validées par une fonction RH ou juridique compétente.",
  en: "Contractual terms and their legal enforceability vary by country, engagement type, and applicable agreements. Clauses should be reviewed by a competent HR or legal function.",
};

function getQuestionById(questionId: EmploymentTermsQuestionId) {
  const question = employmentTermsQuestions.find((item) => item.id === questionId);
  if (!question) {
    return null;
  }

  return {
    questionFr: question.question.fr,
    questionEn: question.question.en,
  };
}

function resolveLatestResponses<T extends { questionId: EmploymentTermsQuestionId; answer: ScreeningAnswerValue }>(
  responses: readonly T[],
) {
  const latest = new Map<EmploymentTermsQuestionId, T>();
  for (const response of responses) {
    latest.set(response.questionId, response);
  }
  return latest;
}

export function deriveEmploymentTermsRemediationPlan(
  responses: ReadonlyArray<EmploymentTermsResponseInput>,
  context?: A62AssessmentContext,
): DeriveEmploymentTermsRemediationPlanResult {
  const resolved = resolveEmploymentTermsQuestions(context);
  const visibleSet = new Set(resolved.questionIds);
  const latest = resolveLatestResponses(responses);
  const activeByCode = new Map<string, EmploymentTermsRemediationAction>();
  const clarifications: ClarificationRecord[] = [];
  const applicabilityReviews: EmploymentTermsQuestionId[] = [];

  for (const condition of resolved.unresolvedConditions) {
    const conditionalQuestionId =
      condition === "hasExternalPersonnel" ? "p6_2_005_external" : "p6_2_005_change";
    const questionText = getQuestionById(conditionalQuestionId);
    if (!questionText) continue;
    clarifications.push({
      questionId: conditionalQuestionId,
      question: questionToClarificationText[conditionalQuestionId],
      questionFr: questionText.questionFr,
      questionEn: questionText.questionEn,
    });
  }

  for (const response of latest.values()) {
    if (!visibleSet.has(response.questionId)) continue;

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

    if (outcome.reviewState === "applicability_review_required") {
      applicabilityReviews.push(response.questionId);
      continue;
    }

    if (outcome.reviewState === "clarification_required") {
      const questionText = getQuestionById(response.questionId);
      if (questionText) {
        clarifications.push({
          questionId: response.questionId,
          question: questionToClarificationText[response.questionId],
          questionFr: questionText.questionFr,
          questionEn: questionText.questionEn,
        });
      }
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
      });
    }
  }

  return {
    planCode: EMPLOYMENT_TERMS_PLAN_CODE,
    title: {
      fr: "Établir et maintenir des conditions d'engagement définissant clairement les responsabilités de sécurité de l'information",
      en: "Establish and maintain engagement terms that clearly define information security responsibilities",
    },
    activeActions: [...activeByCode.values()],
    clarifications,
    applicabilityReviews,
    unresolvedConditions: resolved.unresolvedConditions,
  };
}
