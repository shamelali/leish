# 🚀 Leish Development Roadmap

A production-ready beauty marketplace platform connecting makeup artists and studios with customers. Features real-time booking, integrated payments via Billplz, and automated email notifications.

---

## 📋 Project Status

### 🚀 Deployment Status
**Status:** ✅ Deployed to Production (April 17, 2026)
- MUA Registration Flow live
- All systems operational
- Monitoring active

### ✅ Completed Features

| Feature | Status | Notes |
|---------|--------|-------|
| Customer browsing (artists/studios) | ✅ Live | Browse by location/specialty |
| Artist/Studio pages | ✅ Live | Professional profiles with portfolios |
| Real-time availability | ✅ Live | 30-minute slot intervals |
| Booking system | ✅ Live | With deposit/full payment options |
| Billplz integration | ✅ Live | Full payments and deposits |
| Provider dashboard (pro/) | ✅ Live | Availability, bookings, services, reviews |
| Admin dashboard (admin/) | ✅ Live | Full platform management |
| Supabase Auth | ✅ Live | Role-based access (admin, artist, studio_manager, customer) |
| Resend email | ✅ Live | Confirmations and notifications |
| Mobile-responsive | ✅ Live | Tailwind CSS 4 + Radix UI |

### 📁 Current Project Structure (TurboRepo Monorepo)

```
├── apps/
│   ├── web/                     # www.leish.my (marketing + admin + customer)
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── (public)/       # Public pages
│   │   │   ├── api/            # API endpoints (25+ routes)
│   │   │   ├── admin/          # Admin dashboard
│   │   │   ├── account/        # Customer dashboard
│   │   │   └── auth/           # Authentication
│   │   ├── components/         # React components
│   │   ├── lib/                # Utilities & services
│   │   │   ├── db/            # Database config
│   │   │   ├── email/         # Email templates (Brevo)
│   │   │   ├── ops/           # Rate limiting, alerts
│   │   │   ├── payments/      # Billplz integration
│   │   │   ├── services/      # Business logic
│   │   │   └── supabase/      # Supabase SSR client
│   │   └── public/            # Static assets (images, icons)
│   ├── artist/                  # artist.leish.my (artist portal)
│   │   ├── app/                 # Artist-specific pages
│   │   ├── components/         # Artist-specific components
│   │   └── lib/                # Artist-specific utilities
│   └── studio/                  # studio.leish.my (studio portal)
│       ├── app/                 # Studio-specific pages
│       ├── components/         # Studio-specific components
│       └── lib/                # Studio-specific utilities
├── packages/
│   └── shared/                  # @leish/shared (auth, services, i18n, types)
│       └── lib/
│           ├── auth/           # Cross-subdomain auth (SSR, callback, routing)
│           ├── i18n/           # Internationalization (en, ms)
│           └── services/       # Shared business logic
└── supabase/                    # Database migrations & config
```

---

## 🎯 Development Phases

### 🚀 Deployment Completed (April 17, 2026)
**Status:** ✅ Live in Production
- MUA Registration Flow successfully deployed
- All pre-deployment verification passed
- Database migrations applied
- Stripe/Billplz integration verified
- Monitoring active

### Phase 1: Polish & Stability (Week 1-2)

**Focus:** Bug fixes, performance, user experience

| Priority | Task | Description |
|----------|------|-------------|
| P0 | Fix typecheck errors | Run `npm run typecheck` and resolve all errors |
| P0 | Fix lint errors | Run `npm run lint` and resolve warnings |
| P0 | Registration flow - Customer | ✅ Complete - Sign up with role selection, profile creation |
| P0 | Registration flow - Artist | ✅ Complete - Sign up as artist with profile |
| P0 | Registration flow - Studio | ✅ Complete - Sign up as studio_manager with profile |
| P1 | Search improvements | ✅ Complete - Add filters (price range, rating, availability) |
| P1 | Favorites/Wishlist | ✅ Complete - Allow customers to save artists |
| P1 | Booking reminders | SMS/WhatsApp notifications via Twilio |
| P1 | Loyalty program | Points for bookings, discounts |
| P1 | Analytics dashboard | Track bookings, revenue, user behavior |
| P2 | Add unit tests | Test critical services in `lib/services/` |
| P2 | Error handling | Add proper error boundaries and logging |
| P2 | Loading states | Add skeleton loaders for async data |
| P2 | Image optimization | Use Next.js Image component everywhere |

