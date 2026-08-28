import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { AiProviderError, OpenRouterAiDocumentProvider, getOpenRouterConfig, generateWithSingleJsonRepair, probeOpenRouterStructuredCapability, decideOpenRouterCapabilityProbe, OPENROUTER_CAPABILITY_PROBE_TIMEOUT_MS } from "../lib/ai/providers/index.ts";
import { buildCommonDocumentGenerationRequest } from "../lib/ai/documents/request-builder.ts";
import { buildStructuredDocumentJsonSchema } from "../lib/ai/documents/generation-schema.ts";
import { persistValidatedInformationSecurityPolicyDraft } from "../lib/ai/documents/validated-draft-persistence.ts";
import { prepareInformationSecurityPolicyGenerationContext } from "../lib/ai-documents/information-security-policy-generation-contract.ts";
import { INFORMATION_SECURITY_POLICY_SPEC, INFORMATION_SECURITY_POLICY_TEMPLATE_VERSION } from "../lib/ai-documents/information-security-policy.ts";
import { buildAiDocumentsRegistry } from "../lib/ai-documents/registry.ts";

const REQUIRED_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const [filename, override] of [[".env.local", false], [".env.assessment-test.local", true]]) {
  const file = path.join(root, filename);
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && (override || process.env[match[1].trim()] === undefined)) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}
const env = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  service: process.env.SUPABASE_SERVICE_ROLE_KEY,
  emailA: process.env.TEST_USER_A_EMAIL, passwordA: process.env.TEST_USER_A_PASSWORD,
  emailB: process.env.TEST_USER_B_EMAIL, passwordB: process.env.TEST_USER_B_PASSWORD,
  workspaceA: process.env.TEST_WORKSPACE_A_ID, workspaceB: process.env.TEST_WORKSPACE_B_ID,
};
if (Object.values(env).some((value) => !value)) { console.log("NOT VERIFIED — authenticated AI draft persistence test environment is incomplete."); process.exit(0); }

