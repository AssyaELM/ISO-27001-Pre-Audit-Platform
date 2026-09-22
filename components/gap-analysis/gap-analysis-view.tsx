"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3, Building2, ChevronDown, ChevronRight, CircleHelp,
  ClipboardCheck, ExternalLink, LockKeyhole, Menu, Minus, Monitor,
  Paperclip, PieChart, Search, SlidersHorizontal, UserRound,
} from "lucide-react";
import { useStoredLanguage } from "@/components/language-preference";
import { LanguageToggle } from "@/components/language-toggle";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  deriveGapAnalysis, gapAnalysisMetrics,
  type GapAnalysisItem, type GapAnalysisResponse, type GapAnalysisStatus, type GapAnalysisTheme,
} from "@/lib/assessment/gap-analysis";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { workspaceDisplayName } from "@/lib/workspaces/display-name";
import styles from "./gap-analysis-view.module.css";

type ViewKey = "gaps" | "clarifications" | "applicability";
type UserProfile = { organization: string; name: string; avatar: string; workspaceId: string };
const themeOrder: GapAnalysisTheme[] = ["organizational", "people", "physical", "technological"];
function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function ThemeIcon({ theme, size = 23 }: { theme: GapAnalysisTheme; size?: number }) {
  if (theme === "organizational") return <Building2 size={size} />;
  if (theme === "people") return <UserRound size={size} />;
  if (theme === "physical") return <LockKeyhole size={size} />;
  return <Monitor size={size} />;
}

function answerLabel(answer: string, fr: boolean) {
  const labels: Record<string, { en: string; fr: string }> = {
    implemented: { en: "Implemented", fr: "Implémenté" },
    partially_implemented: { en: "Partially implemented", fr: "Partiellement implémenté" },
    not_implemented: { en: "Not implemented", fr: "Non implémenté" },
    not_sure: { en: "Not sure", fr: "Je ne sais pas" },
    not_applicable: { en: "Not applicable", fr: "Non applicable" },
  };
  return labels[answer]?.[fr ? "fr" : "en"] ?? answer;
}

function statusLabel(status: GapAnalysisStatus, fr: boolean) {
  if (status === "full_gap") return fr ? "Gap complet" : "Full gap";
  if (status === "partial_gap") return fr ? "Gap partiel" : "Partial gap";
  if (status === "clarification_required") return fr ? "Clarification" : "Clarification";
  return fr ? "Applicabilité" : "Applicability";
}

function evidenceLabel(status: GapAnalysisItem["evidenceStatus"], fr: boolean) {
  const labels = {
    not_provided: fr ? "Aucune preuve" : "No evidence",
    provided: fr ? "Preuve fournie" : "Evidence provided",
  } as const;
  return labels[status];
}

