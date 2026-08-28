const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const env = fs.readFileSync(".env.local", "utf-8").split("\n").forEach(line => {
  const [k, ...v] = line.split("=");
  if (k && v) process.env[k.trim()] = v.join("=").trim().replace(/['"]/g, '');
});

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find((u) => u.email.includes("assya"));
  const onboarding = user.user_metadata?.normcore_onboarding || {};
  const workspaceId = onboarding.workspace_creation_id;

  const { data: evidence, error: evErr } = await supabase.from("evidence_items").select("*").eq("workspace_id", workspaceId);
  const { data: registry, error: regErr } = await supabase.from("ai_documents").select("*").eq("workspace_id", workspaceId);
  const { data: responses, error: resErr } = await supabase.from("assessment_responses").select("*").eq("workspace_id", workspaceId);

  if (resErr) {
    console.error("Error fetching assessment_responses:", resErr);
  }

  const res = responses || [];

  console.log("--- 1. DOCUMENT CLASSIFICATION ---");
  console.log("Onboarding classification:", onboarding.document_classification);
  console.log("Evidence items classification metadata:", (evidence || []).map(e => e.classification).filter(Boolean));
  console.log("Assessment answers related to classification (a5-14):", res.find(r => r.control_id === "a5-14"));

  console.log("\n--- 2. REVIEW PLAN ---");
  const reviewEv = (evidence || []).filter(e => e.review_date);
  console.log("Evidence items with review_date:", reviewEv.map(e => ({ name: e.original_filename, date: e.review_date })));
  console.log("Assessment answers related to review frequency:", res.filter(r => r.answer?.toLowerCase().includes("review") || r.justification?.toLowerCase().includes("review")));

  console.log("\n--- 3. SECURITY OBJECTIVES ---");
  const objResponses = res.filter(r => r.control_id === "a5-1" || r.question_id === "o5_36_001" || r.answer?.toLowerCase().includes("objective") || r.justification?.toLowerCase().includes("objective"));
  console.log("Assessment objectives (raw answers):", objResponses.map(r => ({ q: r.question_id, a: r.answer, j: r.justification })));

  console.log("\n--- 4. SECURITY ROLES ---");
  console.log("Onboarding role:", onboarding.assessment_owner?.role, onboarding.assessment_owner?.other_role);
  const roleResponses = res.filter(r => r.control_id === "a5-2" || r.answer?.toLowerCase().includes("role") || r.justification?.toLowerCase().includes("role"));
  console.log("Assessment roles:", roleResponses.map(r => ({ q: r.question_id, a: r.answer, j: r.justification })));
  console.log("Onboarding members:", onboarding.members);

  console.log("\n--- 5. LEGAL REQUIREMENTS ---");
  const legalResponses = res.filter(r => r.control_id === "a5-31" || r.answer?.toLowerCase().includes("legal") || r.answer?.toLowerCase().includes("law") || r.justification?.toLowerCase().includes("legal") || r.justification?.toLowerCase().includes("law") || r.justification?.toLowerCase().includes("regulation"));
  console.log("Assessment legal:", legalResponses.map(r => ({ q: r.question_id, a: r.answer, j: r.justification })));
  console.log("Onboarding country/industry:", onboarding.organization?.primary_country, onboarding.organization?.industry);
}

run().catch(console.error);
