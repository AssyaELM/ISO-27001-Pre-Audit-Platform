import { NextResponse } from "next/server.js";

import {
  assessmentAnswerValues,
  assessmentReviewStates,
  type AssessmentAnswerValue,
  type AssessmentReviewState,
  type AssessmentTheme,
  assessmentThemes,
} from "../../../../content/assessment-infrastructure.ts";
import { createClient as createServerClient } from "../../../../lib/supabase/server.ts";
import { getCurrentUser, isLocalSyntheticUser } from "@/lib/workspaces/authenticated-client";
import {
  AssessmentResponseValidationError,
  createOrUpdateAssessmentResponse,
  isAllowedAssessmentAnswer,
  readAssessmentResponses,
  updateAssessmentResponseStatus,
} from "../../../../lib/assessment/responses.ts";
import {
  deriveTechnologicalOutcome,
  deriveTechnologicalRemediationPlan,
  resolveTechnologicalAssessmentContext,
  resolveTechnologicalControl,
  type TechnologicalControlId,
} from "../../../../lib/assessment/technological-controls.ts";
import {
  deriveOrganizationalOutcome,
  deriveOrganizationalRemediationPlan,
  resolveOrganizationalAssessmentContext,
  resolveOrganizationalControl,
  type OrganizationalControlId,
} from "../../../../lib/assessment/organizational-controls.ts";
import { withCanonicalEvidence } from "../../../../lib/evidence/repository.ts";

const validReviewStatuses = new Set<AssessmentReviewState>(assessmentReviewStates);

const errorResponse = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function GET(request: Request) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId")?.trim() ?? "";

  if (!workspaceId) {
    return errorResponse("workspaceId is required", 400);
  }

  try {
    const { client, user } = await getCurrentUser();
    if (!user) {
      return errorResponse("Authentication required", 401);
    }

    const responses = await readAssessmentResponses(client, workspaceId);
    return NextResponse.json({ responses }, { status: 200 });
  } catch (error) {
    console.error("GET /api/assessment/responses error:", error);
    const message = error instanceof Error ? error.message : "Failed to load responses";
    return errorResponse(message, 500);
  }
}

type PostPayload = {
  workspaceId?: string;
  theme?: string;
  controlId?: string;
  questionId?: string;
  answer?: string;
  justification?: string;
  comment?: string;
  evidenceReference?: string;
  controlApplicability?: string;
  controlApplicabilityJustification?: string;
};

type AssessmentApiClient = Awaited<ReturnType<typeof createServerClient>>;
type AssessmentApiClientFactory = () => Promise<AssessmentApiClient>;

const CONTROL_LEVEL_APPLICABILITY_KEYS = {
  "a5-8": "managesProjectsInIsmsScope",
  "a5-19": "usesInScopeSuppliersOrExternalServices",
  "a5-20": "usesInScopeSuppliersOrExternalServices",
  "a5-21": "usesIctSuppliersInScope",
  "a5-22": "usesIctSuppliersInScope",
  "a5-23": "usesCloudServicesInScope",
  "a5-30": "dependsOnIctForCriticalActivities",
  "a5-34": "processesPIIInScope",
} as const satisfies Partial<Record<OrganizationalControlId, string>>;
const CONTROL_APPLICABILITY_JUSTIFICATIONS_KEY = "control_applicability_justifications";

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
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

function readControlApplicabilityJustification(
  organizational: Record<string, unknown>,
  controlId: string,
) {
  const justifications = asRecord(organizational[CONTROL_APPLICABILITY_JUSTIFICATIONS_KEY]);
  const value = justifications[controlId];
  return typeof value === "string" ? value.trim() : "";
}

