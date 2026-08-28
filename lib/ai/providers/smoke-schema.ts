import { AiProviderError } from "./types.ts";

export type OpenRouterSmokeStructuredOutput = {
  documentType: string;
  sections: readonly { sectionId: string; content: string }[];
};

export function validateOpenRouterSmokeStructuredOutput(value: unknown): OpenRouterSmokeStructuredOutput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Smoke-test structured output must be an object.");
  const object = value as Record<string, unknown>;
  if (typeof object.documentType !== "string" || !object.documentType.trim()) throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Smoke-test structured output is missing documentType.");
  if (!Array.isArray(object.sections) || object.sections.length === 0) throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Smoke-test structured output is missing sections.");
  for (const section of object.sections) {
    if (!section || typeof section !== "object" || Array.isArray(section)) throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Smoke-test section is invalid.");
    const item = section as Record<string, unknown>;
    if (typeof item.sectionId !== "string" || !item.sectionId.trim() || typeof item.content !== "string" || !item.content.trim()) throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Smoke-test section is missing content.");
  }
  return value as OpenRouterSmokeStructuredOutput;
}
