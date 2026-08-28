import { NextResponse } from "next/server";

import { authenticatedEvidenceClient, evidenceError, evidenceRouteError } from "@/lib/evidence/http";
import { evidenceItem, readEvidenceItem } from "@/lib/evidence/repository";
import {
  documentMetadataColumns,
  EvidenceMetadataValidationError,
  requireDocumentOwnerInWorkspace,
  validateDocumentMetadata,
} from "@/lib/evidence/metadata";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let payload: Record<string, unknown>;
  try { payload = await request.json() as Record<string, unknown>; }
  catch { return evidenceError("Invalid JSON body", 400); }
  const workspaceId = typeof payload.workspaceId === "string" ? payload.workspaceId.trim() : "";
  if (!workspaceId || !id) return evidenceError("workspaceId and evidence id are required", 400);
  try {
    const { client, admin } = await authenticatedEvidenceClient(workspaceId);
    const prior = await readEvidenceItem(client, id);
    if (!prior || prior.workspaceId !== workspaceId) return evidenceError("Evidence not found", 404);
    const metadata = validateDocumentMetadata({
      documentType: Object.hasOwn(payload, "documentType") ? payload.documentType : prior.documentType,
      documentVersion: Object.hasOwn(payload, "documentVersion") ? payload.documentVersion : prior.documentVersion,
      effectiveDate: Object.hasOwn(payload, "effectiveDate") ? payload.effectiveDate : prior.effectiveDate,
      reviewDate: Object.hasOwn(payload, "reviewDate") ? payload.reviewDate : prior.reviewDate,
      documentOwnerId: Object.hasOwn(payload, "documentOwnerId") ? payload.documentOwnerId : prior.documentOwnerId,
    });
    await requireDocumentOwnerInWorkspace(client, workspaceId, metadata.documentOwnerId);
    const { data, error } = await admin.from("evidence_items")
      .update(documentMetadataColumns(metadata))
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ evidence: evidenceItem(data) });
  } catch (cause) {
    if (cause instanceof EvidenceMetadataValidationError) return evidenceError(cause.message, 400);
    return evidenceRouteError(cause, "Unable to update evidence metadata");
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const workspaceId = new URL(request.url).searchParams.get("workspaceId")?.trim() ?? "";
  if (!workspaceId || !id) return evidenceError("workspaceId and evidence id are required", 400);
  try {
    const { client, admin } = await authenticatedEvidenceClient(workspaceId);
    const item = await readEvidenceItem(client, id);
    if (!item || item.workspaceId !== workspaceId) return evidenceError("Evidence not found", 404);
    const { data: backup, error: downloadError } = await admin.storage.from(item.storageBucket).download(item.storagePath);
    if (downloadError) throw downloadError;
    const backupBytes = new Uint8Array(await backup.arrayBuffer());
    const { error: removeError } = await admin.storage.from(item.storageBucket).remove([item.storagePath]);
    if (removeError) throw removeError;
    const { error: deleteError } = await admin.from("evidence_items").delete()
      .eq("id", id).eq("workspace_id", workspaceId);
    if (deleteError) {
      await admin.storage.from(item.storageBucket).upload(item.storagePath, backupBytes, {
        contentType: item.mimeType,
        upsert: false,
      });
      throw deleteError;
    }
    return NextResponse.json({ deleted: true });
  } catch (cause) {
    return evidenceRouteError(cause, "Unable to delete evidence");
  }
}
