import { AI_DOCUMENT_LABELS, type AiDocumentRegistryEntry } from "./registry.ts";
import type { DocumentSectionSpec, DocumentTemplateSpec, InputDefinition, TemplateSource } from "./information-security-policy.ts";

export const ACCESS_CONTROL_POLICY_DOCUMENT_TYPE = "access_control_policy" as const;
export const ACCESS_CONTROL_POLICY_TEMPLATE_VERSION = "1.0.0";

export type AccessControlPolicyPreparationSnapshot = {
  workspaceId: string;
  workspace?: { organizationName?: string; scope?: string; documentOwner?: string };
  registry?: readonly AiDocumentRegistryEntry[];
  documentSetup?: Record<string, unknown>;
};
export type AccessControlPolicyPreparation = {
  templateVersion: string;
  knownInputs: Record<string, unknown>;
  missingInputs: string[];
  sourceMap: Record<string, TemplateSource>;
  sectionReadiness: Record<string, "ready" | "partial" | "blocked">;
};

const required = (id: string, label: string, sources: TemplateSource[]): InputDefinition => ({ id, label, sources, required: true, neverInvent: true });
const optional = (id: string, label: string, sources: TemplateSource[]): InputDefinition => ({ id, label, sources, required: false, neverInvent: true });
const section = (id: string, order: number, label: string, generationMode: DocumentSectionSpec["generationMode"], sources: TemplateSource[], requiredInputs: string[] = [], optionalInputs: string[] = [], allowOmission = false, structure?: DocumentSectionSpec["structure"]): DocumentSectionSpec => ({ id, order, label, generationMode, sources, requiredInputs, optionalInputs, allowOmission, structure });

export const ACCESS_CONTROL_PRINCIPLES = [
  { id: "least_privilege", label: "Least privilege", text: "Access is limited to the minimum needed for an authorized purpose." },
  { id: "need_to_know", label: "Need to know", text: "Information access is limited to a legitimate and approved need." },
  { id: "segregation_of_duties", label: "Segregation of duties", text: "Conflicting responsibilities are separated or protected by proportionate controls." },
  { id: "explicit_authorization_default_deny", label: "Explicit authorization and default deny", text: "Access requires explicit authorization; access not granted is not assumed." },
] as const;

