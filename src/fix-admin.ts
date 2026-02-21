import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fixAdmin() {
  const email = 'admin@wahfalab.com'
  console.log(`🔍 Mencari ID untuk ${email} di Supabase Auth...`)

  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.error("❌ Gagal list users:", error.message)
    return
  }

  const adminUser = users.find(u => u.email === email)

  if (!adminUser) {
    console.error(`❌ User dengan email ${email} tidak ditemukan di Supabase Auth!`)
    return
  }

  console.log(`✅ ID ditemukan: ${adminUser.id}`)
  console.log(`🚀 Mensinkronkan ke tabel Profile...`)

  // Hapus profil admin lama jika ID-nya beda (biasanya hasil seed manual)
  await prisma.profile.deleteMany({
    where: { 
      OR: [
        { role: 'admin' },
        { id: adminUser.id }
      ]
    }
  })

  // Buat profil baru yang SAMA PERSIS dengan ID Auth
  await prisma.profile.create({
    data: {
      id: adminUser.id,
      email: email,
      full_name: 'WahfaLab Administrator',
      role: 'admin'
    }
  })

  console.log(`✨ AKSES ADMIN BERHASIL DIBUKA!`)
  console.log(`Silahkan Refresh halaman /admin Anda.`)
}

fixAdmin().catch(console.error).finally(() => prisma.$disconnect())
