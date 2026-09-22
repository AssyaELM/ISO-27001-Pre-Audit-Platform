# Deployment

NormCore is built on Next.js and is optimized for deployment on platforms like Vercel, or any standard Node.js environment.

## Prerequisites for Production

1. A production Supabase project.
2. Production environment variables configured.
3. Node.js environment (v18.18.0+).

## Standard Node.js Deployment

1. **Install dependencies**:
   ```bash
   npm install --production
   ```

2. **Build the application**:
   ```bash
   npm run build
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

## Database Migrations

Before launching the application in a new environment, apply the migrations to your production Supabase database:
```bash
npx supabase db push --db-url <production-db-url>
```
