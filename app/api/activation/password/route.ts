import { hashActivationToken } from "@/lib/super-admin/data";
import { createAdminClient } from "@/lib/supabase/admin";

const passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { proof?: string; password?: string };
    const proof = body.proof?.trim() ?? "";
    const password = body.password ?? "";
    if (!/^[a-f0-9]{64}$/i.test(proof) || !passwordPattern.test(password)) return Response.json({ error: "Invalid activation setup request." }, { status: 400 });
    const admin = createAdminClient();
    const { data: session, error: sessionError } = await admin.from("activation_setup_sessions").select("id,token_id,workspace_id,expires_at,used_at").eq("proof_hash", hashActivationToken(proof)).maybeSingle();
    if (sessionError) throw sessionError;
    if (!session || session.used_at || new Date(session.expires_at) <= new Date()) return Response.json({ error: "This activation setup has expired or was already used." }, { status: 400 });
    const { data: workspace, error: workspaceError } = await admin.from("workspaces").select("owner_id").eq("id", session.workspace_id).maybeSingle();
    if (workspaceError) throw workspaceError;
    if (!workspace) return Response.json({ error: "Unable to activate this account." }, { status: 400 });
    const { error: authError } = await admin.auth.admin.updateUserById(workspace.owner_id, { password, email_confirm: true });
    if (authError) throw authError;
    const timestamp = new Date().toISOString();
    const { data: usedToken, error: tokenError } = await admin.from("activation_tokens").update({ status: "used", used_at: timestamp }).eq("id", session.token_id).eq("status", "pending").select("id").maybeSingle();
    if (tokenError) throw tokenError;
    if (!usedToken) return Response.json({ error: "This activation token has already been used." }, { status: 409 });
    const { error: profileError } = await admin.from("organization_admin_profiles").update({ status: "active", activation_status: "activated", invitation_status: "used", last_activity_at: timestamp }).eq("workspace_id", session.workspace_id);
    if (profileError) throw profileError;
    const { error: consumeError } = await admin.from("activation_setup_sessions").update({ used_at: timestamp }).eq("id", session.id).is("used_at", null);
    if (consumeError) throw consumeError;
    return Response.json({ ok: true, destination: "/login?activated=1" });
  } catch (error) {
    console.error("[NormCore activation] password setup failed", { message: error instanceof Error ? error.message : String(error) });
    return Response.json({ error: "Unable to activate this account." }, { status: 500 });
  }
}
