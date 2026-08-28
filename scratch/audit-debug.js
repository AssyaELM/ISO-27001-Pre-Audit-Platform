const { workspaceGenerationInput } = require('../app/api/ai-documents/context.ts');
const { createClient } = require('@supabase/supabase-js');
async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const { data: authData } = await supabase.auth.signInWithPassword({ email: 'usera@qa.com', password: 'QaPassword123!' });
  const user = authData.user;
  const workspaceId = '9ff58d89-2ed1-41ca-97e3-ed44cc95c34e';
  const { data: assessmentResponses } = await supabase.from('assessment_responses').select('*').eq('workspace_id', workspaceId);
  const rows = (assessmentResponses || []).map(row => ({ theme_id: row.theme_id, control_id: row.control_id, question_id: row.question_id, answer: row.answer, justification: row.justification }));
  const input = workspaceGenerationInput(user, rows, [], {});
  console.log("Responses count:", rows.length);
  console.log("Organizational Context:", Object.keys(input.organizational));
  console.log("People Context:", Object.keys(input.people));
}
run().catch(console.error);
