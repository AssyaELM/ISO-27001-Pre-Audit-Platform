import { getAiDocumentTemplateSpec } from '../lib/ai/documents/catalog.ts';
import { buildAiDocumentsRegistry } from '../lib/ai-documents/registry.ts';
import { prepareGenerationContext, workspaceGenerationInput } from '../app/api/ai-documents/context.ts';

const user = { id: 'admin' };
const context = prepareGenerationContext('information_security_policy', workspaceGenerationInput(user, [], [], {}));
console.log((context as any).knownInputs?.organization_name);
