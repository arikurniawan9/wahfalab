// ============================================================================
// PREMIUM OPERATOR DASHBOARD - v3.0
// Designed for maximum productivity and clear operational visibility.
// ============================================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Beaker,
  ArrowRight,
  Search,
  Filter,
  RefreshCw,
  FlaskConical,
  FileText,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  ChevronRight,
  Truck,
  TestTube,
  TrendingUp,
  LayoutGrid,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { ChemicalLoader } from "@/components/ui";
import { getJobOrders } from "@/lib/actions/jobs";
import { getProfile } from "@/lib/actions/auth";
import { getAllServices } from "@/lib/actions/services";
import { getAllCategories } from "@/lib/actions/categories";
import { getAuditLogsAction as getAuditLogs } from "@/lib/actions/audit";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { PremiumPageWrapper, PremiumCard } from "@/components/layout/PremiumPageWrapper";
import { motion, AnimatePresence } from "framer-motion";

const statusConfig: Record<string, { label: string; color: string; icon: any; progress: number; theme: string }> = {
  scheduled: { label: 'Terjadwal', color: 'text-blue-600', theme: 'bg-blue-50 border-blue-100', icon: Clock, progress: 20 },
  sampling: { label: 'Sampling', color: 'text-amber-600', theme: 'bg-amber-50 border-amber-100', icon: Truck, progress: 40 },
  analysis: { label: 'Analisis Lab', color: 'text-purple-600', theme: 'bg-purple-50 border-purple-100', icon: TestTube, progress: 60 },
  reporting: { label: 'Pelaporan', color: 'text-indigo-600', theme: 'bg-indigo-50 border-indigo-100', icon: FileText, progress: 80 },
  completed: { label: 'Selesai', color: 'text-emerald-600', theme: 'bg-emerald-50 border-emerald-100', icon: CheckCircle2, progress: 100 }
};

const progressSteps = [
  { key: 'scheduled', label: 'Terjadwal', icon: Clock },
  { key: 'sampling', label: 'Sampling', icon: Truck },
  { key: 'analysis', label: 'Analisis Lab', icon: TestTube },
  { key: 'reporting', label: 'Pelaporan', icon: FileText },
  { key: 'completed', label: 'Selesai', icon: CheckCircle2 }
];

