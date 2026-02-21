import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log("🛠️  MEMULIHKAN DATABASE...")

  // 1. Bersihkan Admin yang Salah (jika ada ID duplikat yang beda ID)
  await prisma.profile.deleteMany({
    where: { 
      OR: [
        { email: 'admin@wahfalab.com' },
        { role: 'admin' }
      ]
    }
  });

  // 2. Buat profil Admin dengan ID yang TEPAT (61a8ab56-54bc-459a-b765-893d6209208d)
  await prisma.profile.create({
    data: {
      id: '61a8ab56-54bc-459a-b765-893d6209208d',
      email: 'admin@wahfalab.com',
      full_name: 'WahfaLab Administrator',
      role: 'admin'
    }
  });

  console.log("✅ DATABASE TELAH DIPULIHKAN DENGAN ID YANG TEPAT!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
