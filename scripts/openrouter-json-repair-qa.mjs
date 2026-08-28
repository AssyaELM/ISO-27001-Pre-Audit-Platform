import assert from "node:assert/strict";
import { OpenRouterAiDocumentProvider } from "../lib/ai/providers/openrouter.ts";
import { generateWithSingleJsonRepair } from "../lib/ai/providers/json-recovery.ts";
import { AiProviderError } from "../lib/ai/providers/types.ts";
import { INFORMATION_SECURITY_POLICY_SPEC } from "../lib/ai-documents/information-security-policy.ts";
import { validateStructuredDocumentResponse } from "../lib/ai/documents/generation-schema.ts";

const request = {
  documentType: "information_security_policy", templateVersion: "1.0.0", mappingVersion: "1.0.0", generationContractVersion: "1.0.0", documentTitle: "Information Security Policy", language: "en", systemInstructions: "Return JSON only.",
  sections: INFORMATION_SECURITY_POLICY_SPEC.sections.map((section) => ({ sectionId: section.id, title: section.label, generationMode: section.generationMode, expectedStatus: section.generationMode === "ai_later" ? "generated" : "static", facts: [], policyIntent: {}, resolvedInputs: {}, prohibitedInferences: [] })),
  semanticFacts: {}, policyIntent: {}, resolvedInputs: {}, sectionReadiness: Object.fromEntries(INFORMATION_SECURITY_POLICY_SPEC.sections.map((section) => [section.id, "ready"])), generationConstraints: ["JSON only"],
};
const response = (content, id) => new Response(JSON.stringify({ id, model: "example/free", choices: [{ message: { content } }] }), { status: 200 });
let calls = 0;
const validProvider = new OpenRouterAiDocumentProvider({ config: { apiKey: "sk-or-v1-test", model: "openrouter/free" }, fetchImpl: async () => { calls += 1; return response("{}", "one"); } });
const valid = await generateWithSingleJsonRepair(validProvider, request);
assert.equal(valid.repairAttempted, false); assert.equal(valid.repairStatus, "not_needed"); assert.equal(calls, 1);

calls = 0; let repairBody = "";
const repairedProvider = new OpenRouterAiDocumentProvider({ config: { apiKey: "sk-or-v1-test", model: "openrouter/free" }, fetchImpl: async (_url, init) => { calls += 1; if (calls === 2) repairBody = String(init.body); return calls === 1 ? response("```json\n{}\n```", "initial") : response("{}", "repair"); } });
const repaired = await generateWithSingleJsonRepair(repairedProvider, request);
assert.equal(repaired.repairAttempted, true); assert.equal(repaired.repairStatus, "completed"); assert.equal(calls, 2);
assert.equal(repairBody.includes("semanticFacts"), false); assert.equal(repairBody.includes("access_token"), false);

calls = 0;
const invalidRepairProvider = new OpenRouterAiDocumentProvider({ config: { apiKey: "sk-or-v1-test", model: "openrouter/free" }, fetchImpl: async () => { calls += 1; return response("not json", `attempt-${calls}`); } });
await assert.rejects(() => generateWithSingleJsonRepair(invalidRepairProvider, request), (error) => error instanceof AiProviderError && error.code === "AI_PROVIDER_BAD_RESPONSE");
assert.equal(calls, 2);
assert.throws(() => validateStructuredDocumentResponse(INFORMATION_SECURITY_POLICY_SPEC, "en", "Information Security Policy", request.sectionReadiness, { documentType: "information_security_policy", language: "en", title: "Information Security Policy", sections: [] }), (error) => error instanceof AiProviderError && error.code === "AI_PROVIDER_BAD_RESPONSE");
console.log("OPENROUTER JSON REPAIR QA: PASS");
