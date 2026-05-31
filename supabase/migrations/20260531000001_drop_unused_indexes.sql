-- Drop unused indexes identified by Supabase database linter (0005_unused_index)
-- These indexes have never been used and are candidates for removal.
-- providers_slug_idx is redundant with the unique constraint on providers.slug.
-- Recreate any index later if query patterns require it.

-- admin_audit_log
DROP INDEX IF EXISTS public.admin_audit_log_action_idx;

-- provider_assets
DROP INDEX IF EXISTS public.idx_provider_assets_type;
DROP INDEX IF EXISTS public.idx_provider_assets_primary;
DROP INDEX IF EXISTS public.idx_provider_assets_content_type;

-- provider_alerts
DROP INDEX IF EXISTS public.idx_provider_alerts_status;
DROP INDEX IF EXISTS public.idx_provider_alerts_open_high;
DROP INDEX IF EXISTS public.idx_provider_alerts_severity;
DROP INDEX IF EXISTS public.idx_provider_alerts_created;

-- bookings
DROP INDEX IF EXISTS public.idx_bookings_pro;
DROP INDEX IF EXISTS public.idx_bookings_expires_at;
DROP INDEX IF EXISTS public.idx_bookings_status;
DROP INDEX IF EXISTS public.idx_bookings_service_id;

-- messages
DROP INDEX IF EXISTS public.idx_messages_receiver_unread;
DROP INDEX IF EXISTS public.idx_messages_created_at;

-- monitoring_logs
DROP INDEX IF EXISTS public.idx_monitoring_logs_type;
DROP INDEX IF EXISTS public.idx_monitoring_logs_status;

-- webhook_logs
DROP INDEX IF EXISTS public.idx_webhook_logs_provider;
DROP INDEX IF EXISTS public.idx_webhook_logs_status;

-- providers
DROP INDEX IF EXISTS public.idx_providers_tier;
DROP INDEX IF EXISTS public.idx_providers_suspended;
DROP INDEX IF EXISTS public.idx_providers_tier_active;
DROP INDEX IF EXISTS public.idx_providers_suspended_by;
DROP INDEX IF EXISTS public.providers_state_kind_idx;
DROP INDEX IF EXISTS public.providers_tier_idx;
DROP INDEX IF EXISTS public.providers_slug_idx;

-- subscription_history
DROP INDEX IF EXISTS public.idx_subscription_history_date;
DROP INDEX IF EXISTS public.idx_subscription_history_action;

-- reviews
DROP INDEX IF EXISTS public.idx_reviews_room_id;
DROP INDEX IF EXISTS public.idx_reviews_pro;

-- booking_surcharges
DROP INDEX IF EXISTS public.idx_booking_surcharges_surcharge_id;

-- services
DROP INDEX IF EXISTS public.idx_services_provider_id;

-- studio_gallery
DROP INDEX IF EXISTS public.idx_studio_gallery_room_id;

-- payouts
DROP INDEX IF EXISTS public.idx_payouts_status;
DROP INDEX IF EXISTS public.idx_payouts_period;

-- payout_items
DROP INDEX IF EXISTS public.idx_payout_items_payout;

-- provider_blocked_dates
DROP INDEX IF EXISTS public.idx_blocked_dates_date;
