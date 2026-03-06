"use client";

import { useEffect, useState, useTransition } from "react";
import { getAuditLogs } from "@/lib/actions/audit-log";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Eye, 
  History,
  Filter,
  ShieldAlert,
  Server,
  Activity,
  User,
  Database,
  RefreshCw,
  X,
  FileBox,
  Layers,
  Banknote,
  ClipboardList,
  Info,
  ArrowRight,
  Trash2,
  ListTree
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/ui/skeleton";
import { format, isValid, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function AuditLogsPage() {
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchLogs = () => {
    startTransition(async () => {
      const result = await getAuditLogs({
        page,
        limit: 15,
        search,
        action: action === "all" ? undefined : action,
      });
      setData(result.data);
      setMeta(result.meta);
    });
  };

  useEffect(() => {
    fetchLogs();
  }, [page, action]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const getActionConfig = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("create")) return { color: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "TAMBAH" };
    if (act.includes("update")) return { color: "bg-blue-50 text-blue-700 border-blue-200", label: "UBAH" };
    if (act.includes("delete")) return { color: "bg-rose-50 text-rose-700 border-rose-200", label: "HAPUS" };
    if (act.includes("login")) return { color: "bg-purple-50 text-purple-700 border-purple-200", label: "LOGIN" };
    if (act.includes("export") || act.includes("backup")) return { color: "bg-amber-50 text-amber-700 border-amber-200", label: "EKSPOR" };
    if (act.includes("restore")) return { color: "bg-orange-50 text-orange-700 border-orange-200", label: "RESTORE" };
    return { color: "bg-slate-50 text-slate-700 border-slate-200", label: act.toUpperCase() };
  };

  const getEntityDisplay = (entity: string) => {
    const ent = entity.toLowerCase();
    if (ent === 'profile') return { label: "Profil Akun", icon: User };
    if (ent === 'quotation') return { label: "Penawaran Harga", icon: FileBox };
    if (ent === 'job_order') return { label: "Pekerjaan Lab", icon: Layers };
    if (ent === 'invoice') return { label: "Invoice", icon: Banknote };
    if (ent === 'service') return { label: "Katalog Layanan", icon: ClipboardList };
    if (ent === 'system' || ent === 'backup') return { label: "Infrastruktur", icon: Server };
    return { label: entity.replace(/_/g, ' '), icon: Database };
  };

  // Helper to format values for humans
  const formatDataValue = (key: string, value: any) => {
    if (value === null || value === undefined) return <span className="text-slate-300 italic">Kosong</span>;
    
    // Format status technical terms
    if (key === 'status') {
      const statusMap: Record<string, string> = {
        'pending': 'Menunggu',
        'accepted': 'Diterima',
        'rejected': 'Ditolak',
        'scheduled': 'Dijadwalkan',
        'in_progress': 'Diproses',
        'analysis_done': 'Analisis Selesai',
        'reporting': 'Pembuatan Laporan',
        'completed': 'Selesai',
        'cancelled': 'Dibatalkan',
        'client': 'Pelanggan',
        'admin': 'Administrator'
      };
      return <Badge variant="secondary" className="bg-slate-100 text-slate-700 rounded-sm px-1.5 py-0 text-[10px] uppercase font-bold">{statusMap[value] || value}</Badge>;
    }

    // Detect dates
    if (typeof value === 'string' && value.includes('T') && (value.endsWith('Z') || value.includes('+'))) {
      try {
        const date = parseISO(value);
        if (isValid(date)) return format(date, "dd MMM yyyy, HH:mm", { locale: id });
      } catch (e) {}
    }

    // Long UUIDs/IDs
    if (typeof value === 'string' && value.length > 20 && value.includes('-')) {
      return <span className="font-mono text-[10px] opacity-60">{value.substring(0, 8)}...</span>;
    }

    return String(value);
  };

  // Helper to format labels for humans
  const humanizeLabel = (key: string) => {
    const labels: Record<string, string> = {
      'full_name': 'Nama Lengkap',
      'email': 'Email',
      'role': 'Hak Akses',
      'tracking_code': 'No. Pelacakan',
      'quotation_number': 'No. Penawaran',
      'total_amount': 'Total Biaya',
      'created_at': 'Waktu Dibuat',
      'status': 'Status Data',
      'notes': 'Catatan',
      'phone': 'No. Telepon',
      'address': 'Alamat',
      'company_name': 'Nama Perusahaan',
      'entity_id': 'ID Entitas',
      'id': 'Internal ID'
    };
    return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8 bg-slate-50/20 font-[family-name:var(--font-geist-sans)] max-w-7xl mx-auto">
      {/* Header Premium */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg shadow-inner">
            <ShieldAlert className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Keamanan & Audit</h1>
            <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.3em] mt-1 opacity-70">Log riwayat aktivitas sistem</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-lg font-black text-[9px] uppercase tracking-widest gap-2 h-9 px-4 bg-white hover:bg-slate-50 transition-all shadow-sm" onClick={fetchLogs}>
          <RefreshCw className={cn("h-3.5 w-3.5 text-slate-600", isPending && "animate-spin")} /> Segarkan
        </Button>
      </div>

      <Card className="rounded-2xl border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
        {/* Filter Area */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row gap-4 items-center">
          <form onSubmit={handleSearch} className="relative flex-1 w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <Input
              placeholder="Cari user, email, atau entitas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-slate-50 border-none rounded-xl font-bold text-xs focus-visible:ring-emerald-500 transition-all shadow-inner"
            />
          </form>

          <div className="flex gap-2 w-full md:w-auto">
            <Select value={action} onValueChange={(val) => { setAction(val); setPage(1); }}>
              <SelectTrigger className="w-full md:w-44 h-10 rounded-xl border-slate-100 bg-slate-50 font-black uppercase text-[9px] tracking-widest">
                <SelectValue placeholder="Semua Aksi" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest">Semua Aksi</SelectItem>
                <SelectItem value="create" className="text-[10px] font-bold uppercase tracking-widest">Tambah Data</SelectItem>
                <SelectItem value="update" className="text-[10px] font-bold uppercase tracking-widest">Ubah Data</SelectItem>
                <SelectItem value="delete" className="text-[10px] font-bold uppercase tracking-widest">Hapus Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-b border-slate-100">
                <TableHead className="px-6 py-4 font-black uppercase tracking-widest text-[9px] text-slate-400">Timestamp</TableHead>
                <TableHead className="px-6 py-4 font-black uppercase tracking-widest text-[9px] text-slate-400">User / Aktor</TableHead>
                <TableHead className="px-6 py-4 font-black uppercase tracking-widest text-[9px] text-slate-400">Tindakan</TableHead>
                <TableHead className="px-6 py-4 font-black uppercase tracking-widest text-[9px] text-slate-400">Modul</TableHead>
                <TableHead className="px-6 py-4 text-center font-black uppercase tracking-widest text-[9px] text-slate-400">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow><TableCell colSpan={5} className="p-0"><TableSkeleton rows={10} className="p-6" /></TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-24 bg-slate-50/30">
                  <History className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Data tidak ditemukan</p>
                </TableCell></TableRow>
              ) : (
                data.map((log) => {
                  const actionCfg = getActionConfig(log.action);
                  const entityCfg = getEntityDisplay(log.entity_type);
                  return (
                    <TableRow key={log.id} className="hover:bg-slate-50 transition-all group">
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col"><span className="font-black text-slate-700 text-xs">{format(new Date(log.created_at), "HH:mm:ss")}</span><span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(log.created_at), "dd MMM yyyy", { locale: id })}</span></div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 text-slate-500 font-black text-[10px]">{(log.user_email || 'S').charAt(0).toUpperCase()}</div>
                          <div className="flex flex-col"><span className="text-xs font-black text-slate-900 truncate max-w-[150px]">{log.user_email || "SYSTEM"}</span><span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{log.user_role || "automated"}</span></div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4"><Badge variant="outline" className={cn("px-2.5 py-0.5 rounded-md font-black text-[8px] tracking-[0.1em]", actionCfg.color)}>{actionCfg.label}</Badge></TableCell>
                      <TableCell className="px-6 py-4"><div className="flex items-center gap-2"><entityCfg.icon className="h-3.5 w-3.5 text-slate-400" /><span className="font-bold text-slate-600 text-[10px] uppercase tracking-widest truncate max-w-[120px]">{entityCfg.label}</span></div></TableCell>
                      <TableCell className="px-6 py-4 text-center"><Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)} className="h-8 w-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"><Eye className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total {meta.total} Logs</p>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-white" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
            <div className="flex items-center px-4 text-[9px] font-black bg-white border rounded-lg text-slate-700 tracking-widest">{page} / {meta.totalPages}</div>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-white" disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </Card>

      {/* DETAIL MODAL - HUMAN FRIENDLY VERSION */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent showCloseButton={false} className="max-w-[95vw] md:max-w-4xl w-full max-h-[90vh] p-0 border-none rounded-[1.5rem] shadow-2xl overflow-hidden bg-white flex flex-col mx-auto">
          {/* Header */}
          <div className="bg-slate-900 p-5 md:p-6 flex items-center justify-between shrink-0 relative">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner"><ShieldAlert className="h-5 w-5 text-emerald-400" /></div>
              <div><DialogTitle className="text-white text-base md:text-lg font-black uppercase tracking-widest leading-none">Rincian Aktivitas</DialogTitle><DialogDescription className="text-slate-400 text-[8px] font-bold uppercase tracking-[0.2em] mt-1.5 opacity-60">Log ID: {selectedLog?.id}</DialogDescription></div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedLog(null)} className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl"><X className="h-5 w-5" /></Button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-8 scrollbar-thin">
            {/* Meta Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoCard label="Aktor" value={selectedLog?.user_email || "SISTEM OTOMATIS"} subValue={selectedLog?.user_role || "system"} icon={User} color="emerald" />
              <InfoCard label="Tindakan" value={getActionConfig(selectedLog?.action || "").label} subValue={getEntityDisplay(selectedLog?.entity_type || "").label} icon={Activity} color="blue" />
              <InfoCard label="Waktu" value={selectedLog ? format(new Date(selectedLog.created_at), "HH:mm:ss") : "-"} subValue={selectedLog ? format(new Date(selectedLog.created_at), "dd MMMM yyyy", { locale: id }) : "-"} icon={History} color="purple" />
            </div>

            {/* Human Friendly Table */}
            <div className="space-y-4">
              <div className="flex items-center gap-3"><ListTree className="h-4 w-4 text-slate-400" /><h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Inspeksi Data Objek</h4></div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
                {/* Visual Connector */}
                {selectedLog?.old_data && selectedLog?.new_data && <div className="hidden lg:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-blue-600 text-white items-center justify-center shadow-lg"><ArrowRight className="h-4 w-4" /></div>}

                {/* OLD DATA TABLE */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kondisi Sebelum</span><Badge variant="outline" className="text-[8px] font-black bg-slate-50 text-slate-400 border-none rounded">BEFORE</Badge></div>
                  <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm bg-slate-50/30">
                    {selectedLog?.old_data ? (
                      <table className="w-full text-left text-xs">
                        <tbody className="divide-y divide-slate-100">
                          {Object.entries(selectedLog.old_data).map(([key, val]: any) => (
                            <tr key={key} className="hover:bg-white transition-colors">
                              <td className="p-3 font-black text-slate-400 text-[9px] uppercase w-1/3 bg-slate-50/50">{humanizeLabel(key)}</td>
                              <td className="p-3 font-bold text-slate-600">{formatDataValue(key, val)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-12 text-center flex flex-col items-center gap-2 opacity-30"><Info className="h-8 w-8" /><p className="text-[9px] font-black uppercase tracking-widest italic">Data Baru Dibuat</p></div>
                    )}
                  </div>
                </div>

                {/* NEW DATA TABLE */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kondisi Sesudah</span><Badge variant="outline" className="text-[8px] font-black bg-emerald-50 text-emerald-600 border-none rounded">AFTER</Badge></div>
                  <div className="rounded-2xl border border-emerald-100 overflow-hidden shadow-sm bg-emerald-50/10">
                    {selectedLog?.new_data ? (
                      <table className="w-full text-left text-xs">
                        <tbody className="divide-y divide-emerald-50">
                          {Object.entries(selectedLog.new_data).map(([key, val]: any) => {
                            // Check if changed from old
                            const isChanged = selectedLog.old_data && selectedLog.old_data[key] !== val;
                            return (
                              <tr key={key} className={cn("transition-colors", isChanged ? "bg-emerald-100/30" : "hover:bg-white")}>
                                <td className="p-3 font-black text-slate-400 text-[9px] uppercase w-1/3 bg-emerald-50/50">{humanizeLabel(key)}</td>
                                <td className="p-3 font-bold text-slate-900 flex items-center justify-between">
                                  {formatDataValue(key, val)}
                                  {isChanged && <Badge className="bg-emerald-500 text-white text-[7px] h-3 px-1 rounded-sm ml-2">UBAH</Badge>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-12 text-center flex flex-col items-center gap-2 text-rose-300 opacity-50"><Trash2 className="h-8 w-8" /><p className="text-[9px] font-black uppercase tracking-widest italic">Data Telah Dihapus</p></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0"><Button onClick={() => setSelectedLog(null)} className="h-11 px-10 rounded-xl bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95">Tutup Rincian</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoCard({ label, value, subValue, icon: Icon, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100"
  };
  return (
    <div className={cn("bg-white p-5 rounded-2xl border shadow-sm space-y-1 transition-all hover:shadow-md", colors[color])}>
      <span className="text-[8px] font-black uppercase tracking-widest block mb-2 opacity-60 flex items-center gap-2"><Icon className="h-2.5 w-2.5" /> {label}</span>
      <p className="text-xs font-black uppercase truncate">{value}</p>
      <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">{subValue}</p>
    </div>
  );
}
