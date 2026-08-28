const fs = require("fs");
const file = "components/remediation/remediation-plan-view.tsx";
let code = fs.readFileSync(file, "utf8");

code = code.replace(
  "export default function RemediationPlanView() {",
  `export default function RemediationPlanView({ initialWorkspaceId, initialActions, initialMembers }: { initialWorkspaceId?: string; initialActions?: any[]; initialMembers?: any[] } = {}) {`
);

code = code.replace(
  "const [loading, setLoading] = useState(!globalActionsCache);",
  "const [loading, setLoading] = useState(!globalActionsCache && (!initialActions || initialActions.length === 0));"
);

code = code.replace(
  "const [actions, setActions] = useState<RemediationAction[]>(globalActionsCache || []);",
  "const [actions, setActions] = useState<RemediationAction[]>(globalActionsCache || initialActions || []);"
);

code = code.replace(
  "const [members, setMembers] = useState<RemediationMember[]>(globalMembersCache || []);",
  "const [members, setMembers] = useState<RemediationMember[]>(globalMembersCache || initialMembers || []);"
);

code = code.replace(
  "const [profile, setProfile] = useState<Profile>({ organization: \"\", name: \"\", workspaceId: globalWorkspaceId || \"\" });",
  "const [profile, setProfile] = useState<Profile>({ organization: \"\", name: \"\", workspaceId: globalWorkspaceId || initialWorkspaceId || \"\" });"
);

code = code.replace(
  "if (alive) { const nextId = value(onboarding.workspace_creation_id); globalWorkspaceId = nextId; setProfile({",
  "if (alive) { const nextId = value(onboarding.workspace_creation_id); globalWorkspaceId = nextId; if (!initialWorkspaceId && !globalActionsCache) setLoading(true); setProfile({"
);

code = code.replace(
  "useEffect(() => { if (!globalActionsCache || !profile.workspaceId || globalWorkspaceId !== profile.workspaceId) { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); } }, [load, profile.workspaceId]);",
  "useEffect(() => { if (!profile.workspaceId) return; const isNewWorkspace = globalWorkspaceId !== profile.workspaceId; if (isNewWorkspace || (!globalActionsCache && (!initialActions || initialActions.length === 0))) { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); } else if (initialActions && initialActions.length > 0 && !globalActionsCache && profile.workspaceId === initialWorkspaceId) { globalActionsCache = initialActions; globalMembersCache = initialMembers; setLoading(false); } }, [load, profile.workspaceId]);"
);

fs.writeFileSync(file, code);

