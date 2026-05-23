drop policy if exists "services_deny_all_api_readwrite" on public.services;
drop policy if exists "services: visible via related bookings" on public.services;

create policy "services: public read active"
  on public.services for select
  using (is_active = true);

create policy "services: provider manage own"
  on public.services for all
  using (
    exists (
      select 1 from public.providers p
      where p.id = services.provider_id
        and p.owner_id = auth.uid()
    )
  );

create policy "services: admin full access"
  on public.services for all
  using (is_admin());

