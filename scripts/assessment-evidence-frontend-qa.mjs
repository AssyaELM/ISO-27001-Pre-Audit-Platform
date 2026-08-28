import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const component = read("components/assessment/question-evidence.tsx");
const pages = {
  organizational: read("app/assessment/organizational/[controlId]/page.tsx"),
  people: read("app/assessment/people/[controlId]/page.tsx"),
  physical: read("app/assessment/physical/[controlId]/page.tsx"),
  technological: read("app/assessment/technological/[controlId]/page.tsx"),
};

for (const [theme, source] of Object.entries(pages)) {
  assert.match(source, /import \{ QuestionEvidence \} from "@\/components\/assessment\/question-evidence"/);
  assert.match(source, new RegExp(`<QuestionEvidence[^>]+themeId="${theme}"`));
}

assert.match(component, /fetch\("\/api\/evidence", \{ method: "POST", body: form \}\)/, "upload must use POST /api/evidence");
assert.match(component, /\/api\/evidence\/\$\{encodeURIComponent\(selectedEvidenceId\)\}\/links/, "existing Evidence must use the canonical link endpoint");
assert.match(component, /method: "DELETE"/, "unlink must use the unlink endpoint");
assert.match(component, /\/download\?\$\{params\}/, "view must request a signed download URL");
assert.match(component, /items\.slice\(0, 2\)/, "QuestionCards must remain compact");
assert.match(component, /Evidence is optional/, "Evidence must be explicitly optional");
for (const field of ["Document information", "Document type", "Version", "Effective date", "Review date", "Document owner"]) assert.match(component, new RegExp(field));
for (const canonical of ["information_security_policy", "access_control_policy", "incident_management_procedure", "backup_restore_procedure", "asset_management_policy", "other"]) assert.match(component, new RegExp(canonical));
assert.match(component, /workspaceMembers\.map/, "owner choices must come from real workspace members");
assert.doesNotMatch(component, /Nora Bennett|Maya Chen|Liam Hart/, "mockup owners must never become runtime data");
assert.doesNotMatch(component, /assessment\/responses|review_status|evidence_reference/, "Evidence UI must not mutate Assessment answers or use legacy evidence fields");

const allFrontend = `${component}\n${Object.values(pages).join("\n")}`;
for (const forbidden of ["Screening-Procedure.pdf", "Hiring-Checklist.csv", "HR-Screening-Policy.pdf", "mockData", "sampleData", "demoData"]) {
  assert.equal(allFrontend.includes(forbidden), false, `forbidden mockup data found: ${forbidden}`);
}

console.log("Assessment Evidence frontend QA: PASS");
