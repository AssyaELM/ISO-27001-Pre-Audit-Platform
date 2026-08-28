import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match && process.env[match[1].trim()] === undefined) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
}

const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const email = process.env.NORMCORE_TEST_EMAIL;
const password = process.env.NORMCORE_TEST_PASSWORD;
const workspaceId = process.env.NORMCORE_TEST_WORKSPACE_ID;
if (!base || !anon || !email || !password || !workspaceId) throw new Error("Missing local test configuration.");

const auth = await fetch(`${base}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anon, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
if (!auth.ok) throw new Error(`Supabase login failed: HTTP ${auth.status}`);
const authBody = await auth.json();
const accessToken = authBody.access_token;
if (typeof accessToken !== "string" || !accessToken) throw new Error("Supabase login returned no access token.");

const headers = { apikey: anon, Authorization: `Bearer ${accessToken}` };
const setupResponse = await fetch(`${base}/rest/v1/ai_documents?workspace_id=eq.${encodeURIComponent(workspaceId)}&document_type=eq.information_security_policy&version=eq.setup&select=document_content`, { headers });
if (!setupResponse.ok) throw new Error(`Setup read failed: HTTP ${setupResponse.status}`);
const setupRows = await setupResponse.json();
const setup = setupRows[0]?.document_content ?? {};

const startedAt = Date.now();
const generation = await fetch("http://127.0.0.1:3103/api/ai-documents/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
  body: JSON.stringify({ workspaceId, documentType: "information_security_policy", setup }),
});
const body = await generation.json();
if (!generation.ok) throw new Error(`ISP generation failed: HTTP ${generation.status} code=${body.code ?? "unknown"}`);

const registry = await fetch(`http://127.0.0.1:3103/api/ai-documents?workspaceId=${encodeURIComponent(workspaceId)}`, { headers: { Authorization: `Bearer ${accessToken}` } });
const registryBody = await registry.json();
const entry = Array.isArray(registryBody.documents) ? registryBody.documents.find((item) => item.documentType === "information_security_policy") : null;
console.log(JSON.stringify({
  generation: "PASS",
  provider: body.tracker?.provider ?? null,
  model: body.tracker?.model ?? null,
  sections: body.tracker?.sectionsGenerated ?? null,
  providerCalls: body.tracker?.totalProviderCalls ?? null,
  retries: body.tracker?.totalRetries ?? null,
  usage: body.tracker?.usage ?? null,
  registryReadBack: registry.ok && entry ? { status: entry.registryStatus, version: entry.version, contentPresent: Boolean(entry.content) } : "FAIL",
  durationMs: Date.now() - startedAt,
}));
