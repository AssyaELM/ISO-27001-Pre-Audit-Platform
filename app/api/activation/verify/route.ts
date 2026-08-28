import { hashActivationToken } from "@/lib/super-admin/data";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { token?: string };
    const token = body.token?.trim().toUpperCase() ?? "";
    if (!/^[A-Z2-9]{12}$/.test(token)) return Response.json({ error: "Invalid or expired activation token" }, { status: 400 });
    const admin = createAdminClient();
    const now = new Date();
    const { data: record, error } = await admin.from("activation_tokens").select("id,workspace_id,status,expires_at").eq("token_hash", hashActivationToken(token)).maybeSingle();
    if (error) throw error;
    if (!record || record.status !== "pending") return Response.json({ error: "Invalid or expired activation token" }, { status: 400 });
    if (new Date(record.expires_at) <= now) {
      await admin.from("activation_tokens").update({ status: "expired" }).eq("id", record.id);
      await admin.from("organization_admin_profiles").update({ activation_status: "expired", invitation_status: "expired" }).eq("workspace_id", record.workspace_id);
      return Response.json({ error: "Invalid or expired activation token" }, { status: 400 });
    }
    const proof = randomUUID().replaceAll("-", "") + randomUUID().replaceAll("-", "");
    const proofHash = hashActivationToken(proof);
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
    const { error: sessionError } = await admin.from("activation_setup_sessions").insert({ token_id: record.id, workspace_id: record.workspace_id, proof_hash: proofHash, expires_at: expiresAt });
    if (sessionError) throw sessionError;
    return Response.json({ ok: true, proof, expiresAt });
  } catch {
    return Response.json({ error: "Unable to verify activation token" }, { status: 500 });
  }
}
import { randomUUID } from "node:crypto";
