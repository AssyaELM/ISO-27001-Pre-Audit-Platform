import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const file of [".env.local", ".env.assessment-test.local"]) {
  const p = path.join(root, file);
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, "utf8");
    const lines = content.replace(/\r?\n(?=[^\w#])/g, "").split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match && process.env[match[1].trim()] === undefined) {
        process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
      }
    }
  }
}

async function checkTable(name) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${name}?select=*&limit=1`, {
    headers: {
      "apikey": process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  console.log(name, res.status, res.status === 200 ? "EXISTS" : await res.text());
}

async function run() {
  await checkTable("document_setup");
  await checkTable("ai_document_setups");
  await checkTable("document_setups");
  await checkTable("ai_document_setup");
  await checkTable("workspace_settings");
}

run().catch(console.error);
