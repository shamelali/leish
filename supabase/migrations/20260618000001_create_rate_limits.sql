CREATE TABLE IF NOT EXISTS rate_limits (
  bucket_key TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket_key, ip_address)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON rate_limits (expires_at);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY rate_limits_service_role ON rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE rate_limits IS 'Serverless-safe rate limiting via DB-backed counters per bucket_key + IP';
