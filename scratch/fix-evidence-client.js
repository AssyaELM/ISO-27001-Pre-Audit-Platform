const fs = require("fs");
const file = "components/evidence/evidence-room-page.tsx";
let code = fs.readFileSync(file, "utf8");

code = code.replace(
  "export function EvidenceRoomPage() {",
  `export function EvidenceRoomPage({ initialWorkspaceId, initialEvidence, initialLinks, initialWorkspaceMembers }: { initialWorkspaceId?: string; initialEvidence?: any[]; initialLinks?: any[]; initialWorkspaceMembers?: any[] }) {`
);

code = code.replace(
  "const [loading, setLoading] = useState(!globalEvidenceCache);",
  "const [loading, setLoading] = useState(!globalEvidenceCache && (!initialEvidence || initialEvidence.length === 0));"
);

code = code.replace(
  "const [evidence, setEvidence] = useState<Evidence[]>(globalEvidenceCache || []);",
  "const [evidence, setEvidence] = useState<Evidence[]>(globalEvidenceCache || initialEvidence || []);"
);

code = code.replace(
  "const [links, setLinks] = useState<EvidenceLink[]>(globalLinksCache || []);",
  "const [links, setLinks] = useState<EvidenceLink[]>(globalLinksCache || initialLinks || []);"
);

code = code.replace(
  "const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);",
  "const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>(globalWorkspaceMembersCache || initialWorkspaceMembers || []);"
);

code = code.replace(
  "const [workspaceId, setWorkspaceId] = useState<string>(globalWorkspaceId || \"\");",
  "const [workspaceId, setWorkspaceId] = useState<string>(globalWorkspaceId || initialWorkspaceId || \"\");"
);

code = code.replace(
  "if (alive) { const nextId = value(onboarding.workspace_creation_id); globalWorkspaceId = nextId; setWorkspaceId(nextId);",
  "if (alive) { const nextId = value(onboarding.workspace_creation_id); globalWorkspaceId = nextId; setWorkspaceId(nextId); if (!initialWorkspaceId && !globalEvidenceCache) setLoading(true);"
);

code = code.replace(
  "useEffect(() => { if (!globalEvidenceCache || !workspaceId || globalWorkspaceId !== workspaceId) { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); } }, [load, workspaceId]);",
  "useEffect(() => { if (!workspaceId) return; const isNewWorkspace = globalWorkspaceId !== workspaceId; if (isNewWorkspace || (!globalEvidenceCache && (!initialEvidence || initialEvidence.length === 0))) { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); } else if (initialEvidence && initialEvidence.length > 0 && !globalEvidenceCache && workspaceId === initialWorkspaceId) { globalEvidenceCache = initialEvidence; globalLinksCache = initialLinks; globalWorkspaceMembersCache = initialWorkspaceMembers; setLoading(false); } }, [load, workspaceId]);"
);

fs.writeFileSync(file, code);

