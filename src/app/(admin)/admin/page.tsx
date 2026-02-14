import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/actions/auth'
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  Users, 
  FlaskConical,
  LogOut
} from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({
    where: { id: user.id }
  })

  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white p-6 hidden md:block">
        <div className="flex items-center gap-2 mb-10">
          <img src="/logo-wahfalab.png" alt="Logo" className="h-10 w-auto brightness-0 invert" />
        </div>
        
        <nav className="space-y-4">
          <div className="flex items-center gap-3 text-blue-100 bg-blue-800/50 p-2 rounded-lg">
            <LayoutDashboard className="h-5 w-5" />
            <span>Beranda</span>
          </div>
          <div className="flex items-center gap-3 text-blue-300 hover:text-white transition-colors p-2 cursor-pointer">
            <FileText className="h-5 w-5" />
            <span>Penawaran Harga</span>
          </div>
          <Link href="/admin/users" className="flex items-center gap-3 text-blue-300 hover:text-white transition-colors p-2 cursor-pointer">
            <Users className="h-5 w-5" />
            <span>Data Pengguna</span>
          </Link>
          <div className="flex items-center gap-3 text-blue-300 hover:text-white transition-colors p-2 cursor-pointer">
            <FlaskConical className="h-5 w-5" />
            <span>Katalog Layanan</span>
          </div>
        </nav>

        <div className="absolute bottom-6 w-52">
          <form action={logout}>
            <Button variant="ghost" className="w-full justify-start text-blue-300 hover:text-white hover:bg-blue-800 p-2">
              <LogOut className="mr-2 h-5 w-5" />
              Logout
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
            <p className="text-slate-500">Selamat datang kembali, {profile.full_name}</p>
          </div>
          <div className="bg-white p-2 rounded-full shadow-sm">
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {profile.full_name?.charAt(0)}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 text-sm font-medium">Total Quotation</h3>
            <p className="text-3xl font-bold text-slate-800 mt-2">12</p>
            <span className="text-green-500 text-xs font-medium">↑ 12% dari bulan lalu</span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 text-sm font-medium">Order Aktif</h3>
            <p className="text-3xl font-bold text-slate-800 mt-2">5</p>
            <span className="text-blue-500 text-xs font-medium">Sedang dianalisis</span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-slate-500 text-sm font-medium">Pelanggan Baru</h3>
            <p className="text-3xl font-bold text-slate-800 mt-2">24</p>
            <span className="text-green-500 text-xs font-medium">Bergabung bulan ini</span>
          </div>
        </div>
      </main>
    </div>
  );
}
