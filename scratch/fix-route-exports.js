const fs = require("fs");

const fetchersCode = `import { authenticatedWorkspaceClient } from "@/lib/workspaces/authenticated-client";
import { buildAiDocumentsRegistry, type RegistryAiDocumentRow, type RegistryEvidenceRow } from "@/lib/ai-documents/registry";
import { CANONICAL_AI_DOCUMENT_TYPES, mapAiDocumentStatus, readinessPercent } from "@/lib/ai-documents/ui";
import { normalizeContext, prepareGenerationContext, workspaceGenerationInput } from "@/app/api/ai-documents/context";
import { authenticatedEvidenceClient } from "@/lib/evidence/http";
import { evidenceItem, evidenceLink, readCanonicalEvidenceMetrics } from "@/lib/evidence/repository";

export async function getDocumentsData(workspaceId: string) {
  const { client, user } = await authenticatedWorkspaceClient(workspaceId);
  const [evidenceResult, aiDocumentsResult, argumentsResult] = await Promise.all([
    client.from("evidence_items").select("id,document_type,document_version,effective_date,review_date,document_owner_id,original_filename,created_at,updated_at").eq("workspace_id", workspaceId).in("document_type", ["information_security_policy", "access_control_policy", "incident_management_procedure", "backup_restore_procedure", "asset_management_policy"]),
    client.from("ai_documents").select("*").eq("workspace_id", workspaceId),
    client.from("assessment_responses").select("theme_id,control_id,question_id,answer,justification").eq("workspace_id", workspaceId),
  ]);
  const registry = buildAiDocumentsRegistry((evidenceResult.data ?? []) as RegistryEvidenceRow[], (aiDocumentsResult.data ?? []) as RegistryAiDocumentRow[]);
  const responses = (argumentsResult.data ?? []) as never[];
  const setupsMap = Object.fromEntries((aiDocumentsResult.data ?? []).filter((row) => row.version === "setup").map((row) => [row.document_type, row.document_content]));

  return CANONICAL_AI_DOCUMENT_TYPES.map((documentType) => {
    const entry = registry.find((item) => item.documentType === documentType)!;
    const setup = (setupsMap[documentType] ?? {}) as Record<string, unknown>;
    const input = workspaceGenerationInput(user, responses, registry, setup);
    const preparation = normalizeContext(prepareGenerationContext(documentType, input));
    const status = mapAiDocumentStatus(entry.status, preparation);
    return { documentType, label: entry.label, status, registryStatus: entry.status, version: entry.activeDocument?.version ?? null, updatedAt: entry.activeDocument?.updatedAt ?? null, reviewDate: entry.activeDocument?.reviewDate ?? null, ownerId: entry.activeDocument?.documentOwnerId ?? null, evidenceId: entry.activeDocument?.source === "evidence" ? entry.activeDocument.id : null, filename: entry.activeDocument?.filename ?? null, readiness: readinessPercent(preparation, status), preparation, content: entry.activeDocument?.content ?? null, setup };
  });
}

export async function getEvidenceData(workspaceId: string, filters: any = {}) {
  const { client, admin, user } = await authenticatedEvidenceClient(workspaceId);
  let linksQuery = client.from("evidence_question_links").select("*").eq("workspace_id", workspaceId);
  if (filters.themeId) linksQuery = linksQuery.eq("theme_id", filters.themeId);
  if (filters.controlId) linksQuery = linksQuery.eq("control_id", filters.controlId);
  if (filters.questionId) linksQuery = linksQuery.eq("question_id", filters.questionId);
  const { data: linkRows } = await linksQuery;

  const filterActive = Boolean(filters.themeId || filters.controlId || filters.questionId);
  const evidenceIds = [...new Set((linkRows ?? []).map((row) => String(row.evidence_id)))];
  let itemRows = [];
  if (!filterActive) {
    const { data } = await client.from("evidence_items").select("*").eq("workspace_id", workspaceId).order("updated_at", { ascending: false });
    itemRows = data ?? [];
  } else if (evidenceIds.length > 0) {
    const { data } = await client.from("evidence_items").select("*").eq("workspace_id", workspaceId).in("id", evidenceIds).order("updated_at", { ascending: false });
    itemRows = data ?? [];
  }

  const items = itemRows.map((row) => evidenceItem(row));
  const links = (linkRows ?? []).map((row) => evidenceLink(row));
  const metrics = await readCanonicalEvidenceMetrics(client, workspaceId);
  const { data: members } = await admin.auth.admin.listUsers();
  const workspaceMembers = members.users.map((u) => ({ id: u.id, email: u.email ?? "" }));

  return { evidence: items, links, metrics, workspaceMembers };
}

export async function getRemediationData(workspaceId: string) {
  const { client, admin } = await authenticatedEvidenceClient(workspaceId);
  const [actionsResult, membersResult] = await Promise.all([
    client.from("remediation_actions").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: true }),
    admin.auth.admin.listUsers()
  ]);
  const actions = (actionsResult.data ?? []).map((row) => ({ id: row.id, theme: row.theme_id, controlId: row.control_id, gap: row.gap_analysis, remediation: row.remediation_strategy, status: row.status, ownerId: row.owner_id, dueDate: row.due_date, notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at }));
  const members = membersResult.data.users.map((u) => ({ id: u.id, email: u.email ?? "", name: u.user_metadata?.full_name ?? u.user_metadata?.name ?? u.email?.split("@")[0] ?? "Unknown User" }));
  return { actions, members };
}
`;
fs.writeFileSync("app/api/data-fetchers.ts", fetchersCode);

// Remove exports from route.ts files
const removeExport = (file, fnName) => {
  let code = fs.readFileSync(file, "utf8");
  const regex = new RegExp("export async function " + fnName + "[\\\\s\\\\S]*?\\nexport async function GET", "m");
  code = code.replace(regex, "import { " + fnName + " } from \\"@/app/api/data-fetchers\\";\\nexport async function GET");
  fs.writeFileSync(file, code);
};

removeExport("app/api/ai-documents/route.ts", "getDocumentsData");
removeExport("app/api/evidence/route.ts", "getEvidenceData");
removeExport("app/api/remediation/actions/route.ts", "getRemediationData");

// Fix imports in page.ts files
const fixPage = (file, fnName, importPath) => {
  let code = fs.readFileSync(file, "utf8");
  code = code.replace(importPath, "@/app/api/data-fetchers");
  fs.writeFileSync(file, code);
};
fixPage("app/ai-documents/page.tsx", "getDocumentsData", "@/app/api/ai-documents/route");
fixPage("app/ai-documents/[documentType]/page.tsx", "getDocumentsData", "@/app/api/ai-documents/route");
fixPage("app/evidence-room/page.tsx", "getEvidenceData", "@/app/api/evidence/route");
fixPage("app/remediation-plan/page.tsx", "getRemediationData", "@/app/api/remediation/actions/route");

console.log("Fixed route exports");

