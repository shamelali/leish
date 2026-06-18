-- Ensure profile_role enum exists and fix trigger to be fully tolerant

-- 1. Create enum if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_role') THEN
    CREATE TYPE public.profile_role AS ENUM ('admin', 'artist', 'studio_manager', 'customer');
  END IF;
END $$;

-- 2. Ensure profiles table has the right columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS role public.profile_role NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 3. Replace trigger function with tolerant version
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  requested_role text;
  mapped_role_text text;
  full_name_val text;
begin
  -- Extract role from metadata, default to customer
  requested_role := lower(coalesce(new.raw_user_meta_data ->> 'role', 'customer'));
  
  -- Map role (prevent admin signup via normal flow)
  mapped_role_text := case
    when requested_role = 'artist' then 'artist'
    when requested_role = 'studio_manager' then 'studio_manager'
    else 'customer'
  end;

  -- Get full name from metadata, fallback to email prefix
  full_name_val := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    split_part(new.email, '@', 1),
    'User'
  );

  -- Insert or update profile — cast is safe because we mapped to valid enum values
  insert into public.profiles (id, full_name, role)
  values (new.id, full_name_val, mapped_role_text::public.profile_role)
  on conflict (id) do update
    set full_name = excluded.full_name,
        role = excluded.role,
        updated_at = now();

  return new;
exception
  when others then
    -- Never block signup because of profile issues
    raise warning 'handle_new_auth_user failed: %', sqlerrm;
    return new;
end;
$$;

-- 4. Recreate trigger
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
