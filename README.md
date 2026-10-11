# LMS — Loan Management System (web)

Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui. Borrower portal and operations dashboard for the
[lms-backend](https://github.com/PModhe09/lms-backend) API. Architecture, decisions, demo accounts and the
one-command Docker setup are in the backend README.

## What's here

- **Borrower portal** (`/apply`): three-step flow driven by the server's onboarding stage — personal details with
  instant eligibility hints (from the server's own rule set at `/api/bre/rules`; thresholds are never hard-coded here),
  drag-and-drop salary slip upload, amount/tenure sliders with live simple interest, then loan tracking with timeline and payments.
- **Operations dashboard** (`/dashboard`): Sales leads, Sanction (approve / reject with reason), Disbursement, Collection
  (record payments by UTR; loans auto-close). Admin sees all modules. A shared detail sheet shows the borrower, BRE result,
  salary slip (5-minute presigned link), status history and payments.
- **RBAC in the UI** is for experience only: `src/proxy.ts` verifies the session JWT and redirects by role, the sidebar
  shows only permitted modules, and action buttons render only for roles that hold the permission. The API re-checks every call.
- **Typed API**: `src/lib/api/schema.d.ts` is generated from the backend's OpenAPI document (`npm run gen:api`).
- Responsive down to 375 px (tables become cards), light and dark themes.

## Run

Easiest: `docker compose up --build` from `../lms-backend` (starts everything, http://localhost:3000).

For frontend work against a running API:

```bash
cp .env.example .env.local   # API_ORIGIN + the backend's JWT_SECRET
npm install
npm run dev
```

## Test

```bash
npm test                     # unit: BRE hints, SI parity with the server, formatting, RBAC helpers
npm run test:e2e             # Playwright against http://localhost:3000 (or E2E_BASE_URL=https://…)
npm run lint && npm run typecheck
```

The E2E suite signs up a borrower, fails then passes eligibility, uploads a slip, applies, and takes the loan through
sanction → disbursement → two payments → CLOSED; it also checks that a Sales user is redirected from Sanction and gets
403 from the API, and that Admin sees every module on a phone-size screen.
