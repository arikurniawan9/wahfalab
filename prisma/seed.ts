import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  const adminEmail = 'admin@wahfalab.com'
  const adminPassword = 'admin123456'
  const adminName = 'WahfaLab Administrator'

  console.log('🚀 Memulai seeding admin...')

  // 1. Create user in Supabase Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { full_name: adminName }
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('ℹ️ User admin sudah terdaftar di Supabase Auth.')
    } else {
      console.error('❌ Gagal membuat user auth:', authError.message)
      // Don't return, try to find the existing user instead
    }
  }

  // 2. Get user ID (either newly created or existing)
  let userId = authUser?.user?.id

  if (!userId) {
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    userId = existingUsers.users.find(u => u.email === adminEmail)?.id
  }

  if (userId) {
    // 3. Create or Update Profile in Prisma
    await prisma.profile.upsert({
      where: { id: userId },
      update: {
        role: 'admin',
        full_name: adminName,
        email: adminEmail
      },
      create: {
        id: userId,
        full_name: adminName,
        role: 'admin',
        email: adminEmail
      }
    })
    console.log(`✅ Admin berhasil disiapkan!`)
    console.log(`📧 Email: ${adminEmail}`)
    console.log(`🔑 Password: ${adminPassword}`)
  }

  // 4. Create Default Company Profile
  console.log('🏢 Menyiapkan data perusahaan...')
  await prisma.companyProfile.upsert({
    where: { id: 'default-company-id' },
    update: {},
    create: {
      id: 'default-company-id',
      company_name: 'WahfaLab',
      address: 'Jl. Raya Lab No. 123, Kawasan Industri, Jakarta',
      phone: '021-12345678',
      whatsapp: '081234567890',
      email: 'info@wahfalab.com',
      website: 'www.wahfalab.com',
      tagline: 'Laboratorium Pengujian Lingkungan Terpercaya',
      npwp: '01.234.567.8-901.000'
    }
  })
  console.log('✅ Pengaturan perusahaan berhasil disiapkan!')

  // 5. Create Services
  console.log('🧪 Seeding layanan laboratorium...')
  const category = await prisma.serviceCategory.upsert({
    where: { name: 'Kualitas Udara' },
    update: {},
    create: { name: 'Kualitas Udara' }
  })

  await prisma.service.createMany({
    data: [
      { category_id: category.id, name: 'Pengujian Udara Ambien (24 Jam)', price: 1500000 },
      { category_id: category.id, name: 'Pengujian Emisi Sumber Tidak Bergerak', price: 2500000 },
      { category_id: category.id, name: 'Kebisingan Lingkungan', price: 500000 },
    ],
    skipDuplicates: true
  })

  // 6. Create Equipment
  console.log('🔧 Seeding peralatan...')
  await prisma.equipment.createMany({
    data: [
      { name: 'High Volume Air Sampler (HVAS)', price: 500000, specification: 'Tisch Environmental', unit: 'hari' },
      { name: 'Gas Analyzer', price: 750000, specification: 'Testo 350', unit: 'hari' },
      { name: 'Sound Level Meter', price: 250000, specification: 'Extech', unit: 'hari' },
    ],
    skipDuplicates: true
  })

  // 7. Create Operational Catalog
  console.log('🚗 Seeding katalog operasional...')
  await prisma.operationalCatalog.createMany({
    data: [
      { category: 'perdiem', name: 'Uang Harian Dalam Kota', price: 150000, location: 'Dalam Kota' },
      { category: 'perdiem', name: 'Uang Harian Luar Kota', price: 250000, location: 'Luar Kota' },
      { category: 'transport', name: 'Sewa Kendaraan Operasional', price: 600000, unit: 'hari' },
      { category: 'transport', name: 'Biaya BBM & Tol (Lumpsum)', price: 300000, unit: 'trip' },
      { category: 'transport', name: 'Tiket Pesawat (Estimasi)', price: 2000000, unit: 'pax' },
    ],
    skipDuplicates: true
  })
  
  console.log('✨ Seeding selesai!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
