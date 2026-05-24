# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🛠️ Development Commands

Here are the most commonly used commands for development:

- **Start development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Start production server**: `npm run start`
- **Run linter**: `npm run lint`
- **Type checking**: `npm run typecheck`
- **Run tests**: `npm run test`
- **Seed database**: `npm run seed`
- **Verify environment variables**: `npm run verify-env`
- **Check email configuration**: `npm run check-email`
- **Seed staging data**: `npm run seed:staging`

### Running a Single Test
To run a specific test file or test suite:
```bash
npx vitest run path/to/test-file.test.ts
```
Or to run tests in watch mode:
```bash
npx vitest
```

## 🏗️ Project Architecture

### High-Level Structure
This is a Next.js 16 application using the App Router with TypeScript, Tailwind CSS, and Supabase.

```
├── app/                    # Next.js App Router (pages and route handlers)
│   ├── (routes)/          # Page route groups (public-facing pages)
│   ├── api/               # API route handlers (REST/GQL endpoints)
│   ├── pro/               # Provider dashboard (protected routes)
│   ├── auth/              # Authentication pages (sign-in, register)
│   ├── booking/           # Booking flow pages
│   ├── artists/           # Artist profiles and search
│   ├── studios/           # Studio profiles and management
│   ├── admin/             # Admin interface
│   ├── quiz/              # Quiz/assessment features
│   ├── onboarding/        # User onboarding flows
│   ├── gateway/           # Route protection middleware
│   └── ...                # Other feature sections
├── components/            # Reusable React components
│   ├── ui/                # Radix UI-based primitive components
│   ├── forms/             # Form components with react-hook-form
│   ├── layout/            # Layout components (headers, footers)
│   └── ...                # Feature-specific components
├── lib/                   # Utilities, services, and configuration
│   ├── db/                # Supabase client and database helpers
│   ├── email/             # Resend email templates and helpers
│   ├── payments/          # Billplz payment integration
│   ├── services/          # Business logic services
│   ├── supabase/          # Supabase SSR and auth helpers
│   ├── utils/             # General utility functions
│   └── ...                # Other service integrations
├── supabase/              # Supabase migrations, types, and seed data
│   ├── migrations/        # SQL migration files
│   ├── seed/              # Seed data scripts
│   └── types/             # Generated TypeScript types
├── scripts/               # Utility scripts (seeding, verification, etc.)
├── public/                # Static assets (images, icons)
├── styles/                # Global CSS and Tailwind configuration
└── ...                    # Configuration files
```

### Key Architectural Patterns

1. **App Router**: Uses Next.js 16 App Router with route groups, server components, and client components.
2. **Authentication**: Supabase Auth with role-based access (customer, studio owner, artist, admin).
3. **Data Layer**: Direct Supabase client usage in services, with some API routes for server-side operations.
4. **State Management**: Primarily React state (useState, useContext) and SWR/apollo for data fetching.
5. **Styling**: Tailwind CSS 4 with class-variance-authority and tailwind-merge for component variants.
6. **Forms**: React Hook Form with Zod validation via @hookform/resolvers.
7. **Payments**: Billplz integration for payment processing with webhook handling.
8. **Email**: Resend for transactional emails (booking confirmations, notifications).
9. **API Routes**: 
   - `/app/api/*` for REST endpoints
   - GraphQL server at `/app/api/graphql` (using Apollo Server)

### Important Files and Conventions

- **Environment Variables**: `.env.local` (see README for required variables)
- **Supabase Client**: Initialized in `lib/supabase/client.ts` and `lib/supabase/ssr.ts`
- **Type Safety**: Extensive use of TypeScript with generated Supabase types
- **Component Organization**: 
  - Server components by default in `app/` directory
  - Client components marked with `"use client"` directive
  - Shared components in `components/` directory
- **Routing**: 
  - Public routes in `app/(routes)/*`
  - Protected provider routes in `app/pro/*`
  - API routes in `app/api/*`

## 🧪 Testing Strategy

- **Unit Tests**: Vitest for testing utilities, components, and services
- **Test Files**: Located alongside source files with `.test.ts` or `.spec.ts` extension
- **Mocking**: Use Vitest's mocking capabilities for external services
- **Database Testing**: Uses separate test database; seed scripts available

## 📝 Code Quality

- **Linting**: ESLint with Next.js and SonarJS rules
- **Formatting**: Prettier configured via VS Code settings
- **Type Checking**: Strict TypeScript mode enabled
- **Commit Messages**: Conventional Commits encouraged

## ☁️ Deployment

- **Primary**: Vercel (automatic on GitHub push)
- **Environment Variables**: Set in Vercel project settings
- **Build Output**: `.next` directory
- **Database**: Supabase (managed separately)

## 🔧 Troubleshooting

- **Environment Issues**: Run `npm run verify-env` to check required variables
- **Database**: Check Supabase dashboard or run migrations with `supabase db push`
- **Auth Issues**: Verify Supabase URL and anon key
- **Payment Issues**: Check Billplz test mode and API credentials