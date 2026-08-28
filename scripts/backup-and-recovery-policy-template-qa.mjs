import assert from "node:assert/strict";
import {
  BACKUP_AND_RECOVERY_POLICY_DOCUMENT_TYPE,
  BACKUP_AND_RECOVERY_POLICY_SPEC,
  BACKUP_AND_RECOVERY_POLICY_TEMPLATE_VERSION,
  BACKUP_AND_RECOVERY_POLICY_WORKFLOW,
  BACKUP_AND_RECOVERY_POLICY_BUSINESS_RULES,
  BACKUP_AND_RECOVERY_POLICY_CONDITIONAL_INPUTS,
  BACKUP_AND_RECOVERY_POLICY_INPUT_CLASSIFICATION,
  BACKUP_AND_RECOVERY_PRINCIPLES,
  BACKUP_AND_RECOVERY_TERMS,
  prepareBackupAndRecoveryPolicyContext,
  validateBackupAndRecoveryPolicySpec,
} from "../lib/ai-documents/backup-and-recovery-policy.ts";

assert.equal(BACKUP_AND_RECOVERY_POLICY_DOCUMENT_TYPE, "backup_and_recovery_policy");
assert.equal(BACKUP_AND_RECOVERY_POLICY_TEMPLATE_VERSION, "1.0.0");
assert.equal(BACKUP_AND_RECOVERY_POLICY_SPEC.sections.length, 17);
assert.equal(new Set(BACKUP_AND_RECOVERY_POLICY_SPEC.sections.map((section) => section.id)).size, 17);
assert.deepEqual(BACKUP_AND_RECOVERY_POLICY_WORKFLOW, ["identify_scope_criticality", "define_backup_requirements", "schedule_create_backup", "store_protect_backup", "monitor_execution", "handle_failures", "initiate_recovery", "restore", "validate_integrity_usability", "record_evidence", "review_improve"]);
assert.deepEqual(validateBackupAndRecoveryPolicySpec(), []);
assert.deepEqual(Object.keys(BACKUP_AND_RECOVERY_TERMS), ["backup", "restore", "recovery", "recovery_point_objective", "recovery_time_objective", "retention", "backup_copy", "restore_test"]);
assert.equal(BACKUP_AND_RECOVERY_PRINCIPLES.length, 11);
assert.equal(BACKUP_AND_RECOVERY_POLICY_BUSINESS_RULES.documentControlFields.length, 13);
assert.equal(BACKUP_AND_RECOVERY_POLICY_BUSINESS_RULES.distinctions.includes("backup_execution_does_not_prove_recoverability"), true);
assert.equal(BACKUP_AND_RECOVERY_POLICY_SPEC.forbiddenInferences.includes("RTO value"), true);
assert.equal(BACKUP_AND_RECOVERY_POLICY_SPEC.forbiddenInferences.includes("3-2-1"), true);
assert.equal(BACKUP_AND_RECOVERY_POLICY_SPEC.requiredInputs.length, 1);
assert.equal(BACKUP_AND_RECOVERY_POLICY_SPEC.optionalInputs.some((input) => input.id === "rpo_value"), true);
assert.equal(BACKUP_AND_RECOVERY_POLICY_CONDITIONAL_INPUTS.length, 5);
const empty = prepareBackupAndRecoveryPolicyContext({ workspaceId: "workspace-1" });
assert.deepEqual(empty.missingInputs.map((input) => input.key), ["organization_name"]);
assert.equal(Object.keys(empty.sectionReadiness).length, 17);
assert.equal(empty.sectionReadiness.document_control, "blocked");
assert.equal(empty.sectionReadiness.backup_schedule_and_retention, "partial");
const known = prepareBackupAndRecoveryPolicyContext({ workspaceId: "workspace-1", workspace: { organizationName: "NormCore" }, assessmentFacts: { rpo_defined: true, rto_defined: true }, documentSetup: { backup_frequency: "defined by approved business requirements" } });
assert.equal(known.missingInputs.length, 0);
assert.equal(known.knownInputs.rpo_defined, true);
assert.equal(known.knownInputs.rpo_value, undefined);
assert.equal(known.knownInputs.rto_value, undefined);
assert.deepEqual(known.recoveryObjectives, { rpoDefined: true, rpoValue: "unknown", rtoDefined: true, rtoValue: "unknown" });
assert.equal(known.knownInputs.backup_frequency, "defined by approved business requirements");
assert.equal(known.knownInputs.retention_requirements, undefined);
assert.equal(known.sourceMap.backup_frequency, "document_setup");
assert.equal(BACKUP_AND_RECOVERY_POLICY_INPUT_CLASSIFICATION.backup_type.classification, "optional");
assert.equal(BACKUP_AND_RECOVERY_POLICY_INPUT_CLASSIFICATION.rpo_value.classification, "conditional");
for (const inference of ["CISO", "Backup Administrator", "backup software/vendor", "cloud provider", "full/incremental/differential", "AES values", "TLS values", "SIEM", "restore test frequency", "legal retention period", "sanction"]) assert.equal(BACKUP_AND_RECOVERY_POLICY_SPEC.forbiddenInferences.includes(inference), true);
console.log("BACKUP AND RECOVERY POLICY STRUCTURE: PASS");
