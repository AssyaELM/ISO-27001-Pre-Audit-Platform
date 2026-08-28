import { authenticatedWorkspaceClient } from "@/lib/workspaces/authenticated-client";
import { buildAiDocumentsRegistry, type RegistryAiDocumentRow, type RegistryEvidenceRow } from "@/lib/ai-documents/registry";
import { CANONICAL_AI_DOCUMENT_TYPES, mapAiDocumentStatus, readinessPercent } from "@/lib/ai-documents/ui";
import { normalizeContext, prepareGenerationContext, workspaceGenerationInput } from "@/app/api/ai-documents/context";
import { authenticatedEvidenceClient } from "@/lib/evidence/http";
import { evidenceItem, evidenceLink, readCanonicalEvidenceMetrics } from "@/lib/evidence/repository";

export async function getDocumentsData(workspaceId: string) {
  const { client, user } = await authenticatedWorkspaceClient(workspaceId);
  const [evidenceResult, aiDocumentsResult, argumentsResult] = await Promise.all([
    client.from("evidence_items").select("id,document_type,document_version,effective_date,review_date,document_owner_id,original_filename,created_at,updated_at").eq("workspace_id", workspaceId).in("document_type", ["information_security_policy", "access_control_policy", "incident_management_procedure", "backup_and_recovery_policy", "information_asset_management_policy", "backup_restore_procedure", "asset_management_policy"]),
    client.from("ai_documents").select("*").eq("workspace_id", workspaceId),
    client.from("assessment_responses").select("theme_id,control_id,question_id,answer,justification").eq("workspace_id", workspaceId),
  ]);
  const registry = buildAiDocumentsRegistry((evidenceResult.data ?? []) as RegistryEvidenceRow[], (aiDocumentsResult.data ?? []) as RegistryAiDocumentRow[]);
  const responses = (argumentsResult.data ?? []) as never[];
  const setupsMap = Object.fromEntries((aiDocumentsResult.data ?? []).filter((row) => row.version === "setup").map((row) => [row.document_type, row.document_content]));

  return CANONICAL_AI_DOCUMENT_TYPES.map((documentType) => {
    const entry = registry.find((item) => item.documentType === documentType)!;
    const setup = (setupsMap[documentType] ?? {}) as Record<string, unknown>;
    const input = workspaceGenerationInput(user, responses, registry, setup);
    const preparation = normalizeContext(prepareGenerationContext(documentType, input));
    const status = mapAiDocumentStatus(entry.status, preparation);
    return { documentType, label: entry.label, status, registryStatus: entry.status, version: entry.activeDocument?.version ?? null, updatedAt: entry.activeDocument?.updatedAt ?? null, reviewDate: entry.activeDocument?.reviewDate ?? null, ownerId: entry.activeDocument?.documentOwnerId ?? null, evidenceId: entry.activeDocument?.source === "evidence" ? entry.activeDocument.id : null, filename: entry.activeDocument?.filename ?? null, readiness: readinessPercent(preparation), preparation, content: entry.activeDocument?.content ?? null, setup };
  });
}

export async function getEvidenceData(workspaceId: string, filters: any = {}) {
  const { client, admin, user } = await authenticatedEvidenceClient(workspaceId);
  let linksQuery = client.from("evidence_question_links").select("*").eq("workspace_id", workspaceId);
  if (filters.themeId) linksQuery = linksQuery.eq("theme_id", filters.themeId);
  if (filters.controlId) linksQuery = linksQuery.eq("control_id", filters.controlId);
  if (filters.questionId) linksQuery = linksQuery.eq("question_id", filters.questionId);
  const { data: linkRows } = await linksQuery;

  const filterActive = Boolean(filters.themeId || filters.controlId || filters.questionId);
  const evidenceIds = [...new Set((linkRows ?? []).map((row) => String(row.evidence_id)))];
  let itemRows = [];
  if (!filterActive) {
    const { data } = await client.from("evidence_items").select("*").eq("workspace_id", workspaceId).order("updated_at", { ascending: false });
    itemRows = data ?? [];
  } else if (evidenceIds.length > 0) {
    const { data } = await client.from("evidence_items").select("*").eq("workspace_id", workspaceId).in("id", evidenceIds).order("updated_at", { ascending: false });
    itemRows = data ?? [];
  }

  const items = itemRows.map((row) => evidenceItem(row));
  const links = (linkRows ?? []).map((row) => evidenceLink(row));
  const metrics = await readCanonicalEvidenceMetrics(client, workspaceId);
  const { data: members } = await admin.auth.admin.listUsers();
  const workspaceMembers = members.users.map((u) => ({ id: u.id, email: u.email ?? "" }));

  return { evidence: items, links, metrics, workspaceMembers };
}


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
      gapHref: `/gap-analysis?gap=${encodeURIComponent(item.id)}`,
    }];
  });

  return { actions, members: [currentMember(user)] };
}
