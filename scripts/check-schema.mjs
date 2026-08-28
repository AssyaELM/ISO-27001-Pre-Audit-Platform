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

async function run() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/workspaces?select=*&limit=1`, {
    headers: {
      "apikey": process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  console.log("workspaces columns:", Object.keys((await res.json())[0] || {}));
  
  const res2 = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/ai_documents?select=*&limit=1`, {
    headers: {
      "apikey": process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  console.log("ai_documents columns:", Object.keys((await res2.json())[0] || {}));
}

run().catch(console.error);
