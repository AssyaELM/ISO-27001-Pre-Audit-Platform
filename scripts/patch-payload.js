const fs = require('fs');
let content = fs.readFileSync('app/api/ai-documents/generate/route.ts', 'utf-8');
content = content.replace(
  `const workspaceId = payload.workspaceId?.trim() ?? "";`,
  `const workspaceId = payload.workspaceId?.trim() ?? "";\n    console.log("DIAGNOSTIC PAYLOAD:", JSON.stringify(payload, null, 2));`
);
fs.writeFileSync('app/api/ai-documents/generate/route.ts', content);
