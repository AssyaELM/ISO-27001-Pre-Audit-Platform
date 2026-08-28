const { prepareInformationSecurityPolicyGenerationContext } = require('../lib/ai-documents/information-security-policy-generation-contract.ts');


const workspaceId = '9ff58d89-2ed1-41ca-97e3-ed44cc95c34e';

async function runAudit() {
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) { console.error("No service key"); return; }
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: workspace, error: wsErr } = await supabase.from('workspaces').select('*').eq('id', workspaceId).single(); if(wsErr) console.error('Workspace error:', wsErr);
  const { data: documentSetup } = await supabase.from('document_setup').select('*').eq('workspace_id', workspaceId).single();
  const { data: registry } = await supabase.from('ai_documents_registry').select('*').eq('workspace_id', workspaceId);
  const { data: assessmentResponses } = await supabase.from('assessment_responses').select('*').eq('workspace_id', workspaceId);
  
  // Fake what context.ts does
  const input = {
    workspace: {
      organizationName: workspace.name,
      ismsScope: workspace.settings?.isms_scope,
      scopeExclusions: workspace.settings?.scope_exclusions || []
    },
    documentSetup: documentSetup?.settings || {},
    registry: registry || [],
    assessment: {
      responses: (assessmentResponses || []).map(row => ({
        theme: row.theme_id,
        controlId: row.control_id,
        questionId: row.question_id,
        answer: row.answer,
        justification: row.justification
      })),
      organizationalContext: {},
      peopleContext: {},
      technologicalContext: {
        onboarding: workspace.settings?.normcore_onboarding || {} // Usually this comes from user_metadata.normcore_onboarding, but this is an approximation for testing
      }
    }
  };

  const ctx = prepareInformationSecurityPolicyGenerationContext(input);

  console.log("=== FINAL PAYLOAD AUDIT ===");
  console.log("knownInputs Object Keys:", Object.keys(ctx.knownInputs));
  console.log("semanticFacts Object Keys:", Object.keys(ctx.semanticFacts));
  
  console.log("\n=== Section 7 (Risk Management) ===");
  console.log(JSON.stringify(ctx.semanticFacts['information_security_risk_management'] || [], null, 2));

  console.log("\n=== Section 8 (Roles and Responsibilities) ===");
  console.log(JSON.stringify(ctx.semanticFacts['roles_and_responsibilities'] || [], null, 2));

  console.log("\n=== Sections 10, 11, 12 (Asset Management, Access Control, Cryptography) ===");
  console.log(JSON.stringify(ctx.semanticFacts['asset_management'] || [], null, 2));
  console.log(JSON.stringify(ctx.semanticFacts['access_control'] || [], null, 2));
  console.log(JSON.stringify(ctx.semanticFacts['cryptography'] || [], null, 2));
}

runAudit().catch(console.error);
