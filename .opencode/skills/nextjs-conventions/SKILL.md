---
name: nextjs-conventions
description: File structure, route naming, API conventions for leish.my
license: private
compatibility: opencode
---

## File Structure
- App Router: `app/` directory
- Dynamic routes: `app/[slug]/page.tsx`
- API routes: `app/api/*/route.ts`
- Server components by default; `"use client"` only when needed

## Route Conventions
- Public pages: `/`, `/artists`, `/studios`, `/booking`, `/quiz`
- Auth: `/sign-in`, `/auth/callback`
- Pro dashboard: `/pro`, `/pro/*` (artist/studio management)
- Admin: `/admin/*`
- API: `/api/*`

## API Patterns
- Route handlers thin - delegate logic to `lib/services/`
- Use Zod for runtime validation including env vars

## UI Components
- Use shadcn/ui components from `components/ui/`
- Add new components via `npx shadcn add`
- NOT editing `components/ui/` directly
