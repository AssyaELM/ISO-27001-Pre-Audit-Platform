import type { AssessmentAnswerValue, AssessmentReviewState } from "../../content/assessment-infrastructure.ts";
import { organizationalControls } from "../../content/assessment/organizational/organizational-controls.ts";
import {
  resolveOrganizationalAssessmentContext,
  resolveOrganizationalControl,
  type OrganizationalControlId,
} from "./organizational-controls.ts";

export type OrganizationalControlStatus = "notStarted" | "inProgress" | "review" | "gap" | "completed";

export type OrganizationalPresentationResponse = {
  controlId: string;
  questionId: string;
  answer: AssessmentAnswerValue;
  justification?: string | null;
  status?: AssessmentReviewState | string;
  answeredAt?: string;
  evidenceReference?: string | null;
};

export const ORGANIZATIONAL_CONTROL_ACTIVITY_KEY = "control_activity";
export const ORGANIZATIONAL_CONTROL_JUSTIFICATIONS_KEY = "control_applicability_justifications";

const controlIds = new Set<string>(organizationalControls.map((control) => control.id));

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asTimestamp(value: unknown): string {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return "";
  return value;
}

function timestampValue(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function assessmentCrossThemeContext(assessment: Record<string, unknown>) {
  return {
    ...asRecord(assessment.people),
    ...asRecord(assessment.screening),
    ...asRecord(assessment.employment_terms),
    ...asRecord(assessment.awareness_training),
    ...asRecord(assessment.disciplinary_process),
    ...asRecord(assessment.post_employment),
    ...asRecord(assessment.confidentiality_agreements),
    ...asRecord(assessment.event_reporting),
    ...asRecord(assessment.remote_working),
    ...asRecord(assessment.physical),
    ...asRecord(assessment.technological),
    ...asRecord(assessment.technology),
  };
}

export function isOrganizationalControlId(value: string): value is OrganizationalControlId {
  return controlIds.has(value);
}

export function organizationalControlHref(controlId: OrganizationalControlId) {
  return `/assessment/organizational/${controlId}`;
}

export function organizationalStartHref() {
  return organizationalControlHref(organizationalControls[0].id);
}

export function markOrganizationalControlActivity(
  persistedOrganizational: Record<string, unknown>,
  controlId: OrganizationalControlId,
  answeredAt = new Date().toISOString(),
) {
  return {
    ...persistedOrganizational,
    [ORGANIZATIONAL_CONTROL_ACTIVITY_KEY]: {
      ...asRecord(persistedOrganizational[ORGANIZATIONAL_CONTROL_ACTIVITY_KEY]),
      [controlId]: answeredAt,
    },
  };
}

type PresentationInput = {
  persistedOrganizational?: Record<string, unknown>;
  onboarding?: Record<string, unknown>;
  sharedContext?: Record<string, unknown>;
  crossThemeContext?: Record<string, unknown>;
  responses?: OrganizationalPresentationResponse[];
};

export function deriveOrganizationalPresentation({
  persistedOrganizational = {},
  onboarding = {},
  sharedContext = {},
  crossThemeContext = {},
  responses = [],
}: PresentationInput) {
  const { context } = resolveOrganizationalAssessmentContext(
    persistedOrganizational,
    onboarding,
    sharedContext,
    crossThemeContext,
  );
  const justifications = asRecord(persistedOrganizational[ORGANIZATIONAL_CONTROL_JUSTIFICATIONS_KEY]);
  const activity = asRecord(persistedOrganizational[ORGANIZATIONAL_CONTROL_ACTIVITY_KEY]);
  const canonicalResponses = responses.filter((response) => isOrganizationalControlId(response.controlId));

  const controls = organizationalControls.map((control, index) => {
    const justification = typeof justifications[control.id] === "string"
      ? (justifications[control.id] as string).trim()
      : "";
    const resolution = resolveOrganizationalControl(control.id, context, justification);
    const visibleIds = new Set<string>(resolution.questionIds);
    const controlResponses = canonicalResponses.filter((response) => response.controlId === control.id);
    const visibleResponses = controlResponses.filter((response) => visibleIds.has(response.questionId));
    const activityAt = asTimestamp(activity[control.id]);
    const latestResponseAt = controlResponses.reduce((latest, response) => {
      const answeredAt = asTimestamp(response.answeredAt);
      return timestampValue(answeredAt) > timestampValue(latest) ? answeredAt : latest;
    }, "");
    const started = controlResponses.length > 0
      || Boolean(activityAt)
      || (resolution.controlReviewState === "applicability_review_required" && Boolean(justification));

    let status: OrganizationalControlStatus;
    if (resolution.controlReviewState === "applicability_review_required" && justification) {
      status = "review";
    } else if (visibleResponses.length === 0) {
      status = started ? "inProgress" : "notStarted";
    } else if (resolution.assessmentBlocked || visibleResponses.length < visibleIds.size) {
      status = "inProgress";
    } else if (visibleResponses.some((response) => response.answer === "not_sure" || response.answer === "not_applicable")) {
      status = "review";
    } else if (visibleResponses.some((response) => response.answer === "partially_implemented" || response.answer === "not_implemented")) {
      status = "gap";
    } else {
      status = "completed";
    }

    const lastStartedAt = timestampValue(activityAt) > timestampValue(latestResponseAt) ? activityAt : latestResponseAt;
    return {
      id: control.id,
      index,
      status,
      started,
      lastStartedAt,
      resolution,
      visibleResponses,
      visibleQuestionCount: visibleIds.size,
      justification,
    };
  });

  const completedControlCount = controls.filter((control) => control.status === "completed" || control.status === "gap").length;
  const startedControls = controls.filter((control) => control.started);
  const continueControl = [...startedControls].sort((left, right) => {
    const leftTimestamp = timestampValue(left.lastStartedAt);
    const rightTimestamp = timestampValue(right.lastStartedAt);
    if (leftTimestamp === rightTimestamp) return right.index - left.index;
    if (rightTimestamp === Number.NEGATIVE_INFINITY) return -1;
    if (leftTimestamp === Number.NEGATIVE_INFINITY) return 1;
    return rightTimestamp - leftTimestamp;
  })[0];
  const activeResponses = controls.flatMap((control) => control.visibleResponses);

  return {
    context,
    controls,
    startedControls,
    activeResponses,
    completedControlCount,
    progress: Math.round((completedControlCount / organizationalControls.length) * 100),
    startHref: organizationalStartHref(),
    continueHref: continueControl ? organizationalControlHref(continueControl.id) : organizationalStartHref(),
  };
}

export function deriveOrganizationalPresentationFromOnboarding(
  onboarding: Record<string, unknown>,
  responses: OrganizationalPresentationResponse[] = [],
) {
  const assessment = asRecord(onboarding.assessment_context);
  return deriveOrganizationalPresentation({
    persistedOrganizational: asRecord(assessment.organizational),
    onboarding,
    sharedContext: asRecord(assessment.shared_context),
    crossThemeContext: assessmentCrossThemeContext(assessment),
    responses,
  });
}
