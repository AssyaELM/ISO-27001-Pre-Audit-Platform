const fs = require("fs");
const file = "app/api/remediation/actions/route.ts";
let code = fs.readFileSync(file, "utf8");

const extract = `
export async function getRemediationData(workspaceId: string) {
  const { client, admin } = await authenticatedEvidenceClient(workspaceId);
  
  const [actionsResult, membersResult] = await Promise.all([
    client.from("remediation_actions").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: true }),
    admin.auth.admin.listUsers()
  ]);

  if (actionsResult.error) throw actionsResult.error;
  if (membersResult.error) throw membersResult.error;

  const actions = (actionsResult.data ?? []).map((row) => ({
    id: row.id,
    theme: row.theme_id,
    controlId: row.control_id,
    gap: row.gap_analysis,
    remediation: row.remediation_strategy,
    status: row.status,
    ownerId: row.owner_id,
    dueDate: row.due_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const members = membersResult.data.users.map((u) => ({
    id: u.id,
    email: u.email ?? "",
    name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? u.email?.split("@")[0] ?? "Unknown User"
  }));

  return { actions, members };
}
`;

code = code.replace(
  "export async function GET(request: Request) {",
  extract + "\\nexport async function GET(request: Request) {"
);

const oldLogicStart = "const { client, admin } = await authenticatedEvidenceClient(workspaceId);";
const oldLogicEnd = "return NextResponse.json({ actions, members });";

const lines = code.split("\\n");
const startIdx = lines.findIndex(l => l.includes(oldLogicStart));
const endIdx = lines.findIndex(l => l.includes(oldLogicEnd));

if (startIdx !== -1 && endIdx !== -1) {
  lines.splice(startIdx, endIdx - startIdx + 1, "const data = await getRemediationData(workspaceId);", "return NextResponse.json(data);");
}

fs.writeFileSync(file, lines.join("\\n"));
console.log("Extracted getRemediationData");

