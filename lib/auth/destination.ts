const defaultDestination = "/dashboard";

export function resolveSafeDestination(nextPath?: string) {
  if (!nextPath) return defaultDestination;
  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) return defaultDestination;

  try {
    const url = new URL(nextPath, "http://normcore.local");
    if (url.origin !== "http://normcore.local") return defaultDestination;
    if (
      url.pathname === "/login"
      || url.pathname === "/signup"
      || url.pathname === "/forgot-password"
      || url.pathname === "/check-email"
    ) {
      return defaultDestination;
    }
    return `${url.pathname}${url.search}${url.hash}` || defaultDestination;
  } catch {
    return defaultDestination;
  }
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function onboardingRecord(metadata: unknown) {
  return record(record(metadata).normcore_onboarding);
}

export type OnboardingSummary = {
  completed: boolean;
  currentScreen: number;
  workspaceCreationId: string;
};

export function readOnboardingSummary(metadata: unknown): OnboardingSummary {
  const onboarding = onboardingRecord(metadata);
  const workspaceCreationId = typeof onboarding.workspace_creation_id === "string" ? onboarding.workspace_creation_id.trim() : "";
  const currentScreenRaw = Number(onboarding.current_screen);
  const currentScreen = Number.isFinite(currentScreenRaw) ? Math.max(0, currentScreenRaw) : 0;
  return {
    completed: onboarding.completed === true,
    currentScreen,
    workspaceCreationId,
  };
}

export function isOnboardingComplete(metadata: unknown) {
  return readOnboardingSummary(metadata).completed;
}

export function resolvePostAuthDestination(nextPath?: string, metadata?: unknown) {
  if (!isOnboardingComplete(metadata)) return "/onboarding";
  return resolveSafeDestination(nextPath);
}
