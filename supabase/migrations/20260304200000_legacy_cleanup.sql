-- cleanup legacy tables from previous schema version
-- dropping old tables allows our UUID-based marketplace schema to be created cleanly.

-- sequences created by old bigint tables
DROP SEQUENCE IF EXISTS public.services_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.booking_items_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.pro_locations_id_seq CASCADE;

-- legacy tables (safe to drop; no production data expected yet)
DROP TABLE IF EXISTS public.booking_items CASCADE;
DROP TABLE IF EXISTS public.booking_requests CASCADE;
DROP TABLE IF EXISTS public.ledger CASCADE;
DROP TABLE IF EXISTS public.leish_bookings CASCADE;
DROP TABLE IF EXISTS public.leish_muas CASCADE;
DROP TABLE IF EXISTS public.leish_services CASCADE;
DROP TABLE IF EXISTS public.mua_profiles CASCADE;
DROP TABLE IF EXISTS public.packages CASCADE;
DROP TABLE IF EXISTS public.pros CASCADE;
DROP TABLE IF EXISTS public.pro_locations CASCADE;
DROP TABLE IF EXISTS public.pro_services CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.profile_creation_audit CASCADE;
DROP TABLE IF EXISTS public.spaces CASCADE;

-- If a legacy "services" table existed with bigint PK, drop it so we can create uuid version
DROP TABLE IF EXISTS public.services CASCADE;

-- now re-create the modern services table (uuid) if it doesn't exist
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  name text NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  price_myr integer NOT NULL CHECK (price_myr >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- availability of this table needed by later migrations
CREATE UNIQUE INDEX IF NOT EXISTS availability_slot_unique
  ON public.availability_slots(provider_id, starts_at, ends_at);
