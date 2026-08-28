import assert from "node:assert/strict";
import { prepareInformationSecurityPolicyGenerationContext } from "../lib/ai-documents/information-security-policy-generation-contract.ts";
import { validateInformationSecurityPolicyGrounding } from "../lib/ai/documents/information-security-policy-live-validation.ts";

const context = prepareInformationSecurityPolicyGenerationContext({
  workspace: { organizationName: "Example Organization", ismsScope: "Organization-wide information processing activities" },
});

const unsupportedDocument = {
  documentType: "information_security_policy",
  language: "en",
  title: "Information Security Policy",
  sections: [{
    sectionId: "governance",
    title: "Governance",
    status: "generated",
    content: "The Information Security Manager shall publish this policy on the organization intranet.",
  }],
};

const errors = validateInformationSecurityPolicyGrounding(unsupportedDocument, context);
assert.ok(errors.some((error) => error.includes("Information Security Manager")));
assert.ok(errors.some((error) => error.includes("intranet")));

console.log("INFORMATION SECURITY POLICY GROUNDING QA: PASS");
