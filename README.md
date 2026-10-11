# LMS — Loan Management System (web)

Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui. Borrower portal and operations dashboard for the
[lms-backend](https://github.com/PModhe09/lms-backend) API. Architecture, decisions, demo accounts and the
one-command Docker setup are in the backend README.

**Live:** https://lms-web-five-nu.vercel.app
**Demo video:** _link to be added_

## Demo accounts

| Role | Email | Password | Lands on |
|---|---|---|---|
| Admin | admin@lms.dev | Admin@123 | `/dashboard`, all four modules |
| Sales | sales@lms.dev | Sales@123 | `/dashboard/sales` |
| Sanction | sanction@lms.dev | Sanction@123 | `/dashboard/sanction` |
| Disbursement | disbursement@lms.dev | Disburse@123 | `/dashboard/disbursement` |
| Collection | collection@lms.dev | Collect@123 | `/dashboard/collection` |
| Borrower | borrower@lms.dev | Borrower@123 | `/apply` (or sign up a new borrower) |

## What's here

- **Borrower portal** (`/apply`): three-step flow driven by the server's onboarding stage — personal details with
  instant eligibility hints (from the server's own rule set at `/api/bre/rules`; thresholds are never hard-coded here),
  drag-and-drop salary slip upload (straight to private storage with a presigned URL when the API host caps request size), amount/tenure sliders with live simple interest, then loan tracking with timeline and payments.
- **Operations dashboard** (`/dashboard`): Sales leads, Sanction (approve / reject with reason), Disbursement, Collection
  (record payments by UTR; loans auto-close). Admin sees all modules. A shared detail sheet shows the borrower, BRE result,
  salary slip (5-minute presigned link), status history and payments.
- **RBAC in the UI** is for experience only: `src/proxy.ts` verifies the session JWT and redirects by role, the sidebar
  shows only permitted modules, and action buttons render only for roles that hold the permission. The API re-checks every call.
- **Typed API**: `src/lib/api/schema.d.ts` is generated from the backend's OpenAPI document (`npm run gen:api`).
- Responsive down to 375 px (tables become cards), light and dark themes.

## Pages

| Route | Who | What |
|---|---|---|
| `/signup`, `/login` | public | Borrower signup (always creates a borrower), login for everyone |
| `/apply` | borrower | Stepper: personal details + eligibility → salary slip → loan sliders → apply; then loan status |
| `/apply/loans/[id]` | borrower | Own loan: summary, timeline, payments, rejection reason |
| `/dashboard` | staff | Queue counts for the modules the role can read |
| `/dashboard/sales` · `/sanction` · `/disbursement` · `/collection` | matching role, Admin | Module queues and actions |
| `/403` | staff | Shown when an executive opens another team's module |

## Project structure

```
src/
  app/              routes (App Router): (auth)/login, (auth)/signup, apply, dashboard/<module>, 403
  proxy.ts          route guard: verifies the session JWT and redirects by role (Next.js 16 name for middleware)
  components/
    borrower/       details form (BRE hints), slip upload, loan configurator (sliders), portal, loan detail
    ops/            loan queue table, detail sheet, sanction/disburse/payment actions, module counts
    loans/          status badge, timeline, summary, payments list
    ui/             shadcn/ui primitives
  lib/
    api/            generated OpenAPI types, typed client, server-side `fetchMe`
    bre.ts          client-side BRE hints over the server's rule set
    loan-math.ts    simple-interest preview (same formula as the server)
    rbac.ts         permission map (copy of the backend's), module list
e2e/                Playwright specs
```

## Run

Easiest: `docker compose up --build` from `../lms-backend` (starts everything, http://localhost:3000).

For frontend work against a running API:

```bash
cp .env.example .env.local   # API_ORIGIN + the backend's JWT_SECRET
npm install
npm run dev                  # http://localhost:3000
```

| Variable | Example | Notes |
|---|---|---|
| `API_ORIGIN` | `http://localhost:4000` | Where `/api/*` is forwarded (server-side only; the browser never sees it) |
| `JWT_SECRET` | same as the backend | Lets `proxy.ts` verify the session signature |

## Test

```bash
npm test                     # unit: BRE hints, SI parity with the server, formatting, RBAC helpers
npx playwright install chromium   # once
npm run test:e2e             # Playwright against http://localhost:3000 (or E2E_BASE_URL=https://…)
npm run lint && npm run typecheck
```

The E2E suite:
- signs up a borrower, fails then passes eligibility, uploads a slip, applies, and takes the loan through
  sanction → disbursement → two payments → CLOSED;
- uploads a 4.9 MB slip and sees a 5.1 MB one refused in the browser;
- checks that a Sales user is redirected away from Sanction and gets 403 from the API;
- checks that Admin sees every module on a phone-size screen.
 It passes locally and against the live site
(`E2E_BASE_URL=https://lms-web-five-nu.vercel.app npm run test:e2e`).
