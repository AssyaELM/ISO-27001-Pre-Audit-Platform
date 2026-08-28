import { getOpenRouterConfig, type OpenRouterConfig } from "./config.ts";
import {
  AiProviderError,
  type AiDocumentGenerationRequest,
  type AiDocumentGenerationResponse,
  type AiDocumentProvider,
  type AiJsonRepairRequest,
  type AiProviderSafeLog,
} from "./types.ts";

export const OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions";

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type OpenRouterResponse = {
  id?: string;
  model?: string;
  choices?: readonly { finish_reason?: string | null; message?: { content?: string | null; reasoning?: string | null } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
};

export type OpenRouterRawStructuredResponse = {
  provider: "openrouter";
  model: string;
  requestId?: string;
  httpStatus: 200;
  content: string;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
  finishReason?: string;
  diagnostics: {
    choicesCount: number;
    modelReturned: boolean;
    contentPresent: boolean;
    contentLength: number;
    reasoningPresent: boolean;
  };
};

const forbiddenKey = /(^|_)(password|secret|credential|api[_-]?key|access[_-]?token|refresh[_-]?token|private[_-]?key|licen[cs]e[_-]?key|encryption[_-]?key)(_|$)|^authorization$/i;
const forbiddenPayloadKey = /(^|_)(raw_?assessment|assessment_?responses|raw_?evidence|evidence_?content|source_?trace|full_?asset_?register|asset_?register|hardware_?inventory|software_?inventory|gap_?analysis|remediation_?plan)$/i;

function validateValue(value: unknown, path = "request"): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateValue(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (forbiddenKey.test(key) || forbiddenPayloadKey.test(key)) throw new AiProviderError("AI_PROVIDER_INVALID_REQUEST", `Generation request contains a prohibited field at ${path}.${key}.`);
    validateValue(nested, `${path}.${key}`);
  }
}

export function assertSafeAiDocumentGenerationRequest(request: AiDocumentGenerationRequest): void {
  validateValue(request);
  if (!request.documentType || !request.templateVersion || !request.mappingVersion || !request.generationContractVersion || !request.documentTitle || !request.systemInstructions || !["en", "fr"].includes(request.language) || !request.sections.length) throw new AiProviderError("AI_PROVIDER_INVALID_REQUEST", "Generation request is missing canonical document metadata.");
}

function errorForStatus(status: number, safeDetail?: string): AiProviderError {
  if (status === 401 || status === 403) return new AiProviderError("AI_PROVIDER_UNAUTHORIZED", "AI provider authentication failed.", status);
  if (status === 429) return new AiProviderError("AI_PROVIDER_RATE_LIMITED", "AI provider rate limit reached.", status);
  return new AiProviderError("AI_PROVIDER_UNAVAILABLE", "AI provider is unavailable.", status, safeDetail);
}

async function readSafeErrorDetail(response: Response): Promise<string | undefined> {
  try {
    const body = await response.json() as { error?: { code?: unknown; message?: unknown }; message?: unknown };
    const code = typeof body.error?.code === "string" ? body.error.code : undefined;
    const message = typeof body.error?.message === "string" ? body.error.message : typeof body.message === "string" ? body.message : undefined;
    return [code, message?.replace(/Bearer\s+\S+|sk-or-v1-\S+/gi, "[redacted]")].filter(Boolean).join(": ").slice(0, 300) || undefined;
  } catch { return undefined; }
}

export function toSafeAiProviderLog(input: AiProviderSafeLog): AiProviderSafeLog {
  return { provider: input.provider, model: input.model, documentType: input.documentType, durationMs: input.durationMs, status: input.status, requestId: input.requestId, errorCode: input.errorCode };
}

export class OpenRouterAiDocumentProvider implements AiDocumentProvider {
  readonly provider = "openrouter";
  readonly model: string;
  private readonly apiKey: string;
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;

