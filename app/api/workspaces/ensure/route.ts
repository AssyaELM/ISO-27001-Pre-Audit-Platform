import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/workspaces/authenticated-client";

type Payload = { workspaceId?: string; name?: string };

export async function POST(request: Request) {
  let payload: Payload;
  try {
    payload = await request.json() as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const workspaceId = payload.workspaceId?.trim() ?? "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(workspaceId)) {
    return NextResponse.json({ error: "A valid workspaceId is required" }, { status: 400 });
  }

  try {
    const { client, user, error: authError } = await getCurrentUser();
    if (authError || !user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const { data: existing, error: readError } = await client
      .from("workspaces")
      .select("id, owner_id")
      .eq("id", workspaceId)
      .maybeSingle();
    if (readError) throw readError;
    if (existing && existing.owner_id !== user.id) {
      return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
    }

    if (!existing) {
      const { error: insertError } = await client.from("workspaces").insert({
        id: workspaceId,
        name: payload.name?.trim() || "Workspace",
        owner_id: user.id,
      });
      if (insertError) throw insertError;
    }

    return NextResponse.json({ workspaceId }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to ensure workspace" }, { status: 500 });
  }
}
