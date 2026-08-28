import { NextResponse } from "next/server";

import { authenticatedEvidenceClient, evidenceError, evidenceRouteError } from "@/lib/evidence/http";
import { readEvidenceItem } from "@/lib/evidence/repository";

type RouteContext = { params: Promise<{ id: string; linkId: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  const { id, linkId } = await context.params;
  const workspaceId = new URL(request.url).searchParams.get("workspaceId")?.trim() ?? "";
  if (!workspaceId || !id || !linkId) return evidenceError("workspaceId, evidence id and link id are required", 400);
  try {
    const { client, admin } = await authenticatedEvidenceClient(workspaceId);
    const item = await readEvidenceItem(client, id);
    if (!item || item.workspaceId !== workspaceId) return evidenceError("Evidence not found", 404);
    const { data, error } = await admin.from("evidence_question_links")
      .delete()
      .eq("id", linkId)
      .eq("evidence_id", id)
      .eq("workspace_id", workspaceId)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) return evidenceError("Evidence link not found", 404);
    const { count, error: countError } = await client.from("evidence_question_links")
      .select("id", { count: "exact", head: true })
      .eq("evidence_id", id);
    if (countError) throw countError;
    return NextResponse.json({ unlinked: true, remainingLinks: count ?? 0 });
  } catch (cause) {
    return evidenceRouteError(cause, "Unable to unlink evidence");
  }
}
