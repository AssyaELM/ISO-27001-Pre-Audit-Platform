import { AiProviderError, type AiDocumentLanguage } from "../providers/types.ts";
import type { DocumentTemplateSpec } from "../../ai-documents/information-security-policy.ts";
import type { AiDocumentType } from "../../ai-documents/registry.ts";

export type StructuredDocumentBlock =
  | { type: "paragraph"; content: string }
  | { type: "heading"; level: 3 | 4; content: string }
  | { type: "bullet_list"; items: string[] }
  | { type: "numbered_list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

export type StructuredDocumentSectionStatus = "generated" | "static" | "needs_input";
export type StructuredDocumentSection = { sectionId: string; title: string; status: StructuredDocumentSectionStatus; content?: string; blocks?: StructuredDocumentBlock[] };
export type StructuredDocument = { documentType: string; language: AiDocumentLanguage; title: string; sections: readonly StructuredDocumentSection[] };

export function buildStructuredDocumentJsonSchema<T extends AiDocumentType>(spec: DocumentTemplateSpec<T>, language: AiDocumentLanguage, title: string, sectionReadiness: Record<string, "ready" | "partial" | "blocked">): Record<string, unknown> {
  return {
    type: "object", additionalProperties: false,
    required: ["documentType", "language", "title", "sections"],
    properties: {
      documentType: { const: spec.documentType }, language: { const: language }, title: { const: title },
      sections: {
        type: "array", minItems: spec.sections.length, maxItems: spec.sections.length,
        prefixItems: spec.sections.map((section) => ({
          type: "object", additionalProperties: false,
          required: ["sectionId", "title", "status", "blocks"],
          properties: {
            sectionId: { const: section.id }, title: { const: section.label },
            status: { const: readiness(sectionReadiness[section.id]) === "blocked" ? "needs_input" : section.generationMode === "ai_later" ? "generated" : "static" },
            blocks: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["type"],
                properties: {
                  type: { type: "string", enum: ["paragraph", "heading", "bullet_list", "numbered_list", "table"] },
                  content: { type: "string" },
                  level: { type: "number", enum: [3, 4] },
                  items: { type: "array", items: { type: "string" } },
                  headers: { type: "array", items: { type: "string" } },
                  rows: { type: "array", items: { type: "array", items: { type: "string" } } }
                }
              }
            },
          },
        })),
      },
    },
  };
}

const exactKeys = (value: Record<string, unknown>, keys: readonly string[]): boolean => Object.keys(value).length === keys.length && keys.every((key) => key in value);
const readiness = (value: unknown): "ready" | "partial" | "blocked" => value === "ready" || value === "partial" || value === "blocked" ? value : "blocked";

export function validateStructuredDocumentResponse<T extends AiDocumentType>(spec: DocumentTemplateSpec<T>, language: AiDocumentLanguage, title: string, sectionReadiness: Record<string, "ready" | "partial" | "blocked">, value: unknown): StructuredDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Structured document must be an object.");
  const root = value as Record<string, unknown>;
  if (!exactKeys(root, ["documentType", "language", "title", "sections"]) || root.documentType !== spec.documentType || root.language !== language || root.title !== title || !Array.isArray(root.sections) || root.sections.length !== spec.sections.length) throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Structured document root is invalid.");
  const statuses = new Set<StructuredDocumentSectionStatus>(["generated", "static", "needs_input"]);
  const sections: StructuredDocumentSection[] = [];
  for (const [index, expected] of spec.sections.entries()) {
    const candidate = root.sections[index];
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Structured document section is invalid.");
    const section = candidate as Record<string, unknown>;
    
    // We allow both `content` (legacy) or `blocks` (new)
    if (section.sectionId !== expected.id || section.title !== expected.label || typeof section.status !== "string" || !statuses.has(section.status as StructuredDocumentSectionStatus)) throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Structured document section does not match the template.");
    
    const expectedStatus: StructuredDocumentSectionStatus = readiness(sectionReadiness[expected.id]) === "blocked" ? "needs_input" : expected.generationMode === "ai_later" ? "generated" : "static";
    if (section.status !== expectedStatus) throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Structured document section status is inconsistent with readiness.");
    
    let blocks: StructuredDocumentBlock[] | undefined = undefined;
    let content: string | undefined = undefined;
    
    if (Array.isArray(section.blocks)) {
      blocks = section.blocks as StructuredDocumentBlock[];
      if (section.status === "generated" && blocks.length === 0) throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Structured document section blocks are empty.");
    } else if (typeof section.content === "string") {
      content = section.content;
      if (section.status === "generated" && !content.trim()) throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Structured document section content is empty.");
    } else {
      throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Structured document section missing blocks or content.");
    }
    
    sections.push({ sectionId: section.sectionId as string, title: section.title as string, status: section.status as StructuredDocumentSectionStatus, content, blocks });
  }
  return { documentType: root.documentType as string, language, title, sections };
}

export function buildSectionStructuredDocumentJsonSchema() {
  return {
    type: "object",
    required: ["blocks"],
    additionalProperties: false,
    properties: {
      blocks: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["type"],
          properties: {
            type: { enum: ["paragraph", "heading", "bullet_list", "numbered_list", "table"] },
            content: { type: "string" },
            level: { type: "number", enum: [3, 4] },
            items: { type: "array", items: { type: "string" } },
            headers: { type: "array", items: { type: "string" } },
            rows: { type: "array", items: { type: "array", items: { type: "string" } } }
          }
        }
      }
    }
  };
}

export function validateSectionStructuredDocumentResponse(structuredOutput: unknown): StructuredDocumentBlock[] {
  if (typeof structuredOutput !== "object" || structuredOutput === null) {
    throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Section response must be an object.");
  }

  const root = structuredOutput as { blocks?: unknown };

  if (!Array.isArray(root.blocks)) {
    throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Section response must contain a blocks array.");
  }

  if (root.blocks.length === 0) {
    throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Section response blocks cannot be empty.");
  }

  for (const block of root.blocks) {
    if (!block || typeof block !== "object" || typeof (block as Record<string, unknown>).type !== "string") {
      throw new AiProviderError("AI_PROVIDER_BAD_RESPONSE", "Invalid block format.");
    }
  }
  return root.blocks as StructuredDocumentBlock[];
}
