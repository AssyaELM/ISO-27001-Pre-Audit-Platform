import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const [filename, override] of [[".env.local", false], [".env.assessment-test.local", true]]) {
  const file = path.join(root, filename);
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && (override || process.env[match[1].trim()] === undefined)) process.env[match[1].trim()] = match[2].trim();
  }
}

const env = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  service: process.env.SUPABASE_SERVICE_ROLE_KEY,
  emailA: process.env.TEST_USER_A_EMAIL, passwordA: process.env.TEST_USER_A_PASSWORD,
  emailB: process.env.TEST_USER_B_EMAIL, passwordB: process.env.TEST_USER_B_PASSWORD,
  workspaceA: process.env.TEST_WORKSPACE_A_ID, workspaceB: process.env.TEST_WORKSPACE_B_ID,
  app: process.env.TEST_APP_BASE_URL ?? "http://127.0.0.1:3103",
};
if (Object.values(env).some((value) => !value)) {
  console.log("NOT VERIFIED — AI Documents Registry integration environment is incomplete.");
  process.exit(0);
}

async function session(email, password) {
  const response = await fetch(`${env.url}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: env.key, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  assert.equal(response.status, 200, "password grant must succeed");
  assert.equal(typeof data.access_token, "string");
  return {
    token: data.access_token,
    userId: data.user.id,
    client: createClient(env.url, env.key, { global: { headers: { Authorization: `Bearer ${data.access_token}` } } }),
  };
}

async function api(token, pathname, options = {}) {
  const response = await fetch(`${env.app}${pathname}`, {
    ...options, headers: { Authorization: `Bearer ${token}`, ...(options.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function upload(token, workspaceId, name, documentType, metadata = {}) {
  const form = new FormData();
  form.set("workspaceId", workspaceId);
  form.set("file", new File([`registry-${name}`], name, { type: "text/plain" }));
  form.set("documentType", documentType);
  for (const [key, value] of Object.entries(metadata)) if (value) form.set(key, value);
  const result = await api(token, "/api/evidence", { method: "POST", body: form });
  assert.equal(result.response.status, 201, JSON.stringify(result.body));
  return result.body.evidence;
}

function entry(registry, documentType) {
  const result = registry.find((item) => item.documentType === documentType);
  assert.ok(result, `${documentType} missing from registry`);
  return result;
}

const a = await session(env.emailA, env.passwordA);
const b = await session(env.emailB, env.passwordB);
const admin = createClient(env.url, env.service, { auth: { persistSession: false, autoRefreshToken: false } });
const evidenceIds = [];
const aiDocumentIds = [];

try {
  const beforeRows = await admin.from("ai_documents").select("id", { count: "exact", head: true });
  assert.equal(beforeRows.error, null);
  const baseline = await api(a.token, `/api/ai-documents?workspaceId=${env.workspaceA}`);
  assert.equal(baseline.response.status, 200, JSON.stringify(baseline.body));
  assert.equal(baseline.body.registry.length, 5);
  assert.deepEqual(baseline.body.registry.map((item) => item.status), Array(5).fill("missing"));
  const afterReadRows = await admin.from("ai_documents").select("id", { count: "exact", head: true });
  assert.equal(afterReadRows.count, beforeRows.count, "registry reads must not create drafts");

  const other = await upload(a.token, env.workspaceA, "registry-other.txt", "other");
  evidenceIds.push(other.id);
  const afterOther = await api(a.token, `/api/ai-documents?workspaceId=${env.workspaceA}`);
  assert.deepEqual(afterOther.body.registry.map((item) => item.status), Array(5).fill("missing"));

  const accessV1 = await upload(a.token, env.workspaceA, "access-v1.txt", "access_control_policy", {
    documentVersion: "v1", reviewDate: "2099-01-01", documentOwnerId: a.userId,
  });
  evidenceIds.push(accessV1.id);
  let registry = (await api(a.token, `/api/ai-documents?workspaceId=${env.workspaceA}`)).body.registry;
  assert.equal(entry(registry, "access_control_policy").status, "already_available");
  assert.equal(entry(registry, "access_control_policy").reviewState, "current");
  assert.equal(entry(registry, "access_control_policy").activeDocument.id, accessV1.id);

  const accessV2 = await upload(a.token, env.workspaceA, "access-v2.txt", "access_control_policy", {
    documentVersion: "v2", reviewDate: "2099-02-01", documentOwnerId: a.userId,
  });
  evidenceIds.push(accessV2.id);
  registry = (await api(a.token, `/api/ai-documents?workspaceId=${env.workspaceA}`)).body.registry;
  assert.equal(entry(registry, "access_control_policy").evidenceCount, 2);
  assert.equal(entry(registry, "access_control_policy").activeDocument.id, accessV2.id);
  assert.deepEqual(entry(registry, "access_control_policy").evidenceDocuments.map((item) => item.id), [accessV2.id, accessV1.id]);

  const incident = await upload(a.token, env.workspaceA, "incident-past.txt", "incident_management_procedure", { reviewDate: "2000-01-01" });
  evidenceIds.push(incident.id);
  const backup = await upload(a.token, env.workspaceA, "backup-unknown.txt", "backup_restore_procedure");
  evidenceIds.push(backup.id);
  registry = (await api(a.token, `/api/ai-documents?workspaceId=${env.workspaceA}`)).body.registry;
  assert.equal(entry(registry, "incident_management_procedure").reviewState, "review_overdue");
  assert.equal(entry(registry, "backup_restore_procedure").reviewState, "unknown");

  const suffix = Date.now().toString(36);
  const draftA = await admin.from("ai_documents").insert({
    workspace_id: env.workspaceA, document_type: "information_security_policy",
    status: "draft", version: `qa-${suffix}-v1`, created_by: a.userId,
  }).select("*").single();
  assert.equal(draftA.error, null);
  aiDocumentIds.push(draftA.data.id);
  registry = (await api(a.token, `/api/ai-documents?workspaceId=${env.workspaceA}`)).body.registry;
  assert.equal(entry(registry, "information_security_policy").status, "draft");
  assert.equal(entry(registry, "information_security_policy").activeDocument.id, draftA.data.id);

  const finalizedA = await admin.from("ai_documents").insert({
    workspace_id: env.workspaceA, document_type: "information_security_policy",
    status: "finalized", version: `qa-${suffix}-v2`, created_by: a.userId,
  }).select("*").single();
  assert.equal(finalizedA.error, null);
  aiDocumentIds.push(finalizedA.data.id);
  registry = (await api(a.token, `/api/ai-documents?workspaceId=${env.workspaceA}`)).body.registry;
  assert.equal(entry(registry, "information_security_policy").status, "finalized");
  assert.equal(entry(registry, "information_security_policy").activeDocument.id, finalizedA.data.id);
  const versions = await admin.from("ai_documents").select("id,version,status").eq("workspace_id", env.workspaceA).eq("document_type", "information_security_policy").in("id", [draftA.data.id, finalizedA.data.id]);
  assert.equal(versions.data.length, 2, "finalized versions must not overwrite earlier versions");

  const draftB = await admin.from("ai_documents").insert({
    workspace_id: env.workspaceB, document_type: "asset_management_policy",
    status: "draft", version: `qa-${suffix}-b1`, created_by: b.userId,
  }).select("*").single();
  assert.equal(draftB.error, null);
  aiDocumentIds.push(draftB.data.id);
  const crossApi = await api(b.token, `/api/ai-documents?workspaceId=${env.workspaceA}`);
  assert.equal(crossApi.response.status, 403);
  const ownB = await api(b.token, `/api/ai-documents?workspaceId=${env.workspaceB}`);
  assert.equal(ownB.response.status, 200);
  assert.equal(entry(ownB.body.registry, "asset_management_policy").status, "draft");
  const directCross = await a.client.from("ai_documents").select("id").eq("workspace_id", env.workspaceB);
  assert.equal(directCross.error, null);
  assert.equal(directCross.data.length, 0);

  await api(a.token, `/api/evidence/${accessV1.id}?workspaceId=${env.workspaceA}`, { method: "DELETE" });
  evidenceIds.splice(evidenceIds.indexOf(accessV1.id), 1);
  await api(a.token, `/api/evidence/${accessV2.id}?workspaceId=${env.workspaceA}`, { method: "DELETE" });
  evidenceIds.splice(evidenceIds.indexOf(accessV2.id), 1);
  registry = (await api(a.token, `/api/ai-documents?workspaceId=${env.workspaceA}`)).body.registry;
  assert.equal(entry(registry, "access_control_policy").status, "missing");
  assert.equal(entry(registry, "access_control_policy").evidenceCount, 0);

  console.log("PASS AI Documents Registry integration: missing, Evidence reuse, other exclusion, counts, deterministic current, review states, deletion recalculation, draft/finalized priority, versioning and A/B isolation.");
} finally {
  for (const evidenceId of evidenceIds) await api(a.token, `/api/evidence/${evidenceId}?workspaceId=${env.workspaceA}`, { method: "DELETE" });
  if (aiDocumentIds.length) await admin.from("ai_documents").delete().in("id", aiDocumentIds);
  await a.client.auth.signOut();
  await b.client.auth.signOut();
}
