"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { NormCoreLogo } from "@/components/branding/normcore-logo";
import { useRouter } from "next/navigation";
import { useStoredLanguage } from "@/components/language-preference";
import {
  getCountryOptions,
  assessmentOwnerRoles,
  assessmentScopeOptions,
  industries,
  onboardingCopy,
  organizationSizes,
  remainingOnboardingCopy,
  softwareDevelopmentOptions,
  workModelOptions,
  type AssessmentOwnerRoleId,
  type AssessmentScopeId,
  type IndustryId,
  type OrganizationSize,
  type SoftwareDevelopmentId,
  type WorkModelId,
} from "@/content/onboarding";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { validateWorkEmail } from "@/lib/onboarding/email";
import { ensureWorkspaceIdentity } from "@/lib/onboarding/workspace";
import { MockupCrop } from "./mockup-crop";
import softwareDevelopmentImage from "@/design/onboarding-remaining/assets/software-development.png";
import workModelImage from "@/design/onboarding-remaining/assets/work-model.png";
import assessmentCoverageImage from "@/design/onboarding-remaining/assets/assessment-coverage.png";
import ownerInformationImage from "@/design/onboarding-remaining/assets/owner-information.png";

const storageKey = "normcore-onboarding-organization-v1";
const organizationMockup = "/onboarding-assets/organization.png";
const companySizeMockup = "/onboarding-assets/company-size-unselected.png";
const countryMockup = "/onboarding-assets/primary-country.png";
const industryMockup = "/onboarding-assets/industry.png";

type OrganizationState = {
  organizationName: string;
  companySize: OrganizationSize | "";
  companySizeSelectedByUser: boolean;
  countryCode: string;
  industryId: IndustryId | "";
  otherIndustry: string;
  softwareDevelopment: SoftwareDevelopmentId | "";
  workModel: WorkModelId | "";
  assessmentScope: AssessmentScopeId | "";
  scopeName: string;
  scopeDescription: string;
  ownerName: string;
  ownerEmail: string;
  ownerRole: AssessmentOwnerRoleId | "";
  otherOwnerRole: string;
  workspaceCreationId: string;
  workspaceCreatedAt: string;
  currentScreen: number;
  completed: boolean;
};

const initialState: OrganizationState = {
  organizationName: "",
  companySize: "",
  companySizeSelectedByUser: false,
  countryCode: "",
  industryId: "",
  otherIndustry: "",
  softwareDevelopment: "",
  workModel: "",
  assessmentScope: "",
  scopeName: "",
  scopeDescription: "",
  ownerName: "",
  ownerEmail: "",
  ownerRole: "",
  otherOwnerRole: "",
  workspaceCreationId: "",
  workspaceCreatedAt: "",
  currentScreen: 0,
  completed: false,
};

const companyArtwork = [
  { x: 337, y: 368, width: 276, height: 145 },
  { x: 653, y: 368, width: 276, height: 145 },
  { x: 971, y: 368, width: 276, height: 145 },
  { x: 337, y: 602, width: 276, height: 145 },
  { x: 653, y: 602, width: 276, height: 145 },
  { x: 971, y: 602, width: 276, height: 145 },
] as const;

const industryArtwork = [
  { x: 102, y: 446, width: 107, height: 77 },
  { x: 521, y: 446, width: 94, height: 77 },
  { x: 102, y: 542, width: 107, height: 77 },
  { x: 521, y: 542, width: 94, height: 77 },
  { x: 102, y: 632, width: 107, height: 77 },
  { x: 521, y: 632, width: 94, height: 77 },
  { x: 102, y: 723, width: 107, height: 77 },
  { x: 521, y: 723, width: 94, height: 77 },
] as const;

function isSavedState(value: unknown): value is Partial<OrganizationState> {
  return typeof value === "object" && value !== null;
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function string(value: unknown) {
  return typeof value === "string" ? value : "";
}

function savedState(value: unknown): Partial<OrganizationState> {
  const root = record(value);
  const organization = record(root.organization);
  const environment = record(root.operating_environment);
  const scope = record(root.assessment_scope);
  const owner = record(root.assessment_owner);
  const currentScreen = Number(root.current_screen);
  return {
    organizationName: string(organization.organization_name),
    companySize: string(organization.company_size) as OrganizationSize | "",
    companySizeSelectedByUser: organization.company_size_selected_by_user === true,
    countryCode: string(organization.primary_country),
    industryId: string(organization.industry) as IndustryId | "",
    otherIndustry: string(organization.other_industry),
    softwareDevelopment: string(environment.software_development) as SoftwareDevelopmentId | "",
    workModel: string(environment.work_model) as WorkModelId | "",
    assessmentScope: string(scope.coverage) as AssessmentScopeId | "",
    scopeName: string(scope.scope_name),
    scopeDescription: string(scope.description),
    ownerName: string(owner.full_name),
    ownerEmail: string(owner.email),
    ownerRole: string(owner.role) as AssessmentOwnerRoleId | "",
    otherOwnerRole: string(owner.other_role),
    workspaceCreationId: string(root.workspace_creation_id),
    workspaceCreatedAt: string(root.workspace_created_at),
    currentScreen: Number.isFinite(currentScreen) ? Math.min(8, Math.max(0, currentScreen)) : 0,
    completed: root.completed === true,
  };
}

function readLocalState(key: string): Partial<OrganizationState> {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) ?? "{}");
    return isSavedState(parsed) ? parsed : {};
  } catch {
    window.localStorage.removeItem(key);
    return {};
  }
}

