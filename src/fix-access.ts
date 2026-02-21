import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  console.log("🚀 MENGATUR ULANG AKSES PROFIL...")
  
  // Pastikan Admin ID: 61a8ab56-54bc-459a-b765-893d6209208d benar-benar ada dan role-nya admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', '61a8ab56-54bc-459a-b765-893d6209208d')
    .maybeSingle();

  if (profileError) {
    console.error("❌ Gagal menarik profil:", profileError.message);
  }

  if (!profile) {
    console.log("⚠️ Profil tidak ditemukan! Membuat ulang...");
    await supabase.from('profiles').insert({
      id: '61a8ab56-54bc-459a-b765-893d6209208d',
      email: 'admin@wahfalab.com',
      full_name: 'WahfaLab Administrator',
      role: 'admin'
    });
  } else {
    console.log("✅ Profil ditemukan dengan role:", profile.role);
    if (profile.role !== 'admin') {
      console.log("⚠️ Role salah! Mengubah ke admin...");
      await supabase.from('profiles').update({ role: 'admin' }).eq('id', profile.id);
    }
  }

  console.log("✨ AKSES DAN ROLE TELAH DISINKRONKAN!");
}

main().catch(console.error);
