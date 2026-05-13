# Building Leish

## A Practical Seminar E-Book for Building a Marketplace App Like Leish

## Preface

This book is the teaching version of the Leish codebase. It is not just a story about a beauty marketplace. It is a repeatable framework for building a modern service marketplace with real users, real payments, role-based onboarding, and production constraints.

Use it as:

- a seminar backbone
- a workshop outline
- an internal team handbook
- a founder-facing build diary

## Chapter 1: Start With the Problem, Not the Stack

Leish exists because service marketplaces are difficult in very specific ways:

- discovery must feel trustworthy
- provider supply must be organized
- scheduling must be precise
- payment confirmation must be reliable
- operational support must be possible after launch

The first lesson is this:

Build around product risk, not hype.

## Chapter 2: Define the Roles Early

Leish has four meaningful user types:

- customer
- artist
- studio manager
- admin

This matters because many app teams delay role design and then end up with confusing dashboards, mixed permissions, and weak onboarding logic.

A better pattern is:

1. define the actors
2. define what each actor can see
3. define what each actor can do
4. encode those rules in routes, auth, and data access

## Chapter 3: Choose a Stack That Fits Velocity and Reliability

Leish uses:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase
- Billplz
- Resend
- Vercel

This stack works well because it balances:

- fast iteration
- production realism
- strong typing
- manageable operational complexity

## Chapter 4: Build the Marketplace Skeleton First

Before deep dashboards and admin systems, a marketplace needs a usable public face:

- homepage
- discovery pages
- provider detail pages
- pricing and trust framing

At this stage, the question is not “is the system complete?”

The question is:

Can a stranger understand what this product does and why they should trust it?

## Chapter 5: Booking Is a Business Rule Engine

Booking systems are not just calendar UIs. They are rule engines.

Leish protects a few critical truths:

- slots are 30-minute aligned
- bookings require a 24-hour lead time
- slot IDs, not labels, are used for booking creation
- DB locking prevents double-booking

This chapter is important in the seminar because many people underestimate the cost of weak booking logic.

## Chapter 6: Payments Must Respect Server Truth

Leish uses Billplz, and one of its strongest architectural lessons is this:

Never trust the client to confirm payment.

Webhook-driven truth gives you:

- reliable reconciliation
- idempotent payment handling
- better failure recovery
- cleaner auditability

This is one of the defining differences between a demo app and a real app.

## Chapter 7: Role-Based Onboarding Creates Product Clarity

Leish separates customer, provider, and studio journeys.

This makes the product easier to reason about because:

- users do not see irrelevant tools
- onboarding can be tailored
- dashboards stay focused
- support questions become easier to answer

In a seminar, this chapter can become a design workshop by itself.

## Chapter 8: Thin Routes, Thick Services

A valuable engineering pattern inside Leish is:

- keep route handlers thin
- move logic into service modules

This improves:

- testing
- reuse
- clarity
- refactoring safety

It also makes the codebase easier to teach.

## Chapter 9: Security Is Product Design

Supabase Auth and RLS are not infrastructure footnotes. They shape the product.

Key lesson:

If you do not define who can read and write each table, you do not really understand your app yet.

This chapter should cover:

- roles
- session flow
- callback routing
- RLS expectations
- idempotent profile creation

## Chapter 10: Documentation Is a Feature

Leish benefits from documents like:

- onboarding flow specs
- payment testing guides
- troubleshooting notes
- deployment guides
- architecture blueprints

This seminar should make a strong point:

Documentation is not cleanup work. It is scalability work.

## Chapter 11: Operational Readiness Before Public Launch

Before introducing Leish to the world, the team should verify:

- domain and callback alignment
- payment correctness
- booking integrity
- provider flow clarity
- email delivery
- cron reliability
- observability quality
- support readiness

This chapter can naturally become a launch checklist presentation.

## Chapter 12: AI Agents as a Development Multiplier

Leish now has a growing set of specialized AI agents for:

- debugging
- QA
- observability
- release readiness
- schema evolution
- UX conversion
- network and deployment checks

This is a powerful seminar topic:

How to move from one generic coding assistant to a team of specialized development roles.

## Chapter 13: Suggested Seminar Structure

### Session 1

- the idea
- product design
- role design
- choosing the stack

### Session 2

- routing
- auth
- database design
- booking rules

### Session 3

- payments
- notifications
- provider dashboards
- admin tools

### Session 4

- deployment
- operations
- observability
- AI-assisted development

## Chapter 14: Artifacts To Maintain

To keep this book useful, maintain:

- `APP_BLUEPRINT.md`
- `APP_WALKTHROUGH.md`
- `LEISH_SEMINAR_EBOOK.md`
- `STUDIO_OWNER_FLOW.md`
- deployment and troubleshooting guides

## Chapter 15: Closing Thesis

Apps like Leish are not built by accident.

They emerge from disciplined product thinking, strong business rules, careful payment design, useful dashboards, and documentation that matures alongside the code.

That is the real lesson worth teaching in a seminar.

## Appendix A: Suggested Future Chapters

- how to design provider incentives
- how to handle refunds and disputes
- how to improve marketplace liquidity
- how to build trust systems and moderation
- how to scale observability and support

## Appendix B: Speaker Notes

- show the app as a system, not a pile of pages
- explain why each business rule exists
- compare demo shortcuts versus production-safe patterns
- use Leish as an example of founder-led product engineering
