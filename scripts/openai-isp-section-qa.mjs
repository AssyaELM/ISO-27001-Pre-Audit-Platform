import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OpenAiDocumentProvider, getOpenAiConfig } from "../lib/ai/providers/index.ts";
import { buildSectionStructuredDocumentJsonSchema, validateSectionStructuredDocumentResponse } from "../lib/ai/documents/generation-schema.ts";
import { buildCommonDocumentGenerationRequest } from "../lib/ai/documents/request-builder.ts";
import { prepareInformationSecurityPolicyGenerationContext } from "../lib/ai-documents/information-security-policy-generation-contract.ts";
import { INFORMATION_SECURITY_POLICY_SPEC, INFORMATION_SECURITY_POLICY_TEMPLATE_VERSION } from "../lib/ai-documents/information-security-policy.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match && process.env[match[1].trim()] === undefined) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
}

const context = prepareInformationSecurityPolicyGenerationContext({
  workspace: { organizationName: "Example Organization", ismsScope: "Organization-wide information processing activities" },
  documentSetup: {
    document_classification: "Organization-defined classification",
    approver: "authorized top management role",
    policy_owner: "designated policy owner role",
    review_plan: "approved review triggers",
    security_objectives: ["organization-defined objectives"],
    security_roles: ["designated security responsibilities"],
    legal_requirements: ["confirmed applicable requirements"],
  },
  assessment: { responses: [{ theme: "organizational", controlId: "a5-1", questionId: "p5_1_001", answer: "implemented" }] },
});
assert.equal(context.missingInputs.length, 0);

const section = INFORMATION_SECURITY_POLICY_SPEC.sections.find((item) => item.id === "purpose");
assert.ok(section);
const semanticFacts = {};
for (const fact of context.currentFacts) for (const sectionId of fact.policySections) (semanticFacts[sectionId] ??= []).push({ capability: fact.capability, implementationState: fact.implementationState, policyIntentAllowed: fact.policyIntentAllowed });
const { request } = buildCommonDocumentGenerationRequest({
  documentType: "information_security_policy",
  templateVersion: INFORMATION_SECURITY_POLICY_TEMPLATE_VERSION,
  mappingVersion: context.generationContract.mappingVersion,
  generationContractVersion: context.generationContract.version,
  documentTitle: "Information Security Policy",
  language: "en",
  semanticFacts,
  policyIntent: { purpose: { useNormativePolicyLanguage: true, currentFactsAreNotPolicyClaims: true } },
  resolvedInputs: { organization_name: context.organization.name },
  sectionReadiness: context.sectionReadiness,
  generationConstraints: ["Return only the requested section.", "Do not invent current-state facts."],
});
const provider = new OpenAiDocumentProvider();
const startedAt = Date.now();
const response = await provider.generateStructuredDocument({
  ...request,
  sections: [{ ...request.sections.find((item) => item.sectionId === section.id), sectionId: section.id, title: section.label }],
  providerOptions: { responseSchema: buildSectionStructuredDocumentJsonSchema(), maxOutputTokens: 1024, reasoning: { effort: "medium" } },
});
validateSectionStructuredDocumentResponse(response.structuredOutput);
const config = getOpenAiConfig();
assert.equal(response.provider, "openai");
assert.equal(response.model, config.model);
assert.equal(config.model, "gpt-5.6-luna");
assert.equal(config.reasoningEffort, "medium");
console.log(JSON.stringify({ provider: response.provider, model: response.model, reasoning: config.reasoningEffort, requestIdPresent: Boolean(response.requestId), status: response.status, httpStatus: response.httpStatus, usage: response.usage ?? null, finishReason: response.finishReason ?? null, durationMs: Date.now() - startedAt, structuredOutput: "PASS", section: section.id }));
