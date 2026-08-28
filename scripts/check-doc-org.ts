import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const workspaceId = 'b622c813-1cf0-4286-af1b-8777174db79d';
  const { data } = await supabase.from('ai_documents').select('*').eq('workspace_id', workspaceId);
  for (const doc of data) {
    if (JSON.stringify(doc).includes('Acme Corp')) console.log('Found in doc:', doc.document_type, doc.version);
  }
}
run();
