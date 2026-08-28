import { NextResponse } from "next/server";
import { getCurrentUser, WorkspaceHttpError } from "@/lib/workspaces/authenticated-client";
import { CANONICAL_AI_DOCUMENT_TYPES } from "@/lib/ai-documents/ui";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(request: Request) {
  try {
    const body = await request.json() as { workspaceId?: string; documentType?: string; setup?: Record<string, unknown> };
    const { workspaceId, documentType, setup } = body;
    if (!workspaceId || !documentType || !setup) {
      return NextResponse.json({ error: "Missing required fields for setup update." }, { status: 400 });
    }
    if (!(CANONICAL_AI_DOCUMENT_TYPES as readonly string[]).includes(documentType)) {
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
    }

    const { user } = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");

    // Upsert the document setup using the admin client because public.ai_documents has no INSERT policy for authenticated users
    // We use version='setup' and status='draft' to separate it from generated drafts
    const adminClient = createAdminClient();
    const { error } = await adminClient.from("ai_documents").upsert({
      workspace_id: workspaceId,
      document_type: documentType,
      version: "setup",
      status: "draft",
      language: "en",
      title: "Document Setup",
      created_by: user.id,
      document_content: setup,
    }, {
      onConflict: "workspace_id, document_type, version",
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (cause) {
    if (cause instanceof WorkspaceHttpError) return NextResponse.json({ error: cause.message }, { status: cause.status });
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Failed to update document setup." }, { status: 400 });
  }
}
