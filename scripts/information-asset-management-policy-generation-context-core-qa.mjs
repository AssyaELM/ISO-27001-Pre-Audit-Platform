import assert from "node:assert/strict";
import { prepareInformationAssetManagementPolicyGenerationContext as prepare } from "../lib/ai-documents/information-asset-management-policy-generation-contract.ts";

const factIds = (context, responses) => prepare({ assessment: { context, responses } }).currentFacts.map((fact) => fact.capability);
const physicalAnswer = (controlId, questionId) => ({ theme: "physical", controlId, questionId, answer: "implemented" });

const baseline = prepare({ assessment: { context: { hasTechnicalSystemsRequiringComplianceReview: "yes" }, responses: [
  { theme: "organizational", controlId: "a5-36", questionId: "o5_36_004_technical", answer: "implemented" },
  { theme: "organizational", controlId: "a5-36", questionId: "o5_36_001", answer: "partially_implemented" },
  { theme: "x", controlId: "x", questionId: "unmapped", answer: "implemented" },
] } });
assert.equal(baseline.currentFacts.length, 2);
assert.equal(baseline.currentFacts[0].implementationState, "partial");
assert.equal(baseline.currentFacts.some((fact) => fact.capability === "o5_36_004_technical"), true);
assert.equal(baseline.currentFacts.some((fact) => fact.capability === "unmapped"), false);
assert.equal(baseline.policyIntent.currentStateIsNotPolicyStatement, true);
assert.equal(baseline.prohibitedInferences.includes("AES"), true);

const byod = physicalAnswer("a7-9", "p7_9_004_byod");
assert.deepEqual(factIds({ usesAssetsOffPremises: "yes", allowsBYODForBusiness: "yes" }, [byod]), ["p7_9_004_byod"]);
assert.deepEqual(factIds({ usesAssetsOffPremises: "yes", allowsBYODForBusiness: "no" }, [byod]), []);
assert.deepEqual(factIds({ usesAssetsOffPremises: "yes", allowsBYODForBusiness: "not_sure" }, [byod]), []);

const removableMedia = physicalAnswer("a7-10", "p7_10_004_removable_media");
assert.deepEqual(factIds({ usesRemovableOrPortableStorageMedia: "yes" }, [removableMedia]), ["p7_10_004_removable_media"]);
assert.deepEqual(factIds({ usesRemovableOrPortableStorageMedia: "no" }, [removableMedia]), []);
assert.deepEqual(factIds({ usesRemovableOrPortableStorageMedia: "not_sure" }, [removableMedia]), []);

assert.deepEqual(factIds({ usesAssetsOffPremises: "yes", allowsBYODForBusiness: "yes" }, [removableMedia]), []);
assert.deepEqual(factIds({ usesRemovableOrPortableStorageMedia: "yes" }, [byod]), []);
assert.deepEqual(factIds({}, [physicalAnswer("a7-14", "p7_14_001")]), ["p7_14_001"]);

console.log("INFORMATION ASSET MANAGEMENT POLICY CORE QA: PASS");
