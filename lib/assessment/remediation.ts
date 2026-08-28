import { deriveAssessmentOutcome, type ScreeningAnswerValue } from "./outcomes.ts";
import { screeningQuestions } from "../../content/assessment/people/screening.ts";

export type LocalizedText = {
  fr: string;
  en: string;
};

export type Responsibility = "security_owner" | "hr_owner" | "it_owner" | "legal_team" | "internal_audit";

export type ScreeningSubActionStatus = "none" | "active" | "resolved";

export type ScreeningSubActionDefinition = {
  actionCode: string;
  sourceQuestionId: string;
  title: LocalizedText;
  partialGap: LocalizedText;
  fullGap: LocalizedText;
  recommendedActions: LocalizedText;
  priority: "low" | "medium" | "high";
  owners: ReadonlyArray<Responsibility>;
  closureEvidence: LocalizedText;
  closureCriteria: LocalizedText;
};

export type ScreeningResponseInput = {
  questionId: string;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  justification?: string;
};

export type DerivedSubAction = ScreeningSubActionDefinition & {
  status: ScreeningSubActionStatus;
  gapType: "partial" | "full";
};

export type DeriveScreeningRemediationPlanResult = {
  planCode: "A6_1_SCREENING_PLAN";
  title: LocalizedText;
  subActions: ReadonlyArray<DerivedSubAction>;
};

const screeningSubActions: Record<string, ScreeningSubActionDefinition> = {
  "P6.1-A01": {
    actionCode: "P6.1-A01",
    sourceQuestionId: "p6_1_001",
    title: {
      fr: "Documenter le processus",
      en: "Document the screening process",
    },
    partialGap: {
      fr: "Processus partiellement documenté",
      en: "Partially documented screening process",
    },
    fullGap: {
      fr: "Processus de screening non documenté",
      en: "Screening process not documented",
    },
    recommendedActions: {
      fr: "Rédiger une procédure formelle précisant périmètre, rôles, sources de vérification et fréquence d’actualisation.",
      en: "Draft a formal procedure covering scope, roles, required checks, and update frequency.",
    },
    priority: "high",
    owners: ["security_owner", "hr_owner"],
    closureEvidence: {
      fr: "Procédure datée + validation du propriétaire de l’ISMS + diffusion à RH et opérationnel.",
      en: "Dated procedure + ISMS owner validation + distribution to HR and operations.",
    },
    closureCriteria: {
      fr: "Le processus de vérification est publié et utilisé.",
      en: "The screening process is published and used.",
    },
  },
  "P6.1-A02": {
    actionCode: "P6.1-A02",
    sourceQuestionId: "p6_1_002",
    title: {
      fr: "Définir la proportionnalité et le cadre juridique",
      en: "Define proportionality and legal basis",
    },
    partialGap: {
      fr: "Contrôles appliqués de façon uniforme",
      en: "Checks applied uniformly",
    },
    fullGap: {
      fr: "Absence d’adaptation des vérifications au risque et au cadre légal",
      en: "Screening checks are not adapted to risk and applicable legal requirements",
    },
    recommendedActions: {
      fr: "Mettre à jour la matrice de vérification par catégorie de rôle et sensibilités.",
      en: "Update check matrix by role risk and information sensitivity.",
    },
    priority: "high",
    owners: ["security_owner", "legal_team"],
    closureEvidence: {
      fr: "Matrice approuvée incluant critères de risque, accès et contraintes légales.",
      en: "Approved matrix including risk criteria, access levels and legal constraints.",
    },
    closureCriteria: {
      fr: "Aucun recrutement critique sans vérification adéquate selon la matrice.",
      en: "No critical hire without appropriate checks per the matrix.",
    },
  },
  "P6.1-A03": {
    actionCode: "P6.1-A03",
    sourceQuestionId: "p6_1_003",
    title: {
      fr: "Vérifier les contrôles avant accès",
      en: "Enforce checks before access",
    },
    partialGap: {
      fr: "Dérogations non encadrées ou ponctuelles",
      en: "Uncontrolled or occasional exceptions",
    },
    fullGap: {
      fr: "Attribution d’accès sans vérification préalable",
      en: "Access granted before required checks are completed",
    },
    recommendedActions: {
      fr: "Bloquer les habilitations RH/IT tant que la vérification préalable n’est pas terminée.",
      en: "Block HR/IT access provisioning until screening checks are completed.",
    },
    priority: "high",
    owners: ["security_owner", "it_owner", "hr_owner"],
    closureEvidence: {
      fr: "Journal des accès montrant validation préalable obligatoire.",
      en: "Access provisioning log showing mandatory prior validation.",
    },
    closureCriteria: {
      fr: "Aucun compte actif n’est créé avant achèvement des contrôles exigés.",
      en: "No production account is active before required checks are completed.",
    },
  },
  "P6.1-A04": {
    actionCode: "P6.1-A04",
    sourceQuestionId: "p6_1_004",
    title: {
      fr: "Mettre en place preuve et traçabilité",
      en: "Implement evidence and traceability",
    },
    partialGap: {
      fr: "Preuves incomplètes ou non uniformisées",
      en: "Incomplete or non-standardized evidence",
    },
    fullGap: {
      fr: "Absence de preuve datée et traçable",
      en: "No dated traceable screening evidence",
    },
    recommendedActions: {
      fr: "Centraliser la conservation des preuves dans un registre daté (checklists anonymisées et validations).",
      en: "Centralize evidence retention in a dated registry (anonymized checklists and approvals).",
    },
    priority: "medium",
    owners: ["hr_owner", "security_owner", "it_owner"],
    closureEvidence: {
      fr: "Registre de preuve complet et traçable, contrôlé trimestriellement.",
      en: "Complete and auditable evidence register with periodic reviews.",
    },
    closureCriteria: {
      fr: "Toutes les vérifications applicables disposent d’une trace horodatée et approuvée.",
      en: "All applicable screenings have dated and approved records.",
    },
  },
  "P6.1-A05": {
    actionCode: "P6.1-A05",
    sourceQuestionId: "p6_1_005_external",
    title: {
      fr: "Couvrir les personnes externes",
      en: "Cover external persons",
    },
    partialGap: {
      fr: "Couverture externe partielle",
      en: "Partial coverage for external persons",
    },
    fullGap: {
      fr: "Les personnes externes ne sont pas couvertes quand elles y sont exposées",
      en: "External persons are not covered where they are exposed",
    },
    recommendedActions: {
      fr: "Ajouter une clause d’extension du processus de vérification pour sous-traitants, prestataires et intérimaires.",
      en: "Extend screening process obligations for contractors, providers and temporary staff.",
    },
    priority: "medium",
    owners: ["security_owner", "legal_team", "hr_owner"],
    closureEvidence: {
      fr: "Liste mise à jour des tiers couverts + preuves de vérifications.",
      en: "Updated list of covered third parties and their screening evidence.",
    },
    closureCriteria: {
      fr: "Aucun accès sensible externe sans enregistrement de vérification approprié.",
      en: "No sensitive external access without appropriate screening records.",
    },
  },
  "P6.1-A06": {
    actionCode: "P6.1-A06",
    sourceQuestionId: "p6_1_005_role_change",
    title: {
      fr: "Gérer les changements de rôles sensibles",
      en: "Handle sensitive role changes",
    },
    partialGap: {
      fr: "Requalification des accès insuffisante",
      en: "Insufficient requalification of access",
    },
    fullGap: {
      fr: "Aucune réévaluation lors des changements de rôle sensible",
      en: "No re-screening triggered for sensitive role changes",
    },
    recommendedActions: {
      fr: "Mettre en place une revue systématique des vérifications avant l’élévation de privilèges.",
      en: "Introduce mandatory re-screening before privilege escalation.",
    },
    priority: "medium",
    owners: ["security_owner", "it_owner", "hr_owner"],
    closureEvidence: {
      fr: "Workflow d’escalade validé avec révision RH et sécurité avant changement d’accès.",
      en: "Escalation workflow with HR and security review before access changes.",
    },
    closureCriteria: {
      fr: "Toute élévation de privilège est précédée d’une réévaluation documentée.",
      en: "Every privilege increase is preceded by documented re-evaluation.",
    },
  },
} as const;

