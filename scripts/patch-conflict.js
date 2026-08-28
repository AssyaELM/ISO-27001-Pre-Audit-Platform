const fs = require('fs');
let content = fs.readFileSync('lib/ai-documents/information-security-policy-generation-contract.ts', 'utf-8');
content = content.replace(
  `for (const [key, options] of Object.entries(candidates)) { const distinct = new Set(options.map((item) => JSON.stringify(item.value))); if (distinct.size > 1) { conflicts.push({ key, values: options }); continue; } if (options[0]) { values[key] = options[0].value; trace.push(options[0].source); } }`,
  `for (const [key, options] of Object.entries(candidates)) {
      const explicitSetup = options.find(o => o.source.sourceType === "document_setup");
      if (explicitSetup) {
        values[key] = explicitSetup.value;
        trace.push(explicitSetup.source);
        continue;
      }
      const distinct = new Set(options.map((item) => JSON.stringify(item.value)));
      if (distinct.size > 1) { conflicts.push({ key, values: options }); continue; }
      if (options[0]) { values[key] = options[0].value; trace.push(options[0].source); }
    }`
);
fs.writeFileSync('lib/ai-documents/information-security-policy-generation-contract.ts', content);
