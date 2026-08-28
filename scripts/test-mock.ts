import { config } from 'dotenv';
config({ path: '.env.local' });
import { getAiDocumentTemplateSpec } from '../lib/ai/documents/catalog.ts';
import { prepareGenerationContext, workspaceGenerationInput, normalizeContext } from '../app/api/ai-documents/context.ts';

const user = { id: 'admin' };
const context = prepareGenerationContext('information_security_policy', workspaceGenerationInput(user, [], [], {}));
const raw = context as any;
const knownInputs = raw.knownInputs ?? {};

console.log('Resolved Inputs:');
const checks = [
  'organization_name', 'policy_owner', 'approver', 'review_plan', 
  'document_classification', 'security_objectives', 'legal_requirements', 
  'asset_classifications'
];

for (const k of checks) {
  const v = knownInputs[k];
  console.log(k, '->', v === undefined || v === null || v === '' ? 'MISSING' : v);
}
