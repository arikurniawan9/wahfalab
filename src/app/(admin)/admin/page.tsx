import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({
    where: { id: user.id }
  })

  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">Beranda Admin</h1>
          <p className="text-slate-500">Selamat datang kembali, {profile.full_name}</p>
        </div>
        <div className="bg-white p-2 rounded-full shadow-sm border border-emerald-50">
          <div className="h-10 w-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
            {profile.full_name?.charAt(0)}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
          <h3 className="text-slate-500 text-sm font-medium">Total Penawaran</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">12</p>
          <span className="text-emerald-600 text-xs font-medium flex items-center mt-2">
            <span className="bg-emerald-100 px-2 py-0.5 rounded mr-2">↑ 12%</span>
            dari bulan lalu
          </span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow border-l-4 border-l-green-500">
          <h3 className="text-slate-500 text-sm font-medium">Order Aktif</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">5</p>
          <span className="text-emerald-500 text-xs font-medium flex items-center mt-2">
            <span className="bg-emerald-100 px-2 py-0.5 rounded mr-2">Sedang Jalan</span>
            Tahap Analisis
          </span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow border-l-4 border-l-teal-500">
          <h3 className="text-slate-500 text-sm font-medium">Pengguna Baru</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">24</p>
          <span className="text-emerald-600 text-xs font-medium flex items-center mt-2">
            <span className="bg-emerald-100 px-2 py-0.5 rounded mr-2">Baru</span>
            Bergabung bulan ini
          </span>
        </div>
      </div>

      {/* Placeholder for Recent Activity */}
      <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Aktivitas Terbaru</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-slate-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">Penawaran Baru #QT-202600{i} dibuat</p>
                <p className="text-xs text-slate-500">2 jam yang lalu oleh Admin</p>
              </div>
              <Button variant="ghost" size="sm">Detail</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Re-import icons that were lost in rewrite
import { FileText } from 'lucide-react'
