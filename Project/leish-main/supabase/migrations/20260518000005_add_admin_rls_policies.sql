-- Add admin access via is_admin() helper function
-- This migration only adds the function and admin policies
-- It does NOT modify existing customer/owner policies

-- 1. Create is_admin helper function
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 2. Add admin-only SELECT policy for bookings (doesn't conflict with existing)
create policy "bookings: admin read all"
  on public.bookings for select
  using (public.is_admin());

-- 3. Add admin-only UPDATE policy for bookings
create policy "bookings: admin update all"
  on public.bookings for update
  using (public.is_admin());

-- 4. Add admin-only SELECT policy for reviews
create policy "reviews: admin read all"
  on public.reviews for select
  using (public.is_admin());

-- 5. Add admin-only SELECT policy for payments
create policy "payments: admin read all"
  on public.payments for select
  using (public.is_admin());

-- 6. Add admin-only ALL policy for providers
create policy "providers: admin all"
  on public.providers for all
  using (public.is_admin())
  with check (public.is_admin());
