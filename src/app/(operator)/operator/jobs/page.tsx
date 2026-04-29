// ============================================================================
// PREMIUM WORKFLOW PROGRESS - v3.3 (Visual Timeline Restored)
// Engineered for maximum operational efficiency and high-end visual pulse effects.
// ============================================================================

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList, Clock, CheckCircle2, Beaker, ArrowRight, Search, Filter,
  RefreshCw, FlaskConical, FileText, MapPin, Calendar, User, AlertCircle,
  ChevronRight, Truck, TestTube, Briefcase, Printer, Eye, Plus, ArrowUpRight,
  Database, LayoutDashboard, X, Lock, Check, ClipboardCheck, Activity,
  MoreHorizontal, UserPlus, Maximize2, Layers
} from 'lucide-react';
import type { LucideIcon } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChemicalLoader, LoadingOverlay, LoadingButton } from "@/components/ui";
// TODO: Remove supabase client import - replaced with polling for real-time updates
// import { createClient } from '@/lib/supabase/client';
import { getJobOrders, getJobStats, getFieldOfficers, getCustomers } from "@/lib/actions/jobs";
import { getFieldAssistants } from "@/lib/actions/field-assistant";
import { createSamplingAssignment } from "@/lib/actions/sampling";
import { createTravelOrder } from "@/lib/actions/travel-order";
import { toast } from "sonner";
import { OPERATOR_LOADING_COPY, PROCESSING_TEXT } from "@/lib/constants/loading";
import { OPERATOR_EMPTY_TEXT, OPERATOR_TOAST_TEXT } from "@/lib/constants/operator-copy";
import { ADMIN_STATUS_LABELS, ADMIN_WORKFLOW_LABELS } from "@/lib/constants/workflow-copy";
import { cn } from "@/lib/utils";
import { getDisplayJobNotes } from "@/lib/job-notes";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PremiumCard } from "@/components/layout/PremiumPageWrapper";

type JobStatus = "scheduled" | "sampling" | "analysis_ready" | "analysis" | "reporting" | "completed";

type StatusConfig = {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: LucideIcon;
  progress: number;
};

type JobStats = {
  total: number;
  scheduled: number;
  sampling: number;
  analysisReady: number;
  analysisDone: number;
  analysis: number;
  reporting: number;
  completed: number;
};

type FieldOfficer = {
  id: string;
  full_name: string | null;
};

type FieldAssistant = {
  id: string;
  full_name: string | null;
};

type JobItem = {
  id: string;
  tracking_code: string;
  status: string;
  created_at: string;
  notes?: string | null;
  quotation_id?: string;
  quotation?: {
    total_amount?: number | null;
    profile?: {
      id?: string | null;
      full_name?: string | null;
      company_name?: string | null;
      address?: string | null;
    } | null;
  } | null;
  sampling_assignment?: {
    status?: string | null;
    field_officer?: {
      id?: string | null;
      full_name?: string | null;
    } | null;
    travel_order?: {
      id: string;
    } | null;
  } | null;
};

type AssignmentFormData = {
  job_order_id: string;
  field_officer_id: string;
  assistant_ids: string[];
  scheduled_date: string;
  scheduled_time: string;
  location: string;
  notes: string;
};

type StatusColor = "emerald" | "blue" | "amber" | "purple" | "indigo";

