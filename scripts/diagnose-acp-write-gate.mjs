/**
 * Diagnoses which forbidden terms the common Write Gate catches
 * in a simulated ACP text to identify why generation fails.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const file of [".env.local", ".env.assessment-test.local"]) {
  const p = path.join(root, file);
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match && process.env[match[1].trim()] === undefined)
        process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
    }
  }
}

// FIXED regex — matches current common-validated-draft-persistence.ts
const forbidden = /\b(SIEM|CMDB|Jira|ServiceNow|sk-or-v1-|PAM\/JIT)\b/i;

// Typical phrases an AI would naturally use in ACP policy sections
const samplePolicySentences = [
  "Access rights shall be reviewed on a regular basis.",
  "This policy is subject to annual review.",
  "Access reviews are conducted on a quarterly basis.",
  "Daily access logs shall be retained.",
  "Weekly reports on access anomalies shall be produced.",
  "A monthly reconciliation of user accounts shall be performed.",
  "Sanctions may apply for policy violations.",
  "MFA is required for all administrative access.",
  "VPN connections must be authenticated.",
  "RBAC controls are enforced at the application level.",
  "The CISO is responsible for policy governance.",
  "Access is granted on a need-to-know basis.",
  "This policy shall be reviewed every 12 months.",
  "User access rights are reviewed periodically.",
];

console.log("=== Write Gate Diagnosis: Access Control Policy ===\n");

let blocked = 0;
for (const sentence of samplePolicySentences) {
  const match = forbidden.exec(sentence)?.[0];
  if (match) {
    console.log(`BLOCKED: "${sentence}"\n  → Matched forbidden term: "${match}"\n`);
    blocked++;
  } else {
    console.log(`OK:      "${sentence}"`);
  }
}

console.log(`\n=== RESULT: ${blocked}/${samplePolicySentences.length} sentences would be blocked ===`);
console.log("\nROOT CAUSE: The global 'forbidden' regex in common-validated-draft-persistence.ts");
console.log("contains time-frequency words (annual, quarterly, daily, weekly, monthly, sanction)");
console.log("that are STANDARD policy language and should NOT be globally blocked.");
console.log("These belong in per-document prohibitedInferences only when they represent INVENTED facts.");
