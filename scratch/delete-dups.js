const fs = require("fs");
function deleteBetween(file, startStr, endStr) {
  let code = fs.readFileSync(file, "utf8");
  const startIdx = code.indexOf(startStr);
  const endIdx = code.indexOf(endStr);
  if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + code.substring(endIdx);
    fs.writeFileSync(file, code);
  }
}
deleteBetween("app/api/ai-documents/route.ts", "async function getDocumentsData", "import { getDocumentsData");
deleteBetween("app/api/evidence/route.ts", "async function getEvidenceData", "import { getEvidenceData");
deleteBetween("app/api/remediation/actions/route.ts", "async function getRemediationData", "import { getRemediationData");
console.log("Deleted duplicates");

