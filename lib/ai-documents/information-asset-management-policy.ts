import { AI_DOCUMENT_LABELS, type AiDocumentRegistryEntry } from "./registry.ts";
import type { DocumentSectionSpec, DocumentTemplateSpec, GenerationMode, InputDefinition, TemplateSource } from "./information-security-policy.ts";

export const INFORMATION_ASSET_MANAGEMENT_POLICY_DOCUMENT_TYPE = "information_asset_management_policy" as const;
export const INFORMATION_ASSET_MANAGEMENT_POLICY_TEMPLATE_VERSION = "1.0.0";

const section = (id: string, order: number, label: string, generationMode: GenerationMode, sources: TemplateSource[], requiredInputs: string[] = [], optionalInputs: string[] = [], allowOmission = false, structure?: DocumentSectionSpec["structure"]): DocumentSectionSpec => ({ id, order, label, generationMode, sources, requiredInputs, optionalInputs, allowOmission, structure });
const required = (id: string, label: string, sources: TemplateSource[]): InputDefinition => ({ id, label, sources, required: true, neverInvent: true });
const optional = (id: string, label: string, sources: TemplateSource[]): InputDefinition => ({ id, label, sources, required: false, neverInvent: true });

export const INFORMATION_ASSET_MANAGEMENT_POLICY_WORKFLOW = [
  "identify", "register", "assign_owner", "classify_prioritize", "define_handling_use", "operate_protect", "transfer_reassign", "return", "decommission_dispose", "update_register", "retain_evidence", "review_improve",
] as const;

export const INFORMATION_ASSET_MANAGEMENT_TERMS = {
  asset: "Anything of value to the organization that requires appropriate management and protection.",
  information_asset: "Information, data, knowledge, or a related resource that supports organizational activities.",
  asset_inventory_register: "The controlled record used to identify, describe, assign, and track relevant assets.",
  asset_owner: "The role accountable for an asset's appropriate use, protection, and lifecycle decisions.",
  custodian: "A role entrusted with the day-to-day care or operation of an asset on behalf of its owner.",
  user: "A person or authorized party permitted to use an asset for an approved purpose.",
  classification: "A risk-informed designation that helps determine how an asset should be handled and protected.",
  criticality: "The relative importance of an asset to organizational activities and resilience.",
  acceptable_use: "The authorized and responsible use of an asset within defined organizational expectations.",
  lifecycle: "The stages through which an asset is acquired, registered, used, transferred, returned, and retired.",
  return: "The controlled handback or reassignment of an asset when use, custody, or responsibility changes.",
  disposal_decommissioning: "The controlled retirement, reuse, destruction, or removal of an asset from active service.",
} as const;

export const INFORMATION_ASSET_MANAGEMENT_PRINCIPLES = [
  "assets_must_be_known", "accountability", "lifecycle_management", "proportional_protection", "classification_and_criticality", "traceability", "least_privilege", "controlled_use", "secure_return_and_disposal", "continual_improvement",
] as const;

export const INFORMATION_ASSET_MANAGEMENT_POLICY_BUSINESS_RULES = {
  documentControlFields: ["organization_name", "document_id", "document_owner", "version", "classification", "status", "effective_date", "review_date", "prepared_by", "reviewed_by", "approved_by", "approval_date", "revision_history"],
  purpose: ["identify_assets", "register_assets", "assign_accountability", "classify_and_prioritize", "define_use_and_protection", "manage_lifecycle", "secure_return_reuse_or_disposal", "maintain_auditable_trace"],
  possibleScopeCategories: ["information_data", "systems", "applications", "software", "hardware", "mobile_endpoints", "removable_media", "cloud_virtual_assets", "services", "third_party_managed_assets", "documentation", "intellectual_property"],
  genericRoles: ["Management", "Policy Owner", "Asset Owner", "Asset Custodian", "Inventory/Register Maintainer", "Users/personnel", "IT/technical personnel", "HR if applicable", "Procurement if applicable", "third parties if applicable"],
  inventoryCapabilities: ["asset_identification", "unique_identifier_when_applicable", "asset_type_or_category", "owner", "custodian_when_applicable", "business_purpose", "location_or_logical_environment_when_applicable", "classification", "criticality", "status", "dependencies", "lifecycle_state"],
  lifecycleCapabilities: ["acquisition_procurement", "registration", "assignment", "operation_use", "maintenance", "transfer_reassignment", "return", "decommissioning", "disposal"],
  recordsCapabilities: ["asset_register", "change_update_records", "transfer_return_records", "disposal_records", "exception_register", "acknowledgements_when_applicable", "review_records", "monitoring_of_register_accuracy_completeness"],
  prohibitedDefaults: ["CISO", "CIO", "CTO", "Information Governance Committee", "IT Manager", "named persons", "Public/Internal/Confidential/Restricted", "Critical/High/Medium/Low", "QR codes", "RFID", "barcode", "MDM", "remote wipe", "VPN", "specific disposal method", "annual review"],
  reviewTriggers: ["planned_review", "significant_change", "versioning", "approval", "revision_history"],
} as const;

