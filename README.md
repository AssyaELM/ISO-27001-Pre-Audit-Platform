# NormCore

<p align="center">
  <img src="docs/assets/landing-page.png" alt="NormCore Landing Page" width="100%">
</p>

## 1. What is NormCore?
NormCore (formerly known as CapISO) is a comprehensive web platform designed to facilitate ISO 27001 pre-audits. It provides organizations with a guided pathway to assess their security posture, identify gaps, plan remediations, and automatically generate required compliance documentation.

## 2. Main Features
- **Dynamic Assessments**: Interactive questionnaires covering ISO 27001 Annex A controls (Organizational, People, Physical, Technological).
- **Gap Analysis**: Automated comparison of assessment answers against ISO standard requirements.
- **Remediation Planning**: Track progress, assign responsibilities, and set deadlines for identified gaps.
- **Evidence Room**: A centralized repository to upload and link proofs of compliance directly to controls.
- **AI Document Generation**: Automated drafting of mandatory ISO 27001 policies using organizational context.
- **Super Admin Dashboard**: Centralized management of organizations, access requests, and platform activity.

<p align="center">
  <img src="docs/assets/dashboard-overview.png" alt="NormCore Dashboard Overview" width="100%">
</p>

## 3. Main User Workflows

1. **Authentication**: Secure login and access management.
   <br>
   <p align="center">
     <img src="docs/assets/login-screen.png" alt="NormCore Login Screen" width="70%">
   </p>
2. **Onboarding**: Users define their organization's scope and context.
   <br>
   <p align="center">
     <img src="docs/assets/onboarding-owner.png" alt="Onboarding Owner" width="48%">
     <img src="docs/assets/onboarding-company-size.png" alt="Onboarding Company Size" width="48%">
   </p>
3. **Assessment**: Users answer guided ISO 27001 questions.
   <br>
   <p align="center">
     <img src="docs/assets/assessment-questionnaire.png" alt="Assessment Controls" width="90%">
   </p>
4. **Gap Analysis**: The system calculates compliance gaps automatically.
   <br>
   <p align="center">
     <img src="docs/assets/gap-analysis.png" alt="Gap Analysis" width="90%">
   </p>
5. **Remediation**: Users plan and assign tasks to fix gaps.
   <br>
   <p align="center">
     <img src="docs/assets/remediation-plan.png" alt="Remediation Plan" width="90%">
   </p>
6. **Evidence Room**: Users upload proofs of compliance.
   <br>
   <p align="center">
     <img src="docs/assets/evidence-room.png" alt="Evidence Room" width="90%">
   </p>
7. **AI Documents**: Users generate compliant security policies based on their unique context.
   <br>
   <p align="center">
     <img src="docs/assets/ai-assistant.png" alt="AI Policy Assistant" width="90%">
   </p>

## 4. Super Admin Workflows
The Super Admin dashboard (`/super-admin`) is strictly isolated and allows administrators to:
- Review and approve/reject user access requests.
- Provision new organizations and workspaces.
- Monitor global platform activity and AI token usage.

<p align="center">
  <img src="docs/assets/super-admin-dashboard.png" alt="Super Admin Dashboard" width="100%">
</p>

<br>

---

#  Developer Guide: Reproducing the Project

The following sections detail how to clone, configure, build, and deploy NormCore from scratch.

## 5. Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS and CSS Modules
- **Database & Backend**: Supabase (PostgreSQL)
- **AI Integration**: Google Gemini (primary provider). The project structure also supports additional AI providers where configured.

## 6. Repository Structure
The project follows a modular, domain-driven design pattern built upon the Next.js App Router.
- `app/`: Next.js routes, pages and API endpoints.
- `components/`: Reusable UI and feature components.
- `content/`: Application content and ISO-related content.
- `docs/`: Technical and project documentation.
- `lib/`: Business logic, Supabase and AI integrations.
- `public/`: Public static assets.
- `scripts/`: Project utility and validation scripts.
- `supabase/`: Database migrations and configuration.
- `tests/`: Automated tests.

See [Architecture Documentation](docs/ARCHITECTURE.md) for more details.

## 7. Prerequisites
- **Node.js**: Installed locally (see version below).
- **Git**: For version control and cloning.
- **Supabase**: A Supabase project (either local via CLI or cloud-hosted).
- **AI API Keys**: At least one valid API key from a supported provider (e.g., Google Gemini).

## 8. Supported Node.js Version
NormCore requires **Node.js v18.18.0 or higher**.

