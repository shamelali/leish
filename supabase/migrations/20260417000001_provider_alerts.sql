-- Migration: Provider Alerts Table
-- Purpose: Admin alert system for monitoring artists
-- Phase: 4

-- Create enums for alert system
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_type') THEN
    CREATE TYPE alert_type AS ENUM ('low_rating', 'external_review', 'complaint', 'manual_review');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_severity') THEN
    CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alert_status') THEN
    CREATE TYPE alert_status AS ENUM ('open', 'investigating', 'resolved');
  END IF;
END $$;

-- Create provider_alerts table
CREATE TABLE IF NOT EXISTS provider_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    alert_type alert_type NOT NULL,
    severity alert_severity NOT NULL DEFAULT 'medium',
    description TEXT NOT NULL,
    source_url TEXT,
    status alert_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id),
    resolution_notes TEXT,
    created_by UUID REFERENCES profiles(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_alerts_provider ON provider_alerts(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_alerts_status ON provider_alerts(status);
CREATE INDEX IF NOT EXISTS idx_provider_alerts_severity ON provider_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_provider_alerts_created ON provider_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_alerts_open_high ON provider_alerts(status, severity) 
  WHERE status = 'open' AND severity = 'high';

-- RLS Policies
ALTER TABLE provider_alerts ENABLE ROW LEVEL SECURITY;

-- Only admins can view alerts
CREATE POLICY "Admins can view all alerts"
  ON provider_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can insert alerts
CREATE POLICY "Admins can insert alerts"
  ON provider_alerts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can update alerts
CREATE POLICY "Admins can update alerts"
  ON provider_alerts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can delete alerts
CREATE POLICY "Admins can delete alerts"
  ON provider_alerts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Function to auto-set resolved_at timestamp
CREATE OR REPLACE FUNCTION set_resolved_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for resolved_at
DROP TRIGGER IF EXISTS trigger_set_resolved_timestamp ON provider_alerts;
CREATE TRIGGER trigger_set_resolved_timestamp
  BEFORE UPDATE ON provider_alerts
  FOR EACH ROW
  EXECUTE FUNCTION set_resolved_timestamp();

COMMENT ON TABLE provider_alerts IS 'Admin alerts for monitoring provider quality and compliance';
COMMENT ON COLUMN provider_alerts.severity IS 'Alert severity: low, medium, or high';
COMMENT ON COLUMN provider_alerts.status IS 'Alert status: open, investigating, or resolved';
