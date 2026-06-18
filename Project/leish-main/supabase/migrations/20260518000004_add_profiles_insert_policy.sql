-- Add missing RLS policies for profiles table

-- Allow users to insert their own profile (needed for API fallback creation)
CREATE POLICY "profiles: self insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile (already exists but ensure it's there)
CREATE POLICY "profiles: self update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