## 9. Local Installation
Clone the repository and install dependencies:
```bash
git clone <repository-url> ISO-27001-Pre-Audit-Platform
cd ISO-27001-Pre-Audit-Platform
npm install
```

## 10. Environment Variables
Copy the provided `.env.example` file to create your local configuration:
```bash
cp .env.example .env.local
```
Update `.env.local` with your specific values. **Never commit `.env.local` to version control.** It contains sensitive API keys and configuration specific to your environment.

## 11. Supabase Configuration
NormCore relies heavily on Supabase for Authentication, Database, and Row Level Security (RLS). You must configure the following variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Used securely on the server-side only).

## 12. Database Migrations
All database structures and RLS policies are stored in `supabase/migrations/`. 
To apply these to your local or production database, use the Supabase CLI:
```bash
npx supabase db push --db-url <your-db-url>
```
*Do not manually modify the database schema via the dashboard.*

## 13. Gemini / AI Configuration
To enable the AI Document Generation features, you must provide an API key. For the primary provider (Gemini):
- Obtain an API key from Google AI Studio.
- Set `GEMINI_API_KEY=your_api_key_here` in `.env.local`.
Other providers (OpenAI, Groq, OpenRouter) can be configured similarly.

## 14. Authentication Setup
Authentication is managed via Supabase Auth with Server-Side Rendering (SSR) support.
- Session tokens are stored in HTTP-only cookies.
- Ensure your local hostname (e.g., `http://127.0.0.1:3103` or `http://localhost:3000`) is added to your Supabase project's allowed redirect URIs.

## 15. Running the Application Locally
Start the development server:
```bash
npm run dev
```
The application will be accessible at the URL defined by `NEXT_PUBLIC_APP_URL` in your `.env.local` (default: `http://127.0.0.1:3103`). If you run the app on a different port (e.g., `http://localhost:3000`), ensure `NEXT_PUBLIC_APP_URL` and your Supabase redirect URLs are updated to match.

## 16. First-Time Verification
After starting the application, you can verify your local setup by following these steps:
1. Open the local URL in your browser.
2. Create an organization account or use an existing test account.
3. Complete the onboarding flow.
4. Create or open an assessment workspace.
5. Verify that the Assessment, Gap Analysis, Remediation Plan, Evidence Room, and AI Documents modules are accessible.

## 17. Running Typecheck, Lint and Build
To validate the codebase integrity, run the following commands:
```bash
# Verify TypeScript typings
npm run typecheck

# Run ESLint static analysis
npm run lint

# Create a production build (verifies all Next.js static and dynamic routes)
npm run build
```

## 18. Running Tests / Playwright
NormCore includes automated tests in the `tests/` directory, while `scripts/` contains utility and validation scripts.
- Utility/validation scripts can be executed via Node (e.g., `node scripts/assessment-rls-integration-test.mjs`).
- Automated UI tests are configured via `playwright.config.js`. Ensure browsers are installed before running them: `npx playwright install`.

## 19. Production Build and Deployment
NormCore is optimized for deployment on Vercel or any standard Node.js hosting environment.
```bash
npm install --production
npm run build
npm start
```
Remember to apply your Supabase database migrations to your production instance before starting the server.

## 20. Security Considerations
- **Data Isolation**: Multi-tenancy is strictly enforced at the database level using PostgreSQL Row Level Security (RLS) policies. Users can only access data tied to their specific `workspace_id`.
- **Secret Management**: Never hardcode API keys or the `SUPABASE_SERVICE_ROLE_KEY`. They must remain in server-side environment variables.
- **Authentication**: Rely entirely on the Supabase SSR cookie implementation provided in `lib/supabase/`.

## 21. Troubleshooting
- **Build Errors**: Ensure you are running Node.js v18.18.0 or higher.
- **Authentication Failures**: Verify your Supabase URL, Anon Key, and redirect URIs in both `.env.local` and the Supabase dashboard.
- **Database Access Issues**: Verify that your `SUPABASE_SERVICE_ROLE_KEY` is correct, and that migrations have been successfully applied.

## 22. Detailed Documentation Links
For deep dives into specific subsystems, consult the `docs/` directory:
- [Architecture](docs/ARCHITECTURE.md)
- [Database & Migrations](docs/DATABASE.md)
- [Authentication](docs/AUTHENTICATION.md)
- [Security & Roles](docs/SECURITY.md)
- [Workflows](docs/WORKFLOW.md)
- [AI Capabilities](docs/AI.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Project Overview](docs/PROJECT_OVERVIEW.md)
- [Frontend Guardrails](docs/README-NORMCORE-ASSESSMENT-FRONTEND-GUARDRAILS.md)
