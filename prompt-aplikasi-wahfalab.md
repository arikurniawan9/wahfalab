# 🚀 Analisis & Rancangan Sistem WahfaLab

Dokumen ini berisi analisis lengkap dari sistem WahfaLab, mulai dari arsitektur, database, fitur per role, hingga *prompt* komprehensif yang bisa Anda gunakan untuk membangun ulang (replikasi) aplikasi ini di perangkat atau lingkungan lain menggunakan AI.

---

## 🏗️ 1. Arsitektur & Teknologi Utama (Tech Stack)

Aplikasi ini menggunakan arsitektur modern *Fullstack Javascript/Typescript* berbasis **Next.js (App Router)**.

- **Framework Utama:** Next.js v16 (React v19)
- **Bahasa:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma Client
- **Authentication:** NextAuth.js (v5 Beta) dengan Prisma Adapter & Bcrypt (Credentials)
- **Styling:** Tailwind CSS v4 + `tailwindcss-animate`
- **UI Components:** Shadcn UI (berbasis Radix UI) & Lucide React
- **State Management & Data Fetching:** Zustand & TanStack React Query
- **Form Handling & Validasi:** React Hook Form & Zod
- **Rich Text Editor:** Tiptap
- **PDF Generation:** `@react-pdf/renderer`
- **Lainnya:** `date-fns` (Date formatting), `framer-motion` (Animasi)

---

## 👥 2. Aktor & Hak Akses (8 Roles)

Sistem ini memiliki pembagian akses (Role-Based Access Control) yang sangat spesifik berdasarkan alur kerja operasional laboratorium:

1. **Admin (`admin`)**: Super admin yang memiliki akses ke seluruh modul (Dashboard, Penawaran, Master Data Lab, Sampling, Manajemen User, Finance, dan Settings).
2. **Operator (`operator`)**: Bertugas membuat penawaran harga (Quotation), memantau progress order, dan mengatur operasional dasar.
3. **Client (`client`)**: Pelanggan/Customer yang dapat login untuk melihat riwayat order, penawaran harga, dan mengunduh hasil uji.
4. **Field Officer (`field_officer`)**: Petugas lapangan yang menerima penugasan untuk melakukan pengambilan sampel di lokasi klien.
5. **Analyst (`analyst`)**: Analis laboratorium yang menerima sampel, melakukan pengujian parameter, dan menginput hasil analisis serta data mentah.
6. **Reporting (`reporting`)**: Staf yang bertugas mereview hasil dari analis dan menerbitkan dokumen resmi Laporan Hasil Uji (LHU).
7. **Finance (`finance`)**: Mengelola transaksi keuangan (Income/Expense), invoice, dan rekening bank.
8. **Content Manager (`content_manager`)**: Mengelola halaman depan/landing page (Banner, Berita, Portofolio, Konfigurasi Web).

---

## 🔄 3. Alur Proses Bisnis Utama (Core Flow)

Aplikasi ini mendigitalisasi alur kerja laboratorium pengujian lingkungan:

1. **Pembuatan Penawaran (Quotation)**: Operator/Admin membuat penawaran harga layanan uji lab untuk Client.
2. **Persetujuan & Job Order**: Jika penawaran disetujui, sistem membuat `Job Order` dengan status `scheduled`.
3. **Penugasan Sampling**: Field Officer ditugaskan ke lokasi. Status menjadi `sampling`. Setelah selesai, sampel dibawa ke lab.
4. **Serah Terima Sampel (BAST)**: Terdapat proses serah terima sampel (Handover) dari Field Officer ke Analis.
5. **Analisis Laboratorium**: Analis melakukan pengujian. Status menjadi `analysis` lalu `analysis_done`. Hasil uji dan bukti diunggah.
6. **Pembuatan Laporan (LHU)**: Tim Reporting mereview hasil dan membuat Laporan Hasil Uji resmi. Status menjadi `reporting` lalu `completed`.
7. **Penagihan (Invoicing/Finance)**: Proses pembayaran dicatat oleh tim Finance.

---

## 🗄️ 4. Struktur Database Inti (Prisma)

- **User & Auth**: `Profile` (dengan enum `UserRole`)
- **Master Data Layanan**: `ServiceCategory`, `Service` (berisi parameter dan harga)
- **Master Regulasi**: `Regulation`, `RegulationParameter` (standar baku mutu lingkungan)
- **Master Operasional**: `OperationalCatalog`, `OperationalHistory` (biaya perdiem, transport)
- **Transaksi Utama**:
  - `Quotation` & `QuotationItem` (Penawaran)
  - `JobOrder` (Tracking Pekerjaan utama)
  - `SampleHandover` (Berita Acara Serah Terima sampel)
  - `LabAnalysis` (Data hasil uji dari analis)
  - `LabReport` & `LabReportItem` (LHU resmi)
