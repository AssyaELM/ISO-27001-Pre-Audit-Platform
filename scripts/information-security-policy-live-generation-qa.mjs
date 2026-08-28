import assert from "node:assert/strict";
import { prepareInformationSecurityPolicyGenerationContext } from "../lib/ai-documents/information-security-policy-generation-contract.ts";
import { INFORMATION_SECURITY_POLICY_SPEC } from "../lib/ai-documents/information-security-policy.ts";
import { assembleInformationSecurityPolicyDraft, validateInformationSecurityPolicyLiveQuality } from "../lib/ai/documents/information-security-policy-live-validation.ts";
import { validateStructuredDocumentResponse } from "../lib/ai/documents/generation-schema.ts";

const context = prepareInformationSecurityPolicyGenerationContext({
  workspace: { organizationName: "Example Organization", ismsScope: "Organization-wide information processing activities" },
  documentSetup: { document_classification: "Organization-defined classification", approver: "authorized top management role", policy_owner: "designated policy owner role", review_plan: "approved review triggers", security_objectives: ["organization-defined objectives"], security_roles: ["designated security responsibilities"], legal_requirements: ["confirmed applicable requirements"] },
  assessment: { responses: [{ theme: "people", controlId: "a6-3", questionId: "p6_3_001", answer: "not_implemented" }] },
});
assert.equal(context.missingInputs.length, 0);
assert.equal(Object.values(context.sectionReadiness).includes("blocked"), false);
const response = {
  documentType: "information_security_policy", language: "en", title: "Information Security Policy",
  sections: INFORMATION_SECURITY_POLICY_SPEC.sections.map((section) => ({ sectionId: section.id, title: section.label, status: section.generationMode === "ai_later" ? "generated" : "static", content: section.generationMode === "ai_later" ? "The organization shall follow an approved policy process." : "Temporary backend content." })),
};
const assembled = assembleInformationSecurityPolicyDraft(response);
assert.doesNotThrow(() => validateStructuredDocumentResponse(INFORMATION_SECURITY_POLICY_SPEC, "en", "Information Security Policy", context.sectionReadiness, assembled));
assert.deepEqual(validateInformationSecurityPolicyLiveQuality(assembled, context), []);
const invented = structuredClone(assembled);
const aiSectionIndex = invented.sections.findIndex((section) => section.status === "generated");
assert.notEqual(aiSectionIndex, -1);
invented.sections[aiSectionIndex].content = "The organization currently has an established CISO and performs annual reviews.";
assert.ok(validateInformationSecurityPolicyLiveQuality(invented, context).includes("invented organizational detail"));
assert.ok(validateInformationSecurityPolicyLiveQuality(invented, context).includes("fact intent inconsistency"));
const placeholder = structuredClone(assembled); placeholder.sections[1].content = "TODO [Company Name]";
assert.ok(validateInformationSecurityPolicyLiveQuality(placeholder, context).includes("quality forbidden mention"));
console.log("INFORMATION SECURITY POLICY LIVE GENERATION QA: PASS");
