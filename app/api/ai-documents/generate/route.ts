import { hydrateNonGeneratedSection } from "@/lib/ai/documents/section-hydrator";
import { validateSemanticWriteGate, validateContextLeakage } from "@/lib/ai/documents/semantic-write-gate";
import { NextResponse } from "next/server";
import { authenticatedWorkspaceClient, WorkspaceHttpError } from "@/lib/workspaces/authenticated-client";
import { buildAiDocumentsRegistry, type RegistryAiDocumentRow, type RegistryEvidenceRow } from "@/lib/ai-documents/registry";
import { CANONICAL_AI_DOCUMENT_TYPES, safeGenerationError } from "@/lib/ai-documents/ui";
import { getAiDocumentTemplateSpec, type SupportedAiDocumentType } from "@/lib/ai/documents/catalog";
import { buildCommonDocumentGenerationRequest } from "@/lib/ai/documents/request-builder";
import { buildStructuredDocumentJsonSchema, buildSectionStructuredDocumentJsonSchema, validateStructuredDocumentResponse, validateSectionStructuredDocumentResponse, type StructuredDocumentSection, type StructuredDocumentBlock, type StructuredDocument } from "@/lib/ai/documents/generation-schema";
import { persistValidatedAiDocumentDraft } from "@/lib/ai/documents/common-validated-draft-persistence";
import { validateInformationSecurityPolicyLiveQuality } from "@/lib/ai/documents/information-security-policy-live-validation";
import { AiProviderError, getAiDocumentProvider, OpenAiDocumentProvider } from "@/lib/ai/providers";
import type { AiDocumentGenerationRequest, AiDocumentGenerationResponse, AiDocumentGenerationSection, AiDocumentProvider } from "@/lib/ai/providers/types";
import { normalizeContext, prepareGenerationContext, workspaceGenerationInput } from "../context";
import type { DraftPersistenceClient } from "@/lib/ai/documents/validated-draft-persistence";
import type { DocumentTemplateSpec, DocumentSectionSpec } from "@/lib/ai-documents/information-security-policy";

import type { AiDocumentType } from "@/lib/ai-documents/registry";

type GenerationTracker = {
  totalProviderCalls: number;
  totalTimeMs: number;
  sectionsGenerated: number;
  totalRetries: number;
  retriesPerSection: Record<string, number>;
  provider?: string;
  model?: string;
  requestId?: string;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
};

type GroqTelemetry = NonNullable<AiDocumentGenerationResponse["telemetry"]>;

const ISP_BATCH_SIZE = 1;
const DEFAULT_BATCH_MAX_OUTPUT_TOKENS = 3072;
const TOKEN_RESET_GRACE_SECONDS = 2;
const LOW_TOKEN_THRESHOLD = 1200;

function chunkArray<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function getTelemetrySnapshot(telemetry?: GroqTelemetry) {
  return {
    httpStatus: telemetry?.httpStatus ?? null,
    retryAfterSeconds: telemetry?.retryAfterSeconds ?? null,
    remainingTokens: telemetry?.remainingTokens ?? null,
    resetTokens: telemetry?.resetTokens ?? null,
    remainingRequests: telemetry?.remainingRequests ?? null,
    resetRequests: telemetry?.resetRequests ?? null,
    finishReason: telemetry?.finishReason ?? null,
    truncated: telemetry?.truncated ?? null,
    inputTokens: telemetry ? undefined : undefined,
  };
}

function parseGroqResetSeconds(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.includes("m")) {
    const [minutesPart, secondsPart = "0s"] = trimmed.split("m", 2);
    const minutes = Number.parseFloat(minutesPart);
    const seconds = Number.parseFloat(secondsPart.replace("s", ""));
    const total = minutes * 60 + seconds;
    return Number.isFinite(total) && total > 0 ? Math.ceil(total) : undefined;
  }
  const seconds = Number.parseFloat(trimmed.replace("s", ""));
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : undefined;
}

function shouldWaitForQuota(telemetry?: GroqTelemetry, estimatedNextTokens = 0): number | undefined {
  if (!telemetry) return undefined;
  const remainingTokens = typeof telemetry.remainingTokens === "number" ? telemetry.remainingTokens : undefined;
  const resetTokens = parseGroqResetSeconds(telemetry.resetTokens);
  const threshold = Math.max(LOW_TOKEN_THRESHOLD, estimatedNextTokens);
  if (remainingTokens !== undefined && remainingTokens <= threshold && resetTokens) return resetTokens;
  return undefined;
}