- **Keuangan (Finance)**: `FinancialRecord`, `BankAccount`
- **CMS (Halaman Depan)**: `LandingPageConfig`, `News`, `ContactMessage`

---
---

# 🤖 PROMPT UNTUK REPLIKASI APLIKASI (COPY DARI SINI KE BAWAH)

Gunakan prompt di bawah ini pada AI Assistant (seperti ChatGPT, Claude, atau Gemini) di perangkat baru untuk membangun ulang aplikasi secara bertahap.

```text
Saya ingin membangun sebuah Sistem Informasi Manajemen Laboratorium Pengujian Lingkungan (WahfaLab) menggunakan arsitektur Fullstack modern. Bertindaklah sebagai Senior Fullstack Engineer ahli. Kita akan membangun aplikasi ini secara bertahap (step-by-step).

Berikut adalah spesifikasi teknis dan rancangan sistemnya:

## 1. TECH STACK
- Framework: Next.js 16 (App Router) dengan React 19.
- Bahasa: TypeScript.
- Database & ORM: PostgreSQL & Prisma ORM.
- Auth: NextAuth.js v5 (beta) dengan Credentials Provider (Bcrypt).
- Styling & UI: Tailwind CSS v4, Shadcn UI, Lucide React, Framer Motion.
- Form & State: React Hook Form, Zod, Zustand, TanStack React Query.
- Fitur Tambahan: Tiptap (Rich Text), @react-pdf/renderer (Generate PDF LHU/Penawaran).

## 2. DATABASE SCHEMA (PRISMA)
Buatkan skema Prisma yang mencakup entitas berikut dan relasinya:
- `Profile`: Tabel user dengan field email, password, full_name, dan enum `UserRole` (admin, operator, client, field_officer, finance, analyst, reporting, content_manager).
- `Service` & `ServiceCategory`: Katalog layanan uji lab (harga, parameter, referensi ke regulasi).
- `Regulation` & `RegulationParameter`: Master data standar baku mutu lingkungan.
- `OperationalCatalog`: Master data biaya operasional (transport, uang saku lapangan).
- `Quotation` & `QuotationItem`: Penawaran harga dari lab ke client.
- `JobOrder`: Tracking progress layanan (relasi ke Quotation dan Profile untuk tugas). Status: scheduled, sampling, analysis, reporting, completed.
- `SampleHandover`: Berita Acara Serah Terima sampel dari petugas lapangan ke analis.
- `LabAnalysis`: Catatan hasil uji per parameter dari analis.
- `LabReport` & `LabReportItem`: Laporan Hasil Uji (LHU) final yang direview oleh tim reporting.
- `FinancialRecord` & `BankAccount`: Pencatatan transaksi income/expense perusahaan.
- `LandingPageConfig`, `News`, `ContactMessage`: Untuk manajemen CMS halaman depan.

## 3. ROLE-BASED ACCESS CONTROL & FOLDER STRUCTURE
Gunakan Next.js Route Groups untuk memisahkan layout berdasarkan role:
- `/ (Halaman Depan CMS)`
- `/(admin)/admin/...`
- `/(operator)/operator/...`
- `/(client)/dashboard/...`
- `/(field)/field/...`
- `/(analyst)/analyst/...`
- `/(reporting)/reporting/...`
- `/(finance)/finance/...`
- `/(content)/content-manager/...`
Gunakan Next.js Middleware untuk memproteksi setiap prefix route agar hanya bisa diakses oleh `UserRole` yang sesuai di session NextAuth.

## 4. ALUR KERJA UTAMA (FLOW)
1. **Quotation**: Operator membuat penawaran harga.
2. **Job Order**: Jika disetujui, Quotation berubah menjadi Job Order.
3. **Sampling**: Field Officer melihat jadwal Job Order, melakukan sampling, dan menyerahkan sampel (Handover).
4. **Analisis**: Analyst mengisi form hasil uji parameter sampel (LabAnalysis).
5. **Reporting**: Staff Reporting memvalidasi hasil dari Analyst, mengeceknya dengan baku mutu (Regulation), dan men-generate PDF (LabReport).
6. **Invoicing**: Finance mencatat pembayaran (FinancialRecord).

## INSTRUKSI UNTUK AI:
Ini adalah prompt inisialisasi. JANGAN buat seluruh kodenya sekaligus karena akan terpotong. 
Untuk respon pertamamu:
1. Konfirmasi pemahamanmu terhadap arsitektur, database, dan flow di atas.
2. Buatkan instruksi inisialisasi project (`npx create-next-app`, instalasi Shadcn UI, konfigurasi Tailwind v4).
3. Berikan skema `schema.prisma` secara lengkap berdasarkan deskripsi di atas.
4. Tunggu instruksi saya selanjutnya untuk mulai membangun sistem Auth dan Middleware.
```