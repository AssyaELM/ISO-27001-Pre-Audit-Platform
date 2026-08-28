const fs = require('fs');
let content = fs.readFileSync('lib/ai-documents/information-security-policy-generation-contract.ts', 'utf8');
const idx = content.lastIndexOf('import { organizationalControls }');
if (idx > 0) {
  content = content.substring(idx);
  fs.writeFileSync('lib/ai-documents/information-security-policy-generation-contract.ts', content);
}
