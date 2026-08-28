import { NextResponse } from "next/server";
import { authenticatedWorkspaceClient, WorkspaceHttpError } from "@/lib/workspaces/authenticated-client";
import { buildAiDocumentsRegistry, type RegistryAiDocumentRow, type RegistryEvidenceRow } from "@/lib/ai-documents/registry";
import { normalizeContext, prepareGenerationContext, workspaceGenerationInput } from "../context";

type PreflightPayload = {
  workspaceId?: string;
  documentType?: string;
  setup?: Record<string, unknown>;
};

function sourceForField(context: Record<string, unknown>, field: string) {
  const trace = Array.isArray(context.sourceTrace) ? context.sourceTrace as Array<Record<string, unknown>> : [];
  const knownInputs = (context.knownInputs ?? {}) as Record<string, unknown>;
  const matching = trace.filter((entry) => {
    const sourceId = String(entry.sourceId ?? "");
    return sourceId === field || sourceId.endsWith(`.${field}`) || (field === "scope" && sourceId === "ismsScope");
  });
  const value = knownInputs[field] ?? (field === "scope" ? (context.scope as Record<string, unknown> | undefined)?.value : undefined);
  const source = matching.at(-1);
  return {
    resolved: value !== undefined && value !== null && value !== "" && value !== "to be defined",
    value: value ?? null,
    source: source ? String(source.sourceType ?? "unknown") : null,
    sourceId: source ? String(source.sourceId ?? "") : null,
    confidence: source ? String(source.confidence ?? "unknown") : null,
  };
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as PreflightPayload;
    const workspaceId = payload.workspaceId?.trim() ?? "";
    const documentType = payload.documentType ?? "information_security_policy";
    if (!workspaceId || documentType !== "information_security_policy") {
      return NextResponse.json({ error: "A workspaceId and information_security_policy documentType are required." }, { status: 400 });
    }

    const { client, user } = await authenticatedWorkspaceClient(workspaceId);
    const [evidenceResult, documentsResult, responsesResult] = await Promise.all([
      client.from("evidence_items")
        .select("id,document_type,document_version,effective_date,review_date,document_owner_id,original_filename,created_at,updated_at")
        .eq("workspace_id", workspaceId),
      client.from("ai_documents").select("*").eq("workspace_id", workspaceId),
      client.from("assessment_responses")
        .select("theme_id,control_id,question_id,answer,justification")
        .eq("workspace_id", workspaceId),
    ]);
    if (evidenceResult.error || documentsResult.error || responsesResult.error) {
      throw evidenceResult.error ?? documentsResult.error ?? responsesResult.error;
    }

    const documents = documentsResult.data ?? [];
    const registeredSetup = documents.find((row) => row.version === "setup" && row.document_type === documentType)?.document_content;
    const setup = payload.setup ?? (typeof registeredSetup === "object" && registeredSetup !== null ? registeredSetup as Record<string, unknown> : {});
    const registry = buildAiDocumentsRegistry(
      evidenceResult.data as RegistryEvidenceRow[],
      documents as RegistryAiDocumentRow[],
    );
    const input = workspaceGenerationInput(user, responsesResult.data as never[], registry, setup);
    const context = prepareGenerationContext(documentType, input) as unknown as Record<string, unknown>;
    const preparation = normalizeContext(context as never);
    const knownInputs = (context.knownInputs ?? {}) as Record<string, unknown>;
    const fields = [
      "organization_name", "policy_owner", "approver", "document_classification", "review_plan",
      "scope", "country", "sector", "company_size", "communication_channel", "security_roles",
    ];
    const resolvedFields = Object.fromEntries(fields.map((field) => [field, sourceForField(context, field)]));
    const roles = knownInputs.security_roles;
    const registryDocuments = registry.map((entry) => ({ documentType: entry.documentType, status: entry.status, activeVersion: entry.activeDocument?.version ?? null }));
    const blockedSections = Object.entries(preparation.sectionReadiness).filter(([, status]) => status === "blocked").map(([section]) => section);
    const partialSections = Object.entries(preparation.sectionReadiness).filter(([, status]) => status === "partial").map(([section]) => section);

    console.info("AI Documents ISP preflight completed", {
      workspacePresent: true,
      documentType,
      userPresent: Boolean(user.id),
      registryCount: registryDocuments.length,
      missingInputCount: preparation.missingInputs.length,
      blockedSectionCount: blockedSections.length,
    });

    return NextResponse.json({
      authenticatedUser: { resolved: Boolean(user.id) },
      currentWorkspace: { resolved: true },
      fields: resolvedFields,
      realSecurityRoles: { resolved: Array.isArray(roles) && roles.length > 0, value: Array.isArray(roles) ? roles : null },
      registryDocuments,
      missingInputs: preparation.missingInputs,
      blockedSections,
      partialSections,
      predictedDocumentVersion: knownInputs.version ?? null,
      templateVersion: (context.template as Record<string, unknown> | undefined)?.version ?? null,
      generationContractVersion: (context.generationContract as Record<string, unknown> | undefined)?.version ?? null,
      sectionReadiness: preparation.sectionReadiness,
      semanticFactCount: Object.values((context.semanticFacts ?? {}) as Record<string, unknown[]>).reduce((total, facts) => total + (Array.isArray(facts) ? facts.length : 0), 0),
      sourceCount: preparation.sourceCount,
    });
  } catch (cause) {
    if (cause instanceof WorkspaceHttpError) return NextResponse.json({ error: cause.message }, { status: cause.status });
    return NextResponse.json({ error: cause instanceof Error ? cause.message : "Unable to run ISP preflight." }, { status: 400 });
  }
}
