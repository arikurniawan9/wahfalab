# Analyst & Reporting Feature - WahfaLab

## Overview
Fitur **Analyst & Reporting** menambahkan 2 role baru dalam flow kerja laboratorium:
1. **Analis** - Bertanggung jawab melakukan analisis sampel di laboratorium
2. **Reporting** - Bertanggung jawab menerbitkan Laporan Hasil Uji (LHU) ke customer

## Flow Kerja Lengkap

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLOW KERJA LABORATORIUM                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. OPERATOR                                                            │
│     └─> Membuat Job Order dari Quotation                                │
│         Status: scheduled                                               │
│                                                                         │
│  2. FIELD OFFICER                                                       │
│     └─> Sampling di lokasi customer                                     │
│         Status: sampling (pending → in_progress → completed)            │
│         Upload: Foto dokumentasi sampling                               │
│                                                                         │
│  3. ANALYST ← BARU!                                                     │
│     └─> Menerima notif setelah sampling selesai                         │
│         └─> Melakukan analisis di laboratorium                          │
│             Status: analysis → analysis_done                            │
│             Upload: Hasil uji (PDF), data mentah (foto)                 │
│                                                                         │
│  4. REPORTING ← BARU!                                                   │
│     └─> Menerima notif setelah analisis selesai                         │
│         └─> Menerbitkan Laporan Hasil Uji (LHU)                         │
│             Status: reporting → completed                               │
│             Output: LHU resmi untuk customer                            │
│                                                                         │
│  5. OPERATOR                                                            │
│     └─> Mengirim LHU ke customer                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Database Schema

### 1. Enum: UserRole (Updated)
```prisma
enum UserRole {
  admin
  operator
  client
  field_officer
  finance
  analyst      // ← BARU: Laboratorium analis
  reporting    // ← BARU: Staff reporting
}
```

### 2. Enum: JobStatus (Updated)
```prisma
enum JobStatus {
  scheduled
  sampling
  analysis        // ← BARU: Sedang dianalisis oleh analis
  analysis_done   // ← BARU: Analisis selesai, menunggu reporting
  reporting       // ← BARU: Sedang dibuat laporan oleh staff reporting
  completed
  pending_payment
  paid
}
```

### 3. Model: JobOrder (Updated)
```prisma
model JobOrder {
  id                  String              @id @default(uuid())
  quotation_id        String
  quotation           Quotation           @relation(...)
  tracking_code       String              @unique
  status              JobStatus           @default(scheduled)
  notes               String?
  certificate_url     String?
  
  // Analyst & Reporting Tracking ← BARU
  analyst_id          String?             // Analis yang menangani
  analyst             Profile?            @relation("AnalystJobs", ...)
  reporting_id        String?             // Staff reporting yang menangani
  reporting           Profile?            @relation("ReportingJobs", ...)
  analysis_started_at DateTime?           // Waktu analisis dimulai
  analysis_done_at    DateTime?           // Waktu analisis selesai
  reporting_done_at   DateTime?           // Waktu laporan selesai
  
  created_at          DateTime            @default(now())
  sampling_assignment SamplingAssignment?
  lab_analysis        LabAnalysis?        // ← BARU: Hasil analisis
  payment             Payment?
  
  @@index([analyst_id])
  @@index([reporting_id])
}
```

### 4. Model: Profile (Updated)
```prisma
model Profile {
  id                   String              @id @default(uuid())
  email                String?             @unique
  full_name            String?
  role                 UserRole            @default(client)
  
  // Relations baru
  analyst_jobs         JobOrder[]          @relation("AnalystJobs")
  reporting_jobs       JobOrder[]          @relation("ReportingJobs")
  lab_analyses         LabAnalysis[]
}
```

