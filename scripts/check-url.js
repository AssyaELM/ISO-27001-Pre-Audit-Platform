const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
console.log(envFile.split('\n').filter(l => l.includes('URL')));
