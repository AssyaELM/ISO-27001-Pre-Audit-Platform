import { AiProviderError } from "./types.ts";

export const OPENROUTER_DEFAULT_MODEL = "openrouter/free";

export type OpenRouterConfig = {
  apiKey: string;
  model: string;
};

const nonEmpty = (value: string | undefined): string | undefined => value?.trim() || undefined;

export function getOpenRouterConfig(environment: Record<string, string | undefined> = process.env): OpenRouterConfig {
  const apiKey = nonEmpty(environment.OPENROUTER_API_KEY);
  if (!apiKey) throw new AiProviderError("AI_PROVIDER_NOT_CONFIGURED", "AI provider is not configured.");
  return { apiKey, model: nonEmpty(environment.OPENROUTER_MODEL) ?? OPENROUTER_DEFAULT_MODEL };
}
