import type { AiDocumentType } from "../../ai-documents/registry.ts";
import type { DocumentTemplateSpec } from "../../ai-documents/information-security-policy.ts";
import { INFORMATION_SECURITY_POLICY_SPEC } from "../../ai-documents/information-security-policy.ts";
import { ACCESS_CONTROL_POLICY_SPEC } from "../../ai-documents/access-control-policy.ts";
import { INCIDENT_MANAGEMENT_PROCEDURE_SPEC } from "../../ai-documents/incident-management-procedure.ts";
import { BACKUP_AND_RECOVERY_POLICY_SPEC } from "../../ai-documents/backup-and-recovery-policy.ts";
import { INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC } from "../../ai-documents/information-asset-management-policy.ts";

export const AI_DOCUMENT_TEMPLATE_SPECS = {
  information_security_policy: INFORMATION_SECURITY_POLICY_SPEC,
  access_control_policy: ACCESS_CONTROL_POLICY_SPEC,
  incident_management_procedure: INCIDENT_MANAGEMENT_PROCEDURE_SPEC,
  backup_and_recovery_policy: BACKUP_AND_RECOVERY_POLICY_SPEC,
  information_asset_management_policy: INFORMATION_ASSET_MANAGEMENT_POLICY_SPEC,
} as const satisfies Record<string, DocumentTemplateSpec<AiDocumentType>>;

export type SupportedAiDocumentType = keyof typeof AI_DOCUMENT_TEMPLATE_SPECS;

export function getAiDocumentTemplateSpec(documentType: SupportedAiDocumentType): DocumentTemplateSpec<AiDocumentType> {
  return AI_DOCUMENT_TEMPLATE_SPECS[documentType];
}
