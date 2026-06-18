CREATE OR REPLACE FUNCTION rate_limit_check(
  p_bucket TEXT,
  p_max INTEGER,
  p_window_ms INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_expires_at TIMESTAMPTZ;
  v_ip TEXT;
  v_count INTEGER;
  v_result JSONB;
BEGIN
  v_ip := substring(p_bucket from '[^:]+$');
  v_expires_at := v_now + (p_window_ms || ' milliseconds')::INTERVAL;

  DELETE FROM rate_limits
  WHERE bucket_key = p_bucket AND ip_address = v_ip AND expires_at <= v_now;

  INSERT INTO rate_limits (bucket_key, ip_address, count, expires_at)
  VALUES (p_bucket, v_ip, 1, v_expires_at)
  ON CONFLICT (bucket_key, ip_address)
  DO UPDATE SET count = rate_limits.count + 1,
               expires_at = v_expires_at
  WHERE rate_limits.expires_at > v_now;

  SELECT rl.count, rl.expires_at INTO v_count, v_expires_at
  FROM rate_limits
  WHERE bucket_key = p_bucket AND ip_address = v_ip;

  IF v_count > p_max THEN
    v_result := jsonb_build_object(
      'ok', false,
      'retryAfterSec', EXTRACT(EPOCH FROM (v_expires_at - v_now))::INTEGER
    );
  ELSE
    v_result := jsonb_build_object(
      'ok', true,
      'retryAfterSec', 0
    );
  END IF;

  RETURN v_result;
END;
$$;
