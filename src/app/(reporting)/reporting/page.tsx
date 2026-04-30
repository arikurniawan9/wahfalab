"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Beaker,
  BookOpen,
  ArrowRight,
  FolderOpen,
  ShieldCheck,
  Calendar,
  Info,
  CheckCircle,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { getLabReports, deleteLabReport, getRegulations } from "@/lib/actions/reporting";
import { getProfile } from "@/lib/actions/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReportingLoading from "./loading";
import { useNotifications } from "@/hooks/use-notifications";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

export default function LabReportListPage() {
  const [archive, setArchive] = useState<any>({ items: [], total: 0, pages: 1 });
  const [drafts, setDrafts] = useState<any>({ items: [], total: 0, pages: 1 });
  const [profile, setProfile] = useState<any>(null);
  const [regulationTotal, setRegulationTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { notifications } = useNotifications();

  // Filter unread analysis tasks
  const unreadTasks = useMemo(() => {
    return notifications.filter(n => !n.is_read && n.type === 'analysis_completed');
  }, [notifications]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const [archiveResult, draftResult, profResult, regulationsResult] = await Promise.all([
        getLabReports({ page, limit: 10, search, status: "final" }),
        getLabReports({ page: 1, limit: 5, search, status: "draft" }),
        getProfile(),
        getRegulations()
      ]);
      setArchive(archiveResult);
      setDrafts(draftResult);
      setProfile(profResult);
      setRegulationTotal(Array.isArray(regulationsResult) ? regulationsResult.length : 0);
    } catch (error) {
      toast.error("Gagal memuat data laporan");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 500);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus arsip LHU ini secara permanen?")) return;
    try {
      const result = await deleteLabReport(id);
      if (result.success) {
        toast.success("Arsip LHU berhasil dihapus");
        await loadData(true);
      }
    } catch (error) {
      toast.error("Gagal menghapus laporan");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[7px] uppercase px-2 py-0.5 rounded-full shadow-sm">
            <Clock className="w-2.5 h-2.5 mr-1 opacity-60" /> Draft
          </Badge>
        );
      case "final":
        return (
          <Badge className="bg-emerald-500 text-white border-none font-black text-[7px] uppercase px-2 py-0.5 rounded-full shadow-lg shadow-emerald-900/20">
            <ShieldCheck className="w-2.5 h-2.5 mr-1" /> LHU Final
          </Badge>
        );
      default:
        return <Badge className="bg-blue-100 text-blue-600 border-none font-black text-[7px] uppercase px-2">{status}</Badge>;
    }
  };

  if (loading && !refreshing) return <ReportingLoading />;

  const displayAdminName = profile?.full_name?.split(" ")[0] || "Team";

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 via-emerald-50/10 to-slate-50 min-h-screen space-y-6 animate-in fade-in duration-700 pb-20">
      
      {/* Header Premium (Compact) */}
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-teal-600/5 to-emerald-600/5 rounded-2xl blur-2xl" />
        
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl blur-xs opacity-50 group-hover:opacity-80 transition-opacity" />
              <div className="relative h-12 w-12 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl border-2 border-white/20">
                {displayAdminName.charAt(0).toUpperCase()}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                   {getGreeting()}, {displayAdminName}
                </h1>
                <Badge className="bg-emerald-100 text-emerald-700 border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                  Reporting
                </Badge>
              </div>
              <p className="text-slate-400 text-[10px] mt-1 flex items-center gap-1.5 font-bold uppercase tracking-widest">
                <Calendar className="h-3 w-3" />
                {new Date().toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
             <Link href="/reporting/jobs" className="flex-1 lg:flex-none">
                <Button variant="outline" className="w-full h-11 px-6 rounded-xl border-2 border-slate-100 bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-black uppercase text-[9px] tracking-widest gap-2 transition-all active:scale-95 shadow-sm">
                   <FolderOpen className="h-4 w-4" /> Antrean
                </Button>
             </Link>
             <Link href="/reporting/new" className="flex-1 lg:flex-none">
                <Button className="w-full h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9px] tracking-widest shadow-xl shadow-emerald-950/20 gap-2 transition-all active:scale-95">
                   <Plus className="h-4 w-4" /> Buat Manual
                </Button>
             </Link>
          </div>
        </div>
      </header>

      {/* Real-time Alert for new tasks */}
      {unreadTasks.length > 0 && (
        <Link 
          href={unreadTasks.length === 1 ? (unreadTasks[0].link || "/reporting/jobs") : "/reporting/jobs"} 
          className="block animate-in slide-in-from-top-4 duration-500"
        >
           <div className="bg-emerald-600 rounded-2xl p-4 flex items-center justify-between group shadow-xl shadow-emerald-900/20 border-2 border-emerald-500 active:scale-[0.98] transition-all text-white">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center relative">
                    <Bell className="h-5 w-5 animate-bounce text-white" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 rounded-full border-2 border-emerald-600 flex items-center justify-center text-[8px] font-black">{unreadTasks.length}</span>
                 </div>
                 <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">Tugas Baru Tersedia</h4>
                    <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-tight mt-0.5">Ada {unreadTasks.length} job order yang menunggu pembuatan LHU.</p>
                 </div>
              </div>
              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-emerald-600 transition-all">
                 <ArrowRight className="h-4 w-4" />
              </div>
           </div>
        </Link>
      )}

      {/* Info Banner (Compact) */}
      <Card className="border border-slate-100 shadow-lg shadow-slate-200/50 rounded-2xl overflow-hidden bg-white relative group hover:shadow-xl hover:shadow-emerald-900/10 transition-all duration-500">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/[0.03] group-hover:to-teal-500/[0.06] transition-colors duration-500" />
        <CardContent className="p-6 md:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4 max-w-2xl">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/15 shrink-0">
              <Info className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-2">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">Arsip & Dokumentasi LHU</p>
              <h2 className="text-lg md:text-xl font-black tracking-tight leading-tight text-slate-900">Pusat dokumentasi hasil uji resmi.</h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Draft pengerjaan dikelola melalui menu antrean verifikasi.</p>
            </div>
          </div>
          <Link href="/reporting/jobs" className="w-full md:w-auto">
            <Button className="w-full md:w-auto h-12 px-7 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9px] tracking-[0.1em] shadow-lg shadow-emerald-900/20 transition-all active:scale-95 group/btn gap-3">
              Buka Antrean <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Stats Section (Compact) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total LHU Final", value: archive.total, icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Draft Tersimpan", value: drafts.total, icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Baku Mutu Aktif", value: regulationTotal, icon: Beaker, color: "text-amber-600", bg: "bg-amber-50" }
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-lg shadow-slate-200/50 rounded-2xl bg-white overflow-hidden group hover:translate-y-[-2px] transition-all">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-inner", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em]">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter mt-0.5">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Table (Compact) */}
      <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-0.5">
             <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-emerald-600" /> Arsip Laporan
             </h3>
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Digital Archive System</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
             <div className="relative w-full sm:w-80 group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
               <Input
                 placeholder="Cari nomor LHU..."
                 value={searchInput}
                 onChange={(e) => setSearchInput(e.target.value)}
                 className="pl-11 h-12 bg-white border-none shadow-inner rounded-xl font-bold text-xs focus-visible:ring-emerald-500 transition-all"
               />
             </div>
             
             <div className="flex items-center bg-white border border-slate-100 rounded-xl p-1 h-12">
               <Button variant="ghost" size="icon" disabled={page === 1} onClick={() => setPage(page - 1)} className="h-10 w-10 rounded-lg text-slate-400"><ChevronLeft className="h-4 w-4" /></Button>
               <div className="px-3 text-[9px] font-black text-emerald-950 uppercase tracking-tighter border-x border-slate-50 h-6 flex items-center">
                 {page} / {archive.pages}
               </div>
               <Button variant="ghost" size="icon" disabled={page === archive.pages} onClick={() => setPage(page + 1)} className="h-10 w-10 rounded-lg text-slate-400"><ChevronRight className="h-4 w-4" /></Button>
             </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {archive.items.length === 0 ? (
            <div className="py-32 flex flex-col items-center text-center px-6">
              <FileText className="h-10 w-10 text-slate-100 mb-4" />
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Kosong</h3>
              <Button onClick={() => setSearchInput("")} variant="outline" className="mt-6 h-10 rounded-xl border-slate-200 font-black uppercase text-[9px] tracking-widest px-6">Reset</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Identitas LHU</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Klien Pengujian</th>
                    <th className="px-6 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                    <th className="px-8 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {archive.items.map((report: any) => (
                    <tr key={report.id} className="hover:bg-emerald-50/20 transition-all group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner uppercase font-mono text-[8px] font-black">LHU</div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-800 uppercase tracking-tighter text-sm leading-none">{report.report_number}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate max-w-[150px]">{report.sample_type || "General Sample"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="min-w-0">
                          <p className="font-black text-slate-700 text-xs uppercase tracking-tight">{report.client_name || "-"}</p>
                          <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-1 bg-emerald-50 w-fit px-1.5 py-0.5 rounded border border-emerald-100">{report.company_name || "Perorangan"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">{getStatusBadge(report.status)}</td>
                      <td className="px-6 py-5 text-center">
                         <div className="flex flex-col items-center">
                            <p className="text-[10px] font-black text-slate-900 leading-none">{new Date(report.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{new Date(report.date).getFullYear()}</p>
                         </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 hover:text-emerald-600 hover:bg-white transition-all"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-100 shadow-3xl">
                            <Link href={`/reporting/${report.id}`}>
                              <DropdownMenuItem className="rounded-xl p-3 text-[10px] font-black uppercase tracking-widest gap-3 focus:bg-emerald-50 cursor-pointer">
                                <Eye className="h-4 w-4 text-emerald-500" /> Detail
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem onClick={() => window.open(`/api/pdf/report/${report.id}`, '_blank')} className="rounded-xl p-3 text-[10px] font-black uppercase tracking-widest gap-3 focus:bg-slate-50 cursor-pointer">
                                <Plus className="h-4 w-4" /> Cetak PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-2" />
                            <DropdownMenuItem onClick={() => handleDelete(report.id)} className="rounded-xl p-3 text-[10px] font-black uppercase tracking-widest gap-3 focus:bg-rose-50 text-rose-500 cursor-pointer">
                              <Trash2 className="h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Drafts (Compact) */}
      <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white">
        <CardHeader className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <CardTitle className="text-[10px] font-black text-slate-900 tracking-widest uppercase">Draft LHU Manual</CardTitle>
          <Badge className="bg-slate-900 text-white text-[9px] font-black px-2 rounded-md">{drafts.total}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {drafts.items.length === 0 ? (
            <div className="px-6 py-8 text-center"><p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tidak ada draft</p></div>
          ) : (
            <div className="divide-y divide-slate-50">
              {drafts.items.map((report: any) => (
                <Link key={report.id} href={`/reporting/${report.id}`} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50 transition-all group">
                  <div className="min-w-0 flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    <div className="min-w-0">
                      <p className="font-black text-slate-800 uppercase text-xs truncate">{report.report_number}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{report.company_name || report.client_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {getStatusBadge(report.status)}
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-600 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
