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
  UserPlus,
  ArrowUpRight,
  LayoutDashboard,
  Activity,
  Layers,
  ArrowRightCircle,
  Maximize2,
  MoreHorizontal,
  Check,
  Send
} from "lucide-react";
import { LoadingOverlay, LoadingButton } from "@/components/ui";
import { TableSkeleton } from "@/components/ui/skeleton";
import { getJobOrders, getJobStats, getFieldOfficers, getCustomers, deleteJobOrderWithPhotos, sendTravelOrderToField } from "@/lib/actions/jobs";
import { getFieldAssistants } from "@/lib/actions/field-assistant";
import { createSamplingAssignment } from "@/lib/actions/sampling";
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
import { format } from "date-fns";
import { id } from "date-fns/locale";

// --- PREMIUM COMPONENTS ---

/**
 * Premium Stat Card with glassmorphism and animated indicators
 */
function PremiumStatCard({ title, value, subValue, icon: Icon, color, onClick, active }: any) {
  const colorVariants: any = {
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-600 border-emerald-500/20",
    blue: "from-blue-500/10 to-blue-500/5 text-blue-600 border-blue-500/20",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-600 border-amber-500/20",
    indigo: "from-indigo-500/10 to-indigo-500/5 text-indigo-600 border-indigo-500/20",
    rose: "from-rose-500/10 to-rose-500/5 text-rose-600 border-rose-500/20",
    slate: "from-slate-500/10 to-slate-500/5 text-slate-600 border-slate-500/20",
  };

  const iconColors: any = {
    emerald: "bg-emerald-500 text-white",
    blue: "bg-blue-500 text-white",
    amber: "bg-amber-500 text-white",
    indigo: "bg-indigo-500 text-white",
    rose: "bg-rose-500 text-white",
    slate: "bg-slate-500 text-white",
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative group cursor-pointer transition-all duration-300 p-[1px] rounded-[1.5rem] overflow-hidden",
        active ? "bg-emerald-700 shadow-lg shadow-emerald-900/20 scale-[1.01]" : "hover:scale-[1.01] bg-slate-100"
      )}
    >
      <div className={cn(
        "h-full w-full rounded-[1.45rem] p-4 flex flex-col justify-between transition-all duration-300 min-h-[132px]",
        active ? "bg-emerald-700" : "bg-white hover:bg-slate-50"
      )}>
        <div className="flex justify-between items-start mb-2">
          <div className={cn(
            "h-9 w-9 rounded-xl flex items-center justify-center shadow-sm transition-all duration-300",
            active ? "bg-white text-emerald-700" : iconColors[color] || "bg-slate-100 text-slate-500"
          )}>
            <Icon className="h-4 w-4" />
          </div>
          {active && <div className="h-2 w-2 rounded-full bg-emerald-200 animate-pulse" />}
        </div>
        
        <div>
          <h3 className={cn(
            "text-[9px] font-black uppercase tracking-[0.16em] mb-1.5",
            active ? "text-emerald-100" : "text-slate-400"
          )}>{title}</h3>
          <div className="flex items-baseline gap-1.5">
            <span className={cn(
              "text-2xl font-black tracking-tight leading-none",
              active ? "text-white" : "text-slate-900"
            )}>{value}</span>
            <span className={cn(
              "text-[9px] font-bold uppercase tracking-wider",
              active ? "text-emerald-100" : "text-slate-400"
            )}>{subValue}</span>
          </div>
        </div>
        
        <div className={cn(
          "mt-3 pt-3 border-t flex items-center justify-between",
          active ? "border-emerald-600/70" : "border-slate-100"
        )}>
          <span className={cn(
            "text-[8px] font-bold uppercase tracking-widest",
            active ? "text-emerald-100" : "text-emerald-600"
          )}>Lihat Detail</span>
          <ArrowUpRight className={cn(
            "h-3 w-3 transition-colors",
            active ? "text-emerald-100" : "text-slate-300 group-hover:text-emerald-500"
          )} />
        </div>
      </div>
    </div>
  );
}

/**
 * Professional Workflow Stepper
 */
