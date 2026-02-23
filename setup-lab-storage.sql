-- ============================================
-- SUPABASE STORAGE SETUP FOR ANALYST & REPORTING
-- ============================================
-- File: setup-lab-storage.sql
-- Description: Setup storage buckets untuk fitur Analyst & Reporting
-- ============================================

-- 1. Bucket untuk hasil analisis PDF (private)
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'analysis-results',
  'analysis-results',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Bucket untuk data mentah analisis (foto, dll) (private)
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'analysis-raw-data',
  'analysis-raw-data',
  false,
  20971520, -- 20MB
  ARRAY['image/*', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Bucket untuk laporan hasil uji/LHU (public untuk customer)
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lab-reports',
  'lab-reports',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS for all buckets
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policies for analysis-results bucket
-- ============================================

-- Allow analysts to upload files
CREATE POLICY "Analysts can upload analysis results"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'analysis-results'
  AND auth.jwt() ->> 'user_role' IN ('admin', 'operator', 'analyst')
);

-- Allow staff to view analysis results
CREATE POLICY "Staff can view analysis results"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'analysis-results'
  AND auth.jwt() ->> 'user_role' IN ('admin', 'operator', 'analyst', 'reporting')
);

-- Allow analysts to delete their own uploads
CREATE POLICY "Analysts can delete their analysis results"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'analysis-results'
  AND auth.jwt() ->> 'user_role' IN ('admin', 'operator', 'analyst')
);

-- ============================================
-- Policies for analysis-raw-data bucket
-- ============================================

-- Allow analysts to upload raw data
CREATE POLICY "Analysts can upload raw data"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'analysis-raw-data'
  AND auth.jwt() ->> 'user_role' IN ('admin', 'operator', 'analyst')
);

-- Allow staff to view raw data
CREATE POLICY "Staff can view raw data"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'analysis-raw-data'
  AND auth.jwt() ->> 'user_role' IN ('admin', 'operator', 'analyst', 'reporting')
);

-- Allow analysts to delete their own raw data
CREATE POLICY "Analysts can delete their raw data"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'analysis-raw-data'
  AND auth.jwt() ->> 'user_role' IN ('admin', 'operator', 'analyst')
);

-- ============================================
-- Policies for lab-reports bucket
-- ============================================

-- Allow reporting staff to upload LHU
CREATE POLICY "Reporting staff can upload lab reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lab-reports'
  AND auth.jwt() ->> 'user_role' IN ('admin', 'operator', 'reporting')
);

-- Allow everyone to view lab reports (public for customers)
CREATE POLICY "Everyone can view lab reports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lab-reports'
);

-- Allow reporting staff to delete lab reports
CREATE POLICY "Reporting staff can delete lab reports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lab-reports'
  AND auth.jwt() ->> 'user_role' IN ('admin', 'operator', 'reporting')
);

-- ============================================
-- Create function to get user role from JWT
-- ============================================

-- This function helps extract user role from Supabase JWT
-- Usage: SELECT get_user_role(auth.jwt());

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN auth.jwt() ->> 'user_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if buckets were created
-- SELECT * FROM storage.buckets WHERE id IN ('analysis-results', 'analysis-raw-data', 'lab-reports');

-- Check if policies were created
-- SELECT * FROM storage.policies WHERE bucket_id IN ('analysis-results', 'analysis-raw-data', 'lab-reports');

-- ============================================
-- NOTES
-- ============================================
-- 1. Run this SQL in Supabase Dashboard → SQL Editor
-- 2. Make sure storage extension is enabled
-- 3. Test upload/download with different user roles
-- 4. Adjust file size limits as needed
-- 5. For production, consider adding more granular policies
