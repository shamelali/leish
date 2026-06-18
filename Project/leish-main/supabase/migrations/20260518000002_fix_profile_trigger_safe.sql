-- Fix profile trigger: add exception handler back, simplify logic
-- The profiles table has: id, full_name, role, created_at, updated_at
-- NO email column

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

  -- Insert or update profile
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

-- Recreate trigger
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
