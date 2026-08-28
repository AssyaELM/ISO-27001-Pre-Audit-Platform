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

// ---------------------------------------------------------------------------
// READ CREDENTIALS FROM ENVIRONMENT or fail clearly
// ---------------------------------------------------------------------------
const TEST_EMAIL = envVars.TEST_USER_EMAIL;
const TEST_PASS  = envVars.TEST_USER_PASSWORD;
const TEST_WORKSPACE = envVars.TEST_WORKSPACE_ID;

if (!TEST_EMAIL || !TEST_PASS || !TEST_WORKSPACE) {
  console.error([
    "Missing required env vars:",
    !TEST_EMAIL    ? "  TEST_USER_EMAIL"    : null,
    !TEST_PASS     ? "  TEST_USER_PASSWORD" : null,
    !TEST_WORKSPACE ? "  TEST_WORKSPACE_ID" : null,
  ].filter(Boolean).join("\n"));
  process.exit(1);
}

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

  // First ensure workspace exists for this user
  console.log("Calling /api/workspaces/ensure...");
  const ensureRes = await fetch('http://127.0.0.1:3103/api/workspaces/ensure', {
    method: 'POST',
    headers,
    body: JSON.stringify({ workspaceId: TEST_WORKSPACE, name: "QA Test Workspace" })
  });
  const ensureBody = await ensureRes.text();
  console.log("Ensure:", ensureRes.status, ensureBody);
  if (!ensureRes.ok) throw new Error("Workspace ensure failed");

  // Trigger generation via the real route
  console.log("\nTriggering information_security_policy generation...");
  console.log("Endpoint: POST http://127.0.0.1:3103/api/ai-documents/generate");
  console.log("Provider: Groq llama-3.3-70b-versatile");
  
  const res = await fetch('http://127.0.0.1:3103/api/ai-documents/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify({ 
      workspaceId: TEST_WORKSPACE, 
      documentType: 'information_security_policy',
      setup: {
        // organization_name is NOT provided here — it must come from workspace onboarding data
        // If the workspace lacks onboarding data, set TEST_WORKSPACE_ORG_NAME in .env.local to inject via setup
        ...(envVars.TEST_WORKSPACE_ORG_NAME ? { organization_name: envVars.TEST_WORKSPACE_ORG_NAME } : {}),
        policy_owner: envVars.TEST_POLICY_OWNER || "ISMS Committee",
        approver: envVars.TEST_APPROVER || "Board of Directors",
        review_plan: envVars.TEST_REVIEW_PLAN || "2027-01-01",
        document_classification: envVars.TEST_CLASSIFICATION || "Internal",
        security_objectives: envVars.TEST_SECURITY_OBJECTIVES || "Protect the confidentiality, integrity, and availability of all organizational information assets.",
        legal_requirements: envVars.TEST_LEGAL_REQUIREMENTS || "GDPR, applicable national data protection laws",
        security_roles: envVars.TEST_SECURITY_ROLES || "CISO, Security Officer, System Administrators, All Staff",
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
      console.log("Status:", body.document?.status);
      if (body.tracker) {
        console.log("\n=== TRACKER ===");
        console.log("Total Groq calls:", body.tracker.totalGroqCalls);
        console.log("Total retries:", body.tracker.totalRetries);
        console.log("Total time (ms):", body.tracker.totalTimeMs);
        console.log("Sections generated:", body.tracker.sectionsGenerated);
        console.log("Retries per section:", JSON.stringify(body.tracker.retriesPerSection));
      }
      if (body.knownInputs) {
        console.log("\n=== KNOWN INPUTS ===");
        const fields = ['organization_name','policy_owner','approver','review_plan','review_frequency','document_classification','security_objectives','legal_requirements','asset_classifications','security_roles'];
        for (const f of fields) {
          const val = body.knownInputs[f];
          console.log(`  ${f}: ${val !== undefined ? 'KNOWN' : 'MISSING'}`);
        }
      }
    } catch {
      console.log("(Could not parse JSON)");
    }
  }
  
  fs.writeFileSync('scratch/last-generation.json', text);
  console.log("\nSaved full response to scratch/last-generation.json");
}

run().catch(console.error);