const statusConfig: Record<JobStatus, StatusConfig> = {
  scheduled: { label: ADMIN_STATUS_LABELS.scheduled, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: Clock, progress: 20 },
  sampling: { label: ADMIN_STATUS_LABELS.sampling, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: Truck, progress: 40 },
  analysis_ready: { label: ADMIN_STATUS_LABELS.analysis_ready, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: ClipboardCheck, progress: 55 },
  analysis: { label: ADMIN_STATUS_LABELS.analysis, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', icon: Beaker, progress: 70 },
  reporting: { label: ADMIN_STATUS_LABELS.reporting, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: FileText, progress: 85 },
  completed: { label: ADMIN_STATUS_LABELS.completed, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle2, progress: 100 }
};

const statusOptions = [
  { value: "all", label: "Semua", color: "bg-slate-900 text-white", icon: LayoutDashboard },
  { value: "scheduled", label: ADMIN_STATUS_LABELS.scheduled, color: "bg-blue-50 text-blue-700 border-blue-100", icon: Clock },
  { value: "sampling", label: ADMIN_STATUS_LABELS.sampling, color: "bg-amber-50 text-amber-700 border-amber-100", icon: MapPin },
  { value: "analysis_ready", label: ADMIN_STATUS_LABELS.analysis_ready, color: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: ClipboardCheck },
  { value: "analysis", label: ADMIN_STATUS_LABELS.analysis, color: "bg-indigo-50 text-indigo-700 border-indigo-100", icon: FlaskConical },
  { value: "reporting", label: ADMIN_STATUS_LABELS.reporting, color: "bg-purple-50 text-purple-700 border-purple-100", icon: FileText },
  { value: "completed", label: ADMIN_STATUS_LABELS.completed, color: "bg-emerald-600 text-white border-emerald-600", icon: CheckCircle2 },
];

const createInitialFilters = () => ({ dateFrom: "", dateTo: "", fieldOfficerId: "", customerId: "" });

function resolveStatusConfig(status?: string | null): StatusConfig {
  if (status && status in statusConfig) {
    return statusConfig[status as JobStatus];
  }
  return statusConfig.scheduled;
}

// COMPONENT: Professional Workflow Stepper
function ProfessionalStepper({ status }: { status: string }) {
  const stages = [
    { id: 'scheduled', label: ADMIN_WORKFLOW_LABELS.scheduled, icon: FileText },
    { id: 'sampling', label: ADMIN_WORKFLOW_LABELS.sampling, icon: MapPin },
    { id: 'analysis', label: ADMIN_WORKFLOW_LABELS.analysis, icon: FlaskConical },
    { id: 'reporting', label: ADMIN_WORKFLOW_LABELS.reporting, icon: FileText },
    { id: 'completed', label: ADMIN_WORKFLOW_LABELS.completed, icon: CheckCircle2 },
  ];

  const currentIdx = stages.findIndex(s => s.id === status);
  const effectiveIdx = status === 'analysis_ready' ? 1 : status === 'analysis_done' ? 3 : currentIdx;

  return (
    <div className="flex items-center gap-1 group/stepper">
      {stages.map((stage, i) => {
        const currentPos = effectiveIdx;
        const stageStatus =
          i === 0 ? (currentPos >= 0 ? 'complete' : 'pending') :
          i === 1 ? (currentPos >= 1 ? (currentPos === 1 ? 'active' : 'complete') : 'pending') :
          i === 2 ? (currentPos >= 2 ? (currentPos >= 2 && currentPos <= 4 ? (currentPos === 3 ? 'active' : 'complete') : 'complete') : 'pending') :
          i === 3 ? (currentPos >= 5 ? (currentPos === 5 ? 'active' : 'complete') : 'pending') :
          i === 4 ? (currentPos === 6 ? 'active' : 'pending') :
          'pending';
        return (
          <React.Fragment key={stage.id}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "relative h-9 w-9 rounded-2xl flex items-center justify-center transition-all duration-500 border-2",
                    stageStatus === 'complete' ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" :
                    stageStatus === 'active' ? "bg-white border-emerald-500 text-emerald-600 animate-pulse shadow-md" :
                    "bg-slate-50 border-slate-100 text-slate-300 group-hover/stepper:border-slate-200"
                  )}>
                    <stage.icon className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 text-white border-none rounded-xl py-2 px-3">
                  <p className="text-[10px] font-black uppercase tracking-widest">{stage.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {i < stages.length - 1 && (
              <div className={cn(
                "h-[3px] w-4 rounded-full transition-all duration-1000",
                stageStatus === 'complete' ? "bg-emerald-500" : "bg-slate-100"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function OperatorJobProgressPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [stats, setStats] = useState<JobStats>({
    total: 0,
    scheduled: 0,
    sampling: 0,
    analysisReady: 0,
    analysisDone: 0,
    analysis: 0,
    reporting: 0,
    completed: 0,
  });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [draftFilters, setDraftFilters] = useState({ fieldOfficerId: "", customerId: "", dateFrom: "", dateTo: "" });
  const [appliedFilters, setAppliedFilters] = useState({ fieldOfficerId: "", customerId: "", dateFrom: "", dateTo: "" });
  const [fieldOfficers, setFieldOfficers] = useState<FieldOfficer[]>([]);
  const [assistants, setAssistants] = useState<FieldAssistant[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [companyName, setCompanyName] = useState("Perusahaan");
  const [submitting, setSubmitting] = useState(false);
  const [assignFormData, setAssignFormData] = useState<AssignmentFormData>({
    job_order_id: "", field_officer_id: "", assistant_ids: [],
    scheduled_date: "", scheduled_time: "08:00", location: "", notes: ""
  });

  // TODO: Supabase client removed - using polling instead of real-time subscriptions

  const loadData = useCallback(async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    else setLoading(true);
    try {
      const [jobsData, statsData, officers, assistantList, customerList] = await Promise.all([
        getJobOrders(1, 50), getJobStats(), getFieldOfficers(), getFieldAssistants(), getCustomers()
      ]);
      setJobs(jobsData.items || []);
      setStats(statsData);
      setFieldOfficers(officers);
      setAssistants(assistantList?.items || []);
      setCustomers(customerList || []);
      if (showRefreshToast) toast.success("Data Operasional Diperbarui");
    } catch {
      toast.error(OPERATOR_TOAST_TEXT.syncFailed);
    }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    loadData();
    // Replaced supabase real-time subscription with polling every 60 seconds
    const interval = setInterval(() => loadData(), 60000);
    return () => { clearInterval(interval); };
  }, [loadData]);

  useEffect(() => {
    async function fetchCompanyProfile() {
      try {
        const response = await fetch("/api/company-profile");
        const data = await response.json();
        setCompanyName(data?.company_name?.trim() || "Perusahaan");
      } catch {
        setCompanyName("Perusahaan");
      }
    }

    fetchCompanyProfile();
  }, []);

  const filteredJobs = useMemo(() => {
    const keyword = search.toLowerCase();
    return jobs.filter((job) => {
      const matchesSearch =
        search === "" ||
        job.tracking_code.toLowerCase().includes(keyword) ||
        job.quotation?.profile?.full_name?.toLowerCase().includes(keyword) ||
        job.quotation?.profile?.company_name?.toLowerCase().includes(keyword);
      const matchesStatus = filterStatus === "all" || job.status === filterStatus;
      const matchesCustomer =
        !appliedFilters.customerId ||
        job.quotation?.profile?.id === appliedFilters.customerId;
      const matchesOfficer =
        !appliedFilters.fieldOfficerId ||
        job.sampling_assignment?.field_officer?.id === appliedFilters.fieldOfficerId;
      const jobDate = job.created_at ? new Date(job.created_at).toISOString().slice(0, 10) : "";
      const matchesDateFrom = !appliedFilters.dateFrom || jobDate >= appliedFilters.dateFrom;
      const matchesDateTo = !appliedFilters.dateTo || jobDate <= appliedFilters.dateTo;

      return matchesSearch && matchesStatus && matchesCustomer && matchesOfficer && matchesDateFrom && matchesDateTo;
    });
  }, [jobs, search, filterStatus, appliedFilters]);

  const openAssignDialog = (job: JobItem) => {
    setSelectedJob(job);
    setAssignFormData({
      job_order_id: job.id, field_officer_id: "", assistant_ids: [],
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: "08:00", location: job.quotation?.profile?.address || "", notes: ""
    });
    setIsAssignDialogOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (!assignFormData.field_officer_id || !assignFormData.scheduled_date) { toast.error("Data tidak lengkap"); return; }
    setSubmitting(true);
    try {
      const res = await createSamplingAssignment({ ...assignFormData, scheduled_date: `${assignFormData.scheduled_date}T${assignFormData.scheduled_time}:00` });
      if (res.error) throw new Error(res.error);
      const trackingCode = selectedJob?.tracking_code || "Order";
      await createTravelOrder({ assignment_id: res.assignment.id, departure_date: `${assignFormData.scheduled_date}T${assignFormData.scheduled_time}:00`, return_date: `${assignFormData.scheduled_date}T17:00:00`, destination: assignFormData.location, purpose: `Sampling untuk ${trackingCode}` });
      toast.success("Penugasan Berhasil!"); setIsAssignDialogOpen(false); loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Gagal";
      toast.error(message);
    }
    finally { setSubmitting(false); }
  };

  const handleFilterStatusChange = (value: string) => {
    setFilterStatus(value);
  };

  const handleStatFilterClick = (status: string) => {
    setFilterStatus((prev) => (prev === status ? "all" : status));
  };

  if (loading) return <ChemicalLoader fullScreen />;

  return (
    <div className="p-4 md:p-8 bg-slate-50/20 min-h-screen space-y-8 pb-24 md:pb-12 font-[family-name:var(--font-geist-sans)] max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">
            <Activity className="h-4 w-4" /> Pemantauan Real-time
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Operasional Pekerjaan</h1>
          <p className="text-slate-400 text-sm font-medium">
            Pengelolaan alur kerja operasional laboratorium WahfaLab untuk tim operator.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end mr-4 hidden sm:flex">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sinkronisasi Database</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Update sistem aktif
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => loadData(true)}
            className="h-14 px-8 rounded-2xl bg-white border-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-all font-black uppercase text-[10px] tracking-widest shadow-sm"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2 text-emerald-600", refreshing && "animate-spin")} />
            Segarkan Sistem
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <PremiumStatCard title="Total" value={stats.total || 0} subValue="Order" icon={Briefcase} color="emerald" active={filterStatus === "all"} onClick={() => handleStatFilterClick("all")} />
        <PremiumStatCard title="Menunggu Penugasan" value={stats.scheduled || 0} subValue="Order Baru" icon={Clock} color="blue" active={filterStatus === "scheduled"} onClick={() => handleStatFilterClick("scheduled")} />
        <PremiumStatCard title="Sampling" value={stats.sampling || 0} subValue="Lapangan" icon={Truck} color="amber" active={filterStatus === "sampling"} onClick={() => handleStatFilterClick("sampling")} />
        <PremiumStatCard title="Analisis" value={stats.analysis || 0} subValue="Lab" icon={TestTube} color="purple" active={filterStatus === "analysis"} onClick={() => handleStatFilterClick("analysis")} />
        <PremiumStatCard title={ADMIN_STATUS_LABELS.reporting} value={stats.reporting || 0} subValue="Report" icon={FileText} color="indigo" active={filterStatus === "reporting"} onClick={() => handleStatFilterClick("reporting")} />
        <PremiumStatCard title="Selesai" value={stats.completed || 0} subValue="Done" icon={CheckCircle2} color="emerald" active={filterStatus === "completed"} onClick={() => handleStatFilterClick("completed")} />
      </div>

      <PremiumCard className="border-none shadow-[0_30px_80px_-24px_rgba(15,23,42,0.16)] rounded-[2.75rem] overflow-hidden bg-white/95 backdrop-blur">
        <CardContent className="p-0">
          <div className="p-8 border-b bg-white flex flex-col xl:flex-row gap-6 items-center">
            <div className="relative flex-1 w-full group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <Input
                placeholder="Cari berdasarkan tracking code, klien, atau perusahaan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-14 h-16 bg-slate-50 border-none rounded-2xl font-bold text-sm focus-visible:ring-2 focus-visible:ring-emerald-500/20 placeholder:text-slate-300 placeholder:font-medium transition-all"
              />
            </div>

            <div className="flex items-center gap-3 w-full xl:w-auto">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
                {statusOptions.slice(0, 4).map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <Button
                      key={opt.value}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFilterStatusChange(opt.value)}
                      className={cn(
                        "h-10 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all",
                        filterStatus === opt.value ? "bg-white text-emerald-700 shadow-sm" : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 mr-1.5" />
                      {opt.label}
                    </Button>
                  );
                })}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl text-slate-400">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-slate-50">
                    {statusOptions.slice(4).map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => handleFilterStatusChange(opt.value)}
                        className={cn(
                          "rounded-xl p-3 text-[10px] font-black uppercase tracking-widest",
                          filterStatus === opt.value ? "bg-emerald-50 text-emerald-700" : "text-slate-600"
                        )}
                      >
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "h-14 px-8 rounded-2xl border-none font-black uppercase text-[10px] tracking-widest transition-all shadow-sm",
                  showFilters ? "bg-emerald-950 text-white hover:bg-slate-900" : "bg-slate-50 hover:bg-slate-100 text-slate-600"
                )}
              >
                <Filter className="h-4 w-4 mr-3" /> Filter
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="p-8 bg-slate-50/50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 animate-in slide-in-from-top-6 duration-500">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <User className="h-3 w-3" /> Database Klien
                </label>
                <Select value={draftFilters.customerId} onValueChange={(v) => setDraftFilters({ ...draftFilters, customerId: v })}>
                  <SelectTrigger className="bg-white border-none rounded-2xl h-14 text-xs font-black uppercase tracking-tight shadow-sm px-5">
                    <SelectValue placeholder="Semua Klien" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl max-h-80">
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-[10px] font-black uppercase py-3">
                        {c.full_name || c.company_name || "Klien"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Briefcase className="h-3 w-3" /> Personel Lapangan
                </label>
                <Select value={draftFilters.fieldOfficerId} onValueChange={(v) => setDraftFilters({ ...draftFilters, fieldOfficerId: v })}>
                  <SelectTrigger className="bg-white border-none rounded-2xl h-14 text-xs font-black uppercase tracking-tight shadow-sm px-5">
                    <SelectValue placeholder="Semua Petugas" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl max-h-80">
                    {fieldOfficers.map((o) => (
                      <SelectItem key={o.id} value={o.id} className="text-[10px] font-black uppercase py-4">
                        {o.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Tanggal Awal
                </label>
                <Input
                  type="date"
                  value={draftFilters.dateFrom}
                  onChange={(e) => setDraftFilters({ ...draftFilters, dateFrom: e.target.value })}
                  className="bg-white border-none rounded-2xl h-14 text-xs font-black uppercase shadow-sm px-5"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Tanggal Akhir
                </label>
                <Input
                  type="date"
                  value={draftFilters.dateTo}
                  onChange={(e) => setDraftFilters({ ...draftFilters, dateTo: e.target.value })}
                  className="bg-white border-none rounded-2xl h-14 text-xs font-black uppercase shadow-sm px-5"
                />
              </div>

              <div className="flex items-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    const resetFilters = createInitialFilters();
                    setDraftFilters(resetFilters);
                    setAppliedFilters(resetFilters);
                  }}
                  className="text-rose-600 font-black text-[10px] uppercase tracking-widest h-14 hover:bg-rose-50 rounded-2xl flex-1 transition-all"
                >
                  Reset
                </Button>
                <Button
                  onClick={() => {
                    setAppliedFilters(draftFilters);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest h-14 rounded-2xl flex-1 shadow-lg shadow-emerald-900/10 transition-all"
                >
                  Terapkan
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow className="border-b border-slate-50">
                  <TableHead className="px-10 py-8 font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 w-[220px]">ID Infrastruktur</TableHead>
                  <TableHead className="px-6 py-8 font-black uppercase tracking-[0.2em] text-[10px] text-slate-400">Progres Alur Kerja</TableHead>
                  <TableHead className="px-6 py-8 font-black uppercase tracking-[0.2em] text-[10px] text-slate-400">Profil Klien</TableHead>
                  <TableHead className="px-6 py-8 font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 text-center">Status</TableHead>
                  <TableHead className="px-10 py-8 font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 text-right">Kontrol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-40 bg-white">
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-emerald-100 rounded-full blur-3xl opacity-20 animate-pulse" />
                        <Briefcase className="h-20 w-20 text-slate-100 relative z-10 mx-auto mb-6" />
                      </div>
                      <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[11px]">{OPERATOR_EMPTY_TEXT.dataNotFoundCaps}</p>
                      <Button variant="link" className="mt-4 text-emerald-600 font-black uppercase text-[10px]" onClick={() => loadData(true)}>Muat Ulang Data</Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job: any) => {
                    const cfg = resolveStatusConfig(job.status);
                    const isActuallyPending = job.status === 'sampling' && job.sampling_assignment?.status === 'pending';
                    const effectiveCfg = isActuallyPending
                      ? {
                          ...cfg,
                          label: 'Sedang di Pending',
                          color: 'text-rose-600',
                          bg: 'bg-rose-50',
                          icon: Clock,
                        }
                      : job.status === 'scheduled' && !job.sampling_assignment
                        ? {
                            ...cfg,
                            label: 'Menunggu Penugasan',
                            color: 'text-slate-600',
                            bg: 'bg-slate-100',
                            icon: Clock,
                            progress: 10,
                          }
                        : cfg;

                    return (
                      <TableRow key={job.id} className="border-b border-slate-50 hover:bg-emerald-50/10 transition-all duration-300 group">
                        <TableCell className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50 group-hover:scale-110 transition-transform duration-500">
                              <Layers className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="space-y-1">
                              <span className="font-black text-slate-900 uppercase tracking-tighter text-base block group-hover:text-emerald-700 transition-colors">
                                {job.tracking_code}
                              </span>
                              <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                <FileText className="h-3 w-3" /> {job.quotation?.quotation_number || "-"}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-6 py-8">
                          <ProfessionalStepper status={job.status} />
                        </TableCell>

                        <TableCell className="px-6 py-8">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm ring-1 ring-slate-100">
                              <span className="text-xs font-black text-slate-500">{(job.quotation?.profile?.full_name || 'U').charAt(0)}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-slate-800 uppercase tracking-tight text-[11px] leading-tight mb-0.5">
                                {job.quotation?.profile?.full_name || "-"}
                              </span>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] flex items-center gap-1.5">
                                <Briefcase className="h-2.5 w-2.5" /> {job.quotation?.profile?.company_name || "Klien Personal"}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-6 py-8 text-center">
                          <div className="scale-90 transform origin-center">
                            <Badge className={cn(
                              "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black text-[9px] uppercase tracking-widest transition-all",
                              effectiveCfg.bg,
                              effectiveCfg.color
                            )}>
                              <effectiveCfg.icon className="h-3 w-3" />
                              {effectiveCfg.label}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell className="px-10 py-8 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setSelectedJob(job); setIsDetailOpen(true); }}
                              className="h-9 w-9 rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-sm border border-slate-100/50"
                            >
                              <Maximize2 className="h-4 w-4" />
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-white text-slate-400 hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-sm border border-slate-100">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border border-slate-100 shadow-xl bg-white/95 backdrop-blur-xl">
                                <DropdownMenuLabel className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Kontrol Operator</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-50" />
                                {!job.sampling_assignment && (
                                  <DropdownMenuItem
                                    onClick={() => openAssignDialog(job)}
                                    disabled={job.status !== 'scheduled'}
                                    className="rounded-lg p-2.5 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:bg-emerald-50 focus:bg-emerald-50 focus:text-emerald-700 transition-colors"
                                  >
                                    <div className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center mr-2.5">
                                      <UserPlus className="h-3.5 w-3.5" />
                                    </div>
                                    Tugaskan Personel
                                  </DropdownMenuItem>
                                )}
                                {job.sampling_assignment?.travel_order && (
                                  <DropdownMenuItem
                                    onClick={() => window.open(`/operator/travel-orders/${job.sampling_assignment?.travel_order?.id}/preview`, '_blank')}
                                    className="rounded-lg p-2.5 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700 transition-colors"
                                  >
                                    <div className="h-6 w-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center mr-2.5">
                                      <Printer className="h-3.5 w-3.5" />
                                    </div>
                                    Cetak Surat Tugas
                                  </DropdownMenuItem>
                                )}
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
        </CardContent>
      </PremiumCard>

      {/* COMPACT ASSIGNMENT MODAL (PREMIUM) */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent showCloseButton={false} className="max-w-[95vw] sm:max-w-3xl rounded-xl border border-slate-200 p-0 overflow-hidden shadow-2xl bg-white">
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-5 md:p-6 text-white relative overflow-hidden border-b border-emerald-700/70">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500 rounded-full blur-[80px] opacity-20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500 rounded-full blur-[60px] opacity-20" />

            <div className="relative z-10 flex items-center gap-3">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-lg">
                <UserPlus className="h-6 w-6 md:h-7 md:w-7 text-emerald-300" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tight text-white leading-none truncate">
                  Penugasan Personel
                </DialogTitle>
                <DialogDescription className="text-emerald-100 font-bold uppercase text-[9px] md:text-[10px] tracking-[0.18em] mt-1.5 opacity-90 truncate">
                  {selectedJob?.tracking_code} | {selectedJob?.quotation?.profile?.company_name || '-'}
                </DialogDescription>
              </div>
            </div>
          </div>
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
            <div className="p-6 md:p-8 space-y-8 bg-gradient-to-b from-white via-slate-50/50 to-white">
              <section className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] ml-1">Petugas Utama</Label><Select value={assignFormData.field_officer_id} onValueChange={(val) => setAssignFormData({ ...assignFormData, field_officer_id: val })}><SelectTrigger className="h-14 rounded-2xl bg-white border-2 border-slate-100 focus:border-emerald-500 font-bold text-sm shadow-sm transition-all"><SelectValue placeholder="Pilih..." /></SelectTrigger><SelectContent className="rounded-2xl border-2 border-slate-100 shadow-2xl">{fieldOfficers.map((o) => <SelectItem key={o.id} value={o.id} className="font-bold text-xs uppercase cursor-pointer">{o.full_name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] ml-1">Jadwal Lapangan</Label><div className="flex gap-2"><Input type="date" value={assignFormData.scheduled_date} onChange={(e) => setAssignFormData({ ...assignFormData, scheduled_date: e.target.value })} className="h-14 rounded-2xl bg-white border-2 border-slate-100 font-bold text-sm" /><Input type="time" value={assignFormData.scheduled_time} onChange={(e) => setAssignFormData({ ...assignFormData, scheduled_time: e.target.value })} className="h-14 rounded-2xl bg-white border-2 border-slate-100 font-bold text-sm w-28 shrink-0" /></div></div>
                </div>
                <div className="space-y-3"><Label className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] ml-1">Asisten (Multi-Select)</Label><div className="bg-slate-50 p-2 rounded-2xl border-2 border-slate-100 min-h-[64px] flex flex-wrap gap-2 items-center">{assignFormData.assistant_ids.length === 0 ? (<span className="text-xs text-slate-400 font-bold px-4">Pilih asisten...</span>) : (assignFormData.assistant_ids.map((aid: string) => { const assistant = assistants.find(a => a.id === aid); return (<Badge key={aid} className="bg-emerald-600 text-white font-black text-[9px] uppercase h-9 px-3 rounded-xl flex items-center gap-2 transition-all hover:bg-emerald-700 shadow-md">{assistant?.full_name}<button onClick={(e) => { e.preventDefault(); setAssignFormData({ ...assignFormData, assistant_ids: assignFormData.assistant_ids.filter((id: string) => id !== aid) }); }} className="hover:bg-black/20 rounded-full p-0.5"><X className="h-3 w-3" /></button></Badge>); }))}</div><Select onValueChange={(val) => { if (!assignFormData.assistant_ids.includes(val)) setAssignFormData({ ...assignFormData, assistant_ids: [...assignFormData.assistant_ids, val] }); }}><SelectTrigger className="h-10 border-2 border-slate-100 rounded-xl bg-white text-xs font-bold shadow-sm transition-all hover:border-emerald-200"><SelectValue placeholder="+ Tambah Asisten" /></SelectTrigger><SelectContent className="rounded-xl border-2 border-slate-100 shadow-2xl">{assistants.filter(a => !assignFormData.assistant_ids.includes(a.id)).map((o) => (<SelectItem key={o.id} value={o.id} className="font-bold text-[10px] uppercase cursor-pointer">{o.full_name}</SelectItem>))}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] ml-1">Lokasi Sampling</Label><Input value={assignFormData.location} onChange={(e) => setAssignFormData({ ...assignFormData, location: e.target.value })} placeholder="Alamat lengkap lokasi..." className="h-14 rounded-2xl bg-white border-2 border-slate-100 font-medium text-sm" /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] ml-1">Catatan Tambahan</Label><Textarea value={assignFormData.notes} onChange={(e) => setAssignFormData({ ...assignFormData, notes: e.target.value })} placeholder="Instruksi khusus..." className="rounded-2xl bg-white border-2 border-slate-100 min-h-[100px] resize-none text-sm" /></div>
              </section>
              <div className="p-5 bg-blue-50 rounded-3xl border-2 border-blue-100/50 flex items-center gap-4"><Printer className="h-6 w-6 text-blue-600 shrink-0" /><p className="text-[10px] text-blue-700 font-bold uppercase tracking-tight leading-relaxed">Sistem akan otomatis menerbitkan dokumen <span className="font-black underline">SPPD Digital</span> setelah dikonfirmasi.</p></div>
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex-col sm:flex-row gap-3 shrink-0">
            <Button variant="ghost" onClick={() => setIsAssignDialogOpen(false)} className="w-full sm:flex-1 font-black text-[10px] uppercase h-12 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50">
              Batal
            </Button>
            <LoadingButton onClick={handleAssignSubmit} loading={submitting} loadingText={PROCESSING_TEXT} className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase h-12 rounded-xl shadow-lg shadow-emerald-900/20 gap-2 tracking-[2px]">
              Konfirmasi Tugas
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent showCloseButton={false} className="max-w-[95vw] sm:max-w-3xl rounded-xl border border-slate-200 p-0 overflow-hidden shadow-2xl bg-white">
          <DialogHeader className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-5 md:p-6 text-white border-b border-emerald-700/70 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-lg">
                <Activity className="h-6 w-6 text-emerald-300" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tight leading-none truncate">Detail Order</DialogTitle>
                <DialogDescription className="text-emerald-100 font-bold uppercase text-[9px] md:text-[10px] tracking-[0.18em] mt-1.5 opacity-90 truncate">
                  Ringkasan progres operasional pekerjaan
                </DialogDescription>
              </div>
              <Badge className="bg-white/15 text-white border border-white/25 text-[10px] font-black uppercase px-3 py-2 rounded-xl">
                {selectedJob?.tracking_code || "-"}
              </Badge>
            </div>
          </DialogHeader>
          <div className="max-h-[68vh] overflow-y-auto bg-gradient-to-b from-white via-slate-50/50 to-white p-6 md:p-8 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Tanggal Masuk</p>
                <p className="text-sm font-black text-slate-800">{selectedJob?.created_at ? new Date(selectedJob.created_at).toLocaleDateString('id-ID') : '-'}</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Nominal</p>
                <p className="text-sm font-black text-emerald-700">Rp {Number(selectedJob?.quotation?.total_amount || 0).toLocaleString("id-ID")}</p>
              </div>
            </div>

            {getDisplayJobNotes(selectedJob?.notes) && (
              <div className="bg-rose-50 p-6 rounded-2xl border-2 border-rose-100/70">
                <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <AlertCircle className="h-3 w-3" /> Catatan Operasional / Penundaan
                </p>
                <p className="text-xs font-bold text-rose-800 leading-relaxed italic">
                  "{getDisplayJobNotes(selectedJob?.notes)}"
                </p>
              </div>
            )}

            <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 shadow-inner text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Operational Timeline</p>
              <div className="flex justify-center py-2"><ProfessionalStepper status={selectedJob?.status || ''} /></div>
              {(() => {
                const isActuallyPending = selectedJob?.status === 'sampling' && selectedJob?.sampling_assignment?.status === 'pending';
                if (isActuallyPending) {
                  return (
                    <div className="mt-8 flex flex-col items-center gap-2">
                      <p className="text-[10px] font-black text-rose-600 uppercase tracking-[3px] animate-pulse">SEDANG DI PENDING</p>
                      <Badge className="bg-rose-100 text-rose-600 border-none font-black text-[8px] uppercase px-3 py-1 rounded-full">Petugas Menangguhkan Tugas</Badge>
                    </div>
                  );
                }
                const isUnassignedScheduled = selectedJob?.status === 'scheduled' && !selectedJob?.sampling_assignment;
                return (
                  <p className={cn(
                    "mt-8 text-[10px] font-black uppercase tracking-[3px] animate-pulse",
                    isUnassignedScheduled ? "text-slate-600" : "text-emerald-600"
                  )}>
                    {isUnassignedScheduled ? "MENUNGGU PENUGASAN" : (resolveStatusConfig(selectedJob?.status).label || 'PROSES DATA')}
                  </p>
                );
              })()}
            </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex-col sm:flex-row gap-3 shrink-0">
            <Button variant="ghost" onClick={() => setIsDetailOpen(false)} className="w-full sm:flex-1 font-black text-[10px] uppercase h-12 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50">
              Tutup
            </Button>
            <Button onClick={() => { setIsDetailOpen(false); router.push(`/operator/quotations/${selectedJob?.quotation_id}`); }} className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase h-12 rounded-xl shadow-lg shadow-emerald-900/20 gap-2">
              Lihat Quotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LoadingOverlay isOpen={submitting} title={OPERATOR_LOADING_COPY.title} description={OPERATOR_LOADING_COPY.description} variant="transparent" />
    </div>
  );
}

type PremiumStatCardProps = {
  title: string;
  value: number;
  subValue: string;
  icon: LucideIcon;
  color: StatusColor;
  active: boolean;
  onClick: () => void;
};

function PremiumStatCard({ title, value, subValue, icon: Icon, color, active, onClick }: PremiumStatCardProps) {
  const colorVariants: Record<StatusColor, string> = {
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-600 border-emerald-500/20",
    blue: "from-blue-500/10 to-blue-500/5 text-blue-600 border-blue-500/20",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-600 border-amber-500/20",
    indigo: "from-indigo-500/10 to-indigo-500/5 text-indigo-600 border-indigo-500/20",
    purple: "from-purple-500/10 to-purple-500/5 text-purple-600 border-purple-500/20",
  };

  const iconColors: Record<StatusColor, string> = {
    emerald: "bg-emerald-500 text-white",
    blue: "bg-blue-500 text-white",
    amber: "bg-amber-500 text-white",
    indigo: "bg-indigo-500 text-white",
    purple: "bg-purple-500 text-white",
  };

  const style = colorVariants[color] || colorVariants.emerald;
  const iconStyle = iconColors[color] || iconColors.emerald;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-[1.5rem] border p-4 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
        active ? "border-emerald-500 bg-emerald-600 text-white shadow-[0_18px_50px_-18px_rgba(6,95,70,0.5)] scale-[1.02]" : "border-slate-200 bg-white shadow-sm hover:border-emerald-200 hover:shadow-md"
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100", style)} />
      <div className="relative z-10 flex h-full flex-col justify-between gap-3">
        <div className="flex items-start justify-between">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-110", active ? "bg-white text-emerald-700" : iconStyle)}>
            <Icon className="h-4 w-4" />
          </div>
          {active && <div className="h-2.5 w-2.5 rounded-full bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.85)]" />}
        </div>
        <div>
          <p className={cn("text-2xl font-black leading-none", active ? "text-white" : "text-slate-900")}>{value}</p>
          <p className={cn("mt-1 text-[9px] font-black uppercase tracking-[0.24em]", active ? "text-emerald-50/80" : "text-slate-400")}>{title}</p>
        </div>
        <div className={cn("flex items-center justify-between border-t pt-3", active ? "border-emerald-600/70" : "border-slate-100")}>
          <span className={cn("text-[8px] font-bold uppercase tracking-widest", active ? "text-emerald-50" : "text-emerald-600")}>
            Lihat Detail
          </span>
          <ArrowUpRight className={cn("h-3 w-3 transition-colors", active ? "text-emerald-50" : "text-slate-300 group-hover:text-emerald-500")} />
        </div>
      </div>
    </button>
  );
}
