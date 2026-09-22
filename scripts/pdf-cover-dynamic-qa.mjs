import assert from "node:assert/strict";
import { buildPdfDocumentDefinition } from "../lib/ai/documents/pdf-export.ts";

const documentFor = (documentType, title) => ({
  documentType,
  language: "en",
  title,
  sections: [{ title: "Purpose", blocks: [{ type: "paragraph", content: "Context-bound content." }] }],
});

const metaFor = (organization, version, status, date, classification) => ({
  organization,
  version,
  status,
  date,
  classification,
});

const first = buildPdfDocumentDefinition(
  documentFor("access_control_policy", "Access Control Policy"),
  metaFor("Alpha Security", "1.0", "DRAFT", "2026-08-29", "INTERNAL"),
  "symbol-a",
  "text-a",
);
const second = buildPdfDocumentDefinition(
  documentFor("incident_management_procedure", "Incident Management Procedure"),
  metaFor("Beta Health", "2.1", "FINAL", "2027-03-14", "CONFIDENTIAL"),
  "symbol-b",
  "text-b",
);

assert.equal(typeof first.background, "function");
assert.equal(typeof second.background, "function");
assert.equal(first.content.length, second.content.length, "cover/content structure must stay consistent");

const coverText = (definition, pageSize) => {
  const values = [];
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (typeof value.text === "string") values.push(value.text);
    for (const child of Object.values(value)) visit(child);
  };
  visit(definition.background(1, pageSize));
  return values.join("\n");
};
const firstCover = coverText(first, { width: 595, height: 842 });
const secondCover = coverText(second, { width: 595, height: 842 });

for (const value of ["ALPHA\nSECURITY", "ACCESS\nCONTROL\nPOLICY", "1.0", "DRAFT", "2026-08-29", "INTERNAL"]) assert.equal(firstCover.includes(value), true, value);
for (const value of ["BETA\nHEALTH", "INCIDENT\nMANAGEMENT\nPROCEDURE", "2.1", "FINAL", "2027-03-14", "CONFIDENTIAL"]) assert.equal(secondCover.includes(value), true, value);
assert.notEqual(firstCover, secondCover, "dynamic cover values must differ by context");

console.log("PDF COVER DYNAMIC QA: PASS");
