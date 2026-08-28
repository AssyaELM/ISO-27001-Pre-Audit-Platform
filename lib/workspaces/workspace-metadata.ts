function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export type BrowserWorkspaceMetadata = Record<string, unknown>;

export type WorkspaceState = Record<string, unknown>;

export function buildWorkspaceState(userMetadata: unknown, email: string, profileName: string, organizationNameOverride = ""): WorkspaceState {
  const metadata = record(userMetadata);
  const onboarding = record(metadata.normcore_onboarding);
  const organization = record(onboarding.organization ?? metadata.normcore_onboarding_organization);
  const scope = record(onboarding.assessment_scope);
  const owner = record(onboarding.assessment_owner);
  const organizationName = organizationNameOverride || text(onboarding.organization_name) || text(metadata.organization_name) || text(metadata.organizationName) || text(organization.organization_name) || profileName || (email ? email.split("@")[0] : "Workspace owner");

  return {
    organizationName,
    companySize: text(onboarding.company_size) || text(organization.company_size),
    companySizeSelectedByUser: organization.company_size_selected_by_user === true,
    countryCode: text(onboarding.primary_country) || text(organization.primary_country),
    industryId: text(onboarding.industry) || text(organization.industry),
    otherIndustry: text(onboarding.other_industry) || text(organization.other_industry),
    softwareDevelopment: text(record(metadata.operating_environment).software_development) || text(onboarding.software_development),
    workModel: text(record(metadata.operating_environment).work_model) || text(onboarding.work_model),
    assessmentScope: text(scope.coverage),
    scopeName: text(scope.scope_name),
    scopeDescription: text(scope.description),
    ownerName: text(owner.full_name) || profileName,
    ownerEmail: text(owner.email) || email,
    ownerRole: text(owner.role),
    otherOwnerRole: text(owner.other_role),
    workspaceCreationId: text(onboarding.workspace_creation_id),
    workspaceCreatedAt: text(onboarding.workspace_created_at),
    currentScreen: Number.isFinite(Number(onboarding.current_screen)) ? Number(onboarding.current_screen) : 0,
    completed: onboarding.completed === true,
  };
}

export function buildBrowserWorkspaceMetadata(userMetadata: unknown, email: string, profileName: string, organizationNameOverride = ""): BrowserWorkspaceMetadata {
  const metadata = record(userMetadata);
  const workspaceState = buildWorkspaceState(metadata, email, profileName, organizationNameOverride);
  const onboarding = {
    organization_name: String(workspaceState.organizationName),
    organization: {
      organization_name: String(workspaceState.organizationName),
      company_size: String(workspaceState.companySize ?? ""),
      company_size_selected_by_user: workspaceState.companySizeSelectedByUser === true,
      primary_country: String(workspaceState.countryCode ?? ""),
      industry: String(workspaceState.industryId ?? ""),
      other_industry: String(workspaceState.otherIndustry ?? ""),
    },
    operating_environment: {
      software_development: String(workspaceState.softwareDevelopment ?? ""),
      work_model: String(workspaceState.workModel ?? ""),
    },
    assessment_scope: {
      coverage: String(workspaceState.assessmentScope ?? ""),
      scope_name: String(workspaceState.scopeName ?? ""),
      description: String(workspaceState.scopeDescription ?? ""),
    },
    assessment_owner: {
      full_name: String(workspaceState.ownerName ?? profileName),
      email: String(workspaceState.ownerEmail ?? email),
      role: String(workspaceState.ownerRole ?? ""),
      other_role: String(workspaceState.otherOwnerRole ?? ""),
    },
    assessment_context: {},
    workspace_creation_id: String(workspaceState.workspaceCreationId ?? ""),
    workspace_created_at: String(workspaceState.workspaceCreatedAt ?? ""),
    current_screen: Number(workspaceState.currentScreen ?? 0),
    completed: workspaceState.completed === true,
  };

  return {
    ...metadata,
    email,
    full_name: text(metadata.full_name) || profileName,
    name: text(metadata.name) || profileName,
    organization_name: String(workspaceState.organizationName),
    organizationName: String(workspaceState.organizationName),
    normcore_onboarding: onboarding,
    normcore_onboarding_organization: {
      ...record(metadata.normcore_onboarding_organization),
      organization_name: String(workspaceState.organizationName),
    },
    normcore_onboarding_scope: {
      ...record(metadata.normcore_onboarding_scope),
    },
  };
}
