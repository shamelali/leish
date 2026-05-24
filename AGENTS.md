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

### Relevant Files
- `lib/ops/contact-filter.ts` — new off-platform contact detection module
- `app/api/messages/route.ts` — integrated contact filter in POST handler
- `AGENTS.md` — this anchored summary
