-- Fix Supabase lint warnings: auth_rls_initplan and multiple_permissive_policies
-- 1. Wrap auth.uid() with (SELECT auth.uid()) to avoid per-row re-evaluation
-- 2. Merge overlapping permissive policies into single policies per action

-- ============================================================
-- provider_alerts: Fix auth_rls_initplan (all 4 policies)
-- ============================================================
DROP POLICY IF EXISTS "Admins can view all alerts" ON public.provider_alerts;
DROP POLICY IF EXISTS "Admins can insert alerts" ON public.provider_alerts;
DROP POLICY IF EXISTS "Admins can update alerts" ON public.provider_alerts;
DROP POLICY IF EXISTS "Admins can delete alerts" ON public.provider_alerts;

DROP POLICY IF EXISTS "Admins can view all alerts" ON public.provider_alerts;
CREATE POLICY "Admins can view all alerts"
  ON public.provider_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert alerts" ON public.provider_alerts;
CREATE POLICY "Admins can insert alerts"
  ON public.provider_alerts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update alerts" ON public.provider_alerts;
CREATE POLICY "Admins can update alerts"
  ON public.provider_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete alerts" ON public.provider_alerts;
CREATE POLICY "Admins can delete alerts"
  ON public.provider_alerts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- ============================================================
-- monitoring_logs: Fix auth_rls_initplan
-- ============================================================
DROP POLICY IF EXISTS "monitoring_logs: admin read" ON public.monitoring_logs;

DROP POLICY IF EXISTS "monitoring_logs: admin read" ON public.monitoring_logs;
CREATE POLICY "monitoring_logs: admin read"
  ON public.monitoring_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- webhook_logs: Fix auth_rls_initplan
-- ============================================================
DROP POLICY IF EXISTS "webhook_logs: admin read" ON public.webhook_logs;

DROP POLICY IF EXISTS "webhook_logs: admin read" ON public.webhook_logs;
CREATE POLICY "webhook_logs: admin read"
  ON public.webhook_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- loyalty_points_history: Fix auth_rls_initplan
-- ============================================================
DROP POLICY IF EXISTS "Users read own points" ON public.loyalty_points_history;

DROP POLICY IF EXISTS "Users read own points" ON public.loyalty_points_history;
CREATE POLICY "Users read own points"
  ON public.loyalty_points_history FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- messages: Fix auth_rls_initplan (sender can update)
-- ============================================================
DROP POLICY IF EXISTS "messages: sender can update (soft delete)" ON public.messages;

DROP POLICY IF EXISTS "messages: sender can update (soft delete)" ON public.messages;
CREATE POLICY "messages: sender can update (soft delete)"
  ON public.messages FOR UPDATE
  USING ((SELECT auth.uid()) = sender_id)
  WITH CHECK ((SELECT auth.uid()) = sender_id);

-- ============================================================
-- provider_assets: Fix auth_rls_initplan + merge SELECT
-- ============================================================
DROP POLICY IF EXISTS "Artists can view their own assets" ON public.provider_assets;
DROP POLICY IF EXISTS "Artists can insert their own assets" ON public.provider_assets;
DROP POLICY IF EXISTS "Artists can update their own assets" ON public.provider_assets;
DROP POLICY IF EXISTS "Artists can delete their own assets" ON public.provider_assets;
DROP POLICY IF EXISTS "Admins can view all assets" ON public.provider_assets;
DROP POLICY IF EXISTS "Public can view portfolio assets" ON public.provider_assets;

DROP POLICY IF EXISTS "provider_assets: select" ON public.provider_assets;
CREATE POLICY "provider_assets: select"
  ON public.provider_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = provider_assets.provider_id
      AND p.owner_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
    OR asset_type IN ('portfolio', 'work_sample', 'profile_photo')
  );

DROP POLICY IF EXISTS "provider_assets: insert" ON public.provider_assets;
CREATE POLICY "provider_assets: insert"
  ON public.provider_assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = provider_assets.provider_id
      AND p.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "provider_assets: update" ON public.provider_assets;
CREATE POLICY "provider_assets: update"
  ON public.provider_assets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = provider_assets.provider_id
      AND p.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "provider_assets: delete" ON public.provider_assets;
CREATE POLICY "provider_assets: delete"
  ON public.provider_assets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = provider_assets.provider_id
      AND p.owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- subscription_history: Fix auth_rls_initplan + merge SELECT
