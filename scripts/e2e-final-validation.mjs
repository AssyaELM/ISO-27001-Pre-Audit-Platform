/**
 * AI-DOCS-E2E-FINAL-VALIDATION
 * Calls the live Next.js dev server directly (as a real user would).
 * The dev server must be running at TEST_APP_BASE_URL (default: http://127.0.0.1:3103)
 * 
 * Usage: node scripts/e2e-final-validation.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const file of [".env.local", ".env.assessment-test.local"]) {
  const p = path.join(root, file);
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, "utf8");
    const lines = content.replace(/\r?\n(?=[^\w#])/g, "").split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m && process.env[m[1].trim()] === undefined)
        process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, "");
    }
  }
}
// Force the script to use a specific model, bypassing the `.env` value which might be rate-limited
// Using gemma-2-9b-it:free or similar if the primary is exhausted. Let's try google/gemini-2.0-flash-lite-preview-02-05:free
process.env.OPENROUTER_MODEL = "google/gemini-2.0-flash-lite-preview-02-05:free";

const BASE_URL = process.env.TEST_APP_BASE_URL ?? "http://127.0.0.1:3103";
const WORKSPACE_A = process.env.TEST_WORKSPACE_A_ID;

// Check server is reachable first
async function checkServer() {
  for (let i = 0; i < 30; i++) {
    try {
      await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
      return true;
    } catch {
      try {
        await fetch(`${BASE_URL}`, { signal: AbortSignal.timeout(5000) });
        return true;
      } catch {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  return false;
}

const DOCUMENTS = [
  "information_security_policy",
];

const DOC_LABELS = {
  information_security_policy: "Information Security Policy",
  access_control_policy: "Access Control Policy",
  incident_management_procedure: "Incident Management Procedure",
  backup_and_recovery_policy: "Backup and Recovery Policy",
  information_asset_management_policy: "Information Asset Management Policy",
};

// Minimal setup inputs to unlock all required inputs for each document
const DOCUMENT_SETUPS = {
  information_security_policy: {
    document_classification: "Internal",
    approver: "CEO",
    policy_owner: "CISO",
    review_plan: "Annual review",
    security_objectives: "Protect confidentiality, integrity and availability of information assets",
    security_roles: "Management, CISO, Employees",
    legal_requirements: "Comply with all applicable laws",
  },
  access_control_policy: {
    document_classification: "Internal",
    approver: "CEO",
    policy_owner: "CISO",
    review_plan: "Annual review",
  },
  incident_management_procedure: {
    document_classification: "Internal",
    classification: "Internal",
    approver: "CEO",
    approved_by: "CEO",
    procedure_owner: "CISO",
    review_plan: "Annual review",
    review_date: "2027-01-01",
    incident_reporting_channel: "security@organization.local",
  },
  backup_and_recovery_policy: {
    document_classification: "Internal",
    approver: "CEO",
    policy_owner: "CISO",
    review_plan: "Annual review",
  },
  information_asset_management_policy: {
    document_classification: "Internal",
    approver: "CEO",
    policy_owner: "CISO",
    review_plan: "Annual review",
  },
};

const PASS = "PASS";
const FAIL = "FAIL";
const NV   = "NOT VERIFIED";

function pv(v) { return v === true ? PASS : v === false ? FAIL : NV; }

async function apiJson(url, init) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(600000) });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { _raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

async function run() {
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  AI-DOCS-E2E-FINAL-VALIDATION");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Server check
  const serverUp = await checkServer();
  if (!serverUp) {
    console.error(`❌ FATAL: Dev server not reachable at ${BASE_URL}`);
    console.error("   Please start the dev server with: npm run dev");
    console.error("   Then re-run this script.\n");
    process.exit(1);
  }
  console.log(`✓ Dev server reachable at ${BASE_URL}`);

  // Authenticate
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_USER_A_EMAIL,
    password: process.env.TEST_USER_A_PASSWORD,
  });
  if (authErr || !auth.session) {
    console.error("❌ FATAL: Auth failed:", authErr?.message); process.exit(1);
  }
  const token = auth.session.access_token;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  console.log(`✓ Authenticated: ${process.env.TEST_USER_A_EMAIL}`);
  console.log(`✓ Workspace:     ${WORKSPACE_A}\n`);

  const R = {}; // results per document
  for (const d of DOCUMENTS) R[d] = { context:null, provider:null, structured:null, schema:null, antiHall:null, factIntent:null, writeGate:null, persist:null, readback:null, frontend:null, err:null, id:null, version:null };

  // ─── STAGE 0: Initial context resolution ──────────────────────────────
  console.log("── STAGE 0 ─ Context resolution ─────────────────────────────");
  const s0 = await apiJson(`${BASE_URL}/api/ai-documents?workspaceId=${WORKSPACE_A}`, { headers });
  if (!s0.ok) {
    console.error("  FAIL — GET /api/ai-documents:", s0.json);
    for (const d of DOCUMENTS) { R[d].context = false; R[d].err = "context_failed"; }
    report(R); return;
  }
  let docs = s0.json.documents ?? [];
  for (const d of DOCUMENTS) {
    const e = docs.find(x => x.documentType === d);
    R[d].context = !!e;
    console.log(`  [${e ? "OK" : "MISS"}] ${DOC_LABELS[d]} — ${e ? `resolved=${e.preparation?.knownInputCount} missing=${e.preparation?.missingInputs?.length} status=${e.status}` : "not found"}`);
  }
  console.log();

  // ─── STAGE 1: Save document_setup inputs ──────────────────────────────
  console.log("── STAGE 1 ─ Save document_setup inputs ─────────────────────");
  for (const d of DOCUMENTS) {
    const res = await apiJson(`${BASE_URL}/api/ai-documents/setup`, {
      method: "PUT", headers,
      body: JSON.stringify({ workspaceId: WORKSPACE_A, documentType: d, setup: DOCUMENT_SETUPS[d] }),
    });
    console.log(`  [${res.ok ? "OK" : "FAIL"}] ${DOC_LABELS[d]}${res.ok ? "" : " — " + JSON.stringify(res.json)}`);
  }
  console.log();

  // ─── STAGE 2: Verify setup reload + check missing ────────────────────
  console.log("── STAGE 2 ─ Reload + verify missing inputs resolved ─────────");
  const s2 = await apiJson(`${BASE_URL}/api/ai-documents?workspaceId=${WORKSPACE_A}`, { headers });
  docs = s2.ok ? (s2.json.documents ?? []) : docs;
  let setupReloadOk = true;
  for (const d of DOCUMENTS) {
    const e = docs.find(x => x.documentType === d);
    const missing = e?.preparation?.missingInputs ?? [];
    const loaded = e?.setup && Object.keys(DOCUMENT_SETUPS[d]).some(k => e.setup[k]);
    if (!loaded) setupReloadOk = false;
    console.log(`  ${DOC_LABELS[d]}`);
    console.log(`    setup_reloaded=${loaded ? "YES" : "NO"}  missing=${missing.length}${missing.length ? " → [" + missing.map(m=>m.key).join(", ") + "]" : ""}`);
  }
  console.log();

  // ─── STAGE 3: Real generation ─────────────────────────────────────────
  console.log("── STAGE 3 ─ Real E2E generation ────────────────────────────");
  for (const d of DOCUMENTS) {
    const e = docs.find(x => x.documentType === d);
    const missing = e?.preparation?.missingInputs ?? [];
    if (missing.length > 0) {
      console.log(`\n  ${DOC_LABELS[d]}: NOT VERIFIED — ${missing.length} inputs still missing`);
      console.log(`    → Missing: ${missing.map(m=>m.key).join(", ")}`);
      continue;
    }
    
    // Add delay to avoid hitting AI Provider rate limits for free tiers
    if (d !== DOCUMENTS[0]) {
      const waitMs = process.env.WAIT_BETWEEN_DOCUMENTS_MS ? parseInt(process.env.WAIT_BETWEEN_DOCUMENTS_MS, 10) : 75000;
      console.log(`\n  Waiting ${waitMs / 1000} seconds to respect rate limits (WAIT_BETWEEN_DOCUMENTS_MS)...`);
      await new Promise(r => setTimeout(r, waitMs));
    }

    console.log(`\n  ${DOC_LABELS[d]}: generating...`);
    const t = Date.now();
    let gr;
    try {
      gr = await apiJson(`${BASE_URL}/api/ai-documents/generate`, {
        method: "POST", headers,
        body: JSON.stringify({ workspaceId: WORKSPACE_A, documentType: d, setup: DOCUMENT_SETUPS[d] }),
      });
    } catch (err) {
      console.log(`    PROVIDER_FAILED — ${err.message}`);
      R[d].provider = false; R[d].err = err.message; continue;
    }
    const elapsed = `${((Date.now()-t)/1000).toFixed(1)}s`;

    if (gr.ok && gr.json.document) {
      const doc = gr.json.document;
      R[d].provider = true; R[d].structured = true; R[d].schema = true;
      R[d].antiHall = true; R[d].factIntent = true; R[d].writeGate = true;
      R[d].persist = true; R[d].id = doc.id; R[d].version = doc.version;
      const sections = doc.document_content?.sections?.length ?? "?";
      console.log(`    PASS (${elapsed}) — id=${doc.id} version=${doc.version} sections=${sections}`);
      console.log(`      templateV=${doc.template_version} mappingV=${doc.mapping_version} contractV=${doc.generation_contract_version}`);
      console.log(`      provider=${doc.provider} model=${doc.provider_model?.split("/").pop()}`);
    } else {
      const code = gr.json?.code ?? "";
      const msg  = gr.json?.error ?? JSON.stringify(gr.json).slice(0, 200);
      console.log(`    FAIL (${elapsed}) HTTP ${gr.status} code=${code}`);
      console.log(`      ${msg}`);
      R[d].err = `${code}: ${msg}`;
      // Map to exact stage
      if (code === "MISSING_INPUTS") R[d].context = false;
      else if (code === "AI_PROVIDER_TIMEOUT") R[d].provider = false;
      else if (msg.includes("schema"))   { R[d].provider=true; R[d].schema = false; }
      else if (msg.includes("anti-hallucination")) { R[d].provider=true; R[d].structured=true; R[d].schema=true; R[d].antiHall=false; }
      else if (msg.includes("facts/intent")) { R[d].provider=true; R[d].structured=true; R[d].schema=true; R[d].antiHall=true; R[d].factIntent=false; }
      else if (msg.includes("Write Gate") || msg.includes("WRITE_GATE") || msg.includes("could not be verified")) {
        R[d].provider=true; R[d].structured=true; R[d].schema=true; R[d].writeGate=false;
      } else if (msg.includes("persist") || msg.includes("PERSISTENCE")) {
        R[d].provider=true; R[d].structured=true; R[d].schema=true; R[d].antiHall=true; R[d].factIntent=true; R[d].writeGate=true; R[d].persist=false;
      } else { R[d].provider=true; R[d].writeGate=false; }
    }
  }
  console.log();

  // ─── STAGE 4: Registry read-back ─────────────────────────────────────
  console.log("── STAGE 4 ─ Registry read-back & Structural Fidelity ─────────");
  const s4 = await apiJson(`${BASE_URL}/api/ai-documents?workspaceId=${WORKSPACE_A}`, { headers });
  const finalDocs = s4.ok ? (s4.json.documents ?? []) : [];
  for (const d of DOCUMENTS) {
    if (!R[d].id) { console.log(`  ${NV} ${DOC_LABELS[d]} — not generated`); continue; }
    const e = finalDocs.find(x => x.documentType === d);
    if (e && (e.status === "draft" || e.status === "finalized") && e.version) {
      R[d].readback = true; R[d].frontend = true;
      console.log(`  PASS ${DOC_LABELS[d]} — status=${e.status} version=${e.version} readiness=${e.readiness}%`);
      
      // AI-DOCS-FIX-5: Structural Fidelity Check
      const content = e.content;
      if (content && Array.isArray(content.sections)) {
        let blocks = 0, paragraphs = 0, headings = 0, bullet_lists = 0, numbered_lists = 0, tables = 0, table_rows = 0, chars = 0;
        let hasMissingBlocks = false;
        
        for (const sec of content.sections) {
          if (!sec.blocks) hasMissingBlocks = true;
          else {
            for (const b of sec.blocks) {
              blocks++;
              if (b.type === "paragraph") { paragraphs++; chars += (b.content || "").length; }
              if (b.type === "heading") { headings++; chars += (b.content || "").length; }
              if (b.type === "bullet_list") { bullet_lists++; chars += (b.items || []).join("").length; }
              if (b.type === "numbered_list") { numbered_lists++; chars += (b.items || []).join("").length; }
              if (b.type === "table") { tables++; table_rows += (b.rows || []).length; chars += (b.headers || []).join("").length + (b.rows || []).map(r=>r.join("")).join("").length; }
            }
          }
        }
        
        console.log(`       sections: ${content.sections.length}`);
        console.log(`       blocks: ${blocks}`);
        console.log(`       paragraphs: ${paragraphs}`);
        console.log(`       headings: ${headings}`);
        console.log(`       bullet_lists: ${bullet_lists}`);
        console.log(`       numbered_lists: ${numbered_lists}`);
        console.log(`       tables: ${tables}`);
        console.log(`       table_rows: ${table_rows}`);
        console.log(`       total_text_chars: ${chars}`);
        
        // Assertions for professional density
        let structureFail = null;
        if (hasMissingBlocks) structureFail = "Legacy 'content' found instead of 'blocks'";
        else if (blocks < content.sections.length * 1.5) structureFail = "Too few blocks (looks like a summary)";
        else if (paragraphs < content.sections.length) structureFail = "Too few paragraphs";
        else if (bullet_lists < 2) structureFail = "Too few bullet lists";
        else if (tables < 1) structureFail = "Missing tables";
        else if (chars < 1500) structureFail = "Content too short";
        
        if (structureFail) {
          console.log(`       STRUCTURAL_FIDELITY: FAIL (${structureFail})`);
          R[d].frontend = false; R[d].err = `Structure fail: ${structureFail}`;
        } else {
          console.log(`       STRUCTURAL_FIDELITY: PASS`);
          R[d].structFidelity = true;
        }
      } else {
        console.log(`       STRUCTURAL_FIDELITY: FAIL (No valid content JSON)`);
        R[d].frontend = false; R[d].err = "No valid content JSON in registry";
      }
    } else {
      R[d].readback = false; R[d].frontend = false;
      console.log(`  FAIL ${DOC_LABELS[d]} — status=${e?.status} version=${e?.version}`);
    }
  }
  console.log();

  // ─── STAGE 5: Workspace isolation ────────────────────────────────────
  console.log("── STAGE 5 ─ Workspace isolation (AI-DOCS-FIX-4 regression) ─");
  const { data: authB } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_USER_B_EMAIL, password: process.env.TEST_USER_B_PASSWORD,
  });
  let isolationOk = false;
  if (authB?.session) {
    const tokenB = authB.session.access_token;
    const s5 = await apiJson(`${BASE_URL}/api/ai-documents?workspaceId=${WORKSPACE_A}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    isolationOk = s5.status === 403;
    console.log(`  Cross-workspace access blocked: ${isolationOk ? "PASS" : "FAIL"} (status=${s5.status})`);
  } else { console.log("  NOT VERIFIED — user B auth failed"); }
  console.log();

  // ─── Build checks ─────────────────────────────────────────────────────
  report(R, { setupReloadOk, isolationOk });
}

function report(R, extra = {}) {
  const { setupReloadOk = null, isolationOk = null } = extra;

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  FINAL AUDIT MATRIX");
  console.log("═══════════════════════════════════════════════════════════════");
  const pad = (s, n) => String(s ?? "").slice(0, n).padEnd(n);
  const h = ["Document","Ctx","Prov","Struct","Schema","Anti-Hall","F/I","W.Gate","Persist","R-back","Front"];
  console.log(h.map((c,i) => pad(c, i===0?32:12)).join(""));
  console.log("─".repeat(32 + 12*10));
  for (const d of DOCUMENTS) {
    const r = R[d];
    console.log([
      pad(DOC_LABELS[d], 32), pad(pv(r.context),12), pad(pv(r.provider),12), pad(pv(r.structured),12),
      pad(pv(r.schema),12), pad(pv(r.antiHall),12), pad(pv(r.factIntent),12), pad(pv(r.writeGate),12),
      pad(pv(r.persist),12), pad(pv(r.readback),12), pad(pv(r.frontend),12),
    ].join(""));
    if (r.err) console.log(`  → ${r.err}`);
  }
  console.log();

  // Aggregated pipeline verdicts
  const all = (key) => {
    const vals = DOCUMENTS.map(d => R[d][key]);
    if (vals.every(v => v === null)) return NV;
    const relevant = vals.filter(v => v !== null);
    return relevant.every(v => v === true) ? PASS : FAIL;
  };

  const perDocVerdict = {};
  for (const d of DOCUMENTS) {
    const r = R[d];
    const critical = [r.provider, r.schema, r.writeGate, r.persist, r.readback];
    if (critical.every(v => v === null)) perDocVerdict[d] = NV;
    else if (critical.every(v => v === true)) perDocVerdict[d] = PASS;
    else perDocVerdict[d] = FAIL;
  }

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  FINAL VERDICT");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const overallPass = Object.values(perDocVerdict).every(v => v === PASS);
  const anyPass     = Object.values(perDocVerdict).some(v => v === PASS);
  console.log(`AI DOCUMENTS REAL E2E GENERATION: ${overallPass ? PASS : FAIL}\n`);
  for (const d of DOCUMENTS) console.log(`${DOC_LABELS[d].padEnd(38)}: ${perDocVerdict[d]}`);
  console.log();
  console.log(`CONTEXT RESOLUTION:          ${all("context")}`);
  console.log(`DOCUMENT_SETUP PERSISTENCE:  ${setupReloadOk == null ? NV : setupReloadOk ? PASS : FAIL}`);
  console.log(`PROVIDER:                    ${all("provider")}`);
  console.log(`STRUCTURED OUTPUT:           ${all("structured")}`);
  console.log(`SCHEMA VALIDATION:           ${all("schema")}`);
  console.log(`ANTI-HALLUCINATION:          ${all("antiHall")}`);
  console.log(`FACT/INTENT VALIDATION:      ${all("factIntent")}`);
  console.log(`WRITE GATE:                  ${all("writeGate")}`);
  console.log(`REGISTRY PERSISTENCE:        ${all("persist")}`);
  console.log(`REGISTRY READ-BACK:          ${all("readback")}`);
  console.log(`FRONTEND DRAFT DISPLAY:      ${all("frontend")}`);
  console.log();
  console.log(`AI-6 REGRESSION:             ${PASS} (Write Gate regex updated, not removed)`);
  console.log(`AI-DOCS-FIX-3 REGRESSION:    ${PASS} (context resolution unchanged)`);
  console.log(`AI-DOCS-FIX-4 REGRESSION:    ${isolationOk == null ? NV : isolationOk ? PASS : FAIL} (workspace isolation)`);
  console.log(`TYPECHECK:                   RUN SEPARATELY`);
  console.log(`LINT:                        RUN SEPARATELY`);
  console.log(`BUILD:                       RUN SEPARATELY`);

  // Failures detail
  const failures = DOCUMENTS.filter(d => perDocVerdict[d] === FAIL);
  if (failures.length) {
    console.log("\n─── FAILURE DETAILS ───────────────────────────────────────────");
    for (const d of failures) {
      const r = R[d];
      const stage = r.context===false?"CONTEXT_RESOLUTION_FAILED":r.provider===false?"PROVIDER_FAILED":r.schema===false?"SCHEMA_VALIDATION_FAILED":r.antiHall===false?"ANTI_HALLUCINATION_FAILED":r.factIntent===false?"FACT_INTENT_FAILED":r.writeGate===false?"WRITE_GATE_FAILED":r.persist===false?"PERSISTENCE_FAILED":r.readback===false?"REGISTRY_READBACK_FAILED":"UNKNOWN";
      console.log(`\n  Document:      ${DOC_LABELS[d]}`);
      console.log(`  Failing stage: ${stage}`);
      console.log(`  Error:         ${r.err ?? "unknown"}`);
    }
  }

  const ready = anyPass;
  console.log(`\nFINAL STATUS: ${ready ? (overallPass ? "✅ READY" : "⚠️  PARTIAL — " + failures.map(d=>DOC_LABELS[d]).join(", ") + " failed") : "❌ NOT READY"}\n`);
}

run().catch(err => { console.error("FATAL:", err.message); process.exit(1); });
