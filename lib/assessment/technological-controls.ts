import { technologicalControls } from "../../content/assessment/technological/technological-controls.generated.ts";
import { deriveAssessmentOutcome, type ScreeningAnswerValue } from "./outcomes.ts";

type Decision = "yes" | "no" | "not_sure";
type Context = Partial<Record<string, Decision>>;
type Control = (typeof technologicalControls)[number];
type Question = Control["questions"][number];
export type TechnologicalControlId = Control["id"];
export type TechnologicalQuestionId = Question["id"];
export type TechnologicalResponse = { questionId: TechnologicalQuestionId; answer: ScreeningAnswerValue; justification?: string | null; hasEvidence?: boolean; evidenceStatus?: Parameters<typeof deriveAssessmentOutcome>[0]["evidenceStatus"] };

function decision(value: unknown): Decision | undefined { return value === "yes" || value === "no" || value === "not_sure" ? value : undefined; }

/** Applies the required persisted → onboarding → shared precedence before UI asks Quick Context. */
export function resolveTechnologicalContext(persisted: Record<string, unknown> = {}, onboarding: Record<string, unknown> = {}, shared: Record<string, unknown> = {}) {
  const keys = new Set([...Object.keys(persisted), ...Object.keys(onboarding), ...Object.keys(shared)]);
  return Object.fromEntries([...keys].flatMap((key) => {
    const value = decision(persisted[key]) ?? decision(onboarding[key]) ?? decision(shared[key]);
    return value === undefined ? [] : [[key, value]];
  })) as Context;
}

const semanticAliases: Record<string, readonly string[]> = {
  allowsBYOD: ["allowsBYODForBusiness", "hasBYODDevices", "has_byod_devices"],
  hasBYODDevices: ["allowsBYODForBusiness", "allowsBYOD", "has_byod_devices"],
  usesPhysicalStorageMediaRequiringSecureErasure: ["usesRemovableOrPortableStorageMedia"],
  usesRemoteWork: ["hasRemoteWorking", "has_remote_working"],
  usesCloudArchitecture: ["usesCloudInfrastructure"],
};

/** Resolves persisted technological context first, then onboarding, then known semantic aliases from other themes. */
export function resolveTechnologicalAssessmentContext(
  technological: Record<string, unknown> = {},
  onboarding: Record<string, unknown> = {},
  shared: Record<string, unknown> = {},
  crossTheme: Record<string, unknown> = {},
) {
  const knownKeys = new Set(technologicalControls.flatMap((control) => [
    ...control.quickContext.map((item) => item.key),
    ...(control.applicabilityKey ? [control.applicabilityKey] : []),
  ]));
  const scoped = (source: Record<string, unknown>) => {
    const result: Record<string, unknown> = {};
    for (const key of knownKeys) if (decision(source[key]) !== undefined) result[key] = source[key];
    return result;
  };
  const normalizedShared = { ...scoped(crossTheme), ...scoped(shared) };
  for (const [key, aliases] of Object.entries(semanticAliases)) {
    if (decision(normalizedShared[key]) !== undefined) continue;
    for (const alias of aliases) {
      const value = decision(shared[alias]) ?? decision(crossTheme[alias]) ?? decision(onboarding[alias]);
      if (value !== undefined) { normalizedShared[key] = value; break; }
    }
  }
  return resolveTechnologicalContext(scoped(technological), scoped(onboarding), normalizedShared);
}

export function getTechnologicalControl(controlId: TechnologicalControlId) {
  const control = technologicalControls.find((item) => item.id === controlId);
  if (!control) throw new Error(`Unknown technological control: ${controlId}`);
  return control;
}

export function resolveTechnologicalControl(controlId: TechnologicalControlId, context: Context) {
  const control = getTechnologicalControl(controlId);
  const applicability = control.applicabilityKey ? context[control.applicabilityKey] : undefined;
  const notApplicable = applicability === "no";
  const unresolved = new Set<string>();
  if (control.applicabilityKey && (applicability === undefined || applicability === "not_sure")) unresolved.add(control.applicabilityKey);
  const questionIds: string[] = [];
  const hiddenQuestionIds: string[] = [];
  for (const question of control.questions) {
    if (notApplicable) { hiddenQuestionIds.push(question.id); continue; }
    if (!question.conditionKey) { questionIds.push(question.id); continue; }
    const value = context[question.conditionKey];
    if (value === "yes") questionIds.push(question.id);
    else { hiddenQuestionIds.push(question.id); if (value === undefined || value === "not_sure") unresolved.add(question.conditionKey); }
  }
  const requiredKeys = control.applicabilityKey && (applicability === undefined || applicability === "not_sure")
    ? [control.applicabilityKey]
    : [...unresolved];
  return {
    controlApplicability: notApplicable ? "not_applicable" as const : "applicable" as const,
    controlReviewState: notApplicable ? "applicability_review_required" : "none",
    requiresControlJustification: notApplicable,
    questionIds,
    hiddenQuestionIds,
    resolvedContext: context,
    unresolvedConditions: [...unresolved],
    requiredQuickContextQuestions: requiredKeys.map((key) => control.quickContext.find((item) => item.key === key) ?? inheritedQuickContext[key]).filter(Boolean),
    assessmentBlocked: unresolved.size > 0,
  };
}

const inheritedQuickContext: Record<string, { key: string; question: { fr: string; en: string } }> = {
  // A.8.12 reuses the already-established People A.6.7 BYOD context when available.
  hasBYODDevices: { key: "hasBYODDevices", question: { fr: "Des appareils personnels sont-ils utilisés pour accéder aux informations du périmètre ?", en: "Are personally owned devices used to access information within the assessment scope?" } },
};

export function deriveTechnologicalOutcome(controlId: TechnologicalControlId, responses: TechnologicalResponse[], context: Context) {
  const control = getTechnologicalControl(controlId);
  const resolution = resolveTechnologicalControl(controlId, context);
  const visible = new Set(resolution.questionIds);
  const byId = new Map(control.questions.map((question) => [question.id, question]));
  const latest = new Map<string, TechnologicalResponse>();
  for (const response of responses) if (visible.has(response.questionId) && byId.has(response.questionId)) latest.set(response.questionId, response);
  const gapActions = [] as Array<{ actionCode: string; sourceQuestionId: string; gapCode: string; gapType: "partial" | "full"; gap: string; remediation: string }>;
  let reviewState: string = resolution.controlReviewState;
  for (const response of latest.values()) {
    const result = deriveAssessmentOutcome(response);
    if (!result.isValid) { reviewState = "applicability_review_required"; continue; }
    if (result.reviewState !== "none") reviewState = result.reviewState;
    if (result.createsGapAction === "none") continue;
    const question = byId.get(response.questionId)!;
    const mapping = result.createsGapAction === "partial" ? question.partial : question.absent;
    gapActions.push({ actionCode: `${control.code.replace(".", "_")}_${response.questionId}`, sourceQuestionId: response.questionId, gapCode: mapping.gapCode, gapType: result.createsGapAction, gap: mapping.gap, remediation: mapping.remediation });
  }
  return { resolution, reviewState, gapActions };
}

export function deriveTechnologicalRemediationPlan(controlId: TechnologicalControlId, outcome: ReturnType<typeof deriveTechnologicalOutcome>) {
  if (!outcome.gapActions.length) return [];
  return [{ planCode: `${getTechnologicalControl(controlId).code.replace(".", "_")}_PLAN`, actions: outcome.gapActions }];
}
