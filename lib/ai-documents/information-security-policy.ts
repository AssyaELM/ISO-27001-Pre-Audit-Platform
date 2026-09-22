import { AI_DOCUMENT_LABELS, type AiDocumentType, type AiDocumentRegistryEntry } from "./registry.ts";

export const INFORMATION_SECURITY_POLICY_TEMPLATE_VERSION = "1.0.0";
export const INFORMATION_SECURITY_POLICY_DOCUMENT_TYPE = "information_security_policy" as const;

export type TemplateSource = "workspace" | "assessment" | "evidence" | "ai_documents_registry" | "document_setup" | "derived" | "static_template";
export type GenerationMode = "static" | "deterministic" | "ai_later";
export type InputDefinition = { id: string; label: string; sources: TemplateSource[]; required: boolean; neverInvent: boolean };
export type StructuralRequirements = { requiredBlocks?: string[]; minTableRows?: number; minTableColumns?: number; minListItems?: number; minBlocks?: number };
export type DocumentSectionSpec = { id: string; order: number; label: string; generationMode: GenerationMode; sources: TemplateSource[]; requiredInputs: string[]; optionalInputs: string[]; allowOmission: boolean; structure?: StructuralRequirements };
export type DocumentTemplateSpec<T extends AiDocumentType = typeof INFORMATION_SECURITY_POLICY_DOCUMENT_TYPE> = { documentType: T; label: string; version: string; sections: readonly DocumentSectionSpec[]; requiredInputs: readonly InputDefinition[]; optionalInputs: readonly InputDefinition[]; forbiddenInferences: readonly string[]; sourcePriority: readonly TemplateSource[]; validationRules: readonly string[] };
export type PolicyPreparationSnapshot = { workspaceId: string; workspace?: { organizationName?: string; documentOwner?: string }; registry?: readonly AiDocumentRegistryEntry[]; documentSetup?: Record<string, unknown>; assessmentFacts?: Record<string, unknown> };
export type PolicyPreparation = { templateVersion: string; knownInputs: Record<string, unknown>; missingInputs: string[]; sourceMap: Record<string, TemplateSource>; sectionReadiness: Record<string, "ready" | "partial" | "missing"> };

const required = (id: string, label: string, sources: TemplateSource[]) => ({ id, label, sources, required: true, neverInvent: true });
const optional = (id: string, label: string, sources: TemplateSource[]) => ({ id, label, sources, required: false, neverInvent: true });
const section = (id: string, order: number, label: string, generationMode: GenerationMode, sources: TemplateSource[], requiredInputs: string[] = [], optionalInputs: string[] = [], allowOmission = false, structure?: StructuralRequirements): DocumentSectionSpec => ({ id, order, label, generationMode, sources, requiredInputs, optionalInputs, allowOmission, structure });

