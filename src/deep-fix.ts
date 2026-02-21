import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function deepFix() {
  console.log("🛠️  PEMBERSIHAN DATABASE TOTAL...")
  
  // Ambil user dari Supabase Auth
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  if (error) throw error

  // Hapus SEMUA profil lama yang ada di Prisma (biar bersih dari ID lama)
  await prisma.profile.deleteMany({})
  console.log("✅ Profil lama telah dihapus.")

  // Buat profil BARU dengan ID yang pas dari Supabase Auth
  for (const user of users) {
    const isMainAdmin = user.email === 'admin@wahfalab.com';
    const isAdmin = isMainAdmin || user.email?.includes('admin');
    const isOperator = user.email?.includes('operator');

    console.log(`+ Menghidupkan akun: ${user.email}`)
    await prisma.profile.create({
      data: {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || (isAdmin ? 'Admin' : 'Customer'),
        role: isAdmin ? 'admin' : (isOperator ? 'operator' : 'client')
      }
    })
  }

  console.log("✨ SEMUA USER SUDAH SINKRON DAN SIAP LOGIN!")
}

deepFix().catch(console.error).finally(() => prisma.$disconnect())
