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
  Check
} from "lucide-react";
import { LoadingOverlay, LoadingButton } from "@/components/ui";
import { TableSkeleton } from "@/components/ui/skeleton";
import { getJobOrders, getJobStats, getFieldOfficers, getCustomers, deleteJobOrderWithPhotos } from "@/lib/actions/jobs";
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
        "relative group cursor-pointer transition-all duration-500 p-[1px] rounded-[2rem] overflow-hidden",
        active ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-2xl scale-[1.02]" : "hover:scale-[1.02]"
      )}
    >
      <div className={cn(
        "bg-white h-full w-full rounded-[1.95rem] p-6 flex flex-col justify-between transition-all duration-500",
        active ? "bg-opacity-95" : "bg-opacity-100 hover:bg-slate-50"
      )}>
        <div className="flex justify-between items-start mb-4">
          <div className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:rotate-12",
            active ? "bg-emerald-600 text-white" : iconColors[color] || "bg-slate-100 text-slate-500"
          )}>
            <Icon className="h-6 w-6" />
          </div>
          {active && <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />}
        </div>
        
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tighter">{value}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subValue}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
          <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">View Details</span>
          <ArrowUpRight className="h-3 w-3 text-slate-300 group-hover:text-emerald-500 transition-colors" />
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
    { id: 'scheduled', label: "Order", icon: FileText },
    { id: 'sampling', label: "Sampling", icon: MapPin },
    { id: 'analysis', label: "Analisis", icon: FlaskConical },
    { id: 'reporting', label: "Reporting", icon: FileText },
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

    // Open dialog immediately
    setIsAssignDialogOpen(true);

    // Load data in background
    setLoading(true);
    try {
      const [officers, assistantList] = await Promise.all([
        getFieldOfficers(),
        getFieldAssistants()
      ]);
      setFieldOfficers(officers || []);
      setAssistants(assistantList || []);
    } catch (error) { 
      toast.error("Gagal memuat data petugas"); 
    }
    finally { 
      setLoading(false); 
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
    // Print Surat Tugas (SPL)
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("Popup diblokir", {
          description: "Izinkan popup untuk mencetak surat tugas"
        });
        return;
      }

      // Fetch company profile for real data
      let companyName = 'PT WAHFA LAB PRATAMA';
      let companyAddress = 'Jl. Raya Laboratorium No. 123, Jakarta, Indonesia';
      let companyPhone = '(021) 1234-5678';
      let companyEmail = 'info@wahfalab.com';
      let companyLogo = '';

      try {
        const companyResponse = await fetch('/api/company-profile');
        if (companyResponse.ok) {
          const companyData = await companyResponse.json();
          if (companyData) {
            companyName = companyData.company_name || companyName;
            companyAddress = companyData.address || companyAddress;
            companyPhone = companyData.phone || companyPhone;
            companyEmail = companyData.email || companyEmail;
            companyLogo = companyData.logo_url || '';
          }
        }
      } catch (error) {
        console.error('Error fetching company profile:', error);
      }

      // Get data with fallbacks
      const customerName = job.quotation?.profile?.company_name ||
                          job.quotation?.profile?.full_name ||
                          job.customer_name ||
                          '-';

      const location = job.sampling_assignment?.location ||
                      job.location ||
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

      const officerName = job.sampling_assignment?.field_officer?.full_name ||
                         job.sampling_assignment?.field_officer_name ||
                         '-';

      // Fix: Get assistants properly from sampling_assignment
      let assistantsDisplay = '-';
      if (job.sampling_assignment) {
        const asstArray = Array.isArray(job.sampling_assignment.assistants) 
          ? job.sampling_assignment.assistants 
          : [];
        if (asstArray.length > 0) {
          assistantsDisplay = asstArray
            .map((a: any) => a.full_name || a.name)
            .filter(Boolean)
            .join(', ');
        }
      }

      const items = job.quotation?.items || [];
      const servicesHTML = items.length > 0
        ? items.map((item: any, idx: number) => {
            const serviceName = item.service?.name || item.service_name || item.name || '-';
            
            // Fix: Get parameters properly
            let paramsDisplay = '-';
            const params = item.service?.parameters || item.parameters;
            
            if (params) {
              try {
                const parsed = typeof params === 'string' ? JSON.parse(params) : params;
                if (Array.isArray(parsed) && parsed.length > 0) {
                  paramsDisplay = parsed
                    .map((p: any) => p.name || p.parameter_name || p)
                    .filter(Boolean)
                    .join(', ');
                }
              } catch (e) {
                paramsDisplay = String(params);
              }
            }

            return `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td>${serviceName}</td>
                <td>${paramsDisplay || '-'}</td>
              </tr>
            `;
          }).join('')
        : '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #666;">Tidak ada pengujian</td></tr>';

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @page {
              size: A4;
              margin: 1.5cm 2cm 1.5cm 2cm;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Arial', sans-serif;
              font-size: 11pt;
              line-height: 1.5;
              color: #000;
              background: #fff;
            }

            /* Kop Surat */
            .kop-surat {
              border-bottom: 3px double #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 20px;
            }
            .kop-logo {
              flex-shrink: 0;
            }
            .kop-logo img {
              height: 70px;
              width: auto;
              object-fit: contain;
              filter: none !important;
              -webkit-filter: none !important;
            }
            .kop-logo .emoji-logo {
              font-size: 56px;
              line-height: 1;
              color: inherit;
            }
            .kop-info {
              flex: 1;
            }
            .kop-info .company-name {
              font-size: 16pt;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 3px;
            }
            .kop-info .company-address {
              font-size: 9pt;
              margin-bottom: 2px;
            }
            .kop-info .company-contact {
              font-size: 9pt;
              font-style: italic;
            }

            /* Force hide browser headers/footers */
            @media print {
              @page {
                margin-top: 1cm;
                margin-bottom: 1cm;
                margin-left: 2cm;
                margin-right: 2cm;
                size: A4;
              }
              html, body {
                height: auto !important;
                overflow: visible !important;
              }
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
                -moz-print-color-adjust: exact;
                margin: 0 !important;
                padding: 0 !important;
              }
              /* Hide all browser annotations */
              @page {
                @top-left { content: none !important; display: none !important; }
                @top-center { content: none !important; display: none !important; }
                @top-right { content: none !important; display: none !important; }
                @bottom-left { content: none !important; display: none !important; }
                @bottom-center { content: none !important; display: none !important; }
                @bottom-right { content: none !important; display: none !important; }
                @left-top { content: none !important; }
                @left-middle { content: none !important; }
                @left-bottom { content: none !important; }
                @right-top { content: none !important; }
                @right-middle { content: none !important; }
                @right-bottom { content: none !important; }
              }
            }
            .judul-surat {
              text-align: center;
              margin: 20px 0 15px 0;
            }
            .judul-surat .document-title {
              font-size: 14pt;
              font-weight: bold;
              text-transform: uppercase;
              text-decoration: underline;
              margin-bottom: 5px;
            }
            .judul-surat .document-number {
              font-size: 10pt;
            }
            
            /* Isi Surat */
            .isi-surat {
              margin-top: 20px;
            }
            .isi-surat p {
              margin-bottom: 12px;
              text-align: justify;
            }
            
            /* Tabel Detail */
            .detail-box {
              margin: 15px 0;
              width: 100%;
              border-collapse: collapse;
            }
            .detail-box td {
              padding: 6px 8px;
              border: 1px solid #000;
              vertical-align: top;
            }
            .detail-box td:first-child {
              width: 25%;
              font-weight: bold;
              background: #f5f5f5;
            }
            .detail-box td:nth-child(2) {
              width: 3%;
              text-align: center;
            }
            
            /* Tabel Pengujian */
            .tabel-pengujian {
              margin: 20px 0;
              border-collapse: collapse;
              width: 100%;
            }
            .tabel-pengujian th,
            .tabel-pengujian td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
              font-size: 10pt;
            }
            .tabel-pengujian th {
              background: #e0e0e0;
              font-weight: bold;
              text-align: center;
            }
            .tabel-pengujian td:first-child {
              text-align: center;
              width: 40px;
            }
            
            /* Tanda Tangan */
            .tanda-tangan {
              margin-top: 50px;
              width: 100%;
            }
            .ttd-container {
              display: flex;
              justify-content: space-between;
              gap: 50px;
            }
            .ttd-box {
              flex: 1;
              text-align: center;
            }
            .ttd-box .jabatan {
              margin-bottom: 90px;
              font-weight: bold;
              line-height: 1.6;
              min-height: 60px;
            }
            .ttd-box .nama {
              border-top: 1px solid #000;
              padding-top: 8px;
              display: inline-block;
              min-width: 200px;
              font-weight: bold;
            }
            
            /* Footer */
            .footer {
              margin-top: 30px;
              font-size: 8pt;
              font-style: italic;
              text-align: center;
              border-top: 1px solid #ccc;
              padding-top: 8px;
            }
            
            /* Print Controls */
            .no-print {
              margin-top: 40px;
              text-align: center;
              padding: 30px;
              background: #f5f5f5;
              border-radius: 10px;
              border: 2px solid #ddd;
            }
            .btn {
              padding: 14px 40px;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: bold;
              margin: 0 10px;
              transition: all 0.3s ease;
              text-transform: uppercase;
            }
            .btn-print {
              background: #059669;
              color: white;
            }
            .btn-print:hover {
              background: #047857;
              transform: translateY(-2px);
              box-shadow: 0 4px 8px rgba(5, 150, 105, 0.3);
            }
            .btn-close {
              background: #64748b;
              color: white;
            }
            .btn-close:hover {
              background: #475569;
              transform: translateY(-2px);
              box-shadow: 0 4px 8px rgba(100, 116, 139, 0.3);
            }
            
            @media print {
              .no-print { display: none; }
              body { font-size: 11pt; }
              @page { margin: 2cm 2cm 2cm 2cm; }
            }
          </style>
        </head>
        <body onload="window.print();">
          <!-- Kop Surat -->
          <div class="kop-surat">
            <div class="kop-logo">
              ${companyLogo ? `<img src="${companyLogo}" alt="Logo" />` : '<div class="emoji-logo">🧪</div>'}
            </div>
            <div class="kop-info">
              <div class="company-name">${companyName}</div>
              <div class="company-address">
                ${companyAddress}
              </div>
              <div class="company-contact">
                Telp: ${companyPhone} | Email: ${companyEmail}
              </div>
            </div>
          </div>
          
          <!-- Judul Surat -->
          <div class="judul-surat">
            <div class="document-title">SURAT PERINTAH KERJA</div>
            <div class="document-number">Nomor: ${job.tracking_code || job.id || '-'}/SPK/III/2026</div>
          </div>
          
          <!-- Isi Surat -->
          <div class="isi-surat">
            <p>
              Yang bertanda tangan di bawah ini, Manager Operasional PT Wahfa Lab Pratama, 
              memberikan tugas kepada petugas untuk melaksanakan kegiatan sampling dan 
              pengujian laboratorium dengan detail sebagai berikut:
            </p>
            
            <table class="detail-box">
              <tr>
                <td>No. Job Order</td>
                <td>:</td>
                <td><strong>${job.tracking_code || '-'}</strong></td>
              </tr>
              <tr>
                <td>Customer</td>
                <td>:</td>
                <td><strong>${customerName}</strong></td>
              </tr>
              <tr>
                <td>Lokasi Sampling</td>
                <td>:</td>
                <td>${location}</td>
              </tr>
              <tr>
                <td>Tanggal Sampling</td>
                <td>:</td>
                <td>${dateDisplay}</td>
              </tr>
              <tr>
                <td>Petugas Sampling</td>
                <td>:</td>
                <td><strong>${officerName}</strong></td>
              </tr>
              ${assistantsDisplay !== '-' ? `
              <tr>
                <td>Asisten Lapangan</td>
                <td>:</td>
                <td><strong>${assistantsDisplay}</strong></td>
              </tr>
              ` : ''}
            </table>
            
            <p><strong>Daftar Pengujian:</strong></p>
            
            <table class="tabel-pengujian">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Pengujian</th>
                  <th>Parameter</th>
                </tr>
              </thead>
              <tbody>
                ${servicesHTML}
              </tbody>
            </table>
            
            <p>
              Demikian surat perintah kerja ini dibuat untuk dilaksanakan dengan penuh 
              tanggung jawab dan profesionalisme.
            </p>
          </div>
          
          <!-- Tanda Tangan -->
          <div class="tanda-tangan">
            <div class="ttd-container">
              <div class="ttd-box">
                <div class="jabatan">
                  Mengetahui,<br>
                  Manager Operasional
                </div>
                <div class="nama">
                  ( ___________________ )
                </div>
              </div>
              <div class="ttd-box">
                <div class="jabatan">
                  Petugas Sampling
                </div>
                <div class="nama">
                  ( ${officerName} )
                </div>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            Dokumen ini dicetak secara otomatis dari sistem WahfaLab pada ${new Date().toLocaleDateString('id-ID', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          
          <!-- Print Controls -->
          <div class="no-print">
            <button onclick="window.print()" class="btn btn-print">🖨️ Cetak A4</button>
            <button onclick="window.close()" class="btn btn-close">❌ Tutup</button>
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
          subValue="Order Baru" 
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
          <div className="p-8 bg-slate-50/50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-6 duration-500">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User className="h-3 w-3" /> Database Klien
              </label>
              <Select value={filters.customerId} onValueChange={(v) => setFilters({...filters, customerId: v})}>
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
              <Select value={filters.fieldOfficerId} onValueChange={(v) => setFilters({...filters, fieldOfficerId: v})}>
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
                value={filters.dateFrom} 
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} 
                className="bg-white border-none rounded-2xl h-14 text-xs font-black uppercase shadow-sm px-5" 
              />
            </div>

            <div className="flex items-end gap-3">
              <Button 
                variant="ghost" 
                onClick={() => { setFilters({dateFrom:"", dateTo:"", fieldOfficerId:"", customerId:""}); setPage(1); }} 
                className="text-rose-600 font-black text-[10px] uppercase tracking-widest h-14 hover:bg-rose-50 rounded-2xl flex-1 transition-all"
              >
                Reset
              </Button>
              <Button 
                onClick={() => loadData()}
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
                      <div className="flex justify-end gap-3">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/admin/jobs/${job.id}`}>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white transition-all duration-500 shadow-sm border border-slate-100/50">
                                  <Maximize2 className="h-5 w-5" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent className="bg-emerald-900 text-white rounded-xl py-2 px-3"><p className="text-[9px] font-black uppercase">Buka Pemantauan</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white text-slate-400 hover:bg-slate-900 hover:text-white transition-all duration-500 shadow-sm border border-slate-100">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-72 p-3 rounded-[2rem] border-none shadow-2xl bg-white/95 backdrop-blur-xl">
                            <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-3">Kontrol Infrastruktur</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-50" />
                            <DropdownMenuItem onClick={() => openAssignDialog(job)} className="rounded-2xl p-4 text-[11px] font-black uppercase tracking-widest text-slate-700 hover:bg-emerald-50 focus:bg-emerald-50 focus:text-emerald-700 transition-colors" disabled={job.status !== 'scheduled'}>
                              <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mr-4">
                                <UserPlus className="h-4 w-4" />
                              </div>
                              Tugaskan Personel
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-2xl p-4 text-[11px] font-black uppercase tracking-widest text-slate-700 hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-700 transition-colors" onClick={() => handleQuickPrintManifest(job)}>
                              <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
                                <Printer className="h-4 w-4" />
                              </div>
                              Cetak Surat Tugas
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-50" />
                            <DropdownMenuItem onClick={() => { setSelectedJob(job); setIsDeleteDialogOpen(true); }} className="rounded-2xl p-4 text-[11px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 focus:bg-rose-50 transition-colors">
                              <div className="h-8 w-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mr-4">
                                <Trash2 className="h-4 w-4" />
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
        <DialogContent className="max-w-[95vw] sm:max-w-3xl rounded-[2.5rem] border-none p-0 overflow-hidden shadow-2xl bg-white">
          {/* Premium Header */}
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-8 md:p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500 rounded-full blur-[80px] opacity-20" />
            
            <div className="relative z-10 flex items-center gap-5">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl flex items-center justify-center border-2 border-white/20 shadow-2xl">
                <UserPlus className="h-8 w-8 md:h-10 md:w-10 text-emerald-300" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none truncate">
                  Penugasan Personel
                </DialogTitle>
                <DialogDescription className="text-emerald-200 font-bold uppercase text-[10px] md:text-[11px] tracking-[0.25em] mt-2 opacity-90 truncate">
                  {selectedJob?.tracking_code} • {selectedJob?.quotation?.profile?.company_name || 'N/A'}
                </DialogDescription>
              </div>
            </div>
            
            <button
              onClick={() => setIsAssignDialogOpen(false)}
              className="absolute top-4 right-4 md:top-6 md:right-6 h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all border border-white/10"
            >
              <X className="h-5 w-5 md:h-6 md:w-6 text-white" />
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
                              {assistant.phone || "No phone"}
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
                  placeholder="Instruksi khusus untuk tim lapangan (protokol sampling,注意点，dll)..."
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

