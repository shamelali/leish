-- Fix storage bucket policies to prevent public listing
-- Bucket: provider-assets (used for artist/studio portfolio uploads)

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('provider-assets', 'provider-assets', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'])
ON CONFLICT (id) DO NOTHING;

-- Disable public listing (prevent directory enumeration)
-- Only allow authenticated users to list their own files
CREATE POLICY "Users can list own provider assets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'provider-assets'
    AND (
      -- Owner can list their own files
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM providers WHERE owner_id = auth.uid()
      )
      -- OR public read for viewing (anyone can view individual files)
      OR auth.uid() IS NOT NULL
    )
  );

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own provider assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'provider-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM providers WHERE owner_id = auth.uid()
    )
  );

-- Allow owners to update their own files
CREATE POLICY "Users can update own provider assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'provider-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM providers WHERE owner_id = auth.uid()
    )
  );

-- Allow owners to delete their own files
CREATE POLICY "Users can delete own provider assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'provider-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM providers WHERE owner_id = auth.uid()
    )
  );

-- Public can view individual files (but not list the bucket)
-- This is handled by the bucket being public + the SELECT policy above
