import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateWorkEmail } from "../lib/onboarding/email.ts";
import { ensureWorkspaceIdentity } from "../lib/onboarding/workspace.ts";

const [component, content, css] = await Promise.all([
  readFile(new URL("../components/onboarding/organization-onboarding.tsx", import.meta.url), "utf8"),
  readFile(new URL("../content/onboarding.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
]);

const validEmails = [
  [" User.Name@Example.COM ", "user.name@example.com"],
  ["owner@normcore.co", "owner@normcore.co"],
];
for (const [input, normalized] of validEmails) {
  assert.deepEqual(validateWorkEmail(input), { valid: true, normalized });
}

for (const input of ["", "owner", "owner@", "@example.com", "owner@example", "owner@example.c", "owner@example.123", "owner @example.com"]) {
  assert.equal(validateWorkEmail(input).valid, false, `Expected invalid email: ${input}`);
}

const firstIdentity = ensureWorkspaceIdentity({}, () => "workspace-1", () => "2026-08-03T00:00:00.000Z");
const restoredIdentity = ensureWorkspaceIdentity(firstIdentity, () => "workspace-2", () => "2026-08-04T00:00:00.000Z");
assert.deepEqual(restoredIdentity, firstIdentity, "Workspace identity must remain stable after Back/Continue");

assert.match(component, /companySizeMockup = "\/onboarding-assets\/company-size-unselected\.png"/);
assert.equal((component.match(/className="company-size-art"/g) ?? []).length, 1);
assert.match(component, /<span className="company-size-label">\{size\}<\/span>/);
assert.match(component, /data-company-size=\{size\}/);
assert.match(css, /aspect-ratio:\s*276 \/ 145 !important/);
assert.match(css, /\.company-size-label\s*\{[^}]*font-weight:\s*400;[^}]*text-align:\s*center/s);
assert.doesNotMatch(css, /\.onboarding-screen-2 \.company-size-art\s*\{[^}]*height:\s*clamp/s);

assert.match(css, /\.company-size-option,[\s\S]*?font-weight:\s*400/);
assert.match(css, /\.industry-options button,[\s\S]*?font-weight:\s*400/);
assert.match(css, /\.flow-work-label\s*\{[^}]*place-items:\s*center;[^}]*text-align:\s*center/s);
assert.match(css, /\.flow-choice-label\s*\{[^}]*text-align:\s*left/s);
assert.doesNotMatch(component, /<strong>\{option\[language\]/);
assert.doesNotMatch(component, /<strong>\{option\[language\]\.title/);
assert.doesNotMatch(component, /remainingCopy\.owner\.title/);
assert.doesNotMatch(component, /remainingCopy\.profile\.loading/);
assert.doesNotMatch(component, /if \(!ready\) return <main/);
assert.match(content, /Yes: Internal development team/);
assert.doesNotMatch(component, /option\[language\]\.description/);

assert.match(component, /handleBack/);
assert.match(component, /handleContinue/);
assert.match(component, /currentScreen:\s*nextScreen,\s*completed:\s*false/);
assert.match(component, /currentScreen === 8\) return workEmailValidation\.valid/);
assert.match(component, /workspace_creation_id:\s*nextState\.workspaceCreationId/);
assert.match(component, /fetch\("\/api\/onboarding\/validate-email"/);

console.log("PASS onboarding images use the approved crop resource and preserve its ratio");
console.log("PASS onboarding choice typography is normal and option descriptions are removed");
console.log("PASS only Work model centers its answer labels");
console.log("PASS software development labels use colons");
console.log("PASS work email normalization and validation");
console.log("PASS Back/Continue persistence hooks remain present");
console.log("PASS workspace creation identity is idempotent");
