import { getRemediationData } from "@/app/api/data-fetchers";
import { NextResponse } from "next/server";

import { deriveGapAnalysis, type GapAnalysisLocale, type GapAnalysisResponse } from "@/lib/assessment/gap-analysis";
import { readAssessmentResponses } from "@/lib/assessment/responses";
import {
  isRemediationStatus,
  activeRemediationGaps,
  remediationSourceKey,
  type RemediationAction,
  type RemediationMember,
  type RemediationWorkflow,
} from "@/lib/remediation/actions";
import { getCurrentUser } from "@/lib/workspaces/authenticated-client";
import { withCanonicalEvidence } from "@/lib/evidence/repository";

type DbRow = {
  id: string;
  workspace_id: string;
  source_key: string;
  theme_id: RemediationWorkflow["theme"];
  control_id: string;
  question_id: string;
  gap_code: string;
  gap_level: RemediationWorkflow["gapLevel"];
  owner_user_id: string | null;
  due_date: string | null;
  status: RemediationWorkflow["status"];
  progress_note: string | null;
  created_at: string;
  updated_at: string;
};

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function string(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function workflow(row: DbRow): RemediationWorkflow {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    sourceKey: row.source_key,
    theme: row.theme_id,
    controlId: row.control_id,
    questionId: row.question_id,
    gapCode: row.gap_code,
    gapLevel: row.gap_level,
    ownerUserId: row.owner_user_id,
    dueDate: row.due_date,
    status: row.status,
    progressNote: row.progress_note ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function onboardingFrom(metadata: unknown) {
  const root = record(metadata);
  return record(root.normcore_onboarding ?? root.normcore_onboarding_organization);
}

function currentMember(user: { id: string; email?: string; user_metadata?: unknown }): RemediationMember {
  const metadata = record(user.user_metadata);
  const onboarding = record(metadata.normcore_onboarding);
  return {
    id: user.id,
    name: string(record(onboarding.assessment_owner).full_name)
      || string(metadata.full_name)
      || string(metadata.name)
      || user.email?.split("@")[0]
      || "Workspace owner",
    email: user.email ?? "",
    avatar: string(metadata.avatar_url),
  };
}


export async function GET(request: Request) {
  const url = new URL(request.url);
  const workspaceId = string(url.searchParams.get("workspaceId"));
  const locale: GapAnalysisLocale = url.searchParams.get("locale") === "fr" ? "fr" : "en";
  if (!workspaceId) return error("workspaceId is required", 400);

  try {
    const data = await getRemediationData(workspaceId, locale);
    return NextResponse.json(data, { status: 200 });
  } catch (cause) {
    return error(cause instanceof Error ? cause.message : "Unable to load remediation actions", 500);
  }
}

type PatchBody = {
  workspaceId?: string;
  actionId?: string;
  ownerUserId?: string | null;
  dueDate?: string | null;
  status?: string;
  progressNote?: string;
};

export async function PATCH(request: Request) {
  let body: PatchBody;
  try {
    body = await request.json() as PatchBody;
  } catch {
    return error("Invalid JSON body", 400);
  }
  const workspaceId = string(body.workspaceId);
  const actionId = string(body.actionId);
  if (!workspaceId || !actionId) return error("workspaceId and actionId are required", 400);
  if (body.status !== undefined && !isRemediationStatus(body.status)) return error("Invalid remediation status", 400);
  if (body.dueDate !== undefined && body.dueDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(body.dueDate)) return error("Invalid due date", 400);
  if (body.progressNote !== undefined && body.progressNote.length > 4000) return error("Progress note is too long", 400);

  try {
    const { client, user, error: authError } = await getCurrentUser();
    const auth = { user };
    if (authError || !auth.user) return error("Authentication required", 401);
    if (body.ownerUserId !== undefined && body.ownerUserId !== null && body.ownerUserId !== auth.user.id) {
      return error("Owner must be an active workspace member", 400);
    }

    const patch: Record<string, unknown> = {};
    if (body.ownerUserId !== undefined) patch.owner_user_id = body.ownerUserId || null;
    if (body.dueDate !== undefined) patch.due_date = body.dueDate || null;
    if (body.status !== undefined) patch.status = body.status;
    if (body.progressNote !== undefined) patch.progress_note = body.progressNote.trim() || null;
    if (!Object.keys(patch).length) return error("No remediation fields supplied", 400);

    const { data, error: updateError } = await client
      .from("remediation_actions")
      .update(patch)
      .eq("id", actionId)
      .eq("workspace_id", workspaceId)
      .select("*")
      .maybeSingle();
    if (updateError) throw updateError;
    if (!data) return error("Remediation action not found", 404);
    return NextResponse.json({ workflow: workflow(data as DbRow) }, { status: 200 });
  } catch (cause) {
    return error(cause instanceof Error ? cause.message : "Unable to update remediation action", 500);
  }
}
