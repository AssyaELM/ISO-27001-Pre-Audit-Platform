import type { User } from "@supabase/supabase-js";
import { prepareInformationSecurityPolicyGenerationContext } from "@/lib/ai-documents/information-security-policy-generation-contract";
import { prepareAccessControlPolicyGenerationContext } from "@/lib/ai-documents/access-control-policy-generation-contract";
import { prepareIncidentManagementProcedureGenerationContext } from "@/lib/ai-documents/incident-management-procedure-generation-contract";
import { prepareBackupAndRecoveryPolicyGenerationContext } from "@/lib/ai-documents/backup-and-recovery-policy-generation-contract";
import { prepareInformationAssetManagementPolicyGenerationContext } from "@/lib/ai-documents/information-asset-management-policy-generation-contract";
import type { SupportedAiDocumentType } from "@/lib/ai/documents/catalog";

type Row = { theme_id: string; control_id: string; question_id: string; answer: string; justification: string | null };
const object = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
const string = (value: unknown) => typeof value === "string" ? value.trim() : "";

export function workspaceGenerationInput(user: User, rows: Row[], registry: unknown[], setup: Record<string, unknown> = {}) {
  const metadata = object(user.user_metadata); const onboarding = object(metadata.normcore_onboarding); const assessment = object(onboarding.assessment_context);
  const onboardingOrganization = object(onboarding.organization);
  const metadataOrganization = object(metadata.normcore_onboarding_organization);
  const organizationName = string(onboarding.organization_name) || string(onboardingOrganization.organization_name) || string(metadataOrganization.organization_name) || string(metadata.organization_name);
  const scope = Object.keys(object(onboarding.assessment_scope)).length ? object(onboarding.assessment_scope) : object(metadata.normcore_onboarding_scope);
  const organizationContext = {
    country: string(onboardingOrganization.primary_country) || string(metadataOrganization.primary_country),
    sector: string(onboardingOrganization.industry) || string(metadataOrganization.industry),
    company_size: string(onboardingOrganization.company_size) || string(metadataOrganization.company_size),
  };
  const responses = rows.map((row) => ({ theme: row.theme_id === "technology" ? "technological" : row.theme_id, controlId: row.control_id, questionId: row.question_id, answer: row.answer, justification: row.justification }));
  const shared = object(assessment.shared_context); const organizational = object(assessment.organizational); const people = { ...object(assessment.people), ...object(assessment.remote_working), ...object(assessment.event_reporting) };
  const technological = { persisted: object(assessment.technological), onboarding, shared, crossTheme: { ...organizational, ...people, ...object(assessment.physical) } };
  return { organizationName, scope: string(scope.scope_name) || string(scope.name) || string(scope.coverage), organizationContext, setup, responses, registry, organizational, people, physical: object(assessment.physical), technological };
}

export function prepareGenerationContext(type: SupportedAiDocumentType, input: ReturnType<typeof workspaceGenerationInput>) {
  const assessment = { responses: input.responses as never[], organizationalContext: input.organizational as never, peopleContext: input.people as never, physicalContext: input.physical as never, technologicalContext: input.technological };
  if (type === "information_security_policy") return prepareInformationSecurityPolicyGenerationContext({ workspace: { organizationName: input.organizationName, ismsScope: input.scope, organizationContext: input.organizationContext }, documentSetup: input.setup, registry: input.registry as never, assessment: assessment as never });
  if (type === "access_control_policy") return prepareAccessControlPolicyGenerationContext({ workspace: { organizationName: input.organizationName, scope: input.scope }, documentSetup: input.setup, assessment: { responses: input.responses as never[], context: input.organizational as never } });
  if (type === "incident_management_procedure") return prepareIncidentManagementProcedureGenerationContext({ workspace: { organizationName: input.organizationName }, documentSetup: input.setup, registry: input.registry as never, assessment: assessment as never });
  if (type === "backup_and_recovery_policy") return prepareBackupAndRecoveryPolicyGenerationContext({ workspace: { organizationName: input.organizationName }, documentSetup: input.setup, registry: input.registry as never, assessment: assessment as never });
  return prepareInformationAssetManagementPolicyGenerationContext({ workspace: { organizationName: input.organizationName }, documentSetup: input.setup, registry: input.registry as never, assessment: { responses: input.responses as never[], context: input.organizational as never, technologicalContext: input.technological } });
}

export function normalizeContext(context: ReturnType<typeof prepareGenerationContext>) {
  const candidate = context as unknown as Record<string, unknown>;
  const missingInputs = (candidate.missingInputs ?? []) as Array<string | Record<string, unknown>>;
  return {
    missingInputs: missingInputs.map((item) => typeof item === "string" ? { key: item, label: item.replaceAll("_", " "), sectionId: "document_control", required: true, expectedType: "text", reason: "No explicit permitted source is available." } : { key: String(item.key ?? ""), label: String(item.label ?? item.key ?? "Required information"), sectionId: String(item.sectionId ?? "document_control"), required: item.required !== false, expectedType: String(item.expectedType ?? "text"), reason: String(item.reason ?? "Required before generation.") }),
    sectionReadiness: candidate.sectionReadiness as Record<string, "ready" | "partial" | "blocked">,
    knownInputCount: Object.keys(object(candidate.knownInputs)).length,
    sourceCount: Array.isArray(candidate.sourceTrace) ? candidate.sourceTrace.length : 0,
  };
}
