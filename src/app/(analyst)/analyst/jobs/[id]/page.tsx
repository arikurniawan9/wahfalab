// ============================================================================
// PREMIUM ANALYST PRECISION INTERFACE - v4.0
// Engineered for maximum speed and scientific accuracy.
// ============================================================================

"use client";

import React, { useEffect, useState, use, useCallback } from "react";
import { 
  getAnalysisJobById, 
  claimAnalysisJob,
  startAnalysis, 
  saveAnalysisResults, 
  uploadAnalysisPDF, 
  uploadRawData, 
  completeAnalysis,
  deleteAnalysisFile
} from "@/lib/actions/analyst";
import { createSampleHandover } from "@/lib/actions/handover";
import { getProfile } from "@/lib/actions/auth";
import { ChemicalLoader, LoadingOverlay } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FlaskConical,
  Upload,
  CheckCircle,
  Save,
  FileText,
  MapPin,
  Calendar,
  User,
  Plus,
  Trash2,
  PackageCheck,
  X,
  AlertCircle,
  ClipboardCheck,
  Send,
  Eye,
  Download,
  Activity,
  Beaker,
  ShieldCheck,
  ChevronRight,
  Camera,
  ExternalLink,
  Info,
  Layers,
  FileCheck
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { pdf } from "@react-pdf/renderer";
import { SampleHandoverPDF } from "@/components/pdf/SampleHandoverPDF";
import { cn } from "@/lib/utils";
import { ANALYST_DETAIL_LABELS } from "@/lib/constants/workflow-copy";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any; progress: number }> = {
  sampling: { label: 'Logistik Sampel', color: 'text-blue-600', bg: 'bg-blue-50', icon: MapPin, progress: 20 },
  analysis_ready: { label: 'Tunggu Lab', color: 'text-amber-600', bg: 'bg-amber-50', icon: PackageCheck, progress: 40 },
  analysis: { label: 'Laboratorium', color: 'text-violet-600', bg: 'bg-violet-50', icon: Beaker, progress: 70 },
  analysis_done: { label: 'Analisis Final', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: ShieldCheck, progress: 90 },
  reporting: { label: 'Penerbitan LHU', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: FileText, progress: 95 },
  completed: { label: 'Selesai', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle, progress: 100 }
};

interface TestResult {
  parameter: string;
  result: string;
  unit: string;
  method: string;
  limit?: string;
}

