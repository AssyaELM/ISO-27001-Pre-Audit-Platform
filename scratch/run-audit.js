const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const envVars = Object.fromEntries(
  env.split(/\r?\n/)
    .filter(l => l && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx), l.slice(idx + 1).replace(/^"|"$/g, '')];
    })
);
Object.assign(process.env, envVars);
require('child_process').execSync('npx tsx scratch/audit-auth.js', { stdio: 'inherit', env: process.env });
