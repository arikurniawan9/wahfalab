import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { FileText, Users, Briefcase, TrendingUp } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const profile = await prisma.profile.findUnique({
    where: { id: user.id }
  })

  if (profile?.role !== 'admin') redirect('/')

  // Fetch real data from database
  const [
    totalQuotations,
    activeOrders,
    totalUsers,
    recentQuotations,
    recentJobOrders
  ] = await Promise.all([
    prisma.quotation.count(),
    prisma.jobOrder.count({
      where: {
        status: {
          in: ['sampling', 'analysis', 'reporting']
        }
      }
    }),
    prisma.profile.count({
      where: {
        role: 'client'
      }
    }),
    prisma.quotation.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        profile: {
          select: {
            full_name: true,
            company_name: true
          }
        }
      }
    }),
    prisma.jobOrder.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        quotation: {
          include: {
            profile: {
              select: {
                full_name: true,
                company_name: true
              }
            }
          }
        }
      }
    })
  ])

  // Calculate month-over-month growth for quotations
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
  
  const quotationsThisMonth = await prisma.quotation.count({
    where: {
      created_at: {
        gte: now
      }
    }
  })
  
  const quotationsLastMonth = await prisma.quotation.count({
    where: {
      created_at: {
        gte: lastMonth,
        lt: now
      }
    }
  })
  
  const growthPercentage = quotationsLastMonth > 0 
    ? Math.round(((quotationsThisMonth - quotationsLastMonth) / quotationsLastMonth) * 100)
    : 0

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  return (
    <div className="p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-900">Beranda Admin</h1>
          <p className="text-slate-500">Selamat datang kembali, {profile.full_name || 'Admin'}</p>
        </div>
        <div className="bg-white p-2 rounded-full shadow-sm border border-emerald-50">
          <div className="h-10 w-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
            {(profile.full_name || 'A').charAt(0)}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Quotations Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-slate-500 text-sm font-medium">Total Penawaran</h3>
              <p className="text-3xl font-bold text-slate-800 mt-2">{totalQuotations}</p>
            </div>
            <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className={`text-xs font-medium flex items-center ${growthPercentage >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              <TrendingUp className="h-3 w-3 mr-1" />
              {growthPercentage >= 0 ? '↑' : '↓'} {Math.abs(growthPercentage)}%
            </span>
            <span className="text-slate-400 text-xs ml-2">dari bulan lalu</span>
          </div>
        </div>

        {/* Active Orders Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-slate-500 text-sm font-medium">Order Aktif</h3>
              <p className="text-3xl font-bold text-slate-800 mt-2">{activeOrders}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-emerald-600 text-xs font-medium bg-emerald-100 px-2 py-1 rounded">
              Sedang Diproses
            </span>
          </div>
        </div>

        {/* Total Users Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-slate-500 text-sm font-medium">Total Klien</h3>
              <p className="text-3xl font-bold text-slate-800 mt-2">{totalUsers}</p>
            </div>
            <div className="h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-teal-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-slate-400 text-xs">Terdaftar di sistem</span>
          </div>
        </div>
      </div>

      {/* Recent Activity - Quotations & Job Orders */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotations */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Penawaran Terbaru
          </h3>
          {recentQuotations.length > 0 ? (
            <div className="space-y-3">
              {recentQuotations.map((quotation) => (
                <div 
                  key={quotation.id} 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {quotation.quotation_number}
                      </p>
                      <p className="text-xs text-slate-500">
                        {quotation.profile?.company_name || quotation.profile?.full_name || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">
                      {formatCurrency(Number(quotation.total_amount))}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(quotation.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">Belum ada penawaran</p>
          )}
        </div>

        {/* Recent Job Orders */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-green-600" />
            Order Pekerjaan Terbaru
          </h3>
          {recentJobOrders.length > 0 ? (
            <div className="space-y-3">
              {recentJobOrders.map((job) => (
                <div 
                  key={job.id} 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {job.tracking_code}
                      </p>
                      <p className="text-xs text-slate-500">
                        {job.quotation?.profile?.company_name || job.quotation?.profile?.full_name || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      job.status === 'completed' ? 'bg-green-100 text-green-700' :
                      job.status === 'analysis' ? 'bg-blue-100 text-blue-700' :
                      job.status === 'sampling' ? 'bg-orange-100 text-orange-700' :
                      job.status === 'reporting' ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {job.status === 'sampling' ? 'Sampling' :
                       job.status === 'analysis' ? 'Analisis' :
                       job.status === 'reporting' ? 'Pelaporan' :
                       job.status === 'completed' ? 'Selesai' :
                       job.status}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(job.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">Belum ada order pekerjaan</p>
          )}
        </div>
      </div>
    </div>
  )
}
