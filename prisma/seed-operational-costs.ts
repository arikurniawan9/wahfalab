import { PrismaClient } from '../src/generated/prisma'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env', override: true })
dotenv.config({ path: '.env.local', override: true })

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding operational costs (engineer & transport)...')

  // =====================================================
  // BIAYA ENGINEER (PERDIEM)
  // =====================================================
  const engineerCosts = [
    // Local areas
    {
      category: 'perdiem' as const,
      perdiem_type: 'local',
      location: 'Jakarta',
      name: 'Biaya Perdiem Engineer - Jakarta',
      description: 'Biaya konsumsi engineer untuk sampling di area Jakarta dan sekitarnya',
      price: 150000,
      unit: 'hari',
    },
    {
      category: 'perdiem' as const,
      perdiem_type: 'local',
      location: 'Tangerang',
      name: 'Biaya Perdiem Engineer - Tangerang',
      description: 'Biaya konsumsi engineer untuk sampling di area Tangerang',
      price: 150000,
      unit: 'hari',
    },
    {
      category: 'perdiem' as const,
      perdiem_type: 'local',
      location: 'Bekasi',
      name: 'Biaya Perdiem Engineer - Bekasi',
      description: 'Biaya konsumsi engineer untuk sampling di area Bekasi',
      price: 150000,
      unit: 'hari',
    },
    {
      category: 'perdiem' as const,
      perdiem_type: 'local',
      location: 'Depok',
      name: 'Biaya Perdiem Engineer - Depok',
      description: 'Biaya konsumsi engineer untuk sampling di area Depok',
      price: 150000,
      unit: 'hari',
    },
    {
      category: 'perdiem' as const,
      perdiem_type: 'local',
      location: 'Bogor',
      name: 'Biaya Perdiem Engineer - Bogor',
      description: 'Biaya konsumsi engineer untuk sampling di area Bogor',
      price: 175000,
      unit: 'hari',
    },
    // Out of town
    {
      category: 'perdiem' as const,
      perdiem_type: 'out_of_town',
      location: 'Jawa Barat',
      name: 'Biaya Perdiem Engineer - Jawa Barat',
      description: 'Biaya konsumsi engineer untuk sampling di area Jawa Barat (Bandung, Cirebon, dll)',
      price: 250000,
      unit: 'hari',
    },
    {
      category: 'perdiem' as const,
      perdiem_type: 'out_of_town',
      location: 'Jawa Tengah',
      name: 'Biaya Perdiem Engineer - Jawa Tengah',
      description: 'Biaya konsumsi engineer untuk sampling di area Jawa Tengah (Semarang, Solo, dll)',
      price: 275000,
      unit: 'hari',
    },
    {
      category: 'perdiem' as const,
      perdiem_type: 'out_of_town',
      location: 'Jawa Timur',
      name: 'Biaya Perdiem Engineer - Jawa Timur',
      description: 'Biaya konsumsi engineer untuk sampling di area Jawa Timur (Surabaya, Malang, dll)',
      price: 275000,
      unit: 'hari',
    },
    {
      category: 'perdiem' as const,
      perdiem_type: 'out_of_town',
      location: 'Banten',
      name: 'Biaya Perdiem Engineer - Banten',
      description: 'Biaya konsumsi engineer untuk sampling di area Banten (Serang, Cilegon, dll)',
      price: 200000,
      unit: 'hari',
    },
    {
      category: 'perdiem' as const,
      perdiem_type: 'out_of_town',
      location: 'Lampung',
      name: 'Biaya Perdiem Engineer - Lampung',
      description: 'Biaya konsumsi engineer untuk sampling di area Lampung',
      price: 300000,
      unit: 'hari',
    },
    {
      category: 'perdiem' as const,
      perdiem_type: 'out_of_town',
      location: 'Bali',
      name: 'Biaya Perdiem Engineer - Bali',
      description: 'Biaya konsumsi engineer untuk sampling di area Bali',
      price: 350000,
      unit: 'hari',
    },
    {
      category: 'perdiem' as const,
      perdiem_type: 'out_of_town',
      location: 'Sumatera',
      name: 'Biaya Perdiem Engineer - Sumatera',
      description: 'Biaya konsumsi engineer untuk sampling di area Sumatera',
      price: 400000,
      unit: 'hari',
    },
    {
      category: 'perdiem' as const,
      perdiem_type: 'out_of_town',
      location: 'Kalimantan',
      name: 'Biaya Perdiem Engineer - Kalimantan',
      description: 'Biaya konsumsi engineer untuk sampling di area Kalimantan',
      price: 400000,
      unit: 'hari',
    },
    {
      category: 'perdiem' as const,
      perdiem_type: 'out_of_town',
      location: 'Sulawesi',
      name: 'Biaya Perdiem Engineer - Sulawesi',
      description: 'Biaya konsumsi engineer untuk sampling di area Sulawesi',
      price: 400000,
      unit: 'hari',
    },
  ]

  // =====================================================
  // BIAYA TRANSPORT
  // =====================================================
  const transportCosts = [
    // Local
    {
      category: 'transport' as const,
      location: 'Jakarta',
      distance_category: 'local',
      name: 'Transport Sampling - Jakarta Lokal',
      description: 'Biaya transportasi untuk sampling di area Jakarta (maks. 50 km)',
      price: 200000,
      unit: 'trip',
    },
    {
      category: 'transport' as const,
      location: 'Jabodetabek',
      distance_category: 'local',
      name: 'Transport Sampling - Jabodetabek',
      description: 'Biaya transportasi untuk sampling di area Jabodetabek (maks. 100 km)',
      price: 350000,
      unit: 'trip',
    },
    // Medium distance (100-250 km)
    {
      category: 'transport' as const,
      location: 'Jawa Barat',
      distance_category: 'medium',
      name: 'Transport Sampling - Jawa Barat',
      description: 'Biaya transportasi untuk sampling di area Jawa Barat (100-250 km)',
      price: 750000,
      unit: 'trip',
    },
    {
      category: 'transport' as const,
      location: 'Jawa Tengah',
      distance_category: 'medium',
      name: 'Transport Sampling - Jawa Tengah',
      description: 'Biaya transportasi untuk sampling di area Jawa Tengah (100-250 km)',
      price: 1000000,
      unit: 'trip',
    },
    {
      category: 'transport' as const,
      location: 'Jawa Timur',
      distance_category: 'medium',
      name: 'Transport Sampling - Jawa Timur',
      description: 'Biaya transportasi untuk sampling di area Jawa Timur (100-250 km)',
      price: 1200000,
      unit: 'trip',
    },
    {
      category: 'transport' as const,
      location: 'Banten',
      distance_category: 'medium',
      name: 'Transport Sampling - Banten',
      description: 'Biaya transportasi untuk sampling di area Banten (100-250 km)',
      price: 600000,
      unit: 'trip',
    },
    // Long distance (>250 km)
    {
      category: 'transport' as const,
      location: 'Lampung',
      distance_category: 'long',
      name: 'Transport Sampling - Lampung',
      description: 'Biaya transportasi untuk sampling di area Lampung (>250 km)',
      price: 2000000,
      unit: 'trip',
    },
    {
      category: 'transport' as const,
      location: 'Bali',
      distance_category: 'long',
      name: 'Transport Sampling - Bali',
      description: 'Biaya transportasi untuk sampling di area Bali (>250 km)',
      price: 2500000,
      unit: 'trip',
    },
    {
      category: 'transport' as const,
      location: 'Sumatera',
      distance_category: 'long',
      name: 'Transport Sampling - Sumatera',
      description: 'Biaya transportasi untuk sampling di area Sumatera (>250 km)',
      price: 3500000,
      unit: 'trip',
    },
    {
      category: 'transport' as const,
      location: 'Kalimantan',
      distance_category: 'long',
      name: 'Transport Sampling - Kalimantan',
      description: 'Biaya transportasi untuk sampling di area Kalimantan (>250 km)',
      price: 4000000,
      unit: 'trip',
    },
    {
      category: 'transport' as const,
      location: 'Sulawesi',
      distance_category: 'long',
      name: 'Transport Sampling - Sulawesi',
      description: 'Biaya transportasi untuk sampling di area Sulawesi (>250 km)',
      price: 4500000,
      unit: 'trip',
    },
    // Accommodation
    {
      category: 'transport' as const,
      location: 'General',
      distance_category: 'accommodation',
      name: 'Akomodasi Engineer',
      description: 'Biaya akomodasi/hotel untuk engineer saat sampling luar kota',
      price: 500000,
      unit: 'malam',
    },
  ]

  // Insert engineer costs
  console.log(`📝 Inserting ${engineerCosts.length} engineer cost items...`)
  for (const cost of engineerCosts) {
    await prisma.operationalCatalog.create({
      data: cost,
    })
  }
  console.log('✅ Engineer costs inserted!')

  // Insert transport costs
  console.log(`🚚 Inserting ${transportCosts.length} transport cost items...`)
  for (const cost of transportCosts) {
    await prisma.operationalCatalog.create({
      data: cost,
    })
  }
  console.log('✅ Transport costs inserted!')

  // Summary
  const total = await prisma.operationalCatalog.count()
  const perdiemCount = await prisma.operationalCatalog.count({
    where: { category: 'perdiem' }
  })
  const transportCount = await prisma.operationalCatalog.count({
    where: { category: 'transport' }
  })

  console.log('\n📊 Summary:')
  console.log(`   Total items: ${total}`)
  console.log(`   Engineer costs (perdiem): ${perdiemCount}`)
  console.log(`   Transport costs: ${transportCount}`)
  console.log('\n✨ Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
