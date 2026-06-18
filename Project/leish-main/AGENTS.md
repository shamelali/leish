# AGENTS.md

This file provides guidance to agents when working with code in this repository.

---

## Non-Obvious Project Rules

### Build/Test Commands
- **Package manager:** `pnpm` (not npm). Install with `npm install -g pnpm`.
- Run `pnpm typecheck` before `pnpm lint` - type errors break linting
- `pnpm test` runs Vitest with coverage - use `pnpm test -- --watch` for TDD
- `turbo` commands: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`
- Individual apps: `pnpm dev:web` (port 3000), `pnpm dev:artist` (port 3001), `pnpm dev:studio` (port 3002)
- Dev root directly: `pnpm dev:root` (uses root next.config, port 3000)
- Tests can live alongside source files OR in `__tests__/` sibling directory

### Critical Booking Rules (Do Not Break)
- Availability slots are **30-minute** intervals, must align to `:00` or `:30`
- Bookings MUST be made **at least 24 hours in advance**
- Always send slot **ID** (not label) to the booking API
- Booking creation MUST use **DB row lock** in `lib/services/db.ts` to prevent double-booking
- States: `pending` → `confirmed` → `paid_deposit` / `paid_full` → `canceled`

### Payment Rules
- **Billplz** is the primary payment provider (not Stripe despite having stripe routes)
- Webhook is the **source of truth** - never trust client-side confirmation alone
- Handle duplicate webhook deliveries **idempotently** - check for existing transaction ID

### Auth & Security
- Session refresh uses `proxy.ts` (NOT `middleware.ts`) - this is critical
- All DB tables MUST have RLS policies - never expose tables without them
- Profile insert trigger must be idempotent: `ON CONFLICT (id) DO NOTHING`
- Roles: `admin`, `artist`, `studio_manager`, `customer`

### Code Patterns
- Keep API route handlers thin - delegate all logic to `lib/services/`
- Use Zod for all runtime validation including env vars
- Server components by default; add `"use client"` only when necessary

### What NOT To Do
- Do NOT use middleware.ts for session handling - use proxy.ts
- Do NOT edit components/ui/ directly - use `npx shadcn add` instead
- Do NOT suggest typescript.ignoreBuildErrors - fix the types instead
- Do NOT skip RLS on any Supabase table
- Do NOT use client-side-only payment confirmation

---

## AI Agent Guidelines
- Always run `npm run typecheck` before committing
- Use Droid's `/review` command before any PR
- For booking/payment code, verify against AGENTS.md rules first
- When editing API routes, keep handlers thin - delegate to `lib/services/`
- Use Zod for validating any user input

### Recommended AI Agents
| Agent | Best For |
|-------|----------|
| Droid | Code reviews, bug investigation, test generation |
| Claude Code | Architecture decisions, complex refactoring |
| OpenCode | Quick fixes, documentation |
| Continue | Pair programming, file exploration, inline code completion |
| Copilot Workspace | End-to-end feature implementation, bug fixes |
| Aider | CLI-based pair programming, git-aware editing |

Run agents with: `ollama launch <agent> --model <model>`

### Continue Configuration
Add to `.continue/config.py`:
```python
from continuedev.src.continuedev.core import continue_config

config = continue_config
config.models = [{"title": "Local", "provider": "ollama", "model": "llama3"}]
config.tools = ["codebase", "grep", "file_tree", "read"]
```

### Aider Configuration
```bash
# Install
pip install aider-chat

# Run with Ollama
aider --model llama3 --editor vim