export default function AnalystJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [storageConfig, setStorageConfig] = useState<any>(null);

  // Form state
  const [analysisNotes, setAnalysisNotes] = useState("");

  // Handover state
  const [handoverDialogOpen, setHandoverDialogOpen] = useState(false);
  const [handoverData, setHandoverData] = useState({
    sample_condition: "Segel Utuh",
    sample_qty: 1,
    sample_notes: ""
  });
  const [handover, setHandover] = useState<any>(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileTypeToDelete, setFileTypeToDelete] = useState<"pdf" | "raw" | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [result, profResult] = await Promise.all([
        getAnalysisJobById(id),
        getProfile()
      ]);

      if (!result.success || !result.jobOrder) {
        toast.error(result.error || "Gagal memuat data");
        return;
      }

      setJob(result.jobOrder);
      setProfile(profResult);
      setCompanyProfile(result.companyProfile);

      if (result.jobOrder.sample_handover) {
        setHandover(result.jobOrder.sample_handover);
      }

      if (result.jobOrder.lab_analysis) {
        setAnalysis(result.jobOrder.lab_analysis);
        setAnalysisNotes(result.jobOrder.lab_analysis.analysis_notes || "");
      }
    } catch (error) {
      console.error("Load Error:", error);
      toast.error("Terjadi kesalahan sinkronisasi");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const loadStorageConfig = async () => {
      try {
        const response = await fetch("/api/company-profile", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        setStorageConfig({
          provider: data.upload_storage_provider || "supabase",
          publicPath: data.upload_storage_public_path || "",
          externalUrl: data.upload_storage_external_url || "",
          note: data.upload_storage_note || "",
        });
      } catch {
        setStorageConfig(null);
      }
    };

    loadStorageConfig();
  }, []);

  const storageLabel =
    storageConfig?.provider === "public"
      ? "Project / Public"
      : storageConfig?.provider === "google_drive"
        ? "Google Drive"
        : storageConfig?.provider === "google_form"
          ? "Google Form"
          : "Supabase Storage";
  const storageHint =
    storageConfig?.provider === "public"
      ? storageConfig?.publicPath || "disimpan ke folder public"
      : storageConfig?.provider === "google_drive"
        ? storageConfig?.externalUrl || "mode manual Google Drive"
        : storageConfig?.provider === "google_form"
          ? storageConfig?.externalUrl || "mode manual Google Form"
          : "storage utama sistem";
  const storageBadgeClass =
    storageConfig?.provider === "public"
      ? "bg-blue-600 text-white"
      : storageConfig?.provider === "google_drive"
        ? "bg-violet-600 text-white"
        : storageConfig?.provider === "google_form"
          ? "bg-orange-600 text-white"
          : "bg-emerald-600 text-white";
  const isExternalFormMode = storageConfig?.provider === "google_form";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "pdf" | "raw") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      if (type === "pdf") {
        const res = await uploadAnalysisPDF(id, formData);
        if (!res.success) throw new Error(res.error || "Gagal mengunggah berkas analisis");
        toast.success("Laporan lab berhasil diunggah.");
        setAnalysis((prev: any) => ({ ...prev, result_pdf_url: res.url }));
      } else {
        const res = await uploadRawData(id, formData);
        if (!res.success) throw new Error(res.error || "Gagal mengunggah data mentah");
        toast.success("Data mentah berhasil diunggah.");
        setAnalysis((prev: any) => ({ ...prev, raw_data_url: res.url }));
      }

      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Gagal mengunggah file");
    } finally {
      // Clear input
      e.target.value = "";
      setSubmitting(false);
    }
  };

  const handleDeleteFile = (type: "pdf" | "raw") => {
    if (!canWorkOnAnalysis) {
      toast.error("Form sudah dikunci. Tidak dapat menghapus berkas.");
      return;
    }
    setFileTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  const executeDeleteFile = async () => {
    if (!fileTypeToDelete) return;
    
    setSubmitting(true);
    setDeleteDialogOpen(false);
    try {
      const res = await deleteAnalysisFile(id, fileTypeToDelete);
      if (!res.success) throw new Error(res.error || "Gagal menghapus berkas");
      
      toast.success("Berkas berhasil dihapus.");
      if (fileTypeToDelete === "pdf") {
        setAnalysis((prev: any) => ({ ...prev, result_pdf_url: null }));
      } else {
        setAnalysis((prev: any) => ({ ...prev, raw_data_url: null }));
      }
      
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Gagal menghapus berkas");
    } finally {
      setSubmitting(false);
      setFileTypeToDelete(null);
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const result = await saveAnalysisResults(id, {
        analysis_notes: analysisNotes,
      });
      if (!result.success) {
        throw new Error(result.error || "Gagal menyimpan draft");
      }
      toast.success("Draft analisis berhasil disimpan.");
    } catch (error: any) {
      toast.error(error?.message || "Gagal menyimpan draft");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    const hasWorksheetData = Boolean(analysisNotes.trim());
    const hasLabPdf = Boolean(analysis?.result_pdf_url || job?.lab_analysis?.result_pdf_url);
    const hasRawData = Boolean(analysis?.raw_data_url || job?.lab_analysis?.raw_data_url);

    if (!hasLabPdf || !hasWorksheetData || !hasRawData) {
      toast.error("Lengkapi laporan PDF, data mentah, dan catatan analisis sebelum mengirim ke Reporting.");
      return;
    }

    setSubmitting(true);
    try {
      const saveResult = await saveAnalysisResults(id, {
        analysis_notes: analysisNotes,
      });
      if (!saveResult.success) {
        throw new Error(saveResult.error || "Gagal menyimpan data analisis");
      }

      const completeResult = await completeAnalysis(id);
      if (!completeResult.success) {
        throw new Error(completeResult.error || "Gagal mengirim data ke Reporting");
      }

      toast.success("Data analisis berhasil dikirim ke tim Reporting.");
      setConfirmDialogOpen(false);
      router.push("/analyst/jobs");
    } catch (error: any) {
      toast.error(error?.message || "Gagal mengirim hasil analisis");
    } finally {
      setSubmitting(false);
    }
  };

  const handleHandoverSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await createSampleHandover({
        job_order_id: id,
        sample_condition: handoverData.sample_condition,
        sample_qty: handoverData.sample_qty,
        notes: handoverData.sample_notes
      });
      if (result.error) throw new Error(result.error);
      toast.success("Sampel berhasil diterima dan BAST dibuat.");
      setHandoverDialogOpen(false);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Gagal serah terima");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><ChemicalLoader /></div>;
  if (!job) return <div className="p-10 text-center">Data tidak ditemukan.</div>;

  const currentStatus = statusConfig[job.status] || statusConfig.analysis;
  const labAnalysis = analysis || job.lab_analysis;
  const hasSampleHandover = Boolean(job.sample_handover?.id || job.sample_handover?.handover_number);
  const showReceiveSampleAction = !hasSampleHandover;
  const hasLabPdf = Boolean(labAnalysis?.result_pdf_url);
  const hasRawData = Boolean(labAnalysis?.raw_data_url);
  const hasWorksheetData = Boolean(analysisNotes.trim());
  const canSendToReporting = Boolean(hasSampleHandover && hasLabPdf && hasRawData && hasWorksheetData && job.status === "analysis");
  const perihalPengujian =
    job.quotation?.title?.trim() ||
    job.quotation?.items?.find((item: any) => item.parameter_snapshot)?.parameter_snapshot ||
    "Perihal pengujian belum diisi";
  const isTaskClaimed = job.analyst_id === profile?.id;
  // Form only editable if status is 'analysis' AND is claimed by this analyst
  const canWorkOnAnalysis = Boolean(hasSampleHandover && isTaskClaimed && job.status === "analysis");
  const showClaimAction = Boolean(hasSampleHandover && !isTaskClaimed && job.status === "analysis_ready");
  const travelOrderId = job.sampling_assignment?.travel_order?.id || null;
  const travelOrderNumber = job.sampling_assignment?.travel_order?.document_number || null;
  const samplingAttachmentPdfUrl = job.sampling_assignment?.signed_travel_order_url || null;

  const buildHandoverPdfData = () => {
    const source = handover || job.sample_handover || {};
    return {
      ...source,
      handover_number: source.handover_number || job.sample_handover?.handover_number,
      sample_qty: source.sample_qty || job.sample_handover?.sample_qty,
      sample_condition: source.sample_condition || job.sample_handover?.sample_condition,
      sample_notes: source.sample_notes || source.notes || job.sample_handover?.sample_notes,
      created_at: source.created_at || job.sample_handover?.created_at || job.analysis_started_at || job.updated_at || job.created_at,
      sender: source.sender || job.sample_handover?.sender || job.sampling_assignment?.field_officer,
      receiver: source.receiver || job.sample_handover?.receiver || profile,
      job_order: source.job_order || {
        tracking_code: job.tracking_code,
        quotation: job.quotation,
      },
    };
  };

  const handleClaimTask = async () => {
    setSubmitting(true);
    try {
      const result = await claimAnalysisJob(id);
      if (!result.success) {
        throw new Error(result.error || "Gagal mengambil tugas");
      }
      toast.success("Tugas analisis sudah Anda ambil. Fitur input dan upload sekarang aktif.");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Gagal mengonfirmasi ambil tugas");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartAnalysis = async () => {
    setSubmitting(true);
    try {
      const result = await startAnalysis(id);
      if (!result.success) {
        throw new Error(result.error || "Gagal memulai analisis");
      }
      toast.success("Analisis lab dimulai. Lengkapi data hasil pengujian sebelum dikirim.");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Gagal memulai analisis");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 pb-56 md:pb-10 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-700">
      <LoadingOverlay isOpen={submitting} title="Memproses Data Lab..." description="Sinkronisasi berkas dan hasil ke basis data WahfaLab" />

      {/* Ramping Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-start gap-4 w-full lg:w-auto">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push('/analyst/jobs')} 
            className="h-10 w-10 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
               <span className="font-mono text-xs font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded uppercase tracking-tighter">#{job.tracking_code}</span>
               {job.invoice?.invoice_number && <Badge className="bg-emerald-100 text-emerald-700 border-none text-[8px] font-black">{job.invoice.invoice_number}</Badge>}
             </div>
            <h1 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight font-[family-name:var(--font-montserrat)] leading-tight">
               Detail Pengerjaan Analis
            </h1>
            <p className="mt-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Tinjau sampel, lengkapi berkas, lalu kirim hasil ke reporting.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
           <div className="flex-1 lg:text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status Progres</p>
              <p className={cn("text-xs font-black uppercase tracking-tight", currentStatus.color)}>{currentStatus.label}</p>
           </div>
           <div className="h-10 w-10 bg-violet-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-violet-900/20">
              {profile?.full_name?.charAt(0)}
           </div>
        </div>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Client & Sampling Info */}
         <div className="order-2 lg:order-1 lg:col-span-3 space-y-6">
           <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="p-6 pb-2">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Identitas Klien</h3>
                 <CardTitle className="text-lg font-black text-slate-800 leading-tight">
                    {job.quotation?.profile?.company_name || job.quotation?.profile?.full_name}
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex items-center gap-3">
                       <User className="h-3 w-3 text-indigo-400" />
                       <span className="text-[10px] font-bold text-slate-500 uppercase">{job.quotation?.profile?.full_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <MapPin className="h-3 w-3 text-indigo-400" />
                       <span className="text-[10px] font-bold text-slate-500 uppercase truncate">{job.sampling_assignment?.location || "Lokasi Lab"}</span>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm rounded-[2rem] bg-white">
              <CardHeader className="p-6 pb-2">
                 <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Info Lapangan</h3>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                 <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                       <User className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                       <p className="text-[8px] font-black text-slate-400 uppercase leading-none">Petugas</p>
                       <p className="text-[10px] font-black text-slate-800 truncate uppercase mt-1">{job.sampling_assignment?.field_officer?.full_name}</p>
                    </div>
                 </div>

                 {job.sampling_assignment?.photos?.length > 0 && (
                   <div className="grid grid-cols-3 gap-2">
                      {job.sampling_assignment.photos.slice(0, 3).map((photo: any, idx: number) => (
                        <div key={idx} onClick={() => { setSelectedPhotos(job.sampling_assignment.photos); setPhotoDialogOpen(true); }} className="aspect-square rounded-xl overflow-hidden border border-slate-100 cursor-zoom-in group relative">
                           <img src={typeof photo === 'string' ? photo : photo.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="Sampling" />
                           {idx === 2 && job.sampling_assignment.photos.length > 3 && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-black text-xs">+{job.sampling_assignment.photos.length - 3}</div>
                           )}
                        </div>
                      ))}
                   </div>
                 )}
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="p-6 pb-2">
                 <h3 className="text-[10px] font-black text-sky-600 uppercase tracking-[0.2em]">Dokumen Sampling</h3>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-3">
                 <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                       <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                          <FileText className="h-4 w-4 text-sky-600" />
                       </div>
                       <div className="min-w-0 flex-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase leading-none">Surat Tugas Resmi</p>
                          <p className="text-[10px] font-black text-slate-800 uppercase mt-1 leading-tight">
                             {travelOrderNumber || "Belum Ada Nomor Surat"}
                          </p>
                          <p className="text-[9px] text-slate-500 font-bold mt-1">
                             Dokumen ini harus sama dengan surat tugas yang diterima petugas sampling.
                          </p>
                       </div>
                    </div>
                    {travelOrderId ? (
                      <Button
                        type="button"
                        onClick={() => window.open(`/analyst/travel-orders/${travelOrderId}/preview`, "_blank")}
                        className="w-full h-11 !bg-sky-700 hover:!bg-sky-800 !text-white !border !border-sky-600 font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-sm"
                      >
                         <span className="sm:hidden">Surat Tugas</span>
                         <span className="hidden sm:inline">{ANALYST_DETAIL_LABELS.travelOrder.view}</span>
                         <ExternalLink className="ml-2 h-3 w-3 shrink-0" />
                      </Button>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3">
                         <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight">
                           Record surat tugas belum tersedia pada assignment ini.
                         </p>
                      </div>
                    )}
                 </div>

                 <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                       <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                          <FileCheck className="h-4 w-4 text-emerald-600" />
                       </div>
                       <div className="min-w-0 flex-1">
                          <p className="text-[8px] font-black text-slate-400 uppercase leading-none">Lampiran PDF Sampling</p>
                          <p className="text-[10px] font-black text-slate-800 uppercase mt-1 leading-tight">
                             {samplingAttachmentPdfUrl ? "File pendukung tersedia" : "Belum ada upload dari sampling"}
                          </p>
                          <p className="text-[9px] text-slate-500 font-bold mt-1">
                             Ini file tambahan dari petugas lapangan, bukan sumber surat tugas resmi.
                          </p>
                       </div>
                    </div>
                    {samplingAttachmentPdfUrl ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.open(samplingAttachmentPdfUrl, "_blank")}
                        className="w-full h-11 rounded-2xl border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 font-black uppercase text-[10px] tracking-wide px-3"
                      >
                         <span className="sm:hidden">Lampiran</span>
                         <span className="hidden sm:inline">{ANALYST_DETAIL_LABELS.travelOrder.attachment}</span>
                         <ExternalLink className="ml-2 h-3 w-3 shrink-0" />
                      </Button>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3">
                         <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight">
                           Petugas sampling belum mengunggah PDF pendukung.
                         </p>
                      </div>
                    )}
                 </div>
              </CardContent>
           </Card>
         </div>

         {/* Middle Column: Scope & Lab Data */}
          <div className="order-3 lg:order-2 lg:col-span-6 space-y-6">
           <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="bg-emerald-50/60 p-6 border-b border-emerald-100">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-600 text-white">
                       <Layers className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-base font-black uppercase text-emerald-950 tracking-tight">{ANALYST_DETAIL_LABELS.sections.perihal}</CardTitle>
                       <CardDescription className="text-[9px] font-bold uppercase text-emerald-700/70 tracking-widest">
                          Konteks utama pengujian yang harus diacu analis
                       </CardDescription>
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                 <div className="rounded-[1.75rem] border border-emerald-100 bg-white p-5">
                    <p className="text-lg font-black text-slate-900 leading-tight">
                       {perihalPengujian}
                    </p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                       Sumber: perihal quotation / snapshot parameter sampling
                    </p>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    <Badge className="bg-emerald-100 text-emerald-700 border-none text-[9px] font-black uppercase px-3 py-1">
                       {job.quotation?.items?.length || 0} layanan aktif
                    </Badge>
                    <Badge className="bg-slate-100 text-slate-700 border-none text-[9px] font-black uppercase px-3 py-1">
                       {job.quotation?.quotation_number || "Tanpa nomor penawaran"}
                    </Badge>
                 </div>
              </CardContent>
           </Card>

            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
               <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="p-2 rounded-xl bg-violet-100 text-violet-600"><FlaskConical className="h-5 w-5" /></div>
                     <div>
                        <CardTitle className="text-base font-black uppercase text-slate-800 tracking-tight">{ANALYST_DETAIL_LABELS.sections.scope}</CardTitle>
                        <CardDescription className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Daftar layanan dan parameter dari penawaran</CardDescription>
                     </div>
                  </div>
                 <Badge className="bg-violet-600 text-white border-none text-[8px] font-black px-3 py-1 uppercase">{job.quotation?.items?.length} Layanan</Badge>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                          <tr>
                             <th className="px-6 py-4">Layanan</th>
                             <th className="px-6 py-4">Regulasi</th>
                             <th className="px-6 py-4 text-center">Unit</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {job.quotation?.items?.map((item: any, index: number) => (
                             <tr key={index} className="group hover:bg-slate-50/30 transition-colors">
                                <td className="px-6 py-4">
                                   <p className="text-xs font-black text-slate-800 leading-tight uppercase mb-1">{item.service?.name || "Layanan Lab"}</p>
                                   <div className="flex flex-wrap gap-1">
                                      {item.parameter_snapshot?.split(", ").map((p: string, i: number) => (
                                         <span key={i} className="text-[8px] font-bold text-violet-500 bg-violet-50 px-1.5 py-0.5 rounded uppercase">{p}</span>
                                      ))}
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg uppercase">
                                      {item.service?.regulation_ref?.name || "SOP Internal"}
                                   </span>
                                </td>
                                <td className="px-6 py-4 text-center font-black text-slate-700 text-xs">{item.qty} {item.service?.unit || "Unit"}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </CardContent>
           </Card>

            <Card className={cn("border-none shadow-sm rounded-[2.5rem] bg-white", !canWorkOnAnalysis && "opacity-60")}>
               <CardHeader className="p-6">
                  <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                     <ClipboardCheck className="h-4 w-4 text-emerald-600" /> {ANALYST_DETAIL_LABELS.sections.worksheet}
                  </h3>
               </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan Teknis Pengujian / Hasil Sementara</Label>
                     <Textarea 
                       value={analysisNotes} 
                       onChange={(e) => setAnalysisNotes(e.target.value)}
                       disabled={!canWorkOnAnalysis}
                       className="rounded-2xl bg-slate-50 border-none min-h-[200px] text-xs font-medium focus-visible:ring-violet-500 p-6"
                       placeholder="Input narasi hasil pengujian sementara atau catatan lab di sini..."
                     />
                  </div>
                  {!canWorkOnAnalysis && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 flex items-start gap-3">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold uppercase leading-tight text-amber-800">
                        Lembar kerja dikunci sampai analis mengonfirmasi ambil tugas.
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end pt-4">
                     <Button onClick={handleSave} disabled={submitting || !canWorkOnAnalysis} className="h-12 bg-white hover:bg-slate-50 text-slate-800 font-black uppercase text-[10px] tracking-wide rounded-xl border-2 border-slate-100 shadow-sm flex items-center gap-2 px-5 md:px-8">
                        <Save className="h-4 w-4 shrink-0" /> Simpan Catatan
                     </Button>
                  </div>
               </CardContent>
            </Card>
        </div>

         {/* Right Column: Uploads & Actions */}
          <div className="order-1 lg:order-3 lg:col-span-3 flex flex-col gap-6">
            {showReceiveSampleAction && (
              <Card className="order-1 lg:hidden border-none rounded-[2rem] overflow-hidden bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-2xl shadow-amber-950/20">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center shrink-0">
                      <PackageCheck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black uppercase tracking-widest leading-none">Terima Sampel</p>
                      <p className="mt-1 text-[9px] font-bold text-amber-100 uppercase truncate">BAST wajib sebelum analisis</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setHandoverDialogOpen(true)}
                    disabled={submitting}
                    className="w-full h-12 rounded-2xl !bg-white hover:!bg-amber-50 !text-amber-800 font-black uppercase text-[10px] tracking-widest shadow-lg"
                  >
                    Terima Sampel Sekarang <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

           {/* Upload Zone Premium */}
            <Card className={cn("order-3 lg:order-1 border-none shadow-sm rounded-[2.5rem] bg-indigo-950 text-white overflow-hidden", !canWorkOnAnalysis && "opacity-60")}>
              <CardHeader className="p-6 pb-2">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-900 border border-indigo-800"><Upload className="h-5 w-5 text-indigo-400" /></div>
                    <div className="space-y-1">
                       <CardTitle className="text-sm font-black uppercase tracking-tight">{ANALYST_DETAIL_LABELS.sections.uploads}</CardTitle>
                      {storageConfig && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={cn("border border-white/10 text-[8px] font-black uppercase px-2.5 py-1 rounded-full", storageBadgeClass)}>
                            Mode: {storageLabel}
                          </Badge>
                          <span className="text-[8px] font-bold text-indigo-200/70 uppercase tracking-wider break-all">{storageHint}</span>
                        </div>
                      )}
                      {isExternalFormMode && (
                        <div className="mt-3 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-3 space-y-2">
                          <p className="text-[9px] font-black text-orange-100 uppercase tracking-widest">
                            Mode form eksternal aktif
                          </p>
                          <p className="text-[10px] text-orange-100/80 font-medium">
                            Upload langsung dinonaktifkan. Gunakan form admin untuk mengirim file atau link pendukung.
                          </p>
                          {storageConfig?.externalUrl && (
                            <Button
                              type="button"
                              onClick={() => window.open(storageConfig.externalUrl, "_blank")}
                              className="h-9 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-[9px] uppercase tracking-wide px-3"
                            >
                              <span className="sm:hidden">Form</span>
                              <span className="hidden sm:inline">{ANALYST_DETAIL_LABELS.travelOrder.form}</span>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                 <div className="space-y-4">
                    {/* PDF Upload */}
                    <div className="group relative">
                       <Label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 block">Laporan PDF</Label>
                       <div className="flex items-center gap-2">
                          <div className="flex-1 relative">
                              <Input 
                                type="file" accept=".pdf"
                                onChange={(e) => handleFileUpload(e, "pdf")}
                                disabled={isExternalFormMode || !canWorkOnAnalysis || !!analysis?.result_pdf_url}
                                className={cn(
                                  "border-none text-[10px] file:border-none file:rounded-lg file:mr-2 file:px-2 file:py-1 cursor-pointer h-10",
                                  isExternalFormMode || !canWorkOnAnalysis || !!analysis?.result_pdf_url ? "bg-slate-800/50 text-slate-400 file:bg-slate-700 file:text-slate-500 cursor-not-allowed opacity-80" : "bg-indigo-900/50 text-indigo-200 file:bg-indigo-600 file:text-white"
                                )}
                              />
                             {analysis?.result_pdf_url && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                   <div className="h-6 w-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-lg"><FileCheck className="h-3 w-3" /></div>
                                   <Link href={analysis.result_pdf_url} target="_blank" className="text-white hover:text-indigo-300 transition-colors"><Eye className="h-4 w-4" /></Link>
                                   <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleDeleteFile("pdf")}
                                      className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg"
                                   >
                                      <Trash2 className="h-4 w-4" />
                                   </Button>
                                </div>
                             )}
                          </div>
                       </div>
                    </div>

                    {/* Raw Data Upload */}
                    <div className="group relative">
                       <Label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 block">Data Mentah / Foto</Label>
                       <div className="flex items-center gap-2">
                          <div className="flex-1 relative">
                              <Input 
                                type="file" accept="image/*,.pdf"
                                onChange={(e) => handleFileUpload(e, "raw")}
                                disabled={isExternalFormMode || !canWorkOnAnalysis || !!analysis?.raw_data_url}
                                className={cn(
                                  "border-none text-[10px] file:border-none file:rounded-lg file:mr-2 file:px-2 file:py-1 cursor-pointer h-10",
                                  isExternalFormMode || !canWorkOnAnalysis || !!analysis?.raw_data_url ? "bg-slate-800/50 text-slate-400 file:bg-slate-700 file:text-slate-500 cursor-not-allowed opacity-80" : "bg-indigo-900/50 text-indigo-200 file:bg-indigo-600 file:text-white"
                                )}
                              />
                             {analysis?.raw_data_url && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                   <div className="h-6 w-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-lg"><FileCheck className="h-3 w-3" /></div>
                                   <Link href={analysis.raw_data_url} target="_blank" className="text-white hover:text-indigo-300 transition-colors"><Eye className="h-4 w-4" /></Link>
                                   <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => handleDeleteFile("raw")}
                                      className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg"
                                   >
                                      <Trash2 className="h-4 w-4" />
                                   </Button>
                                </div>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
              </CardContent>
           </Card>

           {/* Main Action Hub */}
           <Card className="order-2 lg:order-2 border-none shadow-2xl shadow-emerald-900/5 rounded-[2.5rem] bg-white">
              <CardContent className="p-8 space-y-6 text-center">
                  <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center justify-center gap-2 mb-4">
                     <Activity className="h-4 w-4 text-emerald-600" /> Operasional Lab
                  </h3>
                  
                  {showReceiveSampleAction ? (
                    <div className="space-y-4">
                       <div className="p-6 bg-amber-50 rounded-[2rem] border-2 border-amber-100">
                          <AlertCircle className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                          <h4 className="text-xs font-black text-amber-900 uppercase leading-tight mb-2">Peringatan SOP</h4>
                          <p className="text-[9px] text-amber-700 font-bold uppercase leading-relaxed">Lakukan serah terima (BAST) sebelum memulai analisis.</p>
                       </div>
                        <Button 
                          onClick={() => setHandoverDialogOpen(true)}
                          className="w-full min-h-16 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-wide rounded-2xl shadow-xl shadow-amber-900/20 flex items-center justify-center gap-3 transition-all active:scale-95 px-4 py-3 text-[10px] md:text-xs"
                        >
                           <span className="sm:hidden">{ANALYST_DETAIL_LABELS.travelOrder.receiveShort}</span>
                           <span className="hidden sm:inline">{ANALYST_DETAIL_LABELS.travelOrder.receive}</span>
                           <PackageCheck className="h-5 w-5 md:h-6 md:w-6 shrink-0" />
                        </Button>
                    </div>
                  ) : (
                     <div className="space-y-4">
                        {!isTaskClaimed && (
                          <div className="space-y-4">
                            <div className="p-6 bg-sky-50 rounded-[2rem] border-2 border-sky-100">
                              <ClipboardCheck className="h-8 w-8 text-sky-700 mx-auto mb-3" />
                              <h4 className="text-xs font-black text-sky-900 uppercase leading-tight mb-2">{ANALYST_DETAIL_LABELS.travelOrder.claim}</h4>
                              <p className="text-[9px] text-sky-700 font-bold uppercase leading-relaxed">
                                Sebelum mulai analisis atau upload hasil, analis wajib mengambil tugas ini terlebih dahulu.
                              </p>
                            </div>
                            {showClaimAction ? (
                              <Button
                                onClick={handleClaimTask}
                                disabled={submitting}
                                className="w-full min-h-16 bg-sky-700 hover:bg-sky-800 text-white font-black uppercase tracking-wide text-[10px] md:text-xs rounded-2xl shadow-xl shadow-sky-900/20 flex items-center justify-center gap-2 px-4 py-3"
                              >
                                <span className="sm:hidden">{ANALYST_DETAIL_LABELS.travelOrder.claimShort}</span>
                                <span className="hidden sm:inline">{ANALYST_DETAIL_LABELS.travelOrder.claim}</span>
                                <ClipboardCheck className="h-5 w-5 shrink-0" />
                              </Button>
                            ) : (
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                <Info className="h-4 w-4 text-slate-500 shrink-0" />
                                <p className="text-[9px] text-slate-600 font-bold uppercase leading-tight text-left">
                                  Tugas ini belum bisa diambil dari akun ini atau sudah diambil analis lain.
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="p-6 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100 space-y-4">
                          <div className="flex items-center justify-center gap-3">
                             <ShieldCheck className="h-5 w-5 text-emerald-600" />
                             <span className="text-xs font-black text-emerald-950 uppercase tracking-tight">BAST Tervalidasi</span>
                          </div>
                          <Button 
                            variant="outline"
                            onClick={async () => {
                               const doc = <SampleHandoverPDF data={buildHandoverPdfData()} company={companyProfile} />;
                               const blob = await pdf(doc).toBlob();
                               const url = URL.createObjectURL(blob);
                               window.open(url, '_blank');
                             }}
                            className="w-full rounded-xl border-emerald-200 text-emerald-700 font-black text-[9px] uppercase h-10 bg-white hover:bg-emerald-50 transition-colors tracking-wide px-3"
                          >
                             {ANALYST_DETAIL_LABELS.travelOrder.bast} <Download className="ml-2 h-3 w-3 shrink-0" />
                          </Button>
                       </div>

                         {job.status === 'analysis_ready' ? (
                            <Button 
                              onClick={handleStartAnalysis}
                              disabled={submitting || !canWorkOnAnalysis}
                              className="w-full min-h-16 bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-wide text-[10px] md:text-xs rounded-2xl shadow-xl shadow-violet-900/20 flex items-center justify-center gap-2 px-4 py-3"
                            >
                               <span className="sm:hidden">{ANALYST_DETAIL_LABELS.travelOrder.startShort}</span>
                               <span className="hidden sm:inline">{ANALYST_DETAIL_LABELS.travelOrder.start}</span>
                               <FlaskConical className="h-5 w-5 shrink-0" />
                            </Button>
                        ) : ["analysis_done", "reporting", "completed"].includes(job.status) ? (
                           <div className="space-y-3">
                              <Button 
                                disabled
                                className="w-full min-h-16 bg-slate-100 text-emerald-600 font-black uppercase tracking-wide text-[10px] md:text-xs rounded-2xl border-2 border-emerald-100 flex items-center justify-center gap-2 px-4 py-3"
                              >
                                 <CheckCircle className="h-5 w-5 shrink-0" />
                                 <span className="sm:hidden truncate">{ANALYST_DETAIL_LABELS.travelOrder.sentShort}</span>
                                 <span className="hidden sm:inline truncate">{ANALYST_DETAIL_LABELS.travelOrder.sent}</span>
                              </Button>
                             <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                                <Info className="h-4 w-4 text-emerald-600 shrink-0" />
                                <p className="text-[9px] text-emerald-700 font-bold uppercase leading-tight text-left">Data pengujian telah diteruskan ke tim Reporting untuk proses penerbitan LHU.</p>
                             </div>
                          </div>
                        ) : (
                           <div className="space-y-3">
                              <Button 
                                onClick={() => setConfirmDialogOpen(true)}
                                disabled={submitting || !canSendToReporting || !canWorkOnAnalysis}
                                className="w-full min-h-16 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500 text-white font-black uppercase tracking-wide text-[10px] md:text-xs rounded-2xl shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 px-4 py-3"
                              >
                                 {canSendToReporting ? (
                                   <>
                                      <span className="sm:hidden truncate">{ANALYST_DETAIL_LABELS.travelOrder.sendShort}</span>
                                      <span className="hidden sm:inline truncate">{ANALYST_DETAIL_LABELS.travelOrder.send}</span>
                                   </>
                                 ) : (
                                   <>
                                      <span className="sm:hidden truncate">Lengkapi</span>
                                     <span className="hidden sm:inline truncate">Lengkapi Data Sebelum Kirim</span>
                                   </>
                                 )}
                                 <Send className="h-5 w-5 shrink-0" />
                              </Button>
                              {!canSendToReporting && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                   <Info className="h-4 w-4 text-slate-500 shrink-0" />
                                   <p className="text-[9px] text-slate-600 font-bold uppercase leading-tight text-left">
                                     {!hasLabPdf
                                       ? "Unggah laporan PDF lab terlebih dahulu."
                                       : !hasRawData
                                         ? "Unggah data mentah / foto hasil lab terlebih dahulu."
                                         : !hasWorksheetData
                                           ? "Isi catatan teknis pengujian terlebih dahulu."
                                           : "Job belum siap dikirim ke Reporting."}
                                   </p>
                                </div>
                              )}
                           </div>
                        )}
                    </div>
                 )}
              </CardContent>
           </Card>
        </div>
      </div>

      {/* Handover Dialog */}
      {showReceiveSampleAction && (
        <div className="fixed inset-x-0 bottom-[6.25rem] z-[80] md:hidden px-4 pb-2 pt-4 bg-gradient-to-t from-white via-white/95 to-white/0 pointer-events-none">
          <div className="rounded-[1.75rem] bg-gradient-to-br from-amber-600 to-orange-700 p-3 shadow-2xl shadow-amber-950/25 border border-amber-300/40">
            <div className="flex items-center gap-3 pointer-events-auto">
              <div className="h-11 w-11 rounded-2xl bg-white/20 border border-white/25 text-white flex items-center justify-center shrink-0">
                <PackageCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                  Terima Sampel
                </p>
                <p className="mt-1 text-[9px] font-bold text-amber-100 uppercase truncate">
                  BAST wajib sebelum analisis
                </p>
              </div>
              <Button
                onClick={() => setHandoverDialogOpen(true)}
                disabled={submitting}
                className="h-11 rounded-2xl !bg-white hover:!bg-amber-50 !text-amber-800 font-black uppercase text-[9px] tracking-widest px-4 shadow-lg"
              >
                Terima
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={handoverDialogOpen} onOpenChange={setHandoverDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-amber-600 p-8 text-white text-center relative overflow-hidden">
             <div className="relative z-10 space-y-4">
                <div className="h-16 w-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto border border-white/30 shadow-inner">
                   <PackageCheck className="h-8 w-8 text-white" />
                </div>
                <div>
                   <DialogTitle className="text-xl font-black uppercase tracking-tight">Berita Acara Serah Terima</DialogTitle>
                   <p className="text-amber-100 text-[10px] font-bold uppercase mt-1 tracking-widest">Validasi Sampel Lapangan ke Lab</p>
                </div>
             </div>
          </div>
          <div className="p-8 bg-white space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Kondisi Sampel</Label>
                   <Select value={handoverData.sample_condition} onValueChange={(val) => setHandoverData({...handoverData, sample_condition: val})}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100">
                         <SelectItem value="Segel Utuh">Segel Utuh</SelectItem>
                         <SelectItem value="Suhu Terjaga">Suhu Terjaga</SelectItem>
                         <SelectItem value="Rusak/Cacat">Rusak/Cacat</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Volume/Qty</Label>
                   <Input type="number" value={handoverData.sample_qty} onChange={(e) => setHandoverData({...handoverData, sample_qty: parseInt(e.target.value)})} className="h-12 rounded-xl bg-slate-50 border-none font-black text-xs" />
                </div>
             </div>
             <Textarea value={handoverData.sample_notes} onChange={(e) => setHandoverData({...handoverData, sample_notes: e.target.value})} className="rounded-2xl bg-slate-50 border-none min-h-[100px] font-medium text-xs p-4" placeholder="Catatan penerimaan..." />
             <Button onClick={handleHandoverSubmit} disabled={submitting} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] md:text-xs rounded-2xl shadow-xl shadow-emerald-900/20 gap-3 tracking-wide px-4">
                <span className="sm:hidden">Simpan Penerimaan</span>
                <span className="hidden sm:inline">Simpan Penerimaan Sampel</span>
                <ShieldCheck className="h-5 w-5 shrink-0" />
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-950 p-10 text-white text-center relative overflow-hidden">
             <div className="relative z-10 space-y-4">
                <div className="h-16 w-16 rounded-3xl bg-emerald-600 flex items-center justify-center mx-auto shadow-2xl border-4 border-emerald-800"><Send className="h-8 w-8 text-white" /></div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">{ANALYST_DETAIL_LABELS.travelOrder.send}?</DialogTitle>
                <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]">Verifikasi Kelengkapan Berkas</p>
             </div>
          </div>
          <div className="p-8 bg-white space-y-6">
             <div className="space-y-3">
                <div className={cn("p-4 rounded-2xl border flex items-center justify-between", hasLabPdf ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100")}>
                   <div className="flex items-center gap-3">
                      <FileText className={cn("h-4 w-4", hasLabPdf ? "text-emerald-600" : "text-slate-300")} />
                      <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">Laporan Lab (PDF)</span>
                   </div>
                   {hasLabPdf ? <Badge className="bg-emerald-500 text-white text-[8px] px-3">SIAP</Badge> : <Badge variant="outline" className="text-[8px] px-3">KOSONG</Badge>}
                </div>
                <div className={cn("p-4 rounded-2xl border flex items-center justify-between", hasRawData ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100")}>
                   <div className="flex items-center gap-3">
                      <Camera className={cn("h-4 w-4", hasRawData ? "text-emerald-600" : "text-slate-300")} />
                      <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">Data Mentah / Foto</span>
                   </div>
                   {hasRawData ? <Badge className="bg-emerald-500 text-white text-[8px] px-3">SIAP</Badge> : <Badge variant="outline" className="text-[8px] px-3">KOSONG</Badge>}
                </div>
                <div className={cn("p-4 rounded-2xl border flex items-center justify-between", hasWorksheetData ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100")}>
                   <div className="flex items-center gap-3">
                      <Beaker className={cn("h-4 w-4", hasWorksheetData ? "text-emerald-600" : "text-slate-300")} />
                      <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">Catatan Analisis</span>
                   </div>
                   {hasWorksheetData ? <Badge className="bg-emerald-500 text-white text-[8px] px-3">LENGKAP</Badge> : <Badge variant="outline" className="text-[8px] px-3">INPUT</Badge>}
                </div>
             </div>
             <p className="text-center text-slate-500 text-[10px] leading-relaxed font-bold uppercase tracking-tight italic">
                Pastikan seluruh data riil telah sesuai. Setelah dikirim, data analisis akan diteruskan ke tim Reporting.
             </p>
             <Button onClick={handleComplete} disabled={submitting || !canSendToReporting || !canWorkOnAnalysis} className="w-full min-h-16 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500 text-white font-black uppercase tracking-wide text-[10px] md:text-xs rounded-2xl shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3 px-4 py-3">
                <span className="sm:hidden">Konfirmasi</span>
                <span className="hidden sm:inline">{ANALYST_DETAIL_LABELS.travelOrder.confirmSend}</span>
                <Send className="h-5 w-5 shrink-0" />
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Preview Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-4xl p-0 overflow-hidden bg-black/90 border-none rounded-[2rem]">
          <DialogTitle className="sr-only">Preview Foto Sampling</DialogTitle>
          <div className="relative min-h-[60vh] md:aspect-video flex flex-wrap justify-center gap-4 p-4 md:p-10 overflow-y-auto">
             <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20 z-50" onClick={() => setPhotoDialogOpen(false)}><X className="h-6 w-6" /></Button>
              {selectedPhotos.map((photo: any, idx: number) => (
                <div key={idx} className="w-full md:w-auto md:h-[400px] aspect-square rounded-2xl overflow-hidden border-4 border-white/10 bg-black/40">
                   <img src={typeof photo === 'string' ? photo : photo.url} className="w-full h-full object-contain" alt="Preview" />
                </div>
             ))}
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-rose-950 p-10 text-white text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-rose-600/20 to-transparent" />
             <div className="relative z-10 space-y-4">
                <div className="h-20 w-20 rounded-[2rem] bg-rose-500 flex items-center justify-center mx-auto shadow-2xl border-4 border-rose-900/50 animate-pulse">
                   <Trash2 className="h-10 w-10 text-white" />
                </div>
                <div>
                   <DialogTitle className="text-2xl font-black uppercase tracking-tight">Hapus Berkas?</DialogTitle>
                   <p className="text-rose-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Tindakan ini tidak dapat dibatalkan</p>
                </div>
             </div>
          </div>
          <div className="p-8 bg-white space-y-6">
             <div className="p-6 bg-rose-50 rounded-[2rem] border-2 border-rose-100 flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-rose-600 shrink-0" />
                <p className="text-[11px] text-rose-900 font-bold uppercase leading-relaxed">
                   Berkas <span className="text-rose-600 font-black">{fileTypeToDelete === "pdf" ? "Laporan Lab (PDF)" : "Data Mentah / Foto"}</span> akan dihapus permanen dari sistem dan penyimpanan cloud.
                </p>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <Button 
                   variant="outline" 
                   onClick={() => setDeleteDialogOpen(false)}
                   className="h-14 rounded-2xl border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50"
                >
                   Batal
                </Button>
                <Button 
                   onClick={executeDeleteFile}
                   className="h-14 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-rose-900/20 flex items-center justify-center gap-2"
                >
                   Ya, Hapus <Trash2 className="h-4 w-4" />
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
