// ============================================================================
// ADMIN SAMPLING MONITORING DASHBOARD - Super Admin v3.0
// Pusat kendali pengawasan sampling dengan pelacakan petugas lapangan,
// penjadwalan, dan integrasi Surat Tugas (Travel Order).
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  User,
  FileText,
  Eye,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  X,
  History,
  ShieldCheck,
  Filter,
  PlusCircle,
  TrendingUp,
  Briefcase
} from "lucide-react";
import { ChemicalLoader, LoadingOverlay, LoadingButton } from "@/components/ui";
import { getAllSamplingAssignments, createSamplingAssignment } from "@/lib/actions/sampling";
import { getFieldOfficers, getCustomers, getJobOrders } from "@/lib/actions/jobs";
import { getFieldAssistants } from "@/lib/actions/field-assistant";
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
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Stat Card Component (Vertical Layout for better visibility)
function StatCard({ title, value, icon: Icon, color, onClick, active }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
    red: "bg-red-50 text-red-600 border-red-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
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
        </div>
      </CardContent>
    </Card>
  );
}

const statusOptions = [
  { value: "all", label: "SEMUA STATUS", color: "bg-slate-100 text-slate-700", icon: Briefcase },
  { value: "pending", label: "MENUNGGU", color: "bg-slate-100 text-slate-700", icon: Clock },
  { value: "in_progress", label: "PROSES", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
  { value: "completed", label: "SELESAI", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  { value: "cancelled", label: "DIBATALKAN", color: "bg-red-100 text-red-700", icon: XCircle }
];

export default function AdminSamplingMonitoringPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
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
  const [assistants, setAssistants] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  interface SamplingFormData {
    job_order_id: string;
    field_officer_id: string;
    assistant_ids: string[];
    scheduled_date: string;
    location: string;
    notes: string;
  }

  const [formData, setFormData] = useState<SamplingFormData>({
    job_order_id: "",
    field_officer_id: "",
    assistant_ids: [],
    scheduled_date: "",
    location: "",
    notes: ""
  });

  // Debounced search
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
      return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
  };

  const debouncedSearch = useDebounce(search, 700);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllSamplingAssignments(page, limit, debouncedSearch, filterStatus);
      setData(result);
    } catch (error: any) {
      toast.error("Gagal memuat data sampling");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filterStatus]);

  const loadFilterOptions = useCallback(async () => {
    try {
      const [officers, clientList, jobsData, assistantList] = await Promise.all([
        getFieldOfficers(),
        getCustomers(),
        getJobOrders(1, 100, ""),
        getFieldAssistants()
      ]);
      setFieldOfficers(officers || []);
      setAssistants(assistantList?.items || []);
      setCustomers(clientList || []);
      
      // Filter jobs yang belum ditugaskan
      const jobsForAssignment = jobsData.items.filter((j: any) => {
        return ['scheduled', 'sampling'].includes(j.status) && !j.sampling_assignment;
      });
      setAvailableJobs(jobsForAssignment);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  }, []);

  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await createSamplingAssignment(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Penugasan berhasil dibuat", {
        description: `Job Order telah ditugaskan ke personel terkait`
      });
