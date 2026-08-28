import assert from "node:assert/strict";
import {
  INFORMATION_ASSET_MANAGEMENT_POLICY_DOCUMENT_TYPE,
  INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC,
  INFORMATION_ASSET_MANAGEMENT_POLICY_TEMPLATE_VERSION,
  INFORMATION_ASSET_MANAGEMENT_POLICY_WORKFLOW,
  INFORMATION_ASSET_MANAGEMENT_POLICY_BUSINESS_RULES,
  INFORMATION_ASSET_MANAGEMENT_PRINCIPLES,
  INFORMATION_ASSET_MANAGEMENT_TERMS,
  INFORMATION_ASSET_MANAGEMENT_POLICY_CONDITIONAL_INPUTS,
  INFORMATION_ASSET_MANAGEMENT_POLICY_INPUT_CLASSIFICATION,
  prepareInformationAssetManagementPolicyContext,
  validateInformationAssetManagementPolicySpec,
} from "../lib/ai-documents/information-asset-management-policy.ts";

assert.equal(INFORMATION_ASSET_MANAGEMENT_POLICY_DOCUMENT_TYPE, "information_asset_management_policy");
assert.equal(INFORMATION_ASSET_MANAGEMENT_POLICY_TEMPLATE_VERSION, "1.0.0");
assert.equal(INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC.sections.length, 18);
assert.deepEqual(INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC.sections.map((section) => section.order), Array.from({ length: 18 }, (_, index) => index + 1));
assert.equal(new Set(INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC.sections.map((section) => section.id)).size, 18);
assert.deepEqual(INFORMATION_ASSET_MANAGEMENT_POLICY_WORKFLOW, ["identify", "register", "assign_owner", "classify_prioritize", "define_handling_use", "operate_protect", "transfer_reassign", "return", "decommission_dispose", "update_register", "retain_evidence", "review_improve"]);
assert.deepEqual(validateInformationAssetManagementPolicySpec(), []);
assert.equal(INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC.sections.some((section) => section.id.includes("mapping") || section.id.includes("generation_contract")), false);
assert.deepEqual(Object.keys(INFORMATION_ASSET_MANAGEMENT_TERMS), ["asset", "information_asset", "asset_inventory_register", "asset_owner", "custodian", "user", "classification", "criticality", "acceptable_use", "lifecycle", "return", "disposal_decommissioning"]);
assert.equal(INFORMATION_ASSET_MANAGEMENT_PRINCIPLES.length, 10);
assert.equal(INFORMATION_ASSET_MANAGEMENT_POLICY_BUSINESS_RULES.documentControlFields.length, 13);
assert.equal(INFORMATION_ASSET_MANAGEMENT_POLICY_BUSINESS_RULES.purpose.includes("maintain_auditable_trace"), true);
assert.equal(INFORMATION_ASSET_MANAGEMENT_POLICY_BUSINESS_RULES.possibleScopeCategories.includes("third_party_managed_assets"), true);
assert.equal(INFORMATION_ASSET_MANAGEMENT_POLICY_BUSINESS_RULES.inventoryCapabilities.includes("lifecycle_state"), true);
assert.equal(INFORMATION_ASSET_MANAGEMENT_POLICY_BUSINESS_RULES.prohibitedDefaults.includes("MDM"), true);
assert.equal(INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC.optionalInputs.some((input) => input.id === "revision_history"), true);
assert.equal(INFORMATION_ASSET_MANAGEMENT_POLICY_CONDITIONAL_INPUTS.length, 5);
assert.equal(INFORMATION_ASSET_MANAGEMENT_POLICY_INPUT_CLASSIFICATION.organization_name.classification, "required");
assert.equal(INFORMATION_ASSET_MANAGEMENT_POLICY_INPUT_CLASSIFICATION.removable_media_rules.classification, "conditional");
for (const inference of ["Public", "Critical", "CISO", "Information Governance Committee", "serial number", "asset tag", "MAC address", "IP address", "CMDB", "MDM", "remote wipe", "VPN", "AES", "TLS", "encryption algorithm", "wipe passes", "demagnetization", "DIN 66399", "disciplinary sanctions", "regulatory fine", "authority", "annual review", "quarterly review", "sanctions"]) assert.equal(INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC.forbiddenInferences.includes(inference), true);
const empty = prepareInformationAssetManagementPolicyContext({ workspaceId: "workspace-1" });
assert.deepEqual(empty.missingInputs.map((input) => input.key), ["organization_name"]);
assert.equal(Object.keys(empty.sectionReadiness).length, 18);
assert.equal(empty.sectionReadiness.document_control, "blocked");
assert.equal(empty.sectionReadiness.asset_inventory_and_registration, "partial");
const known = prepareInformationAssetManagementPolicyContext({ workspaceId: "workspace-1", workspace: { organizationName: "NormCore" }, assessmentFacts: { classification_defined: true, asset_register_exists: true }, documentSetup: { classification_scheme: "defined by approved organization rules", register_owner: "defined role" } });
assert.equal(known.missingInputs.length, 0);
assert.deepEqual(known.classification, { classificationDefined: true, classificationSchemeKnown: true });
assert.deepEqual(known.assetRegister, { registerExists: true, registerFieldsKnown: "unknown", registerOwnerKnown: true });
assert.equal(known.knownInputs.classification_scheme, "defined by approved organization rules");
assert.equal(known.sourceMap.classification_scheme, "document_setup");
assert.equal(known.sectionReadiness.asset_classification_and_criticality, "ready");
assert.equal(known.sectionReadiness.asset_inventory_and_registration, "ready");
const sourcePriority = prepareInformationAssetManagementPolicyContext({ workspaceId: "workspace-1", workspace: { organizationName: "Workspace name" }, assessmentFacts: { organization_name: "Assessment name" }, documentSetup: { organization_name: "Setup name", register_fields: "explicit fields" } });
assert.equal(sourcePriority.knownInputs.organization_name, "Workspace name");
assert.equal(sourcePriority.sourceMap.organization_name, "workspace");
assert.equal(sourcePriority.assetRegister.registerFieldsKnown, true);
assert.deepEqual(prepareInformationAssetManagementPolicyContext({ workspaceId: "workspace-1" }), empty);
console.log("INFORMATION ASSET MANAGEMENT POLICY STRUCTURE: PASS");
