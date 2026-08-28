import type { ScreeningAnswerValue } from "./outcomes.ts";
import {
  type A66AssessmentContext,
  type A66QuestionResolution,
  type ConfidentialityAgreementsQuestionId,
  CONFIDENTIALITY_AGREEMENTS_GAP_CODES,
  CONFIDENTIALITY_AGREEMENTS_PLAN_CODE,
  confidentialityAgreementsQuestions,
  resolveConfidentialityAgreementsQuestions,
} from "../../content/assessment/people/confidentiality-agreements.ts";
import { deriveAssessmentOutcome } from "./outcomes.ts";

export type LocalizedText = {
  fr: string;
  en: string;
};

export type ConfidentialityAgreementPlanOwnership =
  | "Legal"
  | "Information Security"
  | "HR"
  | "Contract Owner"
  | "Data Owners"
  | "Procurement"
  | "Supplier Manager"
  | "Records Management"
  | "Privacy";

export type ConfidentialityAgreementsRemediationActionStatus = "none" | "active" | "resolved";

export type ConfidentialityAgreementsSubActionDefinition = {
  actionCode: string;
  sourceQuestionId: ConfidentialityAgreementsQuestionId;
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
  owners: ReadonlyArray<ConfidentialityAgreementPlanOwnership>;
  closureEvidence: LocalizedText;
  closureCriteria: LocalizedText;
  partialGapCode: string;
  fullGapCode: string;
};

export type ConfidentialityAgreementsRemediationAction = ConfidentialityAgreementsSubActionDefinition & {
  status: ConfidentialityAgreementsRemediationActionStatus;
  gapType: "partial" | "full";
  gapCode: string;
};

export type ConfidentialityAgreementsResponseInput = {
  questionId: ConfidentialityAgreementsQuestionId;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  justification?: string;
  evidenceStatus?: Parameters<typeof deriveAssessmentOutcome>[0]["evidenceStatus"];
};

export type ClarificationRecord = {
  questionId: ConfidentialityAgreementsQuestionId;
  question: LocalizedText;
  questionFr: string;
  questionEn: string;
};

export type DeriveConfidentialityAgreementsRemediationPlanResult = {
  planCode: typeof CONFIDENTIALITY_AGREEMENTS_PLAN_CODE;
  title: LocalizedText;
  activeActions: ReadonlyArray<ConfidentialityAgreementsRemediationAction>;
  clarifications: ReadonlyArray<ClarificationRecord>;
  applicabilityReviews: ReadonlyArray<ConfidentialityAgreementsQuestionId>;
  unresolvedConditions: A66QuestionResolution["unresolvedConditions"];
};

