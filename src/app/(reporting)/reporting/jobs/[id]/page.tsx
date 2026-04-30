"use client";

import React, { useEffect, useState, use, useCallback } from "react";
import { 
  getReportingJobById, 
  uploadLHUPDF, 
  publishLabReportWithLHU, 
  generateLHU,
  saveReportingResults,
  getRegulations,
  getRegulationDetail
} from "@/lib/actions/reporting";
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
  ArrowLeft, FileText, CheckCircle, Eye, Download, 
  Sparkles, X, FileCheck, ShieldCheck, Send, 
  Beaker, Printer, ChevronRight, ClipboardList, 
  Save, Plus, Trash2, AlertCircle, Activity, 
  Layers, Search, RefreshCw, Info, BookOpen, Copy
} from "lucide-react";
import Link from "next/link";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { pdf } from "@react-pdf/renderer";
import { LHUPDF } from "@/components/pdf/LHUPDF";
import { cn } from "@/lib/utils";
import { REPORTING_DETAIL_LABELS } from "@/lib/constants/workflow-copy";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any; progress: number }> = {
  analysis_done: { label: REPORTING_DETAIL_LABELS.status.analysisDone, color: 'text-amber-600', bg: 'bg-amber-50', icon: Beaker, progress: 85 },
  reporting: { label: REPORTING_DETAIL_LABELS.status.reporting, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: FileText, progress: 95 },
  completed: { label: REPORTING_DETAIL_LABELS.status.completed, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle, progress: 100 }
};

interface TestResult {
  service_name?: string;
  parameter: string;
  result: string;
  unit: string;
  method: string;
  limit?: string;
  qualification?: "pass" | "fail" | "na";
}

const buildInitialResultsFromQuotation = (jobOrder: any): TestResult[] => {
  const initialResults: TestResult[] = [];

  jobOrder?.quotation?.items
    ?.filter((item: any) => item.service_id || item.service)
    .forEach((item: any) => {
      const serviceName = item.service?.name || "Layanan Lab";
      const method = item.service?.regulation_ref?.name || item.service?.regulation || "SOP Internal";
      const params = item.parameter_snapshot
        ? item.parameter_snapshot.split(",").map((p: string) => p.trim()).filter(Boolean)
        : [serviceName];

      params.forEach((parameter: string) => {
        initialResults.push({
          service_name: serviceName,
          parameter,
          result: "",
          unit: item.service?.unit || "",
          method,
          limit: "",
          qualification: "na",
        });
      });
    });

  return initialResults;
};

const getFileName = (url?: string) => {
  if (!url) return "";
  const cleanUrl = url.split("?")[0];
  return decodeURIComponent(cleanUrl.split("/").pop() || "file-analis");
};

const isImageFile = (url?: string) => /\.(png|jpe?g|webp|gif)$/i.test(url?.split("?")[0] || "");

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const validateReportingDraft = (results: TestResult[], jobOrder: any) => {
  const issues: string[] = [];
  const activeResults = results.filter((item) =>
    [item.service_name, item.parameter, item.result, item.unit, item.method, item.limit].some((value) => String(value || "").trim())
  );

  if (activeResults.length === 0) {
    issues.push("Minimal satu parameter LHU harus tersedia.");
  }

  activeResults.forEach((item, index) => {
    const row = `Baris ${index + 1}`;
    if (!item.service_name?.trim()) issues.push(`${row}: layanan uji lab belum diisi.`);
    if (!item.parameter?.trim()) issues.push(`${row}: parameter belum diisi.`);
    if (!item.result?.trim()) issues.push(`${row}: hasil uji belum diisi.`);
    if (!item.unit?.trim()) issues.push(`${row}: satuan belum diisi.`);
    if (!item.method?.trim()) issues.push(`${row}: metode analisis belum diisi.`);
  });

  if (!jobOrder?.lab_analysis?.result_pdf_url) {
    issues.push("PDF hasil analis belum tersedia.");
  }

  if (!jobOrder?.lab_analysis?.raw_data_url) {
    issues.push("Data mentah analis belum tersedia.");
  }

  return issues;
};

