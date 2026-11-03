# GrowthScape

Value creation planning and valuation for portfolio companies.

Stack: Next.js 15 (App Router, server actions) · TypeScript · Tailwind CSS 4 · Prisma · PostgreSQL.

## Run it locally

Requires Node 20+ and Docker (for the local database).

```bash
npm install
cp .env.example .env      # set SESSION_SECRET; ADMIN_PASSWORD is optional locally
docker compose up -d      # starts Postgres on localhost:5432
npm run setup             # creates tables and seeds ABC, XYZ and ACME Inc.
npm run dev               # http://localhost:3000
```

Sign in as `crowley.conor@gmail.com`. Locally, if `ADMIN_PASSWORD` was empty when seeding, you choose a password on first sign-in.

## Hosting (Vercel + Neon Postgres)

1. Import this repo into Vercel.
2. In the Vercel project, add a Neon Postgres database (Storage → Create → Neon). This sets `DATABASE_URL`.
3. Add environment variables: `SESSION_SECRET` (32+ random characters) and `ADMIN_PASSWORD` (10+ characters).
4. Deploy. The build runs database migrations and the seed, then builds the app.

In production the first-sign-in password page is turned off, and the build fails if `ADMIN_PASSWORD` is missing.
The seed never overwrites a password that has already been set, so you can change yours from your profile afterwards.

## Status

| Phase | Area | Status |
|---|---|---|
| 1 | Login, company switcher, menus, profile | Done |
| 2 | Companies, initiative Owners, Administration (sub-users, per-company access) | Done |
| 3 | Valuation Models (formula engine) and Valuations | Done |
| 4 | Strategic Initiatives and Value Creation Plans | Done |
| 5 | Assessments (8 pillars) and Portfolio Views | Done |

## Not built yet

- Live data-source connections for Assessments (HubSpot, Salesforce, Xero, QuickBooks, Stripe are listed as "coming soon"; manual entry and CSV import work today).
- Currency is fixed to USD.
