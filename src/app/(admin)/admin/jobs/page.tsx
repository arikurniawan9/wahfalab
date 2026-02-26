// ============================================================================
// ADMIN JOB PROGRESS DASHBOARD - Super Admin v3.2 (Refined Indonesian)
// Dashboard komprehensif untuk administrator dengan wawasan finansial,
// pelacakan SLA, dan alat manajemen tingkat lanjut.
// ============================================================================

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Briefcase,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  FlaskConical,
  MapPin,
  FileText,
  AlertCircle,
  ArrowRight,
  ClipboardCheck,
  Truck,
  TestTube,
  Printer,
  User,
  Calendar,
  X,
  History,
  DollarSign,
  TrendingUp,
  Download,
  Trash2,
  AlertTriangle,
  MoreVertical,
  ShieldCheck,
  CreditCard
} from "lucide-react";
import { ChemicalLoader, LoadingOverlay, LoadingButton } from "@/components/ui";
import { getJobOrders, getJobStats, getFieldOfficers, getCustomers, deleteJobOrderWithPhotos } from "@/lib/actions/jobs";
import { toast } from "sonner";
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
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Stat Card Component
function StatCard({ title, value, subValue, icon: Icon, color, onClick, active }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
    red: "bg-red-50 text-red-600 border-red-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  };

  return (
    <Card
      className={cn(
        "border-2 transition-all duration-300 cursor-pointer overflow-hidden min-h-[110px] flex flex-col justify-center",
        active ? "border-emerald-500 shadow-lg scale-[1.05]" : "border-transparent shadow-sm hover:shadow-md",
        colors[color]
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 flex flex-col items-center text-center gap-2">
        <div className={cn("p-2 rounded-xl bg-white shadow-sm shrink-0 mb-1")}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="w-full min-w-0 space-y-1">
          <p className="text-[9px] font-black uppercase opacity-70 tracking-tight leading-none truncate">{title}</p>
          <p className="text-lg font-black tracking-tighter leading-none">{value}</p>
          {subValue && <p className="text-[8px] font-bold opacity-60 truncate">{subValue}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// Workflow Timeline Component
function WorkflowTimeline({ status }: any) {
  const stages = [
    { id: 1, name: "Order", icon: FileText, complete: true },
    { id: 2, name: "Sampling", icon: MapPin, complete: ["sampling", "analysis_ready", "analysis", "analysis_done", "reporting", "completed"].includes(status) },
    { id: 3, name: "BAST", icon: ClipboardCheck, complete: ["analysis_ready", "analysis", "analysis_done", "reporting", "completed"].includes(status) },
    { id: 4, name: "Analisis", icon: FlaskConical, complete: ["analysis", "analysis_done", "reporting", "completed"].includes(status) },
    { id: 5, name: "Reporting", icon: FileText, complete: ["reporting", "completed"].includes(status) },
    { id: 6, name: "Selesai", icon: CheckCircle, complete: status === "completed" },
  ];

  const getStatusColor = (stage: any) => {
    if (stage.complete) return "bg-emerald-500 text-white border-emerald-600";
    if (stage.id === stages.findIndex(s => !s.complete) + 1) return "bg-amber-500 text-white border-amber-600 animate-pulse";
    return "bg-slate-100 text-slate-400 border-slate-200";
  };

  return (
    <div className="flex items-center gap-1 min-w-[200px]">
      {stages.map((stage, index) => (
        <React.Fragment key={stage.id}>
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
              getStatusColor(stage)
            )}>
              <stage.icon className="h-3 w-3" />
            </div>
            <span className={cn(
              "text-[8px] font-bold uppercase tracking-tighter",
              stage.complete ? "text-emerald-600" : stage.id === stages.findIndex(s => !s.complete) + 1 ? "text-amber-600" : "text-slate-400"
            )}>
              {stage.name}
            </span>
          </div>
          {index < stages.length - 1 && (
            <div className={cn(
              "w-4 h-0.5 transition-all duration-300",
              stage.complete ? "bg-emerald-500" : "bg-slate-200"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

const statusOptions = [
  { value: "all", label: "Semua Status", color: "bg-slate-100 text-slate-700", icon: Briefcase },
  { value: "scheduled", label: "Terjadwal", color: "bg-blue-100 text-blue-700", icon: Clock },
  { value: "sampling", label: "Sampling", color: "bg-amber-100 text-amber-700", icon: MapPin },
  { value: "analysis_ready", label: "Siap Analisis", color: "bg-emerald-100 text-emerald-700", icon: ClipboardCheck },
  { value: "analysis", label: "Analisis Lab", color: "bg-indigo-100 text-indigo-700", icon: FlaskConical },
  { value: "analysis_done", label: "Selesai Analisis", color: "bg-violet-100 text-violet-700", icon: TestTube },
  { value: "reporting", label: "Reporting", color: "bg-purple-100 text-purple-700", icon: FileText },
  { value: "completed", label: "Selesai", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
];

export default function AdminJobProgressPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [stats, setStats] = useState<any>({ total: 0 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filters, setFilters] = useState<any>({
    dateFrom: "",
    dateTo: "",
    fieldOfficerId: "",
    customerId: "",
  });
  const [fieldOfficers, setFieldOfficers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Debounced search
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedSearch = useDebounce(search, 700);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getJobOrders(page, limit, debouncedSearch, {
        status: filterStatus !== 'all' ? filterStatus : undefined,
        ...filters
      });
      setData(result);
    } catch (error: any) {
      toast.error("Gagal memuat data progress pekerjaan");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filterStatus, filters]);

  const loadStats = useCallback(async () => {
    try {
      const statsData = await getJobStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  const loadFilterOptions = useCallback(async () => {
    try {
      const [officers, customers] = await Promise.all([
        getFieldOfficers(),
        getCustomers()
      ]);
      setFieldOfficers(officers || []);
      setCustomers(customers || []);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadFilterOptions();
  }, [loadStats, loadFilterOptions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePreviewJob = (job: any) => {
    setSelectedJob(job);
    setIsPreviewDialogOpen(true);
  };

  const handleDeleteClick = (job: any) => {
    setSelectedJob(job);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedJob) return;
    setDeleting(true);
    try {
      const result = await deleteJobOrderWithPhotos(selectedJob.id);
      if (result.success) {
        toast.success("Job Order berhasil dihapus");
        setIsDeleteDialogOpen(false);
        loadData();
        loadStats();
      } else {
        toast.error(result.error || "Gagal menghapus job order");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus data");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusInfo = (status: string) => {
    return statusOptions.find(opt => opt.value === status) || statusOptions[0];
  };

  const formatIDR = (amount: any) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleExport = () => {
    if (data.items.length === 0) return;
    
    const headers = ["Kode Tracking", "No. Penawaran", "Klien", "Perusahaan", "Status", "Total Nilai", "Tanggal"];
    const rows = data.items.map((item: any) => [
      item.tracking_code,
      item.quotation.quotation_number,
      item.quotation.profile.full_name,
      item.quotation.profile.company_name || "-",
      item.status,
      item.quotation.total_amount,
      new Date(item.created_at).toLocaleDateString('id-ID')
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map((e: any) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `job_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Data berhasil diekspor");
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-emerald-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-emerald-600" />
            DASHBOARD MONITORING PEKERJAAN
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] opacity-80">Pengawasan Operasional & Finansial Laboratorium</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="rounded-2xl border-slate-200 font-bold text-xs gap-2 h-11 px-6 shadow-sm bg-white" onClick={handleExport}>
                <Download className="h-4 w-4 text-emerald-600" />
                Ekspor Data
            </Button>
            <Button className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 h-11 px-6 shadow-lg shadow-emerald-900/20" onClick={() => { loadStats(); loadData(); }}>
                <History className="h-4 w-4" />
                Refresh Data
            </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-4 mb-8">
        <StatCard title="Total" value={stats.total || 0} icon={Briefcase} color="slate" onClick={() => { setFilterStatus("all"); setFilters({}); }} active={filterStatus === "all"} />
        <StatCard title="Terjadwal" value={stats.scheduled || 0} icon={Clock} color="blue" onClick={() => setFilterStatus("scheduled")} active={filterStatus === "scheduled"} />
        <StatCard title="Sampling" value={stats.sampling || 0} icon={MapPin} color="amber" onClick={() => setFilterStatus("sampling")} active={filterStatus === "sampling"} />
        <StatCard title="Siap Analisis" value={stats.analysisReady || 0} icon={ClipboardCheck} color="emerald" onClick={() => setFilterStatus("analysis_ready")} active={filterStatus === "analysis_ready"} />
        <StatCard title="Analisis" value={stats.analysis || 0} icon={FlaskConical} color="indigo" onClick={() => setFilterStatus("analysis")} active={filterStatus === "analysis"} />
        <StatCard title="Selesai Analisis" value={stats.analysisDone || 0} icon={TestTube} color="violet" onClick={() => setFilterStatus("analysis_done")} active={filterStatus === "analysis_done"} />
        <StatCard title="Reporting" value={stats.reporting || 0} icon={FileText} color="purple" onClick={() => setFilterStatus("reporting")} active={filterStatus === "reporting"} />
        <StatCard title="Selesai" value={stats.completed || 0} icon={CheckCircle} color="emerald" onClick={() => setFilterStatus("completed")} active={filterStatus === "completed"} />
        <StatCard title="Overdue" value={stats.overdue || 0} subValue="Butuh Tindakan" icon={AlertCircle} color="red" onClick={() => {}} active={false} />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-200 overflow-hidden">
        <div className="p-8 border-b bg-gradient-to-br from-slate-50 to-white flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
              <Input
                placeholder="Cari kode tracking, nama klien, perusahaan..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-12 h-14 rounded-2xl border-slate-200 bg-white shadow-inner focus-visible:ring-emerald-500 font-medium"
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-56 h-14 rounded-2xl border-slate-200 bg-white font-black text-xs uppercase tracking-wider text-slate-700">
                  <div className="flex items-center gap-2"><Filter className="h-4 w-4 text-emerald-600" /><SelectValue placeholder="Semua Status" /></div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl">{statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold py-3 cursor-pointer">{opt.label.toUpperCase()}</SelectItem>)}</SelectContent>
              </Select>
              <Button
                variant={showFilters ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn("h-14 px-6 rounded-2xl border-slate-200 font-black text-xs uppercase tracking-wider transition-all", showFilters ? "bg-slate-200" : "bg-white")}
              >
                {showFilters ? "Tutup Filter" : "Lanjutan"}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-slate-900 rounded-3xl border border-slate-800 animate-in fade-in zoom-in-95 duration-300">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Dari Tanggal</Label>
                <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} className="h-11 rounded-xl border-slate-700 bg-slate-800 text-white text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Sampai Tanggal</Label>
                <Input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} className="h-11 rounded-xl border-slate-700 bg-slate-800 text-white text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Field Officer</Label>
                <Select value={filters.fieldOfficerId || "all"} onValueChange={(val) => setFilters({ ...filters, fieldOfficerId: val === "all" ? "" : val })}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-700 bg-slate-800 text-white text-xs"><SelectValue placeholder="Semua Petugas" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="all">Semua Petugas</SelectItem>
                    {fieldOfficers.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Klien</Label>
                <Select value={filters.customerId || "all"} onValueChange={(val) => setFilters({ ...filters, customerId: val === "all" ? "" : val })}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-700 bg-slate-800 text-white text-xs"><SelectValue placeholder="Semua Klien" /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    <SelectItem value="all">Semua Klien</SelectItem>
                    {customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.company_name || c.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-4 flex justify-end gap-3 pt-2">
                <Button variant="ghost" size="sm" onClick={() => { setFilters({ dateFrom: "", dateTo: "", fieldOfficerId: "", customerId: "" }); setFilterStatus("all"); setSearch(""); }} className="text-white hover:bg-white/10 text-xs font-black uppercase">Reset Filter</Button>
                <Button size="sm" onClick={loadData} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-xs font-black uppercase px-8 rounded-xl">Terapkan Filter</Button>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none">
                <TableHead className="px-8 py-5 font-black text-slate-900 uppercase text-[10px] tracking-[0.2em]">Pekerjaan & Penawaran</TableHead>
                <TableHead className="px-4 py-5 font-black text-slate-900 uppercase text-[10px] tracking-[0.2em]">Informasi Klien</TableHead>
                <TableHead className="px-4 py-5 font-black text-slate-900 uppercase text-[10px] tracking-[0.2em]">Status Operasional</TableHead>
                <TableHead className="px-4 py-5 font-black text-slate-900 uppercase text-[10px] tracking-[0.2em]">Billing & Revenue</TableHead>
                <TableHead className="px-8 py-5 font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5} className="py-10 px-8"><div className="h-14 bg-slate-50 animate-pulse rounded-2xl" /></TableCell></TableRow>
                ))
              ) : data.items.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-32"><div className="flex flex-col items-center gap-6"><div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center border-4 border-white shadow-lg"><Briefcase className="h-10 w-10 text-slate-200" /></div><div className="space-y-1"><p className="font-black text-slate-800 text-lg uppercase tracking-widest">Tidak ada data</p><p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Sesuaikan pencarian atau filter Anda</p></div></div></TableCell></TableRow>
              ) : (
                data.items.map((item: any) => {
                  const sInfo = getStatusInfo(item.status);
                  const isUrgent = new Date().getTime() - new Date(item.created_at).getTime() > 7 * 24 * 60 * 60 * 1000 && item.status !== 'completed';
                  
                  return (
                    <TableRow key={item.id} className="group hover:bg-emerald-50/10 transition-all border-slate-100/60">
                      <TableCell className="px-8 py-6">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg shadow-sm">{item.tracking_code}</span>
                            {isUrgent && <Badge className="bg-red-50 text-red-600 border-red-100 text-[8px] font-black uppercase px-1.5 h-5 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Peringatan SLA</Badge>}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-tighter"><FileText className="h-3.5 w-3.5 text-slate-300" />{item.quotation.quotation_number}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-sm text-slate-800 tracking-tight">{item.quotation.profile.full_name}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">{item.quotation.profile.company_name || "Personal"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="space-y-3 min-w-[220px]">
                          <div className="flex justify-between items-center">
                            <Badge variant="outline" className={cn("text-[9px] font-black border-2 py-0.5 px-3 uppercase tracking-wider", sInfo.color)}>{sInfo.label}</Badge>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                          </div>
                          <WorkflowTimeline status={item.status} />
                        </div>
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <span className="font-black text-sm text-slate-900">{formatIDR(item.quotation.total_amount)}</span>
                                {item.payment?.payment_status === 'paid' ? (
                                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[8px] font-black uppercase">LUNAS</Badge>
                                ) : item.invoice ? (
                                    <Badge className="bg-blue-50 text-blue-600 border-blue-100 text-[8px] font-black uppercase">TERTAGIH</Badge>
                                ) : (
                                    <Badge className="bg-slate-50 text-slate-400 border-slate-100 text-[8px] font-black uppercase">BELUM TAGIH</Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-3 w-3 text-slate-300" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{item.invoice?.invoice_number || "Belum Ada Invoice"}</span>
                            </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreviewJob(item)}
                            className="h-10 w-10 rounded-xl text-emerald-600 hover:bg-emerald-100 transition-all active:scale-95 shadow-sm bg-white border border-slate-100"
                            title="Pratinjau"
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 text-slate-400 border border-slate-100 bg-white shadow-sm active:scale-95" title="Opsi">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-slate-200">
                                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Menu Manajemen</DropdownMenuLabel>
                                <DropdownMenuItem className="rounded-xl cursor-pointer font-bold text-xs py-2.5 px-3" onClick={() => window.open(`/admin/quotations/${item.quotation.id}`, '_blank')}>
                                    <FileText className="h-4 w-4 mr-2 text-blue-500" /> Buka Penawaran
                                </DropdownMenuItem>
                                {item.sampling_assignment && (
                                    <DropdownMenuItem className="rounded-xl cursor-pointer font-bold text-xs py-2.5 px-3" onClick={() => window.open(`/admin/sampling/${item.sampling_assignment.id}`, '_blank')}>
                                        <MapPin className="h-4 w-4 mr-2 text-amber-500" /> Detail Sampling
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator className="my-2 bg-slate-100" />
                                <DropdownMenuItem className="rounded-xl cursor-pointer font-bold text-xs py-2.5 px-3 text-red-600 hover:bg-red-50 focus:text-red-600 focus:bg-red-50" onClick={() => handleDeleteClick(item)}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Hapus Job Order
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-8 bg-slate-50/80 border-t flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total: {data.total} transaksi aktif</span>
            <div className="h-4 w-[1px] bg-slate-300 hidden md:block" />
            <div className="hidden md:flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Sistem Aktif</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-11 w-11 rounded-2xl border-slate-200 shadow-sm bg-white" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-5 w-5" /></Button>
            <div className="h-11 px-6 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-900 shadow-sm">{page} / {data.pages}</div>
            <Button variant="outline" size="sm" className="h-11 w-11 rounded-2xl border-slate-200 shadow-sm bg-white" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-5 w-5" /></Button>
          </div>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-5xl p-0 border-none shadow-2xl rounded-[3rem] overflow-hidden max-h-[95vh]">
          <div className="bg-slate-900 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-8">
                <Button variant="ghost" size="icon" onClick={() => setIsPreviewDialogOpen(false)} className="text-white/40 hover:text-white hover:bg-white/10 rounded-2xl h-12 w-12"><X className="h-6 w-6" /></Button>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/20 transform rotate-3">
                <ShieldCheck className="h-8 w-8 text-slate-900" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">DETAIL TRANSAKSI</DialogTitle>
                <div className="flex items-center gap-3 mt-1">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">{selectedJob?.tracking_code}</Badge>
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">ID Record: {selectedJob?.id.split('-')[0]}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-10 overflow-y-auto max-h-[75vh] bg-white">
            {selectedJob && (
              <div className="space-y-10">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-5 tracking-[0.2em] flex items-center gap-2"><Briefcase className="h-3 w-3" /> Logistik Pekerjaan</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end border-b border-slate-200/60 pb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Tracking</span>
                        <span className="font-mono text-xs font-black text-slate-900">{selectedJob.tracking_code}</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-slate-200/60 pb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Penawaran</span>
                        <span className="text-xs font-black text-slate-700">{selectedJob.quotation?.quotation_number}</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-slate-200/60 pb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Tgl Dibuat</span>
                        <span className="text-xs font-black text-slate-700">{new Date(selectedJob.created_at).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-5 tracking-[0.2em] flex items-center gap-2"><User className="h-3 w-3" /> Informasi Klien</h4>
                    <div className="space-y-1">
                        <p className="font-black text-slate-900 text-lg tracking-tight leading-tight">{selectedJob.quotation?.profile?.full_name}</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{selectedJob.quotation?.profile?.company_name || "Personal"}</p>
                        <div className="mt-4 pt-4 border-t border-slate-200/60">
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter line-clamp-2 italic">Ref ID: {selectedJob.quotation?.profile?.id}</p>
                        </div>
                    </div>
                  </div>

                  <div className="bg-emerald-900 p-6 rounded-3xl border border-slate-800 shadow-xl shadow-emerald-900/10">
                    <h4 className="text-[10px] font-black text-emerald-400 uppercase mb-5 tracking-[0.2em] flex items-center gap-2"><DollarSign className="h-3 w-3" /> Status Keuangan</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                            <span className="text-[9px] font-black text-emerald-400 uppercase">Nilai Kontrak</span>
                            <span className="text-xl font-black text-white">{formatIDR(selectedJob.quotation?.total_amount)}</span>
                        </div>
                        <div className="pt-4 border-t border-emerald-800 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-emerald-500 uppercase">Pembayaran</span>
                                <Badge className={cn("text-[9px] font-black uppercase", selectedJob.payment?.payment_status === 'paid' ? "bg-emerald-500 text-slate-900" : "bg-white/10 text-white")}>
                                    {selectedJob.payment?.payment_status === 'paid' ? 'LUNAS' : (selectedJob.payment?.payment_status || "PENDING")}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-emerald-500 uppercase">Invoice</span>
                                <span className="text-[10px] font-black text-white">{selectedJob.invoice?.invoice_number || "BELUM ADA"}</span>
                            </div>
                        </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-8 tracking-[0.3em] text-center italic">Analisis Progres Operasional</h4>
                    <div className="flex justify-center py-4">
                        <WorkflowTimeline status={selectedJob.status} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
                        <div className="text-center p-4 border-r border-slate-200">
                             <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Input Order</p>
                             <p className="text-xs font-black text-slate-700">{new Date(selectedJob.created_at).toLocaleDateString('id-ID')}</p>
                        </div>
                        <div className="text-center p-4 border-r border-slate-200">
                             <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Sampling</p>
                             <p className="text-xs font-black text-slate-700">{selectedJob.sampling_assignment?.actual_date ? new Date(selectedJob.sampling_assignment.actual_date).toLocaleDateString('id-ID') : 'Menunggu'}</p>
                        </div>
                        <div className="text-center p-4 border-r border-slate-200">
                             <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Analisis Selesai</p>
                             <p className="text-xs font-black text-slate-700">{selectedJob.analysis_done_at ? new Date(selectedJob.analysis_done_at).toLocaleDateString('id-ID') : 'Proses'}</p>
                        </div>
                        <div className="text-center p-4">
                             <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Report Selesai</p>
                             <p className="text-xs font-black text-slate-700">{selectedJob.reporting_done_at ? new Date(selectedJob.reporting_done_at).toLocaleDateString('id-ID') : 'Pending'}</p>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><User className="h-3 w-3 text-blue-500" /> Personel Lapangan</h4>
                        {selectedJob.sampling_assignment ? (
                            <div className="flex items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                                <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-lg border border-blue-100">
                                    {selectedJob.sampling_assignment.field_officer?.full_name?.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-slate-900 tracking-tight">{selectedJob.sampling_assignment.field_officer?.full_name}</p>
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">Field Officer</p>
                                    <div className="flex gap-2 mt-3">
                                        <Badge className="bg-slate-50 text-slate-400 border-slate-100 text-[8px] font-black uppercase">Ref: {selectedJob.sampling_assignment.id.split('-')[0]}</Badge>
                                        <Badge className="bg-slate-50 text-slate-400 border-slate-100 text-[8px] font-black uppercase">{selectedJob.sampling_assignment.travel_order?.document_number || "TIDAK ADA SURAT TUGAS"}</Badge>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                                <AlertTriangle className="h-6 w-6 text-slate-300 mb-2" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Belum Ada Personel</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><FlaskConical className="h-3 w-3 text-purple-500" /> Analis Laboratorium</h4>
                        {selectedJob.lab_analysis ? (
                            <div className="flex items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                                <div className="h-14 w-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 font-black text-lg border border-purple-100">
                                    {selectedJob.lab_analysis.analyst?.full_name?.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-slate-900 tracking-tight">{selectedJob.lab_analysis.analyst?.full_name}</p>
                                    <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mt-0.5">Analyst</p>
                                    <div className="flex gap-2 mt-3">
                                        <Badge className="bg-slate-50 text-slate-400 border-slate-100 text-[8px] font-black uppercase">Tahap Analisis</Badge>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                                <History className="h-6 w-6 text-slate-300 mb-2" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Menunggu Input Analisis</p>
                            </div>
                        )}
                    </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-8 border-t bg-slate-50 flex gap-4">
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)} className="flex-1 font-black text-[11px] uppercase h-14 rounded-2xl border-slate-300">Tutup</Button>
            {selectedJob && (
              <Link href={`/admin/quotations/${selectedJob.quotation.id}`} className="flex-[2]">
                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase h-14 rounded-2xl shadow-xl shadow-slate-900/20">
                  <FileText className="h-4 w-4 mr-3 text-emerald-400" />
                  Lihat Detail Penawaran
                </Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
            <div className="bg-red-600 p-8 text-white text-center">
                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                    <Trash2 className="h-10 w-10 text-white" />
                </div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Konfirmasi Penghapusan</DialogTitle>
                <DialogDescription className="text-red-100 text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80">Tindakan ini tidak dapat dibatalkan</DialogDescription>
            </div>
            <div className="p-8 text-center space-y-4">
                <p className="text-sm font-bold text-slate-600">Anda akan menghapus <span className="text-red-600 font-black">{selectedJob?.tracking_code}</span> beserta semua data terkait.</p>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <p className="text-[10px] text-amber-700 font-black uppercase text-left leading-tight">Penghapusan akan dicatat dalam audit log sistem.</p>
                </div>
            </div>
            <DialogFooter className="p-8 pt-0 flex gap-3">
                <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 font-black text-[10px] uppercase h-12 rounded-2xl text-slate-400">Batal</Button>
                <LoadingButton onClick={confirmDelete} loading={deleting} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase h-12 rounded-2xl shadow-lg shadow-red-900/20">Hapus Data</LoadingButton>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
