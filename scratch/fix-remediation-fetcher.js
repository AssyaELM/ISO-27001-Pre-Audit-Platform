const fs = require("fs");
const fetchersFile = "app/api/data-fetchers.ts";
let code = fs.readFileSync(fetchersFile, "utf8");

// Delete the old getRemediationData block
const startIdx = code.indexOf("export async function getRemediationData");
if (startIdx !== -1) {
  code = code.substring(0, startIdx);
}

// Add the correct one
const correctLogic = `
import { deriveGapAnalysis, type GapAnalysisLocale, type GapAnalysisResponse } from "@/lib/assessment/gap-analysis";
import { readAssessmentResponses } from "@/lib/assessment/responses";
import { activeRemediationGaps, remediationSourceKey, type RemediationAction, type RemediationMember, type RemediationWorkflow } from "@/lib/remediation/actions";
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
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function string(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
    name: string(record(onboarding.assessment_owner).full_name) || string(metadata.full_name) || string(metadata.name) || user.email?.split("@")[0] || "Workspace owner",
    email: user.email ?? "",
    avatar: string(metadata.avatar_url),
  };
}

export async function getRemediationData(workspaceId: string, locale: GapAnalysisLocale = "en") {
  const { client, user, error: authError } = await getCurrentUser();
  if (authError || !user) throw new Error("Authentication required");

  const { data: workspace, error: workspaceError } = await client
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (workspaceError) throw workspaceError;
  if (!workspace) throw new Error("Workspace access denied");

  const responses = await withCanonicalEvidence(
    client,
    workspaceId,
    await readAssessmentResponses(client, workspaceId),
  );
  const onboarding = onboardingFrom(user.user_metadata);
  const gapResponses: GapAnalysisResponse[] = responses.map((row) => ({
    controlId: row.controlId,
    questionId: row.questionId,
    answer: row.answer,
    theme: row.theme,
    justification: row.justification,
    hasCanonicalEvidence: row.hasCanonicalEvidence,
  }));
  const gaps = activeRemediationGaps(deriveGapAnalysis(gapResponses, onboarding, locale));

  if (gaps.length) {
    const seeds = gaps.map((item) => ({
      workspace_id: workspaceId,
      source_key: remediationSourceKey(item),
      theme_id: item.theme,
      control_id: item.controlId,
      question_id: item.questionId,
      gap_code: item.gapCode?.trim() || "no-gap-code",
      gap_level: item.status,
    }));
    const { error: seedError } = await client
      .from("remediation_actions")
      .upsert(seeds, { onConflict: "workspace_id,source_key", ignoreDuplicates: true });
    if (seedError) throw seedError;
  }

  const sourceKeys = gaps.map(remediationSourceKey);
  let rows: DbRow[] = [];
  if (sourceKeys.length) {
    const { data, error: rowsError } = await client
      .from("remediation_actions")
      .select("*")
      .eq("workspace_id", workspaceId)
      .in("source_key", sourceKeys);
    if (rowsError) throw rowsError;
    rows = (data ?? []) as DbRow[];
  }

  const bySource = new Map(rows.map((row) => [row.source_key, workflow(row)]));
  const actions = gaps.flatMap((item): RemediationAction[] => {
    const stored = bySource.get(remediationSourceKey(item));
    if (!stored) return [];
    return [{
      ...stored,
      controlCode: item.controlCode,
      controlTitle: item.controlTitle,
      question: item.question,
      diagnostic: item.diagnostic,
      remediation: item.remediation,
      evidenceStatus: item.evidenceStatus,
      assessmentHref: item.href,
      gapHref: \`/gap-analysis?gap=\${encodeURIComponent(item.id)}\`,
    }];
  });

  return { actions, members: [currentMember(user)] };
}
`;

fs.writeFileSync(fetchersFile, code + correctLogic);
console.log("Rewrote getRemediationData");

