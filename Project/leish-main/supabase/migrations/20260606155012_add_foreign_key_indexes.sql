-- Add indexes for foreign keys that align with known query patterns
-- These were flagged after dropping the unused indexes that coincidentally covered them

CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings (service_id);
CREATE INDEX IF NOT EXISTS idx_services_provider_id ON public.services (provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_room_id ON public.reviews (room_id);
CREATE INDEX IF NOT EXISTS idx_studio_gallery_room_id ON public.studio_gallery (room_id);
CREATE INDEX IF NOT EXISTS idx_payout_items_payout_id ON public.payout_items (payout_id);
