import { requireSuperAdmin, superAdminErrorResponse } from "@/lib/super-admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    await requireSuperAdmin();
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? "pending";
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 20));
    if (!["pending", "approved", "rejected", "unread", "all"].includes(status)) return Response.json({ error: "Invalid status." }, { status: 400 });
    const admin = createAdminClient();
    let query = admin.from("access_requests").select("id,full_name,email,auth_user_id,status,requested_at,reviewed_at,reviewed_by,rejection_reason,created_at,updated_at", { count: "exact" }).order("requested_at", { ascending: false }).limit(limit);
    if (status !== "all" && status !== "unread") query = query.eq("status", status);
    if (status === "unread") query = query.eq("status", "pending");
    const { data, error, count } = await query;
    if (error) throw error;
    const { count: pendingCount, error: countError } = await admin.from("access_requests").select("id", { count: "exact", head: true }).eq("status", "pending");
    if (countError) throw countError;
    return Response.json({ items: data ?? [], total: count ?? 0, pendingCount: pendingCount ?? 0 });
  } catch (cause) { return superAdminErrorResponse(cause); }
}
