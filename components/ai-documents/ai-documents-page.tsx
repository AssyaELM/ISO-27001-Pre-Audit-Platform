"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  ClipboardList,
  CopyCheck,
  FileCheck2,
  FilePenLine,
  FileText,
  FolderOpen,
  Gauge,
  LoaderCircle,
  Lock,
  Menu,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Upload,
  Download,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { StructuredDocument, StructuredDocumentBlock } from "@/lib/ai/documents/generation-schema";
import type { AiDocumentUiEntry, AiDocumentUiStatus } from "@/lib/ai-documents/ui";
import { CANONICAL_AI_DOCUMENT_TYPES, safeGenerationError } from "@/lib/ai-documents/ui";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { fetchAssessmentData } from "@/lib/assessment/client-cache";
import styles from "./ai-documents-page.module.css";

type Props = { documentType?: string };
type UserContext = { workspaceId: string; organization: string; name: string };
type StatusFilter = "all" | AiDocumentUiStatus;
type PreflightField = { resolved: boolean; value: unknown; source: string | null; confidence: string | null };
type PreflightResult = {
  authenticatedUser: { resolved: boolean };
  currentWorkspace: { resolved: boolean };
  fields: Record<string, PreflightField>;
  realSecurityRoles: { resolved: boolean; value: unknown };
  registryDocuments: Array<{ documentType: string; status: string; activeVersion: string | null }>;
  missingInputs: unknown[];
  blockedSections: string[];
  partialSections: string[];
  predictedDocumentVersion: string | null;
};

const statusLabel: Record<AiDocumentUiStatus, string> = {
  missing: "Missing",
  ready: "Ready",
  draft: "Draft",
  finalized: "Finalized",
  already_available: "Already available",
};

const statusTone: Record<AiDocumentUiStatus, string> = {
  missing: "missing",
  ready: "ready",
  draft: "draft",
  finalized: "finalized",
  already_available: "already_available",
};

const statusOrder: AiDocumentUiStatus[] = ["missing", "ready", "draft", "already_available", "finalized"];

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatDate(value: string | null, locale = "en-US") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "—";
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

async function getAuthenticatedUserId(): Promise<string> {
  try {
    const { data } = await createClient().auth.getUser();
    if (data.user?.id) return data.user.id;
  } catch {
    // Fall through to the server-reconciled identity route below.
  }
  const response = await fetch("/api/auth/current", { cache: "no-store" });
  if (response.ok) {
    const body = await response.json() as { userId?: string };
    if (body.userId) return body.userId;
  }
  throw new Error("A valid workspace member is required before finalization.");
}

async function authenticatedApiHeaders(): Promise<HeadersInit> {
  const { data } = await createClient().auth.getSession();
  if (!data.session?.access_token) return {};
  return { Authorization: `Bearer ${data.session.access_token}` };
}

function typeLabel(type: string) {
  return type.includes("procedure") ? "Procedure" : "Policy";
}



