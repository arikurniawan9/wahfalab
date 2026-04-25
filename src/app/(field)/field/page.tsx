// ============================================================================
// OPTIMIZED FIELD OFFICER DASHBOARD - v3.0
// Fitur Premium:
// 1. ✅ Real-time interaction (Supabase)
// 2. ✅ Animated Progress Bars
// 3. ✅ "Terima Tugas" Workflow Integration
// 4. ✅ Premium UI with Montserrat Black
// ============================================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ClipboardList,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  ChevronRight,
  AlertCircle,
  Truck,
  FileText
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
import { PageSkeleton } from "@/components/ui";
// TODO: Implement polling or SSE for real-time updates instead of Supabase realtime
// import { createClient } from '@/lib/supabase/client';
import { getMySamplingAssignments, updateSamplingStatus, rejectSamplingAssignment } from "@/lib/actions/sampling";
import { getMyTravelOrders } from "@/lib/actions/travel-order";
import { getProfile } from "@/lib/actions/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any; progress: number }> = {
  pending: { label: 'Tugas Baru', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock, progress: 20 },
  in_progress: { label: 'Progress Sampling', color: 'text-blue-600', bg: 'bg-blue-50', icon: MapPin, progress: 60 },
  completed: { label: 'Sampling Selesai', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2, progress: 100 },
  cancelled: { label: 'Ditolak', color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertCircle, progress: 0 }
};

