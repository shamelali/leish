// Server package - exports all server-side modules
export * from './db.js';
export * from './catalog.js';
export * from './payments.js';
export * from './session.js';
export * from './email.js';
export * from './booking-emails.js';
export * from './payouts.js';
export * from './settings.js';
export * from './errors.js';
export * from './logger.js';
export * from './validation.js';
export * from './artist-profiles.js';
export * from './booking-transitions.js';
export * from './quotations.js';
export * from './invoices.js';
export * from './notifications.js';
export * from './referral.js';
export * from './chat-bus.js';
export * from './cron-auth.js';
export * from './csrf.js';
export * from './http.js';
export * from './integrations.js';
export * from './invoice-pdf.js';
export * from './password.js';
export * from './quotation-recovery.js';
export * from './ratelimit.js';
export * from './redis.js';
export * from './reset-token.js';
export * from './review-requests.js';
export * from './studio-profiles.js';
export * from './turnstile.js';
export * from './upload.js';
export * from './verify-email.js';
export * from './balance-reminders.js';
export * from './payout-automation.js';
export * from './admin-auth.js';
export * from './connect.js';
export * from './catalog-seed.js';

// ── Ambiguity resolution (TS2308) ───────────────────────────────────────────
// leish_v2 deliberately has no barrel file, and three names are defined in
// more than one module here. A bare `export *` would leave them ambiguous, so
// each is re-exported explicitly with the winner chosen deliberately. Nothing
// imports this barrel yet, so the choice cannot break a consumer:
//   - QuotationInput        -> validation.ts (z.infer<typeof quotationSchema>;
//                              quotations.ts has a hand-written interface)
//   - EmailProvider         -> email.ts (integrations.ts repeats the same union)
//   - isTurnstileConfigured -> turnstile.ts (validates TURNSTILE_SECRET_KEY;
//                              integrations.ts only checks the public site key)
export type { QuotationInput } from './validation.js';
export type { EmailProvider } from './email.js';
export { isTurnstileConfigured } from './turnstile.js';
