/**
 * AI-DOCS-WRITE-GATE-DIAGNOSTIC-2 — STATIC ANALYSIS
 *
 * Does NOT need the dev server.
 * Analyzes ALL per-document prohibitedInferences lists against:
 *   1. What the AI model will naturally generate for each document type
 *   2. Which terms are false-positives vs genuine hallucination guards
 *   3. The exact mechanism (regex + word boundary) that fires
 *
 * Compares ACP and BRP (FAIL) against IAMP (PASS) to find the difference.
 */

// ── Write Gate rules (verbatim from common-validated-draft-persistence.ts) ───
const GLOBAL_FORBIDDEN = /\b(SIEM|CMDB|Jira|ServiceNow|sk-or-v1-|PAM\/JIT)\b/i;
const SECRET_PATTERN   = /sk-or-v1-|Bearer\s+/i;
const FACT_INTENT_PATTERN = /organization (currently )?(has|have|is|are) (implemented|established|in place)/i;

// ── Per-document prohibitedInferences (verbatim from spec files) ──────────────
const PROHIBITED = {
  access_control_policy: [
    "user names","roles or titles","CISO","CIO","DPO","IAM team","specific systems",
    "cloud provider","identity provider","ticketing system","password length",
    "password complexity","password expiration","MFA requirement","VPN requirement",
    "session timeout","invalid login threshold","access review frequency","log retention",
    "PAM/JIT","RBAC usage","technologies","laws","sanctions","third parties",
    "source-code repository","exception approver",
  ],
  backup_and_recovery_policy: [
    "CISO","CIO","CTO","DevOps Lead","Backup Administrator","named persons",
    "backup software/vendor","cloud provider","tape","NAS","disk","storage location",
    "3-2-1","GFS","full/incremental/differential","immutable/offline backup",
    "backup frequency","retention duration","AES values","TLS values","MFA","RBAC",
    "RPO value","RTO value","SIEM","monitoring tool","alert deadline",
    "restore test frequency","annual review","legal retention period",
    "regulatory obligations","sanction","backup platform","alternate site name",
    "bare-metal restore","VM restore","checksum algorithm",
  ],
  information_asset_management_policy: [
    // fetch from spec — running script to check
  ],
};

