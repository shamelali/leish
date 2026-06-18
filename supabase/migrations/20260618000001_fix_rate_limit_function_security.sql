-- Fix rate_limit_check function security issues
-- 1. Add search_path to prevent search_path injection
-- 2. Revoke EXECUTE from anon and authenticated (unused by Leish app)

create or replace function public.rate_limit_check(
  p_bucket text,
  p_max integer,
  p_window_ms integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_now timestamptz := now();
  v_expires_at timestamptz;
  v_ip text;
  v_count integer;
  v_result jsonb;
begin
  v_ip := substring(p_bucket from '[^:]+$');
  v_expires_at := v_now + (p_window_ms || ' milliseconds')::interval;
  delete from rate_limits where bucket_key = p_bucket and ip_address = v_ip and expires_at <= v_now;
  insert into rate_limits (bucket_key, ip_address, count, expires_at)
  values (p_bucket, v_ip, 1, v_expires_at)
  on conflict (bucket_key, ip_address)
  do update set count = rate_limits.count + 1, expires_at = v_expires_at
  where rate_limits.expires_at > v_now;
  select rl.count, rl.expires_at into v_count, v_expires_at
  from rate_limits where bucket_key = p_bucket and ip_address = v_ip;
  if v_count > p_max then
    v_result := jsonb_build_object('ok', false, 'retryAfterSec', extract(epoch from (v_expires_at - v_now))::integer);
  else
    v_result := jsonb_build_object('ok', true, 'retryAfterSec', 0);
  end if;
  return v_result;
end;
$$;

revoke execute on function public.rate_limit_check(text, integer, integer) from anon, authenticated;