  constructor(options: { config?: OpenRouterConfig; environment?: Record<string, string | undefined>; fetchImpl?: FetchLike; timeoutMs?: number } = {}) {
    const config = options.config ?? getOpenRouterConfig(options.environment);
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  private async complete(messages: readonly { role: "system" | "user"; content: string }[], providerOptions?: AiDocumentGenerationRequest["providerOptions"]): Promise<OpenRouterRawStructuredResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(OPENROUTER_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
            response_format: providerOptions?.responseSchema
            ? { type: "json_schema", json_schema: { name: "normcore_structured_document", schema: providerOptions.responseSchema, strict: true } }
            : { type: "json_object" },
          ...(providerOptions?.maxOutputTokens ? { max_tokens: providerOptions.maxOutputTokens } : {}),
          ...(providerOptions?.reasoning ? { reasoning: providerOptions.reasoning } : {}),
          messages,
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw errorForStatus(response.status, await readSafeErrorDetail(response));
      let body: OpenRouterResponse;
      const responseText = await response.text();
      try { body = JSON.parse(responseText) as OpenRouterResponse; }
      catch { throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "AI provider returned malformed JSON.", response.status, `non_json_response:length=${responseText.length}`); }
      const choice = body.choices?.[0];
      const content = typeof choice?.message?.content === "string" ? choice.message.content : "";
      return {
        provider: this.provider,
        model: body.model ?? this.model,
        requestId: body.id,
        httpStatus: 200,
        content,
        usage: body.usage ? { inputTokens: body.usage.prompt_tokens, outputTokens: body.usage.completion_tokens, totalTokens: body.usage.total_tokens } : undefined,
        finishReason: choice?.finish_reason ?? undefined,
        diagnostics: {
          choicesCount: body.choices?.length ?? 0,
          modelReturned: typeof body.model === "string" && body.model.length > 0,
          contentPresent: content.length > 0,
          contentLength: content.length,
          reasoningPresent: typeof choice?.message?.reasoning === "string" && choice.message.reasoning.length > 0,
        },
      };
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) throw new AiProviderError("AI_PROVIDER_TIMEOUT", "AI provider request timed out.");
      throw new AiProviderError("AI_PROVIDER_UNAVAILABLE", "AI provider is unavailable.");
    } finally {
      clearTimeout(timeout);
    }
  }

  parseRawStructuredDocument(response: OpenRouterRawStructuredResponse): AiDocumentGenerationResponse {
    let structuredOutput: unknown;
    try {
      let content = response.content.trim();
      if (content.startsWith("```json")) {
        content = content.substring(7);
        if (content.endsWith("```")) content = content.substring(0, content.length - 3);
      } else if (content.startsWith("```")) {
        content = content.substring(3);
        if (content.endsWith("```")) content = content.substring(0, content.length - 3);
      }
      content = content.trim();
      structuredOutput = JSON.parse(content);
    } catch { 
      throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "AI provider structured output is invalid JSON.", response.httpStatus); 
    }
    return { provider: response.provider, model: response.model, requestId: response.requestId, httpStatus: response.httpStatus, status: "completed", structuredOutput, usage: response.usage, finishReason: response.finishReason, diagnostics: response.diagnostics };
  }

  async generateRawStructuredDocument(request: AiDocumentGenerationRequest): Promise<OpenRouterRawStructuredResponse> {
    assertSafeAiDocumentGenerationRequest(request);
    const { systemInstructions, ...normalizedRequest } = request;
    return this.complete([{ role: "system", content: systemInstructions }, { role: "user", content: JSON.stringify(normalizedRequest) }], request.providerOptions);
  }

  async repairStructuredDocumentJson(request: AiJsonRepairRequest): Promise<AiDocumentGenerationResponse> {
    validateValue(request.expectedSchema, "repair.expectedSchema");
    const raw = await this.complete([
      { role: "system", content: "Convert the previous response into valid JSON matching the exact supplied schema. Do not add, remove, infer, or rewrite substantive content. Return JSON only, with no markdown fences or prose." },
      { role: "user", content: JSON.stringify({ previousResponse: request.previousResponse, expectedSchema: request.expectedSchema }) },
    ], { responseSchema: request.expectedSchema as Record<string, unknown> });
    return this.parseRawStructuredDocument(raw);
  }

  async generateStructuredDocument(request: AiDocumentGenerationRequest): Promise<AiDocumentGenerationResponse> {
    return this.parseRawStructuredDocument(await this.generateRawStructuredDocument(request));
  }
}