setIsCreateModalOpen(false);
setFormData({
  job_order_id: "",
  field_officer_id: "",
  assistant_ids: [],
  scheduled_date: "",
  location: "",
  notes: ""
});
loadData();

      // Redirect ke travel order setelah delay jika diperlukan
      const assignmentId = result.assignment?.id;
      if (assignmentId) {
        setTimeout(() => {
          window.location.href = `/admin/travel-orders/create/${assignmentId}`;
        }, 1500);
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat penugasan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = () => {
    if (data.items.length === 0) return;
    
    const headers = ["Kode Tracking", "Klien", "Perusahaan", "Petugas", "Lokasi", "Tanggal Rencana", "Status"];
    const rows = data.items.map((item: any) => [
      item.job_order.tracking_code,
      item.job_order.quotation.profile.full_name,
      item.job_order.quotation.profile.company_name || "-",
      item.field_officer.full_name,
      item.location,
      new Date(item.scheduled_date).toLocaleDateString('id-ID'),
      item.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map((e: any) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_sampling_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Data sampling berhasil diekspor");
  };

  // Stats calculation
  const stats = useMemo(() => ({
    total: data.total,
    pending: data.items.filter((i: any) => i.status === "pending").length,
    in_progress: data.items.filter((i: any) => i.status === "in_progress").length,
    completed: data.items.filter((i: any) => i.status === "completed").length,
    cancelled: data.items.filter((i: any) => i.status === "cancelled").length
  }), [data.items]);

  const filteredItems = useMemo(() => data.items, [data.items]);

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-emerald-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-emerald-600" />
            MONITORING PENUGASAN SAMPLING
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] opacity-80">Pengawasan Personel Lapangan & Jadwal Pengambilan Sampel</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="rounded-2xl border-slate-200 font-bold text-xs gap-2 h-11 px-6 shadow-sm bg-white" onClick={handleExport}>
                <Download className="h-4 w-4 text-emerald-600" />
                Ekspor Data
            </Button>
            <Button className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 h-11 px-6 shadow-lg shadow-emerald-900/20" onClick={() => setIsCreateModalOpen(true)}>
                <PlusCircle className="h-4 w-4" />
                Tambah Penugasan
            </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard title="Total Penugasan" value={stats.total} icon={Briefcase} color="slate" onClick={() => setFilterStatus("all")} active={filterStatus === "all"} />
        <StatCard title="Menunggu" value={stats.pending} icon={Clock} color="amber" onClick={() => setFilterStatus("pending")} active={filterStatus === "pending"} />
        <StatCard title="Dalam Proses" value={stats.in_progress} icon={AlertCircle} color="blue" onClick={() => setFilterStatus("in_progress")} active={filterStatus === "in_progress"} />
        <StatCard title="Berhasil Selesai" value={stats.completed} icon={CheckCircle} color="emerald" onClick={() => setFilterStatus("completed")} active={filterStatus === "completed"} />
        <StatCard title="Dibatalkan" value={stats.cancelled} icon={XCircle} color="red" onClick={() => setFilterStatus("cancelled")} active={filterStatus === "cancelled"} />
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-200 overflow-hidden">
        <div className="p-8 border-b bg-gradient-to-br from-slate-50 to-white flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
              <Input
                placeholder="Cari lokasi, nama petugas, atau kode tracking..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-12 h-14 rounded-2xl border-slate-200 bg-white shadow-inner focus-visible:ring-emerald-500 font-medium"
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-56 h-14 rounded-2xl border-slate-200 bg-white font-black text-xs uppercase tracking-wider text-slate-700">
                  <div className="flex items-center gap-2"><Filter className="h-4 w-4 text-emerald-600" /><SelectValue placeholder="Status" /></div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                    {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold py-3 cursor-pointer">{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none">
                <TableHead className="px-8 py-5 font-black text-slate-900 uppercase text-[10px] tracking-[0.2em]">Data Penugasan</TableHead>
                <TableHead className="px-4 py-5 font-black text-slate-900 uppercase text-[10px] tracking-[0.2em]">Entitas Klien</TableHead>
                <TableHead className="px-4 py-5 font-black text-slate-900 uppercase text-[10px] tracking-[0.2em]">Petugas & Lokasi</TableHead>
                <TableHead className="px-4 py-5 font-black text-slate-900 uppercase text-[10px] tracking-[0.2em]">Jadwal Rencana</TableHead>
                <TableHead className="px-8 py-5 font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5} className="py-10 px-8"><div className="h-14 bg-slate-50 animate-pulse rounded-2xl" /></TableCell></TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-32"><div className="flex flex-col items-center gap-6"><div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center border-4 border-white shadow-lg"><MapPin className="h-10 w-10 text-slate-200" /></div><div className="space-y-1"><p className="font-black text-slate-800 text-lg uppercase tracking-widest">Belum ada penugasan</p><p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Silakan buat penugasan baru untuk memulai pelacakan</p></div></div></TableCell></TableRow>
              ) : (
                filteredItems.map((item: any) => {
                  const sInfo = statusOptions.find(opt => opt.value === item.status) || statusOptions[0];
                  return (
                    <TableRow key={item.id} className="group hover:bg-emerald-50/10 transition-all border-slate-100/60">
                      <TableCell className="px-8 py-6">
                        <div className="flex flex-col gap-2">
                          <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg shadow-sm w-fit">{item.job_order.tracking_code}</span>
                          <Badge variant="outline" className={cn("text-[9px] font-black border-2 py-0.5 px-3 uppercase tracking-wider w-fit", sInfo.color)}>{sInfo.label}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-sm text-slate-800 tracking-tight">{item.job_order.quotation.profile.full_name}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">{item.job_order.quotation.profile.company_name || "Personal"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                    <User className="h-3.5 w-3.5 text-emerald-600" />
                                    <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">{item.field_officer.full_name}</span>
                                </div>
                                {item.assistants && item.assistants.length > 0 && (
                                    <div className="flex flex-col gap-0.5 pl-5.5">
                                        {item.assistants.map((ast: any) => (
                                          <span key={ast.id} className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter line-clamp-1">Asisten: {ast.full_name}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 text-slate-300" />
                                <span className="text-[10px] font-bold text-slate-400 line-clamp-1">{item.location}</span>
                            </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-slate-300" />
                                <span className="text-xs font-black text-slate-700">
                                    {new Date(item.scheduled_date).toLocaleDateString("id-ID", {
                                        day: 'numeric', month: 'short', year: 'numeric'
                                    })}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 ml-5.5 uppercase">
                                {new Date(item.scheduled_date).toLocaleTimeString("id-ID", {
                                    hour: '2-digit', minute: '2-digit'
                                })} WIB
                            </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-8 text-right">
                        <div className="flex justify-end gap-1">
                          <Link href={`/admin/sampling/${item.id}`}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-xl text-emerald-600 hover:bg-emerald-100 transition-all active:scale-95 shadow-sm bg-white border border-slate-100"
                                title="Detail Penugasan"
                            >
                                <Eye className="h-5 w-5" />
                            </Button>
                          </Link>
                          {item.travel_order && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-xl text-blue-600 hover:bg-blue-100 transition-all active:scale-95 shadow-sm bg-white border border-slate-100"
                                onClick={() => window.open(`/admin/travel-orders/${item.travel_order.id}`, '_blank')}
                                title="Lihat Surat Tugas"
                            >
                                <FileText className="h-5 w-5" />
                            </Button>
                          )}
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
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Record: {data.total} sampling assignments</span>
            <div className="h-4 w-[1px] bg-slate-300 hidden md:block" />
            <div className="hidden md:flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Aliran Data Aktif</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-11 w-11 rounded-2xl border-slate-200 shadow-sm bg-white" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-5 w-5" /></Button>
            <div className="h-11 px-6 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-900 shadow-sm">{page} / {data.pages}</div>
            <Button variant="outline" size="sm" className="h-11 w-11 rounded-2xl border-slate-200 shadow-sm bg-white" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-5 w-5" /></Button>
          </div>
        </div>
      </div>

      {/* CREATE MODAL */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-xl p-0 border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <div className="bg-emerald-700 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center border border-white/20"><Plus className="h-5 w-5" /></div>
              <div><DialogTitle className="text-lg font-black uppercase tracking-tight">Penugasan Baru</DialogTitle><DialogDescription className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest">Registrasi Petugas Lapangan</DialogDescription></div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(false)} className="text-white/60 hover:text-white rounded-xl"><X className="h-5 w-5" /></Button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Job Order Target</Label>
                <Select
                  value={formData.job_order_id}
                  onValueChange={(val) => handleFormDataChange("job_order_id", val)}
                >
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50">
                    <SelectValue placeholder="Pilih Job Order..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {availableJobs.map((job: any) => (
                      <SelectItem key={job.id} value={job.id} className="cursor-pointer py-3">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 text-xs">{job.tracking_code}</span>
                          <span className="text-[9px] text-slate-500 uppercase font-bold">{job.quotation?.profile?.full_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Petugas Lapangan (Field Officer)</Label>
                <Select
                  value={formData.field_officer_id}
                  onValueChange={(val) => handleFormDataChange("field_officer_id", val)}
                >
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-slate-50/50">
                    <SelectValue placeholder="Pilih Personel Utama..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {fieldOfficers.map((officer: any) => (
                      <SelectItem key={officer.id} value={officer.id} className="cursor-pointer py-3">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-[10px]">{officer.full_name.charAt(0)}</div>
                            <span className="font-bold text-slate-800 text-xs">{officer.full_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Asisten Petugas (Bisa Lebih Dari 1)</Label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/50 rounded-2xl border border-slate-200 max-h-[120px] overflow-y-auto">
                  {assistants.map((o) => (
                    <div key={o.id} className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-slate-100">
                      <input 
                        type="checkbox" 
                        id={`admin-ast-${o.id}`}
                        checked={formData.assistant_ids.includes(o.id)}
                        onChange={(e) => {
                          const ids = [...formData.assistant_ids];
                          if (e.target.checked) {
                            ids.push(o.id);
                          } else {
                            const index = ids.indexOf(o.id);
                            if (index > -1) ids.splice(index, 1);
                          }
                          setFormData({ ...formData, assistant_ids: ids });
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor={`admin-ast-${o.id}`} className="text-[10px] font-bold text-slate-600 cursor-pointer truncate">
                        {o.full_name}
                      </label>
                    </div>
                  ))}
                  {assistants.length === 0 && (
                    <p className="col-span-2 text-center py-2 text-[10px] text-slate-400 font-bold uppercase">Tidak ada data asisten</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Waktu Rencana</Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_date}
                    onChange={(e) => handleFormDataChange("scheduled_date", e.target.value)}
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Lokasi Sampling</Label>
                  <Input
                    placeholder="Nama Site / Alamat"
                    value={formData.location}
                    onChange={(e) => handleFormDataChange("location", e.target.value)}
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Catatan Operasional</Label>
                <Textarea
                  placeholder="Instruksi tambahan untuk petugas..."
                  value={formData.notes}
                  onChange={(e) => handleFormDataChange("notes", e.target.value)}
                  className="rounded-2xl border-slate-200 bg-slate-50/50 min-h-[100px] resize-none"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="flex-1 font-black text-[10px] uppercase h-12 rounded-2xl text-slate-400">Batal</Button>
              <LoadingButton
                type="submit"
                loading={submitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase h-12 rounded-2xl shadow-lg shadow-emerald-900/20"
              >
                Konfirmasi Tugas
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <LoadingOverlay isOpen={submitting} title="Memproses Penugasan..." description="Sistem sedang meregistrasi jadwal dan personel lapangan" />
    </div>
  );
}
