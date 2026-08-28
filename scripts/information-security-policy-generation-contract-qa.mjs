import assert from "node:assert/strict";
import { INFORMATION_SECURITY_POLICY_ASSESSMENT_MAPPING, prepareInformationSecurityPolicyGenerationContext, validateInformationSecurityPolicyAssessmentMapping } from "../lib/ai-documents/information-security-policy-generation-contract.ts";

assert.deepEqual(validateInformationSecurityPolicyAssessmentMapping(), []);
assert.equal(INFORMATION_SECURITY_POLICY_ASSESSMENT_MAPPING.length, 57);
const base = { workspace: { organizationName: "Test Org", ismsScope: "Business information systems" }, documentSetup: { document_classification: "Internal", policy_owner: "owner-1", review_plan: "2027-01-01", security_objectives: ["real objective"], security_roles: ["Security owner"], legal_requirements: ["Contractual requirement"], approver: "approver-1" }, assessment: { organizationalContext: { requiresFormalPrivacyOfficerOrDPO: "no", cannotFullySegregateDuties: "no" }, peopleContext: { hasRolesRequiringSpecializedTraining: "yes", hasRelevantExternalParties: "no" }, responses: [{ theme: "organizational", controlId: "a5-1", questionId: "p5_1_001", answer: "implemented" }, { theme: "organizational", controlId: "a5-34", questionId: "o5_34_004_dpo", answer: "implemented" }, { theme: "people", controlId: "a6-3", questionId: "p6_3_001", answer: "partially_implemented" }, { theme: "people", controlId: "a6-3", questionId: "p6_3_004_role_based", answer: "not_implemented" }, { theme: "physical", controlId: "a7-1", questionId: "p7_1_001", answer: "implemented" }, { theme: "technological", controlId: "a8-1", questionId: "p8_1_001", answer: "implemented" }] } };
const context = prepareInformationSecurityPolicyGenerationContext(base);
assert.equal(context.currentFacts.length, 3); // hidden DPO plus physical/technological are excluded
assert.equal(context.awarenessAndCompetence.programmeState, "partial");
assert.equal(context.currentFacts.find((fact) => fact.source.sourceId === "p6_3_004_role_based")?.implementationState, "absent");
assert.equal(context.sectionReadiness.information_security_principles, "ready");
assert.equal(context.sectionReadiness.approval, "ready");
assert.ok(!JSON.stringify(context).includes("p7_1_001"));
assert.ok(!JSON.stringify(context).includes("p8_1_001"));
const conflict = prepareInformationSecurityPolicyGenerationContext({ ...base, documentSetup: { ...base.documentSetup, review_plan: "2028-01-01" }, registry: [{ documentType: "information_security_policy", status: "already_available", label: "Information Security Policy", reviewState: "current", evidenceCount: 1, activeDocument: { source: "evidence", id: "e1", version: "1", effectiveDate: null, reviewDate: "2027-01-01", documentOwnerId: "owner-1", filename: "policy.pdf", createdAt: "2026-01-01", updatedAt: "2026-01-01", finalizedAt: null }, evidenceDocuments: [] }] });
assert.ok(conflict.conflicts.some((item) => item.key === "review_plan"));
assert.ok(!JSON.stringify(context).match(/password|token|service.role/i));
assert.equal(Object.keys(context.sectionReadiness).length, 16);
console.log("INFORMATION SECURITY POLICY GENERATION CONTRACT QA: PASS");
