-- ============================================================================
-- LEISH CRITICAL FIXES - Run in Supabase Dashboard → SQL Editor
-- ============================================================================
-- This file contains the MINIMUM critical fixes needed for the project to work.
-- For full schema, use: supabase db push (requires CLI)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. HELPER FUNCTIONS (must be created FIRST - referenced by policies)
-- ---------------------------------------------------------------------------

-- IS_ADMIN HELPER (from 20260522000002_is_admin_security_invoker.sql)
-- Must be created before policies that reference it

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = (SELECT auth.uid()::text)
    AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated, service_role;


-- ---------------------------------------------------------------------------
-- 1. AUTH TRIGGER: handle_new_auth_user()
-- Maps role="studio" → "studio_manager" in profiles.role per AGENTS.md
-- ---------------------------------------------------------------------------
-- Note: profiles.user_id FK references public.user(id), not auth.users(id).
-- The trigger inserts into profiles; public.user row should exist from NextAuth sync.
-- If FK violation occurs, ensure user sync runs first or adjust FK design.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, status, onboarding_step)
  VALUES (
    NEW.id,
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'studio' THEN 'studio_manager'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    END,
    'draft',
    0
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();


-- ---------------------------------------------------------------------------
-- 2. USER-FACING RLS POLICIES
-- Using (SELECT auth.uid()) pattern per AGENTS.md (avoids auth_rls_initplan)
-- ---------------------------------------------------------------------------

-- PROFILES
-- profiles_select_own already exists with matching condition - skip to avoid duplicate error

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));

-- Admin policy: use is_admin() function to avoid RLS recursion on profiles table
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin());

-- BOOKINGS
DROP POLICY IF EXISTS "bookings_select_own" ON public.bookings;
CREATE POLICY "bookings_select_own" ON public.bookings
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid()::text)
    OR artist_id = (SELECT auth.uid()::text)
    OR studio_id = (SELECT auth.uid()::text)
  );

DROP POLICY IF EXISTS "bookings_insert_customer" ON public.bookings;
CREATE POLICY "bookings_insert_customer" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "bookings_update_participant" ON public.bookings;
CREATE POLICY "bookings_update_participant" ON public.bookings
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid()::text)
    OR artist_id = (SELECT auth.uid()::text)
    OR studio_id = (SELECT auth.uid()::text)
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()::text)
    OR artist_id = (SELECT auth.uid()::text)
    OR studio_id = (SELECT auth.uid()::text)
  );

-- AVAILABILITY_SLOTS
DROP POLICY IF EXISTS "availability_slots_select_public" ON public.availability_slots;
CREATE POLICY "availability_slots_select_public" ON public.availability_slots
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "availability_slots_manage_own" ON public.availability_slots;
CREATE POLICY "availability_slots_manage_own" ON public.availability_slots
  FOR ALL TO authenticated
  USING (
    artist_id = (SELECT auth.uid()::text)
    OR studio_id = (SELECT auth.uid()::text)
  )
  WITH CHECK (
    artist_id = (SELECT auth.uid()::text)
    OR studio_id = (SELECT auth.uid()::text)
  );

-- SERVICES
DROP POLICY IF EXISTS "services_select_public" ON public.services;
CREATE POLICY "services_select_public" ON public.services
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "services_manage_own" ON public.services;
CREATE POLICY "services_manage_own" ON public.services
  FOR ALL TO authenticated
  USING (
    artist_id = (SELECT auth.uid()::text)
    OR studio_id = (SELECT auth.uid()::text)
  )
  WITH CHECK (
    artist_id = (SELECT auth.uid()::text)
    OR studio_id = (SELECT auth.uid()::text)
  );

-- PAYMENTS
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = payments.booking_id
      AND (b.user_id = (SELECT auth.uid()::text) OR b.artist_id = (SELECT auth.uid()::text) OR b.studio_id = (SELECT auth.uid()::text))
    )
  );

-- AVAILABILITY_RULES
DROP POLICY IF EXISTS "availability_rules_manage_own" ON public.availability_rules;
CREATE POLICY "availability_rules_manage_own" ON public.availability_rules
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()::text))
  WITH CHECK (user_id = (SELECT auth.uid()::text));

