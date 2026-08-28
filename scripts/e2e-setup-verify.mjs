import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import assert from "node:assert/strict";

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
  console.log("Starting real E2E Setup Persistance verification...");
  
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
  
  const testSetup = {
    document_classification: "Secret " + Date.now(),
    approver: "Test CEO",
    policy_owner: "Test CISO"
  };

  console.log("Saving inputs...");
  const resSave = await fetch("http://127.0.0.1:3103/api/ai-documents/setup", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      workspaceId,
      documentType: "information_security_policy",
      setup: testSetup
    })
  });
  if (!resSave.ok) throw new Error("Failed to save setup: " + await resSave.text());

  console.log("Inputs saved successfully. Fetching documents...");
  
  const resFetch = await fetch(`http://127.0.0.1:3103/api/ai-documents?workspaceId=${workspaceId}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  
  if (!resFetch.ok) throw new Error("Failed to fetch documents: " + await resFetch.text());
  const docs = await resFetch.json();
  const isp = docs.documents.find(d => d.documentType === "information_security_policy");
  
  assert.equal(isp.setup.approver, "Test CEO");
  assert.equal(isp.setup.policy_owner, "Test CISO");
  assert.equal(isp.setup.document_classification, testSetup.document_classification);
  
  console.log("Reload successful. Verifying DB isolation...");
  
  // Verify user B cannot see user A's setups
  const { data: authDataB } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_USER_B_EMAIL,
    password: process.env.TEST_USER_B_PASSWORD,
  });
  const tokenB = authDataB.session.access_token;
  
  const resFetchB = await fetch(`http://127.0.0.1:3103/api/ai-documents?workspaceId=${workspaceId}`, {
    headers: { "Authorization": `Bearer ${tokenB}` }
  });
  assert.equal(resFetchB.status, 403);
  
  const resFetchB_workspaceB = await fetch(`http://127.0.0.1:3103/api/ai-documents?workspaceId=${process.env.TEST_WORKSPACE_B_ID}`, {
    headers: { "Authorization": `Bearer ${tokenB}` }
  });
  const docsB = await resFetchB_workspaceB.json();
  const ispB = docsB.documents.find(d => d.documentType === "information_security_policy");
  assert.notEqual(ispB?.setup?.approver, "Test CEO");

  console.log("ALL TESTS PASS");
}

run().catch(console.error);
