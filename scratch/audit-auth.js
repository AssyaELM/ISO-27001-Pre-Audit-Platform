
const { prepareInformationSecurityPolicyGenerationContext } = require('../lib/ai-documents/information-security-policy-generation-contract.ts');
const { workspaceGenerationInput } = require('../app/api/ai-documents/context.ts');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const { data: authData } = await supabase.auth.signInWithPassword({ email: 'usera@qa.com', password: 'QaPassword123!' });
  const user = authData.user;
  const workspaceId = '9ff58d89-2ed1-41ca-97e3-ed44cc95c34e';
  const { data: workspace } = await supabase.from('workspaces').select('*').eq('id', workspaceId).single();
  const { data: documentSetup } = await supabase.from('document_setup').select('*').eq('workspace_id', workspaceId).single();
  const { data: registry } = await supabase.from('ai_documents_registry').select('*').eq('workspace_id', workspaceId);
  const { data: assessmentResponses } = await supabase.from('assessment_responses').select('*').eq('workspace_id', workspaceId);
  
  const rows = (assessmentResponses || []).map(row => ({ theme_id: row.theme_id, control_id: row.control_id, question_id: row.question_id, answer: row.answer, justification: row.justification }));
  const input = workspaceGenerationInput(user, rows, registry || [], documentSetup?.settings || {});
  
  const assessment = { responses: input.responses, organizationalContext: input.organizational, peopleContext: input.people, physicalContext: input.physical, technologicalContext: input.technological };
  const ctx = prepareInformationSecurityPolicyGenerationContext({ workspace: { organizationName: input.organizationName, ismsScope: input.scope }, documentSetup: input.setup, registry: input.registry, assessment });

  console.log("=== FINAL PAYLOAD AUDIT ===");
  console.log("knownInputs Object Keys:", Object.keys(ctx.knownInputs));
  console.log("semanticFacts Object Keys:", Object.keys(ctx.semanticFacts));
  console.log("\n=== Section 7 (Risk Management) ===");
  console.log(JSON.stringify(ctx.semanticFacts['information_security_risk_management'] || [], null, 2));
  console.log("\n=== Section 8 (Roles and Responsibilities) ===");
  console.log(JSON.stringify(ctx.semanticFacts['roles_and_responsibilities'] || [], null, 2));
}
run().catch(console.error);