-- ============================================================
DROP POLICY IF EXISTS "Artists can view their own subscription history" ON public.subscription_history;
DROP POLICY IF EXISTS "Admins can view all subscription history" ON public.subscription_history;

DROP POLICY IF EXISTS "subscription_history: select" ON public.subscription_history;
CREATE POLICY "subscription_history: select"
  ON public.subscription_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = subscription_history.provider_id
      AND p.owner_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- ============================================================
-- provider_blocked_dates: Fix auth_rls_initplan + merge SELECT
-- ============================================================
DROP POLICY IF EXISTS "blocked_dates: provider manage own" ON public.provider_blocked_dates;
DROP POLICY IF EXISTS "blocked_dates: public read" ON public.provider_blocked_dates;

DROP POLICY IF EXISTS "blocked_dates: select" ON public.provider_blocked_dates;
CREATE POLICY "blocked_dates: select"
  ON public.provider_blocked_dates FOR SELECT
  USING (
    true
    OR EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = provider_blocked_dates.provider_id
      AND providers.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "blocked_dates: insert" ON public.provider_blocked_dates;
CREATE POLICY "blocked_dates: insert"
  ON public.provider_blocked_dates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = provider_blocked_dates.provider_id
      AND providers.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "blocked_dates: update" ON public.provider_blocked_dates;
CREATE POLICY "blocked_dates: update"
  ON public.provider_blocked_dates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = provider_blocked_dates.provider_id
      AND providers.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "blocked_dates: delete" ON public.provider_blocked_dates;
CREATE POLICY "blocked_dates: delete"
  ON public.provider_blocked_dates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = provider_blocked_dates.provider_id
      AND providers.owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- booking_surcharges: Merge overlapping SELECT policies
-- ============================================================
DROP POLICY IF EXISTS "booking_surcharges: admin full access" ON public.booking_surcharges;
DROP POLICY IF EXISTS "booking_surcharges: customer read own" ON public.booking_surcharges;
DROP POLICY IF EXISTS "booking_surcharges: provider read own" ON public.booking_surcharges;

DROP POLICY IF EXISTS "booking_surcharges: select" ON public.booking_surcharges;
CREATE POLICY "booking_surcharges: select"
  ON public.booking_surcharges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_surcharges.booking_id
      AND bookings.customer_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.providers p ON p.id = b.provider_id
      WHERE b.id = booking_surcharges.booking_id
      AND p.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "booking_surcharges: insert" ON public.booking_surcharges;
CREATE POLICY "booking_surcharges: insert"
  ON public.booking_surcharges FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "booking_surcharges: update" ON public.booking_surcharges;
CREATE POLICY "booking_surcharges: update"
  ON public.booking_surcharges FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "booking_surcharges: delete" ON public.booking_surcharges;
CREATE POLICY "booking_surcharges: delete"
  ON public.booking_surcharges FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- payout_items: Merge overlapping SELECT policies
-- ============================================================
DROP POLICY IF EXISTS "payout_items: admin full access" ON public.payout_items;
DROP POLICY IF EXISTS "payout_items: provider read own" ON public.payout_items;

DROP POLICY IF EXISTS "payout_items: select" ON public.payout_items;
CREATE POLICY "payout_items: select"
  ON public.payout_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.payouts
      JOIN public.providers ON providers.id = payouts.provider_id
      WHERE payouts.id = payout_items.payout_id
      AND providers.owner_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- payouts: Merge overlapping SELECT policies
-- ============================================================
DROP POLICY IF EXISTS "payouts: admin full access" ON public.payouts;
DROP POLICY IF EXISTS "payouts: provider read own" ON public.payouts;

DROP POLICY IF EXISTS "payouts: select" ON public.payouts;
CREATE POLICY "payouts: select"
  ON public.payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = payouts.provider_id
      AND providers.owner_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- profiles: Merge ALL overlapping policies
-- Drop everything and recreate cleanly
-- ============================================================
DROP POLICY IF EXISTS "profiles: self read" ON public.profiles;
DROP POLICY IF EXISTS "profiles: self update" ON public.profiles;
DROP POLICY IF EXISTS "profiles: self insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own_safe" ON public.profiles;
DROP POLICY IF EXISTS "profiles_upsert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

DROP POLICY IF EXISTS "profiles: select own" ON public.profiles;
CREATE POLICY "profiles: select own"
  ON public.profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "profiles: insert own" ON public.profiles;
CREATE POLICY "profiles: insert own"
  ON public.profiles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "profiles: update own" ON public.profiles;
CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "profiles: delete own" ON public.profiles;
CREATE POLICY "profiles: delete own"
  ON public.profiles FOR DELETE
  USING ((SELECT auth.uid()) = id);

-- ============================================================
-- providers: Merge per action
-- (uses is_admin() which is already efficient)
-- ============================================================
DROP POLICY IF EXISTS "providers: public read" ON public.providers;
DROP POLICY IF EXISTS "providers: owner insert" ON public.providers;
DROP POLICY IF EXISTS "providers: owner update" ON public.providers;
DROP POLICY IF EXISTS "providers: owner delete" ON public.providers;
DROP POLICY IF EXISTS "providers: admin all" ON public.providers;

DROP POLICY IF EXISTS "providers: select" ON public.providers;
CREATE POLICY "providers: select"
  ON public.providers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "providers: insert" ON public.providers;
CREATE POLICY "providers: insert"
  ON public.providers FOR INSERT
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    OR is_admin()
  );