export const ACCESS_CONTROL_POLICY_SPEC: DocumentTemplateSpec<typeof ACCESS_CONTROL_POLICY_DOCUMENT_TYPE> = {
  documentType: ACCESS_CONTROL_POLICY_DOCUMENT_TYPE,
  label: AI_DOCUMENT_LABELS.access_control_policy,
  version: ACCESS_CONTROL_POLICY_TEMPLATE_VERSION,
  sourcePriority: ["workspace", "assessment", "evidence", "ai_documents_registry", "document_setup", "derived", "static_template"],
  requiredInputs: [
    required("organization_name", "Organization name", ["workspace"]),
    required("document_classification", "Document classification", ["evidence", "ai_documents_registry", "document_setup"]),
    required("approver", "Approver / top management", ["document_setup"]),
    required("policy_owner", "Policy owner", ["workspace", "ai_documents_registry", "evidence", "document_setup"]),
    required("review_plan", "Review date or frequency", ["evidence", "ai_documents_registry", "document_setup"]),
  ],
  optionalInputs: [
    optional("scope", "Access-control scope", ["workspace", "document_setup"]), optional("document_id", "Document ID", ["ai_documents_registry", "document_setup"]), optional("version", "Version", ["ai_documents_registry", "document_setup"]), optional("effective_date", "Effective date", ["evidence", "ai_documents_registry", "document_setup"]), optional("prepared_by", "Prepared by", ["document_setup"]), optional("reviewed_by", "Reviewed by", ["document_setup"]), optional("approved_by", "Approved by", ["document_setup"]), optional("approval_date", "Approval date", ["document_setup"]), optional("revision_history", "Revision history", ["ai_documents_registry", "document_setup"]), optional("access_control_model", "Access control model", ["document_setup"]), optional("access_approval_roles", "Access approval roles", ["document_setup"]), optional("access_administration_roles", "Access administration roles", ["document_setup"]), optional("privileged_access_governance", "Privileged access governance", ["document_setup"]), optional("remote_access_applicability", "Remote access applicability", ["workspace", "document_setup"]), optional("third_party_access_applicability", "Third-party access applicability", ["workspace", "document_setup"]), optional("authentication_requirements", "Authentication requirements", ["document_setup"]), optional("exception_approval_authority", "Exception approval authority", ["document_setup"]),
  ],
  forbiddenInferences: ["user names", "roles or titles", "IAM team", "specific systems", "cloud provider", "identity provider", "ticketing system", "password length", "password complexity", "password expiration", "session timeout", "invalid login threshold", "log retention", "PAM/JIT", "source-code repository", "exception approver"],
  validationRules: ["exact document type", "exact 16-section order", "unique section ids and orders", "defined inputs only", "valid source and generation mode", "no forbidden default values", "conditional section uses allowOmission"],
  sections: [
    section("document_control", 1, "Document Control", "deterministic", ["workspace", "evidence", "ai_documents_registry", "document_setup"], ["organization_name", "document_classification", "policy_owner", "review_plan"], [], false, { requiredBlocks: ["table"], minTableRows: 4 }),
    section("purpose", 2, "Purpose", "ai_later", ["workspace", "document_setup"], ["organization_name"], [], false, { requiredBlocks: ["paragraph"] }),
    section("scope", 3, "Scope", "ai_later", ["workspace", "document_setup"], [], ["scope"], true, { requiredBlocks: ["paragraph"] }),
    section("policy_statement", 4, "Access Control Policy Statement", "ai_later", ["static_template"], [], [], false, { requiredBlocks: ["paragraph"] }),
    section("access_control_principles", 5, "Access Control Principles", "static", ["static_template"], [], ["access_control_model"], true),
    section("roles_and_responsibilities", 6, "Roles and Responsibilities", "ai_later", ["workspace", "document_setup"], [], ["access_approval_roles", "access_administration_roles"], true, { requiredBlocks: ["table"], minTableRows: 2 }),
    section("identity_and_account_management", 7, "Identity and Account Management", "ai_later", ["document_setup"], [], [], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("access_request_authorization_provisioning", 8, "Access Request, Authorization and Provisioning", "ai_later", ["document_setup"], [], ["access_approval_roles", "access_administration_roles"], true, { requiredBlocks: ["paragraph", "numbered_list"], minBlocks: 2 }),
    section("authentication", 9, "Authentication Information and Secure Authentication", "ai_later", ["document_setup"], [], ["authentication_requirements"], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("access_rights_lifecycle", 10, "Access Rights Review, Modification and Revocation", "ai_later", ["document_setup"], [], [], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("privileged_access", 11, "Privileged Access", "ai_later", ["document_setup"], [], ["privileged_access_governance"], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("access_restrictions", 12, "Information and System Access Restrictions", "ai_later", ["document_setup"], [], [], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("remote_external_third_party_access", 13, "Remote, External and Third-Party Access", "ai_later", ["workspace", "document_setup"], [], ["remote_access_applicability", "third_party_access_applicability"], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("logging_monitoring_review", 14, "Access Logging, Monitoring and Review", "ai_later", ["document_setup"], [], [], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("exceptions_compliance", 15, "Exceptions, Compliance and Non-Compliance", "ai_later", ["document_setup"], [], ["exception_approval_authority"], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("policy_review_and_approval", 16, "Policy Review and Approval", "deterministic", ["evidence", "ai_documents_registry", "document_setup"], ["review_plan", "approver"], [], false, { requiredBlocks: ["table"] }),
  ],
};

const present = (value: unknown) => typeof value === "string" ? value.trim().length > 0 : Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null;
const record = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};

export function validateAccessControlPolicySpec(spec: DocumentTemplateSpec<typeof ACCESS_CONTROL_POLICY_DOCUMENT_TYPE> = ACCESS_CONTROL_POLICY_SPEC): string[] {
  const errors: string[] = []; const inputIds = new Set([...spec.requiredInputs, ...spec.optionalInputs].map((input) => input.id));
  if (spec.documentType !== ACCESS_CONTROL_POLICY_DOCUMENT_TYPE || !spec.version) errors.push("invalid template identity");
  if (spec.sections.length !== 16 || spec.sections.some((item, index) => item.order !== index + 1)) errors.push("invalid section order");
  if (new Set(spec.sections.map((item) => item.id)).size !== 16 || new Set(spec.sections.map((item) => item.order)).size !== 16) errors.push("duplicate section");
  for (const item of spec.sections) { if (!item.label || !["static", "deterministic", "ai_later"].includes(item.generationMode)) errors.push(`invalid section:${item.id}`); if (item.sources.some((source) => !spec.sourcePriority.includes(source))) errors.push(`invalid source:${item.id}`); if (item.requiredInputs.some((id) => !inputIds.has(id))) errors.push(`undefined input:${item.id}`); if (item.allowOmission && !item.optionalInputs.length && item.id === "remote_external_third_party_access") errors.push("invalid conditional section"); }
  if (spec.requiredInputs.some((input) => !input.neverInvent)) errors.push("forbidden default input");
  return errors;
}

export function prepareAccessControlPolicyContext(snapshot: AccessControlPolicyPreparationSnapshot): AccessControlPolicyPreparation {
  const setup = record(snapshot.documentSetup); const existing = (snapshot.registry ?? []).find((entry) => entry.documentType === ACCESS_CONTROL_POLICY_DOCUMENT_TYPE)?.activeDocument;
  const knownInputs: Record<string, unknown> = { organization_name: snapshot.workspace?.organizationName, scope: snapshot.workspace?.scope, policy_owner: snapshot.workspace?.documentOwner ?? existing?.documentOwnerId, review_plan: existing?.reviewDate, document_id: existing?.id, version: existing?.version, effective_date: existing?.effectiveDate, ...setup, access_control_principles: ACCESS_CONTROL_PRINCIPLES };
  const all = [...ACCESS_CONTROL_POLICY_SPEC.requiredInputs, ...ACCESS_CONTROL_POLICY_SPEC.optionalInputs]; const sourceMap: Record<string, TemplateSource> = {};
  for (const input of all) sourceMap[input.id] = present(knownInputs[input.id]) ? (present(setup[input.id]) ? "document_setup" : input.sources[0]) : input.sources.at(-1) ?? "document_setup";
  const missingInputs = ACCESS_CONTROL_POLICY_SPEC.requiredInputs.filter((input) => !present(knownInputs[input.id])).map((input) => input.id);
  const sectionReadiness: Record<string, "ready" | "partial" | "blocked"> = {};
  for (const item of ACCESS_CONTROL_POLICY_SPEC.sections) { const missing = item.requiredInputs.some((id) => !present(knownInputs[id])); sectionReadiness[item.id] = missing ? (item.allowOmission ? "partial" : "blocked") : "ready"; }
  return { templateVersion: ACCESS_CONTROL_POLICY_TEMPLATE_VERSION, knownInputs, missingInputs, sourceMap, sectionReadiness };
}
