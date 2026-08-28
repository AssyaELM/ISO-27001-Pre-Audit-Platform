function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function workspaceDisplayName(metadata: unknown): string {
  const root = record(metadata);
  const onboarding = record(root.normcore_onboarding);
  const organization = record(onboarding.organization ?? root.normcore_onboarding_organization);
  return text(onboarding.organization_name)
    || text(organization.organization_name)
    || text(organization.organizationName)
    || text(root.organization_name)
    || text(root.organizationName);
}
