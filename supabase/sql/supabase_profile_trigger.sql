-- ==============================================================================
-- Supabase Trigger: Auto-create Profile on User Signup
-- Description: This trigger automatically creates a row in the `public.profiles`
-- table with the role of 'artist' whenever a new user registers in `auth.users`.
-- This ensures the user passes the `layout.tsx` checks and is correctly
-- routed to `/artist/onboarding`.
-- ==============================================================================

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert a new profile for the registering user
  -- Assuming your profiles table has 'id' (references auth.users) and 'role'
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'artist');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Bind the trigger to the auth.users table
-- Drop it first in case you are updating an existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Note: Run this script in your Supabase Dashboard -> SQL Editor
