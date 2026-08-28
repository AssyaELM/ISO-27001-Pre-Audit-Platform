import assert from "node:assert/strict";
import { AiProviderError } from "../lib/ai/providers/types.ts";
import { AI_DOCUMENT_TEMPLATE_SPECS } from "../lib/ai/documents/catalog.ts";
import { validateStructuredDocumentResponse } from "../lib/ai/documents/generation-schema.ts";
import { buildCommonDocumentSystemInstructions } from "../lib/ai/documents/prompt-contract.ts";
import { buildCommonDocumentGenerationRequest } from "../lib/ai/documents/request-builder.ts";

const build = (documentType, language = "en", overrides = {}) => buildCommonDocumentGenerationRequest({
  documentType,
  templateVersion: AI_DOCUMENT_TEMPLATE_SPECS[documentType].version,
  mappingVersion: "1.0.0",
  generationContractVersion: "1.0.0",
  documentTitle: language === "fr" ? "Document de test" : "Test document",
  language,
  semanticFacts: { purpose: [{ capability: "fictional_fact", implementationState: "implemented" }] },
  policyIntent: { purpose: { mayDefineNormativeRequirementsLater: true } },
  resolvedInputs: { organization_name: "Example Organization", scope: "defined scope" },
  sectionReadiness: Object.fromEntries(AI_DOCUMENT_TEMPLATE_SPECS[documentType].sections.map((section) => [section.id, "ready"])),
  generationConstraints: ["Use concise professional language."],
  ...overrides,
});
const responseFor = (built) => ({
  documentType: built.request.documentType,
  language: built.request.language,
  title: built.request.documentTitle,
  sections: built.request.sections.map((section) => ({ sectionId: section.sectionId, title: section.title, status: section.expectedStatus, content: section.expectedStatus === "needs_input" ? "" : `Content for ${section.sectionId}.` })),
});
const expectBadResponse = (operation) => assert.throws(operation, (error) => error instanceof AiProviderError && error.code === "AI_PROVIDER_BAD_RESPONSE");

assert.deepEqual(Object.keys(AI_DOCUMENT_TEMPLATE_SPECS), ["information_security_policy", "access_control_policy", "incident_management_procedure", "backup_and_recovery_policy", "information_asset_management_policy"]);
for (const documentType of Object.keys(AI_DOCUMENT_TEMPLATE_SPECS)) {
  const built = build(documentType);
  const spec = AI_DOCUMENT_TEMPLATE_SPECS[documentType];
  assert.equal(built.request.sections.length, spec.sections.length);
  assert.deepEqual(built.request.sections.map((section) => section.sectionId), spec.sections.map((section) => section.id));
  assert.deepEqual(validateStructuredDocumentResponse(spec, "en", "Test document", built.request.sectionReadiness, responseFor(built)).sections.map((section) => section.sectionId), spec.sections.map((section) => section.id));
}
const english = build("information_security_policy");
const french = build("information_security_policy", "fr");
assert.equal(english.request.language, "en");
assert.equal(french.request.language, "fr");
assert.notEqual(buildCommonDocumentSystemInstructions("en"), buildCommonDocumentSystemInstructions("fr"));
assert.equal(JSON.stringify(english.request).match(/openrouter|nemotron|gemini|claude|mistral/i), null);
assert.equal(buildCommonDocumentSystemInstructions("en").includes("ISO/IEC 27001:2022"), false);
assert.equal(buildCommonDocumentSystemInstructions("en").includes("physical/logical hosting places"), true);
assert.equal(buildCommonDocumentSystemInstructions("en").includes("specific classification labels"), true);
assert.equal(buildCommonDocumentSystemInstructions("fr").includes("lieux d'hébergement physiques/logiques"), true);
assert.equal(buildCommonDocumentSystemInstructions("fr").includes("étiquettes de classification spécifiques"), true);

const valid = responseFor(english);
const duplicate = structuredClone(valid); duplicate.sections[1].sectionId = duplicate.sections[0].sectionId;
expectBadResponse(() => validateStructuredDocumentResponse(AI_DOCUMENT_TEMPLATE_SPECS.information_security_policy, "en", "Test document", english.request.sectionReadiness, duplicate));
const unknown = structuredClone(valid); unknown.sections[0].sectionId = "executive_summary";
expectBadResponse(() => validateStructuredDocumentResponse(AI_DOCUMENT_TEMPLATE_SPECS.information_security_policy, "en", "Test document", english.request.sectionReadiness, unknown));
const extra = structuredClone(valid); extra.sections.push({ sectionId: "appendix", title: "Appendix", status: "generated", content: "Unexpected." });
expectBadResponse(() => validateStructuredDocumentResponse(AI_DOCUMENT_TEMPLATE_SPECS.information_security_policy, "en", "Test document", english.request.sectionReadiness, extra));
const missing = structuredClone(valid); missing.sections.pop();
expectBadResponse(() => validateStructuredDocumentResponse(AI_DOCUMENT_TEMPLATE_SPECS.information_security_policy, "en", "Test document", english.request.sectionReadiness, missing));
const invalidStatus = structuredClone(valid); invalidStatus.sections[0].status = "complete";
expectBadResponse(() => validateStructuredDocumentResponse(AI_DOCUMENT_TEMPLATE_SPECS.information_security_policy, "en", "Test document", english.request.sectionReadiness, invalidStatus));
const blocked = build("information_security_policy", "en", { sectionReadiness: { ...english.request.sectionReadiness, purpose: "blocked" } });
const blockedResponse = responseFor(blocked);
assert.equal(blockedResponse.sections[1].status, "needs_input");
assert.doesNotThrow(() => validateStructuredDocumentResponse(AI_DOCUMENT_TEMPLATE_SPECS.information_security_policy, "en", "Test document", blocked.request.sectionReadiness, blockedResponse));
const blockedAsGenerated = structuredClone(blockedResponse); blockedAsGenerated.sections[1].status = "generated"; blockedAsGenerated.sections[1].content = "Invented content.";
expectBadResponse(() => validateStructuredDocumentResponse(AI_DOCUMENT_TEMPLATE_SPECS.information_security_policy, "en", "Test document", blocked.request.sectionReadiness, blockedAsGenerated));

const minimized = build("information_asset_management_policy", "en", { rawAssessment: { answers: ["not allowed"] }, rawEvidence: "not allowed", sourceTrace: [{ sourceId: "not allowed" }] });
assert.equal(JSON.stringify(minimized.request).includes("not allowed"), false);
assert.throws(() => build("information_asset_management_policy", "en", { resolvedInputs: { full_asset_register: [{ serial: "not allowed" }] } }), (error) => error instanceof AiProviderError && error.code === "AI_PROVIDER_INVALID_REQUEST");
assert.throws(() => build("information_asset_management_policy", "en", { resolvedInputs: { access_token: "not allowed" } }), (error) => error instanceof AiProviderError && error.code === "AI_PROVIDER_INVALID_REQUEST");
assert.deepEqual(build("information_asset_management_policy"), build("information_asset_management_policy"));
assert.equal(english.request.sections.every((section) => JSON.stringify(section.facts) === JSON.stringify(english.request.semanticFacts[section.sectionId] ?? [])), true);
console.log("COMMON DOCUMENT PROMPT CONTRACT QA: PASS");
