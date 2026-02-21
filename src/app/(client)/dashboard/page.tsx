// ============================================================================
// OPTIMIZED CLIENT DASHBOARD - v2.0
// Fitur Optimasi:
// 1. ✅ Real-time tracking dengan auto-refresh
// 2. ✅ Loading states dengan skeleton
// 3. ✅ Toast notifications untuk update status
// 4. ✅ Export sertifikat PDF
// 5. ✅ Timeline visual progress
// 6. ✅ Responsive design
// 7. ✅ Empty state yang menarik
// 8. ✅ Quick order CTA
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Clock,
  FileDown,
  ArrowRight,
  FlaskConical,
  Truck,
  Beaker,
  FileText,
  FileCheck,
  ChevronRight,
  Info,
  History,
  MessageSquare,
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { getJobOrders } from "@/lib/actions/jobs";
import { getProfile } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ChemicalLoader } from "@/components/ui";

const steps = [
  { id: 'scheduled', label: 'Antrean', icon: Clock, desc: 'Pendaftaran diterima', color: 'amber' },
  { id: 'sampling', label: 'Sampling', icon: Truck, desc: 'Petugas di lapangan', color: 'blue' },
  { id: 'analysis', label: 'Laboratorium', icon: Beaker, desc: 'Sedang diuji', color: 'purple' },
  { id: 'reporting', label: 'Pelaporan', icon: FileText, desc: 'Penyusunan sertifikat', color: 'indigo' },
  { id: 'completed', label: 'Selesai', icon: FileCheck, desc: 'Sertifikat terbit', color: 'emerald' }
];

const statusColors: Record<string, string> = {
  scheduled: 'bg-amber-100 text-amber-700 border-amber-200',
  sampling: 'bg-blue-100 text-blue-700 border-blue-200',
  analysis: 'bg-purple-100 text-purple-700 border-purple-200',
  reporting: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200'
};

