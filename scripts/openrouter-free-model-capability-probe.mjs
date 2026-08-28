import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AiProviderError, getOpenRouterConfig, OpenRouterAiDocumentProvider, probeOpenRouterStructuredCapability, OPENROUTER_CAPABILITY_PROBE_TIMEOUT_MS, OPENROUTER_STRUCTURED_CAPABILITY_VERSION } from "../lib/ai/providers/index.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env.local");
if (fs.existsSync(envFile)) for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) { const match = line.match(/^([^#=]+)=(.*)$/); if (match && process.env[match[1].trim()] === undefined) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, ""); }
const startedAt = Date.now();
let config;
try {
  config = getOpenRouterConfig();
  if (!config.model.endsWith(":free")) throw new AiProviderError("AI_PROVIDER_INVALID_REQUEST", "The capability probe requires an explicit :free model.");
  const result = await probeOpenRouterStructuredCapability(new OpenRouterAiDocumentProvider({ config, timeoutMs: OPENROUTER_CAPABILITY_PROBE_TIMEOUT_MS }));
  const { raw } = result;
  const cachePath = path.join(root, "tmp", "openrouter-structured-capability-cache.json");
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify({ provider: "openrouter", model: config.model, capabilityVersion: OPENROUTER_STRUCTURED_CAPABILITY_VERSION, passedAt: Date.now() }));
  console.log(`provider=${raw.provider} configuredModel=${config.model} returnedModel=${raw.model} httpStatus=${raw.httpStatus} requestId=${raw.requestId ?? "unavailable"} finishReason=${raw.finishReason ?? "unavailable"} outputTokens=${raw.usage?.outputTokens ?? "unavailable"} durationMs=${Date.now() - startedAt} choices=${raw.diagnostics.choicesCount} contentPresent=${raw.diagnostics.contentPresent} contentLength=${raw.diagnostics.contentLength} reasoningPresent=${raw.diagnostics.reasoningPresent} jsonValidation=PASS`);
} catch (error) {
  const providerError = error instanceof AiProviderError ? error : new AiProviderError("AI_PROVIDER_UNAVAILABLE", "AI provider is unavailable.");
  const result = providerError.code === "AI_PROVIDER_TIMEOUT" ? "TIMEOUT" : "FAIL";
  console.log(`provider=openrouter configuredModel=${config?.model ?? "unavailable"} probeResult=${result} httpStatus=${providerError.status ?? "unavailable"} durationMs=${Date.now() - startedAt} code=${providerError.code} providerDetail=${providerError.safeDetail ?? "unavailable"} jsonValidation=FAIL`);
  process.exitCode = 1;
}
