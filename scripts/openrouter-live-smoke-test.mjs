import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AiProviderError, getAiDocumentProvider, getOpenRouterConfig, validateOpenRouterSmokeStructuredOutput } from "../lib/ai/providers/index.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

let config;
try {
  config = getOpenRouterConfig();
} catch (error) {
  const providerError = error instanceof AiProviderError ? error : new AiProviderError("AI_PROVIDER_NOT_CONFIGURED", "AI provider is not configured.");
  console.log(`provider=openrouter status=configuration_failed code=${providerError.code}`);
  process.exitCode = 1;
  process.exit();
}
if (config.model !== "openrouter/free") {
  console.log(`provider=openrouter model=${config.model} status=zero_cost_route_rejected`);
  process.exitCode = 1;
  process.exit();
}

const request = {
  documentType: "test_document",
  templateVersion: "smoke-1.0.0",
  mappingVersion: "smoke-1.0.0",
  generationContractVersion: "smoke-1.0.0",
  documentTitle: "Test document",
  language: "en",
  systemInstructions: "Return only a JSON object. Do not use markdown fences or explanatory text.",
  sections: [{ sectionId: "purpose", title: "Purpose", generationMode: "ai_later", expectedStatus: "generated", facts: [{ fact: "A fictional organization has a documented security policy." }], policyIntent: {}, resolvedInputs: {}, prohibitedInferences: [] }],
  semanticFacts: [
    { fact: "A fictional organization has a documented security policy." },
    { fact: "A fictional policy owner is known." },
  ],
  policyIntent: { smokeTestOnly: true },
  resolvedInputs: { organization_name: "Example Organization" },
  sectionReadiness: { purpose: "ready" },
  generationConstraints: [
    "Return only a JSON object.",
    "The object must contain documentType equal to test_document.",
    "The object must contain a non-empty sections array with sectionId and non-empty content strings.",
    "Do not use markdown fences or explanatory text.",
  ],
};

const startedAt = Date.now();
try {
  const response = await getAiDocumentProvider().generateStructuredDocument(request);
  const output = validateOpenRouterSmokeStructuredOutput(response.structuredOutput);
  if (output.documentType !== "test_document") throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Smoke-test documentType does not match.");
  console.log(`provider=${response.provider} model=${response.model} httpStatus=${response.httpStatus} requestId=${response.requestId ?? "unavailable"} durationMs=${Date.now() - startedAt} jsonValidation=PASS`);
  console.log(JSON.stringify(output));
} catch (error) {
  const providerError = error instanceof AiProviderError ? error : new AiProviderError("AI_PROVIDER_UNAVAILABLE", "AI provider is unavailable.");
  console.log(`provider=openrouter model=${config.model} httpStatus=${providerError.status ?? "unavailable"} durationMs=${Date.now() - startedAt} code=${providerError.code} jsonValidation=FAIL`);
  process.exitCode = 1;
}