export const CONFIDENTIALITY_AGREEMENTS_ACTIONS: Record<string, ConfidentialityAgreementsSubActionDefinition> = {
  "P6.6-A01": {
    actionCode: "P6.6-A01",
    sourceQuestionId: "p6_6_001",
    title: {
      fr: "Définir un cadre de besoins et critères",
      en: "Define requirements and criteria",
    },
    partialGapTitle: {
      fr: "Besoins de confidentialité partiellement définis",
      en: "Confidentiality requirements partially defined",
    },
    partialGapDescription: {
      fr: "L’organisation dispose de certains modèles ou clauses, mais elle n’a pas entièrement défini les informations, populations, relations, critères, responsables ou situations nécessitant un accord adapté.",
      en: "The organization has some models or clauses, but has not fully defined information, populations, relationships, criteria, owners, or situations requiring an appropriate agreement.",
    },
    fullGapTitle: {
      fr: "Besoins et critères de confidentialité non définis",
      en: "Confidentiality requirements and criteria are not defined",
    },
    fullGapDescription: {
      fr: "L’organisation ne dispose d’aucun processus permettant d’identifier les situations nécessitant un accord de confidentialité ou de déterminer son contenu approprié.",
      en: "The organization has no process to identify situations requiring a confidentiality agreement or determine its appropriate content.",
    },
    recommendedActions: {
      fr: "Identifier les informations à protéger ; les relier à la classification ; identifier les populations et relations ; définir les critères déclencheurs ; distinguer clauses intégrées et accords autonomes ; définir les modèles et clauses minimales ; identifier les juridictions ; attribuer les responsabilités ; définir les événements de révision ; traiter les exceptions ; faire valider et versionner les modèles.",
      en: "Identify information requiring protection; link it to classification; identify populations and relationships; define triggering criteria; distinguish integrated clauses and standalone agreements; define templates and clauses; identify jurisdictions; assign responsibilities; define review triggers; address exceptions; review and version templates.",
    },
    priority: { partial: "medium", full: "high" },
    owners: ["Legal", "Information Security", "HR", "Data Owners"],
    closureEvidence: {
      fr: "Une matrice ou procédure approuvée relie les informations, rôles et relations aux types d’accords et clauses requis.",
      en: "An approved matrix or procedure links information, roles, and relationships to required agreement and clause types.",
    },
    closureCriteria: {
      fr: "Une matrice ou procédure approuvée relie les informations, rôles et relations aux types d’accords et clauses requis.",
      en: "An approved matrix or procedure links information, roles, and relationships to required agreement and clause types.",
    },
    partialGapCode: CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_001.partial,
    fullGapCode: CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_001.full,
  },
  "P6.6-A02": {
    actionCode: "P6.6-A02",
    sourceQuestionId: "p6_6_002",
    title: {
      fr: "Couverture et signature opérationnelles",
      en: "Appropriate execution",
    },
    partialGapTitle: {
      fr: "Signature ou contenu des accords incomplets",
      en: "Incomplete execution or content of confidentiality agreements",
    },
    partialGapDescription: {
      fr: "Des accords sont utilisés, mais certaines populations ne sont pas couvertes, certaines signatures ou acceptations manquent, les accords ne sont pas toujours conclus au moment approprié ou leur contenu n’est pas adapté au risque et à la relation.",
      en: "Agreements are used, but some populations are not covered, some signatures or acceptances are missing, agreements are not always concluded at the right time, or their content is not suited to the risk and relationship.",
    },
    fullGapTitle: {
      fr: "Accords requis non signés ou inexistants",
      en: "Required confidentiality agreements are missing or not executed",
    },
    fullGapDescription: {
      fr: "Les personnes concernées accèdent ou reçoivent des informations confidentielles sans être couvertes par un accord ou une clause appropriée lorsque celui-ci est requis.",
      en: "Relevant people access or receive confidential information without coverage from an appropriate agreement or clause when required.",
    },
    recommendedActions: {
      fr: "Identifier les populations non couvertes ; comparer les accès aux accords disponibles ; identifier les signatures ou acceptations manquantes ; vérifier modèles et versions ; corriger les clauses insuffisantes ; obtenir les accords manquants ; intégrer la vérification au workflow ; traiter les dossiers historiques et exceptions ; conserver la preuve d’exécution ; vérifier un échantillon récent.",
      en: "Identify uncovered populations; compare access to available agreements; identify missing signatures/acceptances; verify templates and versions; correct insufficient clauses; obtain missing agreements; integrate verification into the workflow; handle legacy cases and exceptions; retain execution evidence; test a recent sample.",
    },
    priority: { partial: "high", full: "high" },
    owners: ["HR", "Legal", "Procurement", "Contract Owner"],
    closureEvidence: {
      fr: "Un échantillon démontre que chaque personne concernée est couverte par un accord ou une clause appropriée avant l’accès ou la divulgation correspondante.",
      en: "A sample demonstrates each relevant person is covered by an appropriate agreement or clause before corresponding access or disclosure.",
    },
    closureCriteria: {
      fr: "Un échantillon démontre que chaque personne concernée est couverte par un accord ou une clause appropriée avant l’accès ou la divulgation correspondante.",
      en: "A sample demonstrates each relevant person is covered by an appropriate agreement or clause before corresponding access or disclosure.",
    },
    partialGapCode: CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_002.partial,
    fullGapCode: CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_002.full,
  },
  "P6.6-A03": {
    actionCode: "P6.6-A03",
    sourceQuestionId: "p6_6_003",
    title: {
      fr: "Mettre en place un registre et une révision",
      en: "Build register and review",
    },
    partialGapTitle: {
      fr: "Registre ou révision des accords incomplets",
      en: "Incomplete agreement register or review process",
    },
    partialGapDescription: {
      fr: "Certains accords sont retrouvables, mais le registre, les métadonnées, les versions, les statuts, les échéances, les exceptions ou les révisions ne sont pas complets ou cohérents.",
      en: "Some agreements are retrievable, but the register, metadata, versions, statuses, expirations, exceptions, or reviews are incomplete or inconsistent.",
    },
    fullGapTitle: {
      fr: "Absence de registre et de révision des accords",
      en: "No confidentiality-agreement register or review process",
    },
    fullGapDescription: {
      fr: "L’organisation ne peut pas démontrer quels accords ont été conclus, par qui, dans quelle version, pour quel périmètre ou comment leur adéquation est réexaminée.",
      en: "The organization cannot demonstrate which agreements were made, by whom, in which version, for which scope, or how adequacy is re-examined.",
    },
    recommendedActions: {
      fr: "Définir les métadonnées minimales ; créer ou compléter le registre ; enregistrer personnes, entités, types, versions et périmètres ; enregistrer dates et statuts ; enregistrer les échéances ; définir les déclencheurs de revue ; documenter décisions de maintien, modification ou remplacement ; contrôler accès et conservation ; suivre les exceptions ; vérifier un échantillon.",
      en: "Define minimum metadata; create or complete a register; record persons, entities, types, versions, and scopes; record dates and statuses; record expiries; define review triggers; document decisions to keep, modify, or replace; control access and retention; track exceptions; verify sample records.",
    },
    priority: { partial: "medium", full: "high" },
    owners: ["Legal", "Records Management", "HR", "Privacy"],
    closureEvidence: {
      fr: "Le registre permet de retrouver les accords applicables, leur statut, leur version et les décisions de révision associées.",
      en: "The register can retrieve applicable agreements, their status, version, and associated review decisions.",
    },
    closureCriteria: {
      fr: "Le registre permet de retrouver les accords applicables, leur statut, leur version et les décisions de révision associées.",
      en: "The register can retrieve applicable agreements, their status, version, and associated review decisions.",
    },
    partialGapCode: CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_003.partial,
    fullGapCode: CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_003.full,
  },
  "P6.6-A04": {
    actionCode: "P6.6-A04",
    sourceQuestionId: "p6_6_004_external",
    title: {
      fr: "Étendre la couverture externe",
      en: "Extend external coverage",
    },
    partialGapTitle: {
      fr: "Couverture externe incomplète",
      en: "Incomplete external-party confidentiality coverage",
    },
    partialGapDescription: {
      fr: "Certaines parties externes sont couvertes, mais certaines catégories, relations, sous-traitants, informations, accès ou juridictions ne disposent pas d’un accord ou d’une clause appropriée et démontrable.",
      en: "Some external parties are covered, but some categories, relationships, subcontractors, information, access, or jurisdictions do not have appropriate and demonstrable agreements or clauses.",
    },
    fullGapTitle: {
      fr: "Parties externes pertinentes non couvertes",
      en: "Relevant external parties are not covered",
    },
    fullGapDescription: {
      fr: "Des consultants, fournisseurs, partenaires ou autres parties externes peuvent accéder à des informations confidentielles sans être couverts par des accords appropriés lorsque ceux-ci sont requis.",
      en: "Consultants, suppliers, partners, or other relevant external parties may access confidential information without appropriate agreements when required.",
    },
    recommendedActions: {
      fr: "Inventorier les parties externes ; identifier celles qui reçoivent des informations confidentielles ; relier accès, divulgations et contrats ; identifier les accords ou clauses manquants ; choisir le type d’accord approprié ; obtenir signatures ou acceptations ; couvrir les sous-traitants lorsque nécessaire ; traiter les contrats historiques ; suivre les changements, renouvellements et fins de relation ; conserver les preuves.",
      en: "Inventory external parties; identify those receiving confidential information; map access, disclosures, and contracts; identify missing agreements or clauses; choose the appropriate type of agreement; obtain signatures or acceptance; cover subcontractors where needed; address legacy contracts; track changes, renewals, and end-of-engagement; retain evidence.",
    },
    priority: { partial: "medium", full: "high" },
    owners: ["Procurement", "Legal", "Supplier Manager", "Information Security"],
    closureEvidence: {
      fr: "Toutes les parties externes pertinentes sont reliées à un accord ou une clause adaptée, traçable et proportionnée.",
      en: "All relevant external parties are linked to an appropriate, traceable, proportionate agreement or clause.",
    },
    closureCriteria: {
      fr: "Toutes les parties externes pertinentes sont reliées à un accord ou une clause adaptée, traçable et proportionnée.",
      en: "All relevant external parties are linked to an appropriate, traceable, proportionate agreement or clause.",
    },
    partialGapCode: CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_004_external.partial,
    fullGapCode: CONFIDENTIALITY_AGREEMENTS_GAP_CODES.p6_6_004_external.full,
  },
};