function getGreetingByHour() {
  const hour = new Date().getHours();
  if (hour < 12) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

export default function FieldDashboard() {
  const router = useRouter();
  const greeting = getGreetingByHour();
  const [profile, setProfile] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [travelOrders, setTravelOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Rejection Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectId, setRejectId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [acceptingAssignment, setAcceptingAssignment] = useState<any>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  const loadData = useCallback(async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    else setLoading(true);

    try {
      const prof = await getProfile();
      const [assignmentsData, travelOrdersData] = await Promise.all([
        getMySamplingAssignments(1, 100),
        prof?.id ? getMyTravelOrders(prof.id) : Promise.resolve([])
      ]);

      setProfile(prof);
      setAssignments(assignmentsData.items || []);
      setTravelOrders(Array.isArray(travelOrdersData) ? travelOrdersData : []);

      if (showRefreshToast) {
        toast.success("Data Sinkron");
      }
    } catch (error: any) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // TODO: Implement polling or Server-Sent Events for real-time updates
    // const channel = supabase.channel('field_sampling_updates')...
    const interval = setInterval(() => loadData(), 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, [loadData]);

  const filteredAssignments = assignments.filter((assignment: any) => {
    const matchesSearch = search === "" ||
      assignment.location.toLowerCase().includes(search.toLowerCase()) ||
      assignment.job_order?.tracking_code?.toLowerCase().includes(search.toLowerCase()) ||
      assignment.job_order?.quotation?.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "urgent" && ["pending", "in_progress"].includes(assignment.status)) ||
      assignment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: assignments.filter(a => a.status === 'pending').length,
    in_progress: assignments.filter(a => a.status === 'in_progress').length,
    completed: assignments.filter(a => a.status === 'completed').length,
    total: assignments.length
  };
  const urgentCount = stats.pending + stats.in_progress;

  const prioritizedAssignment = assignments.find((a: any) => a.status === "pending")
    || assignments.find((a: any) => a.status === "in_progress")
    || null;
  const activeTravelOrder = travelOrders[0] || null;

  const openAcceptModal = (assignment: any) => {
    setAcceptingAssignment(assignment);
    setIsAcceptModalOpen(true);
  };

  const handleAcceptAssignment = async () => {
    if (!acceptingAssignment?.id) return;
    setIsAccepting(true);
    try {
      const res = await updateSamplingStatus(acceptingAssignment.id, 'in_progress');
      if (res.success) {
        toast.success("Tugas Diterima!", { description: "Segera mulai pengambilan sampel." });
        setIsAcceptModalOpen(false);
        setAcceptingAssignment(null);
        loadData();
      } else {
        toast.error("Gagal menerima tugas");
      }
    } catch (err) {
      toast.error("Gagal menerima tugas");
    } finally {
      setIsAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 pb-40 md:pb-10 bg-slate-50/20 min-h-screen">
      {/* Header Premium */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-8 w-1 bg-emerald-600 rounded-full" />
            <h1 className="text-3xl font-black text-emerald-950 tracking-tighter uppercase font-[family-name:var(--font-montserrat)]">
              Operasional Lapangan
            </h1>
          </div>
          <p className="text-slate-500 text-sm font-medium italic pl-4">
            {greeting}, <span className="text-emerald-700 font-bold not-italic">{profile?.full_name || "Petugas Lapangan"}</span>. Pantau rute sampling Anda.
          </p>
          <p className="text-[11px] font-bold text-slate-400 pl-4 mt-2 uppercase tracking-wider">
            {stats.total} tugas hari ini • {stats.pending} menunggu konfirmasi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="h-12 w-12 rounded-2xl border-2 border-emerald-100 bg-white text-emerald-600 shadow-sm"
          >
            <RefreshCw className={cn("h-5 w-5", refreshing && "animate-spin")} />
          </Button>
          <div className="h-12 w-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-emerald-900/20">
            {profile?.full_name?.charAt(0) || "F"}
          </div>
        </div>
      </header>

      {/* Mobile Quick Context */}
      {prioritizedAssignment && (
        <div className="md:hidden mb-6 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.15em] mb-1">Prioritas Anda</p>
          <p className="text-sm font-black text-emerald-950">{prioritizedAssignment.job_order?.tracking_code}</p>
          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{prioritizedAssignment.location}</p>
          <Button
            onClick={() => router.push(`/field/assignments/${prioritizedAssignment.id}`)}
            className="mt-3 w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest"
          >
            {prioritizedAssignment.status === "pending" ? "Mulai Tugas Berikutnya" : "Lanjutkan Sampling"}
          </Button>
        </div>
      )}

      {activeTravelOrder && (
        <div className="md:hidden mb-6 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-900/20 shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.15em]">Surat Tugas Aktif</p>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border",
                    activeTravelOrder.pdf_url
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-amber-50 text-amber-700 border-amber-100"
                  )}
                >
                  {activeTravelOrder.pdf_url ? "Siap Buka" : "Belum PDF"}
                </span>
              </div>
              <p className="text-sm font-black text-slate-900 leading-tight truncate">
                {activeTravelOrder.document_number}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                {activeTravelOrder.assignment?.job_order?.tracking_code || "Dokumen tugas"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                {activeTravelOrder.destination || activeTravelOrder.assignment?.location || "Surat tugas tersedia"}
              </p>
              <Button
                onClick={() => router.push(`/field/travel-orders/${activeTravelOrder.id}/preview`)}
                className="mt-3 h-10 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest"
              >
                Lihat Surat Tugas
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Stats Grid */}
      <div className="hidden md:grid md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Tugas Baru" value={stats.pending} icon={Clock} color="amber" onClick={() => setFilterStatus("pending")} active={filterStatus === "pending"} />
        <StatCard title="Sampling" value={stats.in_progress} icon={Truck} color="blue" onClick={() => setFilterStatus("in_progress")} active={filterStatus === "in_progress"} />
        <StatCard title="Selesai" value={stats.completed} icon={CheckCircle2} color="emerald" onClick={() => setFilterStatus("completed")} active={filterStatus === "completed"} />
        <StatCard title="Total Tugas" value={stats.total} icon={ClipboardList} color="slate" onClick={() => setFilterStatus("all")} active={filterStatus === "all"} />
      </div>

      {/* Mobile Floating Search + Filter */}
      <div className="md:hidden sticky top-3 z-30 mb-6">
        <div className="rounded-2xl border border-white/70 bg-white/70 backdrop-blur-xl p-2 shadow-xl shadow-slate-300/30">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
              <input
                placeholder="Cari lokasi / tracking..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-11 pl-10 pr-3 bg-white/90 border border-slate-200 rounded-xl shadow-sm focus:border-emerald-500 outline-none transition-all font-medium text-xs"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-11 w-[122px] rounded-xl border border-slate-200 bg-white/90 px-3 text-[10px] font-black uppercase tracking-wide">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-slate-100">
                <SelectItem value="all" className="font-bold text-xs">Semua ({stats.total})</SelectItem>
                <SelectItem value="urgent" className="font-bold text-xs">Urgent ({urgentCount})</SelectItem>
                <SelectItem value="pending" className="font-bold text-xs">Pending ({stats.pending})</SelectItem>
                <SelectItem value="in_progress" className="font-bold text-xs">Aktif ({stats.in_progress})</SelectItem>
                <SelectItem value="completed" className="font-bold text-xs">Selesai ({stats.completed})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Quick Action */}
      {prioritizedAssignment && (
        <div className="md:hidden fixed bottom-24 left-0 right-0 px-4 z-40 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto rounded-2xl border border-emerald-200 bg-white/95 backdrop-blur p-3 shadow-xl shadow-emerald-900/10">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Quick Action</p>
                <p className="text-xs font-black text-slate-800 truncate">
                  {prioritizedAssignment.job_order?.tracking_code} • {prioritizedAssignment.job_order?.quotation?.title || "Perihal belum diisi"}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => router.push(`/field/assignments/${prioritizedAssignment.id}`)}
                className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] uppercase"
              >
                {prioritizedAssignment.status === "pending" ? "Mulai" : "Lanjut"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main List Container */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 border border-slate-100 overflow-hidden">
        <div className="hidden md:flex p-8 border-b bg-slate-50/30 gap-6 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
            <input
              placeholder="Cari lokasi atau kode tracking..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm focus:border-emerald-500 outline-none transition-all font-medium text-sm"
            />
          </div>
          <div className="hidden md:flex gap-3 w-full md:w-auto">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-14 w-full md:w-44 rounded-2xl border-2 border-slate-100 bg-white font-bold text-xs">
                <Filter className="h-4 w-4 mr-2 text-emerald-600" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
                <SelectContent className="rounded-2xl border-2 border-slate-100">
                  <SelectItem value="all" className="font-bold text-xs">Semua Status</SelectItem>
                  <SelectItem value="urgent" className="font-bold text-xs">Urgent (Pending + Aktif)</SelectItem>
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <SelectItem key={key} value={key} className="font-bold text-xs">{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-24">
              <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-emerald-200">
                <MapPin className="h-10 w-10 text-emerald-200" />
              </div>
              <p className="font-black text-slate-400 uppercase text-xs tracking-widest">Tidak ada penugasan</p>
            </div>
          ) : (
            filteredAssignments.map((assignment: any, index: number) => {
              const config = statusConfig[assignment.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              const isPending = assignment.status === 'pending';

              return (
                <motion.div
                  key={assignment.id}
                  className="p-4 md:p-8 hover:bg-emerald-50/20 transition-all cursor-pointer group"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: index * 0.045 }}
                  onClick={() => router.push(`/field/assignments/${assignment.id}`)}
                >
                  <div className="flex flex-col gap-4 md:gap-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex gap-3 md:gap-5">
                        <div className={cn(
                          "h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-[9px] md:text-[10px] shrink-0 transition-all duration-500",
                          isPending ? "bg-amber-500 text-white animate-pulse shadow-lg shadow-amber-500/20" : "bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 shadow-inner"
                        )}>
                          {isPending ? 'NEW' : 'SMP'}
                        </div>
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] md:text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg whitespace-nowrap">
                              {assignment.job_order?.tracking_code}
                            </span>
                            <Badge className={cn("text-[8px] md:text-[9px] font-black uppercase px-2 md:px-3 py-1 rounded-full border-none shadow-sm whitespace-nowrap", config.bg, config.color)}>
                              <StatusIcon className="h-3 w-3 mr-1.5" />
                              {isPending ? 'Tugas Baru' : config.label}
                            </Badge>
                          </div>
                          <h4 className="font-black text-slate-800 text-sm md:text-lg leading-tight group-hover:text-emerald-700 transition-colors line-clamp-2">
                            {assignment.job_order?.quotation?.title || 'Perihal Pengujian Belum Diisi'}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase flex items-center gap-1.5 min-w-0">
                              <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate">{assignment.location}</span>
                            </p>
                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-slate-500 uppercase bg-slate-100 border border-slate-200 px-2 py-1 rounded-full whitespace-nowrap">
                              <Calendar className="h-3 w-3" />
                              {new Date(assignment.scheduled_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isPending ? (
                        <div className="hidden md:flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 font-black text-[10px] uppercase h-14 px-6 rounded-2xl border-2 border-rose-50 hover:bg-rose-50 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRejectId(assignment.id);
                              setIsRejectModalOpen(true);
                            }}
                          >
                            Tolak Tugas
                          </Button>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase h-14 px-8 rounded-2xl shadow-xl shadow-emerald-900/20 tracking-widest border-4 border-emerald-50 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAcceptModal(assignment);
                            }}
                          >
                            Terima Tugas
                          </Button>
                        </div>
                      ) : (
                        <div className="text-right">
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[2px]">Progress</p>
                           <p className="text-2xl font-black text-emerald-950 leading-none mt-1">{config.progress}%</p>
                        </div>
                      )}
                    </div>

                    {isPending && (
                      <div className="md:hidden grid grid-cols-2 gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 font-black text-[10px] uppercase h-10 rounded-xl border border-rose-100 hover:bg-rose-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRejectId(assignment.id);
                            setIsRejectModalOpen(true);
                          }}
                        >
                          Tolak
                        </Button>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase h-10 rounded-xl shadow-md shadow-emerald-900/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAcceptModal(assignment);
                          }}
                        >
                          Terima
                        </Button>
                      </div>
                    )}

                    {!isPending && (
                      <div className="space-y-3">
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={cn("h-full transition-all duration-1000 ease-out", config.color.replace('text', 'bg'))}
                            style={{ width: `${config.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-slate-300" />
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                {new Date(assignment.scheduled_date).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long' })}
                              </p>
                           </div>
                           <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <p className="text-[9px] font-black text-emerald-600 uppercase italic">Live Operational Update</p>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* REJECTION MODAL */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-rose-600 p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center border-2 border-white/20">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Tolak Penugasan</DialogTitle>
                <DialogDescription className="text-rose-100 text-[10px] font-bold uppercase tracking-widest">Berikan alasan penolakan Anda</DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest ml-1">Alasan Penolakan</label>
              <Textarea 
                placeholder="Contoh: Kendaraan rusak, Sakit, atau Jadwal bentrok..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="rounded-2xl bg-slate-50 border-2 border-slate-100 min-h-[120px] resize-none focus:border-rose-500 transition-all font-medium"
              />
            </div>
            
            <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-100 flex items-center gap-3">
               <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
               <p className="text-[10px] text-amber-700 font-bold leading-relaxed">Penolakan akan mengirimkan notifikasi instan kepada Admin/Operator untuk penjadwalan ulang.</p>
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50 border-t flex gap-4">
            <Button variant="ghost" onClick={() => setIsRejectModalOpen(false)} className="flex-1 font-black text-[10px] uppercase h-14 rounded-2xl text-slate-400">Batalkan</Button>
            <Button 
              onClick={async () => {
                if (!rejectReason) return toast.error("Alasan wajib diisi");
                setIsRejecting(true);
                try {
                  const res = await rejectSamplingAssignment(rejectId, rejectReason);
                  if (res.success) {
                    toast.success("Tugas Berhasil Ditolak");
                    setIsRejectModalOpen(false);
                    setRejectReason("");
                    loadData();
                  }
                } catch (err) { toast.error("Gagal mengirim penolakan"); }
                finally { setIsRejecting(false); }
              }}
              disabled={isRejecting}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase h-14 rounded-2xl shadow-xl shadow-rose-900/20"
            >
              {isRejecting ? 'Memproses...' : 'Konfirmasi Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ACCEPT CONFIRMATION MODAL */}
      <Dialog
        open={isAcceptModalOpen}
        onOpenChange={(open) => {
          if (isAccepting) return;
          setIsAcceptModalOpen(open);
          if (!open) setAcceptingAssignment(null);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-600 p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center border-2 border-white/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Terima Tugas Ini?</DialogTitle>
                <DialogDescription className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest">
                  Status akan berubah menjadi sampling aktif
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-5">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-2">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                Ringkasan Penugasan
              </p>
              <p className="text-xs font-black text-slate-800">
                {acceptingAssignment?.job_order?.tracking_code || "-"}
              </p>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                {acceptingAssignment?.job_order?.quotation?.title || "Perihal pengujian belum diisi"}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                {acceptingAssignment?.location || "-"}
              </p>
            </div>
          </div>

          <DialogFooter className="p-8 bg-slate-50 border-t flex gap-4">
            <Button
              variant="ghost"
              disabled={isAccepting}
              onClick={() => {
                setIsAcceptModalOpen(false);
                setAcceptingAssignment(null);
              }}
              className="flex-1 font-black text-[10px] uppercase h-14 rounded-2xl text-slate-400"
            >
              Batal
            </Button>
            <Button
              onClick={handleAcceptAssignment}
              disabled={isAccepting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase h-14 rounded-2xl shadow-xl shadow-emerald-900/20"
            >
              {isAccepting ? "Memproses..." : "Ya, Terima Tugas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, onClick, active }: any) {
  const styles: any = {
    amber: {
      icon: "text-amber-600 bg-amber-500/15",
      glow: "from-amber-400/25 via-amber-300/10 to-transparent",
      ring: "ring-amber-300/40",
    },
    blue: {
      icon: "text-blue-600 bg-blue-500/15",
      glow: "from-blue-400/25 via-blue-300/10 to-transparent",
      ring: "ring-blue-300/40",
    },
    emerald: {
      icon: "text-emerald-600 bg-emerald-500/15",
      glow: "from-emerald-400/25 via-emerald-300/10 to-transparent",
      ring: "ring-emerald-300/40",
    },
    slate: {
      icon: "text-slate-600 bg-slate-500/15",
      glow: "from-slate-400/25 via-slate-300/10 to-transparent",
      ring: "ring-slate-300/40",
    },
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden p-2.5 md:p-5 rounded-xl md:rounded-[1.75rem] border transition-all duration-300 cursor-pointer group backdrop-blur-xl",
        "bg-white/55 supports-[backdrop-filter]:bg-white/45",
        active
          ? cn("border-white/70 shadow-xl shadow-emerald-900/15 scale-[1.02]", styles[color].ring)
          : "border-white/60 shadow-md shadow-slate-200/40 hover:border-white/80 hover:shadow-lg hover:shadow-emerald-900/10"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 opacity-80 bg-gradient-to-br transition-opacity duration-300",
          styles[color].glow,
          active ? "opacity-100" : "group-hover:opacity-100"
        )}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-white/5 pointer-events-none" />

      <div
        className={cn(
          "relative h-8 w-8 md:h-11 md:w-11 rounded-lg md:rounded-xl flex items-center justify-center mb-1.5 md:mb-3 border border-white/50 shadow-sm transition-transform group-hover:scale-110",
          styles[color].icon
        )}
      >
        <Icon className="h-3.5 w-3.5 md:h-5 md:w-5" />
      </div>
      <p className="relative text-lg md:text-2xl font-black text-slate-900 leading-none mb-0.5">{value}</p>
      <p className="relative text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-wide md:tracking-widest">{title}</p>
    </div>
  );
}
