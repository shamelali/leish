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
  requested_role := lower(coalesce(new.raw_user_meta_data ->> 'role', 'customer'));

  -- Map role: UI sends "studio", DB enum uses "studio_manager"
  mapped_role_text := case
    when requested_role = 'artist' then 'artist'
    when requested_role in ('studio', 'studio_manager') then 'studio_manager'
    when requested_role = 'admin' then 'admin'
    else 'customer'
  end;

  full_name_val := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    split_part(new.email, '@', 1),
    'User'
  );

  insert into public.profiles (id, full_name, role)
  values (new.id, full_name_val, mapped_role_text::public.profile_role)
  on conflict (id) do update
    set full_name = excluded.full_name,
        role = excluded.role,
        updated_at = now();

  return new;
exception
  when others then
    raise warning 'handle_new_auth_user failed: %', sqlerrm;
    return new;
end;
$$;