export default function GapAnalysisView() {
  const { language } = useStoredLanguage();
  const fr = language === "fr";
  const locale = fr ? "fr" : "en";
  const [profile, setProfile] = useState<UserProfile>({ organization: "", name: "", avatar: "", workspaceId: "" });
  const [items, setItems] = useState<GapAnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [view, setView] = useState<ViewKey>("gaps");
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<"all" | GapAnalysisTheme>("all");
  const [status, setStatus] = useState<"all" | GapAnalysisStatus>("all");
  const [evidence, setEvidence] = useState<"all" | GapAnalysisItem["evidenceStatus"]>("all");
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isSupabaseConfigured()) {
        setError(fr ? "La connexion aux données de l’espace n’est pas configurée." : "Workspace data connection is not configured.");
        setLoading(false);
        return;
      }
      try {
        const { fetchAssessmentData } = await import("@/lib/assessment/client-cache");
        const { workspaceId, metadata, responses } = await fetchAssessmentData();
        const onboarding = asRecord(metadata.normcore_onboarding ?? metadata.normcore_onboarding_organization);
        if (!cancelled) {
          const organization = workspaceDisplayName(metadata);
          const name = typeof metadata.full_name === "string" && metadata.full_name.trim()
            ? metadata.full_name
            : typeof metadata.name === "string" && metadata.name.trim()
              ? metadata.name
              : "";
          const avatar = typeof metadata.avatar_url === "string" ? metadata.avatar_url : "";
          setProfile({ organization, name, avatar, workspaceId });
          setItems(deriveGapAnalysis(responses as unknown as GapAnalysisResponse[], onboarding, locale));
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load Gap Analysis.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [fr, locale]);

  const metrics = useMemo(() => gapAnalysisMetrics(items), [items]);
  const filtered = useMemo(() => items.filter((item) => {
    const visibleView = view === "gaps"
      ? item.status === "full_gap" || item.status === "partial_gap"
      : view === "clarifications" ? item.status === "clarification_required" : item.status === "applicability_review_required";
    const haystack = `${item.controlCode} ${item.controlTitle} ${item.questionId} ${item.question}`.toLocaleLowerCase();
    return visibleView
      && (!query.trim() || haystack.includes(query.trim().toLocaleLowerCase()))
      && (theme === "all" || item.theme === theme)
      && (status === "all" || item.status === status)
      && (evidence === "all" || item.evidenceStatus === evidence);
  }), [items, view, query, theme, status, evidence]);
  const requestedGapId = typeof window === "undefined"
    ? ""
    : new URL(window.location.href).searchParams.get("gap") ?? "";
  const selected = filtered.find((item) => item.id === selectedId)
    ?? filtered.find((item) => item.id === requestedGapId)
    ?? filtered[0];
  const clearFilters = () => { setQuery(""); setTheme("all"); setStatus("all"); setEvidence("all"); };
  const tabCount = (key: ViewKey) => key === "gaps" ? metrics.total : key === "clarifications" ? metrics.clarification : metrics.applicability;

  return <main className={styles.shell}>
    <button className={styles.mobileMenu} onClick={() => setMobileOpen(true)} aria-label={fr ? "Ouvrir la navigation" : "Open navigation"}><Menu size={23} /></button>
    {mobileOpen && <button className={styles.scrim} onClick={() => setMobileOpen(false)} aria-label={fr ? "Fermer la navigation" : "Close navigation"} />}
    <AppSidebar organization={profile.organization} workspaceId={profile.workspaceId} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

    <section className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.breadcrumb}><span>{profile.organization}</span><b>/</b><strong>{fr ? "Analyse des écarts" : "Gap Analysis"}</strong></div>
        <div className={styles.account}><LanguageToggle className={styles.language} /><span className={styles.workspaceState}><i />{fr ? "Espace actif" : "Workspace active"}</span><span className={styles.userName}>{profile.name}</span><ChevronDown size={15} />{profile.avatar ? <Image className={styles.avatarImage} src={profile.avatar} alt="" width={42} height={42} /> : <span className={styles.avatar}>{profile.name.slice(0, 1).toUpperCase() || "N"}</span>}</div>
      </header>

      <section className={styles.board}>
        <header className={styles.boardTitle}><div><h1>{fr ? "Analyse des écarts" : "Gap Analysis"}</h1><p>ISO/IEC 27001:2022</p></div></header>
        {error && <p className={styles.error} role="alert">{error}</p>}

        <section className={styles.kpis} aria-label={fr ? "Indicateurs des écarts" : "Gap metrics"}>
          <article><span className={`${styles.kpiIcon} ${styles.totalIcon}`}><BarChart3 /></span><div><small>{fr ? "Total des gaps" : "Total gaps"}</small><strong>{metrics.total}</strong></div></article>
          <article><span className={`${styles.kpiIcon} ${styles.fullIcon}`}><Minus /></span><div><small>{fr ? "Gaps complets" : "Full gaps"}</small><strong>{metrics.full}</strong></div></article>
          <article><span className={`${styles.kpiIcon} ${styles.partialIcon}`}><PieChart /></span><div><small>{fr ? "Gaps partiels" : "Partial gaps"}</small><strong>{metrics.partial}</strong></div></article>
          <article><span className={`${styles.kpiIcon} ${styles.clarificationIcon}`}><CircleHelp /></span><div><small>{fr ? "Clarification requise" : "Clarification required"}</small><strong>{metrics.clarification}</strong></div></article>
          <article><span className={`${styles.kpiIcon} ${styles.applicabilityIcon}`}><ClipboardCheck /></span><div><small>{fr ? "Revue d’applicabilité" : "Applicability review"}</small><strong>{metrics.applicability}</strong></div></article>
        </section>

        <section className={styles.themeSection} aria-label={fr ? "Écarts par thème" : "Gaps by theme"}>
          <h2>{fr ? "Gaps par thème" : "Gaps by theme"}</h2>
          <div className={styles.themeGrid}>{themeOrder.map((key) => <div className={styles[`theme_${key}`]} key={key}><ThemeIcon theme={key} /><span>{key}</span><strong>{metrics.byTheme[key]}</strong></div>)}</div>
        </section>

        <section className={styles.filters}>
          <label className={styles.search}><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={fr ? "Rechercher un contrôle ou une question" : "Search control or question"} aria-label={fr ? "Rechercher" : "Search"} /></label>
          <label className={styles.select}><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} aria-label={fr ? "Statut" : "Status"}><option value="all">{fr ? "Tous les statuts" : "All statuses"}</option><option value="full_gap">{fr ? "Écart complet" : "Full gap"}</option><option value="partial_gap">{fr ? "Écart partiel" : "Partial gap"}</option><option value="clarification_required">{fr ? "Clarification" : "Clarification"}</option><option value="applicability_review_required">{fr ? "Applicabilité" : "Applicability"}</option></select><ChevronDown size={17} /></label>
          <label className={styles.select}><select value={theme} onChange={(event) => setTheme(event.target.value as typeof theme)} aria-label={fr ? "Thème" : "Theme"}><option value="all">{fr ? "Tous les thèmes" : "All themes"}</option>{themeOrder.map((key) => <option value={key} key={key}>{key}</option>)}</select><ChevronDown size={17} /></label>
          <label className={styles.select}><select value={evidence} onChange={(event) => setEvidence(event.target.value as typeof evidence)} aria-label={fr ? "État des preuves" : "Evidence status"}><option value="all">{fr ? "État des preuves" : "Evidence status"}</option><option value="not_provided">{fr ? "Aucune preuve" : "No evidence"}</option><option value="provided">{fr ? "Fournie" : "Provided"}</option></select><ChevronDown size={17} /></label>
          <button className={styles.clearFilters} onClick={clearFilters}><SlidersHorizontal size={17} />{fr ? "Effacer les filtres" : "Clear filters"}</button>
        </section>

        <section className={styles.analysisArea}>
          <section className={styles.listPanel} aria-label={fr ? "Liste des écarts" : "Gap list"}>
            <div className={styles.tabs}>{(["gaps", "clarifications", "applicability"] as ViewKey[]).map((key) => <button className={view === key ? styles.tabActive : ""} onClick={() => { setView(key); setSelectedId(""); }} key={key}><span>{key === "gaps" ? (fr ? "Vrais gaps" : "True gaps") : key === "clarifications" ? "Clarifications" : (fr ? "Applicabilité" : "Applicability")}</span><b>{tabCount(key)}</b></button>)}</div>
            <div className={styles.rows}>{loading ? <p className={styles.empty}>{fr ? "Chargement…" : "Loading…"}</p> : filtered.length === 0 ? <p className={styles.empty}>{fr ? "Aucun élément à afficher." : "No items to display."}</p> : filtered.map((item) => <button className={`${styles.gapRow} ${selected?.id === item.id ? styles.rowSelected : ""}`} key={item.id} onClick={() => setSelectedId(item.id)}>
              <span className={styles.rowIcon}><ThemeIcon theme={item.theme} /></span>
              <span className={styles.rowText}><strong>{item.controlCode}  {item.controlTitle}</strong><small>{item.theme}</small><em>{item.question}</em></span>
              <span className={styles.rowMeta}><span className={`${styles.statusBadge} ${styles[item.status]}`}>{statusLabel(item.status, fr)}</span><small><Paperclip size={15} />{evidenceLabel(item.evidenceStatus, fr)}</small></span>
              <ChevronRight className={styles.chevron} size={21} />
            </button>)}</div>
          </section>

          <section className={styles.detailPanel} aria-live="polite">
            {!selected ? <p className={styles.empty}>{fr ? "Sélectionnez un élément pour afficher son détail." : "Select an item to view its details."}</p> : <>
              <header className={styles.detailHeader}><span className={styles.detailIcon}><ThemeIcon theme={selected.theme} size={27} /></span><div><h2>{selected.controlCode} {selected.controlTitle}</h2><div><span className={styles.themeBadge}>{selected.theme}</span><span className={`${styles.statusBadge} ${styles[selected.status]}`}>{statusLabel(selected.status, fr)}</span></div></div></header>
              <dl className={styles.details}>
                <div><dt>{fr ? "Question" : "Question"}</dt><dd>{selected.question}</dd></div>
                <div><dt>{fr ? "État actuel" : "Current state"}</dt><dd>{answerLabel(selected.answer, fr)}</dd></div>
                {selected.gapCode && <div><dt>{fr ? "Code d’écart" : "Gap code"}</dt><dd><code>{selected.gapCode}</code></dd></div>}
                {selected.diagnostic && <div><dt>{fr ? "Gap identifié" : "Gap identified"}</dt><dd>{selected.diagnostic}</dd></div>}
                {selected.remediation && <div><dt>{fr ? "Remédiation recommandée" : "Recommended remediation"}</dt><dd>{selected.remediation}</dd></div>}
                <div><dt>{fr ? "État des preuves" : "Evidence status"}</dt><dd><span className={`${styles.evidenceBadge} ${styles[`evidence_${selected.evidenceStatus}`]}`}>{evidenceLabel(selected.evidenceStatus, fr)}</span>{selected.evidenceStatus === "not_provided" && <span className={styles.evidenceNote}>{fr ? "Aucune preuve jointe" : "No evidence attached"}</span>}</dd></div>
              </dl>
              <footer className={styles.detailActions}><Link prefetch={true} href={selected.href}><ExternalLink size={17} />{fr ? "Voir le contrôle" : "View control"}</Link></footer>
            </>}
          </section>
        </section>
      </section>
    </section>
  </main>;
}
