export type AiProviderErrorCode =
  | "AI_PROVIDER_NOT_CONFIGURED"
  | "AI_PROVIDER_UNAUTHORIZED"
  | "AI_PROVIDER_RATE_LIMITED"
  | "AI_PROVIDER_UNAVAILABLE"
  | "AI_PROVIDER_TIMEOUT"
  | "AI_PROVIDER_BAD_RESPONSE"
  | "AI_PROVIDER_INVALID_REQUEST";

export class AiProviderError extends Error {
  readonly code: AiProviderErrorCode;
  readonly status?: number;
  readonly safeDetail?: string;
  readonly retryAfterSeconds?: number;
  telemetry?: AiProviderTelemetry;

  constructor(code: AiProviderErrorCode, message: string, status?: number, safeDetail?: string, retryAfterSeconds?: number) {
    super(message);
    this.name = "AiProviderError";
    this.code = code;
    this.status = status;
    this.safeDetail = safeDetail;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export type AiDocumentLanguage = "en" | "fr";
export type AiDocumentGenerationSection = {
  sectionId: string;
  title: string;
  generationMode: "static" | "deterministic" | "ai_later";
  expectedStatus: "generated" | "static" | "needs_input";
  facts: readonly unknown[];
  policyIntent: Record<string, unknown>;
  resolvedInputs: Record<string, unknown>;
  prohibitedInferences: readonly string[];
  structuralInstructions?: string;
};

export type AiDocumentGenerationRequest = {
  documentType: string;
  templateVersion: string;
  mappingVersion: string;
  generationContractVersion: string;
  documentTitle: string;
  language: AiDocumentLanguage;
  systemInstructions: string;
  sections: readonly AiDocumentGenerationSection[];
  semanticFacts: readonly unknown[] | Record<string, readonly unknown[]>;
  policyIntent: Record<string, unknown>;
  resolvedInputs: Record<string, unknown>;
  sectionReadiness: Record<string, "ready" | "partial" | "blocked">;
  generationConstraints: readonly string[];
  providerOptions?: {
    responseSchema?: Record<string, unknown>;
    maxOutputTokens?: number;
    reasoning?: { enabled: false } | { effort: "low" | "medium" | "high" };
  };
};

export type AiProviderUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type AiProviderTelemetry = {
  httpStatus?: number;
  retryAfterSeconds?: number;
  remainingTokens?: number | null;
  resetTokens?: string | null;
  remainingRequests?: number | null;
  resetRequests?: string | null;
  finishReason?: string | null;
  truncated?: boolean;
};

export type AiDocumentGenerationResponse = {
  provider: string;
  model: string;
  requestId?: string;
  httpStatus: 200;
  status: "completed";
  structuredOutput: unknown;
  usage?: AiProviderUsage;
  finishReason?: string;
  telemetry?: AiProviderTelemetry;
  diagnostics?: { choicesCount: number; modelReturned: boolean; contentPresent: boolean; contentLength: number; reasoningPresent: boolean };
};

export interface AiDocumentProvider {
  readonly provider: string;
  readonly model: string;
  generateStructuredDocument(request: AiDocumentGenerationRequest): Promise<AiDocumentGenerationResponse>;
}

export type AiJsonRepairRequest = {
  previousResponse: string;
  expectedSchema: unknown;
};

export type AiProviderSafeLog = {
  provider: string;
  model: string;
  documentType: string;
  durationMs: number;
  status: "completed" | "failed";
  requestId?: string;
  errorCode?: AiProviderErrorCode;
};
