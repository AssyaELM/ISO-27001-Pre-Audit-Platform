import { buildCommonDocumentGenerationRequest } from './lib/ai/documents/request-builder.ts';
import { prepareGenerationContext, workspaceGenerationInput } from './app/api/ai-documents/context.ts';
import fs from 'fs';
import dns from 'dns';
dns.setDefaultResultOrder("ipv4first");
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync(".env.local", "utf8");
const envVars = Object.fromEntries(env.split(/\r?\n/).filter(l => l && !l.startsWith(#)).map(l => { const idx = l.indexOf(=); return [l.slice(0, idx), l.slice(idx + 1)]; }));
const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const TEST_WORKSPACE = "d69d9dcc-06b4-4f37-9ec9-022c693f4136";
  
  const { data: ws } = await supabase.from('workspaces').select('owner_id').eq('id', TEST_WORKSPACE).single();
  const { data: { user } } = await supabase.auth.admin.getUserById(ws.owner_id);
  
  const { data: responses } = await supabase.from('assessment_responses').select('*').eq('workspace_id', TEST_WORKSPACE);
  const { data: registryDocs } = await supabase.from('ai_documents').select('*').eq('workspace_id', TEST_WORKSPACE);
  const { data: evidence } = await supabase.from('evidence_items').select('*').eq('workspace_id', TEST_WORKSPACE);
  
  const { buildAiDocumentsRegistry } = await import('./lib/ai-documents/registry.ts');
  const registry = buildAiDocumentsRegistry(evidence || [], registryDocs || []);
  
  const input = workspaceGenerationInput(user, responses || [], registry, {});
  const context = prepareGenerationContext("information_security_policy", input);
  
  const raw = context as any;
  const semanticFacts = raw.semanticFacts || {};
  const knownInputs = raw.knownInputs || {};
  
  console.log("=== CONTEXT BUILDER AUDIT ===");
  console.log(\organization transmise oui/non: \);
  console.log(\onboarding transmis oui/non: \);
  console.log(\assessment transmis oui/non: \);
  console.log(\evidence transmis oui/non: \);
  console.log(\setup transmis oui/non: false (vide pour ce test)\);
  console.log(\semanticFacts non vide oui/non: \);
  console.log(\knownInputs non vide oui/non: \);
  
  console.log(\n=== SECTIONS DATA PREVIEW ===\);
  const spec = (await import('./lib/ai-documents/catalog.ts')).getAiDocumentTemplateSpec("information_security_policy");
  const gen = buildCommonDocumentGenerationRequest({
    documentType: "information_security_policy",
    templateVersion: raw.template?.version,
    mappingVersion: raw.generationContract?.mappingVersion,
    generationContractVersion: raw.generationContract?.version,
    documentTitle: spec.label,
    language: "en",
    semanticFacts,
    policyIntent: {},
    resolvedInputs: knownInputs,
    sectionReadiness: raw.sectionReadiness || {}
  });

  const check = [1, 7, 8, 15, 16];
  for (const s of gen.request.sections) {
    const order = spec.sections.find(x => x.id === s.sectionId)?.order;
    if (check.includes(order)) {
      console.log(\n--- Section :  ---);
      console.log(\Resolved Inputs:, JSON.stringify(s.resolvedInputs));
      console.log(\Semantic Facts:, JSON.stringify(s.facts));
    }
  }
}
run().catch(console.error);
