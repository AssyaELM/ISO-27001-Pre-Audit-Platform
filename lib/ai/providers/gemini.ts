import {
  AiProviderError,
  type AiDocumentGenerationRequest,
  type AiDocumentGenerationResponse,
  type AiDocumentProvider,
} from "./types.ts";

export type GeminiConfig = {
  apiKey: string;
  model: string;
};

const nonEmpty = (value: string | undefined): string | undefined => value?.trim() || undefined;

export function getGeminiConfig(environment: Record<string, string | undefined> = process.env): GeminiConfig {
  const apiKey = nonEmpty(environment.GEMINI_API_KEY);
  if (!apiKey) throw new AiProviderError("AI_PROVIDER_NOT_CONFIGURED", "Gemini API key is not configured.");
  return { apiKey, model: nonEmpty(environment.GEMINI_MODEL) ?? "gemini-2.5-flash" };
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function errorForStatus(status: number, safeDetail?: string, retryAfterSeconds?: number): AiProviderError {
  if (status === 401 || status === 403) return new AiProviderError("AI_PROVIDER_UNAUTHORIZED", "AI provider authentication failed.", status);
  if (status === 429) return new AiProviderError("AI_PROVIDER_RATE_LIMITED", "AI provider rate limit reached.", status, safeDetail, retryAfterSeconds);
  return new AiProviderError("AI_PROVIDER_UNAVAILABLE", "AI provider is unavailable.", status, safeDetail);
}

export class GeminiAiDocumentProvider implements AiDocumentProvider {
  readonly provider = "gemini";
  readonly model: string;
  private readonly apiKey: string;
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;

  constructor(options: { config?: GeminiConfig; environment?: Record<string, string | undefined>; fetchImpl?: FetchLike; timeoutMs?: number } = {}) {
    const config = options.config ?? getGeminiConfig(options.environment);
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  // Convert generic JSON Schema to Gemini Schema
  private mapSchemaToGemini(schema: Record<string, unknown>): Record<string, unknown> {
    const geminiSchema = { ...schema };
    if (typeof geminiSchema.type === "string") {
      geminiSchema.type = geminiSchema.type.toUpperCase();
    }
    if (geminiSchema.properties && typeof geminiSchema.properties === "object") {
      const newProps: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(geminiSchema.properties)) {
        newProps[k] = this.mapSchemaToGemini(v as Record<string, unknown>);
      }
      geminiSchema.properties = newProps;
    }
    if (geminiSchema.items && typeof geminiSchema.items === "object") {
      geminiSchema.items = this.mapSchemaToGemini(geminiSchema.items as Record<string, unknown>);
    }
    
    // Gemini does not support these standard JSON schema keywords
    delete geminiSchema.additionalProperties;
    delete geminiSchema.$schema;
    
    if (Array.isArray(geminiSchema.enum)) {
      if (geminiSchema.enum.some((e) => typeof e !== "string")) {
        delete geminiSchema.enum;
      }
    }
    
    return geminiSchema;
  }

  private async complete(messages: readonly { role: "system" | "user"; content: string }[], providerOptions?: AiDocumentGenerationRequest["providerOptions"]): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      
      const contents = [];
      let systemInstruction = undefined;
      for (const m of messages) {
        if (m.role === "system") {
          systemInstruction = { parts: [{ text: m.content }] };
        } else {
          contents.push({ role: "user", parts: [{ text: m.content }] });
        }
      }

      const generationConfig: Record<string, unknown> = {};
      if (providerOptions?.responseSchema) {
        generationConfig.responseMimeType = "application/json";
        generationConfig.responseSchema = this.mapSchemaToGemini(providerOptions.responseSchema);
      } else {
        generationConfig.responseMimeType = "application/json";
      }

      if (providerOptions?.maxOutputTokens) {
        generationConfig.maxOutputTokens = providerOptions.maxOutputTokens;
      }

      const response = await this.fetchImpl(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction,
          contents,
          generationConfig
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const txt = await response.text().catch(() => "");
        let retryAfterSeconds: number | undefined;
        if (response.status === 429) {
          const headers: Record<string, string> = {};
          response.headers.forEach((v, k) => { headers[k] = v; });
          console.warn(`[DIAGNOSTIC] Gemini 429 Rate Limit. Model: ${this.model}. Headers: ${JSON.stringify(headers)}. Body: ${txt.slice(0, 500)}`);
          
          if (headers["retry-after"]) {
            retryAfterSeconds = parseInt(headers["retry-after"], 10);
          }
          if (!retryAfterSeconds || isNaN(retryAfterSeconds)) {
            const match = txt.match(/"retryDelay":\s*"(\d+)s"/);
            if (match) retryAfterSeconds = parseInt(match[1], 10);
          }
          if (!retryAfterSeconds || isNaN(retryAfterSeconds)) {
            const match = txt.match(/retry in ([\d\.]+)s/);
            if (match) retryAfterSeconds = Math.ceil(parseFloat(match[1]));
          }
          if (!retryAfterSeconds || isNaN(retryAfterSeconds)) {
            retryAfterSeconds = 60; // safe fallback
          }
        }
        throw errorForStatus(response.status, txt.slice(0, 300), retryAfterSeconds);
      }

      const responseText = await response.text();
      let body: any; // eslint-disable-line @typescript-eslint/no-explicit-any
      try { body = JSON.parse(responseText); }
      catch { throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "AI provider returned malformed JSON.", response.status); }

      const content = body.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      return {
        provider: this.provider,
        model: this.model,
        httpStatus: 200,
        content,
        usage: {
          inputTokens: body.usageMetadata?.promptTokenCount,
          outputTokens: body.usageMetadata?.candidatesTokenCount,
          totalTokens: body.usageMetadata?.totalTokenCount
        },
        diagnostics: {
          choicesCount: body.candidates?.length ?? 0,
          modelReturned: true,
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

  parseRawStructuredDocument(response: any): AiDocumentGenerationResponse { // eslint-disable-line @typescript-eslint/no-explicit-any
    let structuredOutput: unknown;
    try {
      let content = response.content.trim();
      if (content.startsWith("\`\`\`json")) {
        content = content.substring(7);
        if (content.endsWith("\`\`\`")) content = content.substring(0, content.length - 3);
      } else if (content.startsWith("\`\`\`")) {
        content = content.substring(3);
        if (content.endsWith("\`\`\`")) content = content.substring(0, content.length - 3);
      }
      content = content.trim();
      structuredOutput = JSON.parse(content);
    } catch { 
      throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "AI provider structured output is invalid JSON.", response.httpStatus); 
    }
    return { provider: response.provider, model: response.model, requestId: response.requestId, httpStatus: response.httpStatus, status: "completed", structuredOutput, usage: response.usage, finishReason: response.finishReason, diagnostics: response.diagnostics };
  }

  async generateStructuredDocument(request: AiDocumentGenerationRequest): Promise<AiDocumentGenerationResponse> {
    const { systemInstructions, ...normalizedRequest } = request;
    const raw = await this.complete([{ role: "system", content: systemInstructions }, { role: "user", content: JSON.stringify(normalizedRequest) }], request.providerOptions);
    return this.parseRawStructuredDocument(raw);
  }
}
