import { documentReviewState, type DocumentReviewState } from "../evidence/metadata.ts";

export const AI_DOCUMENT_TYPES = [
  "information_security_policy",
  "access_control_policy",
  "incident_management_procedure",
  "backup_and_recovery_policy",
  "information_asset_management_policy",
  "backup_restore_procedure",
  "asset_management_policy",
] as const;

export type AiDocumentType = typeof AI_DOCUMENT_TYPES[number];
export type AiDocumentRegistryStatus = "missing" | "already_available" | "draft" | "finalized";

export const LEGACY_AI_DOCUMENT_TYPE_MAP = {
  backup_restore_procedure: "backup_and_recovery_policy",
  asset_management_policy: "information_asset_management_policy",
} as const;

export function canonicalAiDocumentType(documentType: string | null | undefined): string | null {
  if (!documentType) return null;
  return LEGACY_AI_DOCUMENT_TYPE_MAP[documentType as keyof typeof LEGACY_AI_DOCUMENT_TYPE_MAP] ?? documentType;
}

export const AI_DOCUMENT_LABELS: Record<AiDocumentType, string> = {
  information_security_policy: "Information Security Policy",
  access_control_policy: "Access Control Policy",
  incident_management_procedure: "Incident Management Procedure",
  backup_and_recovery_policy: "Backup and Recovery Policy",
  information_asset_management_policy: "Information Asset Management Policy",
  backup_restore_procedure: "Backup & Restore Procedure",
  asset_management_policy: "Asset Management Policy",
};

export type RegistryEvidenceRow = {
  id: string;
  document_type: string | null;
  document_version: string | null;
  effective_date: string | null;
  review_date: string | null;
  document_owner_id: string | null;
  original_filename: string;
  created_at: string;
  updated_at: string;
};

export type RegistryAiDocumentRow = {
  id: string;
  document_type: string;
  status: "draft" | "finalized";
  version: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  finalized_at: string | null;
  document_content?: unknown;
};

export type RegistryDocumentReference = {
  source: "evidence" | "ai_document";
  id: string;
  version: string | null;
  effectiveDate: string | null;
  reviewDate: string | null;
  documentOwnerId: string | null;
  filename: string | null;
  createdAt: string;
  updatedAt: string;
  finalizedAt: string | null;
  content: unknown | null;
};

export type AiDocumentRegistryEntry = {
  documentType: AiDocumentType;
  label: string;
  status: AiDocumentRegistryStatus;
  reviewState: DocumentReviewState;
  evidenceCount: number;
  activeDocument: RegistryDocumentReference | null;
  evidenceDocuments: RegistryDocumentReference[];
};

function descending(a: string | null, b: string | null) {
  return (b ?? "").localeCompare(a ?? "");
}

function evidenceReference(row: RegistryEvidenceRow): RegistryDocumentReference {
  return {
    source: "evidence", id: row.id, version: row.document_version,
    effectiveDate: row.effective_date, reviewDate: row.review_date,
    documentOwnerId: row.document_owner_id, filename: row.original_filename,
    createdAt: row.created_at, updatedAt: row.updated_at, finalizedAt: null, content: null,
  };
}

function aiDocumentReference(row: RegistryAiDocumentRow): RegistryDocumentReference {
  return {
    source: "ai_document", id: row.id, version: row.version,
    effectiveDate: null, reviewDate: null, documentOwnerId: null, filename: null,
    createdAt: row.created_at, updatedAt: row.updated_at, finalizedAt: row.finalized_at, content: row.document_content ?? null,
  };
}

export function buildAiDocumentsRegistry(
  evidenceRows: RegistryEvidenceRow[],
  aiDocumentRows: RegistryAiDocumentRow[],
  today = new Date(),
): AiDocumentRegistryEntry[] {
  return AI_DOCUMENT_TYPES.map((documentType) => {
    const evidence = evidenceRows
      .filter((row) => canonicalAiDocumentType(row.document_type) === documentType)
      .sort((a, b) => descending(a.updated_at, b.updated_at) || descending(a.created_at, b.created_at) || descending(a.id, b.id));
    const finalized = aiDocumentRows
      .filter((row) => row.document_type === documentType && row.status === "finalized" && row.version !== "setup")
      .sort((a, b) => descending(a.finalized_at, b.finalized_at) || descending(a.updated_at, b.updated_at) || descending(a.id, b.id));
    const drafts = aiDocumentRows
      .filter((row) => row.document_type === documentType && row.status === "draft" && row.version !== "setup")
      .sort((a, b) => descending(a.updated_at, b.updated_at) || descending(a.created_at, b.created_at) || descending(a.id, b.id));

    const selectedAiDocument = finalized[0] ?? drafts[0] ?? null;
    const selectedEvidence = evidence[0] ?? null;
    const status: AiDocumentRegistryStatus = finalized.length
      ? "finalized" : drafts.length ? "draft" : evidence.length ? "already_available" : "missing";
    const activeDocument = selectedAiDocument
      ? aiDocumentReference(selectedAiDocument)
      : selectedEvidence ? evidenceReference(selectedEvidence) : null;

    return {
      documentType,
      label: AI_DOCUMENT_LABELS[documentType],
      status,
      reviewState: activeDocument?.source === "evidence" ? documentReviewState(activeDocument.reviewDate, today) : "unknown",
      evidenceCount: evidence.length,
      activeDocument,
      evidenceDocuments: evidence.map(evidenceReference),
    };
  });
}
