import { buildAiDocumentsRegistry } from '../lib/ai-documents/registry.ts';
import { prepareGenerationContext, workspaceGenerationInput } from '../app/api/ai-documents/context.ts';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://balwdieiegqmrulnvouk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhbHdkaWVpZWdxbXJ1bG52b3VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTU5NjQxMSwiZXhwIjoyMTAxMTcyNDExfQ.RRJicQZn1vRfrhc6b52iGx5zhptg_qN60i4TMc-_TfA'
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
  const input = workspaceGenerationInput(user, responses.data as never[], registry, {});
  console.log('organizationName from workspaceGenerationInput:', input.organizationName);
  console.log('setup from workspaceGenerationInput:', input.setup);
  const context = prepareGenerationContext('information_security_policy', input);
  console.log('organization_name in knownInputs:', context.knownInputs.organization_name);
}
run();
