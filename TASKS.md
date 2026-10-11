# TASKS — lms-frontend

Vertical slices in the same order as `../lms-backend/TASKS.md`. A frontend slice starts only after the
backend slice it calls is green. Each slice ends with `npm run lint && npm run typecheck && npm test`,
then a review, then one commit.

Legend: `[ ]` todo · `[x]` done · **AC** = acceptance criteria.

## Decisions made at planning time

| Topic | Decision | Why |
|---|---|---|
| Framework | Next.js 16 App Router, TypeScript strict, Tailwind, npm | Fixed stack; 16.x is current |
| Tailwind pipeline | `@tailwindcss/postcss` (not `@tailwindcss/turbopack`) | The turbopack loader could not resolve `tw-animate-css`; PostCSS is the documented path |
| Route guard | `proxy.ts` (Next 16 renamed `middleware.ts` to `proxy.ts`), verifies the JWT with `jose` | Same role as `middleware.ts` in `05-rbac.md`; UX only, the API re-checks |
| API access | `next.config.ts` `rewrites`: `/api/:path*` → `${API_ORIGIN}/api/:path*` | Cookie stays first-party (ADR 0001) |
| API types | `openapi-typescript` reads `../lms-backend/openapi.json` into `src/lib/api/schema.d.ts` (committed); `openapi-fetch` client | Typed calls, and Vercel can build without the backend repo |
| Data fetching | Client components + TanStack Query for lists and mutations; server components for static shells | Simple cache invalidation after approve/disburse/pay |
| Forms | `react-hook-form` + Zod resolver | Inline errors, same shape as the API errors |
| UI | shadcn/ui, neutral palette + one accent, light and dark (`next-themes`) | Clean fintech look |
| Money display | Format paise with `Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR'})` | ₹5,00,000 grouping |
| Tests | Vitest + Testing Library for components and the SI/BRE helpers | Same runner as the backend |

## Routes

```
/login  /signup                       public
/apply                                borrower: stepper (details → slip → loan) driven by onboardingStage
/apply/loans/[id]                     borrower: own loan detail + payments
/dashboard                            ops: home, shows only allowed modules
/dashboard/sales | sanction | disbursement | collection
/403
```

---

## (a) Scaffold + auth + RBAC skeleton

- [x] a1. `create-next-app` (TS, Tailwind, App Router, ESLint), Prettier, Vitest, shadcn/ui init, `next-themes`.
- [x] a2. `.env.example` (`API_ORIGIN`, `JWT_SECRET` for `proxy.ts`), rewrite in `next.config.ts`, `output: 'standalone'`.
- [x] a3. `npm run gen:api` + committed `schema.d.ts`; `src/lib/api/client.ts` (openapi-fetch, error envelope → typed `ApiError`).
- [x] a4. `src/lib/rbac.ts`: copy of `Permission` + `ROLE_PERMISSIONS`.
- [x] a5. Login and signup pages; after login, redirect by role (BORROWER → `/apply`, others → `/dashboard`).
- [x] a6. `proxy.ts`: no token → `/login`; BORROWER on `/dashboard/*` → `/apply`; executive on a module it lacks → `/403`.
- [x] a7. Dashboard shell: sidebar shows only allowed modules, user menu with logout, theme toggle.
- [x] a8. Dockerfile (multi-stage, standalone, non-root), used by the backend's `docker-compose.yml`.

**AC**: each seeded user lands on the right page; SALES typing `/dashboard/sanction` gets `/403`; logout clears the cookie.

## (b) Personal details + BRE

- [x] b1. Fetch `GET /api/bre/rules`; generic client evaluator (`src/lib/bre.ts`) gives inline hints. No thresholds hard-coded.
- [x] b2. Details form: full name, PAN (auto-uppercase), DOB, monthly salary, employment mode. On 422 show every failed rule.

**AC**: hints match the server result for the boundary cases (unit test on the evaluator with the v1 rules fixture).

## (c) Salary slip upload

- [x] c1. Drop zone (PDF/JPG/PNG, 5 MB check before upload for UX), progress state, shows uploaded file info.

**AC**: a 6 MB file is refused in the browser; a server 422 message is shown as-is.

## (d) Loan config + apply

- [x] d1. Sliders: amount ₹50,000–₹5,00,000 step ₹1,000, tenure 30–365 days step 1. Live SI and total (display only; the server decides).
- [x] d2. Apply button sends `{principalPaise, tenureDays}`; success shows the loan status card. `OPEN_LOAN_EXISTS` → message + link to the loan.
- [x] d3. "My loans" list and loan detail with status timeline and payments.

**AC**: the displayed total equals the server's `totalRepaymentPaise` for a sample of inputs (unit test against the same formula).

## (e) Sanction

- [x] e1. Table of APPLIED loans; detail drawer (borrower, BRE result, history, "view slip" via presigned URL); Approve; Reject with a required reason dialog. 409 → toast "already handled" + refetch.

## (f) Disbursement

- [x] f1. Table of SANCTIONED loans; Disburse with confirm dialog.

## (g) Collection

- [x] g1. Table of DISBURSED loans with outstanding; record-payment dialog (UTR, amount in ₹, date picker limited to disbursedAt..today); payment history. Closed loans leave the list with a toast.

## (h) Sales leads

- [x] h1. Leads table with a stage filter and BRE failure reasons.

## (i) Admin view

- [x] i1. Admin sees all four modules in the sidebar; dashboard home shows counts per module.

## (j) Polish

- [ ] j1. Responsive at 375 px (tables become cards), empty, loading and error states, dark mode check.
- [ ] j2. README (run, env, screenshots), Vercel deploy if time allows.
