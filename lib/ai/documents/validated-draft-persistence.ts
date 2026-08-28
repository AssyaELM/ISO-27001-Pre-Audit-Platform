import type { AiDocumentGenerationResponse } from "../providers/types.ts";
import { assembleInformationSecurityPolicyDraft, validateInformationSecurityPolicyLiveQuality } from "./information-security-policy-live-validation.ts";
import { validateStructuredDocumentResponse, type StructuredDocument } from "./generation-schema.ts";
import {
  INFORMATION_SECURITY_POLICY_DOCUMENT_TYPE,
  INFORMATION_SECURITY_POLICY_SPEC,
} from "../../ai-documents/information-security-policy.ts";
import type { InformationSecurityPolicyGenerationContext } from "../../ai-documents/information-security-policy-generation-contract.ts";

export class ValidatedDraftPersistenceError extends Error {
  readonly code: "AI_DOCUMENT_WRITE_GATE_FAILED" | "AI_DOCUMENT_PERSISTENCE_FAILED";

  constructor(code: "AI_DOCUMENT_WRITE_GATE_FAILED" | "AI_DOCUMENT_PERSISTENCE_FAILED", message: string) {
    super(message);
    this.name = "ValidatedDraftPersistenceError";
    this.code = code;
  }
}

export type PersistedAiDocumentDraft = {
  id: string;
  workspace_id: string;
  document_type: typeof INFORMATION_SECURITY_POLICY_DOCUMENT_TYPE;
  status: "draft";
  version: string;
  language: "en" | "fr";
  title: string;
  document_content: StructuredDocument;
  template_version: string;
  mapping_version: string;
  generation_contract_version: string;
  provider: string;
  provider_model: string;
  provider_request_id: string | null;
  provider_usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number } | null;
};

export type DraftPersistenceClient = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: PersistedAiDocumentDraft | null; error: { message: string } | null }>;
};

const prohibitedField = /(^|_)(password|secret|credential|api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|prompt|raw_?assessment|assessment_?responses|raw_?evidence|evidence_?content|source_?trace)(_|$)/i;
const secretValue = /sk-or-v1-[\w-]+|Bearer\s+\S+/i;

function assertPersistableValue(value: unknown, path = "draft"): void {
  if (typeof value === "string" && secretValue.test(value)) throw new ValidatedDraftPersistenceError("AI_DOCUMENT_WRITE_GATE_FAILED", `Draft contains a prohibited secret-like value at ${path}.`);
  if (Array.isArray(value)) return value.forEach((item, index) => assertPersistableValue(item, `${path}[${index}]`));
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (prohibitedField.test(key)) throw new ValidatedDraftPersistenceError("AI_DOCUMENT_WRITE_GATE_FAILED", `Draft contains a prohibited field at ${path}.${key}.`);
    assertPersistableValue(nested, `${path}.${key}`);
  }
}

function requireNonEmpty(value: string, label: string): string {
  if (!value.trim()) throw new ValidatedDraftPersistenceError("AI_DOCUMENT_WRITE_GATE_FAILED", `${label} is required for draft persistence.`);
  return value;
}

export function validateInformationSecurityPolicyDraftForPersistence(
  context: InformationSecurityPolicyGenerationContext,
  providerResponse: AiDocumentGenerationResponse,
): StructuredDocument {
  if (providerResponse.status !== "completed" || providerResponse.httpStatus !== 200) {
    throw new ValidatedDraftPersistenceError("AI_DOCUMENT_WRITE_GATE_FAILED", "Provider response did not complete successfully.");
  }
  try {
    const rawDocument = validateStructuredDocumentResponse(
      INFORMATION_SECURITY_POLICY_SPEC,
      "en",
      "Information Security Policy",
      context.sectionReadiness,
      providerResponse.structuredOutput,
    );
    const document = assembleInformationSecurityPolicyDraft(rawDocument);
    const qualityErrors = validateInformationSecurityPolicyLiveQuality(document, context);
    if (qualityErrors.length) throw new ValidatedDraftPersistenceError("AI_DOCUMENT_WRITE_GATE_FAILED", `Generated draft failed mandatory quality validation: ${qualityErrors.join(", ")}.`);
    assertPersistableValue({ document, provider: providerResponse.provider, model: providerResponse.model, requestId: providerResponse.requestId, usage: providerResponse.usage });
    return document;
  } catch (error) {
    if (error instanceof ValidatedDraftPersistenceError) throw error;
    throw new ValidatedDraftPersistenceError("AI_DOCUMENT_WRITE_GATE_FAILED", "Generated draft failed mandatory schema validation.");
  }
}

export async function persistValidatedInformationSecurityPolicyDraft(input: {
  client: DraftPersistenceClient;
  workspaceId: string;
  idempotencyKey: string;
  context: InformationSecurityPolicyGenerationContext;
  providerResponse: AiDocumentGenerationResponse;
}): Promise<PersistedAiDocumentDraft> {
  const workspaceId = requireNonEmpty(input.workspaceId, "workspaceId");
  const idempotencyKey = requireNonEmpty(input.idempotencyKey, "idempotencyKey");
  const document = validateInformationSecurityPolicyDraftForPersistence(input.context, input.providerResponse);
  const response = await input.client.rpc("create_information_security_policy_draft", {
    p_workspace_id: workspaceId,
    p_language: document.language,
    p_title: document.title,
    p_document_content: document,
    p_template_version: input.context.template.version,
    p_mapping_version: input.context.generationContract.mappingVersion,
    p_generation_contract_version: input.context.generationContract.version,
    p_provider: input.providerResponse.provider,
    p_provider_model: input.providerResponse.model,
    p_provider_request_id: input.providerResponse.requestId ?? "",
    p_provider_usage: input.providerResponse.usage ?? null,
    p_idempotency_key: idempotencyKey,
  });
  if (response.error || !response.data) throw new ValidatedDraftPersistenceError("AI_DOCUMENT_PERSISTENCE_FAILED", `Validated draft could not be persisted${response.error?.message ? `: ${response.error.message.slice(0, 240)}` : "."}`);
  return response.data;
}