export const INFORMATION_SECURITY_POLICY_SPEC: DocumentTemplateSpec = {
  documentType: INFORMATION_SECURITY_POLICY_DOCUMENT_TYPE,
  label: AI_DOCUMENT_LABELS.information_security_policy,
  version: INFORMATION_SECURITY_POLICY_TEMPLATE_VERSION,
  sourcePriority: ["workspace", "assessment", "evidence", "ai_documents_registry", "document_setup", "derived", "static_template"],
  requiredInputs: [
    required("organization_name", "Organization name", ["workspace"]), required("approver", "Approver / top management", ["workspace", "document_setup"]), required("policy_owner", "Policy owner", ["workspace", "ai_documents_registry", "document_setup"]),
  ],
  optionalInputs: [optional("document_classification", "Document classification", ["evidence", "ai_documents_registry", "document_setup"]), optional("review_plan", "Review date or frequency", ["evidence", "ai_documents_registry", "document_setup"]), optional("security_objectives", "Information security objectives", ["assessment", "document_setup"]), optional("security_roles", "Security roles in use", ["assessment", "document_setup"]), optional("legal_requirements", "Legal, regulatory and contractual requirements", ["assessment", "document_setup"]), optional("scope_exclusions", "Scope exclusions", ["workspace", "assessment", "document_setup"]), optional("communication_channel", "Communication channel", ["workspace", "document_setup"]), optional("document_id", "Document ID", ["ai_documents_registry", "document_setup"]), optional("version", "Version", ["ai_documents_registry", "document_setup"]), optional("effective_date", "Effective date", ["evidence", "ai_documents_registry", "document_setup"]), optional("prepared_by", "Prepared by", ["document_setup"]), optional("reviewed_by", "Reviewed by", ["document_setup"]), optional("approved_by", "Approved by", ["document_setup"]), optional("approval_date", "Approval date", ["document_setup"]), optional("revision_history", "Revision history", ["ai_documents_registry", "document_setup"])],
  forbiddenInferences: ["names of people", "ISMS committee", "CISO", "nonexistent roles", "cloud suppliers", "dates", "frequencies", "review frequency", "applicable laws", "numeric objectives", "KPI", "RTO/RPO", "tools", "held certifications", "scope exclusions", "signatories"],
  validationRules: ["exact document type", "exact 16-section order", "no duplicate section", "defined inputs only", "no forbidden default values"],
  sections: [
    section("document_control", 1, "Document Control", "deterministic", ["workspace", "evidence", "ai_documents_registry", "document_setup"], ["organization_name", "approver", "policy_owner"], ["document_classification", "review_plan"], false, { requiredBlocks: ["table"], minTableRows: 4 }),
    section("purpose", 2, "Purpose", "ai_later", ["workspace", "document_setup"], ["organization_name"], [], false, { requiredBlocks: ["paragraph"] }),
    section("scope", 3, "Scope", "ai_later", ["workspace", "assessment", "document_setup"], ["organization_name"], ["scope_exclusions"], true, { requiredBlocks: ["paragraph"], minBlocks: 1 }),
    section("information_security_principles", 4, "Information Security Principles", "static", ["static_template"]),
    section("management_commitment", 5, "Management Commitment", "ai_later", ["document_setup"], ["approver"], [], false, { requiredBlocks: ["paragraph", "bullet_list"], minListItems: 3 }),
    section("information_security_objectives", 6, "Information Security Objectives", "ai_later", ["assessment", "document_setup"], [], ["security_objectives"], false, { requiredBlocks: ["paragraph", "bullet_list"], minListItems: 3 }),
    section("information_security_risk_management", 7, "Information Security Risk Management", "ai_later", ["assessment", "document_setup"], [], [], false, { requiredBlocks: ["paragraph"], minBlocks: 2 }),
    section("roles_and_responsibilities", 8, "Roles and Responsibilities", "ai_later", ["assessment", "document_setup"], [], ["security_roles"], false, { requiredBlocks: ["table"], minTableRows: 2 }),
    section("information_security_policy_framework", 9, "Information Security Policy Framework", "deterministic", ["ai_documents_registry"]),
    section("security_awareness_and_competence", 10, "Security Awareness and Competence", "ai_later", ["assessment", "document_setup"], [], [], false, { requiredBlocks: ["paragraph"], minBlocks: 2 }),
    section("legal_regulatory_and_contractual_requirements", 11, "Legal, Regulatory and Contractual Requirements", "ai_later", ["assessment", "document_setup"], [], ["legal_requirements"], false, { requiredBlocks: ["paragraph", "bullet_list"], minListItems: 2 }),
    section("monitoring_and_performance_evaluation", 12, "Monitoring and Performance Evaluation", "ai_later", ["assessment", "document_setup"], [], [], false, { requiredBlocks: ["paragraph"], minBlocks: 2 }),
    section("policy_compliance_and_exceptions", 13, "Policy Compliance and Exceptions", "ai_later", ["document_setup"], [], [], false, { requiredBlocks: ["paragraph", "bullet_list"], minListItems: 2 }),
    section("communication_and_availability", 14, "Communication and Availability", "ai_later", ["workspace", "document_setup"], [], ["communication_channel"], true, { requiredBlocks: ["paragraph"] }),
    section("review_and_continual_improvement", 15, "Review and Continual Improvement", "deterministic", ["evidence", "ai_documents_registry", "document_setup"], [], ["review_plan"]),
    section("approval", 16, "Approval", "deterministic", ["document_setup"], ["approver"], [], false, { requiredBlocks: ["table"] }),
  ],
};

