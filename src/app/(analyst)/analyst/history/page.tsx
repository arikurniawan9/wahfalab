"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  History, Search, Calendar, MapPin, ChevronRight, 
  CheckCircle2, RefreshCw, Activity, FlaskConical,
  ClipboardCheck, FileText, ExternalLink, ShieldCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getMyAnalysisJobs } from "@/lib/actions/analyst";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  analysis_done: { label: "Selesai Analisis", color: "text-indigo-600", bg: "bg-indigo-50" },
  reporting: { label: "Pelaporan", color: "text-cyan-600", bg: "bg-cyan-50" },
  completed: { label: "Selesai", color: "text-emerald-600", bg: "bg-emerald-50" },
};

export default function AnalystHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setPages] = useState(1);

  const loadHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      // Ambil tugas yang sudah selesai dianalisis (analysis_done, reporting, completed)
      const result = await getMyAnalysisJobs(page, 15);
      if (result.error) throw new Error(result.error);
      
      // Filter hanya yang sudah melewati tahap analisis
      const finishedJobs = (result.items || []).filter((j: any) => 
        ['analysis_done', 'reporting', 'completed'].includes(j.status)
      );
      
      setJobs(finishedJobs);
      setPages(result.pages || 1);
    } catch (error) {
      toast.error("Gagal memuat riwayat analisis");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredJobs = jobs.filter(item => 
    item.tracking_code?.toLowerCase().includes(search.toLowerCase()) ||
    item.quotation?.profile?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    item.quotation?.profile?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-10 space-y-6 pb-24 md:pb-10 max-w-5xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-950 rounded-xl shadow-lg shadow-emerald-900/20">
            <History className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Riwayat Analisis</h1>
            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-1">Arsip Pengujian Laboratorium</p>
          </div>
        </div>
        <button 
          onClick={() => loadHistory(true)} 
          disabled={refreshing}
          className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 flex items-center gap-2 transition-all"
        >
          <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} /> {refreshing ? "Updating..." : "Refresh"}
        </button>
      </div>

      {/* Stats Mini */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm border-b-4 border-b-emerald-500">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner"><CheckCircle2 className="h-5 w-5" /></div>
          <div><p className="text-xl font-black text-slate-900 leading-none">{jobs.length}</p><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Analisis Selesai</p></div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm border-b-4 border-b-indigo-500">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner"><FileText className="h-5 w-5" /></div>
          <div><p className="text-xl font-black text-slate-900 leading-none">{jobs.filter(j => j.status === 'reporting').length}</p><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Tahap Pelaporan</p></div>
        </div>
      </div>

      {/* Search Ringkas */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
        <Input 
          placeholder="Cari Tracking Code atau Klien..." 
          className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-bold text-sm focus-visible:ring-emerald-500 shadow-slate-200/50"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* History List - Sleek & Compact */}
      <div className="space-y-3">
        {loading && !refreshing ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-24 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <FlaskConical className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Belum ada riwayat pengerjaan</p>
          </div>
        ) : (
          filteredJobs.map((item) => {
            const status = item.status;
            const cfg = statusConfig[status] || statusConfig.analysis_done;
            
            return (
              <Link key={item.id} href={`/analyst/jobs/${item.id}`}>
                <Card className="group border-none shadow-sm bg-white hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 cursor-pointer rounded-2xl overflow-hidden ring-1 ring-slate-100/50">
                  <CardContent className="p-0">
                    <div className="p-5 flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                            {item.tracking_code}
                          </span>
                          <Badge className={cn("border-none font-black text-[8px] uppercase px-2.5 py-1 rounded-full", cfg.bg, cfg.color)}>
                            {cfg.label}
                          </Badge>
                        </div>
                        
                        <div>
                          <h3 className="font-black text-slate-800 text-[15px] leading-tight group-hover:text-indigo-600 transition-colors">
                            {item.quotation?.profile?.company_name || item.quotation?.profile?.full_name || 'Personal Client'}
                          </h3>
                          <div className="flex items-center gap-3 mt-1.5">
                             <div className="flex items-center gap-1 text-slate-400 text-[9px] font-bold uppercase">
                               <FlaskConical className="h-3 w-3" />
                               {item.quotation?.items?.[0]?.service?.name || "Layanan Kustom"}
                             </div>
                             <div className="h-1 w-1 rounded-full bg-slate-200" />
                             <div className="flex items-center gap-1 text-slate-400 text-[9px] font-bold uppercase">
                               <ShieldCheck className="h-3 w-3" />
                               {item.lab_analysis?.test_results?.length || 0} Parameter Teruji
                             </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex md:flex-col justify-between items-center md:items-end gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                        <div className="text-left md:text-right">
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Update Terakhir</p>
                          <div className="flex items-center gap-2 text-slate-700 font-black text-[10px] bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                            <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                            {item.updated_at ? new Date(item.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </div>
                        </div>
                        <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center group-hover:bg-indigo-600 transition-all transform group-hover:rotate-12 group-hover:scale-110 shadow-lg">
                          <ChevronRight className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Visual Result Bar */}
                    <div className="h-1 w-full bg-slate-50 flex">
                      <div className={cn("h-full transition-all duration-1000 bg-indigo-500", status === 'completed' ? "w-full bg-emerald-500" : "w-3/4 animate-pulse")} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>

      {/* Pagination Mini */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-6">
          <Button 
            variant="ghost" 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-emerald-600"
          >
            ← Prev Page
          </Button>
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
            {page} / {totalPages}
          </div>
          <Button 
            variant="ghost" 
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-emerald-600"
          >
            Next Page →
          </Button>
        </div>
      )}
    </div>
  );
}