async function userSession(email, password) {
  const response = await fetch(`${env.url}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: env.key, "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  const payload = await response.json();
  assert.equal(response.status, 200, "password grant must succeed");
  return { token: payload.access_token, userId: payload.user.id, client: createClient(env.url, env.key, { global: { headers: { Authorization: `Bearer ${payload.access_token}` } }, auth: { persistSession: false, autoRefreshToken: false } }) };
}

function preparedContext() {
  return prepareInformationSecurityPolicyGenerationContext({
    workspace: { organizationName: "Example Organization", ismsScope: "Controlled test scope" },
    documentSetup: { document_classification: "Organization-defined classification", approver: "authorized top management role", policy_owner: "designated policy owner role", review_plan: "approved review triggers", security_objectives: ["organization-defined objectives"], security_roles: ["designated security responsibilities"], legal_requirements: ["confirmed applicable requirements"], communication_channel: "approved communication channel" },
    assessment: { responses: [{ theme: "people", controlId: "a6-3", questionId: "p6_3_001", answer: "not_implemented" }] },
  });
}

function requestFor(context) {
  const semanticFacts = {};
  for (const fact of context.currentFacts) for (const section of fact.policySections) (semanticFacts[section] ??= []).push({ capability: fact.capability, implementationState: fact.implementationState, policyIntentAllowed: fact.policyIntentAllowed });
  const { request } = buildCommonDocumentGenerationRequest({
    documentType: "information_security_policy", templateVersion: INFORMATION_SECURITY_POLICY_TEMPLATE_VERSION, mappingVersion: context.generationContract.mappingVersion, generationContractVersion: context.generationContract.version, documentTitle: "Information Security Policy", language: "en", semanticFacts,
    policyIntent: Object.fromEntries(INFORMATION_SECURITY_POLICY_SPEC.sections.map((section) => [section.id, { useNormativePolicyLanguage: true, currentFactsAreNotPolicyClaims: true }])),
    resolvedInputs: { organization_name: context.organization.name, scope: context.scope.value, document_classification: context.documentMetadata.classification, policy_owner: context.documentMetadata.owner, review_plan: context.documentMetadata.reviewDate, security_objectives: context.objectives.actualObjectives, legal_requirements: context.legalRegulatoryContractual.knownApplicableRequirements, communication_channel: context.communication.knownChannels },
    sectionReadiness: context.sectionReadiness,
    generationConstraints: ["Return all 16 specified sections in exact order.", "Use concise policy language and do not make current-state claims.", "Do not mention CISO, CIO, CTO, DPO, GDPR, MFA, VPN, PAM, MDM, AWS, Azure, Google Cloud, KPIs, frequencies, dates, classification levels, sanctions, certifications, prompts, AI, or NormCore."],
  });
  return { ...request, providerOptions: { responseSchema: buildStructuredDocumentJsonSchema(INFORMATION_SECURITY_POLICY_SPEC, "en", "Information Security Policy", context.sectionReadiness), maxOutputTokens: 4096 } };
}

const a = await userSession(env.emailA, env.passwordA);
const b = await userSession(env.emailB, env.passwordB);
const admin = createClient(env.url, env.service, { auth: { persistSession: false, autoRefreshToken: false } });
const cleanupIds = [];
try {
  const context = preparedContext();
  const liveMode = process.env.TEST_AI_PERSISTENCE_LIVE === "1";
  const config = getOpenRouterConfig();
  assert.equal(config.model, REQUIRED_MODEL, "integration must use the approved explicit free model");
  let liveGenerated = {
      repairAttempted: false,
      response: {
        provider: "openrouter", model: "nvidia/nemotron-3-super-120b-a12b:free", requestId: "validated-fixture-request", httpStatus: 200, status: "completed",
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        structuredOutput: { documentType: "information_security_policy", language: "en", title: "Information Security Policy", sections: INFORMATION_SECURITY_POLICY_SPEC.sections.map((section) => ({ sectionId: section.id, title: section.label, status: section.generationMode === "ai_later" ? "generated" : "static", content: section.generationMode === "ai_later" ? "The organization shall apply approved policy arrangements." : "Validated deterministic content." })) },
      },
    };
  if (liveMode) {
    const cachePath = path.join(root, "tmp", "openrouter-structured-capability-cache.json");
    let cache;
    try { cache = JSON.parse(fs.readFileSync(cachePath, "utf8")); } catch { cache = undefined; }
    let probeState = "PASS";
    try { await probeOpenRouterStructuredCapability(new OpenRouterAiDocumentProvider({ config, timeoutMs: OPENROUTER_CAPABILITY_PROBE_TIMEOUT_MS })); }
    catch (error) { probeState = error instanceof AiProviderError && error.code === "AI_PROVIDER_TIMEOUT" ? "TIMEOUT" : "FAIL"; }
    const decision = decideOpenRouterCapabilityProbe({ model: config.model, now: Date.now(), state: probeState, cache });
    if (!decision.allowGeneration) {
      console.log(`NOT VERIFIED — capability probe ${decision.state.toLowerCase()} without a recent matching cache; WRITE GATE: PASS — zero DB writes`);
      process.exit(0);
    }
    liveGenerated = await generateWithSingleJsonRepair(new OpenRouterAiDocumentProvider({ config, timeoutMs: 180_000 }), requestFor(context));
  }
  const key = `ai5-live-${Date.now().toString(36)}`;
  const evidenceBefore = await a.client.from("evidence_items").select("id", { count: "exact", head: true }).eq("workspace_id", env.workspaceA);
  const created = await persistValidatedInformationSecurityPolicyDraft({ client: a.client, workspaceId: env.workspaceA, idempotencyKey: key, context, providerResponse: liveGenerated.response });
  cleanupIds.push(created.id);
  assert.equal(created.status, "draft"); assert.equal(created.document_type, "information_security_policy"); assert.match(created.version, /^v\d+$/);
  assert.equal(created.provider, "openrouter"); assert.equal(created.provider_model, liveGenerated.response.model);
  assert.equal(created.template_version, context.template.version); assert.equal(created.mapping_version, context.generationContract.mappingVersion); assert.equal(created.generation_contract_version, context.generationContract.version);
  const reread = await a.client.from("ai_documents").select("*").eq("id", created.id).single();
  assert.equal(reread.error, null); assert.deepEqual(reread.data.document_content, created.document_content);
  assert.equal(JSON.stringify(reread.data).match(/api.?key|authorization|prompt|raw.?assessment|evidence.?content/i), null);
  const registry = buildAiDocumentsRegistry([], [reread.data]);
  const registryEntry = registry.find((entry) => entry.documentType === "information_security_policy");
  assert.equal(registryEntry?.status, "draft"); assert.equal(registryEntry?.activeDocument?.id, created.id);
  const duplicate = await persistValidatedInformationSecurityPolicyDraft({ client: a.client, workspaceId: env.workspaceA, idempotencyKey: key, context, providerResponse: liveGenerated.response });
  assert.equal(duplicate.id, created.id, "same idempotency key must return the same draft");
  const draftRows = await a.client.from("ai_documents").select("id").eq("workspace_id", env.workspaceA).eq("document_type", "information_security_policy").eq("idempotency_key", key);
  assert.equal(draftRows.data.length, 1);
  const cross = await b.client.rpc("create_information_security_policy_draft", { p_workspace_id: env.workspaceA, p_language: "en", p_title: "Information Security Policy", p_document_content: created.document_content, p_template_version: created.template_version, p_mapping_version: created.mapping_version, p_generation_contract_version: created.generation_contract_version, p_provider: created.provider, p_provider_model: created.provider_model, p_provider_request_id: "", p_provider_usage: null, p_idempotency_key: `${key}-cross` });
  assert.ok(cross.error, "workspace B must not create a draft in workspace A");
  const finalized = await admin.from("ai_documents").insert({ workspace_id: env.workspaceA, document_type: "information_security_policy", status: "finalized", version: `qa-final-${Date.now().toString(36)}`, created_by: a.userId }).select("id").single();
  assert.equal(finalized.error, null); cleanupIds.push(finalized.data.id);
  const finalizedUpdate = await admin.from("ai_documents").update({ title: "mutated" }).eq("id", finalized.data.id);
  assert.ok(finalizedUpdate.error, "finalized document must remain immutable");
  const evidenceAfter = await a.client.from("evidence_items").select("id", { count: "exact", head: true }).eq("workspace_id", env.workspaceA);
  assert.equal(evidenceAfter.count, evidenceBefore.count, "draft creation must not create Evidence");
  console.log(`PASS AI draft persistence integration: mode=${liveMode ? "live" : "validated_fixture"} workspace=A status=draft version=${created.version} provider=${created.provider} model=${created.provider_model} sections=${created.document_content.sections.length} registryReadback=true idempotent=true isolation=true finalizedImmutable=true evidenceCreated=false repair=${liveGenerated.repairAttempted}`);
} finally {
  if (cleanupIds.length) await admin.from("ai_documents").delete().in("id", cleanupIds);
  await a.client.auth.signOut(); await b.client.auth.signOut();
}