### 5. Model: LabAnalysis ← BARU!
```prisma
// Hasil Analisis Laboratorium
model LabAnalysis {
  id                  String   @id @default(uuid())
  job_order_id        String   @unique
  job_order           JobOrder @relation(..., onDelete: Cascade)
  analyst_id          String
  analyst             Profile  @relation(...)
  
  // Hasil Analisis
  test_results        Json?    // [{parameter, result, unit, method, limit}]
  analysis_notes      String?  // Catatan analis
  equipment_used      Json?    // Peralatan yang digunakan
  sample_condition    String?  // Kondisi sampel saat diterima
  
  // Dokumen PDF
  result_pdf_url      String?  // URL PDF hasil analisis
  raw_data_url        String?  // URL data mentah (foto, dll)
  
  // Timeline
  analysis_started_at DateTime?
  analysis_completed_at DateTime?
  
  created_at          DateTime @default(now())
  updated_at          DateTime @default(now())
  
  @@index([job_order_id])
  @@index([analyst_id])
}
```

## Role: Analyst (Analis Laboratorium)

### Tugas Utama
1. Menerima notifikasi job order setelah sampling selesai
2. Melakukan analisis sampel di laboratorium
3. Input hasil uji per parameter
4. Upload dokumentasi hasil analisis (PDF)
5. Upload data mentah (foto, dll)
6. Update status ke "analysis_done"

### Dashboard Analyst (`/analyst`)
```
┌────────────────────────────────────────────────────────────┐
│  Dashboard Analis                                          │
├────────────────────────────────────────────────────────────┤
│  Summary Cards:                                            │
│  ┌──────────┬──────────┬──────────┬──────────┐            │
│  │ Pending  │ In Prog  │ Done     │ Total    │            │
│  │    5     │    3     │   12     │   20     │            │
│  └──────────┴──────────┴──────────┴──────────┘            │
│                                                            │
│  Job Orders Assigned to Me:                                │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Tracking Code │ Sample │ Status │ Date    │ Action │   │
│  │ JO-2026-001   │ Air    │ analysis │ Feb 23  │ [View]│   │
│  │ JO-2026-002   │ Tanah  │ pending  │ Feb 24  │ [View]│   │
│  └────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### Halaman Detail Job Order (`/analyst/jobs/[id]`)
```
┌────────────────────────────────────────────────────────────┐
│  Detail Job Order - JO-2026-001                            │
├────────────────────────────────────────────────────────────┤
│  Informasi Sampling:                                       │
│  - Customer: PT. ABC                                       │
│  - Lokasi: Jakarta                                         │
│  - Tanggal Sampling: 23 Feb 2026                           │
│  - Field Officer: Budi                                     │
│  - Foto Sampling: [Lihat]                                  │
│                                                            │
│  Form Hasil Analisis:                                      │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Parameter        │ Hasil │ Satuan │ Metode │ Limit │   │
│  │ pH               │ [___] │ -      │ [___]  │ [___] │   │
│  │ TDS              │ [___] │ mg/L   │ [___]  │ [___] │   │
│  │ Conductivity     │ [___] │ μS/cm  │ [___]  │ [___] │   │
│  │ [+ Tambah Parameter]                                │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  Catatan Analis: [________________________]                │
│  Kondisi Sampel: [________________________]                │
│  Peralatan: [________________________]                     │
│                                                            │
│  Upload Dokumen:                                           │
│  - Hasil Analisis (PDF): [Upload]                          │
│  - Data Mentah (Foto): [Upload]                            │
│                                                            │
│  [Mulai Analisis] [Simpan Draft] [Selesai & Lanjut]        │
└────────────────────────────────────────────────────────────┘
```

## Role: Reporting

### Tugas Utama
1. Menerima notifikasi setelah analisis selesai
2. Review hasil analisis dari analis
3. Menerbitkan Laporan Hasil Uji (LHU) format PDF
4. Update status ke "completed"
5. LHU siap dikirim operator ke customer

### Dashboard Reporting (`/reporting`)
```
┌────────────────────────────────────────────────────────────┐
│  Dashboard Reporting                                       │
├────────────────────────────────────────────────────────────┤
│  Summary Cards:                                            │
│  ┌──────────┬──────────┬──────────┬──────────┐            │
│  │ Pending  │ In Prog  │ Done     │ Total    │            │
│  │    8     │    2     │   15     │   25     │            │
│  └──────────┴──────────┴──────────┴──────────┘            │
│                                                            │
│  Waiting for Reporting:                                    │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Tracking Code │ Sample │ Analyst │ Date    │ Action │   │
│  │ JO-2026-001   │ Air    │ Andi    │ Feb 23  │ [View]│   │
│  │ JO-2026-003   │ Udara  │ Siti    │ Feb 22  │ [View]│   │
│  └────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

