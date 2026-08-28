import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();
assert(email, "Usage: node --env-file=.env.local scripts/provision-super-admin.mjs <existing-user-email>");
assert(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY, "Supabase service environment is required");
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
let matchedUser = null;
for (let page = 1; page <= 20; page += 1) {
  const result = await admin.auth.admin.listUsers({ page, perPage: 100 });
  if (result.error) throw result.error;
  matchedUser = result.data.users.find((user) => user.email?.toLowerCase() === email) ?? null;
  if (matchedUser || result.data.users.length < 100) break;
}
assert(matchedUser, `No existing Supabase user found for ${email}`);
const result = await admin.from("platform_admins").upsert({ user_id: matchedUser.id, role: "super_admin", active: true }, { onConflict: "user_id" });
if (result.error) throw result.error;
console.log(`Super Admin role provisioned for user ${matchedUser.id}.`);
