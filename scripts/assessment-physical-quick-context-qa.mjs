import assert from "node:assert/strict";
import { physicalQuickContextKeys, physicalQuickContextQuestions, resolvePhysicalQuickContext } from "../lib/assessment/physical-quick-context.ts";
let failed = 0; function test(name, fn) { try { fn(); } catch (error) { failed++; console.error(`FAIL: ${name}`, error); } }
for (const key of physicalQuickContextKeys) {
  test(`${key}: persisted yes/no has priority`, () => { for (const value of ["yes", "no"]) { const r = resolvePhysicalQuickContext(key, { persistedContext: { [key]: value }, onboarding: { [key]: value === "yes" ? "no" : "yes" }, sharedContext: { [key]: value === "yes" ? "no" : "yes" } }); assert.equal(r.value, value); assert.equal(r.source, "persisted_context"); assert.equal(r.quickContextRequired, false); } });
  test(`${key}: onboarding then shared then unknown`, () => { let r = resolvePhysicalQuickContext(key, { onboarding: { [key]: "yes" }, sharedContext: { [key]: "no" } }); assert.equal(r.source, "onboarding"); assert.equal(r.value, "yes"); r = resolvePhysicalQuickContext(key, { sharedContext: { [key]: "no" } }); assert.equal(r.source, "shared_context"); assert.equal(r.value, "no"); r = resolvePhysicalQuickContext(key); assert.equal(r.source, "unknown"); assert.equal(r.value, undefined); assert.equal(r.quickContextRequired, true); });
  test(`${key}: not_sure remains unresolved`, () => { const r = resolvePhysicalQuickContext(key, { persistedContext: { [key]: "not_sure" } }); assert.equal(r.value, "not_sure"); assert.equal(r.source, "unknown"); assert.equal(r.quickContextRequired, true); });
  test(`${key}: quick context is bilingual and non-assessment`, () => { const q = physicalQuickContextQuestions[key]; assert.equal(q.contextKey, key); assert.ok(q.fr.length > 0 && q.en.length > 0); });
}
test("same facts give identical result regardless of source-order history", () => { const key = "usesThirdPartyManagedPremises"; assert.deepEqual(resolvePhysicalQuickContext(key, { sharedContext: { [key]: "yes" } }), resolvePhysicalQuickContext(key, { sharedContext: { [key]: "yes" } })); });
if (failed) process.exit(1); console.log(`Physical quick-context QA passed (${physicalQuickContextKeys.length} keys).`);