-- USER TABLE (public.user for NextAuth)
DROP POLICY IF EXISTS "user_select_own" ON public.user;
CREATE POLICY "user_select_own" ON public.user
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()::text));


-- ---------------------------------------------------------------------------
-- 3. MISSING FK INDEXES (16 from performance advisor)
-- ---------------------------------------------------------------------------
-- Note: CamelCase columns "userId" on public.account and public.session must be quoted

CREATE INDEX IF NOT EXISTS idx_account_user_id ON public.account ("userId");
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts (author_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings (service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_studio_id ON public.bookings (studio_id);
CREATE INDEX IF NOT EXISTS idx_payouts_payment_id ON public.payouts (payment_id);
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON public.payouts (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_studio_id ON public.profiles (studio_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_usages_booking_id ON public.promo_code_usages (booking_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_created_by ON public.promo_codes (created_by);
CREATE INDEX IF NOT EXISTS idx_referrals_booking_id ON public.referrals (booking_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_user_id ON public.referrals (referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_inspiration_source_artist_id ON public.saved_inspiration (source_artist_id);
CREATE INDEX IF NOT EXISTS idx_session_user_id ON public.session ("userId");
CREATE INDEX IF NOT EXISTS idx_studio_inventory_studio_id ON public.studio_inventory (studio_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON public.subscriptions (plan_id);


-- ---------------------------------------------------------------------------
-- 4. ATOMIC BOOKING LOCK FUNCTION (from 20260307140000_atomic_booking_lock.sql)
-- Critical for booking engine - prevents double-booking
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.try_lock_booking_slot(
  p_slot_id integer,
  p_user_id text,
  p_artist_id text DEFAULT NULL,
  p_studio_id text DEFAULT NULL,
  p_service_id integer DEFAULT NULL,
  p_date date DEFAULT NULL,
  p_time time without time zone DEFAULT NULL,
  p_amount numeric DEFAULT 0,
  p_deposit_amount numeric DEFAULT 0,
  p_deposit_percent integer DEFAULT 30
)
RETURNS TABLE (
  booking_id integer,
  success boolean,
  error text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id integer;
  v_slot RECORD;
BEGIN
  -- Lock the slot row
  SELECT * INTO v_slot
  FROM public.availability_slots
  WHERE id = p_slot_id
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::integer, false, 'Slot not found or already locked';
    RETURN;
  END IF;

  IF v_slot.is_booked THEN
    RETURN QUERY SELECT NULL::integer, false, 'Slot already booked';
    RETURN;
  END IF;

  -- Verify ownership
  IF p_artist_id IS NOT NULL AND v_slot.artist_id != p_artist_id THEN
    RETURN QUERY SELECT NULL::integer, false, 'Slot does not belong to artist';
    RETURN;
  END IF;

  IF p_studio_id IS NOT NULL AND v_slot.studio_id != p_studio_id THEN
    RETURN QUERY SELECT NULL::integer, false, 'Slot does not belong to studio';
    RETURN;
  END IF;

  -- Mark slot as booked
  UPDATE public.availability_slots
  SET is_booked = true
  WHERE id = p_slot_id;

  -- Create booking
  INSERT INTO public.bookings (
    user_id, artist_id, studio_id, service_id, date, time,
    amount, deposit_amount, deposit_percent, status
  ) VALUES (
    p_user_id, p_artist_id, p_studio_id, p_service_id, p_date, p_time,
    p_amount, p_deposit_amount, p_deposit_percent, 'pending'
  )
  RETURNING id INTO v_booking_id;

  RETURN QUERY SELECT v_booking_id, true, NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT NULL::integer, false, SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.try_lock_booking_slot TO authenticated, service_role;


-- ---------------------------------------------------------------------------
-- 5. NOTIFICATIONS REALTIME (from 20260605000000_enable_notifications_realtime.sql)
-- ---------------------------------------------------------------------------

-- Add tables to realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'booking_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_events;
  END IF;
END $$;


-- ============================================================================
-- VERIFICATION QUERIES (run after applying above)
-- ============================================================================

-- Check trigger exists
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass AND tgname = 'on_auth_user_created';

-- Check policies
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND roles @> '{authenticated}';

-- Check indexes
-- SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';

-- Check functions
-- SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname IN ('try_lock_booking_slot', 'handle_new_auth_user', 'is_admin');