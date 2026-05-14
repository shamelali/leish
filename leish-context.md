# Leish — Project Context Document
> For use with Ollama / OpenCode. Load this as system context or project instructions.

---

## 1. What is Leish?

Leish (`leish.my`) is a Malaysian beauty marketplace platform connecting clients with makeup artists (MUAs) and studios. Built for KL, Penang, and JB markets, with SEA expansion planned post-2028.

**Business entity:** Leish LLP (pending SSM registration — hard launch blocker)
**Legal contact:** legal@leish.my
**Business contact:** hello@leish.my

---

## 2. Core Team

| Name | Role |
|---|---|
| Shamel Ali | Founder, CEO, lead developer |
| Leiynda Rahman | Director, professional MUA, supply-side network |
| Amar Wasilah | CMO & Director |
| Khairil Adri Adnan | Chairman, funded investor |

---

## 3. Actor Types

| Actor | Description |
|---|---|
| Client | Searches and books MUA or studio services |
| Artist (MUA) | Independent makeup artist providing services |
| Studio | External makeup studio listing on Leish |
| Leish Studio | Leish-owned physical space — rentable by MUAs for sessions, shoots, classes |

---

## 4. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React 19), TypeScript, Tailwind CSS |
| Backend / DB | Supabase (Postgres + Auth + Storage) |
| Deployment | Vercel |
| DNS | Cloudflare (`leish.my`) |
| Email (transactional + inbox) | Brevo |
| Payments | HitPay, Billplz |
| Error monitoring | Sentry |
| Document generation | ReportLab (Python/PDF), `docx` npm library |

---

## 5. Domain Architecture

| Subdomain | Purpose |
|---|---|
| `leish.my` | Main landing page |
| `app.leish.my` | MUA finder app |
| `studios.leish.my` | Studio finder app |

CNAME records for `app` and `studios` point to `cname.vercel-dns.com` with Cloudflare proxy **disabled** (grey cloud).

---

## 6. Database — Key Tables & Fields

### Users (via Supabase Auth)
- Standard auth fields + `role` enum: `client | artist | studio_manager`

### Artists (providers)
Pending migration — columns to add:
```sql
bio TEXT,
experience TEXT,
is_verified BOOLEAN DEFAULT false,
studio_type TEXT,
team_size INTEGER,
address TEXT,
operating_hours JSONB
```

### Studios
```sql
is_active BOOLEAN DEFAULT false,  -- requires Leish approval
allow_mua_rental BOOLEAN DEFAULT false,
rental_price_per_hour NUMERIC,
rental_capacity INTEGER,
rental_includes TEXT,
rental_rules TEXT,
is_leish_owned BOOLEAN DEFAULT false
```

---

## 7. Business Model

### Commission Structure

| Flow | From | To | Leish keeps |
|---|---|---|---|
| Client books MUA | Client → Leish → MUA | MUA gets 88% | **12%** |
| Client books Studio | Client → Leish → Studio | Studio gets 85% | **15%** |
| MUA rents Leish Studio | MUA → Leish Studio | 100% to Leish | **100%** |
| MUA rents external Studio via Leish | MUA → Leish → Studio | Studio gets 80% | **20%** |

### Payment Flow
Client pays Leish (via HitPay/Billplz) → Leish holds in escrow → Leish disburses to MUA/Studio minus commission.

> ⚠️ Flows 3 & 4 (Leish Studio rental) cannot operate until SSM registration is complete and entity bank account is open.

### Future Revenue Layers
- **Visibility boosting:** MUAs pay RM 20–60/mo for featured placement (post-traction)
- **Studio subscriptions:** RM 99–199/mo for team management + analytics (post-supply seeding)
- **MUA business tools (2026+):** CRM, income reports, PDPA-compliant exports, invoicing

---

## 8. Registration & Onboarding Flows

### Three onboarding paths:
- `/pro/onboarding` — Artist registration
- `/studio/onboarding` — Studio registration
- Client registration — standard auth flow

### Studio onboarding — branching question (future):
After basic info (name, address, operating hours, portfolio) and Leish approval, ask:
> *"Does your studio accept bookings from independent makeup artists?"*
- **Yes** → enable rental config: capacity, time slots, pricing, inclusions, house rules
- **No** → standard studio listing only

Studios go live only after Leish approval (`is_active: false` by default).

---

## 9. Key Risks & Blockers

| Risk | Status |
|---|---|
| SSM registration | Incomplete — **hard blocker for real transactions** |
| MyIPO trademark clearance | Pending |
| PDPA 2010 compliance | Docs drafted, pending final entity name for find-and-replace |
| Off-platform contact detection | Not built yet |
| Cancellation / dispute flow | Not built yet |
| BNM e-money framework exposure | Unresolved — relevant due to escrow model |
| Scope vs solo developer bandwidth | Active risk — delegate to Amar/Leiynda where possible |

---

## 10. Key Principles (for AI context)

- **Cold start is the primary launch risk.** Supply (MUA profiles) must be seeded before client-facing launch. Leiynda leads MUA recruitment.
- **SSM is a hard blocker.** No real transactions before entity is registered.
- **Off-platform prevention is critical.** In-app messaging + contact detection needed. Escrow model is the payment guardrail.
- **Launch first, fundraise after.** Even modest traction data substantially strengthens investor pitch.
- **Fundraising target:** RM 250,000 for 15% equity. Pre-money valuation ~RM 1.42M.

---

## 11. Infrastructure Notes

- Cloudflare DNS: when adding CNAME subdomain records, enter only the prefix (`app`, not `app.leish.my`) — Cloudflare appends root domain automatically. Proxy must be disabled for Vercel CNAMEs.
- Brevo: MX, SPF, DKIM, DMARC records live in Cloudflare DNS.
- Next step for hosting: add `app.leish.my` and `studios.leish.my` in each respective Vercel project's domain settings.

---

## 12. Primary Growth Channels

TikTok (primary), Instagram, Facebook. Content tools: Canva, CapCut, Meta Business Suite, TikTok Creator Tools.

---

## 13. Working Style Notes

- Shamel gives terse, directive instructions — interpret scope broadly and execute fully.
- Preferred output: complete, ready-to-deploy files/code, not guidance alone.
- Malaysian market context: pricing in MYR, local payment processors (HitPay, Billplz), references to Shopee/Lazada/Low Yat Plaza where relevant.
- Bahasa Melayu is a secondary language consideration for UI copy.
- Iterative refinement is the primary working mode.
