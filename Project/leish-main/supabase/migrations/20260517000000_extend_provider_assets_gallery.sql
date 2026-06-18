-- Migration: Extend provider_assets for gallery content types
-- Purpose: Add content_type column to support beforeAfter and video portfolio items
--          Add public RLS policy so gallery pages can fetch assets without auth

-- Add content_type column for portfolio item types
ALTER TABLE provider_assets
  ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'image';

-- Add index for content_type lookups
CREATE INDEX IF NOT EXISTS idx_provider_assets_content_type ON provider_assets(content_type);

-- Add public read policy for portfolio/work_sample assets
CREATE POLICY "Public can view portfolio assets"
  ON provider_assets
  FOR SELECT
  USING (
    asset_type IN ('portfolio', 'work_sample', 'profile_photo')
  );

COMMENT ON COLUMN provider_assets.content_type IS 'Content type for display: image, beforeAfter, or video';
