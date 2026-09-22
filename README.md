# NormCore - ISO-27001 Pre-Audit Platform

NormCore is an intelligent compliance platform designed to streamline the ISO-27001 certification journey. It offers an interactive dashboard, dynamic assessments, gap analysis, automated remediation planning, and AI-powered document generation to align an organization's policies with standard requirements.

## Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Local Development](#local-development)
- [Build & Production](#build--production)
- [Documentation Directory](#documentation-directory)

## Project Overview

For an in-depth look at what NormCore is and its primary objectives, refer to the [Project Overview](docs/PROJECT_OVERVIEW.md).

## Prerequisites

- **Node.js**: `v18.18.0` or higher (Use of `.nvmrc` or `nvm` recommended).
- **Git**: To clone the repository.
- **Supabase**: A Supabase project (local CLI or cloud) for PostgreSQL database, Auth, and Storage.
- **AI Providers**: At least one API key from supported LLM providers (Gemini, OpenAI, Groq, OpenRouter).

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url> ISO-27001-Pre-Audit-Platform
   cd ISO-27001-Pre-Audit-Platform
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Configuration

1. **Environment Variables:**
   Copy the example environment file and configure it:
   ```bash
   # On macOS/Linux:
   cp .env.example .env.local

   # On Windows (PowerShell):
   Copy-Item .env.example .env.local
   ```
   Open `.env.local` and populate the keys. **Do not commit this file.**

2. **Supabase Configuration:**
   See [Database Setup](docs/DATABASE.md) and [Authentication Setup](docs/AUTHENTICATION.md) for details on migrating the schema and configuring Auth.

3. **AI Configuration:**
   See [AI Integration](docs/AI.md) for setting up Gemini or other providers for the document generation module.

## Local Development

Run the development server:
```bash
npm run dev
```
Access the application at `http://127.0.0.1:3103` (or the URL specified in your `.env.local`).

## Build & Production

To build the application for production:
```bash
npm run build
```

To start the production server:
```bash
npm start
```
See [Deployment Guide](docs/DEPLOYMENT.md) for advanced hosting instructions.

## Documentation Directory

The `docs/` directory contains complete technical guides for all components of NormCore:
- [Architecture](docs/ARCHITECTURE.md)
- [Database & Migrations](docs/DATABASE.md)
- [Authentication](docs/AUTHENTICATION.md)
- [Security & Roles](docs/SECURITY.md)
- [Workflows](docs/WORKFLOW.md)
- [AI Capabilities](docs/AI.md)
- [Deployment](docs/DEPLOYMENT.md)
