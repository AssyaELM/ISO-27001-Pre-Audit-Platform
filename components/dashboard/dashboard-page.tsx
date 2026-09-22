"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, CircleAlert, FileCheck2, ListChecks, ShieldCheck, Upload } from "lucide-react";
import { useStoredLanguage } from "@/components/language-preference";
import { LanguageToggle } from "@/components/language-toggle";
import { createClient } from "@/lib/supabase/client";
import { fetchAssessmentData } from "@/lib/assessment/client-cache";
import { readBrowserWorkspaceContext } from "@/lib/workspaces/browser-context";
import { deriveGapAnalysis, type GapAnalysisResponse } from "@/lib/assessment/gap-analysis";
import { activeRemediationGaps, remediationMetrics, type RemediationAction } from "@/lib/remediation/actions";
import { workspaceDisplayName } from "@/lib/workspaces/display-name";
import { organizationalControls } from "@/content/assessment/organizational/organizational-controls";
import { peopleControls } from "@/content/assessment/people/people-controls";
import { physicalControls } from "@/content/assessment/physical/physical-controls";
import { technologicalControls } from "@/content/assessment/technological/technological-controls.generated";
import type { AssessmentAnswerRecord } from "@/content/assessment-infrastructure";
import { isOnboardingComplete } from "@/lib/auth/destination";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import styles from "./dashboard-page.module.css";

const assets = {
  banner: "/gen-assets/normcore-dashboard-office-v2.png",
  themeBuilding: "/gen-assets/assessment-icon-building.png",
  themePerson: "/gen-assets/assessment-icon-person.png",
  themeLock: "/gen-assets/assessment-icon-lock.png",
  themeMonitor: "/gen-assets/assessment-icon-monitor.png",
} as const;

type DashboardContext = {
  organization: string;
  workspaceId: string;
  profileName: string;
  email: string;
  companySize: string;
  country: string;
  industry: string;
  scope: string;
  sites: string;
  owner: string;
};

type EvidenceItem = {
  id: string;
  updatedAt?: string;
  documentReviewState?: string;
};

type EvidenceLink = { evidenceId: string; linkedAt?: string };
type DashboardDocument = { label: string; status: string; readiness: number; updatedAt: string | null };
type DashboardData = {
  onboarding: Record<string, unknown>;
  responses: AssessmentAnswerRecord[];
  evidence: EvidenceItem[];
  links: EvidenceLink[];
  evidenceMetrics: { providedQuestionCount?: number; linkCount?: number; evidenceCount?: number };
  documents: DashboardDocument[];
  actions: RemediationAction[];
};

const emptyContext: DashboardContext = { organization: "", workspaceId: "", profileName: "", email: "", companySize: "", country: "", industry: "", scope: "", sites: "", owner: "" };
const emptyData: DashboardData = { onboarding: {}, responses: [], evidence: [], links: [], evidenceMetrics: {}, documents: [], actions: [] };

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function localContext(): DashboardContext {
  if (typeof window === "undefined") return emptyContext;
  const local = readBrowserWorkspaceContext();
  return {
    ...emptyContext,
    organization: local.organization,
    workspaceId: local.workspaceId,
    profileName: local.profileName,
    email: local.email,
    companySize: local.companySize,
    country: local.country,
    industry: local.industry,
    scope: local.scope,
    sites: local.sites,
    owner: local.owner,
  };
}

function contextFromMetadata(metadata: unknown, email = ""): DashboardContext {
  const root = record(metadata);
  const onboarding = record(root.normcore_onboarding);
  const organization = record(root.normcore_onboarding_organization);
  const scope = record(onboarding.assessment_scope);
  const owner = record(onboarding.assessment_owner);
  return {
    organization: workspaceDisplayName(metadata),
    workspaceId: text(onboarding.workspace_creation_id),
    profileName: text(owner.full_name) || text(root.full_name) || text(root.name) || email.split("@")[0],
    email,
    companySize: text(onboarding.company_size) || text(organization.company_size),
    country: text(onboarding.primary_country) || text(organization.primary_country),
    industry: text(onboarding.industry) || text(organization.industry) || text(onboarding.other_industry),
    scope: text(scope.scope_name) || text(scope.name) || text(scope.coverage),
    sites: text(onboarding.number_of_sites ?? onboarding.siteCount ?? onboarding.sites),
    owner: text(owner.full_name),
  };
}

async function json<T>(request: Promise<Response>, fallback: T): Promise<T> {
  try {
    const response = await request;
    if (!response.ok) return fallback;
    return await response.json() as T;
  } catch {
    return fallback;
  }
}

