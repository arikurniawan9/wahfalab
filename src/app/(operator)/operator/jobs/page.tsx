// ============================================================================
// OPERATOR JOB PROGRESS PAGE - Refactored v3.0
// Powerful dashboard for operators to track and manage job progress.
// ============================================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Save,
  MessageSquare,
  FileDown,
  FileCheck,
  X
} from "lucide-react";
import { ChemicalLoader, LoadingOverlay, LoadingButton } from "@/components/ui";
import { getJobOrders, updateJobStatus, uploadCertificate, getFieldOfficers, getCustomers, getJobStats } from "@/lib/actions/jobs";
import { getFieldAssistants } from "@/lib/actions/field-assistant";
import { createSamplingAssignment } from "@/lib/actions/sampling";
import { createTravelOrder } from "@/lib/actions/travel-order";
import { getUsers } from "@/lib/actions/users";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Stat Card Component
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
        "border-2 transition-all duration-300 cursor-pointer overflow-hidden",
        active ? "border-emerald-500 shadow-lg scale-[1.02]" : "border-transparent shadow-sm hover:shadow-md",
        colors[color]
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn("p-2.5 rounded-xl bg-white shadow-sm shrink-0")}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase opacity-60 tracking-wider truncate">{title}</p>
          <p className="text-xl font-black tracking-tight leading-none">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Workflow Timeline Component