export default function OperatorDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [servicePage, setServicePage] = useState(1);
  const SERVICE_PER_PAGE = 5;

  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState({
    scheduled: 0,
    sampling: 0,
    analysis: 0,
    reporting: 0,
    completed: 0,
    total: 0,
    stuck: 0
  });

  const loadData = useCallback(async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    else setLoading(true);

    try {
      const [prof, jobsData, servicesData, categoriesData, auditData] = await Promise.all([
        getProfile(),
        getJobOrders(1, 50),
        getAllServices(),
        getAllCategories(),
        getAuditLogs({ page: 1, limit: 5 }) // Ambil 5 riwayat aktivitas terbaru
      ]);

      setProfile(prof);
      setJobs(jobsData.items || []);
      setServices(servicesData);
      setCategories(categoriesData);
      setAuditLogs(auditData.logs || []);

      // Calculate stats
      const jobList = jobsData.items || [];
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const stuckJobs = jobList.filter((j: any) =>
        j.status !== 'completed' && new Date(j.created_at) < threeDaysAgo
      );

      setStats({
        scheduled: jobList.filter((j: any) => j.status === 'scheduled').length,
        sampling: jobList.filter((j: any) => j.status === 'sampling').length,
        analysis: jobList.filter((j: any) => j.status === 'analysis').length,
        reporting: jobList.filter((j: any) => j.status === 'reporting').length,
        completed: jobList.filter((j: any) => j.status === 'completed').length,
        total: jobList.length,
        stuck: stuckJobs.length
      });

      if (showRefreshToast) {
        toast.success("Dashboard Terkini", {
          description: "Data pekerjaan dan riwayat aktivitas telah diperbarui."
        });
      }
    } catch (error: any) {
      toast.error("Sinkronisasi Gagal");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, [loadData]);

  // Filter & Search
  const filteredJobs = jobs.filter((job: any) => {
    const matchesSearch = search === "" ||
      job.tracking_code.toLowerCase().includes(search.toLowerCase()) ||
      job.quotation?.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      job.quotation?.items?.[0]?.service?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === "all" || job.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const recentJobs = filteredJobs.slice(0, 8);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <ChemicalLoader />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 space-y-10">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-8 w-1 bg-emerald-600 rounded-full" />
            <h1 className="text-3xl font-black text-emerald-950 tracking-tighter uppercase font-[family-name:var(--font-montserrat)]">
              Operasional Center
            </h1>
          </div>
          <p className="text-slate-500 text-sm font-medium italic pl-4">
            Selamat bekerja, <span className="text-emerald-700 font-bold not-italic">{profile?.full_name}</span>. Pantau antrean hari ini.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          {stats.stuck > 0 && (
            <Badge className="bg-rose-500 text-white font-black text-[10px] animate-pulse h-10 px-4 rounded-xl border-none">
              <AlertCircle className="h-3 w-3 mr-2" />
              {stats.stuck} PEKERJAAN TERHAMBAT
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="h-10 w-10 rounded-xl hover:bg-emerald-50 text-emerald-600"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
          <div className="h-10 px-4 flex items-center gap-3 border-l border-slate-100">
             <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Status Anda</p>
                <p className="text-[11px] font-bold text-emerald-600 uppercase">Aktif (Operator)</p>
             </div>
             <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-emerald-900/20">
                {profile?.full_name?.charAt(0) || "O"}
             </div>
          </div>
        </div>
      </div>

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Antrean" value={stats.scheduled} icon={Clock} color="blue" onClick={() => setFilterStatus("scheduled")} active={filterStatus === "scheduled"} />
        <StatCard title="Sampling" value={stats.sampling} icon={Truck} color="amber" onClick={() => setFilterStatus("sampling")} active={filterStatus === "sampling"} />
        <StatCard title="Analisis" value={stats.analysis} icon={TestTube} color="purple" onClick={() => setFilterStatus("analysis")} active={filterStatus === "analysis"} />
        <StatCard title="Pelaporan" value={stats.reporting} icon={FileText} color="indigo" onClick={() => setFilterStatus("reporting")} active={filterStatus === "reporting"} />
        <StatCard title="Selesai" value={stats.completed} icon={CheckCircle2} color="emerald" onClick={() => setFilterStatus("completed")} active={filterStatus === "completed"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Jobs Section */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                <ClipboardList className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black text-emerald-950 uppercase tracking-tight">Antrean Aktif</h2>
            </div>
            <Link href="/operator/jobs">
              <Button variant="link" className="text-emerald-600 font-bold text-xs uppercase tracking-widest hover:no-underline flex items-center gap-1 group">
                Semua Pekerjaan <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Search & Mini Filter Bar */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              placeholder="Cari kode tracking, klien, atau jenis layanan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white border-slate-200 rounded-2xl shadow-sm focus-visible:ring-emerald-500 transition-all text-sm font-medium outline-none focus:border-emerald-500 border-2"
            />
          </div>

          {/* Jobs List */}
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
                <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-10 w-10 text-slate-200" />
                </div>
                <h4 className="font-bold text-slate-700 uppercase text-sm tracking-widest">Data Tidak Ditemukan</h4>
                <p className="text-slate-400 text-xs mt-1">Coba sesuaikan kata kunci atau filter Anda.</p>
              </div>
            ) : (
              recentJobs.map((job: any) => {
                const config = statusConfig[job.status] || statusConfig.scheduled;
                const StatusIcon = config.icon;
                const isStuck = job.status !== 'completed' && new Date(job.created_at) < (new Date(Date.now() - 3 * 24 * 60 * 60 * 1000));
                
                return (
                  <Card 
                    key={job.id} 
                    className={cn(
                      "group border-none shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300 rounded-[1.5rem] overflow-hidden cursor-pointer",
                      isStuck && "ring-2 ring-rose-100 bg-rose-50/10"
                    )}
                    onClick={() => { setSelectedJob(job); setIsDetailOpen(true); }}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row items-stretch">
                        {/* Status Side Indicator */}
                        <div className={cn("w-2 shrink-0 transition-all duration-300", isStuck ? "bg-rose-500" : config.color.replace('text', 'bg'))} />
                        
                        <div className="p-5 flex-1 space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "font-mono text-xs font-black px-2 py-0.5 rounded uppercase tracking-tighter",
                                  isStuck ? "text-rose-700 bg-rose-100" : "text-emerald-700 bg-emerald-100"
                                )}>
                                  {job.tracking_code}
                                </span>
                                {isStuck && (
                                  <Badge className="bg-rose-100 text-rose-600 text-[8px] font-black border-none uppercase h-4">
                                    Stuck &gt; 3 Hari
                                  </Badge>
                                )}
                                <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(job.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                </span>
                              </div>
                              <h4 className="font-black text-slate-800 text-base leading-tight">
                                {job.quotation?.items?.[0]?.service?.name || 'Layanan Laboratorium'}
                              </h4>
                              
                              {/* Display Parameters as Tags */}
                              {job.quotation?.items?.[0]?.parameter_snapshot && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {job.quotation.items[0].parameter_snapshot.split(", ").slice(0, 4).map((p: string, pIdx: number) => (
                                    <Badge key={pIdx} variant="secondary" className="bg-blue-50 text-blue-600 font-bold text-[8px] uppercase border-blue-100 h-5 px-2 rounded-md shadow-sm">
                                      {p}
                                    </Badge>
                                  ))}
                                  {job.quotation.items[0].parameter_snapshot.split(", ").length > 4 && (
                                    <span className="text-[8px] font-black text-slate-400 mt-1">
                                      +{job.quotation.items[0].parameter_snapshot.split(", ").length - 4} Lainya
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center gap-3 pt-1">
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight flex items-center gap-1.5">
                                  <User className="h-3 w-3 text-emerald-600" />
                                  {job.quotation?.profile?.full_name}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                               <Badge variant="outline" className={cn("border-2 font-black text-[9px] uppercase px-3 py-1 rounded-full", config.theme, config.color)}>
                                 <StatusIcon className="h-3 w-3 mr-1.5" />
                                 {config.label}
                               </Badge>
                               <div className="text-right">
                                  <p className="text-[9px] font-black text-slate-400 uppercase">Progress</p>
                                  <p className="text-lg font-black text-emerald-950 leading-none">{config.progress}%</p>
                               </div>
                            </div>
                          </div>

                          {/* Simplified Progress Line */}
                          <div className="relative pt-2">
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full transition-all duration-700 ease-out", isStuck ? "bg-rose-400" : config.color.replace('text', 'bg'))}
                                style={{ width: `${config.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Right Sidebar: Master Info & Audit Log */}
        <div className="lg:col-span-4 space-y-8">
          {/* Quick Services Tooltip */}
          <div className="bg-emerald-950 rounded-[2rem] p-6 text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-48 w-48 bg-emerald-900 rounded-full opacity-50 blur-3xl" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-900/50 border border-emerald-800">
                  <LayoutGrid className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Katalog Master</h3>
                  <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest leading-none">WahfaLab Inventory</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center bg-emerald-900/30 p-4 rounded-2xl border border-emerald-800/50 group hover:bg-emerald-900/50 transition-colors cursor-pointer" onClick={() => setIsServicesModalOpen(true)}>
                  <div className="flex items-center gap-3">
                    <FlaskConical className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-sm font-bold">Layanan Lab</p>
                      <p className="text-[10px] text-emerald-500 font-bold">{services.length} Terdaftar</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-emerald-800 text-emerald-400">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex justify-between items-center bg-emerald-900/30 p-4 rounded-2xl border border-emerald-800/50 group hover:bg-emerald-900/50 transition-colors cursor-pointer" onClick={() => setIsCategoriesModalOpen(true)}>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-sm font-bold">Kategori</p>
                      <p className="text-[10px] text-emerald-500 font-bold">{categories.length} Bidang</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-emerald-800 text-emerald-400">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-emerald-900/50 p-4 rounded-2xl border border-dashed border-emerald-700 text-center">
                 <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-tighter mb-2">Penawaran Cepat?</p>
                 <Button 
                   onClick={() => setIsQuotationModalOpen(true)}
                   className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase h-10 rounded-xl shadow-lg shadow-black/20"
                 >
                   Buat Penawaran
                 </Button>
              </div>
            </div>
          </div>

          {/* Recent Activity Widget (Audit Log) */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm overflow-hidden relative">
             <div className="flex items-center justify-between mb-6">
               <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                 <ClipboardList className="h-4 w-4 text-emerald-600" />
                 Aktivitas Terbaru
               </h3>
               <Link href="/admin/audit-logs">
                 <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-slate-50">
                   <ChevronRight className="h-4 w-4 text-slate-400" />
                 </Button>
               </Link>
             </div>
             
             <div className="space-y-6">
                {auditLogs.length === 0 ? (
                  <p className="text-[10px] text-slate-400 font-bold text-center py-4">Belum ada riwayat aktivitas.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="relative pl-6 pb-6 border-l-2 border-slate-50 last:border-0 last:pb-0">
                      <div className="absolute left-[-5px] top-0 h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <p className="text-[10px] font-black text-emerald-700 uppercase leading-none">
                            {log.action.replace('_', ' ')}
                          </p>
                          <span className="text-[8px] font-bold text-slate-300 uppercase">
                            {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-800 leading-tight">
                          {log.user_email?.split('@')[0]} mengelola {log.entity_type.replace('_', ' ')}
                        </p>
                        {log.metadata?.tracking_code && (
                           <p className="text-[9px] font-mono font-bold text-slate-400">#{log.metadata.tracking_code}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>

          {/* Quick Info Alerts */}
          {stats.stuck > 0 && (
            <div className="bg-rose-50 rounded-[2rem] border border-rose-100 p-6">
               <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-rose-900 uppercase leading-none">Peringatan Operasional</h4>
                    <p className="text-[10px] font-bold text-rose-600 uppercase mt-1">Stuck &gt; 3 Hari</p>
                  </div>
               </div>
               <p className="text-[11px] text-rose-800/70 font-medium leading-relaxed mb-4">
                 Ada <span className="font-black text-rose-600">{stats.stuck} pekerjaan</span> yang tidak mengalami perubahan status selama lebih dari 3 hari. Segera lakukan pengecekan di lapangan atau laboratorium.
               </p>
               <Button 
                variant="link" 
                className="p-0 h-auto text-[10px] font-black text-rose-600 uppercase hover:no-underline"
                onClick={() => {
                  setFilterStatus("all");
                  setSearch(""); // Reset to see all potentially stuck jobs
                }}
               >
                 Tampilkan Semua <ArrowRight className="h-3 w-3 ml-1" />
               </Button>
            </div>
          )}
        </div>
      </div>

      {/* Job Detail Dialog (Enhanced) */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-950 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-900 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl opacity-50" />
            <DialogHeader className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                 <div className="h-8 w-8 rounded-lg bg-emerald-800 flex items-center justify-center border border-emerald-700">
                    <Briefcase className="h-4 w-4 text-emerald-400" />
                 </div>
                 <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none pt-1">Detail Order</DialogTitle>
              </div>
              <div className="flex items-center gap-2">
                 <span className="font-mono text-xs font-black text-emerald-400 tracking-widest">{selectedJob?.tracking_code}</span>
                 <div className="h-1 w-1 rounded-full bg-emerald-800" />
                 <span className="text-[10px] text-emerald-500 font-bold uppercase">{statusConfig[selectedJob?.status]?.label || 'General'}</span>
              </div>
            </DialogHeader>
          </div>
          
          <div className="p-8 space-y-8 bg-white max-h-[60vh] overflow-y-auto">
            {/* Info Cards */}
            <div className="grid grid-cols-1 gap-4">
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[2px] mb-2">Pelanggan</p>
                  <p className="font-black text-slate-800 text-sm leading-none">{selectedJob?.quotation?.profile?.full_name}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{selectedJob?.quotation?.profile?.company_name || 'Personal Customer'}</p>
               </div>
               
               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[2px] mb-2">Layanan Utama</p>
                  <p className="font-black text-slate-800 text-sm">{selectedJob?.quotation?.items?.[0]?.service?.name || 'Uji Analisis Lab'}</p>
               </div>
            </div>

            {/* Visual Timeline */}
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alur Progres</h5>
                  <Badge className="bg-emerald-100 text-emerald-700 font-black text-[10px] border-none rounded-lg">{statusConfig[selectedJob?.status]?.progress}% Done</Badge>
               </div>
               
               <div className="space-y-4">
                  {progressSteps.map((step, idx) => {
                    const jobIndex = progressSteps.findIndex(s => s.key === selectedJob?.status);
                    const isPast = idx < jobIndex;
                    const isCurrent = idx === jobIndex;
                    const Icon = step.icon;

                    return (
                      <div key={step.key} className="flex items-center gap-4 group">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-500",
                          isPast ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20" :
                          isCurrent ? "bg-emerald-950 border-emerald-900 text-white scale-110 shadow-xl shadow-emerald-950/20" :
                          "bg-slate-50 border-slate-100 text-slate-300"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 border-b border-slate-50 pb-2">
                          <p className={cn(
                            "text-xs font-black uppercase tracking-tight",
                            isPast || isCurrent ? "text-slate-800" : "text-slate-300"
                          )}>
                            {step.label}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                            {isPast ? 'Telah Selesai' : isCurrent ? 'Status Saat Ini' : 'Belum Dimulai'}
                          </p>
                        </div>
                        {isCurrent && <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                      </div>
                    );
                  })}
               </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t flex flex-row gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsDetailOpen(false)}
              className="flex-1 font-black text-[10px] uppercase tracking-widest text-slate-400 h-12 rounded-2xl"
            >
              Tutup
            </Button>
            <Button
              onClick={() => {
                setIsDetailOpen(false);
                router.push(`/operator/jobs`);
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest h-12 rounded-2xl shadow-lg shadow-emerald-900/20"
            >
              Kelola Progres
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Services List Modal */}
      <Dialog open={isServicesModalOpen} onOpenChange={setIsServicesModalOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-950 p-6 text-white">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-emerald-800 flex items-center justify-center border border-emerald-700">
                  <FlaskConical className="h-5 w-5 text-emerald-400" />
               </div>
               <div>
                 <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none">Daftar Layanan</DialogTitle>
                 <DialogDescription className="text-emerald-500 text-[10px] font-bold uppercase mt-1">Total {services.length} Layanan Terdaftar</DialogDescription>
               </div>
            </div>
          </div>
          <div className="p-6 bg-white space-y-4">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Cari layanan..." 
                  className="pl-10 h-10 rounded-xl border-slate-100 bg-slate-50 focus-visible:ring-emerald-500"
                  value={serviceSearch}
                  onChange={(e) => {
                    setServiceSearch(e.target.value);
                    setServicePage(1); // Reset to page 1 on search
                  }}
                />
             </div>
             <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-slate-50">
                <table className="w-full text-left text-xs">
                   <thead className="bg-slate-50 text-slate-400 font-black uppercase sticky top-0">
                      <tr>
                         <th className="px-4 py-3">Nama Layanan</th>
                         <th className="px-4 py-3 text-right">Harga (IDR)</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {(() => {
                        const filtered = services.filter(s => 
                          s.name.toLowerCase().includes(serviceSearch.toLowerCase()) || 
                          s.category_ref?.name.toLowerCase().includes(serviceSearch.toLowerCase())
                        );
                        const totalPages = Math.ceil(filtered.length / SERVICE_PER_PAGE);
                        const paginated = filtered.slice((servicePage - 1) * SERVICE_PER_PAGE, servicePage * SERVICE_PER_PAGE);

                        if (paginated.length === 0) {
                          return (
                            <tr>
                              <td colSpan={2} className="px-4 py-8 text-center text-slate-400 font-bold uppercase tracking-widest">
                                Tidak ada layanan ditemukan
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <>
                            {paginated.map((service: any) => (
                              <tr key={service.id} className="hover:bg-emerald-50/30 transition-colors group">
                                <td className="px-4 py-3">
                                    <p className="font-bold text-slate-800">{service.name}</p>
                                    <p className="text-[9px] text-emerald-600 font-black uppercase mt-0.5">{service.category_ref?.name || 'Umum'}</p>
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                                    {new Intl.NumberFormat('id-ID').format(service.price)}
                                </td>
                              </tr>
                            ))}
                            {/* Pagination Controls */}
                            {filtered.length > SERVICE_PER_PAGE && (
                              <tr className="bg-slate-50/50">
                                <td colSpan={2} className="px-4 py-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                                      Halaman {servicePage} dari {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 px-3 text-[10px] font-black uppercase rounded-lg border-slate-200"
                                        disabled={servicePage === 1}
                                        onClick={() => setServicePage(p => Math.max(1, p - 1))}
                                      >
                                        Sebelumnya
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 px-3 text-[10px] font-black uppercase rounded-lg border-slate-200"
                                        disabled={servicePage === totalPages}
                                        onClick={() => setServicePage(p => Math.min(totalPages, p + 1))}
                                      >
                                        Selanjutnya
                                      </Button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })()}
                   </tbody>
                </table>
             </div>
          </div>
          <DialogFooter className="p-4 bg-slate-50 border-t">
             <Button variant="ghost" onClick={() => setIsServicesModalOpen(false)} className="w-full font-black text-[10px] uppercase tracking-widest text-slate-400">Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Categories List Modal */}
      <Dialog open={isCategoriesModalOpen} onOpenChange={setIsCategoriesModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-950 p-6 text-white">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl bg-emerald-800 flex items-center justify-center border border-emerald-700">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
               </div>
               <div>
                 <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none">Kategori Layanan</DialogTitle>
                 <DialogDescription className="text-emerald-500 text-[10px] font-bold uppercase mt-1">Bidang Analisis WahfaLab</DialogDescription>
               </div>
            </div>
          </div>
          <div className="p-6 bg-white">
             <div className="grid grid-cols-1 gap-3">
                {categories.map((cat: any) => (
                  <div key={cat.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center group hover:bg-emerald-50 hover:border-emerald-100 transition-all">
                     <div>
                        <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{cat.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{cat._count?.services || 0} Layanan Tersedia</p>
                     </div>
                     <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <ChevronRight className="h-4 w-4" />
                     </div>
                  </div>
                ))}
             </div>
          </div>
          <DialogFooter className="p-4 bg-slate-50 border-t">
             <Button variant="ghost" onClick={() => setIsCategoriesModalOpen(false)} className="w-full font-black text-[10px] uppercase tracking-widest text-slate-400">Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Quotation Modal */}
      <Dialog open={isQuotationModalOpen} onOpenChange={setIsQuotationModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-950 p-8 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-800/20 via-transparent to-transparent opacity-50" />
            <div className="relative z-10 space-y-4">
               <div className="h-16 w-16 rounded-3xl bg-emerald-600 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-900/40 border-4 border-emerald-800">
                  <FileText className="h-8 w-8 text-white" />
               </div>
               <div>
                 <DialogTitle className="text-2xl font-black uppercase tracking-tight">Buat Penawaran</DialogTitle>
                 <p className="text-emerald-500 text-xs font-bold uppercase tracking-widest mt-1">Sistem Penawaran Digital</p>
               </div>
            </div>
          </div>
          <div className="p-8 bg-white space-y-8">
             <div className="space-y-4 text-center">
                <p className="text-slate-500 text-sm leading-relaxed">
                  Anda akan dialihkan ke sistem pembuatan penawaran lengkap untuk mengisi detail klien, parameter pengujian, dan biaya operasional lapangan.
                </p>
                <div className="grid grid-cols-2 gap-3">
                   <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-lg font-black text-emerald-600 leading-none">{services.length}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Layanan Siap</p>
                   </div>
                   <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-lg font-black text-emerald-600 leading-none">{categories.length}</p>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Kategori Aktif</p>
                   </div>
                </div>
             </div>
             <Button 
                onClick={() => {
                  setIsQuotationModalOpen(false);
                  router.push('/operator/quotations/new');
                }}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3 group"
             >
                Lanjut Pembuatan <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
             </Button>
          </div>
          <DialogFooter className="p-4 bg-slate-50 border-t">
             <Button variant="ghost" onClick={() => setIsQuotationModalOpen(false)} className="w-full font-black text-[10px] uppercase tracking-widest text-slate-400">Batalkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Sub-component: Stat Card
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  onClick,
  active = false
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  onClick: () => void;
  active?: boolean;
}) {
  const colorClasses: Record<string, { bg: string; text: string; ring: string }> = {
    amber: { bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-200" },
    blue: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-200" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", ring: "ring-purple-200" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", ring: "ring-indigo-200" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-200" }
  };

  const style = colorClasses[color] || colorClasses.blue;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-5 rounded-[1.5rem] bg-white border-2 transition-all duration-300 cursor-pointer overflow-hidden",
        active 
          ? cn("border-emerald-600 shadow-xl shadow-emerald-900/10 scale-[1.02]", style.ring) 
          : "border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/5 shadow-sm"
      )}
    >
      <div className="relative z-10 flex flex-col gap-3">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", style.bg, style.text)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-black text-slate-800 leading-none mb-1">{value}</p>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        </div>
      </div>
      {active && (
        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-600" />
      )}
    </div>
  );
}
