import { requireSuperAdmin, superAdminErrorResponse } from "@/lib/super-admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAdminActivity } from "@/lib/super-admin/data";
import { sendAccessDecisionEmail } from "@/lib/email/access-request";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json() as { action?: "approve" | "reject"; rejectionReason?: string };
    if (body.action !== "approve" && body.action !== "reject") return Response.json({ error: "Action must be approve or reject." }, { status: 400 });
    const admin = createAdminClient();
    const { data: accessRequest, error: readError } = await admin.from("access_requests").select("id,full_name,email,auth_user_id,status").eq("id", id).maybeSingle();
    if (readError) throw readError;
    if (!accessRequest) return Response.json({ error: "Access request not found." }, { status: 404 });
    if (accessRequest.status !== "pending") return Response.json({ error: "Only pending access requests can be reviewed." }, { status: 409 });

    const approved = body.action === "approve";
    const reviewedAt = new Date().toISOString();
    const { data: reviewedRequest, error: updateError } = await admin.from("access_requests").update({
      status: approved ? "approved" : "rejected",
      reviewed_at: reviewedAt,
      reviewed_by: identity.user.id,
      rejection_reason: approved ? null : (body.rejectionReason?.trim() || null),
    }).eq("id", id).eq("status", "pending").select("id").maybeSingle();
    if (updateError) throw updateError;
    if (!reviewedRequest) return Response.json({ error: "This access request was already reviewed." }, { status: 409 });
    const action = approved ? "access_request_approved" : "access_request_rejected";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(request.url).origin;
    const emailResult = await sendAccessDecisionEmail({ email: accessRequest.email, fullName: accessRequest.full_name, approved, appUrl });
    await writeAdminActivity({
      adminUserId: identity.user.id,
      action,
      details: { accessRequestId: id, requesterEmail: accessRequest.email, requesterName: accessRequest.full_name, emailSent: emailResult.sent },
    });
    if (!emailResult.sent && approved) {
      await writeAdminActivity({ adminUserId: identity.user.id, action: "approval_email_failed", result: "failed", details: { accessRequestId: id, requesterEmail: accessRequest.email, reason: emailResult.reason } });
    } else if (approved) {
      await writeAdminActivity({ adminUserId: identity.user.id, action: "approval_email_sent", details: { accessRequestId: id, requesterEmail: accessRequest.email } });
    }
    return Response.json({ ok: true, status: approved ? "approved" : "rejected", emailSent: emailResult.sent, emailWarning: emailResult.sent ? null : emailResult.reason });
  } catch (cause) { return superAdminErrorResponse(cause); }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await requireSuperAdmin();
    const { id } = await params;
    const admin = createAdminClient();
    const { data: accessRequest, error } = await admin.from("access_requests").select("id,full_name,email,auth_user_id,status").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!accessRequest) return Response.json({ error: "Access request not found." }, { status: 404 });
    if (accessRequest.status === "approved") return Response.json({ error: "Approved access requests cannot be deleted." }, { status: 409 });
    const deleteUser = await admin.auth.admin.deleteUser(accessRequest.auth_user_id);
    if (deleteUser.error) throw deleteUser.error;
    await writeAdminActivity({ adminUserId: identity.user.id, action: "access_request_deleted", details: { accessRequestId: id, requesterEmail: accessRequest.email, requesterName: accessRequest.full_name } });
    return Response.json({ ok: true });
  } catch (cause) { return superAdminErrorResponse(cause); }
}
