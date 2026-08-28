import fs from 'fs';


// read env local
const envFile = fs.readFileSync('.env.local', 'utf-8');
const groqKeyMatch = envFile.match(/^GROQ_API_KEY=(.*)$/m);
const apiKey = groqKeyMatch ? groqKeyMatch[1].trim() : null;

if (!apiKey) {
  console.error("GROQ_API_KEY not found in .env.local");
  process.exit(1);
}

const url = "https://api.groq.com/openai/v1/chat/completions";

const schema = {
  type: "object",
  properties: {
    blocks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["paragraph", "heading"] },
          content: { type: "string" },
          level: { type: "number", enum: [3, 4] }
        },
        required: ["type", "content"]
      }
    }
  },
  required: ["blocks"],
  additionalProperties: false
};

const payload = {
  model: "llama-3.3-70b-versatile",
  messages: [
    {
      role: "system",
      content: "You are a policy writer. Output JSON matching the schema precisely. You MUST return JSON. Return exactly 2 blocks."
    },
    {
      role: "user",
      content: "Write a short introduction about access control."
    }
  ],
  response_format: { type: "json_schema", json_schema: { name: "test", schema: schema } },
  max_tokens: 1024
};

async function run() {
  const start = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });
  
  const end = Date.now();
  const headers = {};
  res.headers.forEach((v, k) => headers[k] = v);
  
  const text = await res.text();
  console.log(`STATUS: ${res.status}`);
  console.log(`LATENCY: ${end - start}ms`);
  console.log(`HEADERS: ${JSON.stringify(headers, null, 2)}`);
  console.log(`BODY: ${text.slice(0, 500)}`);
  
  if (res.ok) {
    const json = JSON.parse(text);
    console.log(`CONTENT: ${json.choices[0].message.content}`);
  }
}

run().catch(console.error);
