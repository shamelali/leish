-- Nuke all providers policies and rebuild from scratch
-- This fixes any duplicate/conflicting policies

-- 1. Drop EVERY policy on providers
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies WHERE tablename = 'providers' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.providers', pol.policyname);
    END LOOP;
END $$;

-- 2. Ensure RLS is enabled
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- 3. Recreate clean policies
-- Public can read all active providers
CREATE POLICY "providers: public read"
  ON public.providers FOR SELECT
  USING (true);

-- Owners can insert their own provider
CREATE POLICY "providers: owner insert"
  ON public.providers FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Owners can update their own provider
CREATE POLICY "providers: owner update"
  ON public.providers FOR UPDATE
  USING (owner_id = auth.uid());

-- Owners can delete their own provider
CREATE POLICY "providers: owner delete"
  ON public.providers FOR DELETE
  USING (owner_id = auth.uid());

-- Admins can do everything
CREATE POLICY "providers: admin all"
  ON public.providers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
