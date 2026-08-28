import { AiProviderError, type AiDocumentGenerationRequest, type AiDocumentGenerationResponse, type AiDocumentProvider, type AiProviderTelemetry } from "./types.ts";

export const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
export const OPENAI_DEFAULT_MODEL = "gpt-5.6-luna";
export const OPENAI_DEFAULT_REASONING_EFFORT = "medium" as const;

export type OpenAiConfig = { apiKey: string; model: string; reasoningEffort: "low" | "medium" | "high" };
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const nonEmpty = (value: string | undefined): string | undefined => value?.trim() || undefined;

export function getOpenAiConfig(environment: Record<string, string | undefined> = process.env): OpenAiConfig {
  const apiKey = nonEmpty(environment.OPENAI_API_KEY);
  if (!apiKey) throw new AiProviderError("AI_PROVIDER_NOT_CONFIGURED", "OpenAI API key is not configured.");
  const configuredEffort = nonEmpty(environment.OPENAI_REASONING_EFFORT) ?? OPENAI_DEFAULT_REASONING_EFFORT;
  const reasoningEffort = configuredEffort === "low" || configuredEffort === "medium" || configuredEffort === "high" ? configuredEffort : OPENAI_DEFAULT_REASONING_EFFORT;
  return { apiKey, model: nonEmpty(environment.OPENAI_MODEL) ?? OPENAI_DEFAULT_MODEL, reasoningEffort };
}

type OpenAiResponse = {
  id?: string;
  model?: string;
  status?: string;
  output?: readonly { type?: string; content?: readonly { type?: string; text?: string }[] }[];
  output_text?: string;
  usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
  incomplete_details?: { reason?: string } | null;
};

