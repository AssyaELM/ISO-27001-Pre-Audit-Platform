import { createClient } from '@supabase/supabase-js';

const url = 'https://balwdieiegqmrulnvouk.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhbHdkaWVpZWdxbXJ1bG52b3VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTU5NjQxMSwiZXhwIjoyMTAxMTcyNDExfQ.RRJicQZn1vRfrhc6b52iGx5zhptg_qN60i4TMc-_TfA';

const supabase = createClient(url, key);

async function run() {
  const workspaceId = 'b622c813-1cf0-4286-af1b-8777174db79d';
  const { data: latest } = await supabase.from('ai_documents_registry').select('id, version').eq('workspace_id', workspaceId).eq('document_type', 'information_security_policy').order('created_at', { ascending: false }).limit(2);
  console.log(latest);
}
run();
