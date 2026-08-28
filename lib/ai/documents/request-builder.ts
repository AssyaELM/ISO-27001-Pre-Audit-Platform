import { assertSafeAiDocumentGenerationRequest, type AiDocumentGenerationRequest, type AiDocumentLanguage } from "../providers/index.ts";
import { getAiDocumentTemplateSpec, type SupportedAiDocumentType } from "./catalog.ts";
import { buildCommonDocumentSystemInstructions, COMMON_DOCUMENT_PROMPT_CONTRACT_VERSION } from "./prompt-contract.ts";

export type CommonDocumentGenerationInput = {
  documentType: SupportedAiDocumentType;
  templateVersion: string;
  mappingVersion: string;
  generationContractVersion: string;
  documentTitle: string;
  language: AiDocumentLanguage;
  semanticFacts: Record<string, readonly unknown[]>;
  policyIntent: Record<string, unknown>;
  resolvedInputs: Record<string, unknown>;
  sectionReadiness: Record<string, "ready" | "partial" | "blocked">;
  generationConstraints?: readonly string[];
};

const stable = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, nested]) => [key, stable(nested)]));
};

export function buildCommonDocumentGenerationRequest(input: CommonDocumentGenerationInput): { systemInstructions: string; request: AiDocumentGenerationRequest } {
  const spec = getAiDocumentTemplateSpec(input.documentType);
  if (spec.version !== input.templateVersion) throw new Error("Template version does not match the selected document spec.");
  const request: AiDocumentGenerationRequest = {
    documentType: input.documentType,
    templateVersion: input.templateVersion,
    mappingVersion: input.mappingVersion,
    generationContractVersion: input.generationContractVersion,
    documentTitle: input.documentTitle,
    language: input.language,
    systemInstructions: buildCommonDocumentSystemInstructions(input.language),
    sections: spec.sections.map((section) => ({
      sectionId: section.id,
      title: section.label,
      generationMode: section.generationMode,
      expectedStatus: input.sectionReadiness[section.id] === "blocked" ? "needs_input" : section.generationMode === "ai_later" ? "generated" : "static",
      facts: stable(input.semanticFacts[section.id] ?? []) as readonly unknown[],
      policyIntent: stable(input.policyIntent[section.id] ?? {}) as Record<string, unknown>,
      resolvedInputs: stable(Object.fromEntries([...section.requiredInputs, ...section.optionalInputs].filter((key) => key in input.resolvedInputs).map((key) => [key, input.resolvedInputs[key]]))) as Record<string, unknown>,
      prohibitedInferences: spec.forbiddenInferences,
      structuralInstructions: (() => {
        if (!section.structure) return undefined;
        const s = section.structure;
        const ins = [];
        if (s.minBlocks) ins.push(`You MUST generate at least ${s.minBlocks} blocks for this section.`);
        if (s.requiredBlocks?.length) ins.push(`You MUST include the following block types: ${s.requiredBlocks.join(", ")}.`);
        if (s.minTableRows) ins.push(`Any table in this section MUST have at least ${s.minTableRows} rows.`);
        if (s.minTableColumns) ins.push(`Any table in this section MUST have at least ${s.minTableColumns} columns.`);
        if (s.minListItems) ins.push(`Any list in this section MUST have at least ${s.minListItems} items.`);
        return ins.length ? ins.join(" ") : undefined;
      })(),
    })),
    semanticFacts: stable(input.semanticFacts) as Record<string, readonly unknown[]>,
    policyIntent: stable(input.policyIntent) as Record<string, unknown>,
    resolvedInputs: stable(input.resolvedInputs) as Record<string, unknown>,
    sectionReadiness: stable(input.sectionReadiness) as Record<string, "ready" | "partial" | "blocked">,
    generationConstraints: [...new Set([buildCommonDocumentSystemInstructions(input.language), ...spec.forbiddenInferences, ...(input.generationConstraints ?? [])])],
  };
  assertSafeAiDocumentGenerationRequest(request);
  return { systemInstructions: buildCommonDocumentSystemInstructions(input.language), request };
}

export { COMMON_DOCUMENT_PROMPT_CONTRACT_VERSION };
