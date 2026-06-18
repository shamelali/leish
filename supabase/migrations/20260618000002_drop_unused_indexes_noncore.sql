-- Drop unused indexes on non-core Leish tables
-- These indexes were never used (pre-launch) and are not on core Leish query paths

drop index if exists public.studio_spaces_provider_id_idx;
drop index if exists public.studio_spaces_active_idx;
drop index if exists public.services_space_id_idx;
drop index if exists public.services_category_idx;
drop index if exists public.availability_slots_space_id_idx;
drop index if exists public.idx_rate_limits_expires_at;
