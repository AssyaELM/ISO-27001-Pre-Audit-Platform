# Database & Migrations

NormCore uses **PostgreSQL** hosted via **Supabase**. The database is heavily normalized and relies on Row Level Security (RLS) to enforce tenant isolation.

## Schema Highlights

- **Workspaces & Organizations**: The root entity for multi-tenancy. Every piece of assessment data, evidence, and remediation plan is tied to a workspace.
- **Assessments**: Tables mapping ISO 27001 controls to organizational answers.
- **Evidence Foundation**: Stores metadata and links for uploaded evidence, attaching them to specific controls or gaps.
- **AI Documents Registry**: Tracks the generation lifecycle, drafts, and finalized compliance documents.
- **Super Admin Module**: Tables supporting access requests, organizational provisioning, and platform-wide monitoring.

## Migrations

All database schema changes and RLS policies are maintained in the `supabase/migrations/` directory.

### Applying Migrations Locally

If you are running Supabase locally:
```bash
npx supabase start
# Migrations are automatically applied on start.
```

If you are pushing to an external Supabase instance:
```bash
npx supabase db push --db-url <your-db-url>
```

### Important Rule
Never modify the database directly via the Supabase Dashboard UI for structural changes. Always write a new `.sql` migration file in `supabase/migrations/` to guarantee reproducibility.
