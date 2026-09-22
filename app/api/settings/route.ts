import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, isLocalSyntheticUser } from "@/lib/workspaces/authenticated-client";

type Language = "en" | "fr";
type SettingsSection = "profile" | "organization" | "preferences";

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function language(value: unknown): Language {
  return value === "fr" ? "fr" : "en";
}

function workspaceIdFrom(metadata: Record<string, unknown>) {
  return text(record(metadata.normcore_onboarding).workspace_creation_id);
}

function publicSettings(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
  last_sign_in_at?: string;
}) {
  const metadata = record(user.user_metadata);
  const onboarding = record(metadata.normcore_onboarding);
  const organization = record(onboarding.organization ?? metadata.normcore_onboarding_organization);
  const environment = record(onboarding.operating_environment ?? metadata.operating_environment);
  const owner = record(onboarding.assessment_owner);
  const preferences = record(metadata.normcore_preferences);
  const email = text(user.email);
  const fullName = text(metadata.full_name) || text(metadata.name) || text(owner.full_name);
  const preferredLanguage = language(preferences.interface_language ?? metadata.language);

  return {
    workspaceId: workspaceIdFrom(metadata),
    profile: {
      fullName,
      email,
      role: text(owner.other_role) || text(owner.role) || text(metadata.role),
      preferredLanguage,
    },
    organization: {
      name: text(onboarding.organization_name) || text(organization.organization_name) || text(metadata.organization_name),
      industry: text(organization.industry) || text(onboarding.industry),
      otherIndustry: text(organization.other_industry) || text(onboarding.other_industry),
      companySize: text(organization.company_size) || text(onboarding.company_size),
      country: text(organization.primary_country) || text(onboarding.primary_country),
      workModel: text(environment.work_model) || text(onboarding.work_model),
      softwareDevelopment: text(environment.software_development) || text(onboarding.software_development),
      assessmentOwner: text(owner.full_name) || fullName,
    },
    security: {
      passwordChangedAt: text(record(metadata.normcore_security).password_changed_at) || null,
      lastSignInAt: user.last_sign_in_at ?? null,
    },
    preferences: {
      interfaceLanguage: preferredLanguage,
      assessmentLanguage: language(preferences.assessment_language),
      emailNotifications: bool(preferences.email_notifications, true),
      assessmentReminders: bool(preferences.assessment_reminders, true),
      aiAssistance: bool(preferences.ai_assistance, true),
      confirmBeforeLeaving: bool(preferences.confirm_before_leaving, false),
    },
  };
}

async function authenticatedRealUser() {
  const { user } = await getCurrentUser();
  if (!user || isLocalSyntheticUser(user)) return null;
  return user;
}

export async function GET() {
  try {
    const user = await authenticatedRealUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const settings = publicSettings(user);
    if (settings.workspaceId) {
      const admin = createAdminClient();
      const { data: workspace, error } = await admin
        .from("workspaces")
        .select("id,name,owner_id")
        .eq("id", settings.workspaceId)
        .maybeSingle();
      if (error) throw error;
      if (!workspace || workspace.owner_id !== user.id) {
        return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
      }
      settings.organization.name = workspace.name || settings.organization.name;
    }

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Could not load settings. Please try again." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await authenticatedRealUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const payload = await request.json() as Record<string, unknown>;
    const section = text(payload.section) as SettingsSection;
    if (!(["profile", "organization", "preferences"] as const).includes(section)) {
      return NextResponse.json({ error: "Invalid settings section" }, { status: 400 });
    }

    const currentMetadata = record(user.user_metadata);
    const nextMetadata = { ...currentMetadata };
    const admin = createAdminClient();

    if (section === "profile") {
      const fullName = text(payload.fullName).slice(0, 120);
      if (!fullName) return NextResponse.json({ error: "Full name is required" }, { status: 400 });
      const preferredLanguage = language(payload.preferredLanguage);
      const onboarding = record(currentMetadata.normcore_onboarding);
      const owner = record(onboarding.assessment_owner);
      const preferences = record(currentMetadata.normcore_preferences);
      const ownerEmail = text(owner.email).toLowerCase();
      nextMetadata.full_name = fullName;
      nextMetadata.name = fullName;
      nextMetadata.language = preferredLanguage;
      nextMetadata.normcore_preferences = { ...preferences, interface_language: preferredLanguage };
      if (!ownerEmail || ownerEmail === user.email?.toLowerCase()) {
        nextMetadata.normcore_onboarding = {
          ...onboarding,
          assessment_owner: { ...owner, full_name: fullName },
        };
      }
    }

    if (section === "organization") {
      const workspaceId = workspaceIdFrom(currentMetadata);
      const name = text(payload.name).slice(0, 160);
      if (!workspaceId || !name) return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
      const { data: workspace, error: workspaceError } = await admin
        .from("workspaces")
        .select("id,owner_id")
        .eq("id", workspaceId)
        .maybeSingle();
      if (workspaceError) throw workspaceError;
      if (!workspace || workspace.owner_id !== user.id) {
        return NextResponse.json({ error: "Workspace access denied" }, { status: 403 });
      }

      const onboarding = record(currentMetadata.normcore_onboarding);
      const organization = record(onboarding.organization ?? currentMetadata.normcore_onboarding_organization);
      const environment = record(onboarding.operating_environment ?? currentMetadata.operating_environment);
      const owner = record(onboarding.assessment_owner);
      const nextOrganization = {
        ...organization,
        organization_name: name,
        industry: text(payload.industry),
        other_industry: text(payload.otherIndustry),
        company_size: text(payload.companySize),
        primary_country: text(payload.country),
      };
      nextMetadata.organization_name = name;
      nextMetadata.organizationName = name;
      nextMetadata.normcore_onboarding_organization = nextOrganization;
      nextMetadata.normcore_onboarding = {
        ...onboarding,
        organization_name: name,
        organization: nextOrganization,
        operating_environment: {
          ...environment,
          work_model: text(payload.workModel),
          software_development: text(payload.softwareDevelopment),
        },
        assessment_owner: {
          ...owner,
          full_name: text(payload.assessmentOwner).slice(0, 120),
        },
      };

      const { error: nameError } = await admin.from("workspaces").update({ name }).eq("id", workspaceId).eq("owner_id", user.id);
      if (nameError) throw nameError;
    }

    if (section === "preferences") {
      const preferences = record(currentMetadata.normcore_preferences);
      const interfaceLanguage = language(payload.interfaceLanguage);
      nextMetadata.language = interfaceLanguage;
      nextMetadata.normcore_preferences = {
        ...preferences,
        interface_language: interfaceLanguage,
        assessment_language: language(payload.assessmentLanguage),
        email_notifications: payload.emailNotifications === true,
        assessment_reminders: payload.assessmentReminders === true,
        ai_assistance: payload.aiAssistance === true,
        confirm_before_leaving: payload.confirmBeforeLeaving === true,
      };
    }

    const { data, error } = await admin.auth.admin.updateUserById(user.id, { user_metadata: nextMetadata });
    if (error || !data.user) throw error ?? new Error("Unable to update user metadata");
    return NextResponse.json(publicSettings(data.user));
  } catch {
    return NextResponse.json({ error: "Could not save changes. Please try again." }, { status: 500 });
  }
}
