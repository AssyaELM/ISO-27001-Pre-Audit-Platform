import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { OpenRouterAiDocumentProvider, getOpenRouterConfig, generateWithSingleJsonRepair, AiProviderError } from "../lib/ai/providers/index.ts";
import { buildCommonDocumentGenerationRequest } from "../lib/ai/documents/request-builder.ts";
import { buildStructuredDocumentJsonSchema } from "../lib/ai/documents/generation-schema.ts";
import { getAiDocumentTemplateSpec } from "../lib/ai/documents/catalog.ts";
import { buildAiDocumentsRegistry } from "../lib/ai-documents/registry.ts";
import { prepareGenerationContext, workspaceGenerationInput } from "../app/api/ai-documents/context.ts";
import { persistValidatedAiDocumentDraft } from "../lib/ai/documents/common-validated-draft-persistence.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && process.env[match[1].trim()] === undefined) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: workspaces } = await supabase.from("workspaces").select("id").limit(1);
  if (!workspaces || !workspaces.length) throw new Error("No workspace found");
  const workspaceId = workspaces[0].id;
  
  const { data: users } = await supabase.auth.admin.listUsers();
  if (!users.users.length) throw new Error("No users found");
  const user = users.users[0];
  
  const documentType = "information_security_policy";
  
  console.log(`[DIAGNOSTIC] Workspace ID: ${workspaceId}, User: ${user.email}`);

  const [evidence, aiDocuments, responses] = await Promise.all([
    supabase.from("evidence_items").select("*").eq("workspace_id", workspaceId),
    supabase.from("ai_documents").select("*").eq("workspace_id", workspaceId),
    supabase.from("assessment_responses").select("*").eq("workspace_id", workspaceId),
  ]);

  const registry = buildAiDocumentsRegistry(evidence.data, aiDocuments.data);
  const setup = {
    document_classification: "Internal",
    approver: "Assya",
    policy_owner: "Assya",
    review_plan: "Annually",
    security_objectives: ["Protect data"],
    security_roles: ["Admin"],
    legal_requirements: ["GDPR"]
  };

  const context = prepareGenerationContext(documentType, workspaceGenerationInput(user, responses.data, registry, setup));
  
  const raw = context;
  const spec = getAiDocumentTemplateSpec(documentType);
  const semanticFacts = (raw.semanticFacts ?? {});
  const knownInputs = (raw.knownInputs ?? {});
  
  const generation = buildCommonDocumentGenerationRequest({ 
    documentType, 
    templateVersion: String(raw.templateVersion ?? raw.template?.version), 
    mappingVersion: String(raw.mappingVersion ?? raw.generationContract?.mappingVersion), 
    generationContractVersion: String(raw.generationContractVersion ?? raw.generationContract?.version), 
    documentTitle: spec.label, 
    language: "en", 
    semanticFacts, 
    policyIntent: Object.fromEntries(spec.sections.map((section) => [section.id, { useNormativePolicyLanguage: true, currentFactsAreNotPolicyClaims: true }])), 
    resolvedInputs: knownInputs, 
    sectionReadiness: context.sectionReadiness, 
    generationConstraints: [`Return the exact ${spec.sections.length} sections in canonical order.`, "Use concise policy language; never invent current-state facts."] 
  });
  
  console.log("[DIAGNOSTIC] Prepared Generation Contract successfully.");
  console.log("[DIAGNOSTIC] Launching Provider...");
  
  const provider = new OpenRouterAiDocumentProvider({ config: getOpenRouterConfig(), timeoutMs: 180000 });
  
  try {
    const { response } = await generateWithSingleJsonRepair(provider, { 
      ...generation.request, 
      providerOptions: { responseSchema: buildStructuredDocumentJsonSchema(spec, "en", spec.label, context.sectionReadiness), maxOutputTokens: 4096 } 
    });
    
    console.log(`[DIAGNOSTIC] Provider Success. HTTP ${response.httpStatus}`);
    
    console.log("[DIAGNOSTIC] Persisting Validated Draft...");
    const saved = await persistValidatedAiDocumentDraft({
      client: supabase,
      workspaceId,
      documentType,
      idempotencyKey: `ui-${documentType}-${crypto.randomUUID()}`,
      context: context,
      providerResponse: response,
    });
    
    console.log("[DIAGNOSTIC] Saved successfully!", saved);
  } catch (error) {
    console.log("[DIAGNOSTIC] CAUGHT ERROR:", error.constructor?.name ?? typeof error);
    console.log("[DIAGNOSTIC] Error message:", error.message ?? String(error));
    if (error instanceof AiProviderError) {
       console.log("[DIAGNOSTIC] Code:", error.code);
    }
    if (error.code) {
       console.log("[DIAGNOSTIC] Property code:", error.code);
    }
    if (error.details) {
       console.log("[DIAGNOSTIC] Property details:", error.details);
    }
    process.exit(1);
  }
}

run().catch(err => {
  console.error("FATAL:", err);
  process.exit(1);
});
