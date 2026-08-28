const fs = require("fs");
const removeExport = (file, fnName) => {
  let code = fs.readFileSync(file, "utf8");
  const str = "import { " + fnName + " } from \"@/app/api/data-fetchers\";\nexport async function GET";
  const regex = new RegExp("export async function " + fnName + "[\\\\s\\\\S]*?\\nexport async function GET", "m");
  code = code.replace(regex, str);
  fs.writeFileSync(file, code);
};
removeExport("app/api/ai-documents/route.ts", "getDocumentsData");
removeExport("app/api/evidence/route.ts", "getEvidenceData");
removeExport("app/api/remediation/actions/route.ts", "getRemediationData");

const fixPage = (file, importPath) => {
  let code = fs.readFileSync(file, "utf8");
  code = code.replace(importPath, "@/app/api/data-fetchers");
  fs.writeFileSync(file, code);
};
fixPage("app/ai-documents/page.tsx", "@/app/api/ai-documents/route");
fixPage("app/ai-documents/[documentType]/page.tsx", "@/app/api/ai-documents/route");
fixPage("app/evidence-room/page.tsx", "@/app/api/evidence/route");
fixPage("app/remediation-plan/page.tsx", "@/app/api/remediation/actions/route");
console.log("Fixed!");

