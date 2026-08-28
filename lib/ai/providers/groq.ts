import { AiProviderError } from "./types.ts";
import type { AiDocumentProvider, AiDocumentGenerationRequest, AiDocumentGenerationResponse, AiJsonRepairRequest, AiProviderTelemetry } from "./types.ts";

export const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile";
export const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";

export type GroqConfig = {
  apiKey: string;
  model: string;
};

const nonEmpty = (value: string | undefined): string | undefined => value?.trim() || undefined;

export function getGroqConfig(environment: Record<string, string | undefined> = process.env): GroqConfig {
  const apiKey = nonEmpty(environment.GROQ_API_KEY);
  if (!apiKey) throw new AiProviderError("AI_PROVIDER_NOT_CONFIGURED", "AI provider is not configured.");
  return { apiKey, model: nonEmpty(environment.GROQ_MODEL) ?? GROQ_DEFAULT_MODEL };
}

type FetchLike = typeof globalThis.fetch;

export type GroqRawStructuredResponse = {
  provider: "groq";
  model: string;
  requestId?: string;
  httpStatus: 200;
  content: string;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
  finishReason?: string;
  telemetry?: AiProviderTelemetry;
  diagnostics: {
    choicesCount: number;
    modelReturned: boolean;
    contentPresent: boolean;
    contentLength: number;
    reasoningPresent: boolean;
  };
};

function errorForStatus(status: number, safeDetail?: string): AiProviderError {
  if (status === 401 || status === 403) return new AiProviderError("AI_PROVIDER_UNAUTHORIZED", "AI provider authentication failed.", status);
  if (status === 429) return new AiProviderError("AI_PROVIDER_RATE_LIMITED", "AI provider rate limit reached.", status);
  return new AiProviderError("AI_PROVIDER_UNAVAILABLE", "AI provider is unavailable.", status, safeDetail);
}

function parseGroqResetSeconds(value: string | null): number | undefined {
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

function telemetryFromHeaders(response: Response, truncated = false): AiProviderTelemetry {
  const retryAfterHeader = response.headers.get("retry-after");
  return {
    httpStatus: response.status,
    retryAfterSeconds: retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) || undefined : undefined,
    remainingTokens: response.headers.get("x-ratelimit-remaining-tokens") ? Number.parseInt(response.headers.get("x-ratelimit-remaining-tokens") ?? "", 10) : null,
    resetTokens: response.headers.get("x-ratelimit-reset-tokens"),
    remainingRequests: response.headers.get("x-ratelimit-remaining-requests") ? Number.parseInt(response.headers.get("x-ratelimit-remaining-requests") ?? "", 10) : null,
    resetRequests: response.headers.get("x-ratelimit-reset-requests"),
    finishReason: null,
    truncated,
  };
}

async function readSafeErrorDetail(response: Response): Promise<string | undefined> {
  try {
    const body = await response.json() as { error?: { code?: unknown; message?: unknown }; message?: unknown };
    const code = typeof body.error?.code === "string" ? body.error.code : undefined;
    const message = typeof body.error?.message === "string" ? body.error.message : typeof body.message === "string" ? body.message : undefined;
    return [code, message?.replace(/Bearer\s+\S+|sk-or-v1-\S+/gi, "[redacted]")].filter(Boolean).join(": ").slice(0, 300) || undefined;
  } catch { return undefined; }
}

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

function assertSafeAiDocumentGenerationRequest(request: AiDocumentGenerationRequest): void {
  validateValue(request);
  if (!request.documentType || !request.templateVersion || !request.mappingVersion || !request.generationContractVersion || !request.documentTitle || !request.systemInstructions || !["en", "fr"].includes(request.language) || !request.sections.length) throw new AiProviderError("AI_PROVIDER_INVALID_REQUEST", "Generation request is missing canonical document metadata.");
}

