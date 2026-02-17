# Surat Tugas Perjalanan - WahfaLab

## Overview
Fitur **Surat Tugas Perjalanan Dinas** memungkinkan admin untuk membuat surat tugas resmi untuk petugas lapangan yang akan melakukan sampling di lokasi customer. Surat tugas dibuat dalam format PDF dengan nomor surat otomatis.

## Database Schema

### Model: TravelOrder
```prisma
model TravelOrder {
  id                  String           @id @default(uuid())
  assignment_id       String           @unique
  assignment          SamplingAssignment @relation(...)
  document_number     String           @unique  // Format: ST/2026/02/0001
  departure_date      DateTime
  return_date         DateTime
  destination         String
  purpose             String
  transportation_type String?
  accommodation_type  String?
  daily_allowance     Decimal?         @db.Decimal(10, 2)
  total_budget        Decimal?         @db.Decimal(10, 2)
  notes               String?
  pdf_url             String?          // URL PDF yang diupload (opsional)
  created_at          DateTime         @default(now())
  updated_at          DateTime         @default(now())
}
```

## Fitur Utama

### 1. **Auto-Generate Nomor Surat**
- Format: `ST/YYYY/MM/NNNN`
- Contoh: `ST/2026/02/0001`
- Auto-increment setiap bulan

### 2. **PDF Template Profesional**
- Header WahfaLab dengan branding
- Data petugas lengkap
- Detail perjalanan dinas
- Rincian biaya (transportasi, akomodasi, uang harian)
- Tanda tangan (petugas & kepala lab)
- Watermark & footer otomatis

### 3. **Rincian Biaya**
- Transportasi (mobil/motor/sewa kendaraan)
- Akomodasi (hotel/tidak perlu)
- Uang harian (per diem)
- Total estimasi biaya

## Flow Kerja

```
1. Admin membuat Assignment Sampling
   ↓
2. Auto redirect ke halaman Create Travel Order
   ↓
3. Admin mengisi detail perjalanan:
   - Tanggal berangkat & kembali
   - Lokasi tujuan
   - Maksud & tujuan
   - Transportasi & akomodasi
   - Uang harian & total budget
   ↓
4. Submit → Simpan ke database
   ↓
5. Redirect ke detail Travel Order
   ↓
6. Admin/Field Officer dapat:
   - Preview PDF
   - Download PDF
   - Cetak surat tugas
```

## Halaman

### `/admin/travel-orders/create/[assignment_id]`
Form untuk membuat surat tugas perjalanan baru.

**Fields:**
- Tanggal Berangkat (datetime-local)
- Tanggal Kembali (datetime-local)
- Lokasi Tujuan (text)
- Maksud & Tujuan (textarea)
- Transportasi (text, optional)
- Akomodasi (text, optional)
- Uang Harian (number, optional)
- Total Estimasi (number, optional)
- Catatan Tambahan (textarea, optional)

### `/admin/travel-orders/[id]`
Detail surat tugas dengan informasi lengkap.

**Features:**
- Data petugas
- Detail perjalanan
- Informasi job order
- Rincian biaya
- Timeline creation & update
- Button download PDF
- Button preview PDF

### `/admin/travel-orders/[id]/preview`
Preview PDF dalam viewer sebelum download.

**Features:**
- PDF viewer embedded
- Download button
- Print-friendly layout

### `/field/assignments/[id]` (Field Officer View)
Field officer dapat melihat surat tugas mereka.

**Features:**
- Card "Surat Tugas Perjalanan"
- Nomor surat
- Tanggal berangkat & kembali
- Transportasi & uang harian
- Link untuk lihat/download PDF

## Server Actions

### `createTravelOrder(data)`
Membuat travel order baru dengan auto-generate nomor surat.

```typescript
{
  assignment_id: string
  departure_date: string
  return_date: string
  destination: string
  purpose: string
  transportation_type?: string
  accommodation_type?: string
  daily_allowance?: number
  total_budget?: number
  notes?: string
}
```

### `getTravelOrderById(id)`
Ambil detail travel order by ID.

### `getTravelOrderByAssignmentId(assignmentId)`
Ambil travel order berdasarkan assignment ID.

### `updateTravelOrder(id, data)`
Update travel order yang sudah ada.

### `uploadTravelOrderPdf(travelOrderId, file)`
Upload PDF surat tugas yang sudah ditandatangani (opsional).

### `getMyTravelOrders(fieldOfficerId)`
Ambil semua travel order untuk field officer tertentu.

## PDF Template

### Struktur Surat Tugas

