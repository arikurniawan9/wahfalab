-- ============================================
-- SAMPLING PHOTOS BUCKET SETUP
-- ============================================
-- Jalankan script ini di Supabase SQL Editor
-- untuk membuat bucket sampling-photos

-- 1. Buat bucket sampling-photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sampling-photos',
  'sampling-photos',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: Allow public read access
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'sampling-photos');

-- 3. Policy: Allow authenticated users to upload
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sampling-photos'
  AND auth.role() = 'authenticated'
);

-- 4. Policy: Allow authenticated users to delete
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'sampling-photos'
  AND auth.role() = 'authenticated'
);

-- ============================================
-- Verifikasi bucket sudah dibuat
-- ============================================
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'sampling-photos';
