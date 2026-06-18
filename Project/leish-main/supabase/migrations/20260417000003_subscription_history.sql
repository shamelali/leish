-- Migration: Subscription History Table
-- Purpose: Track subscription changes for billing and audit
-- Phase: 3

-- Create subscription_history table
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('upgrade', 'downgrade', 'renewal', 'cancel')),
    previous_tier VARCHAR(20),
    stripe_subscription_id TEXT,
    amount_myr DECIMAL(10, 2),
    billing_period_start TIMESTAMPTZ,
    billing_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_history_provider ON subscription_history(provider_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_date ON subscription_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_history_action ON subscription_history(action);

-- RLS Policies
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Artists can view their own subscription history
CREATE POLICY "Artists can view their own subscription history"
  ON subscription_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM providers p
      WHERE p.id = subscription_history.provider_id
      AND p.owner_id = auth.uid()
    )
  );

-- System can insert subscription history
CREATE POLICY "System can insert subscription history"
  ON subscription_history
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all subscription history
CREATE POLICY "Admins can view all subscription history"
  ON subscription_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

COMMENT ON TABLE subscription_history IS 'Audit trail of subscription tier changes';
COMMENT ON COLUMN subscription_history.action IS 'Type of change: upgrade, downgrade, renewal, or cancel';
COMMENT ON COLUMN subscription_history.amount_myr IS 'Amount paid in MYR, if applicable';

-- Trigger to log tier changes on providers table
CREATE OR REPLACE FUNCTION log_tier_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.tier IS DISTINCT FROM NEW.tier THEN
    INSERT INTO subscription_history (
      provider_id,
      tier,
      action,
      previous_tier,
      created_by
    ) VALUES (
      NEW.id,
      NEW.tier,
      CASE 
        WHEN NEW.tier = 'pro' AND OLD.tier = 'free' THEN 'upgrade'
        WHEN NEW.tier = 'free' AND OLD.tier = 'pro' THEN 'downgrade'
        ELSE 'renewal'
      END,
      OLD.tier,
      NULL -- System initiated
    );
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for tier change logging
DROP TRIGGER IF EXISTS trigger_log_tier_change ON providers;
CREATE TRIGGER trigger_log_tier_change
  AFTER UPDATE OF tier ON providers
  FOR EACH ROW
  EXECUTE FUNCTION log_tier_change();
