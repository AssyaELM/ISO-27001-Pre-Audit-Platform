export const assessmentAnswerValues = [
  "implemented",
  "partially_implemented",
  "not_implemented",
  "not_sure",
  "not_applicable",
] as const;

export type AssessmentAnswerValue = (typeof assessmentAnswerValues)[number];

export const assessmentReviewStates = [
  "draft",
  "submitted",
  "validated",
  "rejected",
] as const;

export type AssessmentReviewState = (typeof assessmentReviewStates)[number];

// `organizational` is the canonical Annex A.5 theme id. `governance` remains
// accepted for backward compatibility with responses created before that naming was aligned.
export const assessmentThemes = ["organizational", "governance", "people", "physical", "technology"] as const;

export type AssessmentTheme = (typeof assessmentThemes)[number];

export type UserRole = "workspace_owner" | "isms_manager" | "security_lead" | "auditor" | "viewer";

export interface AssessmentAnswerRecord {
  id: string;
  workspaceId: string;
  theme: AssessmentTheme;
  controlId: string;
  questionId: string;
  answer: AssessmentAnswerValue;
  status: AssessmentReviewState;
  answerSetAt: string;
  evidenceReference?: string;
  hasCanonicalEvidence?: boolean;
  evidenceCount?: number;
  justification?: string | null;
  comment?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentAnswerInput {
  workspaceId: string;
  theme: AssessmentTheme;
  controlId: string;
  questionId: string;
  answer: AssessmentAnswerValue;
  justification?: string;
  comment?: string;
  evidenceReference?: string;
}

export type AnswerUiLabels = {
  label: string;
  dbValue: AssessmentAnswerValue;
  requiresJustification: boolean;
  excludesFromReadiness: boolean;
};

export const assessmentAnswerDefinitions: Record<AssessmentAnswerValue, AnswerUiLabels> = {
  implemented: {
    label: "Implemented",
    dbValue: "implemented",
    requiresJustification: false,
    excludesFromReadiness: false,
  },
  partially_implemented: {
    label: "Partially implemented",
    dbValue: "partially_implemented",
    requiresJustification: true,
    excludesFromReadiness: false,
  },
  not_implemented: {
    label: "Not implemented",
    dbValue: "not_implemented",
    requiresJustification: true,
    excludesFromReadiness: false,
  },
  not_sure: {
    label: "Not sure",
    dbValue: "not_sure",
    requiresJustification: true,
    excludesFromReadiness: false,
  },
  not_applicable: {
    label: "Not applicable",
    dbValue: "not_applicable",
    requiresJustification: true,
    excludesFromReadiness: true,
  },
};

export type QuestionReadiness = "ready" | "not_started" | "partial" | "gap" | "requires_review" | "excluded";

export function readinessFromAnswer(
  answer: AssessmentAnswerValue | null,
  context: { notApplicableValidated: boolean },
): QuestionReadiness {
  if (!answer) return "not_started";
  if (answer === "implemented") return "ready";
  if (answer === "partially_implemented") return "partial";
  if (answer === "not_sure") return "requires_review";
  if (answer === "not_implemented") return "gap";
  if (answer === "not_applicable") return context.notApplicableValidated ? "excluded" : "requires_review";
  return "not_started";
}

export const assessmentPermissionMatrix: Record<UserRole, {
  canCreate: boolean;
  canEditDraft: boolean;
  canValidate: boolean;
  canReject: boolean;
}> = {
  workspace_owner: { canCreate: true, canEditDraft: true, canValidate: false, canReject: false },
  isms_manager: { canCreate: true, canEditDraft: true, canValidate: true, canReject: true },
  security_lead: { canCreate: true, canEditDraft: true, canValidate: true, canReject: true },
  auditor: { canCreate: false, canEditDraft: false, canValidate: false, canReject: false },
  viewer: { canCreate: false, canEditDraft: false, canValidate: false, canReject: false },
};

export function canCreateOrEditByRole(role: UserRole, status: AssessmentReviewState): boolean {
  if (status === "validated") return false;
  return Boolean(assessmentPermissionMatrix[role]?.canCreate || assessmentPermissionMatrix[role]?.canEditDraft);
}

export function canValidateOrRejectByRole(role: UserRole): boolean {
  const rights = assessmentPermissionMatrix[role];
  return Boolean(rights.canValidate || rights.canReject);
}

export type AssessmentProgress = {
  totalQuestions: number;
  answeredQuestions: number;
  weightedScore: number;
};

export function calculateProgress(totalQuestions: number, answeredQuestions: number, weightedScore: number): number {
  if (!Number.isFinite(totalQuestions) || totalQuestions <= 0) return 0;
  const safeAnswers = Math.max(0, answeredQuestions);
  const safeTotal = Math.max(1, totalQuestions);
  const result = Math.max(0, Math.min(100, Math.round((safeAnswers / safeTotal) * 100)));
  if (Number.isNaN(weightedScore)) return result;
  return result;
}
