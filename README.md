# NormCore landing page

Premium, responsive landing page for NormCore, built with Next.js, TypeScript,
Tailwind CSS, and a portable scroll-scrub scene controller.

## Run locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3103`.

The npm scripts invoke their JavaScript entry points directly, so the same
commands work in PowerShell, Command Prompt, and WSL.

## Validate

```bash
npm run typecheck
npm run lint
npm run build
```

The current Architectural Matte Diorama scenes are code-rendered placeholders.
Landing-page copy is centralized in `content/landing.ts` and the English/French
preference is saved in the browser.

## Supabase authentication

Login, signup confirmation by six-digit email OTP, password recovery by OTP and
password updates use Supabase Auth with SSR cookies. Add these public project
values to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
```

The forms intentionally show a configuration message until both values exist.
Full dashboard, OTP email-template and SMTP instructions are in
`supabase/AUTH_SETUP.md`. Never expose a service-role key or SMTP password in a
`NEXT_PUBLIC_` variable.

## Before production

- Replace the placeholder contact addresses with monitored mailboxes.
- Set `NEXT_PUBLIC_LEGAL_ENTITY_NAME` and review the draft legal pages with
  qualified counsel for the target markets.
- Document the production hosting region, subprocessors, retention period and
  vulnerability-reporting channel.
- Add abuse protection appropriate to the deployment platform before public
  traffic is enabled.
