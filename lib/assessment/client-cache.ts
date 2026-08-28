import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import type { AssessmentAnswerRecord } from "@/content/assessment-infrastructure";
import { readBrowserWorkspaceContext } from "@/lib/workspaces/browser-context";

type AssessmentCache = {
  userId: string;
  workspaceId: string;
  metadata: Record<string, unknown>;
  responses: AssessmentAnswerRecord[];
};

let memCache: AssessmentCache | null = null;
let fetchPromise: Promise<AssessmentCache> | null = null;

export function getAssessmentCache(): AssessmentCache | null {
  return memCache;
}

export function clearAssessmentCache() {
  memCache = null;
  fetchPromise = null;
}

// Global listener for auth changes
if (typeof window !== "undefined") {
  createClient().auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
    if (event === "SIGNED_OUT" || event === "USER_UPDATED") {
      clearAssessmentCache();
    }
    if (session?.user?.id && memCache && memCache.userId !== session.user.id) {
      clearAssessmentCache();
    }
    const metadata = (session?.user?.user_metadata || {}) as Record<string, unknown>;
    const onboarding = (metadata.normcore_onboarding || {}) as Record<string, unknown>;
    const workspaceId = typeof onboarding.workspace_creation_id === "string" ? onboarding.workspace_creation_id : "";
    if (workspaceId && memCache && memCache.workspaceId !== workspaceId) {
      clearAssessmentCache();
    }
  });
}

export function updateAssessmentResponses(updater: (current: AssessmentAnswerRecord[]) => AssessmentAnswerRecord[]) {
  if (memCache) {
    memCache.responses = updater(memCache.responses);
  }
}

export function updateAssessmentMetadata(updater: (current: Record<string, unknown>) => Record<string, unknown>) {
  if (memCache) {
    memCache.metadata = updater(memCache.metadata);
  }
}

export async function fetchAssessmentData(force = false): Promise<AssessmentCache> {
  const client = createClient();
  const { data: sessionData } = await client.auth.getSession();
  const browserContext = readBrowserWorkspaceContext();
  let sessionUser = sessionData?.session?.user ?? null;
  if (!sessionUser) {
    try {
      sessionUser = (await client.auth.getUser()).data.user ?? null;
    } catch {
      sessionUser = null;
    }
  }
  const user = sessionUser || (browserContext.workspaceId ? ({
    id: `local:${browserContext.workspaceId}`,
    email: browserContext.email || undefined,
    user_metadata: browserContext.metadata,
  } as User) : null);
  if (!user) throw new Error("Authentication required");

  const metadata = (user.user_metadata || browserContext.metadata || {}) as Record<string, unknown>;
  const onboarding = (metadata.normcore_onboarding || {}) as Record<string, unknown>;
  const workspaceId = typeof onboarding.workspace_creation_id === "string" && onboarding.workspace_creation_id
    ? onboarding.workspace_creation_id
    : browserContext.workspaceId;

  if (!workspaceId) throw new Error("No assessment workspace is available.");

  // Workspace or user changed? Invalidate!
  if (memCache && (memCache.userId !== user.id || memCache.workspaceId !== workspaceId)) {
    clearAssessmentCache();
  }

  if (fetchPromise && !force && memCache) {
    return fetchPromise;
  }
  
  // If fetchPromise is pending, we can await it, but we need to check identity afterwards to prevent race conditions.
  if (fetchPromise && !force) {
    try {
      const result = await fetchPromise;
      if (result.userId === user.id && result.workspaceId === workspaceId) {
        return result;
      }
    } catch {
      // The pending promise was rejected (either backend error, or user/workspace changed during fetch).
      // We safely fall through to initiate a new fresh request for the current user/workspace.
    }
  }

  fetchPromise = (async () => {
    const { data: { session } } = await client.auth.getSession();
    const headers: Record<string, string> = session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {};

    const response = await fetch(`/api/assessment/responses?workspaceId=${encodeURIComponent(workspaceId)}`, { headers });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || "Unable to load assessment responses.");
    }

    const body = await response.json();
    
    // Race condition protection: double check identity hasn't changed during the fetch
    if (!user.id.startsWith("local:")) {
      const { data: latestSession } = await client.auth.getSession();
      const latestUser = latestSession?.session?.user;
      if (!latestUser || latestUser.id !== user.id) {
        throw new Error("User changed during fetch");
      }
      const latestOnboarding = ((latestUser.user_metadata || {}).normcore_onboarding || {}) as Record<string, unknown>;
      const latestWorkspaceId = typeof latestOnboarding.workspace_creation_id === "string" ? latestOnboarding.workspace_creation_id : "";
      if (latestWorkspaceId !== workspaceId) {
        throw new Error("Workspace changed during fetch");
      }
    }

    memCache = { userId: user.id, workspaceId, metadata, responses: body.responses || [] };
    return memCache;
  })();

  try { return await fetchPromise; } catch (error) { fetchPromise = null; throw error; }
}

