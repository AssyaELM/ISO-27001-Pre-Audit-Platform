const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const env = fs.readFileSync(".env.local", "utf-8").split("\n").forEach(line => {
  const [k, ...v] = line.split("=");
  if (k && v) process.env[k.trim()] = v.join("=").trim().replace(/['"]/g, '');
});

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: aiDocs } = await supabase.from("ai_documents").select("*");
  console.log(JSON.stringify(aiDocs.map(d => ({ doc: d.document_type, setup: d.setup })), null, 2));
}

run();
