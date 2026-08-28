import { createClient } from '@supabase/supabase-js';

const url = 'https://balwdieiegqmrulnvouk.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhbHdkaWVpZWdxbXJ1bG52b3VrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTU5NjQxMSwiZXhwIjoyMTAxMTcyNDExfQ.RRJicQZn1vRfrhc6b52iGx5zhptg_qN60i4TMc-_TfA';

const supabase = createClient(url, key);

async function run() {
  const { data: latest, error } = await supabase.from('ai_documents_registry').select('id, workspace_id, version').order('created_at', { ascending: false }).limit(5);
  console.log(latest, error);
}
run();
