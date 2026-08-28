import fs from 'fs';

const env = fs.readFileSync(".env.local", "utf8");
const envVars = Object.fromEntries(
  env.split(/\r?\n/)
    .filter(l => l && !l.startsWith("#"))
    .map(l => l.split("="))
);

const url = envVars.NEXT_PUBLIC_SUPABASE_URL + '/auth/v1/admin/users';
const key = envVars.SUPABASE_SERVICE_ROLE_KEY;

async function setup() {
  for (const email of ["usera@qa.com", "userb@qa.com"]) {
    console.log("Creating", email);
    const req = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      })
    });
    const res = await req.json();
    console.log(res);
  }
}
setup();
