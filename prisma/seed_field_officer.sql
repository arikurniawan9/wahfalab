-- SQL Script untuk membuat user field_officer contoh
-- Jalankan di Supabase SQL Editor

-- 1. Buat user di Supabase Auth (gunakan SQL atau Dashboard)
-- Atau gunakan script ini untuk insert langsung ke profiles jika user sudah ada

-- Contoh: Update role user yang sudah ada menjadi field_officer
-- Ganti 'USER_UUID_HERE' dengan UUID user yang sebenarnya
/*
UPDATE profiles 
SET role = 'field_officer' 
WHERE email = 'petugas.lapangan@wahfalab.com';
*/

-- 2. Insert sample data untuk testing
-- Pastikan UUID sesuai dengan user yang ada di auth.users

-- Contoh assignment sampling untuk testing
/*
INSERT INTO sampling_assignments (
  id,
  job_order_id,
  field_officer_id,
  status,
  scheduled_date,
  location,
  notes,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  (SELECT id FROM job_orders LIMIT 1),
  'USER_UUID_HERE',
  'pending',
  NOW() + INTERVAL '1 day',
  'Jakarta Industrial Estate',
  'Ambil sampel air limbah dari titik A, B, C',
  NOW(),
  NOW()
);
*/

-- 3. Verifikasi schema
SELECT enumlabel 
FROM pg_enum 
WHERE enumoid IN (
  SELECT oid 
  FROM pg_type 
  WHERE typname = 'userrole'
);

-- 4. Cek sampling assignments
SELECT 
  sa.id,
  sa.status,
  sa.location,
  sa.scheduled_date,
  jo.tracking_code,
  p.full_name as field_officer_name
FROM sampling_assignments sa
JOIN job_orders jo ON sa.job_order_id = jo.id
JOIN profiles p ON sa.field_officer_id = p.id
ORDER BY sa.created_at DESC;