# Quick commands
aider --map-tokens 4000  # Reduce context usage
aider --auto-commits    # Auto-commit changes
```

### GitHub Copilot Workspace
Install VS Code extension "GitHub Copilot Workspace" and configure in `.github/copilot-instructions.md` for project-specific guidance.

### Critical Business Rules
- NEVER break the 24-hour advance booking rule
- NEVER skip RLS policies on any table
- NEVER trust client-side payment confirmation - webhook is source of truth
- ALWAYS use slot ID (not label) when creating bookings

---

## Monorepo Structure

This is a **pnpm TurboRepo monorepo** with 3 deployable apps:

```
leish-main/                    ← Root (www.leish.my — marketing + admin + customer)
├── apps/
│   ├── artist/                → artist.leish.my (artist booking portal)
│   └── studio/                → studio.leish.my (studio booking portal)
├── packages/
│   └── shared/                → @leish/shared (auth, services, i18n, types, UI)
├── turbo.json
└── pnpm-workspace.yaml
```

### Import Conventions
- **Shared code** (auth, services, i18n, types, utils): `import { ... } from "@leish/shared/lib/..."`
- **App-local code** (pages, components, api routes): `import { ... } from "@/..."` (scoped to that app)
- **CSS**: each app has its own `styles/globals.css` (copies from `packages/shared/styles/globals.css`)

### Cross-Subdomain Auth
All 3 apps share a single Supabase Auth project. Cookies are configured with `domain: ".leish.my"` in `packages/shared/lib/auth/ssr.ts` and middleware to share sessions across subdomains.

## Stack (For Reference)
- Next.js 16 (App Router) + TypeScript
- React 19 + Tailwind CSS v4 + Radix UI
- Supabase (Postgres + Auth + RLS)
- Billplz for payments
- Vitest for testing

---

## Session Anchored Summary (24 May 2026)

### Goal
Fix all Supabase performance advisor warnings and complete remaining launch-blocking code fixes.

### Done
- Fixed all `auth_rls_initplan` warnings (replaced auth.<function>() with (SELECT auth.<function>()) in RLS policies across 8 tables).
- Consolidated all `multiple_permissive_policies` warnings (merged duplicate policies across 12 tables).
- Connected Vercel CLI (linked `shamelalis-projects/leish`), GitLab CLI (v1.99.0 via PAT), Supabase CLI (service role key).
- Validated all 6 tables accessible via service role key.
- Verified 6 code fixes already in place (c1-c6), built c7 (off-platform contact detection in `lib/ops/contact-filter.ts`).
- Added missing env vars to Vercel (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- Updated all tracking docs to reflect completion:
  - `leish_launch_command_center.html` — 7/7 code tasks marked done ✅
  - `leish-hub.html` — status card, pill, blocker, table, checklist, roadmap all updated
  - `leish-notion-hub.md` — master status, fixes table, checklist, roadmap all updated
  - `leish-chairman-briefing.docx` — #3 row updated from "4 fixes pending" to "Done ✅"

### Key Decisions
- Abandon Supabase CLI for RLS edits (SIGILL) → use Dashboard SQL Editor and manual policy JSON updates.
- Use service role key for validation queries instead of user-context CLI.
- Install GitLab CLI binary from gitlab.com releases (npm `glab` is different).
- Docx edited via zip extraction → XML edit → re-zip.

## Session Anchored Summary (31 May 2026)

### Goal
Fix all 95 Supabase lint warnings (14 auth_rls_initplan + 81 multiple_permissive_policies).

### Done
- Created `supabase/migrations/20260531000000_fix_rls_performance.sql` that:
  - Fixes **14 auth_rls_initplan** warnings by wrapping `auth.uid()` → `(SELECT auth.uid())` in policies across `provider_alerts`, `monitoring_logs`, `webhook_logs`, `loyalty_points_history`, `provider_assets`, `subscription_history`, `messages`, `provider_blocked_dates`
  - Fixes **81 multiple_permissive_policies** warnings by merging overlapping permissive policies into single combined policies per action across `booking_surcharges`, `payout_items`, `payouts`, `profiles`, `provider_assets`, `provider_blocked_dates`, `providers`, `reviews`, `service_surcharges`, `services`, `studio_gallery`, `studio_rooms`, `subscription_history`, `payments`
  - All merged policies use `(SELECT auth.uid())` pattern and maintain same access semantics (public read, owner mutates, admin full access)
  - Dropped duplicate dashboard-created policies on `profiles` (insert_own, insert_own_safe, upsert_own, select_own, delete_own, etc.)

### Key Decisions
- Created a single new migration (rather than editing historical migrations) to fix both lint categories atomically.
- For `profiles` table, cleaned up all the duplicated dashboard-generated policies into 4 clean policies (select/insert/update/delete own).
- Preserved `is_admin()` helper function calls where already in use (services, providers) — only wrapped inline `auth.uid()` references.

## Session Anchored Summary (26 May 2026)

### Goal
Polish the landing page, fix auth redirects, add forgot-password flow, fix lint/type errors.

### Done
- Removed duplicate `AiConcierge` from `page.tsx` (was rendering twice — once from `layout.tsx`).
- Added `services/crewai/**` to eslint ignore (was linting `.venv` third-party files).
- Refactored `handleSignIn` in `supabase-auth.tsx` — extracted helpers to fix cognitive complexity (16→below limit).
- Fixed unused params: `req` → `_req` in `graphql/route.ts`, `messages` → `_messages` in `ai-concierge.tsx`.
- Fixed `registration.test.ts` type error: `data` → `user_metadata` in `updateUserById` call.
- Changed default language from `ms` → `en` in `language-context.tsx` (landing now defaults to English).
- Added forgot password link to sign-in form → created `/forgot-password` (calls `resetPasswordForEmail`) and `/update-password` (handles recovery redirect).
- Rewrote `auth/callback/route.ts` with role-based redirects: after email confirmation, routes artists→`/artistonboard`, studios→`/studioonboard`, admins→`/admin`. Handles `type=recovery` by redirecting to `/update-password`.
- Test seed admin: `admin@example.com` / `password123`.

### Relevant Files
- `app/auth/callback/route.ts` — rewritten with role-based + recovery redirect
- `app/forgot-password/page.tsx` — new password reset request page
- `app/update-password/page.tsx` — new password update page (recovery handler)
- `components/supabase-auth.tsx` — forgot password link, refactored sign-in
- `lib/i18n/language-context.tsx` — default language changed to English
- `app/page.tsx` — removed duplicate AiConcierge
- `eslint.config.mjs` — ignore `services/crewai/**`
- `AGENTS.md` — this anchored summary

## Session Anchored Summary (31 May 2026) — Part 2

### Goal
Drop all unused indexes flagged by Supabase database linter (0005_unused_index).

### Done
- Created `supabase/migrations/20260531000001_drop_unused_indexes.sql` that drops **36 unused indexes** across 16 tables:
  - `admin_audit_log` (1), `provider_assets` (3), `provider_alerts` (4), `bookings` (4), `messages` (2), `monitoring_logs` (2), `webhook_logs` (2), `providers` (7), `subscription_history` (2), `reviews` (2), `booking_surcharges` (1), `services` (1), `studio_gallery` (1), `payouts` (2), `payout_items` (1), `provider_blocked_dates` (1)
- `providers_slug_idx` was safe to drop because `providers.slug` has a `UNIQUE` constraint that auto-creates its own index
- All `DROP INDEX` statements use `IF EXISTS` and schema-qualified names for safety

### Key Decisions
- Dropped all unused indexes rather than keeping them — pre-launch app has no query patterns to justify them; they can be recreated later if needed

## Session Anchored Summary (31 May 2026) — Part 3

### Goal
Fix remaining code issues flagged in tracking docs: null-return server clients, stale deploy script, hardcoded test emails, eslint-disable cleanups, and SSR client null checks.

### Done
- **`lib/supabase/server.ts`**: `getSupabaseServerClient()` now throws on missing env vars instead of returning null (previously caused silent 404s)
- **`lib/supabase/ssr.ts`**: Same fix — `getSupabaseSsrClient()` throws instead of returning null
- **`scripts/deploy.sh`**: Replaced stale `api/debug/env` health check (route was deleted) with `api/health`
- **`scripts/check-users.ts`**: Updated hardcoded `@example.com` test emails to `@leish.my`
- **Global error page + checkout route**: Removed stale `eslint-disable` for unused vars; fixed by prefixing param with `_` and removing unused constant
- **46 files across app & lib**: Removed now-unnecessary `if (!supabase)` null checks after SSR client change
- **Pre-existing uncommitted changes reviewed**: seed-users.ts, seed_test_users.sql, config.toml (Google OAuth ID, `@leish.my` test emails) — all confirmed reasonable

### Relevant Files
- `lib/supabase/server.ts` — throw instead of null
- `lib/supabase/ssr.ts` — throw instead of null
- `scripts/deploy.sh` — health check URL fixed
- `scripts/check-users.ts` — test emails updated
- `app/global-error.tsx`, `app/api/subscription/checkout/route.ts` — eslint cleanups
- `supabase/migrations/20260531000001_drop_unused_indexes.sql` — new migration

### Key Decisions
- Throwing instead of returning null means the error boundary catches missing env vars early instead of causing confusing 404s
- Placeholder images (`/artists/placeholder.png`, `/studios/placeholder.png`) are legitimate fallbacks — not a code bug; replacing them is a content/design task

## Session Anchored Summary (5 June 2026)

### Goal
Replace GitHub remote URL from `leish_app.git` → `leish.git`.

### Done
- Verified `git@github.com:shamelali/leish.git` is SSH-accessible and shares common history (commit `072c3a7`)
- Replaced `github` remote URL: `git remote set-url github git@github.com:shamelali/leish.git`
- `origin` (GitLab) left unchanged as backup

### Key Decisions
- Chose to replace existing remote rather than adding a third remote — `leish.git` is simply a cleaner name for the same project

## Session Anchored Summary (5 June 2026) — Part 2

### Goal
Implement loyalty API, studio room CRUD, notification system, and dashboard enhancements.

### Done
- **Loyalty System**: Created `/api/loyalty/status` and `/api/loyalty/history` API routes. Updated `LoyaltyStatusCard` to fetch real data from the live service instead of mock data. Added loyalty card display to customer account page.
- **Studio Room CRUD**: Created `lib/services/studio-rooms.ts` with full CRUD. Added API routes (`GET/POST /api/studio/rooms`, `PATCH/DELETE /api/studio/rooms/[id]`). Built room management UI at `/studios/dashboard/rooms/` with add/edit/delete dialogs.
- **Notification System**: Created `notifications` table (migration + live SQL via psql). Built `lib/services/notifications/` service with list, unread count, mark read, create. Added API routes (`GET/PATCH /api/notifications`, `POST /api/notifications/send`). Built `NotificationBell` component with popover, unread badge, inline mark-as-read. Added to navbar (desktop + mobile) for authenticated users.
- **Database Types**: Generated `lib/supabase/database.types.ts` from live schema (26 tables, 10 enums).
- **Utitilies**: Created `utils/supabase/{server,client,middleware}.ts` with proper SSR cookie-based client setup. Fixed type annotations for `CookieOptions`.
- **MCP**: Added Supabase remote MCP server to `~/.config/opencode/opencode.json`.
- **Agent Skills**: Installed `supabase` and `supabase-postgres-best-practices` skills.
- **Tests**: `npm test` — 73 passed, 0 failures from our changes. `npm run typecheck` — clean.
- **Git**: Committed and pushed to GitLab. GitHub push blocked — `shamelali/leish_app` repo doesn't exist on GitHub yet.

### Relevant Files
- `app/api/loyalty/{status,history}/route.ts` — new loyalty API
- `app/api/studio/rooms/route.ts` — studio room CRUD API
- `app/api/notifications/route.ts` — notification list/mark-read API
- `app/api/notifications/send/route.ts` — notification creation API
- `components/loyalty-status-card.tsx` — rewritten with real data
- `components/notifications/notification-bell.tsx` — new notification UI
- `components/navbar.tsx` — NotificationBell added
- `app/studios/dashboard/rooms/page.tsx` — room management UI
- `lib/services/studio-rooms.ts` — room CRUD service
- `lib/services/notifications/index.ts` — notification service
- `lib/supabase/database.types.ts` — generated from live schema
- `supabase/migrations/20260604000000_create_notifications.sql` — notifications table migration
- `utils/supabase/{server,client,middleware}.ts` — SSR client helpers
- `~/.config/opencode/opencode.json` — MCP config added

## Session Anchored Summary (5 June 2026) — Part 3

### Goal
Clean up stale GitHub repos under `shamelali` account — delete 18 unused Leish iterations.

### Done
- Listed all 22 repos via GitHub API; categorized into active (3), stale Leish iterations (18), and non-Leish projects (1 — `the_empire_elites_v1`)
- Authenticated `gh` CLI with `delete_repo` scope via device flow
- Deleted all 18 stale repos:
  `leish-studio-admin`, `leish-studio-prod`, `leishroom`, `leishdataroom`, `leish-pitch`, `leish-theapp`, `leish-studio-final`, `leish_optimized`, `leish-expo`, `leish_studio_deploy`, `leish_migrate`, `leish-combined`, `leish_studio`, `leish-frontend`, `leish-claude`, `leishstudio`, `Leish-Studio-Booking`, `leishstudio2`
- Kept 4 active repos: `leish`, `studio-leish-static`, `leish-admin-dashboard`, `the_empire_elites_v1`

### Key Decisions
- Deleted all stale Leish experiment repos (mostly 1-commit throwaway iterations) — they were superseded by the current `leish` project and had no active use

## Session Anchored Summary (6 June 2026)

### Goal
Fix production API errors (400/500 on services & availability, 404 on loyalty, RLS violation), centralize post-auth routing, enable profile image uploads.

### Done
- **Google One Tap**: Removed `use_fedcm_for_prompt: true` (caused AbortError when user not signed into Google); wrapped in try/catch; added `cancel_on_tap_outside: true`; fixed type (`window.google` → `google` via global declare)
- **Created `lib/routing.ts`**: `getPostAuthRedirect(role, hasProvider)` as single source of truth — admin→`/admin`, artist→`/artist` or `/artist/onboarding`, customer→`/account`, studio→`/studios/dashboard` or `/studio/onboarding`
- **Created `components/auth/sign-in-helpers.ts`**: `routeUserAfterSignIn()` (MFA check + role lookup + provider check → `getPostAuthRedirect`), `routeUserAfterSignUp()` (artist→`/artist/onboarding`, studio→`/studios/onboarding`)
- **Normalized onboarding paths**: `artistonboard` → `/artist/onboarding`, `studioonboard` → `/studio/onboarding`; deleted old redirect stubs
- **Refactored `app/auth/callback/page.tsx`**: Replaced inline `getRedirectPath()` with `getPostAuthRedirect()`; fixed `user_id`→`owner_id` column bug; `studio_manager`→`studio` role mapping
- **Refactored `components/supabase-auth.tsx`**: Imported helpers from `sign-in-helpers.ts` instead of inline routing
- **Moved `GoogleOneTap.tsx`** to `components/auth/GoogleOneTap.tsx`; role-based routing
- **Created `app/admin/providers/[id]/page.tsx`**: Provider detail page (info, alerts, services, bookings, activate/suspend) to fix repeated 404 RSC prefetches
- **Tracked missing service files**: `lib/services/notifications/index.ts` and `lib/services/studio-rooms.ts` added to git; fixed `.gitignore` scope (`services/` → `/services/`)
- **Fixed API resilience**: Added camelCase+snake_case fallback in `POST /api/services` and `POST /api/availability`; added error logging to `GET /api/services` catch block
- **Wired image uploads**: Added `ProviderPhotoUpload` to artist profile page (`app/artist/profile/page.tsx`); created studio photos page (`app/studios/dashboard/photos/page.tsx`); added "Manage photos" link to studio dashboard Quick Actions
- **Vercel**: Production deployments now building successfully (latest: `leish-hvbksy9t5` Ready ✅)

### Relevant Files
- `lib/routing.ts` — single source of truth for post-auth routing
- `components/auth/sign-in-helpers.ts` — `routeUserAfterSignIn()`, `routeUserAfterSignUp()`
- `components/auth/GoogleOneTap.tsx` — rebuilt with try/catch, no forced FedCM
- `app/auth/callback/page.tsx` — uses `getPostAuthRedirect()`, fixed `owner_id`
- `components/supabase-auth.tsx` — imports helpers
- `app/admin/providers/[id]/page.tsx` — new provider detail page
- `app/api/services/route.ts` — added error logging, camelCase+snake_case resilience
- `app/api/availability/route.ts` — added camelCase+snake_case resilience
- `app/artist/profile/page.tsx` — added `ProviderPhotoUpload` panel
- `app/studios/dashboard/photos/page.tsx` — new studio photos page
- `app/studios/dashboard/page.tsx` — added "Manage photos" Quick Action link
- `AGENTS.md` — this anchored summary

### Key Decisions
- `password_hibp_enabled` cannot be toggled via the Management API — must use the Supabase Dashboard UI
- All auth flows (email/password, OAuth callback, Google OneTap, sign-up) converge on `getPostAuthRedirect()` in `lib/routing.ts` — any future path change needs one file
- Deleted old `/artistonboard` and `/studioonboard` redirect stubs after migration
- Google One Tap FedCM error is expected when user isn't signed into Google; removing `use_fedcm_for_prompt` lets GSI choose gracefully
- `availability_slots` has intentional DENY-ALL RLS — all writes go through raw SQL (`getSql()`) or service-role client; no client-side path exists
- API handlers now accept both camelCase and snake_case to be resilient to client variations

## Session Anchored Summary (6 June 2026) — Part 2

### Goal
Resolve Supabase performance advisor warnings, add autocomplete to auth forms, fix loyalty card null crash.

### Done
- **Fixed `auth_rls_initplan` on `notifications`**: Replaced `auth.uid()` with `(SELECT auth.uid())` in `notifications_insert_own` policy
- **Dropped remaining 9 unused indexes**: `idx_payout_items_payout_id`, `idx_providers_suspended_by`, `idx_reviews_room_id`, `idx_services_provider_id`, `idx_studio_gallery_room_id`, `idx_bookings_provider_id`, `idx_booking_surcharges_surcharge_id`, `idx_bookings_service_id`, `idx_notifications_unread`
- **Added FK indexes** for known query patterns: `bookings(service_id)`, `services(provider_id)`, `reviews(room_id)`, `studio_gallery(room_id)`, `payout_items(payout_id)`
- **Fixed LoyaltyStatusCard null spread crash**: Added null check when API returns `{ status: null }` (line 66)
- **Added autocomplete attributes** to all auth form fields (email, current-password, new-password) in `supabase-auth.tsx`, `forgot-password/page.tsx`, `update-password/page.tsx`
- **Updated AGENTS.md** with this session summary

### Relevant Files
- `components/loyalty-status-card.tsx` — null check for `data` before spread
- `components/supabase-auth.tsx` — `autoComplete="email"`, `autoComplete={isSignUp ? "new-password" : "current-password"}` 
- `app/forgot-password/page.tsx` — `autoComplete="email"`
- `app/update-password/page.tsx` — `autoComplete="new-password"`
- `supabase/migrations/20260606000001_fix_notifications_rls_initplan.sql` — new migration
- `supabase/migrations/20260606000002_drop_remaining_unused_indexes.sql` — new migration
- `supabase/migrations/20260606000003_add_foreign_key_indexes.sql` — new migration

## Session Anchored Summary (7 June 2026)

### Goal
Prompt role selection when user clicks "Sign in with Google" — currently all Google users defaulted to `customer`.

### Done
- **Created `components/auth/role-select-dialog.tsx`**: Shadcn dialog with 3 role cards (Customer, Makeup Artist, Studio Owner) each with icon and description
- **Modified `components/supabase-auth.tsx`**: `handleGoogleSignIn` now opens the dialog. `handleGoogleRoleSelect(selectedRole)` stores role in `sessionStorage` (`pendingOAuthRole`) then initiates OAuth flow. On error, clears `sessionStorage`.
- **Modified `app/auth/callback/page.tsx`**: After authentication, reads `pendingOAuthRole` from `sessionStorage`. If the profile role is still `customer` (new sign-up via trigger default) and a valid non-customer role was stored, updates the profile with the selected role. Clears `sessionStorage` after use.
- **Safety**: Existing users (non-customer profile) never get their role overwritten. Missing/expired `sessionStorage` silently falls back to current behavior (default `customer`).

### Key Decisions
- Used `sessionStorage` (not URL params) to pass role through the OAuth redirect — more reliable, survives page reloads, no URL manipulation needed
- Google OneTap flow is unchanged (always `customer`) — role selection dialog would defeat the "one tap" UX
- Callback only overwrites profile role when current role is `customer` — prevents overwriting existing users' roles

### Files
- `components/auth/role-select-dialog.tsx` — new dialog component
- `components/supabase-auth.tsx` — dialog state + `handleGoogleRoleSelect`
- `app/auth/callback/page.tsx` — reads `pendingOAuthRole` and updates profile

## Session Anchored Summary (8 June 2026)

### Goal
Fix high auth email bounce rate by configuring Brevo SMTP for Supabase Auth emails.

### Done
- **Configured Supabase SMTP via Management API**: Host `smtp-relay.brevo.com:587`, sender `hello@leish.my`, sender name "Leish", rate limit 60/hr
- **Updated Vercel env vars**: `BREVO_API_KEY`, `FROM_EMAIL`, `FROM_NAME` all set in Production
- **Updated local `.env.production` and `.env.local`** with Brevo API key (gitignored files)
- **Tested SMTP**: Password reset for `admin@example.com` accepted by Supabase Auth (`{}` success)

### Pending
- `password_hibp_enabled` requires Supabase Dashboard UI (Management API doesn't support toggling it)

### Files
- `lib/email/brevo.ts` — uses `BREVO_API_KEY` for transactional emails (unchanged)
- Supabase project `rmsjrhamjmupvrxqyagm` — SMTP config applied via `PATCH /v1/projects/.../config/auth`

## Session Anchored Summary (15 June 2026)

### Goal
Revamp monolith into TurboRepo monorepo with 3 subdomain apps: www.leish.my, artist.leish.my, studio.leish.my.

### Done
- **Switched from npm to pnpm** — `pnpm-workspace.yaml`, `turbo.json`, `.npmrc`
- **Created `packages/shared/` (@leish/shared)** — Clean, reorganized shared library:
  - Auth layer: 7 files (`client`, `server`, `ssr`, `middleware`, `routing`, `helpers`, `callback`) with cross-subdomain cookie support (`domain: ".leish.my"`)
  - Types: `database.ts`, `index.ts` (UserRole)
  - i18n: `context.tsx`, `translations.ts` (en + ms)
  - Services: `db.ts`, `env.ts`, `utils.ts`
  - Styles: `globals.css` (Tailwind v4 theme)
- **Created `apps/artist/`** (@leish/artist → artist.leish.my):
  - 10 pages (dashboard, bookings, payments, reviews, availability, profile, charges, onboarding, public profile, 404)
  - 5 API routes (bookings, availability, services, reviews, health)
  - Components: navbar, footer, dashboard shell, booking calendar, loyalty card, etc.
- **Created `apps/studio/`** (@leish/studio → studio.leish.my):
  - 10 pages (dashboard, rooms, photos, gallery, onboarding, public profile, booking, 404)
  - 5 API routes (rooms, room[id], availability, bookings, health)
  - Components: navbar, footer, dashboard shell, booking calendar, gallery grid, etc.
- **Updated `vercel.json`** — Removed studio.leish.my redirects (now separate app), added pnpm install command
- **Updated `next.config.mjs`** — Added `transpilePackages: ["@leish/shared"]`
- **All 3 packages pass `typecheck`** — clean TypeScript compilation

### Key Decisions
- Cross-subdomain auth: Set `domain: ".leish.my"` on all Supabase SSR cookies so www, artist, and studio share one session
- Root project remains as www.leish.my (no move to `apps/web/` yet) — keeps migration low-risk
- Each app has its own `styles/globals.css` copied from shared (Tailwind v4 doesn't support CSS package imports cleanly)
- Auth code completely reorganized from `lib/supabase/` + `components/auth/` + `lib/routing.ts` → single `packages/shared/lib/auth/` module
- pnpm `shamefully-hoist=true` for Radix UI peer dependency compatibility

### DNS Setup Required
```
artist.leish.my  → CNAME → cname.vercel-dns.com  (Vercel project: leish-artist)
studio.leish.my  → CNAME → cname.vercel-dns.com  (Vercel project: leish-studio)
www.leish.my     → CNAME → cname.vercel-dns.com  (Vercel project: leish-web)
leish.my         → redirect → www.leish.my
```

### Relevant Files
- `pnpm-workspace.yaml` — new workspace config
- `turbo.json` — new task pipeline
- `packages/shared/` — shared library (18 files)
- `apps/artist/` — artist subdomain app (25 files)
- `apps/studio/` — studio subdomain app (25 files)
- `vercel.json` — updated for pnpm + removed studio redirects
- `next.config.mjs` — added transpilePackages
- `AGENTS.md` — monorepo structure section added