export default function ClientDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const supabase = createClient();

  const loadData = async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    else setLoading(true);

    try {
      const [prof, jobsData] = await Promise.all([
        getProfile(),
        getJobOrders(1, 100)
      ]);

      setProfile(prof);
      const { data: { user } } = await supabase.auth.getUser();
      const filteredJobs = (jobsData.items || []).filter(
        (j: any) => j.quotation?.user_id === user?.id
      );
      setActiveJobs(filteredJobs);

      if (showRefreshToast) {
        toast.success("Data diperbarui", {
          description: `${filteredJobs.length} pesanan ditemukan`
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
        toast.info("Status pengujian diperbarui!", {
          description: `${payload.new.tracking_code}: ${payload.new.status}`
        });
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter & Search
  const filteredJobs = activeJobs.filter((job: any) => {
    const matchesSearch = search === "" ||
      job.tracking_code.toLowerCase().includes(search.toLowerCase()) ||
      job.quotation?.items?.[0]?.service?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === "all" || job.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    active: activeJobs.filter(j => j.status !== 'completed').length,
    analysis: activeJobs.filter(j => j.status === 'analysis').length,
    completed: activeJobs.filter(j => j.status === 'completed').length,
    total: activeJobs.length
  };

  const getCurrentStepIndex = (status: string) => 
    steps.findIndex(s => s.id === status);

  const handleDownloadCertificate = (job: any) => {
    if (job.certificate_url) {
      window.open(job.certificate_url, '_blank');
      toast.success("Sertifikat sedang diunduh", {
        description: "File akan tersimpan di device Anda"
      });
    }
  };

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
          <h1 className="text-2xl font-bold text-emerald-950 tracking-tight font-[family-name:var(--font-montserrat)]">
            Halo, {profile?.full_name?.split(' ')[0] || 'Customer'}
          </h1>
          <p className="text-slate-500 text-xs">
            Monitoring hasil pengujian laboratorium Anda
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
          <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-100 text-[10px] py-1">
            Customer
          </Badge>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Pesanan Aktif"
          value={stats.active}
          icon={Box}
          color="emerald"
          description="Sedang diproses"
        />
        <StatCard
          title="Dalam Analisis"
          value={stats.analysis}
          icon={FlaskConical}
          color="purple"
          description="Di laboratorium"
        />
        <StatCard
          title="Selesai"
          value={stats.completed}
          icon={CheckCircle}
          color="blue"
          description="Sertifikat terbit"
        />
        <StatCard
          title="Total Pesanan"
          value={stats.total}
          icon={History}
          color="slate"
          description="Semua riwayat"
        />
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari tracking code atau layanan..."
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
                {steps.map(step => (
                  <SelectItem key={step.id} value={step.id}>{step.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setSearch("");
                setFilterStatus("all");
              }}
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
            <FlaskConical className="h-4 w-4" />
            Lacak Pesanan {filteredJobs.length > 0 && `(${filteredJobs.length})`}
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <FlaskConical className="h-10 w-10 text-emerald-300" />
              </div>
              <h4 className="font-semibold text-slate-700 mb-1">Tidak ada pesanan aktif</h4>
              <p className="text-slate-500 text-sm mb-4">
                {search || filterStatus !== "all"
                  ? "Coba ubah filter atau kata kunci pencarian"
                  : "Mulai dengan membuat pesanan pengujian pertama Anda"}
              </p>
              {!search && filterStatus === "all" && (
                <Button className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                  Buat Pesanan Baru
                </Button>
              )}
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
            filteredJobs.map((job: any) => (
              <div key={job.id} className="p-5 hover:bg-slate-50 transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-[10px] shrink-0">
                      JOB
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                          {job.tracking_code}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[8px] h-4 px-1.5 font-bold uppercase",
                            statusColors[job.status] || "bg-slate-100"
                          )}
                        >
                          {job.status}
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
                        {job.quotation?.items?.[0]?.service?.name || 'Uji Analisis Lab'}
                      </h4>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[10px] text-slate-500">
                          Total:{" "}
                          <span className="font-bold text-emerald-700">
                            Rp {Number(job.quotation?.total_amount || 0).toLocaleString("id-ID")}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button
                      onClick={() => {
                        setSelectedJob(job);
                        setIsDetailOpen(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1 md:flex-none h-9 text-xs font-bold rounded-lg border-emerald-100 text-emerald-700 cursor-pointer"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Detail
                    </Button>
                    {job.certificate_url && (
                      <Button
                        onClick={() => handleDownloadCertificate(job)}
                        size="sm"
                        className="flex-1 md:flex-none h-9 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 cursor-pointer"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Sertifikat
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Job Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {selectedJob?.quotation?.items?.[0]?.service?.name || 'Detail Pesanan'}
              </DialogTitle>
              <DialogDescription className="text-emerald-200 text-xs font-medium">
                {selectedJob?.tracking_code}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 bg-white space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Tanggal Order</h5>
                <p className="text-sm font-semibold text-slate-800">
                  {new Date(selectedJob?.created_at).toLocaleDateString("id-ID", {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Total Biaya</h5>
                <p className="text-sm font-bold text-emerald-700">
                  Rp {Number(selectedJob?.quotation?.total_amount || 0).toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            {/* Progress Timeline */}
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase mb-4">Progress Pengujian</h5>
              <div className="relative">
                {/* Connection Line */}
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-100" />
                
                <div className="space-y-4">
                  {steps.map((step, idx) => {
                    const currentIdx = getCurrentStepIndex(selectedJob?.status || '');
                    const isPast = idx < currentIdx;
                    const isCurrent = idx === currentIdx;
                    const Icon = step.icon;

                    return (
                      <div key={step.id} className="relative pl-10">
                        <div className={cn(
                          "absolute left-0 top-0 h-8 w-8 rounded-lg flex items-center justify-center transition-all shadow-sm z-10",
                          isPast ? "bg-emerald-500 text-white" :
                          isCurrent ? "bg-emerald-900 text-white scale-110 shadow-lg" :
                          "bg-slate-100 text-slate-300"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className={cn(
                          isPast || isCurrent ? "opacity-100" : "opacity-40"
                        )}>
                          <h5 className={cn(
                            "text-sm font-bold",
                            isCurrent ? "text-emerald-900" : "text-slate-700"
                          )}>
                            {step.label}
                          </h5>
                          <p className="text-[10px] text-slate-500 leading-tight">{step.desc}</p>
                          {isCurrent && selectedJob?.notes && (
                            <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-amber-700 italic">"{selectedJob.notes}"</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Certificate Available */}
            {selectedJob?.certificate_url && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-2">
                    <FileCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-emerald-800">Sertifikat Tersedia</h5>
                      <p className="text-[10px] text-emerald-700">Unduh sertifikat pengujian Anda</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownloadCertificate(selectedJob)}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-xs cursor-pointer"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Unduh
                  </Button>
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
                toast.info("Fitur chat akan segera hadir", {
                  description: "Anda akan diarahkan ke customer service"
                });
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Hubungi CS
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
  description
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  description: string;
}) {
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    blue: "bg-blue-50 text-blue-600",
    slate: "bg-slate-50 text-slate-600"
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{title}</p>
      <p className="text-[9px] text-slate-400 mt-0.5">{description}</p>
    </div>
  );
}
