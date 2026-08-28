import { AiProviderError, type AiDocumentGenerationRequest } from "./types.ts";
import { OpenRouterAiDocumentProvider, type OpenRouterRawStructuredResponse } from "./openrouter.ts";

export const OPENROUTER_STRUCTURED_CAPABILITY_VERSION = "1.0.0";
export const OPENROUTER_CAPABILITY_PROBE_TIMEOUT_MS = 60_000;
export const OPENROUTER_CAPABILITY_CACHE_TTL_MS = 30 * 60_000;

export type OpenRouterCapabilityProbeState = "PASS" | "FAIL" | "TIMEOUT";
export type OpenRouterCapabilityCacheEntry = { provider: "openrouter"; model: string; capabilityVersion: string; passedAt: number };
export type OpenRouterCapabilityDecision = { state: OpenRouterCapabilityProbeState; allowGeneration: boolean; cacheUsed: boolean; cacheEntry?: OpenRouterCapabilityCacheEntry };

export const OPENROUTER_STRUCTURED_CAPABILITY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["documentType", "sections"],
  properties: {
    documentType: { const: "structured_capability_probe" },
    sections: {
      type: "array", minItems: 2, maxItems: 2,
      prefixItems: [
        { type: "object", additionalProperties: false, required: ["sectionId", "content"], properties: { sectionId: { const: "purpose" }, content: { type: "string", minLength: 1 } } },
        { type: "object", additionalProperties: false, required: ["sectionId", "content"], properties: { sectionId: { const: "scope" }, content: { type: "string", minLength: 1 } } },
      ],
    },
  },
} as const;

export const openRouterStructuredCapabilityRequest: AiDocumentGenerationRequest = {
  documentType: "structured_capability_probe", templateVersion: "1.0.0", mappingVersion: "1.0.0", generationContractVersion: "1.0.0", documentTitle: "Structured capability probe", language: "en",
  systemInstructions: "Return JSON only. Do not use markdown fences, prose before JSON, or prose after JSON.",
  sections: [
    { sectionId: "purpose", title: "Purpose", generationMode: "ai_later", expectedStatus: "generated", facts: [{ fact: "Synthetic capability test only." }], policyIntent: {}, resolvedInputs: {}, prohibitedInferences: [] },
    { sectionId: "scope", title: "Scope", generationMode: "ai_later", expectedStatus: "generated", facts: [{ fact: "No organizational data is provided." }], policyIntent: {}, resolvedInputs: {}, prohibitedInferences: [] },
  ],
  semanticFacts: [], policyIntent: {}, resolvedInputs: {}, sectionReadiness: { purpose: "ready", scope: "ready" },
  generationConstraints: ["Return the exact two sections purpose and scope in that order."],
  providerOptions: { responseSchema: OPENROUTER_STRUCTURED_CAPABILITY_SCHEMA, maxOutputTokens: 512 },
};

export type OpenRouterStructuredCapabilityResult = { raw: OpenRouterRawStructuredResponse; output: { documentType: "structured_capability_probe"; sections: readonly { sectionId: "purpose" | "scope"; content: string }[] } };

export async function probeOpenRouterStructuredCapability(provider: OpenRouterAiDocumentProvider): Promise<OpenRouterStructuredCapabilityResult> {
  const raw = await provider.generateRawStructuredDocument(openRouterStructuredCapabilityRequest);
  if (!raw.diagnostics.modelReturned || !raw.diagnostics.contentPresent) throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Structured capability probe returned no usable assistant content.", raw.httpStatus);
  const response = provider.parseRawStructuredDocument(raw);
  const value = response.structuredOutput;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Structured capability probe returned an invalid root.", response.httpStatus);
  const root = value as Record<string, unknown>;
  if (root.documentType !== "structured_capability_probe" || !Array.isArray(root.sections) || root.sections.length !== 2) throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Structured capability probe schema validation failed.", response.httpStatus);
  const expected = ["purpose", "scope"] as const;
  const sections = root.sections.map((section, index) => {
    if (!section || typeof section !== "object" || Array.isArray(section)) throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Structured capability probe section is invalid.", response.httpStatus);
    const candidate = section as Record<string, unknown>;
    if (candidate.sectionId !== expected[index] || typeof candidate.content !== "string" || !candidate.content.trim()) throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Structured capability probe section schema validation failed.", response.httpStatus);
    return { sectionId: candidate.sectionId as "purpose" | "scope", content: candidate.content };
  });
  return { raw, output: { documentType: "structured_capability_probe", sections } };
}

export function capabilityCacheKey(provider: "openrouter", model: string, capabilityVersion = OPENROUTER_STRUCTURED_CAPABILITY_VERSION): string {
  return `${provider}:${model}:${capabilityVersion}`;
}

export function decideOpenRouterCapabilityProbe(input: { model: string; now: number; state: OpenRouterCapabilityProbeState; cache?: OpenRouterCapabilityCacheEntry; capabilityVersion?: string }): OpenRouterCapabilityDecision {
  const capabilityVersion = input.capabilityVersion ?? OPENROUTER_STRUCTURED_CAPABILITY_VERSION;
  const cacheIsUsable = Boolean(input.cache
    && input.cache.provider === "openrouter"
    && input.cache.model === input.model
    && input.cache.capabilityVersion === capabilityVersion
    && input.now - input.cache.passedAt >= 0
    && input.now - input.cache.passedAt <= OPENROUTER_CAPABILITY_CACHE_TTL_MS);
  if (input.state === "PASS") return { state: "PASS", allowGeneration: true, cacheUsed: false };
  if (input.state === "TIMEOUT" && cacheIsUsable) return { state: "TIMEOUT", allowGeneration: true, cacheUsed: true, cacheEntry: input.cache };
  return { state: input.state, allowGeneration: false, cacheUsed: false };
}
