import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { readOnboardingSummary, resolvePostAuthDestination } from "@/lib/auth/destination";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";
import { buildBrowserWorkspaceMetadata, buildWorkspaceState } from "@/lib/workspaces/workspace-metadata";
import { accessRequestStatusForUser, blockedAccessMessage } from "@/lib/auth/access-request";

type LoginBody = {
  email?: string;
  password?: string;
  nextPath?: string;
};

const localAuthCookie = "normcore-local-auth";
const localAuthEmailCookie = "normcore-local-auth-email";
const localWorkspaceMetadataCookie = "normcore-local-workspace-metadata";

function isNetworkFailure(error: unknown) {
  return error instanceof Error && (error.message === "fetch failed" || error.message.includes("fetch failed"));
}

function applyLocalAuth(response: NextResponse, email: string) {
  response.cookies.set(localAuthCookie, "1", { path: "/", sameSite: "lax" });
  response.cookies.set(localAuthEmailCookie, email, { path: "/", sameSite: "lax" });
  return response;
}

function applyWorkspaceMetadataCookie(response: NextResponse, metadata: Record<string, unknown>) {
  response.cookies.set(localWorkspaceMetadataCookie, encodeURIComponent(JSON.stringify(metadata)), { path: "/", sameSite: "lax" });
  return response;
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 0) continue;
    const key = decodeURIComponent(trimmed.slice(0, separator));
    if (key !== name) continue;
    return decodeURIComponent(trimmed.slice(separator + 1));
  }
  return "";
}

function parseMetadataCookie(request: Request) {
  const raw = readCookie(request, localWorkspaceMetadataCookie);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const metadata = parsed as Record<string, unknown>;
    const onboarding = typeof metadata.normcore_onboarding === "object" && metadata.normcore_onboarding !== null && !Array.isArray(metadata.normcore_onboarding)
      ? metadata.normcore_onboarding as Record<string, unknown>
      : {};
    const owner = typeof onboarding.assessment_owner === "object" && onboarding.assessment_owner !== null && !Array.isArray(onboarding.assessment_owner)
      ? onboarding.assessment_owner as Record<string, unknown>
      : {};
    const storedEmail = String(metadata.email ?? owner.email ?? "").trim().toLowerCase();
    const requestedEmail = readCookie(request, localAuthEmailCookie).trim().toLowerCase();
    if (!requestedEmail || !storedEmail || requestedEmail !== storedEmail) return {};
    return metadata;
  } catch {
    return {};
  }
}

