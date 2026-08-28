import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers.js";
import { createHash } from "node:crypto";

import { createAdminClient } from "../supabase/admin.ts";
import { createClient } from "../supabase/server.ts";
import { requireWorkspaceAccess as repoRequireWorkspaceAccess } from "../evidence/repository.ts";
import { ProductAccessError, requireApprovedProductAccess } from "../auth/access-request.ts";

const localWorkspaceMetadataCookie = "normcore-local-workspace-metadata";

function parseLocalMetadata(value: string | undefined) {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value));
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function localMetadataOrFallback(email: string, metadata: Record<string, unknown>) {
  if (Object.keys(metadata).length > 0) return metadata;
  const profile = email.split("@")[0] || "Workspace owner";
  return {
    email,
    full_name: profile,
    name: profile,
  };
}

function deterministicUuid(seed: string) {
  const hex = createHash("sha256").update(seed).digest("hex");
  const timeLow = hex.slice(0, 8);
  const timeMid = hex.slice(8, 12);
  const timeHi = `4${hex.slice(13, 16)}`;
  const clockSeq = ((Number.parseInt(hex.slice(16, 18), 16) & 0x3) | 0x8).toString(16) + hex.slice(18, 20);
  const node = hex.slice(20, 32);
  return `${timeLow}-${timeMid}-${timeHi}-${clockSeq}-${node}`;
}

function syntheticUser(email: string, metadata: Record<string, unknown>): User {
  return {
    id: deterministicUuid(email || JSON.stringify(metadata) || "workspace"),
    email: email || undefined,
    user_metadata: { ...metadata, normcore_local_user: true },
  } as unknown as User;
}

export function isLocalSyntheticUser(user: Pick<User, "user_metadata"> | null | undefined) {
  const metadata = user?.user_metadata;
  return typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)
    && (metadata as Record<string, unknown>).normcore_local_user === true;
}

function userWorkspaceId(user: Pick<User, "user_metadata"> | null | undefined) {
  const metadata = typeof user?.user_metadata === "object" && user.user_metadata !== null && !Array.isArray(user.user_metadata)
    ? user.user_metadata as Record<string, unknown>
    : {};
  const onboarding = typeof metadata.normcore_onboarding === "object" && metadata.normcore_onboarding !== null && !Array.isArray(metadata.normcore_onboarding)
    ? metadata.normcore_onboarding as Record<string, unknown>
    : {};
  return typeof onboarding.workspace_creation_id === "string" ? onboarding.workspace_creation_id.trim() : "";
}

export class WorkspaceHttpError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "WorkspaceHttpError";
  }
}

async function findUserByEmail(email: string) {
  const adminClient = createAdminClient();
  const client = await createClient();
  const pageSize = 100;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: pageSize });
    if (error) throw error;
    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return { client, user };
    if (data.users.length < pageSize) break;
  }

  return { client, user: null as User | null };
}

// Cached strictly per Next.js request lifecycle
export const getAuthenticatedUser = cache(async () => {
  const authorization = (await headers()).get("authorization");
  const bearer = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : undefined;
  const cookieStore = await cookies();
  const localAuthEnabled = cookieStore.get("normcore-local-auth")?.value === "1";
  const localAuthEmail = cookieStore.get("normcore-local-auth-email")?.value ?? "";
  const localMetadata = parseLocalMetadata(cookieStore.get(localWorkspaceMetadataCookie)?.value);

  // A real Supabase session always has priority over the local compatibility
  // context. The latter is only for an environment where no real session can
  // be read at all.
  const client = await createClient();
  let remoteError: unknown = null;
  try {
    const { data, error } = await client.auth.getUser(bearer);
    if (data.user) return { client, user: data.user, error: null };
    remoteError = error;
  } catch (error) {
    remoteError = error;
  }

  if (!bearer) {
    try {
      const { data } = await client.auth.getSession();
      if (data.session?.user) return { client, user: data.session.user, error: null };
    } catch (error) {
      remoteError = remoteError ?? error;
    }
  }

  if (!bearer && localAuthEnabled && localAuthEmail) {
    try {
      const result = await findUserByEmail(localAuthEmail);
      if (result.user) return { client: result.client, user: result.user, error: null };
    } catch (error) {
      console.warn("NormCore local auth user lookup failed; falling back to local workspace context.", error);
    }

    const metadata = localMetadataOrFallback(localAuthEmail, localMetadata);
    return { client: createAdminClient(), user: syntheticUser(localAuthEmail, metadata), error: null };
  }

  return { client, user: null, error: remoteError };
});

export const getCurrentUser = cache(async () => {
  const result = await getAuthenticatedUser();
  if (!result.user) return result;
  try {
    await requireApprovedProductAccess(result.user);
    return result;
  } catch (error) {
    if (error instanceof ProductAccessError) return { client: result.client, user: null, error };
    throw error;
  }
});

export const requireWorkspaceAccess = cache(async (workspaceId: string) => {
  const { client } = await getCurrentUser();
  await repoRequireWorkspaceAccess(client, workspaceId);
});

export async function authenticatedWorkspaceClient(workspaceId: string) {
  const { client, user, error } = await getCurrentUser();
  if (error || !user) throw new WorkspaceHttpError("Authentication required", 401);
  const currentWorkspaceId = userWorkspaceId(user);
  if (!isLocalSyntheticUser(user) && currentWorkspaceId !== workspaceId) {
    try {
      await requireWorkspaceAccess(workspaceId);
    } catch {
      throw new WorkspaceHttpError("Workspace access denied", 403);
    }
  }
  return { client, user: user as User };
}
