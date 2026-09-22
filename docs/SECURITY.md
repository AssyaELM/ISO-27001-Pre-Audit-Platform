# Security

Security is foundational to NormCore, ensuring that tenant data remains strictly isolated.

## Row Level Security (RLS)

All database tables (except for system-wide configuration) have RLS enabled.
Policies ensure that:
- Users can only read/write data associated with their `workspace_id`.
- The `workspace_id` is automatically derived from the authenticated user's session JWT.

## Environment Variables

Secrets such as `SUPABASE_SERVICE_ROLE_KEY` and AI API keys must be kept secure.
- They are stored in `.env.local`.
- They are only accessed server-side (Server Components, API Routes, Server Actions).
- Variables prefixed with `NEXT_PUBLIC_` are safe for client-side exposure.

## Roles & Permissions

- **User**: Standard workspace member.
- **Super Admin**: System administrator capable of managing organizations and access requests. Handled via specific claims or a separate management table.
