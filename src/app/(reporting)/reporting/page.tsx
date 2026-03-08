"use client";

import React, { useEffect, useState, useCallback } from "react";
import { 
  getReportingDashboard, 
  getJobsReadyForReporting, 
  claimReportingJob 
} from "@/lib/actions/reporting";
import { ChemicalLoader, LoadingOverlay } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckCircle,
  Clock,
  ArrowRight,
  Search,
  User,
  Activity,
  Zap,
  ShieldCheck,
  TrendingUp,
  ChevronRight,
  FlaskConical,
  ClipboardList,
  HandThumbUp,
  Handshake,
  LayoutList
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ReportingDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [readyJobs, setReadyJobs] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashData, readyData] = await Promise.all([
        getReportingDashboard(),
        getJobsReadyForReporting(1, 20)
      ]);
      setDashboard(dashData);
      
      // Filter readyJobs: only show those NOT yet claimed by anyone
      const unclaimed = (readyData.jobOrders || []).filter((j: any) => !j.reporting_id);
      setReadyJobs(unclaimed);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClaimJob = async (jobId: string) => {
    setProcessing(true);
    try {
      const result = await claimReportingJob(jobId);
      if (result.success) {
        toast.success("✅ Tugas berhasil diambil. Membuka lembar kerja...");
        router.push(`/reporting/jobs/${jobId}`);
      } else {
        toast.error(result.error || "Gagal mengambil tugas");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 space-y-6">
        <ChemicalLoader />
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-black text-indigo-900/40 uppercase tracking-[0.4em] animate-pulse">Syncing Reporting Vault</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Available Queue",
      value: readyJobs.length,
      icon: LayoutList,
      color: "text-amber-600",
      bgColor: "bg-amber-100/50",
      description: "Siap diklaim",
      trend: "Public Pool"
    },
    {
      title: "My Active Jobs",
      value: dashboard?.stats?.inProgress || 0,
      icon: Activity,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100/50",
      description: "Penyusunan Laporan",
      trend: "Your Tasks"
    },
    {
      title: "Finalized",
      value: dashboard?.stats?.done || 0,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100/50",
      description: "LHU Terbit",
      trend: "Verified"
    },
    {
      title: "Total Milestone",
      value: dashboard?.stats?.total || 0,
      icon: Zap,
      color: "text-slate-600",
      bgColor: "bg-slate-100/50",
      description: "Total Kontribusi",
      trend: "All Time"
    }
  ];

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      <LoadingOverlay isOpen={processing} title="Mengambil Tugas..." description="Sistem sedang memproses klaim job order Anda" />

      {/* Header Premium */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-8 w-1.5 bg-indigo-600 rounded-full" />
            <h1 className="text-3xl font-black text-emerald-950 tracking-tighter uppercase font-[family-name:var(--font-montserrat)]">
              Reporting Dashboard
            </h1>
          </div>
          <p className="text-slate-500 text-sm font-medium italic pl-5">
            Kelola & Terbitkan Laporan Hasil Uji (LHU) dengan Presisi
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-xl shadow-indigo-900/5 border border-slate-100">
           <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/20">
              <ShieldCheck className="h-7 w-7" />
           </div>
        </div>
      </div>

      {/* Stats Cards Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-none shadow-2xl shadow-indigo-900/5 rounded-[2rem] overflow-hidden bg-white group hover:scale-[1.02] transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-2xl shadow-inner", stat.bgColor)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tighter border-slate-100 text-slate-400">
                   {stat.trend}
                </Badge>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.title}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium italic">{stat.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Table: Available for Claim */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-2xl shadow-indigo-900/5 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-900/20">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight text-emerald-950">Antrean Publik (Tersedia)</CardTitle>
                  <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Klik terima untuk memproses laporan</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {readyJobs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                        <th className="px-8 py-5">Job Details</th>
                        <th className="px-8 py-5">Customer Info</th>
                        <th className="px-8 py-5">Analis</th>
                        <th className="px-8 py-5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {readyJobs.map((job: any) => (
                        <tr key={job.id} className="hover:bg-indigo-50/50 transition-all group">
                          <td className="px-8 py-6">
                             <div className="flex flex-col">
                                <span className="text-xs font-black text-indigo-600 font-mono tracking-tighter mb-1">#{job.tracking_code}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Analysis Done</span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-800 leading-tight">
                                {job.quotation?.profile?.company_name || job.quotation?.profile?.full_name || "-"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium italic mt-1">Verified Client</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-slate-300" />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{job.lab_analysis?.analyst?.full_name || "Lab Analis"}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <Button 
                              onClick={() => handleClaimJob(job.id)}
                              className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-900/20 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
                            >
                              Terima Tugas <Handshake className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-20 text-center">
                   <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mx-auto mb-6">
                      <FileText className="h-8 w-8 text-slate-200" />
                   </div>
                   <h3 className="text-lg font-black text-slate-400 uppercase tracking-tighter">Queue Empty</h3>
                   <p className="text-xs text-slate-300 font-bold uppercase tracking-widest mt-1">Belum ada job order yang menunggu klaim</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: My Active Jobs */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-2xl shadow-indigo-900/5 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-8 pb-4">
               <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  Tugas Aktif Saya
               </h3>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
               {dashboard?.recentJobs?.filter((j: any) => j.status !== 'completed').length > 0 ? (
                 <div className="space-y-4">
                   {dashboard.recentJobs.filter((j: any) => j.status !== 'completed').map((job: any) => (
                      <Link key={job.id} href={`/reporting/jobs/${job.id}`} className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50/30 hover:bg-indigo-50 transition-all border border-indigo-100/50 group">
                         <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                            <Activity className="h-6 w-6" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-800 font-mono tracking-tighter truncate leading-none">#{job.tracking_code}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 truncate">
                               {job.quotation?.profile?.company_name || job.quotation?.profile?.full_name}
                            </p>
                         </div>
                         <ChevronRight className="h-4 w-4 text-indigo-600 transition-colors" />
                      </Link>
                   ))}
                 </div>
               ) : (
                 <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Belum ada tugas aktif</p>
                 </div>
               )}
            </CardContent>
          </Card>

          {/* History Link */}
          <Card className="border-none shadow-2xl shadow-indigo-900/10 rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-8 space-y-6">
             <div className="h-14 w-14 rounded-2xl bg-indigo-600/30 flex items-center justify-center border-2 border-indigo-500/30 shadow-2xl shadow-indigo-950">
                <CheckCircle className="h-7 w-7 text-indigo-400" />
             </div>
             <div>
                <h4 className="text-xl font-black uppercase tracking-tight leading-none mb-2">Riwayat Selesai</h4>
                <p className="text-indigo-200/60 text-xs font-medium leading-relaxed">
                   Lihat semua LHU yang telah Anda terbitkan sebelumnya di sistem.
                </p>
             </div>
             <Link href="/reporting/jobs" className="block">
                <Button className="w-full h-12 bg-white hover:bg-indigo-50 text-indigo-950 font-black text-[10px] uppercase tracking-[2px] rounded-xl shadow-xl shadow-indigo-950/40">
                   Buka Arsip Laporan
                </Button>
             </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
