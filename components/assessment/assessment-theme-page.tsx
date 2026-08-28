"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useStoredLanguage } from "@/components/language-preference";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { workspaceDisplayName } from "@/lib/workspaces/display-name";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  deriveOrganizationalPresentationFromOnboarding,
  isOrganizationalControlId,
  organizationalStartHref,
} from "@/lib/assessment/organizational-presentation";
import styles from "./assessment-theme-page.module.css";

type ThemeKey = "organizational" | "people" | "physical" | "technological";
type Response = {
  theme: ThemeKey;
  controlId: string;
  questionId: string;
  answer: "implemented" | "partially_implemented" | "not_implemented" | "not_sure" | "not_applicable";
  justification: string | null;
  answerSetAt: string;
};
type Theme = {
  key: ThemeKey;
  en: string;
  fr: string;
  annex: string;
  firstHref: string | null;
  icon: string;
};
type ThemeState = { count: number; href: string | null; progress: number | null };

const themes: Theme[] = [
  { key: "organizational", en: "Organizational Controls", fr: "Contrôles organisationnels", annex: "ISO/IEC 27001:2022 — Annex A.5", firstHref: organizationalStartHref(), icon: "/gen-assets/assessment-icon-building.png" },
  { key: "people", en: "People Controls", fr: "Contrôles liés aux personnes", annex: "ISO/IEC 27001:2022 — Annex A.6", firstHref: "/assessment/people/a6-1", icon: "/gen-assets/assessment-icon-person.png" },
  { key: "physical", en: "Physical Controls", fr: "Contrôles physiques", annex: "ISO/IEC 27001:2022 — Annex A.7", firstHref: "/assessment/physical/a7-1", icon: "/gen-assets/assessment-icon-lock.png" },
  { key: "technological", en: "Technological Controls", fr: "Contrôles technologiques", annex: "ISO/IEC 27001:2022 — Annex A.8", firstHref: "/assessment/technological/a8-1", icon: "/gen-assets/assessment-icon-monitor.png" },
];

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function AssessmentThemePage() {
  const { language } = useStoredLanguage();
  const french = language === "fr";
  const [organization, setOrganization] = useState("");
  const [profileName, setProfileName] = useState("");
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [onboarding, setOnboarding] = useState<Record<string, unknown>>({});
  const [responses, setResponses] = useState<Response[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isSupabaseConfigured()) {
        setReady(true);
        return;
      }
      try {
        const { fetchAssessmentData } = await import("@/lib/assessment/client-cache");
        const { workspaceId, metadata, responses } = await fetchAssessmentData();
        const onboarding = asRecord(metadata.normcore_onboarding);
        const owner = asRecord(onboarding.assessment_owner);
        if (!cancelled) {
          setOrganization(workspaceDisplayName(metadata));
          setProfileName(asString(owner.full_name) || asString(metadata.full_name) || asString(metadata.name) || asString(metadata.email));
          setWorkspaceReady(Boolean(workspaceId));
          setOnboarding(onboarding);
          setResponses(responses as unknown as Response[]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const themeStates = useMemo(() => {
    const organizational = deriveOrganizationalPresentationFromOnboarding(
      onboarding,
      responses.filter((row: Response) => row.theme === "organizational" && isOrganizationalControlId(row.controlId)).map((row: Response) => ({
        controlId: row.controlId,
        questionId: row.questionId,
        answer: row.answer,
        justification: row.justification,
        answeredAt: row.answerSetAt,
      })),
    );
    return new Map<ThemeKey, ThemeState>(themes.map((theme): [ThemeKey, ThemeState] => {
    const rows = responses.filter((row: Response) => row.theme === theme.key);
    if (theme.key === "organizational") {
      return [theme.key, {
        count: organizational.startedControls.length,
        href: organizational.startedControls.length ? organizational.continueHref : organizational.startHref,
        progress: organizational.progress,
      }];
    }
    const latest = [...rows].sort((left: Response, right: Response) => Date.parse(right.answerSetAt) - Date.parse(left.answerSetAt))[0];
    const expectedPrefix = theme.key === "people" ? "a6-" : theme.key === "physical" ? "a7-" : "a8-";
    const href = theme.firstHref && latest?.controlId?.startsWith(expectedPrefix)
      ? `/assessment/${theme.key}/${latest.controlId}`
      : theme.firstHref;
    return [theme.key, { count: rows.length, href, progress: null }];
  }));
  }, [onboarding, responses]);

  const organizationLabel = organization;
  const profileInitial = profileName.charAt(0).toUpperCase();
  return (
    <main className={styles.shell}>
      <AppSidebar organization={organizationLabel} workspaceId={workspaceReady ? "ready" : ""} />

      <section className={styles.content}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}><span>{organizationLabel}</span><b>/</b><strong>{french ? "Évaluation" : "Assessment"}</strong></div>
          <div className={styles.profileTools}>
            <span className={styles.language}>EN / FR</span>
            <span className={styles.workspaceStatus}><i />{workspaceReady ? (french ? "Espace actif" : "Workspace active") : (french ? "Configuration" : "Setup")}</span>
            {profileName && <span className={styles.profileName}>{profileName}</span>}
            {profileInitial && <span className={styles.avatar}>{profileInitial}</span>}
          </div>
        </header>

        <section className={styles.panel}>
          <h1>{french ? "Évaluation ISO 27001" : "ISO 27001 Assessment"}</h1>
          <p>{french ? "Choisissez un thème de contrôle pour démarrer ou poursuivre votre évaluation." : "Choose a control theme to start or continue your assessment."}</p>
          <small>{french ? "Les thèmes peuvent être évalués dans n’importe quel ordre." : "You can complete the control themes in any order."}</small>
          <div className={styles.grid}>
            {themes.map((theme) => {
              const state = themeStates.get(theme.key) ?? { count: 0, href: theme.firstHref, progress: null };
              const started = state.count > 0;
              const status = started ? (french ? "En cours" : "In progress") : (french ? "Non commencé" : "Not started");
              const statusWithProgress = theme.key === "organizational" && started && state.progress !== null
                ? `${status} · ${state.progress}%`
                : status;
              const action = started ? (french ? "Continuer" : "Continue") : (french ? "Démarrer" : "Start");
              const cardContent = <><Image src={theme.icon} width={78} height={78} alt="" /><div className={styles.cardBody}><h2>{french ? theme.fr : theme.en}</h2><p>{theme.annex}</p><span className={started ? styles.progress : styles.notStarted}>{statusWithProgress}</span></div><span className={state.href ? styles.action : styles.unavailable}>{state.href ? action : (french ? "Indisponible" : "Unavailable")}</span></>;
              return state.href
                ? <Link prefetch={true} key={theme.key} href={state.href} className={styles.card}>{cardContent}</Link>
                : <article key={theme.key} className={styles.card}>{cardContent}</article>;
            })}
          </div>
          {!ready && <p className={styles.loading}>{french ? "Chargement des données réelles…" : "Loading live data…"}</p>}
        </section>
      </section>
    </main>
  );
}
