"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Info, LockKeyhole, Menu, Shield, X } from "lucide-react";

import { AppSidebar } from "@/components/navigation/app-sidebar";
import { useStoredLanguage } from "@/components/language-preference";
import { LanguageToggle } from "@/components/language-toggle";
import {
  assessmentOwnerRoles,
  getCountryOptions,
  industries,
  organizationSizes,
  softwareDevelopmentOptions,
  workModelOptions,
} from "@/content/onboarding";
import { createClient } from "@/lib/supabase/client";
import styles from "./client-settings-page.module.css";

type Language = "en" | "fr";
type Tab = "profile" | "organization" | "security" | "preferences";
type Profile = { fullName: string; email: string; role: string; preferredLanguage: Language };
type Organization = {
  name: string;
  industry: string;
  otherIndustry: string;
  companySize: string;
  country: string;
  workModel: string;
  softwareDevelopment: string;
  assessmentOwner: string;
};
type Preferences = {
  interfaceLanguage: Language;
  assessmentLanguage: Language;
  emailNotifications: boolean;
  assessmentReminders: boolean;
  aiAssistance: boolean;
  confirmBeforeLeaving: boolean;
};
type SettingsData = {
  workspaceId: string;
  profile: Profile;
  organization: Organization;
  security: { passwordChangedAt: string | null; lastSignInAt: string | null };
  preferences: Preferences;
};

const emptyData: SettingsData = {
  workspaceId: "",
  profile: { fullName: "", email: "", role: "", preferredLanguage: "en" },
  organization: { name: "", industry: "", otherIndustry: "", companySize: "", country: "", workModel: "", softwareDevelopment: "", assessmentOwner: "" },
  security: { passwordChangedAt: null, lastSignInAt: null },
  preferences: { interfaceLanguage: "en", assessmentLanguage: "en", emailNotifications: true, assessmentReminders: true, aiAssistance: true, confirmBeforeLeaving: false },
};

