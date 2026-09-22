# Architecture

NormCore is built on a modern, React-based stack optimized for performance, type safety, and seamless AI integration.

## Core Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/) for server-side rendering, routing, and API endpoints.
- **Language**: TypeScript for end-to-end type safety.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) alongside vanilla CSS modules for scoped components.
- **Database & Backend**: [Supabase](https://supabase.com/) (PostgreSQL) handling persistence, Row Level Security (RLS), and Authentication.

## Project Structure

- `app/`: Next.js App Router definitions. Contains pages, layouts, and API routes.
- `components/`: Reusable React components, organized by domain (`assessment/`, `dashboard/`, `evidence/`, `super-admin/`, etc.).
- `lib/`: Core business logic, utilities, AI provider integrations (`lib/ai/`), and Supabase clients (`lib/supabase/`).
- `supabase/`: Database migrations (`supabase/migrations/`) defining the schema and RLS policies.
- `scripts/`: Quality Assurance (QA) and testing scripts utilized during development to validate controls and behaviors.

## Key Design Principles

1. **Server-Side Rendering & Server Components**: Emphasized to minimize client payload and increase security (fetching data securely on the server).
2. **Modular Domain Driven Design**: Components and logic are grouped by functional domains (e.g., Remediation, Gap Analysis, AI Documents).
3. **Database-as-the-Source-of-Truth**: Business rules heavily rely on PostgreSQL Row Level Security (RLS) to ensure data isolation between workspaces.