### Halaman Detail Job Order (`/reporting/jobs/[id]`)
```
┌────────────────────────────────────────────────────────────┐
│  Detail Job Order - JO-2026-001                            │
├────────────────────────────────────────────────────────────┤
│  Informasi Analisis (dari Analis):                         │
│  - Analis: Andi                                            │
│  - Tanggal Analisis: 23 Feb 2026                           │
│  - Kondisi Sampel: Baik                                    │
│                                                            │
│  Hasil Uji:                                                │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Parameter │ Hasil │ Satuan │ Metode │ Limit │ Status│   │
│  │ pH        │ 7.2   │ -      │ SMEWW  │ 6-9   │ ✓     │   │
│  │ TDS       │ 250   │ mg/L   │ SMEWW  │ 500   │ ✓     │   │
│  └────────────────────────────────────────────────────┘   │
│  [Download Hasil Analisis PDF]                             │
│  [Lihat Data Mentah]                                       │
│                                                            │
│  Penerbitan LHU:                                           │
│  - Nomor LHU: [LHU/2026/02/0001] (auto-generate)           │
│  - Tanggal Terbit: [24 Feb 2026]                           │
│  - Ditandatangani oleh: [Ka. Laboratorium]                 │
│                                                            │
│  [Preview LHU] [Generate PDF] [Terbitkan & Selesai]        │
└────────────────────────────────────────────────────────────┘
```

## Server Actions

### Untuk Analyst

#### `assignAnalystToJob(jobOrderId, analystId)`
Assign analis ke job order.
```typescript
await assignAnalystToJob(jobOrderId, analystId)
```

#### `startAnalysis(jobOrderId, analystId)`
Mulai analisis dan update status.
```typescript
await startAnalysis(jobOrderId, analystId)
// Status: analysis
// analysis_started_at: now()
```

#### `saveAnalysisResults(jobOrderId, data)`
Simpan hasil analisis (draft).
```typescript
await saveAnalysisResults(jobOrderId, {
  test_results: [
    { parameter: "pH", result: "7.2", unit: "-", method: "SMEWW", limit: "6-9" }
  ],
  analysis_notes: "Sampel dalam kondisi baik",
  equipment_used: ["pH Meter", "TDS Meter"],
  sample_condition: "Baik"
})
```

#### `uploadAnalysisPDF(jobOrderId, file)`
Upload PDF hasil analisis.
```typescript
await uploadAnalysisPDF(jobOrderId, pdfFile)
```

#### `completeAnalysis(jobOrderId)`
Selesaikan analisis dan lanjut ke reporting.
```typescript
await completeAnalysis(jobOrderId)
// Status: analysis_done
// analysis_done_at: now()
// Auto-notify reporting team
```

### Untuk Reporting

#### `assignReportingToJob(jobOrderId, reportingId)`
Assign staff reporting ke job order.
```typescript
await assignReportingToJob(jobOrderId, reportingId)
```

#### `generateLabReport(jobOrderId)`
Generate Laporan Hasil Uji (LHU).
```typescript
const report = await generateLabReport(jobOrderId)
// Auto-generate LHU number: LHU/YYYY/MM/NNNN
// Generate PDF dengan hasil analisis
```

