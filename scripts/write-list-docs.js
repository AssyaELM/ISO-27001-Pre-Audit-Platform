const fs = require('fs');
const content = \
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase.from('ai_documents').select('id, version, document_content').eq('workspace_id', 'b622c813-1cf0-4286-af1b-8777174db79d');
  console.log(error);
  console.log(data?.map(d => ({id: d.id, version: d.version, blocks: d.document_content.sections[0].blocks?.length})));
}
run();\
fs.writeFileSync('scripts/list-docs.ts', content);
