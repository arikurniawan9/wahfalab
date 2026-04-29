"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  History, Search, Calendar, MapPin, ChevronRight, 
  CheckCircle2, RefreshCw, Activity, ClipboardList, Image as ImageIcon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getMySamplingAssignments } from "@/lib/actions/sampling";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ADMIN_STATUS_LABELS, FIELD_SAMPLING_STATUS_LABELS } from "@/lib/constants/workflow-copy";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  sampling: { label: ADMIN_STATUS_LABELS.sampling, color: "text-amber-600", bg: "bg-amber-50" },
  analysis_ready: { label: ADMIN_STATUS_LABELS.analysis_ready, color: "text-blue-600", bg: "bg-blue-50" },
  analysis: { label: ADMIN_STATUS_LABELS.analysis, color: "text-indigo-600", bg: "bg-indigo-50" },
  analysis_done: { label: ADMIN_STATUS_LABELS.analysis_done, color: "text-purple-600", bg: "bg-purple-50" },
  reporting: { label: ADMIN_STATUS_LABELS.reporting, color: "text-cyan-600", bg: "bg-cyan-50" },
  completed: { label: ADMIN_STATUS_LABELS.completed, color: "text-emerald-600", bg: "bg-emerald-50" },
  cancelled: { label: FIELD_SAMPLING_STATUS_LABELS.rejected, color: "text-rose-600", bg: "bg-rose-50" },
};

export default function FieldHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setPages] = useState(1);

  const loadHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const result = await getMySamplingAssignments(page, 15, 'completed');
      if (result.error) throw new Error(result.error);
      setAssignments(result.items || []);
      setPages(result.pages || 1);
    } catch (error) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const filtered = assignments.filter(item => 
    item.job_order?.tracking_code?.toLowerCase().includes(search.toLowerCase()) ||
    item.location?.toLowerCase().includes(search.toLowerCase()) ||
    item.job_order?.quotation?.profile?.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-3 md:p-6 space-y-4 pb-24 md:pb-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header Ringkas */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-emerald-600" />
          <h1 className="text-sm font-black text-slate-800 uppercase tracking-tight">Riwayat Sampling</h1>
        </div>
        <button onClick={() => loadHistory(true)} className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1">
          <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} /> {refreshing ? "..." : "Refresh"}
        </button>
      </div>

      {/* Stats Mini */}
      <div className="flex gap-2">
        <div className="flex-1 bg-white p-2 rounded-xl border border-slate-100 flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /></div>
          <div><p className="text-xs font-black leading-none">{assignments.length}</p><p className="text-[7px] font-bold text-slate-400 uppercase">Selesai</p></div>
        </div>
        <div className="flex-1 bg-white p-2 rounded-xl border border-slate-100 flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><Activity className="h-3.5 w-3.5" /></div>
          <div><p className="text-xs font-black leading-none">{assignments.filter(a => a.job_order?.status === 'analysis_ready').length}</p><p className="text-[7px] font-bold text-slate-400 uppercase">{ADMIN_STATUS_LABELS.analysis_ready}</p></div>
        </div>
      </div>

      {/* Search Ringkas */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
        <Input 
          placeholder="Cari Booking/Lokasi..." 
          className="pl-9 h-10 bg-white border-slate-100 rounded-xl text-xs font-medium focus-visible:ring-emerald-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List Tipis */}
      <div className="space-y-2">
        {loading ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Kosong</div>
        ) : (
          filtered.map((item) => {
            const status = item.job_order?.status || 'completed';
            const cfg = statusConfig[status] || statusConfig.completed;
            return (
              <Link key={item.id} href={`/field/assignments/${item.id}`}>
                <Card className="group border-none shadow-none bg-white hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 rounded-none first:rounded-t-xl last:rounded-b-xl overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] font-black text-slate-400">{item.job_order?.tracking_code}</span>
                          <span className={cn("text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md", cfg.bg, cfg.color)}>{cfg.label}</span>
                        </div>
                        <h3 className="font-black text-slate-800 text-[13px] leading-tight truncate">
                          {item.job_order?.quotation?.profile?.company_name || item.job_order?.quotation?.profile?.full_name || 'Personal'}
                        </h3>
                        <div className="flex items-center gap-1 text-slate-400 text-[9px] font-medium truncate">
                          <MapPin className="h-2.5 w-2.5 shrink-0" /> {item.location}
                        </div>
                      </div>
                      
                      <div className="text-right flex flex-col items-end gap-2 shrink-0">
                        <p className="text-[9px] font-black text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                          {item.actual_date ? new Date(item.actual_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-'}
                        </p>
                        <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                      </div>
                    </div>
                    
                    {/* Data Counts - Inline */}
                    <div className="mt-2 flex items-center gap-3 border-t border-slate-50 pt-2">
                      <div className="flex items-center gap-1"><ClipboardList className="h-2.5 w-2.5 text-slate-300" /><span className="text-[8px] font-bold text-slate-400">{item.job_order?.quotation?.items?.length || 0} Uji</span></div>
                      <div className="flex items-center gap-1"><ImageIcon className="h-2.5 w-2.5 text-slate-300" /><span className="text-[8px] font-bold text-slate-400">{(item.photos as any[]).length} Foto</span></div>
                      <div className="ml-auto h-0.5 w-12 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn("h-full", status === 'completed' ? "w-full bg-emerald-500" : "w-1/2 bg-blue-500")} />
                      </div>
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
        <div className="flex justify-center gap-4 pt-2">
          <Button variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-8 text-[9px] uppercase font-black tracking-widest text-slate-400">← Prev</Button>
          <Button variant="ghost" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="h-8 text-[9px] uppercase font-black tracking-widest text-slate-400">Next →</Button>
        </div>
      )}
    </div>
  );
}
