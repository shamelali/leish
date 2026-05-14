-- Migration: Provider Assets Table
-- Purpose: Store photos and portfolio images for providers
-- Phase: 2

-- Create enum for asset types
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_type') THEN
    CREATE TYPE asset_type AS ENUM ('profile_photo', 'portfolio', 'work_sample');
  END IF;
END $$;

-- Create provider_assets table
CREATE TABLE IF NOT EXISTS provider_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    asset_type asset_type NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_assets_provider ON provider_assets(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_assets_type ON provider_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_provider_assets_primary ON provider_assets(provider_id, is_primary) WHERE is_primary = true;

-- RLS Policies
ALTER TABLE provider_assets ENABLE ROW LEVEL SECURITY;

-- Artists can view their own assets
CREATE POLICY "Artists can view their own assets"
  ON provider_assets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM providers p
      WHERE p.id = provider_assets.provider_id
      AND p.owner_id = auth.uid()
    )
  );

-- Artists can insert their own assets
CREATE POLICY "Artists can insert their own assets"
  ON provider_assets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM providers p
      WHERE p.id = provider_assets.provider_id
      AND p.owner_id = auth.uid()
    )
  );

-- Artists can update their own assets
CREATE POLICY "Artists can update their own assets"
  ON provider_assets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM providers p
      WHERE p.id = provider_assets.provider_id
      AND p.owner_id = auth.uid()
    )
  );

-- Artists can delete their own assets
CREATE POLICY "Artists can delete their own assets"
  ON provider_assets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM providers p
      WHERE p.id = provider_assets.provider_id
      AND p.owner_id = auth.uid()
    )
  );

-- Admins can view all assets
CREATE POLICY "Admins can view all assets"
  ON provider_assets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_provider_assets_updated_at ON provider_assets;
CREATE TRIGGER update_provider_assets_updated_at
  BEFORE UPDATE ON provider_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE provider_assets IS 'Stores photos and portfolio images for providers';
COMMENT ON COLUMN provider_assets.asset_type IS 'Type of asset: profile_photo, portfolio, or work_sample';
COMMENT ON COLUMN provider_assets.is_primary IS 'Whether this is the primary/profile photo';