async function handleAssessmentPost(
  request: Request,
  clientFactory: AssessmentApiClientFactory = createServerClient,
) {
  let payload: PostPayload;
  try {
    payload = (await request.json()) as PostPayload;
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const workspaceId = payload.workspaceId?.trim() ?? "";
  const theme = (payload.theme ?? "").trim();
  const controlId = payload.controlId?.trim() ?? "";
  const questionId = payload.questionId?.trim() ?? "";
  const answer = payload.answer?.trim() ?? "";
  const justification = payload.justification?.trim();
  const controlApplicability = payload.controlApplicability?.trim() ?? "";
  const controlApplicabilityJustification = payload.controlApplicabilityJustification?.trim() ?? "";
  const isControlApplicabilityRequest = Boolean(
    payload.controlApplicability !== undefined
    || payload.controlApplicabilityJustification !== undefined,
  );

  if (!workspaceId || !theme || !controlId || (!isControlApplicabilityRequest && !questionId)) {
    return errorResponse(
      isControlApplicabilityRequest
        ? "workspaceId, theme, controlId are required"
        : "workspaceId, theme, controlId, questionId are required",
      400,
    );
  }

  if (!assessmentThemes.includes(theme as AssessmentTheme)) {
    return errorResponse("Invalid theme", 400);
  }

  if (
    !isControlApplicabilityRequest
    && (!assessmentAnswerValues.includes(answer as AssessmentAnswerValue) || !isAllowedAssessmentAnswer(answer))
  ) {
    return errorResponse("Invalid answer value", 400);
  }

  if (!isControlApplicabilityRequest && answer === "not_applicable" && !justification) {
    return errorResponse("not_applicable requires justification", 400);
  }

  if (isControlApplicabilityRequest) {
    if (
      (theme !== "organizational" && theme !== "governance")
      || !(controlId in CONTROL_LEVEL_APPLICABILITY_KEYS)
    ) {
      return errorResponse("Control-level applicability is not supported for this control", 400);
    }
    if (controlApplicability !== "not_applicable") {
      return errorResponse("controlApplicability must be not_applicable", 400);
    }
    if (!controlApplicabilityJustification) {
      return errorResponse("Control-level not_applicable requires justification", 400);
    }
  }

  try {
    const client = await clientFactory();
    const { data: session } = await client.auth.getUser();
    const fallback = session?.user ? null : await getCurrentUser();
    const activeClient = session?.user ? client : fallback?.client;
    const activeUser = session?.user ?? fallback?.user ?? null;
    if (!activeUser || !activeClient) {
      return errorResponse("Authentication required", 401);
    }

    if (isControlApplicabilityRequest) {
      const applicabilityControlId = controlId as keyof typeof CONTROL_LEVEL_APPLICABILITY_KEYS;
      const applicabilityKey = CONTROL_LEVEL_APPLICABILITY_KEYS[applicabilityControlId];
      const metadata = asRecord(activeUser.user_metadata);
      const onboarding = asRecord(metadata.normcore_onboarding);
      const assessment = asRecord(onboarding.assessment_context);
      const persistedOrganizational = asRecord(assessment.organizational);
      const shared = asRecord(assessment.shared_context);
      const crossTheme = assessmentCrossThemeContext(assessment);
      const { context } = resolveOrganizationalAssessmentContext(
        persistedOrganizational,
        onboarding,
        shared,
        crossTheme,
      );
      if (context[applicabilityKey] !== "no") {
        return errorResponse(
          `${controlId} control-level not_applicable requires ${applicabilityKey} == no`,
          400,
        );
      }

      const priorJustifications = asRecord(
        persistedOrganizational[CONTROL_APPLICABILITY_JUSTIFICATIONS_KEY],
      );
      const nextOrganizational = {
        ...persistedOrganizational,
        [CONTROL_APPLICABILITY_JUSTIFICATIONS_KEY]: {
          ...priorJustifications,
          [applicabilityControlId]: controlApplicabilityJustification,
        },
      };
      const nextOnboarding = {
        ...onboarding,
        assessment_context: {
          ...assessment,
          organizational: nextOrganizational,
        },
      };
      if (!isLocalSyntheticUser(activeUser)) {
        const { error: metadataError } = await activeClient.auth.updateUser({
          data: { normcore_onboarding: nextOnboarding },
        });
        if (metadataError) throw metadataError;
      }

      const outcome = deriveOrganizationalOutcome(
        applicabilityControlId,
        [],
        context,
        controlApplicabilityJustification,
      );
      const response = NextResponse.json({
        controlId: applicabilityControlId,
        controlApplicability: "not_applicable",
        controlApplicabilityJustification,
        organizational: {
          outcome,
          remediationPlan: deriveOrganizationalRemediationPlan(applicabilityControlId, outcome),
        },
      }, { status: 200 });
      if (isLocalSyntheticUser(activeUser)) {
        response.cookies.set("normcore-local-auth", "1", { path: "/", sameSite: "lax" });
        if (activeUser.email) {
          response.cookies.set("normcore-local-auth-email", activeUser.email, { path: "/", sameSite: "lax" });
        }
        response.cookies.set(
          "normcore-local-workspace-metadata",
          encodeURIComponent(JSON.stringify({
            ...metadata,
            normcore_onboarding: nextOnboarding,
          })),
          { path: "/", sameSite: "lax" },
        );
      }
      return response;
    }

    let technologicalResult: { outcome: ReturnType<typeof deriveTechnologicalOutcome>; remediationPlan: ReturnType<typeof deriveTechnologicalRemediationPlan> } | undefined;
    let organizationalResult: { outcome: ReturnType<typeof deriveOrganizationalOutcome>; remediationPlan: ReturnType<typeof deriveOrganizationalRemediationPlan> } | undefined;
    if (theme === "technology") {
      const onboarding = ((activeUser.user_metadata as Record<string, unknown>).normcore_onboarding ?? {}) as Record<string, unknown>;
      const assessment = (onboarding.assessment_context ?? {}) as Record<string, unknown>;
      const technological = (assessment.technological ?? {}) as Record<string, unknown>;
      const shared = (assessment.shared_context ?? {}) as Record<string, unknown>;
      const crossTheme = {
        ...asRecord(assessment.people),
        ...asRecord(assessment.remote_working),
        ...asRecord(assessment.physical),
        ...asRecord(assessment.organizational),
      };
      const context = resolveTechnologicalAssessmentContext(technological, onboarding, shared, crossTheme);
      const resolution = resolveTechnologicalControl(controlId as TechnologicalControlId, context);
      if (!resolution.questionIds.includes(questionId)) return errorResponse("Question is not currently applicable or visible", 400);
      const existing = await withCanonicalEvidence(
        client,
        workspaceId,
        await readAssessmentResponses(client, workspaceId),
      );
      const prior = existing
        .filter((item) => item.theme === "technology" && item.controlId === controlId && item.questionId !== questionId)
        .map((item) => ({ questionId: item.questionId as never, answer: item.answer, justification: item.justification, hasEvidence: item.hasCanonicalEvidence }));
      const outcome = deriveTechnologicalOutcome(controlId as TechnologicalControlId, [...prior, { questionId: questionId as never, answer: answer as AssessmentAnswerValue, justification }], context);
      technologicalResult = { outcome, remediationPlan: deriveTechnologicalRemediationPlan(controlId as TechnologicalControlId, outcome) };
    }
    if (theme === "organizational" || theme === "governance") {
      const onboarding = ((activeUser.user_metadata as Record<string, unknown>).normcore_onboarding ?? {}) as Record<string, unknown>;
      const assessment = (onboarding.assessment_context ?? {}) as Record<string, unknown>;
      const persistedOrganizational = (assessment.organizational ?? {}) as Record<string, unknown>;
      const shared = (assessment.shared_context ?? {}) as Record<string, unknown>;
      const crossTheme = assessmentCrossThemeContext(assessment);
      const { context } = resolveOrganizationalAssessmentContext(
        persistedOrganizational,
        onboarding,
        shared,
        crossTheme,
      );
      const applicabilityKey = CONTROL_LEVEL_APPLICABILITY_KEYS[
        controlId as keyof typeof CONTROL_LEVEL_APPLICABILITY_KEYS
      ];
      const storedControlJustification = applicabilityKey && context[applicabilityKey] === "no"
        ? readControlApplicabilityJustification(persistedOrganizational, controlId)
        : "";
      const resolution = resolveOrganizationalControl(
        controlId as OrganizationalControlId,
        context,
        storedControlJustification,
      );
      if (!resolution.questionIds.includes(questionId as never)) {
        return errorResponse("Question is not currently applicable or visible", 400);
      }
      const existing = await withCanonicalEvidence(
        client,
        workspaceId,
        await readAssessmentResponses(client, workspaceId),
      );
      const prior = existing
        .filter((item) => (item.theme === "organizational" || item.theme === "governance") && item.controlId === controlId && item.questionId !== questionId)
        .map((item) => ({
          questionId: item.questionId as never,
          answer: item.answer,
          justification: item.justification,
          hasEvidence: item.hasCanonicalEvidence,
        }));
      const outcome = deriveOrganizationalOutcome(
        controlId as OrganizationalControlId,
        [...prior, { questionId: questionId as never, answer: answer as AssessmentAnswerValue, justification }],
        context,
        storedControlJustification,
      );
      organizationalResult = {
        outcome,
        remediationPlan: deriveOrganizationalRemediationPlan(controlId as OrganizationalControlId, outcome),
      };
    }
    const response = await createOrUpdateAssessmentResponse(client, {
      workspaceId,
      theme: theme as AssessmentTheme,
      controlId,
      questionId,
      answer: answer as AssessmentAnswerValue,
      justification,
      comment: payload.comment?.trim(),
      evidenceReference: payload.evidenceReference?.trim(),
    });

    return NextResponse.json(
      organizationalResult
        ? { ...response, organizational: organizationalResult }
        : technologicalResult
          ? { ...response, technological: technologicalResult }
          : response,
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AssessmentResponseValidationError) {
      return errorResponse(error.reason, 400);
    }

    const message = error instanceof Error ? error.message : "Failed to save response";
    return errorResponse(message, 400);
  }
}

type AssessmentRouteContext = {
  params: Promise<Record<string, string | string[] | undefined>>;
  /** Used by integration QA; Next.js production calls omit it. */
  clientFactory?: AssessmentApiClientFactory;
};

export async function POST(request: Request, routeContext: AssessmentRouteContext) {
  return handleAssessmentPost(request, routeContext.clientFactory ?? createServerClient);
}

type PatchPayload = {
  responseId?: string;
  reviewStatus?: string;
};

export async function PATCH(request: Request) {
  let payload: PatchPayload;
  try {
    payload = (await request.json()) as PatchPayload;
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const responseId = payload.responseId?.trim() ?? "";
  const reviewStatus = payload.reviewStatus?.trim() ?? "";
  if (!responseId || !reviewStatus) {
    return errorResponse("responseId and reviewStatus are required", 400);
  }
  if (!validReviewStatuses.has(reviewStatus as AssessmentReviewState)) {
    return errorResponse("Invalid review status", 400);
  }

  try {
    const { client, user } = await getCurrentUser();
    if (!user) {
      return errorResponse("Authentication required", 401);
    }

    const response = await updateAssessmentResponseStatus(
      client,
      responseId,
      reviewStatus as AssessmentReviewState,
    );
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof AssessmentResponseValidationError) {
      return errorResponse(error.reason, 400);
    }

    const message = error instanceof Error ? error.message : "Failed to update response status";
    if (message.includes("cannot validate") || message.includes("validation permissions")) {
      return errorResponse(message, 403);
    }
    if (message.includes("not member")) {
      return errorResponse(message, 403);
    }
    return errorResponse(message, 400);
  }
}
