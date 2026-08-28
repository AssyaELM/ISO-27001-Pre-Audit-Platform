import { prepareInformationSecurityPolicyGenerationContext } from '../lib/ai-documents/information-security-policy-generation-contract.ts';

const input = {
  documentSetup: {},
  workspace: { organizationName: '' },
  assessment: { responses: [] },
  registry: []
};
const context = prepareInformationSecurityPolicyGenerationContext(input as any);
console.log(context.knownInputs);
