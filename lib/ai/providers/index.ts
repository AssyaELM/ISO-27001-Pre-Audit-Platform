import { getOpenRouterConfig } from "./config.ts";
import { OpenRouterAiDocumentProvider } from "./openrouter.ts";
import { GeminiAiDocumentProvider, getGeminiConfig } from "./gemini.ts";
import { GroqAiDocumentProvider, getGroqConfig } from "./groq.ts";
import type { AiDocumentProvider } from "./types.ts";

export function getAiDocumentProvider(environment: Record<string, string | undefined> = process.env): AiDocumentProvider {
  if (environment.GROQ_API_KEY?.trim()) {
    return new GroqAiDocumentProvider({ config: getGroqConfig(environment) });
  }
  if (environment.GEMINI_API_KEY?.trim()) {
    return new GeminiAiDocumentProvider({ config: getGeminiConfig(environment) });
  }
  return new OpenRouterAiDocumentProvider({ config: getOpenRouterConfig(environment) });
}

export * from "./types.ts";
export * from "./config.ts";
export * from "./openrouter.ts";
export * from "./gemini.ts";
export * from "./groq.ts";
export * from "./smoke-schema.ts";
export * from "./json-recovery.ts";
export * from "./structured-capability.ts";
export * from "./openai.ts";
