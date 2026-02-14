import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function syncEmails() {
  console.log('🔄 Memulai sinkronisasi email...')
  
  // 1. Ambil semua user dari Supabase Auth
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.error('❌ Gagal mengambil data auth:', error.message)
    return
  }

  console.log(`📂 Ditemukan ${users.length} user di Supabase Auth.`)

  // 2. Update setiap profil di Prisma
  for (const user of users) {
    try {
      await (prisma.profile as any).update({
        where: { id: user.id },
        data: { email: user.email }
      })
      console.log(`✅ Email disinkronkan untuk: ${user.email}`)
    } catch (e: any) {
      console.log(`ℹ️ Lewati ${user.id}: ${e.message}`)
    }
  }

  console.log('✨ Sinkronisasi selesai!')
}

syncEmails()
  .finally(async () => await prisma.$disconnect())
