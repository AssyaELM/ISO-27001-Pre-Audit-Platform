import {
  deriveAssessmentOutcome,
  type ScreeningAnswerValue,
  type ScreeningEvidenceStatus,
} from "./outcomes.ts";

import {
  type StorageMediaQuestionId,
  A7_10_STORAGE_MEDIA_LIFECYCLE_PLAN,
  storageMediaQuestions,
  A7_10_STORAGE_MEDIA_GAP_CODES,
  resolveStorageMediaQuestions,
  type A710AssessmentContext,
} from "../../content/assessment/physical/storage-media.ts";

export type A710ResponseInput = {
  questionId: StorageMediaQuestionId;
  answer: ScreeningAnswerValue;
  hasEvidence?: boolean;
  evidenceStatus?: ScreeningEvidenceStatus;
  justification?: string | null;
};

export type A710RemediationPlanResult = {
  planCode: string;
  controlApplicability: "applicable" | "not_applicable" | "unresolved";
  controlReviewState: "none" | "clarification_required" | "applicability_review_required";
  requiresControlJustification: boolean;
  activeActions: {
    actionCode: string;
    gapCode: string;
    questionId: string;
    priority: "low" | "medium" | "high";
  }[];
};

export function deriveStorageMediaRemediationPlan(
  responses: A710ResponseInput[],
  context: A710AssessmentContext
): A710RemediationPlanResult {
  const resolution = resolveStorageMediaQuestions(context);

  const outcomes = [];

  let controlReviewState: "none" | "clarification_required" | "applicability_review_required" =
    resolution.controlReviewState;

  const responseMap = new Map<StorageMediaQuestionId, A710ResponseInput>();
  for (const response of responses) {
    responseMap.set(response.questionId, response);
  }

  for (const [questionId, response] of responseMap.entries()) {
    if (resolution.hiddenQuestionIds.includes(questionId)) {
      continue;
    }

    const questionDef = storageMediaQuestions.find((q) => q.id === questionId);
    if (!questionDef) continue;

    const outcome = deriveAssessmentOutcome({
      questionId: response.questionId,
      answer: response.answer,
      hasEvidence: Boolean(response.hasEvidence),
      evidenceStatus: response.evidenceStatus,
      justification: response.justification,
    });
    if (outcome) {
      if (outcome.isValid) {
        outcomes.push(outcome);
      } else if (outcome.errorCode === "not_applicable_requires_justification") {
        if (controlReviewState === "none") {
          controlReviewState = "applicability_review_required";
        }
      }
    }
  }

  const activeActions = [];
  const actionCodes = new Set<string>();

  for (const outcome of outcomes) {
    if (outcome.gapLevel === "no_gap") continue;

    let actionCode = "";
    let gapCode = "";
    let priority: "low" | "medium" | "high" = "high";

    if (outcome.questionId === "p7_10_001") {
      actionCode = "P7.10-A01";
      gapCode =
        outcome.gapLevel === "partial_gap"
          ? A7_10_STORAGE_MEDIA_GAP_CODES.A7_10_MEDIA_LIFECYCLE_PARTIAL
          : A7_10_STORAGE_MEDIA_GAP_CODES.A7_10_MEDIA_LIFECYCLE_ABSENT;
      priority = "high";
    } else if (outcome.questionId === "p7_10_002") {
      actionCode = "P7.10-A02";
      gapCode =
        outcome.gapLevel === "partial_gap"
          ? A7_10_STORAGE_MEDIA_GAP_CODES.A7_10_MEDIA_PROTECTION_PARTIAL
          : A7_10_STORAGE_MEDIA_GAP_CODES.A7_10_MEDIA_PROTECTION_ABSENT;
      priority = "high";
    } else if (outcome.questionId === "p7_10_003") {
      actionCode = "P7.10-A03";
      gapCode =
        outcome.gapLevel === "partial_gap"
          ? A7_10_STORAGE_MEDIA_GAP_CODES.A7_10_MEDIA_TRACEABILITY_PARTIAL
          : A7_10_STORAGE_MEDIA_GAP_CODES.A7_10_MEDIA_TRACEABILITY_ABSENT;
      priority = outcome.gapLevel === "partial_gap" ? "medium" : "high";
    } else if (outcome.questionId === "p7_10_004_removable_media") {
      actionCode = "P7.10-A04";
      gapCode =
        outcome.gapLevel === "partial_gap"
          ? A7_10_STORAGE_MEDIA_GAP_CODES.A7_10_REMOVABLE_MEDIA_PARTIAL
          : A7_10_STORAGE_MEDIA_GAP_CODES.A7_10_REMOVABLE_MEDIA_ABSENT;
      priority = "high";
    }

    if (actionCode && !actionCodes.has(actionCode)) {
      actionCodes.add(actionCode);
      activeActions.push({
        actionCode,
        gapCode,
        questionId: outcome.questionId,
        priority,
      });
    }
  }


  if (controlReviewState === "none") {
    for (const outcome of outcomes) {
      if (
        outcome.reviewState === "applicability_review_required" ||
        outcome.reviewState === "clarification_required"
      ) {
        controlReviewState = outcome.reviewState;
        break;
      }
    }
  }

  return {
    planCode: A7_10_STORAGE_MEDIA_LIFECYCLE_PLAN,
    controlApplicability: resolution.controlApplicability,
    controlReviewState,
    requiresControlJustification: resolution.requiresControlJustification,
    activeActions,
  };
}
