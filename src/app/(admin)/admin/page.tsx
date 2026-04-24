import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Package,
  Plus,
} from "lucide-react";
import { getAdminDashboardData } from "@/lib/actions/dashboard";
import type { AdminDashboardData } from "@/lib/actions/dashboard";
import { PremiumStatCard } from "@/components/admin/PremiumStatCard";
import { PremiumCharts } from "@/components/admin/PremiumCharts";
import { ActivityTimeline } from "@/components/admin/ActivityTimeline";
import { DashboardRefreshButton } from "@/components/admin/DashboardRefreshButton";

export const dynamic = "force-dynamic";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

export default async function PremiumAdminDashboard() {
  const session = await auth();
  const user = session?.user;

  if (!user) {
    redirect("/login");
  }

  const adminProfile = user.email
    ? await prisma.profile.findUnique({
        where: { email: user.email },
        select: { full_name: true },
      })
    : null;

  let displayAdminName =
    adminProfile?.full_name?.trim() ||
    (typeof user.name === "string" ? user.name.trim() : "") ||
    "";

  if (!displayAdminName || displayAdminName.toLowerCase() === "wahfalab") {
    displayAdminName = user.email?.split("@")[0] || "Admin";
  }

  const dashboardData: AdminDashboardData = await getAdminDashboardData();

  const attentionItems = [
    {
      id: "approvals",
      label: "Permintaan Persetujuan",
      description: "Menunggu review admin",
      count: dashboardData.attention.pendingApprovals,
      href: "/admin/settings/audit-logs",
      icon: AlertCircle,
      iconWrapClass: "bg-amber-100",
      iconClass: "text-amber-600",
      hoverClass: "hover:bg-amber-50 hover:border-amber-200",
      arrowClass: "group-hover:text-amber-600",
    },
    {
      id: "quotations",
      label: "Penawaran Terkirim",
      description: "Perlu tindak lanjut status",
      count: dashboardData.attention.quotationsToFollowUp,
      href: "/admin/quotations",
      icon: FileText,
      iconWrapClass: "bg-blue-100",
      iconClass: "text-blue-600",
      hoverClass: "hover:bg-blue-50 hover:border-blue-200",
      arrowClass: "group-hover:text-blue-600",
    },
    {
      id: "jobs",
      label: "Order Belum Terjadwal",
      description: "Perlu penugasan sampling",
      count: dashboardData.attention.unscheduledJobs,
      href: "/admin/sampling",
      icon: Package,
      iconWrapClass: "bg-rose-100",
      iconClass: "text-rose-600",
      hoverClass: "hover:bg-rose-50 hover:border-rose-200",
      arrowClass: "group-hover:text-rose-600",
    },
  ].filter((item) => item.count > 0);

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 min-h-screen">
      <header className="mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-teal-600/5 to-emerald-600/5 rounded-3xl blur-3xl" />

        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl blur-sm opacity-50" />
              <div className="relative h-14 w-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                {(displayAdminName || "A").charAt(0).toUpperCase()}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {getGreeting()}, {displayAdminName}
                </h1>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                  Admin
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <DashboardRefreshButton />
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <PremiumStatCard
          title="Total Penawaran"
          value={dashboardData.summary.totalQuotations}
          icon="FileText"
          gradient="from-emerald-500 to-teal-500"
          trend={dashboardData.growthPercentage}
          trendLabel="vs bulan lalu"
          sparkline={dashboardData.weeklyStats.quotations}
          compact
          quickAction={{
            label: "Lihat Semua",
            href: "/admin/quotations",
          }}
        />

        <PremiumStatCard
          title="Order Aktif"
          value={dashboardData.summary.activeOrders}
          icon="Briefcase"
          gradient="from-blue-500 to-indigo-500"
          trendLabel="7 hari terakhir"
          sparkline={dashboardData.weeklyStats.jobs}
          status="active"
          compact
          quickAction={{
            label: "Kelola Order",
            href: "/admin/jobs",
          }}
        />

        <PremiumStatCard
          title="Total Klien"
          value={dashboardData.summary.totalUsers}
          icon="Users"
          gradient="from-violet-500 to-purple-500"
          trendLabel="aktif di sistem"
          status="positive"
          compact
          quickAction={{
            label: "Kelola Klien",
            href: "/admin/customers",
          }}
        />

        <PremiumStatCard
          title="Pendapatan"
          value={formatCurrency(dashboardData.summary.totalRevenue)}
          icon="Banknote"
          gradient="from-amber-500 to-orange-500"
          trendLabel="invoice lunas"
          isCurrency
          status="positive"
          compact
          quickAction={{
            label: "Lihat Keuangan",
            href: "/admin/finance",
          }}
        />
      </div>

      <PremiumCharts
        quotationTrend={dashboardData.quotationTrend}
        jobStatus={dashboardData.jobStatus}
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityTimeline activities={dashboardData.activityFeed} />
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Perlu Perhatian</h3>
                    <p className="text-xs text-slate-500">Menunggu tindakan Anda</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-500 text-white text-xs font-black rounded-full">
                  {dashboardData.attention.total}
                </span>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {attentionItems.length > 0 ? (
                attentionItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`w-full p-2.5 rounded-xl bg-slate-50 border border-slate-100 transition-all text-left group block ${item.hoverClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center ${item.iconWrapClass}`}
                        >
                          <item.icon className={`h-4 w-4 ${item.iconClass}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2 py-1 rounded-lg bg-white text-slate-700 border border-slate-200">
                          {item.count}
                        </span>
                        <ArrowUpRight
                          className={`h-4 w-4 text-slate-400 transition-colors ${item.arrowClass}`}
                        />
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">Semua Beres!</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Tidak ada yang perlu ditindaklanjuti
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Jadwal Hari Ini</h3>
                    <p className="text-xs text-slate-500">
                      {new Date().toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black px-2 py-1 rounded-lg bg-slate-100 text-slate-700">
                  {dashboardData.todaysSchedule.length}
                </span>
              </div>
            </div>
            <div className="p-3 space-y-2.5">
              {dashboardData.todaysSchedule.length > 0 ? (
                dashboardData.todaysSchedule.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div
                      className={`h-2 w-2 rounded-full mt-2 ${index % 2 === 0 ? "bg-emerald-500" : "bg-blue-500"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        Sampling - {item.customerName}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(item.scheduledDate).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        • {item.location}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 truncate">
                        {item.trackingCode} • PIC: {item.fieldOfficer}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm font-bold text-slate-700">Belum ada jadwal hari ini</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Tambahkan penugasan sampling untuk operasional lapangan.
                  </p>
                </div>
              )}
              <Link
                href="/admin/sampling"
                className="w-full p-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-center block"
              >
                <Plus className="h-4 w-4 text-slate-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-500">Kelola Penjadwalan</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
