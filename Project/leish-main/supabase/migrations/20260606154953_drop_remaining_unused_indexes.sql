-- Drop remaining unused indexes flagged by Supabase advisor
-- These indexes generate write overhead without being used by queries

DROP INDEX IF EXISTS public.idx_payout_items_payout_id;
DROP INDEX IF EXISTS public.idx_providers_suspended_by;
DROP INDEX IF EXISTS public.idx_reviews_room_id;
DROP INDEX IF EXISTS public.idx_services_provider_id;
DROP INDEX IF EXISTS public.idx_studio_gallery_room_id;
DROP INDEX IF EXISTS public.idx_bookings_provider_id;
DROP INDEX IF EXISTS public.idx_booking_surcharges_surcharge_id;
DROP INDEX IF EXISTS public.idx_bookings_service_id;
DROP INDEX IF EXISTS public.idx_notifications_unread;
