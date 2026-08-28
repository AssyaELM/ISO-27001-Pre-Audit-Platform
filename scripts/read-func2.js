const fs = require('fs');
const content = fs.readFileSync('app/api/ai-documents/context.ts', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('export function workspaceGenerationInput'));
console.log(lines.slice(start, start + 20).join('\n'));
