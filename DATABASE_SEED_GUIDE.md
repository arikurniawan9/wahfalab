# 📋 Database Reset & Seed Guide

**Tanggal:** 23 Februari 2026

---

## 🎯 **Overview**

Guide ini menjelaskan cara reset database dan seed akun admin untuk WahfaLab.

---

## 🔧 **Quick Start**

### **Reset & Seed Otomatis**

```bash
# Run seed script
npx tsx prisma/seed-admin.ts
```

**Script akan:**
1. ✅ Delete semua data dari database
2. ✅ Create admin user via Supabase Auth
3. ✅ Create admin profile
4. ✅ Create company profile
5. ✅ Tampilkan login credentials

---

## 📋 **LOGIN CREDENTIALS**

Setelah seed berhasil, gunakan credentials ini:

```
┌─────────────────────────────────────────────────────┐
│  Email:    admin@wahfalab.com                       │
│  Password: admin123456                              │
│  Role:     admin                                    │
└─────────────────────────────────────────────────────┘
```

**Login URL:** `http://localhost:3000/login`

---

## 🗄️ **MANUAL RESET (SQL)**

Jika ingin reset manual via SQL:

```bash
# 1. Buka Supabase Dashboard
# 2. SQL Editor
# 3. Copy paste isi file: reset-database.sql
# 4. Run
```

**File SQL:** `reset-database.sql`

---

## 📁 **FILES CREATED**

| File | Purpose |
|------|---------|
| `prisma/seed-admin.ts` | Seed script (TypeScript) |
| `reset-database.sql` | Manual reset SQL script |

---

## 🚀 **SEED SCRIPT DETAILS**

### **What Gets Created:**

**1. Admin User:**
- Email: `admin@wahfalab.com`
- Password: `admin123456`
- Role: `admin`
- Full Name: `Administrator`

**2. Company Profile:**
- Company Name: `WahfaLab`
- Tagline: `Laboratorium Analisis & Kalibrasi`
- Email: `info@wahfalab.com`
- Phone: `(021) 1234-5678`
- WhatsApp: `+62 812-3456-7890`
- Address: `Jl. Laboratorium No. 123, Jakarta, Indonesia`
- Logo: `/logo-wahfalab.png`

### **What Gets Deleted:**

**All data from:**
- LabAnalysis
- Payment
- TravelOrder
- SamplingAssignment
- JobOrder
- QuotationItem
- ApprovalRequest
- Quotation
- OperationalHistory
- OperationalCatalog
- Service
- ServiceCategory
- Equipment
- CompanyProfile
- Profile

---

## ⚠️ **WARNINGS**

1. **Destructive Operation**
   - Script akan **menghapus semua data**
   - Backup database terlebih dahulu jika diperlukan

2. **Auth User**
   - Script membuat user via Supabase Auth
   - Jika user sudah ada, akan menggunakan yang existing

3. **Environment Variables**
   - Pastikan `.env` sudah terisi dengan benar
   - Supabase URL dan Service Role Key diperlukan

---

## 🔍 **VERIFICATION**

Setelah seed, verifikasi dengan query ini:

```sql
-- Check admin profile
SELECT id, email, full_name, role 
FROM "Profile" 
WHERE role = 'admin';

-- Check company profile
SELECT id, company_name, email, tagline 
FROM "CompanyProfile";
```

**Expected Result:**
- 1 admin profile
- 1 company profile

---

## 🛠️ **TROUBLESHOOTING**

### **Error: "User already exists"**
```
⚠️ User might already exist, continuing...
```
**Solution:** Script akan otomatis menggunakan user yang sudah ada.

### **Error: "Could not get admin user ID"**
**Cause:** Auth user tidak ditemukan
**Solution:** 
1. Check `.env` variables
2. Make sure Supabase credentials are correct
3. Try manual create via Supabase Dashboard

### **Error: Foreign key constraint**
**Cause:** Delete order salah
**Solution:** Script sudah fix urutan delete (child tables first)

---

## 📊 **DATABASE SCHEMA OVERVIEW**

```
Profile (admin user)
  └─ CompanyProfile (company settings)
  
Quotation
  └─ QuotationItem
  └─ JobOrder
      ├─ SamplingAssignment
      ├─ LabAnalysis
      └─ Payment

OperationalCatalog
  └─ OperationalHistory

ServiceCategory
  └─ Service

Equipment
```

---

## 🎯 **NEXT STEPS**

Setelah seed:

1. **Login sebagai admin**
   ```
   http://localhost:3000/login
   Email: admin@wahfalab.com
   Password: admin123456
   ```

2. **Update company profile**
   - Buka `/admin/settings/company`
   - Update informasi perusahaan
   - Upload logo

3. **Update profile pribadi**
   - Buka `/admin/settings/profile`
   - Update nama dan password

4. **Tambah user lain**
   - Buka `/admin/users`
   - Tambah operator, analyst, dll.

---

## 📚 **REFERENCES**

- **Prisma Docs:** https://www.prisma.io/docs
- **Supabase Auth:** https://supabase.com/docs/guides/auth
- **Seed Script:** `prisma/seed-admin.ts`
- **SQL Reset:** `reset-database.sql`

---

*Last Updated: February 23, 2026*
