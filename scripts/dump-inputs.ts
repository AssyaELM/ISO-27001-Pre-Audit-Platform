import { getAiDocumentTemplateSpec } from '../lib/ai/documents/catalog.ts';
import { prepareGenerationContext, workspaceGenerationInput } from '../app/api/ai-documents/context.ts';

const user = { id: 'admin' };
const context = prepareGenerationContext('information_security_policy', workspaceGenerationInput(user, [], [], {}));
console.log(context.knownInputs);
