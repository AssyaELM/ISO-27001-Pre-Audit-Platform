import assert from "node:assert/strict";
import { AI_DOCUMENT_TEMPLATE_SPECS } from "../lib/ai/documents/catalog.ts";
import { validateCommonDraftForPersistence } from "../lib/ai/documents/common-validated-draft-persistence.ts";

for (const [documentType, spec] of Object.entries(AI_DOCUMENT_TEMPLATE_SPECS)) {
  const context = { templateVersion: spec.version, mappingVersion: "1.0.0", generationContractVersion: "1.0.0", sectionReadiness: Object.fromEntries(spec.sections.map((section) => [section.id, "ready"])), prohibitedInferences: [], currentFacts: [] };
  const response = { provider: "openrouter", model: "nvidia/nemotron-3-super-120b-a12b:free", httpStatus: 200, status: "completed", structuredOutput: { documentType, language: "en", title: spec.label, sections: spec.sections.map((section) => ({ sectionId: section.id, title: section.label, status: section.generationMode === "ai_later" ? "generated" : "static", content: "Organization-defined policy content." })) } };
  assert.equal(validateCommonDraftForPersistence(documentType, context, response).sections.length, spec.sections.length);
}
console.log("AI DOCUMENT MULTI-TYPE PERSISTENCE QA: PASS");