function retryAfterSeconds(response: Response): number | undefined {
  const value = response.headers.get("retry-after");
  if (!value) return undefined;
  const seconds = Number.parseInt(value, 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

function telemetry(response: Response, finishReason?: string, truncated = false): AiProviderTelemetry {
  return {
    httpStatus: response.status,
    retryAfterSeconds: retryAfterSeconds(response),
    remainingTokens: null,
    resetTokens: null,
    remainingRequests: null,
    resetRequests: null,
    finishReason: finishReason ?? null,
    truncated,
  };
}

async function safeDetail(response: Response): Promise<string | undefined> {
  try {
    const body = await response.json() as { error?: { code?: unknown; message?: unknown } };
    const code = typeof body.error?.code === "string" ? body.error.code : undefined;
    const message = typeof body.error?.message === "string" ? body.error.message : undefined;
    return [code, message?.replace(/Bearer\s+\S+|sk-[\w-]+/gi, "[redacted]")].filter(Boolean).join(": ").slice(0, 300) || undefined;
  } catch {
    return undefined;
  }
}

function requestIdFromHeaders(response: Response): string | undefined {
  return response.headers.get("x-request-id") ?? response.headers.get("request-id") ?? undefined;
}

function errorForStatus(status: number, detail: string | undefined, retryAfter: number | undefined): AiProviderError {
  if (status === 401 || status === 403) return new AiProviderError("AI_PROVIDER_UNAUTHORIZED", "AI provider authentication failed.", status, detail);
  if (status === 429) return new AiProviderError("AI_PROVIDER_RATE_LIMITED", "AI provider rate limit reached.", status, detail, retryAfter);
  if (status >= 500) return new AiProviderError("AI_PROVIDER_UNAVAILABLE", "AI provider is unavailable.", status, detail);
  return new AiProviderError("AI_PROVIDER_INVALID_REQUEST", "AI provider rejected the generation request.", status, detail);
}

function extractText(body: OpenAiResponse): string {
  if (typeof body.output_text === "string") return body.output_text;
  return (body.output ?? []).flatMap((item) => item.content ?? []).filter((part) => part.type === "output_text" && typeof part.text === "string").map((part) => part.text as string).join("");
}

export class OpenAiDocumentProvider implements AiDocumentProvider {
  readonly provider = "openai";
  readonly model: string;
  private readonly apiKey: string;
  private readonly reasoningEffort: "low" | "medium" | "high";
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;

  constructor(options: { config?: OpenAiConfig; environment?: Record<string, string | undefined>; fetchImpl?: FetchLike; timeoutMs?: number } = {}) {
    const config = options.config ?? getOpenAiConfig(options.environment);
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.reasoningEffort = config.reasoningEffort;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? 90_000;
  }

  async generateStructuredDocument(request: AiDocumentGenerationRequest): Promise<AiDocumentGenerationResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const effort = request.providerOptions?.reasoning && "effort" in request.providerOptions.reasoning ? request.providerOptions.reasoning.effort : this.reasoningEffort;
    try {
      const response = await this.fetchImpl(OPENAI_RESPONSES_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          reasoning: { effort },
          input: [
            { role: "system", content: [{ type: "input_text", text: request.systemInstructions }] },
            { role: "user", content: [{ type: "input_text", text: JSON.stringify({ ...request, systemInstructions: undefined }) }] },
          ],
          ...(request.providerOptions?.responseSchema ? { text: { format: { type: "json_schema", name: "normcore_structured_document", schema: request.providerOptions.responseSchema, strict: false } } } : {}),
          ...(request.providerOptions?.maxOutputTokens ? { max_output_tokens: request.providerOptions.maxOutputTokens } : {}),
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const detail = await safeDetail(response);
        console.warn("OpenAI request rejected", {
          provider: "openai",
          model: this.model,
          httpStatus: response.status,
          requestId: requestIdFromHeaders(response) ?? null,
          retryAfterSeconds: retryAfterSeconds(response) ?? null,
          detail: detail ?? null,
        });
        throw errorForStatus(response.status, detail, retryAfterSeconds(response));
      }
      const responseText = await response.text();
      let body: OpenAiResponse;
      try { body = JSON.parse(responseText) as OpenAiResponse; }
      catch { throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "OpenAI returned malformed JSON.", response.status); }
      const content = extractText(body).trim();
      if (!content) throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "OpenAI returned no structured output.", response.status);
      let structuredOutput: unknown;
      try { structuredOutput = JSON.parse(content); }
      catch { throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "OpenAI structured output is invalid JSON.", response.status); }
      const finishReason = body.incomplete_details?.reason ?? (body.status === "completed" ? "completed" : body.status);
      return {
        provider: this.provider,
        model: body.model ?? this.model,
        requestId: body.id,
        httpStatus: 200,
        status: "completed",
        structuredOutput,
        usage: body.usage ? { inputTokens: body.usage.input_tokens, outputTokens: body.usage.output_tokens, totalTokens: body.usage.total_tokens } : undefined,
        finishReason,
        telemetry: telemetry(response, finishReason, body.status === "incomplete"),
        diagnostics: { choicesCount: body.output?.length ?? 0, modelReturned: Boolean(body.model), contentPresent: true, contentLength: content.length, reasoningPresent: (body.output ?? []).some((item) => item.type === "reasoning") },
      };
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      if (controller.signal.aborted || (error instanceof Error && error.name === "AbortError")) throw new AiProviderError("AI_PROVIDER_TIMEOUT", "AI provider request timed out.");
      const cause = error instanceof Error ? error.cause : undefined;
      const transportDetail = {
        name: error instanceof Error ? error.name : "unknown",
        code: cause && typeof cause === "object" && "code" in cause ? String((cause as { code?: unknown }).code) : null,
        errno: cause && typeof cause === "object" && "errno" in cause ? String((cause as { errno?: unknown }).errno) : null,
        message: cause instanceof Error ? cause.message.slice(0, 180) : error instanceof Error ? error.message.slice(0, 180) : "unknown",
      };
      console.warn("OpenAI request transport failure", { provider: "openai", model: this.model, ...transportDetail });
      throw new AiProviderError("AI_PROVIDER_UNAVAILABLE", "AI provider is unavailable.", undefined, JSON.stringify(transportDetail));
    } finally {
      clearTimeout(timeout);
    }
  }
}
