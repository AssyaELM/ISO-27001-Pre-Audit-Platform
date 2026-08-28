"use client";

import {
  Eye,
  File,
  FileSpreadsheet,
  FileText,
  Link2,
  Paperclip,
  PlusCircle,
  Search,
  Unlink,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import styles from "./question-evidence.module.css";

type EvidenceTheme = "organizational" | "people" | "physical" | "technological";
type Locale = "en" | "fr";

type EvidenceItem = {
  id: string;
  workspaceId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  documentType: DocumentType | null;
  documentVersion: string | null;
  effectiveDate: string | null;
  reviewDate: string | null;
  documentOwnerId: string | null;
};

type DocumentType = "information_security_policy" | "access_control_policy" | "incident_management_procedure" | "backup_restore_procedure" | "asset_management_policy" | "other";
type WorkspaceMember = { id: string; label: string };

type EvidenceLink = {
  id: string;
  evidenceId: string;
  workspaceId: string;
  themeId: EvidenceTheme;
  controlId: string;
  questionId: string;
};

type EvidenceListResponse = {
  evidence?: EvidenceItem[];
  links?: EvidenceLink[];
  workspaceMembers?: WorkspaceMember[];
  error?: string;
};

const workspaceEvidenceCache = new Map<string, Promise<EvidenceListResponse>>();

function listWorkspaceEvidence(workspaceId: string, refresh = false) {
  if (refresh) workspaceEvidenceCache.delete(workspaceId);
  const cached = workspaceEvidenceCache.get(workspaceId);
  if (cached) return cached;
  const request = fetch(`/api/evidence?workspaceId=${encodeURIComponent(workspaceId)}`)
    .then((response) => responseBody<EvidenceListResponse>(response))
    .catch((cause) => {
      workspaceEvidenceCache.delete(workspaceId);
      throw cause;
    });
  workspaceEvidenceCache.set(workspaceId, request);
  return request;
}

type Props = {
  workspaceId: string;
  themeId: EvidenceTheme;
  controlId: string;
  questionId: string;
  locale: Locale;
  guidance?: string;
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_FILES = ".pdf,.png,.jpg,.jpeg,.txt,.csv";
const DOCUMENT_TYPE_OPTIONS: Array<{ value: DocumentType; label: string }> = [
  { value: "information_security_policy", label: "Information Security Policy" },
  { value: "access_control_policy", label: "Access Control Policy" },
  { value: "incident_management_procedure", label: "Incident Management Procedure" },
  { value: "backup_restore_procedure", label: "Backup & Restore Procedure" },
  { value: "asset_management_policy", label: "Asset Management Policy" },
  { value: "other", label: "Other" },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKind(item: Pick<EvidenceItem, "mimeType" | "originalFilename">) {
  const extension = item.originalFilename.split(".").pop()?.toUpperCase();
  if (item.mimeType === "text/csv") return "CSV";
  if (item.mimeType === "application/pdf") return "PDF";
  if (item.mimeType.startsWith("image/")) return extension || "IMAGE";
  if (item.mimeType === "text/plain") return "TXT";
  return extension || "FILE";
}

function FileIcon({ item, size = 17 }: { item: Pick<EvidenceItem, "mimeType" | "originalFilename">; size?: number }) {
  if (item.mimeType === "text/csv") return <FileSpreadsheet size={size} />;
  if (item.mimeType === "application/pdf" || item.mimeType === "text/plain") return <FileText size={size} />;
  return <File size={size} />;
}

async function responseBody<T extends { error?: string }>(response: globalThis.Response): Promise<T> {
  const body = await response.json() as T;
  if (!response.ok) throw new Error(body.error || "Evidence request failed");
  return body;
}

export function QuestionEvidence({ workspaceId, themeId, controlId, questionId, locale, guidance }: Props) {
  const fr = locale === "fr";
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [links, setLinks] = useState<EvidenceLink[]>([]);
  const [allItems, setAllItems] = useState<EvidenceItem[]>([]);
  const [allLinks, setAllLinks] = useState<EvidenceLink[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"upload" | "existing">("upload");
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState("");
  const [search, setSearch] = useState("");
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [error, setError] = useState("");
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [documentType, setDocumentType] = useState<DocumentType | "">("");
  const [documentVersion, setDocumentVersion] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [documentOwnerId, setDocumentOwnerId] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const loadLinked = useCallback(async (refresh = false) => {
    if (!workspaceId) return;
    const body = await listWorkspaceEvidence(workspaceId, refresh);
    const questionLinks = (body.links ?? []).filter((link) => link.themeId === themeId && link.controlId === controlId && link.questionId === questionId);
    const evidenceIds = new Set(questionLinks.map((link) => link.evidenceId));
    setItems((body.evidence ?? []).filter((item) => evidenceIds.has(item.id)));
    setLinks(questionLinks);
    setWorkspaceMembers(body.workspaceMembers ?? []);
  }, [controlId, questionId, themeId, workspaceId]);

  useEffect(() => {
    let active = true;
    if (!workspaceId) return;
    const timer = window.setTimeout(() => {
      void loadLinked().catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : (fr ? "Impossible de charger les preuves." : "Unable to load evidence."));
      });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [fr, loadLinked, workspaceId]);

  const openModal = useCallback((nextMode: "upload" | "existing" = "upload") => {
    setMode(nextMode);
    setSelectedFile(null);
    setSelectedEvidenceId("");
    setSearch("");
    setError("");
    setDocumentType("");
    setDocumentVersion("");
    setEffectiveDate("");
    setReviewDate("");
    setDocumentOwnerId("");
    setModalOpen(true);
  }, []);

  const loadExisting = useCallback(async () => {
    if (!workspaceId) return;
    setLoadingExisting(true);
    try {
      const body = await listWorkspaceEvidence(workspaceId);
      setAllItems(body.evidence ?? []);
      setAllLinks(body.links ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (fr ? "Impossible de charger les preuves." : "Unable to load evidence."));
    } finally {
      setLoadingExisting(false);
    }
  }, [fr, workspaceId]);

  useEffect(() => {
    if (!modalOpen || mode !== "existing") return;
    const timer = window.setTimeout(() => void loadExisting(), 0);
    return () => window.clearTimeout(timer);
  }, [loadExisting, modalOpen, mode]);

  useEffect(() => {
    if (!modalOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) setModalOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [busy, modalOpen]);

  const linkedEvidenceIds = useMemo(() => new Set(links.map((link) => link.evidenceId)), [links]);
  const matchingItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return allItems.filter((item) => !query || item.originalFilename.toLocaleLowerCase().includes(query));
  }, [allItems, search]);
  const visibleItems = showAll ? items : items.slice(0, 2);

  async function upload() {
    if (!selectedFile || !workspaceId || busy) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("workspaceId", workspaceId);
      form.set("themeId", themeId);
      form.set("controlId", controlId);
      form.set("questionId", questionId);
      form.set("file", selectedFile);
      if (documentType) form.set("documentType", documentType);
      if (documentVersion.trim()) form.set("documentVersion", documentVersion.trim());
      if (effectiveDate) form.set("effectiveDate", effectiveDate);
      if (reviewDate) form.set("reviewDate", reviewDate);
      if (documentOwnerId) form.set("documentOwnerId", documentOwnerId);
      await responseBody<{ error?: string }>(await fetch("/api/evidence", { method: "POST", body: form }));
      await loadLinked(true);
      setModalOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (fr ? "Échec de l’envoi." : "Upload failed."));
    } finally {
      setBusy(false);
    }
  }

  async function linkExisting() {
    if (!selectedEvidenceId || !workspaceId || busy) return;
    setBusy(true);
    setError("");
    try {
      await responseBody<{ error?: string }>(await fetch(`/api/evidence/${encodeURIComponent(selectedEvidenceId)}/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, themeId, controlId, questionId }),
      }));
      await loadLinked(true);
      setModalOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (fr ? "Échec de la liaison." : "Unable to link evidence."));
    } finally {
      setBusy(false);
    }
  }

  async function unlinkEvidence(item: EvidenceItem) {
    const link = links.find((candidate) => candidate.evidenceId === item.id);
    if (!link || busy) return;
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams({ workspaceId });
      await responseBody<{ error?: string }>(await fetch(`/api/evidence/${encodeURIComponent(item.id)}/links/${encodeURIComponent(link.id)}?${params}`, { method: "DELETE" }));
      await loadLinked(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (fr ? "Échec de la déliaison." : "Unable to unlink evidence."));
    } finally {
      setBusy(false);
    }
  }

  async function viewEvidence(item: EvidenceItem) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams({ workspaceId });
      const body = await responseBody<{ signedUrl?: string; error?: string }>(await fetch(`/api/evidence/${encodeURIComponent(item.id)}/download?${params}`));
      if (!body.signedUrl) throw new Error(fr ? "Lien de téléchargement indisponible." : "Download link unavailable.");
      const anchor = document.createElement("a");
      anchor.href = body.signedUrl;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (fr ? "Ouverture impossible." : "Unable to open evidence."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.evidenceBlock}>
      <div className={styles.actionBar}>
        {guidance && <button type="button" onClick={() => setGuidanceOpen((current) => !current)} aria-expanded={guidanceOpen}><Eye size={16} />{fr ? "Voir l’aide" : "View guidance"}</button>}
        <button type="button" disabled={!workspaceId} onClick={() => openModal("upload")}><Paperclip size={16} />{items.length ? (fr ? `Preuves · ${items.length} fichier${items.length > 1 ? "s" : ""}` : `Evidence · ${items.length} file${items.length > 1 ? "s" : ""}`) : (fr ? "Ajouter une preuve" : "Add evidence")}</button>
        {!items.length && <span className={styles.neutral}>{fr ? "Aucune preuve" : "No evidence"}</span>}
      </div>

      {guidanceOpen && guidance && <p className={styles.guidance}>{guidance}</p>}

      {items.length > 0 && <div className={styles.linkedList}>
        {visibleItems.map((item) => <div className={styles.fileChip} key={item.id}>
          <FileIcon item={item} />
          <span title={item.originalFilename}>{item.originalFilename}</span>
          <button type="button" disabled={busy} title={fr ? "Ouvrir" : "View"} aria-label={`${fr ? "Ouvrir" : "View"} ${item.originalFilename}`} onClick={() => void viewEvidence(item)}><Eye size={15} /></button>
          <button type="button" disabled={busy} title={fr ? "Délier" : "Unlink"} aria-label={`${fr ? "Délier" : "Unlink"} ${item.originalFilename}`} onClick={() => void unlinkEvidence(item)}><Unlink size={15} /></button>
        </div>)}
        {items.length > 2 && <button className={styles.textAction} type="button" onClick={() => setShowAll((current) => !current)}><Eye size={15} />{showAll ? (fr ? "Réduire" : "Show less") : (fr ? "Voir tout" : "View all")}</button>}
        <button className={styles.textAction} type="button" disabled={!workspaceId} onClick={() => openModal("upload")}><PlusCircle size={15} />{fr ? "Ajouter" : "Add another"}</button>
      </div>}

      {error && !modalOpen && <p className={styles.error} role="alert">{error}</p>}

      {modalOpen && <div className={styles.overlay} role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target && !busy) setModalOpen(false); }}>
        <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={`evidence-title-${questionId}`}>
          <header><h2 id={`evidence-title-${questionId}`}>{fr ? "Ajouter une preuve" : "Add evidence"}</h2><button type="button" aria-label={fr ? "Fermer" : "Close"} disabled={busy} onClick={() => setModalOpen(false)}><X size={20} /></button></header>
          <div className={styles.tabs}>
            <button type="button" className={mode === "upload" ? styles.activeTab : ""} onClick={() => { setMode("upload"); setError(""); }}><Upload size={18} />{fr ? "Importer une nouvelle preuve" : "Upload new evidence"}</button>
            <button type="button" className={mode === "existing" ? styles.activeTab : ""} onClick={() => { setMode("existing"); setError(""); }}><Link2 size={18} />{fr ? "Lier une preuve existante" : "Link existing evidence"}</button>
          </div>

          {mode === "upload" ? <>
            <button type="button" className={styles.dropzone} onClick={() => fileInput.current?.click()}>
              <Upload size={24} /><strong>{fr ? "Choisir un fichier" : "Choose a file"}</strong><span>PDF, PNG, JPEG, TXT, CSV · Max 10 MB</span>
            </button>
            <input ref={fileInput} className={styles.hiddenInput} type="file" accept={ACCEPTED_FILES} onChange={(event) => { setSelectedFile(event.target.files?.[0] ?? null); setError(""); }} />
            {selectedFile && <div className={styles.selectedFile}><FileIcon item={{ mimeType: selectedFile.type, originalFilename: selectedFile.name }} size={24} /><span><strong>{selectedFile.name}</strong><small>{fileKind({ mimeType: selectedFile.type, originalFilename: selectedFile.name })} · {formatSize(selectedFile.size)}</small></span><button type="button" disabled={busy} aria-label={fr ? "Retirer le fichier" : "Remove file"} onClick={() => { setSelectedFile(null); if (fileInput.current) fileInput.current.value = ""; }}><X size={18} /></button></div>}
            <section className={styles.documentInformation} aria-labelledby={`document-information-${questionId}`}>
              <header><h3 id={`document-information-${questionId}`}><FileText size={18} />{fr ? "Informations du document" : "Document information"}</h3><span>{fr ? "Facultatif" : "Optional"}</span></header>
              <div className={styles.metadataGrid}>
                <label className={styles.documentTypeField}>{fr ? "Type de document" : "Document type"}<select value={documentType} onChange={(event) => setDocumentType(event.target.value as DocumentType | "")}><option value="">{fr ? "Non renseigné" : "Not specified"}</option>{DOCUMENT_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                <label>Version<input maxLength={100} value={documentVersion} onChange={(event) => setDocumentVersion(event.target.value)} placeholder={fr ? "Non renseignée" : "Not specified"} /></label>
                <label>{fr ? "Date d’effet" : "Effective date"}<input type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} /></label>
                <label>{fr ? "Date de revue" : "Review date"}<input type="date" min={effectiveDate || undefined} value={reviewDate} onChange={(event) => setReviewDate(event.target.value)} /></label>
                <label>{fr ? "Responsable du document" : "Document owner"}<select value={documentOwnerId} onChange={(event) => setDocumentOwnerId(event.target.value)}><option value="">{fr ? "Non assigné" : "Not assigned"}</option>{workspaceMembers.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}</select></label>
              </div>
            </section>
          </> : <>
            <label className={styles.search}><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={fr ? "Rechercher une preuve" : "Search evidence"} /></label>
            <div className={styles.existingList}>
              {loadingExisting ? <p>{fr ? "Chargement…" : "Loading…"}</p> : matchingItems.length ? matchingItems.map((item) => {
                const linkCount = allLinks.filter((link) => link.evidenceId === item.id).length;
                const alreadyLinked = linkedEvidenceIds.has(item.id);
                return <button type="button" key={item.id} disabled={alreadyLinked} className={selectedEvidenceId === item.id ? styles.selectedEvidence : ""} onClick={() => setSelectedEvidenceId(item.id)}>
                  <i aria-hidden="true" /><FileIcon item={item} size={22} /><span><strong>{item.originalFilename}</strong><small>{fileKind(item)} · {formatSize(item.sizeBytes)}{linkCount > 0 ? ` · ${fr ? "Liée à" : "Linked to"} ${linkCount} question${linkCount > 1 ? "s" : ""}` : ""}</small></span>{alreadyLinked && <em>{fr ? "Déjà liée" : "Linked"}</em>}
                </button>;
              }) : <p>{fr ? "Aucune preuve disponible." : "No evidence available."}</p>}
            </div>
          </>}

          {error && <p className={styles.modalError} role="alert">{error}</p>}
          <footer><span>{fr ? "La preuve est facultative" : "Evidence is optional"}</span><button type="button" disabled={busy} onClick={() => setModalOpen(false)}>{fr ? "Annuler" : "Cancel"}</button><button type="button" className={styles.primary} disabled={busy || (mode === "upload" ? !selectedFile || selectedFile.size > MAX_FILE_BYTES : !selectedEvidenceId)} onClick={() => void (mode === "upload" ? upload() : linkExisting())}>{busy ? (fr ? "Traitement…" : "Working…") : mode === "upload" ? (fr ? "Joindre" : "Attach") : (fr ? "Lier la preuve" : "Link evidence")}</button></footer>
        </section>
      </div>}
    </div>
  );
}
