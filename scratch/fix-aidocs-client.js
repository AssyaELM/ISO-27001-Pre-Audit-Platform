const fs = require("fs");
const file = "components/ai-documents/ai-documents-page.tsx";
let code = fs.readFileSync(file, "utf8");

code = code.replace(
  "export function AiDocumentsPage() {",
  `export function AiDocumentsPage({ initialWorkspaceId, initialDocuments }: { initialWorkspaceId?: string; initialDocuments?: AiDocumentUiEntry[] }) {`
);

code = code.replace(
  "const [loading, setLoading] = useState(!globalDocumentsCache);",
  "const [loading, setLoading] = useState(!globalDocumentsCache && (!initialDocuments || initialDocuments.length === 0));"
);

code = code.replace(
  "const [documents, setDocuments] = useState<AiDocumentUiEntry[]>(globalDocumentsCache || []);",
  "const [documents, setDocuments] = useState<AiDocumentUiEntry[]>(globalDocumentsCache || initialDocuments || []);"
);

code = code.replace(
  "const [user, setUser] = useState<UserContext>({ workspaceId: globalWorkspaceId || \"\", organization: \"\", name: \"\" });",
  "const [user, setUser] = useState<UserContext>({ workspaceId: globalWorkspaceId || initialWorkspaceId || \"\", organization: \"\", name: \"\" });"
);

code = code.replace(
  "if (next.workspaceId) globalWorkspaceId = next.workspaceId;",
  "if (next.workspaceId) { globalWorkspaceId = next.workspaceId; if (!initialWorkspaceId && !globalDocumentsCache) setLoading(true); }"
);

fs.writeFileSync(file, code);

