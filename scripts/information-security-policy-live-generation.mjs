import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OpenRouterAiDocumentProvider, getOpenRouterConfig, generateWithSingleJsonRepair, AiProviderError } from "../lib/ai/providers/index.ts";
import { buildCommonDocumentGenerationRequest } from "../lib/ai/documents/request-builder.ts";
import { buildStructuredDocumentJsonSchema, validateStructuredDocumentResponse } from "../lib/ai/documents/generation-schema.ts";
import { assembleInformationSecurityPolicyDraft, validateInformationSecurityPolicyLiveQuality } from "../lib/ai/documents/information-security-policy-live-validation.ts";
import { prepareInformationSecurityPolicyGenerationContext } from "../lib/ai-documents/information-security-policy-generation-contract.ts";
import { INFORMATION_SECURITY_POLICY_SPEC, INFORMATION_SECURITY_POLICY_TEMPLATE_VERSION } from "../lib/ai-documents/information-security-policy.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env.local");
if (fs.existsSync(envFile)) for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) { const match = line.match(/^([^#=]+)=(.*)$/); if (match && process.env[match[1].trim()] === undefined) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, ""); }

const fixture = {
  workspace: { organizationName: "Example Organization", ismsScope: "Organization-wide information processing activities" },
  documentSetup: {
    document_classification: "Organization-defined classification", approver: "authorized top management role", policy_owner: "designated policy owner role", review_plan: "approved review triggers", security_objectives: ["organization-defined objectives"], security_roles: ["designated security responsibilities"], legal_requirements: ["confirmed applicable requirements"], communication_channel: "approved communication channel",
  },
  assessment: { responses: [
    { theme: "organizational", controlId: "a5-1", questionId: "p5_1_001", answer: "implemented" },
    { theme: "people", controlId: "a6-3", questionId: "p6_3_001", answer: "not_implemented" },
  ] },
};
const context = prepareInformationSecurityPolicyGenerationContext(fixture);
const essentialBlocked = context.missingInputs.filter((input) => input.required);
if (essentialBlocked.length) {
  console.log(`status=GENERATION_BLOCKED_MISSING_INPUTS missingInputs=${essentialBlocked.map((input) => input.key).join(",")}`);
  process.exitCode = 1;
  process.exit();
}
const config = getOpenRouterConfig();
if (config.model !== "openrouter/free" && !config.model.endsWith(":free")) {
  console.log(`provider=openrouter model=${config.model} status=zero_cost_route_rejected`);
  process.exitCode = 1;
  process.exit();
}
const semanticFacts = {};
for (const fact of context.currentFacts) for (const section of fact.policySections) (semanticFacts[section] ??= []).push({ capability: fact.capability, implementationState: fact.implementationState, policyIntentAllowed: fact.policyIntentAllowed });
const { request: commonRequest } = buildCommonDocumentGenerationRequest({
  documentType: "information_security_policy", templateVersion: INFORMATION_SECURITY_POLICY_TEMPLATE_VERSION, mappingVersion: context.generationContract.mappingVersion, generationContractVersion: context.generationContract.version, documentTitle: "Information Security Policy", language: "en", semanticFacts,
  policyIntent: Object.fromEntries(INFORMATION_SECURITY_POLICY_SPEC.sections.map((section) => [section.id, { useNormativePolicyLanguage: true, currentFactsAreNotPolicyClaims: true }])),
  resolvedInputs: { organization_name: context.organization.name, scope: context.scope.value, document_classification: context.documentMetadata.classification, policy_owner: context.documentMetadata.owner, review_plan: context.documentMetadata.reviewDate, security_objectives: context.objectives.actualObjectives, legal_requirements: context.legalRegulatoryContractual.knownApplicableRequirements, communication_channel: context.communication.knownChannels },
  sectionReadiness: context.sectionReadiness,
  generationConstraints: ["Return all 16 specified sections in exact order.", "For generated content, use concise policy language with shall; do not make current-state claims.", "Do not use any named role, person, legal obligation, date, frequency, KPI, technology, vendor, classification level, sanction, or certification claim."],
});
const request = {
  ...commonRequest,
  providerOptions: {
    responseSchema: buildStructuredDocumentJsonSchema(INFORMATION_SECURITY_POLICY_SPEC, "en", "Information Security Policy", context.sectionReadiness),
    maxOutputTokens: 4096,
  },
};
const startedAt = Date.now();
let initialRequestStatus = "unavailable";
let repairAttempted = false;
let diagnostics = "choices=unavailable contentPresent=unavailable contentLength=unavailable reasoningPresent=unavailable";
try {
  const recovery = await generateWithSingleJsonRepair(new OpenRouterAiDocumentProvider({ config, timeoutMs: 90_000 }), request);
  initialRequestStatus = String(recovery.initialRequestStatus);
  repairAttempted = recovery.repairAttempted;
  const providerResponse = recovery.response;
  diagnostics = `choices=${providerResponse.diagnostics?.choicesCount ?? recovery.initialDiagnostics.choicesCount} contentPresent=${providerResponse.diagnostics?.contentPresent ?? recovery.initialDiagnostics.contentPresent} contentLength=${providerResponse.diagnostics?.contentLength ?? recovery.initialDiagnostics.contentLength} reasoningPresent=${providerResponse.diagnostics?.reasoningPresent ?? recovery.initialDiagnostics.reasoningPresent}`;
  const assembled = assembleInformationSecurityPolicyDraft(providerResponse.structuredOutput);
  const document = validateStructuredDocumentResponse(INFORMATION_SECURITY_POLICY_SPEC, "en", "Information Security Policy", context.sectionReadiness, assembled);
  const qualityErrors = validateInformationSecurityPolicyLiveQuality(document, context);
  if (qualityErrors.length) throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Generated draft failed quality validation.");
  const tmp = path.join(root, "tmp"); fs.mkdirSync(tmp, { recursive: true }); fs.writeFileSync(path.join(tmp, "information-security-policy-live-draft.json"), JSON.stringify(document, null, 2));
  console.log(`provider=${providerResponse.provider} model=${providerResponse.model} requestId=${providerResponse.requestId ?? "unavailable"} initialRequestStatus=${initialRequestStatus} repairAttempted=${repairAttempted} repairStatus=${recovery.repairStatus} httpStatus=${providerResponse.httpStatus} finishReason=${providerResponse.finishReason ?? "unavailable"} outputTokens=${providerResponse.usage?.outputTokens ?? "unavailable"} durationMs=${Date.now() - startedAt} ${diagnostics} sections=${document.sections.length} schemaValidation=PASS antiHallucination=PASS qualityValidation=PASS`);
} catch (error) {
  const providerError = error instanceof AiProviderError ? error : new AiProviderError("AI_PROVIDER_UNAVAILABLE", "AI provider is unavailable.");
  console.log(`provider=openrouter model=${config.model} initialRequestStatus=${initialRequestStatus} repairAttempted=${repairAttempted} repairStatus=${repairAttempted ? "failed" : "not_attempted"} httpStatus=${providerError.status ?? "unavailable"} durationMs=${Date.now() - startedAt} ${diagnostics} code=${providerError.code} schemaValidation=FAIL antiHallucination=FAIL qualityValidation=FAIL`);
  process.exitCode = 1;
}
