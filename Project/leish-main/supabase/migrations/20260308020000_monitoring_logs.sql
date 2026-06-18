-- Migration: Add monitoring and logging tables
-- For webhook monitoring, booking cleanup tracking, and system health

-- 1. Create monitoring_logs table for cron job tracking
create table if not exists public.monitoring_logs (
  id uuid primary key default gen_random_uuid(),
  check_type text not null, -- 'webhook_monitor', 'booking_cleanup', etc.
  status text not null, -- 'ok', 'alert', 'error'
  details jsonb default '{}',
  created_at timestamptz not null default now()
);

-- 2. Create index for efficient querying
create index if not exists idx_monitoring_logs_type 
  on public.monitoring_logs(check_type, created_at desc);

create index if not exists idx_monitoring_logs_status 
  on public.monitoring_logs(status, created_at desc);

-- 3. Create webhook_logs table for delivery tracking (optional, for advanced monitoring)
create table if not exists public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  provider text not null, -- 'billplz', 'stripe', etc.
  event_type text not null,
  payload jsonb,
  status integer, -- HTTP status code
  response_body text,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_webhook_logs_provider 
  on public.webhook_logs(provider, created_at desc);

create index if not exists idx_webhook_logs_status 
  on public.webhook_logs(status, created_at desc);

-- 4. Enable RLS
alter table public.monitoring_logs enable row level security;
alter table public.webhook_logs enable row level security;

-- 5. RLS Policies - Admin only access

-- monitoring_logs policies
create policy "monitoring_logs: admin read"
  on public.monitoring_logs for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "monitoring_logs: system insert"
  on public.monitoring_logs for insert
  with check (true); -- Allow system/cron jobs to insert

-- webhook_logs policies
create policy "webhook_logs: admin read"
  on public.webhook_logs for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "webhook_logs: system insert"
  on public.webhook_logs for insert
  with check (true);

-- 6. Function to get recent monitoring stats
create or replace function public.get_monitoring_stats(
  p_hours integer default 24
)
returns table (
  check_type text,
  total_checks bigint,
  ok_count bigint,
  alert_count bigint,
  error_count bigint,
  last_check timestamptz
)
language sql
security definer
set search_path = public, pg_catalog
as $$
  select 
    m.check_type,
    count(*) as total_checks,
    count(*) filter (where m.status = 'ok') as ok_count,
    count(*) filter (where m.status = 'alert') as alert_count,
    count(*) filter (where m.status = 'error') as error_count,
    max(m.created_at) as last_check
  from public.monitoring_logs m
  where m.created_at > now() - (p_hours || ' hours')::interval
  group by m.check_type
  order by last_check desc;
$$;

-- 7. Function to cleanup old monitoring logs (keep 30 days)
create or replace function public.cleanup_old_monitoring_logs()
returns void
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  delete from public.monitoring_logs
  where created_at < now() - interval '30 days';
  
  delete from public.webhook_logs
  where created_at < now() - interval '30 days';
end;
$$;

-- 8. Comments
comment on table public.monitoring_logs is 'Logs from cron jobs and system monitoring';
comment on table public.webhook_logs is 'Webhook delivery logs for debugging and monitoring';
