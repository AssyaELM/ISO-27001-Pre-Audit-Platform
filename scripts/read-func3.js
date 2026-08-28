const fs = require('fs');
const content = fs.readFileSync('lib/ai-documents/information-security-policy-generation-contract.ts', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('export function prepareInformationSecurityPolicyGenerationContext'));
console.log(lines.slice(start+20, start + 35).join('\n'));
