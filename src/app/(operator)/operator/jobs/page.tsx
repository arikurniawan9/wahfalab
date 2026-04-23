// ============================================================================
// PREMIUM WORKFLOW PROGRESS - v3.3 (Visual Timeline Restored)
// Engineered for maximum operational efficiency and high-end visual pulse effects.
// ============================================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList, Clock, CheckCircle2, Beaker, ArrowRight, Search, Filter,
  RefreshCw, FlaskConical, FileText, MapPin, Calendar, User, AlertCircle,
  ChevronRight, Truck, TestTube, Briefcase, Printer, Eye, Plus, ArrowUpRight,
  Database, LayoutDashboard, X, Lock, Check, ClipboardCheck, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { ChemicalLoader, LoadingOverlay, LoadingButton } from "@/components/ui";
// TODO: Remove supabase client import - replaced with polling for real-time updates
// import { createClient } from '@/lib/supabase/client';
import { getJobOrders, getJobStats, getFieldOfficers } from "@/lib/actions/jobs";
import { getFieldAssistants } from "@/lib/actions/field-assistant";
import { createSamplingAssignment } from "@/lib/actions/sampling";
import { createTravelOrder } from "@/lib/actions/travel-order";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getDisplayJobNotes } from "@/lib/job-notes";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PremiumPageWrapper, PremiumCard } from "@/components/layout/PremiumPageWrapper";

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: any; progress: number }> = {
  scheduled: { label: 'Terjadwal', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: Clock, progress: 20 },
  sampling: { label: 'Sampling', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: Truck, progress: 40 },
  analysis_ready: { label: 'Diterima Lab', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: ClipboardCheck, progress: 55 },
  analysis: { label: 'Analisis Lab', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', icon: Beaker, progress: 70 },
  reporting: { label: 'Pelaporan', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: FileText, progress: 85 },
  completed: { label: 'Selesai', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle2, progress: 100 }
};

// COMPONENT: Visual Workflow Pulse Timeline
function WorkflowTimeline({ status }: { status: string }) {
  const stages = [
    { id: 'scheduled', name: "Antrean", icon: Clock },
    { id: 'sampling', name: "Sampling", icon: Truck },
    { id: 'analysis_ready', name: "BAST", icon: ClipboardCheck },
    { id: 'analysis', name: "Lab", icon: Beaker },
    { id: 'reporting', name: "Laporan", icon: FileText },
    { id: 'completed', name: "Selesai", icon: CheckCircle2 },
  ];

  const currentIdx = stages.findIndex(s => s.id === status);

  return (
    <div className="flex items-center gap-1.5 justify-center">
      {stages.map((stage, index) => {
        const isPast = index < currentIdx;
        const isCurrent = index === currentIdx;
        const Icon = stage.icon;

        return (
          <React.Fragment key={stage.id}>
            <div className="flex flex-col items-center gap-1.5 group relative">
              <div className={cn(
                "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-700",
                isPast ? "bg-emerald-500 border-emerald-400 text-white shadow-lg" :
                isCurrent ? "bg-emerald-950 border-emerald-900 text-white scale-110 shadow-xl animate-pulse" :
                "bg-slate-50 border-slate-100 text-slate-300"
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <span className={cn(
                "text-[7px] font-black uppercase tracking-tighter text-center w-10 leading-tight",
                isPast || isCurrent ? "text-slate-800" : "text-slate-300"
              )}>{stage.name}</span>
              
              {/* Tooltip on hover */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {stage.name}: {isPast ? 'Selesai' : isCurrent ? 'Proses' : 'Menunggu'}
              </div>
            </div>
            {index < stages.length - 1 && (
              <div className={cn(
                "w-3 md:w-5 h-0.5 rounded-full mb-4",
                isPast ? "bg-emerald-500" : "bg-slate-100"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function OperatorJobProgressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [fieldOfficers, setFieldOfficers] = useState<any[]>([]);
  const [assistants, setAssistants] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [assignFormData, setAssignFormData] = useState<any>({
    job_order_id: "", field_officer_id: "", assistant_ids: [],
    scheduled_date: "", scheduled_time: "08:00", location: "", notes: ""
  });

  // TODO: Supabase client removed - using polling instead of real-time subscriptions

  const loadData = useCallback(async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    else setLoading(true);
    try {
      const [jobsData, statsData, officers, assistantList] = await Promise.all([
        getJobOrders(1, 50), getJobStats(), getFieldOfficers(), getFieldAssistants()
      ]);
      setJobs(jobsData.items || []);
      setStats(statsData);
      setFieldOfficers(officers);
      setAssistants(assistantList?.items || []);
      if (showRefreshToast) toast.success("Data Operasional Diperbarui");
    } catch (error: any) { toast.error("Gagal sinkronisasi data"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    loadData();
    // Replaced supabase real-time subscription with polling every 60 seconds
    const interval = setInterval(() => loadData(), 60000);
    return () => { clearInterval(interval); };
  }, [loadData]);

  const openAssignDialog = (job: any) => {
    setSelectedJob(job);
    setAssignFormData({
      job_order_id: job.id, field_officer_id: "", assistant_ids: [],
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: "08:00", location: job.quotation?.profile?.address || "", notes: ""
    });
    setIsAssignDialogOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (!assignFormData.field_officer_id || !assignFormData.scheduled_date) { toast.error("Data tidak lengkap"); return; }
    setSubmitting(true);
    try {
      const res = await createSamplingAssignment({ ...assignFormData, scheduled_date: `${assignFormData.scheduled_date}T${assignFormData.scheduled_time}:00` });
      if (res.error) throw new Error(res.error);
      await createTravelOrder({ assignment_id: res.assignment.id, departure_date: `${assignFormData.scheduled_date}T${assignFormData.scheduled_time}:00`, return_date: `${assignFormData.scheduled_date}T17:00:00`, destination: assignFormData.location, purpose: `Sampling untuk ${selectedJob.tracking_code}` });
      toast.success("Penugasan Berhasil!"); setIsAssignDialogOpen(false); loadData();
    } catch (error: any) { toast.error(error.message || "Gagal"); }
    finally { setSubmitting(false); }
  };

  const filteredJobs = jobs.filter((job: any) => {
    const matchesSearch = search === "" || job.tracking_code.toLowerCase().includes(search.toLowerCase()) || job.quotation?.profile?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || job.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><ChemicalLoader /></div>;

  return (
    <PremiumPageWrapper className="p-4 md:p-10 pb-24 md:pb-10 space-y-10 bg-slate-50/20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-8 w-1 bg-emerald-600 rounded-full" />
            <h1 className="text-3xl font-black text-emerald-950 tracking-tighter uppercase font-[family-name:var(--font-montserrat)]">Operasional Hub</h1>
          </div>
          <p className="text-slate-500 text-sm font-medium italic pl-4">Monitoring siklus hidup pekerjaan <span className="text-emerald-700 font-bold not-italic">WahfaLab</span> secara real-time.</p>
        </div>
        <Button variant="outline" onClick={() => loadData(true)} disabled={refreshing} className="h-12 px-6 rounded-2xl border-2 border-emerald-100 text-emerald-700 font-black text-xs uppercase hover:bg-emerald-50 bg-white shadow-sm transition-all"><RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} /> Sync Data</Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <StatCard title="Total" value={stats.total || 0} icon={Briefcase} color="emerald" active={filterStatus === "all"} onClick={() => setFilterStatus("all")} />
        <StatCard title="Terjadwal" value={stats.scheduled || 0} icon={Clock} color="blue" active={filterStatus === "scheduled"} onClick={() => setFilterStatus("scheduled")} />
        <StatCard title="Sampling" value={stats.sampling || 0} icon={Truck} color="amber" active={filterStatus === "sampling"} onClick={() => setFilterStatus("sampling")} />
        <StatCard title="Analisis" value={stats.analysis || 0} icon={TestTube} color="purple" active={filterStatus === "analysis"} onClick={() => setFilterStatus("analysis")} />
        <StatCard title="Pelaporan" value={stats.reporting || 0} icon={FileText} color="indigo" active={filterStatus === "reporting"} onClick={() => setFilterStatus("reporting")} />
        <StatCard title="Selesai" value={stats.completed || 0} icon={CheckCircle2} color="emerald" active={filterStatus === "completed"} onClick={() => setFilterStatus("completed")} />
      </div>

      {/* Main Table */}
      <PremiumCard className="border-none shadow-2xl shadow-emerald-900/5 rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="p-8 border-b bg-slate-50/30 flex flex-col md:flex-row gap-6 items-center">
            <div className="relative flex-1 w-full"><Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" /><input placeholder="Cari tracking code atau klien..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-14 pl-12 pr-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm focus:border-emerald-500 outline-none font-medium text-sm transition-all" /></div>
            <div className="flex gap-3 w-full md:w-auto">
               <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-14 w-full md:w-48 rounded-2xl border-2 border-slate-100 bg-white font-bold text-xs uppercase"><Filter className="h-4 w-4 mr-2 text-emerald-600" /><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent className="rounded-2xl border-2 border-slate-100 shadow-xl">{Object.entries(statusConfig).map(([val, cfg]) => (<SelectItem key={val} value={val} className="font-bold text-xs uppercase cursor-pointer">{cfg.label}</SelectItem>))}</SelectContent>
               </Select>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="min-w-full">
              <thead className="bg-slate-50/50 border-b border-slate-100 text-left">
                <tr>
                  <th className="px-8 py-5 font-black text-emerald-900/40 uppercase text-[10px] tracking-[2px]">Info Order</th>
                  <th className="px-6 py-5 font-black text-emerald-900/40 uppercase text-[10px] tracking-[2px]">Klien & Perusahaan</th>
                  <th className="px-6 py-5 font-black text-emerald-900/40 uppercase text-[10px] tracking-[2px] text-center">Status & Progres Live</th>
                  <th className="px-6 py-5 text-center font-black text-emerald-900/40 uppercase text-[10px] tracking-[2px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredJobs.length === 0 ? (
                  <tr><td colSpan={4} className="py-24 text-center text-slate-400 font-black uppercase text-xs tracking-widest">Data Tidak Ditemukan</td></tr>
                ) : (
                  filteredJobs.map((job) => {
                    let cfg = statusConfig[job.status] || statusConfig.scheduled;
                    
                    // CUSTOM OVERRIDE: Jika status JobOrder adalah sampling, tapi penugasan dikembalikan ke pending
                    const isActuallyPending = job.status === 'sampling' && job.sampling_assignment?.status === 'pending';
                    if (isActuallyPending) {
                      cfg = {
                        ...cfg,
                        label: 'Sedang di Pending',
                        color: 'text-rose-600',
                        bg: 'bg-rose-50',
                        icon: Clock, // atau icon lain yang menandakan delay
                      };
                    }

                    return (
                      <tr key={job.id} className="group hover:bg-emerald-50/30 transition-all cursor-default">
                        <td className="px-8 py-6">
                          <div className="flex flex-col"><span className="font-mono text-sm font-black text-emerald-700 bg-emerald-100/50 px-3 py-1 rounded-lg w-fit mb-2">{job.tracking_code}</span><div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase"><Calendar className="h-3 w-3" />{new Date(job.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div></div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex flex-col"><span className="font-black text-slate-800 text-sm">{job.quotation?.profile?.full_name}</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1"><Briefcase className="h-3 w-3 inline mr-1 text-emerald-600" />{job.quotation?.profile?.company_name || 'Personal Account'}</span></div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="space-y-3 min-w-[220px]">
                            <div className="flex justify-between items-center">
                               <Badge className={cn("font-black text-[9px] uppercase px-3 py-1 rounded-full border-none shadow-sm", cfg.bg, cfg.color)}>
                                 <cfg.icon className="h-3 w-3 mr-1.5" />
                                 {cfg.label}
                               </Badge>
                               <span className="text-xs font-black text-emerald-950">{cfg.progress}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                               <div 
                                 className={cn("h-full transition-all duration-1000 ease-out", cfg.color.replace('text', 'bg'))}
                                 style={{ width: `${cfg.progress}%` }}
                               />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Smart Action Toggle */}
                            {job.status === 'scheduled' && !job.sampling_assignment && (
                              <Button 
                                size="sm" 
                                onClick={() => openAssignDialog(job)} 
                                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase h-10 px-4 rounded-xl shadow-lg transition-all active:scale-95"
                              >
                                <Truck className="h-3.5 w-3.5 mr-2" /> Tugaskan
                              </Button>
                            )}

                            {job.sampling_assignment && (
                              <div className="flex flex-col items-center gap-1.5 animate-in fade-in zoom-in-95 duration-500">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm">
                                    <User className="h-3 w-3" />
                                    <span className="text-[10px] font-black uppercase tracking-tighter">
                                      {job.sampling_assignment.field_officer?.full_name?.split(' ')[0]}
                                    </span>
                                  </div>
                                  
                                  {/* Tombol Cetak SPPD / Surat Tugas */}
                                  {job.sampling_assignment.travel_order && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      title="Cetak Surat Tugas (SPPD)"
                                      onClick={() => window.open(`/field/travel-orders/${job.sampling_assignment.travel_order.id}/preview`, '_blank')}
                                      className="h-8 w-8 rounded-lg border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                    >
                                      <Printer className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                </div>

                                {job.status === 'scheduled' && (
                                  <button 
                                    onClick={() => openAssignDialog(job)}
                                    className="text-[8px] font-black text-slate-400 uppercase hover:text-blue-600 transition-colors"
                                  >
                                    Ubah Petugas
                                  </button>
                                )}
                              </div>
                            )}

                            <Button 
                              variant="ghost" 
                              onClick={() => { setSelectedJob(job); setIsDetailOpen(true); }} 
                              className="h-10 w-10 rounded-xl hover:bg-emerald-100 text-emerald-600 transition-all shadow-sm"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </PremiumCard>

      {/* COMPACT ASSIGNMENT MODAL (PREMIUM) */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-xl p-0 border-none shadow-2xl rounded-[2.5rem] overflow-hidden max-h-[95vh] flex flex-col">
          <div className="bg-emerald-700 p-8 text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-600 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl opacity-50" />
            <div className="flex items-center gap-4 relative z-10"><div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center border-2 border-white/20 shadow-inner transform rotate-3"><MapPin className="h-6 w-6" /></div><div><DialogTitle className="text-xl font-black uppercase tracking-tight leading-none pt-1">Penugasan Sampling</DialogTitle><DialogDescription className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-1">Sistem Penjadwalan WahfaLab</DialogDescription></div></div>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
            <section className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] ml-1">Petugas Utama</Label><Select value={assignFormData.field_officer_id} onValueChange={(val) => setAssignFormData({ ...assignFormData, field_officer_id: val })}><SelectTrigger className="h-14 rounded-2xl bg-slate-50/50 border-2 border-slate-100 focus:border-emerald-500 font-bold text-sm shadow-sm transition-all"><SelectValue placeholder="Pilih..." /></SelectTrigger><SelectContent className="rounded-2xl border-2 border-slate-100 shadow-2xl">{fieldOfficers.map((o) => <SelectItem key={o.id} value={o.id} className="font-bold text-xs uppercase cursor-pointer">{o.full_name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] ml-1">Jadwal Lapangan</Label><div className="flex gap-2"><Input type="date" value={assignFormData.scheduled_date} onChange={(e) => setAssignFormData({ ...assignFormData, scheduled_date: e.target.value })} className="h-14 rounded-2xl bg-slate-50/50 border-2 border-slate-100 font-bold text-sm" /><Input type="time" value={assignFormData.scheduled_time} onChange={(e) => setAssignFormData({ ...assignFormData, scheduled_time: e.target.value })} className="h-14 rounded-2xl bg-slate-50/50 border-2 border-slate-100 font-bold text-sm w-28 shrink-0" /></div></div>
              </div>
              <div className="space-y-3"><Label className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] ml-1">Asisten (Multi-Select)</Label><div className="bg-slate-50 p-2 rounded-2xl border-2 border-slate-100 min-h-[64px] flex flex-wrap gap-2 items-center">{assignFormData.assistant_ids.length === 0 ? (<span className="text-xs text-slate-400 font-bold px-4">Pilih asisten...</span>) : (assignFormData.assistant_ids.map((aid: string) => { const assistant = assistants.find(a => a.id === aid); return (<Badge key={aid} className="bg-emerald-600 text-white font-black text-[9px] uppercase h-9 px-3 rounded-xl flex items-center gap-2 transition-all hover:bg-emerald-700 shadow-md">{assistant?.full_name}<button onClick={(e) => { e.preventDefault(); setAssignFormData({ ...assignFormData, assistant_ids: assignFormData.assistant_ids.filter((id: string) => id !== aid) }); }} className="hover:bg-black/20 rounded-full p-0.5"><X className="h-3 w-3" /></button></Badge>); }))}</div><Select onValueChange={(val) => { if (!assignFormData.assistant_ids.includes(val)) setAssignFormData({ ...assignFormData, assistant_ids: [...assignFormData.assistant_ids, val] }); }}><SelectTrigger className="h-10 border-2 border-slate-100 rounded-xl bg-white text-xs font-bold shadow-sm transition-all hover:border-emerald-200"><SelectValue placeholder="+ Tambah Asisten" /></SelectTrigger><SelectContent className="rounded-xl border-2 border-slate-100 shadow-2xl">{assistants.filter(a => !assignFormData.assistant_ids.includes(a.id)).map((o) => (<SelectItem key={o.id} value={o.id} className="font-bold text-[10px] uppercase cursor-pointer">{o.full_name}</SelectItem>))}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] ml-1">Lokasi Sampling</Label><Input value={assignFormData.location} onChange={(e) => setAssignFormData({ ...assignFormData, location: e.target.value })} placeholder="Alamat lengkap lokasi..." className="h-14 rounded-2xl bg-slate-50/50 border-2 border-slate-100 font-medium text-sm" /></div>
              <div className="space-y-2"><Label className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] ml-1">Catatan Tambahan</Label><Textarea value={assignFormData.notes} onChange={(e) => setAssignFormData({ ...assignFormData, notes: e.target.value })} placeholder="Instruksi khusus..." className="rounded-2xl bg-slate-50/50 border-2 border-slate-100 min-h-[100px] resize-none text-sm" /></div>
            </section>
            <div className="p-5 bg-blue-50 rounded-3xl border-2 border-blue-100/50 flex items-center gap-4"><Printer className="h-6 w-6 text-blue-600 shrink-0" /><p className="text-[10px] text-blue-700 font-bold uppercase tracking-tight leading-relaxed">Sistem akan otomatis menerbitkan dokumen <span className="font-black underline">SPPD Digital</span> setelah dikonfirmasi.</p></div>
          </div>
          <DialogFooter className="p-8 bg-slate-50 border-t flex flex-row gap-4 shrink-0"><Button variant="ghost" onClick={() => setIsAssignDialogOpen(false)} className="flex-1 font-black text-[10px] uppercase h-14 rounded-2xl text-slate-400 border-2 border-transparent hover:border-slate-200 transition-all">Batal</Button><LoadingButton onClick={handleAssignSubmit} loading={submitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase h-14 rounded-2xl shadow-xl shadow-emerald-900/30 tracking-[2px]">Konfirmasi Tugas</LoadingButton></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-xl p-0 border-none shadow-2xl rounded-[3rem] overflow-hidden">
          <div className="bg-slate-900 p-8 text-white relative flex items-center gap-6"><div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/20 transform rotate-3"><Activity className="h-8 w-8 text-slate-900" /></div><div><DialogTitle className="text-xl font-black uppercase tracking-tight leading-none">Detail Order</DialogTitle><Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-black uppercase mt-1">{selectedJob?.tracking_code}</Badge></div><Button variant="ghost" size="icon" onClick={() => setIsDetailOpen(false)} className="absolute top-8 right-8 text-white/40 hover:text-white rounded-2xl h-12 w-12"><X className="h-6 w-6" /></Button></div>
          <div className="p-8 space-y-8 bg-white max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4"><div className="bg-slate-50 p-5 rounded-3xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Tanggal Masuk</p><p className="text-sm font-black text-slate-800">{new Date(selectedJob?.created_at).toLocaleDateString('id-ID')}</p></div><div className="bg-slate-50 p-5 rounded-3xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Nominal</p><p className="text-sm font-black text-emerald-700">Rp {Number(selectedJob?.quotation?.total_amount || 0).toLocaleString("id-ID")}</p></div></div>
            
            {/* Operational Notes / Reason for Delay */}
            {getDisplayJobNotes(selectedJob?.notes) && (
              <div className="bg-rose-50 p-6 rounded-3xl border-2 border-rose-100/50">
                <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <AlertCircle className="h-3 w-3" /> Catatan Operasional / Penundaan
                </p>
                <p className="text-xs font-bold text-rose-800 leading-relaxed italic">
                  "{getDisplayJobNotes(selectedJob?.notes)}"
                </p>
              </div>
            )}

            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Operational Timeline</p>
              <div className="flex justify-center py-2"><WorkflowTimeline status={selectedJob?.status || ''} /></div>
              
              {/* Dynamic Status Label for Modal */}
              {(() => {
                const isActuallyPending = selectedJob?.status === 'sampling' && selectedJob?.sampling_assignment?.status === 'pending';
                if (isActuallyPending) {
                  return (
                    <div className="mt-8 flex flex-col items-center gap-2">
                      <p className="text-[10px] font-black text-rose-600 uppercase tracking-[3px] animate-pulse">SEDANG DI PENDING</p>
                      <Badge className="bg-rose-100 text-rose-600 border-none font-black text-[8px] uppercase px-3 py-1 rounded-full">Petugas Menangguhkan Tugas</Badge>
                    </div>
                  );
                }
                return <p className="mt-8 text-[10px] font-black text-emerald-600 uppercase tracking-[3px] animate-pulse">{statusConfig[selectedJob?.status]?.label || 'PROSES DATA'}</p>;
              })()}
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex flex-row gap-3"><Button variant="outline" onClick={() => setIsDetailOpen(false)} className="flex-1 font-black text-[10px] uppercase h-12 rounded-2xl">Tutup</Button><Button onClick={() => { setIsDetailOpen(false); router.push(`/operator/quotations/${selectedJob?.quotation_id}`); }} className="flex-1 bg-emerald-600 text-white font-black text-[10px] uppercase h-12 rounded-2xl shadow-xl gap-2">Lihat Quotation</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <LoadingOverlay isOpen={submitting} title="Menerbitkan Tugas..." description="Mohon tunggu sebentar, sistem sedang menyiapkan dokumen digital penugasan." />
    </PremiumPageWrapper>
  );
}

function StatCard({ title, value, icon: Icon, color, active, onClick }: any) {
  const styles: any = { emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' }, blue: { bg: 'bg-blue-50', text: 'text-blue-600' }, amber: { bg: 'bg-amber-50', text: 'text-amber-600' }, purple: { bg: 'bg-purple-50', text: 'text-purple-600' }, indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' } };
  const style = styles[color] || styles.emerald;
  return (<div onClick={onClick} className={cn("cursor-pointer border-2 transition-all duration-300 rounded-[1.5rem] overflow-hidden group bg-white p-5 flex flex-col gap-3", active ? "border-emerald-600 shadow-xl scale-105" : "border-slate-50 hover:border-emerald-200 shadow-sm")}><div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110", style.bg, style.text)}><Icon className="h-5 w-5" /></div><div><p className="text-2xl font-black text-slate-800 leading-none mb-1">{value}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</p></div></div>);
}
