import { NextResponse } from "next/server";

import { authenticatedEvidenceClient, evidenceError, evidenceRouteError } from "@/lib/evidence/http";
import { readEvidenceItem } from "@/lib/evidence/repository";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const workspaceId = new URL(request.url).searchParams.get("workspaceId")?.trim() ?? "";
  if (!workspaceId || !id) return evidenceError("workspaceId and evidence id are required", 400);
  try {
    const { client } = await authenticatedEvidenceClient(workspaceId);
    const item = await readEvidenceItem(client, id);
    if (!item || item.workspaceId !== workspaceId) return evidenceError("Evidence not found", 404);
    const { data, error } = await client.storage.from(item.storageBucket).createSignedUrl(item.storagePath, 60, {
      download: item.originalFilename,
    });
    if (error) throw error;
    return NextResponse.json({ signedUrl: data.signedUrl, expiresIn: 60 });
  } catch (cause) {
    return evidenceRouteError(cause, "Unable to create evidence download URL");
  }
}

