import { PrismaClient } from './src/generated/prisma'
const prisma = new PrismaClient()

async function main() {
  try {
    const userCount = await prisma.profile.count()
    console.log(`Jumlah user di tabel profiles: ${userCount}`)
    
    if (userCount > 0) {
      const users = await prisma.profile.findMany({
        take: 5,
        select: { email: true, role: true, full_name: true }
      })
      console.log('5 User pertama:', JSON.stringify(users, null, 2))
    } else {
      console.log('Tabel profiles KOSONG! Anda perlu menjalankan database seed.')
    }
  } catch (error) {
    console.error('ERROR Koneksi Database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
