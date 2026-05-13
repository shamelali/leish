-- Migration: Provider Tier Enhancements
-- Purpose: Add subscription and moderation fields to providers
-- Phase: 3

-- Add tier and subscription fields
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS tier_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tier_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add constraint for tier values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'providers_tier_check'
  ) THEN
    ALTER TABLE providers
    ADD CONSTRAINT providers_tier_check
    CHECK (tier IN ('free', 'pro'));
  END IF;
END $$;

-- Add moderation and compliance fields
ALTER TABLE providers
ADD COLUMN IF NOT EXISTS communication_violations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES profiles(id);

-- Add client limit for free tier
ALTER TABLE providers
ADD COLUMN IF NOT EXISTS client_limit INTEGER DEFAULT 10;

-- Add tier constraint check
COMMENT ON COLUMN providers.tier IS 'Subscription tier: free or pro';
COMMENT ON COLUMN providers.is_suspended IS 'Whether the provider is suspended from receiving bookings';
COMMENT ON COLUMN providers.client_limit IS 'Maximum number of unique clients for free tier';

-- Create indexes for tier queries
CREATE INDEX IF NOT EXISTS idx_providers_tier ON providers(tier);
CREATE INDEX IF NOT EXISTS idx_providers_suspended ON providers(is_suspended) WHERE is_suspended = true;
CREATE INDEX IF NOT EXISTS idx_providers_tier_active ON providers(tier, is_active) WHERE is_active = true;

-- Function to count active alerts for a provider
CREATE OR REPLACE FUNCTION get_provider_alert_count(provider_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  alert_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO alert_count
  FROM provider_alerts
  WHERE provider_id = provider_uuid
  AND status = 'open';
  
  RETURN alert_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get provider's current unique client count
CREATE OR REPLACE FUNCTION get_provider_client_count(provider_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  client_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT customer_id) INTO client_count
  FROM bookings
  WHERE provider_id = provider_uuid
  AND status NOT IN ('canceled', 'pending');
  
  RETURN client_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_provider_alert_count IS 'Returns the count of open alerts for a provider';
COMMENT ON FUNCTION get_provider_client_count IS 'Returns the count of unique clients for a provider';