```
┌─────────────────────────────────────────┐
│  🧪 WahfaLab                   No: ...  │
│  WahfaLab Laboratory             Tanggal │
│  Alamat Lengkap                          │
├─────────────────────────────────────────┤
│                                         │
│     SURAT TUGAS PERJALANAN DINAS        │
│                                         │
│  I. DATA PETUGAS                        │
│     Nama: [Nama Petugas]                │
│     Email: [email]                      │
│     Jabatan: Petugas Lapangan           │
│                                         │
│  II. PELAKSANAAN TUGAS                  │
│     Tanggal Berangkat: [date]           │
│     Tanggal Kembali: [date]             │
│     Lokasi Tujuan: [location]           │
│     Dasar Tugas: Job Order [code]       │
│     Customer: [customer name]           │
│     Maksud & Tujuan: [purpose]          │
│                                         │
│  III. RINCIAN BIAYA                     │
│     ┌──────────┬──────────┬─────────┐   │
│     │ Jenis    │ Ket      │ Jumlah  │   │
│     ├──────────┼──────────┼─────────┤   │
│     │ Transp.  │ [type]   │ -       │   │
│     │ Akom.    │ [type]   │ -       │   │
│     │ Harian   │ Per hari │ Rp ...  │   │
│     │ Total    │          │ Rp ...  │   │
│     └──────────┴──────────┴─────────┘   │
│                                         │
│  IV. CATATAN TAMBAHAN                   │
│      [notes]                            │
│                                         │
│  Yang Ditugaskan,      Mengetahui,      │
│                        Ka. Laboratorium │
│  [Nama Petugas]        (...............)│
│                                         │
│  Dokumen ini dibuat secara elektronik   │
│  dan sah tanpa tanda tangan basah.      │
└─────────────────────────────────────────┘
```

## Integrasi dengan Assignment

### Auto-Redirect Flow
```typescript
// Di create assignment page
const result = await createSamplingAssignment(formData);
const assignmentId = result.assignment?.id;
if (assignmentId) {
  router.push(`/admin/travel-orders/create/${assignmentId}`);
}
```

### Field Officer View
```typescript
// Di assignment detail page
const travelOrder = await getTravelOrderByAssignmentId(assignmentId);

{travelOrder && (
  <Card>
    <CardTitle>Surat Tugas Perjalanan</CardTitle>
    <CardContent>
      <p>Nomor: {travelOrder.document_number}</p>
      <Link href={`/admin/travel-orders/${travelOrder.id}/preview`}>
        Lihat Surat Tugas
      </Link>
    </CardContent>
  </Card>
)}
```

## Storage Bucket

### `travel-orders`
Bucket untuk menyimpan PDF surat tugas yang sudah diupload (jika ada upload manual).

**Settings:**
- Public: true
- File size limit: 10MB
- Allowed MIME types: `application/pdf`

## Format Nomor Surat

```typescript
// generateTravelOrderNumber()
// Output: ST/2026/02/0001

ST = Surat Tugas
2026 = Tahun
02 = Bulan (Februari)
0001 = Sequence number (auto-increment)
```

## Currency Format

Semua nilai monetary diformat dalam Rupiah (IDR):

```typescript
formatCurrency(150000) 
// Output: "Rp 150.000"

formatCurrency(2500000)
// Output: "Rp 2.500.000"
```

## Security

- Hanya admin yang bisa create/edit travel orders
- Field officer hanya bisa view travel order mereka sendiri
- PDF generation dilakukan server-side
- Document number unique constraint

## Use Cases

### 1. Sampling Routine
- Admin buat assignment → auto redirect ke travel order
- Isi detail perjalanan
- Download PDF untuk petugas

### 2. Urgent Sampling
- Buat travel order sederhana (hanya required fields)
- Download PDF segera
- Update rincian biaya nanti

### 3. Multi-Day Sampling
- Set tanggal berangkat & kembali (beda hari)
- Set akomodasi (hotel)
- Set uang harian x jumlah hari

### 4. Local Sampling
- Tanggal berangkat & kembali sama hari
- Tidak perlu akomodasi
- Uang harian partial atau full

## File Structure

```
src/
├── app/
│   └── (admin)/
│       └── admin/
│           └── travel-orders/
│               ├── create/[id]/
│               │   └── page.tsx         # Form create
│               └── [id]/
│                   ├── page.tsx         # Detail
│                   └── preview/
│                       └── page.tsx     # PDF preview
├── components/
│   └── pdf/
│       └── TravelOrderPDF.tsx           # PDF template
└── lib/
    ├── actions/
    │   └── travel-order.ts              # Server actions
    └── utils/
        └── generateNumber.ts            # Generate nomor surat
```

## Dependencies

```json
{
  "@react-pdf/renderer": "^4.3.2"
}
```

## Next Steps / TODO

- [ ] Email otomatis ke petugas dengan attachment PDF
- [ ] Approval workflow (Ka. Lab tanda tangan digital)
- [ ] Tracking real-time perjalanan dinas
- [ ] Expense reporting setelah perjalanan selesai
- [ ] Integration dengan akuntansi untuk reimbursement
- [ ] Template surat tugas bahasa Inggris (untuk customer asing)
