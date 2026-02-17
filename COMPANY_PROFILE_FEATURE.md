# Company Profile Management - WahfaLab

## Overview
Fitur **Company Profile Management** memungkinkan admin untuk mengelola informasi dan branding perusahaan WahfaLab secara terpusat. Data perusahaan akan digunakan di seluruh aplikasi termasuk dokumen PDF seperti Surat Tugas Perjalanan.

## Database Schema

### Model: CompanyProfile
```prisma
model CompanyProfile {
  id              String   @id @default(uuid())
  company_name    String   @default("WahfaLab")
  address         String?
  phone           String?
  whatsapp        String?
  email           String?
  website         String?
  logo_url        String?
  tagline         String?
  npwp            String?
  created_at      DateTime @default(now())
  updated_at      DateTime @default(now())

  @@map("company_profiles")
}
```

**Catatan:** Hanya ada 1 record company profile dalam database (singleton).

## Fitur Utama

### 1. **Upload Logo Perusahaan**
- Support format: PNG, JPG, SVG
- Max size: 5MB
- Auto-resize & optimize
- Storage: Supabase Storage bucket `company-assets`
- Preview langsung setelah upload
- Delete logo dengan konfirmasi

### 2. **Informasi Perusahaan**
- **Nama Perusahaan** - Nama resmi perusahaan
- **Tagline** - Slogan/deskripsi singkat
- **Alamat** - Alamat lengkap perusahaan
- **Telepon** - Nomor telepon kantor
- **WhatsApp** - Nomor WhatsApp kontak
- **Email** - Email resmi perusahaan
- **Website** - URL website perusahaan
- **NPWP** - Nomor Pokok Wajib Pajak

### 3. **Preview Real-time**
- Preview tampilan logo dan informasi
- Contoh tampilan di dokumen
- Auto-update saat edit

### 4. **Integrasi PDF**
- Logo & info perusahaan otomatis di PDF
- Surat Tugas Perjalanan
- Dokumen resmi lainnya
- Support company profile dinamis

## Halaman Settings

### `/admin/settings/company`

**Layout:**
```
┌─────────────────────────────────────────────┐
│  Pengaturan Perusahaan                      │
│  Kelola informasi dan branding perusahaan   │
├──────────────────┬──────────────────────────┤
│  Logo Upload     │  Informasi Perusahaan    │
│                  │                          │
│  [Preview Logo]  │  Nama Perusahaan: ___    │
│                  │  Tagline: _________      │
│  [Upload Logo]   │  Alamat: _________       │
│  [Hapus Logo]    │  Telepon: ________       │
│                  │  WhatsApp: ______        │
│                  │  Email: __________       │
│                  │  Website: ________       │
│                  │  NPWP: ___________       │
│                  │                          │
│                  │  [Simpan] [Reset]        │
└──────────────────┴──────────────────────────┘
│  Preview                                                  │
│  ┌──────────────────────────────────────────────┐        │
│  │ [Logo]  Nama Perusahaan                      │        │
│  │         Tagline                              │        │
│  │ 📍 Alamat                                    │        │
│  │ 📞 Telepon | ✉ Email | 🌐 Website           │        │
│  └──────────────────────────────────────────────┘        │
└───────────────────────────────────────────────────────────┘
```

## Server Actions

### `getCompanyProfile()`
Ambil company profile. Jika belum ada, buat default.

```typescript
const profile = await getCompanyProfile()
// Returns: CompanyProfile | null
```

### `updateCompanyProfile(data)`
Update company profile (create jika belum ada).

```typescript
await updateCompanyProfile({
  company_name: "WahfaLab",
  address: "Jl. Sudirman No. 123",
  phone: "(021) 1234-5678",
  whatsapp: "+62 812-3456-7890",
  email: "info@wahfalab.com",
  website: "https://wahfalab.com",
  tagline: "Laboratorium Analisis & Kalibrasi",
  npwp: "00.000.000.0-000.000"
})
```

### `uploadCompanyLogo(file)`
Upload logo perusahaan ke storage.

```typescript
const result = await uploadCompanyLogo(file)
// Returns: { success: true, url: "https://..." }
```

### `deleteCompanyLogo()`
Hapus logo dari storage dan database.

```typescript
await deleteCompanyLogo()
```

## Storage Bucket

