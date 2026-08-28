import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { authenticatedEvidenceClient } from "@/lib/evidence/http";
import { EVIDENCE_BUCKET, generatedStoragePath } from "@/lib/evidence/files";
import { documentMetadataColumns } from "@/lib/evidence/metadata";
import { authenticatedWorkspaceClient, WorkspaceHttpError } from "@/lib/workspaces/authenticated-client";
import type { StructuredDocument } from "@/lib/ai/documents/generation-schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { workspaceId?: string; documentType?: string; version?: string; ownerId?: string; effectiveDate?: string };
    const { workspaceId, documentType, version, ownerId, effectiveDate } = body;
    if (!workspaceId || !documentType || !version || !ownerId || !effectiveDate) {
      return NextResponse.json({ error: "Missing required fields for finalization." }, { status: 400 });
    }

    const { client, user } = await authenticatedWorkspaceClient(workspaceId);
    
    // Fetch the draft to convert it to markdown
    const { data: draft, error: fetchError } = await client
      .from("ai_documents")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("document_type", documentType)
      .eq("version", version)
      .single();
    
    if (fetchError || !draft) throw new Error("Draft not found.");
    if (draft.status !== "draft") throw new Error("Document is not a draft.");
    
    const content = draft.document_content as StructuredDocument | null;
    if (!content || !content.sections) throw new Error("Draft content is missing or invalid.");
    
    // Build Markdown string
    let markdown = `# ${content.title}\n\n`;
    content.sections.forEach((section, index) => {
      markdown += `## ${index + 1}. ${section.title}\n\n`;
      markdown += `${section.content}\n\n`;
    });
    
    const markdownBytes = Buffer.from(markdown, "utf-8");
    const filename = `${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${version}.md`;
    
    const { admin } = await authenticatedEvidenceClient(workspaceId);
    
    const evidenceId = randomUUID();
    const storagePath = generatedStoragePath(workspaceId, evidenceId, ".md");
    
    // 1. Upload to storage
    const { error: uploadError } = await admin.storage
      .from(EVIDENCE_BUCKET)
      .upload(storagePath, markdownBytes, {
        contentType: "text/plain",
        upsert: false,
      });
    if (uploadError) throw uploadError;
    
    // 2. Insert into evidence_items
    const { error: itemError } = await admin
      .from("evidence_items")
      .insert({
        id: evidenceId,
        workspace_id: workspaceId,
        storage_bucket: EVIDENCE_BUCKET,
        storage_path: storagePath,
        original_filename: filename,
        mime_type: "text/plain",
        size_bytes: markdownBytes.length,
        uploaded_by: user.id,
        ...documentMetadataColumns({
          documentType: documentType as "information_security_policy" | "access_control_policy" | "incident_management_procedure" | "backup_restore_procedure" | "asset_management_policy",
          documentVersion: version,
          effectiveDate,
          reviewDate: effectiveDate, // Simplified: using effective date as initial review date
          documentOwnerId: ownerId,
        }),
      });
      
    if (itemError) {
      await admin.storage.from(EVIDENCE_BUCKET).remove([storagePath]);
      throw itemError;
    }
    
    // 3. Finalize draft in ai_documents
    const { error: finalizeError } = await client.rpc("finalize_ai_document_draft", {
      p_workspace_id: workspaceId,
      p_document_type: documentType,
      p_version: version,
    });
    
    if (finalizeError) throw finalizeError;

    return NextResponse.json({ success: true, evidenceId });
  } catch (cause) {
    if (cause instanceof WorkspaceHttpError) return NextResponse.json({ error: cause.message }, { status: cause.status });
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Failed to finalize document." }, { status: 400 });
  }
}
