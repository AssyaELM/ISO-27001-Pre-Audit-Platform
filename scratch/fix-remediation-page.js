const fs = require("fs");
const file = "app/remediation-plan/page.tsx";
const code = `import type { Metadata } from "next";
import RemediationPlanView from "@/components/remediation/remediation-plan-view";
import { getRemediationData } from "@/app/api/remediation/actions/route";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Remediation Plan | NormCore",
  description: "Active remediation actions derived from the workspace assessment.",
  robots: { index: false, follow: false },
};

export default async function RemediationPlanPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return <RemediationPlanView initialWorkspaceId="" initialActions={[]} initialMembers={[]} />;
  }
  const workspaceId = user.user_metadata?.normcore_onboarding?.workspace_creation_id as string;
  let initialData = { actions: [], members: [] };
  try {
    if (workspaceId) {
      initialData = await getRemediationData(workspaceId);
    }
  } catch (e) {
    console.error("Failed to load initial remediation:", e);
  }
  
  return <RemediationPlanView 
    initialWorkspaceId={workspaceId || ""} 
    initialActions={initialData.actions} 
    initialMembers={initialData.members} 
  />;
}
`;
fs.writeFileSync(file, code);

