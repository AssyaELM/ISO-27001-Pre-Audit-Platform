import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export class SuperAdminError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "SuperAdminError";
  }
}

export type SuperAdminIdentity = {
  user: User;
  name: string;
  email: string;
  initials: string;
  preferences: Record<string, boolean>;
};

function displayName(user: User) {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const value = String(metadata?.full_name ?? metadata?.name ?? "").trim();
  return value || user.email?.split("@")[0] || "Super Admin";
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SA";
}

export const requireSuperAdmin = cache(async (): Promise<SuperAdminIdentity> => {
  const client = await createClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new SuperAdminError("Authentication required", 401);

  const admin = createAdminClient();
  const { data: role, error: roleError } = await admin
    .from("platform_admins")
    .select("role, active, preferences")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (roleError) throw new SuperAdminError("Unable to verify platform role", 503);
  if (!role || role.role !== "super_admin" || role.active !== true) {
    throw new SuperAdminError("Super Admin access required", 403);
  }

  const name = displayName(data.user);
  return {
    user: data.user,
    name,
    email: data.user.email ?? "",
    initials: initials(name),
    preferences: typeof role.preferences === "object" && role.preferences ? role.preferences as Record<string, boolean> : {},
  };
});

export function superAdminErrorResponse(cause: unknown) {
  const status = cause instanceof SuperAdminError ? cause.status : 500;
  const message = cause instanceof Error
    ? cause.message
    : typeof cause === "object" && cause !== null && "message" in cause
      ? String((cause as { message: unknown }).message)
      : "Unexpected Super Admin error";
  return Response.json({ error: message }, { status });
}
