import { buildCommonDocumentGenerationRequest } from './lib/ai/documents/request-builder.ts';
import { prepareGenerationContext, workspaceGenerationInput } from './app/api/ai-documents/context.ts';
import fs from 'fs';
import dns from 'dns';
dns.setDefaultResultOrder("ipv4first");
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync(".env.local", "utf8");
const envVars = Object.fromEntries(env.split(/\r?\n/).filter(l => l && !l.startsWith('#')).map(l => { const idx = l.indexOf('='); return [l.slice(0, idx), l.slice(idx + 1)]; }));
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
  const context = prepareGenerationContext('information_security_policy', input);
  const raw = context;
  console.log('=== CONTEXT BUILDER AUDIT ===');
  console.log('organization transmise oui/non: ' + !!raw.organization?.name);
  console.log('onboarding transmis oui/non: ' + !!input.technological?.onboarding);
  console.log('assessment transmis oui/non: ' + !!(responses && responses.length > 0));
  console.log('evidence transmis oui/non: ' + !!(evidence && evidence.length > 0));
  console.log('setup transmis oui/non: false (vide pour ce test)');
  console.log('semanticFacts non vide oui/non: ' + (Object.keys(raw.semanticFacts || {}).length > 0));
  console.log('knownInputs non vide oui/non: ' + (Object.keys(raw.knownInputs || {}).length > 0));
  console.log('\n=== PREVIEW SECTION 1 (Document Control) ===');
  console.log('Resolved Inputs:', raw.knownInputs);
  console.log('\n=== PREVIEW SECTION 8 (Roles and Responsibilities) ===');
  console.log('Facts Length:', raw.semanticFacts?.roles_and_responsibilities?.length);
  if (raw.semanticFacts?.roles_and_responsibilities) console.log('Sample Fact:', raw.semanticFacts.roles_and_responsibilities.slice(0, 1));
}
run().catch(console.error);
