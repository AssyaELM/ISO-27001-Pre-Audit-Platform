import type { SupabaseClient } from "@supabase/supabase-js";

import {
  type AssessmentAnswerInput,
  type AssessmentAnswerValue,
  type AssessmentAnswerRecord,
  type AssessmentReviewState,
  type AssessmentTheme,
  assessmentAnswerValues,
  assessmentAnswerDefinitions,
  readinessFromAnswer,
} from "../../content/assessment-infrastructure.ts";

type AssessmentResponsesDbRow = {
  id: string;
  workspace_id: string;
  theme_id: string;
  control_id: string;
  question_id: string;
  answer: AssessmentAnswerValue;
  justification: string | null;
  comment: string | null;
  evidence_reference: string | null;
  review_status: AssessmentReviewState;
  responded_by: string;
  responded_at: string;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
};

const validAnswerSet = new Set<string>(assessmentAnswerValues);

export function isAllowedAssessmentAnswer(answer: unknown): answer is AssessmentAnswerValue {
  return typeof answer === "string" && validAnswerSet.has(answer);
}

function isStatusAllowed(status: string): status is AssessmentReviewState {
  return status === "draft" || status === "submitted" || status === "validated" || status === "rejected";
}

function toRecord(row: AssessmentResponsesDbRow): AssessmentAnswerRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    theme: row.theme_id as AssessmentTheme,
    controlId: row.control_id,
    questionId: row.question_id,
    answer: row.answer,
    status: row.review_status,
    answerSetAt: row.responded_at,
    evidenceReference: row.evidence_reference ?? undefined,
    justification: row.justification,
    comment: row.comment,
    reviewedBy: row.validated_by,
    reviewedAt: row.validated_at,
    createdByUserId: row.responded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class AssessmentResponseValidationError extends Error {
  public readonly reason: string;

  constructor(reason: string) {
    super(reason);
    this.reason = reason;
    this.name = "AssessmentResponseValidationError";
  }
}

export function validateProgressInputs(totalQuestions: number, answeredQuestions: number): number {
  if (!Number.isFinite(totalQuestions) || totalQuestions <= 0) return 0;
  if (!Number.isFinite(answeredQuestions) || answeredQuestions < 0) return 0;
  return Math.min(100, Math.round((answeredQuestions / totalQuestions) * 100));
}

export function computeOverallProgress(
  rows: Array<{ answer: AssessmentAnswerValue | null }>,
  totalQuestions: number,
): number {
  const answered = rows.filter((row) => row.answer !== null).length;
  return validateProgressInputs(totalQuestions, answered);
}

export function calculateMissingQuestions(totalQuestions: number, rows: AssessmentAnswerRecord[]) {
  if (!Number.isFinite(totalQuestions) || totalQuestions <= 0) return 0;
  return Math.max(0, totalQuestions - rows.length);
}

export async function readAssessmentResponses(
  client: SupabaseClient,
  workspaceId: string,
): Promise<AssessmentAnswerRecord[]> {
  const { data, error } = await client
    .from("assessment_responses")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (error) throw error;
  return (data ?? []).map((row) => toRecord(row as AssessmentResponsesDbRow));
}

export async function readResponsesWithProgress(
  client: SupabaseClient,
  workspaceId: string,
  expectedTotalQuestions = 0,
) {
  const responses = await readAssessmentResponses(client, workspaceId);
  const overallProgress = computeOverallProgress(
    responses.map((response) => ({ answer: response.answer })),
    expectedTotalQuestions,
  );
  const missing = calculateMissingQuestions(expectedTotalQuestions, responses);
  return {
    responses,
    overallProgress,
    answered: Math.max(0, expectedTotalQuestions - missing),
    missing,
  };
}

export async function createOrUpdateAssessmentResponse(
  client: SupabaseClient,
  input: AssessmentAnswerInput,
): Promise<AssessmentAnswerRecord> {
  const workspaceId = input.workspaceId?.trim();
  const theme = input.theme;
  const controlId = input.controlId?.trim();
  const questionId = input.questionId?.trim();

  if (!workspaceId) throw new AssessmentResponseValidationError("workspaceId is required");
  if (!theme) throw new AssessmentResponseValidationError("theme is required");
  if (!controlId) throw new AssessmentResponseValidationError("controlId is required");
  if (!questionId) throw new AssessmentResponseValidationError("questionId is required");
  if (!isAllowedAssessmentAnswer(input.answer)) throw new AssessmentResponseValidationError("Invalid answer value");

  if (input.answer === "not_applicable" && !input.justification?.trim()) {
    throw new AssessmentResponseValidationError("not_applicable requires justification");
  }

  const payload = {
    workspace_id: workspaceId,
    theme_id: input.theme,
    control_id: controlId,
    question_id: questionId,
    answer: input.answer,
    justification: input.justification ?? null,
    comment: input.comment ?? null,
    review_status: "draft" as AssessmentReviewState,
    ...(input.evidenceReference !== undefined
      ? { evidence_reference: input.evidenceReference }
      : {}),
  };

  const { data, error } = await client
    .from("assessment_responses")
    .upsert(payload, {
      onConflict: "workspace_id,question_id",
      ignoreDuplicates: false,
    })
    .select("*")
    .single();

  if (error) throw error;
  return toRecord(data as AssessmentResponsesDbRow);
}

export async function updateAssessmentResponseStatus(
  client: SupabaseClient,
  responseId: string,
  reviewStatus: AssessmentReviewState,
): Promise<AssessmentAnswerRecord> {
  if (!responseId?.trim() || !reviewStatus) throw new AssessmentResponseValidationError("Missing required fields");
  if (!isStatusAllowed(reviewStatus)) throw new AssessmentResponseValidationError("Invalid review status");

  const { error: fetchError } = await client
    .from("assessment_responses")
    .select("id")
    .eq("id", responseId)
    .single();

  if (fetchError) throw fetchError;

  const { data, error } = await client
    .from("assessment_responses")
    .update({ review_status: reviewStatus })
    .eq("id", responseId)
    .select("*")
    .single();

  if (error) throw error;
  return toRecord(data as AssessmentResponsesDbRow);
}

export function computeQuestionReadiness(answer: AssessmentAnswerValue | null, notApplicableValidated: boolean) {
  return readinessFromAnswer(answer, { notApplicableValidated });
}

export function requiresJustificationForAnswer(answer: AssessmentAnswerValue): boolean {
  return assessmentAnswerDefinitions[answer].requiresJustification;
}

export function answerStatusFromResponseRow(row: AssessmentResponsesDbRow): {
  answer: AssessmentAnswerValue | null;
  reviewStatus: AssessmentReviewState;
} {
  return {
    answer: row.answer,
    reviewStatus: row.review_status,
  };
}
