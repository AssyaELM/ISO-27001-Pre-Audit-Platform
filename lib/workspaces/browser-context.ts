const onboardingStorageKey = "normcore-onboarding-organization-v1";

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function localAuthEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    return text(window.localStorage.getItem("normcore-local-auth-email"));
  } catch {
    return "";
  }
}

function readLocalState(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    const email = localAuthEmail();
    const emailKey = email ? `${onboardingStorageKey}:${email}` : "";
    const preferred = emailKey ? window.localStorage.getItem(emailKey) : null;
    const fallback = window.localStorage.getItem(onboardingStorageKey);
    const parsed: unknown = JSON.parse(preferred ?? fallback ?? "{}");
    const state = record(parsed);
    if (email && text(state.ownerEmail) && text(state.ownerEmail) !== email) {
      const rawFallback: unknown = fallback ? JSON.parse(fallback) : {};
      const fallbackState = record(rawFallback);
      if (text(fallbackState.ownerEmail) === email) return fallbackState;
      return {};
    }
    return state;
  } catch {
    const email = localAuthEmail();
    if (email) window.localStorage.removeItem(`${onboardingStorageKey}:${email}`);
    window.localStorage.removeItem(onboardingStorageKey);
    return {};
  }
}

function localAuthEmailForState(state: Record<string, unknown>) {
  if (typeof window === "undefined") return "";
  return localAuthEmail() || text(state.ownerEmail);
}

function organizationName(state: Record<string, unknown>, email: string) {
  return text(state.organizationName) || text(record(state.organization).organization_name) || (email ? email.split("@")[0] : "Local workspace");
}

function profileName(state: Record<string, unknown>, email: string) {
  return text(state.ownerName) || text(record(state.assessment_owner).full_name) || (email ? email.split("@")[0] : "Workspace owner");
}

export type BrowserWorkspaceContext = {
  workspaceId: string;
  organization: string;
  profileName: string;
  email: string;
  companySize: string;
  country: string;
  industry: string;
  scope: string;
  sites: string;
  owner: string;
  metadata: Record<string, unknown>;
};

export function readBrowserWorkspaceContext(): BrowserWorkspaceContext {
  const state = readLocalState();
  const email = localAuthEmailForState(state);
  const organization = organizationName(state, email);
  const profile = profileName(state, email);
  const onboarding = {
    organization_name: organization,
    organization: {
      organization_name: organization,
      company_size: text(state.companySize),
      primary_country: text(state.countryCode),
      industry: text(state.industryId),
      other_industry: text(state.otherIndustry),
    },
    operating_environment: {
      software_development: text(state.softwareDevelopment),
      work_model: text(state.workModel),
    },
    assessment_scope: {
      coverage: text(state.assessmentScope),
      scope_name: text(state.scopeName),
      description: text(state.scopeDescription),
    },
    assessment_owner: {
      full_name: profile,
      email,
      role: text(state.ownerRole),
      other_role: text(state.otherOwnerRole),
    },
    assessment_context: {},
    workspace_creation_id: text(state.workspaceCreationId),
    workspace_created_at: text(state.workspaceCreatedAt),
    current_screen: Number.isFinite(Number(state.currentScreen)) ? Number(state.currentScreen) : 0,
    completed: state.completed === true,
  };

  return {
    workspaceId: text(state.workspaceCreationId),
    organization,
    profileName: profile,
    email,
    companySize: text(state.companySize),
    country: text(state.countryCode),
    industry: text(state.industryId),
    scope: text(state.scopeName),
    sites: "",
    owner: profile,
    metadata: {
      full_name: profile,
      name: profile,
      email,
      organization_name: organization,
      organizationName: organization,
      normcore_onboarding: onboarding,
      normcore_onboarding_organization: onboarding.organization,
      normcore_onboarding_scope: onboarding.assessment_scope,
    },
  };
}
