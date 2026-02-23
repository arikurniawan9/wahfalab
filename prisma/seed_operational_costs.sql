-- Seed Data untuk Biaya Engineer (Perdiem) dan Transport
-- Jalankan di Supabase SQL Editor

-- =====================================================
-- BIAYA ENGINEER (PERDIEM)
-- =====================================================

-- Insert sample engineer costs (perdiem) data
INSERT INTO operational_catalog (
  id,
  category,
  perdiem_type,
  location,
  name,
  description,
  price,
  unit,
  created_at,
  updated_at
) VALUES
  -- Engineer costs - Jakarta area
  (
    gen_random_uuid(),
    'perdiem',
    'local',
    'Jakarta',
    'Biaya Perdiem Engineer - Jakarta',
    'Biaya konsumsi engineer untuk sampling di area Jakarta dan sekitarnya',
    150000,
    'hari',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'perdiem',
    'local',
    'Tangerang',
    'Biaya Perdiem Engineer - Tangerang',
    'Biaya konsumsi engineer untuk sampling di area Tangerang',
    150000,
    'hari',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'perdiem',
    'local',
    'Bekasi',
    'Biaya Perdiem Engineer - Bekasi',
    'Biaya konsumsi engineer untuk sampling di area Bekasi',
    150000,
    'hari',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'perdiem',
    'local',
    'Depok',
    'Biaya Perdiem Engineer - Depok',
    'Biaya konsumsi engineer untuk sampling di area Depok',
    150000,
    'hari',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'perdiem',
    'local',
    'Bogor',
    'Biaya Perdiem Engineer - Bogor',
    'Biaya konsumsi engineer untuk sampling di area Bogor',
    175000,
    'hari',
    NOW(),
    NOW()
  ),
  
  -- Engineer costs - Out of town (luar kota)
  (
    gen_random_uuid(),
    'perdiem',
    'out_of_town',
    'Jawa Barat',
    'Biaya Perdiem Engineer - Jawa Barat',
    'Biaya konsumsi engineer untuk sampling di area Jawa Barat (Bandung, Cirebon, dll)',
    250000,
    'hari',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'perdiem',
    'out_of_town',
    'Jawa Tengah',
    'Biaya Perdiem Engineer - Jawa Tengah',
    'Biaya konsumsi engineer untuk sampling di area Jawa Tengah (Semarang, Solo, dll)',
    275000,
    'hari',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'perdiem',
    'out_of_town',
    'Jawa Timur',
    'Biaya Perdiem Engineer - Jawa Timur',
    'Biaya konsumsi engineer untuk sampling di area Jawa Timur (Surabaya, Malang, dll)',
    275000,
    'hari',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'perdiem',
    'out_of_town',
    'Banten',
    'Biaya Perdiem Engineer - Banten',
    'Biaya konsumsi engineer untuk sampling di area Banten (Serang, Cilegon, dll)',
    200000,
    'hari',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'perdiem',
    'out_of_town',
    'Lampung',
    'Biaya Perdiem Engineer - Lampung',
    'Biaya konsumsi engineer untuk sampling di area Lampung',
    300000,
    'hari',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'perdiem',
    'out_of_town',
    'Bali',
    'Biaya Perdiem Engineer - Bali',
    'Biaya konsumsi engineer untuk sampling di area Bali',
    350000,
    'hari',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'perdiem',
    'out_of_town',
    'Sumatera',
    'Biaya Perdiem Engineer - Sumatera',
    'Biaya konsumsi engineer untuk sampling di area Sumatera',
    400000,
    'hari',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'perdiem',
    'out_of_town',
    'Kalimantan',
    'Biaya Perdiem Engineer - Kalimantan',
    'Biaya konsumsi engineer untuk sampling di area Kalimantan',
    400000,
    'hari',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'perdiem',
    'out_of_town',
    'Sulawesi',
    'Biaya Perdiem Engineer - Sulawesi',
    'Biaya konsumsi engineer untuk sampling di area Sulawesi',
    400000,
    'hari',
    NOW(),
    NOW()
  );