#### `publishLabReport(jobOrderId)`
Terbitkan LHU dan selesaikan job order.
```typescript
await publishLabReport(jobOrderId)
// Status: completed
// reporting_done_at: now()
// LHU PDF attached
// Auto-notify operator
```

## Storage Buckets

### `analysis-results`
Bucket untuk menyimpan PDF hasil analisis.

**Settings:**
- Public: false (private, hanya staff yang bisa akses)
- File size limit: 10MB
- Allowed MIME types: `application/pdf`

### `analysis-raw-data`
Bucket untuk menyimpan data mentah (foto, dll).

**Settings:**
- Public: false
- File size limit: 20MB
- Allowed MIME types: `image/*`, `application/pdf`

## Format Nomor LHU

```typescript
// generateLabReportNumber()
// Output: LHU/2026/02/0001

LHU = Laporan Hasil Uji
2026 = Tahun
02 = Bulan (Februari)
0001 = Sequence number (auto-increment per bulan)
```

## Notifikasi Otomatis

### Flow Notifikasi

```
1. Field Officer → sampling completed
   └─> Notify: Analyst (email + in-app)
       "Job Order JO-2026-001 siap dianalisis"

2. Analyst → analysis done
   └─> Notify: Reporting (email + in-app)
       "Job Order JO-2026-001 selesai analisis"

3. Reporting → report published
   └─> Notify: Operator (email + in-app)
       "Job Order JO-2026-001 siap dikirim ke customer"
   └─> Notify: Client (email)
       "Laporan Hasil Uji Anda telah terbit"
```

### In-App Notification Model (Opsional - Future)
```prisma
model Notification {
  id         String   @id @default(uuid())
  user_id    String
  user       Profile  @relation(...)
  title      String
  message    String
  type       String   // "job_assigned", "analysis_complete", etc.
  entity_id  String?  // job_order_id, etc.
  is_read    Boolean  @default(false)
  created_at DateTime @default(now())
  
  @@index([user_id])
  @@index([is_read])
}
```

## Timeline Tracking

Setiap job order sekarang memiliki timeline lengkap:

```typescript
{
  created_at: "2026-02-20T10:00:00Z",      // Job order dibuat
  
  // Sampling
  sampling_assigned_at: "...",
  sampling_completed_at: "...",
  
  // Analysis
  analysis_started_at: "...",
  analysis_done_at: "...",
  
  // Reporting
  reporting_started_at: "...",
  reporting_done_at: "...",
  
  // Completion
  completed_at: "..."
}
```

## Security & Access Control

### Middleware Protection
```typescript
// Route protection
/analyst/*    → role: analyst only
/reporting/*  → role: reporting only
```

### Data Access
- **Analis**: Hanya bisa lihat job order yang di-assign ke mereka
- **Reporting**: Hanya bisa lihat job order dengan status `analysis_done`
- **Operator**: Bisa lihat semua job order (untuk monitoring)
- **Admin**: Full access

## Integrasi dengan Fitur Lain

### 1. Sampling Assignment
Setelah field officer完成 sampling:
```typescript
// Auto-trigger
await updateJobStatus(jobOrderId, 'analysis')
await assignAnalyst(jobOrderId) // Auto-assign atau manual
```

### 2. PDF Generation
LHU PDF template akan include:
- Header WahfaLab (dari CompanyProfile)
- Informasi customer
- Hasil analisis per parameter
- Kesimpulan (Pass/Fail per parameter)
- Tanda tangan Ka. Laboratorium
- QR code untuk verifikasi (future)

### 3. Audit Logging
Semua action akan di-log:
```typescript
await logAudit({
  action: 'analysis_started',
  entity_type: 'job_order',
  entity_id: jobOrderId,
  user_id: analystId,
  metadata: { status: 'analysis' }
})
```

## File Structure

