# AGENTS.md

This file provides guidance to agents when working in this repository.

## Monorepo Structure

This is a **pnpm TurboRepo monorepo**: `pnpm@10.10.0` + `turbo@2.9.18`.

```
├── apps/
│   ├── web/      — www.leish.my (marketing, admin, customer)
│   ├── artist/   — artist.leish.my
│   └── studio/   — studio.leish.my
├── packages/shared/   — @leish/shared (auth, types, i18n, UI)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json       # root scripts call `turbo`
```

**Package names:** `@leish/web`, `@leish/artist`, `@leish/studio`, `@leish/shared`.

**Ports (dev):**
- Web: `3005`
- Artist: `3001`
- Studio: `3002`

## Developer Commands

Use **pnpm**, not npm. Install: `npm install -g pnpm`.

```bash
# Root → runs across packages
cd /home/shamelali/Project/leish
pnpm install
pnpm dev            # devs all 3 apps in parallel
pnpm dev:web        # web (port 3005)
pnpm dev:artist     # artist (port 3001)
pnpm dev:studio     # studio (port 3002)
pnpm build
pnpm typecheck      # WARN: broken due to pnpm bin not found in env
pnpm test           # broken due to pnpm bin not found in env

# Per-app (from each app/ dir)
cd apps/web    && pnpm dev   # port 3005
cd apps/artist && pnpm dev   # port 3001
cd apps/studio && pnpm dev   # port 3002
```

**CI Pipeline** (`.github/workflows/ci.yml`):
```bash
npm ci                 # uses npm + cache
npm run typecheck
npm run lint
npx vitest run --exclude '**/booking*.test.ts' --exclude '**/registration.test.ts' --exclude '**/*.load.test.ts'
npm run build
```

## Import Conventions

| Type | Import Path |
|------|-------------|
| Shared code (auth, types, i18n, utils) | `import { ... } from "@leish/shared/lib/..."` |
| App-local (components, pages, API routes) | `import { ... } from "@/..."` (Next.js alias) |
| Styles | Each app has its own `globals.css` (copied from `packages/shared/styles/globals.css`) |

## Cross-Subdomain Auth

All 3 apps share **one Supabase Auth project** via cookies with `domain: ".leish.my"` set in `packages/shared/lib/auth/ssr.ts`. Session refresh uses **`proxy.ts`** in each app, **not** `middleware.ts`.

## Critical Business Rules

| Rule | Why it matters |
|------|---------------|
| **Slots:** 30-minute intervals, align to `:00` or `:30`. | Backend invariant. |
| **Lead Time:** Bookings must be ≥24 hours in advance. | Business rule. |
| **API:** Send slot **ID** (not label) to booking API. | API contract. |
| **Payment:** Billplz webhooks are the **only** source of truth. | Never trust client-side payment confirmation. |
| **Booking States:** `pending` → `confirmed` → `paid_deposit` / `paid_full` → `canceled`. | State machine. |
| **RLS:** All tables MUST have RLS with `(SELECT auth.uid())` not `auth.uid()`. | Performance: avoids `auth_rls_initplan` warnings. |
| **Roles:** `admin`, `artist`, `studio`, `customer` (DB enum `profile_role`) | In DB, `studio_manager` = the stored enum value for "studio" role. |

## DB Trigger Gotchas

- **`handle_new_auth_user()`** maps `role="studio"` → `studio_manager` in `profiles.role`.
- Apps normalize `studio_manager` back to `studio` when reading.
- **Auth flow:** trigger creates `profiles` row on signup → auto-confirms via `api/auth/auto-confirm` fallback.

## Code Patterns

- **API Routes:** Keep thin. Delegate logic to `lib/services/`.
- **Validation:** Use Zod for all runtime validation and env vars.
- **Components:** Server components by default. Use `npx shadcn add` for UI components; **never** edit `components/ui/` directly.
- **Auth redirect logic:** Centralized in `packages/shared/lib/auth/routing.ts` (`getPostAuthRedirect`).
- **OAuth role:** `?role=` query param in redirect URLs (not localStorage).
- **Availability slots:** All writes use **raw SQL** with `getSql()` from `@/lib/db/postgres`. No client writes.
- **Rate limiting:** In-memory (`lib/ops/rate-limit.ts`), not the Postgres `rate_limit_check` function (orphan, now resecured). No client writes.

## What NOT To Do

- Do NOT use `middleware.ts` for session handling — use `proxy.ts`.
- Do NOT edit `components/ui/` directly — use `npx shadcn add` then customize.
- Do NOT suggest `typescript.ignoreBuildErrors` — fix the types.
- Do NOT skip RLS on any table.
- Do NOT use client-side-only payment confirmation.

## Infrastructure & Deploy

| Item | Value |
|------|-------|
| **Vercel** | `shamelalis-projects/leish` (linked via CLI) |
| **Supabase** | `rmsjrhamjmupvrxqyagm` (Southeast Asia/Singapore) |
| **SMTP** | Brevo `hello@leish.my`, `smtp-relay.brevo.com:587` |
| **Domain** | `leish.my` → `www.leish.my` via Cloudflare |

**Required Vercel env vars:** `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `DATABASE_URL`.

## Testing

- Vitest setup in `apps/web/vitest.config.ts`. Tests live alongside source OR in `__tests__/`.
- **Excluded test suites:** `booking*.test.ts`, `registration.test.ts`, `*.load.test.ts` (slow / flaky).

## Environment Setup

```bash
cp .env.example .env.local
# Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL
# See .env.example for full list
```
