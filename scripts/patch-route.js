const fs = require('fs');
let content = fs.readFileSync('app/api/ai-documents/generate/route.ts', 'utf-8');
content = content.replace(
  `if (preparation.missingInputs.length || Object.values(preparation.sectionReadiness).includes("blocked")) return NextResponse.json({ error: "Required document information is missing.", code: "MISSING_INPUTS", missing: preparation.missingInputs }, { status: 409 });`,
  `
    console.log("DIAGNOSTIC missing:", preparation.missingInputs);
    console.log("DIAGNOSTIC readiness:", preparation.sectionReadiness);
    if (preparation.missingInputs.length || Object.values(preparation.sectionReadiness).includes("blocked")) return NextResponse.json({ error: "Required document information is missing.", code: "MISSING_INPUTS", missing: preparation.missingInputs }, { status: 409 });
  `
);
fs.writeFileSync('app/api/ai-documents/generate/route.ts', content);