-- =====================================================
-- BIAYA TRANSPORT
-- =====================================================

-- Insert sample transport costs data
INSERT INTO operational_catalog (
  id,
  category,
  perdiem_type,
  location,
  distance_category,
  name,
  description,
  price,
  unit,
  created_at,
  updated_at
) VALUES
  -- Transport costs - Local (Jakarta area)
  (
    gen_random_uuid(),
    'transport',
    NULL,
    'Jakarta',
    'local',
    'Transport Sampling - Jakarta Lokal',
    'Biaya transportasi untuk sampling di area Jakarta (maks. 50 km)',
    200000,
    'trip',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'transport',
    NULL,
    'Jabodetabek',
    'local',
    'Transport Sampling - Jabodetabek',
    'Biaya transportasi untuk sampling di area Jabodetabek (maks. 100 km)',
    350000,
    'trip',
    NOW(),
    NOW()
  ),
  
  -- Transport costs - Medium distance (100-250 km)
  (
    gen_random_uuid(),
    'transport',
    NULL,
    'Jawa Barat',
    'medium',
    'Transport Sampling - Jawa Barat',
    'Biaya transportasi untuk sampling di area Jawa Barat (100-250 km)',
    750000,
    'trip',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'transport',
    NULL,
    'Jawa Tengah',
    'medium',
    'Transport Sampling - Jawa Tengah',
    'Biaya transportasi untuk sampling di area Jawa Tengah (100-250 km)',
    1000000,
    'trip',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'transport',
    NULL,
    'Jawa Timur',
    'medium',
    'Transport Sampling - Jawa Timur',
    'Biaya transportasi untuk sampling di area Jawa Timur (100-250 km)',
    1200000,
    'trip',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'transport',
    NULL,
    'Banten',
    'medium',
    'Transport Sampling - Banten',
    'Biaya transportasi untuk sampling di area Banten (100-250 km)',
    600000,
    'trip',
    NOW(),
    NOW()
  ),
  
  -- Transport costs - Long distance (>250 km)
  (
    gen_random_uuid(),
    'transport',
    NULL,
    'Lampung',
    'long',
    'Transport Sampling - Lampung',
    'Biaya transportasi untuk sampling di area Lampung (>250 km)',
    2000000,
    'trip',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'transport',
    NULL,
    'Bali',
    'long',
    'Transport Sampling - Bali',
    'Biaya transportasi untuk sampling di area Bali (>250 km)',
    2500000,
    'trip',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'transport',
    NULL,
    'Sumatera',
    'long',
    'Transport Sampling - Sumatera',
    'Biaya transportasi untuk sampling di area Sumatera (>250 km)',
    3500000,
    'trip',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'transport',
    NULL,
    'Kalimantan',
    'long',
    'Transport Sampling - Kalimantan',
    'Biaya transportasi untuk sampling di area Kalimantan (>250 km)',
    4000000,
    'trip',
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'transport',
    NULL,
    'Sulawesi',
    'long',
    'Transport Sampling - Sulawesi',
    'Biaya transportasi untuk sampling di area Sulawesi (>250 km)',
    4500000,
    'trip',
    NOW(),
    NOW()
  ),
  
  -- Transport costs - Accommodation (for long distance)
  (
    gen_random_uuid(),
    'transport',
    NULL,
    'General',
    'accommodation',
    'Akomodasi Engineer',
    'Biaya akomodasi/hotel untuk engineer saat sampling luar kota',
    500000,
    'malam',
    NOW(),
    NOW()
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify inserted data
SELECT 
  category,
  perdiem_type,
  location,
  distance_category,
  name,
  price,
  unit
FROM operational_catalog
ORDER BY category, location;

-- Count by category
SELECT 
  category,
  COUNT(*) as total_items
FROM operational_catalog
GROUP BY category;
