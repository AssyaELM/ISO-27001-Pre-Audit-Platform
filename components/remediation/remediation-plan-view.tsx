"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  Building2, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Circle, ClipboardCheck, ExternalLink, ListChecks, LockKeyhole, Menu, Monitor,
  Paperclip, RefreshCw, Search, SlidersHorizontal, UserRound, X,
} from "lucide-react";

import { useStoredLanguage } from "@/components/language-preference";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { workspaceDisplayName } from "@/lib/workspaces/display-name";
import { readBrowserWorkspaceContext } from "@/lib/workspaces/browser-context";
import { remediationMetrics, isOverdue, type RemediationAction, type RemediationMember, type RemediationStatus, type RemediationWorkflow } from "@/lib/remediation/actions";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import styles from "./remediation-plan-view.module.css";

const pageSize = 5;
type Profile = { organization: string; name: string; workspaceId: string };
type StatusFilter = "all" | RemediationStatus | "overdue";
type DueFilter = "all" | "overdue" | "scheduled" | "unscheduled";

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function ThemeIcon({ theme, size = 24 }: { theme: RemediationAction["theme"]; size?: number }) {
  if (theme === "organizational") return <Building2 size={size} />;
  if (theme === "people") return <UserRound size={size} />;
  if (theme === "physical") return <LockKeyhole size={size} />;
  return <Monitor size={size} />;
}

function statusLabel(status: RemediationStatus, fr: boolean) {
  if (status === "in_progress") return fr ? "En cours" : "In progress";
  if (status === "completed") return fr ? "Terminée" : "Completed";
  return fr ? "À faire" : "To do";
}

function themeLabel(theme: RemediationAction["theme"], fr: boolean) {
  const labels = {
    organizational: fr ? "Organisationnel" : "Organizational",
    people: fr ? "Personnel" : "People",
    physical: fr ? "Physique" : "Physical",
    technological: fr ? "Technologique" : "Technological",
  };
  return labels[theme];
}

