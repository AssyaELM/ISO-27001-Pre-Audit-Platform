
const fs = require("fs");
let content = fs.readFileSync("lib/ai/documents/pdf-export.ts", "utf8");

content = content.replace(
  "export function buildPdfDocumentDefinition(document: StructuredDocument): any {",
  `export function buildPdfDocumentDefinition(
  document: StructuredDocument,
  meta: { organization: string; version: string; status: string; date: string; classification: string },
  logoDataUrl: string
): any {`
);

content = content.replace(
  `  const content: any[] = [];

  // Title
  content.push({ text: document.title, style: "header", margin: [0, 0, 0, 20] });`,
  `  const content: any[] = [];

  // Cover Page
  content.push({ text: " ", pageBreak: "after" }); // Empty text just to break page

  // Title on second page
  content.push({ text: document.title, style: "header", margin: [0, 0, 0, 20] });`
);

content = content.replace(
  `    pageMargins: [40, 60, 40, 60],
    footer: function (currentPage: number, pageCount: number) {`,
  `    pageMargins: [40, 60, 40, 60],
    background: function(currentPage: number, pageSize: any) {
      if (currentPage === 1) {
        return [
          {
            canvas: [
              { type: "rect", x: 0, y: 0, w: pageSize.width, h: pageSize.height, color: "#f8fafc" },
              { type: "polyline", points: [ {x:0, y:0}, {x: pageSize.width * 0.38, y: 0}, {x: pageSize.width * 0.52, y: pageSize.height}, {x: 0, y: pageSize.height} ], color: "#0f172a", closePath: true },
              { type: "rect", x: 0, y: pageSize.height - 40, w: pageSize.width, h: 40, color: "#0b1221" }
            ]
          },
          {
            text: meta.organization.toUpperCase(),
            absolutePosition: { x: 40, y: 60 },
            fontSize: 16,
            bold: true,
            color: "#ffffff",
            lineHeight: 1.2
          },
          ...(logoDataUrl ? [{
            image: logoDataUrl,
            width: 120,
            absolutePosition: { x: 40, y: 220 }
          }] : []),
          {
            absolutePosition: { x: 40, y: 440 },
            stack: [
              { text: "[TYPE]", color: "#14b8a6", fontSize: 10, bold: true },
              { text: (document.documentType || "POLICY").toUpperCase().replace(/_/g, " "), color: "#ffffff", fontSize: 16, bold: true, margin: [0, 2, 0, 15] },
              { text: "[VERSION]", color: "#14b8a6", fontSize: 10, bold: true },
              { text: meta.version.toUpperCase(), color: "#ffffff", fontSize: 16, bold: true, margin: [0, 2, 0, 15] },
              { text: "[STATUS]", color: "#14b8a6", fontSize: 10, bold: true },
              { text: meta.status.toUpperCase(), color: "#ffffff", fontSize: 16, bold: true, margin: [0, 2, 0, 15] },
              { text: "[DATE]", color: "#14b8a6", fontSize: 10, bold: true },
              { text: meta.date, color: "#ffffff", fontSize: 16, bold: true, margin: [0, 2, 0, 15] },
              { text: "[CLASSIFICATION]", color: "#14b8a6", fontSize: 10, bold: true },
              { text: meta.classification.toUpperCase(), color: "#ffffff", fontSize: 16, bold: true, margin: [0, 2, 0, 15] },
            ]
          },
          {
            canvas: [
              { type: "line", x1: 30, y1: 440, x2: 30, y2: 690, lineWidth: 2, lineColor: "#14b8a6" }
            ],
            absolutePosition: { x: 0, y: 0 }
          },
          {
            text: document.title.toUpperCase(),
            absolutePosition: { x: pageSize.width * 0.45, y: 200 },
            fontSize: 36,
            bold: true,
            color: "#0369a1",
            alignment: "right",
            margin: [0, 0, 40, 0]
          },
          {
            text: "ISO/IEC 27001\\nInformation Security\\nManagement System",
            absolutePosition: { x: pageSize.width * 0.5, y: 440 },
            fontSize: 12,
            color: "#64748b",
            alignment: "right",
            margin: [0, 0, 50, 0]
          },
          {
            canvas: [
              { type: "line", x1: pageSize.width - 40, y1: 440, x2: pageSize.width - 40, y2: 490, lineWidth: 1, lineColor: "#94a3b8" }
            ],
            absolutePosition: { x: 0, y: 0 }
          },
          {
            text: "© " + new Date().getFullYear() + " " + meta.organization + ". All Rights Reserved.",
            absolutePosition: { x: 40, y: pageSize.height - 25 },
            fontSize: 8,
            color: "#cbd5e1"
          },
          {
            text: "NormCore Cybersecurity Solutions | www.normcore.security",
            absolutePosition: { x: 0, y: pageSize.height - 25 },
            margin: [0, 0, 40, 0],
            alignment: "right",
            fontSize: 8,
            color: "#cbd5e1"
          }
        ];
      }
      return null;
    },
    footer: function (currentPage: number, pageCount: number) {
      if (currentPage === 1) return null;`
);

content = content.replace(
  `export async function generateDocumentPdf(document: StructuredDocument): Promise<void> {
  if (typeof window === "undefined") return;

  if (!window.pdfMake) {
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/pdfmake.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/vfs_fonts.min.js");
    } catch (err) {
      console.error(err);
      throw new Error("Could not load PDF libraries from CDN.");
    }
  }

  const pdfMake = window.pdfMake;
  const docDefinition = buildPdfDocumentDefinition(document);`,
  `export async function generateDocumentPdf(document: StructuredDocument, meta: { organization: string; version: string; status: string; date: string; classification: string }): Promise<void> {
  if (typeof window === "undefined") return;

  if (!window.pdfMake) {
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/pdfmake.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/vfs_fonts.min.js");
    } catch (err) {
      console.error(err);
      throw new Error("Could not load PDF libraries from CDN.");
    }
  }

  let logoDataUrl = "";
  try {
    const res = await fetch("/images/normcore-logo.png");
    if (res.ok) {
      const blob = await res.blob();
      logoDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (e) {
    console.error("Could not load logo", e);
  }

  const pdfMake = window.pdfMake;
  const docDefinition = buildPdfDocumentDefinition(document, meta, logoDataUrl);`
);

fs.writeFileSync("lib/ai/documents/pdf-export.ts", content);

