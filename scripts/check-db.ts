import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const workspaceId = 'b622c813-1cf0-4286-af1b-8777174db79d';
  const [evidence, aiDocuments, responses, workspaces] = await Promise.all([
    supabase.from('evidence_items').select('*').eq('workspace_id', workspaceId),
    supabase.from('ai_documents').select('*').eq('workspace_id', workspaceId),
    supabase.from('assessment_responses').select('*').eq('workspace_id', workspaceId),
    supabase.from('workspaces').select('*').eq('id', workspaceId)
  ]);
  console.log('Workspaces:', JSON.stringify(workspaces).includes('Acme Corp'));
  console.log('AiDocs:', JSON.stringify(aiDocuments).includes('Acme Corp'));
  console.log('Evidence:', JSON.stringify(evidence).includes('Acme Corp'));
  console.log('Responses:', JSON.stringify(responses).includes('Acme Corp'));
}
run();