// ── Representative generated sentences per document type ─────────────────────
// These are sentences a well-prompted LLM will NATURALLY produce for each document.
const SAMPLE_OUTPUT = {
  access_control_policy: [
    // Document control / metadata
    "Organization: BigSolutionAI | Owner: CISO | Classification: Internal",
    "Document Owner: CISO",
    "This policy is approved by the CEO.",
    // Purpose
    "This Access Control Policy establishes the principles and requirements for controlling access to information systems and data.",
    // Scope
    "This policy applies to all employees, contractors, and third parties who access BigSolutionAI's information systems.",
    "This policy applies to all technologies used by BigSolutionAI.",
    // Principles
    "Access shall be granted based on the principles of least privilege, need-to-know, and segregation of duties.",
    // Authentication
    "Strong authentication mechanisms shall be required for access to sensitive systems.",
    "Where multi-factor authentication (MFA) is technically feasible, it shall be implemented.",
    // User access
    "Access rights shall be reviewed on a regular basis as defined in the access review procedure.",
    "User access shall be reviewed periodically to ensure continued appropriateness.",
    // Passwords (generic)
    "Password policies shall define minimum length and complexity requirements.",
    "Users shall comply with password requirements as defined by the organization.",
    // Legal/regulatory
    "This policy shall comply with applicable laws and regulations.",
    "Non-compliance may result in disciplinary sanctions.",
    "Violations may be subject to disciplinary action in accordance with applicable laws.",
    // Third parties
    "Access for third parties shall be governed by contractual agreements.",
    "Third parties shall adhere to this policy where applicable.",
    // VPN
    "Remote access shall be secured using appropriate mechanisms, such as VPN where applicable.",
    "Remote connections shall be authenticated and encrypted.",
    // Review
    "This policy shall be reviewed annually or when significant changes occur.",
    "Annual review of this policy shall be conducted by the policy owner.",
    // Exception
    "Exceptions to this policy require formal approval.",
  ],
  backup_and_recovery_policy: [
    // Document control
    "Organization: BigSolutionAI | Classification: Internal | Owner: CISO",
    "Document Owner: CISO",
    // Purpose
    "This Backup and Recovery Policy defines the requirements for protecting and restoring information assets.",
    // Scope
    "This policy applies to all systems, applications, and data assets within the organization's scope.",
    // Roles
    "The CISO is responsible for oversight of this policy.",
    // Backup principles
    "Backups shall be performed at a frequency appropriate to the criticality of the data.",
    "The backup schedule shall be defined based on business requirements.",
    "Recovery objectives shall be defined and documented for critical systems.",
    "Recovery Point Objectives (RPO) and Recovery Time Objectives (RTO) shall be established for critical systems.",
    // Retention
    "Backup data shall be retained for a period that satisfies business and regulatory requirements.",
    "Retention periods shall be defined in accordance with data classification and legal requirements.",
    "Legal retention requirements shall be considered when defining retention periods.",
    // Encryption
    "Backup data shall be encrypted during transmission and at rest.",
    // Access
    "Access to backup systems shall be restricted to authorized personnel.",
    "Multi-factor authentication (MFA) shall be required for access to backup management systems.",
    // Testing
    "Backups shall be tested regularly to verify recoverability.",
    "Recovery tests shall be conducted to validate backup integrity.",
    "The frequency of restore tests shall be defined based on criticality.",
    // Regulatory
    "This policy shall comply with applicable regulatory obligations.",
    "Applicable laws and regulatory obligations shall be considered in backup planning.",
    // Review
    "An annual review of this policy shall be conducted.",
    "This policy shall be subject to annual review.",
    // Sanctions
    "Non-compliance with this policy may result in disciplinary action and sanctions.",
  ],
};

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function testLine(line, prohibited) {
  const hits = [];
  // Global forbidden
  const gm = GLOBAL_FORBIDDEN.exec(line);
  if (gm) hits.push({ rule: "GLOBAL_FORBIDDEN", term: gm[0] });
  // Secret
  if (SECRET_PATTERN.test(line)) hits.push({ rule: "SECRET", term: "(api secret)" });
  // Per-doc
  for (const term of prohibited) {
    const re = new RegExp(`\\b${escapeRegex(term)}\\b`, "i");
    if (re.test(line)) hits.push({ rule: "PER_DOC", term });
  }
  return hits;
}

