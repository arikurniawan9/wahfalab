-- ============================================
-- SETUP LENGKAP BUCKET SAMPLING-PHOTOS
-- ============================================
-- Jalankan SEMUA script ini di Supabase SQL Editor

-- 1. Buat bucket jika belum ada
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sampling-photos',
  'sampling-photos',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Hapus semua policy lama (jika ada)
-- ============================================
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON storage.objects;

-- ============================================
-- BUAT POLICY BARU
-- ============================================

-- Policy 1: Public can READ (view photos)
CREATE POLICY "Allow public read access on sampling-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'sampling-photos');

-- Policy 2: Authenticated users can INSERT (upload photos)
CREATE POLICY "Allow authenticated users to upload sampling-photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sampling-photos'
  AND auth.role() = 'authenticated'
);

-- Policy 3: Authenticated users can UPDATE (rename/move photos)
CREATE POLICY "Allow authenticated users to update sampling-photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'sampling-photos'
  AND auth.role() = 'authenticated'
);

-- Policy 4: Authenticated users can DELETE photos
CREATE POLICY "Allow authenticated users to delete sampling-photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'sampling-photos'
  AND auth.role() = 'authenticated'
);

-- ============================================
-- VERIFIKASI
-- ============================================

-- Cek bucket sudah dibuat
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'sampling-photos';

-- Cek policy sudah dibuat
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;