function initials(name: string, email: string) {
  const source = name.trim() || email.split("@")[0] || "N";
  return source.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function roleLabel(value: string, language: Language) {
  return assessmentOwnerRoles.find((item) => item.id === value)?.[language] ?? value;
}

function formatDate(value: string | null, language: Language, unavailable: string, includeTime = false) {
  if (!value) return unavailable;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return unavailable;
  return new Intl.DateTimeFormat(language, includeTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" }).format(date);
}

function browserName(unavailable: string) {
  if (typeof navigator === "undefined") return unavailable;
  const agent = navigator.userAgent;
  if (agent.includes("Edg/")) return "Microsoft Edge";
  if (agent.includes("Chrome/")) return "Chrome";
  if (agent.includes("Firefox/")) return "Firefox";
  if (agent.includes("Safari/")) return "Safari";
  return unavailable;
}

function deviceName(unavailable: string) {
  if (typeof navigator === "undefined") return unavailable;
  const platform = navigator.userAgent;
  if (platform.includes("Windows")) return "Windows";
  if (platform.includes("Mac OS")) return "macOS";
  if (platform.includes("Android")) return "Android";
  if (/iPhone|iPad/.test(platform)) return "iOS";
  if (platform.includes("Linux")) return "Linux";
  return unavailable;
}

function localizeError(message: string, fr: boolean) {
  if (!fr) return message;
  const translations: Record<string, string> = {
    "Could not load settings. Please try again.": "Impossible de charger les paramètres. Veuillez réessayer.",
    "Could not save changes. Please try again.": "Impossible d’enregistrer les modifications. Veuillez réessayer.",
    "Could not sign out. Please try again.": "Impossible de vous déconnecter. Veuillez réessayer.",
    "Full name is required": "Le nom complet est requis.",
    "Organization name is required": "Le nom de l’organisation est requis.",
    "Workspace access denied": "Accès à l’espace de travail refusé.",
    "Authentication required": "Authentification requise.",
  };
  return translations[message] ?? message;
}

async function readJson(response: Response) {
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Could not save changes. Please try again.");
  return body;
}

export function ClientSettingsPage() {
  const router = useRouter();
  const { language, setLanguage } = useStoredLanguage();
  const fr = language === "fr";
  const copy = fr ? {
    tabs: ["Profil", "Organisation", "Sécurité", "Préférences"], workspace: "Espace de travail", active: "Espace actif", setup: "Configuration", settings: "Paramètres", description: "Gérez votre profil, les informations de votre organisation, la sécurité et les préférences.", closeNavigation: "Fermer la navigation", toggleNavigation: "Ouvrir ou fermer la navigation", notAvailable: "Non disponible", save: "Enregistrer", saving: "Enregistrement…", profileTitle: "Profil", profileSubtitle: "Gérez vos informations personnelles.", fullName: "Nom complet", workEmail: "E-mail professionnel", role: "Rôle", preferredLanguage: "Langue préférée", changesSaved: "Modifications enregistrées", organizationTitle: "Profil de l’organisation", organizationSubtitle: "Gérez les informations de votre organisation utilisées dans NormCore.", organizationName: "Nom de l’organisation", industry: "Secteur d’activité", selectIndustry: "Sélectionner un secteur", companySize: "Taille de l’entreprise", selectCompanySize: "Sélectionner une taille", employees: "employés", primaryCountry: "Pays principal", selectCountry: "Sélectionner un pays", workModel: "Mode de travail", selectWorkModel: "Sélectionner un mode", softwareDevelopment: "Développement logiciel", selectOption: "Sélectionner une option", assessmentOwner: "Responsable de l’évaluation", organizationHint: "Ces informations servent à personnaliser l’évaluation et les documents générés.", organizationSaved: "Informations de l’organisation mises à jour", saveOrganization: "Enregistrer les informations", securityTitle: "Sécurité", securitySubtitle: "Gérez l’accès à votre compte et la sécurité de session.", password: "Mot de passe", lastChanged: "Dernière modification :", changePassword: "Modifier le mot de passe", twoFactor: "Authentification à deux facteurs", notEnabled: "Non activée", comingLater: "Bientôt disponible", setup2fa: "Configurer l’A2F", sessionInformation: "Informations de session", lastSignIn: "Dernière connexion", browser: "Navigateur", device: "Appareil", currentSession: "Session actuelle", activeSession: "Active", signOut: "Se déconnecter", preferencesTitle: "Préférences", preferencesSubtitle: "Choisissez le comportement de NormCore pour votre espace de travail.", interfaceLanguage: "Langue de l’interface", interfaceLanguageDescription: "Langue utilisée dans toute l’interface NormCore", assessmentLanguage: "Langue de l’évaluation", assessmentLanguageDescription: "Langue utilisée pour les questions d’évaluation", emailNotifications: "Notifications par e-mail", emailNotificationsDescription: "Recevez par e-mail les mises à jour importantes de l’espace de travail", assessmentReminders: "Rappels d’évaluation", assessmentRemindersDescription: "Recevez des rappels pour les évaluations inachevées", aiAssistance: "Assistance IA", aiAssistanceDescription: "Activez l’assistance Demander à l’IA dans l’évaluation", confirmBeforeLeaving: "Confirmer avant de quitter une évaluation inachevée", confirmBeforeLeavingDescription: "Évitez la perte accidentelle de progression", preferencesSaved: "Préférences enregistrées", savePreferences: "Enregistrer les préférences", loading: "Chargement des paramètres",
  } : {
    tabs: ["Profile", "Organization", "Security", "Preferences"], workspace: "Workspace", active: "Workspace active", setup: "Setup", settings: "Settings", description: "Manage your profile, organization details, security and preferences.", closeNavigation: "Close navigation", toggleNavigation: "Toggle navigation", notAvailable: "Not available", save: "Save changes", saving: "Saving…", profileTitle: "Profile", profileSubtitle: "Manage your personal information.", fullName: "Full name", workEmail: "Work email", role: "Role", preferredLanguage: "Preferred language", changesSaved: "Changes saved", organizationTitle: "Organization profile", organizationSubtitle: "Manage your organization information used across NormCore.", organizationName: "Organization name", industry: "Industry", selectIndustry: "Select industry", companySize: "Company size", selectCompanySize: "Select company size", employees: "employees", primaryCountry: "Primary country", selectCountry: "Select country", workModel: "Work model", selectWorkModel: "Select work model", softwareDevelopment: "Software development", selectOption: "Select an option", assessmentOwner: "Assessment owner", organizationHint: "These details are used to personalize the assessment and generated documents.", organizationSaved: "Organization details updated", saveOrganization: "Save organization details", securityTitle: "Security", securitySubtitle: "Manage your account access and session security.", password: "Password", lastChanged: "Last changed:", changePassword: "Change password", twoFactor: "Two-factor authentication", notEnabled: "Not enabled", comingLater: "Coming later", setup2fa: "Set up 2FA", sessionInformation: "Session information", lastSignIn: "Last sign-in", browser: "Browser", device: "Device", currentSession: "Current session", activeSession: "Active", signOut: "Sign out", preferencesTitle: "Preferences", preferencesSubtitle: "Choose how NormCore behaves for your workspace.", interfaceLanguage: "Interface language", interfaceLanguageDescription: "Language used across the NormCore interface", assessmentLanguage: "Assessment language", assessmentLanguageDescription: "Language used for assessment questions", emailNotifications: "Email notifications", emailNotificationsDescription: "Receive important workspace updates by email", assessmentReminders: "Assessment reminders", assessmentRemindersDescription: "Get reminders about unfinished assessment work", aiAssistance: "AI assistance", aiAssistanceDescription: "Enable Ask AI assistance in Assessment", confirmBeforeLeaving: "Confirm before leaving an unfinished assessment", confirmBeforeLeavingDescription: "Prevent accidental loss of assessment progress", preferencesSaved: "Preferences saved", savePreferences: "Save preferences", loading: "Loading settings",
  };
  const tabs: { id: Tab; label: string }[] = ["profile", "organization", "security", "preferences"].map((id, index) => ({ id: id as Tab, label: copy.tabs[index] }));
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [data, setData] = useState<SettingsData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Tab | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await readJson(await fetch("/api/settings", { cache: "no-store" })) as unknown as SettingsData;
        if (!cancelled) {
          setData(result);
          setLanguage(result.profile.preferredLanguage);
        }
      } catch (cause) {
        if (!cancelled) setError(localizeError(cause instanceof Error ? cause.message : "Could not load settings. Please try again.", fr));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [fr, setLanguage]);

  function chooseTab(tab: Tab) {
    setActiveTab(tab);
    setFeedback("");
    setError("");
  }

  async function save(section: "profile" | "organization" | "preferences", payload: Record<string, unknown>, success: string) {
    setSaving(section);
    setFeedback("");
    setError("");
    try {
      const result = await readJson(await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, ...payload }),
      })) as unknown as SettingsData;
      setData(result);
      if (section === "profile") setLanguage(result.profile.preferredLanguage);
      if (section === "preferences") setLanguage(result.preferences.interfaceLanguage);
      setFeedback(success);
    } catch (cause) {
      setError(localizeError(cause instanceof Error ? cause.message : "Could not save changes. Please try again.", fr));
    } finally {
      setSaving(null);
    }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    await save("profile", data.profile, copy.changesSaved);
  }

  async function saveOrganization(event: FormEvent) {
    event.preventDefault();
    await save("organization", data.organization, copy.organizationSaved);
  }

  async function savePreferences(event: FormEvent) {
    event.preventDefault();
    await save("preferences", data.preferences, copy.preferencesSaved);
  }

  async function signOut() {
    setError("");
    try {
      await createClient().auth.signOut();
      document.cookie = "normcore-local-auth=; Max-Age=0; path=/";
      document.cookie = "normcore-local-auth-email=; Max-Age=0; path=/";
      document.cookie = "normcore-local-workspace-metadata=; Max-Age=0; path=/";
      router.replace("/login");
      router.refresh();
    } catch {
      setError(localizeError("Could not sign out. Please try again.", fr));
    }
  }

  const displayName = data.profile.fullName || data.profile.email.split("@")[0];
  const countries = getCountryOptions(language);

  return (
    <main className={styles.shell}>
      <AppSidebar organization={data.organization.name} workspaceId={data.workspaceId} mobileOpen={mobileNav} onClose={() => setMobileNav(false)} />
      {mobileNav ? <button className={styles.scrim} aria-label={copy.closeNavigation} onClick={() => setMobileNav(false)} /> : null}
      <section className={styles.content}>
        <header className={styles.topbar}>
          <button className={styles.menuButton} type="button" onClick={() => setMobileNav((open) => !open)} aria-label={copy.toggleNavigation}>{mobileNav ? <X /> : <Menu />}</button>
          <div className={styles.crumb}><span>{data.organization.name || copy.workspace}</span><b>/</b><strong>{copy.settings}</strong></div>
          <div className={styles.account}>
            <LanguageToggle className={styles.language} />
            <span className={styles.workspaceState}><i />{data.workspaceId ? copy.active : copy.setup}</span>
            <span className={styles.userName}>{displayName || data.profile.email}</span>
            <span className={styles.topAvatar}>{initials(displayName, data.profile.email)}</span>
          </div>
        </header>

        <header className={styles.pageHeader}>
          <h1>{copy.settings}</h1>
          <p>{copy.description}</p>
        </header>

        <nav className={styles.tabs} aria-label={copy.settings}>
          {tabs.map((tab) => <button key={tab.id} type="button" className={activeTab === tab.id ? styles.tabActive : ""} onClick={() => chooseTab(tab.id)}>{tab.label}</button>)}
        </nav>

        {error ? <div className={styles.error} role="alert">{error}</div> : null}
        {loading ? <SettingsSkeleton label={copy.loading} /> : null}

        {!loading && activeTab === "profile" ? (
          <form className={styles.panel} onSubmit={saveProfile}>
            <PanelHeading title={copy.profileTitle} subtitle={copy.profileSubtitle} />
            <div className={styles.profileGrid}>
              <div className={styles.avatar}>{initials(data.profile.fullName, data.profile.email)}</div>
              <div className={styles.formGrid}>
                <Field label={copy.fullName}><input required maxLength={120} value={data.profile.fullName} onChange={(event) => setData((current) => ({ ...current, profile: { ...current.profile, fullName: event.target.value } }))} /></Field>
                <Field label={copy.workEmail}><input value={data.profile.email} readOnly aria-readonly="true" /></Field>
                <Field label={copy.role}><input value={roleLabel(data.profile.role, language) || copy.notAvailable} readOnly aria-readonly="true" /></Field>
                <Field label={copy.preferredLanguage}><select value={data.profile.preferredLanguage} onChange={(event) => setData((current) => ({ ...current, profile: { ...current.profile, preferredLanguage: event.target.value as Language } }))}><option value="en">English</option><option value="fr">Français</option></select></Field>
              </div>
            </div>
            <SaveRow feedback={feedback} saving={saving === "profile"} label={copy.save} savingLabel={copy.saving} />
          </form>
        ) : null}

        {!loading && activeTab === "organization" ? (
          <form className={styles.panel} onSubmit={saveOrganization}>
            <PanelHeading title={copy.organizationTitle} subtitle={copy.organizationSubtitle} />
            <div className={styles.formGrid}>
              <Field label={copy.organizationName}><input required maxLength={160} value={data.organization.name} onChange={(event) => setOrganization(setData, "name", event.target.value)} /></Field>
              <Field label={copy.industry}><select value={data.organization.industry} onChange={(event) => setOrganization(setData, "industry", event.target.value)}><option value="">{copy.selectIndustry}</option>{industries.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}</select></Field>
              <Field label={copy.companySize}><select value={data.organization.companySize} onChange={(event) => setOrganization(setData, "companySize", event.target.value)}><option value="">{copy.selectCompanySize}</option>{organizationSizes.map((size) => <option key={size} value={size}>{size} {copy.employees}</option>)}</select></Field>
              <Field label={copy.primaryCountry}><select value={data.organization.country} onChange={(event) => setOrganization(setData, "country", event.target.value)}><option value="">{copy.selectCountry}</option>{countries.map((country) => <option key={country.code} value={country.code}>{country.label}</option>)}</select></Field>
              <Field label={copy.workModel}><select value={data.organization.workModel} onChange={(event) => setOrganization(setData, "workModel", event.target.value)}><option value="">{copy.selectWorkModel}</option>{workModelOptions.map((item) => <option key={item.id} value={item.id}>{item[language].title}</option>)}</select></Field>
              <Field label={copy.softwareDevelopment}><select value={data.organization.softwareDevelopment} onChange={(event) => setOrganization(setData, "softwareDevelopment", event.target.value)}><option value="">{copy.selectOption}</option>{softwareDevelopmentOptions.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}</select></Field>
              <Field label={copy.assessmentOwner}><input maxLength={120} value={data.organization.assessmentOwner} onChange={(event) => setOrganization(setData, "assessmentOwner", event.target.value)} /></Field>
            </div>
            <div className={styles.organizationFooter}><p><Info aria-hidden="true" />{copy.organizationHint}</p><SaveRow feedback={feedback} saving={saving === "organization"} label={copy.saveOrganization} savingLabel={copy.saving} /></div>
          </form>
        ) : null}

        {!loading && activeTab === "security" ? (
          <section className={styles.panel}>
            <PanelHeading title={copy.securityTitle} subtitle={copy.securitySubtitle} />
            <div className={styles.securityRow}><LockKeyhole aria-hidden="true" /><div><h3>{copy.password}</h3><p>{copy.lastChanged} {formatDate(data.security.passwordChangedAt, language, copy.notAvailable)}</p></div><button className={styles.secondaryButton} type="button" onClick={() => router.push("/forgot-password")}>{copy.changePassword}</button></div>
            <div className={styles.securityRow}><Shield aria-hidden="true" /><div><h3>{copy.twoFactor} <span>{copy.notEnabled}</span></h3><p>{copy.comingLater}</p></div><button className={styles.secondaryButton} type="button" disabled>{copy.setup2fa}</button></div>
            <div className={styles.session}>
              <h3>{copy.sessionInformation}</h3>
              <div className={styles.sessionGrid}><DataPoint label={copy.lastSignIn} value={formatDate(data.security.lastSignInAt, language, copy.notAvailable, true)} /><DataPoint label={copy.browser} value={browserName(copy.notAvailable)} /><DataPoint label={copy.device} value={deviceName(copy.notAvailable)} /><DataPoint label={copy.currentSession} value={copy.activeSession} active /></div>
              <button className={styles.secondaryButton} type="button" onClick={signOut}>{copy.signOut}</button>
            </div>
          </section>
        ) : null}

        {!loading && activeTab === "preferences" ? (
          <form className={`${styles.panel} ${styles.preferencesPanel}`} onSubmit={savePreferences}>
            <PanelHeading title={copy.preferencesTitle} subtitle={copy.preferencesSubtitle} />
            <PreferenceRow title={copy.interfaceLanguage} description={copy.interfaceLanguageDescription}><select value={data.preferences.interfaceLanguage} onChange={(event) => setPreference(setData, "interfaceLanguage", event.target.value as Language)}><option value="en">English</option><option value="fr">Français</option></select></PreferenceRow>
            <PreferenceRow title={copy.assessmentLanguage} description={copy.assessmentLanguageDescription}><select value={data.preferences.assessmentLanguage} onChange={(event) => setPreference(setData, "assessmentLanguage", event.target.value as Language)}><option value="en">English</option><option value="fr">Français</option></select></PreferenceRow>
            <PreferenceRow title={copy.emailNotifications} description={copy.emailNotificationsDescription}><Toggle checked={data.preferences.emailNotifications} onChange={(value) => setPreference(setData, "emailNotifications", value)} label={copy.emailNotifications} /></PreferenceRow>
            <PreferenceRow title={copy.assessmentReminders} description={copy.assessmentRemindersDescription}><Toggle checked={data.preferences.assessmentReminders} onChange={(value) => setPreference(setData, "assessmentReminders", value)} label={copy.assessmentReminders} /></PreferenceRow>
            <PreferenceRow title={copy.aiAssistance} description={copy.aiAssistanceDescription}><Toggle checked={data.preferences.aiAssistance} onChange={(value) => setPreference(setData, "aiAssistance", value)} label={copy.aiAssistance} /></PreferenceRow>
            <PreferenceRow title={copy.confirmBeforeLeaving} description={copy.confirmBeforeLeavingDescription}><Toggle checked={data.preferences.confirmBeforeLeaving} onChange={(value) => setPreference(setData, "confirmBeforeLeaving", value)} label={copy.confirmBeforeLeaving} /></PreferenceRow>
            <SaveRow feedback={feedback} saving={saving === "preferences"} label={copy.savePreferences} savingLabel={copy.saving} />
          </form>
        ) : null}
      </section>
    </main>
  );
}

