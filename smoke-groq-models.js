import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const groqKeyMatch = envFile.match(/^GROQ_API_KEY=(.*)$/m);
const apiKey = groqKeyMatch ? groqKeyMatch[1].trim() : null;

async function run() {
  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { "Authorization": `Bearer ${apiKey}` }
  });
  const json = await res.json();
  console.log(json.data.map(m => m.id).join("\n"));
}
run();
