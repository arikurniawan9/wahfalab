import { PrismaClient } from './src/generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const admin = await prisma.profile.upsert({
      where: { email: 'admin@wahfalab.com' },
      update: { password: hashedPassword },
      create: {
        email: 'admin@wahfalab.com',
        password: hashedPassword,
        full_name: 'WahfaLab Administrator',
        role: 'admin'
      }
    })
    
    console.log(`✅ Password Admin BERHASIL DIRESET ke: admin123`)
    console.log(`Email Login: admin@wahfalab.com`)
  } catch (error) {
    console.error('ERROR Reset Admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdmin()
