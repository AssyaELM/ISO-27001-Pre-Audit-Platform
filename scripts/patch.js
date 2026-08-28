const fs = require('fs');
let content = fs.readFileSync('lib/ai-documents/information-security-policy.ts', 'utf-8');

// 1. requiredInputs
content = content.replace(
  `required("document_classification", "Document classification", ["evidence", "ai_documents_registry", "document_setup"]), required("approver", "Approver / top management", ["workspace", "document_setup"]), required("policy_owner", "Policy owner", ["workspace", "ai_documents_registry", "document_setup"]), required("review_plan", "Review date or frequency", ["evidence", "ai_documents_registry", "document_setup"]), required("security_objectives", "Information security objectives", ["assessment", "document_setup"]), required("security_roles", "Security roles in use", ["assessment", "document_setup"]), required("legal_requirements", "Legal, regulatory and contractual requirements", ["assessment", "document_setup"]),`,
  `required("approver", "Approver / top management", ["workspace", "document_setup"]), required("policy_owner", "Policy owner", ["workspace", "ai_documents_registry", "document_setup"]),`
);

// 2. optionalInputs
content = content.replace(
  `optionalInputs: [optional("scope_exclusions"`,
  `optionalInputs: [optional("document_classification", "Document classification", ["evidence", "ai_documents_registry", "document_setup"]), optional("review_plan", "Review date or frequency", ["evidence", "ai_documents_registry", "document_setup"]), optional("security_objectives", "Information security objectives", ["assessment", "document_setup"]), optional("security_roles", "Security roles in use", ["assessment", "document_setup"]), optional("legal_requirements", "Legal, regulatory and contractual requirements", ["assessment", "document_setup"]), optional("scope_exclusions"`
);

// 3. sections
content = content.replace(
  `["organization_name", "document_classification", "approver", "policy_owner", "review_plan"], [], false, { requiredBlocks: ["table"], minTableRows: 4 }),`,
  `["organization_name", "approver", "policy_owner"], ["document_classification", "review_plan"], false, { requiredBlocks: ["table"], minTableRows: 4 }),`
);
content = content.replace(
  `section("information_security_objectives", 6, "Information Security Objectives", "ai_later", ["assessment", "document_setup"], ["security_objectives"], [], false, { requiredBlocks: ["paragraph", "bullet_list"], minListItems: 3 }),`,
  `section("information_security_objectives", 6, "Information Security Objectives", "ai_later", ["assessment", "document_setup"], [], ["security_objectives"], false, { requiredBlocks: ["paragraph", "bullet_list"], minListItems: 3 }),`
);
content = content.replace(
  `section("roles_and_responsibilities", 8, "Roles and Responsibilities", "ai_later", ["assessment", "document_setup"], ["security_roles"], [], false, { requiredBlocks: ["table"], minTableRows: 2 }),`,
  `section("roles_and_responsibilities", 8, "Roles and Responsibilities", "ai_later", ["assessment", "document_setup"], [], ["security_roles"], false, { requiredBlocks: ["table"], minTableRows: 2 }),`
);
content = content.replace(
  `section("legal_regulatory_and_contractual_requirements", 11, "Legal, Regulatory and Contractual Requirements", "ai_later", ["assessment", "document_setup"], ["legal_requirements"], [], false, { requiredBlocks: ["paragraph", "bullet_list"], minListItems: 2 }),`,
  `section("legal_regulatory_and_contractual_requirements", 11, "Legal, Regulatory and Contractual Requirements", "ai_later", ["assessment", "document_setup"], [], ["legal_requirements"], false, { requiredBlocks: ["paragraph", "bullet_list"], minListItems: 2 }),`
);
content = content.replace(
  `section("review_and_continual_improvement", 15, "Review and Continual Improvement", "deterministic", ["evidence", "ai_documents_registry", "document_setup"], ["review_plan"]),`,
  `section("review_and_continual_improvement", 15, "Review and Continual Improvement", "deterministic", ["evidence", "ai_documents_registry", "document_setup"], [], ["review_plan"]),`
);

fs.writeFileSync('lib/ai-documents/information-security-policy.ts', content);