export const INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC: DocumentTemplateSpec<typeof INFORMATION_ASSET_MANAGEMENT_POLICY_DOCUMENT_TYPE> = {
  documentType: INFORMATION_ASSET_MANAGEMENT_POLICY_DOCUMENT_TYPE,
  label: AI_DOCUMENT_LABELS.information_asset_management_policy,
  version: INFORMATION_ASSET_MANAGEMENT_POLICY_TEMPLATE_VERSION,
  sourcePriority: ["workspace", "assessment", "evidence", "ai_documents_registry", "document_setup", "derived", "static_template"],
  requiredInputs: [required("organization_name", "Organization name", ["workspace"])],
  optionalInputs: [optional("document_id", "Document ID", ["ai_documents_registry", "document_setup"]), optional("document_owner", "Document owner", ["workspace", "ai_documents_registry", "document_setup"]), optional("version", "Version", ["ai_documents_registry", "document_setup"]), optional("classification", "Document classification", ["evidence", "ai_documents_registry", "document_setup"]), optional("status", "Document status", ["ai_documents_registry", "document_setup"]), optional("effective_date", "Effective date", ["evidence", "ai_documents_registry", "document_setup"]), optional("review_date", "Review date", ["evidence", "ai_documents_registry", "document_setup"]), optional("prepared_by", "Prepared by", ["document_setup"]), optional("reviewed_by", "Reviewed by", ["document_setup"]), optional("approved_by", "Approved by", ["document_setup"]), optional("approval_date", "Approval date", ["document_setup"]), optional("revision_history", "Revision history", ["ai_documents_registry", "document_setup"]), optional("asset_policy_owner", "Asset policy owner", ["workspace", "document_setup"]), optional("asset_categories", "Asset categories", ["assessment", "document_setup"]), optional("asset_register_exists", "Asset register exists", ["assessment", "document_setup"]), optional("register_owner", "Register owner", ["workspace", "document_setup"]), optional("asset_owner_model", "Asset ownership model", ["assessment", "document_setup"]), optional("custodian_model", "Custodian model", ["assessment", "document_setup"]), optional("classification_defined", "Classification defined", ["assessment", "document_setup"]), optional("classification_scheme", "Classification scheme", ["assessment", "document_setup"]), optional("criticality_scheme", "Criticality scheme", ["assessment", "document_setup"]), optional("acceptable_use_rules", "Acceptable use rules", ["assessment", "document_setup"]), optional("lifecycle_rules", "Lifecycle rules", ["assessment", "document_setup"]), optional("return_process", "Return process", ["assessment", "document_setup"]), optional("off_premises_rules", "Off-premises rules", ["assessment", "document_setup"]), optional("removable_media_rules", "Removable media rules", ["assessment", "document_setup"]), optional("disposal_requirements", "Disposal requirements", ["assessment", "document_setup"]), optional("reuse_requirements", "Reuse requirements", ["assessment", "document_setup"]), optional("exception_approver", "Exception approver", ["document_setup"]), optional("monitoring_review_approach", "Monitoring and review approach", ["assessment", "document_setup"])],
  forbiddenInferences: ["Asset Manager", "Information Governance Committee", "Public", "Critical", "CISO", "named person", "serial number", "asset tag", "MAC address", "IP address", "MAC/IP", "CMDB", "Jira", "ServiceNow", "spreadsheet", "MDM", "personal use prohibited", "USB prohibited", "personal cloud prohibited", "software installation prohibited", "mandatory screen lock", "remote wipe", "VPN", "containerization", "device encryption", "AES", "TLS", "AES values", "TLS values", "encryption algorithm", "cryptographic product", "BYOD agreement", "wipe passes", "overwrite algorithm", "demagnetization", "DIN 66399", "shredder class", "incineration", "destruction vendor", "certificate retention period", "regulatory fine", "disciplinary sanctions", "authority", "annual review", "quarterly review", "sanctions"],
  validationRules: ["exact document type", "exact 18-section order", "unique section ids and orders", "canonical asset-management workflow"],
  sections: [
    section("document_control", 1, "Document Control", "deterministic", ["workspace", "evidence", "ai_documents_registry", "document_setup"], ["organization_name"], ["document_id", "document_owner", "classification", "review_date"], false, { requiredBlocks: ["table"], minTableRows: 4 }),
    section("purpose", 2, "Purpose", "ai_later", ["workspace", "document_setup"], ["organization_name"], [], false, { requiredBlocks: ["paragraph"] }),
    section("scope", 3, "Scope", "ai_later", ["workspace", "assessment", "document_setup"], ["organization_name"], [], true, { requiredBlocks: ["paragraph"] }),
    section("terms_and_definitions", 4, "Terms and Definitions", "static", ["static_template"]),
    section("asset_management_principles", 5, "Asset Management Principles", "static", ["static_template"]),
    section("roles_and_responsibilities", 6, "Roles and Responsibilities", "ai_later", ["workspace", "assessment", "document_setup"], [], [], true, { requiredBlocks: ["table"], minTableRows: 2 }),
    section("asset_categories_and_scope", 7, "Asset Categories and Scope", "ai_later", ["assessment", "document_setup"], [], [], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("asset_inventory_and_registration", 8, "Asset Inventory and Registration", "ai_later", ["assessment", "evidence", "document_setup"], [], [], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("asset_ownership_and_accountability", 9, "Asset Ownership and Accountability", "ai_later", ["assessment", "document_setup"], [], [], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("asset_classification_and_criticality", 10, "Asset Classification and Criticality", "ai_later", ["assessment", "document_setup"], [], [], true, { requiredBlocks: ["paragraph", "table"], minBlocks: 2 }),
    section("asset_labelling_and_handling", 11, "Asset Labelling and Handling", "ai_later", ["assessment", "document_setup"], [], [], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("acceptable_use_of_assets", 12, "Acceptable Use of Assets", "ai_later", ["assessment", "document_setup"], [], [], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("asset_lifecycle_management", 13, "Asset Lifecycle Management", "ai_later", ["assessment", "document_setup"], [], [], true, { requiredBlocks: ["paragraph", "numbered_list"], minBlocks: 2 }),
    section("asset_transfer_and_return", 14, "Asset Transfer and Return", "ai_later", ["assessment", "document_setup"], [], [], true, { requiredBlocks: ["paragraph", "numbered_list"], minBlocks: 2 }),
    section("asset_protection_and_off_premises_use", 15, "Asset Protection and Off-Premises Use", "ai_later", ["assessment", "document_setup"], [], [], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("secure_reuse_disposal_and_decommissioning", 16, "Secure Reuse, Disposal and Decommissioning", "ai_later", ["assessment", "evidence", "document_setup"], [], [], true, { requiredBlocks: ["paragraph", "numbered_list"], minBlocks: 2 }),
    section("records_exceptions_monitoring_and_compliance", 17, "Records, Exceptions, Monitoring and Compliance", "ai_later", ["assessment", "evidence", "document_setup"], [], [], true, { requiredBlocks: ["paragraph", "bullet_list"], minBlocks: 2 }),
    section("policy_review_and_approval", 18, "Policy Review and Approval", "deterministic", ["evidence", "ai_documents_registry", "document_setup"], [], ["review_date"], true, { requiredBlocks: ["table"] }),
  ],
};

export function validateInformationAssetManagementPolicySpec(spec: DocumentTemplateSpec<typeof INFORMATION_ASSET_MANAGEMENT_POLICY_DOCUMENT_TYPE> = INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC): string[] {
  const errors: string[] = [];
  if (spec.documentType !== INFORMATION_ASSET_MANAGEMENT_POLICY_DOCUMENT_TYPE || spec.version !== INFORMATION_ASSET_MANAGEMENT_POLICY_TEMPLATE_VERSION) errors.push("invalid template identity");
  if (spec.sections.length !== 18 || spec.sections.some((section, index) => section.order !== index + 1)) errors.push("invalid section order");
  if (new Set(spec.sections.map((section) => section.id)).size !== 18) errors.push("duplicate section id");
  const inputs = new Set([...spec.requiredInputs, ...spec.optionalInputs].map((input) => input.id));
  for (const item of spec.sections) {
    if (item.sources.some((source) => !spec.sourcePriority.includes(source))) errors.push(`invalid source:${item.id}`);
    if (item.requiredInputs.some((id) => !inputs.has(id))) errors.push(`undefined input:${item.id}`);
  }
  return errors;
}

export const INFORMATION_ASSET_MANAGEMENT_POLICY_CONDITIONAL_INPUTS = [
  { id: "custodian_model", condition: "delegated_custody_applicable" },
  { id: "removable_media_rules", condition: "removable_media_applicable" },
  { id: "off_premises_rules", condition: "off_premises_or_byod_applicable" },
  { id: "reuse_requirements", condition: "asset_reuse_applicable" },
  { id: "exception_approver", condition: "asset_exception_requires_approval" },
] as const;

export const INFORMATION_ASSET_MANAGEMENT_POLICY_INPUT_CLASSIFICATION = {
  organization_name: { classification: "required", omissible: false },
  document_id: { classification: "optional", omissible: true }, document_owner: { classification: "optional", omissible: true }, version: { classification: "optional", omissible: true }, classification: { classification: "optional", omissible: true }, status: { classification: "optional", omissible: true }, effective_date: { classification: "optional", omissible: true }, review_date: { classification: "optional", omissible: true }, prepared_by: { classification: "optional", omissible: true }, reviewed_by: { classification: "optional", omissible: true }, approved_by: { classification: "optional", omissible: true }, approval_date: { classification: "optional", omissible: true }, revision_history: { classification: "optional", omissible: true },
  asset_policy_owner: { classification: "optional", omissible: true }, asset_categories: { classification: "optional", omissible: true }, asset_register_exists: { classification: "optional", omissible: true }, register_owner: { classification: "optional", omissible: true }, asset_owner_model: { classification: "optional", omissible: true }, classification_defined: { classification: "optional", omissible: true }, classification_scheme: { classification: "optional", omissible: true }, criticality_scheme: { classification: "optional", omissible: true }, acceptable_use_rules: { classification: "optional", omissible: true }, lifecycle_rules: { classification: "optional", omissible: true }, return_process: { classification: "optional", omissible: true }, disposal_requirements: { classification: "optional", omissible: true }, monitoring_review_approach: { classification: "optional", omissible: true },
  custodian_model: { classification: "conditional", omissible: true }, off_premises_rules: { classification: "conditional", omissible: true }, removable_media_rules: { classification: "conditional", omissible: true }, reuse_requirements: { classification: "conditional", omissible: true }, exception_approver: { classification: "conditional", omissible: true },
} as const;

export type InformationAssetManagementPolicyPreparationSnapshot = {
  workspaceId: string;
  workspace?: { organizationName?: string; documentOwner?: string };
  assessmentFacts?: Record<string, unknown>;
  evidenceMetadata?: { classification?: string; effectiveDate?: string; reviewDate?: string; documentOwner?: string };
  registry?: readonly AiDocumentRegistryEntry[];
  documentSetup?: Record<string, unknown>;
};
export type InformationAssetManagementPolicyMissingInput = { key: string; sectionId: string; required: boolean; expectedType: "text"; reason: string; allowedValues?: readonly string[] };
export type InformationAssetManagementPolicyPreparation = {
  templateVersion: string;
  knownInputs: Record<string, unknown>;
  missingInputs: readonly InformationAssetManagementPolicyMissingInput[];
  sourceMap: Record<string, TemplateSource>;
  sectionReadiness: Record<string, "ready" | "partial" | "blocked">;
  classification: { classificationDefined: boolean | "unknown"; classificationSchemeKnown: boolean | "unknown" };
  assetRegister: { registerExists: boolean | "unknown"; registerFieldsKnown: boolean | "unknown"; registerOwnerKnown: boolean | "unknown" };
};
const record = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
const present = (value: unknown): boolean => typeof value === "string" ? value.trim().length > 0 : Array.isArray(value) ? value.length > 0 : value !== undefined && value !== null;
const booleanOrUnknown = (value: unknown): boolean | "unknown" => value === true || value === "yes" ? true : value === false || value === "no" ? false : "unknown";
const sectionInputs: Record<string, string[]> = { scope: ["asset_categories"], roles_and_responsibilities: ["asset_policy_owner", "asset_owner_model", "custodian_model"], asset_categories_and_scope: ["asset_categories"], asset_inventory_and_registration: ["asset_register_exists", "register_owner"], asset_ownership_and_accountability: ["asset_owner_model", "custodian_model"], asset_classification_and_criticality: ["classification_defined", "classification_scheme", "criticality_scheme"], asset_labelling_and_handling: ["classification_scheme", "removable_media_rules"], acceptable_use_of_assets: ["acceptable_use_rules"], asset_lifecycle_management: ["lifecycle_rules"], asset_transfer_and_return: ["return_process"], asset_protection_and_off_premises_use: ["off_premises_rules", "removable_media_rules"], secure_reuse_disposal_and_decommissioning: ["reuse_requirements", "disposal_requirements"], records_exceptions_monitoring_and_compliance: ["monitoring_review_approach", "exception_approver"], policy_review_and_approval: ["review_date", "approved_by"] };

export function prepareInformationAssetManagementPolicyContext(snapshot: InformationAssetManagementPolicyPreparationSnapshot): InformationAssetManagementPolicyPreparation {
  const assessment = record(snapshot.assessmentFacts); const setup = record(snapshot.documentSetup);
  const registryEntry = snapshot.registry?.find((entry) => entry.documentType === INFORMATION_ASSET_MANAGEMENT_POLICY_DOCUMENT_TYPE); const registryDocument = registryEntry?.activeDocument;
  const workspaceValues = { organization_name: snapshot.workspace?.organizationName, document_owner: snapshot.workspace?.documentOwner };
  const evidenceValues = { document_owner: snapshot.evidenceMetadata?.documentOwner, classification: snapshot.evidenceMetadata?.classification, effective_date: snapshot.evidenceMetadata?.effectiveDate, review_date: snapshot.evidenceMetadata?.reviewDate };
  const registryValues = { document_id: registryDocument?.id, document_owner: registryDocument?.documentOwnerId, version: registryDocument?.version, status: registryEntry?.status, review_date: registryDocument?.reviewDate };
  const knownInputs: Record<string, unknown> = {};
  for (const values of [setup, registryValues, evidenceValues, assessment, workspaceValues]) for (const [key, value] of Object.entries(values)) if (present(value)) knownInputs[key] = value;
  const definitions = [...INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC.requiredInputs, ...INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC.optionalInputs];
  const sourceMap: Record<string, TemplateSource> = {};
  const prioritizedSources: readonly [TemplateSource, Record<string, unknown>][] = [["workspace", workspaceValues], ["assessment", assessment], ["evidence", evidenceValues], ["ai_documents_registry", registryValues], ["document_setup", setup]];
  for (const definition of definitions) {
    const selected = prioritizedSources.find(([, values]) => present(values[definition.id]));
    sourceMap[definition.id] = selected?.[0] ?? definition.sources[0];
  }
  const missingInputs = INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC.requiredInputs.filter((input) => !present(knownInputs[input.id])).map((input) => ({ key: input.id, sectionId: "document_control", required: true, expectedType: "text" as const, reason: "No explicit permitted source is available." }));
  const sectionReadiness = {} as Record<string, "ready" | "partial" | "blocked">;
  for (const section of INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC.sections) {
    if (section.id === "document_control") sectionReadiness[section.id] = present(knownInputs.organization_name) ? "ready" : "blocked";
    else if (["purpose", "terms_and_definitions", "asset_management_principles"].includes(section.id)) sectionReadiness[section.id] = "ready";
    else sectionReadiness[section.id] = (sectionInputs[section.id] ?? []).some((key) => present(knownInputs[key])) ? "ready" : "partial";
  }
  return { templateVersion: INFORMATION_ASSET_MANAGEMENT_POLICY_TEMPLATE_VERSION, knownInputs, missingInputs, sourceMap, sectionReadiness, classification: { classificationDefined: booleanOrUnknown(knownInputs.classification_defined), classificationSchemeKnown: present(knownInputs.classification_scheme) ? true : "unknown" }, assetRegister: { registerExists: booleanOrUnknown(knownInputs.asset_register_exists), registerFieldsKnown: present(knownInputs.register_fields) ? true : "unknown", registerOwnerKnown: present(knownInputs.register_owner) ? true : "unknown" } };
}
