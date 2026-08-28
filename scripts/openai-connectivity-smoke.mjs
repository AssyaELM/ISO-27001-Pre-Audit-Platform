import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OpenAiDocumentProvider } from "../lib/ai/providers/index.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const line of fs.readFileSync(path.join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match && process.env[match[1].trim()] === undefined) process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
}

const provider = new OpenAiDocumentProvider({ timeoutMs: 30_000 });
const startedAt = Date.now();
try {
  const response = await provider.generateStructuredDocument({
    documentType: "connectivity_probe",
    templateVersion: "probe",
    mappingVersion: "probe",
    generationContractVersion: "probe",
    documentTitle: "Connectivity probe",
    language: "en",
    systemInstructions: "Return only the JSON object required by the schema. Keep the answer very short.",
    sections: [{ sectionId: "probe", title: "Probe", generationMode: "ai_later", expectedStatus: "generated", facts: [], policyIntent: {}, resolvedInputs: {}, prohibitedInferences: [] }],
    semanticFacts: [],
    policyIntent: {},
    resolvedInputs: {},
    sectionReadiness: { probe: "ready" },
    generationConstraints: ["Return a short JSON object only."],
    providerOptions: { responseSchema: { type: "object", additionalProperties: false, required: ["ok"], properties: { ok: { type: "boolean" } } }, maxOutputTokens: 128, reasoning: { effort: "medium" } },
  });
  console.log(JSON.stringify({ result: "OPENAI_CONNECTIVITY_PASS", provider: response.provider, model: response.model, reasoning: "medium", httpStatus: response.httpStatus, requestIdPresent: Boolean(response.requestId), usage: response.usage ?? null, finishReason: response.finishReason ?? null, durationMs: Date.now() - startedAt }));
} catch (error) {
  console.log(JSON.stringify({ result: "OPENAI_CONNECTIVITY_FAIL", code: error?.code ?? "unknown", status: error?.status ?? null, safeDetail: error?.safeDetail ?? null, durationMs: Date.now() - startedAt }));
  process.exitCode = 1;
}