function Shell({ user, children }: { user: UserContext; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <main className={styles.shell}>
      <AppSidebar organization={user.organization} workspaceId={user.workspaceId} mobileOpen={open} onClose={() => setOpen(false)} />

      <section className={styles.main}>
        <header className={styles.topbar}>
          <button type="button" className={styles.menu} onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation"><Menu /></button>
          <div className={styles.crumb}><span>{user.organization}</span><b>/</b><strong>AI Documents</strong></div>
          <div className={styles.profile}>
            <span className={styles.locale}>EN / FR</span>
            <span className={styles.activeWorkspace}><i />Workspace active</span>
            <strong>{user.name || "Workspace owner"}</strong>
            <span className={styles.avatar}>{(user.name || "W")[0].toUpperCase()}</span>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

const preflightLabels: Record<string, string> = {
  organization_name: "Organization",
  policy_owner: "Policy owner",
  approver: "Approver",
  document_classification: "Classification",
  review_plan: "Review plan",
  scope: "Scope",
  country: "Country",
  sector: "Sector",
  company_size: "Company size",
  communication_channel: "Communication channel",
};

function PreflightPanel({ result, loading, error, onRun }: { result: PreflightResult | null; loading: boolean; error: string; onRun: () => void }) {
  const fieldEntries = result ? Object.entries(result.fields) : [];
  const go = Boolean(result && result.authenticatedUser.resolved && result.currentWorkspace.resolved && result.missingInputs.length === 0 && result.blockedSections.length === 0);
  return (
    <section className={styles.preflightPanel} aria-label="ISP preflight">
      <div className={styles.preflightHeader}>
        <div><strong>ISP preflight</strong><span>Read-only check using the current authenticated workspace session.</span></div>
        <button type="button" className={styles.ghostButton} onClick={onRun} disabled={loading || !result && false}>{loading ? "Checking…" : "Run ISP preflight"}</button>
      </div>
      {error && <p className={styles.errorBanner}>{error}</p>}
      {result && <>
        <div className={styles.preflightGrid}>
          <span>Authenticated user<strong>{result.authenticatedUser.resolved ? "PASS" : "FAIL"}</strong></span>
          <span>Current workspace<strong>{result.currentWorkspace.resolved ? "PASS" : "FAIL"}</strong></span>
          {fieldEntries.map(([key, field]) => <span key={key}>{preflightLabels[key] ?? key}<strong>{field.resolved ? "YES" : "NO"}</strong></span>)}
          <span>Roles resolved<strong>{result.realSecurityRoles.resolved ? "YES" : "NO"}</strong></span>
          <span>Registry resolved<strong>{result.registryDocuments.length > 0 ? "YES" : "NO"}</strong></span>
        </div>
        <div className={styles.preflightDetails}>
          <span>Missing inputs: <strong>{result.missingInputs.length ? result.missingInputs.map((item) => typeof item === "object" && item !== null ? String((item as Record<string, unknown>).key ?? "unknown") : String(item)).join(", ") : "none"}</strong></span>
          <span>Blocked sections: <strong>{result.blockedSections.length ? result.blockedSections.join(", ") : "none"}</strong></span>
          <span>Predicted version: <strong>{result.predictedDocumentVersion ?? "—"}</strong></span>
          <b className={go ? styles.preflightGo : styles.preflightNoGo}>{go ? "GO" : "NO-GO"}</b>
        </div>
      </>}
    </section>
  );
}

let globalDocumentsCache: AiDocumentUiEntry[] | null = null;
let globalWorkspaceId: string | null = null;

export function AiDocumentsPage({ documentType, initialWorkspaceId, initialDocuments }: Props & { initialWorkspaceId?: string; initialDocuments?: AiDocumentUiEntry[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(!globalDocumentsCache && (!initialDocuments || initialDocuments.length === 0));
  const [error, setError] = useState("");
  const [documents, setDocuments] = useState<AiDocumentUiEntry[]>(globalDocumentsCache || initialDocuments || []);
  const [user, setUser] = useState<UserContext>({ workspaceId: globalWorkspaceId || initialWorkspaceId || "", organization: "", name: "" });
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [setup, setSetup] = useState<Record<string, string>>({});
  const [savingSetup, setSavingSetup] = useState(false);
  const [setupSaved, setSetupSaved] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<string | null>(documentType ?? null);
  const [isPending, startTransition] = useTransition();
  const [generatingType, setGeneratingType] = useState<string | null>(null);
  const [prevDocType, setPrevDocType] = useState<string | null>(null);
  // When true, DocumentDetail shows the preparation screen even for an existing draft,
  // allowing the user to trigger a new version generation without touching the current draft.
  const [showNewVersionPrep, setShowNewVersionPrep] = useState(false);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [preflightLoading, setPreflightLoading] = useState(false);
  const [preflightError, setPreflightError] = useState("");

  async function load(workspaceId: string) {
    if (!workspaceId) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/ai-documents?workspaceId=${encodeURIComponent(workspaceId)}`, { headers: await authenticatedApiHeaders(), cache: "no-store" });
      const body = await response.json() as { documents?: AiDocumentUiEntry[]; error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to load AI Documents.");
      setDocuments(body.documents ?? []);
      globalDocumentsCache = body.documents ?? [];
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load AI Documents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function init() {
      if (!isSupabaseConfigured()) {
        if (active) setLoading(false);
        return;
      }
      const client = createClient();
      const { workspaceId, metadata } = await fetchAssessmentData();
      const onboarding = record(metadata.normcore_onboarding);
      const owner = record(onboarding.assessment_owner);
      const onboardingOrg = record(onboarding.organization);
      let orgName = text(onboarding.organization_name) || text(onboardingOrg.organization_name) || text(metadata.organization_name);
      const wsId = text(onboarding.workspace_creation_id) || initialWorkspaceId || workspaceId;
      if (!orgName && wsId) {
        const { data: ws } = await client.from("workspaces").select("name").eq("id", wsId).single();
        if (ws?.name) orgName = ws.name;
      }
      
      const next = {
        workspaceId: wsId || "",
        organization: orgName,
        name: text(owner.full_name) || text(metadata.full_name) || text(metadata.name) || text(metadata.email),
      };
      if (!active) return;
      setUser(next);
      const isNewWorkspace = globalWorkspaceId !== next.workspaceId;
      if (next.workspaceId) { globalWorkspaceId = next.workspaceId; if (!initialWorkspaceId && !globalDocumentsCache) setLoading(true); }
      if (next.workspaceId && (!globalDocumentsCache || isNewWorkspace)) {
        if (initialDocuments && initialDocuments.length > 0 && isNewWorkspace && !globalDocumentsCache && next.workspaceId === initialWorkspaceId) { globalDocumentsCache = initialDocuments || null; setLoading(false); return; }
        await load(next.workspaceId);
      } else {
        setLoading(false);
      }
    }

    void init();
    return () => { active = false; };
  }, []);

  const selected = useMemo(() => documents.find((d) => d.documentType === selectedDetail), [documents, selectedDetail]);

  const nextDocType = selected?.documentType ?? null;
  if (nextDocType !== prevDocType) {
    setPrevDocType(nextDocType);
    setSetup((selected?.setup as Record<string, string> | undefined) ?? {});
  }

  const canonical = useMemo(() => CANONICAL_AI_DOCUMENT_TYPES, []);
  const counts = useMemo(() => {
    const byStatus = (status: AiDocumentUiStatus) => documents.filter((item) => item.status === status).length;
    return {
      total: canonical.length,
      missing: byStatus("missing"),
      ready: byStatus("ready"),
      draft: byStatus("draft"),
      already_available: byStatus("already_available"),
      finalized: byStatus("finalized"),
    };
  }, [canonical.length, documents]);

  const visibleDocuments = useMemo(
    () => filter === "all" ? documents : documents.filter((item) => item.status === filter),
    [documents, filter],
  );

  const orderedDocuments = useMemo(
    () => [...visibleDocuments].sort((left, right) => statusOrder.indexOf(left.status) - statusOrder.indexOf(right.status)),
    [visibleDocuments],
  );

  async function refresh() {
    if (user.workspaceId) await load(user.workspaceId);
  }

  async function runIspPreflight() {
    if (!user.workspaceId) return;
    setPreflightLoading(true);
    setPreflightError("");
    try {
      const response = await fetch("/api/ai-documents/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authenticatedApiHeaders()) },
        body: JSON.stringify({ workspaceId: user.workspaceId, documentType: "information_security_policy", setup: selectedDetail === "information_security_policy" ? setup : undefined }),
        cache: "no-store",
      });
      const body = await response.json() as PreflightResult & { error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to run ISP preflight.");
      setPreflight(body);
    } catch (cause) {
      setPreflightError(cause instanceof Error ? cause.message : "Unable to run ISP preflight.");
    } finally {
      setPreflightLoading(false);
    }
  }

  async function generate(documentEntry: AiDocumentUiEntry) {
    if (!user.workspaceId || generatingType) return;
    setGenerateError("");
    setGeneratingType(documentEntry.documentType);
    startTransition(() => setSelectedDetail(documentEntry.documentType));
    try {
      const response = await fetch("/api/ai-documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: user.workspaceId,
          documentType: documentEntry.documentType,
          setup,
        }),
      });
      const body = await response.json() as { error?: string; code?: string; retryAfterSeconds?: number };
      if (!response.ok) throw Object.assign(new Error(body.error || safeGenerationError(body.code)), { code: body.code, retryAfterSeconds: body.retryAfterSeconds });
      await load(user.workspaceId);
      setSelectedDetail(documentEntry.documentType);
    } catch (cause) {
      const error = cause instanceof Error ? cause as Error & { code?: string; retryAfterSeconds?: unknown } : null;
      const retryAfterSeconds = Number(error?.retryAfterSeconds);
      if (error?.code === "AI_PROVIDER_RATE_LIMITED" && Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
        setGenerateError(`Groq rate limit reached. Retrying the current document section group in ${Math.ceil(retryAfterSeconds)} seconds...`);
      } else {
        setGenerateError(error?.message || safeGenerationError());
      }
      setSelectedDetail(documentEntry.documentType);
    } finally {
      setGeneratingType(null);
    }
  }

  const saveSetup = async () => {
    if (!selected) return;
    setSavingSetup(true);
    setSetupSaved(false);
    try {
      const response = await fetch("/api/ai-documents/setup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: user.workspaceId,
          documentType: selected.documentType,
          setup,
        }),
      });
      if (!response.ok) throw new Error("Failed to save inputs");
      setSetupSaved(true);
      // Silently refresh registry data in the background without navigating away
      void refresh();
    } catch (e) {
      console.error(e);
      alert("Could not save setup inputs.");
    } finally {
      setSavingSetup(false);
    }
  };

  const generationEntry = generatingType ? documents.find((item) => item.documentType === generatingType) : null;

  return (
    <Shell user={user}>
      <div className={styles.page}>
        {user.workspaceId && <PreflightPanel result={preflight} loading={preflightLoading} error={preflightError} onRun={() => void runIspPreflight()} />}
        {loading ? (
          <div className={styles.centerState}><LoaderCircle className={styles.spin} /><h1>Loading AI Documents</h1><p>Reading the workspace Registry and generation contracts.</p></div>
        ) : !user.workspaceId ? (
          <div className={styles.centerState}><TriangleAlert /><h1>Workspace setup required</h1><p>Complete workspace onboarding before using AI Documents.</p><Link prefetch={true} className={styles.primary} href="/onboarding">Open workspace setup</Link></div>
        ) : generatingType && generationEntry ? (
          <GenerationState title={generationEntry.label} onBack={() => setGeneratingType(null)} />
        ) : selected ? (
          <DocumentDetail
            document={selected}
            setup={setup}
            setSetup={setSetup}
            error={generateError}
            generate={() => void generate(selected)}
            onBack={() => { setSelectedDetail(null); setShowNewVersionPrep(false); }}
            onOpenEvidence={() => router.push("/evidence-room")}
            saveSetup={saveSetup}
            savingSetup={savingSetup}
            setupSaved={setupSaved}
            workspaceId={user.workspaceId}
            organization={user.organization}
            onRefresh={() => void refresh()}
            forceShowPrep={showNewVersionPrep}
          />
        ) : (
          <Overview
            documents={orderedDocuments}
            counts={counts}
            error={error}
            filter={filter}
            onFilter={setFilter}
            onOpenDocument={(value) => { setShowNewVersionPrep(false); setSelectedDetail(value); }}
            onGenerateNewVersion={(value) => {
              setShowNewVersionPrep(true);
              startTransition(() => setSelectedDetail(value));
            }}
            isPending={isPending}
            onRefresh={() => void refresh()}
          />
        )}
      </div>
    </Shell>
  );
}

function Overview({
  documents,
  counts,
  error,
  filter,
  onFilter,
  onOpenDocument,
  onGenerateNewVersion,
  isPending,
  onRefresh,
}: {
  documents: AiDocumentUiEntry[];
  counts: { total: number; missing: number; ready: number; draft: number; already_available: number; finalized: number };
  error: string;
  filter: StatusFilter;
  onFilter: (value: StatusFilter) => void;
  onOpenDocument: (value: string) => void;
  onGenerateNewVersion: (value: string) => void;
  isPending: boolean;
  onRefresh: () => void;
}) {
  const covered = counts.already_available + counts.finalized;
  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <h1>AI Documents</h1>
          <p>Priority documents covered by the Registry and evidence sources.</p>
        </div>
        <button type="button" className={styles.ghostButton} onClick={onRefresh} disabled={isPending}><RefreshCw />Refresh</button>
      </header>

      {error && <div className={styles.errorBanner} role="alert"><AlertCircle />{error}</div>}
      {!counts.missing && <div className={styles.covered}><CopyCheck />Priority documents covered</div>}

      <section className={styles.stats}>
        <StatCard icon={<FileText />} label="Priority documents" value={counts.total} />
        <StatCard icon={<AlertCircle />} label="Missing" value={counts.missing} tone="missing" />
        <StatCard icon={<FilePenLine />} label="Draft" value={counts.draft} tone="draft" />
        <StatCard icon={<FileCheck2 />} label="Available / Finalized" value={covered} tone="finalized" />
      </section>

      <div className={styles.filters} role="tablist" aria-label="Document status filters">
        {[
          ["all", "All", documents.length],
          ["missing", "Missing", counts.missing],
          ["ready", "Ready", counts.ready],
          ["draft", "Draft", counts.draft],
          ["already_available", "Available", counts.already_available],
          ["finalized", "Finalized", counts.finalized],
        ].map(([value, label, count]) => (
          <button
            key={String(value)}
            type="button"
            className={filter === value ? styles.filterActive : ""}
            onClick={() => onFilter(value as StatusFilter)}
          >
            {label} <b>{count as number}</b>
          </button>
        ))}
      </div>

      <section className={styles.documentGrid}>
        {documents.map((document) => (
          <DocumentCard
            key={document.documentType}
            document={document}
            onOpen={() => onOpenDocument(document.documentType)}
            onGenerateNew={document.status === "draft" ? () => onGenerateNewVersion(document.documentType) : undefined}
          />
        ))}
      </section>

      <div className={styles.footerNote}>
        <span>{covered} documents available or finalized</span>
      </div>
    </>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone?: string }) {
  return <article className={`${styles.statCard} ${tone ? styles[tone] : ""}`}>{icon}<span>{label}<strong>{value}</strong></span></article>;
}

function DocumentCard({ document, onOpen, onGenerateNew }: { document: AiDocumentUiEntry; onOpen: () => void; onGenerateNew?: () => void }) {
  const primaryAction = document.status === "already_available"
    ? "View document"
    : document.status === "finalized"
      ? "Open document"
      : document.status === "draft"
        ? "Continue draft"
        : document.status === "ready"
          ? "Prepare document"
          : "Prepare document";

  return (
    <article className={styles.documentCard}>
      <div className={`${styles.docIcon} ${styles[statusTone[document.status]]}`}>
        <FileText />
        <small>{typeLabel(document.documentType)}</small>
      </div>
      <div className={styles.docBody}>
        <header>
          <div>
            <h2>{document.label}</h2>
            <p>{typeLabel(document.documentType)}</p>
          </div>
          <span className={`${styles.badge} ${styles[statusTone[document.status]]}`}>{statusLabel[document.status]}</span>
        </header>
        <div className={styles.meta}>
          {document.version ? <span>Version<strong>{document.version}</strong></span> : <><span>Inputs resolved<strong>{document.preparation.knownInputCount}</strong></span><span>Inputs required<strong>{document.preparation.missingInputs.length}</strong></span></>}
          <span>{document.reviewDate ? "Review" : "Updated"}<strong>{formatDate(document.reviewDate || document.updatedAt)}</strong></span>
          <span>Sources<strong>{document.preparation.sourceCount}</strong></span>
        </div>
        <div className={styles.readiness}>
          <span>Readiness</span>
          <i><b style={{ width: `${document.readiness}%` }} /></i>
          <strong>{document.readiness}%</strong>
        </div>
        <div className={styles.cardActions}>
          {document.status === "draft" ? (
            <>
              <button type="button" className={styles.primarySmall} onClick={onOpen}>Continue draft <ArrowRight /></button>
              {onGenerateNew && (
                <button
                  type="button"
                  className={styles.secondarySmall}
                  onClick={onGenerateNew}
                  title="Generate a new version — the current draft will be preserved"
                >
                  <RefreshCw size={13} /> New version
                </button>
              )}
            </>
          ) : document.status === "already_available" || document.status === "finalized" ? (
            <button type="button" className={styles.secondarySmall} onClick={onOpen}>{primaryAction} <ChevronRight /></button>
          ) : (
            <button type="button" className={styles.primarySmall} onClick={onOpen}>{primaryAction} <ArrowRight /></button>
          )}
        </div>
      </div>
    </article>
  );
}

function DocumentDetail({
  document,
  setup,
  setSetup,
  error,
  generate,
  onBack,
  onOpenEvidence,
  saveSetup,
  savingSetup,
  setupSaved,
  workspaceId,
  organization,
  onRefresh,
  forceShowPrep,
}: {
  document: AiDocumentUiEntry;
  setup: Record<string, string>;
  setSetup: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  error: string;
  generate: () => void;
  onBack: () => void;
  onOpenEvidence: () => void;
  saveSetup: () => Promise<void>;
  savingSetup: boolean;
  setupSaved: boolean;
  workspaceId: string;
  organization: string;
  onRefresh: () => void;
  forceShowPrep?: boolean;
}) {
  if ((document.status === "draft" || document.status === "finalized") && !forceShowPrep) return <Draft document={document} workspaceId={workspaceId} organization={organization} onBack={onBack} onRefresh={onRefresh} />;
  if (document.status === "already_available") return <Available document={document} workspaceId={workspaceId} onBack={onBack} onOpenEvidence={onOpenEvidence} />;
  if (error) return <ErrorState title={document.label} message={error} retry={generate} back={onBack} />;

  const missing = document.preparation.missingInputs;
  const complete = missing.length > 0 && missing.every((item) => setup[item.key]?.trim());

  return (
    <>
      <Link prefetch={true} className={styles.back} href="/ai-documents"><ArrowLeft />AI Documents</Link>
      {forceShowPrep && document.version && (
        <div className={styles.newVersionBanner} role="note">
          <RefreshCw size={15} />
          <span>
            You are generating a <strong>new version</strong> — {document.version} will be preserved unchanged.
          </span>
          <button type="button" className={styles.ghostButton} onClick={onBack}>← Back to current draft</button>
        </div>
      )}
      <header className={styles.detailHeader}>
        <div>
          <h1>{document.label}</h1>
          <div className={styles.detailBadges}>
            <span className={`${styles.badge} ${styles[statusTone[document.status]]}`}>{statusLabel[document.status]}</span>
            <span className={styles.typeBadge}>{typeLabel(document.documentType)}</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.secondary} onClick={onBack}><ArrowLeft />Back to documents</button>
          <button type="button" className={styles.primary} disabled={missing.length > 0 && !complete} onClick={generate}>
            <Upload />{forceShowPrep ? "Generate new version" : "Generate draft"}
          </button>
        </div>
      </header>

      <section className={styles.detailStats}>
        <article><Gauge /><strong>{document.readiness}%</strong><span>Input readiness</span></article>
        <article><FileCheck2 /><strong>{document.preparation.knownInputCount}</strong><span>Inputs resolved</span></article>
        <article className={styles.red}><AlertCircle /><strong>{missing.length}</strong><span>Inputs required</span></article>
        <article><FolderOpen /><strong>{document.preparation.sourceCount}</strong><span>Sources available</span></article>
      </section>

      {missing.length ? (
        <section className={styles.setupGrid}>
          <article className={styles.setupPanel}>
            <h2>Complete missing information</h2>
            <p className={styles.setupNote}>{missing.length} detail{missing.length > 1 ? "s" : ""} needed before generation</p>
            {missing.map((item) => (
              <label key={item.key}>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.reason}</small>
                </span>
                <input
                  type={item.expectedType === "date" ? "date" : "text"}
                  value={setup[item.key] ?? ""}
                  onChange={(event) => setSetup((current) => ({ ...current, [item.key]: event.target.value }))}
                  aria-label={item.label}
                />
              </label>
            ))}
            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.75rem" }}>
              {setupSaved && (
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--color-success, #16a34a)", fontSize: "0.875rem", fontWeight: 500 }}>
                  <Check size={16} /> Inputs saved
                </span>
              )}
              <button type="button" className={styles.secondary} onClick={() => void saveSetup()} disabled={savingSetup}>
                {savingSetup ? <LoaderCircle className={styles.spin} /> : <FileCheck2 />} Save inputs
              </button>
            </div>
          </article>
          <article className={styles.contextPanel}>
            <h2>Resolved context</h2>
            <p><Check />Organization <strong>Workspace</strong></p>
            <p><Check />Assessment facts <strong>Assessment</strong></p>
            <p><Check />Linked evidence <strong>Evidence</strong></p>
            <p><Check />Document language <strong>English</strong></p>
            <footer>{document.preparation.knownInputCount} inputs resolved</footer>
          </article>
        </section>
      ) : (
        <section className={styles.readyPanel}>
          <ShieldCheck />
          <h2>Document context is ready</h2>
          <p>Verified workspace, assessment and Registry inputs can be used to generate this draft.</p>
        </section>
      )}

      <div className={styles.actionBar}>
        <button type="button" className={styles.secondary} onClick={onBack}><ArrowLeft />Back</button>
        <button type="button" className={styles.primary} disabled={missing.length > 0 && !complete} onClick={generate}><Upload />Generate draft</button>
      </div>
    </>
  );
}

function Draft({ document, workspaceId, organization, onBack, onRefresh }: { document: AiDocumentUiEntry; workspaceId: string; organization: string; onBack: () => void; onRefresh: () => void }) {
  const [active, setActive] = useState(0);
  const originalSections = document.content?.sections ?? [];
  const [sections, setSections] = useState(originalSections);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showFinalize, setShowFinalize] = useState(false);
  
  const isFinalized = document.status === "finalized";
  const hasChanges = JSON.stringify(sections) !== JSON.stringify(originalSections);

  function handleInput(e: React.FormEvent<HTMLDivElement>) {
    const newContent = e.currentTarget.innerText;
    setSections(prev => {
      const next = [...prev];
      next[active] = { ...next[active], content: newContent };
      return next;
    });
  }

  function updateSectionBlocks(index: number, newBlocks: StructuredDocumentBlock[]) {
    setSections(prev => {
      const next = [...prev];
      next[index] = { ...next[index], blocks: newBlocks };
      return next;
    });
  }

  async function saveChanges() {
    if (!hasChanges) return;
    setSaving(true);
    try {
      const response = await fetch("/api/ai-documents/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          documentType: document.documentType,
          version: document.version,
          content: { ...document.content, sections },
        }),
      });
      if (!response.ok) throw new Error("Failed to save changes");
      onRefresh();
    } catch (e) {
      console.error(e);
      alert("Could not save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleExportPdf() {
    setExporting(true);
    try {
      const { generateDocumentPdf } = await import("@/lib/ai/documents/pdf-export");
      const fullDoc: StructuredDocument = {
        documentType: document.documentType,
        language: "en",
        title: document.label,
        sections: sections,
      };
      const meta = {
        organization: organization || "to be defined",
        version: document.version || "to be defined",
        status: document.registryStatus === "finalized" ? "FINAL" : "DRAFT",
        date: document.updatedAt ? new Date(document.updatedAt).toISOString().split("T")[0] : "to be defined",
        classification: (document.setup?.document_classification as string) || "to be defined"
      };
      await generateDocumentPdf(fullDoc, meta);
    } catch (e) {
      console.error(e);
      alert("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <Link prefetch={true} className={styles.back} href="/ai-documents"><ArrowLeft />AI Documents</Link>
      <header className={styles.draftHeader}>
        <div>
          <h1>{document.label} <span className={`${styles.badge} ${styles[statusTone[document.status]]}`}>{statusLabel[document.status]}</span></h1>
          <p>
            Version <strong>{document.version || "—"}</strong><i />
            Owner <strong>{document.ownerId || "Workspace member"}</strong><i />
            Last updated <strong>{formatDate(document.updatedAt)}</strong>
          </p>
        </div>
        <div className={styles.draftActions}>
          <button type="button" className={styles.secondary} onClick={handleExportPdf} disabled={exporting}>
            {exporting ? <LoaderCircle className={styles.spin} /> : <Download />} Export PDF
          </button>
          {!isFinalized ? (
            <>
              <button type="button" className={styles.ghostButton} onClick={() => setSections(originalSections)} disabled={!hasChanges || saving}>Cancel</button>
              <button type="button" className={styles.primary} onClick={saveChanges} disabled={!hasChanges || saving}>
                {saving ? <LoaderCircle className={styles.spin} /> : <FilePenLine />} Save changes
              </button>
            </>
          ) : (
            <button type="button" className={styles.primary} disabled><Check />Finalized</button>
          )}
        </div>
      </header>

      <section className={styles.draftSection}>
        <aside>
          <h2>Sections</h2>
          {sections.map((section, index) => (
            <button type="button" onClick={() => setActive(index)} className={active === index ? styles.sectionActive : ""} key={section.sectionId}>
              <span>{index + 1}</span>
              {section.title}
              {section.status === "needs_input" ? <CircleDashed /> : section.status === "generated" ? <CircleCheck /> : <Check />}
            </button>
          ))}
        </aside>
        <article>
          {sections.map((section, index) => (
            <section id={section.sectionId} key={section.sectionId} className={index === active ? styles.currentSection : ""}>
              <div className={styles.sectionHeader}>
                <h2>{index + 1}. {section.title}</h2>
              </div>
              
              {!isFinalized && !section.blocks && (
                <div className={styles.editorToolbar}>
                  <select aria-label="Format"><option>Paragraph</option></select>
                  <i></i>
                  <button type="button" onClick={() => window.document.execCommand("bold")} aria-label="Bold"><b>B</b></button>
                  <button type="button" onClick={() => window.document.execCommand("italic")} aria-label="Italic"><em>I</em></button>
                  <button type="button" onClick={() => window.document.execCommand("insertUnorderedList")} aria-label="Bullet List">•</button>
                  <button type="button" onClick={() => window.document.execCommand("insertOrderedList")} aria-label="Numbered List">1.</button>
                  <button type="button" onClick={() => window.document.execCommand("undo")} aria-label="Undo">↩</button>
                </div>
              )}

              {section.blocks ? (
                <div className={isFinalized ? styles.editorContent : styles.editorContentActive}>
                  <BlockEditor blocks={section.blocks} onChange={(blocks) => updateSectionBlocks(active, blocks)} readOnly={isFinalized} />
                </div>
              ) : isFinalized ? (
                <div className={styles.editorContent}>
                  {(section.content ?? "").split("\n").map((line, lineIndex) => line.trim().startsWith("-")
                    ? <li key={lineIndex}>{line.replace(/^-\s*/, "")}</li>
                    : <p key={lineIndex}>{line}</p>)}
                </div>
              ) : (
                <div 
                  className={styles.editorContentActive}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={handleInput}
                  style={{ minHeight: "200px", outline: "none", whiteSpace: "pre-wrap" }}
                >
                  {section.content}
                </div>
              )}
            </section>
          ))}
        </article>
      </section>
      
      {isFinalized ? (
        <p className={styles.readOnly}><Lock />Finalized document · Read-only</p>
      ) : (
        <p className={styles.readOnly}><FilePenLine />Draft mode · Autosaved a moment ago</p>
      )}
      
      <div className={styles.actionBar}>
        <button type="button" className={styles.secondary} onClick={onBack}><ArrowLeft />Back</button>
        {!isFinalized && (
          <button type="button" className={styles.primary} onClick={() => setShowFinalize(true)} disabled={hasChanges}>
            <Check />Finalize
          </button>
        )}
      </div>
      
      {showFinalize && (
        <FinalizeModal document={document} workspaceId={workspaceId} onClose={() => setShowFinalize(false)} onRefresh={onRefresh} />
      )}
    </>
  );
}

function FinalizeModal({ document, workspaceId, onClose, onRefresh }: { document: AiDocumentUiEntry; workspaceId: string; onClose: () => void; onRefresh: () => void }) {
  const [finalizing, setFinalizing] = useState(false);

  async function handleFinalize() {
    setFinalizing(true);
    try {
      const response = await fetch("/api/ai-documents/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          documentType: document.documentType,
          version: document.version,
          ownerId: document.ownerId || (await getAuthenticatedUserId()),
          effectiveDate: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error("Failed to finalize document");
      onRefresh();
      onClose();
    } catch {
      alert("Could not finalize document");
      setFinalizing(false);
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.modalClose} onClick={onClose}>×</button>
        <header>
          <ClipboardList className={styles.modalIcon} />
          <div>
            <h2>Finalize document</h2>
            <p>This version will become finalized and can no longer be edited as a draft.</p>
          </div>
        </header>
        
        <div className={styles.modalDetails}>
          <h3><Building2 /> {document.label}</h3>
          <p><span>Version</span> <strong>{document.version || "1.0"}</strong></p>
          <p><span>Owner</span> <strong>{document.ownerId || "Workspace Member"}</strong></p>
          <p><span>Effective date</span> <strong>{formatDate(new Date().toISOString())}</strong></p>
        </div>
        
        <div className={styles.infoBanner}>
          <CircleCheck /> A finalized copy will be available in Evidence Room.
        </div>
        
        <footer>
          <button type="button" className={styles.secondary} onClick={onClose} disabled={finalizing}>Cancel</button>
          <button type="button" className={styles.primary} onClick={handleFinalize} disabled={finalizing}>
            {finalizing ? <LoaderCircle className={styles.spin} /> : <ClipboardList />} Finalize document
          </button>
        </footer>
      </div>
    </div>
  );
}

function Available({
  document,
  workspaceId,
  onBack,
  onOpenEvidence,
}: {
  document: AiDocumentUiEntry;
  workspaceId: string;
  onBack: () => void;
  onOpenEvidence: () => void;
}) {
  return (
    <>
      <Link prefetch={true} className={styles.back} href="/ai-documents"><ArrowLeft />AI Documents</Link>
      <header className={styles.detailHeader}>
        <div>
          <h1>{document.label}</h1>
          <div className={styles.detailBadges}>
            <span className={`${styles.badge} ${styles.already_available}`}>{statusLabel.already_available}</span>
            <span className={styles.typeBadge}>{typeLabel(document.documentType)}</span>
          </div>
        </div>
        <button type="button" className={styles.primary} onClick={onOpenEvidence}><FolderOpen />Open in Evidence Room</button>
      </header>

      <div className={styles.infoBanner}><CircleCheck />Existing document found in Evidence Room.</div>

      <section className={styles.availableCard}>
        <h2>Document information</h2>
        <h3><FileText />{document.filename || "Document"}</h3>
        <div>
          <span>Version<strong>{document.version || "—"}</strong></span>
          <span>Owner<strong>{document.ownerId || "Workspace member"}</strong></span>
          <span>Review date<strong>{formatDate(document.reviewDate)}</strong></span>
        </div>
      </section>

      <div className={styles.coverage}>
        <ShieldCheck />
        <span><strong>Document coverage</strong><small>Recognized type: {document.label}</small></span>
        <b><Check />Available</b>
      </div>

      <div className={styles.actionBar}>
        <button type="button" className={styles.secondary} onClick={onBack}><ArrowLeft />Back</button>
        <a className={styles.secondary} href={`/api/evidence/${document.evidenceId}/download?workspaceId=${encodeURIComponent(workspaceId)}`}>Download</a>
        <button type="button" className={styles.primary} onClick={onOpenEvidence}><FolderOpen />Open in Evidence Room</button>
      </div>
    </>
  );
}

function GenerationState({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className={styles.page}>
      <div className={styles.generation}>
        <span><FileText /></span>
        <h1>Generating {title}</h1>
        <div className={styles.indeterminate}><i /></div>
        <p><LoaderCircle className={styles.spin} />Generating document... <strong>In progress</strong></p>
        <p><CircleDashed />Validating generated content <strong>Waiting</strong></p>
        <p><CopyCheck />Persisting validated draft <strong>Waiting</strong></p>
        <small>This may take a moment. You can safely return to documents.</small>
        <button type="button" className={styles.secondary} onClick={onBack}>Back to documents</button>
      </div>
    </div>
  );
}

function ErrorState({ title, message, retry, back }: { title: string; message: string; retry: () => void; back: () => void }) {
  return (
    <div className={styles.errorState}>
      <span><AlertCircle /></span>
      <h1>Draft generation could not be completed</h1>
      <p>{message}</p>
      <div><FileText />{title}</div>
      <button type="button" className={styles.primary} onClick={retry}><RefreshCw />Try again</button>
      <button type="button" className={styles.secondary} onClick={back}><ArrowLeft />Back to documents</button>
    </div>
  );
}

function BlockEditor({ blocks, onChange, readOnly }: { blocks: StructuredDocumentBlock[], onChange?: (blocks: StructuredDocumentBlock[]) => void, readOnly?: boolean }) {
  const updateBlock = (index: number, newBlock: StructuredDocumentBlock) => {
    if (!onChange) return;
    const next = [...blocks];
    next[index] = newBlock;
    onChange(next);
  };
  
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {blocks.map((block, i) => (
        <div key={i}>
          {block.type === "paragraph" && (
            <p contentEditable={!readOnly} suppressContentEditableWarning onInput={e => updateBlock(i, { ...block, content: e.currentTarget.innerText })}>{block.content}</p>
          )}
          {block.type === "heading" && (
            block.level === 3 
              ? <h3 contentEditable={!readOnly} suppressContentEditableWarning onInput={e => updateBlock(i, { ...block, content: e.currentTarget.innerText })} style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>{block.content}</h3>
              : <h4 contentEditable={!readOnly} suppressContentEditableWarning onInput={e => updateBlock(i, { ...block, content: e.currentTarget.innerText })} style={{ marginTop: "1.2rem", marginBottom: "0.5rem" }}>{block.content}</h4>
          )}
          {block.type === "bullet_list" && (
            <ul style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} contentEditable={!readOnly} suppressContentEditableWarning onInput={e => {
                  const newItems = [...block.items];
                  newItems[itemIndex] = e.currentTarget.innerText;
                  updateBlock(i, { ...block, items: newItems });
                }}>{item}</li>
              ))}
            </ul>
          )}
          {block.type === "numbered_list" && (
            <ol style={{ paddingLeft: "1.5rem", margin: "0.5rem 0" }}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} contentEditable={!readOnly} suppressContentEditableWarning onInput={e => {
                  const newItems = [...block.items];
                  newItems[itemIndex] = e.currentTarget.innerText;
                  updateBlock(i, { ...block, items: newItems });
                }}>{item}</li>
              ))}
            </ol>
          )}
          {block.type === "table" && (
            <div style={{ overflowX: "auto", margin: "1rem 0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #dfe6ed" }}>
                <thead style={{ background: "#f4fcfc" }}>
                  <tr>
                    {block.headers.map((h, hIndex) => (
                      <th key={hIndex} contentEditable={!readOnly} suppressContentEditableWarning onInput={e => {
                        const newHeaders = [...block.headers];
                        newHeaders[hIndex] = e.currentTarget.innerText;
                        updateBlock(i, { ...block, headers: newHeaders });
                      }} style={{ padding: "0.75rem", textAlign: "left", borderBottom: "2px solid #dfe6ed", color: "#008b8d" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} contentEditable={!readOnly} suppressContentEditableWarning onInput={e => {
                          const newRows = [...block.rows];
                          newRows[rowIndex] = [...row];
                          newRows[rowIndex][cellIndex] = e.currentTarget.innerText;
                          updateBlock(i, { ...block, rows: newRows });
                        }} style={{ padding: "0.75rem", borderBottom: "1px solid #dfe6ed", verticalAlign: "top" }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
