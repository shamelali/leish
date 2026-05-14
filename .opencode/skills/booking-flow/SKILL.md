---
name: booking-flow
description: How the booking/payment flow works end to end in leish.my
license: private
compatibility: opencode
---

## Booking Rules
- **30-minute** availability slots, must align to `:00` or `:30`
- **24 hours** minimum advance booking time
- Always send **slot ID** (not label) to booking API
- Use **DB row lock** (`create_booking_with_lock` RPC) to prevent double-booking

## Booking States
`pending` → `confirmed` → `paid_deposit` / `paid_full` → `canceled`

## Payment
- **Billplz** is primary provider (not Stripe)
- Webhook is **source of truth** - never trust client-side
- Handle duplicate webhooks **idempotently** - check existing transaction ID

## Implementation
```typescript
// Create booking with lock
await supabase.rpc("create_booking_with_lock", {
  p_customer_id: string,
  p_provider_id: string,
  p_service_id: string,
  p_slot_id: string,
  p_total_amount_myr: number,
  p_notes: string | null
})
```

## Error Messages
- "Slot not found"
- "Bookings must be made at least 24 hours in advance"
- "Slot is already booked"
