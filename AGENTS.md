# AGENTS.md

This file provides guidance to agents when working with code in this repository.

---

## Non-Obvious Project Rules

### Build/Test Commands
- Run `npm run typecheck` before `npm run lint` - type errors break linting
- `npm test` runs Vitest with coverage - use `npm test -- --watch` for TDD
- `npm run verify-env` runs automatically before build via `prebuild` hook
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
