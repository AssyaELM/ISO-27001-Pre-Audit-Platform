import { createClient } from "@supabase/supabase-js";
import { buildAiDocumentsRegistry } from "../lib/ai-documents/registry/builder";
import { workspaceGenerationInput } from "../lib/ai-documents/registry/context-builder";
import { prepareGenerationContext } from "../lib/ai-documents/mapping/information-security-policy";
import { normalizeContext } from "../lib/ai-documents/validation/context-validator";

require("dotenv").config({ path: ".env.local" });

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find((u: any) => u.email === "assya@vibesecurity.com" || u.email?.includes("assya") || u.user_metadata?.normcore_onboarding?.organization_name);
  if (!user) throw new Error("No user found");
  
  const workspaceId = user.user_metadata?.normcore_onboarding?.workspace_creation_id;
  
  const [evidence, aiDocuments, responses] = await Promise.all([
    supabase.from("evidence_items").select("*").eq("workspace_id", workspaceId),
    supabase.from("ai_documents").select("*").eq("workspace_id", workspaceId),
    supabase.from("assessment_responses").select("*").eq("workspace_id", workspaceId),
  ]);
  
  const registry = buildAiDocumentsRegistry(evidence.data as any, aiDocuments.data as any);
  const input = workspaceGenerationInput(user as any, responses.data as any, registry, {});
  const context = prepareGenerationContext("information_security_policy", input);
  const preparation = normalizeContext(context as any);
  
  console.log(JSON.stringify({
    missingInputs: preparation.missingInputs,
    sectionReadiness: preparation.sectionReadiness,
    knownInputs: context.knownInputs,
  }, null, 2));
}

run().catch(console.error);