function localAuthEmail() {
  try {
    return window.localStorage.getItem("normcore-local-auth-email")?.trim().toLowerCase() ?? "";
  } catch {
    return "";
  }
}

function normalizeCountrySearch(value: string, language: "en" | "fr") {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase(language)
    .trim();
}

function getScopeName(state: OrganizationState, language: "en" | "fr") {
  if (state.assessmentScope === "entire") {
    return `${state.organizationName} — ${language === "fr" ? "Toute l’organisation" : "Entire organization"}`;
  }
  return state.scopeName.trim();
}

export function OrganizationOnboarding() {
  const router = useRouter();
  const { language } = useStoredLanguage();
  const copy = onboardingCopy[language];
  const remainingCopy = remainingOnboardingCopy[language];
  const [state, setState] = useState<OrganizationState>(initialState);
  const [accountStorageKey, setAccountStorageKey] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [profileStatus, setProfileStatus] = useState<"idle" | "loading" | "success" | "empty" | "error">("idle");
  const [saving, setSaving] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [industryOpen, setIndustryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const [industryQuery, setIndustryQuery] = useState("");
  const [activeCountryIndex, setActiveCountryIndex] = useState(-1);
  const countrySelectRef = useRef<HTMLDivElement>(null);
  const countryButtonRef = useRef<HTMLButtonElement>(null);
  const industrySelectRef = useRef<HTMLDivElement>(null);
  const industryButtonRef = useRef<HTMLButtonElement>(null);

  const countries = useMemo(() => getCountryOptions(language), [language]);
  const filteredCountries = useMemo(() => {
    const query = normalizeCountrySearch(countryQuery, language);
    if (!query) return countries;
    return countries.filter((country) => normalizeCountrySearch(country.label, language).startsWith(query));
  }, [countries, countryQuery, language]);
  const filteredIndustries = useMemo(() => {
    const query = industryQuery.trim().toLocaleLowerCase(language);
    if (!query) return industries;
    return industries.filter((industry) => industry[language].toLocaleLowerCase(language).includes(query));
  }, [industryQuery, language]);

  const selectedCountry = countries.find((country) => country.code === state.countryCode);
  const selectedIndustry = industries.find((industry) => industry.id === state.industryId);
  const selectedSoftwareDevelopment = softwareDevelopmentOptions.find((option) => option.id === state.softwareDevelopment);
  const selectedWorkModel = workModelOptions.find((option) => option.id === state.workModel);
  const selectedAssessmentScope = assessmentScopeOptions.find((option) => option.id === state.assessmentScope);
  const selectedOwnerRole = assessmentOwnerRoles.find((option) => option.id === state.ownerRole);
  const workEmailValidation = validateWorkEmail(state.ownerEmail);
  const globalStep = state.currentScreen <= 3 ? 1 : state.currentScreen <= 5 ? 2 : Math.min(5, state.currentScreen - 3);

  useEffect(() => {
    if (ready) return;
    let cancelled = false;

    async function restoreOnboarding() {
      if (!isSupabaseConfigured()) {
        if (!cancelled) setState((current) => ({ ...current, ...readLocalState(storageKey) }));
        setProfileStatus("empty");
        setReady(true);
        return;
      }

      setProfileStatus("loading");
      try {
        const client = createClient();
        const { data: sessionData, error: profileError } = await client.auth.getSession();
        if (cancelled) return;
        if (profileError) throw profileError;
        const user = sessionData.session?.user || (await client.auth.getUser()).data.user;
        if (!user) throw new Error("Authentication required");

        const fullName = String(user.user_metadata?.full_name ?? "").trim();
        const email = String(user.email ?? "").trim();
        const userId = user.id ?? "";
        const userStorageKey = userId ? `${storageKey}:${userId}` : email ? `${storageKey}:${email}` : storageKey;
        const remote = savedState(user.user_metadata?.normcore_onboarding);
        if (remote.completed) {
          router.replace("/dashboard");
          return;
        }
        const local = readLocalState(userStorageKey);
        setAccountStorageKey(userStorageKey);
        setState((current) => ({
          ...current,
          ...local,
          ...remote,
          ownerName: remote.ownerName || fullName || local.ownerName || current.ownerName,
          ownerEmail: email || remote.ownerEmail || local.ownerEmail || current.ownerEmail,
        }));
        setProfileStatus(fullName && email ? "success" : "empty");
      } catch {
        if (!cancelled) {
          const email = localAuthEmail();
          const accountKey = email ? `${storageKey}:${email}` : storageKey;
          const local = readLocalState(accountKey);
          setAccountStorageKey(accountKey);
          setState((current) => ({ ...current, ...local, ownerEmail: local.ownerEmail || email }));
          setProfileStatus("error");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void restoreOnboarding();
    return () => {
      cancelled = true;
    };
  }, [ready, router]);

  useEffect(() => {
    if (!ready) return;
    if (accountStorageKey) window.localStorage.setItem(accountStorageKey, JSON.stringify(state));
    if (state.ownerEmail) window.localStorage.setItem(`${storageKey}:${state.ownerEmail.toLowerCase()}`, JSON.stringify(state));
  }, [accountStorageKey, ready, state]);

  useEffect(() => {
    if (!ready) return;

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      document.querySelector<HTMLElement>(".onboarding-stage")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.querySelector<HTMLElement>(".onboarding-size-layout")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [ready, state.currentScreen]);

  useEffect(() => {
    if (!countryOpen || activeCountryIndex < 0) return;
    const option = document.querySelector<HTMLElement>(`[data-country-index="${activeCountryIndex}"]`);
    option?.scrollIntoView({ block: "nearest" });
  }, [activeCountryIndex, countryOpen, filteredCountries]);

  useEffect(() => {
    if (!countryOpen && !industryOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (countryOpen && target instanceof Node && !countrySelectRef.current?.contains(target)) {
        setCountryOpen(false);
      }
      if (target instanceof Node && !industrySelectRef.current?.contains(target)) {
        setIndustryOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (countryOpen) {
        setCountryOpen(false);
        countryButtonRef.current?.focus();
      }
      setIndustryOpen(false);
      if (industryOpen) industryButtonRef.current?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [countryOpen, industryOpen]);

  function updateState(update: Partial<OrganizationState>) {
    setState((current) => ({ ...current, ...update, completed: false }));
    setError("");
    setNotice("");
  }

  function openCountryMenu(position: "first" | "last" | "selected" = "selected") {
    setCountryQuery("");
    setCountryOpen(true);
    const selectedIndex = countries.findIndex((country) => country.code === state.countryCode);
    if (position === "last") setActiveCountryIndex(countries.length - 1);
    else if (position === "selected" && selectedIndex >= 0) setActiveCountryIndex(selectedIndex);
    else setActiveCountryIndex(0);
  }

  function closeCountryMenu() {
    setCountryOpen(false);
    setCountryQuery("");
    setActiveCountryIndex(-1);
    countryButtonRef.current?.focus();
  }

  function selectCountry(code: string) {
    updateState({ countryCode: code });
    closeCountryMenu();
  }

  function handleCountrySearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeCountryMenu();
      return;
    }

    if (!filteredCountries.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveCountryIndex((current) => current < 0 ? 0 : (current + 1) % filteredCountries.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveCountryIndex((current) => current <= 0 ? filteredCountries.length - 1 : current - 1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const country = filteredCountries[activeCountryIndex >= 0 ? activeCountryIndex : 0];
      if (country) selectCountry(country.code);
    }
  }

  async function syncProgress(nextState: OrganizationState) {
    if (accountStorageKey) window.localStorage.setItem(accountStorageKey, JSON.stringify(nextState));
    if (nextState.ownerEmail) window.localStorage.setItem(`${storageKey}:${nextState.ownerEmail.toLowerCase()}`, JSON.stringify(nextState));
    if (!isSupabaseConfigured()) return true;

    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getClaims();
      if (!data?.claims?.sub) return false;
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          normcore_onboarding_organization: {
            organization_name: nextState.organizationName,
            company_size: nextState.companySize,
            company_size_selected_by_user: nextState.companySizeSelectedByUser,
            primary_country: nextState.countryCode,
            industry: nextState.industryId,
            other_industry: nextState.otherIndustry,
            completed: nextState.currentScreen > 3 || nextState.completed,
          },
          normcore_onboarding: {
            organization: {
              organization_name: nextState.organizationName,
              company_size: nextState.companySize,
              primary_country: nextState.countryCode,
              industry: nextState.industryId,
              other_industry: nextState.otherIndustry,
            },
            operating_environment: {
              software_development: nextState.softwareDevelopment,
              work_model: nextState.workModel,
            },
            assessment_scope: {
              coverage: nextState.assessmentScope,
              scope_name: getScopeName(nextState, language),
              description: nextState.scopeDescription,
            },
            assessment_owner: {
              full_name: nextState.ownerName,
              email: nextState.ownerEmail,
              role: nextState.ownerRole,
              other_role: nextState.otherOwnerRole,
            },
            workspace_creation_id: nextState.workspaceCreationId || null,
            workspace_created_at: nextState.workspaceCreatedAt || null,
            current_screen: nextState.currentScreen,
            completed: nextState.completed,
            completed_at: nextState.completed ? new Date().toISOString() : null,
          },
        },
      });
      if (updateError) throw updateError;
      if (nextState.workspaceCreationId) {
        await fetch("/api/workspaces/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: nextState.workspaceCreationId,
            currentScreen: nextState.currentScreen,
            completed: nextState.completed,
          }),
        });
      }
      return true;
    } catch {
      // Local persistence remains available if the network is temporarily unavailable.
      return false;
    }
  }

  async function ensureWorkspace(workspaceId: string, name: string) {
    if (!isSupabaseConfigured()) return true;
    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) return false;
      const { data: existing, error: readError } = await supabase
        .from("workspaces")
        .select("id, owner_id")
        .eq("id", workspaceId)
        .maybeSingle();
      if (readError) throw readError;
      if (existing && existing.owner_id !== userData.user.id) return false;
      if (!existing) {
        const { error: insertError } = await supabase.from("workspaces").insert({
          id: workspaceId,
          name: name.trim() || "Workspace",
          owner_id: userData.user.id,
        });
        if (insertError) throw insertError;
      }
      return true;
    } catch {
      return false;
    }
  }

  function currentValueIsValid() {
    if (state.currentScreen === 0) return Boolean(state.organizationName.trim());
    if (state.currentScreen === 1) return Boolean(state.companySize && state.companySizeSelectedByUser);
    if (state.currentScreen === 2) return Boolean(state.countryCode);
    if (state.currentScreen === 3) return Boolean(state.industryId && (state.industryId !== "other" || state.otherIndustry.trim()));
    if (state.currentScreen === 4) return Boolean(state.softwareDevelopment);
    if (state.currentScreen === 5) return Boolean(state.workModel);
    if (state.currentScreen === 6) {
      if (!state.assessmentScope) return false;
      if (["product", "business-unit", "location"].includes(state.assessmentScope)) {
        return Boolean(state.scopeName.trim() && state.scopeDescription.trim());
      }
      return true;
    }
    if (state.currentScreen === 7) {
      return Boolean(
        state.ownerName.trim()
        && workEmailValidation.valid
        && state.ownerRole
        && (state.ownerRole !== "other" || state.otherOwnerRole.trim()),
      );
    }
    if (state.currentScreen === 8) return workEmailValidation.valid;
    return true;
  }

  async function handleContinue() {
    if (!currentValueIsValid()) {
      setError(state.currentScreen <= 3 ? copy.required : remainingCopy.required);
      return;
    }

    if (state.currentScreen === 7 || state.currentScreen === 8) {
      const validation = validateWorkEmail(state.ownerEmail);
      if (!validation.valid) {
        setEmailError(remainingCopy.owner.invalidEmail);
        return;
      }

      try {
        const response = await fetch("/api/onboarding/validate-email", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: validation.normalized }),
        });
        const serverValidation: unknown = await response.json();
        if (!response.ok || typeof serverValidation !== "object" || serverValidation === null || !("valid" in serverValidation) || serverValidation.valid !== true) {
          setEmailError(remainingCopy.owner.invalidEmail);
          return;
        }
        if (validation.normalized !== state.ownerEmail) {
          setState((current) => ({ ...current, ownerEmail: validation.normalized }));
        }
        setEmailError("");
      } catch {
        setEmailError(remainingCopy.saveError);
        return;
      }
    }

    if (state.currentScreen < 8) {
      const nextScreen = state.currentScreen + 1;
      const nextState = {
        ...state,
        ownerEmail: state.currentScreen === 7 ? validateWorkEmail(state.ownerEmail).normalized : state.ownerEmail,
        currentScreen: nextScreen,
      };
      setError("");
      setNotice("");
      if (nextScreen === 2) {
        setCountryOpen(false);
        setCountryQuery("");
      }
      if (nextScreen === 3) {
        setIndustryOpen(false);
        setIndustryQuery("");
      }
      setState(nextState);
      const synchronized = await syncProgress(nextState);
      if (!synchronized && isSupabaseConfigured()) setNotice(remainingCopy.saveError);
      return;
    }

    if (state.completed && state.workspaceCreationId) {
      router.push("/dashboard");
      return;
    }

    setSaving(true);
    const workspaceIdentity = ensureWorkspaceIdentity(
      state,
      () => window.crypto.randomUUID(),
      () => new Date().toISOString(),
    );
    const nextState = {
      ...state,
      ownerEmail: workEmailValidation.normalized,
      ...workspaceIdentity,
      completed: true,
    };
    setState(nextState);
    const workspaceEnsured = await ensureWorkspace(nextState.workspaceCreationId, nextState.organizationName);
    if (!workspaceEnsured) {
      setSaving(false);
      setError(remainingCopy.saveError);
      return;
    }
    const synchronized = await syncProgress(nextState);
    setSaving(false);
    if (synchronized) {
      setNotice(remainingCopy.workspaceCreated);
      setState(nextState);
      router.push("/dashboard");
    } else {
      setError(remainingCopy.saveError);
    }
  }

  async function handleBack() {
    if (state.currentScreen === 0) {
      await syncProgress(state);
      router.push("/");
      return;
    }

    const nextScreen = state.currentScreen - 1;
    // Never downgrade a completed onboarding. If the user somehow reached this
    // path after finishing onboarding, preserve completed=true so that Supabase
    // is not overwritten with false.
    const nextState = { ...state, currentScreen: nextScreen, completed: state.completed ? true : false };
    setError("");
    setNotice("");
    if (nextScreen === 2) setCountryOpen(false);
    if (nextScreen === 3) {
      setIndustryOpen(false);
      setIndustryQuery("");
    }
    setState(nextState);
    await syncProgress(nextState);
  }

  async function handleSaveAndExit() {
    const synchronized = await syncProgress(state);
    if (!synchronized && isSupabaseConfigured()) {
      setNotice(remainingCopy.saveError);
      return;
    }
    router.push("/");
  }

  return (
    <main className="onboarding-page" aria-busy={!ready}>
      <header className="onboarding-header">
        <button className="onboarding-logo" type="button" onClick={() => router.push("/")} aria-label="NormCore home">
          <NormCoreLogo width={190} height={52} priority />
        </button>

        <div className="onboarding-global-progress" aria-label={remainingCopy.step(globalStep)}>
          <div className="onboarding-progress-bars" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((step) => (
              <span key={step} className={step < globalStep ? "is-complete" : step === globalStep ? "is-active" : ""} />
            ))}
          </div>
          <div className="onboarding-progress-label">
            <strong>{remainingCopy.step(globalStep)}</strong><span aria-hidden="true" />{remainingCopy.steps[globalStep - 1]}
          </div>
        </div>

        <button className="onboarding-save" type="button" onClick={handleSaveAndExit}>
          <MockupCrop src={organizationMockup} x={1393} y={47} width={27} height={27} />
          <span>{remainingCopy.saveAndExit}</span>
        </button>
      </header>

      <section className={`onboarding-stage onboarding-screen-${state.currentScreen + 1}`} aria-labelledby="onboarding-title">
        <div className="onboarding-panel">
          {state.currentScreen === 0 ? (
            <div className="onboarding-split onboarding-organization-layout">
              <MockupCrop
                src={organizationMockup}
                x={106}
                y={191}
                width={558}
                height={586}
                className="onboarding-hero-art"
                alt="A modern organization workspace"
                priority
              />
              <div className="onboarding-form-area">
                <OnboardingStepMarker label={copy.substep(1)} step={1} />
                <h1 id="onboarding-title">{copy.screens.organizationName.title}</h1>
                <label className="onboarding-field">
                  <span>{copy.screens.organizationName.label}</span>
                  <input
                    value={state.organizationName}
                    onChange={(event) => updateState({ organizationName: event.target.value })}
                    type="text"
                    autoComplete="organization"
                    placeholder={copy.screens.organizationName.placeholder}
                    maxLength={160}
                    aria-invalid={Boolean(error)}
                  />
                </label>
              </div>
            </div>
          ) : null}

          {state.currentScreen === 1 ? (
            <div className="onboarding-form-area onboarding-size-layout">
              <OnboardingStepMarker label={copy.substep(2)} step={2} compact />
              <h1 id="onboarding-title">{copy.screens.companySize.title}</h1>
              <p className="onboarding-question">{copy.screens.companySize.question}</p>
              <div className="company-size-grid" role="radiogroup" aria-label={copy.screens.companySize.question}>
                {organizationSizes.map((size, index) => {
                  const artwork = companyArtwork[index];
                  const selected = state.companySizeSelectedByUser && state.companySize === size;
                  return (
                    <button
                      key={size}
                      className={`company-size-option ${selected ? "is-selected" : ""}`}
                      type="button"
                      role="radio"
                      data-company-size={size}
                      aria-checked={selected}
                      onClick={() => updateState({ companySize: size, companySizeSelectedByUser: true })}
                    >
                      <span className="company-size-art-frame">
                        <MockupCrop src={companySizeMockup} {...artwork} className="company-size-art" />
                      </span>
                      <span className="company-size-label">{size}</span>
                      <i className="selection-check" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {state.currentScreen === 2 ? (
            <div className="onboarding-split onboarding-country-layout">
              <MockupCrop
                src={countryMockup}
                x={69}
                y={143}
                width={667}
                height={784}
                className="onboarding-country-art"
                alt="Casablanca, Morocco"
                priority
              />
              <div className="onboarding-form-area">
                <OnboardingStepMarker label={copy.substep(3)} step={3} />
                <h1 id="onboarding-title">{copy.screens.country.title}</h1>
                <p className="onboarding-question">{copy.screens.country.question}</p>
                <div className="onboarding-select-field" ref={countrySelectRef}>
                  <label id="country-label">{copy.screens.country.label} <em>*</em></label>
                  <button
                    ref={countryButtonRef}
                    className={`onboarding-combobox ${countryOpen ? "is-open" : ""}`}
                    type="button"
                    role="combobox"
                    aria-haspopup="listbox"
                    aria-labelledby="country-label"
                    aria-expanded={countryOpen}
                    aria-controls="country-options"
                    onClick={() => countryOpen ? closeCountryMenu() : openCountryMenu()}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                        event.preventDefault();
                        openCountryMenu(event.key === "ArrowUp" ? "last" : "selected");
                        return;
                      }
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        if (countryOpen) closeCountryMenu();
                        else openCountryMenu();
                      }
                    }}
                  >
                    <span className={selectedCountry ? "has-value" : ""}>{selectedCountry?.label ?? copy.screens.country.placeholder}</span>
                    <i aria-hidden="true" />
                  </button>
                  {countryOpen ? (
                    <div className="onboarding-dropdown" id="country-options">
                      <label className="onboarding-search">
                        <span className="onboarding-search-icon" aria-hidden="true" />
                        <input
                          value={countryQuery}
                          onChange={(event) => {
                            setCountryQuery(event.target.value);
                            setActiveCountryIndex(0);
                          }}
                          onKeyDown={handleCountrySearchKeyDown}
                          placeholder={copy.screens.country.placeholder}
                          role="combobox"
                          aria-expanded="true"
                          aria-controls="country-listbox"
                          aria-autocomplete="list"
                          aria-activedescendant={activeCountryIndex >= 0 && filteredCountries[activeCountryIndex]
                            ? `country-option-${filteredCountries[activeCountryIndex].code}`
                            : undefined}
                          autoFocus
                        />
                      </label>
                      <div className="onboarding-options" id="country-listbox" role="listbox" aria-labelledby="country-label">
                        {filteredCountries.map((country) => {
                          const selected = state.countryCode === country.code;
                          const countryIndex = filteredCountries.indexOf(country);
                          return (
                            <button
                              key={country.code}
                              id={`country-option-${country.code}`}
                              className={`${selected ? "is-selected" : ""} ${activeCountryIndex === countryIndex ? "is-active" : ""}`.trim()}
                              type="button"
                              role="option"
                              tabIndex={-1}
                              data-country-code={country.code}
                              data-country-index={countryIndex}
                              aria-selected={selected}
                              onMouseEnter={() => setActiveCountryIndex(countryIndex)}
                              onClick={() => selectCountry(country.code)}
                            >
                              <span>{country.label}</span><i className="option-check" aria-hidden="true" />
                            </button>
                          );
                        })}
                        {!filteredCountries.length ? (
                          <p className="onboarding-no-results" role="status">{copy.screens.country.noResults}</p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {state.currentScreen === 3 ? (
            <div className="onboarding-split onboarding-industry-layout">
              <div className="onboarding-form-area">
                <OnboardingStepMarker label={copy.substep(4)} step={4} />
                <h1 id="onboarding-title">{copy.screens.industry.title}</h1>
                <p className="onboarding-question">{copy.screens.industry.question}</p>
                <div className="onboarding-select-field" ref={industrySelectRef}>
                  <label id="industry-label">{copy.screens.industry.label} <em>*</em></label>
                  <button
                    ref={industryButtonRef}
                    className={`onboarding-combobox ${industryOpen ? "is-open" : ""}`}
                    type="button"
                    role="combobox"
                    aria-haspopup="listbox"
                    aria-labelledby="industry-label"
                    aria-expanded={industryOpen}
                    aria-controls="industry-options"
                    onClick={() => setIndustryOpen((open) => !open)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      setIndustryOpen((open) => !open);
                    }}
                  >
                    <span className={selectedIndustry ? "has-value" : ""}>{selectedIndustry?.[language] ?? copy.screens.industry.placeholder}</span>
                    <i aria-hidden="true" />
                  </button>
                  {industryOpen ? (
                    <div className="onboarding-dropdown onboarding-industry-dropdown" id="industry-options">
                      <label className="onboarding-search">
                        <span className="onboarding-search-icon" aria-hidden="true" />
                        <input
                          value={industryQuery}
                          onChange={(event) => setIndustryQuery(event.target.value)}
                          placeholder={copy.screens.industry.placeholder}
                          autoFocus
                        />
                      </label>
                      <div className="industry-options" role="listbox" aria-labelledby="industry-label">
                        {filteredIndustries.map((industry) => {
                          const selected = state.industryId === industry.id;
                          const artwork = industryArtwork[industry.artwork];
                          return (
                            <button
                              key={industry.id}
                              className={selected ? "is-selected" : ""}
                              type="button"
                              role="option"
                              data-industry-id={industry.id}
                              aria-selected={selected}
                              onClick={() => {
                                updateState({
                                  industryId: industry.id,
                                  otherIndustry: industry.id === "other" ? state.otherIndustry : "",
                                });
                                setIndustryOpen(false);
                                setIndustryQuery("");
                                industryButtonRef.current?.focus();
                              }}
                            >
                              <MockupCrop src={industryMockup} {...artwork} className="industry-option-art" />
                              <span>{industry[language]}</span><i className="option-check" aria-hidden="true" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
                {state.industryId === "other" ? (
                  <label className="onboarding-field onboarding-other-field">
                    <span>{copy.screens.industry.otherLabel} *</span>
                    <input
                      value={state.otherIndustry}
                      onChange={(event) => updateState({ otherIndustry: event.target.value })}
                      type="text"
                      maxLength={120}
                      required
                      aria-required="true"
                      aria-invalid={Boolean(error && !state.otherIndustry.trim())}
                    />
                  </label>
                ) : null}
              </div>
              <MockupCrop
                src={industryMockup}
                x={978}
                y={236}
                width={539}
                height={568}
                className="onboarding-industry-art"
                alt="Industry data flowing into a readiness dashboard"
              />
            </div>
          ) : null}

          {state.currentScreen === 4 ? (
            <div className="flow-card-body flow-software-body">
              <div className="flow-card-content">
                <FlowStepMarker label={remainingCopy.software.marker} progress={50} />
                <h1 id="onboarding-title">{remainingCopy.software.title}</h1>
                <p className="flow-question">{remainingCopy.software.question}</p>
                <div className="flow-option-list" role="radiogroup" aria-label={remainingCopy.software.question}>
                  {softwareDevelopmentOptions.map((option) => {
                    const selected = state.softwareDevelopment === option.id;
                    return (
                      <button
                        key={option.id}
                        className={`flow-choice ${selected ? "is-selected" : ""}`}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => updateState({ softwareDevelopment: option.id })}
                      >
                        <span className="flow-radio" aria-hidden="true" />
                        <span className="flow-choice-label">{option[language]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flow-visual-panel flow-software-visual">
                <Image src={softwareDevelopmentImage} alt={remainingCopy.software.imageAlt} fill priority sizes="(max-width: 760px) 100vw, 35vw" />
              </div>
            </div>
          ) : null}

          {state.currentScreen === 5 ? (
            <div className="flow-work-layout">
              <div className="flow-work-visual">
                <Image src={workModelImage} alt={remainingCopy.workModel.imageAlt} fill priority sizes="100vw" />
              </div>
              <div className="flow-work-content">
                <FlowStepMarker label={remainingCopy.workModel.marker} progress={100} />
                <h1 id="onboarding-title">{remainingCopy.workModel.title}</h1>
                <p className="flow-question">{remainingCopy.workModel.question}</p>
                <div className="flow-work-options" role="radiogroup" aria-label={remainingCopy.workModel.question}>
                  {workModelOptions.map((option) => {
                    const selected = state.workModel === option.id;
                    return (
                      <button
                        key={option.id}
                        className={`flow-work-choice ${selected ? "is-selected" : ""}`}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => updateState({ workModel: option.id })}
                      >
                        <span className="flow-radio" aria-hidden="true" />
                        <span className="flow-work-label">{option[language].title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {state.currentScreen === 6 ? (
            <div className="flow-card-body flow-scope-body">
              <div className="flow-visual-panel flow-scope-visual">
                <Image src={assessmentCoverageImage} alt={remainingCopy.scope.imageAlt} fill priority sizes="(max-width: 760px) 100vw, 43vw" />
              </div>
              <div className="flow-card-content flow-scroll-content">
                <FlowStepMarker label={remainingCopy.scope.marker} progress={100} />
                <h1 id="onboarding-title">{remainingCopy.scope.title}</h1>
                <p className="flow-question">{remainingCopy.scope.question}</p>
                <div className="flow-option-list flow-scope-options" role="radiogroup" aria-label={remainingCopy.scope.question}>
                  {assessmentScopeOptions.map((option) => {
                    const selected = state.assessmentScope === option.id;
                    return (
                      <button
                        key={option.id}
                        className={`flow-choice flow-choice-with-description ${selected ? "is-selected" : ""}`}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => updateState({
                          assessmentScope: option.id,
                          scopeName: state.assessmentScope === option.id ? state.scopeName : "",
                          scopeDescription: state.assessmentScope === option.id ? state.scopeDescription : "",
                        })}
                      >
                        <span className="flow-radio" aria-hidden="true" />
                        <span className="flow-choice-label">{option[language].title}</span>
                      </button>
                    );
                  })}
                </div>

                {state.assessmentScope === "entire" ? (
                  <div className="flow-scope-summary"><span>{remainingCopy.scope.scopeName}</span><strong>{getScopeName(state, language)}</strong></div>
                ) : null}
                {["product", "business-unit", "location"].includes(state.assessmentScope) ? (
                  <div className="flow-conditional-fields">
                    <label className="flow-field">
                      <span>{state.assessmentScope === "product" ? remainingCopy.scope.productName : state.assessmentScope === "business-unit" ? remainingCopy.scope.businessName : remainingCopy.scope.locationName} *</span>
                      <input
                        value={state.scopeName}
                        onChange={(event) => updateState({ scopeName: event.target.value })}
                        placeholder={state.assessmentScope === "product" ? remainingCopy.scope.productPlaceholder : state.assessmentScope === "business-unit" ? remainingCopy.scope.businessPlaceholder : remainingCopy.scope.locationPlaceholder}
                        maxLength={160}
                      />
                    </label>
                    <label className="flow-field">
                      <span>{remainingCopy.scope.description} *</span>
                      <textarea
                        value={state.scopeDescription}
                        onChange={(event) => updateState({ scopeDescription: event.target.value })}
                        placeholder={remainingCopy.scope.descriptionPlaceholder}
                        maxLength={600}
                      />
                    </label>
                  </div>
                ) : null}
                {state.assessmentScope === "undecided" ? <p className="flow-warning" role="status">{remainingCopy.scope.undecidedWarning}</p> : null}
              </div>
            </div>
          ) : null}

          {state.currentScreen === 7 ? (
            <div className="flow-card-body flow-owner-body">
              <div className="flow-visual-panel flow-owner-visual">
                <Image src={ownerInformationImage} alt={remainingCopy.owner.imageAlt} fill priority sizes="(max-width: 760px) 100vw, 36vw" />
              </div>
              <div className="flow-card-content">
                <FlowStepMarker label={remainingCopy.owner.marker} progress={100} />
                <p className="flow-question" id="onboarding-title">{remainingCopy.owner.question}</p>
                {profileStatus !== "success" && profileStatus !== "loading" && profileStatus !== "idle" ? (
                  <p className={`flow-backend-state is-${profileStatus}`} role="status">
                    {profileStatus === "empty" ? remainingCopy.profile.empty : remainingCopy.profile.error}
                  </p>
                ) : null}
                <div className="flow-fields">
                  <div className="flow-field-row">
                    <label className="flow-field">
                      <span>{remainingCopy.owner.fullName}</span>
                      <input
                        className={profileStatus === "success" ? "is-readonly" : ""}
                        value={state.ownerName}
                        onChange={(event) => updateState({ ownerName: event.target.value })}
                        placeholder={remainingCopy.owner.namePlaceholder}
                        readOnly={profileStatus === "success"}
                        autoComplete="name"
                        maxLength={120}
                      />
                    </label>
                    <label className="flow-field">
                      <span>{remainingCopy.owner.workEmail}</span>
                      <input
                        className={profileStatus === "success" ? "is-readonly" : ""}
                        value={state.ownerEmail}
                        onChange={(event) => {
                          updateState({ ownerEmail: event.target.value });
                          setEmailError("");
                        }}
                        onBlur={() => {
                          const validation = validateWorkEmail(state.ownerEmail);
                          updateState({ ownerEmail: validation.normalized });
                          setEmailError(validation.valid ? "" : remainingCopy.owner.invalidEmail);
                        }}
                        placeholder={remainingCopy.owner.emailPlaceholder}
                        readOnly={profileStatus === "success"}
                        type="email"
                        autoComplete="email"
                        maxLength={254}
                        aria-invalid={Boolean(emailError)}
                        aria-describedby={emailError ? "owner-email-error" : undefined}
                      />
                      {emailError ? <small id="owner-email-error" className="flow-field-error" role="alert">{emailError}</small> : null}
                    </label>
                  </div>
                  <label className="flow-field flow-select-field">
                    <span>{remainingCopy.owner.role} *</span>
                    <select value={state.ownerRole} onChange={(event) => updateState({ ownerRole: event.target.value as AssessmentOwnerRoleId, otherOwnerRole: event.target.value === "other" ? state.otherOwnerRole : "" })}>
                      <option value="">{remainingCopy.owner.rolePlaceholder}</option>
                      {assessmentOwnerRoles.map((role) => <option key={role.id} value={role.id}>{role[language]}</option>)}
                    </select>
                  </label>
                  {state.ownerRole === "other" ? (
                    <label className="flow-field">
                      <span>{remainingCopy.owner.otherRole} *</span>
                      <input value={state.otherOwnerRole} onChange={(event) => updateState({ otherOwnerRole: event.target.value })} maxLength={120} />
                    </label>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {state.currentScreen === 8 ? (
            <div className="flow-review-content">
              <header className="flow-review-header">
                <div>
                  <FlowStepMarker label={remainingCopy.review.marker} progress={100} />
                  <h1 id="onboarding-title">{remainingCopy.review.title}</h1>
                  <p className="flow-question">{remainingCopy.review.question}</p>
                </div>
                <div className="flow-review-completion"><strong>4 / 4</strong><span>{remainingCopy.review.sectionsComplete}</span></div>
              </header>
              <div className="flow-review-ledger">
                <ReviewRow number="01" title={remainingCopy.review.organization} status={remainingCopy.review.complete} facts={[
                  [remainingCopy.review.name, state.organizationName],
                  [remainingCopy.review.size, state.companySize],
                  [remainingCopy.review.country, selectedCountry?.label ?? state.countryCode],
                  [remainingCopy.review.industry, state.industryId === "other" ? state.otherIndustry : selectedIndustry?.[language] ?? ""],
                ]} />
                <ReviewRow number="02" title={remainingCopy.review.environment} status={remainingCopy.review.complete} facts={[
                  [remainingCopy.review.development, selectedSoftwareDevelopment?.[language] ?? ""],
                  [remainingCopy.review.workModel, selectedWorkModel?.[language].title ?? ""],
                ]} />
                <ReviewRow number="03" title={remainingCopy.review.scope} status={remainingCopy.review.complete} facts={[
                  [remainingCopy.review.coverage, selectedAssessmentScope?.[language].title ?? ""],
                  [remainingCopy.review.scopeName, getScopeName(state, language) || selectedAssessmentScope?.[language].title || ""],
                ]} />
                <ReviewRow number="04" title={remainingCopy.review.owner} status={remainingCopy.review.complete} facts={[
                  [remainingCopy.review.name, state.ownerName],
                  [remainingCopy.review.email, state.ownerEmail],
                  [remainingCopy.review.role, state.ownerRole === "other" ? state.otherOwnerRole : selectedOwnerRole?.[language] ?? ""],
                ]} />
              </div>
            </div>
          ) : null}

          <div className="onboarding-panel-footer">
            <button className="onboarding-back" type="button" onClick={handleBack} disabled={saving}>{state.currentScreen <= 3 ? copy.back : remainingCopy.back}</button>
            <div className="onboarding-status" aria-live="polite">
              {error ? <p className="is-error">{error}</p> : null}
              {notice ? <p>{notice}</p> : null}
            </div>
            <button
              className="onboarding-continue"
              type="button"
              onClick={handleContinue}
              disabled={!ready || !currentValueIsValid() || saving}
            >
              {state.currentScreen === 8
                ? saving ? remainingCopy.creatingWorkspace : state.completed ? remainingCopy.workspaceCreated : remainingCopy.createWorkspace
                : state.currentScreen <= 3 ? copy.continue : remainingCopy.continue}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function OnboardingStepMarker({ label, step, compact = false }: { label: string; step: number; compact?: boolean }) {
  return (
    <div className={`onboarding-step-marker ${compact ? "is-compact" : ""}`}>
      {compact ? <span>{label}</span> : (
        <><div aria-hidden="true"><i className={step >= 1 ? "is-active" : ""} /><i /><i /><i /></div><span>{label}</span></>
      )}
      {compact ? <div aria-hidden="true"><i style={{ width: `${step * 25}%` }} /></div> : null}
    </div>
  );
}

function FlowStepMarker({ label, progress }: { label: string; progress: number }) {
  return (
    <div className="flow-step-marker">
      <span aria-hidden="true"><i style={{ width: `${progress}%` }} /></span>
      <strong>{label}</strong>
    </div>
  );
}

function ReviewRow({ number, title, status, facts }: { number: string; title: string; status: string; facts: Array<readonly [string, string]> }) {
  return (
    <section className="flow-review-row">
      <div className="flow-review-number">{number}</div>
      <h2>{title}</h2>
      <dl className={`flow-review-facts flow-review-facts-${facts.length}`}>
        {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <div className="flow-review-state"><span aria-hidden="true" />{status}</div>
    </section>
  );
}
