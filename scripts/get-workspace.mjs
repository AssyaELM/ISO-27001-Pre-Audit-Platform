import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data: workspaces, error } = await supabase.from('workspaces').select('*');
  if (error) console.error(error);
  else console.log(workspaces);
}
check();