function WorkflowTimeline({ status, analysisStartedAt, analysisDoneAt, reportingDoneAt }: any) {
  const stages = [
    { id: 1, name: "Order", icon: FileText, complete: true },
    { id: 2, name: "Sampling", icon: MapPin, complete: ["sampling", "analysis_ready", "analysis", "analysis_done", "reporting", "completed"].includes(status) },
    { id: 3, name: "Handover", icon: ClipboardCheck, complete: ["analysis_ready", "analysis", "analysis_done", "reporting", "completed"].includes(status) },
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
  { value: "all", label: "Semua Status", color: "bg-slate-100 text-slate-700", theme: "bg-slate-50", icon: Briefcase, progress: 0 },
  { value: "scheduled", label: "Terjadwal", color: "bg-blue-100 text-blue-700", theme: "bg-blue-50", icon: Clock, progress: 20 },
  { value: "sampling", label: "Sampling", color: "bg-amber-100 text-amber-700", theme: "bg-amber-50", icon: MapPin, progress: 40 },
  { value: "analysis_ready", label: "Siap Analisis", color: "bg-emerald-100 text-emerald-700", theme: "bg-emerald-50", icon: ClipboardCheck, progress: 50 },
  { value: "analysis", label: "Analisis Lab", color: "bg-indigo-100 text-indigo-700", theme: "bg-indigo-50", icon: FlaskConical, progress: 60 },
  { value: "analysis_done", label: "Selesai Analisis", color: "bg-violet-100 text-violet-700", theme: "bg-violet-50", icon: TestTube, progress: 80 },
  { value: "reporting", label: "Pelaporan", color: "bg-purple-100 text-purple-700", theme: "bg-purple-50", icon: FileText, progress: 90 },
  { value: "completed", label: "Selesai", color: "bg-emerald-100 text-emerald-700", theme: "bg-emerald-50", icon: CheckCircle, progress: 100 },
];

export default function OperatorJobProgressPage() {
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
  const [assistants, setAssistants] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  // Assign modal states
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignFormData, setAssignFormData] = useState<any>({
    job_order_id: "",
    field_officer_id: "",
    assistant_ids: [],
    scheduled_date: "",
    scheduled_time: "08:00",
    location: "",
    notes: ""
  });

  const supabase = createClient();

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
      const { getJobOrders } = await import('@/lib/actions/jobs');
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
      const { getJobStats } = await import('@/lib/actions/jobs');
      const statsData = await getJobStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  const loadFilterOptions = useCallback(async () => {
    try {
      const { getFieldOfficers, getCustomers } = await import('@/lib/actions/jobs');
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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadFieldOfficers = async () => {
    try {
      const usersData = await getUsers(1, 100, "");
      const officers = usersData.users.filter((u: any) => u.role === 'field_officer');
      setFieldOfficers(officers);
    } catch (error: any) {
      toast.error("Gagal memuat petugas lapangan");
    }
  };

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
      const [officers, assistantList] = await Promise.all([
        getFieldOfficers(),
        getFieldAssistants()
      ]);
      setFieldOfficers(officers);
      setAssistants(assistantList);
    } catch (error) {
      toast.error("Gagal memuat data petugas");
    } finally {
      setLoading(false);
    }
    
    setIsAssignDialogOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedJob) return;
    if (!assignFormData.field_officer_id || !assignFormData.scheduled_date || !assignFormData.location) {
      toast.error("Harap lengkapi semua data wajib");
      return;
    }

    setSubmitting(true);
    try {
      const assignmentResult = await createSamplingAssignment({
        ...assignFormData,
        scheduled_date: `${assignFormData.scheduled_date}T${assignFormData.scheduled_time}:00`
      });

      if (assignmentResult.error || !assignmentResult.assignment) {
        throw new Error(assignmentResult.error || "Failed to create assignment");
      }

      const travelOrderData = {
        assignment_id: assignmentResult.assignment.id,
        departure_date: `${assignFormData.scheduled_date}T${assignFormData.scheduled_time}:00`,
        return_date: `${assignFormData.scheduled_date}T17:00:00`,
        destination: assignFormData.location,
        purpose: assignFormData.notes || `Sampling untuk ${selectedJob.tracking_code}`,
      };

      await createTravelOrder(travelOrderData);
      toast.success("Penugasan & Surat Tugas Berhasil!");
      setIsAssignDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat penugasan");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviewJob = (job: any) => {
    setSelectedJob(job);
    setIsPreviewDialogOpen(true);
  };

  const getStatusInfo = (status: string) => {
    return statusOptions.find(opt => opt.value === status) || statusOptions[0];
  };

  const filteredItems = filterStatus === "all"
    ? data.items
    : data.items.filter((item: any) => item.status === filterStatus);

  // Calculate stats from all items (not just current page)
  const statusCounts = {
    scheduled: data.items.filter((i: any) => i.status === 'scheduled').length,
    sampling: data.items.filter((i: any) => i.status === 'sampling').length,
    analysis_ready: data.items.filter((i: any) => i.status === 'analysis_ready').length,
    analysis: data.items.filter((i: any) => i.status === 'analysis').length,
    analysis_done: data.items.filter((i: any) => i.status === 'analysis_done').length,
    reporting: data.items.filter((i: any) => i.status === 'reporting').length,
    completed: data.items.filter((i: any) => i.status === 'completed').length,
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-emerald-600" />
            Progress Order
          </h1>
          <p className="text-slate-500 text-sm italic font-medium">Pantau dan kelola setiap tahapan pekerjaan laboratorium.</p>
        </div>
      </div>

      {/* Workflow Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-9 gap-3 mb-8">
        <StatCard title="Total" value={stats.total || data.total} icon={Briefcase} color="slate" onClick={() => { setFilterStatus("all"); setFilters({}); }} active={filterStatus === "all"} />
        <StatCard title="Terjadwal" value={stats.scheduled || 0} icon={Clock} color="blue" onClick={() => setFilterStatus("scheduled")} active={filterStatus === "scheduled"} />
        <StatCard title="Sampling" value={stats.sampling || 0} icon={MapPin} color="amber" onClick={() => setFilterStatus("sampling")} active={filterStatus === "sampling"} />
        <StatCard title="Siap Anal." value={stats.analysisReady || 0} icon={ClipboardCheck} color="emerald" onClick={() => setFilterStatus("analysis_ready")} active={filterStatus === "analysis_ready"} />
        <StatCard title="Analisis" value={stats.analysis || 0} icon={FlaskConical} color="indigo" onClick={() => setFilterStatus("analysis")} active={filterStatus === "analysis"} />
        <StatCard title="Selesai Anal." value={stats.analysisDone || 0} icon={TestTube} color="violet" onClick={() => setFilterStatus("analysis_done")} active={filterStatus === "analysis_done"} />
        <StatCard title="Reporting" value={stats.reporting || 0} icon={FileText} color="purple" onClick={() => setFilterStatus("reporting")} active={filterStatus === "reporting"} />
        <StatCard title="Selesai" value={stats.completed || 0} icon={CheckCircle} color="emerald" onClick={() => setFilterStatus("completed")} active={filterStatus === "completed"} />
        <StatCard title="Overdue" value={stats.overdue || 0} icon={AlertCircle} color="red" onClick={() => {}} active={false} />
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-2xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
        <div className="p-6 border-b bg-emerald-50/10 flex flex-col gap-4">
          {/* Search & Status Filter */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
              <Input
                placeholder="Cari kode tracking, klien, atau perusahaan..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-11 h-12 rounded-2xl border-slate-200 bg-white"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48 h-12 rounded-2xl border-slate-200 bg-white font-bold text-xs">
                  <div className="flex items-center gap-2"><Filter className="h-3 w-3" /><SelectValue placeholder="Status" /></div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl">{statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value} className="text-xs cursor-pointer">{opt.label}</SelectItem>)}</SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-12 px-4 rounded-2xl border-slate-200 bg-white font-bold text-xs"
              >
                {showFilters ? "Tutup Filter" : "Filter Lanjutan"}
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in slide-in-from-top-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Dari Tanggal</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="h-10 rounded-xl border-slate-200 bg-white text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Sampai Tanggal</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="h-10 rounded-xl border-slate-200 bg-white text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Field Officer</Label>
                <Select value={filters.fieldOfficerId || "all"} onValueChange={(val) => setFilters({ ...filters, fieldOfficerId: val === "all" ? "" : val })}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-xs">
                    <SelectValue placeholder="Semua Officer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Officer</SelectItem>
                    {fieldOfficers.map((o: any) => (
                      <SelectItem key={o.id} value={o.id}>{o.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase">Customer</Label>
                <Select value={filters.customerId || "all"} onValueChange={(val) => setFilters({ ...filters, customerId: val === "all" ? "" : val })}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-xs">
                    <SelectValue placeholder="Semua Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Customer</SelectItem>
                    {customers.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.company_name || c.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-4 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilters({});
                    setFilterStatus("all");
                    setSearch("");
                  }}
                  className="text-xs font-bold"
                >
                  Reset Filter
                </Button>
                <Button
                  size="sm"
                  onClick={loadData}
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold"
                >
                  Terapkan Filter
                </Button>
              </div>
            </div>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="px-6 py-4 font-black text-emerald-900 uppercase text-[10px] tracking-widest">Order Info</TableHead>
              <TableHead className="px-4 py-4 font-black text-emerald-900 uppercase text-[10px] tracking-widest">Klien</TableHead>
              <TableHead className="px-4 py-4 font-black text-emerald-900 uppercase text-[10px] tracking-widest">Status & Progres</TableHead>
              <TableHead className="px-4 py-4 font-black text-emerald-900 uppercase text-[10px] tracking-widest text-center">Petugas</TableHead>
              <TableHead className="px-6 py-4 font-black text-emerald-900 uppercase text-[10px] tracking-widest text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5} className="py-8 px-6"><div className="h-12 bg-slate-50 animate-pulse rounded-2xl" /></TableCell></TableRow>
              ))
            ) : filteredItems.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-24"><div className="flex flex-col items-center gap-4"><div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center"><Briefcase className="h-10 w-10 text-emerald-200" /></div><p className="font-bold text-slate-700">Data tidak ditemukan</p></div></TableCell></TableRow>
            ) : (
              filteredItems.map((item: any) => {
                const sInfo = getStatusInfo(item.status);
                return (
                  <TableRow key={item.id} className="group hover:bg-emerald-50/5 transition-all">
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded w-fit">{item.tracking_code}</span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><FileText className="h-3 w-3" />{item.quotation.quotation_number}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-800">{item.quotation.profile.full_name}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.quotation.profile.company_name || "Personal"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="space-y-2 min-w-[200px]">
                        <div className="flex justify-between items-center mb-2">
                          <Badge variant="outline" className={cn("text-[9px] font-black border-2", sInfo.color)}>{sInfo.label.toUpperCase()}</Badge>
                        </div>
                        {/* Visual Workflow Timeline */}
                        <WorkflowTimeline 
                          status={item.status}
                          analysisStartedAt={item.analysis_started_at}
                          analysisDoneAt={item.analysis_done_at}
                          reportingDoneAt={item.reporting_done_at}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="px-4 text-center">
                      {item.sampling_assignment ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg border border-blue-100">
                            <User className="h-3 w-3" />
                            <span className="text-[10px] font-black uppercase">{item.sampling_assignment.field_officer?.full_name}</span>
                          </div>
                          {item.sampling_assignment.assistants && item.sampling_assignment.assistants.length > 0 && (
                            <div className="flex flex-col gap-1 mt-1">
                              {item.sampling_assignment.assistants.map((ast: any) => (
                                <div key={ast.id} className="flex items-center gap-1.5 bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-100">
                                  <span className="text-[8px] font-bold uppercase">{ast.full_name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {item.sampling_assignment.travel_order && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-600" onClick={() => window.open(`/operator/travel-orders/${item.sampling_assignment.travel_order.id}/preview`, '_blank')}>
                              <Printer className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => openAssignDialog(item)} className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200 font-black text-[10px] uppercase rounded-xl h-8">Tugaskan</Button>
                      )}
                    </TableCell>
                    <TableCell className="px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreviewJob(item)}
                          className="h-9 px-4 rounded-xl text-emerald-600 hover:bg-emerald-100 transition-all font-bold text-xs"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="p-6 bg-slate-50/50 border-t flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total {data.total} Jobs Found</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9 w-9 rounded-xl border-slate-200" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="h-9 px-4 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-xs font-black text-emerald-900">{page} / {data.pages}</div>
            <Button variant="outline" size="sm" className="h-9 w-9 rounded-xl border-slate-200" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* ASSIGN FIELD OFFICER MODAL */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-xl p-0 border-none shadow-2xl rounded-2xl overflow-hidden">
          <div className="bg-emerald-700 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/20"><MapPin className="h-5 w-5" /></div>
              <div><DialogTitle className="text-lg font-black uppercase tracking-tight">Penugasan Sampling</DialogTitle><DialogDescription className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest">Tugaskan Petugas Lapangan</DialogDescription></div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Petugas Lapangan Utama</Label>
                <Select value={assignFormData.field_officer_id} onValueChange={(val) => setAssignFormData({ ...assignFormData, field_officer_id: val })}>
                  <SelectTrigger className="h-12 rounded-2xl bg-slate-50/50 border-slate-200"><SelectValue placeholder="Pilih Petugas Utama..." /></SelectTrigger>
                  <SelectContent className="rounded-2xl">{fieldOfficers.map((o) => <SelectItem key={o.id} value={o.id} className="cursor-pointer">{o.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Asisten Petugas (Bisa Lebih Dari 1)</Label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/50 rounded-2xl border border-slate-200 max-h-[120px] overflow-y-auto">
                  {assistants.map((o) => (
                    <div key={o.id} className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-slate-100">
                      <input 
                        type="checkbox" 
                        id={`ast-${o.id}`}
                        checked={assignFormData.assistant_ids.includes(o.id)}
                        onChange={(e) => {
                          const ids = [...assignFormData.assistant_ids];
                          if (e.target.checked) {
                            ids.push(o.id);
                          } else {
                            const index = ids.indexOf(o.id);
                            if (index > -1) ids.splice(index, 1);
                          }
                          setAssignFormData({ ...assignFormData, assistant_ids: ids });
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor={`ast-${o.id}`} className="text-[10px] font-bold text-slate-600 cursor-pointer truncate">
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
                  <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Tanggal</Label>
                  <Input type="date" value={assignFormData.scheduled_date} onChange={(e) => setAssignFormData({ ...assignFormData, scheduled_date: e.target.value })} className="h-12 rounded-2xl bg-slate-50/50 border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Waktu</Label>
                  <Input type="time" value={assignFormData.scheduled_time} onChange={(e) => setAssignFormData({ ...assignFormData, scheduled_time: e.target.value })} className="h-12 rounded-2xl bg-slate-50/50 border-slate-200" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Lokasi Sampling</Label>
                <Textarea value={assignFormData.location} onChange={(e) => setAssignFormData({ ...assignFormData, location: e.target.value })} placeholder="Alamat lengkap lokasi..." className="rounded-2xl bg-slate-50/50 border-slate-200 min-h-[100px] resize-none" />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
               <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
               <p className="text-[10px] text-blue-700 font-bold uppercase tracking-tight">Surat tugas akan otomatis diterbitkan setelah konfirmasi.</p>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t flex gap-3">
            <Button variant="ghost" onClick={() => setIsAssignDialogOpen(false)} className="flex-1 font-black text-[10px] uppercase h-12 rounded-2xl text-slate-400">Batal</Button>
            <LoadingButton onClick={handleAssignSubmit} loading={submitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase h-12 rounded-2xl shadow-lg shadow-emerald-900/20">Konfirmasi Tugas</LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QUICK PREVIEW MODAL */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-4xl p-0 border-none shadow-2xl rounded-2xl overflow-hidden max-h-[90vh]">
          <div className="bg-gradient-to-r from-emerald-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center border border-white/20">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight">Preview Job Order</DialogTitle>
                  <DialogDescription className="text-emerald-100 text-xs font-bold uppercase tracking-widest mt-1">
                    {selectedJob?.tracking_code}
                  </DialogDescription>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {selectedJob && (
              <div className="space-y-6">
                {/* Job Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-black text-slate-500 uppercase mb-3">Informasi Order</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tracking Code:</span>
                        <span className="font-bold text-emerald-700">{selectedJob.tracking_code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Quotation:</span>
                        <span className="font-bold text-slate-700">{selectedJob.quotation?.quotation_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Customer:</span>
                        <span className="font-bold text-slate-700">{selectedJob.quotation?.profile?.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Perusahaan:</span>
                        <span className="font-bold text-slate-700">{selectedJob.quotation?.profile?.company_name || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status:</span>
                        <Badge className={cn("text-[9px] font-black", getStatusInfo(selectedJob.status).color)}>
                          {getStatusInfo(selectedJob.status).label.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Workflow Status */}
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                    <h4 className="text-xs font-black text-emerald-600 uppercase mb-3">Workflow Progress</h4>
                    <div className="space-y-2">
                      <WorkflowTimeline
                        status={selectedJob.status}
                        analysisStartedAt={selectedJob.analysis_started_at}
                        analysisDoneAt={selectedJob.analysis_done_at}
                        reportingDoneAt={selectedJob.reporting_done_at}
                      />
                    </div>
                  </div>
                </div>

                {/* Field Officer */}
                {selectedJob.sampling_assignment && (
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                    <h4 className="text-xs font-black text-blue-600 uppercase mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" /> Petugas Lapangan
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black">
                        {selectedJob.sampling_assignment.field_officer?.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{selectedJob.sampling_assignment.field_officer?.full_name}</p>
                        {selectedJob.sampling_assignment.travel_order && (
                          <p className="text-xs text-slate-500">Travel Order: {selectedJob.sampling_assignment.travel_order.document_number}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Analyst */}
                {selectedJob.lab_analysis && (
                  <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200">
                    <h4 className="text-xs font-black text-purple-600 uppercase mb-3 flex items-center gap-2">
                      <FlaskConical className="h-4 w-4" /> Analis Laboratorium
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-black">
                        {selectedJob.lab_analysis.analyst?.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{selectedJob.lab_analysis.analyst?.full_name}</p>
                        <p className="text-xs text-slate-500">Mulai: {selectedJob.analysis_started_at ? new Date(selectedJob.analysis_started_at).toLocaleDateString('id-ID') : '-'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-black text-slate-600 uppercase mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Timeline
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Created:</span>
                      <span className="font-semibold">{selectedJob.created_at ? new Date(selectedJob.created_at).toLocaleString('id-ID') : '-'}</span>
                    </div>
                    {selectedJob.analysis_started_at && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Analysis Started:</span>
                        <span className="font-semibold">{new Date(selectedJob.analysis_started_at).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    {selectedJob.analysis_done_at && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Analysis Done:</span>
                        <span className="font-semibold">{new Date(selectedJob.analysis_done_at).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t bg-slate-50">
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)} className="flex-1 font-black text-[10px] uppercase h-12 rounded-2xl">
              Tutup
            </Button>
            {selectedJob && (
              <Link href={`/operator/quotations/${selectedJob.quotation_id}`} className="flex-1">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-black text-[10px] uppercase h-12 rounded-2xl shadow-lg shadow-emerald-900/20">
                  <Eye className="h-4 w-4 mr-2" />
                  Lihat Quotation
                </Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LoadingOverlay isOpen={submitting} title="Memproses Data..." description="Mohon tunggu sebentar, penugasan sedang dibuat" />
    </div>
  );
}
