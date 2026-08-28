import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { validateCanonicalQuestionIdentity } from "@/lib/evidence/catalog";
import {
  EVIDENCE_BUCKET,
  EvidenceFileValidationError,
  generatedStoragePath,
  validateEvidenceFile,
} from "@/lib/evidence/files";
import {
  authenticatedEvidenceClient,
  evidenceError,
  evidenceRouteError,
  formString,
} from "@/lib/evidence/http";
import { evidenceItem, evidenceLink, readCanonicalEvidenceMetrics } from "@/lib/evidence/repository";
import {
  documentMetadataColumns,
  EvidenceMetadataValidationError,
  readWorkspaceMembers,
  requireDocumentOwnerInWorkspace,
  validateDocumentMetadata,
} from "@/lib/evidence/metadata";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return evidenceError("Invalid multipart form data", 400);
  }

  const workspaceId = formString(form, "workspaceId");
  const identityInput = {
    themeId: formString(form, "themeId"),
    controlId: formString(form, "controlId"),
    questionId: formString(form, "questionId"),
  };
  const hasLinkIdentity = Object.values(identityInput).some(Boolean);
  const identity = hasLinkIdentity ? validateCanonicalQuestionIdentity(identityInput) : null;
  const file = form.get("file");
  if (!workspaceId) return evidenceError("workspaceId is required", 400);
  if (hasLinkIdentity && !identity) return evidenceError("Question identity is not present in the canonical Assessment catalogs", 400);
  if (!(file instanceof File)) return evidenceError("A file is required", 400);

  try {
    const metadata = validateDocumentMetadata({
      documentType: formString(form, "documentType"),
      documentVersion: formString(form, "documentVersion"),
      effectiveDate: formString(form, "effectiveDate"),
      reviewDate: formString(form, "reviewDate"),
      documentOwnerId: formString(form, "documentOwnerId"),
    });
    const { client, admin, user } = await authenticatedEvidenceClient(workspaceId);
    await requireDocumentOwnerInWorkspace(client, workspaceId, metadata.documentOwnerId);
    const validated = await validateEvidenceFile(file);
    const evidenceId = randomUUID();
    const storagePath = generatedStoragePath(workspaceId, evidenceId, validated.extension);
    let storageCreated = false;
    let itemCreated = false;

    try {
      const { error: uploadError } = await admin.storage
        .from(EVIDENCE_BUCKET)
        .upload(storagePath, validated.bytes, {
          contentType: validated.mimeType,
          upsert: false,
        });
      if (uploadError) throw uploadError;
      storageCreated = true;

      const { data: itemRow, error: itemError } = await admin
        .from("evidence_items")
        .insert({
          id: evidenceId,
          workspace_id: workspaceId,
          storage_bucket: EVIDENCE_BUCKET,
          storage_path: storagePath,
          original_filename: validated.originalFilename,
          mime_type: validated.mimeType,
          size_bytes: validated.sizeBytes,
          uploaded_by: user.id,
          ...documentMetadataColumns(metadata),
        })
        .select("*")
        .single();
      if (itemError) throw itemError;
      itemCreated = true;

      let link = null;
      if (identity) {
        const { data: linkRow, error: linkError } = await admin
          .from("evidence_question_links")
          .insert({
            evidence_id: evidenceId,
            workspace_id: workspaceId,
            theme_id: identity.themeId,
            control_id: identity.controlId,
            question_id: identity.questionId,
            linked_by: user.id,
          })
          .select("*")
          .single();
        if (linkError) throw linkError;
        link = evidenceLink(linkRow);
      }

      return NextResponse.json({
        evidence: evidenceItem(itemRow),
        link,
        evidenceStatus: identity ? "provided" : "not_provided",
      }, { status: 201 });
    } catch (cause) {
      if (itemCreated) await admin.from("evidence_items").delete().eq("id", evidenceId);
      if (storageCreated) await admin.storage.from(EVIDENCE_BUCKET).remove([storagePath]);
      throw cause;
    }
  } catch (cause) {
    if (cause instanceof EvidenceFileValidationError || cause instanceof EvidenceMetadataValidationError) return evidenceError(cause.message, 400);
    return evidenceRouteError(cause, "Unable to upload evidence");
  }
}


