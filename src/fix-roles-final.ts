import { PrismaClient } from './generated/prisma'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env', override: true })
dotenv.config({ path: '.env.local', override: true })

const prisma = new PrismaClient()

async function fixRoles() {
  console.log("🛠️  MEMPERBAIKI ROLE USER PENGUJIAN...")

  // Update Admin
  await prisma.profile.updateMany({
    where: { email: 'admin@wahfalab.com' },
    data: { role: 'admin' }
  });

  // Update Operator
  await prisma.profile.updateMany({
    where: { email: 'op@gmail.com' },
    data: { role: 'operator' }
  });

  // Update Petugas Lapangan
  await prisma.profile.updateMany({
    where: { email: 'petugas@gmail.com' },
    data: { role: 'field_officer' }
  });

  // Update Customer
  await prisma.profile.updateMany({
    where: { email: 'ari@gmail.com' },
    data: { role: 'client' }
  });

  console.log("✅ SEMUA ROLE TELAH DIPERBAIKI!")
  
  const allProfiles = await prisma.profile.findMany({
    select: { email: true, role: true }
  });
  console.log("Daftar Akun & Role Aktif:", allProfiles);
}

fixRoles().catch(console.error).finally(() => prisma.$disconnect());