async function findUserByEmail(email: string) {
  const adminClient = createAdminClient();
  const pageSize = 100;
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: pageSize });
    if (error) throw error;
    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) {
      console.info("[NormCore auth] admin lookup hit", {
        email,
        userId: user.id,
        metadataKeys: user.user_metadata ? Object.keys(user.user_metadata as Record<string, unknown>) : [],
      });
      return user;
    }
    if (data.users.length < pageSize) break;
  }
  console.info("[NormCore auth] admin lookup miss", { email });
  return null;
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase Auth is not configured." }, { status: 503 });
  }

  let body: LoginBody;
  try {
    body = await request.json() as LoginBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  try {
    const collectedCookies: Array<{ name: string; value: string; options?: any }> = [];

    const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
      cookies: {
        getAll() {
          return request.headers.get("cookie")
            ?.split(";")
            .map((entry) => entry.trim())
            .filter(Boolean)
            .map((entry) => {
              const index = entry.indexOf("=");
              return { name: decodeURIComponent(entry.slice(0, index)), value: decodeURIComponent(entry.slice(index + 1)) };
            }) ?? [];
        },
        setAll(cookiesToSet) {
          collectedCookies.push(...cookiesToSet);
        },
      },
    });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      if (isNetworkFailure(error)) {
        let metadata = parseMetadataCookie(request);
        try {
          const user = await findUserByEmail(email);
          if (user) {
            metadata = buildBrowserWorkspaceMetadata(user.user_metadata, user.email ?? email, user.user_metadata?.full_name ? String(user.user_metadata.full_name) : (user.email ?? email).split("@")[0]);
          }
        } catch (lookupError) {
          console.info("[NormCore auth] admin lookup failed", {
            email,
            message: lookupError instanceof Error ? lookupError.message : String(lookupError),
          });
        }
        if (!Object.keys(metadata).length) {
          return NextResponse.json({ error: "Authentication service is temporarily unavailable." }, { status: 503 });
        }
        const summary = readOnboardingSummary(metadata);
        const workspaceState = buildWorkspaceState(metadata, email, String((metadata.full_name as string | undefined) || email.split("@")[0]));
        console.info("[NormCore auth] local fallback", {
          userId: null,
          email,
          source: "local-cookie",
          normcore_onboarding: metadata,
          completed: summary.completed,
          workspace_creation_id: summary.workspaceCreationId,
          current_onboarding_step: summary.currentScreen,
          destination: resolvePostAuthDestination(body.nextPath, metadata),
        });
        const response = applyLocalAuth(NextResponse.json({
          ok: true,
          destination: resolvePostAuthDestination(body.nextPath, metadata),
          offlineFallback: true,
          metadata: workspaceState,
        }), email);
        return applyWorkspaceMetadataCookie(response, metadata);
      }
      return NextResponse.json({ error: error?.message ?? "Unable to sign in." }, { status: 401 });
    }

    const browserMetadata = buildBrowserWorkspaceMetadata(
      data.user.user_metadata,
      data.user.email ?? email,
      String((data.user.user_metadata as Record<string, unknown> | undefined)?.full_name ?? data.user.email ?? email).trim() || (data.user.email ?? email).split("@")[0],
    );
    const workspaceState = buildWorkspaceState(
      data.user.user_metadata,
      data.user.email ?? email,
      String((data.user.user_metadata as Record<string, unknown> | undefined)?.full_name ?? data.user.email ?? email).trim() || (data.user.email ?? email).split("@")[0],
    );
    const summary = readOnboardingSummary(data.user?.user_metadata);
    const { data: platformAdmin } = await createAdminClient()
      .from("platform_admins")
      .select("role,active")
      .eq("user_id", data.user.id)
      .maybeSingle();
    const isSuperAdmin = platformAdmin?.role === "super_admin" && platformAdmin.active === true;
    const accessStatus = isSuperAdmin ? "legacy" : await accessRequestStatusForUser(data.user);
    if (accessStatus === "pending" || accessStatus === "rejected") {
      return NextResponse.json({
        error: blockedAccessMessage(accessStatus),
        accessStatus,
        destination: `/access-status?status=${accessStatus}`,
      }, { status: 403 });
    }
    const destination = isSuperAdmin
      ? "/super-admin/dashboard"
      : resolvePostAuthDestination(body.nextPath, data.user?.user_metadata);
    console.info("[NormCore auth] supabase session", {
      userId: data.user.id,
      email: data.user.email ?? email,
      source: "supabase-session",
      normcore_onboarding: data.user.user_metadata?.normcore_onboarding ?? {},
      completed: summary.completed,
      workspace_creation_id: summary.workspaceCreationId,
      current_onboarding_step: summary.currentScreen,
      destination,
    });

    const response = NextResponse.json({
      ok: true,
      destination,
      offlineFallback: false,
      metadata: workspaceState,
    });
    collectedCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    applyLocalAuth(response, email);
    return applyWorkspaceMetadataCookie(response, browserMetadata);
  } catch (error) {
    if (isNetworkFailure(error)) {
      let metadata = parseMetadataCookie(request);
      try {
        const user = await findUserByEmail(email);
        if (user) {
          metadata = buildBrowserWorkspaceMetadata(user.user_metadata, user.email ?? email, user.user_metadata?.full_name ? String(user.user_metadata.full_name) : (user.email ?? email).split("@")[0]);
        }
      } catch (lookupError) {
        console.info("[NormCore auth] admin lookup failed", {
          email,
          message: lookupError instanceof Error ? lookupError.message : String(lookupError),
        });
      }
      if (!Object.keys(metadata).length) {
        return NextResponse.json({ error: "Authentication service is temporarily unavailable." }, { status: 503 });
      }
      const summary = readOnboardingSummary(metadata);
      const workspaceState = buildWorkspaceState(metadata, email, String((metadata.full_name as string | undefined) || email.split("@")[0]));
      console.info("[NormCore auth] network fallback", {
        userId: null,
        email,
        source: "local-cookie",
        normcore_onboarding: metadata,
        completed: summary.completed,
        workspace_creation_id: summary.workspaceCreationId,
        current_onboarding_step: summary.currentScreen,
        destination: resolvePostAuthDestination(body.nextPath, metadata),
      });
      const response = applyLocalAuth(NextResponse.json({
        ok: true,
        destination: resolvePostAuthDestination(body.nextPath, metadata),
        offlineFallback: true,
        metadata: workspaceState,
      }), email);
      return applyWorkspaceMetadataCookie(response, metadata);
    }
    const message = error instanceof Error ? error.message : "Unable to sign in.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