async function getEvidenceData(workspaceId: string, filters: any = {}) {
  const { client, admin, user } = await authenticatedEvidenceClient(workspaceId);
  let linksQuery = client
    .from("evidence_question_links")
    .select("*")
    .eq("workspace_id", workspaceId);
  
  if (filters.themeId) linksQuery = linksQuery.eq("theme_id", filters.themeId);
  if (filters.controlId) linksQuery = linksQuery.eq("control_id", filters.controlId);
  if (filters.questionId) linksQuery = linksQuery.eq("question_id", filters.questionId);
  const { data: linkRows, error: linksError } = await linksQuery;
  if (linksError) throw linksError;

  const filterActive = Boolean(filters.themeId || filters.controlId || filters.questionId);
  const evidenceIds = [...new Set((linkRows ?? []).map((row) => String(row.evidence_id)))];
  let itemRows = [];
  if (!filterActive) {
    const { data, error } = await client
      .from("evidence_items")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    itemRows = data ?? [];
  } else if (evidenceIds.length > 0) {
    const { data, error } = await client
      .from("evidence_items")
      .select("*")
      .eq("workspace_id", workspaceId)
      .in("id", evidenceIds)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    itemRows = data ?? [];
  }

  const items = itemRows.map((row) => evidenceItem(row));
  const links = (linkRows ?? []).map((row) => evidenceLink(row));
  const metrics = await readCanonicalEvidenceMetrics(client, workspaceId);
  const { data: members, error: membersError } = await admin.auth.admin.listUsers();
  if (membersError) throw membersError;
  const workspaceMembers = members.users.map((u) => ({ id: u.id, email: u.email ?? "" }));

  return { evidence: items, links, metrics, workspaceMembers };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId")?.trim() ?? "";
  if (!workspaceId) return evidenceError("workspaceId is required", 400);

  try {
    const { client, admin, user } = await authenticatedEvidenceClient(workspaceId);
    let linksQuery = client
      .from("evidence_question_links")
      .select("*")
      .eq("workspace_id", workspaceId);
    const filters = {
      themeId: url.searchParams.get("themeId")?.trim(),
      controlId: url.searchParams.get("controlId")?.trim(),
      questionId: url.searchParams.get("questionId")?.trim(),
    };
    if (filters.themeId) linksQuery = linksQuery.eq("theme_id", filters.themeId);
    if (filters.controlId) linksQuery = linksQuery.eq("control_id", filters.controlId);
    if (filters.questionId) linksQuery = linksQuery.eq("question_id", filters.questionId);
    const { data: linkRows, error: linksError } = await linksQuery;
    if (linksError) throw linksError;

    const filterActive = Boolean(filters.themeId || filters.controlId || filters.questionId);
    const evidenceIds = [...new Set((linkRows ?? []).map((row) => String(row.evidence_id)))];
    let itemRows: unknown[] = [];
    if (!filterActive) {
      const result = await client.from("evidence_items").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false });
      if (result.error) throw result.error;
      itemRows = result.data ?? [];
    } else if (evidenceIds.length) {
      const result = await client.from("evidence_items").select("*").eq("workspace_id", workspaceId).in("id", evidenceIds).order("created_at", { ascending: false });
      if (result.error) throw result.error;
      itemRows = result.data ?? [];
    }

    const metadata = user.user_metadata as Record<string, unknown>;
    const onboarding = (metadata.normcore_onboarding ?? metadata.normcore_onboarding_organization ?? {}) as Record<string, unknown>;
    const metrics = await readCanonicalEvidenceMetrics(client, workspaceId, onboarding);
    const workspaceMembers = await readWorkspaceMembers(client, admin, workspaceId);
    return NextResponse.json({
      evidence: itemRows.map((row) => evidenceItem(row as Parameters<typeof evidenceItem>[0])),
      links: (linkRows ?? []).map((row) => evidenceLink(row as Parameters<typeof evidenceLink>[0])),
      metrics,
      workspaceMembers,
    });
  } catch (cause) {
    return evidenceRouteError(cause, "Unable to list evidence");
  }
}
