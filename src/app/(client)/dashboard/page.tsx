// ============================================================================
// CLIENT MONITORING DASHBOARD - v3.2 (Enhanced Ownership Detection)
// Dashboard transparan untuk pelanggan memantau progres laboratorium secara riil-time.
// ============================================================================

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Box, Clock, ArrowRight, FlaskConical, MapPin, ClipboardCheck, Truck,
  Beaker, FileText, FileCheck, ChevronRight, RefreshCw, Search, Download,
  History, Eye, Calendar, DollarSign, CheckCircle, AlertCircle, CreditCard,
  ShieldCheck, Zap, User, MessageCircle, Activity, X, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { getJobOrders } from "@/lib/actions/jobs";
import { getProfile } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ChemicalLoader } from "@/components/ui";

const steps = [
  { id: 'scheduled', label: 'Antrean', icon: Clock, color: 'amber' },
  { id: 'sampling', label: 'Sampling', icon: Truck, color: 'blue' },
  { id: 'analysis_ready', label: 'BAST', icon: ClipboardCheck, color: 'emerald' },
  { id: 'analysis', label: 'Lab', icon: Beaker, color: 'purple' },
  { id: 'reporting', label: 'Laporan', icon: FileText, color: 'indigo' },
  { id: 'completed', label: 'Selesai', icon: FileCheck, color: 'emerald' }
];

const statusColors: Record<string, string> = {
  scheduled: 'bg-amber-50 text-amber-600 border-amber-100',
  sampling: 'bg-blue-50 text-blue-600 border-blue-100',
  analysis_ready: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  analysis: 'bg-purple-50 text-purple-600 border-purple-100',
  reporting: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  completed: 'bg-emerald-50 text-emerald-600 border-emerald-100'
};

const statusLabels: Record<string, string> = {
  scheduled: 'ANTREAN',
  sampling: 'PETUGAS DI LAPANGAN',
  analysis_ready: 'SAMPEL DITERIMA LAB',
  analysis: 'PROSES ANALISIS LAB',
  reporting: 'PENYUSUNAN LAPORAN',
  completed: 'PEKERJAAN SELESAI'
};

