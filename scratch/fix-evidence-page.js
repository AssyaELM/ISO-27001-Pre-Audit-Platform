const fs = require("fs");
const file = "app/evidence-room/page.tsx";
const code = `import { EvidenceRoomPage } from "@/components/evidence/evidence-room-page";
import { getEvidenceData } from "@/app/api/evidence/route";
import { createClient } from "@/lib/supabase/server";

export default async function EvidenceRoom() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return <EvidenceRoomPage initialWorkspaceId="" initialEvidence={[]} initialLinks={[]} initialWorkspaceMembers={[]} />;
  }
  const workspaceId = user.user_metadata?.normcore_onboarding?.workspace_creation_id as string;
  let initialData = { evidence: [], links: [], workspaceMembers: [] };
  try {
    if (workspaceId) {
      initialData = await getEvidenceData(workspaceId);
    }
  } catch (e) {
    console.error("Failed to load initial evidence:", e);
  }
  
  return <EvidenceRoomPage 
    initialWorkspaceId={workspaceId || ""} 
    initialEvidence={initialData.evidence} 
    initialLinks={initialData.links} 
    initialWorkspaceMembers={initialData.workspaceMembers} 
  />;
}
`;
fs.writeFileSync(file, code);

