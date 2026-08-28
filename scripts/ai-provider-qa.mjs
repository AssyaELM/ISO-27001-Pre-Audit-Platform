import assert from "node:assert/strict";
import {
  AiProviderError,
  OPENROUTER_DEFAULT_MODEL,
  OpenRouterAiDocumentProvider,
  assertSafeAiDocumentGenerationRequest,
  getAiDocumentProvider,
  getOpenRouterConfig,
  toSafeAiProviderLog,
} from "../lib/ai/providers/index.ts";

const request = {
  documentType: "information_asset_management_policy",
  templateVersion: "1.0.0",
  mappingVersion: "1.0.0",
  generationContractVersion: "1.0.0",
  documentTitle: "Test document",
  language: "en",
  systemInstructions: "Return only JSON.",
  sections: [{ sectionId: "purpose", title: "Purpose", generationMode: "ai_later", expectedStatus: "generated", facts: [], policyIntent: {}, resolvedInputs: {}, prohibitedInferences: [] }],
  semanticFacts: [{ capability: "asset_inventory_exists", implementationState: "implemented" }],
  policyIntent: { mayDefineNormativeRequirementsLater: true },
  resolvedInputs: { organization_name: "NormCore" },
  sectionReadiness: { document_control: "ready" },
  generationConstraints: ["Do not invent organization-specific facts."],
};
const expectCode = async (operation, code) => {
  await assert.rejects(operation, (error) => error instanceof AiProviderError && error.code === code && !error.message.includes("sk-or-v1-test"));
};

assert.equal(getOpenRouterConfig({ OPENROUTER_API_KEY: "sk-or-v1-test" }).model, OPENROUTER_DEFAULT_MODEL);
assert.equal(getOpenRouterConfig({ OPENROUTER_API_KEY: "sk-or-v1-test", OPENROUTER_MODEL: "   " }).model, OPENROUTER_DEFAULT_MODEL);
assert.throws(() => getOpenRouterConfig({ OPENROUTER_API_KEY: "" }), (error) => error instanceof AiProviderError && error.code === "AI_PROVIDER_NOT_CONFIGURED" && !error.message.includes("OPENROUTER_API_KEY"));
assert.equal(getAiDocumentProvider({ OPENROUTER_API_KEY: "sk-or-v1-test" }).provider, "openrouter");
assert.doesNotThrow(() => assertSafeAiDocumentGenerationRequest(request));
assert.throws(() => assertSafeAiDocumentGenerationRequest({ ...request, rawAssessment: {} }), (error) => error instanceof AiProviderError && error.code === "AI_PROVIDER_INVALID_REQUEST");
assert.throws(() => assertSafeAiDocumentGenerationRequest({ ...request, resolvedInputs: { asset_register: [{ serial_number: "x" }] } }), (error) => error instanceof AiProviderError && error.code === "AI_PROVIDER_INVALID_REQUEST");
assert.throws(() => assertSafeAiDocumentGenerationRequest({ ...request, resolvedInputs: { access_token: "x" } }), (error) => error instanceof AiProviderError && error.code === "AI_PROVIDER_INVALID_REQUEST");

let sentHeaders;
let sentBody;
const success = new OpenRouterAiDocumentProvider({ config: { apiKey: "sk-or-v1-test", model: "openrouter/free" }, fetchImpl: async (_url, init) => {
  sentHeaders = init.headers;
  sentBody = JSON.parse(String(init.body));
  return new Response(JSON.stringify({ id: "request-1", choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ sections: [] }) } }], usage: { prompt_tokens: 2, completion_tokens: 3, total_tokens: 5 } }), { status: 200 });
} });
const result = await success.generateStructuredDocument(request);
assert.deepEqual(result, { provider: "openrouter", model: "openrouter/free", requestId: "request-1", httpStatus: 200, status: "completed", structuredOutput: { sections: [] }, usage: { inputTokens: 2, outputTokens: 3, totalTokens: 5 }, finishReason: "stop", diagnostics: { choicesCount: 1, modelReturned: false, contentPresent: true, contentLength: 15, reasoningPresent: false } });
assert.equal(sentHeaders.Authorization, "Bearer sk-or-v1-test");
assert.equal(sentHeaders["Content-Type"], "application/json");
assert.equal(sentBody.response_format.type, "json_object");

const schemaProvider = new OpenRouterAiDocumentProvider({ config: { apiKey: "sk-or-v1-test", model: "openai/gpt-oss-20b:free" }, fetchImpl: async (_url, init) => {
  sentBody = JSON.parse(String(init.body));
  return new Response(JSON.stringify({ choices: [{ message: { content: "{}" } }] }), { status: 200 });
} });
await schemaProvider.generateStructuredDocument({ ...request, providerOptions: { responseSchema: { type: "object" }, maxOutputTokens: 512, reasoning: { enabled: false } } });
assert.equal(sentBody.response_format.type, "json_schema");
assert.equal(sentBody.response_format.json_schema.strict, true);
assert.equal(sentBody.max_tokens, 512);
assert.deepEqual(sentBody.reasoning, { enabled: false });

for (const [status, code] of [[401, "AI_PROVIDER_UNAUTHORIZED"], [402, "AI_PROVIDER_UNAVAILABLE"], [429, "AI_PROVIDER_RATE_LIMITED"], [503, "AI_PROVIDER_UNAVAILABLE"]]) {
  const provider = new OpenRouterAiDocumentProvider({ config: { apiKey: "sk-or-v1-test", model: "openrouter/free" }, fetchImpl: async () => new Response("{}", { status }) });
  await expectCode(() => provider.generateStructuredDocument(request), code);
}
const malformed = new OpenRouterAiDocumentProvider({ config: { apiKey: "sk-or-v1-test", model: "openrouter/free" }, fetchImpl: async () => new Response("not-json", { status: 200 }) });
await expectCode(() => malformed.generateStructuredDocument(request), "AI_PROVIDER_BAD_RESPONSE");
const missingStructuredOutput = new OpenRouterAiDocumentProvider({ config: { apiKey: "sk-or-v1-test", model: "openrouter/free" }, fetchImpl: async () => new Response(JSON.stringify({ choices: [{}] }), { status: 200 }) });
await expectCode(() => missingStructuredOutput.generateStructuredDocument(request), "AI_PROVIDER_BAD_RESPONSE");
const timedOut = new OpenRouterAiDocumentProvider({ config: { apiKey: "sk-or-v1-test", model: "openrouter/free" }, timeoutMs: 1, fetchImpl: async (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })))) });
await expectCode(() => timedOut.generateStructuredDocument(request), "AI_PROVIDER_TIMEOUT");

const log = toSafeAiProviderLog({ provider: "openrouter", model: "openrouter/free", documentType: request.documentType, durationMs: 1, status: "failed", errorCode: "AI_PROVIDER_UNAUTHORIZED" });
assert.equal(JSON.stringify(log).includes("sk-or-v1-test"), false);
assert.equal(JSON.stringify(log).includes("semanticFacts"), false);
assert.equal(JSON.stringify(log).includes("Authorization"), false);
const configSource = await (await import("node:fs/promises")).readFile(new URL("../lib/ai/providers/config.ts", import.meta.url), "utf8");
assert.equal(configSource.includes("NEXT_PUBLIC_OPENROUTER_API_KEY"), false);
console.log("AI PROVIDER QA: PASS");
