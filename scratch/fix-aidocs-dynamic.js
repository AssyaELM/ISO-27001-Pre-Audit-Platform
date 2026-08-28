const fs = require("fs");
const file = "app/ai-documents/[documentType]/page.tsx";
const code = `import { AiDocumentsPage } from "@/components/ai-documents/ai-documents-page";
import { getDocumentsData } from "@/app/api/ai-documents/route";
import { createClient } from "@/lib/supabase/server";

export default async function Page({ params }: { params: Promise<{ documentType: string }> }) {
  const { documentType } = await params;
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return <AiDocumentsPage documentType={documentType} initialWorkspaceId="" initialDocuments={[]} />;
  }
  const workspaceId = user.user_metadata?.normcore_onboarding?.workspace_creation_id as string;
  let initialDocuments = [];
  try {
    if (workspaceId) {
      initialDocuments = await getDocumentsData(workspaceId);
    }
  } catch (e) {
    console.error("Failed to load initial documents:", e);
  }
  
  return <AiDocumentsPage documentType={documentType} initialWorkspaceId={workspaceId || ""} initialDocuments={initialDocuments} />;
}
`;
fs.writeFileSync(file, code);

