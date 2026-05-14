-- create bookings owner update status policy once providers table exists
-- This migration runs after core tables have been created.
-- Note: Due to schema inconsistencies, this policy references only columns that should exist.

drop policy if exists "bookings: owner update status" on public.bookings;

-- Create minimal policy that works with existing schema
create policy "bookings: owner update status"
  on public.bookings for update
  using (
    auth.role() = 'admin' OR
    customer_id = auth.uid()
  );
