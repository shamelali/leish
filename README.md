# 💄 Beaute - Beauty Marketplace Platform

[![Live Site](https://img.shields.io/badge/Live-leish.my-00C7B7?style=for-the-badge&logo=vercel&logoColor=white)](https://www.leish.my)
[![Build Status](https://img.shields.io/badge/Build-Passing-success?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/shamelali/b_qRvYZb3eZrv-1771704101499/actions)
[![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)](LICENSE)

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-000000?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.2-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3EB489?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-Hosted-000000?style=flat-square&logo=vercel)](https://vercel.com)
[![Billplz](https://img.shields.io/badge/Billplz-Payments-00A4E4?style=flat-square)](https://billplz.com)
[![Resend](https://img.shields.io/badge/Resend-Email-000000?style=flat-square&logo=gmail&logoColor=white)](https://resend.com)

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql)](https://postgresql.org)
[![pnpm](https://img.shields.io/badge/pnpm-Ready-F69220?style=flat-square&logo=pnpm)](https://pnpm.io)
[![ESLint](https://img.shields.io/badge/ESLint-9-4B32C3?style=flat-square&logo=eslint)](https://eslint.org)
[![Vitest](https://img.shields.io/badge/Vitest-Testing-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev)

[![Made with Love](https://img.shields.io/badge/Made%20with-%E2%9D%A4%EF%B8%8F-ff69b4?style=flat-square)](https://www.leish.my)
[![Malaysia](https://img.shields.io/badge/Made%20in-Malaysia-FFCC00?style=flat-square)](https://www.leish.my)

A production-ready beauty marketplace platform connecting makeup artists and studios with customers. Features real-time booking, integrated payments via Billplz, and automated email notifications.

---

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/shamelali/b_qRvYZb3eZrv-1771704101499.git
cd b_qRvYZb3eZrv-1771704101499
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Open [https://www.leish.my](https://www.leish.my) to view the app.

---

## 📚 Documentation

| Guide | Purpose |
|-------|---------|
| [📖 App Manual](APP_MANUAL.md) | Complete setup and development guide |
| [🚀 Deployment Guide](DEPLOYMENT_GUIDE.md) | Deploy to production step-by-step |
| [🗺️ Roadmap](ROADMAP.md) | Development phases and milestones |
| [👥 User Flows](USER_FLOWS.md) | Customer and provider journeys |
| [🏢 Studio Owner Flow](STUDIO_OWNER_FLOW.md) | Complete studio onboarding |
| [💳 Payment Testing](TEST_PAYMENT_GUIDE.md) | Test Billplz payments |
| [🔧 Troubleshooting](TROUBLESHOOTING.md) | Common issues and fixes |

---

## ✨ Features

### For Customers
- 🔍 Browse artists and studios by location/specialty
- 📅 Real-time availability with 30-min slots
- 💳 Secure payments via Billplz (full or deposit)
- 📧 Instant email confirmations
- ⭐ Review and rating system

### for Providers (Artists/Studios)
- 🎨 Professional profile pages
- 📊 Availability management calendar
- 💼 Service catalog with pricing
- 📈 Booking dashboard and analytics
- 💰 Automated payment reconciliation

### Platform
- 🔐 Supabase Auth with role-based access
- 📧 Resend email integration
- 🔔 Real-time booking notifications
- 🛡️ Rate limiting and security
- 📱 Mobile-responsive design

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5.7 |
| **Styling** | Tailwind CSS 4 + Radix UI |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Payments** | Billplz |
| **Email** | Resend |
| **Hosting** | Vercel |

---

## 📦 Environment Variables

Create `.env.local` with:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
DATABASE_URL=

# App
NEXT_PUBLIC_APP_URL=https://www.leish.my

# Payments (Billplz)
BILLPLZ_API_KEY=
BILLPLZ_X_SIGNATURE=
BILLPLZ_COLLECTION_ID_FULL=
BILLPLZ_COLLECTION_ID_DEPOSIT=
BILLPLZ_CALLBACK_URL=
PAYMENT_SUCCESS_URL=

# Email (Resend)
RESEND_API_KEY=
FROM_EMAIL=hello@leish.my
```

See [.env.example](.env.example) for complete list.

---

## 🧪 Testing

```bash
# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint

# Seed test data
node scripts/seed.js
```

---

## 🚀 Deployment

### Automatic (Vercel)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual
```bash
vercel --prod
```

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 📂 Project Structure

```
├── app/                    # Next.js App Router
│   ├── (routes)/          # Page routes
│   ├── api/               # API endpoints
│   └── pro/               # Provider dashboard
├── components/            # React components
├── lib/                   # Utilities & services
│   ├── db/               # Database config
│   ├── email/            # Email templates
│   ├── payments/         # Billplz integration
│   └── services/         # Business logic
├── supabase/             # Migrations & config
└── scripts/              # Utility scripts
```

---

## 🔗 Live Demo

- **Production**: https://www.leish.my
- **Staging**: https://staging.leish.my

### Test Accounts
| Role | Access |
|------|--------|
| Customer | Sign up at `/sign-in` |
| Provider | Sign up → Select "Studio Owner/Artist" |

---

## 🤝 Contributing

1. Check [ROADMAP.md](ROADMAP.md) for planned features
2. Create a feature branch
3. Submit a pull request

See [APP_MANUAL.md](APP_MANUAL.md) for coding standards.

---

## 📝 License

Private - All rights reserved.

---

## 🆘 Support

| Issue | Resource |
|-------|----------|
| Setup problems | [APP_MANUAL.md](APP_MANUAL.md) |
| Deployment issues | [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) |
| Payment testing | [TEST_PAYMENT_GUIDE.md](TEST_PAYMENT_GUIDE.md) |
| Bug fixes | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |

---

**Built with ❤️ for the beauty community.**

[Live Site](https://www.leish.my) · [Documentation](APP_MANUAL.md) · [Report Issue](../../issues)
