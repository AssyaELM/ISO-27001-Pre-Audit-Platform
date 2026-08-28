import { screeningAnswerValues } from "../../content/assessment/people/screening.ts";

export type ScreeningAnswerValue = (typeof screeningAnswerValues)[number];

export type ScreeningGapLevel = "no_gap" | "partial_gap" | "full_gap";

export type ScreeningReviewState =
  | "none"
  | "clarification_required"
  | "applicability_review_required";

export type ScreeningEvidenceStatus = "not_provided" | "provided" | "validated" | "rejected";

export type ScreeningOutcomeInput = {
  questionId: string;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  evidenceStatus?: ScreeningEvidenceStatus;
  justification?: string | null;
};

export type ScreeningOutcome = {
  questionId: string;
  isValid: true;
  gapLevel: ScreeningGapLevel;
  reviewState: ScreeningReviewState;
  evidenceStatus: ScreeningEvidenceStatus;
  createsGapAction: "partial" | "full" | "none";
};

export type ScreeningOutcomeInvalid = {
  questionId: string;
  isValid: false;
  errorCode: "not_applicable_requires_justification";
};

export type DeriveAssessmentOutcomeResult = ScreeningOutcome | ScreeningOutcomeInvalid;

export function deriveAssessmentOutcome(
  input: ScreeningOutcomeInput,
): DeriveAssessmentOutcomeResult {
  const hasNonEmptyJustification = Boolean(input.justification && input.justification.trim().length > 0);

  if (input.answer === "not_applicable" && !hasNonEmptyJustification) {
    return {
      questionId: input.questionId,
      isValid: false,
      errorCode: "not_applicable_requires_justification",
    };
  }

  const hasEvidence = Boolean(input.hasEvidence);
  const baseEvidenceStatus: ScreeningEvidenceStatus =
    input.evidenceStatus ?? (hasEvidence ? "provided" : "not_provided");

  switch (input.answer) {
    case "implemented":
      return {
        questionId: input.questionId,
        isValid: true,
        gapLevel: "no_gap",
        reviewState: "none",
        evidenceStatus: baseEvidenceStatus,
        createsGapAction: "none",
      };
    case "partially_implemented":
      return {
        questionId: input.questionId,
        isValid: true,
        gapLevel: "partial_gap",
        reviewState: "none",
        evidenceStatus: baseEvidenceStatus,
        createsGapAction: "partial",
      };
    case "not_implemented":
      return {
        questionId: input.questionId,
        isValid: true,
        gapLevel: "full_gap",
        reviewState: "none",
        evidenceStatus: baseEvidenceStatus,
        createsGapAction: "full",
      };
    case "not_sure":
      return {
        questionId: input.questionId,
        isValid: true,
        gapLevel: "no_gap",
        reviewState: "clarification_required",
        evidenceStatus: baseEvidenceStatus,
        createsGapAction: "none",
      };
    case "not_applicable":
      return {
        questionId: input.questionId,
        isValid: true,
        gapLevel: "no_gap",
        reviewState: "applicability_review_required",
        evidenceStatus: baseEvidenceStatus,
        createsGapAction: "none",
      };
    default:
      throw new Error(`Unsupported answer for outcome derivation: ${input.answer}`);
  }
}

export const screeningAnswerToGapOutcome = {
  implemented: { gapLevel: "no_gap", reviewState: "none", createsGapAction: "none" },
  partially_implemented: { gapLevel: "partial_gap", reviewState: "none", createsGapAction: "partial" },
  not_implemented: { gapLevel: "full_gap", reviewState: "none", createsGapAction: "full" },
  not_sure: { gapLevel: "no_gap", reviewState: "clarification_required", createsGapAction: "none" },
  not_applicable: { gapLevel: "no_gap", reviewState: "applicability_review_required", createsGapAction: "none" },
} as const satisfies Record<
  ScreeningAnswerValue,
  { gapLevel: ScreeningGapLevel; reviewState: ScreeningReviewState; createsGapAction: "partial" | "full" | "none" }
>;
