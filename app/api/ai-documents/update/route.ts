import { NextResponse } from "next/server";
import { authenticatedWorkspaceClient, WorkspaceHttpError } from "@/lib/workspaces/authenticated-client";
import type { StructuredDocument } from "@/lib/ai/documents/generation-schema";

export async function PUT(request: Request) {
  try {
    const body = await request.json() as { workspaceId?: string; documentType?: string; version?: string; content?: StructuredDocument };
    const { workspaceId, documentType, version, content } = body;
    if (!workspaceId || !documentType || !version || !content) {
      return NextResponse.json({ error: "Missing required fields for update." }, { status: 400 });
    }

    const { client } = await authenticatedWorkspaceClient(workspaceId);

    const { error } = await client.rpc("update_ai_document_draft_content", {
      p_workspace_id: workspaceId,
      p_document_type: documentType,
      p_version: version,
      p_document_content: content,
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (cause) {
    if (cause instanceof WorkspaceHttpError) return NextResponse.json({ error: cause.message }, { status: cause.status });
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Failed to update draft content." }, { status: 400 });
  }
}
