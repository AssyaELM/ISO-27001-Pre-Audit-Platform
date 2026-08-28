import { isCanonicalAssessmentQuestion } from "../assessment/gap-analysis.ts";

export type CanonicalEvidenceTheme = "organizational" | "people" | "physical" | "technological";

export type CanonicalQuestionIdentity = {
  themeId: CanonicalEvidenceTheme;
  controlId: string;
  questionId: string;
};

export function normalizeEvidenceTheme(value: string): CanonicalEvidenceTheme | null {
  const theme = value.trim().toLowerCase();
  if (theme === "organizational" || theme === "governance") return "organizational";
  if (theme === "technological" || theme === "technology") return "technological";
  if (theme === "people" || theme === "physical") return theme;
  return null;
}

export function canonicalEvidenceKey(identity: CanonicalQuestionIdentity): string {
  return `${identity.themeId}:${identity.controlId}:${identity.questionId}`;
}

export function validateCanonicalQuestionIdentity(input: {
  themeId: string;
  controlId: string;
  questionId: string;
}): CanonicalQuestionIdentity | null {
  const themeId = normalizeEvidenceTheme(input.themeId);
  const controlId = input.controlId.trim();
  const questionId = input.questionId.trim();
  if (!themeId || !controlId || !questionId) return null;
  return isCanonicalAssessmentQuestion(themeId, controlId, questionId)
    ? { themeId, controlId, questionId }
    : null;
}

