# Design: Migrate from Supabase Auth to NextAuth v5

## Date: 2026-06-28

## Summary

Replace Supabase Auth entirely with Auth.js (NextAuth v5) using the Prisma adapter, while keeping Supabase PostgreSQL as the database. This fixes the email-not-sending issue and provides a more maintainable auth layer.

## Decisions

| Decision | Choice |
|----------|--------|
| Auth library | Auth.js v5 (next-auth@beta) |
| Database adapter | Prisma |
| Session strategy | JWT (cross-subdomain via `.leish.my` cookie) |
| Auth providers | Email/password + Google OAuth |
| Roles | Keep 3 roles: artist, studio, customer |
| MFA | Keep TOTP-based MFA |
| Cross-subdomain sessions | Keep `.leish.my` cookie domain |
| RLS | Remove all RLS policies (app-level auth) |

## Architecture

```
┌─────────────────────────────────────────────────┐
│                    NextAuth v5                    │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Credentials│  │  Google  │  │ Authenticator │  │
│  │ (email/pw) │  │  (OAuth) │  │   (TOTP MFA)  │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
└────────────────────┬────────────────────────────┘
                     │
              ┌──────┴──────┐
              │   Prisma    │
              │   Adapter   │
              └──────┬──────┘
                     │
        ┌────────────┴────────────┐
        │   Supabase PostgreSQL   │
        │  ┌──────────────────┐   │
        │  │ users            │   │  ← NextAuth schema
        │  │ accounts         │   │
        │  │ sessions         │   │
        │  │ verification_tokens│  │
        │  ├──────────────────┤   │
        │  │ profiles         │   │  ← Existing app data
        │  │ providers        │   │
        │  │ bookings         │   │
        │  │ services         │   │
        │  │ ...              │   │
        │  └──────────────────┘   │
        └─────────────────────────┘
```

## Database Schema

