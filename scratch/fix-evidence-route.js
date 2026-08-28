const fs = require("fs");
const file = "app/api/evidence/route.ts";
let code = fs.readFileSync(file, "utf8");

const extract = `
export async function getEvidenceData(workspaceId: string, filters: any = {}) {
  const { client, admin, user } = await authenticatedEvidenceClient(workspaceId);
  let linksQuery = client
    .from("evidence_question_links")
    .select("*")
    .eq("workspace_id", workspaceId);
  
  if (filters.themeId) linksQuery = linksQuery.eq("theme_id", filters.themeId);
  if (filters.controlId) linksQuery = linksQuery.eq("control_id", filters.controlId);
  if (filters.questionId) linksQuery = linksQuery.eq("question_id", filters.questionId);
  const { data: linkRows, error: linksError } = await linksQuery;
  if (linksError) throw linksError;

  const filterActive = Boolean(filters.themeId || filters.controlId || filters.questionId);
  const evidenceIds = [...new Set((linkRows ?? []).map((row) => String(row.evidence_id)))];
  let itemRows = [];
  if (!filterActive) {
    const { data, error } = await client
      .from("evidence_items")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    itemRows = data ?? [];
  } else if (evidenceIds.length > 0) {
    const { data, error } = await client
      .from("evidence_items")
      .select("*")
      .eq("workspace_id", workspaceId)
      .in("id", evidenceIds)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    itemRows = data ?? [];
  }

  const items = itemRows.map((row) => evidenceItem(row));
  const links = (linkRows ?? []).map((row) => evidenceLink(row));
  const metrics = await readCanonicalEvidenceMetrics(client, workspaceId);
  const { data: members, error: membersError } = await admin.auth.admin.listUsers();
  if (membersError) throw membersError;
  const workspaceMembers = members.users.map((u) => ({ id: u.id, email: u.email ?? "" }));

  return { evidence: items, links, metrics, workspaceMembers };
}
`;

code = code.replace(
  "export async function GET(request: Request) {",
  extract + "\\nexport async function GET(request: Request) {"
);

const oldLogicStart = "const { client, admin, user } = await authenticatedEvidenceClient(workspaceId);";
const oldLogicEnd = "return NextResponse.json({ evidence: items, links, metrics, workspaceMembers });";

const lines = code.split("\\n");
const startIdx = lines.findIndex(l => l.includes(oldLogicStart));
const endIdx = lines.findIndex(l => l.includes(oldLogicEnd));

if (startIdx !== -1 && endIdx !== -1) {
  lines.splice(startIdx, endIdx - startIdx + 1, "const data = await getEvidenceData(workspaceId, filters);", "return NextResponse.json(data);");
}

fs.writeFileSync(file, lines.join("\\n"));
console.log("Extracted getEvidenceData");