function setOrganization(setData: React.Dispatch<React.SetStateAction<SettingsData>>, key: keyof Organization, value: string) {
  setData((current) => ({ ...current, organization: { ...current.organization, [key]: value } }));
}

function setPreference<K extends keyof Preferences>(setData: React.Dispatch<React.SetStateAction<SettingsData>>, key: K, value: Preferences[K]) {
  setData((current) => ({ ...current, preferences: { ...current.preferences, [key]: value } }));
}

function PanelHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <header className={styles.panelHeading}><h2>{title}</h2><p>{subtitle}</p></header>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className={styles.field}><span>{label}</span>{children}</label>;
}

function SaveRow({ feedback, saving, label, savingLabel }: { feedback: string; saving: boolean; label: string; savingLabel: string }) {
  return <div className={styles.saveRow}>{feedback ? <span className={styles.success}><CheckCircle2 aria-hidden="true" />{feedback}</span> : null}<button className={styles.primaryButton} type="submit" disabled={saving}>{saving ? savingLabel : label}</button></div>;
}

function DataPoint({ label, value, active = false }: { label: string; value: string; active?: boolean }) {
  return <div className={styles.dataPoint}><span>{label}</span><strong className={active ? styles.activeSession : ""}>{active ? <i /> : null}{value}</strong></div>;
}

function PreferenceRow({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div className={styles.preferenceRow}><div><h3>{title}</h3><p>{description}</p></div>{children}</div>;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`${styles.toggle} ${checked ? styles.toggleOn : ""}`} onClick={() => onChange(!checked)}><span /></button>;
}

function SettingsSkeleton({ label }: { label: string }) {
  return <section className={`${styles.panel} ${styles.skeleton}`} aria-label={label}><div /><div /><div /><div /></section>;
}
