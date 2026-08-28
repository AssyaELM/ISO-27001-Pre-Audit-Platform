const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const envVars = Object.fromEntries(
  env.split(/\r?\n/).filter(l => l && !l.startsWith('#')).map(l => {
    const idx = l.indexOf('=');
    return [l.slice(0, idx), l.slice(idx + 1).replace(/^"|"$/g, '')];
  })
);
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function run() {
  const workspaceId = 'd69d9dcc-06b4-4f37-9ec9-022c693f4136';
  const { data, error } = await supabase.from('assessment_responses').select('*').eq('workspace_id', workspaceId);
  if (error) console.error(error);
  console.log("Found responses:", data?.length);
}
run().catch(console.error);
