# Leish App Blueprint

## Purpose

Leish is a beauty marketplace platform that connects customers with makeup artists and studios, then guides them through discovery, booking, payment, and follow-up.

This blueprint is the high-level map of the product and codebase. It is meant to stay current as the app evolves.

## Product Pillars

- Marketplace discovery: help customers find the right artist or studio quickly
- Booking reliability: enforce clean slot selection and prevent double-booking
- Payment trust: use Billplz safely, with webhook-driven truth
- Provider operations: give artists and studios enough tooling to manage work
- Admin visibility: keep the platform observable, supportable, and governable

## Primary Users

- Customer
- Artist
- Studio manager
- Admin

## Core User Journeys

### Customer Journey

1. Land on the marketplace
2. Browse artists or studios
3. Open a profile
4. Choose an available slot
5. Create a booking
6. Complete payment
7. Receive confirmation and reminders

### Provider Journey

1. Sign in
2. Complete onboarding
3. Create or manage profile
4. Define services and pricing
5. Manage availability
6. Receive bookings
7. Track payments and reviews

### Admin Journey

1. Monitor platform activity
2. Review bookings and payment health
3. Moderate provider quality
4. Investigate incidents or exceptions

## System Architecture

### Frontend

- Next.js 16 App Router
- React 19
- Tailwind CSS v4
- Radix UI-based components

### Backend

- Next.js route handlers for thin API endpoints
- business logic delegated to `lib/services/`
- server-first data access patterns

### Data Layer

- Supabase Postgres
- Supabase Auth
- Row Level Security
- role-aware access across customer, artist, studio manager, and admin flows

### Payments

- Billplz is the primary payment provider
- webhook confirmation is the source of truth
- deposit and full-payment flows are both supported

### Notifications

- Resend for transactional email
- cron-driven reminders and cleanup

## Codebase Map

### App Routes

- `app/`
  - customer-facing routes like `/`, `/artists`, `/studios`, `/booking`, `/pricing`
  - auth route at `/auth/callback`
  - provider routes under `/pro`
  - studio routes under `/studios`
  - admin routes under `/admin`
  - API routes under `/api`

### Components

- `components/`
  - presentation components
  - client-side interaction wrappers
  - booking and onboarding UI

### Business Logic

- `lib/services/`
  - booking rules
  - DB operations
  - payment orchestration
  - analytics helpers

### Supporting Libraries

- `lib/payments/`
- `lib/email/`
- `lib/notifications/`
- `lib/ops/`
- `lib/supabase/`
- `lib/actions/`

### Infrastructure and Data

- `supabase/` for schema and migrations
- `vercel.json` for deployment-facing routing and runtime config
- `proxy.ts` for session refresh flow

## Critical Business Rules

- availability slots are 30-minute intervals
- bookings must be at least 24 hours in advance
- booking creation must use the DB locking flow in `lib/services/db.ts`
- slot IDs must be sent to the booking API, not display labels
- Billplz webhook is the authoritative payment signal
- RLS must remain enabled across Supabase tables

## Current Functional Zones

### Marketplace

- artists listing and detail pages
- studios listing and detail pages
- dedicated studio booking route

### Booking and Payment

- booking flow
- booking success state
- Billplz payment creation and webhook handling
- payment status API

### Provider Tools

- provider onboarding
- profile management
- availability
- bookings
- payments
- reviews
- charges

### Studio Tools

- studio onboarding
- studio dashboard

### Admin Tools

- bookings monitoring
- payments monitoring
- provider review
- moderation placeholders

## Readiness Lenses

To introduce Leish to the world, every release should be assessed through these lenses:

- product clarity
- booking correctness
- payment correctness
- auth correctness
- provider usability
- observability
- support readiness
- documentation quality

## Living Maintenance Rule

Whenever a major feature, route, payment rule, or role flow changes, update this blueprint in the same branch.
