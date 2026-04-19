import { PrismaClient } from '../src/generated/prisma'
import * as dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'admin@wahfalab.com'
  const adminPassword = 'admin123456'
  const adminName = 'WahfaLab Administrator'

  console.log('🚀 Memulai seeding admin...')

  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  // Create or update admin profile
  const admin = await prisma.profile.upsert({
    where: { email: adminEmail },
    update: {
      role: 'admin',
      full_name: adminName,
      password: hashedPassword
    },
    create: {
      full_name: adminName,
      role: 'admin',
      email: adminEmail,
      password: hashedPassword
    }
  })

  console.log(`✅ Admin berhasil disiapkan!`)
  console.log(`📧 Email: ${adminEmail}`)
  console.log(`🔑 Password: ${adminPassword}`)

  // Create Default Company Profile
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

  // Create Services
  console.log('🧪 Seeding layanan laboratorium...')
  const category = await prisma.serviceCategory.upsert({
    where: { name: 'Kualitas Udara' },
    update: {},
    create: { name: 'Kualitas Udara' }
  })

  await prisma.service.createMany({
    data: [
      {
        name: 'Uji Emisi Sumber Tidak Bergerak',
        price: 5000000,
        category: category.name,
        unit: 'titik sampling'
      },
      {
        name: 'Uji Kualitas Udara Ambient',
        price: 3000000,
        category: category.name,
        unit: 'parameter'
      }
    ],
    skipDuplicates: true
  })

  console.log('✅ Layanan laboratorium berhasil di-seed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