export class GroqAiDocumentProvider implements AiDocumentProvider {
  readonly provider = "groq";
  readonly model: string;
  private readonly apiKey: string;
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;

  constructor(options: { config?: GroqConfig; environment?: Record<string, string | undefined>; fetchImpl?: FetchLike; timeoutMs?: number } = {}) {
    const config = options.config ?? getGroqConfig(options.environment);
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  private async complete(messages: readonly { role: "system" | "user"; content: string }[], providerOptions?: AiDocumentGenerationRequest["providerOptions"]): Promise<GroqRawStructuredResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      let promptMessages = messages;
      if (providerOptions?.responseSchema) {
        promptMessages = messages.map(msg => 
          msg.role === "system" 
            ? { role: "system", content: msg.content + "\n\nYou MUST output ONLY valid JSON matching this exact schema:\n" + JSON.stringify(providerOptions.responseSchema) }
            : msg
        );
      }

      const response = await this.fetchImpl(GROQ_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          response_format: { type: "json_object" },
          ...(providerOptions?.maxOutputTokens ? { max_tokens: providerOptions.maxOutputTokens } : {}),
          messages: promptMessages,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errDetails = await readSafeErrorDetail(response);
        const telemetry = telemetryFromHeaders(response, true);
        let retryAfterSeconds = telemetry.retryAfterSeconds;
        if (!retryAfterSeconds) {
          const groqResetRequests = response.headers.get("x-ratelimit-reset-requests");
          const groqResetTokens = response.headers.get("x-ratelimit-reset-tokens");
          const maxReset = Math.max(parseGroqResetSeconds(groqResetRequests) ?? 0, parseGroqResetSeconds(groqResetTokens) ?? 0);
          if (maxReset > 0 && !Number.isNaN(maxReset)) retryAfterSeconds = Math.ceil(maxReset);
        }
        
        if (response.status === 429) {
          const err = new AiProviderError("AI_PROVIDER_RATE_LIMITED", "AI provider rate limit exceeded.", response.status, errDetails);
          err.telemetry = { ...telemetry, retryAfterSeconds };
          if (retryAfterSeconds) Object.defineProperty(err, "retryAfterSeconds", { value: retryAfterSeconds, writable: true, configurable: true, enumerable: true });
          throw err;
        }
        throw errorForStatus(response.status, errDetails);
      }
      
      const responseText = await response.text();
      let body: { model?: string, id?: string, choices?: { message?: { content?: string }, finish_reason?: string }[], usage?: { prompt_tokens?: number, completion_tokens?: number, total_tokens?: number } };
      try { body = JSON.parse(responseText); }
      catch { throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "AI provider returned malformed JSON.", response.status, `non_json_response:length=${responseText.length}`); }
      
      const choice = body.choices?.[0];
      const content = typeof choice?.message?.content === "string" ? choice.message.content : "";
      const telemetry = telemetryFromHeaders(response, content.trim().length > 0 && content.trim().endsWith("..."));
      return {
        provider: this.provider,
        model: body.model ?? this.model,
        requestId: body.id,
        httpStatus: 200,
        content,
        usage: body.usage ? { inputTokens: body.usage.prompt_tokens, outputTokens: body.usage.completion_tokens, totalTokens: body.usage.total_tokens } : undefined,
        finishReason: choice?.finish_reason ?? undefined,
        telemetry: { ...telemetry, httpStatus: response.status, finishReason: choice?.finish_reason ?? null, truncated: choice?.finish_reason === "length" },
        diagnostics: {
          choicesCount: body.choices?.length ?? 0,
          modelReturned: typeof body.model === "string" && body.model.length > 0,
          contentPresent: content.length > 0,
          contentLength: content.length,
          reasoningPresent: false,
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

  private parseRawStructuredDocument(response: GroqRawStructuredResponse): AiDocumentGenerationResponse {
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

  async generateRawStructuredDocument(request: AiDocumentGenerationRequest): Promise<GroqRawStructuredResponse> {
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
