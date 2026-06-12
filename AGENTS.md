# AGENTS.md

This file provides guidance to agents when working in this repository.

## Non-Obvious Project Rules

### Build/Test Commands
- Order: `npm run typecheck` → `npm run lint` (type errors break linting).
- `npm test` runs Vitest with coverage. Use `npm test -- --watch` for TDD.
- `npm run verify-env` runs automatically via `prebuild` hook.

### Critical Booking & Payment Rules
- **Slots**: 30-minute intervals, must align to `:00` or `:30`.
- **Lead Time**: Bookings MUST be made at least 24 hours in advance.
- **API**: Always send slot **ID** (not label) to the booking API.
- **Concurrency**: Booking creation MUST use DB row lock in `lib/services/db.ts`.
- **Payment**: Billplz is primary. Webhooks are the only source of truth; handle idempotently.
- **States**: `pending` → `confirmed` → `paid_deposit` / `paid_full` → `canceled`.

### Auth & Security
- **Session**: Refresh uses `proxy.ts`, NOT `middleware.ts`.
- **RLS**: All tables MUST have RLS. Use `(SELECT auth.uid())` instead of `auth.uid()` in policies to avoid performance warnings.
- **Roles**: `admin`, `artist`, `studio_manager`, `customer`.
- **Routing**: Post-auth redirects are centralized in `lib/routing.ts`.
- **OAuth**: Role selection for Google sign-in is handled via `sessionStorage` (`pendingOAuthRole`) and applied in `app/auth/callback/page.tsx`.

### Code Patterns
- **API Routes**: Keep handlers thin; delegate logic to `lib/services/`.
- **Validation**: Use Zod for all runtime validation and env vars.
- **Components**: Server components by default. Use `npx shadcn add` for UI components; do not edit `components/ui/` directly.

## Stack
- Next.js 16 (App Router) + TypeScript
- React 19 + Tailwind CSS v4 + Radix UI
- Supabase (Postgres + Auth + RLS)
- Billplz (Payments)
- Vitest (Testing)
