const fs = require('fs');
let content = fs.readFileSync('lib/ai-documents/information-security-policy-generation-contract.ts', 'utf-8');

const target = `for (const [key, options] of Object.entries(candidates)) { const distinct = new Set(options.map((item) => JSON.stringify(item.value))); if (distinct.size > 1) { conflicts.push({ key, values: options }); continue; } if (options[0]) { values[key] = options[0].value; trace.push(options[0].source); } }`;

const replacement = target + `
  if (!present(values.document_classification)) {
    values.document_classification = "to be defined";
    trace.push({ sourceType: "derived", sourceId: "fallback_classification", confidence: "derived" });
  }
  if (!present(values.review_plan)) {
    values.review_plan = "to be defined";
    trace.push({ sourceType: "derived", sourceId: "fallback_review_plan", confidence: "derived" });
  }
`;

content = content.replace(target, replacement);

fs.writeFileSync('lib/ai-documents/information-security-policy-generation-contract.ts', content);
