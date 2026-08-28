import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { getAiDocumentTemplateSpec } from '../lib/ai/documents/catalog.ts';
import { buildAiDocumentsRegistry } from '../lib/ai-documents/registry.ts';
import { prepareGenerationContext, workspaceGenerationInput } from '../app/api/ai-documents/context.ts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const workspaceId = 'b622c813-1cf0-4286-af1b-8777174db79d';
  const user = { id: 'admin' };
  const [evidence, aiDocuments, responses] = await Promise.all([
    supabase.from('evidence_items').select('*').eq('workspace_id', workspaceId),
    supabase.from('ai_documents').select('*').eq('workspace_id', workspaceId),
    supabase.from('assessment_responses').select('*').eq('workspace_id', workspaceId)
  ]);
  const registry = buildAiDocumentsRegistry(evidence.data as any[], aiDocuments.data as any[]);
  const context = prepareGenerationContext('information_security_policy', workspaceGenerationInput(user, responses.data as never[], registry, {}));
  console.log(context.sourceTrace.find(t => t.sourceId === 'organizationName' || t.sourceId === 'organization_name'));
}
run();
