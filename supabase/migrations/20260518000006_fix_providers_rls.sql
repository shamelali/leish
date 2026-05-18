-- Fix providers RLS: split into explicit policies

-- Drop existing policies
drop policy if exists "providers: owner mutate" on public.providers;
drop policy if exists "providers: owner insert" on public.providers;
drop policy if exists "providers: owner update" on public.providers;
drop policy if exists "providers: owner delete" on public.providers;
drop policy if exists "providers: public read" on public.providers;
drop policy if exists "providers: admin all" on public.providers;

-- Recreate with explicit policies
create policy "providers: public read"
  on public.providers for select
  using (true);

create policy "providers: owner insert"
  on public.providers for insert
  with check (owner_id = auth.uid());

create policy "providers: owner update"
  on public.providers for update
  using (owner_id = auth.uid());

create policy "providers: owner delete"
  on public.providers for delete
  using (owner_id = auth.uid());

create policy "providers: admin all"
  on public.providers for all
  using (public.is_admin())
  with check (public.is_admin());