export const INFORMATION_SECURITY_PRINCIPLES = [
  { id: "confidentiality", label: "Confidentiality", text: "Information is accessible only to authorized people and systems." },
  { id: "integrity", label: "Integrity", text: "Information remains accurate, complete and protected from unauthorized change." },
  { id: "availability", label: "Availability", text: "Information and services are available when legitimately needed." },
] as const;

function record(value: unknown): Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function present(value: unknown): boolean { return typeof value === "string" ? value.trim().length > 0 : Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null; }

export function validateInformationSecurityPolicySpec(spec: DocumentTemplateSpec = INFORMATION_SECURITY_POLICY_SPEC): string[] {
  const errors: string[] = []; const expected = Array.from({ length: 16 }, (_, index) => index + 1);
  if (spec.documentType !== INFORMATION_SECURITY_POLICY_DOCUMENT_TYPE || !spec.version) errors.push("invalid template identity");
  if (spec.sections.length !== 16 || spec.sections.map((item) => item.order).some((item, index) => item !== expected[index])) errors.push("invalid section order");
  if (new Set(spec.sections.map((item) => item.id)).size !== spec.sections.length) errors.push("duplicate section");
  const inputs = new Set([...spec.requiredInputs, ...spec.optionalInputs].map((item) => item.id));
  for (const item of spec.sections) { if (item.sources.some((source) => !spec.sourcePriority.includes(source))) errors.push(`invalid source:${item.id}`); if (item.requiredInputs.some((id) => !inputs.has(id))) errors.push(`undefined input:${item.id}`); }
  if (spec.requiredInputs.some((item) => !item.neverInvent)) errors.push("forbidden default input");
  return errors;
}

export function prepareInformationSecurityPolicyContext(snapshot: PolicyPreparationSnapshot): PolicyPreparation {
  const setup = record(snapshot.documentSetup); const assessment = record(snapshot.assessmentFacts); const known: Record<string, unknown> = { organization_name: snapshot.workspace?.organizationName, policy_owner: snapshot.workspace?.documentOwner, ...assessment, ...setup };
  const framework = (snapshot.registry ?? []).filter((entry) => ["access_control_policy","asset_management_policy","incident_management_procedure","backup_restore_procedure"].includes(entry.documentType) && entry.status !== "missing").map((entry) => entry.documentType as AiDocumentType);
  known.information_security_principles = INFORMATION_SECURITY_PRINCIPLES; known.policy_framework_documents = framework;
  const definitions = [...INFORMATION_SECURITY_POLICY_SPEC.requiredInputs, ...INFORMATION_SECURITY_POLICY_SPEC.optionalInputs]; const sourceMap: Record<string, TemplateSource> = {};
  for (const definition of definitions) sourceMap[definition.id] = present(known[definition.id]) ? (definition.sources.find((source) => source === "document_setup" && present(setup[definition.id])) ?? definition.sources[0]) : definition.sources.at(-1) ?? "document_setup";
  const missingInputs = INFORMATION_SECURITY_POLICY_SPEC.requiredInputs.filter((item) => !present(known[item.id])).map((item) => item.id);
  const sectionReadiness: Record<string, "ready" | "partial" | "missing"> = {};
  for (const item of INFORMATION_SECURITY_POLICY_SPEC.sections) { const missing = item.requiredInputs.filter((id) => !present(known[id])); sectionReadiness[item.label] = missing.length ? (item.allowOmission ? "partial" : "missing") : "ready"; }
  return { templateVersion: INFORMATION_SECURITY_POLICY_TEMPLATE_VERSION, knownInputs: known, missingInputs, sourceMap, sectionReadiness };
}
