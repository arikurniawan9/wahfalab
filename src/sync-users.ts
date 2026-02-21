import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function syncAllUsers() {
  console.log("🔄 Mensinkronkan SEMUA User Auth ke Tabel Profile...")
  
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  if (error) throw error

  for (const user of users) {
    const existingProfile = await prisma.profile.findUnique({
      where: { id: user.id }
    })

    if (!existingProfile) {
      console.log(`+ Membuat profil untuk: ${user.email}`)
      await prisma.profile.create({
        data: {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || 'User',
          role: user.email?.includes('admin') ? 'admin' : (user.email?.includes('operator') ? 'operator' : 'client')
        }
      })
    } else {
      console.log(`✅ Profil sudah ok: ${user.email} (${existingProfile.role})`)
    }
  }

  console.log("✨ SEMUA USER SEKARANG SUDAH SINKRON!")
}

syncAllUsers().catch(console.error).finally(() => prisma.$disconnect())
