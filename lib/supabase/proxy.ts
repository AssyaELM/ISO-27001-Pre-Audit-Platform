import dns from "node:dns";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "./config";
import { isOnboardingComplete } from "@/lib/auth/destination";

dns.setDefaultResultOrder("ipv4first");

const protectedRoutes = [
  "/dashboard", "/onboarding", "/set-new-password", "/super-admin", "/assessment",
  "/evidence-room", "/ai-documents", "/ai-usage", "/gap-analysis", "/remediation-plan",
];
const publicApiRoutes = ["/api/auth/", "/api/activation/verify", "/api/activation/password"];
const localAuthCookie = "normcore-local-auth";
const localAuthEmailCookie = "normcore-local-auth-email";
const localWorkspaceMetadataCookie = "normcore-local-workspace-metadata";

function parseMetadataCookie(request: NextRequest) {
  const raw = request.cookies.get(localWorkspaceMetadataCookie)?.value ?? "";
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const metadata = parsed as Record<string, unknown>;
    const onboarding = typeof metadata.normcore_onboarding === "object" && metadata.normcore_onboarding !== null && !Array.isArray(metadata.normcore_onboarding)
      ? metadata.normcore_onboarding as Record<string, unknown>
      : {};
    const owner = typeof onboarding.assessment_owner === "object" && onboarding.assessment_owner !== null && !Array.isArray(onboarding.assessment_owner)
      ? onboarding.assessment_owner as Record<string, unknown>
      : {};
    const storedEmail = String(metadata.email ?? owner.email ?? "").trim().toLowerCase();
    const requestedEmail = request.cookies.get(localAuthEmailCookie)?.value.trim().toLowerCase() ?? "";
    if (!requestedEmail || !storedEmail || requestedEmail !== storedEmail) return {};
    return metadata;
  } catch {
    return {};
  }
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) return response;

  const authorization = request.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : undefined;
  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    global: bearer ? { headers: { Authorization: `Bearer ${bearer}` } } : undefined,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data, error } = await supabase.auth.getUser(bearer);
  // If the network-backed user lookup is temporarily unavailable, an already
  // established Supabase session still contains the signed-in user metadata.
  // Use it for routing so a valid browser session is not sent back to login.
  let authenticatedUser = data.user ?? null;
  if (!authenticatedUser) {
    try {
      authenticatedUser = (await supabase.auth.getSession()).data.session?.user ?? null;
    } catch {
      authenticatedUser = null;
    }
  }
  const isProductApi = request.nextUrl.pathname.startsWith("/api/")
    && !publicApiRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
    && !request.nextUrl.pathname.startsWith("/api/super-admin/");
  const isProtected = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route)) || isProductApi;
  const hasLocalAuth = request.cookies.get(localAuthCookie)?.value === "1";
  const onboardingComplete = isOnboardingComplete(authenticatedUser?.user_metadata ?? parseMetadataCookie(request));
  let isSuperAdmin = false;
  let accessRequestStatus: string = "legacy";
  let accessStatusError = false;
  if (authenticatedUser) {
    const sessionToken = bearer ?? (await supabase.auth.getSession()).data.session?.access_token;
    const authorizationClient = sessionToken ? createSupabaseClient(supabaseUrl, supabasePublishableKey, {
      global: { headers: { Authorization: `Bearer ${sessionToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }) : supabase;
    const [{ data: roleResult }, { data: accessResult, error: accessError }] = await Promise.all([
      authorizationClient.rpc("current_user_is_super_admin"),
      authorizationClient.rpc("current_user_access_request_status"),
    ]);
    isSuperAdmin = roleResult === true;
    accessRequestStatus = typeof accessResult === "string" ? accessResult : "legacy";
    accessStatusError = Boolean(accessError);
  }

  if (isProtected && !hasLocalAuth && !authenticatedUser && error) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (request.nextUrl.pathname.startsWith("/super-admin") && (!authenticatedUser || !isSuperAdmin)) {
    const deniedUrl = request.nextUrl.clone();
    deniedUrl.pathname = authenticatedUser ? "/dashboard" : "/login";
    deniedUrl.search = authenticatedUser ? "" : `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(deniedUrl);
  }

  if (!isSuperAdmin && authenticatedUser && isProtected && accessStatusError) {
    if (isProductApi) return NextResponse.json({ error: "Unable to verify product access." }, { status: 503 });
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("error", "access_verification_failed");
    return NextResponse.redirect(loginUrl);
  }

  if (!isSuperAdmin && authenticatedUser && isProtected && (accessRequestStatus === "pending" || accessRequestStatus === "rejected")) {
    if (isProductApi) {
      return NextResponse.json({
        error: accessRequestStatus === "pending" ? "Your access request is awaiting approval." : "Your access request was not approved.",
        accessStatus: accessRequestStatus,
      }, { status: 403 });
    }
    const blockedUrl = request.nextUrl.clone();
    blockedUrl.pathname = "/access-status";
    blockedUrl.search = `?status=${accessRequestStatus}`;
    return NextResponse.redirect(blockedUrl);
  }

  if (isSuperAdmin && (request.nextUrl.pathname === "/dashboard" || request.nextUrl.pathname === "/onboarding")) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/super-admin/dashboard";
    adminUrl.search = "";
    return NextResponse.redirect(adminUrl);
  }

  if (!isSuperAdmin && isProtected && onboardingComplete && request.nextUrl.pathname === "/onboarding") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  if (!isSuperAdmin && isProtected && !onboardingComplete && request.nextUrl.pathname !== "/onboarding" && request.nextUrl.pathname !== "/set-new-password") {
    const onboardingUrl = request.nextUrl.clone();
    onboardingUrl.pathname = "/onboarding";
    onboardingUrl.search = "";
    return NextResponse.redirect(onboardingUrl);
  }

  return response;
}