### Phase 2: Feature Enhancements (Week 3-4)

**Focus:** New features and improvements

| Priority | Task | Description |
|----------|------|-------------|
| P1 | Search improvements | ✅ Complete - Add filters (price range, rating, availability) |
| P1 | Favorites/Wishlist | ✅ Complete - Allow customers to save artists |
| P2 | Review with photos | Allow customers to upload photos in reviews |
| P2 | Provider portfolios | Add video support in portfolio gallery |
| P3 | Multi-language | Add BM (Bahasa Melayu) translations |

### Phase 3: Platform Growth (Week 5-8)

**Focus:** User acquisition and engagement

| Priority | Task | Description |
|----------|------|-------------|
| P1 | Booking reminders | SMS/WhatsApp notifications via Twilio |
| P1 | Loyalty program | Points for bookings, discounts |
| P2 | Social sharing | Share artist profiles to social media |
| P2 | Referral system | Invite friends, earn credits |
| P3 | Blog/Content | SEO-friendly articles on beauty tips |

### Phase 4: Scale & Optimize (Week 9-12)

**Focus:** Performance, scaling, analytics

| Priority | Task | Description |
|----------|------|-------------|
| P1 | Analytics dashboard | Track bookings, revenue, user behavior |
| P2 | Caching layer | Redis for API responses |
| P2 | Rate limiting | Protect against abuse |
| P3 | API documentation | OpenAPI spec for external integrators |

---

## 🛠️ Technical Tasks

### Infrastructure

- [x] API rate limiting (in-memory, lib/ops/rate-limit)
- [x] Error alerting (lib/ops/alerts)
- [ ] Set up Redis for caching (optional)
- [ ] Configure proper logging (e.g., Sentry)
- [ ] Set up CI/CD pipeline (GitHub Actions)

### Database

- [ ] Add database indexes for performance
- [ ] Set up database monitoring
- [ ] Create backup strategy

### Security

- [x] Security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- [x] API request validation (Zod schemas for auth, email, concierge routes)
- [x] Audit logging for admin actions (admin_audit_log table + writeAuditLog service)
- [ ] Complete Zod validation for remaining 25+ API routes

---

## 📊 Metrics & Goals

### Short-term (1-3 months)

| Metric | Target |
|--------|--------|
| Monthly Active Users | 1,000 |
| Monthly Bookings | 500 |
| Provider Registration | 50 |
| Average Rating | 4.5+ |

### Long-term (6-12 months)

| Metric | Target |
|--------|--------|
| Monthly Active Users | 10,000 |
| Monthly Bookings | 5,000 |
| Provider Registration | 500 |
| GMV | RM 500,000/month |

---

## 🔄 Development Workflow

### Getting Started

```bash
# Install dependencies (pnpm required — not npm)
pnpm install

# Set up environment
cp apps/web/.env.example apps/web/.env.local

# Run typecheck (all packages)
pnpm typecheck

# Run lint (all packages)
pnpm lint

# Run tests
pnpm test

# Start dev servers
pnpm dev:web        # www.leish.my (port 3005)
pnpm dev:artist     # artist.leish.my
pnpm dev:studio     # studio.leish.my
```

### Code Standards

- Run `pnpm typecheck` before `pnpm lint`
- Write tests for new features
- Use Zod for input validation (see `lib/validate.ts`)
- Follow existing code patterns in `lib/services/`
- API routes: keep handlers thin, delegate to `lib/services/`

### Git Workflow

1. Create feature branch from `main`
2. Make changes with clear commits
3. Run `npm run typecheck` and `npm run lint`
4. Create PR for review
5. Squash merge to `main`

---

## 📚 Resources

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Billplz API Reference](https://www.billplz.com/api)
- [Tailwind CSS 4](https://tailwindcss.com/docs)
- [Radix UI Components](https://radix-ui.com/primitives)

---

## 🆘 Getting Help

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
2. Review API routes in `app/api/` for endpoints
3. Check `lib/services/` for business logic
4. Review database schema in `supabase/migrations/`

---

*Last Updated: 2026-06-18*
*Version: 1.2.0 (Monorepo + Security Hardening)*