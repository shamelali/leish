-- Fix auth_rls_initplan warning on notifications insert policy
DROP POLICY IF EXISTS notifications_insert_own ON public.notifications;

CREATE POLICY notifications_insert_own ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
