import { NextResponse } from "next/server.js";
import type { User } from "@supabase/supabase-js";

import { getCurrentUser, isLocalSyntheticUser } from "../workspaces/authenticated-client.ts";
import { createAdminClient } from "../supabase/admin.ts";
import { requireWorkspaceAccess } from "./repository.ts";

export function evidenceError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function formString(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function authenticatedEvidenceClient(workspaceId?: string) {
  const { client, user, error } = await getCurrentUser();
  if (error || !user) throw new EvidenceHttpError("Authentication required", 401);
  if (workspaceId) {
    const metadata = typeof user.user_metadata === "object" && user.user_metadata !== null && !Array.isArray(user.user_metadata)
      ? user.user_metadata as Record<string, unknown>
      : {};
    const onboarding = typeof metadata.normcore_onboarding === "object" && metadata.normcore_onboarding !== null && !Array.isArray(metadata.normcore_onboarding)
      ? metadata.normcore_onboarding as Record<string, unknown>
      : {};
    const currentWorkspaceId = typeof onboarding.workspace_creation_id === "string" ? onboarding.workspace_creation_id.trim() : "";
    if (!isLocalSyntheticUser(user) && currentWorkspaceId !== workspaceId) {
      try {
        await requireWorkspaceAccess(client, workspaceId);
      } catch {
        throw new EvidenceHttpError("Workspace access denied", 403);
      }
    }
  }
  try {
    return { client, admin: createAdminClient(), user: user as User };
  } catch {
    throw new EvidenceHttpError("Evidence backend storage is not configured", 503);
  }
}

export class EvidenceHttpError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "EvidenceHttpError";
  }
}

export function evidenceRouteError(cause: unknown, fallback: string) {
  if (cause instanceof EvidenceHttpError) return evidenceError(cause.message, cause.status);
  const structured = typeof cause === "object" && cause !== null
    ? cause as { code?: unknown; message?: unknown }
    : {};
  const message = cause instanceof Error
    ? cause.message
    : typeof structured.message === "string" ? structured.message : fallback;
  if (
    structured.code === "23505"
    || message.includes("duplicate key")
    || message.includes("identity_unique")
  ) {
    return evidenceError("This evidence is already linked to the question", 409);
  }
  if (message.includes("Workspace access denied") || message.includes("not member")) {
    return evidenceError("Workspace access denied", 403);
  }
  return evidenceError(message || fallback, 400);
}