function ProfessionalStepper({ status }: any) {
  const stages = [
    { id: 'scheduled', label: "Penjadwalan", icon: FileText },
    { id: 'sampling', label: "Sampling", icon: MapPin },
    { id: 'analysis', label: "Analisis", icon: FlaskConical },
    { id: 'reporting', label: "Pelaporan", icon: FileText },
    { id: 'completed', label: "Selesai", icon: CheckCircle },
  ];

  const currentIdx = stages.findIndex(s => s.id === status);
  const effectiveIdx = status === 'analysis_ready' ? 1 : status === 'analysis_done' ? 3 : currentIdx;
  
  // Custom logic for intermediate states
  const getStageStatus = (idx: number) => {
    if (status === 'completed') return 'complete';
    
    const stageOrder = ['scheduled', 'sampling', 'analysis_ready', 'analysis', 'analysis_done', 'reporting', 'completed'];
    const currentPos = stageOrder.indexOf(status);
    
    // Mapping stage indices to status ranges
    if (idx === 0) return currentPos >= 0 ? 'complete' : 'pending';
    if (idx === 1) return currentPos >= 1 ? (currentPos === 1 ? 'active' : 'complete') : 'pending';
    if (idx === 2) return currentPos >= 2 ? (currentPos >= 2 && currentPos <= 4 ? (currentPos === 3 ? 'active' : 'complete') : 'complete') : 'pending';
    if (idx === 3) return currentPos >= 5 ? (currentPos === 5 ? 'active' : 'complete') : 'pending';
    if (idx === 4) return currentPos === 6 ? 'active' : 'pending';
    
    return 'pending';
  };

  return (
    <div className="flex items-center gap-1 group/stepper">
      {stages.map((stage, i) => {
        const stageStatus = getStageStatus(i);
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
                    {stageStatus === 'complete' && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <CheckCircle className="h-3 w-3 text-emerald-500" />
                      </div>
                    )}
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

const statusOptions = [
  { value: "all", label: "Semua", color: "bg-slate-900 text-white", icon: Layers },
  { value: "scheduled", label: "Penjadwalan", color: "bg-blue-50 text-blue-700 border-blue-100", icon: Clock },
  { value: "sampling", label: "Sampling", color: "bg-amber-50 text-amber-700 border-amber-100", icon: MapPin },
  { value: "analysis_ready", label: "Siap Analisis", color: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: ClipboardCheck },
  { value: "analysis", label: "Analisis Lab", color: "bg-indigo-50 text-indigo-700 border-indigo-100", icon: FlaskConical },
  { value: "analysis_done", label: "Selesai Analisis", color: "bg-violet-50 text-violet-700 border-violet-100", icon: TestTube },
  { value: "reporting", label: "Pelaporan", color: "bg-purple-50 text-purple-700 border-purple-100", icon: FileText },
  { value: "completed", label: "Selesai", color: "bg-emerald-600 text-white border-emerald-600", icon: CheckCircle },
];

const createInitialFilters = () => ({ dateFrom: "", dateTo: "", fieldOfficerId: "", customerId: "" });

export default function AdminJobProgressPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [stats, setStats] = useState<any>({ total: 0 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [draftFilters, setDraftFilters] = useState<any>(createInitialFilters());
  const [appliedFilters, setAppliedFilters] = useState<any>(createInitialFilters());
  const [fieldOfficers, setFieldOfficers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignDialogLoading, setAssignDialogLoading] = useState(false);
  const [sendingTravelOrderJobId, setSendingTravelOrderJobId] = useState<string | null>(null);
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
        ...appliedFilters
      });
      setData(result);
    } catch (error: any) {
      toast.error("Gagal memuat data progress pekerjaan");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, filterStatus, appliedFilters]);

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

    // Open dialog immediately
    setIsAssignDialogOpen(true);
    setAssistants([]);

    // Load dialog options in background without affecting main table loading
    setAssignDialogLoading(true);
    try {
      const [officers, assistantList] = await Promise.all([
        getFieldOfficers(),
        getFieldAssistants()
      ]);
      setFieldOfficers(officers || []);
      setAssistants(assistantList?.items || []);
    } catch (error) { 
      toast.error("Gagal memuat data petugas"); 
    }
    finally { 
      setAssignDialogLoading(false); 
    }
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

  const handlePrintInvoice = async (job: any) => {
    try {
      // Open invoice page in new tab
      const invoiceUrl = `/quotations/${job.quotation_id}?print=true`;
      window.open(invoiceUrl, '_blank');
      toast.success("Membuka invoice untuk dicetak");
    } catch (error: any) {
      toast.error("Gagal membuka invoice");
    }
  };

  const handlePrintManifest = async (job: any) => {
    try {
      // Check if job has sampling assignment
      if (!job.sampling_assignment) {
        toast.error("Belum ada penugasan untuk job ini", {
          description: "Silakan tugaskan personel terlebih dahulu"
        });
        return;
      }

      // Open travel order preview in new tab
      const manifestUrl = `/admin/travel-orders/${job.id}/preview`;
      const newWindow = window.open(manifestUrl, '_blank');
      
      // If window.open fails or takes too long, show alternative
      setTimeout(() => {
        if (!newWindow || newWindow.closed) {
          toast.info("Membuka manifes...", {
            description: "Pastikan popup tidak diblokir"
          });
        }
      }, 2000);
      
      toast.success("Membuka manifes untuk dicetak");
    } catch (error: any) {
      toast.error("Gagal membuka manifes", {
        description: error.message || "Job belum memiliki penugasan"
      });
    }
  };

  const handleQuickPrintManifest = async (job: any) => {
    if (!job.sampling_assignment) {
      toast.error("Belum ada penugasan petugas lapangan");
      return;
    }

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("Popup diblokir", {
          description: "Izinkan popup untuk mencetak surat tugas"
        });
        return;
      }

      const escapeHtml = (value: any) => String(value ?? "-")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");

      let companyName = 'PT WAHFA LAB INDONESIA';
      let companyAddress = 'Jl. Raya Cianjur';
      let companyLeader = 'Spv. Administrasi';
      let companyLogo = '';

      try {
        const companyResponse = await fetch('/api/company-profile');
        if (companyResponse.ok) {
          const companyData = await companyResponse.json();
          if (companyData) {
            companyName = companyData.company_name || companyName;
            companyAddress = companyData.address || companyAddress;
            companyLeader = companyData.leader_name || companyLeader;
            companyLogo = companyData.logo_url || '';
          }
        }
      } catch (error) {
        console.error('Error fetching company profile:', error);
      }

      const customerName = job.quotation?.profile?.company_name ||
        job.quotation?.profile?.full_name ||
        '-';

      const picName = job.quotation?.profile?.full_name || '-';
      const customerAddress = job.quotation?.profile?.address || '-';

      const location = job.sampling_assignment?.location ||
        job.quotation?.profile?.address ||
        '-';

      const scheduledDate = job.sampling_assignment?.scheduled_date;
      const dateDisplay = scheduledDate
        ? new Date(scheduledDate).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })
        : '-';

      const rangeDisplay = scheduledDate
        ? `${dateDisplay} sampai dengan selesai`
        : '.......................... sampai dengan selesai';

      const officerName = job.sampling_assignment?.field_officer?.full_name || '-';
      const assistantNames = Array.isArray(job.sampling_assignment?.assistants)
        ? job.sampling_assignment.assistants.map((a: any) => a.full_name).filter(Boolean)
        : [];

      const personnel = [officerName, ...assistantNames].filter(Boolean);
      const personnelHtml = personnel.length > 0
        ? personnel.map((name, idx) => `<li>${idx + 1}. ${escapeHtml(name)}</li>`).join("")
        : "<li>1. -</li>";

      const parseParameterSnapshot = (snapshot: any) => {
        if (!snapshot) return "-";
        try {
          const parsed = typeof snapshot === "string" ? JSON.parse(snapshot) : snapshot;
          if (Array.isArray(parsed)) {
            return parsed
              .map((p: any) => p?.name || p?.parameter_name || String(p))
              .filter(Boolean)
              .join(", ");
          }
          if (typeof parsed === "object") {
            return Object.values(parsed).join(", ");
          }
          return String(parsed);
        } catch {
          return String(snapshot);
        }
      };

      const items = job.quotation?.items || [];
      const jobTitle = items.length > 0
        ? items
            .map((item: any) => item.service?.name || item.equipment?.name || 'Pekerjaan Sampling')
            .filter(Boolean)
            .join(', ')
        : `Pekerjaan ${job.tracking_code || '-'}`;

      const rowsHtml = items.length > 0
        ? items.map((item: any, idx: number) => {
            const serviceName = item.service?.name || item.equipment?.name || '-';
            const qty = Number(item.qty || 1);
            const regulation = item.service?.regulation_ref?.name || item.service?.regulation || '-';
            const paramsDisplay = parseParameterSnapshot(item.parameter_snapshot);
            const regulationParams = regulation !== '-'
              ? `${escapeHtml(regulation)}<br/>${paramsDisplay !== '-' ? escapeHtml(paramsDisplay) : ''}`
              : escapeHtml(paramsDisplay);

            return `
              <tr>
                <td class="cell-center">${idx + 1}</td>
                <td>${escapeHtml(serviceName)}</td>
                <td class="cell-center">${qty} titik</td>
                <td>${regulationParams || '-'}</td>
              </tr>
            `;
          }).join('')
        : '<tr><td colspan="4" class="cell-center">Tidak ada deskripsi pekerjaan</td></tr>';

      const cityDate = `Cianjur, ${new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}`;
      const numberSeed = String(job.tracking_code || '').replace(/\D/g, '').slice(-2) || '00';
      const suratNumber = `${numberSeed}/ST/WLI/${new Date().getFullYear()}`;
      const origin = window.location.origin;
      const fallbackLogo = `${origin}/logo-wahfalab.png`;
      const resolvedLogo = fallbackLogo;
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      const docAutoNumber = `F-7.3-${y}${m}${d}-${numberSeed}`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Surat Tugas Pengambilan Contoh</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 11pt;
              line-height: 1.45;
              color: #000;
              padding: 16px 20px;
            }
            .doc-header {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #000;
              margin-bottom: 14px;
              table-layout: fixed;
            }
            .doc-header td {
              border: 1px solid #000;
              padding: 4px 6px;
            }
            .doc-header .logo-cell {
              width: 30%;
              text-align: left;
              vertical-align: middle;
              padding: 6px 10px;
            }
            .doc-header .brand-wrap {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .doc-header .logo-cell img {
              max-width: 32px;
              width: 32px;
              height: auto;
              object-fit: contain;
              display: inline-block;
            }
            .doc-header .brand-text {
              font-size: 19pt;
              line-height: 1;
              font-weight: 700;
              color: #3f3f46;
              letter-spacing: -0.6px;
            }
            .doc-header .title-cell {
              text-align: center;
              vertical-align: middle;
              font-weight: 700;
              line-height: 1.15;
              padding: 6px 8px;
            }
            .doc-header .title-form {
              font-size: 11pt;
            }
            .doc-header .title-main {
              font-size: 12pt;
              margin-top: 2px;
            }
            .doc-header .meta-cell {
              text-align: center;
              font-size: 7.2pt;
              font-weight: 700;
              white-space: normal;
              word-break: break-word;
              line-height: 1.05;
              padding: 2px 4px;
            }
            .doc-header .meta-label {
              display: block;
              font-size: 6.8pt;
              font-weight: 700;
              margin-bottom: 1px;
            }
            .doc-header .meta-value {
              display: block;
              font-size: 7.4pt;
              font-weight: 800;
            }
            .letter-head {
              margin-top: 18px;
              margin-bottom: 12px;
            }
            .letter-date {
              text-align: right;
              margin-bottom: 8px;
            }
            .letter-head p { margin-bottom: 6px; }
            .letter-head .nomor-line { margin-top: 8px; }
            .body p {
              margin-bottom: 10px;
              text-align: justify;
            }
            .personnel-list {
              margin: 8px 0 12px 0;
              padding-left: 0;
              list-style: none;
            }
            .personnel-list li { margin-bottom: 4px; }
            .work-table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0 12px 0;
              font-size: 10pt;
            }
            .work-table th, .work-table td {
              border: 1px solid #000;
              padding: 6px 7px;
              vertical-align: top;
            }
            .work-table th {
              text-align: center;
              font-weight: 700;
            }
            .cell-center {
              text-align: center;
              vertical-align: middle;
            }
            .signature {
              margin-top: 28px;
            }
            .signature-name {
              margin-top: 46px;
              font-weight: 700;
            }
            .footer-note {
              margin-top: 36px;
              text-align: center;
              font-size: 8pt;
              border-top: 1px solid #000;
              padding-top: 8px;
            }
            @page {
              size: A4;
              margin: 10mm 12mm;
            }
            @media print { .no-print { display: none; } }
            .no-print {
              margin-top: 24px;
              text-align: center;
              padding: 14px;
              border: 1px solid #ddd;
              border-radius: 8px;
            }
            .btn {
              padding: 10px 24px;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 13px;
              font-weight: 700;
              margin: 0 10px;
            }
            .btn-print { background: #047857; color: #fff; }
            .btn-close { background: #475569; color: #fff; }
          </style>
        </head>
        <body onload="window.print();">
          <table class="doc-header">
            <tr>
              <td class="logo-cell">
                <div class="brand-wrap">
                  <img src="${escapeHtml(resolvedLogo)}" alt="Logo Wahfalab" onerror="this.onerror=null;this.src='${escapeHtml(fallbackLogo)}';" />
                  <span class="brand-text">Wahfalab</span>
                </div>
              </td>
              <td class="title-cell" colspan="4">
                <div class="title-form">FORMULIR</div>
                <div class="title-main">SURAT TUGAS PENGAMBILAN CONTOH</div>
              </td>
            </tr>
            <tr>
              <td class="meta-cell">
                <span class="meta-label">NOMOR DOKUMEN</span>
                <span class="meta-value">${escapeHtml(docAutoNumber)}</span>
              </td>
              <td class="meta-cell">
                <span class="meta-label">TERBITAN / REVISI</span>
                <span class="meta-value">01/00</span>
              </td>
              <td class="meta-cell">
                <span class="meta-label">TANGGAL TERBIT</span>
                <span class="meta-value">02-01-2026</span>
              </td>
              <td class="meta-cell">
                <span class="meta-label">TANGGAL REVISI</span>
                <span class="meta-value">-</span>
              </td>
              <td class="meta-cell">
                <span class="meta-label">HALAMAN</span>
                <span class="meta-value">1 DARI 1</span>
              </td>
            </tr>
          </table>

          <div class="letter-head">
            <p class="letter-date">${escapeHtml(cityDate)}</p>
            <p class="nomor-line">Nomor : ${escapeHtml(suratNumber)}</p>
            <p style="margin-top: 12px;">Kepada Yth.</p>
            <p><strong>${escapeHtml(customerName)}</strong></p>
            <p>${escapeHtml(customerAddress)}</p>
            <p style="margin-top: 8px;">u.p. : <strong>${escapeHtml(picName)}</strong></p>
          </div>

          <div class="body">
            <p>Dengan hormat,</p>
            <p>Bersama ini kami menugaskan kepada nama-nama tersebut dibawah ini :</p>
            <ol class="personnel-list">
              ${personnelHtml}
            </ol>
            <p>Untuk melaksanakan,</p>
            <p><strong>Pekerjaan :</strong> ${escapeHtml(jobTitle)}</p>

            <table class="work-table">
              <thead>
                <tr>
                  <th style="width: 42px;">No</th>
                  <th>Deskripsi Pekerjaan</th>
                  <th style="width: 95px;">Jumlah</th>
                  <th>Parameter/Regulasi</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <p>
              Pelaksanaan pekerjaan tersebut dari tanggal ${escapeHtml(rangeDisplay)}, berlokasi di ${escapeHtml(location)}.
            </p>
            <p>
              Demikian surat tugas ini kami buat dengan sebenar-benarnya untuk dipergunakan sebagaimana mestinya.
            </p>

            <div class="signature">
              <p>Hormat Kami,</p>
              <p class="signature-name">${escapeHtml(companyLeader)}</p>
              <p>(${escapeHtml(companyName)})</p>
            </div>

            <div class="footer-note">
              Dokumen ini terkendali kecuali di luar ketentuan distribusi pengendalian dokumen<br/>
              Laboratorium Penguji ${escapeHtml(companyName)}
            </div>
          </div>

          <div class="no-print">
            <button onclick="window.print()" class="btn btn-print">Cetak A4</button>
            <button onclick="window.close()" class="btn btn-close">Tutup</button>
            <div style="margin-top:8px;font-size:11px;color:#334155;">
              Jika header/footer browser masih muncul, nonaktifkan opsi “Headers and footers” di dialog print.
            </div>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();
      toast.success("Surat tugas dibuka");
    } catch (error: any) {
      toast.error("Gagal mencetak surat tugas", {
        description: error.message
      });
    }
  };
  const handleSendTravelOrder = async (job: any) => {
    if (!job.sampling_assignment) {
      toast.error("Belum ada penugasan petugas lapangan");
      return;
    }

    setSendingTravelOrderJobId(job.id);
    try {
      const result = await sendTravelOrderToField(job.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Surat tugas berhasil dikirim ke petugas lapangan");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Gagal mengirim surat tugas");
    } finally {
      setSendingTravelOrderJobId(null);
    }
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

  const getStatusBadge = (status: string) => {
    const opt = statusOptions.find(o => o.value === status);
    const StatusIcon = opt?.icon || Clock;
    return (
      <div className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border font-black text-[9px] uppercase tracking-widest transition-all",
        opt?.color || "bg-slate-100 text-slate-500 border-slate-200"
      )}>
        <StatusIcon className="h-3 w-3" />
        {opt?.label || status}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50/20 min-h-screen space-y-8 pb-24 md:pb-12 font-[family-name:var(--font-geist-sans)] max-w-[1600px] mx-auto">
      {/* Premium Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">
            <Activity className="h-4 w-4" /> Pemantauan Real-time
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Infrastruktur Pekerjaan</h1>
          <p className="text-slate-400 text-sm font-medium">Pengelolaan alur kerja operasional laboratorium WahfaLab.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end mr-4 hidden sm:flex">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sinkronisasi Database</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Update sistem aktif
            </span>
          </div>
          <Button variant="outline" onClick={() => loadData()} className="h-14 px-8 rounded-2xl bg-white border-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-all font-black uppercase text-[10px] tracking-widest shadow-sm">
            <History className={cn("h-4 w-4 mr-2 text-emerald-600", loading && "animate-spin")} /> Segarkan Sistem
          </Button>
        </div>
      </div>

      {/* Premium Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        <PremiumStatCard 
          title="Total Alur Kerja" 
          value={stats.total || 0} 
          subValue="Pelacakan Aktif" 
          icon={Layers} 
          color="slate" 
          active={filterStatus === 'all'} 
          onClick={() => setFilterStatus('all')} 
        />
        <PremiumStatCard 
          title="Terjadwal" 
          value={stats.scheduled || 0} 
          subValue="Pekerjaan Baru" 
          icon={Clock} 
          color="blue" 
          active={filterStatus === 'scheduled'} 
          onClick={() => setFilterStatus('scheduled')} 
        />
        <PremiumStatCard 
          title="Sampling" 
          value={stats.sampling || 0} 
          subValue="Di Lokasi" 
          icon={MapPin} 
          color="amber" 
          active={filterStatus === 'sampling'} 
          onClick={() => setFilterStatus('sampling')} 
        />
        <PremiumStatCard 
          title="Laboratorium" 
          value={(stats.analysis_ready || 0) + (stats.analysis || 0)} 
          subValue="Pengujian Lab" 
          icon={FlaskConical} 
          color="indigo" 
          active={filterStatus === 'analysis'} 
          onClick={() => setFilterStatus('analysis')} 
        />
        <PremiumStatCard 
          title="Pelaporan" 
          value={stats.reporting || 0} 
          subValue="Verifikasi Hasil" 
          icon={FileText} 
          color="rose" 
          active={filterStatus === 'reporting'} 
          onClick={() => setFilterStatus('reporting')} 
        />
        <PremiumStatCard 
          title="Selesai" 
          value={stats.completed || 0} 
          subValue="Terarsip" 
          icon={ShieldCheck} 
          color="emerald" 
          active={filterStatus === 'completed'} 
          onClick={() => setFilterStatus('completed')} 
        />
      </div>

      {/* Main Table Container with Glass Effect */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden transition-all duration-700">
        {/* Table Toolbar */}
        <div className="p-8 border-b bg-white flex flex-col xl:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <Input
              placeholder="Cari berdasarkan Kode Pelacakan, Penawaran, atau Nama Klien..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-14 h-16 bg-slate-50 border-none rounded-2xl font-bold text-sm focus-visible:ring-2 focus-visible:ring-emerald-500/20 placeholder:text-slate-300 placeholder:font-medium transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full xl:w-auto">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              {statusOptions.slice(0, 4).map(opt => (
                <Button 
                  key={opt.value}
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFilterStatus(opt.value)}
                  className={cn(
                    "h-10 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all",
                    filterStatus === opt.value ? "bg-white text-emerald-700 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {opt.label}
                </Button>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl text-slate-400">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-slate-50">
                  {statusOptions.slice(4).map(opt => (
                    <DropdownMenuItem 
                      key={opt.value} 
                      onClick={() => setFilterStatus(opt.value)}
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

        {/* Advanced Filters Panel */}
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
                  {customers.map(c => <SelectItem key={c.id} value={c.id} className="text-[10px] font-black uppercase py-3">{c.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="h-3 w-3" /> Personel Lapangan
              </label>
              <Select value={draftFilters.fieldOfficerId} onValueChange={(v) => setDraftFilters({ ...draftFilters, fieldOfficerId: v })}>
                <SelectTrigger className="bg-white border-none rounded-2xl h-14 text-xs font-black uppercase tracking-tight shadow-sm px-5">
                  <SelectValue placeholder="Semua Petugas" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl max-h-80">
                  {fieldOfficers.map(o => <SelectItem key={o.id} value={o.id} className="text-[10px] font-black uppercase py-4">{o.full_name}</SelectItem>)}
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
                  setPage(1);
                }} 
                className="text-rose-600 font-black text-[10px] uppercase tracking-widest h-14 hover:bg-rose-50 rounded-2xl flex-1 transition-all"
              >
                Reset
              </Button>
              <Button 
                onClick={() => {
                  setAppliedFilters(draftFilters);
                  setPage(1);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest h-14 rounded-2xl flex-1 shadow-lg shadow-emerald-900/10 transition-all"
              >
                Terapkan
              </Button>
            </div>
          </div>
        )}

        {/* Premium Data Table */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow className="border-b border-slate-50">
                <TableHead className="px-10 py-8 font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 w-[200px]">ID Infrastruktur</TableHead>
                <TableHead className="px-6 py-8 font-black uppercase tracking-[0.2em] text-[10px] text-slate-400">Progres Alur Kerja</TableHead>
                <TableHead className="px-6 py-8 font-black uppercase tracking-[0.2em] text-[10px] text-slate-400">Profil Klien</TableHead>
                <TableHead className="px-6 py-8 font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 text-center">Status</TableHead>
                <TableHead className="px-10 py-8 font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 text-right">Kontrol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-slate-50">
                    <TableCell colSpan={5} className="px-10 py-10">
                      <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-slate-100 animate-pulse rounded-2xl" />
                        <div className="space-y-3 flex-1">
                          <div className="h-4 w-1/4 bg-slate-100 animate-pulse rounded-full" />
                          <div className="h-3 w-1/2 bg-slate-50 animate-pulse rounded-full" />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-40 bg-white">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-emerald-100 rounded-full blur-3xl opacity-20 animate-pulse" />
                      <Briefcase className="h-20 w-20 text-slate-100 relative z-10 mx-auto mb-6" />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[11px]">Sistem Kosong • Tidak ada pekerjaan aktif</p>
                    <Button variant="link" className="mt-4 text-emerald-600 font-black uppercase text-[10px]" onClick={() => loadData()}>Hubungkan Ulang Sistem</Button>
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((job: any) => (
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
                            <FileText className="h-3 w-3" /> {job.quotation?.quotation_number}
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
                            {job.quotation?.profile?.full_name}
                          </span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] flex items-center gap-1.5">
                            <Briefcase className="h-2.5 w-2.5" /> {job.quotation?.profile?.company_name || "Klien Personal"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="px-6 py-8 text-center">
                      <div className="scale-90 transform origin-center">
                        {getStatusBadge(job.status)}
                      </div>
                    </TableCell>
                    
                    <TableCell className="px-10 py-8 text-right">
                      <div className="flex justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-sm border border-slate-100/50">
                                <Link href={`/admin/jobs/${job.id}`}>
                                  <Maximize2 className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-emerald-900 text-white rounded-md py-1 px-2">
                              <p className="text-[8px] font-black uppercase tracking-wide">Buka Pemantauan</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-white text-slate-400 hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-sm border border-slate-100">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border border-slate-100 shadow-xl bg-white/95 backdrop-blur-xl">
                            <DropdownMenuLabel className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Kontrol Infrastruktur</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-50" />
                            {!job.sampling_assignment && (
                              <DropdownMenuItem onClick={() => openAssignDialog(job)} className="rounded-lg p-2.5 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:bg-emerald-50 focus:bg-emerald-50 focus:text-emerald-700 transition-colors" disabled={job.status !== 'scheduled'}>
                                <div className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center mr-2.5">
                                  <UserPlus className="h-3.5 w-3.5" />
                                </div>
                                Tugaskan Personel
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="rounded-lg p-2.5 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700 transition-colors data-[disabled]:opacity-40 data-[disabled]:pointer-events-none"
                              onClick={() => handleQuickPrintManifest(job)}
                              disabled={!job.sampling_assignment}
                            >
                              <div className="h-6 w-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center mr-2.5">
                                <Printer className="h-3.5 w-3.5" />
                              </div>
                              Cetak Surat Tugas
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg p-2.5 text-[10px] font-black uppercase tracking-wider text-slate-700 hover:bg-indigo-50 focus:bg-indigo-50 focus:text-indigo-700 transition-colors data-[disabled]:opacity-40 data-[disabled]:pointer-events-none"
                              onClick={() => handleSendTravelOrder(job)}
                              disabled={!job.sampling_assignment || sendingTravelOrderJobId === job.id}
                            >
                              <div className="h-6 w-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2.5">
                                <Send className="h-3.5 w-3.5" />
                              </div>
                              {sendingTravelOrderJobId === job.id ? "Mengirim..." : "Kirim Surat Tugas"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-50" />
                            <DropdownMenuItem onClick={() => { setSelectedJob(job); setIsDeleteDialogOpen(true); }} className="rounded-lg p-2.5 text-[10px] font-black uppercase tracking-wider text-rose-600 hover:bg-rose-50 focus:bg-rose-50 transition-colors">
                              <div className="h-6 w-6 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center mr-2.5">
                                <Trash2 className="h-3.5 w-3.5" />
                              </div>
                              Hentikan Pekerjaan
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

        {/* Premium Pagination */}
        <div className="p-8 border-t flex flex-col sm:flex-row items-center justify-between bg-slate-50/30 gap-6">
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Registri Global</span>
            <div className="h-8 px-4 rounded-xl bg-white border border-slate-100 flex items-center shadow-sm">
              <span className="text-[10px] font-black text-slate-900">{data.total} ENTRI DITEMUKAN</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-white border-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center h-12 px-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-xs font-black text-slate-900 tracking-[0.2em]">{page} / {data.pages}</span>
            </div>
            
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl bg-white border-slate-200 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* TERMINATION DIALOG - PREMIUM REDESIGN */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-white max-w-md">
          <div className="bg-rose-600 p-12 flex flex-col items-center text-white relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/img/noise.png')] pointer-events-none" />
            <div className="w-24 h-24 rounded-[2rem] bg-white/20 backdrop-blur-xl flex items-center justify-center mb-6 border border-white/30 shadow-2xl animate-in zoom-in duration-500">
              <Trash2 className="h-12 w-12 text-white" />
            </div>
            <AlertDialogTitle className="text-3xl font-black uppercase tracking-tighter text-center leading-none">Terminasi</AlertDialogTitle>
            <AlertDialogDescription className="text-rose-100 font-bold uppercase text-[10px] tracking-[0.2em] mt-3 opacity-80">Protokol Penghapusan Infrastruktur</AlertDialogDescription>
          </div>
          <div className="p-12 space-y-8 bg-white">
            <p className="text-center text-slate-500 font-bold text-xs uppercase leading-relaxed">
              Anda akan menghapus infrastruktur pekerjaan <strong className="text-slate-900 tracking-tight">{selectedJob?.tracking_code}</strong>. Tindakan ini akan memusnahkan seluruh aset progres dan foto sampling secara permanen.
            </p>
            <div className="flex flex-col gap-3">
              <LoadingButton loading={deleting} onClick={confirmDelete} className="bg-slate-950 hover:bg-rose-600 text-white rounded-[1.5rem] h-16 w-full font-black uppercase text-[11px] tracking-widest shadow-xl transition-all active:scale-95">
                Konfirmasi Terminasi
              </LoadingButton>
              <AlertDialogCancel className="rounded-[1.5rem] h-16 w-full font-black text-slate-400 uppercase text-[11px] tracking-widest border-none hover:bg-slate-50 transition-all">
                Batalkan Protokol
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* ASSIGNMENT DIALOG - PREMIUM v2.0 */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent showCloseButton={false} className="max-w-[95vw] sm:max-w-3xl rounded-xl border border-slate-200 p-0 overflow-hidden shadow-2xl bg-white">
          {/* Premium Header */}
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
            
            <button
              onClick={() => setIsAssignDialogOpen(false)}
              className="absolute top-3 right-3 md:top-4 md:right-4 h-9 w-9 md:h-10 md:w-10 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all border border-white/10"
            >
              <X className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
            <div className="p-6 md:p-8 space-y-6 bg-gradient-to-b from-white via-slate-50/50 to-white">
              
              {/* Main Grid - 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Field Officer */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    Petugas Utama *
                  </label>
                  <Select value={assignFormData.field_officer_id} onValueChange={(v) => setAssignFormData({...assignFormData, field_officer_id: v})}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white border-2 border-slate-200 font-bold text-sm px-5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
                      <SelectValue placeholder="Pilih Petugas Utama" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl max-h-48">
                      {fieldOfficers.map(o => (
                        <SelectItem key={o.id} value={o.id} className="text-sm font-bold py-3 px-4 rounded-xl mb-1 hover:bg-emerald-50 cursor-pointer">
                          {o.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Target Date */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    Tanggal Target *
                  </label>
                  <Input
                    type="date"
                    value={assignFormData.scheduled_date}
                    onChange={(e) => setAssignFormData({...assignFormData, scheduled_date: e.target.value})}
                    className="h-14 rounded-2xl bg-white border-2 border-slate-200 font-bold text-sm px-5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Time */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    Waktu Penugasan
                  </label>
                  <Input
                    type="time"
                    value={assignFormData.scheduled_time}
                    onChange={(e) => setAssignFormData({...assignFormData, scheduled_time: e.target.value})}
                    className="h-14 rounded-2xl bg-white border-2 border-slate-200 font-bold text-sm px-5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Location */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-violet-100 flex items-center justify-center">
                      <MapPin className="h-3.5 w-3.5 text-violet-600" />
                    </div>
                    Lokasi Sampling
                  </label>
                  <Input
                    placeholder="Alamat lengkap penugasan"
                    value={assignFormData.location}
                    onChange={(e) => setAssignFormData({...assignFormData, location: e.target.value})}
                    className="h-14 rounded-2xl bg-white border-2 border-slate-200 font-bold text-sm px-5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Assistant Selection - Premium */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <UserPlus className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    Asisten Lapangan (Opsional)
                  </label>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                    {assignFormData.assistant_ids.length} terpilih
                  </span>
                </div>

                {assignDialogLoading && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
                    Memuat data petugas dan asisten...
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-3 bg-slate-50/80 rounded-3xl border-2 border-slate-100">
                  {assistants.length > 0 ? (
                    assistants.map((assistant) => {
                      const isSelected = assignFormData.assistant_ids.includes(assistant.id);
                      return (
                        <label
                          key={assistant.id}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 group",
                            isSelected 
                              ? "bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-200/50 scale-[1.02]" 
                              : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                          )}
                        >
                          <div className={cn(
                            "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                            isSelected 
                              ? "bg-emerald-500 border-emerald-500" 
                              : "border-slate-300 group-hover:border-emerald-400"
                          )}>
                            {isSelected && <Check className="h-4 w-4 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm font-bold truncate transition-colors",
                              isSelected ? "text-emerald-900" : "text-slate-900"
                            )}>
                              {assistant.full_name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {assistant.phone || "Belum ada nomor"}
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAssignFormData({
                                  ...assignFormData,
                                  assistant_ids: [...assignFormData.assistant_ids, assistant.id]
                                });
                              } else {
                                setAssignFormData({
                                  ...assignFormData,
                                  assistant_ids: assignFormData.assistant_ids.filter((id: string) => id !== assistant.id)
                                });
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      );
                    })
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                      <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <User className="h-8 w-8 opacity-50" />
                      </div>
                      <p className="text-sm font-bold text-slate-500">Tidak ada asisten lapangan tersedia</p>
                      <p className="text-xs text-slate-400 mt-1">Tambahkan asisten dari halaman Asisten Lapangan</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Info className="h-3.5 w-3.5 text-slate-600" />
                  </div>
                  Instruksi Penugasan
                </label>
                <textarea
                  className="w-full h-32 bg-white border-2 border-slate-200 rounded-3xl p-5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-300 resize-none"
                  placeholder="Instruksi khusus untuk tim lapangan (protokol sampling, titik perhatian, dll)..."
                  value={assignFormData.notes}
                  onChange={(e) => setAssignFormData({...assignFormData, notes: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Premium Footer */}
          <div className="p-6 md:p-8 bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setIsAssignDialogOpen(false)} 
                className="flex-1 h-14 rounded-2xl font-black text-slate-400 uppercase text-[11px] tracking-widest border-2 border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all"
              >
                Batal
              </Button>
              <LoadingButton 
                loading={submitting} 
                disabled={assignDialogLoading}
                onClick={handleAssignSubmit} 
                className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black uppercase text-[11px] tracking-widest shadow-xl shadow-emerald-900/20 transition-all active:scale-[0.98]"
              >
                {submitting ? 'Memproses...' : 'Konfirmasi Penugasan'}
              </LoadingButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LoadingOverlay isOpen={submitting} title="Memproses Infrastruktur" description="Sinkronisasi data penugasan dengan database global..." />
    </div>
  );
}


