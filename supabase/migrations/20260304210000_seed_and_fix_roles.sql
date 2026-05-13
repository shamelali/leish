-- ensure profiles.role uses the new profile_role enum

DO $$
BEGIN
  IF to_regtype('public.profile_role') IS NULL THEN
    CREATE TYPE public.profile_role AS ENUM ('admin', 'artist', 'studio_manager', 'customer');
  END IF;
END$$;

-- if the profiles table still uses legacy user_role, convert it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    -- alter column to profile_role if not already
    IF (SELECT atttypid::regtype::text FROM pg_attribute
        WHERE attrelid = 'public.profiles'::regclass AND attname = 'role') = 'user_role' THEN
      -- first drop the default and constraints, then convert
      ALTER TABLE public.profiles
        ALTER COLUMN role DROP DEFAULT;
      ALTER TABLE public.profiles
        ALTER COLUMN role TYPE public.profile_role USING role::text::public.profile_role;
      -- restore default
      ALTER TABLE public.profiles
        ALTER COLUMN role SET DEFAULT 'customer'::public.profile_role;
    END IF;
  END IF;
END$$;
