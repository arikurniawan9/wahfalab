"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getAuditLogsAction, getAuditFilterValues } from "@/lib/actions/audit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Eye, 
  History, 
  User, 
  Activity, 
  Database, 
  ChevronLeft, 
  ChevronRight,
  Download,
  Terminal,
  Clock,
  Globe,
  Tag
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChemicalLoader } from "@/components/ui";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    user_email: "",
    entity_type: "all",
    action: "all",
    date_from: "",
    date_to: "",
  });
  
  const [filterValues, setFilterValues] = useState<{entityTypes: string[], actions: string[]}>({
    entityTypes: [],
    actions: [],
  });

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAuditLogsAction({ ...filters, page, limit: 50 });
      if (result.success) {
        setLogs(result.logs || []);
        setTotal(result.total || 0);
        setPages(result.pages || 1);
      } else {
        toast.error(result.error || "Gagal memuat audit logs");
      }
    } catch (error) {
      console.error("Failed to load logs:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    async function loadFilterValues() {
      const result = await getAuditFilterValues();
      if (result.success) {
        setFilterValues({
          entityTypes: result.entityTypes,
          actions: result.actions,
        });
      }
    }
    loadFilterValues();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page on filter change
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('create') || act.includes('add')) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (act.includes('update') || act.includes('edit')) return "bg-blue-100 text-blue-700 border-blue-200";
    if (act.includes('delete') || act.includes('remove')) return "bg-rose-100 text-rose-700 border-rose-200";
    if (act.includes('login')) return "bg-indigo-100 text-indigo-700 border-indigo-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const JsonViewer = ({ data, label }: { data: any, label: string }) => {
    if (!data) return null;
    return (
      <div className="space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</p>
        <div className="bg-slate-900 rounded-2xl p-6 overflow-x-auto border-4 border-slate-800 shadow-inner max-h-[300px]">
          <pre className="text-xs text-indigo-300 font-mono leading-relaxed">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-8 w-1.5 bg-indigo-600 rounded-full" />
            <h1 className="text-3xl font-black text-emerald-950 tracking-tighter uppercase font-[family-name:var(--font-montserrat)]">
              Audit Control Center
            </h1>
          </div>
          <p className="text-slate-500 text-sm font-medium italic pl-5">
            Log Transparansi Sistem: Memantau Setiap Jejak Aktivitas Platform
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-xl shadow-indigo-900/5 border border-slate-100">
           <div className="flex flex-col items-end px-4 border-r border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Logs Captured</span>
              <span className="text-xl font-black text-indigo-600 font-mono">{total.toLocaleString()}</span>
           </div>
           <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/20">
              <ShieldCheck className="h-7 w-7" />
           </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <Card className="border-none shadow-2xl shadow-indigo-900/5 rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Email Pengguna</Label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input 
                  placeholder="Cari email..." 
                  className="pl-12 h-12 bg-slate-50/50 border-2 border-slate-100 rounded-xl focus:border-indigo-200 transition-all text-sm font-bold"
                  value={filters.user_email}
                  onChange={(e) => handleFilterChange("user_email", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tipe Entitas</Label>
              <Select value={filters.entity_type} onValueChange={(v) => handleFilterChange("entity_type", v)}>
                <SelectTrigger className="h-12 bg-slate-50/50 border-2 border-slate-100 rounded-xl font-bold text-slate-600">
                  <SelectValue placeholder="Semua Entitas" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="all">Semua Entitas</SelectItem>
                  {filterValues.entityTypes.map(type => (
                    <SelectItem key={type} value={type} className="uppercase text-[10px] font-black tracking-widest">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Aksi</Label>
              <Select value={filters.action} onValueChange={(v) => handleFilterChange("action", v)}>
                <SelectTrigger className="h-12 bg-slate-50/50 border-2 border-slate-100 rounded-xl font-bold text-slate-600">
                  <SelectValue placeholder="Semua Aksi" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="all">Semua Aksi</SelectItem>
                  {filterValues.actions.map(act => (
                    <SelectItem key={act} value={act} className="uppercase text-[10px] font-black tracking-widest">{act}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Rentang Tanggal</Label>
              <div className="flex items-center gap-3">
                <Input 
                  type="date" 
                  className="h-12 bg-slate-50/50 border-2 border-slate-100 rounded-xl font-bold text-slate-600"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange("date_from", e.target.value)}
                />
                <span className="text-slate-300 font-black">TO</span>
                <Input 
                  type="date" 
                  className="h-12 bg-slate-50/50 border-2 border-slate-100 rounded-xl font-bold text-slate-600"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange("date_to", e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="border-none shadow-2xl shadow-indigo-900/5 rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-600">
                <Activity className="h-6 w-6" />
             </div>
             <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight text-emerald-950">System Activity Logs</CardTitle>
                <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Real-time surveillance of system changes</CardDescription>
             </div>
          </div>
          <Button variant="outline" className="rounded-xl border-slate-200 text-slate-400 font-black text-[10px] uppercase h-10 px-4">
             <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="h-96 flex flex-col items-center justify-center gap-6">
                <ChemicalLoader />
                <p className="text-[10px] font-black text-indigo-600/40 uppercase tracking-[0.5em] animate-pulse">Scanning Audit Vault</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                    <th className="px-8 py-5">Timestamp</th>
                    <th className="px-8 py-5">User Account</th>
                    <th className="px-8 py-5">Operation</th>
                    <th className="px-8 py-5">Entity Type</th>
                    <th className="px-8 py-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <Clock className="h-3.5 w-3.5 text-indigo-300" />
                           <span className="text-xs font-bold text-slate-600 font-mono tracking-tight">{formatDate(log.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-sm group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                              <User className="h-5 w-5" />
                           </div>
                           <div>
                              <p className="text-xs font-black text-slate-800">{log.user_email || "System/Guest"}</p>
                              <p className="text-[9px] font-black text-indigo-600/60 uppercase tracking-widest">{log.user_role || "Anonymous"}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <Badge className={cn("px-4 py-1.5 rounded-xl border font-black text-[9px] uppercase tracking-widest shadow-sm", getActionColor(log.action))}>
                           {log.action}
                        </Badge>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-slate-300" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{log.entity_type}</span>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <Button 
                           variant="ghost" 
                           size="icon"
                           onClick={() => { setSelectedLog(log); setDetailOpen(true); }}
                           className="h-10 w-10 rounded-xl text-slate-300 hover:text-indigo-600 hover:bg-white hover:shadow-xl hover:shadow-indigo-900/10 transition-all border border-transparent hover:border-indigo-100"
                         >
                            <Eye className="h-5 w-5" />
                         </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && pages > 1 && (
            <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
               <p className="text-xs font-bold text-slate-400">
                  Showing <span className="text-indigo-600">{logs.length}</span> of <span className="text-indigo-600">{total}</span> total entries
               </p>
               <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    disabled={page === 1} 
                    onClick={() => setPage(page - 1)}
                    className="h-10 w-10 rounded-xl border-slate-200 text-slate-400 hover:text-indigo-600 transition-all"
                  >
                     <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-1">
                     {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                        const p = i + 1;
                        return (
                           <Button 
                             key={p} 
                             variant={page === p ? "default" : "ghost"}
                             className={cn("h-10 w-10 rounded-xl font-black text-xs", page === p ? "bg-indigo-600 shadow-lg shadow-indigo-900/20" : "text-slate-400")}
                             onClick={() => setPage(p)}
                           >
                              {p}
                           </Button>
                        );
                     })}
                     {pages > 5 && <span className="text-slate-300 font-black px-2">...</span>}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    disabled={page === pages} 
                    onClick={() => setPage(page + 1)}
                    className="h-10 w-10 rounded-xl border-slate-200 text-slate-400 hover:text-indigo-600 transition-all"
                  >
                     <ChevronRight className="h-5 w-5" />
                  </Button>
               </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-4xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
           <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10">
                 <Terminal className="h-40 w-40 text-indigo-400 rotate-12" />
              </div>
              <div className="relative z-10 space-y-4">
                 <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-3xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-950 border-4 border-slate-800">
                       <Database className="h-8 w-8 text-white" />
                    </div>
                    <div>
                       <DialogTitle className="text-2xl font-black uppercase tracking-tight">Audit Log Payload</DialogTitle>
                       <div className="flex items-center gap-3 mt-1">
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 uppercase text-[9px] font-black tracking-widest px-3 py-1">
                             {selectedLog?.entity_type}
                          </Badge>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{selectedLog?.id}</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="p-10 bg-white grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi</Label>
                       <p className="text-sm font-black text-indigo-600 uppercase tracking-wider">{selectedLog?.action}</p>
                    </div>
                    <div className="space-y-1">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IP Address</Label>
                       <div className="flex items-center gap-2">
                          <Globe className="h-3.5 w-3.5 text-slate-300" />
                          <p className="text-sm font-mono font-bold text-slate-700">{selectedLog?.ip_address || "Internal System"}</p>
                       </div>
                    </div>
                 </div>

                 <JsonViewer label="Data Lama (Old Data)" data={selectedLog?.old_data} />
                 <JsonViewer label="Metadata Tambahan" data={selectedLog?.metadata} />
              </div>

              <div className="space-y-8">
                 <div className="space-y-1">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Akun Eksekutor</Label>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600 font-black">
                          {selectedLog?.user_email?.charAt(0).toUpperCase() || "S"}
                       </div>
                       <div>
                          <p className="text-xs font-black text-slate-800">{selectedLog?.user_email || "System Process"}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">{selectedLog?.user_role || "Backend"}</p>
                       </div>
                    </div>
                 </div>

                 <JsonViewer label="Data Baru (New Data)" data={selectedLog?.new_data} />

                 <div className="pt-4">
                    <Button 
                      onClick={() => setDetailOpen(false)}
                      className="w-full h-14 bg-slate-900 hover:bg-indigo-950 text-white font-black uppercase tracking-[3px] text-xs rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95"
                    >
                       Tutup Detail
                    </Button>
                 </div>
              </div>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={cn("block", className)}>{children}</label>;
}

function Info({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>;
}
