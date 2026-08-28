"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import { readBrowserWorkspaceContext } from "@/lib/workspaces/browser-context";

const localAuthCookie = "normcore-local-auth";
const localAuthEmailCookie = "normcore-local-auth-email";
const localWorkspaceMetadataCookie = "normcore-local-workspace-metadata";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; SameSite=Lax`;
}

function getRemoteOnboarding(userMetadata: Record<string, unknown>): Record<string, unknown> {
  const raw = userMetadata.normcore_onboarding;
  return typeof raw === "object" && raw !== null && !Array.isArray(raw)
    ? raw as Record<string, unknown>
    : {};
}

export function LocalWorkspaceCookieSync() {
  // useEffect (not useLayoutEffect) so Supabase client is available after hydration.
  // The async call is intentionally fire-and-forget; cookie writes are best-effort.
  useEffect(() => {
    async function sync() {
      const localContext = readBrowserWorkspaceContext();

      // If there is nothing local at all, nothing to sync.
      if (!localContext.workspaceId && !localContext.email) return;

      // Start with the local metadata as baseline.
      let mergedMetadata = { ...localContext.metadata };

      // --- Priority check: real Supabase session ---
      // If Supabase says completed=true we must never downgrade that to false
      // via a stale or empty localStorage entry.
      try {
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (user) {
          const remoteOnboarding = getRemoteOnboarding(
            typeof user.user_metadata === "object" && user.user_metadata !== null
              ? user.user_metadata as Record<string, unknown>
              : {}
          );

          // If Supabase confirms completed=true, inject that into the merged metadata.
          if (remoteOnboarding.completed === true) {
            const localOnboarding =
              typeof mergedMetadata.normcore_onboarding === "object" &&
              mergedMetadata.normcore_onboarding !== null &&
              !Array.isArray(mergedMetadata.normcore_onboarding)
                ? { ...(mergedMetadata.normcore_onboarding as Record<string, unknown>) }
                : {};

            mergedMetadata = {
              ...mergedMetadata,
              normcore_onboarding: {
                ...localOnboarding,
                // Preserve Supabase-confirmed fields so they are not overwritten.
                completed: true,
                workspace_creation_id:
                  remoteOnboarding.workspace_creation_id ?? localOnboarding.workspace_creation_id,
              },
            };
          }
        }
      } catch {
        // Network failure: keep local metadata as-is (do not block the cookie write).
      }

      setCookie(localAuthCookie, "1");
      if (localContext.email) setCookie(localAuthEmailCookie, encodeURIComponent(localContext.email));
      setCookie(localWorkspaceMetadataCookie, encodeURIComponent(JSON.stringify(mergedMetadata)));
    }

    void sync();
  }, []);

  return null;
}
