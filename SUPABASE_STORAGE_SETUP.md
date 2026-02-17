# Setup Supabase Storage Buckets

## Panduan Membuat Storage Buckets di Supabase

### Metode 1: Via Supabase Dashboard (Manual)

#### 1. Buat Bucket untuk Company Assets (Logo Perusahaan)

1. Login ke [Supabase Dashboard](https://supabase.com)
2. Pilih project WahfaLab Anda
3. Masuk ke **Storage** di sidebar kiri
4. Klik **New Bucket**
5. Isi data:
   - **Name:** `company-assets`
   - **Public:** ✅ Yes (centang)
   - **File size limit:** `5242880` (5MB)
6. Klik **Create bucket**

#### 2. Buat Bucket untuk Travel Order PDFs

1. Klik **New Bucket**
2. Isi data:
   - **Name:** `travel-orders`
   - **Public:** ✅ Yes (centang)
   - **File size limit:** `10485760` (10MB)
3. Klik **Create bucket**

#### 3. Buat Bucket untuk Sampling Photos

1. Klik **New Bucket**
2. Isi data:
   - **Name:** `sampling-photos`
   - **Public:** ✅ Yes (centang)
   - **File size limit:** `10485760` (10MB)
3. Klik **Create bucket**

#### 4. Setup Policies (Security)

Untuk setiap bucket, tambahkan policies berikut:

**Company Assets Bucket:**

1. Klik bucket `company-assets`
2. Masuk ke tab **Policies**
3. Klik **New Policy**
4. Pilih **Create a policy from scratch**
5. Policy 1 - Public Read:
   ```
   Policy name: Allow public read access
   - Allowed operation: SELECT
   - Target roles: postgres, anon, authenticated
   - Policy definition: true
   ```
6. Policy 2 - Authenticated Upload:
   ```
   Policy name: Allow authenticated users to upload
   - Allowed operation: INSERT
   - Target roles: authenticated
   - Policy definition: bucket_id = 'company-assets'
   ```
7. Policy 3 - Authenticated Delete:
   ```
   Policy name: Allow authenticated users to delete
   - Allowed operation: DELETE
   - Target roles: authenticated
   - Policy definition: bucket_id = 'company-assets'
   ```

**Travel Orders Bucket:**

1. Ulangi langkah di atas untuk bucket `travel-orders`
2. Ganti `bucket_id = 'company-assets'` menjadi `bucket_id = 'travel-orders'`

**Sampling Photos Bucket:**

1. Ulangi langkah di atas untuk bucket `sampling-photos`
2. Ganti `bucket_id = 'company-assets'` menjadi `bucket_id = 'sampling-photos'`

---

### Metode 2: Via SQL Editor (Otomatis)

1. Login ke [Supabase Dashboard](https://supabase.com)
2. Pilih project WahfaLab Anda
3. Masuk ke **SQL Editor** di sidebar kiri
4. Klik **New Query**
5. Copy-paste SQL dari file `supabase-buckets.sql`
6. Klik **Run** atau tekan `Ctrl+Enter`

SQL akan membuat:
- ✅ 3 buckets (company-assets, travel-orders, sampling-photos)
- ✅ Policies untuk read/write access
- ✅ MIME type restrictions

---

### Verifikasi Buckets

Setelah membuat buckets, verifikasi di:

1. **Storage** → Lihat daftar buckets
2. Pastikan ada 3 buckets:
   - `company-assets`
   - `travel-orders`
   - `sampling-photos`

3. Cek **Policies** untuk setiap bucket
4. Test upload file di masing-masing bucket

---

### Allowed MIME Types

**company-assets:**
- `image/png`
- `image/jpeg`
- `image/jpg`
- `image/svg+xml`
- `image/webp`

**travel-orders:**
- `application/pdf`

**sampling-photos:**
- `image/png`
- `image/jpeg`
- `image/jpg`
- `image/webp`

---

### Troubleshooting

#### Error: "Bucket not found"

**Penyebab:** Bucket belum dibuat atau nama salah.

**Solusi:**
1. Pastikan bucket sudah dibuat di Supabase
2. Cek nama bucket (case-sensitive)
3. Jalankan SQL script `supabase-buckets.sql`

#### Error: "Permission denied"

**Penyebab:** Policies belum diset dengan benar.

**Solusi:**
1. Cek policies di bucket
2. Pastikan ada policy untuk SELECT (public read)
3. Pastikan ada policy untuk INSERT (authenticated write)

#### Error: "File too large"

**Penyebab:** File melebihi size limit bucket.

**Solusi:**
1. Resize/compress file sebelum upload
2. Atau update `file_size_limit` di bucket settings

---

### File Size Limits

| Bucket | Limit |
|--------|-------|
| company-assets | 5 MB |
| travel-orders | 10 MB |
| sampling-photos | 10 MB |

---

### Next Steps

Setelah buckets dibuat:

1. ✅ Test upload logo perusahaan
2. ✅ Test upload travel order PDF
3. ✅ Test upload sampling photos
4. ✅ Verify public URLs accessible

---

### Quick SQL Commands

Cek buckets yang ada:
```sql
SELECT * FROM storage.buckets;
```

Cek policies:
```sql
SELECT * FROM storage.policies;
```

Hapus bucket (hati-hati!):
```sql
DELETE FROM storage.buckets WHERE id = 'company-assets';
```
