import { NextResponse } from "next/server";

import { validateCanonicalQuestionIdentity } from "@/lib/evidence/catalog";
import { authenticatedEvidenceClient, evidenceError, evidenceRouteError } from "@/lib/evidence/http";
import { evidenceLink, readEvidenceItem } from "@/lib/evidence/repository";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let payload: { workspaceId?: string; themeId?: string; controlId?: string; questionId?: string };
  try {
    payload = await request.json();
  } catch {
    return evidenceError("Invalid JSON body", 400);
  }
  const workspaceId = payload.workspaceId?.trim() ?? "";
  const identity = validateCanonicalQuestionIdentity({
    themeId: payload.themeId ?? "",
    controlId: payload.controlId ?? "",
    questionId: payload.questionId ?? "",
  });
  if (!workspaceId || !id) return evidenceError("workspaceId and evidence id are required", 400);
  if (!identity) return evidenceError("Question identity is not present in the canonical Assessment catalogs", 400);

  try {
    const { client, admin, user } = await authenticatedEvidenceClient(workspaceId);
    const item = await readEvidenceItem(client, id);
    if (!item || item.workspaceId !== workspaceId) return evidenceError("Evidence not found", 404);
    const { data, error } = await admin.from("evidence_question_links").insert({
      evidence_id: id,
      workspace_id: workspaceId,
      theme_id: identity.themeId,
      control_id: identity.controlId,
      question_id: identity.questionId,
      linked_by: user.id,
    }).select("*").single();
    if (error) throw error;
    return NextResponse.json({ link: evidenceLink(data), evidenceStatus: "provided" }, { status: 201 });
  } catch (cause) {
    return evidenceRouteError(cause, "Unable to link evidence");
  }
}
