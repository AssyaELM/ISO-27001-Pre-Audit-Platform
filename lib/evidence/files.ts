export const EVIDENCE_BUCKET = "evidence";
export const EVIDENCE_MAX_FILE_SIZE = 10 * 1024 * 1024;

type AllowedFile = { mimeType: string; extension: string };

const allowedFiles: Record<string, AllowedFile> = {
  "application/pdf": { mimeType: "application/pdf", extension: "pdf" },
  "image/png": { mimeType: "image/png", extension: "png" },
  "image/jpeg": { mimeType: "image/jpeg", extension: "jpg" },
  "text/plain": { mimeType: "text/plain", extension: "txt" },
  "text/csv": { mimeType: "text/csv", extension: "csv" },
};

export class EvidenceFileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvidenceFileValidationError";
  }
}

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function isSafeText(bytes: Uint8Array) {
  if (bytes.some((value) => value === 0)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

function contentMatches(mimeType: string, bytes: Uint8Array) {
  if (mimeType === "application/pdf") return startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
  if (mimeType === "image/png") return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (mimeType === "image/jpeg") return startsWith(bytes, [0xff, 0xd8, 0xff]);
  return isSafeText(bytes);
}

export function sanitizeOriginalFilename(value: string) {
  const leaf = value.replace(/\\/g, "/").split("/").pop() ?? "";
  const sanitized = leaf
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[<>:"|?*]/g, "_")
    .trim()
    .slice(0, 255);
  if (!sanitized || sanitized === "." || sanitized === "..") {
    throw new EvidenceFileValidationError("Invalid file name");
  }
  return sanitized;
}

export async function validateEvidenceFile(file: File) {
  if (!(file instanceof File)) throw new EvidenceFileValidationError("A file is required");
  if (file.size <= 0) throw new EvidenceFileValidationError("The evidence file is empty");
  if (file.size > EVIDENCE_MAX_FILE_SIZE) {
    throw new EvidenceFileValidationError("Evidence files must not exceed 10 MiB");
  }
  const allowed = allowedFiles[file.type.toLowerCase()];
  if (!allowed) throw new EvidenceFileValidationError("Unsupported evidence MIME type");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!contentMatches(allowed.mimeType, bytes)) {
    throw new EvidenceFileValidationError("File content does not match its declared MIME type");
  }
  return {
    bytes,
    mimeType: allowed.mimeType,
    extension: allowed.extension,
    originalFilename: sanitizeOriginalFilename(file.name),
    sizeBytes: bytes.byteLength,
  };
}

export function generatedStoragePath(workspaceId: string, evidenceId: string, extension: string) {
  return `${workspaceId}/${evidenceId}/${crypto.randomUUID()}.${extension}`;
}

