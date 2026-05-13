-- Fix signup trigger: consolidate and ensure idempotent profile creation
-- This migration addresses the "Database error saving new user" issue

-- First, drop ALL existing triggers on auth.users to eliminate duplicates
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'auth.users'::regclass 
        AND tgname LIKE '%auth%user%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', trigger_rec.tgname);
    END LOOP;
END$$;

-- Also explicitly drop the known trigger names
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

-- Create or replace the function with robust error handling
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  requested_role text;
  mapped_role_text text;
  has_profiles_table boolean;
  has_email_column boolean;
  has_full_name_column boolean;
  has_role_column boolean;
  has_updated_at_column boolean;
  has_profile_role_enum boolean;
  profile_exists boolean;
BEGIN
  -- Check if profiles table exists
  has_profiles_table := to_regclass('public.profiles') IS NOT NULL;
  IF NOT has_profiles_table THEN
    RETURN NEW;
  END IF;

  -- Check if profile already exists (idempotency)
  SELECT EXISTS(
    SELECT 1 FROM public.profiles WHERE id = NEW.id
  ) INTO profile_exists;
  
  IF profile_exists THEN
    RETURN NEW;
  END IF;

  -- Map role from signup metadata
  requested_role := LOWER(COALESCE(NEW.raw_user_meta_data ->> 'role', 'customer'));
  
  mapped_role_text := CASE
    WHEN requested_role = 'artist' THEN 'artist'
    WHEN requested_role = 'admin' THEN 'admin'
    WHEN requested_role = 'studio_manager' THEN 'studio_manager'
    WHEN requested_role = 'mua' THEN 'artist'
    ELSE 'customer'
  END;

  -- Check column existence
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
  ) INTO has_email_column;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
  ) INTO has_full_name_column;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) INTO has_role_column;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
  ) INTO has_updated_at_column;

  has_profile_role_enum := to_regtype('public.profile_role') IS NOT NULL;

  -- Build and execute dynamic INSERT based on available columns
  BEGIN
    IF has_role_column AND has_full_name_column AND has_email_column THEN
      IF has_profile_role_enum THEN
        IF has_updated_at_column THEN
          INSERT INTO public.profiles (id, email, full_name, role, updated_at)
          VALUES (
            NEW.id, 
            NEW.email, 
            COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
            mapped_role_text::public.profile_role,
            NOW()
          );
        ELSE
          INSERT INTO public.profiles (id, email, full_name, role)
          VALUES (
            NEW.id, 
            NEW.email, 
            COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
            mapped_role_text::public.profile_role
          );
        END IF;
      ELSE
        IF has_updated_at_column THEN
          INSERT INTO public.profiles (id, email, full_name, role, updated_at)
          VALUES (
            NEW.id, 
            NEW.email, 
            COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
            mapped_role_text,
            NOW()
          );
        ELSE
          INSERT INTO public.profiles (id, email, full_name, role)
          VALUES (
            NEW.id, 
            NEW.email, 
            COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
            mapped_role_text
          );
        END IF;
      END IF;
    ELSIF has_full_name_column AND has_email_column THEN
      IF has_updated_at_column THEN
        INSERT INTO public.profiles (id, email, full_name, updated_at)
        VALUES (
          NEW.id, 
          NEW.email, 
          COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
          NOW()
        );
      ELSE
        INSERT INTO public.profiles (id, email, full_name)
        VALUES (
          NEW.id, 
          NEW.email, 
          COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1))
        );
      END IF;
    ELSIF has_email_column THEN
      IF has_updated_at_column THEN
        INSERT INTO public.profiles (id, email, updated_at)
        VALUES (NEW.id, NEW.email, NOW());
      ELSE
        INSERT INTO public.profiles (id, email)
        VALUES (NEW.id, NEW.email);
      END IF;
    ELSE
      -- Minimal insert with just id
      INSERT INTO public.profiles (id)
      VALUES (NEW.id);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't block auth signup
    RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT INSERT ON public.profiles TO supabase_auth_admin;

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_auth_user() IS 'Creates a profile row when a new user signs up. Handles schema variations and is idempotent.';
