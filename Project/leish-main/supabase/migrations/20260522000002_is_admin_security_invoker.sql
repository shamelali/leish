-- Switch is_admin() from SECURITY DEFINER to SECURITY INVOKER
-- The function only reads the caller's own profile, which is allowed by RLS
-- No need for definer privileges

create or replace function public.is_admin()
returns boolean
language sql
security invoker
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
