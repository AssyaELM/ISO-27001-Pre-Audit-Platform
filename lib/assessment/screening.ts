import {
  type A61AssessmentContext,
  type A61QuestionResolution,
  screeningQuestionIds,
} from "../../content/assessment/people/screening.ts";

export function resolveScreeningQuestions(
  context: A61AssessmentContext = {},
): A61QuestionResolution {
  const questionIds: string[] = [...screeningQuestionIds.main];
  const hiddenQuestionIds: string[] = [];
  const unresolvedConditions: A61QuestionResolution["unresolvedConditions"] = [];

  if (context.hasExternalPersonnel === "yes") questionIds.push(screeningQuestionIds.external);
  else {
    hiddenQuestionIds.push(screeningQuestionIds.external);
    if (context.hasExternalPersonnel !== "no") unresolvedConditions.push("hasExternalPersonnel");
  }

  if (context.hasSensitiveRoleChanges === "yes") questionIds.push(screeningQuestionIds.roleChange);
  else {
    hiddenQuestionIds.push(screeningQuestionIds.roleChange);
    if (context.hasSensitiveRoleChanges !== "no") unresolvedConditions.push("hasSensitiveRoleChanges");
  }

  return {
    controlApplicability: "applicable",
    controlReviewState: "none",
    requiresControlJustification: false,
    questionIds,
    hiddenQuestionIds,
    unresolvedConditions,
    assessmentBlocked: unresolvedConditions.length > 0,
  };
}

export function filterVisibleScreeningResponses<T extends { questionId: string }>(
  responses: readonly T[],
  resolution: A61QuestionResolution,
): T[] {
  const visible = new Set(resolution.questionIds);
  return responses.filter((response) => visible.has(response.questionId));
}
