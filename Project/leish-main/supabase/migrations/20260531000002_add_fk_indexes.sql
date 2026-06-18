-- Add indexes for foreign keys that lack covering indexes
-- Identified by Supabase database linter (0001_unindexed_foreign_keys)
-- These indexes improve JOIN and cascading operation performance.

CREATE INDEX IF NOT EXISTS idx_booking_surcharges_surcharge_id ON public.booking_surcharges(surcharge_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_payout_items_payout_id ON public.payout_items(payout_id);
CREATE INDEX IF NOT EXISTS idx_providers_suspended_by ON public.providers(suspended_by);
CREATE INDEX IF NOT EXISTS idx_reviews_room_id ON public.reviews(room_id);
CREATE INDEX IF NOT EXISTS idx_services_provider_id ON public.services(provider_id);
CREATE INDEX IF NOT EXISTS idx_studio_gallery_room_id ON public.studio_gallery(room_id);