```
src/
├── app/
│   └── (analyst)/
│       ├── layout.tsx
│       └── analyst/
│           ├── page.tsx                    # Dashboard
│           └── jobs/
│               ├── page.tsx                # List jobs
│               └── [id]/
│                   └── page.tsx            # Detail + form analisis
│
│   └── (reporting)/
│       ├── layout.tsx
│       └── reporting/
│           ├── page.tsx                    # Dashboard
│           └── jobs/
│               ├── page.tsx                # List jobs
│               └── [id]/
│                   └── page.tsx            # Detail + LHU generation
│
├── lib/
│   └── actions/
│       ├── analyst.ts                      # Server actions untuk analis
│       └── reporting.ts                    # Server actions untuk reporting
│
└── components/
    └── pdf/
        ├── LabAnalysisPDF.tsx              # Template hasil analisis
        └── LabReportPDF.tsx                # Template LHU
```

## Migration SQL

```sql
-- Add new roles
ALTER TYPE "UserRole" ADD VALUE 'analyst';
ALTER TYPE "UserRole" ADD VALUE 'reporting';

-- Add new status values
ALTER TYPE "JobStatus" ADD VALUE 'analysis';
ALTER TYPE "JobStatus" ADD VALUE 'analysis_done';
ALTER TYPE "JobStatus" ADD VALUE 'reporting';

-- Add columns to job_orders
ALTER TABLE job_orders
  ADD COLUMN analyst_id VARCHAR(255),
  ADD COLUMN reporting_id VARCHAR(255),
  ADD COLUMN analysis_started_at TIMESTAMP,
  ADD COLUMN analysis_done_at TIMESTAMP,
  ADD COLUMN reporting_done_at TIMESTAMP;

-- Create indexes
CREATE INDEX job_orders_analyst_id_idx ON job_orders(analyst_id);
CREATE INDEX job_orders_reporting_id_idx ON job_orders(reporting_id);

-- Create lab_analyses table
CREATE TABLE lab_analyses (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_order_id VARCHAR(255) UNIQUE NOT NULL,
  analyst_id VARCHAR(255) NOT NULL,
  test_results JSONB,
  analysis_notes TEXT,
  equipment_used JSONB,
  sample_condition TEXT,
  result_pdf_url TEXT,
  raw_data_url TEXT,
  analysis_started_at TIMESTAMP,
  analysis_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (job_order_id) REFERENCES job_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (analyst_id) REFERENCES profiles(id)
);

CREATE INDEX lab_analyses_job_order_id_idx ON lab_analyses(job_order_id);
CREATE INDEX lab_analyses_analyst_id_idx ON lab_analyses(analyst_id);
```

## Testing Checklist

### 1. Create User Analyst & Reporting
```sql
-- Via database
UPDATE profiles SET role = 'analyst' WHERE email = 'analis@wahfalab.com';
UPDATE profiles SET role = 'reporting' WHERE email = 'reporting@wahfalab.com';
```

### 2. Test Flow
- [ ] Operator create job order
- [ ] Field officer complete sampling
- [ ] Analyst receive notification
- [ ] Analyst start analysis
- [ ] Analyst upload results (PDF)
- [ ] Analyst complete analysis
- [ ] Reporting receive notification
- [ ] Reporting generate LHU
- [ ] Reporting publish report
- [ ] Operator receive completed job
- [ ] LHU sent to customer

## Next Steps / TODO

- [ ] Implement notification system (email + in-app)
- [ ] Create analyst dashboard UI
- [ ] Create reporting dashboard UI
- [ ] Build analysis results form with dynamic parameters
- [ ] PDF template for Lab Analysis
- [ ] PDF template for Lab Report (LHU)
- [ ] Auto-generate LHU number
- [ ] Storage bucket setup (analysis-results, analysis-raw-data)
- [ ] QR code verification untuk LHU (future)
- [ ] Email templates untuk notifikasi
- [ ] Unit tests untuk server actions

---

*Last Updated: February 23, 2026*
