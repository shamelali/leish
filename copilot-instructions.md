# Copilot Instructions — Leish

This file is the source of truth for GitHub Copilot behavior in this workspace.
All suggestions, completions, and agent actions should follow these rules.

---

## Project Identity

**Leish** is a beauty marketplace for Malaysia. Users discover artists/studios, book time slots, and pay online. Providers manage their own profiles, availability, and services.

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **UI:** React 19 + Tailwind CSS v4 + Radix UI (shadcn/ui, new-york style)
- **Backend:** Supabase (Postgres + Auth + RLS)
- **Payments:** Billplz
- **Hosting:** Vercel (`beaute` project)
- **Testing:** Vitest

---

## Directory Conventions

| Path | Purpose |
|---|---|
| `app/` | Next.js App Router pages, layouts, and API routes |
| `app/api/` | API route handlers only — no UI here |
| `components/` | Reusable React components |
| `components/ui/` | shadcn/ui primitives — do not hand-edit |
| `lib/` | Domain logic, services, DB access, integrations |
| `lib/services/db.ts` | Core DB layer — booking transaction safety lives here |
| `hooks/` | Custom React hooks |
| `supabase/` | Migrations and DB artifacts |
| `scripts/` | Env verification and seed utilities |
| `styles/` | Global CSS |
| `public/` | Static assets |

---

## Code Style Rules

- Always use **TypeScript**. No `any` unless absolutely unavoidable — add a `// TODO: type this` comment if so.
- Use **named exports** for components and functions. Default exports only for Next.js pages/layouts.
- Use `@/` path alias for all imports (never relative `../../`).
- Keep API route handlers thin — delegate logic to `lib/services/`.
- Use **Zod** for all runtime validation (API inputs, env vars).
- Use **react-hook-form** + `@hookform/resolvers` for all forms.
- Use **server components** by default; add `"use client"` only when necessary.
- Prefer `async/await` over `.then()` chains.
- Never hard-code secrets or API keys — always use env vars.

---

## Booking Rules (Do Not Break)

- Availability slots are **30-minute** intervals.
- Slot start times must align to `:00` or `:30`.
- Bookings must be made **at least 24 hours in advance**.
- Always send slot **ID** (not label) to the booking API.
- Booking creation must use a **DB row lock** to prevent double-booking.
- Booking states: `pending` → `confirmed` → `paid_deposit` / `paid_full` → `canceled`.

---

## Payment Rules

- Webhook is the **source of truth** for payment state — never trust client-side confirmation alone.
- Handle duplicate webhook deliveries **idempotently**.
- Supported provider: **Billplz**.
- Malaysian payments default to **Billplz** (supports `full` and `deposit` flows).
- Always persist: transaction ID, paid amount, currency, and raw webhook payload.

---

## Auth & Security Rules

- Auth is handled by **Supabase Auth** with SSR session management.
- Session refresh runs through `proxy.ts` (not `middleware.ts`).
- Admin routes are server-guarded — check `profiles.role = 'admin'` server-side.
- Roles: `admin`, `artist`, `studio_manager`, `customer`.
- All DB tables must have **RLS policies** — never expose tables without them.
- Profile insert trigger must be idempotent: `ON CONFLICT (id) DO NOTHING`.

---

## Environment Variables

Required for all environments:

```
DATABASE_URL
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
```

At least one payment secret:
```
STRIPE_SECRET_KEY
BILLPLZ_API_KEY
BILLPLZ_API_KEY
```

Run `npm run verify-env` before building. It runs automatically via `prebuild`.

---

## API Route Conventions

- Location: `app/api/<resource>/route.ts`
- Payment creates: `app/api/payments/<provider>/create/route.ts`
- Payment webhooks: `app/api/payments/<provider>/webhook/route.ts`
- Always return typed JSON responses.
- Validate all inputs with Zod before touching the DB.

---

## Testing

- Run: `npm test` (Vitest)
- Write unit tests for all logic in `lib/`.
- Write smoke tests for key pages and API routes.
- Tests live alongside source files or in a `__tests__/` sibling directory.

---

## Quality Gate (Before Every PR)

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

All four must pass. Do not suggest bypassing these.

---

## What Copilot Should NOT Do

- Do not suggest `typescript.ignoreBuildErrors: true` in `next.config.mjs`.
- Do not suggest storing secrets in code or committing `.env` files.
- Do not suggest skipping RLS on any Supabase table.
- Do not suggest client-side-only payment confirmation.
- Do not edit files inside `components/ui/` directly — use `npx shadcn add` instead.
- Do not use `middleware.ts` for session handling — use `proxy.ts`.

---

## Current Priorities (Phase 2 → 3)

1. Fix Supabase signup trigger (duplicate `auth.users` trigger causing `Database error saving new user`).
2. Apply pending migrations to hosted Supabase and promote first admin user.
3. Replace `lib/data.ts` mock reads with live Supabase queries.
4. Build real availability engine with conflict-safe booking transactions.

See `ROADMAP.md` for full phase breakdown and `APP_MANUAL.md` for operational SOPs.