const actionByQuestionId = Object.values(CONFIDENTIALITY_AGREEMENTS_ACTIONS).reduce(
  (acc, action) => {
    acc[action.sourceQuestionId] = action;
    return acc;
  },
  {} as Record<ConfidentialityAgreementsQuestionId, ConfidentialityAgreementsSubActionDefinition>,
);

const questionById = new Map(
  confidentialityAgreementsQuestions.map((question) => [question.id, question]),
);

const questionToClarificationText: Record<
  ConfidentialityAgreementsQuestionId,
  { fr: string; en: string }
> = {
  "p6_6_001": {
    fr: "Demander au juridique et à la sécurité de l'information les modèles validés, les informations sensibles concernées et les responsabilités d'approbation.",
    en: "Ask legal and information security for approved templates, relevant protected information, and approver responsibilities.",
  },
  "p6_6_002": {
    fr: "Vérifier le processus d’engagement / contractualisation et la manière de démontrer la signature, l’acceptation ou la preuve équivalente.",
    en: "Verify the engagement/contracting process and how signature, acceptance, or equivalent proof is demonstrated.",
  },
  "p6_6_003": {
    fr: "Identifier le référentiel de registre utilisé, les métadonnées minimales et les conditions de révision.",
    en: "Identify the registry reference, minimum metadata, and review conditions.",
  },
  "p6_6_004_external": {
    fr: "Demander aux achats, au juridique et aux responsables contrats quelles parties externes reçoivent des informations confidentielles et quels accords les couvrent.",
    en: "Ask Procurement, Legal, and contract owners which external parties receive confidential information and which agreements cover them.",
  },
};

