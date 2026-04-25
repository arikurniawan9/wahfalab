import { PrismaClient } from '../src/generated/prisma'
import * as dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

dotenv.config({ path: '.env', override: true })
dotenv.config({ path: '.env.local', override: true })

const prisma = new PrismaClient()

async function main() {
  const seedAccounts = [
    {
      email: 'admin@wahfalab.com',
      password: 'admin123456',
      full_name: 'WahfaLab Administrator',
      role: 'admin' as const,
    },
    {
      email: 'operator@wahfalab.com',
      password: 'operator123456',
      full_name: 'WahfaLab Operator',
      role: 'operator' as const,
    },
    {
      email: 'petugas.lapangan@wahfalab.com',
      password: 'field123456',
      full_name: 'Petugas Lapangan',
      role: 'field_officer' as const,
    },
    {
      email: 'analyst@wahfalab.com',
      password: 'analyst123456',
      full_name: 'Analis Laboratorium',
      role: 'analyst' as const,
    },
    {
      email: 'reporting@wahfalab.com',
      password: 'reporting123456',
      full_name: 'Staff Reporting',
      role: 'reporting' as const,
    },
    {
      email: 'finance@wahfalab.com',
      password: 'finance123456',
      full_name: 'Finance WahfaLab',
      role: 'finance' as const,
    },
    {
      email: 'client@wahfalab.com',
      password: 'client123456',
      full_name: 'Client Demo',
      role: 'client' as const,
    },
  ]

  console.log('Starting seed for core accounts...')

  for (const account of seedAccounts) {
    const hashedPassword = await bcrypt.hash(account.password, 12)

    await prisma.profile.upsert({
      where: { email: account.email },
      update: {
        role: account.role,
        full_name: account.full_name,
        password: hashedPassword,
      },
      create: {
        full_name: account.full_name,
        role: account.role,
        email: account.email,
        password: hashedPassword,
      },
    })

    console.log(`Seeded ${account.role}: ${account.email}`)
  }

  console.log('Preparing company profile...')
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
      npwp: '01.234.567.8-901.000',
    },
  })
  console.log('Company profile seeded.')

  console.log('Seeding laboratory services...')
  const category = await prisma.serviceCategory.upsert({
    where: { name: 'Kualitas Udara' },
    update: {},
    create: { name: 'Kualitas Udara' },
  })

  await prisma.service.createMany({
    data: [
      {
        name: 'Uji Emisi Sumber Tidak Bergerak',
        price: 5000000,
        category: category.name,
        unit: 'titik sampling',
      },
      {
        name: 'Uji Kualitas Udara Ambient',
        price: 3000000,
        category: category.name,
        unit: 'parameter',
      },
    ],
    skipDuplicates: true,
  })

  console.log('Services seeded.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
