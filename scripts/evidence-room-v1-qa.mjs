import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const page = read("components/evidence/evidence-room-page.tsx");
const api = read("app/api/evidence/route.ts");
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`PASS ${name}`); }

test("Evidence Room uses canonical evidence APIs and no demo records", () => {
  for (const endpoint of ["/api/evidence", "/links", "/download", "/replace"]) assert.match(page, new RegExp(endpoint.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  for (const forbidden of ["mockData", "sampleData", "demoData", "ACME", "Nora Bennett", "Liam Hart", "Maya Chen", "Access-Control-Policy.pdf", "Screening-Procedure.pdf"]) assert.equal(page.includes(forbidden), false, `${forbidden} must not be runtime data`);
});

test("Evidence Room derives all KPI values from returned evidence and links", () => {
  assert.match(page, /total: evidence\.length/);
  assert.match(page, /linked: evidence\.filter/);
  assert.match(page, /unlinked: evidence\.filter/);
  assert.match(page, /questions: new Set\(links\.map/);
});

test("upload supports the optional canonical link and genuine unlinked evidence", () => {
  assert.match(page, /Upload without linking/);
  assert.match(api, /hasLinkIdentity/);
  assert.match(api, /if \(identity\)/);
  assert.match(api, /identity \? "provided" : "not_provided"/);
});

test("selectors, details and destructive actions are backed by canonical contracts", () => {
  assert.match(page, /getCanonicalAssessmentCatalog/);
  assert.match(page, /Link to another question/);
  assert.match(page, /This deletes the file and all of its linked questions/);
  assert.match(page, /window\.open\(data\.signedUrl/);
  assert.match(page, /\/assessment\/\$\{link\.themeId\}/);
});

test("Evidence details show only persisted document metadata", () => {
  for (const field of ["Document type", "Version", "Effective date", "Review date", "Document owner"]) assert.match(page, new RegExp(field));
  assert.match(page, /hasDocumentMetadata/);
  assert.match(page, /workspaceMembers\.find/);
  assert.doesNotMatch(page, /Nora Bennett|Maya Chen|Liam Hart/);
});

console.log(`Evidence Room V1 QA: ${passed} tests passed.`);