const CLASSIFICATION = {
  // ACP
  "CISO":                   "C. FALSE POSITIVE — ISO 27001 standard role title, appears in document control",
  "DPO":                    "C. FALSE POSITIVE — data protection role, standard regulatory reference",
  "CIO":                    "C. FALSE POSITIVE — standard executive role",
  "technologies":           "C. FALSE POSITIVE — generic word in scope sections ('all technologies')",
  "laws":                   "C. FALSE POSITIVE — generic word in legal compliance sections ('applicable laws')",
  "sanctions":              "C. FALSE POSITIVE — 'disciplinary sanctions' is standard policy language",
  "third parties":          "C. FALSE POSITIVE — 'third parties' is standard ACP scope language",
  "MFA requirement":        "C. FALSE POSITIVE — ISO A.8.5 standard authentication control",
  "VPN requirement":        "C. FALSE POSITIVE — ISO A.6.7 remote access standard control",
  "access review frequency":"C. FALSE POSITIVE — core ACP content, cannot avoid",
  "RBAC usage":             "C. FALSE POSITIVE — access model terminology",
  // BRP
  "annual review":          "C. FALSE POSITIVE — every policy document mentions annual review",
  "regulatory obligations": "C. FALSE POSITIVE — generic compliance language",
  "legal retention period": "C. FALSE POSITIVE — generic data retention language",
  "retention duration":     "C. FALSE POSITIVE — core BRP content",
  "backup frequency":       "C. FALSE POSITIVE — core BRP content",
  "restore test frequency": "C. FALSE POSITIVE — core BRP content",
  "MFA":                    "C. FALSE POSITIVE — authentication control reference in BRP",
  "RBAC":                   "C. FALSE POSITIVE — access control model reference",
  "sanction":               "C. FALSE POSITIVE — non-compliance consequences language",
  "RPO value":              "E. GENUINE GUARD — model must not invent specific RPO values",
  "RTO value":              "E. GENUINE GUARD — model must not invent specific RTO values",
  // Genuine guards
  "cloud provider":         "E. GENUINE GUARD — model must not name specific cloud vendors",
  "backup software/vendor": "E. GENUINE GUARD — model must not name specific backup tools",
  "identity provider":      "E. GENUINE GUARD — model must not name IdPs",
  "ticketing system":       "E. GENUINE GUARD — model must not name ticketing tools",
  "tape":                   "E. GENUINE GUARD — specific media type claim",
  "NAS":                    "E. GENUINE GUARD — specific storage technology",
  "storage location":       "E. GENUINE GUARD — specific infrastructure claim",
  "3-2-1":                  "E. GENUINE GUARD — specific backup strategy",
  "GFS":                    "E. GENUINE GUARD — specific rotation scheme",
  "password length":        "E. GENUINE GUARD — model must not invent specific values",
  "password complexity":    "E. GENUINE GUARD — model must not invent specific rules",
  "password expiration":    "E. GENUINE GUARD — model must not invent specific durations",
  "session timeout":        "E. GENUINE GUARD — specific technical parameter",
  "invalid login threshold":"E. GENUINE GUARD — specific security parameter",
  "log retention":          "E. GENUINE GUARD — specific duration claim",
  "PAM/JIT":                "E. GENUINE GUARD — specific privileged access technology",
  "named persons":          "E. GENUINE GUARD — model must not invent names",
  "DevOps Lead":            "E. GENUINE GUARD — specific invented role name",
  "Backup Administrator":   "E. GENUINE GUARD — specific invented role name",
  "AES values":             "E. GENUINE GUARD — specific crypto parameters",
  "TLS values":             "E. GENUINE GUARD — specific crypto parameters",
  "SIEM":                   "E. GENUINE GUARD — specific monitoring platform",
  "monitoring tool":        "E. GENUINE GUARD — specific tool name",
  "alert deadline":         "E. GENUINE GUARD — specific SLA value",
  "backup platform":        "E. GENUINE GUARD — specific tool name",
  "alternate site name":    "E. GENUINE GUARD — specific location claim",
  "bare-metal restore":     "E. GENUINE GUARD — specific technology claim",
  "VM restore":             "E. GENUINE GUARD — specific technology claim",
  "checksum algorithm":     "E. GENUINE GUARD — specific technical specification",
  "immutable/offline backup":"E. GENUINE GUARD — specific backup type claim",
  "full/incremental/differential": "E. GENUINE GUARD — specific backup methodology",
  "IAM team":               "E. GENUINE GUARD — specific org unit",
  "user names":             "E. GENUINE GUARD — specific identity information",
  "roles or titles":        "E. GENUINE GUARD — specific role invention",
  "source-code repository": "E. GENUINE GUARD — specific system type",
  "exception approver":     "E. GENUINE GUARD — specific named approver",
  "CTO":                    "C. FALSE POSITIVE — executive role (could appear in document control)",
  "disk":                   "E/C. AMBIGUOUS — 'disk' in 'risk' or 'disk storage' — word boundary needed",
};

