import fs from 'fs';
import dns from 'dns';
dns.setDefaultResultOrder("ipv4first");

async function run() {
  const TEST_WORKSPACE = "d69d9dcc-06b4-4f37-9ec9-022c693f4136"; // The real user's workspace!
  
  const headers = {
    'Content-Type': 'application/json',
    // NO auth header needed because of the spoof!
  };
  
  console.log("Using workspace:", TEST_WORKSPACE);
  console.log("\nTriggering information_security_policy generation...");
  
  const res = await fetch('http://127.0.0.1:3103/api/ai-documents/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify({ 
      workspaceId: TEST_WORKSPACE, 
      documentType: 'information_security_policy'
      // No setup object provided because it should fetch everything from the real context!
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
        console.log("Total retries:", body.tracker.totalRetries);
        console.log("Total time (ms):", body.tracker.totalTimeMs);
        console.log("Sections generated:", body.tracker.sectionsGenerated);
      }
    } catch {
      console.log("(Could not parse JSON)");
    }
  }
  
  fs.writeFileSync('scratch/last-real-generation.json', text);
  console.log("\nSaved full response to scratch/last-real-generation.json");
}

run().catch(console.error);
