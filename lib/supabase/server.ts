import dns from "node:dns";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers.js";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "./config.ts";

// Keep Supabase requests on the working IPv4 path for this Node process only.
// This does not change operating-system, DNS, or machine network settings.
dns.setDefaultResultOrder("ipv4first");

export async function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase Auth is not configured.");
  }

  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const authorization = requestHeaders.get("authorization");

  // Integration clients authenticate API requests with an explicit Bearer token.
  // Supabase SSR reads browser sessions from cookies, so use the regular client
  // for this API-only path to make auth.getUser() resolve that bearer session.
  if (authorization?.startsWith("Bearer ")) {
    return createSupabaseClient(supabaseUrl, supabasePublishableKey, {
      global: { headers: { Authorization: authorization } },
    });
  }

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot always write cookies. proxy.ts refreshes them.
        }
      },
    },
  });
}
