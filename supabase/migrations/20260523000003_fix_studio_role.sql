-- Fix auth trigger: map studio_manager -> studio (matching the enum)
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  requested_role text;
  mapped_role_text text;
  profile_exists boolean;
begin
  if to_regclass('public.profiles') is null then
    return new;
  end if;

  select exists(
    select 1 from public.profiles where id = new.id
  ) into profile_exists;

  if profile_exists then
    return new;
  end if;

  requested_role := lower(coalesce(new.raw_user_meta_data ->> 'role', 'customer'));

  mapped_role_text := case
    when requested_role = 'artist' then 'artist'
    when requested_role = 'admin' then 'admin'
    when requested_role in ('studio_manager', 'studio') then 'studio'
    when requested_role = 'mua' then 'artist'
    else 'customer'
  end;

  begin
    insert into public.profiles (id, email, full_name, role, updated_at)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
      mapped_role_text::public.profile_role,
      now()
    );
  exception when others then
    raise warning 'Profile creation failed for user %: %', new.id, SQLERRM;
  end;

  return new;
end;
$$;

-- Fix any existing studio_manager profiles to use studio
update public.profiles
set role = 'studio'::public.profile_role
where role::text = 'studio_manager';
