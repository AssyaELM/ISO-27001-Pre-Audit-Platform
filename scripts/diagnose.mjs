import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { OpenRouterAiDocumentProvider, getOpenRouterConfig, generateWithSingleJsonRepair, AiProviderError } from "../lib/ai/providers/index.ts";
import { buildCommonDocumentGenerationRequest } from "../lib/ai/documents/request-builder.ts";
import { buildStructuredDocumentJsonSchema } from "../lib/ai/documents/generation-schema.ts";
import { prepareInformationSecurityPolicyGenerationContext } from "../lib/ai-documents/information-security-policy-generation-contract.ts";
import { INFORMATION_SECURITY_POLICY_SPEC, INFORMATION_SECURITY_POLICY_TEMPLATE_VERSION } from "../lib/ai-documents/information-security-policy.ts";
import { persistValidatedAiDocumentDraft } from "../lib/ai/documents/common-validated-draft-persistence.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env.local");
if (fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, "utf8");
  const lines = content.replace(/\r?\n(?=[^\w#])/g, "").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && process.env[match[1].trim()] === undefined) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: workspaces, error: wsError } = await supabase.from("workspaces").select("id").limit(1);
  if (wsError) throw new Error("Workspace fetch error: " + wsError.message);
  if (!workspaces || !workspaces.length) throw new Error("No workspace found");
  const workspaceId = workspaces[0].id;
  
  const [evidence, aiDocuments, responses] = await Promise.all([
    supabase.from("evidence_items").select("*").eq("workspace_id", workspaceId),
    supabase.from("ai_documents").select("*").eq("workspace_id", workspaceId),
    supabase.from("assessment_responses").select("*").eq("workspace_id", workspaceId),
  ]);

  // Construct a minimal fixture using the database's assessment responses
  const formattedResponses = responses.data.map(r => ({
    theme: r.theme_id,
    controlId: r.control_id,
    questionId: r.question_id,
    answer: r.answer,
    justification: r.justification
  }));

  const fixture = {
    workspace: { organizationName: "BigSolutionAI", scope: "Entire organization" },
    documentSetup: {
      document_classification: "Internal",
      approver: "Assya",
      policy_owner: "Assya",
      review_plan: "Annually",
      security_objectives: ["Protect data"],
      security_roles: ["Admin"],
      legal_requirements: ["GDPR"],
      communication_channel: "Email"
    },
    assessment: { responses: formattedResponses, context: {} }
  };

  const context = prepareInformationSecurityPolicyGenerationContext(fixture);

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

  const config = getOpenRouterConfig();
  const provider = new OpenRouterAiDocumentProvider({ config, timeoutMs: 180_000 });

  console.log("Sending request to provider...");
  try {
    const recovery = await generateWithSingleJsonRepair(provider, request);
    console.log("Success! HTTP", recovery.response.httpStatus);
    
    console.log("Persisting draft...");
    const saved = await persistValidatedAiDocumentDraft({
      client: supabase,
      workspaceId,
      documentType: "information_security_policy",
      idempotencyKey: `ui-information_security_policy-${crypto.randomUUID()}`,
      context: {
        ...context,
        templateVersion: String(raw.templateVersion ?? raw.template?.version),
        mappingVersion: String(raw.mappingVersion ?? raw.generationContract?.mappingVersion),
        generationContractVersion: String(raw.generationContractVersion ?? raw.generationContract?.version)
      },
      providerResponse: recovery.response,
    });
    console.log("Saved draft successfully! Version:", saved.version);
    
  } catch (error) {
    console.error("DIAGNOSTIC ERROR", error.constructor.name, error.message, error.code, error.details);
    if (error.response?.data) {
      console.error(error.response.data);
    }
  }
}
run();
