const fs = require("fs");
const file = "components/remediation/remediation-plan-view.tsx";
let code = fs.readFileSync(file, "utf8");

const cacheCode = `
let globalActionsCache: any[] | null = null;
let globalMembersCache: any[] | null = null;
let globalWorkspaceId: string | null = null;
`;

code = code.replace(
  "export function RemediationPlanView() {",
  cacheCode + "\nexport function RemediationPlanView() {"
);

code = code.replace(
  "const [loading, setLoading] = useState(true);",
  "const [loading, setLoading] = useState(!globalActionsCache);"
);
code = code.replace(
  "const [actions, setActions] = useState<RemediationAction[]>([]);",
  "const [actions, setActions] = useState<RemediationAction[]>(globalActionsCache || []);"
);
code = code.replace(
  "const [members, setMembers] = useState<RemediationMember[]>([]);",
  "const [members, setMembers] = useState<RemediationMember[]>(globalMembersCache || []);"
);
code = code.replace(
  "const [profile, setProfile] = useState<Profile>({ organization: \"\", name: \"\", workspaceId: \"\" });",
  "const [profile, setProfile] = useState<Profile>({ organization: \"\", name: \"\", workspaceId: globalWorkspaceId || \"\" });"
);

code = code.replace(
  "setActions(data.actions ?? []); setMembers(data.members ?? []);",
  "setActions(data.actions ?? []); globalActionsCache = data.actions ?? []; setMembers(data.members ?? []); globalMembersCache = data.members ?? [];"
);

code = code.replace(
  "if (alive) { setProfile({",
  "if (alive) { const nextId = value(onboarding.workspace_creation_id); globalWorkspaceId = nextId; setProfile({"
);

code = code.replace(
  "useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);",
  "useEffect(() => { if (!globalActionsCache || !profile.workspaceId || globalWorkspaceId !== profile.workspaceId) { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); } }, [load, profile.workspaceId]);"
);

fs.writeFileSync(file, code);
console.log("Patched Remediation cache");

