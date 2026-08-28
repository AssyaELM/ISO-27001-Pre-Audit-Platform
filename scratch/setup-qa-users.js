import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setup() {
  console.log("Setting up QA users...");
  
  for (const email of ["usera@qa.com", "userb@qa.com"]) {
    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      password: "QaPassword123!",
      email_confirm: true,
      user_metadata: {
        full_name: `QA ${email}`,
        normcore_onboarding: {
          completed: true,
          workspace_creation_id: `qa-workspace-${email.split('@')[0]}`,
          organization_name: `QA Org ${email}`,
          assessment_owner: { full_name: `Owner ${email}` }
        }
      }
    });
    if (error && error.status !== 422) {
      console.error(`Error creating ${email}:`, error);
    } else {
      console.log(`User ${email} created or already exists.`);
    }
  }
}

setup();
