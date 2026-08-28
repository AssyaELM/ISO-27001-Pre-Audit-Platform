import fs from 'fs';
import dns from 'dns';
dns.setDefaultResultOrder("ipv4first");
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync(".env.local", "utf8");
const envVars = Object.fromEntries(
  env.split(/\r?\n/)
    .filter(l => l && !l.startsWith("#"))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx), l.slice(idx + 1)];
    })
);

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

const TEST_EMAIL = "usera@qa.com";
const TEST_PASS  = "QaPassword123!";
const TEST_WORKSPACE = "9ff58d89-2ed1-41ca-97e3-ed44cc95c34e";

async function run() {
  console.log("Authenticating as:", TEST_EMAIL);
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASS
  });
  if (authErr) throw new Error("Auth failed: " + authErr.message);

  console.log("Logged in as:", authData.user.id, authData.user.email);
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authData.session.access_token}`
  };
  
  console.log("Using workspace:", TEST_WORKSPACE);

  console.log("Calling /api/workspaces/ensure...");
  const ensureRes = await fetch('http://127.0.0.1:3103/api/workspaces/ensure', {
    method: 'POST',
    headers,
    body: JSON.stringify({ workspaceId: TEST_WORKSPACE, name: "QA Test Workspace" })
  });
  const ensureBody = await ensureRes.text();
  console.log("Ensure:", ensureRes.status, ensureBody);
  if (!ensureRes.ok) throw new Error("Workspace ensure failed");

  console.log("\nTriggering information_security_policy generation...");
  
  const res = await fetch('http://127.0.0.1:3103/api/ai-documents/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify({ 
      workspaceId: TEST_WORKSPACE, 
      documentType: 'information_security_policy',
      setup: {
        
        policy_owner: "ISMS Committee",
        approver: "Board of Directors",
        review_plan: "2027-01-01",
        document_classification: "Internal",
        security_objectives: "Protect the confidentiality, integrity, and availability of all organizational information assets.",
        legal_requirements: "GDPR, applicable national data protection laws",
        security_roles: "CISO, Security Officer, System Administrators, All Staff",
      }
    })
  });

  const text = await res.text();
  console.log(`\nStatus: ${res.status}`);
  
  if (res.status !== 201) {
    console.log("Response body:", text.substring(0, 2000));
  } else {
    console.log("Generation SUCCESS!");
    try {
      const body = JSON.parse(text);
      console.log("Document ID:", body.document?.id);
      console.log("Version:", body.document?.version);
      console.log("Workspace ID:", body.document?.workspace_id || TEST_WORKSPACE);
      if (body.tracker) {
        console.log("\n=== TRACKER ===");
        console.log("Total Groq calls:", body.tracker.totalGroqCalls);
        console.log("Total time (ms):", body.tracker.totalTimeMs);
        console.log("Sections generated:", body.tracker.sectionsGenerated);
      }
    } catch {
      console.log("(Could not parse JSON)");
    }
  }
  
  fs.writeFileSync('scratch/last-generation.json', text);
  console.log("\nSaved full response to scratch/last-generation.json");
}

run().catch(console.error);
