// Navigation Performance Guardrail
//
// Scans all app/*/page.tsx files for async default exports that contain
// blocking network calls (Supabase, data fetchers, fetch) before render.
//
// The only acceptable `await` in a page.tsx default export is `await params`
// (required by Next.js 15 for dynamic route segments).
//
// Usage:  node scripts/check-no-blocking-pages.js
// Exit:   0 = all clear, 1 = violations found
const fs = require("fs");
const path = require("path");

const APP_DIR = path.join(__dirname, "..", "app");

// Patterns that indicate a blocking network call in a server component page
const BLOCKING_PATTERNS = [
  /createClient\s*\(/,
  /getEvidenceData\s*\(/,
  /getRemediationData\s*\(/,
  /getDocumentsData\s*\(/,
  /getAssessmentData\s*\(/,
  /await\s+fetch\s*\(/,
  /supabase\.\w+/,
  /\.auth\.getUser\s*\(/,
  /\.auth\.getSession\s*\(/,
];

// Routes that are allowed to be async with network calls (auth pages, not main app)
const EXEMPT_ROUTES = [
  "login",
  "check-email",
  "signup",
  "forgot-password",
  "set-new-password",
  "password-updated",
  "onboarding",
  "api",
];

function isExempt(filePath) {
  const relative = path.relative(APP_DIR, filePath).replace(/\\/g, "/");
  return EXEMPT_ROUTES.some((r) => relative.startsWith(r + "/") || relative === r);
}

function findPages(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".next") {
      results.push(...findPages(full));
    } else if (entry.name === "page.tsx") {
      results.push(full);
    }
  }
  return results;
}

function extractDefaultExportBody(source) {
  const match = source.match(/export\s+default\s+async\s+function\s+\w*\s*\([^)]*\)\s*\{/);
  if (!match) return null;
  const start = match.index + match[0].length;
  let depth = 1;
  let i = start;
  while (i < source.length && depth > 0) {
    if (source[i] === "{") depth++;
    if (source[i] === "}") depth--;
    i++;
  }
  return source.slice(start, i - 1);
}

let violations = 0;
const pages = findPages(APP_DIR);

for (const filePath of pages) {
  if (isExempt(filePath)) continue;
  const source = fs.readFileSync(filePath, "utf-8");
  const body = extractDefaultExportBody(source);
  if (!body) continue;

  const relative = path.relative(APP_DIR, filePath).replace(/\\/g, "/");

  for (const pattern of BLOCKING_PATTERNS) {
    const m = body.match(pattern);
    if (m) {
      console.error("VIOLATION: " + relative);
      console.error("  Found blocking call: " + m[0]);
      console.error("  Rule: Main app pages must not await network calls before render.");
      console.error("  Fix:  Move data fetching to the client component (useEffect/cache).");
      console.error();
      violations++;
      break;
    }
  }
}

if (violations === 0) {
  console.log("\u2713 All page.tsx files comply with the no-blocking-navigation rule.");
  console.log("  Scanned " + pages.length + " pages, " + pages.filter((p) => !isExempt(p)).length + " enforced.");
  process.exit(0);
} else {
  console.error("\u2717 " + violations + " page(s) violate the no-blocking-navigation rule.");
  process.exit(1);
}
