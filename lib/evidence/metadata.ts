import type { SupabaseClient } from "@supabase/supabase-js";

export const DOCUMENT_TYPES = [
  "information_security_policy",
  "access_control_policy",
  "incident_management_procedure",
  "backup_restore_procedure",
  "asset_management_policy",
  "other",
] as const;

export type DocumentType = typeof DOCUMENT_TYPES[number];
export type DocumentReviewState = "unknown" | "current" | "review_overdue";

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  information_security_policy: "Information Security Policy",
  access_control_policy: "Access Control Policy",
  incident_management_procedure: "Incident Management Procedure",
  backup_restore_procedure: "Backup & Restore Procedure",
  asset_management_policy: "Asset Management Policy",
  other: "Other",
};

export type DocumentMetadata = {
  documentType: DocumentType | null;
  documentVersion: string | null;
  effectiveDate: string | null;
  reviewDate: string | null;
  documentOwnerId: string | null;
};

export class EvidenceMetadataValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvidenceMetadataValidationError";
  }
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function validIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateDocumentMetadata(input: {
  documentType?: unknown;
  documentVersion?: unknown;
  effectiveDate?: unknown;
  reviewDate?: unknown;
  documentOwnerId?: unknown;
}): DocumentMetadata {
  const documentType = optionalString(input.documentType);
  const documentVersion = optionalString(input.documentVersion);
  const effectiveDate = optionalString(input.effectiveDate);
  const reviewDate = optionalString(input.reviewDate);
  const documentOwnerId = optionalString(input.documentOwnerId);

  if (documentType && !DOCUMENT_TYPES.includes(documentType as DocumentType)) {
    throw new EvidenceMetadataValidationError("Document type is not supported");
  }
  if (documentVersion && documentVersion.length > 100) {
    throw new EvidenceMetadataValidationError("Document version must be 100 characters or fewer");
  }
  if (effectiveDate && !validIsoDate(effectiveDate)) {
    throw new EvidenceMetadataValidationError("Effective date must be a valid date");
  }
  if (reviewDate && !validIsoDate(reviewDate)) {
    throw new EvidenceMetadataValidationError("Review date must be a valid date");
  }
  if (effectiveDate && reviewDate && reviewDate < effectiveDate) {
    throw new EvidenceMetadataValidationError("Review date must be on or after effective date");
  }
  if (documentOwnerId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(documentOwnerId)) {
    throw new EvidenceMetadataValidationError("Document owner is invalid");
  }
  return {
    documentType: documentType as DocumentType | null,
    documentVersion,
    effectiveDate,
    reviewDate,
    documentOwnerId,
  };
}

export async function requireDocumentOwnerInWorkspace(
  client: SupabaseClient,
  workspaceId: string,
  documentOwnerId: string | null,
) {
  if (!documentOwnerId) return;
  const { data, error } = await client
    .from("workspaces")
    .select("owner_id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.owner_id !== documentOwnerId) {
    throw new EvidenceMetadataValidationError("Document owner must belong to the active workspace");
  }
}

export function documentReviewState(reviewDate: string | null | undefined, today = new Date()): DocumentReviewState {
  if (!reviewDate) return "unknown";
  const currentDate = today.toISOString().slice(0, 10);
  return reviewDate < currentDate ? "review_overdue" : "current";
}

export function documentMetadataColumns(metadata: DocumentMetadata) {
  return {
    document_type: metadata.documentType,
    document_version: metadata.documentVersion,
    effective_date: metadata.effectiveDate,
    review_date: metadata.reviewDate,
    document_owner_id: metadata.documentOwnerId,
  };
}

export type WorkspaceMember = { id: string; label: string };

export async function readWorkspaceMembers(
  client: SupabaseClient,
  admin: SupabaseClient,
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const { data: workspace, error } = await client
    .from("workspaces")
    .select("owner_id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (error) throw error;
  if (!workspace?.owner_id) return [];
  const { data } = await admin.auth.admin.getUserById(workspace.owner_id);
  const user = data.user;
  if (!user) return [];
  const metadata = user.user_metadata as Record<string, unknown>;
  const label = [metadata.full_name, metadata.name, user.email, "Workspace owner"]
    .find((candidate) => typeof candidate === "string" && candidate.trim()) as string;
  return [{ id: user.id, label: label.trim() }];
}
