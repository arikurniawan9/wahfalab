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
import { createClient } from '@/lib/supabase/client';
import { getJobOrders } from "@/lib/actions/jobs";
import { getProfile } from "@/lib/actions/auth";
import { getAllServices } from "@/lib/actions/services";
import { getAllCategories } from "@/lib/actions/categories";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState({
    scheduled: 0,
    sampling: 0,
    analysis: 0,
    reporting: 0,
    completed: 0,
    total: 0
  });

  const supabase = createClient();

  const loadData = useCallback(async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    else setLoading(true);

    try {
      const [prof, jobsData, servicesData, categoriesData] = await Promise.all([
        getProfile(),
        getJobOrders(1, 50), // Ambil 50 pekerjaan terbaru
        getAllServices(),
        getAllCategories()
      ]);

      setProfile(prof);
      setJobs(jobsData.items || []);
      setServices(servicesData);
      setCategories(categoriesData);

      // Calculate stats
      const jobList = jobsData.items || [];
      setStats({
        scheduled: jobList.filter((j: any) => j.status === 'scheduled').length,
        sampling: jobList.filter((j: any) => j.status === 'sampling').length,
        analysis: jobList.filter((j: any) => j.status === 'analysis').length,
        reporting: jobList.filter((j: any) => j.status === 'reporting').length,
        completed: jobList.filter((j: any) => j.status === 'completed').length,
        total: jobList.length
      });

      if (showRefreshToast) {
        toast.success("Dashboard Terkini", {
          description: "Data pekerjaan dan layanan telah diperbarui."
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

    // Real-time subscription
    const channel = supabase
      .channel('job_updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'job_orders'
      }, (payload) => {
        toast.info("Update Progres!", {
          description: `Pekerjaan ${payload.new.tracking_code} berganti status.`
        });
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData, supabase]);

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
            <Input
              placeholder="Cari kode tracking, klien, atau jenis layanan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 pl-12 pr-4 bg-white border-slate-200 rounded-2xl shadow-sm focus-visible:ring-emerald-500 transition-all text-sm font-medium"
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
                return (
                  <Card 
                    key={job.id} 
                    className="group border-none shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300 rounded-[1.5rem] overflow-hidden cursor-pointer"
                    onClick={() => { setSelectedJob(job); setIsDetailOpen(true); }}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row items-stretch">
                        {/* Status Side Indicator */}
                        <div className={cn("w-2 shrink-0 transition-all duration-300", config.color.replace('text', 'bg'))} />
                        
                        <div className="p-5 flex-1 space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase tracking-tighter">
                                  {job.tracking_code}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(job.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                </span>
                              </div>
                              <h4 className="font-black text-slate-800 text-base leading-tight">
                                {job.quotation?.items?.[0]?.service?.name || 'Layanan Laboratorium'}
                              </h4>
                              <div className="flex items-center gap-3">
                                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight flex items-center gap-1.5">
                                  <User className="h-3 w-3 text-emerald-600" />
                                  {job.quotation?.profile?.full_name}
                                </p>
                                {job.quotation?.profile?.company_name && (
                                  <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase border-none h-4">
                                    {job.quotation.profile.company_name}
                                  </Badge>
                                )}
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
                                className={cn("h-full transition-all duration-700 ease-out", config.color.replace('text', 'bg'))}
                                style={{ width: `${config.progress}%` }}
                              />
                            </div>
                            <div className="flex justify-between mt-2">
                               {progressSteps.map((step, sIdx) => {
                                 const jobIdx = progressSteps.findIndex(ps => ps.key === job.status);
                                 return (
                                   <div key={step.key} className={cn(
                                     "h-1.5 w-1.5 rounded-full transition-colors",
                                     sIdx <= jobIdx ? config.color.replace('text', 'bg') : "bg-slate-200"
                                   )} />
                                 );
                               })}
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

        {/* Right Sidebar: Master Info */}
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
                <div className="flex justify-between items-center bg-emerald-900/30 p-4 rounded-2xl border border-emerald-800/50 group hover:bg-emerald-900/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <FlaskConical className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-sm font-bold">Layanan Lab</p>
                      <p className="text-[10px] text-emerald-500 font-bold">{services.length} Terdaftar</p>
                    </div>
                  </div>
                  <Link href="/operator/services">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-emerald-800 text-emerald-400">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                <div className="flex justify-between items-center bg-emerald-900/30 p-4 rounded-2xl border border-emerald-800/50 group hover:bg-emerald-900/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="text-sm font-bold">Kategori</p>
                      <p className="text-[10px] text-emerald-500 font-bold">{categories.length} Bidang</p>
                    </div>
                  </div>
                  <Link href="/operator/categories">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-emerald-800 text-emerald-400">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="bg-emerald-900/50 p-4 rounded-2xl border border-dashed border-emerald-700 text-center">
                 <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-tighter mb-2">Penawaran Cepat?</p>
                 <Link href="/operator/quotations/create">
                   <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase h-10 rounded-xl shadow-lg shadow-black/20">
                     Buat Penawaran
                   </Button>
                 </Link>
              </div>
            </div>
          </div>

          {/* Quick Activity Info */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
             <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2 mb-6">
               <AlertCircle className="h-4 w-4 text-emerald-600" />
               Informasi Terkini
             </h3>
             <div className="space-y-6">
                <div className="flex gap-4">
                   <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      <Clock className="h-5 w-5" />
                   </div>
                   <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800">Antrean Terjadwal</p>
                      <p className="text-[10px] text-slate-500 leading-snug">Ada <span className="font-bold text-blue-600">{stats.scheduled} pekerjaan</span> yang menunggu penugasan petugas lapangan hari ini.</p>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                      <TestTube className="h-5 w-5" />
                   </div>
                   <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800">Status Analisis Lab</p>
                      <p className="text-[10px] text-slate-500 leading-snug"><span className="font-bold text-purple-600">{stats.analysis} sampel</span> sedang berada di tahap pengujian laboratorium oleh tim analis.</p>
                   </div>
                </div>
             </div>
          </div>
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
