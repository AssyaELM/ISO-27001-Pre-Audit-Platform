import assert from "node:assert/strict";
import {
  INFORMATION_ASSET_MANAGEMENT_POLICY_GENERATION_CONTRACT_VERSION,
  prepareInformationAssetManagementPolicyGenerationContext as prepare,
  validateInformationAssetManagementPolicyGenerationContext,
} from "../lib/ai-documents/information-asset-management-policy-generation-contract.ts";
import {
  INFORMATION_ASSET_MANAGEMENT_POLICY_ASSESSMENT_MAPPING,
  INFORMATION_ASSET_MANAGEMENT_POLICY_ASSESSMENT_MAPPING_VERSION,
} from "../lib/ai-documents/information-asset-management-policy-assessment-mapping.ts";
import { INFORMATION_ASSET_MANAGEMENT_POLICY_TEMPLATE_VERSION } from "../lib/ai-documents/information-asset-management-policy.ts";

const response = (theme, controlId, questionId, answer = "implemented") => ({ theme, controlId, questionId, answer });
const ids = (context) => context.currentFacts.map((fact) => fact.capability);

assert.deepEqual(validateInformationAssetManagementPolicyGenerationContext(), []);
assert.equal(INFORMATION_ASSET_MANAGEMENT_POLICY_TEMPLATE_VERSION, "1.0.0");
assert.equal(INFORMATION_ASSET_MANAGEMENT_POLICY_ASSESSMENT_MAPPING_VERSION, "1.0.0");
assert.equal(INFORMATION_ASSET_MANAGEMENT_POLICY_GENERATION_CONTRACT_VERSION, "1.0.0");
assert.equal(INFORMATION_ASSET_MANAGEMENT_POLICY_ASSESSMENT_MAPPING.length, 137);
assert.equal(INFORMATION_ASSET_MANAGEMENT_POLICY_ASSESSMENT_MAPPING.filter((entry) => entry.conditionKey).length, 41);

const visibleTechnical = prepare({ assessment: { context: { hasTechnicalSystemsRequiringComplianceReview: "yes" }, responses: [response("organizational", "a5-36", "o5_36_004_technical")] } });
assert.equal(ids(visibleTechnical).includes("o5_36_004_technical"), true);
const hiddenTechnical = prepare({ assessment: { context: { hasTechnicalSystemsRequiringComplianceReview: "not_sure" }, responses: [response("organizational", "a5-36", "o5_36_004_technical")] } });
assert.equal(ids(hiddenTechnical).includes("o5_36_004_technical"), false);

const hiddenByod = prepare({ assessment: { context: { usesAssetsOffPremises: "yes", allowsBYODForBusiness: "no" }, responses: [response("physical", "a7-9", "p7_9_004_byod")] } });
assert.equal(ids(hiddenByod).includes("p7_9_004_byod"), false);
const nonConditional = prepare({ assessment: { context: {}, responses: [response("physical", "a7-14", "p7_14_001", "partially_implemented")] } });
assert.equal(ids(nonConditional).includes("p7_14_001"), true);
assert.equal(nonConditional.currentFacts[0].implementationState, "partial");
assert.equal(nonConditional.policyIntent.currentStateIsNotPolicyStatement, true);

const known = prepare({
  workspace: { organizationName: "NormCore", facts: { asset_register_exists: false } },
  documentSetup: { asset_register_exists: true, asset_register: [{ serial_number: "not-allowed" }], password: "not-allowed", classification_scheme: "approved scheme" },
  assessment: { facts: { classification_defined: true }, responses: [] },
});
assert.equal(known.missingInputs.length, 0);
assert.equal(known.knownInputs.asset_register_exists, false);
assert.equal(known.conflicts.some((conflict) => conflict.key === "asset_register_exists" && conflict.resolutionStatus === "resolved_by_source_priority"), true);
assert.equal(known.knownInputs.asset_register, undefined);
assert.equal(known.knownInputs.password, undefined);
assert.deepEqual(known.classification, { classificationDefined: true, classificationApplied: "unknown", classificationSchemeKnown: true, criticalityEvaluated: "unknown" });
assert.equal(Object.keys(known.sectionReadiness).length, 18);
assert.equal(Object.values(known.sectionReadiness).includes("blocked"), false);
assert.equal(known.sectionReadiness.policy_review_and_approval, "partial");

const unresolvedConflict = prepare({
  workspace: { organizationName: "NormCore" },
  evidenceMetadata: [
    { id: "evidence-a", documentType: "information_asset_management_policy", reviewDate: "2026-02-01" },
    { id: "evidence-b", documentType: "information_asset_management_policy", reviewDate: "2026-03-01" },
  ],
  assessment: { responses: [] },
});
assert.equal(unresolvedConflict.conflicts.some((conflict) => conflict.key === "review_date" && conflict.resolutionStatus === "unresolved"), true);
assert.equal(unresolvedConflict.sectionReadiness.policy_review_and_approval, "partial");

const payload = JSON.stringify(known.semanticGenerationContext);
for (const forbidden of ["serial_number", "not-allowed", "password", "MDM", "VPN", "AES", "TLS", "Public", "Confidential", "CISO", "\"asset_register\":"]) assert.equal(payload.includes(forbidden), false);
assert.equal(known.sourceTrace.every((trace) => !["password", "asset_register"].includes(trace.sourceField ?? "")), true);
assert.equal(known.sourceTrace.some((trace) => trace.sourceType === "workspace" && trace.sourceId === "organization_name"), true);
assert.equal(known.sourceTrace.some((trace) => trace.sourceType === "assessment" && trace.sourceId === "classification_defined"), true);

const deterministicInput = { workspace: { organizationName: "NormCore" }, assessment: { context: { usesAssetsOffPremises: "yes", allowsBYODForBusiness: "yes" }, responses: [response("physical", "a7-9", "p7_9_004_byod")] } };
assert.deepEqual(prepare(deterministicInput), prepare(structuredClone(deterministicInput)));
assert.equal(419 - INFORMATION_ASSET_MANAGEMENT_POLICY_ASSESSMENT_MAPPING.length, 282);

console.log("INFORMATION ASSET MANAGEMENT POLICY GENERATION CONTRACT QA: PASS");
