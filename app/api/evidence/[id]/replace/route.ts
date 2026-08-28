import { authenticatedEvidenceClient, evidenceError, evidenceRouteError } from "@/lib/evidence/http";
import { EVIDENCE_BUCKET, EvidenceFileValidationError, generatedStoragePath, validateEvidenceFile } from "@/lib/evidence/files";
import { evidenceItem, readEvidenceItem } from "@/lib/evidence/repository";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };
export const runtime = "nodejs";

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let form: FormData;
  try { form = await request.formData(); } catch { return evidenceError("Invalid multipart form data", 400); }
  const workspaceId = typeof form.get("workspaceId") === "string" ? String(form.get("workspaceId")).trim() : "";
  const file = form.get("file");
  if (!workspaceId || !id) return evidenceError("workspaceId and evidence id are required", 400);
  if (!(file instanceof File)) return evidenceError("A file is required", 400);

  try {
    const validated = await validateEvidenceFile(file);
    const { client, admin } = await authenticatedEvidenceClient(workspaceId);
    const prior = await readEvidenceItem(client, id);
    if (!prior || prior.workspaceId !== workspaceId) return evidenceError("Evidence not found", 404);
    const nextPath = generatedStoragePath(workspaceId, id, validated.extension);
    const { error: uploadError } = await admin.storage.from(EVIDENCE_BUCKET).upload(nextPath, validated.bytes, {
      contentType: validated.mimeType,
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data, error: updateError } = await admin.from("evidence_items").update({
      storage_path: nextPath,
      original_filename: validated.originalFilename,
      mime_type: validated.mimeType,
      size_bytes: validated.sizeBytes,
    }).eq("id", id).eq("workspace_id", workspaceId).select("*").single();
    if (updateError) {
      await admin.storage.from(EVIDENCE_BUCKET).remove([nextPath]);
      throw updateError;
    }

    const { error: removeError } = await admin.storage.from(prior.storageBucket).remove([prior.storagePath]);
    if (removeError) {
      await admin.from("evidence_items").update({
        storage_path: prior.storagePath,
        original_filename: prior.originalFilename,
        mime_type: prior.mimeType,
        size_bytes: prior.sizeBytes,
      }).eq("id", id).eq("workspace_id", workspaceId);
      await admin.storage.from(EVIDENCE_BUCKET).remove([nextPath]);
      throw removeError;
    }
    return NextResponse.json({ evidence: evidenceItem(data), evidenceStatus: "provided" });
  } catch (cause) {
    if (cause instanceof EvidenceFileValidationError) return evidenceError(cause.message, 400);
    return evidenceRouteError(cause, "Unable to replace evidence");
  }
}