function domainKey(theme: string): "organizational" | "people" | "physical" | "technological" | null {
  if (theme === "organizational" || theme === "governance") return "organizational";
  if (theme === "people") return "people";
  if (theme === "physical") return "physical";
  if (theme === "technology" || theme === "technological") return "technological";
  return null;
}

function controlsForDomain(domain: "organizational" | "people" | "physical" | "technological") {
  if (domain === "organizational") return organizationalControls.map((item) => item.id);
  if (domain === "people") return peopleControls.map((item) => item[0]);
  if (domain === "physical") return physicalControls.map((item) => item[0]);
  return technologicalControls.map((item) => item.id);
}

function formatRelative(value: string | null | undefined, language: "en" | "fr") {
  if (!value) return language === "fr" ? "Date inconnue" : "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return language === "fr" ? "Date inconnue" : "Unknown date";
  const days = Math.max(0, Math.floor((Date.now() - date.valueOf()) / 86400000));
  if (days === 0) return language === "fr" ? "Aujourd'hui" : "Today";
  if (days === 1) return language === "fr" ? "Hier" : "Yesterday";
  return language === "fr" ? `Il y a ${days} jours` : `${days} days ago`;
}

function formatCountry(value: string, language: "en" | "fr") {
  if (value === "MA") return language === "fr" ? "Maroc" : "Morocco";
  return value;
}

