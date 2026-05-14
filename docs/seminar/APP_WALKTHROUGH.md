# Leish Walkthrough

## Goal

This document is the guided walkthrough of the app from product idea to shipped experience. It is intended for onboarding, demos, team alignment, and future seminar material.

## Part 1: What Leish Is

Leish is a beauty-services marketplace. Customers discover providers, providers manage offerings and availability, and the platform coordinates trust, scheduling, and payments.

## Part 2: Customer Experience

### Discover

- Customer lands on the homepage or marketplace pages
- They browse `artists` or `studios`
- They compare profiles, services, location, and trust cues

### Decide

- Customer opens a provider or studio profile
- They look for service fit, availability, pricing, and confidence signals

### Book

- Customer selects a valid slot
- The app enforces advance-booking rules and booking integrity
- The booking is created through server-side business logic

### Pay

- Customer is taken into the Billplz flow
- The webhook confirms the real payment result
- The app reflects payment status back into booking state

### Confirm

- Customer sees the success page
- Email and reminder flows complete the experience

## Part 3: Provider Experience

### Sign In and Onboard

- Artists and studio managers authenticate through Supabase
- Role-aware redirects send them to the correct onboarding area

### Build a Profile

- Provider describes services, pricing, and identity
- Profile quality becomes part of marketplace conversion

### Manage Operations

- Provider maintains availability
- Provider monitors bookings
- Provider tracks payments, reviews, and surcharges

## Part 4: Studio Experience

Studios have their own discovery and booking surfaces, plus a dedicated onboarding and dashboard flow. This keeps the studio path distinct from the solo provider path.

## Part 5: Admin Experience

Admins oversee operational safety:

- booking visibility
- payment monitoring
- moderation and provider review
- future support tooling

## Part 6: Technical Walkthrough

### Routing

- App Router organizes product areas by responsibility
- public discovery sits beside role-based dashboards
- API routes are thin and defer logic into `lib/services/`

### Auth

- Supabase Auth handles identity
- callback routing determines post-login flow by role
- session refresh passes through `proxy.ts`

### Database

- Supabase Postgres stores platform state
- RLS enforces access boundaries
- booking-sensitive operations require server-side consistency

### Payments

- Billplz creates the payment session
- webhook finalizes payment truth
- booking state follows payment evidence, not client assumptions

### Notifications

- email templates live in the repo
- cron jobs and reminder flows support operational follow-through

## Part 7: Development Philosophy

Leish is best built with these principles:

- protect business rules first
- keep route handlers thin
- prefer server-side truth
- document decisions while building
- verify production-sensitive flows early

## Part 8: How To Demo Leish

### Demo Flow

1. Show homepage and marketplace framing
2. Browse artists and studios
3. Open a studio profile
4. Walk through booking
5. Explain payment confirmation through Billplz webhook
6. Show provider dashboard areas
7. Show admin monitoring surfaces
8. Close with infrastructure and deployment notes

### Key Talking Points

- why marketplaces need strong trust layers
- why booking systems fail when slot logic is weak
- why payment webhook truth matters
- why role-based onboarding simplifies growth
- why documentation should evolve with the codebase

## Part 9: Living Rule

Every time the user journey meaningfully changes, update this walkthrough so demos and onboarding stay accurate.
