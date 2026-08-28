const fs = require('fs');
let content = fs.readFileSync('lib/ai-documents/information-security-policy-generation-contract.ts', 'utf-8');

content = content.replace(
  `trace.push({ sourceType: "derived", sourceId: "fallback_classification", confidence: "derived" });`,
  `trace.push({ sourceType: "document_setup", sourceId: "fallback_classification", confidence: "derived" });`
);
content = content.replace(
  `trace.push({ sourceType: "derived", sourceId: "fallback_review_plan", confidence: "derived" });`,
  `trace.push({ sourceType: "document_setup", sourceId: "fallback_review_plan", confidence: "derived" });`
);

fs.writeFileSync('lib/ai-documents/information-security-policy-generation-contract.ts', content);
