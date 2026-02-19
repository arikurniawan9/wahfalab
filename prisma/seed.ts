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
        full_name: adminName
      },
      create: {
        id: userId,
        full_name: adminName,
        role: 'admin'
      }
    })
    console.log(`✅ Admin berhasil disiapkan!`)
    console.log(`📧 Email: ${adminEmail}`)
    console.log(`🔑 Password: ${adminPassword}`)
  }

  // 4. Create Default Company Profile
  console.log('🏢 Menyiapkan data perusahaan...')
  await prisma.companyProfile.upsert({
    where: { id: 'default-company-id' }, // We can use a fixed ID for the main profile
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
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
