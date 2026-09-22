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
import { LanguageToggle } from "@/components/language-toggle";
import { useStoredLanguage } from "@/components/language-preference";
import { fetchAssessmentData } from "@/lib/assessment/client-cache";
import styles from "./ai-documents-page.module.css";

type Props = { documentType?: string };
type UserContext = { workspaceId: string; organization: string; name: string };
type StatusFilter = "all" | AiDocumentUiStatus;
type Locale = "en" | "fr";
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

const statusLabels: Record<AiDocumentUiStatus, Record<Locale, string>> = {
  missing: { en: "Missing", fr: "Manquant" },
  ready: { en: "Ready", fr: "Prêt" },
  draft: { en: "Draft", fr: "Brouillon" },
  finalized: { en: "Finalized", fr: "Finalisé" },
  already_available: { en: "Already available", fr: "Déjà disponible" },
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

function formatDate(value: string | null, locale: Locale | string = "en") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "—";
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
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

const documentCopy: Record<string, Record<Locale, { label: string; description: string }>> = {
  information_security_policy: {
    en: { label: "Information Security Policy", description: "Policy" },
    fr: { label: "Politique de sécurité de l'information", description: "Politique" },
  },
  access_control_policy: {
    en: { label: "Access Control Policy", description: "Policy" },
    fr: { label: "Politique de contrôle d'accès", description: "Politique" },
  },
  incident_management_procedure: {
    en: { label: "Incident Management Procedure", description: "Procedure" },
    fr: { label: "Procédure de gestion des incidents", description: "Procédure" },
  },
  backup_and_recovery_policy: {
    en: { label: "Backup and Recovery Policy", description: "Policy" },
    fr: { label: "Politique de sauvegarde et de restauration", description: "Politique" },
  },
  information_asset_management_policy: {
    en: { label: "Information Asset Management Policy", description: "Policy" },
    fr: { label: "Politique de gestion des actifs informationnels", description: "Politique" },
  },
};

function statusLabel(status: AiDocumentUiStatus, locale: Locale) {
  return statusLabels[status][locale];
}

function documentLabel(document: AiDocumentUiEntry, locale: Locale) {
  return documentCopy[document.documentType]?.[locale].label ?? document.label;
}

function typeLabel(type: string, locale: Locale) {
  return documentCopy[type]?.[locale].description ?? (type.includes("procedure") ? (locale === "fr" ? "Procédure" : "Procedure") : (locale === "fr" ? "Politique" : "Policy"));
}

function inputLabel(value: string, locale: Locale) {
  if (locale === "en") return value;
  const map: Record<string, string> = {
    Organization: "Organisation",
    "Policy owner": "Responsable de la politique",
    Approver: "Approbateur",
    Classification: "Classification",
    "Review plan": "Plan de revue",
    Scope: "Périmètre",
    Country: "Pays",
    Sector: "Secteur",
    "Company size": "Taille de l'entreprise",
    "Communication channel": "Canal de communication",
    "Document ID": "Identifiant du document",
    "Document owner": "Propriétaire du document",
    Version: "Version",
    "Document classification": "Classification du document",
    "Document status": "Statut du document",
    "Effective date": "Date d'entrée en vigueur",
    "Review date": "Date de revue",
    "Prepared by": "Préparé par",
    "Reviewed by": "Relu par",
    "Approval date": "Date d'approbation",
  };
  return map[value] ?? value;
}

function localizeAiError(message: string, locale: Locale) {
  if (locale === "en") return message;
  const map: Record<string, string> = {
    "A valid workspace member is required before finalization.": "Un membre valide de l'espace est requis avant la finalisation.",
    "Unable to load AI Documents.": "Impossible de charger les documents IA.",
    "Unable to run ISP preflight.": "Impossible d'exécuter la vérification préalable ISP.",
    "Failed to save inputs": "Impossible d'enregistrer les informations.",
    "Could not save setup inputs.": "Impossible d'enregistrer les informations de préparation.",
    "Failed to save changes": "Impossible d'enregistrer les modifications.",
    "Could not save changes": "Impossible d'enregistrer les modifications.",
    "Failed to export PDF": "Impossible d'exporter le PDF.",
    "Failed to finalize document": "Impossible de finaliser le document.",
    "Could not finalize document": "Impossible de finaliser le document.",
    "Draft generation couldn't be completed. Your document inputs are safe.": "La génération du brouillon n'a pas pu être terminée. Vos informations de document sont conservées.",
    "Generation took too long. No draft was saved.": "La génération a pris trop de temps. Aucun brouillon n'a été enregistré.",
    "AI provider rate limit reached. Please wait and retry. No draft was saved.": "La limite du fournisseur IA est atteinte. Patientez puis réessayez. Aucun brouillon n'a été enregistré.",
    "The generated content did not pass validation. No draft was saved.": "Le contenu généré n'a pas passé la validation. Aucun brouillon n'a été enregistré.",
    "The generated draft contained information that could not be verified. No document was saved.": "Le brouillon généré contenait des informations non vérifiables. Aucun document n'a été enregistré.",
    "The draft was generated but could not be saved to the registry.": "Le brouillon a été généré, mais n'a pas pu être enregistré dans le registre.",
  };
  return map[message] ?? message;
}



function Shell({ user, children }: { user: UserContext; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { language } = useStoredLanguage();
  const french = language === "fr";

  return (
    <main className={styles.shell}>
      <AppSidebar organization={user.organization} workspaceId={user.workspaceId} mobileOpen={open} onClose={() => setOpen(false)} />

      <section className={styles.main}>
        <header className={styles.topbar}>
          <button type="button" className={styles.menu} onClick={() => setOpen((value) => !value)} aria-label={french ? "Basculer la navigation" : "Toggle navigation"}><Menu /></button>
          <div className={styles.crumb}><span>{user.organization}</span><b>/</b><strong>{french ? "Documents IA" : "AI Documents"}</strong></div>
          <div className={styles.profile}>
            <LanguageToggle className={styles.locale} />
            <span className={styles.activeWorkspace}><i />{french ? "Espace actif" : "Workspace active"}</span>
            <strong>{user.name || (french ? "Responsable de l’espace" : "Workspace owner")}</strong>
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

function PreflightPanel({ result, loading, error, onRun, locale }: { result: PreflightResult | null; loading: boolean; error: string; onRun: () => void; locale: Locale }) {
  const fieldEntries = result ? Object.entries(result.fields) : [];
  const go = Boolean(result && result.authenticatedUser.resolved && result.currentWorkspace.resolved && result.missingInputs.length === 0 && result.blockedSections.length === 0);
  return (
    <section className={styles.preflightPanel} aria-label="ISP preflight">
      <div className={styles.preflightHeader}>
        <div><strong>{locale === "fr" ? "Vérification préalable ISP" : "ISP preflight"}</strong><span>{locale === "fr" ? "Contrôle en lecture seule avec la session authentifiée de l'espace actuel." : "Read-only check using the current authenticated workspace session."}</span></div>
        <button type="button" className={styles.ghostButton} onClick={onRun} disabled={loading || !result && false}>{loading ? (locale === "fr" ? "Vérification…" : "Checking…") : (locale === "fr" ? "Lancer la vérification ISP" : "Run ISP preflight")}</button>
      </div>
      {error && <p className={styles.errorBanner}>{error}</p>}
      {result && <>
        <div className={styles.preflightGrid}>
          <span>{locale === "fr" ? "Utilisateur authentifié" : "Authenticated user"}<strong>{result.authenticatedUser.resolved ? "PASS" : "FAIL"}</strong></span>
          <span>{locale === "fr" ? "Espace actuel" : "Current workspace"}<strong>{result.currentWorkspace.resolved ? "PASS" : "FAIL"}</strong></span>
          {fieldEntries.map(([key, field]) => <span key={key}>{inputLabel(preflightLabels[key] ?? key, locale)}<strong>{field.resolved ? (locale === "fr" ? "OUI" : "YES") : "NO"}</strong></span>)}
          <span>{locale === "fr" ? "Rôles résolus" : "Roles resolved"}<strong>{result.realSecurityRoles.resolved ? (locale === "fr" ? "OUI" : "YES") : "NO"}</strong></span>
          <span>{locale === "fr" ? "Registre résolu" : "Registry resolved"}<strong>{result.registryDocuments.length > 0 ? (locale === "fr" ? "OUI" : "YES") : "NO"}</strong></span>
        </div>
        <div className={styles.preflightDetails}>
          <span>{locale === "fr" ? "Informations manquantes" : "Missing inputs"}: <strong>{result.missingInputs.length ? result.missingInputs.map((item) => typeof item === "object" && item !== null ? String((item as Record<string, unknown>).key ?? "unknown") : String(item)).join(", ") : (locale === "fr" ? "aucune" : "none")}</strong></span>
          <span>{locale === "fr" ? "Sections bloquées" : "Blocked sections"}: <strong>{result.blockedSections.length ? result.blockedSections.join(", ") : (locale === "fr" ? "aucune" : "none")}</strong></span>
          <span>{locale === "fr" ? "Version prévue" : "Predicted version"}: <strong>{result.predictedDocumentVersion ?? "—"}</strong></span>
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
  const { language } = useStoredLanguage();
  const locale: Locale = language === "fr" ? "fr" : "en";
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
      setError(localizeAiError(cause instanceof Error ? cause.message : "Unable to load AI Documents.", locale));
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
      setPreflightError(localizeAiError(cause instanceof Error ? cause.message : "Unable to run ISP preflight.", locale));
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
        setGenerateError(locale === "fr" ? `Limite Groq atteinte. Nouvelle tentative du groupe de sections dans ${Math.ceil(retryAfterSeconds)} secondes...` : `Groq rate limit reached. Retrying the current document section group in ${Math.ceil(retryAfterSeconds)} seconds...`);
      } else {
        setGenerateError(localizeAiError(error?.message || safeGenerationError(), locale));
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
      alert(localizeAiError("Could not save setup inputs.", locale));
    } finally {
      setSavingSetup(false);
    }
  };

  const generationEntry = generatingType ? documents.find((item) => item.documentType === generatingType) : null;

  return (
    <Shell user={user}>
      <div className={styles.page}>
        {loading ? (
          <div className={styles.centerState}><LoaderCircle className={styles.spin} /><h1>{locale === "fr" ? "Chargement des documents IA" : "Loading AI Documents"}</h1><p>{locale === "fr" ? "Lecture du registre de l'espace et des contrats de génération." : "Reading the workspace Registry and generation contracts."}</p></div>
        ) : !user.workspaceId ? (
          <div className={styles.centerState}><TriangleAlert /><h1>{locale === "fr" ? "Configuration de l'espace requise" : "Workspace setup required"}</h1><p>{locale === "fr" ? "Terminez l'onboarding de l'espace avant d'utiliser les documents IA." : "Complete workspace onboarding before using AI Documents."}</p><Link prefetch={true} className={styles.primary} href="/onboarding">{locale === "fr" ? "Ouvrir la configuration" : "Open workspace setup"}</Link></div>
        ) : generatingType && generationEntry ? (
          <GenerationState title={documentLabel(generationEntry, locale)} onBack={() => setGeneratingType(null)} locale={locale} />
        ) : selected ? (
          <DocumentDetail
            document={selected}
            locale={locale}
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
            onRunPreflight={runIspPreflight}
            preflight={preflight}
            preflightLoading={preflightLoading}
            preflightError={preflightError}
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
            locale={locale}
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
  locale,
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
  locale: Locale;
}) {
  const covered = counts.already_available + counts.finalized;
  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <h1>{locale === "fr" ? "Documents IA" : "AI Documents"}</h1>
          <p>{locale === "fr" ? "Documents prioritaires couverts par le registre et les sources de preuves." : "Priority documents covered by the Registry and evidence sources."}</p>
        </div>
        <button type="button" className={styles.ghostButton} onClick={onRefresh} disabled={isPending}><RefreshCw />{locale === "fr" ? "Actualiser" : "Refresh"}</button>
      </header>

      {error && <div className={styles.errorBanner} role="alert"><AlertCircle />{error}</div>}
      {!counts.missing && <div className={styles.covered}><CopyCheck />{locale === "fr" ? "Documents prioritaires couverts" : "Priority documents covered"}</div>}

      <section className={styles.stats}>
        <StatCard icon={<FileText />} label={locale === "fr" ? "Documents prioritaires" : "Priority documents"} value={counts.total} />
        <StatCard icon={<AlertCircle />} label={statusLabel("missing", locale)} value={counts.missing} tone="missing" />
        <StatCard icon={<FilePenLine />} label={statusLabel("draft", locale)} value={counts.draft} tone="draft" />
        <StatCard icon={<FileCheck2 />} label={locale === "fr" ? "Disponibles / finalisés" : "Available / Finalized"} value={covered} tone="finalized" />
      </section>

      <div className={styles.filters} role="tablist" aria-label={locale === "fr" ? "Filtres de statut des documents" : "Document status filters"}>
        {[
          ["all", locale === "fr" ? "Tous" : "All", documents.length],
          ["missing", statusLabel("missing", locale), counts.missing],
          ["ready", statusLabel("ready", locale), counts.ready],
          ["draft", statusLabel("draft", locale), counts.draft],
          ["already_available", locale === "fr" ? "Disponibles" : "Available", counts.already_available],
          ["finalized", statusLabel("finalized", locale), counts.finalized],
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
            locale={locale}
            onOpen={() => onOpenDocument(document.documentType)}
            onGenerateNew={document.status === "draft" ? () => onGenerateNewVersion(document.documentType) : undefined}
          />
        ))}
      </section>

      <div className={styles.footerNote}>
        <span>{locale === "fr" ? `${covered} documents disponibles ou finalisés` : `${covered} documents available or finalized`}</span>
      </div>
    </>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone?: string }) {
  return <article className={`${styles.statCard} ${tone ? styles[tone] : ""}`}>{icon}<span>{label}<strong>{value}</strong></span></article>;
}

function DocumentCard({ document, onOpen, onGenerateNew, locale }: { document: AiDocumentUiEntry; onOpen: () => void; onGenerateNew?: () => void; locale: Locale }) {
  const primaryAction = document.status === "already_available"
    ? (locale === "fr" ? "Voir le document" : "View document")
    : document.status === "finalized"
      ? (locale === "fr" ? "Ouvrir le document" : "Open document")
      : document.status === "draft"
        ? (locale === "fr" ? "Continuer le brouillon" : "Continue draft")
        : document.status === "ready"
          ? (locale === "fr" ? "Préparer le document" : "Prepare document")
          : (locale === "fr" ? "Préparer le document" : "Prepare document");

  return (
    <article className={styles.documentCard}>
      <div className={`${styles.docIcon} ${styles[statusTone[document.status]]}`}>
        <FileText />
        <small>{typeLabel(document.documentType, locale)}</small>
      </div>
      <div className={styles.docBody}>
        <header>
          <div>
            <h2>{documentLabel(document, locale)}</h2>
            <p>{typeLabel(document.documentType, locale)}</p>
          </div>
          <span className={`${styles.badge} ${styles[statusTone[document.status]]}`}>{statusLabel(document.status, locale)}</span>
        </header>
        <div className={styles.meta}>
          {document.version ? <span>Version<strong>{document.version}</strong></span> : <><span>{locale === "fr" ? "Entrées résolues" : "Inputs resolved"}<strong>{document.preparation.knownInputCount}</strong></span><span>{locale === "fr" ? "Entrées requises" : "Inputs required"}<strong>{document.preparation.missingInputs.length}</strong></span></>}
          <span>{document.reviewDate ? (locale === "fr" ? "Revue" : "Review") : (locale === "fr" ? "Mis à jour" : "Updated")}<strong>{formatDate(document.reviewDate || document.updatedAt, locale)}</strong></span>
          <span>{locale === "fr" ? "Sources" : "Sources"}<strong>{document.preparation.sourceCount}</strong></span>
        </div>
        <div className={styles.readiness}>
          <span>{locale === "fr" ? "Préparation" : "Readiness"}</span>
          <i><b style={{ width: `${document.readiness}%` }} /></i>
          <strong>{document.readiness}%</strong>
        </div>
        <div className={styles.cardActions}>
          {document.status === "draft" ? (
            <>
              <button type="button" className={styles.primarySmall} onClick={onOpen}>{locale === "fr" ? "Continuer le brouillon" : "Continue draft"} <ArrowRight /></button>
              {onGenerateNew && (
                <button
                  type="button"
                  className={styles.secondarySmall}
                  onClick={onGenerateNew}
                  title={locale === "fr" ? "Générer une nouvelle version — le brouillon actuel sera conservé" : "Generate a new version — the current draft will be preserved"}
                >
                  <RefreshCw size={13} /> {locale === "fr" ? "Nouvelle version" : "New version"}
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
  locale,
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
  onRunPreflight,
  preflight,
  preflightLoading,
  preflightError,
}: {
  document: AiDocumentUiEntry;
  locale: Locale;
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
  onRunPreflight: () => void;
  preflight: PreflightResult | null;
  preflightLoading: boolean;
  preflightError: string;
}) {
  if ((document.status === "draft" || document.status === "finalized") && !forceShowPrep) return <Draft document={document} workspaceId={workspaceId} organization={organization} onBack={onBack} onRefresh={onRefresh} locale={locale} />;
  if (document.status === "already_available") return <Available document={document} workspaceId={workspaceId} onBack={onBack} onOpenEvidence={onOpenEvidence} locale={locale} />;
  if (error) return <ErrorState title={documentLabel(document, locale)} message={error} retry={generate} back={onBack} locale={locale} />;

  const missing = document.preparation.missingInputs;
  const complete = missing.length > 0 && missing.every((item) => setup[item.key]?.trim());

  return (
    <>
      <Link prefetch={true} className={styles.back} href="/ai-documents" onClick={onBack}><ArrowLeft />{locale === "fr" ? "Documents IA" : "AI Documents"}</Link>
      {forceShowPrep && document.version && (
        <div className={styles.newVersionBanner} role="note">
          <RefreshCw size={15} />
          <span>
            {locale === "fr" ? <>Vous générez une <strong>nouvelle version</strong> — {document.version} sera conservée sans modification.</> : <>You are generating a <strong>new version</strong> — {document.version} will be preserved unchanged.</>}
          </span>
          <button type="button" className={styles.ghostButton} onClick={onBack}>← {locale === "fr" ? "Retour au brouillon actuel" : "Back to current draft"}</button>
        </div>
      )}
      <header className={styles.detailHeader}>
        <div>
          <h1>{documentLabel(document, locale)}</h1>
          <div className={styles.detailBadges}>
            <span className={`${styles.badge} ${styles[statusTone[document.status]]}`}>{statusLabel(document.status, locale)}</span>
            <span className={styles.typeBadge}>{typeLabel(document.documentType, locale)}</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.secondary} onClick={onBack}><ArrowLeft />{locale === "fr" ? "Retour aux documents" : "Back to documents"}</button>
          <button type="button" className={styles.primary} disabled={missing.length > 0 && !complete} onClick={generate}>
            <Upload />{forceShowPrep ? (locale === "fr" ? "Générer une nouvelle version" : "Generate new version") : (locale === "fr" ? "Générer le brouillon" : "Generate draft")}
          </button>
        </div>
      </header>

      <section className={styles.detailStats}>
        <article><Gauge /><strong>{document.readiness}%</strong><span>{locale === "fr" ? "Préparation des entrées" : "Input readiness"}</span></article>
        <article><FileCheck2 /><strong>{document.preparation.knownInputCount}</strong><span>{locale === "fr" ? "Entrées résolues" : "Inputs resolved"}</span></article>
        <article className={styles.red}><AlertCircle /><strong>{missing.length}</strong><span>{locale === "fr" ? "Entrées requises" : "Inputs required"}</span></article>
        <article><FolderOpen /><strong>{document.preparation.sourceCount}</strong><span>{locale === "fr" ? "Sources disponibles" : "Sources available"}</span></article>
      </section>
      {document.documentType === "information_security_policy" && <PreflightPanel result={preflight} loading={preflightLoading} error={preflightError} onRun={onRunPreflight} locale={locale} />}

      {missing.length ? (
        <section className={styles.setupGrid}>
          <article className={styles.setupPanel}>
            <h2>{locale === "fr" ? "Compléter les informations manquantes" : "Complete missing information"}</h2>
            <p className={styles.setupNote}>{locale === "fr" ? `${missing.length} détail${missing.length > 1 ? "s" : ""} requis avant génération` : `${missing.length} detail${missing.length > 1 ? "s" : ""} needed before generation`}</p>
            {missing.map((item) => (
              <label key={item.key}>
                <span>
                  <strong>{inputLabel(item.label, locale)}</strong>
                  <small>{inputLabel(item.reason, locale)}</small>
                </span>
                <input
                  type={item.expectedType === "date" ? "date" : "text"}
                  value={setup[item.key] ?? ""}
                  onChange={(event) => setSetup((current) => ({ ...current, [item.key]: event.target.value }))}
                  aria-label={inputLabel(item.label, locale)}
                />
              </label>
            ))}
            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.75rem" }}>
              {setupSaved && (
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--color-success, #16a34a)", fontSize: "0.875rem", fontWeight: 500 }}>
                  <Check size={16} /> {locale === "fr" ? "Entrées enregistrées" : "Inputs saved"}
                </span>
              )}
              <button type="button" className={styles.secondary} onClick={() => void saveSetup()} disabled={savingSetup}>
                {savingSetup ? <LoaderCircle className={styles.spin} /> : <FileCheck2 />} {locale === "fr" ? "Enregistrer les entrées" : "Save inputs"}
              </button>
            </div>
          </article>
          <article className={styles.contextPanel}>
            <h2>{locale === "fr" ? "Contexte résolu" : "Resolved context"}</h2>
            <p><Check />{locale === "fr" ? "Organisation" : "Organization"} <strong>{locale === "fr" ? "Espace" : "Workspace"}</strong></p>
            <p><Check />{locale === "fr" ? "Faits d'évaluation" : "Assessment facts"} <strong>{locale === "fr" ? "Évaluation" : "Assessment"}</strong></p>
            <p><Check />{locale === "fr" ? "Preuves liées" : "Linked evidence"} <strong>{locale === "fr" ? "Preuves" : "Evidence"}</strong></p>
            <p><Check />{locale === "fr" ? "Langue du document" : "Document language"} <strong>{locale === "fr" ? "Français" : "English"}</strong></p>
            <footer>{locale === "fr" ? `${document.preparation.knownInputCount} entrées résolues` : `${document.preparation.knownInputCount} inputs resolved`}</footer>
          </article>
        </section>
      ) : (
        <section className={styles.readyPanel}>
          <ShieldCheck />
          <h2>{locale === "fr" ? "Le contexte du document est prêt" : "Document context is ready"}</h2>
          <p>{locale === "fr" ? "Les entrées vérifiées de l'espace, de l'évaluation et du registre peuvent être utilisées pour générer ce brouillon." : "Verified workspace, assessment and Registry inputs can be used to generate this draft."}</p>
        </section>
      )}

      <div className={styles.actionBar}>
        <button type="button" className={styles.secondary} onClick={onBack}><ArrowLeft />{locale === "fr" ? "Retour" : "Back"}</button>
        <button type="button" className={styles.primary} disabled={missing.length > 0 && !complete} onClick={generate}><Upload />{locale === "fr" ? "Générer le brouillon" : "Generate draft"}</button>
      </div>
    </>
  );
}

function Draft({ document, workspaceId, organization, onBack, onRefresh, locale }: { document: AiDocumentUiEntry; workspaceId: string; organization: string; onBack: () => void; onRefresh: () => void; locale: Locale }) {
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
      alert(localizeAiError("Could not save changes", locale));
    } finally {
      setSaving(false);
    }
  }

  async function handleExportPdf(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setExporting(true);
    try {
      const { generateDocumentPdf } = await import("@/lib/ai/documents/pdf-export");
      const fullDoc: StructuredDocument = {
        documentType: document.documentType,
        language: locale,
        title: documentLabel(document, locale),
        sections: sections,
      };
      const meta = {
        organization: organization || (locale === "fr" ? "à définir" : "to be defined"),
        version: document.version || (locale === "fr" ? "à définir" : "to be defined"),
        status: document.registryStatus === "finalized" ? "FINAL" : "DRAFT",
        date: document.updatedAt ? new Date(document.updatedAt).toISOString().split("T")[0] : (locale === "fr" ? "à définir" : "to be defined"),
        classification: (document.setup?.document_classification as string) || (locale === "fr" ? "à définir" : "to be defined")
      };
      await generateDocumentPdf(fullDoc, meta);
    } catch (e) {
      const message = e instanceof Error
        ? e.message
        : e && typeof e === "object"
          ? `PDF export failed (${e.constructor?.name || "unknown error"})`
          : "Unknown PDF export error";
      console.error("PDF export failed:", message);
      alert(localizeAiError("Failed to export PDF", locale));
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <Link prefetch={true} className={styles.back} href="/ai-documents" onClick={onBack}><ArrowLeft />{locale === "fr" ? "Documents IA" : "AI Documents"}</Link>
      <header className={styles.draftHeader}>
        <div>
          <h1>{documentLabel(document, locale)} <span className={`${styles.badge} ${styles[statusTone[document.status]]}`}>{statusLabel(document.status, locale)}</span></h1>
          <p>
            Version <strong>{document.version || "—"}</strong><i />
            {locale === "fr" ? "Propriétaire" : "Owner"} <strong>{document.ownerId || (locale === "fr" ? "Membre de l'espace" : "Workspace member")}</strong><i />
            {locale === "fr" ? "Dernière mise à jour" : "Last updated"} <strong>{formatDate(document.updatedAt, locale)}</strong>
          </p>
        </div>
        <div className={styles.draftActions}>
          <button type="button" className={styles.secondary} onClick={handleExportPdf} disabled={exporting}>
            {exporting ? <LoaderCircle className={styles.spin} /> : <Download />} {locale === "fr" ? "Exporter PDF" : "Export PDF"}
          </button>
          {!isFinalized ? (
            <>
              <button type="button" className={styles.ghostButton} onClick={() => setSections(originalSections)} disabled={!hasChanges || saving}>{locale === "fr" ? "Annuler" : "Cancel"}</button>
              <button type="button" className={styles.primary} onClick={saveChanges} disabled={!hasChanges || saving}>
                {saving ? <LoaderCircle className={styles.spin} /> : <FilePenLine />} {locale === "fr" ? "Enregistrer les modifications" : "Save changes"}
              </button>
            </>
          ) : (
            <button type="button" className={styles.primary} disabled><Check />{statusLabel("finalized", locale)}</button>
          )}
        </div>
      </header>

      <section className={styles.draftSection}>
        <aside>
          <h2>{locale === "fr" ? "Sections" : "Sections"}</h2>
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
                  <select aria-label="Format"><option>{locale === "fr" ? "Paragraphe" : "Paragraph"}</option></select>
                  <i></i>
                  <button type="button" onClick={() => window.document.execCommand("bold")} aria-label={locale === "fr" ? "Gras" : "Bold"}><b>B</b></button>
                  <button type="button" onClick={() => window.document.execCommand("italic")} aria-label={locale === "fr" ? "Italique" : "Italic"}><em>I</em></button>
                  <button type="button" onClick={() => window.document.execCommand("insertUnorderedList")} aria-label={locale === "fr" ? "Liste à puces" : "Bullet List"}>•</button>
                  <button type="button" onClick={() => window.document.execCommand("insertOrderedList")} aria-label={locale === "fr" ? "Liste numérotée" : "Numbered List"}>1.</button>
                  <button type="button" onClick={() => window.document.execCommand("undo")} aria-label={locale === "fr" ? "Annuler" : "Undo"}>↩</button>
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
        <p className={styles.readOnly}><Lock />{locale === "fr" ? "Document finalisé · Lecture seule" : "Finalized document · Read-only"}</p>
      ) : (
        <p className={styles.readOnly}><FilePenLine />{locale === "fr" ? "Mode brouillon · Enregistré automatiquement à l'instant" : "Draft mode · Autosaved a moment ago"}</p>
      )}
      
      <div className={styles.actionBar}>
        <button type="button" className={styles.secondary} onClick={onBack}><ArrowLeft />{locale === "fr" ? "Retour" : "Back"}</button>
        {!isFinalized && (
          <button type="button" className={styles.primary} onClick={() => setShowFinalize(true)} disabled={hasChanges}>
            <Check />{locale === "fr" ? "Finaliser" : "Finalize"}
          </button>
        )}
      </div>
      
      {showFinalize && (
        <FinalizeModal document={document} workspaceId={workspaceId} onClose={() => setShowFinalize(false)} onRefresh={onRefresh} locale={locale} />
      )}
    </>
  );
}

function FinalizeModal({ document, workspaceId, onClose, onRefresh, locale }: { document: AiDocumentUiEntry; workspaceId: string; onClose: () => void; onRefresh: () => void; locale: Locale }) {
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
      alert(localizeAiError("Could not finalize document", locale));
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
            <h2>{locale === "fr" ? "Finaliser le document" : "Finalize document"}</h2>
            <p>{locale === "fr" ? "Cette version deviendra finalisée et ne pourra plus être modifiée comme brouillon." : "This version will become finalized and can no longer be edited as a draft."}</p>
          </div>
        </header>
        
        <div className={styles.modalDetails}>
          <h3><Building2 /> {documentLabel(document, locale)}</h3>
          <p><span>Version</span> <strong>{document.version || "1.0"}</strong></p>
          <p><span>{locale === "fr" ? "Propriétaire" : "Owner"}</span> <strong>{document.ownerId || (locale === "fr" ? "Membre de l'espace" : "Workspace Member")}</strong></p>
          <p><span>{locale === "fr" ? "Date d'entrée en vigueur" : "Effective date"}</span> <strong>{formatDate(new Date().toISOString(), locale)}</strong></p>
        </div>
        
        <div className={styles.infoBanner}>
          <CircleCheck /> {locale === "fr" ? "Une copie finalisée sera disponible dans la salle des preuves." : "A finalized copy will be available in Evidence Room."}
        </div>
        
        <footer>
          <button type="button" className={styles.secondary} onClick={onClose} disabled={finalizing}>{locale === "fr" ? "Annuler" : "Cancel"}</button>
          <button type="button" className={styles.primary} onClick={handleFinalize} disabled={finalizing}>
            {finalizing ? <LoaderCircle className={styles.spin} /> : <ClipboardList />} {locale === "fr" ? "Finaliser le document" : "Finalize document"}
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
  locale,
}: {
  document: AiDocumentUiEntry;
  workspaceId: string;
  onBack: () => void;
  onOpenEvidence: () => void;
  locale: Locale;
}) {
  return (
    <>
      <Link prefetch={true} className={styles.back} href="/ai-documents" onClick={onBack}><ArrowLeft />{locale === "fr" ? "Documents IA" : "AI Documents"}</Link>
      <header className={styles.detailHeader}>
        <div>
          <h1>{documentLabel(document, locale)}</h1>
          <div className={styles.detailBadges}>
            <span className={`${styles.badge} ${styles.already_available}`}>{statusLabel("already_available", locale)}</span>
            <span className={styles.typeBadge}>{typeLabel(document.documentType, locale)}</span>
          </div>
        </div>
        <button type="button" className={styles.primary} onClick={onOpenEvidence}><FolderOpen />{locale === "fr" ? "Ouvrir dans la salle des preuves" : "Open in Evidence Room"}</button>
      </header>

      <div className={styles.infoBanner}><CircleCheck />{locale === "fr" ? "Document existant trouvé dans la salle des preuves." : "Existing document found in Evidence Room."}</div>

      <section className={styles.availableCard}>
        <h2>{locale === "fr" ? "Informations du document" : "Document information"}</h2>
        <h3><FileText />{document.filename || (locale === "fr" ? "Document" : "Document")}</h3>
        <div>
          <span>Version<strong>{document.version || "—"}</strong></span>
          <span>{locale === "fr" ? "Propriétaire" : "Owner"}<strong>{document.ownerId || (locale === "fr" ? "Membre de l'espace" : "Workspace member")}</strong></span>
          <span>{locale === "fr" ? "Date de revue" : "Review date"}<strong>{formatDate(document.reviewDate, locale)}</strong></span>
        </div>
      </section>

      <div className={styles.coverage}>
        <ShieldCheck />
        <span><strong>{locale === "fr" ? "Couverture du document" : "Document coverage"}</strong><small>{locale === "fr" ? "Type reconnu" : "Recognized type"}: {documentLabel(document, locale)}</small></span>
        <b><Check />{locale === "fr" ? "Disponible" : "Available"}</b>
      </div>

      <div className={styles.actionBar}>
        <button type="button" className={styles.secondary} onClick={onBack}><ArrowLeft />{locale === "fr" ? "Retour" : "Back"}</button>
        <a className={styles.secondary} href={`/api/evidence/${document.evidenceId}/download?workspaceId=${encodeURIComponent(workspaceId)}`}>{locale === "fr" ? "Télécharger" : "Download"}</a>
        <button type="button" className={styles.primary} onClick={onOpenEvidence}><FolderOpen />{locale === "fr" ? "Ouvrir dans la salle des preuves" : "Open in Evidence Room"}</button>
      </div>
    </>
  );
}

function GenerationState({ title, onBack, locale }: { title: string; onBack: () => void; locale: Locale }) {
  return (
    <div className={styles.page}>
      <div className={styles.generation}>
        <span><FileText /></span>
        <h1>{locale === "fr" ? `Génération de ${title}` : `Generating ${title}`}</h1>
        <div className={styles.indeterminate}><i /></div>
        <p><LoaderCircle className={styles.spin} />{locale === "fr" ? "Génération du document..." : "Generating document..."} <strong>{locale === "fr" ? "En cours" : "In progress"}</strong></p>
        <p><CircleDashed />{locale === "fr" ? "Validation du contenu généré" : "Validating generated content"} <strong>{locale === "fr" ? "En attente" : "Waiting"}</strong></p>
        <p><CopyCheck />{locale === "fr" ? "Enregistrement du brouillon validé" : "Persisting validated draft"} <strong>{locale === "fr" ? "En attente" : "Waiting"}</strong></p>
        <small>{locale === "fr" ? "Cela peut prendre un moment. Vous pouvez revenir aux documents en toute sécurité." : "This may take a moment. You can safely return to documents."}</small>
        <button type="button" className={styles.secondary} onClick={onBack}>{locale === "fr" ? "Retour aux documents" : "Back to documents"}</button>
      </div>
    </div>
  );
}

function ErrorState({ title, message, retry, back, locale }: { title: string; message: string; retry: () => void; back: () => void; locale: Locale }) {
  return (
    <div className={styles.errorState}>
      <span><AlertCircle /></span>
      <h1>{locale === "fr" ? "La génération du brouillon n'a pas pu être terminée" : "Draft generation could not be completed"}</h1>
      <p>{message}</p>
      <div><FileText />{title}</div>
      <button type="button" className={styles.primary} onClick={retry}><RefreshCw />{locale === "fr" ? "Réessayer" : "Try again"}</button>
      <button type="button" className={styles.secondary} onClick={back}><ArrowLeft />{locale === "fr" ? "Retour aux documents" : "Back to documents"}</button>
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
