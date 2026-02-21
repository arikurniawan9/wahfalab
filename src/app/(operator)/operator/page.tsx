// ============================================================================
// OPTIMIZED OPERATOR DASHBOARD - v2.0
// Fitur Optimasi:
// 1. ✅ Real-time stats dengan auto-refresh
// 2. ✅ Loading states dengan skeleton
// 3. ✅ Toast notifications untuk update
// 4. ✅ Filter & search jobs
// 5. ✅ Quick actions
// 6. ✅ Responsive design
// 7. ✅ Empty state yang menarik
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
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
  Bell,
  FlaskConical,
  FileText,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  ChevronRight,
  Truck,
  TestTube
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

const statusConfig: Record<string, { label: string; color: string; icon: any; progress: number }> = {
  scheduled: { label: 'Antrean', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, progress: 0 },
  sampling: { label: 'Sampling', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Truck, progress: 25 },
  analysis: { label: 'Analisis', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: TestTube, progress: 50 },
  reporting: { label: 'Pelaporan', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: FileText, progress: 75 },
  completed: { label: 'Selesai', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2, progress: 100 }
};

const progressSteps = [
  { key: 'scheduled', label: 'Antrean', icon: Clock },
  { key: 'sampling', label: 'Sampling', icon: Truck },
  { key: 'analysis', label: 'Analisis', icon: TestTube },
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
  const [serviceSearch, setServiceSearch] = useState("");
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [stats, setStats] = useState({
    scheduled: 0,
    sampling: 0,
    analysis: 0,
    reporting: 0,
    completed: 0,
    total: 0
  });

  const supabase = createClient();

  const loadData = async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    else setLoading(true);

    try {
      const [prof, jobsData, servicesData, categoriesData] = await Promise.all([
        getProfile(),
        getJobOrders(1, 100),
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
        toast.success("Data diperbarui", {
          description: `${jobList.length} pekerjaan, ${servicesData.length} layanan ditemukan`
        });
      }
    } catch (error: any) {
      toast.error("Gagal memuat data", {
        description: error?.message || "Silakan coba lagi"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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
        toast.info("Status pekerjaan diperbarui!", {
          description: `Job ${payload.new.tracking_code} → ${payload.new.status}`
        });
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter & Search
  const filteredJobs = jobs.filter((job: any) => {
    const matchesSearch = search === "" ||
      job.tracking_code.toLowerCase().includes(search.toLowerCase()) ||
      job.quotation?.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      job.quotation?.items?.[0]?.service?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === "all" || job.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const recentJobs = filteredJobs.slice(0, 10);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <ChemicalLoader />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8 bg-slate-50/20">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950 tracking-tight font-[family-name:var(--font-montserrat)] uppercase">
            Beranda Petugas
          </h1>
          <p className="text-slate-500 text-xs font-medium">
            Monitoring antrean laboratorium WahfaLab
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="h-10 w-10 cursor-pointer"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
          <div className="h-10 w-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {profile?.full_name?.charAt(0) || "U"}
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard
          title="Antrean"
          value={stats.scheduled}
          icon={Clock}
          color="amber"
          onClick={() => setFilterStatus("scheduled")}
        />
        <StatCard
          title="Sampling"
          value={stats.sampling}
          icon={MapPin}
          color="blue"
          onClick={() => setFilterStatus("sampling")}
        />
        <StatCard
          title="Analisis"
          value={stats.analysis}
          icon={Beaker}
          color="purple"
          onClick={() => setFilterStatus("analysis")}
        />
        <StatCard
          title="Pelaporan"
          value={stats.reporting}
          icon={FileText}
          color="indigo"
          onClick={() => setFilterStatus("reporting")}
        />
        <StatCard
          title="Selesai"
          value={stats.completed}
          icon={CheckCircle2}
          color="emerald"
          onClick={() => setFilterStatus("completed")}
        />
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari tracking code, customer, atau layanan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 focus-visible:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40 cursor-pointer">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setFilterStatus("all")}
              className="h-10 w-10 cursor-pointer"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-emerald-900 flex items-center gap-2 text-sm uppercase tracking-wide">
            <ClipboardList className="h-4 w-4" />
            Daftar Pekerjaan {filteredJobs.length > 0 && `(${filteredJobs.length})`}
          </h3>
          <Link href="/operator/jobs">
            <Button variant="ghost" size="sm" className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest cursor-pointer">
              Lihat Semua <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="h-10 w-10 text-slate-300" />
              </div>
              <h4 className="font-semibold text-slate-700 mb-1">Tidak ada pekerjaan</h4>
              <p className="text-slate-500 text-sm mb-4">
                {search || filterStatus !== "all"
                  ? "Coba ubah filter atau kata kunci pencarian"
                  : "Belum ada pekerjaan yang terdaftar"}
              </p>
              {(search || filterStatus !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setFilterStatus("all");
                  }}
                  className="cursor-pointer"
                >
                  Reset Filter
                </Button>
              )}
            </div>
          ) : (
            recentJobs.map((job: any) => {
              const StatusIcon = statusConfig[job.status]?.icon || Clock;
              return (
                <div
                  key={job.id}
                  className="p-5 hover:bg-slate-50 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedJob(job);
                    setIsDetailOpen(true);
                  }}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex gap-4 flex-1">
                      <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-[10px] shrink-0">
                        JOB
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[10px] font-bold text-emerald-600 tracking-wider">
                            {job.tracking_code}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[8px] h-4 px-1.5 font-bold uppercase",
                              statusConfig[job.status]?.color || "bg-slate-100"
                            )}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[job.status]?.label || job.status}
                          </Badge>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(job.created_at).toLocaleDateString("id-ID", {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm truncate">
                          {job.quotation?.items?.[0]?.service?.name || 'Uji Analisis'}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {job.quotation?.profile?.full_name || 'Unknown'}
                          </p>
                          {job.quotation?.profile?.company_name && (
                            <p className="text-[10px] text-slate-400">
                              {job.quotation.profile.company_name}
                            </p>
                          )}
                        </div>
                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                              Progress: {statusConfig[job.status]?.progress || 0}%
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {progressSteps.find(s => s.key === job.status)?.label || job.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {progressSteps.map((step, idx) => {
                              const jobIndex = progressSteps.findIndex(s => s.key === job.status);
                              const isPast = idx <= jobIndex;
                              const StepIcon = step.icon;
                              
                              return (
                                <div key={step.key} className="flex items-center flex-1">
                                  <div className={cn(
                                    "h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-all",
                                    isPast 
                                      ? idx === jobIndex 
                                        ? "bg-emerald-600 text-white scale-110 shadow-md" 
                                        : "bg-emerald-300 text-white"
                                      : "bg-slate-200 text-slate-400"
                                  )}>
                                    <StepIcon className="h-3 w-3" />
                                  </div>
                                  {idx < progressSteps.length - 1 && (
                                    <div className={cn(
                                      "flex-1 h-1 mx-1 rounded-full transition-all",
                                      idx < jobIndex ? "bg-emerald-400" : "bg-slate-200"
                                    )} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 h-8 px-4 text-xs font-bold rounded-lg shrink-0 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedJob(job);
                        setIsDetailOpen(true);
                      }}
                    >
                      Detail <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Manajemen Laboratorium Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Manajemen Laboratorium
            </h2>
            <p className="text-slate-500 text-xs">Layanan dan kategori pengujian laboratorium</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsServiceDialogOpen(true)}
            className="text-emerald-600 border-emerald-200 cursor-pointer"
          >
            Lihat Semua <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>

        {/* Categories & Services Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Categories Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b bg-slate-50/50">
              <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Kategori Layanan ({categories.length})
              </h3>
            </div>
            <div className="p-4">
              {categories.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>Belum ada kategori</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {categories.slice(0, 4).map((cat: any) => (
                    <div
                      key={cat.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-emerald-50 transition-colors cursor-default"
                    >
                      <p className="text-xs font-bold text-slate-700 truncate">{cat.name}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        {cat._count?.services || 0} layanan
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Services Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b bg-slate-50/50">
              <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <FlaskConical className="h-4 w-4" />
                Layanan Pengujian ({services.length})
              </h3>
            </div>
            <div className="p-4">
              {services.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>Belum ada layanan</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {services.slice(0, 4).map((service: any) => (
                    <div
                      key={service.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-emerald-50 transition-colors cursor-default"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{service.name}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {service.category_ref?.name || service.category || 'Umum'}
                          </p>
                        </div>
                        <p className="text-xs font-bold text-emerald-700 shrink-0">
                          Rp {Number(service.price).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Services & Categories Dialog */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-emerald-900 flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Manajemen Laboratorium
            </DialogTitle>
            <DialogDescription>
              Daftar kategori dan layanan pengujian laboratorium
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Categories Section */}
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Kategori Layanan ({categories.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map((cat: any) => (
                  <div
                    key={cat.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-100"
                  >
                    <p className="text-xs font-bold text-slate-700 truncate">{cat.name}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      {cat._count?.services || 0} layanan
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Services Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <FlaskConical className="h-4 w-4" />
                  Layanan Pengujian ({services.length})
                </h4>
                <div className="relative w-48">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                  <Input
                    placeholder="Cari layanan..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="pl-7 h-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {services
                  .filter((s: any) =>
                    serviceSearch === "" ||
                    s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
                    s.category_ref?.name?.toLowerCase().includes(serviceSearch.toLowerCase())
                  )
                  .map((service: any) => (
                    <div
                      key={service.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{service.name}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">
                            {service.category_ref?.name || service.category || 'Umum'}
                            {service.parameters && (
                              <span className="ml-2 text-slate-400">
                                • {Array.isArray(service.parameters) ? service.parameters.length : 0} parameter
                              </span>
                            )}
                          </p>
                        </div>
                        <p className="text-xs font-bold text-emerald-700 shrink-0">
                          Rp {Number(service.price).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 bg-slate-50">
            <Button
              onClick={() => setIsServiceDialogOpen(false)}
              className="w-full cursor-pointer"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl p-0 overflow-hidden">
          <div className="bg-emerald-950 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {selectedJob?.quotation?.items?.[0]?.service?.name || 'Detail Pekerjaan'}
              </DialogTitle>
              <DialogDescription className="text-emerald-400 text-xs font-medium">
                {selectedJob?.tracking_code}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 bg-white space-y-6">
            {/* Customer Info */}
            <div className="bg-slate-50 p-4 rounded-xl">
              <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Informasi Pelanggan</h5>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  {selectedJob?.quotation?.profile?.full_name}
                </p>
                {selectedJob?.quotation?.profile?.company_name && (
                  <p className="text-xs text-slate-500">
                    {selectedJob.quotation.profile.company_name}
                  </p>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase mb-4">Status Pekerjaan</h5>
              
              {/* Progress Percentage Display */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-900">Progress Keseluruhan</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {statusConfig[selectedJob?.status]?.progress || 0}%
                  </span>
                </div>
                <div className="h-3 bg-emerald-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 transition-all duration-500 ease-out"
                    style={{ width: `${statusConfig[selectedJob?.status]?.progress || 0}%` }}
                  />
                </div>
              </div>

              {/* Step by Step Timeline */}
              <div className="space-y-3">
                {progressSteps.map((step, idx) => {
                  const jobIndex = progressSteps.findIndex(s => s.key === selectedJob?.status);
                  const currentIndex = idx;
                  const isPast = currentIndex < jobIndex;
                  const isCurrent = currentIndex === jobIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                        isPast ? "bg-emerald-500 text-white" :
                        isCurrent ? "bg-emerald-950 text-white scale-110 shadow-lg" :
                        "bg-slate-100 text-slate-300"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className={cn(
                        "flex-1",
                        isPast || isCurrent ? "opacity-100" : "opacity-40"
                      )}>
                        <p className={cn(
                          "text-sm font-bold",
                          isCurrent ? "text-emerald-950" : "text-slate-700"
                        )}>
                          {step.label}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {isPast ? 'Selesai' : isCurrent ? 'Sedang dikerjakan' : 'Belum dimulai'}
                        </p>
                      </div>
                      {isCurrent && (
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          <Clock className="h-3 w-3 mr-1" />
                          Aktif
                        </Badge>
                      )}
                      {isPast && (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          ✓
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            {selectedJob?.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-800 mb-1">Catatan</h5>
                    <p className="text-xs text-amber-700 italic">{selectedJob.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="p-4 bg-slate-50 gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDetailOpen(false)}
              className="flex-1 cursor-pointer"
            >
              Tutup
            </Button>
            <Button
              onClick={() => {
                setIsDetailOpen(false);
                router.push(`/operator/jobs`);
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
            >
              Kelola Pekerjaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  onClick
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  onClick: () => void;
}) {
  const colorClasses: Record<string, string> = {
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200"
  };

  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>
          <Icon className="h-4 w-4" />
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300" />
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{title}</p>
    </div>
  );
}
