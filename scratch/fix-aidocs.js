const fs = require("fs");
const file = "app/api/ai-documents/route.ts";
const code = `import { NextResponse } from "next/server";

import { buildAiDocumentsRegistry, type RegistryAiDocumentRow, type RegistryEvidenceRow } from "@/lib/ai-documents/registry";
import { authenticatedWorkspaceClient, WorkspaceHttpError } from "@/lib/workspaces/authenticated-client";
import { CANONICAL_AI_DOCUMENT_TYPES, mapAiDocumentStatus, readinessPercent } from "@/lib/ai-documents/ui";
import { normalizeContext, prepareGenerationContext, workspaceGenerationInput } from "./context";

export async function getDocumentsData(workspaceId: string) {
  const { client, user } = await authenticatedWorkspaceClient(workspaceId);
  const [evidenceResult, aiDocumentsResult, argumentsResult] = await Promise.all([
    client.from("evidence_items")
      .select("id,document_type,document_version,effective_date,review_date,document_owner_id,original_filename,created_at,updated_at")
      .eq("workspace_id", workspaceId)
      .in("document_type", [
        "information_security_policy", "access_control_policy", "incident_management_procedure",
        "backup_restore_procedure", "asset_management_policy",
      ]),
    client.from("ai_documents").select("*").eq("workspace_id", workspaceId),
    client.from("assessment_responses").select("theme_id,control_id,question_id,answer,justification").eq("workspace_id", workspaceId),
  ]);
  if (evidenceResult.error) throw evidenceResult.error;
  if (aiDocumentsResult.error) throw aiDocumentsResult.error;
  
  const registry = buildAiDocumentsRegistry(
      (evidenceResult.data ?? []) as RegistryEvidenceRow[],
      (aiDocumentsResult.data ?? []) as RegistryAiDocumentRow[],
    );
  
  const responses = (argumentsResult.data ?? []) as never[];
  
  const setupsMap = Object.fromEntries(
    (aiDocumentsResult.data ?? [])
      .filter((row) => row.version === "setup")
      .map((row) => [row.document_type, row.document_content])
  );

  return CANONICAL_AI_DOCUMENT_TYPES.map((documentType) => {
    const entry = registry.find((item) => item.documentType === documentType)!;
    const setup = (setupsMap[documentType] ?? {}) as Record<string, unknown>;
    const input = workspaceGenerationInput(user, responses, registry, setup);
    const preparation = normalizeContext(prepareGenerationContext(documentType, input));
    const status = mapAiDocumentStatus(entry.status, preparation);
    return { documentType, label: entry.label, status, registryStatus: entry.status, version: entry.activeDocument?.version ?? null, updatedAt: entry.activeDocument?.updatedAt ?? null, reviewDate: entry.activeDocument?.reviewDate ?? null, ownerId: entry.activeDocument?.documentOwnerId ?? null, evidenceId: entry.activeDocument?.source === "evidence" ? entry.activeDocument.id : null, filename: entry.activeDocument?.filename ?? null, readiness: readinessPercent(preparation, status), preparation, content: entry.activeDocument?.content ?? null, setup };
  });
}

export async function GET(request: Request) {
  const workspaceId = new URL(request.url).searchParams.get("workspaceId")?.trim() ?? "";
  if (!workspaceId) return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  try {
    const documents = await getDocumentsData(workspaceId);
    return NextResponse.json({ documents });
  } catch (cause) {
    console.error("GET /api/ai-documents error:", cause);
    if (cause instanceof WorkspaceHttpError) return NextResponse.json({ error: cause.message }, { status: cause.status });
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Unable to read AI Documents registry" }, { status: 400 });
  }
}
`;
fs.writeFileSync(file, code);