export function deriveConfidentialityAgreementsRemediationPlan(
  responses: ReadonlyArray<ConfidentialityAgreementsResponseInput>,
  context: A66AssessmentContext = {},
): DeriveConfidentialityAgreementsRemediationPlanResult {
  const resolved = resolveConfidentialityAgreementsQuestions(context);
  const visibleSet = new Set<ConfidentialityAgreementsQuestionId>(resolved.questionIds);
  const latest = new Map<ConfidentialityAgreementsQuestionId, ConfidentialityAgreementsResponseInput>();
  const activeByCode = new Map<string, ConfidentialityAgreementsRemediationAction>();
  const clarifications: ClarificationRecord[] = [];
  const applicabilityReviews: ConfidentialityAgreementsQuestionId[] = [];
  const unresolvedById = new Set<ConfidentialityAgreementsQuestionId>();

  for (const response of responses) {
    latest.set(response.questionId, response);
  }

  for (const condition of resolved.unresolvedConditions) {
    if (condition === "hasRelevantExternalParties") {
      unresolvedById.add("p6_6_004_external");
      clarifications.push({
        questionId: "p6_6_004_external",
        question: questionToClarificationText.p6_6_004_external,
        questionFr: getQuestionById("p6_6_004_external").questionFr,
        questionEn: getQuestionById("p6_6_004_external").questionEn,
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
      continue;
    }

    if (outcome.reviewState === "applicability_review_required") {
      if (!applicabilityReviews.includes(response.questionId)) {
        applicabilityReviews.push(response.questionId);
      }
      continue;
    }

    if (outcome.reviewState === "clarification_required" && !unresolvedById.has(response.questionId)) {
      const questionText = getQuestionById(response.questionId);
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
    if (!action || !questionMapHasQuestion(response.questionId)) {
      continue;
    }

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
    planCode: CONFIDENTIALITY_AGREEMENTS_PLAN_CODE,
    title: {
      fr: "Définir, obtenir, tracer et maintenir les accords de confidentialité adaptés aux besoins de protection de l’information",
      en: "Define, obtain, track, and maintain confidentiality agreements appropriate to information-protection needs",
    },
    activeActions: [...activeByCode.values()],
    clarifications,
    applicabilityReviews,
    unresolvedConditions: resolved.unresolvedConditions,
  };
}

function getQuestionById(questionId: ConfidentialityAgreementsQuestionId) {
  const question = confidentialityAgreementsQuestions.find((item) => item.id === questionId);
  if (!question) {
    throw new Error(`Unknown question id: ${questionId}`);
  }
  return {
    questionFr: question.question.fr,
    questionEn: question.question.en,
  };
}

function questionMapHasQuestion(questionId: ConfidentialityAgreementsQuestionId) {
  return questionById.has(questionId);
}