export default function ClientDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [sentQuotations, setSentQuotations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const loadData = useCallback(async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    else setLoading(true);

    try {
      // Get user from session
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      const user = session?.user || null;

      const [prof, jobsData, notifData] = await Promise.all([
        getProfile(),
        getJobOrders(1, 100),
        fetch('/api/notifications?limit=10').then(res => res.json())
      ]);

      setProfile(prof);
      setNotifications(notifData.notifications || []);
      
      const userEmail = user?.email?.toLowerCase();

      // FETCH QUOTATIONS by EMAIL or ID
      const { getQuotations } = await import('@/lib/actions/quotation');
      const qData = await getQuotations({ 
        page: 1, limit: 20, status: "sent"
      });
      
      // Filter quotations belonging to this user
      const mySentQuotations = (qData.items || []).filter((q: any) => 
        q.user_id === user?.id || (q.profile?.email?.toLowerCase() === userEmail)
      );
      setSentQuotations(mySentQuotations);

      // Filter jobs belonging to this user
      const filteredJobs = (jobsData.items || []).filter(
        (j: any) => {
          const profileIdMatch = j.quotation?.profile?.id === prof?.id;
          const userIdMatch = j.quotation?.user_id === user?.id;
          const emailMatch = userEmail && j.quotation?.profile?.email?.toLowerCase() === userEmail;
          return profileIdMatch || userIdMatch || emailMatch;
        }
      );
      
      setActiveJobs(filteredJobs);

      if (showRefreshToast) toast.success("Data terbaru berhasil disinkronkan");
    } catch (error: any) {
      console.error('Load data error:', error);
      toast.error("Gagal memuat data terbaru");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // TODO: Implement polling or Server-Sent Events for real-time updates
    // const channel = supabase.channel('client_refresh')...
    const interval = setInterval(() => loadData(), 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, [loadData]);

  const handleApproveQuotation = async (id: string) => {
    try {
      const { updateQuotationStatus } = await import('@/lib/actions/quotation');
      await updateQuotationStatus(id, 'accepted');
      toast.success("Penawaran Disetujui!");
      loadData();
    } catch (e) { toast.error("Gagal menyetujui penawaran"); }
  };

  const handleRejectQuotation = async (id: string) => {
    if (!confirm("Yakin ingin menolak penawaran ini?")) return;
    try {
      const { updateQuotationStatus } = await import('@/lib/actions/quotation');
      await updateQuotationStatus(id, 'rejected');
      toast.success("Penawaran Ditolak");
      loadData();
    } catch (e) { toast.error("Gagal menolak penawaran"); }
  };

  const stats = useMemo(() => ({
    active: activeJobs.filter(j => j.status !== 'completed').length,
    analysis: activeJobs.filter(j => j.status === 'analysis').length,
    completed: activeJobs.filter(j => j.status === 'completed').length,
    total: activeJobs.length
  }), [activeJobs]);

  const invoiceNotifs = notifications.filter(n => n.type === 'invoice_sent' && !n.is_read);
  const liveJob = activeJobs.find(j => j.status !== 'completed');

  const filteredJobs = activeJobs.filter((job: any) => {
    const matchesSearch = search === "" ||
      job.tracking_code.toLowerCase().includes(search.toLowerCase()) ||
      job.quotation?.items?.[0]?.service?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || job.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><ChemicalLoader /></div>;

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 bg-slate-50/20 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-emerald-950 tracking-tight flex items-center gap-3 uppercase font-[family-name:var(--font-montserrat)]">
            <ShieldCheck className="h-8 w-8 text-emerald-600" />
            Panel Pelanggan
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] opacity-80 pl-11">
            Halo, {profile?.full_name?.split(' ')[0] || 'Customer'} • Pantau Pengujian Anda
          </p>
        </div>
        <Button variant="outline" onClick={() => loadData(true)} disabled={refreshing} className="h-11 px-6 rounded-2xl border-slate-200 bg-white font-bold text-xs gap-2 shadow-sm transition-all active:scale-95">
          <RefreshCw className={cn("h-4 w-4 text-emerald-600", refreshing && "animate-spin")} />
          Sync Data
        </Button>
      </div>

      {/* 1. QUOTATION ALERT (PENAWARAN BARU) */}
      {sentQuotations.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-[2.5rem] p-1 shadow-2xl shadow-amber-900/20">
                <div className="bg-white/10 backdrop-blur-md rounded-[2.4rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 text-white border border-white/10">
                    <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-3xl bg-white/20 flex items-center justify-center border border-white/20 shadow-inner shrink-0 transform rotate-3">
                            <FileText className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-amber-400/20 text-amber-100 border-amber-400/30 text-[8px] font-black uppercase tracking-widest">PENAWARAN BARU</Badge>
                                <span className="text-[10px] font-black text-white/60">#DOKUMEN-MENUNGGU</span>
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Persetujuan Penawaran Harga</h2>
                            <p className="text-amber-50 text-xs font-medium opacity-90">Ada {sentQuotations.length} penawaran baru yang membutuhkan konfirmasi Anda.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        <Button 
                          onClick={() => handleApproveQuotation(sentQuotations[0].id)}
                          className="flex-1 md:flex-none bg-white text-amber-700 hover:bg-amber-50 font-black text-[10px] uppercase tracking-widest h-14 px-8 rounded-2xl shadow-xl transition-all active:scale-95"
                        >
                            <CheckCircle className="mr-2 h-4 w-4" /> SETUJUI
                        </Button>
                        <Button 
                          onClick={() => handleRejectQuotation(sentQuotations[0].id)}
                          variant="ghost"
                          className="flex-1 md:flex-none border-2 border-white/20 text-white font-black text-[10px] uppercase h-14 px-8 rounded-2xl hover:bg-rose-600/20 hover:border-rose-400 transition-all"
                        >
                            <XCircle className="mr-2 h-4 w-4" /> TOLAK
                        </Button>
                        <Link href={`/dashboard/quotations/${sentQuotations[0].id}`} className="flex-1 md:flex-none">
                            <Button variant="ghost" className="w-full border-2 border-white/20 text-white font-black text-[10px] uppercase tracking-widest h-14 px-8 rounded-2xl hover:bg-white/10">
                                DETAIL
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 2. INVOICE ALERT (TAGIHAN BARU) */}
      {invoiceNotifs.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2.5rem] p-1 shadow-2xl shadow-blue-900/20">
                <div className="bg-white/10 backdrop-blur-md rounded-[2.4rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 text-white border border-white/10">
                    <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-3xl bg-white/20 flex items-center justify-center border border-white/20 shadow-inner shrink-0 transform -rotate-3">
                            <CreditCard className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-blue-400/20 text-blue-100 border-blue-400/30 text-[8px] font-black uppercase tracking-widest">TAGIHAN TERBIT</Badge>
                                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Invoice Baru Tersedia</h2>
                            <p className="text-blue-100 text-xs font-medium opacity-90">{invoiceNotifs[0].message}</p>
                        </div>
                    </div>
                    <Link href="/dashboard/orders" className="w-full md:w-auto">
                        <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 font-black text-[10px] uppercase tracking-widest h-14 px-10 rounded-2xl shadow-xl transition-all active:scale-95">
                            LIHAT & BAYAR INVOICE
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
      )}

      {/* 3. LIVE TRACKING */}
      {liveJob && (
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-emerald-900/5 bg-white overflow-hidden">
            <div className="bg-emerald-900 p-4 px-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Live Tracking Progres</span>
                </div>
                <Badge className="bg-emerald-500 text-emerald-950 font-black text-[8px] tracking-widest uppercase">{liveJob.tracking_code}</Badge>
            </div>
            <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row gap-10 items-center">
                    <div className="flex-1 w-full space-y-6">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{liveJob.quotation?.items?.[0]?.service?.name || 'Proses Laboratorium'}</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Status: <span className="text-emerald-600 font-black">{statusLabels[liveJob.status] || liveJob.status}</span></p>
                        </div>
                        <div className="py-4"><WorkflowTimeline status={liveJob.status} /></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Tanggal Masuk</p><p className="text-xs font-black text-slate-700">{new Date(liveJob.created_at).toLocaleDateString('id-ID')}</p></div>
                            {liveJob.sampling_assignment?.field_officer && (
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Petugas Lapangan</p>
                                    <div className="flex items-center gap-2 text-xs font-black text-slate-700"><User className="h-3 w-3 text-emerald-600" /><span>{liveJob.sampling_assignment.field_officer.full_name.split(' ')[0]}</span></div>
                                </div>
                            )}
                            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 hidden md:block"><p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Estimasi Selesai</p><p className="text-xs font-black text-emerald-700">Dalam Proses</p></div>
                        </div>
                    </div>
                    <Button onClick={() => { setSelectedJob(liveJob); setIsDetailOpen(true); }} className="h-20 w-20 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-4 border-white shadow-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-90 shrink-0"><Eye className="h-6 w-6" /><span className="text-[8px] font-black uppercase">Detail</span></Button>
                </div>
            </CardContent>
        </Card>
      )}

      {/* 4. QUICK STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Pekerjaan Aktif" value={stats.active} icon={Box} color="emerald" description="Sedang diproses" />
        <StatCard title="Dalam Analisis" value={stats.analysis} icon={FlaskConical} color="purple" description="Di laboratorium" />
        <StatCard title="Selesai" value={stats.completed} icon={CheckCircle} color="blue" description="Hasil terbit" />
        <StatCard title="Total Order" value={stats.total} icon={History} color="slate" description="Seluruh riwayat" />
      </div>

      {/* 5. JOBS LIST */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                <FileText className="h-5 w-5 text-emerald-600" />
                Riwayat & Progres Pesanan
            </h3>
            <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input placeholder="Cari kode..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl text-xs border-slate-200 bg-white" />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32 h-10 rounded-xl text-xs font-bold border-slate-200 bg-white"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent className="rounded-xl shadow-2xl"><SelectItem value="all">Semua</SelectItem>{steps.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
            </div>
        </div>

        {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-20 text-center border-2 border-dashed border-slate-200">
                <Zap className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tidak ada pesanan ditemukan</p>
            </div>
        ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
                {filteredJobs.map((job: any) => (
                    <Card key={job.id} className="rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                        <CardContent className="p-0">
                            <div className="flex flex-col lg:flex-row">
                                <div className={cn("w-full lg:w-48 p-6 flex flex-col items-center justify-center gap-2 border-b lg:border-b-0 lg:border-r border-slate-100", statusColors[job.status])}>
                                    <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                        {steps.find(s => s.id === job.status)?.icon ? React.createElement(steps.find(s => s.id === job.status)!.icon, { className: "h-6 w-6" }) : <Activity className="h-6 w-6" />}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{statusLabels[job.status]?.split(' ')[0] || job.status}</span>
                                </div>
                                <div className="flex-1 p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{job.tracking_code}</span>
                                                <span className="text-[10px] font-bold text-slate-400">{new Date(job.created_at).toLocaleDateString('id-ID')}</span>
                                            </div>
                                            <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">{job.quotation?.items?.[0]?.service?.name || 'Uji Laboratorium'}</h4>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => { setSelectedJob(job); setIsDetailOpen(true); }} className="h-9 w-9 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"><Eye className="h-4 w-4" /></Button>
                                            {job.certificate_url && <Button size="icon" onClick={() => window.open(job.certificate_url, '_blank')} className="h-9 w-9 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20"><Download className="h-4 w-4" /></Button>}
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-slate-50"><WorkflowTimeline status={job.status} /></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
      </div>

      {/* DETAIL DIALOG */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-xl p-0 border-none shadow-2xl rounded-[3rem] overflow-hidden">
          <div className="bg-slate-900 p-8 text-white relative">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/20 transform rotate-3"><Activity className="h-8 w-8 text-slate-900" /></div>
              <div><DialogTitle className="text-xl font-black uppercase tracking-tight">Status Pekerjaan</DialogTitle><Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-black uppercase tracking-widest mt-1">{selectedJob?.tracking_code}</Badge></div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsDetailOpen(false)} className="absolute top-8 right-8 text-white/40 hover:text-white rounded-2xl h-12 w-12"><X className="h-6 w-6" /></Button>
          </div>
          <div className="p-8 space-y-8 bg-white">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Tanggal Masuk</p><p className="text-sm font-black text-slate-800">{new Date(selectedJob?.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Nominal</p><p className="text-sm font-black text-emerald-700">Rp {Number(selectedJob?.quotation?.total_amount || 0).toLocaleString("id-ID")}</p></div>
            </div>
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Operasional Timeline</p>
                <div className="flex justify-center py-2"><WorkflowTimeline status={selectedJob?.status || ''} /></div>
                <p className="mt-8 text-xs font-bold text-emerald-600 uppercase tracking-widest animate-pulse">{statusLabels[selectedJob?.status] || 'MEMPROSES DATA'}</p>
            </div>
            {selectedJob?.notes && (
                <div className="bg-amber-50 p-5 rounded-3xl border border-amber-100 flex items-start gap-4"><MessageCircle className="h-5 w-5 text-amber-600 shrink-0" /><div><p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Catatan Lab</p><p className="text-sm font-medium text-amber-800 italic">"{selectedJob.notes}"</p></div></div>
            )}
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex gap-3">
            <Button variant="outline" onClick={() => setIsDetailOpen(false)} className="flex-1 font-black text-[10px] uppercase h-12 rounded-2xl border-slate-300">Tutup</Button>
            <Button className="flex-1 bg-slate-900 text-white font-black text-[10px] uppercase h-12 rounded-2xl shadow-xl gap-2"><MessageCircle className="h-4 w-4 text-emerald-400" />Hubungi Kami</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, description }: { title: string; value: number; icon: any; color: string; description: string; }) {
  const colorClasses: Record<string, string> = { emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", purple: "bg-purple-50 text-purple-600 border-purple-100", blue: "bg-blue-50 text-blue-600 border-blue-100", slate: "bg-slate-50 text-slate-600 border-slate-100", amber: "bg-amber-50 text-amber-600 border-amber-100" };
  return (
    <div className={cn("bg-white p-5 rounded-[2rem] shadow-sm border-2 transition-all hover:shadow-md flex flex-col items-center text-center gap-3", colorClasses[color] || colorClasses.slate)}>
      <div className="p-2.5 rounded-2xl bg-white shadow-sm shrink-0"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0"><p className="text-[9px] font-black uppercase opacity-60 tracking-widest leading-none mb-1">{title}</p><p className="text-2xl font-black tracking-tighter leading-none">{value}</p><p className="text-[8px] font-bold opacity-50 mt-1 truncate">{description}</p></div>
    </div>
  );
}

function WorkflowTimeline({ status }: { status: string }) {
  const stages = [
    { id: 1, name: "Order", icon: FileText, complete: true },
    { id: 2, name: "Terjadwal", icon: Clock, complete: ["scheduled", "sampling", "analysis_ready", "analysis", "reporting", "completed"].includes(status) },
    { id: 3, name: "Sampling", icon: Truck, complete: ["sampling", "analysis_ready", "analysis", "reporting", "completed"].includes(status) },
    { id: 4, name: "Lab", icon: Beaker, complete: ["analysis", "reporting", "completed"].includes(status) },
    { id: 5, name: "Laporan", icon: FileText, complete: ["reporting", "completed"].includes(status) },
    { id: 6, name: "Selesai", icon: CheckCircle, complete: status === "completed" },
  ];

  const getStatusColor = (stage: any) => {
    if (stage.complete) {
      if (stage.name === "Terjadwal" && status === "scheduled") return "bg-amber-500 text-white border-amber-600 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.4)]";
      return "bg-emerald-500 text-white border-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.4)]";
    }
    return "bg-slate-100 text-slate-300 border-slate-200";
  };
  return (
    <div className="flex items-center gap-1 min-w-[200px] justify-center">
      {stages.map((stage, index) => (
        <React.Fragment key={stage.id}>
          <div className="flex flex-col items-center gap-1 group">
            <div className={cn("w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-500", getStatusColor(stage))}><stage.icon className="h-4 w-4" /></div>
            <span className={cn("text-[7px] font-black uppercase tracking-tighter transition-colors", stage.complete ? "text-emerald-600" : stage.id === stages.findIndex(s => !s.complete) + 1 ? "text-amber-600" : "text-slate-300")}>{stage.name}</span>
          </div>
          {index < stages.length - 1 && <div className={cn("w-4 md:w-8 h-0.5 transition-all duration-1000 mb-3", stage.complete ? "bg-emerald-500" : "bg-slate-100")} />}
        </React.Fragment>
      ))}
    </div>
  );
}
