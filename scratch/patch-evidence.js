const fs = require("fs");
const file = "components/evidence/evidence-room-page.tsx";
let code = fs.readFileSync(file, "utf8");

const cacheCode = `
let globalEvidenceCache: any[] | null = null;
let globalLinksCache: any[] | null = null;
let globalWorkspaceMembersCache: any[] | null = null;
let globalWorkspaceId: string | null = null;
`;

code = code.replace(
  "export function EvidenceRoomPage() {",
  cacheCode + "\nexport function EvidenceRoomPage() {"
);

code = code.replace(
  "const [loading, setLoading] = useState(true);",
  "const [loading, setLoading] = useState(!globalEvidenceCache);"
);
code = code.replace(
  "const [evidence, setEvidence] = useState<Evidence[]>([]);",
  "const [evidence, setEvidence] = useState<Evidence[]>(globalEvidenceCache || []);"
);
code = code.replace(
  "const [links, setLinks] = useState<EvidenceLink[]>([]);",
  "const [links, setLinks] = useState<EvidenceLink[]>(globalLinksCache || []);"
);
code = code.replace(
  "const [workspaceMembers, setWorkspaceMembers] = useState<{ id: string; email: string }[]>([]);",
  "const [workspaceMembers, setWorkspaceMembers] = useState<{ id: string; email: string }[]>(globalWorkspaceMembersCache || []);"
);
code = code.replace(
  "const [workspaceId, setWorkspaceId] = useState<string>(\"\");",
  "const [workspaceId, setWorkspaceId] = useState<string>(globalWorkspaceId || \"\");"
);

code = code.replace(
  "setEvidence(response.evidence ?? []); setLinks(response.links ?? []); setWorkspaceMembers(response.workspaceMembers ?? []);",
  "setEvidence(response.evidence ?? []); globalEvidenceCache = response.evidence ?? []; setLinks(response.links ?? []); globalLinksCache = response.links ?? []; setWorkspaceMembers(response.workspaceMembers ?? []); globalWorkspaceMembersCache = response.workspaceMembers ?? [];"
);

code = code.replace(
  "if (alive) { setWorkspaceId(value(onboarding.workspace_creation_id));",
  "if (alive) { const nextId = value(onboarding.workspace_creation_id); globalWorkspaceId = nextId; setWorkspaceId(nextId);"
);

code = code.replace(
  "useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);",
  "useEffect(() => { if (!globalEvidenceCache || !workspaceId || globalWorkspaceId !== workspaceId) { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); } }, [load, workspaceId]);"
);

fs.writeFileSync(file, code);
console.log("Patched Evidence cache");