function logBatchTelemetry(event: "attempt" | "success" | "failure" | "pause", payload: Record<string, unknown>) {
  console.info("AI Documents batch telemetry", { event, ...payload });
}

async function generateDocumentSection(provider: AiDocumentProvider, spec: DocumentTemplateSpec<AiDocumentType>, fullRequest: AiDocumentGenerationRequest, sectionReq: AiDocumentGenerationSection, tracker: GenerationTracker): Promise<StructuredDocumentBlock[]> {
  const sectionRequest = { 
    ...fullRequest, 
    sections: [sectionReq], 
    generationConstraints: [
      ...fullRequest.generationConstraints, 
      "IMPORTANT: Return ONLY the content for the requested section. Do not summarize.", 
      "CRITICAL: Do not invent or hallucinate any roles, names, dates, tools, methodologies, or classifications. Use ONLY the facts provided in the context.",
      `CRITICAL: You MUST NOT use any of these exact words/phrases in your output: ${spec.forbiddenInferences.join(", ")}`
    ] 
  };
  const responseSchema = buildSectionStructuredDocumentJsonSchema();
  if (tracker) tracker.totalProviderCalls++;
  const response = await provider.generateStructuredDocument({ ...sectionRequest, providerOptions: { responseSchema, maxOutputTokens: 2048 } });
  if (tracker) {
    tracker.provider = response.provider;
    tracker.model = response.model;
    tracker.requestId = response.requestId;
    tracker.usage = response.usage;
  }
  return validateSectionStructuredDocumentResponse(response.structuredOutput);
}