### New Prisma Tables

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}
```

### Existing Tables (unchanged)

- `profiles` — app data (role, full_name, phone, etc.)
- `providers` — service providers
- `bookings`, `services`, `reviews`, etc.

### Relationship

- `users.id` = `profiles.id` (1:1 mapping)
- On signup: create `users` row (NextAuth) + `profiles` row (app)
- `getUserFromSession(session)` → `profiles` row via `users.id`

## Auth Flows

### Signup
1. User submits email/password + role on `/sign-up`
2. NextAuth `authorize()` creates user in `users` table
3. App creates `profiles` row with role (artist/studio/customer)
4. Send welcome email via Brevo
5. Auto-sign-in via NextAuth session

### Login
1. User submits email/password
2. NextAuth `authorize()` validates credentials
3. JWT cookie set with domain `.leish.my`
4. Redirect to role-appropriate dashboard

### Google OAuth
1. User clicks "Continue with Google"
2. NextAuth redirects to Google → callback
3. NextAuth creates/links account in `accounts` table
4. If new user, create `profiles` row with selected role
5. Session created, redirect to dashboard

### Password Reset
1. User requests reset via `/forgot-password`
2. NextAuth generates verification token
3. Send email via Brevo with reset link
4. User sets new password, token verified

### MFA (TOTP)
1. After initial login, if MFA enabled, redirect to `/mfa/verify`
2. NextAuth's `Authenticator` adapter stores TOTP secrets
3. User enters TOTP code → verified → full session granted

### Logout
1. `signOut()` from NextAuth
2. JWT cookie cleared across `.leish.my` domain
3. Redirect to `/`

## Cross-Subdomain Session

NextAuth JWT cookie:
```ts
cookie: {
  name: "next-auth.session-token",
  options: {
    domain: ".leish.my",
    path: "/",
    sameSite: "lax",
    secure: true,
  }
}
```

All 3 apps share `NEXTAUTH_SECRET` and `NEXTAUTH_URL`. JWT contains `sub` (user ID) and role.

## RLS Strategy

**Remove all RLS policies.** Reasons:
- 145 RLS policies would need rewriting
- Application-level auth already done in every API route
- RLS adds latency and complexity
- Service-role pattern already bypasses RLS

Migration: `ALTER TABLE <table> DISABLE ROW LEVEL SECURITY;` for all tables.

## File Changes

### New Files
| File | Purpose |
|------|---------|
| `packages/shared/lib/auth/next-auth.ts` | NextAuth config (providers, callbacks, session) |
| `packages/shared/lib/auth/prisma.ts` | Prisma client singleton |
| `packages/shared/prisma/schema.prisma` | Auth schema |
| `packages/shared/lib/auth/get-user.ts` | `getUserFromSession()` → profiles row |

### Files to Rewrite (shared)
| File | Change |
|------|--------|
| `packages/shared/lib/auth/ssr.ts` | NextAuth `auth()` instead of Supabase SSR |
| `packages/shared/lib/auth/client.ts` | NextAuth `signIn/signOut/useSession` |
| `packages/shared/lib/auth/middleware.ts` | Remove Supabase session refresh |
| `packages/shared/lib/auth/callback.ts` | NextAuth callback handling |
| `packages/shared/lib/auth/helpers.ts` | NextAuth-based role routing |
| `packages/shared/lib/auth/require-role.ts` | NextAuth session check |

### Files to Rewrite (web app)
| Area | Files | Change |
|------|-------|--------|
| Auth form | `components/supabase-auth.tsx` | NextAuth signIn/signUp |
| Navbar | `components/navbar.tsx` | `useSession()` instead of `onAuthStateChange` |
| All pages | ~55 files | `getUser()` → `auth()` + profiles lookup |
| All API routes | ~25 files | `getUser()` → `auth()` + profiles lookup |
| MFA | `lib/services/mfa.ts` | NextAuth Authenticator adapter |
| Password | `change-password.tsx`, `update-password/page.tsx` | NextAuth updateUser |
| Booking calendar | `components/booking-calendar.tsx` | `useSession()` |
| Chat | `components/artist-chat.tsx` | `useSession()` |

### Files to Rewrite (artist app)
| Area | Files | Change |
|------|-------|--------|
| Client wrapper | `utils/supabase/*` | Replace with NextAuth helpers |
| All pages | ~5 files | `getUser()` → `auth()` |
| All API routes | ~8 files | `getUser()` → `auth()` |

### Files to Rewrite (studio app)
| Area | Files | Change |
|------|-------|--------|
| Client wrapper | `utils/supabase/*` | Replace with NextAuth helpers |
| All pages | ~6 files | `getUser()` → `auth()` |
| All API routes | ~10 files | `getUser()` → `auth()` |

### Files to Remove
| File | Reason |
|------|--------|
| `apps/web/app/api/auth/auto-confirm/route.ts` | NextAuth handles email verification |
| `apps/web/components/auth/GoogleOneTap.tsx` | Replaced by NextAuth Google provider |
| `apps/web/lib/services/mfa.ts` | Replaced by NextAuth Authenticator |

### Proxy/Middleware Files
| File | Change |
|------|--------|
| `apps/web/app/proxy.ts` | NextAuth session check instead of Supabase |
| `apps/artist/app/proxy.ts` | Same |
| `apps/studio/app/proxy.ts` | Same |

## Dependencies to Add

```json
{
  "next-auth": "^5.0.0-beta",
  "@next-auth/prisma-adapter": "^1.0.0",
  "@prisma/client": "^6.0.0",
  "prisma": "^6.0.0",
  "@auth/prisma-adapter": "^2.0.0"
}
```

## Dependencies to Remove

```json
{
  "@supabase/ssr": "^0.5.0",
  "@supabase/supabase-js": "^2.0.0"
}
```

Note: Keep `@supabase/supabase-js` for service-role operations (non-auth database access).

## Environment Variables

### Add
```
NEXTAUTH_URL=http://localhost:3005
NEXTAUTH_SECRET=<generated-secret>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
DATABASE_URL=<same Supabase PostgreSQL connection string>
```

### Keep
```
NEXT_PUBLIC_SUPABASE_URL=<same>
SUPABASE_SERVICE_ROLE_KEY=<same>
BREVO_API_KEY=<same>
```

### Remove
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=<no longer needed for auth>
```

## Migration Script

One-time script to migrate existing users:

1. Export users from `auth.users` (Supabase Auth)
2. For each user:
   a. Create row in NextAuth `users` table
   b. Link existing `profiles` row (profiles.id = users.id)
3. Verify all profiles have matching users row

## Risks

| Risk | Mitigation |
|------|------------|
| Data loss during migration | Backup database before migration |
| Session interruption | Migration script preserves existing profile IDs |
| NextAuth beta instability | Pin exact version, test thoroughly |
| Cross-subdomain cookie issues | Test with all 3 apps locally |
| MFA migration | Users may need to re-enroll TOTP |

## Testing Checklist

- [ ] Email/password signup creates user + profile
- [ ] Email/password login works
- [ ] Google OAuth signup/login works
- [ ] Cross-subdomain session works (web → artist → studio)
- [ ] Role-based redirect works for all 3 roles
- [ ] MFA enrollment works
- [ ] MFA challenge/verify works
- [ ] Password reset works
- [ ] Welcome email sent on signup
- [ ] All API routes enforce auth
- [ ] All pages check session
- [ ] Logout clears session across subdomains
