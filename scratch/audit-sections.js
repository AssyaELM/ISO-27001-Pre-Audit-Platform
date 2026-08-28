const fs = require("fs");
const files = [
  "access-control-policy.ts",
  "backup-and-recovery-policy.ts",
  "incident-management-procedure.ts",
  "information-asset-management-policy.ts",
  "information-security-policy.ts"
];

for (const file of files) {
  const content = fs.readFileSync("lib/ai-documents/" + file, "utf8");
  // Look for section(...)
  const regex = /section\(\s*"([^"]+)"\s*,\s*\d+\s*,\s*"[^"]+"\s*,\s*"(static|deterministic)"/g;
  let match;
  console.log("---", file, "---");
  while ((match = regex.exec(content)) !== null) {
    console.log(match[1], "-", match[2]);
  }
}

