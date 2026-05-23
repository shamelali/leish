-- Clean up redundant and broken RLS policies on bookings
--
-- Problems fixed:
-- 1. Duplicate INSERT policies (Users can create bookings + bookings_customer_insert)
-- 2. Broken pro_id = auth.uid() checks (pro_id is provider UUID, not user UUID)
-- 3. Redundant overlapping SELECT/UPDATE policies

-- Drop redundant/broken policies
drop policy if exists "Users can create bookings" on public.bookings;
drop policy if exists "Users can view own bookings" on public.bookings;
drop policy if exists "bookings: admin read all" on public.bookings;
drop policy if exists "bookings: admin update all" on public.bookings;
drop policy if exists "bookings: owner update status" on public.bookings;
drop policy if exists "bookings: provider read own" on public.bookings;

-- Recreate party_select with correct provider owner check
drop policy if exists "bookings_party_select" on public.bookings;
create policy "bookings_party_select"
  on public.bookings for select
  using (
    customer_id = auth.uid()
    or exists (
      select 1 from public.providers p
      where p.id = bookings.pro_id and p.owner_id = auth.uid()
    )
    or is_admin()
  );

-- Recreate party_update with correct provider owner check
drop policy if exists "bookings_party_update" on public.bookings;
create policy "bookings_party_update"
  on public.bookings for update
  using (
    customer_id = auth.uid()
    or exists (
      select 1 from public.providers p
      where p.id = bookings.pro_id and p.owner_id = auth.uid()
    )
    or is_admin()
  );

-- Keep bookings_customer_insert as the single INSERT policy
-- (already exists, no changes needed)
