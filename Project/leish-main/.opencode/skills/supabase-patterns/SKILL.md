---
name: supabase-patterns
description: Supabase auth + RLS patterns used in this project
license: private
compatibility: opencode
---

## Auth
- Use `getSupabaseSsrClient()` for SSR auth (not middleware)
- Session refresh via `lib/supabase/proxy.ts` - NOT middleware.ts
- Profile insert trigger: `ON CONFLICT (id) DO NOTHING`

## RLS
- ALL tables MUST have RLS policies
- Never expose tables without RLS

## Types
```typescript
interface Provider {
  id: string
  owner_id: string
  kind: "artist" | "studio"
  slug: string
  display_name: string
  state: string
  district: string
  is_active: boolean
}

interface Service {
  id: string
  provider_id: string
  name: string
  duration_minutes: number
  price_myr: number
  is_active: boolean
}

interface AvailabilitySlot {
  id: string
  provider_id: string
  starts_at: string
  ends_at: string
  is_booked: boolean
}

interface Booking {
  id: string
  customer_id: string
  provider_id: string
  service_id: string
  slot_id: string
  status: "pending" | "confirmed" | "paid_deposit" | "paid_full" | "canceled"
}
```