async function generateIspSectionBatch(
  provider: AiDocumentProvider,
  spec: DocumentTemplateSpec<AiDocumentType>,
  generation: { request: AiDocumentGenerationRequest },
  batchSections: AiDocumentGenerationSection[],
  tracker: GenerationTracker,
  batchIndex: number,
  totalBatches: number,
): Promise<StructuredDocumentSection[]> {
  const batchSpec = {
    ...spec,
    sections: batchSections.map((section) => ({
      id: section.sectionId,
      order: spec.sections.find((candidate) => candidate.id === section.sectionId)?.order ?? 0,
      label: section.title,
      generationMode: "ai_later",
      sources: [],
      requiredInputs: [],
      optionalInputs: [],
      allowOmission: false,
      structure: spec.sections.find((candidate) => candidate.id === section.sectionId)?.structure,
    })),
  } as DocumentTemplateSpec<AiDocumentType>;

  const batchRequest = {
    ...generation.request,
    sections: batchSections,
    generationConstraints: [
      ...generation.request.generationConstraints,
      `This is batch ${batchIndex + 1} of ${totalBatches}. Return only the requested sections in exact order.`,
      `This batch contains these section IDs: ${batchSections.map((section) => section.sectionId).join(", ")}.`,
    ],
  };

  let retries = 0;
  let lastError: unknown;
  while (retries < 2) {
    const attempt = retries + 1;
    tracker.totalProviderCalls++;
    logBatchTelemetry("attempt", {
      provider: provider.provider,
      batchIndex: batchIndex + 1,
      totalBatches,
      sectionIds: batchSections.map((section) => section.sectionId),
      attempt,
      maxOutputTokens: DEFAULT_BATCH_MAX_OUTPUT_TOKENS,
    });
    try {
      const response = await provider.generateStructuredDocument({
        ...batchRequest,
        providerOptions: {
          responseSchema: buildStructuredDocumentJsonSchema(batchSpec, "en", spec.label, generation.request.sectionReadiness),
          maxOutputTokens: DEFAULT_BATCH_MAX_OUTPUT_TOKENS,
          reasoning: { effort: retries === 0 ? "medium" : "high" },
        },
      });
      tracker.provider = response.provider;
      tracker.model = response.model;
      tracker.requestId = response.requestId;
      tracker.usage = response.usage;

      logBatchTelemetry("success", {
        provider: response.provider,
        batchIndex: batchIndex + 1,
        totalBatches,
        sectionIds: batchSections.map((section) => section.sectionId),
        attempt,
        httpStatus: response.telemetry?.httpStatus ?? response.httpStatus,
        remainingTokens: response.telemetry?.remainingTokens ?? null,
        resetTokens: response.telemetry?.resetTokens ?? null,
        remainingRequests: response.telemetry?.remainingRequests ?? null,
        resetRequests: response.telemetry?.resetRequests ?? null,
        finishReason: response.telemetry?.finishReason ?? response.finishReason ?? null,
        truncated: response.telemetry?.truncated ?? false,
        inputTokens: response.usage?.inputTokens ?? null,
        outputTokens: response.usage?.outputTokens ?? null,
      });

      const validated = validateStructuredDocumentResponse(batchSpec, "en", spec.label, generation.request.sectionReadiness, response.structuredOutput);
      const sections: StructuredDocumentSection[] = [];
      for (const validatedSection of validated.sections) {
        const sectionReq = batchSections.find((section) => section.sectionId === validatedSection.sectionId);
        const structureSpec = spec.sections.find((candidate) => candidate.id === validatedSection.sectionId)?.structure;
        if (!sectionReq) {
          throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", `Unexpected section returned: ${validatedSection.sectionId}`);
        }
        const blocks = validatedSection.blocks ?? [];
        validateSectionStructure(blocks, structureSpec);
        validateSemanticWriteGate(blocks, generation.request.resolvedInputs);
        validateContextLeakage(blocks, ((generation.request.semanticFacts as Record<string, unknown[]>)?.[validatedSection.sectionId]) as unknown[]);
        sections.push({
          sectionId: validatedSection.sectionId,
          title: validatedSection.title,
          status: "generated",
          blocks,
        });
      }

      const waitSeconds = shouldWaitForQuota(response.telemetry, DEFAULT_BATCH_MAX_OUTPUT_TOKENS);
      if (waitSeconds) {
        logBatchTelemetry("pause", {
          provider: response.provider,
          batchIndex: batchIndex + 1,
          totalBatches,
          sectionIds: batchSections.map((section) => section.sectionId),
          waitSeconds: waitSeconds + TOKEN_RESET_GRACE_SECONDS,
          remainingTokens: response.telemetry?.remainingTokens ?? null,
          resetTokens: response.telemetry?.resetTokens ?? null,
        });
        await new Promise((resolve) => setTimeout(resolve, (waitSeconds + TOKEN_RESET_GRACE_SECONDS) * 1000));
      }

      return sections;
    } catch (error) {
      lastError = error;
      retries++;
      tracker.totalRetries++;
      const retryAfterSeconds = error instanceof AiProviderError ? error.retryAfterSeconds : undefined;
      logBatchTelemetry("failure", {
        provider: provider.provider,
        batchIndex: batchIndex + 1,
        totalBatches,
        sectionIds: batchSections.map((section) => section.sectionId),
        attempt,
        providerErrorCode: error instanceof AiProviderError ? error.code : "unknown",
        httpStatus: error instanceof AiProviderError ? error.status ?? null : null,
        retryAfterSeconds: retryAfterSeconds ?? null,
        remainingTokens: error instanceof AiProviderError ? error.telemetry?.remainingTokens ?? null : null,
        resetTokens: error instanceof AiProviderError ? error.telemetry?.resetTokens ?? null : null,
        finishReason: error instanceof AiProviderError ? error.telemetry?.finishReason ?? null : null,
        detail: error instanceof Error ? error.message.slice(0, 240) : "unknown",
      });
      if (retries >= 2) break;

      const waitMs = retryAfterSeconds
        ? (retryAfterSeconds + TOKEN_RESET_GRACE_SECONDS) * 1000
        : Math.min(5000 * Math.pow(2, retries - 1), 60000);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  throw lastError || new AiProviderError("AI_PROVIDER_BAD_RESPONSE", `Failed to generate ISP section ${batchIndex + 1} after 2 attempts.`);
}

async function generateBatchedInformationSecurityPolicy(provider: AiDocumentProvider, spec: DocumentTemplateSpec<AiDocumentType>, generation: { request: AiDocumentGenerationRequest }, tracker: GenerationTracker): Promise<StructuredDocumentSection[]> {
  const generatedSections = generation.request.sections.filter((section) => section.expectedStatus === "generated");
  const batches = chunkArray(generatedSections, ISP_BATCH_SIZE);
  const generatedById = new Map<string, StructuredDocumentSection>();

  for (const [batchIndex, batchSections] of batches.entries()) {
    const sections = await generateIspSectionBatch(provider, spec, generation, batchSections, tracker, batchIndex, batches.length);
    for (const section of sections) {
      generatedById.set(section.sectionId, section);
    }
  }

  const assembledSections: StructuredDocumentSection[] = [];
  for (const sectionReq of generation.request.sections) {
    if (sectionReq.expectedStatus !== "generated") {
      const hydratedBlocks = hydrateNonGeneratedSection(generation.request, sectionReq);
      if (!hydratedBlocks || hydratedBlocks.length === 0) {
        throw new Error(`GLOBAL INVARIANT FAILED: Deterministic section '${sectionReq.sectionId}' returned 0 blocks. Hydrator implementation missing or broken.`);
      }
      assembledSections.push({
        sectionId: sectionReq.sectionId,
        title: sectionReq.title,
        status: sectionReq.expectedStatus,
        blocks: hydratedBlocks,
      });
      continue;
    }

    const generated = generatedById.get(sectionReq.sectionId);
    if (!generated) {
      throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", `Missing generated batch section: ${sectionReq.sectionId}`);
    }
    assembledSections.push(generated);
  }

  return assembledSections;
}

function validateSectionStructure(blocks: StructuredDocumentBlock[], structureSpec?: DocumentSectionSpec["structure"]) {
  if (!blocks || blocks.length === 0) {
    throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", `GLOBAL INVARIANT FAILED: Section cannot be completely empty (0 blocks).`);
  }
  if (!structureSpec) return;
  if (structureSpec.minBlocks && blocks.length < structureSpec.minBlocks) {
    throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", `Too few blocks generated. Expected at least ${structureSpec.minBlocks}, got ${blocks.length}`);
  }
  if (structureSpec.requiredBlocks) {
    const types = new Set(blocks.map(b => b.type));
    for (const reqType of structureSpec.requiredBlocks) {
      if (!types.has(reqType as StructuredDocumentBlock["type"])) {
        throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", `Missing required block type: ${reqType}`);
      }
    }
  }
}

async function generateDocumentFromSections(provider: AiDocumentProvider, spec: DocumentTemplateSpec<AiDocumentType>, generation: { request: AiDocumentGenerationRequest }, tracker: GenerationTracker): Promise<StructuredDocumentSection[]> {
  const assembledSections: StructuredDocumentSection[] = [];
  
  for (const sectionReq of generation.request.sections) {
    if (sectionReq.expectedStatus !== "generated") {
      const hydratedBlocks = hydrateNonGeneratedSection(generation.request, sectionReq);
      if (!hydratedBlocks || hydratedBlocks.length === 0) {
        throw new Error(`GLOBAL INVARIANT FAILED: Deterministic section '${sectionReq.sectionId}' returned 0 blocks. Hydrator implementation missing or broken.`);
      }
      assembledSections.push({
        sectionId: sectionReq.sectionId,
        title: sectionReq.title,
        status: sectionReq.expectedStatus,
        content: "",
        blocks: hydratedBlocks
      });
      continue;
    }

    if (assembledSections.length > 0) {
      await new Promise(r => setTimeout(r, 5000));
    }

    let success = false;
    let retries = 0;
    let validatedBlocks: StructuredDocumentBlock[] = [];
    let lastError: unknown;

    while (!success && retries < 3) {
      try {
        validatedBlocks = await generateDocumentSection(provider, spec, generation.request, sectionReq, tracker);
        const structureSpec = spec.sections.find((s: DocumentSectionSpec) => s.id === sectionReq.sectionId)?.structure;
        validateSectionStructure(validatedBlocks, structureSpec);
        validateSemanticWriteGate(validatedBlocks, generation.request.resolvedInputs);
          validateContextLeakage(validatedBlocks, ((generation.request.semanticFacts as Record<string, unknown[]>)?.[sectionReq.sectionId]) as unknown[]);
        success = true;
        if (tracker) {
          tracker.retriesPerSection[sectionReq.sectionId] = retries;
        }
      } catch (e) {
        lastError = e;
        retries++;
        if (tracker) tracker.totalRetries++;
        
        let waitMs = 5000;
        if (e instanceof AiProviderError && e.code === "AI_PROVIDER_RATE_LIMITED" && e.retryAfterSeconds) {
           waitMs = (e.retryAfterSeconds + 2) * 1000;
           console.warn("AI provider retry-after delay applied", { provider: provider.provider, retryAfterSeconds: e.retryAfterSeconds });
        } else {
           waitMs = Math.min(5000 * Math.pow(2, retries - 1), 60000); // 5s, 10s backoff for others
        }
        
         console.warn("AI document section attempt failed", { provider: provider.provider, attemptCount: retries, waitMs, code: e instanceof AiProviderError ? e.code : "unknown" });
        
        if (retries < 3) {
           await new Promise(r => setTimeout(r, waitMs));
        }
      }
    }

    if (!success) {
      throw lastError || new AiProviderError("AI_PROVIDER_BAD_RESPONSE", `Failed to generate section ${sectionReq.sectionId} after 3 attempts.`);
    }

    assembledSections.push({
      sectionId: sectionReq.sectionId,
      title: sectionReq.title,
      status: "generated",
      blocks: validatedBlocks
    });
  }

  return assembledSections;
}

export async function POST(request: Request) {
  let auditWorkspacePresent = false;
  let auditDocumentType = "unknown";
  let auditProvider = "server-configured";
  let auditTracker: GenerationTracker | undefined;
  try {
    const payload = await request.json() as { workspaceId?: string; documentType?: string; setup?: Record<string, unknown> };
    const workspaceId = payload.workspaceId?.trim() ?? "";
    const documentType = payload.documentType as SupportedAiDocumentType;
    auditWorkspacePresent = Boolean(workspaceId);
    auditDocumentType = typeof payload.documentType === "string" ? payload.documentType : "unknown";
    if (!workspaceId || !CANONICAL_AI_DOCUMENT_TYPES.includes(documentType)) return NextResponse.json({ error: "Invalid generation request" }, { status: 400 });
    const { client, user } = await authenticatedWorkspaceClient(workspaceId);
    const [evidence, aiDocuments, responses] = await Promise.all([
      client.from("evidence_items").select("id,document_type,document_version,effective_date,review_date,document_owner_id,original_filename,created_at,updated_at").eq("workspace_id", workspaceId),
      client.from("ai_documents").select("*").eq("workspace_id", workspaceId),
      client.from("assessment_responses").select("theme_id,control_id,question_id,answer,justification").eq("workspace_id", workspaceId),
    ]);
    if (evidence.error || aiDocuments.error || responses.error) throw evidence.error ?? aiDocuments.error ?? responses.error;
    const registry = buildAiDocumentsRegistry(evidence.data as RegistryEvidenceRow[], aiDocuments.data as RegistryAiDocumentRow[]);
    const context = prepareGenerationContext(documentType, workspaceGenerationInput(user, responses.data as never[], registry, payload.setup ?? {}));
    const preparation = normalizeContext(context);
    
    if (preparation.missingInputs.length || Object.values(preparation.sectionReadiness).includes("blocked")) return NextResponse.json({ error: "Required document information is missing.", code: "MISSING_INPUTS", missing: preparation.missingInputs }, { status: 409 });
  
    const raw = context as unknown as Record<string, unknown>; const spec = getAiDocumentTemplateSpec(documentType);
    const semanticFacts = (raw.semanticFacts ?? {}) as Record<string, readonly unknown[]>;
    const knownInputs = (raw.knownInputs ?? {}) as Record<string, unknown>;
    const generation = buildCommonDocumentGenerationRequest({ documentType, templateVersion: String(raw.templateVersion ?? (raw.template as Record<string, unknown>)?.version), mappingVersion: String(raw.mappingVersion ?? (raw.generationContract as Record<string, unknown>)?.mappingVersion), generationContractVersion: String(raw.generationContractVersion ?? (raw.generationContract as Record<string, unknown>)?.version), documentTitle: spec.label, language: "en", semanticFacts, policyIntent: Object.fromEntries(spec.sections.map((section) => [section.id, { useNormativePolicyLanguage: true, currentFactsAreNotPolicyClaims: true }])), resolvedInputs: knownInputs, sectionReadiness: preparation.sectionReadiness, generationConstraints: [
      `Return the exact ${spec.sections.length} sections in canonical order.`,
      "Use concise policy language; never invent current-state facts.",
      ...(documentType === "information_security_policy" ? [
        "ISP grounding: use only concrete roles, systems, channels, classifications, jurisdictions, owners, approvers, frequencies and metrics that appear in resolvedInputs or semanticFacts.",
        "Known facts are the only source for concrete organizational claims. Normative language may describe future requirements but must not assert that an unsourced role, system, register, repository, channel, frequency, KPI or legal jurisdiction exists.",
        "If a role or system is not a known fact, use 'designated responsible role', 'assigned responsible person', 'responsibility to be assigned', or 'approved internal communication channel' as appropriate.",
        "For Risk Management, do not invent named responsibilities or a five-step process unless supported by facts.",
        "For Monitoring, do not invent metric owners or KPI names.",
        "Never output internal control IDs, assessment question IDs, source IDs, database keys, or implementation-state labels.",
        "Do not mention AI, prompts, questionnaires, TODOs, placeholders, or ISO certification claims in the policy text.",
      ] : []),
    ] });
    // ISP is the controlled first migration. Other document types keep the existing provider selection.
    const provider = documentType === "information_security_policy" ? new OpenAiDocumentProvider() : getAiDocumentProvider();
    auditProvider = provider.provider;
    
    // TRACKER
    const tracker: GenerationTracker = { totalProviderCalls: 0, totalRetries: 0, retriesPerSection: {} as Record<string, number>, totalTimeMs: 0, sectionsGenerated: 0 };
    auditTracker = tracker;
    console.info("AI Documents generation started", { workspacePresent: Boolean(workspaceId), documentType, sectionCount: spec.sections.length, provider: provider.provider });
    
    // Assemble the document either in batches for ISP or section by section for other templates.
    const assembledSections = documentType === "information_security_policy"
      ? await generateBatchedInformationSecurityPolicy(provider, spec, generation, tracker)
      : await generateDocumentFromSections(provider, spec, generation, tracker);
    
    // Construct the final structured output to pass to the persistence layer
    const finalStructuredOutput: StructuredDocument = {
      documentType: spec.documentType,
      language: "en",
      title: spec.label,
      sections: assembledSections
    };

    if (documentType === "information_security_policy") {
      const groundingErrors = validateInformationSecurityPolicyLiveQuality(finalStructuredOutput, context as never);
      if (groundingErrors.length) {
        throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", `ISP grounding validation failed: ${groundingErrors.join("; ")}`);
      }
    }

    const saved = await persistValidatedAiDocumentDraft({
      client: client as unknown as DraftPersistenceClient,
      workspaceId,
      documentType,
      idempotencyKey: `ui-${documentType}-${crypto.randomUUID()}`,
      context: {
        ...context,
        templateVersion: String(raw.templateVersion ?? (raw.template as Record<string, unknown>)?.version),
        mappingVersion: String(raw.mappingVersion ?? (raw.generationContract as Record<string, unknown>)?.mappingVersion),
        generationContractVersion: String(raw.generationContractVersion ?? (raw.generationContract as Record<string, unknown>)?.version)
      } as never,
      providerResponse: {
        provider: tracker.provider ?? provider.provider,
        model: tracker.model ?? provider.model,
        requestId: tracker.requestId,
        usage: tracker.usage,
        httpStatus: 200,
        status: "completed",
        structuredOutput: finalStructuredOutput
      },
    });
    
    console.info("AI Documents generation completed", { workspacePresent: Boolean(workspaceId), documentType, sectionCount: spec.sections.length, provider: tracker.provider ?? provider.provider, attemptCount: tracker.totalProviderCalls, outcome: "success" });
    return NextResponse.json({ document: saved, tracker, knownInputs }, { status: 201 });
  } catch (cause) {
    if (cause instanceof WorkspaceHttpError) return NextResponse.json({ error: cause.message }, { status: cause.status });
    const code = cause instanceof AiProviderError ? cause.code : cause instanceof Error && "code" in cause ? String((cause as { code?: unknown }).code) : undefined;
    const retryAfterSeconds = cause instanceof AiProviderError ? cause.retryAfterSeconds : undefined;
    console.warn("AI Documents generation failed", { workspacePresent: auditWorkspacePresent, documentType: auditDocumentType, provider: auditProvider, attemptCount: auditTracker?.totalProviderCalls ?? 0, outcome: "failure", code: code ?? "unknown", detail: cause instanceof Error ? cause.message.slice(0, 500) : "unknown" });
    return NextResponse.json({ error: safeGenerationError(code), code, ...(retryAfterSeconds ? { retryAfterSeconds } : {}) }, { status: code === "AI_PROVIDER_TIMEOUT" ? 504 : code === "AI_PROVIDER_RATE_LIMITED" ? 429 : 422 });
  }
}

