const fs = require("fs");
const file = "app/api/remediation/actions/route.ts";
let code = fs.readFileSync(file, "utf8");

// Delete the old GET try block up to return NextResponse.json
const startLogic = `try {
    const { client, user, error: authError } = await getCurrentUser();`;
const endLogic = `return NextResponse.json({ actions, members: [currentMember(auth.user)] }, { status: 200 });`;

const startIdx = code.indexOf(startLogic);
const endIdx = code.indexOf(endLogic);
if (startIdx !== -1 && endIdx !== -1) {
  const newLogic = `try {
    const data = await getRemediationData(workspaceId, locale);
    return NextResponse.json(data, { status: 200 });`;
  code = code.substring(0, startIdx) + newLogic + code.substring(endIdx + endLogic.length);
  // Add import
  code = "import { getRemediationData } from \"@/app/api/data-fetchers\";\n" + code;
  fs.writeFileSync(file, code);
  console.log("Patched route.ts");
} else {
  console.log("Could not find block to replace");
}

