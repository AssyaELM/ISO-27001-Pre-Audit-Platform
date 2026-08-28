import type { SupabaseClient } from "@supabase/supabase-js";

import type { AssessmentAnswerRecord } from "../../content/assessment-infrastructure.ts";
import {
  canonicalEvidenceKey,
  normalizeEvidenceTheme,
  type CanonicalQuestionIdentity,
} from "./catalog.ts";
import { deriveGapAnalysis, type GapAnalysisResponse } from "../assessment/gap-analysis.ts";
import { documentReviewState, type DocumentType } from "./metadata.ts";

export type EvidenceItemRecord = {
  id: string;
  workspaceId: string;
  storageBucket: string;
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  documentType: DocumentType | null;
  documentVersion: string | null;
  effectiveDate: string | null;
  reviewDate: string | null;
  documentOwnerId: string | null;
  documentReviewState: "unknown" | "current" | "review_overdue";
};

export type EvidenceLinkRecord = {
  id: string;
  evidenceId: string;
  workspaceId: string;
  themeId: CanonicalQuestionIdentity["themeId"];
  controlId: string;
  questionId: string;
  linkedBy: string;
  linkedAt: string;
};

type EvidenceItemRow = {
  id: string;
  workspace_id: string;
  storage_bucket: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  document_type: DocumentType | null;
  document_version: string | null;
  effective_date: string | null;
  review_date: string | null;
  document_owner_id: string | null;
};

type EvidenceLinkRow = {
  id: string;
  evidence_id: string;
  workspace_id: string;
  theme_id: CanonicalQuestionIdentity["themeId"];
  control_id: string;
  question_id: string;
  linked_by: string;
  linked_at: string;
};

export function evidenceItem(row: EvidenceItemRow): EvidenceItemRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    documentType: row.document_type,
    documentVersion: row.document_version,
    effectiveDate: row.effective_date,
    reviewDate: row.review_date,
    documentOwnerId: row.document_owner_id,
    documentReviewState: documentReviewState(row.review_date),
  };
}

export function evidenceLink(row: EvidenceLinkRow): EvidenceLinkRecord {
  return {
    id: row.id,
    evidenceId: row.evidence_id,
    workspaceId: row.workspace_id,
    themeId: row.theme_id,
    controlId: row.control_id,
    questionId: row.question_id,
    linkedBy: row.linked_by,
    linkedAt: row.linked_at,
  };
}

export async function requireWorkspaceAccess(client: SupabaseClient, workspaceId: string) {
  const { data, error } = await client.from("workspaces").select("id").eq("id", workspaceId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Workspace access denied");
}

export async function readEvidenceItem(client: SupabaseClient, evidenceId: string) {
  const { data, error } = await client.from("evidence_items").select("*").eq("id", evidenceId).maybeSingle();
  if (error) throw error;
  return data ? evidenceItem(data as EvidenceItemRow) : null;
}

export async function readCanonicalEvidenceCounts(client: SupabaseClient, workspaceId: string) {
  const { data, error } = await client
    .from("evidence_question_links")
    .select("theme_id,control_id,question_id")
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const identity = row as Pick<EvidenceLinkRow, "theme_id" | "control_id" | "question_id">;
    const key = canonicalEvidenceKey({
      themeId: identity.theme_id,
      controlId: identity.control_id,
      questionId: identity.question_id,
    });
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export async function readCanonicalEvidenceMetrics(
  client: SupabaseClient,
  workspaceId: string,
  onboarding: Record<string, unknown> = {},
) {
  const { data, error } = await client
    .from("evidence_question_links")
    .select("evidence_id,theme_id,control_id,question_id")
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  const links = (data ?? []) as Array<Pick<EvidenceLinkRow, "evidence_id" | "theme_id" | "control_id" | "question_id">>;
  const probes: GapAnalysisResponse[] = links.map((link) => ({
    theme: link.theme_id,
    controlId: link.control_id,
    questionId: link.question_id,
    answer: "not_sure",
    hasCanonicalEvidence: true,
  }));
  const activeKeys = new Set(
    deriveGapAnalysis(probes, onboarding).map((item) => canonicalEvidenceKey({
      themeId: item.theme,
      controlId: item.controlId,
      questionId: item.questionId,
    })),
  );
  const activeLinks = links.filter((link) => activeKeys.has(canonicalEvidenceKey({
    themeId: link.theme_id,
    controlId: link.control_id,
    questionId: link.question_id,
  })));
  return {
    evidenceCount: new Set(activeLinks.map((link) => link.evidence_id)).size,
    linkCount: activeLinks.length,
    providedQuestionCount: new Set(activeLinks.map((link) => canonicalEvidenceKey({
      themeId: link.theme_id,
      controlId: link.control_id,
      questionId: link.question_id,
    }))).size,
  };
}

export async function withCanonicalEvidence(
  client: SupabaseClient,
  workspaceId: string,
  responses: AssessmentAnswerRecord[],
) {
  const counts = await readCanonicalEvidenceCounts(client, workspaceId);
  return responses.map((response) => {
    const themeId = normalizeEvidenceTheme(response.theme);
    const evidenceCount = themeId
      ? counts.get(canonicalEvidenceKey({ themeId, controlId: response.controlId, questionId: response.questionId })) ?? 0
      : 0;
    return { ...response, hasCanonicalEvidence: evidenceCount > 0, evidenceCount };
  });
}