export function DashboardPage() {
  const { language } = useStoredLanguage();
  const locale = language === "fr" ? "fr" : "en";
  const french = locale === "fr";
  const router = useRouter();
  const [context, setContext] = useState<DashboardContext>(emptyContext);
  const [data, setData] = useState<DashboardData>(emptyData);
  const [ready, setReady] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [now] = useState(() => Date.now());
  // Prevent the guard from triggering multiple redirects on re-render.
  const guardChecked = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const fallback = localContext();
      try {
        const client = createClient();
        const { data: sessionData } = await client.auth.getSession();
        const user = sessionData.session?.user;

        // ── Onboarding guard ─────────────────────────────────────────────
        // Priority: real Supabase session > local fallback.
        // Only redirect once per mount to avoid loops.
        if (!guardChecked.current) {
          guardChecked.current = true;
          if (user) {
            // We have a real Supabase user — trust user_metadata exclusively.
            if (!isOnboardingComplete(user.user_metadata)) {
              if (!cancelled) router.replace("/onboarding");
              return;
            }
          } else {
            // No Supabase session — check local browser context as last-resort fallback.
            const localBrowserContext = readBrowserWorkspaceContext();
            const localOnboarding =
              typeof localBrowserContext.metadata?.normcore_onboarding === "object" &&
              localBrowserContext.metadata?.normcore_onboarding !== null
                ? localBrowserContext.metadata.normcore_onboarding as Record<string, unknown>
                : null;
            const localCompleted = localOnboarding?.completed === true;
            const localWorkspaceId = (localBrowserContext.workspaceId ?? "").trim();
            if (!localCompleted) {
              if (!cancelled) router.replace("/onboarding");
              return;
            }
          }
        }
        // ─────────────────────────────────────────────────────────────────

        const nextContext = user ? contextFromMetadata(user.user_metadata, user.email ?? "") : fallback;
        const workspaceId = nextContext.workspaceId || fallback.workspaceId;
        if (!workspaceId) {
          if (!cancelled) { setContext(nextContext); setReady(true); }
          return;
        }
        const [assessment, evidenceBody, documentBody, remediationBody] = await Promise.all([
          fetchAssessmentData().catch(() => ({ metadata: {}, responses: [] as AssessmentAnswerRecord[] })),
          json(fetch(`/api/evidence?workspaceId=${encodeURIComponent(workspaceId)}`), { evidence: [], links: [], metrics: {} }),
          json(fetch(`/api/ai-documents?workspaceId=${encodeURIComponent(workspaceId)}`), { documents: [] }),
          json(fetch(`/api/remediation/actions?workspaceId=${encodeURIComponent(workspaceId)}&locale=${locale}`), { actions: [] }),
        ]);
        if (!cancelled) {
          setContext({ ...fallback, ...nextContext, workspaceId });
          setData({
            onboarding: assessment.metadata ?? {},
            responses: assessment.responses ?? [],
            evidence: evidenceBody.evidence ?? [],
            links: evidenceBody.links ?? [],
            evidenceMetrics: evidenceBody.metrics ?? {},
            documents: documentBody.documents ?? [],
            actions: remediationBody.actions ?? [],
          });
          setReady(true);
        }
      } catch {
        if (!cancelled) { setContext(fallback); setReady(true); }
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [locale, router]);

  const view = useMemo(() => {
    const allControls = (["organizational", "people", "physical", "technological"] as const).flatMap(controlsForDomain);
    const totalControls = new Set(allControls).size;
    const responseByControl = new Map<string, AssessmentAnswerRecord[]>();
    for (const response of data.responses) {
      const key = `${domainKey(response.theme) ?? response.theme}:${response.controlId}`;
      responseByControl.set(key, [...(responseByControl.get(key) ?? []), response]);
    }
    const assessedControls = new Set(data.responses.filter((response) => response.answer).map((response) => `${domainKey(response.theme) ?? response.theme}:${response.controlId}`));
    const completion = totalControls ? Math.round((assessedControls.size / totalControls) * 100) : 0;
    const gapInputs: GapAnalysisResponse[] = data.responses.map((response) => ({
      theme: response.theme,
      controlId: response.controlId,
      questionId: response.questionId,
      answer: response.answer,
      justification: response.justification,
      hasCanonicalEvidence: response.hasCanonicalEvidence,
    }));
    const gaps = activeRemediationGaps(deriveGapAnalysis(gapInputs, data.onboarding, locale));
    const evidenceQuestions = data.evidenceMetrics.providedQuestionCount ?? 0;
    const evidenceCoverage = data.responses.length ? Math.min(100, Math.round((evidenceQuestions / data.responses.length) * 100)) : 0;
    const remediation = remediationMetrics(data.actions);
    const documentReadiness = data.documents.length ? Math.round(data.documents.reduce((sum, item) => sum + item.readiness, 0) / data.documents.length) : 0;
    const domainReadiness = (["organizational", "people", "physical", "technological"] as const).map((domain) => {
      const expected = controlsForDomain(domain);
      const assessed = expected.filter((controlId) => responseByControl.has(`${domain}:${controlId}`)).length;
      return { domain, value: expected.length ? Math.round((assessed / expected.length) * 100) : 0 };
    });
    const recent = [
      ...data.responses.map((item) => ({ icon: ListChecks, label: french ? "Réponse d'évaluation ajoutée" : "Assessment response added", date: item.updatedAt || item.answerSetAt })),
      ...data.evidence.map((item) => ({ icon: Upload, label: french ? "Preuve mise à jour" : "Evidence uploaded", date: item.updatedAt })),
      ...data.links.map((item) => ({ icon: FileCheck2, label: french ? "Preuve liée à un contrôle" : "Evidence linked to control", date: item.linkedAt })),
      ...data.actions.map((item) => ({ icon: CheckCircle2, label: french ? "Action de remediation mise à jour" : "Remediation action updated", date: item.updatedAt })),
      ...data.documents.map((item) => ({ icon: ShieldCheck, label: french ? `${item.label} mis à jour` : `${item.label} updated`, date: item.updatedAt ?? undefined })),
    ].filter((item) => item.date).sort((a, b) => Date.parse(b.date ?? "") - Date.parse(a.date ?? "")).slice(0, 5);
    const topGaps = gaps.slice().sort((a, b) => Number(b.status === "full_gap") - Number(a.status === "full_gap")).slice(0, 5);
    const unlinkedEvidence = Math.max(0, data.evidence.length - new Set(data.links.map((item) => item.evidenceId)).size);
    const overdueEvidence = data.evidence.filter((item) => item.documentReviewState === "review_overdue").length;
    const dueSoon = data.actions.filter((item) => {
      if (!item.dueDate || item.status === "completed") return false;
      const days = (Date.parse(`${item.dueDate}T00:00:00`) - now) / 86400000;
      return days >= 0 && days <= 14;
    }).length;
    return { totalControls, assessedControls: assessedControls.size, completion, gaps, fullGaps: gaps.filter((item) => item.status === "full_gap").length, partialGaps: gaps.filter((item) => item.status === "partial_gap").length, evidenceQuestions, evidenceCoverage, remediation, documentReadiness, domainReadiness, recent, topGaps, unlinkedEvidence, overdueEvidence, dueSoon, documents: data.documents };
  }, [data, french, locale, now]);

  const profileName = context.profileName || context.email.split("@")[0] || "Workspace owner";
  const initial = profileName.slice(0, 1).toUpperCase() || "N";
  const overdueActionLabel = french
    ? `${view.remediation.overdue} action${view.remediation.overdue === 1 ? "" : "s"} de remédiation en retard`
    : `${view.remediation.overdue} overdue ${countLabel(view.remediation.overdue, "remediation action")}`;
  const kpis = [
    { label: french ? "Complétude de l'évaluation" : "Assessment completion", value: `${view.completion}%`, detail: french ? `${view.assessedControls} contrôles évalués sur ${view.totalControls}` : `${view.assessedControls} of ${view.totalControls} ${countLabel(view.totalControls, "control")} assessed`, tone: "aqua" },
    { label: french ? "Contrôles évalués" : "Controls assessed", value: `${view.assessedControls} / ${view.totalControls}`, detail: french ? "Contrôles avec réponse" : "Controls with a response", tone: "blue" },
    { label: french ? "Écarts ouverts" : "Open gaps", value: String(view.gaps.length), detail: french ? `${view.fullGaps} complets · ${view.partialGaps} partiels` : `${view.fullGaps} full · ${view.partialGaps} partial`, tone: "orange" },
    { label: french ? "Couverture des preuves" : "Evidence coverage", value: `${view.evidenceCoverage}%`, detail: french ? `${view.evidenceQuestions} question${view.evidenceQuestions === 1 ? "" : "s"} liée${view.evidenceQuestions === 1 ? "" : "s"}` : `${view.evidenceQuestions} linked ${countLabel(view.evidenceQuestions, "question")}`, tone: "violet" },
    { label: french ? "Remédiation terminée" : "Remediation completion", value: `${view.remediation.total ? Math.round((view.remediation.completed / view.remediation.total) * 100) : 0}%`, detail: french ? `${view.remediation.completed} action${view.remediation.completed === 1 ? "" : "s"} terminée${view.remediation.completed === 1 ? "" : "s"} sur ${view.remediation.total}` : `${view.remediation.completed} of ${view.remediation.total} completed`, tone: "green" },
    { label: french ? "Préparation documentaire" : "Document readiness", value: `${view.documentReadiness}%`, detail: french ? `${view.documents?.length ?? 0} document${(view.documents?.length ?? 0) === 1 ? "" : "s"} de référence` : `${view.documents?.length ?? 0} canonical ${countLabel(view.documents?.length ?? 0, "document")}`, tone: "teal" },
  ];

  return (
    <main className={styles.shell}>
      <AppSidebar organization={context.organization} workspaceId={context.workspaceId} mobileOpen={mobileNav} onClose={() => setMobileNav(false)} />
      <section className={styles.content}>
        <header className={styles.topbar}>
          <button className={styles.menuButton} type="button" onClick={() => setMobileNav((open) => !open)} aria-label={french ? "Basculer la navigation" : "Toggle navigation"}>Menu</button>
          <div className={styles.crumb}><span>{context.organization}</span><b>/</b><strong>{french ? "Tableau de bord" : "Dashboard"}</strong></div>
          <div className={styles.profileTools}><LanguageToggle className={styles.language} /><span className={styles.workspaceStatus}><i />{context.workspaceId ? (french ? "Espace actif" : "Workspace active") : (french ? "Configuration" : "Setup")}</span><span className={styles.profileName}>{profileName}</span><span className={styles.avatar}>{initial}</span></div>
        </header>

        <section className={styles.hero} style={{ backgroundImage: `url(${assets.banner})` }}>
          <div><h1>{french ? "Bienvenue" : "Welcome back"}, {profileName}</h1><p>{french ? "Pilotez votre espace de conformité ISO 27001." : "Manage your ISO 27001 compliance workspace."}</p><Link prefetch={true} href="/assessment" className={styles.primary}>{french ? "Continuer l'évaluation" : "Continue assessment"}</Link></div>
        </section>

        <section className={styles.kpiGrid} aria-label="Dashboard KPIs">
          {kpis.map((kpi) => <article className={`${styles.kpi} ${styles[kpi.tone]}`} key={kpi.label}><span>{kpi.label}</span><strong>{kpi.value}</strong><small>{kpi.detail}</small></article>)}
        </section>

        <section className={styles.progressGrid}>
          <article className={`${styles.card} ${styles.donutCard}`}><div className={styles.cardHeading}><div><span className={styles.eyebrow}>{french ? "Progression globale" : "Global progress"}</span><h2>{french ? "Complétude de l'évaluation" : "Assessment completion"}</h2></div><ArrowRight size={17} /></div><div className={styles.donut} style={{ "--progress": `${view.completion * 3.6}deg` } as React.CSSProperties}><div><strong>{view.completion}%</strong><span>{view.assessedControls} / {view.totalControls} {french ? "contrôles" : countLabel(view.totalControls, "control")}</span></div></div></article>
          <article className={`${styles.card} ${styles.domainCard}`}><div className={styles.cardHeading}><div><span className={styles.eyebrow}>{french ? "Répartition" : "Breakdown"}</span><h2>{french ? "Complétude de l’évaluation par domaine" : "Assessment completion by domain"}</h2></div></div><div className={styles.domainList}>{view.domainReadiness.map((item) => <div className={styles.domainRow} key={item.domain}><span>{french ? ({ organizational: "organisationnel", people: "personnes", physical: "physique", technological: "technologique" } as Record<string, string>)[item.domain] ?? item.domain : item.domain}</span><div><span className={styles.domainTrack}><i style={{ width: `${item.value}%` }} /></span><b>{item.value}%</b></div></div>)}</div><p className={styles.note}>{french ? "La complétude reflète les contrôles renseignés et leurs résultats d’évaluation." : "Domain completion reflects answered controls and their recorded assessment outcomes."}</p></article>
          <div className={styles.priorityColumn}><article className={`${styles.card} ${styles.gapTypeCard}`}><div className={styles.cardHeading}><h2>{french ? "Écarts ouverts par type" : "Open gaps by type"}</h2></div><div className={styles.gapType}><span><i className={styles.fullDot} />{french ? "Écarts complets" : "Full gaps"}</span><strong>{view.fullGaps}</strong><span><i className={styles.partialDot} />{french ? "Écarts partiels" : "Partial gaps"}</span><strong>{view.partialGaps}</strong></div></article><article className={`${styles.card} ${styles.topControlsCard}`}><div className={styles.cardHeading}><h2>{french ? "Contrôles à traiter" : "Top controls requiring action"}</h2><Link href="/gap-analysis">{french ? "Tout voir" : "View all"}</Link></div><div className={styles.controlList}>{view.topGaps.map((gap) => <div className={styles.controlRow} key={gap.id}><span><b>{gap.controlCode}</b><small>{gap.controlTitle}</small></span><Link href={gap.href}>{french ? "Voir l’écart" : "View gap"}</Link></div>)}{!view.topGaps.length && <p className={styles.empty}>{french ? "Aucun écart actif." : "No active gaps."}</p>}</div></article></div>
        </section>

        <section className={styles.actionGrid}>
          <article className={`${styles.card} ${styles.remediationCard}`}><div className={styles.cardHeading}><div><span className={styles.eyebrow}>{french ? "Remédiation" : "Remediation"}</span><h2>{french ? "Statut des actions" : "Remediation status"}</h2></div><Link href="/remediation-plan">{french ? "Voir le plan" : "View plan"}</Link></div><div className={styles.statusGrid}><div><strong>{view.remediation.overdue}</strong><span>{french ? "En retard" : "Overdue"}</span></div><div><strong>{view.dueSoon}</strong><span>{french ? "Bientôt dues" : "Due soon"}</span></div><div><strong>{view.remediation.inProgress}</strong><span>{french ? "En cours" : "In progress"}</span></div><div><strong>{view.remediation.completed}</strong><span>{french ? "Terminées" : "Completed"}</span></div></div></article>
          <article className={`${styles.card} ${styles.evidenceCard}`}><div className={styles.cardHeading}><div><span className={styles.eyebrow}>{french ? "Salle des preuves" : "Evidence Room"}</span><h2>{french ? "Couverture des preuves" : "Evidence coverage"}</h2></div><Link href="/evidence-room">{french ? "Ouvrir" : "Open room"}</Link></div><div className={styles.metricList}><p><span>{french ? "Questions avec preuve" : "Questions with evidence"}</span><b>{view.evidenceQuestions}</b></p><p><span>{french ? "Questions sans preuve" : "Questions without evidence"}</span><b>{Math.max(0, data.responses.length - view.evidenceQuestions)}</b></p><p><span>{french ? "Preuves liées" : "Linked evidence"}</span><b>{data.links.length}</b></p><p><span>{french ? "Preuves non liées" : "Unlinked evidence"}</span><b>{view.unlinkedEvidence}</b></p><p><span>{french ? "Revues de preuve en retard" : "Evidence review overdue"}</span><b>{view.overdueEvidence}</b></p></div><div className={styles.progressBar}><i style={{ width: `${view.evidenceCoverage}%` }} /></div></article>
          <article className={`${styles.card} ${styles.documentsCard}`}><div className={styles.cardHeading}><div><span className={styles.eyebrow}>{french ? "Documents IA" : "AI Documents"}</span><h2>{french ? "État documentaire" : "Document readiness"}</h2></div><Link href="/ai-documents">{french ? "Ouvrir" : "Open docs"}</Link></div><div className={styles.documentStats}>{["missing", "ready", "draft", "finalized"].map((status) => <div key={status}><strong>{data.documents.filter((item) => item.status === status).length}</strong><span>{french ? ({ missing: "manquant", ready: "prêt", draft: "brouillon", finalized: "finalisé" } as Record<string, string>)[status] : status}</span></div>)}</div><div className={styles.documentReadiness}><strong>{view.documentReadiness}%</strong><span>{french ? "Préparation documentaire" : "Document readiness"}</span></div></article>
        </section>

        <section className={styles.bottomGrid}>
          <article className={`${styles.card} ${styles.nextSteps}`}><div className={styles.cardHeading}><div><span className={styles.eyebrow}>{french ? "File d’actions" : "Action queue"}</span><h2>{french ? "Prochaines étapes" : "Next steps"}</h2></div></div><StepLink href="/assessment" label={french ? "Compléter les questions restantes" : "Complete remaining assessment questions"} show={view.completion < 100} /><StepLink href="/evidence-room" label={french ? "Ajouter les preuves manquantes" : "Add evidence for unanswered controls"} show={view.evidenceCoverage < 100} /><StepLink href="/remediation-plan" label={`${french ? "Revoir" : "Review"} ${overdueActionLabel}`} show={view.remediation.overdue > 0} /><StepLink href="/ai-documents" label={french ? "Préparer les documents manquants" : "Prepare missing ISO documents"} show={data.documents.some((item) => item.status === "missing")} /><StepLink href="/remediation-plan" label={french ? "Traiter les écarts ouverts" : "Address open gaps"} show={view.gaps.length > 0} />{view.completion === 100 && !view.gaps.length && <p className={styles.empty}>{french ? "Aucune action prioritaire détectée." : "No priority actions detected."}</p>}</article>
          <article className={`${styles.card} ${styles.activityCard}`}><div className={styles.cardHeading}><div><span className={styles.eyebrow}>{french ? "Activité de l’espace" : "Workspace activity"}</span><h2>{french ? "Progrès récent" : "Recent progress"}</h2></div></div>{view.recent.map((event, index) => { const Icon = event.icon; return <div className={styles.activityRow} key={`${event.label}-${event.date}-${index}`}><Icon size={17} /><span>{event.label}<small>{formatRelative(event.date, locale)}</small></span></div>; })}{!view.recent.length && <p className={styles.empty}>{french ? "Aucune activité récente." : "No recent activity."}</p>}</article>
        </section>

        <section className={`${styles.card} ${styles.scopeCard}`}><div className={styles.cardHeading}><div><span className={styles.eyebrow}>{french ? "Contexte de l’espace" : "Workspace context"}</span><h2>{french ? "Résumé du périmètre SMSI" : "ISMS scope summary"}</h2></div></div><div className={styles.scopeGrid}>{(french ? [["Organisation", context.organization], ["Taille", context.companySize], ["Pays", formatCountry(context.country, locale)], ["Secteur", context.industry], ["Périmètre", context.scope], ["Responsable de l’évaluation", context.owner || profileName], ["Sites", context.sites], ["Statut de l’espace", context.workspaceId ? "Actif" : "Configuration"]] : [["Organization", context.organization], ["Company size", context.companySize], ["Country", formatCountry(context.country, locale)], ["Sector", context.industry], ["Scope", context.scope], ["Assessment owner", context.owner || profileName], ["Sites", context.sites], ["Workspace status", context.workspaceId ? "Active" : "Setup"]]).map(([label, value]) => <div key={label}><small>{label}</small><strong>{value || "—"}</strong></div>)}</div></section>
        {!ready && <p className={styles.loading}>{french ? "Chargement des données de l'espace..." : "Loading workspace data..."}</p>}
      </section>
    </main>
  );
}

function StepLink({ href, label, show }: { href: string; label: string; show: boolean }) {
  if (!show) return null;
  return <Link className={styles.stepLink} href={href}><CircleAlert size={16} /><span>{label}</span><ArrowRight size={15} /></Link>;
}