DROP POLICY IF EXISTS "providers: update" ON public.providers;
CREATE POLICY "providers: update"
  ON public.providers FOR UPDATE
  USING (
    owner_id = (SELECT auth.uid())
    OR is_admin()
  );

DROP POLICY IF EXISTS "providers: delete" ON public.providers;
CREATE POLICY "providers: delete"
  ON public.providers FOR DELETE
  USING (
    owner_id = (SELECT auth.uid())
    OR is_admin()
  );

-- ============================================================
-- reviews: Merge overlapping SELECT policies
-- (keep reviews_customer_insert as-is — single INSERT policy)
-- ============================================================
DROP POLICY IF EXISTS "reviews: admin read all" ON public.reviews;
DROP POLICY IF EXISTS "reviews_public_select" ON public.reviews;

DROP POLICY IF EXISTS "reviews: select" ON public.reviews;
CREATE POLICY "reviews: select"
  ON public.reviews FOR SELECT
  USING (
    true
    OR is_admin()
  );

-- ============================================================
-- service_surcharges: Merge overlapping SELECT policies
-- ============================================================
DROP POLICY IF EXISTS "service_surcharges: public read" ON public.service_surcharges;
DROP POLICY IF EXISTS "service_surcharges: owner mutate" ON public.service_surcharges;

DROP POLICY IF EXISTS "service_surcharges: select" ON public.service_surcharges;
CREATE POLICY "service_surcharges: select"
  ON public.service_surcharges FOR SELECT
  USING (
    true
    OR EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = service_surcharges.provider_id
      AND providers.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "service_surcharges: insert" ON public.service_surcharges;
CREATE POLICY "service_surcharges: insert"
  ON public.service_surcharges FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = service_surcharges.provider_id
      AND providers.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "service_surcharges: update" ON public.service_surcharges;
CREATE POLICY "service_surcharges: update"
  ON public.service_surcharges FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = service_surcharges.provider_id
      AND providers.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "service_surcharges: delete" ON public.service_surcharges;
CREATE POLICY "service_surcharges: delete"
  ON public.service_surcharges FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.providers
      WHERE providers.id = service_surcharges.provider_id
      AND providers.owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- services: Merge per action
-- ============================================================
DROP POLICY IF EXISTS "services: public read" ON public.services;
DROP POLICY IF EXISTS "services: owner mutate" ON public.services;
DROP POLICY IF EXISTS "services: public read active" ON public.services;
DROP POLICY IF EXISTS "services: provider manage own" ON public.services;
DROP POLICY IF EXISTS "services: admin full access" ON public.services;

DROP POLICY IF EXISTS "services: select" ON public.services;
CREATE POLICY "services: select"
  ON public.services FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = services.provider_id
        AND p.owner_id = (SELECT auth.uid())
    )
    OR is_admin()
  );

DROP POLICY IF EXISTS "services: insert" ON public.services;
CREATE POLICY "services: insert"
  ON public.services FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = services.provider_id
        AND p.owner_id = (SELECT auth.uid())
    )
    OR is_admin()
  );

DROP POLICY IF EXISTS "services: update" ON public.services;
CREATE POLICY "services: update"
  ON public.services FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = services.provider_id
        AND p.owner_id = (SELECT auth.uid())
    )
    OR is_admin()
  );

