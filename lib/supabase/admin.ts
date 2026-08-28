import dns from "node:dns";
import { createClient } from "@supabase/supabase-js";

import { supabaseUrl } from "./config.ts";

dns.setDefaultResultOrder("ipv4first");

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase Evidence service credentials are not configured");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