### `company-assets`
Bucket untuk menyimpan logo dan aset perusahaan.

**Settings:**
- Public: true
- File size limit: 5MB
- Allowed MIME types: `image/*`
- Allowed extensions: `.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`

## Integrasi dengan PDF

### Travel Order PDF
```typescript
import { getCompanyProfile } from '@/lib/actions/company'
import { TravelOrderPDF } from '@/components/pdf/TravelOrderPDF'

const company = await getCompanyProfile()

<pdf>
  <TravelOrderPDF 
    data={travelOrderData}
    company={company}
  />
</pdf>
```

**Output PDF Header:**
```
┌──────────────────────────────────────────┐
│  🧪 WahfaLab              No: ST/...    │
│  Laboratorium Analisis & Kalibrasi       │
│  Jl. Sudirman No. 123, Jakarta           │
│  Telp: (021) 1234-5678                   │
│  Email: info@wahfalab.com                │
└──────────────────────────────────────────┘
```

## Flow Kerja

### Setup Pertama Kali
```
1. Admin login → /admin/settings/company
2. Upload logo perusahaan
3. Isi informasi lengkap:
   - Nama & tagline
   - Alamat
   - Kontak (phone, email, whatsapp)
   - Website
   - NPWP (opsional)
4. Preview tampilan
5. Simpan
```

### Update Logo
```
1. Klik "Upload Logo"
2. Pilih file gambar
3. Preview otomatis
4. Logo langsung tersimpan
5. Update semua dokumen PDF
```

### Update Informasi
```
1. Edit field yang ingin diubah
2. Klik "Simpan Perubahan"
3. Data tersimpan
4. Preview otomatis update
```

## Validasi

### Upload Logo
```typescript
// File type
if (!file.type.startsWith('image/')) {
  toast.error("File harus berupa gambar")
}

// File size (max 5MB)
if (file.size > 5 * 1024 * 1024) {
  toast.error("Ukuran file maksimal 5MB")
}
```

### Form Fields
- **Required:** Company Name
- **Optional:** Address, Phone, WhatsApp, Email, Website, Tagline, NPWP
- **Format validation:** Email, Website URL

## Default Values

Jika company profile belum dibuat:
```typescript
{
  company_name: "WahfaLab",
  tagline: "Laboratorium Analisis & Kalibrasi",
  address: null,
  phone: null,
  whatsapp: null,
  email: null,
  website: null,
  logo_url: null,
  npwp: null
}
```

## Use Cases

### 1. Setup Awal
- Admin baru pertama kali setup
- Upload logo
- Isi semua informasi
- Simpan

### 2. Rebranding
- Update logo baru
- Ganti nama/tagline
- Update kontak
- Semua PDF otomatis update

### 3. Multiple Documents
- Logo & info digunakan di:
  - Surat Tugas Perjalanan
  - Quotation/Penawaran
  - Invoice
  - Certificate
  - Laporan Hasil Uji

## File Structure

```
src/
├── app/
│   └── (admin)/
│       └── admin/
│           └── settings/
│               ├── page.tsx              # Redirect
│               └── company/
│                   └── page.tsx          # Company settings
├── lib/
│   └── actions/
│       └── company.ts                    # Server actions
└── components/
    └── pdf/
        └── TravelOrderPDF.tsx            # Updated with company
```

## Security

- **Access:** Admin only
- **Upload:** Validasi file type & size
- **Storage:** Supabase Storage dengan RLS
- **Delete:** Konfirmasi sebelum hapus logo

## Best Practices

1. **Logo:**
   - Gunakan format PNG/SVG dengan background transparan
   - Ukuran ideal: 200x200px atau 400x400px
   - File size < 500KB untuk loading cepat

2. **Informasi Kontak:**
   - Gunakan format internasional untuk phone/WhatsApp
   - Email valid dengan domain perusahaan
   - Website dengan https://

3. **NPWP:**
   - Format: 00.000.000.0-000.000
   - Hanya angka dan karakter khusus

## Next Steps / TODO

- [ ] Support multiple logo variants (dark/light mode)
- [ ] Social media links (LinkedIn, Instagram, etc.)
- [ ] Company description/bio
- [ ] Multiple language support
- [ ] Logo auto-crop & resize
- [ ] Version history untuk perubahan
- [ ] Integration dengan semua PDF templates
- [ ] QR code untuk vCard contact
