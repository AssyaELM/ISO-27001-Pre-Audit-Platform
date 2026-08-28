import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: workspaces, error: err1 } = await supabase.from('workspaces').select('*');
  console.log("Workspaces:", workspaces);
  
  const workspaceId = workspaces[0].id; // assuming first is user
  const { data, error } = await supabase
    .from('ai_documents_registry')
    .select('id, version, status, workspace_id')
    .eq('workspace_id', workspaceId)
    .eq('document_type', 'information_security_policy')
    .order('created_at', { ascending: false })
    .limit(1);
    
  console.log("Latest document for", workspaceId, ":", data);
}
check();
