import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export type AccessRequestStatus = "pending" | "approved" | "rejected" | "legacy";

export class ProductAccessError extends Error {
  constructor(public readonly accessStatus: "pending" | "rejected", message: string) {
    super(message);
    this.name = "ProductAccessError";
  }
}

export function blockedAccessMessage(status: "pending" | "rejected") {
  return status === "pending"
    ? "Your access request is awaiting approval."
    : "Your access request was not approved.";
}

export async function accessRequestStatusForUser(user: Pick<User, "id">): Promise<AccessRequestStatus> {
  const admin = createAdminClient();
  const [{ data: platformAdmin, error: roleError }, { data: request, error: requestError }] = await Promise.all([
    admin.from("platform_admins").select("role,active").eq("user_id", user.id).maybeSingle(),
    admin.from("access_requests").select("status").eq("auth_user_id", user.id).maybeSingle(),
  ]);
  if (roleError) throw roleError;
  if (requestError) throw requestError;
  if (platformAdmin?.role === "super_admin" && platformAdmin.active === true) return "legacy";
  if (!request) return "legacy";
  return request.status as AccessRequestStatus;
}

export async function requireApprovedProductAccess(user: Pick<User, "id">) {
  const status = await accessRequestStatusForUser(user);
  if (status === "pending" || status === "rejected") {
    throw new ProductAccessError(status, blockedAccessMessage(status));
  }
  return status;
}