function dateLabel(value: string | null, fr: boolean) {
  if (!value) return fr ? "Aucune échéance" : "No due date";
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat(fr ? "fr-FR" : "en-US", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function actionTitle(action: RemediationAction, fr: boolean) {
  return action.remediation?.trim() || (fr ? "Remédiation canonique indisponible" : "Canonical remediation unavailable");
}

let globalActionsCache: RemediationAction[] | null = null;
let globalMembersCache: RemediationMember[] | null = null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let globalWorkspaceId: string | null = null;

export default function RemediationPlanView({ /* eslint-disable-next-line @typescript-eslint/no-unused-vars */ initialWorkspaceId, initialActions, initialMembers }: { initialWorkspaceId?: string; initialActions?: RemediationAction[]; initialMembers?: RemediationMember[] } = {}) {
  const { language } = useStoredLanguage();
  const fr = language === "fr";
    const [profile, setProfile] = useState<Profile>({ organization: "", name: "", workspaceId: "" });
  const [actions, setActions] = useState<RemediationAction[]>(globalActionsCache || initialActions || []);
  const [members, setMembers] = useState<RemediationMember[]>(globalMembersCache || initialMembers || []);
  const [loading, setLoading] = useState(!globalActionsCache && (!initialActions || initialActions.length === 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [due, setDue] = useState<DueFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const [dueDraft, setDueDraft] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isSupabaseConfigured()) {
        setError(fr ? "La connexion aux données du workspace n’est pas configurée." : "Workspace data connection is not configured.");
        setLoading(false);
        return;
      }
      try {
        const client = createClient();
        const { data: sessionData } = await client.auth.getSession();
        const sessionUser = sessionData.session?.user || (await client.auth.getUser()).data.user;
        const fallback = readBrowserWorkspaceContext();
        const metadata = record(sessionUser?.user_metadata || fallback.metadata);
        const workspaceId = text(record(metadata.normcore_onboarding).workspace_creation_id) || fallback.workspaceId;
        const onboarding = record(metadata.normcore_onboarding);
        if (!workspaceId) throw new Error(fr ? "Aucun workspace d’évaluation disponible." : "No assessment workspace is available.");
        const organization = workspaceDisplayName(metadata);
        const name = text(record(onboarding.assessment_owner).full_name)
          || text(metadata.full_name)
          || text(metadata.name)
          || text(metadata.email).split("@")[0]
          || "";
        const { data: session } = await client.auth.getSession();
        const headers = session.session?.access_token ? { Authorization: `Bearer ${session.session.access_token}` } : undefined;
        const response = await fetch(`/api/remediation/actions?workspaceId=${encodeURIComponent(workspaceId)}&locale=${fr ? "fr" : "en"}`, { headers, cache: "no-store" });
        const body = await response.json() as { actions?: RemediationAction[]; members?: RemediationMember[]; error?: string };
        if (!response.ok) throw new Error(body.error || "Unable to load remediation actions.");
        if (!cancelled) {
          setProfile({ organization, name, workspaceId });
          globalActionsCache = body.actions ?? [];
          globalMembersCache = body.members ?? [];
          globalWorkspaceId = workspaceId;
          setActions(body.actions ?? []);
          setMembers(body.members ?? []);
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load remediation actions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [fr]);

  const metrics = useMemo(() => remediationMetrics(actions), [actions]);
  const memberById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);
  const filtered = useMemo(() => actions.filter((action) => {
    const needle = query.trim().toLocaleLowerCase();
    const haystack = `${action.controlCode} ${action.controlTitle} ${action.question} ${action.remediation ?? ""} ${action.gapCode}`.toLocaleLowerCase();
    return (!needle || haystack.includes(needle))
      && (owner === "all" || (owner === "unassigned" ? !action.ownerUserId : action.ownerUserId === owner))
      && (status === "all" || (status === "overdue" ? isOverdue(action) : action.status === status))
      && (due === "all" || (due === "overdue" ? isOverdue(action) : due === "scheduled" ? Boolean(action.dueDate) : !action.dueDate));
  }), [actions, due, owner, query, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((Math.min(page, pages) - 1) * pageSize, Math.min(page, pages) * pageSize);
  const selected = actions.find((action) => action.id === selectedId);

  async function updateAction(actionId: string, patch: Partial<Pick<RemediationWorkflow, "ownerUserId" | "dueDate" | "status" | "progressNote">>) {
    setSaving(true);
    setError("");
    try {
      const client = createClient();
      const { data: session } = await client.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session.session?.access_token) headers.Authorization = `Bearer ${session.session.access_token}`;
      const response = await fetch("/api/remediation/actions", {
        method: "PATCH",
        headers,
        body: JSON.stringify({ workspaceId: profile.workspaceId, actionId, ...patch }),
      });
      const body = await response.json() as { workflow?: RemediationWorkflow; error?: string };
      if (!response.ok || !body.workflow) throw new Error(body.error || "Unable to save remediation action.");
      setActions((current) => current.map((action) => action.id === actionId ? { ...action, ...body.workflow } : action));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save remediation action.");
    } finally {
      setSaving(false);
    }
  }

  const clearFilters = () => { setQuery(""); setOwner("all"); setStatus("all"); setDue("all"); };
  return <main className={styles.shell} style={{ "--navy": "#03192b", "--sidebar-width": "clamp(218px, 16vw, 267px)" } as CSSProperties}>
    <button className={styles.mobileMenu} onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={23} /></button>
    {mobileOpen && <button className={styles.scrim} onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <AppSidebar organization={profile.organization} workspaceId={profile.workspaceId} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

    <section className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.breadcrumb}><span>{profile.organization}</span><b>/</b><strong>{fr ? "Plan de remédiation" : "Remediation Plan"}</strong></div>
        <div className={styles.account}><span className={styles.language}>EN / FR</span><span className={styles.workspaceState}><i />{fr ? "Espace actif" : "Workspace active"}</span><span className={styles.userName}>{profile.name}</span><ChevronDown size={15} /><span className={styles.avatar}>{profile.name.slice(0, 1).toUpperCase() || "N"}</span></div>
      </header>

      <section className={styles.board}>
        <h1>{fr ? "Plan de remédiation" : "Remediation Plan"}</h1>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <section className={styles.kpis} aria-label="Remediation metrics">
          <article><span className={styles.kpiTeal}><ClipboardCheck /></span><div><small>{fr ? "Actions ouvertes" : "Open actions"}</small><strong>{metrics.open}</strong></div></article>
          <article><span className={styles.kpiBlue}><ListChecks /></span><div><small>{fr ? "À faire" : "To do"}</small><strong>{metrics.todo}</strong></div></article>
          <article><span className={styles.kpiBlue}><RefreshCw /></span><div><small>{fr ? "En cours" : "In progress"}</small><strong>{metrics.inProgress}</strong></div></article>
          <article><span className={styles.kpiTeal}><CheckCircle2 /></span><div><small>{fr ? "Terminées" : "Completed"}</small><strong>{metrics.completed}</strong></div></article>
          <article><span className={styles.kpiRed}><CalendarDays /></span><div><small>{fr ? "En retard" : "Overdue"}</small><strong>{metrics.overdue}</strong></div></article>
        </section>

        <section className={styles.filters} aria-label="Remediation filters">
          <label className={styles.search}><Search size={18} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={fr ? "Rechercher une remédiation" : "Search remediation"} /></label>
          <label className={styles.select}><select aria-label="Owner" value={owner} onChange={(event) => { setOwner(event.target.value); setPage(1); }}><option value="all">{fr ? "Tous les responsables" : "All owners"}</option><option value="unassigned">{fr ? "Non attribué" : "Unassigned"}</option>{members.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select><ChevronDown size={16} /></label>
          <label className={styles.select}><select aria-label="Status" value={status} onChange={(event) => { setStatus(event.target.value as StatusFilter); setPage(1); }}><option value="all">{fr ? "Tous les statuts" : "All statuses"}</option><option value="todo">{fr ? "À faire" : "To do"}</option><option value="in_progress">{fr ? "En cours" : "In progress"}</option><option value="completed">{fr ? "Terminée" : "Completed"}</option><option value="overdue">{fr ? "En retard" : "Overdue"}</option></select><ChevronDown size={16} /></label>
          <label className={styles.select}><select aria-label="Due date" value={due} onChange={(event) => { setDue(event.target.value as DueFilter); setPage(1); }}><option value="all">{fr ? "Toutes les échéances" : "Due date"}</option><option value="overdue">{fr ? "En retard" : "Overdue"}</option><option value="scheduled">{fr ? "Planifiée" : "Scheduled"}</option><option value="unscheduled">{fr ? "Sans échéance" : "No due date"}</option></select><ChevronDown size={16} /></label>
          <button className={styles.clear} onClick={clearFilters}><SlidersHorizontal size={17} />{fr ? "Effacer les filtres" : "Clear filters"}</button>
        </section>

        <section className={styles.tablePanel}>
          <header><h2>{fr ? "Actions de remédiation" : "Remediation actions"} <span>{filtered.length}</span></h2></header>
          <div className={styles.tableScroll}>
            <div className={styles.tableHeader}><span>{fr ? "Remédiation" : "Remediation"}</span><span>{fr ? "Contrôle" : "Control"}</span><span>Gap</span><span>Owner</span><span>{fr ? "Échéance" : "Due date"}</span><span>Status</span><span /></div>
            {visible.map((action) => {
              const member = action.ownerUserId ? memberById.get(action.ownerUserId) : undefined;
              const overdue = isOverdue(action);
              const openDetails = () => { setSelectedId(action.id); setDueDraft(action.dueDate ?? ""); };
              return <article
                className={selectedId === action.id ? styles.activeRow : ""}
                key={action.id}
                tabIndex={0}
                style={{ cursor: "pointer" }}
                onClick={openDetails}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openDetails();
                  }
                }}
              >
                <div className={styles.actionCell}><span className={styles.themeIcon}><ThemeIcon theme={action.theme} /></span><strong>{actionTitle(action, fr)}</strong></div>
                <span>{action.controlCode}</span>
                <span className={`${styles.gapBadge} ${action.gapLevel === "full_gap" ? styles.fullGap : styles.partialGap}`}>{action.gapLevel === "full_gap" ? (fr ? "Complet" : "Full") : (fr ? "Partiel" : "Partial")}</span>
                <span className={styles.owner}>{member ? <i>{member.name.slice(0, 1).toUpperCase()}</i> : <i className={styles.unassigned}>—</i>}<em>{member?.name || (fr ? "Non attribué" : "Unassigned")}</em></span>
                <span>{dateLabel(action.dueDate, fr)}</span>
                <span className={overdue ? styles.overdue : `${styles.statusBadge} ${styles[action.status]}`}>{overdue ? <><Circle size={10} />{fr ? "En retard" : "Overdue"}</> : statusLabel(action.status, fr)}</span>
                <button onClick={openDetails}>{fr ? "Voir détails" : "View details"}<ChevronRight size={17} /></button>
              </article>;
            })}
            {!loading && !visible.length && <p className={styles.empty}>{fr ? "Aucune action ne correspond aux gaps actifs et aux filtres sélectionnés." : "No action matches the active gaps and selected filters."}</p>}
            {loading && <p className={styles.empty}>{fr ? "Chargement des actions réelles…" : "Loading real remediation actions…"}</p>}
          </div>
          {pages > 1 && <nav className={styles.pagination} aria-label="Pagination"><button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft /></button>{Array.from({ length: pages }, (_, index) => index + 1).map((number) => <button className={page === number ? styles.currentPage : ""} onClick={() => setPage(number)} key={number}>{number}</button>)}<button disabled={page >= pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}><ChevronRight /></button></nav>}
        </section>
      </section>
    </section>

    {selected && <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(""); }}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="action-details-title">
        <header><h2 id="action-details-title">{fr ? "Détails de l’action" : "Action details"}</h2><button onClick={() => setSelectedId("")} aria-label="Close"><X /></button></header>
        <div className={styles.modalControl}><span className={styles.modalThemeIcon}><ThemeIcon theme={selected.theme} size={28} /></span><div><h3>{selected.controlCode} {selected.controlTitle}</h3><p><span>{themeLabel(selected.theme, fr)}</span><b className={selected.gapLevel === "full_gap" ? styles.fullGap : styles.partialGap}>{selected.gapLevel === "full_gap" ? (fr ? "Gap complet" : "Full gap") : (fr ? "Gap partiel" : "Partial gap")}</b></p></div></div>
        <dl className={styles.modalFields}>
          <div><dt>{fr ? "Action de remédiation" : "Remediation action"}</dt><dd>{actionTitle(selected, fr)}</dd></div>
          <div><dt>Owner</dt><dd><select value={selected.ownerUserId ?? ""} disabled={saving} onChange={(event) => void updateAction(selected.id, { ownerUserId: event.target.value || null })}><option value="">{fr ? "Non attribué" : "Unassigned"}</option>{members.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></dd></div>
          <div><dt>{fr ? "Échéance" : "Due date"}</dt><dd><input type="date" value={dueDraft} disabled={saving} onChange={(event) => { const value = event.target.value; setDueDraft(value); void updateAction(selected.id, { dueDate: value || null }); }} /></dd></div>
          <div><dt>Status</dt><dd className={styles.segmented}>{(["todo", "in_progress", "completed"] as const).map((value) => <button className={selected.status === value ? styles.segmentActive : ""} disabled={saving} onClick={() => void updateAction(selected.id, { status: value })} key={value}>{statusLabel(value, fr)}</button>)}</dd></div>
          <div><dt>{fr ? "Note de progression" : "Progress note"}</dt><dd><textarea key={`${selected.id}:${selected.updatedAt}`} defaultValue={selected.progressNote} disabled={saving} rows={3} placeholder={fr ? "Ajouter une note de suivi" : "Add a progress note"} onBlur={(event) => { if (event.target.value.trim() !== selected.progressNote) void updateAction(selected.id, { progressNote: event.target.value }); }} /></dd></div>
        </dl>
        <div className={styles.evidenceRow}><strong>{fr ? "Preuve" : "Evidence"}</strong><span><Paperclip size={17} />{selected.evidenceStatus === "provided" ? (fr ? "Référence de preuve fournie dans Assessment" : "Evidence reference provided in Assessment") : (fr ? "Aucune preuve référencée" : "No evidence referenced")}</span></div>
        <div className={styles.sourceRow}><strong>Source</strong><Link prefetch={true} href={selected.gapHref}>{fr ? "Voir le gap" : "View gap"}</Link><i /><Link prefetch={true} href={selected.assessmentHref}><ExternalLink size={15} />{fr ? "Voir le contrôle" : "View control"}</Link></div>
        {selected.status === "completed" && <p className={styles.reassessNote}><RefreshCw />{fr ? "Confirmez la correction dans Assessment pour recalculer ce gap." : "Confirm the correction in Assessment to recalculate this gap."}</p>}
        <footer><button onClick={() => setSelectedId("")}>{fr ? "Fermer" : "Close"}</button>{selected.status === "completed" && <Link prefetch={true} href={selected.assessmentHref}>{fr ? "Réévaluer le contrôle" : "Reassess control"}</Link>}</footer>
      </section>
    </div>}
  </main>;
}
