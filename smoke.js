/* eslint-disable */
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const envLines = envContent.split('\n');
let key = '';
for (const line of envLines) {
  if (line.startsWith('GEMINI_API_KEY=')) {
    key = line.split('=')[1].trim();
    break;
  }
}

if (!key) {
  console.error("No API key");
  process.exit(1);
}

function mapSchemaToGemini(schema) {
  const geminiSchema = { ...schema };
  if (typeof geminiSchema.type === "string") {
    geminiSchema.type = geminiSchema.type.toUpperCase();
  }
  if (geminiSchema.properties && typeof geminiSchema.properties === "object") {
    const newProps = {};
    for (const [k, v] of Object.entries(geminiSchema.properties)) {
      newProps[k] = mapSchemaToGemini(v);
    }
    geminiSchema.properties = newProps;
  }
  if (geminiSchema.items && typeof geminiSchema.items === "object") {
    geminiSchema.items = mapSchemaToGemini(geminiSchema.items);
  }
  
  delete geminiSchema.additionalProperties;
  delete geminiSchema.$schema;
  
  if (Array.isArray(geminiSchema.enum)) {
    if (geminiSchema.enum.some((e) => typeof e !== "string")) {
      delete geminiSchema.enum;
    }
  }
  
  return geminiSchema;
}

const sectionSchema = {
    type: "object",
    required: ["blocks"],
    additionalProperties: false,
    properties: {
      blocks: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["type"],
          properties: {
            type: { type: "string", enum: ["paragraph", "heading", "bullet_list", "numbered_list", "table"] },
            content: { type: "string" },
            level: { type: "number", enum: [3, 4] },
            items: { type: "array", items: { type: "string" } },
            headers: { type: "array", items: { type: "string" } },
            rows: { type: "array", items: { type: "array", items: { type: "string" } } }
          }
        }
      }
    }
  };

// Unit / Transform check
console.log("UNIT TEST:");
const mappedSchema = mapSchemaToGemini(sectionSchema);
console.log("Mapped Block Type enum:", mappedSchema.properties.blocks.items.properties.type.enum);
console.log("Mapped Level enum:", mappedSchema.properties.blocks.items.properties.level.enum);
console.log("Mapped Level type:", mappedSchema.properties.blocks.items.properties.level.type);

async function testModel() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const start = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: 'Generate a short section with one heading and one paragraph.' }]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: mapSchemaToGemini(sectionSchema)
      }
    })
  });
  
  const end = Date.now();
  const latency = end - start;
  const status = res.status;
  const text = await res.text();
  
  const headers = {};
  res.headers.forEach((v, k) => headers[k] = v);
  
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    // text isn't json
  }
  
  console.log(`\n=== MODEL: gemini-2.5-flash ===`);
  console.log(`STATUS: ${status}`);
  console.log(`HEADERS:`, headers);
  console.log(`LATENCY: ${latency}ms`);
  
  if (status === 200 && json && json.candidates && json.candidates[0]) {
    console.log("SUCCESS");
    console.log("CONTENT:", json.candidates[0].content.parts[0].text);
  } else {
    console.log("FAIL or ERROR:", text);
  }
}

testModel();