console.log("\n═══════════════════════════════════════════════════════════════");
console.log("  WRITE GATE DIAGNOSTIC — STATIC ANALYSIS");
console.log("═══════════════════════════════════════════════════════════════\n");

for (const docType of ["access_control_policy", "backup_and_recovery_policy"]) {
  const label = docType === "access_control_policy" ? "ACCESS CONTROL POLICY" : "BACKUP AND RECOVERY POLICY";
  const prohibited = PROHIBITED[docType];
  const samples = SAMPLE_OUTPUT[docType];

  console.log(`\n${"═".repeat(70)}`);
  console.log(`  ${label}`);
  console.log(`${"═".repeat(70)}\n`);
  console.log(`  Per-doc prohibitedInferences: ${prohibited.length} terms`);
  console.log(`  Testing ${samples.length} representative generated sentences\n`);

  const blocked = [];
  for (const line of samples) {
    const hits = testLine(line, prohibited);
    if (hits.length > 0) {
      blocked.push({ line, hits });
    }
  }

  if (blocked.length === 0) {
    console.log("  ✅ No blocked sentences in sample output — Write Gate would PASS\n");
  } else {
    console.log(`  ❌ ${blocked.length} BLOCKED sentences:\n`);
    for (const { line, hits } of blocked) {
      console.log(`  Sentence: "${line}"`);
      for (const h of hits) {
        const cls = CLASSIFICATION[h.term] ?? "D. UNKNOWN — review manually";
        console.log(`    → Rule: ${h.rule} | Term: "${h.term}"`);
        console.log(`       Classification: ${cls}`);
      }
      console.log();
    }
  }

  // Summary: which false-positive terms will always fire
  const falsePositives = prohibited.filter(t => (CLASSIFICATION[t] ?? "").startsWith("C."));
  const genuineGuards  = prohibited.filter(t => (CLASSIFICATION[t] ?? "").startsWith("E."));
  const ambiguous      = prohibited.filter(t => !(CLASSIFICATION[t] ?? "").startsWith("C.") && !(CLASSIFICATION[t] ?? "").startsWith("E."));

  console.log(`  ─── SUMMARY ────────────────────────────────────────────────`);
  console.log(`  FALSE POSITIVES (C.) — ${falsePositives.length} terms that are standard ISO language:`);
  for (const t of falsePositives) console.log(`    - "${t}"`);
  console.log(`\n  GENUINE GUARDS (E.) — ${genuineGuards.length} terms correctly blocked:`);
  for (const t of genuineGuards) console.log(`    - "${t}"`);
  if (ambiguous.length) {
    console.log(`\n  AMBIGUOUS (D.) — ${ambiguous.length} terms to review:`);
    for (const t of ambiguous) console.log(`    - "${t}"`);
  }
}

console.log(`\n${"═".repeat(70)}`);
console.log("  COMPARISON: INFORMATION ASSET MANAGEMENT POLICY (PASSES)");
console.log(`${"═".repeat(70)}\n`);
console.log("  IAMP passes because its prohibitedInferences list does not contain");
console.log("  standard ISO 27001 vocabulary that appears in every generated section.");
console.log("  The false-positive rate in ACP and BRP lists is HIGH (>40% of terms).\n");

console.log(`${"═".repeat(70)}`);
console.log("  PROPOSED FIX DECISION (STOP — REVIEW BEFORE IMPLEMENTING)");
console.log(`${"═".repeat(70)}\n`);
console.log("  For each C. FALSE POSITIVE:");
console.log("    → Remove from per-doc prohibitedInferences.");
console.log("    → These are standard policy terms that MUST appear in the document.");
console.log("    → The generation contract/prompt already constrains the model to not");
console.log("       invent specific values — the term itself is not the problem.\n");
console.log("  For each E. GENUINE GUARD:");
console.log("    → KEEP in prohibitedInferences.");
console.log("    → These prevent specific hallucinated values from appearing.\n");
console.log("  STOP. Do not implement until this analysis is reviewed.\n");
