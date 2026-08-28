import { createClient } from "@supabase/supabase-js";
import { workspaceGenerationInput, prepareGenerationContext, normalizeContext } from "../app/api/ai-documents/context";
import { buildAiDocumentsRegistry } from "../lib/ai-documents/registry";
import * as fs from "fs";

fs.readFileSync(".env.local", "utf-8").split("\n").forEach((line: string) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) process.env[k.trim()] = v.join("=").trim().replace(/['"]/g, '');
});

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find((u: any) => u.email.includes("assya"));
  
  const workspaceId = user.user_metadata?.normcore_onboarding?.workspace_creation_id;
  
  const [evidence, aiDocuments, responses] = await Promise.all([
    supabase.from("evidence_items").select("*").eq("workspace_id", workspaceId),
    supabase.from("ai_documents").select("*").eq("workspace_id", workspaceId),
    supabase.from("assessment_responses").select("*").eq("workspace_id", workspaceId),
  ]);
  
  const registry = buildAiDocumentsRegistry((evidence.data || []) as any, (aiDocuments.data || []) as any);
  const input = workspaceGenerationInput(user as any, (responses.data || []) as any, registry, {});
  const context = prepareGenerationContext("information_security_policy", input);
  const preparation = normalizeContext(context as any);
  
  console.log(JSON.stringify(preparation, null, 2));
}

run().catch(console.error);
