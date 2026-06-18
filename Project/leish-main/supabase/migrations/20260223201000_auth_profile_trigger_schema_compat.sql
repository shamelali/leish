-- Harden signup profile trigger for schema drift (email/updated_at columns may differ across environments).

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  requested_role text;
  mapped_role_text text;
  has_profiles_table boolean;
  has_email_column boolean;
  has_full_name_column boolean;
  has_role_column boolean;
  has_updated_at_column boolean;
  has_profile_role_enum boolean;
begin
  has_profiles_table := to_regclass('public.profiles') is not null;
  if not has_profiles_table then
    return new;
  end if;

  requested_role := lower(coalesce(new.raw_user_meta_data ->> 'role', 'customer'));
  mapped_role_text := case
    when requested_role = 'artist' then 'artist'
    when requested_role = 'admin' then 'customer'
    when requested_role = 'studio_manager' then 'studio_manager'
    else 'customer'
  end;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'email'
  ) into has_email_column;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name'
  ) into has_full_name_column;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) into has_role_column;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'updated_at'
  ) into has_updated_at_column;

  has_profile_role_enum := to_regtype('public.profile_role') is not null;

  if has_role_column and has_full_name_column and has_email_column and has_profile_role_enum then
    if has_updated_at_column then
      execute $sql$
        insert into public.profiles (id, email, full_name, role)
        values ($1, $2, $3, $4::public.profile_role)
        on conflict (id) do update
          set email = excluded.email,
              full_name = excluded.full_name,
              role = excluded.role,
              updated_at = now()
      $sql$
      using new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), mapped_role_text;
    else
      execute $sql$
        insert into public.profiles (id, email, full_name, role)
        values ($1, $2, $3, $4::public.profile_role)
        on conflict (id) do update
          set email = excluded.email,
              full_name = excluded.full_name,
              role = excluded.role
      $sql$
      using new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), mapped_role_text;
    end if;
  elsif has_role_column and has_full_name_column and has_email_column then
    if has_updated_at_column then
      execute $sql$
        insert into public.profiles (id, email, full_name, role)
        values ($1, $2, $3, $4)
        on conflict (id) do update
          set email = excluded.email,
              full_name = excluded.full_name,
              role = excluded.role,
              updated_at = now()
      $sql$
      using new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), mapped_role_text;
    else
      execute $sql$
        insert into public.profiles (id, email, full_name, role)
        values ($1, $2, $3, $4)
        on conflict (id) do update
          set email = excluded.email,
              full_name = excluded.full_name,
              role = excluded.role
      $sql$
      using new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), mapped_role_text;
    end if;
  elsif has_full_name_column and has_email_column then
    if has_updated_at_column then
      execute $sql$
        insert into public.profiles (id, email, full_name)
        values ($1, $2, $3)
        on conflict (id) do update
          set email = excluded.email,
              full_name = excluded.full_name,
              updated_at = now()
      $sql$
      using new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.email);
    else
      execute $sql$
        insert into public.profiles (id, email, full_name)
        values ($1, $2, $3)
        on conflict (id) do update
          set email = excluded.email,
              full_name = excluded.full_name
      $sql$
      using new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.email);
    end if;
  elsif has_email_column then
    execute $sql$
      insert into public.profiles (id, email)
      values ($1, $2)
      on conflict (id) do update
        set email = excluded.email
    $sql$
    using new.id, new.email;
  elsif has_role_column and has_full_name_column and has_profile_role_enum then
    if has_updated_at_column then
      execute $sql$
        insert into public.profiles (id, full_name, role)
        values ($1, $2, $3::public.profile_role)
        on conflict (id) do update
          set full_name = excluded.full_name,
              role = excluded.role,
              updated_at = now()
      $sql$
      using new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), mapped_role_text;
    else
      execute $sql$
        insert into public.profiles (id, full_name, role)
        values ($1, $2, $3::public.profile_role)
        on conflict (id) do update
          set full_name = excluded.full_name,
              role = excluded.role
      $sql$
      using new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), mapped_role_text;
    end if;
  elsif has_full_name_column then
    if has_updated_at_column then
      execute $sql$
        insert into public.profiles (id, full_name)
        values ($1, $2)
        on conflict (id) do update
          set full_name = excluded.full_name,
              updated_at = now()
      $sql$
      using new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email);
    else
      execute $sql$
        insert into public.profiles (id, full_name)
        values ($1, $2)
        on conflict (id) do update
          set full_name = excluded.full_name
      $sql$
      using new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email);
    end if;
  else
    execute $sql$
      insert into public.profiles (id)
      values ($1)
      on conflict (id) do nothing
    $sql$
    using new.id;
  end if;

  return new;
exception
  when others then
    -- Do not block auth signup because of profile schema drift; reconcile profiles separately.
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
