import assert from "node:assert/strict";
import { prepareInformationSecurityPolicyGenerationContext } from "../lib/ai-documents/information-security-policy-generation-contract.ts";
import { INFORMATION_SECURITY_POLICY_SPEC } from "../lib/ai-documents/information-security-policy.ts";
import { persistValidatedInformationSecurityPolicyDraft, ValidatedDraftPersistenceError } from "../lib/ai/documents/validated-draft-persistence.ts";

const context = prepareInformationSecurityPolicyGenerationContext({
  workspace: { organizationName: "Example Organization", ismsScope: "Organization-wide scope" },
  documentSetup: { document_classification: "Organization-defined classification", approver: "authorized role", policy_owner: "designated owner", review_plan: "approved review triggers", security_objectives: ["organization-defined objectives"], security_roles: ["designated responsibilities"], legal_requirements: ["confirmed requirements"] },
  assessment: { responses: [{ theme: "people", controlId: "a6-3", questionId: "p6_3_001", answer: "not_implemented" }] },
});
const validResponse = () => ({
  provider: "openrouter", model: "nvidia/nemotron-3-super-120b-a12b:free", requestId: "request-1", httpStatus: 200, status: "completed",
  usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
  structuredOutput: {
    documentType: "information_security_policy", language: "en", title: "Information Security Policy",
    sections: INFORMATION_SECURITY_POLICY_SPEC.sections.map((section) => ({ sectionId: section.id, title: section.label, status: section.generationMode === "ai_later" ? "generated" : "static", content: section.generationMode === "ai_later" ? "The organization shall apply approved policy arrangements." : "Temporary content." })),
  },
});
let calls = 0;
const persisted = {
  id: "draft-1", workspace_id: "workspace-a", document_type: "information_security_policy", status: "draft", version: "v1", language: "en", title: "Information Security Policy",
  document_content: validResponse().structuredOutput, template_version: "1.0.0", mapping_version: "1.0.0", generation_contract_version: "1.0.0", provider: "openrouter", provider_model: "nvidia/nemotron-3-super-120b-a12b:free", provider_request_id: "request-1", provider_usage: { inputTokens: 10 },
};
const client = { rpc: async (name, args) => { calls += 1; assert.equal(name, "create_information_security_policy_draft"); assert.equal(args.p_workspace_id, "workspace-a"); assert.equal(args.p_document_type, undefined); assert.equal(args.p_provider_model, "nvidia/nemotron-3-super-120b-a12b:free"); assert.equal(JSON.stringify(args).match(/api.?key|prompt|raw.?assessment|evidence.?content/i), null); return { data: persisted, error: null }; } };
const result = await persistValidatedInformationSecurityPolicyDraft({ client, workspaceId: "workspace-a", idempotencyKey: "test-key", context, providerResponse: validResponse() });
assert.equal(calls, 1); assert.equal(result.status, "draft"); assert.equal(result.version, "v1");

for (const mutate of [
  (response) => { response.structuredOutput.sections.pop(); },
  (response) => { response.structuredOutput.sections.push({ sectionId: "extra", title: "Extra", status: "generated", content: "No." }); },
  (response) => { response.structuredOutput.sections[1].content = "The organization has an established CISO."; },
  (response) => { response.structuredOutput.sections[1].content = "Prompt: secret"; },
  (response) => { response.status = "failed"; },
]) {
  calls = 0; const response = validResponse(); mutate(response);
  await assert.rejects(() => persistValidatedInformationSecurityPolicyDraft({ client, workspaceId: "workspace-a", idempotencyKey: "invalid-key", context, providerResponse: response }), (error) => error instanceof ValidatedDraftPersistenceError && error.code === "AI_DOCUMENT_WRITE_GATE_FAILED");
  assert.equal(calls, 0, "invalid generation must not write");
}
const failedClient = { rpc: async () => ({ data: null, error: { message: "database unavailable" } }) };
await assert.rejects(() => persistValidatedInformationSecurityPolicyDraft({ client: failedClient, workspaceId: "workspace-a", idempotencyKey: "db-failure", context, providerResponse: validResponse() }), (error) => error instanceof ValidatedDraftPersistenceError && error.code === "AI_DOCUMENT_PERSISTENCE_FAILED");
console.log("AI DOCUMENT DRAFT PERSISTENCE QA: PASS");
