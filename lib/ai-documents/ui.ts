import type { StructuredDocument } from "../ai/documents/generation-schema.ts";
import type { SupportedAiDocumentType } from "../ai/documents/catalog.ts";
import type { AiDocumentRegistryStatus } from "./registry.ts";

export const CANONICAL_AI_DOCUMENT_TYPES = [
  "information_security_policy",
  "access_control_policy",
  "incident_management_procedure",
  "backup_and_recovery_policy",
  "information_asset_management_policy",
] as const satisfies readonly SupportedAiDocumentType[];

export type AiDocumentUiStatus = "missing" | "ready" | "draft" | "finalized" | "already_available";
export type AiDocumentMissingInput = { key: string; label: string; sectionId: string; required: boolean; expectedType: string; reason: string };
export type AiDocumentPreparation = {
  missingInputs: AiDocumentMissingInput[];
  sectionReadiness: Record<string, "ready" | "partial" | "blocked">;
  knownInputCount: number;
  sourceCount: number;
};
export type AiDocumentUiEntry = {
  documentType: SupportedAiDocumentType;
  label: string;
  status: AiDocumentUiStatus;
  registryStatus: AiDocumentRegistryStatus;
  version: string | null;
  updatedAt: string | null;
  reviewDate: string | null;
  ownerId: string | null;
  evidenceId: string | null;
  filename: string | null;
  readiness: number;
  preparation: AiDocumentPreparation;
  content: StructuredDocument | null;
  setup?: Record<string, unknown>;
};

export function mapAiDocumentStatus(registryStatus: AiDocumentRegistryStatus, preparation: AiDocumentPreparation): AiDocumentUiStatus {
  if (registryStatus !== "missing") return registryStatus;
  return preparation.missingInputs.length === 0 && !Object.values(preparation.sectionReadiness).includes("blocked") ? "ready" : "missing";
}

export function readinessPercent(preparation: AiDocumentPreparation): number {
  const values = Object.values(preparation.sectionReadiness);
  if (!values.length) return 0;
  // This is input/section readiness, not a claim that a draft is compliant.
  return Math.round(values.reduce((sum, value) => sum + (value === "ready" ? 1 : value === "partial" ? .5 : 0), 0) / values.length * 100);
}

export function safeGenerationError(code?: string): string {
  if (code === "AI_PROVIDER_TIMEOUT") return "Generation took too long. No draft was saved.";
  if (code === "AI_PROVIDER_RATE_LIMITED") return "AI provider rate limit reached. Please wait and retry. No draft was saved.";
  if (code === "AI_PROVIDER_BAD_RESPONSE") return "The generated content did not pass validation. No draft was saved.";
  if (code === "AI_DOCUMENT_WRITE_GATE_FAILED") return "The generated draft contained information that could not be verified. No document was saved.";
  if (code === "AI_DOCUMENT_PERSISTENCE_FAILED") return "The draft was generated but could not be saved to the registry.";
  return "Draft generation couldn't be completed. Your document inputs are safe.";
}