DROP POLICY IF EXISTS "services: delete" ON public.services;
CREATE POLICY "services: delete"
  ON public.services FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = services.provider_id
        AND p.owner_id = (SELECT auth.uid())
    )
    OR is_admin()
  );

-- ============================================================
-- studio_gallery: Merge overlapping SELECT policies
-- ============================================================
DROP POLICY IF EXISTS "studio_gallery: public read" ON public.studio_gallery;
DROP POLICY IF EXISTS "studio_gallery: manager write" ON public.studio_gallery;

DROP POLICY IF EXISTS "studio_gallery: select" ON public.studio_gallery;
CREATE POLICY "studio_gallery: select"
  ON public.studio_gallery FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.providers p
      JOIN public.profiles pr ON pr.id = (SELECT auth.uid())
      WHERE p.id = studio_gallery.studio_id
        AND pr.role IN ('admin', 'studio')
    )
  );

DROP POLICY IF EXISTS "studio_gallery: insert" ON public.studio_gallery;
CREATE POLICY "studio_gallery: insert"
  ON public.studio_gallery FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers p
      JOIN public.profiles pr ON pr.id = (SELECT auth.uid())
      WHERE p.id = studio_gallery.studio_id
        AND pr.role IN ('admin', 'studio')
    )
  );

DROP POLICY IF EXISTS "studio_gallery: update" ON public.studio_gallery;
CREATE POLICY "studio_gallery: update"
  ON public.studio_gallery FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      JOIN public.profiles pr ON pr.id = (SELECT auth.uid())
      WHERE p.id = studio_gallery.studio_id
        AND pr.role IN ('admin', 'studio')
    )
  );

DROP POLICY IF EXISTS "studio_gallery: delete" ON public.studio_gallery;
CREATE POLICY "studio_gallery: delete"
  ON public.studio_gallery FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      JOIN public.profiles pr ON pr.id = (SELECT auth.uid())
      WHERE p.id = studio_gallery.studio_id
        AND pr.role IN ('admin', 'studio')
    )
  );

-- ============================================================
-- studio_rooms: Merge overlapping SELECT policies
-- ============================================================
DROP POLICY IF EXISTS "studio_rooms: public read" ON public.studio_rooms;
DROP POLICY IF EXISTS "studio_rooms: manager write" ON public.studio_rooms;

DROP POLICY IF EXISTS "studio_rooms: select" ON public.studio_rooms;
CREATE POLICY "studio_rooms: select"
  ON public.studio_rooms FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM public.providers p
      JOIN public.profiles pr ON pr.id = (SELECT auth.uid())
      WHERE p.id = studio_rooms.studio_id
        AND pr.role IN ('admin', 'studio')
    )
  );

DROP POLICY IF EXISTS "studio_rooms: insert" ON public.studio_rooms;
CREATE POLICY "studio_rooms: insert"
  ON public.studio_rooms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers p
      JOIN public.profiles pr ON pr.id = (SELECT auth.uid())
      WHERE p.id = studio_rooms.studio_id
        AND pr.role IN ('admin', 'studio')
    )
  );

DROP POLICY IF EXISTS "studio_rooms: update" ON public.studio_rooms;
CREATE POLICY "studio_rooms: update"
  ON public.studio_rooms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      JOIN public.profiles pr ON pr.id = (SELECT auth.uid())
      WHERE p.id = studio_rooms.studio_id
        AND pr.role IN ('admin', 'studio')
    )
  );

DROP POLICY IF EXISTS "studio_rooms: delete" ON public.studio_rooms;
CREATE POLICY "studio_rooms: delete"
  ON public.studio_rooms FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      JOIN public.profiles pr ON pr.id = (SELECT auth.uid())
      WHERE p.id = studio_rooms.studio_id
        AND pr.role IN ('admin', 'studio')
    )
  );

-- ============================================================
-- payments: Merge overlapping SELECT policies
-- ============================================================
DROP POLICY IF EXISTS "payments: customer or owner read" ON public.payments;
DROP POLICY IF EXISTS "payments: admin read all" ON public.payments;
DROP POLICY IF EXISTS "payments_party_select" ON public.payments;

DROP POLICY IF EXISTS "payments: select" ON public.payments;
CREATE POLICY "payments: select"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      JOIN public.providers p ON p.id = b.provider_id
      WHERE b.id = payments.booking_id
        AND (b.customer_id = (SELECT auth.uid()) OR p.owner_id = (SELECT auth.uid()))
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
    )
  );
