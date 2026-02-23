-- ============================================
-- RESET DATABASE WAHFALAB
-- ============================================
-- Script ini akan menghapus semua data dan reset sequences
-- Gunakan dengan hati-hati!
-- ============================================

-- 1. Delete all data from all tables (in correct order due to foreign keys)
DELETE FROM "LabAnalysis";
DELETE FROM "SamplingAssignment";
DELETE FROM "JobOrder";
DELETE FROM "QuotationItem";
DELETE FROM "Quotation";
DELETE FROM "Payment";
DELETE FROM "ApprovalRequest";
DELETE FROM "TravelOrder";
DELETE FROM "OperationalCatalog";
DELETE FROM "OperationalHistory";
DELETE FROM "ServiceCategory";
DELETE FROM "Service";
DELETE FROM "Equipment";
DELETE FROM "CompanyProfile";
DELETE FROM "Profile";

-- 2. Reset all sequences (auto-increment IDs)
-- Note: Supabase/PostgreSQL uses UUID by default, so this may not be necessary
-- But included for completeness

-- 3. Reset auth users (optional - comment out if you want to keep auth users)
-- DELETE FROM auth.users;

-- 4. Verify tables are empty
SELECT 
    'Profile' as table_name, COUNT(*) as row_count FROM "Profile"
UNION ALL
SELECT 'CompanyProfile', COUNT(*) FROM "CompanyProfile"
UNION ALL
SELECT 'ServiceCategory', COUNT(*) FROM "ServiceCategory"
UNION ALL
SELECT 'Service', COUNT(*) FROM "Service"
UNION ALL
SELECT 'Equipment', COUNT(*) FROM "Equipment"
UNION ALL
SELECT 'Quotation', COUNT(*) FROM "Quotation"
UNION ALL
SELECT 'JobOrder', COUNT(*) FROM "JobOrder"
UNION ALL
SELECT 'SamplingAssignment', COUNT(*) FROM "SamplingAssignment"
UNION ALL
SELECT 'LabAnalysis', COUNT(*) FROM "LabAnalysis"
UNION ALL
SELECT 'Payment', COUNT(*) FROM "Payment";

-- ============================================
-- SEED ADMIN USER
-- ============================================

-- Insert admin profile
-- Note: You need to create the auth user first via Supabase Auth API or Dashboard
-- Then update the profile with the user ID

-- Option 1: If you have the auth user ID, update the profile
-- UPDATE "Profile" 
-- SET role = 'admin',
--     full_name = 'Administrator',
--     email = 'admin@wahfalab.com'
-- WHERE id = 'YOUR_AUTH_USER_ID';

-- Option 2: Insert new profile (auth user must exist first)
-- INSERT INTO "Profile" (id, email, full_name, role, created_at, updated_at)
-- VALUES ('auth-user-id-here', 'admin@wahfalab.com', 'Administrator', 'admin', NOW(), NOW());

-- ============================================
-- SEED COMPANY PROFILE
-- ============================================

INSERT INTO "CompanyProfile" (
  id,
  company_name,
  address,
  phone,
  whatsapp,
  email,
  website,
  tagline,
  npwp,
  logo_url,
  created_at,
  updated_at
) VALUES (
  'cp-' || gen_random_uuid(),
  'WahfaLab',
  'Jl. Laboratorium No. 123, Jakarta, Indonesia',
  '(021) 1234-5678',
  '+62 812-3456-7890',
  'info@wahfalab.com',
  'https://wahfalab.com',
  'Laboratorium Analisis & Kalibrasi',
  '00.000.000.0-000.000',
  '/logo-wahfalab.png',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check admin profile
SELECT id, email, full_name, role, created_at 
FROM "Profile" 
WHERE role = 'admin';

-- Check company profile
SELECT id, company_name, email, phone, tagline, created_at 
FROM "CompanyProfile" 
LIMIT 1;

-- Check all table counts
SELECT 
    'Profile' as table_name, COUNT(*) as row_count FROM "Profile"
UNION ALL
SELECT 'CompanyProfile', COUNT(*) FROM "CompanyProfile"
UNION ALL
SELECT 'ServiceCategory', COUNT(*) FROM "ServiceCategory"
UNION ALL
SELECT 'Service', COUNT(*) FROM "Service"
UNION ALL
SELECT 'Equipment', COUNT(*) FROM "Equipment"
UNION ALL
SELECT 'Quotation', COUNT(*) FROM "Quotation"
UNION ALL
SELECT 'JobOrder', COUNT(*) FROM "JobOrder";
