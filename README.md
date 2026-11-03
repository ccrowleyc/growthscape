# GrowthScape

Value creation planning and valuation for portfolio companies.

Stack: Next.js 15 (App Router, server actions) · TypeScript · Tailwind CSS 4 · Prisma · SQLite (swap to Postgres for hosting).

## Run it locally

Requires Node 20+.

```bash
npm install
cp .env.example .env      # then set SESSION_SECRET to a long random string
npm run setup             # creates the database and seeds ABC, XYZ and ACME Inc.
npm run dev               # http://localhost:3000
```

Sign in as `crowley.conor@gmail.com`. On the first sign-in you'll be asked to choose a password.
To seed a password instead, run `ADMIN_PASSWORD='…' npm run db:seed` on a fresh database.

## Status

| Phase | Area | Status |
|---|---|---|
| 1 | Login, company switcher, menus, profile | Done |
| 2 | Companies, initiative Owners, Administration (sub-users, per-company access) | Done |
| 3 | Valuation Models (formula engine) and Valuations | Done |
| 4 | Strategic Initiatives and Value Creation Plans | Next |
| 5 | Assessments (8 pillars) and Portfolio Views | Planned |

## Before hosting publicly

- Set a strong `SESSION_SECRET`.
- Set the admin password (the first-login setup page is only safe while the app is private).
- Move from SQLite to Postgres (`provider = "postgresql"` in `prisma/schema.prisma`).

## Formula syntax (Valuation Models)

KPI codes (e.g. `MRR`, `EBITDA_GROWTH`), numbers and percentages (`15%`), operators `+ - * / ^`,
comparisons `> >= < <= = !=`, and functions `AVG MIN MAX SUM ABS ROUND IF AND OR NOT`.
Formulas are parsed safely (no `eval`). Tests: `npm test`.

Valuations always show the value from their model's current formula. If the model changed since a valuation was saved,
it's flagged and shows the previously saved value until you re-save it.
