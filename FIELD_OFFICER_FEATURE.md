# Field Officer Feature - WahfaLab

## Overview
Fitur **Field Officer** (Petugas Lapangan) memungkinkan petugas untuk mengelola tugas pengambilan sampel di lapangan, mengupdate status, dan mengupload dokumentasi foto.

## Role: `field_officer`

### Fitur Utama

#### 1. Dashboard Field Officer (`/field`)
- Ringkasan assignment sampling (pending, in_progress, completed)
- Daftar assignment terbaru
- Quick access ke detail sampling

#### 2. Assignment Sampling (`/field/assignments`)
- List semua assignment dengan filter status
- Pencarian berdasarkan tracking code, lokasi, atau customer
- Pagination untuk data yang banyak

#### 3. Detail Assignment (`/field/assignments/[id]`)
- Informasi lengkap tentang job order
- Lokasi sampling dan jadwal
- Dokumentasi foto yang sudah diupload
- Form untuk update status dan catatan
- Upload foto dokumentasi

### Flow Kerja

```
1. Admin/Operator membuat Job Order
   ↓
2. Admin/Operator membuat Sampling Assignment
   - Assign ke field_officer
   - Tentukan lokasi dan jadwal
   ↓
3. Field Officer login → Dashboard
   ↓
4. Field Officer melihat assignment
   ↓
5. Update status: pending → in_progress → completed
   - Upload foto dokumentasi
   - Tambahkan catatan
   ↓
6. Job Order otomatis update ke status 'analysis'
   ↓
7. Operator melanjutkan proses di laboratorium
```

### Status Sampling

| Status | Deskripsi |
|--------|-----------|
| `pending` | Assignment belum dimulai |
| `in_progress` | Sampling sedang berlangsung |
| `completed` | Sampling selesai, job order lanjut ke analysis |
| `cancelled` | Assignment dibatalkan |

### Database Schema

#### Enum: UserRole
```prisma
enum UserRole {
  admin
  operator
  client
  field_officer  // ← Baru
}
```

#### Enum: SamplingStatus
```prisma
enum SamplingStatus {
  pending
  in_progress
  completed
  cancelled
}
```

#### Model: SamplingAssignment
```prisma
model SamplingAssignment {
  id               String          @id @default(uuid())
  job_order_id     String          @unique
  job_order        JobOrder        @relation(...)
  field_officer_id String
  field_officer    Profile         @relation(...)
  status           SamplingStatus  @default(pending)
  scheduled_date   DateTime
  actual_date      DateTime?
  location         String
  notes            String?
  photos           Json?           // Array of photo URLs
  created_at       DateTime        @default(now())
  updated_at       DateTime        @default(now())
}
```

## Server Actions

### `getMySamplingAssignments(page, limit, status?)`
Mengambil assignment untuk field officer yang sedang login.

### `getAssignmentById(assignmentId)`
Mengambil detail assignment berdasarkan ID.

### `updateSamplingStatus(assignmentId, status, notes?)`
Update status sampling dan otomatis update JobOrder terkait.

### `updateSamplingPhotos(assignmentId, photoUrls)`
Tambah foto dokumentasi ke assignment.

### `createSamplingAssignment(data)`
Buat assignment baru (untuk admin/operator).

## Storage Bucket

Foto sampling disimpan di Supabase Storage bucket: **`sampling-photos`**

Pastikan bucket sudah dibuat dengan setting:
- Public: true (atau false jika ingin private)
- File size limit: sesuai kebutuhan (rekomendasi: 5MB)
- Allowed MIME types: `image/*`

## Cara Membuat User Field Officer

### Via Register Page
1. Buka `/register`
2. Pilih role "Petugas Lapangan"
3. Isi data dan submit

### Via Database (Admin)
```sql
-- Update role user yang sudah ada
UPDATE profiles 
SET role = 'field_officer' 
WHERE email = 'email@petugas.com';
```

### Via Supabase Dashboard
1. Buat user di Authentication → Users
2. Update role di table `profiles`

## Testing

### 1. Buat User Field Officer
```bash
# Via register page atau SQL
```

### 2. Login sebagai Field Officer
- Email: `petugas@wahfalab.com`
- Password: `***`
- Redirect ke: `/field`

### 3. Test Flow
1. Lihat assignment di dashboard
2. Buka detail assignment
3. Upload foto dokumentasi
4. Update status: pending → in_progress
5. Tambahkan catatan
6. Update status: in_progress → completed
7. Verifikasi JobOrder berubah ke 'analysis'

## Integrasi dengan Role Lain

### Admin
- Dapat melihat semua assignment
- Dapat membuat assignment baru
- Dapat assign field officer

### Operator
- Dapat melihat status sampling
- Dapat melihat foto dokumentasi
- Melanjutkan proses setelah sampling completed

### Client
- Dapat melihat progress sampling
- Dapat melihat foto dokumentasi (read-only)

## Security

- Middleware memproteksi route `/field`
- Field officer hanya bisa akses assignment mereka sendiri
- Verifikasi ownership di setiap server action

## File Structure

```
src/
├── app/
│   └── (field)/
│       ├── layout.tsx
│       └── field/
│           ├── page.tsx                    # Dashboard
│           └── assignments/
│               ├── page.tsx                # List assignments
│               └── [id]/
│                   └── page.tsx            # Detail assignment
├── lib/
│   └── actions/
│       └── sampling.ts                     # Server actions
└── components/
    └── layout/
        ├── Sidebar.tsx                     # Updated
        └── BottomNav.tsx                   # Updated
```

## Next Steps / TODO

- [x] Halaman admin untuk manage role field_officer
- [x] Halaman admin untuk membuat assignment sampling
- [ ] Notifikasi email ke client saat sampling completed
- [ ] GPS coordinate tracking saat sampling
- [ ] QR code scanning untuk sample tracking
- [ ] Offline mode untuk area tanpa sinyal
- [ ] Export laporan sampling ke PDF
- [ ] Calendar view untuk jadwal sampling
