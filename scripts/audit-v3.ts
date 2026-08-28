import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data } = await supabase.from('ai_documents_registry').select('*').eq('id', 'ca66c8d7-75e9-4e78-98e3-b0fc9d5c3d4a').single();
  const doc = data.active_document;
  console.log('Workspace ID:', data.workspace_id);
  console.log('Version:', data.version);
  
  let totalBlocks = 0;
  const sectionsSummary = doc.sections.map(s => {
    const blocksCount = s.blocks ? s.blocks.length : 0;
    totalBlocks += blocksCount;
    return {
      id: s.sectionId,
      status: s.status,
      blocks: blocksCount,
      types: s.blocks ? [...new Set(s.blocks.map(b => b.type))].join(',') : 'none'
    };
  });
  console.log('Sections:', doc.sections.length);
  console.log('Total Blocks:', totalBlocks);
  console.table(sectionsSummary);
}
run();
