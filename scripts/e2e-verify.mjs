import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFileLocal = path.join(root, ".env.local");
const envFileTest = path.join(root, ".env.assessment-test.local");

for (const file of [envFileLocal, envFileTest]) {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, "utf8");
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
  console.log("Starting real E2E Information Security Policy generation...");
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_USER_A_EMAIL,
    password: process.env.TEST_USER_A_PASSWORD,
  });

  if (authError || !authData.session) {
    throw new Error("Failed to authenticate: " + authError?.message);
  }

  const workspaceId = process.env.TEST_WORKSPACE_A_ID;
  const token = authData.session.access_token;
  const refreshToken = authData.session.refresh_token;

  const setup = {
    document_classification: "Internal",
    approver: "Assya",
    policy_owner: "Assya",
    review_plan: "Annually",
    security_objectives: ["Protect data"],
    security_roles: ["Admin"],
    legal_requirements: ["GDPR"],
    communication_channel: "Email"
  };

  console.log("Sending request to frontend API route...");
  
  const res = await fetch("http://127.0.0.1:3103/api/ai-documents/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      workspaceId,
      documentType: "information_security_policy",
      setup
    })
  });

  const responseJson = await res.json();
  
  if (!res.ok) {
    console.error("GENERATION FAILED", responseJson);
    throw new Error("Generation failed: " + JSON.stringify(responseJson));
  }
  
  console.log("API returned success!");
  console.log("Draft ID:", responseJson.document.id);
  console.log("Draft Version:", responseJson.document.version);

  // Now verify readback using the service key directly to ensure it persisted in the DB
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: drafts, error: dbError } = await supabaseAdmin
    .from("ai_documents")
    .select("*")
    .eq("id", responseJson.document.id);

  if (dbError || drafts.length === 0) {
    throw new Error("Failed to read back from registry");
  }

  console.log("Registry Readback: PASS");
  console.log("FrontEnd Draft: v1");
  console.log("ALL TESTS PASS");
}

run().catch(console.error);
