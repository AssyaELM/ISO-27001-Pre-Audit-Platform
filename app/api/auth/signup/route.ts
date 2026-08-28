import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { validateWorkEmail } from "@/lib/onboarding/email";
import { writeAdminActivity } from "@/lib/super-admin/data";

type SignupBody = { email?: string; password?: string; name?: string; language?: string };

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase Auth is not configured." }, { status: 503 });

  let body: SignupBody;
  try { body = await request.json() as SignupBody; }
  catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const fullName = body.name?.trim() ?? "";
  const { normalized: email, valid: emailValid } = validateWorkEmail(body.email ?? "");
  const password = body.password ?? "";
  if (fullName.length < 2 || fullName.length > 120) return NextResponse.json({ error: "Full name must contain 2 to 120 characters." }, { status: 400 });
  if (!emailValid) return NextResponse.json({ error: "A valid work email is required." }, { status: 400 });
  if (password.length < 8 || password.length > 128) return NextResponse.json({ error: "Password must contain 8 to 128 characters." }, { status: 400 });

  const admin = createAdminClient();
  let createdUserId = "";
  let createdNewAuthUser = false;
  try {
    const { data: existingRequest, error: requestReadError } = await admin.from("access_requests").select("id,status").eq("email", email).in("status", ["pending", "approved"]).order("requested_at", { ascending: false }).limit(1).maybeSingle();
    if (requestReadError) throw requestReadError;
    if (existingRequest) {
      const message = existingRequest.status === "pending"
        ? "Your access request is already awaiting review."
        : existingRequest.status === "approved"
          ? "This account is already approved. Please sign in."
          : "This access request was not approved. Please contact the NormCore team.";
      return NextResponse.json({ error: message, status: existingRequest.status }, { status: 409 });
    }

    const { data: rejectedRequest, error: rejectedReadError } = await admin.from("access_requests").select("auth_user_id").eq("email", email).eq("status", "rejected").order("requested_at", { ascending: false }).limit(1).maybeSingle();
    if (rejectedReadError) throw rejectedReadError;
    const userMetadata = { full_name: fullName, language: body.language ?? "en", normcore_access_request: true };
    if (rejectedRequest) {
      const userResult = await admin.auth.admin.updateUserById(rejectedRequest.auth_user_id, { password, email_confirm: true, user_metadata: userMetadata });
      if (userResult.error || !userResult.data.user) return NextResponse.json({ error: "Unable to submit access request." }, { status: 400 });
      createdUserId = userResult.data.user.id;
    } else {
      const userResult = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: userMetadata });
      if (userResult.error || !userResult.data.user) {
        const duplicate = userResult.error?.status === 422 || userResult.error?.message.toLowerCase().includes("already");
        return NextResponse.json({ error: duplicate ? "An account already exists for this email. Please sign in." : (userResult.error?.message ?? "Unable to submit access request.") }, { status: duplicate ? 409 : 400 });
      }
      createdUserId = userResult.data.user.id;
      createdNewAuthUser = true;
    }

    const { data: accessRequest, error: insertError } = await admin.from("access_requests").insert({
      full_name: fullName,
      email,
      auth_user_id: createdUserId,
      status: "pending",
    }).select("id,status,requested_at").single();
    if (insertError) throw insertError;

    await writeAdminActivity({
      adminUserId: null,
      action: "access_request_created",
      details: { accessRequestId: accessRequest.id, requesterEmail: email, requesterName: fullName },
    });

    return NextResponse.json({
      ok: true,
      requestId: accessRequest.id,
      status: "pending",
      destination: "/access-status?status=pending",
      message: "Your access request has been submitted. A NormCore administrator must approve your account before you can sign in.",
    }, { status: 201 });
  } catch (error) {
    if (createdNewAuthUser && createdUserId) await admin.auth.admin.deleteUser(createdUserId);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to submit access request." }, { status: 500 });
  }
}
