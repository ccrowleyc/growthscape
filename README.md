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
3. Add environment variables: `SESSION_SECRET` (32+ random characters), `ADMIN_PASSWORD` (10+ characters) and `CRON_SECRET` (any long random string; protects the month-end snapshot job).
4. Deploy. The build runs database migrations and the seed, then builds the app.

In production the first-sign-in password page is turned off, and the build fails if `ADMIN_PASSWORD` is missing.
The seed never overwrites a password that has already been set, so you can change yours from your profile afterwards.

## How it fits together

1. **Company setup** (Companies → a company): choose KPIs across the eight pillars, connect each to a data source and enter current values, create valuation models (which may only use the company's KPIs), add initiative owners.
2. **Dashboard** (home): KPI trends from month-end snapshots, scores against target, by pillar.
3. **Valuations**: point-in-time and target valuations from a model, charted over time.
4. **Value Creation Plans** and **Strategic Initiatives**: plan KPI changes by quarter and check they reach the target valuation.

A daily Vercel cron (`vercel.json`) calls `/api/cron/snapshot`; on the last day of each month it records every KPI's current value as that month's snapshot.
The seed creates **Demo Inc.** once, with two years of KPI history, models, valuations, initiatives and a plan.

## Status

| Phase | Area | Status |
|---|---|---|
| 1 | Login, company switcher, menus, profile | Done |
| 2 | Companies, initiative Owners, Administration (sub-users, per-company access) | Done |
| 3 | Valuation Models (formula engine) and Valuations | Done |
| 4 | Strategic Initiatives and Value Creation Plans | Done |
| 5 | Company KPIs and data sources, KPI dashboard, Portfolio Views | Done |

## Not built yet

- Live data-source connections (HubSpot, Salesforce, Xero, QuickBooks, Stripe can be chosen per KPI, but values are entered manually or by CSV for now).
- Currency is fixed to euro.
