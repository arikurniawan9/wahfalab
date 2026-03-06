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
  CreditCard,
  Keyboard,
  Info,
  UserPlus
} from "lucide-react";
import { LoadingOverlay, LoadingButton } from "@/components/ui";
import { TableSkeleton, PageSkeleton } from "@/components/ui/skeleton";
import { getJobOrders, getJobStats, getFieldOfficers, getCustomers, deleteJobOrderWithPhotos } from "@/lib/actions/jobs";
import { getFieldAssistants } from "@/lib/actions/field-assistant";
import { createSamplingAssignment } from "@/lib/actions/sampling";
import { createTravelOrder } from "@/lib/actions/travel-order";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
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
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Stat Card Component Premium
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
        "border-none shadow-sm transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-center rounded-2xl",
        active ? "ring-2 ring-emerald-500 shadow-xl scale-[1.02]" : "hover:shadow-md hover:translate-y-[-2px]",
        colors[color]
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn("p-3 rounded-2xl bg-white shadow-sm shrink-0")}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase opacity-60 tracking-widest leading-none mb-1">{title}</p>
          <p className="text-xl font-black tracking-tight leading-none text-slate-900">{value}</p>
          {subValue && <p className="text-[8px] font-bold opacity-50 uppercase tracking-tighter mt-1">{subValue}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// Workflow Timeline Component Premium
function WorkflowTimeline({ status }: any) {
  const stages = [
    { id: 1, name: "Order", icon: FileText, complete: true },
    { id: 2, name: "Sampling", icon: MapPin, complete: ["analysis_ready", "analysis", "analysis_done", "reporting", "completed"].includes(status) },
    { id: 3, name: "Analisis", icon: FlaskConical, complete: ["analysis_done", "reporting", "completed"].includes(status) },
    { id: 4, name: "Reporting", icon: FileText, complete: ["completed"].includes(status) },
    { id: 5, name: "Selesai", icon: CheckCircle, complete: status === "completed" },
  ];

  const getStatusColor = (stage: any) => {
    if (stage.complete) return "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-900/10";
    if (stage.id === stages.findIndex(s => !s.complete) + 1) return "bg-amber-500 text-white border-amber-500 animate-pulse shadow-md shadow-amber-900/10";
    return "bg-slate-50 text-slate-300 border-slate-100";
  };

  return (
    <div className="flex items-center gap-1.5 min-w-[220px]">
      {stages.map((stage, index) => (
        <React.Fragment key={stage.id}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "w-7 h-7 rounded-xl border flex items-center justify-center transition-all duration-500",
                  getStatusColor(stage)
                )}>
                  <stage.icon className="h-3.5 w-3.5" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="rounded-lg border-emerald-50 shadow-xl"><p className="text-[9px] font-black uppercase tracking-widest">{stage.name}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {index < stages.length - 1 && (
            <div className={cn(
              "w-3 h-0.5 transition-all duration-1000 rounded-full",
              stage.complete ? "bg-emerald-500" : "bg-slate-100"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

const statusOptions = [
  { value: "all", label: "Semua Status", color: "bg-slate-100 text-slate-700", icon: Briefcase },
  { value: "scheduled", label: "Order", color: "bg-blue-50 text-blue-700 border-blue-100", icon: Clock },
  { value: "sampling", label: "Sampling", color: "bg-amber-50 text-amber-700 border-amber-100", icon: MapPin },
  { value: "analysis_ready", label: "Siap Analisis", color: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: ClipboardCheck },
  { value: "analysis", label: "Analisis Lab", color: "bg-indigo-50 text-indigo-700 border-indigo-100", icon: FlaskConical },
  { value: "analysis_done", label: "Selesai Analisis", color: "bg-violet-50 text-violet-700 border-violet-100", icon: TestTube },
  { value: "reporting", label: "Reporting", color: "bg-purple-50 text-purple-700 border-purple-100", icon: FileText },
  { value: "completed", label: "Selesai", color: "bg-emerald-600 text-white border-emerald-600", icon: CheckCircle },
];

export default function AdminJobProgressPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [stats, setStats] = useState<any>({ total: 0 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filters, setFilters] = useState<any>({ dateFrom: "", dateTo: "", fieldOfficerId: "", customerId: "" });
  const [fieldOfficers, setFieldOfficers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assistants, setAssistants] = useState<any[]>([]);
  const [assignFormData, setAssignFormData] = useState<any>({
    job_order_id: "", field_officer_id: "", assistant_ids: [], scheduled_date: "", scheduled_time: "08:00", location: "", notes: ""
  });

  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(handler);
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
    } catch (error) { console.error('Failed to load stats:', error); }
  }, []);

  const loadFilterOptions = useCallback(async () => {
    try {
      const [officers, customerList] = await Promise.all([getFieldOfficers(), getCustomers()]);
      setFieldOfficers(officers || []);
      setCustomers(customerList || []);
    } catch (error) { console.error('Failed to load filter options:', error); }
  }, []);

  useEffect(() => { loadStats(); loadFilterOptions(); }, [loadStats, loadFilterOptions]);
  useEffect(() => { loadData(); }, [loadData]);

  const openAssignDialog = async (job: any) => {
    setSelectedJob(job);
    setAssignFormData({
      job_order_id: job.id,
      field_officer_id: "",
      assistant_ids: [],
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: "08:00",
      location: job.quotation?.profile?.address || "",
      notes: ""
    });

    setLoading(true);
    try {
      const [officers, assistantList] = await Promise.all([getFieldOfficers(), getFieldAssistants()]);
      setFieldOfficers(officers || []);
      setAssistants(assistantList || []);
      setIsAssignDialogOpen(true);
    } catch (error) { toast.error("Gagal memuat data petugas"); }
    finally { setLoading(false); }
  };

  const handleAssignSubmit = async () => {
    if (!assignFormData.field_officer_id || !assignFormData.scheduled_date) {
      toast.error("Mohon lengkapi data penugasan");
      return;
    }
    setSubmitting(true);
    try {
      await createSamplingAssignment(assignFormData);
      toast.success("Petugas sampling berhasil ditugaskan");
      setIsAssignDialogOpen(false);
      loadData();
    } catch (error: any) { toast.error(error.message || "Gagal menugaskan petugas"); }
    finally { setSubmitting(false); }
  };

  const confirmDelete = async () => {
    if (!selectedJob) return;
    setDeleting(true);
    try {
      await deleteJobOrderWithPhotos(selectedJob.id);
      toast.success("Job Order berhasil dihapus");
      setIsDeleteDialogOpen(false);
      loadData();
      loadStats();
    } catch (error: any) { toast.error(error.message || "Gagal menghapus job order"); }
    finally { setDeleting(false); }
  };

  const getStatusLabel = (status: string) => {
    const opt = statusOptions.find(o => o.value === status);
    return opt ? opt.label : status.toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    const opt = statusOptions.find(o => o.value === status);
    const StatusIcon = opt?.icon || Clock;
    return (
      <Badge variant="outline" className={cn(
        "px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest border gap-2",
        opt?.color || "bg-slate-100"
      )}>
        <StatusIcon className="h-3 w-3" /> {opt?.label || status}
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-10 bg-slate-50/30 min-h-screen space-y-10 pb-24 md:pb-10 font-[family-name:var(--font-geist-sans)]">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Progress Pekerjaan</h1>
          <p className="text-slate-500 text-sm font-medium">Monitoring operasional laboratorium secara end-to-end.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadData()} className="h-11 px-5 rounded-xl border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold uppercase text-[10px] tracking-widest">
            <History className="h-4 w-4 mr-2 text-emerald-600" /> Refresh Data
          </Button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <StatCard title="Total" value={stats.total || 0} icon={Briefcase} color="slate" active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} />
        <StatCard title="Order" value={stats.scheduled || 0} icon={Clock} color="blue" active={filterStatus === 'scheduled'} onClick={() => setFilterStatus('scheduled')} />
        <StatCard title="Sampling" value={stats.sampling || 0} icon={MapPin} color="amber" active={filterStatus === 'sampling'} onClick={() => setFilterStatus('sampling')} />
        <StatCard title="Analisis" value={(stats.analysis_ready || 0) + (stats.analysis || 0)} icon={FlaskConical} color="indigo" active={filterStatus === 'analysis'} onClick={() => setFilterStatus('analysis')} />
        <StatCard title="Reporting" value={stats.reporting || 0} icon={FileText} color="purple" active={filterStatus === 'reporting'} onClick={() => setFilterStatus('reporting')} />
        <StatCard title="Selesai" value={stats.completed || 0} icon={CheckCircle} color="emerald" active={filterStatus === 'completed'} onClick={() => setFilterStatus('completed')} />
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-6 border-b bg-white flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              placeholder="Cari nomor job, penawaran, atau klien..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-12 h-12 bg-slate-50 border-none rounded-2xl font-medium text-sm focus-visible:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2 w-full lg:w-auto">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className={cn("h-12 px-6 rounded-2xl border-slate-100 font-black uppercase text-[10px] tracking-widest transition-all", showFilters ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600" : "bg-slate-50 hover:bg-slate-100")}>
              <Filter className="h-4 w-4 mr-2" /> Filter Lanjutan
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="p-6 bg-slate-50/50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Klien</label>
              <Select value={filters.customerId} onValueChange={(v) => setFilters({...filters, customerId: v})}>
                <SelectTrigger className="bg-white border-slate-200 rounded-xl h-10 text-xs font-bold"><SelectValue placeholder="Semua Klien" /></SelectTrigger>
                <SelectContent className="rounded-xl">{customers.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold">{c.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Petugas Sampling</label>
              <Select value={filters.fieldOfficerId} onValueChange={(v) => setFilters({...filters, fieldOfficerId: v})}>
                <SelectTrigger className="bg-white border-slate-200 rounded-xl h-10 text-xs font-bold"><SelectValue placeholder="Semua Petugas" /></SelectTrigger>
                <SelectContent className="rounded-xl">{fieldOfficers.map(o => <SelectItem key={o.id} value={o.id} className="text-xs font-bold">{o.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Dari Tanggal</label><Input type="date" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} className="bg-white border-slate-200 rounded-xl h-10 text-xs font-bold" /></div>
            <div className="space-y-1.5 flex items-end"><Button variant="ghost" onClick={() => { setFilters({dateFrom:"", dateTo:"", fieldOfficerId:"", customerId:""}); setPage(1); }} className="text-rose-500 font-black text-[9px] uppercase tracking-widest h-10 hover:bg-rose-50 rounded-xl w-full">Reset Filter</Button></div>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100">
                <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-[9px] text-slate-400">Pekerjaan</TableHead>
                <TableHead className="px-4 py-6 font-black uppercase tracking-widest text-[9px] text-slate-400">Alur Progres</TableHead>
                <TableHead className="px-4 py-6 font-black uppercase tracking-widest text-[9px] text-slate-400">Informasi Klien</TableHead>
                <TableHead className="px-4 py-6 font-black uppercase tracking-widest text-[9px] text-slate-400 text-center">Status</TableHead>
                <TableHead className="px-8 py-6 font-black uppercase tracking-widest text-[9px] text-slate-400 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="p-0"><TableSkeleton rows={limit} className="p-8" /></TableCell></TableRow>
              ) : data.items.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-32 bg-slate-50/30">
                  <Briefcase className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Tidak ada data progress ditemukan</p>
                </TableCell></TableRow>
              ) : (
                data.items.map((job: any) => (
                  <TableRow key={job.id} className="hover:bg-emerald-50/20 transition-all group">
                    <TableCell className="px-8 py-6">
                      <div className="space-y-1">
                        <span className="font-black text-emerald-950 uppercase tracking-tighter text-sm block">{job.tracking_code}</span>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          <FileText className="h-3 w-3" /> {job.quotation?.quotation_number}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-6"><WorkflowTimeline status={job.status} /></TableCell>
                    <TableCell className="px-4 py-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-black text-slate-700 uppercase tracking-tight text-[11px]">{job.quotation?.profile?.full_name}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px]">{job.quotation?.profile?.company_name || "PERSONAL CLIENT"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-6 text-center">{getStatusBadge(job.status)}</TableCell>
                    <TableCell className="px-8 py-6 text-center">
                      <div className="flex justify-center gap-2">
                        <Link href={`/admin/jobs/${job.id}`}>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-slate-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-slate-50 text-slate-400 hover:text-emerald-600 transition-all shadow-sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border-emerald-50 shadow-2xl">
                            <DropdownMenuLabel className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Navigasi Cepat</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openAssignDialog(job)} className="rounded-xl p-3 text-[10px] font-bold uppercase tracking-widest" disabled={job.status !== 'scheduled'}>
                              <UserPlus className="mr-3 h-4 w-4 text-emerald-500" /> Tugaskan Petugas
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl p-3 text-[10px] font-bold uppercase tracking-widest">
                              <Printer className="mr-3 h-4 w-4 text-blue-500" /> Cetak Surat Jalan
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setSelectedJob(job); setIsDeleteDialogOpen(true); }} className="rounded-xl p-3 text-[10px] font-bold uppercase tracking-widest text-rose-600">
                              <Trash2 className="mr-3 h-4 w-4" /> Hapus Pekerjaan
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-6 border-t flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total {data.total} Pekerjaan</p>
          <div className="flex gap-3">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-2xl bg-white border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-all" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="flex items-center px-6 text-[10px] font-black bg-white border border-slate-200 rounded-2xl shadow-sm text-emerald-900 tracking-[0.2em]">{page} / {data.pages}</div>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-2xl bg-white border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-all" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-10">
          <AlertDialogHeader>
            <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-6 border border-rose-100 shadow-inner">
              <Trash2 className="h-10 w-10" />
            </div>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight text-center text-slate-900">Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-500 font-medium py-4">
              Hapus pekerjaan <strong className="text-slate-900">{selectedJob?.tracking_code}</strong>? Seluruh data progres dan foto sampling akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-4 mt-6">
            <AlertDialogCancel className="rounded-2xl h-14 flex-1 font-black text-slate-400 uppercase text-[10px] tracking-widest border-none hover:bg-slate-50">Batal</AlertDialogCancel>
            <LoadingButton loading={deleting} onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 rounded-2xl h-14 flex-1 font-black text-white uppercase text-[10px] tracking-widest shadow-xl shadow-rose-900/20">Ya, Hapus Permanen</LoadingButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LoadingOverlay isOpen={submitting} title="Sedang Memproses..." description="Mohon tunggu, sistem sedang memperbarui database" />
    </div>
  );
}
