-- SQL Script untuk membuat Storage Buckets di Supabase
-- Jalankan di Supabase SQL Editor

-- 1. Buat bucket untuk company assets (logo, dll)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Buat bucket untuk travel order PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'travel-orders',
  'travel-orders',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Buat bucket untuk sampling photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sampling-photos',
  'sampling-photos',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 4. Set policies untuk company-assets (public read, authenticated write)
-- Allow public read access
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'company-assets' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated users to update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'company-assets' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'company-assets' 
  AND auth.role() = 'authenticated'
);

-- 5. Set policies untuk travel-orders
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'travel-orders');

CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'travel-orders' 
  AND auth.role() = 'authenticated'
);

-- 6. Set policies untuk sampling-photos
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'sampling-photos');

CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sampling-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'sampling-photos' 
  AND auth.role() = 'authenticated'
);
