import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  Beaker,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export default async function OperatorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({
    where: { id: user.id }
  })

  if (profile?.role !== 'operator' && profile?.role !== 'admin') redirect('/')

  const [scheduledCount, analysisCount, completedCount, recentJobs] = await Promise.all([
    prisma.jobOrder.count({ where: { status: 'scheduled' } }),
    prisma.jobOrder.count({ where: { status: 'analysis' } }),
    prisma.jobOrder.count({ where: { status: 'completed' } }),
    prisma.jobOrder.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        quotation: {
          include: { 
            profile: true,
            items: { include: { service: true } }
          }
        }
      }
    })
  ])

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900 tracking-tight font-[family-name:var(--font-montserrat)] uppercase">Beranda Petugas</h1>
          <p className="text-slate-500 text-xs font-medium">Monitoring antrean laboratorium WahfaLab.</p>
        </div>
        <div className="h-10 w-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {profile?.full_name?.charAt(0)}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Antrean Baru</h3>
              <p className="text-2xl font-bold text-slate-800">{scheduledCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
              <Beaker className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Proses Analisis</h3>
              <p className="text-2xl font-bold text-slate-800">{analysisCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Selesai</h3>
              <p className="text-2xl font-bold text-slate-800">{completedCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-emerald-900 flex items-center gap-2 text-sm uppercase tracking-wide">
            <ClipboardList className="h-4 w-4" />
            Pekerjaan Terbaru
          </h3>
          <Link href="/operator/jobs">
            <Button variant="ghost" size="sm" className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest">
              Lihat Semua
            </Button>
          </Link>
        </div>
        
        <div className="divide-y divide-slate-100">
          {recentJobs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 text-xs italic">Belum ada data.</p>
            </div>
          ) : (
            recentJobs.map((job) => (
              <div key={job.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                    JOB
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold text-emerald-600 tracking-wider">{job.tracking_code}</span>
                      <Badge variant="outline" className="text-[8px] h-4 px-1.5 font-bold uppercase">{job.status}</Badge>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">{job.quotation.items[0]?.service?.name || 'Uji Analisis'}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Customer: {job.quotation.profile.full_name}</p>
                  </div>
                </div>
                <Link href="/operator/jobs">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 px-4 text-xs font-bold rounded-lg">
                    Detail
                  </Button>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
