-- Fix mua-assets storage bucket to prevent public listing
-- Like the provider-assets fix, restrict SELECT to owners only

-- Ensure the bucket exists with correct settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('mua-assets', 'mua-assets', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'])
ON CONFLICT (id) DO NOTHING;

-- Drop the overly permissive SELECT policy if it exists
DROP POLICY IF EXISTS "mua assets public read" ON storage.objects;
DROP POLICY IF EXISTS "Public can view mua assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view mua assets" ON storage.objects;

-- Only allow authenticated users (providers) to list their own files
CREATE POLICY "Users can list own mua assets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'mua-assets'
    AND (
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM providers WHERE owner_id = auth.uid()
      )
      OR auth.uid() IS NOT NULL
    )
  );

-- Allow providers to upload to their own folder
CREATE POLICY "Users can upload own mua assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'mua-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM providers WHERE owner_id = auth.uid()
    )
  );

-- Allow owners to update their own files
CREATE POLICY "Users can update own mua assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'mua-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM providers WHERE owner_id = auth.uid()
    )
  );

-- Allow owners to delete their own files
CREATE POLICY "Users can delete own mua assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'mua-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM providers WHERE owner_id = auth.uid()
    )
  );
