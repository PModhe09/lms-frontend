# lms-frontend — agent notes

@AGENTS.md

Next.js 16 App Router + TypeScript strict + Tailwind 4 (PostCSS plugin) + shadcn/ui (radix-nova, neutral + teal accent).
Work plan: `TASKS.md`. Backend and design docs: `../lms-backend` (`docs/design/`).

## Commands
- `npm run dev` — :3000, forwards `/api/*` to `API_ORIGIN` (default http://localhost:4000). Needs `.env.local` (copy `.env.example`).
- `npm run lint && npm run typecheck && npm test` — typecheck runs `next typegen` first (route types like `LayoutProps`).
- `npm run gen:api` — regenerate `src/lib/api/schema.d.ts` from `../lms-backend/openapi.json`. Commit the result.
- Full stack: `docker compose up --build` from `../lms-backend`.

## Conventions
- Route guard is `src/proxy.ts` (Next 16 name for middleware). UX only: the API enforces RBAC on every call.
- API calls go through `api` + `unwrap` in `src/lib/api/client.ts`; errors become `ApiError` with the server's `code` and message.
  Show 422 messages to the user as-is.
- Server components read the user with `fetchMe()` (`src/lib/api/me.ts`); client components use TanStack Query.
- Role → module visibility comes from `src/lib/rbac.ts` (copy of the backend map). Never hard-code BRE thresholds; fetch `/api/bre/rules`.
- Money arrives as integer paise. Format only at display time with `en-IN` INR.
- Do not edit `src/components/ui/*` by hand unless needed; they come from `npx shadcn add`.
