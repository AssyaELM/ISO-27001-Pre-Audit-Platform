const fs = require("fs");
function stripExport(file, fnName) {
  let code = fs.readFileSync(file, "utf8");
  code = code.replace(new RegExp("export async function " + fnName, "g"), "async function " + fnName);
  fs.writeFileSync(file, code);
}
stripExport("app/api/ai-documents/route.ts", "getDocumentsData");
stripExport("app/api/evidence/route.ts", "getEvidenceData");
stripExport("app/api/remediation/actions/route.ts", "getRemediationData");

