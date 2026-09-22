# Authentication

NormCore uses **Supabase Auth** with Server-Side Rendering (SSR) support. Authentication state is primarily managed via HTTP-only cookies.

## Core Mechanisms

- **SSR Cookies**: `lib/supabase/` contains configuration to securely create Supabase clients that read and write auth cookies for server components, server actions, and route handlers.
- **Sign Up / Login**: Standard email/password flows.
- **Workspaces**: Upon login, a user is associated with an organization and workspace. Access is governed by their membership status.

## Super Admin Flow

A dedicated Super Admin role manages the platform:
1. **Access Requests**: New users request access.
2. **Approval**: Super Admins review and approve requests, provisioning the organization and sending activation tokens/invitations.
3. **Activation**: The user clicks the link, sets their password, and activates their workspace.

## Troubleshooting Auth

If sessions are failing or components are throwing auth errors, ensure:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are correct.
- Local hostnames match the configured redirect URIs in Supabase Auth settings.
