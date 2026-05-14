-- add timestamp columns for booking lifecycle events

alter table public.bookings
  add column if not exists confirmed_at timestamptz,
  add column if not exists canceled_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists refunded_at timestamptz;

-- policy allowing owners and admins to update bookings (application enforces transitions)
-- moved to separate migration due to table dependency
-- drop policy if exists "bookings: owner update status" on public.bookings;

-- create policy "bookings: owner update status"
--   on public.bookings for update
--   using (
--     auth.role() = 'admin' OR
--     customer_id = auth.uid() OR
--     exists(
--       select 1 from public.providers p
--       where p.id = provider_id and p.owner_id = auth.uid()
--     )
--   );
