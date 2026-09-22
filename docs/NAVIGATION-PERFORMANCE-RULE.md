# Navigation Performance Rule

> **Rule**: Main application pages must never block the route transition with server-side network calls.

## Why

When a Next.js App Router `page.tsx` uses `async/await` to call Supabase, fetch data, or perform
any network I/O before returning JSX, the browser stays frozen on the **previous** page until the
server finishes. The user perceives this as lag or a broken navigation.

## The Rule

For all main application routes:

| Route | File |
|---|---|
| Dashboard | `app/dashboard/page.tsx` |
| Assessment | `app/assessment/page.tsx` |
| Gap Analysis | `app/gap-analysis/page.tsx` |
| Remediation Plan | `app/remediation-plan/page.tsx` |
| Evidence Room | `app/evidence-room/page.tsx` |
| AI Documents | `app/ai-documents/page.tsx` |

### DO

- Export a **synchronous** default function from `page.tsx`
- Render the client component shell immediately
- Fetch data inside the client component via `useEffect` or from a client-side cache
- Use `<Link prefetch={true}>` for sidebar navigation links

### DO NOT

- Use `export default async function` with network calls in main app `page.tsx`
- `await createClient()` or `await getUser()` in the page component
- `await getEvidenceData()`, `await getRemediationData()`, `await getDocumentsData()`
- `await fetch(...)` for any data before returning JSX

### Exception

`await params` is allowed for dynamic route segments (e.g. `app/ai-documents/[documentType]/page.tsx`)
because it only reads the URL parameter, not the network.

## Guardrail

Run the automated check:

```bash
node scripts/check-no-blocking-pages.js
```

This script scans all `page.tsx` files and exits with code 1 if any main app page contains
blocking network calls in its default export. Add it to your CI pipeline or pre-commit hook.

## Architecture Pattern

```
page.tsx (sync)          ->  ClientComponent (renders shell instantly)
                               useEffect(() => fetchData(), [])
                               shows inline loading state for data
                               never blocks the route transition
```
