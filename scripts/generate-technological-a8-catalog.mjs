import fs from "node:fs";
import path from "node:path";

const outputPath = path.resolve("content/assessment/technological/technological-controls.generated.ts");
const existingCatalog = fs.readFileSync(outputPath, "utf8").match(/= ([\s\S]+) as const;/)?.[1];
if (!existingCatalog) throw new Error("Cannot read the existing A.8.1–A.8.21 catalogue");
const controls = JSON.parse(existingCatalog).filter((control) => Number(control.code.slice(4)) <= 21);
const finalSource = fs.readFileSync(
  process.env.NORMCORE_A8_FINAL_README ?? "C:/Users/HP/Downloads/README-NORMCORE-TECHNOLOGICAL-A8.22-A8.34-FINAL-SAME-FORMAT-A8.1-A8.10.md",
  "utf8",
).replace(/\r\n/g, "\n");
for (const [, number, name, section] of finalSource.matchAll(/^# A\.(8\.\d+) \u2014 ([^\n]+)\n([\s\S]*?)(?=^# A\.8\.\d+|(?![\s\S]))/gm)) {
  const questions = [];
  for (const [, id, type, conditionKey, block] of section.matchAll(/^### `([^`]+)` \u2014 `([^`]+)`(?: \u2014 condition `([^`]+)`)?\n([\s\S]*?)(?=^### `|^## Quick Context|(?![\s\S]))/gm)) {
    const en = block.match(/\*\*EN \u2014 exact UI wording\*\*\n\n> ([^\n]+)/)?.[1];
    const fr = block.match(/\*\*FR \u2014 exact UI wording\*\*\n\n> ([^\n]+)/)?.[1];
    const partial = block.match(/`partially_implemented` \u2192 `([^`]+)`[^\n]*\n  - Gap: ([^\n]+)\n  - Remediation: ([^\n]+)/);
    const absent = block.match(/`not_implemented` \u2192 `([^`]+)`[^\n]*\n  - Gap: ([^\n]+)\n  - Remediation: ([^\n]+)/);
    if (!en || !fr || !partial || !absent) throw new Error(`Cannot parse ${id}`);
    questions.push({ id, type, conditionKey: conditionKey ?? null, question: { en, fr }, partial: { gapCode: partial[1], gap: partial[2], remediation: partial[3] }, absent: { gapCode: absent[1], gap: absent[2], remediation: absent[3] } });
  }
  const quickContext = [...section.matchAll(/^### `([^`]+)`\n- EN: ([^\n]+)\n- FR: ([^\n]+)/gm)].map((match) => ({ key: match[1], question: { en: match[2], fr: match[3] } }));
  controls.push({ id: `a${number.replace(".", "-")}`, code: `A.${number}`, name, applicabilityKey: null, questions, quickContext });
}
if (controls.length !== 34 || controls.some((control) => control.questions.length < 4)) throw new Error(`Incomplete A.8 catalogue: ${controls.map((control) => `${control.id}/${control.questions.length}`).join(", ")}`);
const output = `// Generated from the A.8.1â€“A.8.34 Technological README source packs. Do not edit manually.\nexport const technologicalControls = ${JSON.stringify(controls, null, 2)} as const;\n`;
fs.mkdirSync(path.resolve("content/assessment/technological"), { recursive: true });
fs.writeFileSync(path.resolve("content/assessment/technological/technological-controls.generated.ts"), output, "utf8");
console.log(`Generated ${controls.length} technological controls.`);







