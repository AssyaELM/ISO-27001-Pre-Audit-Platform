/* eslint-disable @typescript-eslint/no-explicit-any */
import type { StructuredDocument, StructuredDocumentBlock } from "./generation-schema.ts";

declare global {
  interface Window {
    pdfMake: any;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

export function buildPdfDocumentDefinition(
  document: StructuredDocument,
  meta: { organization: string; version: string; status: string; date: string; classification: string },
  logoSymbolUrl: string,
  logoTextUrl: string
): any {
  const content: any[] = [];

  // Cover Page
  content.push({ text: " ", pageBreak: "after" });

  // Title on second page
  content.push({ text: document.title, style: "header" });

  // Process sections
  document.sections.forEach((section, index) => {
    // We want to keep the section title with its first content block to avoid orphans
    if (section.blocks && section.blocks.length > 0) {
      let startIndex = 0;
      let firstBlock = section.blocks[0];
      
      // Skip if first block is a duplicate heading
      if (firstBlock.type === "heading" && firstBlock.content && firstBlock.content.trim().toLowerCase() === section.title.trim().toLowerCase()) {
        startIndex = 1;
        firstBlock = section.blocks[1];
      }

      if (firstBlock) {
        content.push({
          unbreakable: true, // Guarantees heading and first block stay together
          stack: [
            { text: `${index + 1}. ${section.title}`, style: "sectionTitle" },
            renderBlock(firstBlock)
          ]
        });
      } else {
        content.push({ text: `${index + 1}. ${section.title}`, style: "sectionTitle" });
      }

      for (let i = startIndex + 1; i < section.blocks.length; i++) {
        content.push(renderBlock(section.blocks[i]));
      }
    } else if (section.content) {
      content.push({
        unbreakable: true,
        stack: [
          { text: `${index + 1}. ${section.title}`, style: "sectionTitle" },
          { text: section.content, style: "paragraph", margin: [0, 0, 0, 10] }
        ]
      });
    } else {
      content.push({ text: `${index + 1}. ${section.title}`, style: "sectionTitle" });
    }
  });

  return {
    content,
    header: function(currentPage: number, pageCount: number, pageSize: any) {
      if (currentPage === 1) return null;
      return {
        stack: [
          {
            columns: [
              { text: document.title, alignment: "left", color: "#64748b", fontSize: 9 },
              { text: meta.organization || "NormCore Cybersecurity", alignment: "right", color: "#64748b", fontSize: 9 }
            ],
            margin: [40, 25, 40, 5]
          },
          {
            canvas: [{ type: "line", x1: 40, y1: 0, x2: pageSize.width - 40, y2: 0, lineWidth: 0.5, lineColor: "#cbd5e1" }]
          }
        ]
      };
    },
    footer: function(currentPage: number, pageCount: number) {
      if (currentPage === 1) return null;
      return {
        columns: [
          { text: `Version: ${(meta.version || "Not specified").toUpperCase()}`, alignment: "left", color: "#64748b", fontSize: 9 },
          { text: `Page ${currentPage} of ${pageCount}`, alignment: "right", color: "#64748b", fontSize: 9 }
        ],
        margin: [40, 10, 40, 0]
      };
    },
    background: function(currentPage: number, pageSize: any) {
      if (currentPage === 1) {
        const w = pageSize.width;
        const h = pageSize.height;
        
        // Complex polygon mesh, shifted right and down, thinner lines, denser
        const lines = [
          { x1: w*0.4, y1: h-300, x2: w*0.6, y2: h-250 },
          { x1: w*0.6, y1: h-250, x2: w*0.8, y2: h-320 },
          { x1: w*0.8, y1: h-320, x2: w, y2: h-200 },
          { x1: w*0.4, y1: h-150, x2: w*0.6, y2: h-250 },
          { x1: w*0.6, y1: h-250, x2: w*0.75, y2: h-150 },
          { x1: w*0.75, y1: h-150, x2: w, y2: h-200 },
          { x1: w*0.4, y1: h-150, x2: w*0.5, y2: h-50 },
          { x1: w*0.5, y1: h-50, x2: w*0.75, y2: h-150 },
          { x1: w*0.75, y1: h-150, x2: w*0.9, y2: h-60 },
          { x1: w*0.9, y1: h-60, x2: w, y2: h-100 },
          { x1: w*0.5, y1: h-50, x2: w*0.7, y2: h },
          { x1: w*0.7, y1: h, x2: w*0.9, y2: h-60 },
          { x1: w*0.8, y1: h-320, x2: w*0.95, y2: h-400 },
          { x1: w*0.95, y1: h-400, x2: w, y2: h-300 },
          { x1: w*0.6, y1: h-250, x2: w*0.7, y2: h-400 },
          { x1: w*0.7, y1: h-400, x2: w*0.95, y2: h-400 },
          // New denser lines
          { x1: w*0.8, y1: h-320, x2: w*0.9, y2: h-200 },
          { x1: w*0.5, y1: h-150, x2: w*0.6, y2: h-100 },
          { x1: w*0.9, y1: h-60, x2: w*0.8, y2: h-150 },
          { x1: w*0.6, y1: h-250, x2: w*0.9, y2: h-200 }
        ].map(pt => ({ 
          type: "line", 
          x1: pt.x1 + 50, 
          y1: pt.y1 + 100, 
          x2: pt.x2 + 50, 
          y2: pt.y2 + 100, 
          lineWidth: 0.3, 
          lineColor: "#e2e8f0" 
        }));

        const metaItems = [
          { label: "[TYPE]", value: (document.documentType || "").toUpperCase().includes("PROCEDURE") ? "PROCEDURE" : "POLICY" },
          { label: "[VERSION]", value: (meta.version || "Not specified").toUpperCase() },
          { label: "[STATUS]", value: (meta.status || "Not specified").toUpperCase() },
          { label: "[DATE]", value: meta.date || "Not specified" },
          { label: "[CLASSIFICATION]", value: (meta.classification || "Not specified").toUpperCase() }
        ];
        
        const metaStack = metaItems.map(item => ({
          columns: [
            { width: 3, canvas: [{ type: "line", x1: 0, y1: 4, x2: 0, y2: 36, lineWidth: 3, lineColor: "#14b8a6" }] },
            { width: 8, text: "" },
            { stack: [
                { text: item.label, color: "#14b8a6", fontSize: 10, bold: true, margin: [0, 0, 0, 2] },
                { text: item.value, color: "#ffffff", fontSize: 18, bold: true }
              ]
            }
          ],
          margin: [0, 0, 0, 22]
        }));

        return [
          {
            canvas: [
              { type: "rect", x: 0, y: 0, w: w, h: h, color: "#f4f3f0" },
              ...lines,
              { 
                type: "polyline", 
                points: [ 
                  {x: 0, y: 0}, 
                  {x: w * 0.35, y: 0}, 
                  {x: w * 0.50, y: h * 0.85}, 
                  {x: w * 0.45, y: h}, 
                  {x: 0, y: h} 
                ], 
                color: "#0a1120", 
                closePath: true 
              },
              { type: "rect", x: 0, y: h - 40, w: w, h: 40, color: "#142542" }
            ],
            absolutePosition: { x: 0, y: 0 }
          },
          // 1. ORGANIZATION NAME
          {
            text: (meta.organization || "Organization").toUpperCase().replace(/\s+/g, "\n"),
            absolutePosition: { x: 45, y: 70 },
            fontSize: 22,
            bold: true,
            color: "#ffffff",
            lineHeight: 1.1
          },
          // 2. LOGO
          ...(logoSymbolUrl ? [{
            image: logoSymbolUrl,
            width: 110, // Increased
            absolutePosition: { x: 75, y: 190 } // Center of 170 text width is 85. 85 - (110/2) = 30. x = 45+30 = 75
          }] : []),
          ...(logoTextUrl ? [{
            image: logoTextUrl,
            width: 170, // Increased
            absolutePosition: { x: 45, y: 300 } 
          }] : []),
          // 3. METADATA
          {
            absolutePosition: { x: 45, y: 440 }, 
            stack: metaStack
          },
          // 4. MAIN TITLE
          {
            absolutePosition: { x: 0, y: 180 },
            columns: [
              { 
                width: w - 50, // Pushed to the right (stops 50px from edge) to center in white space
                text: (document.title || "Information Security Policy").toUpperCase().replace(/\s+/g, "\n"), 
                fontSize: 38, // Adjusted to balance margins left and right perfectly
                bold: true, 
                color: "#1e6091", 
                alignment: "right"
              }
            ]
          },
          // 5. ISO BLOCK
          {
            absolutePosition: { x: w - 240, y: 430 }, // Moved down to 430
            columns: [
              {
                width: 180,
                text: "ISO/IEC 27001\nInformation Security\nManagement System",
                fontSize: 14, // Increased
                color: "#64748b",
                alignment: "right",
                margin: [0, 0, 12, 0]
              },
              {
                width: 1,
                canvas: [{ type: "line", x1: 0, y1: 2, x2: 0, y2: 52, lineWidth: 1, lineColor: "#94a3b8" }] // Taller line
              }
            ]
          },
          // 6. FOOTER
          {
            text: "© " + new Date().getFullYear() + " " + (meta.organization || "NormCore") + ". All Rights Reserved.",
            absolutePosition: { x: 40, y: h - 25 },
            fontSize: 9,
            color: "#94a3b8"
          },
          {
            absolutePosition: { x: 0, y: h - 28 },
            columns: [
              { width: w - 65, text: "NormCore Cybersecurity Solutions | www.normcore.security", fontSize: 9, color: "#94a3b8", alignment: "right", margin: [0, 3, 0, 0] },
              {
                width: 15,
                ...(logoSymbolUrl ? { image: logoSymbolUrl, width: 14 } : { text: "" }),
                margin: [8, 0, 0, 0]
              }
            ]
          }
        ];
      }
      return null;
    },
    styles: {
      header: {
        fontSize: 24,
        bold: true,
        color: "#0a1120",
        alignment: "center",
        margin: [0, 0, 0, 15]
      },
      sectionTitle: {
        fontSize: 18,
        bold: true,
        color: "#0a1120",
        margin: [0, 25, 0, 12]
      },
      headingLevel3: {
        fontSize: 14,
        bold: true,
        color: "#1e6091",
        margin: [0, 15, 0, 8]
      },
      headingLevel4: {
        fontSize: 12,
        bold: true,
        color: "#14b8a6",
        margin: [0, 10, 0, 6]
      },
      paragraph: {
        fontSize: 10,
        lineHeight: 1.6,
        color: "#334155",
        margin: [0, 0, 0, 12]
      },
      list: {
        fontSize: 10,
        lineHeight: 1.6,
        color: "#334155",
        margin: [15, 0, 0, 12]
      },
      tableExample: {
        margin: [0, 8, 0, 16]
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: "#ffffff",
        margin: [4, 6, 4, 6]
      }
    },
    defaultStyle: {
      fontSize: 10,
      color: "#334155",
      lineHeight: 1.6
    },
    pageMargins: [40, 60, 40, 50],
  };
}

export async function generateDocumentPdf(document: StructuredDocument, meta: { organization: string; version: string; status: string; date: string; classification: string }): Promise<void> {
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

  let logoSymbolUrl = "";
  let logoTextUrl = "";
  try {
    const resSym = await fetch("/images/normcore-logo-symbol.png");
    if (resSym.ok) {
      const blob = await resSym.blob();
      logoSymbolUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }
    const resText = await fetch("/images/normcore-logo-text.png");
    if (resText.ok) {
      const blob = await resText.blob();
      logoTextUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }
  } catch (e) {
    console.warn("Could not load logo parts", e);
  }

  const pdfMake = window.pdfMake;
  if (!pdfMake?.createPdf) {
    throw new Error("PDF library is unavailable.");
  }
  const docDefinition = buildPdfDocumentDefinition(document, meta, logoSymbolUrl, logoTextUrl);
  const filename = `${document.title.replace(/\s+/g, "_")}.pdf`;
  const pdf = pdfMake.createPdf(docDefinition);
  if (typeof pdf.download !== "function") {
    throw new Error("PDF download is unavailable.");
  }

  // Await pdfmake's own blob/download Promise so generation failures are
  // handled by the export handler instead of becoming unhandled rejections.
  await pdf.download(filename);
}

function renderBlock(block: StructuredDocumentBlock): any {
  switch (block.type) {
    case "heading":
      return {
        text: pdfText(block.content),
        style: block.level === 3 ? "headingLevel3" : "headingLevel4",
        unbreakable: true
      };
    case "paragraph":
      return {
        text: pdfText(block.content),
        style: "paragraph",
      };
    case "bullet_list":
      return {
        ul: (block.items || []).map(pdfText),
        style: "list",
      };
    case "numbered_list":
      return {
        ol: (block.items || []).map(pdfText),
        style: "list",
      };
    case "table":
      return renderTable(block.headers || [], block.rows || []);
    default:
      return { text: "" };
  }
}

function pdfText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
  return "";
}

function renderTable(headers: string[], rows: string[][]): any {
  const tableBody: any[][] = [];
  const safeHeaders = (headers || []).map(pdfText);
  const safeRows = (rows || []).map((row) => (row || []).map(pdfText));

  if (safeHeaders.length > 0) {
    tableBody.push(
      safeHeaders.map((h) => ({
        text: h,
        style: "tableHeader",
      }))
    );
  }

  const isApproval = safeHeaders.some(h => h.toLowerCase().includes("signature") || h.toLowerCase().includes("approv"));
  const isDocControl = safeHeaders.some(h => h.toLowerCase().includes("version") && h.toLowerCase().includes("date"));
  
  let layoutWidths: any[] = [];
  if (safeHeaders.length === 4) {
    if (isDocControl) layoutWidths = [50, 70, '*', 120];
    else if (isApproval) layoutWidths = ['*', 120, 80, 150]; 
    else layoutWidths = Array(4).fill('*');
  } else if (safeHeaders.length === 3) {
     layoutWidths = ['auto', 'auto', '*'];
  } else {
     layoutWidths = Array(Math.max(safeHeaders.length, ...(safeRows.map((r) => r.length) || [1]))).fill('*');
  }

  if (safeRows.length > 0) {
    safeRows.forEach((row) => {
      tableBody.push(
        row.map((cell) => ({
          text: cell,
          fontSize: 10,
          color: "#334155",
          lineHeight: 1.4,
          margin: isApproval ? [6, 16, 6, 16] : [6, 8, 6, 8], // Extra padding for signatures
        }))
      );
    });
  }

  return {
    style: "tableExample",
    table: {
      headerRows: safeHeaders.length > 0 ? 1 : 0,
      widths: layoutWidths,
      body: tableBody,
      dontBreakRows: true, // prevents breaking rows across pages
    },
    layout: {
      hLineWidth: function (i: number, node: any) { 
        return i === 0 ? 0 : 0.5; // Bottom borders only
      },
      vLineWidth: function () { return 0; }, // No vertical borders
      hLineColor: function () { return '#cbd5e1'; },
      fillColor: function (rowIndex: number) {
        if (rowIndex === 0 && headers.length > 0) return "#0a1120"; // Navy Header
        return (rowIndex % 2 === 0) ? "#ffffff" : "#f8fafc"; // Zebra striping (very light)
      }
    },
  };
}