export default function ReportingJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [regulations, setRegulations] = useState<any[]>([]);
  const [selectedReg, setSelectedReg] = useState<string>("");
  const [lhuNumber, setLhuNumber] = useState("");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [generatedLHU, setGeneratedLHU] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Results State
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [reportingNotes, setReportingNotes] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [data, regsData] = await Promise.all([
        getReportingJobById(id),
        getRegulations()
      ]);

      setRegulations(regsData || []);

      if (!data.success || !data.jobOrder) {
        toast.error("Gagal memuat data laporan");
        return;
      }
      const jobOrder = data.jobOrder;
      setJob(jobOrder);

      if (jobOrder.lab_analysis?.test_results && jobOrder.lab_analysis.test_results.length > 0) {
        setTestResults(jobOrder.lab_analysis.test_results);
      } else {
        setTestResults(buildInitialResultsFromQuotation(jobOrder));
      }

      setReportingNotes(jobOrder.notes || "");
      setLastSavedAt(jobOrder.lab_analysis?.updated_at || jobOrder.updated_at || jobOrder.created_at || null);
      setIsDirty(false);
    } catch (error) {
      toast.error("Kesalahan sinkronisasi data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleApplyRegulation = async (regId: string) => {
    if (job?.status === "completed") return;
    if (!regId || regId === "none") return;
    try {
      const detail = await getRegulationDetail(regId);
      if (detail && detail.parameters) {
        const updatedResults = [...testResults];
        
        detail.parameters.forEach((regParam: any) => {
          const index = updatedResults.findIndex(r => r.parameter.toLowerCase() === regParam.parameter.toLowerCase());
          if (index !== -1) {
            updatedResults[index] = {
              ...updatedResults[index],
              limit: regParam.standard_value,
              unit: regParam.unit || updatedResults[index].unit,
              method: regParam.method || updatedResults[index].method
            };
          } else {
            updatedResults.push({
              service_name: "Tambahan Regulasi",
              parameter: regParam.parameter,
              result: "",
              unit: regParam.unit || "",
              method: regParam.method || "",
              limit: regParam.standard_value,
              qualification: "na"
            });
          }
        });
        
        setTestResults(updatedResults);
        setIsDirty(true);
        toast.success(`Baku mutu dari ${detail.name} berhasil diterapkan`);
      }
    } catch (error) {
      toast.error("Gagal menerapkan baku mutu");
    }
  };

  const handleAddParameter = () => {
    if (job?.status === "completed") return;
    setTestResults([...testResults, { service_name: "", parameter: "", result: "", unit: "", method: "", limit: "", qualification: "na" }]);
    setIsDirty(true);
  };

  const handleDuplicateParameter = (index: number) => {
    if (job?.status === "completed") return;
    const source = testResults[index];
    if (!source) return;
    const duplicated = {
      ...source,
      parameter: `${source.parameter} Copy`,
      result: "",
    };

    setTestResults([
      ...testResults.slice(0, index + 1),
      duplicated,
      ...testResults.slice(index + 1),
    ]);
    setIsDirty(true);
  };

  const handleRemoveParameter = (index: number) => {
    if (job?.status === "completed") return;
    setTestResults(testResults.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const handleUpdateParameter = (index: number, field: keyof TestResult, value: string) => {
    if (job?.status === "completed") return;
    const updated = [...testResults];
    updated[index] = { ...updated[index], [field]: value };
    setTestResults(updated);
    setIsDirty(true);
  };

  const handleResetFromQuotation = () => {
    if (job?.status === "completed") return;
    if (!job) return;
    setTestResults(buildInitialResultsFromQuotation(job));
    setIsDirty(true);
    setResetDialogOpen(false);
    toast.success("Draft LHU dikembalikan dari data penawaran awal.");
  };

  const handleBackToJobs = () => {
    if (isDirty && !window.confirm("Ada perubahan draft yang belum disimpan. Tetap kembali ke daftar jobs?")) {
      return;
    }
    router.push("/reporting/jobs");
  };

  const handleSaveResults = async (options: { silent?: boolean } = {}) => {
    if (job?.status === "completed") {
      toast.info("LHU sudah diterbitkan. Data pekerjaan ini dikunci.");
      return false;
    }

    setSubmitting(true);
    try {
      const result = await saveReportingResults(id, {
        test_results: testResults,
        analysis_notes: reportingNotes
      });
      if (result.success) {
        if (!options.silent) toast.success("Draft reporting berhasil disimpan.");
        setLastSavedAt(new Date().toISOString());
        setIsDirty(false);
        await loadData();
        return true;
      } else {
        toast.error(result.error || "Gagal menyimpan hasil");
        return false;
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateLHU = async () => {
    if (job?.status === "completed") {
      if (job.certificate_url) {
        window.open(job.certificate_url, "_blank");
        return;
      }

      const result = await generateLHU(id);
      if (result.success && result.lhuData) {
        setLhuNumber(result.lhuNumber || job.lab_report?.report_number || "");
        setGeneratedLHU(result.lhuData);
        setPreviewDialogOpen(true);
      } else {
        toast.error(result.error || "Gagal membuka preview LHU");
      }
      return;
    }

    const issues = validateReportingDraft(testResults, job);
    if (issues.length > 0) {
      toast.error(`Lengkapi data sebelum preview: ${issues.slice(0, 3).join(" ")}`);
      return;
    }

    const saved = await handleSaveResults({ silent: true });
    if (!saved) return;

    setSubmitting(true);
    try {
      const result = await generateLHU(id);
      if (result.success && result.lhuNumber) {
        setLhuNumber(result.lhuNumber);
        setGeneratedLHU(result.lhuData);
        setPreviewDialogOpen(true);
        toast.success("Preview LHU berhasil disiapkan.");
      } else {
        toast.error(result.error || "Gagal generate LHU");
      }
    } catch (error: any) {
      toast.error("Gagal melakukan otomatisasi LHU");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishWithLHU = async () => {
    if (job?.status === "completed") {
      toast.info("LHU sudah diterbitkan.");
      return;
    }

    if (!generatedLHU) return;
    const issues = validateReportingDraft(testResults, job);
    if (issues.length > 0) {
      toast.error(`Publish dibatalkan: ${issues.slice(0, 3).join(" ")}`);
      return;
    }

    setSubmitting(true);
    try {
      const doc = <LHUPDF data={generatedLHU} />;
      const blob = await pdf(doc).toBlob();
      const formData = new FormData();
      formData.append("file", new File([blob], `LHU-${generatedLHU.lhu_number}.pdf`, { type: "application/pdf" }));
      
      const uploadResult = await uploadLHUPDF(id, formData);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Gagal mengunggah file LHU");
      }

      const publishResult = await publishLabReportWithLHU(id, uploadResult.url!, generatedLHU.lhu_number);
      if (!publishResult.success) {
        throw new Error(publishResult.error || "Gagal menerbitkan LHU");
      }

      toast.success(`LHU ${generatedLHU.lhu_number} berhasil diterbitkan.`);
      setIsDirty(false);
      router.push("/reporting/jobs");
    } catch (error: any) {
      toast.error(error?.message || "Gagal menerbitkan dokumen LHU");
    } finally {
      setSubmitting(false);
      setPreviewDialogOpen(false);
      setPublishDialogOpen(false);
    }
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><ChemicalLoader /></div>;
  if (!job) return <div className="p-10 text-center">Job reporting tidak ditemukan.</div>;

  const currentStatus = statusConfig[job.status] || statusConfig.reporting;
  const isPublished = job.status === "completed";
  const quotationItems = (job.quotation?.items || []).filter((item: any) => item.service_id || item.service);
  const draftIssues = isPublished ? [] : validateReportingDraft(testResults, job);
  const draftSummary = testResults.reduce(
    (summary, item) => {
      const serviceName = item.service_name?.trim() || "Tanpa Layanan";
      summary.services.add(serviceName);
      if (item.qualification === "pass") summary.pass += 1;
      if (item.qualification === "fail") summary.fail += 1;
      if (!item.qualification || item.qualification === "na") summary.na += 1;
      return summary;
    },
    { services: new Set<string>(), pass: 0, fail: 0, na: 0 }
  );
  const analystFiles = [
    {
      label: "PDF Hasil Analis",
      description: "File laporan hasil pengujian yang diunggah analis.",
      url: job.lab_analysis?.result_pdf_url,
      required: true,
    },
    {
      label: "Data Mentah Analis",
      description: "Data mentah, foto, atau dokumen pendukung dari analis.",
      url: job.lab_analysis?.raw_data_url,
      required: true,
    },
  ];

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
      <LoadingOverlay isOpen={submitting} title="Sinkronisasi Data LHU..." description="Menyimpan hasil pengujian rill ke sistem WahfaLab" />

      {/* Ramping Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleBackToJobs} 
            className="h-12 w-12 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
               <span className="font-mono text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl uppercase tracking-tighter">#{job.tracking_code}</span>
               <Badge className={cn("px-3 py-1 rounded-lg border-none font-black text-[9px] uppercase", currentStatus.bg, currentStatus.color)}>
                  {currentStatus.label}
               </Badge>
            </div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight font-[family-name:var(--font-montserrat)] leading-none">
               Reporting Precision Console
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex flex-col items-end gap-1 mr-4">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Auto-Fill Baku Mutu</label>
              <Select value={selectedReg} onValueChange={(val) => { setSelectedReg(val); handleApplyRegulation(val); }}>
                 <SelectTrigger disabled={isPublished} className="h-10 w-64 rounded-xl border-slate-200 bg-white font-bold text-xs disabled:opacity-60">
                    <SelectValue placeholder="Pilih regulasi acuan..." />
                 </SelectTrigger>
                 <SelectContent className="rounded-xl shadow-2xl">
                    <SelectItem value="none">Kosongkan Baku Mutu</SelectItem>
                    {regulations.map(r => (
                       <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                 </SelectContent>
              </Select>
           </div>
           <div className="h-12 w-[1px] bg-slate-100 mx-2" />
           <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-900/20">
              R
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Analyst Reference */}
        <div className="lg:col-span-3 space-y-6">
           <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden border border-slate-100">
              <CardHeader className="p-6 pb-2 border-b border-slate-50">
                 <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] flex items-center gap-2">
                    <AlertCircle className="h-3 w-3" /> Referensi Analis
                 </h3>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase">Kondisi Sampel</p>
                       <p className="text-[11px] font-bold text-slate-700 italic">"{job.lab_analysis?.sample_condition || 'Tidak dicatat'}"</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase">Alat Digunakan</p>
                       <p className="text-[11px] font-bold text-slate-700">
                          {Array.isArray(job.lab_analysis?.equipment_used) ? job.lab_analysis.equipment_used.join(", ") : "Standar Lab"}
                       </p>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-50">
                       <p className="text-[9px] font-black text-slate-400 uppercase">Catatan Teknis Analis</p>
                       <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 text-[11px] font-medium text-amber-900 leading-relaxed max-h-[200px] overflow-y-auto">
                          {job.lab_analysis?.analysis_notes || "Analis tidak meninggalkan catatan tambahan."}
                       </div>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden border border-slate-100">
              <CardHeader className="p-6 pb-2 border-b border-slate-50">
                 <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                    <FileCheck className="h-3 w-3" /> File Upload Analis
                 </h3>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                 {analystFiles.map((file) => (
                    <div key={file.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                       <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                             <p className="text-[10px] font-black text-slate-800 uppercase leading-tight">{file.label}</p>
                             <Badge className={cn("border-none text-[8px] font-black uppercase", file.url ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                                {file.url ? "Lengkap" : "Wajib"}
                             </Badge>
                          </div>
                          <p className="text-[9px] font-bold text-slate-500 uppercase leading-tight">{file.description}</p>
                       </div>
                       {file.url ? (
                          <div className="space-y-3">
                             {isImageFile(file.url) && (
                                <button
                                  type="button"
                                  onClick={() => window.open(file.url, "_blank")}
                                  className="block aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-white"
                                >
                                   <img src={file.url} alt={file.label} className="h-full w-full object-cover" />
                                </button>
                             )}
                             <div className="rounded-xl bg-white border border-slate-100 px-3 py-2">
                                <p className="truncate text-[9px] font-bold text-slate-500">{getFileName(file.url)}</p>
                             </div>
                             <Button
                               type="button"
                               onClick={() => window.open(file.url, "_blank")}
                               className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[9px] tracking-widest"
                             >
                                Buka File <Download className="ml-2 h-3 w-3" />
                             </Button>
                          </div>
                       ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2">
                             <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">Belum ada file tersimpan.</p>
                          </div>
                       )}
                    </div>
                 ))}
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="p-6 pb-2">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Customer</h3>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                 <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                    <p className="text-xs font-black text-slate-800 uppercase leading-tight">{job.quotation?.profile?.company_name || job.quotation?.profile?.full_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Verified Partner</p>
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Center: Main Input Table */}
        <div className="lg:col-span-9 space-y-6">
           <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden border border-slate-100">
              <CardHeader className="bg-emerald-50/60 p-6 border-b border-emerald-100 flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-black uppercase tracking-tight text-emerald-950">Data Penawaran Awal</CardTitle>
                    <CardDescription className="text-[9px] font-bold uppercase text-emerald-700/70 tracking-widest">
                      Nomor {job.quotation?.quotation_number || "-"} {job.invoice?.invoice_number ? `- Invoice ${job.invoice.invoice_number}` : ""}
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-emerald-600 text-white border-none text-[9px] font-black uppercase px-3 py-1">
                  {quotationItems.length} Item
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/70 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Layanan Uji Lab</th>
                        <th className="px-6 py-4">Parameter Awal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {quotationItems.map((item: any, index: number) => (
                        <tr key={item.id || index} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-xs font-black text-slate-800 uppercase leading-tight">
                              {item.service?.name || item.equipment?.name || "Layanan Lab"}
                            </p>
                            <p className="mt-1 text-[9px] font-bold uppercase text-slate-400">
                              {item.service?.regulation_ref?.name || item.service?.regulation || "SOP Internal"}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {(item.parameter_snapshot || item.service?.name || "Parameter Uji").split(",").map((param: string, idx: number) => (
                                <span key={idx} className="rounded-lg bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase text-emerald-700">
                                  {param.trim()}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-2xl shadow-indigo-900/5 rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-900/20">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight text-emerald-950">{REPORTING_DETAIL_LABELS.sections.results}</CardTitle>
                    <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Validasi hasil analis dan susun data final untuk sertifikat LHU</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                   <div className="hidden xl:flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2">
                     <Badge className="bg-indigo-50 text-indigo-700 border-none text-[8px] font-black uppercase">
                       {draftSummary.services.size} Layanan
                     </Badge>
                     <Badge className="bg-slate-100 text-slate-600 border-none text-[8px] font-black uppercase">
                       {testResults.length} Parameter
                     </Badge>
                     {draftSummary.pass > 0 && (
                       <Badge className="bg-emerald-100 text-emerald-700 border-none text-[8px] font-black uppercase">
                         {draftSummary.pass} Memenuhi
                       </Badge>
                     )}
                     {draftSummary.fail > 0 && (
                       <Badge className="bg-rose-100 text-rose-700 border-none text-[8px] font-black uppercase">
                         {draftSummary.fail} Tidak Memenuhi
                       </Badge>
                     )}
                   </div>
                   <Button 
                     type="button"
                     variant="outline"
                     onClick={() => setResetDialogOpen(true)}
                     disabled={isPublished}
                     className="rounded-xl border-slate-200 bg-white text-slate-600 font-black text-[10px] uppercase h-10 px-4"
                   >
                     <RefreshCw className="mr-2 h-3 w-3" /> Reset Awal
                   </Button>
                   <Button 
                     onClick={handleAddParameter}
                     disabled={isPublished}
                     className="rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase h-10 px-4 shadow-lg shadow-indigo-900/20"
                   >
                     <Plus className="mr-2 h-3 w-3" /> Tambah Layanan/Parameter
                   </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                 {isPublished && (
                   <div className="border-b border-emerald-100 bg-emerald-50/80 px-8 py-4">
                     <div className="flex items-start gap-3">
                       <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                       <div className="space-y-1">
                         <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800">LHU sudah diterbitkan</p>
                         <p className="text-[10px] font-bold uppercase leading-tight text-emerald-700">
                           Data hasil, catatan, dan struktur pekerjaan dikunci. Gunakan tombol preview untuk melihat dokumen yang sudah terbit.
                         </p>
                       </div>
                     </div>
                   </div>
                 )}
                 {!isPublished && draftIssues.length > 0 && (
                   <div className="border-b border-amber-100 bg-amber-50/70 px-8 py-4">
                     <div className="flex items-start gap-3">
                       <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                       <div className="space-y-2">
                         <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">Checklist sebelum preview LHU</p>
                         <div className="flex flex-wrap gap-2">
                           {draftIssues.slice(0, 5).map((issue) => (
                             <span key={issue} className="rounded-lg border border-amber-100 bg-white px-2 py-1 text-[9px] font-bold uppercase text-amber-800">
                               {issue}
                             </span>
                           ))}
                           {draftIssues.length > 5 && (
                             <span className="rounded-lg border border-amber-100 bg-white px-2 py-1 text-[9px] font-bold uppercase text-amber-800">
                               +{draftIssues.length - 5} lainnya
                             </span>
                           )}
                         </div>
                       </div>
                     </div>
                   </div>
                 )}
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                          <tr>
                             <th className="px-6 py-4">Layanan Uji Lab</th>
                             <th className="px-6 py-4">Parameter Pengujian</th>
                             <th className="px-4 py-4 w-[100px] text-center">Satuan</th>
                             <th className="px-4 py-4 w-[120px] text-center">Baku Mutu</th>
                             <th className="px-6 py-4 w-[140px] text-center text-indigo-600">Hasil Uji</th>
                             <th className="px-4 py-4 w-[140px] text-center">Status</th>
                             <th className="px-6 py-4">Metode Analisis</th>
                             <th className="px-4 py-4 w-[90px]"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {testResults.map((result, index) => {
                            const serviceName = result.service_name?.trim() || "Tanpa Layanan";
                            const previousService = testResults[index - 1]?.service_name?.trim() || "Tanpa Layanan";
                            const showServiceHeader = index === 0 || serviceName !== previousService;

                            return (
                             <React.Fragment key={`${serviceName}-${index}`}>
                              {showServiceHeader && (
                                <tr className="bg-indigo-50/60">
                                  <td colSpan={8} className="px-6 py-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge className="bg-indigo-600 text-white border-none text-[8px] font-black uppercase">
                                        Layanan
                                      </Badge>
                                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900">{serviceName}</span>
                                    </div>
                                  </td>
                                </tr>
                              )}
                              <tr className="group hover:bg-indigo-50/30 transition-colors">
                                <td className="px-6 py-3">
                                   <input 
                                     value={result.service_name || ""}
                                     onChange={(e) => handleUpdateParameter(index, "service_name", e.target.value)}
                                     disabled={isPublished}
                                     placeholder="Layanan uji"
                                     className="w-full bg-transparent border-none text-xs font-black text-slate-800 focus:ring-0 placeholder:text-slate-300 uppercase disabled:text-slate-500"
                                   />
                                </td>
                                <td className="px-6 py-3">
                                   <input 
                                     value={result.parameter}
                                     onChange={(e) => handleUpdateParameter(index, "parameter", e.target.value)}
                                     disabled={isPublished}
                                     placeholder="Parameter"
                                     className="w-full bg-transparent border-none text-xs font-black text-slate-800 focus:ring-0 placeholder:text-slate-300 uppercase disabled:text-slate-500"
                                   />
                                </td>
                                <td className="px-4 py-3">
                                   <input 
                                     value={result.unit}
                                     onChange={(e) => handleUpdateParameter(index, "unit", e.target.value)}
                                     disabled={isPublished}
                                     placeholder="Satuan"
                                     className="w-full h-9 bg-slate-50 rounded-lg px-2 border border-transparent text-[10px] font-bold text-slate-500 outline-none text-center disabled:opacity-70"
                                   />
                                </td>
                                <td className="px-4 py-3">
                                   <input 
                                     value={result.limit}
                                     onChange={(e) => handleUpdateParameter(index, "limit", e.target.value)}
                                     disabled={isPublished}
                                     placeholder="Limit"
                                     className="w-full h-9 bg-amber-50/50 rounded-lg px-2 border border-transparent text-[10px] font-black text-amber-700 outline-none text-center disabled:opacity-70"
                                   />
                                </td>
                                <td className="px-6 py-3">
                                   <input 
                                     value={result.result}
                                     onChange={(e) => handleUpdateParameter(index, "result", e.target.value)}
                                     disabled={isPublished}
                                     placeholder="Hasil Uji"
                                     className="w-full h-10 bg-indigo-50/50 rounded-xl px-3 border-2 border-indigo-100 focus:border-indigo-400 text-xs font-black text-indigo-700 outline-none text-center shadow-inner disabled:opacity-70"
                                   />
                                </td>
                                <td className="px-4 py-3">
                                   <Select
                                     value={result.qualification || "na"}
                                     onValueChange={(value: "pass" | "fail" | "na") => handleUpdateParameter(index, "qualification", value)}
                                     disabled={isPublished}
                                   >
                                     <SelectTrigger className={cn(
                                       "h-9 rounded-lg border-none text-[9px] font-black uppercase",
                                       (result.qualification || "na") === "pass" && "bg-emerald-50 text-emerald-700",
                                       result.qualification === "fail" && "bg-rose-50 text-rose-700",
                                       (result.qualification || "na") === "na" && "bg-slate-50 text-slate-500"
                                     )}>
                                       <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent className="rounded-xl">
                                       <SelectItem value="na">N/A</SelectItem>
                                       <SelectItem value="pass">Memenuhi</SelectItem>
                                       <SelectItem value="fail">Tidak Memenuhi</SelectItem>
                                     </SelectContent>
                                   </Select>
                                </td>
                                <td className="px-6 py-3">
                                   <input 
                                     value={result.method}
                                     onChange={(e) => handleUpdateParameter(index, "method", e.target.value)}
                                     disabled={isPublished}
                                     placeholder="Metode"
                                     className="w-full bg-transparent border-none text-[10px] font-medium text-slate-500 focus:ring-0 placeholder:text-slate-300 disabled:text-slate-500"
                                   />
                                </td>
                                <td className="px-4 py-3">
                                   <div className={cn("flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all", isPublished && "hidden")}>
                                      <button 
                                        type="button"
                                        onClick={() => handleDuplicateParameter(index)}
                                        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"
                                      >
                                         <Copy className="h-4 w-4" />
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => handleRemoveParameter(index)}
                                        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                                      >
                                         <Trash2 className="h-4 w-4" />
                                      </button>
                                   </div>
                                </td>
                              </tr>
                             </React.Fragment>
                            );
                          })}
                       </tbody>
                    </table>
                 </div>

                 <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1 w-full space-y-3">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan Tambahan LHU</Label>
                       <Textarea 
                         value={reportingNotes}
                         onChange={(e) => {
                           setReportingNotes(e.target.value);
                           setIsDirty(true);
                         }}
                         disabled={isPublished}
                         placeholder="Masukkan catatan khusus..."
                         className="min-h-[80px] rounded-2xl border-slate-200 p-4 font-medium text-xs bg-white disabled:opacity-70"
                       />
                       <div className="flex flex-wrap items-center gap-2">
                         <Badge className={cn("border-none text-[8px] font-black uppercase px-2 py-1", isDirty ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
                           {isPublished ? "LHU final terkunci" : isDirty ? "Perubahan belum disimpan" : "Draft tersimpan"}
                         </Badge>
                         <span className="text-[9px] font-bold uppercase text-slate-400">
                           Update terakhir: {formatDateTime(lastSavedAt)}
                         </span>
                       </div>
                    </div>
                    <div className="flex flex-col gap-3 min-w-[200px]">
                       <Button 
                         onClick={() => handleSaveResults()}
                         disabled={submitting || isPublished}
                         className="h-12 bg-white hover:bg-indigo-50 text-indigo-600 border-2 border-indigo-100 font-black uppercase text-[10px] tracking-widest rounded-xl px-8 shadow-sm flex items-center gap-3"
                       >
                          <Save className="h-4 w-4" /> {REPORTING_DETAIL_LABELS.actions.saveDraft}
                       </Button>
                       <Button 
                         onClick={handleGenerateLHU}
                         disabled={submitting}
                         className={cn(
                           "h-14 text-white font-black uppercase text-[10px] tracking-[2px] rounded-xl px-8 shadow-xl flex items-center gap-3",
                           draftIssues.length > 0
                             ? "bg-slate-400 hover:bg-slate-500 shadow-slate-900/10"
                             : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/20"
                         )}
                       >
                           {isPublished ? "Preview LHU Terbit" : REPORTING_DETAIL_LABELS.actions.preview} <Eye className="h-4 w-4" />
                       </Button>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-3xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-indigo-950 p-10 text-white text-center relative">
            <div className="relative z-10 space-y-2">
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">{REPORTING_DETAIL_LABELS.actions.generateTitle}</DialogTitle>
               <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">Digital Certificate Verification Ready</p>
            </div>
          </div>
          <div className="p-10 bg-white space-y-8">
             <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline"
                  onClick={async () => {
                     const doc = <LHUPDF data={generatedLHU} />;
                     const blob = await pdf(doc).toBlob();
                     const url = URL.createObjectURL(blob);
                     window.open(url, '_blank');
                  }}
                  className="h-16 rounded-2xl border-2 border-slate-100 font-black text-xs uppercase tracking-widest text-slate-600"
                >
                    <Printer className="h-4 w-4 mr-2" /> {REPORTING_DETAIL_LABELS.actions.viewDocument}
                </Button>
                <Button 
                  onClick={() => setPublishDialogOpen(true)}
                  disabled={submitting || isPublished}
                  className={cn(
                    "h-16 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-3",
                    isPublished
                      ? "bg-slate-400 shadow-slate-900/10"
                      : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20"
                  )}
                >
                    {isPublished ? "Sudah Diterbitkan" : REPORTING_DETAIL_LABELS.actions.publish} {isPublished ? <CheckCircle className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                 </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent className="rounded-[2rem] border-none p-8 shadow-2xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black uppercase text-slate-900">Reset Draft LHU?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-500">
              Semua baris hasil yang sedang diedit akan diganti ulang dari layanan dan parameter penawaran awal. File analis tidak berubah.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 pt-4">
            <AlertDialogCancel className="rounded-xl font-black uppercase text-[10px]">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetFromQuotation}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-[10px]"
            >
              Reset dari Penawaran
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent className="rounded-[2rem] border-none p-8 shadow-2xl sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <AlertDialogTitle className="text-center text-lg font-black uppercase text-slate-900">Publish LHU Final?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm font-medium text-slate-500">
              Sistem akan mengunggah PDF LHU, membuat record laporan final, dan menandai job sebagai selesai. Pastikan preview dokumen sudah sesuai.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-black text-slate-900">{draftSummary.services.size}</p>
                <p className="text-[8px] font-black uppercase text-slate-400">Layanan</p>
              </div>
              <div>
                <p className="text-lg font-black text-slate-900">{testResults.length}</p>
                <p className="text-[8px] font-black uppercase text-slate-400">Parameter</p>
              </div>
              <div>
                <p className="text-lg font-black text-rose-600">{draftSummary.fail}</p>
                <p className="text-[8px] font-black uppercase text-slate-400">Tidak Memenuhi</p>
              </div>
            </div>
          </div>
          <AlertDialogFooter className="gap-3 pt-4">
            <AlertDialogCancel className="rounded-xl font-black uppercase text-[10px]">Cek Lagi</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePublishWithLHU}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-[10px]"
            >
              Publish Final
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
