import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ClipboardList,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  Calendar,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { getMySamplingAssignments } from '@/lib/actions/sampling'

export default async function FieldDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({
    where: { id: user.id }
  })

  if (profile?.role !== 'field_officer' && profile?.role !== 'admin') redirect('/')

  const assignmentsData = await getMySamplingAssignments(1, 5)
  const assignments = assignmentsData.items || []

  // Hitung status
  const pendingCount = assignmentsData.items?.filter((a: any) => a.status === 'pending').length || 0
  const inProgressCount = assignmentsData.items?.filter((a: any) => a.status === 'in_progress').length || 0
  const completedCount = assignmentsData.items?.filter((a: any) => a.status === 'completed').length || 0

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900 tracking-tight font-[family-name:var(--font-montserrat)] uppercase">Petugas Lapangan</h1>
          <p className="text-slate-500 text-xs font-medium">Kelola pengambilan sampel lapangan.</p>
        </div>
        <div className="h-10 w-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {profile?.full_name?.charAt(0)}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Menunggu</h3>
              <p className="text-2xl font-bold text-slate-800">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Dalam Proses</h3>
              <p className="text-2xl font-bold text-slate-800">{inProgressCount}</p>
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-emerald-900 flex items-center gap-2 text-sm uppercase tracking-wide">
            <ClipboardList className="h-4 w-4" />
            Assignment Terbaru
          </h3>
          <Link href="/field/assignments">
            <Button variant="ghost" size="sm" className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest">
              Lihat Semua <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {assignments.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-xs italic">Belum ada assignment sampling.</p>
            </div>
          ) : (
            assignments.map((assignment: any) => (
              <div key={assignment.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                    SMP
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold text-emerald-600 tracking-wider">{assignment.job_order.tracking_code}</span>
                      <Badge variant="outline" className={cn(
                        "text-[8px] h-4 px-1.5 font-bold uppercase",
                        assignment.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      )}>
                        {assignment.status}
                      </Badge>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">{assignment.job_order.quotation.items[0]?.service?.name || 'Sampling'}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {assignment.location}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(assignment.scheduled_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
                <Link href={`/field/assignments/${assignment.id}`}>
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
  )
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}
