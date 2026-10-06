# Credora

Credora is a React + Vite financial-planning frontend backed by a TypeScript/Express REST API and PostgreSQL through Prisma. Each protected API operation scopes records to the user ID from the signed session cookie.

## Local setup

1. Install Node.js and pnpm, then install the dependencies:

   ```powershell
   pnpm install
   ```

2. Create a free Supabase project and copy the environment template:

   ```powershell
   Copy-Item .env.example .env
   ```

   In the Supabase dashboard, open **Project Settings → Database → Connection string**. Use the **Session pooler** string (port `5432`) for `DATABASE_URL`. Use the **Direct connection** string for `DIRECT_URL`; Supabase's direct endpoint may require IPv6. If your network does not support IPv6, use the **Session pooler** string for `DIRECT_URL` as well. Replace the placeholders in `.env` with the project-specific values and URL-encode any special characters in the database password.

   Replace `JWT_SECRET` with a random secret containing at least 32 characters. `PORT` is the API port (defaults to `3001`). `API_TARGET` should point to the API server (defaults to `http://localhost:3001`). Do not commit or share `.env`; it contains your database password and signing secret. The frontend talks to the API through Vite's `/api` proxy and does not need the Supabase database credentials.

3. Create the Prisma client and apply the schema to the Supabase database:

   ```powershell
   pnpm db:generate
   pnpm db:push
   ```

4. Start the API and Vite frontend together:

   ```powershell
   pnpm dev:all
   ```

   Open `http://localhost:5173`. Vite proxies `/api` requests to the API at `http://localhost:3001`. For separate terminals, use `pnpm api:dev` and `pnpm dev -- --port 5173`.

## Validation and builds

```powershell
pnpm typecheck
pnpm test:api
pnpm build
pnpm api:build
```

## Financial calculations

- The Credora Score is an educational 300–900 project score. The weighted factors are payment history (30%), credit utilisation (20%), debt burden (20%), credit history (15%), and recent credit activity (15%). It is not an official credit-bureau score or a lending decision.
- Payment history is based only on missed-payment counts users choose to report. If no history is supplied, that factor uses a neutral baseline. The utilisation factor is explicitly a loan-balance-to-original-principal proxy, not bureau-reported revolving-credit utilisation.
- Loan EMIs use the standard reducing-balance formula. Tax is a simplified progressive-slab estimate; it excludes individual deductions, rebates, cess, and other circumstances and is not tax advice.

## Authentication and API

Signup and login set a persistent, HTTP-only, same-site JWT cookie using the application's own authentication service (bcrypt password hashing and signed JWT sessions); Supabase is used for PostgreSQL storage, not Supabase Auth. Logout clears it. The API validates request bodies and derives ownership from the verified JWT; it does not accept a user ID for protected data operations. Configure `FRONTEND_ORIGIN` if the API is accessed directly from another origin.

The Prisma schema is in `prisma/schema.prisma`; the REST endpoints are under `/api` (auth, profile, income, expenses, onboarding, loans, dashboard, score, calculator, scenarios, tax, and reports).
