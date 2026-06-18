-- Add missing FK indexes flagged by performance advisor
CREATE INDEX IF NOT EXISTS idx_booking_surcharges_surcharge_id ON public.booking_surcharges (surcharge_id);
CREATE INDEX IF NOT EXISTS idx_providers_suspended_by ON public.providers (suspended_by);