const actionByQuestionId = Object.values(screeningSubActions).reduce(
  (acc, action) => {
    acc[action.sourceQuestionId] = action;
    return acc;
  },
  {} as Record<string, ScreeningSubActionDefinition>
);

export function deriveScreeningRemediationPlan(
  responses: ScreeningResponseInput[],
): DeriveScreeningRemediationPlanResult {
  const latestResponses = new Map<string, ScreeningResponseInput>();

  for (const response of responses) {
    if (!screeningQuestions.some((question) => question.id === response.questionId)) continue;
    latestResponses.set(response.questionId, response);
  }

  const actionsByCode = new Map<string, DerivedSubAction>();

  for (const response of latestResponses.values()) {
    const outcome = deriveAssessmentOutcome({
      questionId: response.questionId,
      answer: response.answer,
      hasEvidence: Boolean(response.hasEvidence),
      justification: response.justification,
    });

    if (!outcome.isValid) {
      throw new Error(`Invalid response for question ${response.questionId}: ${outcome.errorCode}`);
    }

    if (outcome.createsGapAction === "none") continue;
    const subAction = actionByQuestionId[response.questionId];
    if (!subAction) continue;

    const gapType = outcome.createsGapAction === "partial" ? "partial" : "full";
    const existing = actionsByCode.get(subAction.actionCode);
    if (!existing) {
      actionsByCode.set(subAction.actionCode, {
        ...subAction,
        status: "active",
        gapType,
      });
    } else {
      existing.gapType = gapType;
      existing.status = "active";
    }
  }

  return {
    planCode: "A6_1_SCREENING_PLAN",
    title: {
      fr: "Mettre en place un processus complet et proportionné de vérification préalable des personnes",
      en: "Implement a complete and proportionate personnel screening process",
    },
    subActions: [...actionsByCode.values()],
  };
}

export { screeningSubActions as screeningRemediationCatalog };
