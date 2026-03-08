// ============================================================================
// PREMIUM REPORTING DETAIL - v4.1
// Optimized for direct result input with Analyst reference tracking.
// ============================================================================

"use client";

import React, { useEffect, useState, use, useCallback } from "react";
import { 
  getReportingJobById, 
  uploadLHUPDF, 
  publishLabReportWithLHU, 
  generateLHU,
  saveReportingResults
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
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  Eye, 
  Download, 
  Sparkles, 
  X,
  FileCheck,
  ShieldCheck,
  Send,
  History,
  Beaker,
  Printer,
  ChevronRight,
  ClipboardList,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  Activity,
  Layers,
  Search,
  RefreshCw,
  Info
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
import { pdf } from "@react-pdf/renderer";
import { LHUPDF } from "@/components/pdf/LHUPDF";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any; progress: number }> = {
  analysis_done: { label: 'Siap Laporan', color: 'text-amber-600', bg: 'bg-amber-50', icon: Beaker, progress: 85 },
  reporting: { label: 'Penyusunan LHU', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: FileText, progress: 95 },
  completed: { label: 'LHU Terbit (Selesai)', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle, progress: 100 }
};

interface TestResult {
  parameter: string;
  result: string;
  unit: string;
  method: string;
  limit?: string;
}

export default function ReportingJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [lhuNumber, setLhuNumber] = useState("");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [generatedLHU, setGeneratedLHU] = useState<any>(null);

  // Results State
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [reportingNotes, setReportingNotes] = useState("");

  const loadData = useCallback(async () => {
    try {
      const data = await getReportingJobById(id);
      if (!data.success || !data.jobOrder) {
        toast.error("Gagal memuat data laporan");
        return;
      }
      const jobOrder = data.jobOrder;
      setJob(jobOrder);

      // Initialize results
      // Priority 1: Already saved results by reporting
      if (jobOrder.lab_analysis?.test_results && jobOrder.lab_analysis.test_results.length > 0) {
        setTestResults(jobOrder.lab_analysis.test_results);
      } else {
        // Priority 2: Fallback to Quotation Items (SPLIT by parameters)
        const initialResults: TestResult[] = [];
        jobOrder.quotation?.items?.forEach((item: any) => {
          if (item.parameter_snapshot) {
            const params = item.parameter_snapshot.split(",").map((p: string) => p.trim());
            params.forEach((pName: string) => {
              if (pName) {
                initialResults.push({
                  parameter: pName,
                  result: "",
                  unit: item.service?.unit || "",
                  method: item.service?.regulation || item.service?.regulation_ref?.name || "SOP Internal",
                  limit: ""
                });
              }
            });
          } else {
            initialResults.push({
              parameter: item.service?.name || "Parameter Uji",
              result: "",
              unit: item.service?.unit || "",
              method: item.service?.regulation || item.service?.regulation_ref?.name || "SOP Internal",
              limit: ""
            });
          }
        });
        setTestResults(initialResults);
      }

      setReportingNotes(jobOrder.notes || "");
    } catch (error) {
      toast.error("Kesalahan sinkronisasi data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddParameter = () => {
    setTestResults([...testResults, { parameter: "", result: "", unit: "", method: "", limit: "" }]);
  };

  const handleRemoveParameter = (index: number) => {
    setTestResults(testResults.filter((_, i) => i !== index));
  };

  const handleUpdateParameter = (index: number, field: keyof TestResult, value: string) => {
    const updated = [...testResults];
    updated[index] = { ...updated[index], [field]: value };
    setTestResults(updated);
  };

  const handleSaveResults = async () => {
    setSubmitting(true);
    try {
      const result = await saveReportingResults(id, {
        test_results: testResults,
        analysis_notes: reportingNotes // We'll use this as reporting notes for LHU
      });
      if (result.success) {
        toast.success("✅ Hasil pengujian berhasil disimpan");
        loadData();
      } else {
        toast.error(result.error || "Gagal menyimpan hasil");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateLHU = async () => {
    await handleSaveResults();
    setSubmitting(true);
    try {
      const result = await generateLHU(id);
      if (result.success && result.lhuNumber) {
        setLhuNumber(result.lhuNumber);
        setGeneratedLHU(result.lhuData);
        setPreviewDialogOpen(true);
        toast.success("✅ LHU Berhasil Disusun!");
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
    if (!generatedLHU) return;
    setSubmitting(true);
    try {
      const doc = <LHUPDF data={generatedLHU} />;
      const blob = await pdf(doc).toBlob();
      const formData = new FormData();
      formData.append("file", new File([blob], `LHU-${generatedLHU.lhu_number}.pdf`, { type: 'application/pdf' }));
      
      const { uploadLHUPDF } = await import('@/lib/actions/reporting');
      const uploadResult = await uploadLHUPDF(id, formData);

      if (uploadResult.success) {
        const publishResult = await publishLabReportWithLHU(id, uploadResult.url!, generatedLHU.lhu_number);
        if (publishResult.success) {
          toast.success(`✅ LHU ${generatedLHU.lhu_number} Terbit & Selesai!`);
          router.push("/reporting");
        }
      }
    } catch (error: any) {
      toast.error("Gagal menerbitkan dokumen LHU");
    } finally {
      setSubmitting(false);
      setPreviewDialogOpen(false);
    }
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><ChemicalLoader /></div>;
  if (!job) return <div className="p-10 text-center">Laporan tidak ditemukan.</div>;

  const currentStatus = statusConfig[job.status] || statusConfig.reporting;

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
      <LoadingOverlay isOpen={submitting} title="Sinkronisasi Data LHU..." description="Menyimpan hasil pengujian rill ke sistem WahfaLab" />

      {/* Ramping Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push('/reporting')} 
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
        
        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
           <div className="px-4 text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Executor Account</p>
              <p className="text-xs font-bold text-slate-700 uppercase">Reporting Team</p>
           </div>
           <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-900/20">
              R
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Analyst Reference (The "Why" and "How") */}
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

                 {job.lab_analysis?.result_pdf_url && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(job.lab_analysis.result_pdf_url, '_blank')}
                      className="w-full h-12 rounded-2xl border-2 border-indigo-100 text-indigo-600 font-black text-[10px] uppercase tracking-widest bg-white hover:bg-indigo-50"
                    >
                       LIHAT LAPORAN ANALIS <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                 )}
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

        {/* Center: Main Input Table (The "Work") */}
        <div className="lg:col-span-6 space-y-6">
           <Card className="border-none shadow-2xl shadow-indigo-900/5 rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-900/20">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight text-emerald-950">Hasil Parameter Uji</CardTitle>
                    <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Input data rill untuk sertifikat LHU</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                   <Button 
                     onClick={() => loadData()}
                     variant="ghost"
                     size="icon"
                     className="h-10 w-10 rounded-xl text-slate-400 hover:text-indigo-600"
                   >
                     <RefreshCw className="h-4 w-4" />
                   </Button>
                   <Button 
                     onClick={handleAddParameter}
                     className="rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase h-10 px-4 shadow-lg shadow-indigo-900/20"
                   >
                     <Plus className="mr-2 h-3 w-3" /> Tambah Manual
                   </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                          <tr>
                             <th className="px-6 py-4">Parameter</th>
                             <th className="px-6 py-4 w-[120px]">Hasil Uji</th>
                             <th className="px-6 py-4 w-[100px]">Satuan</th>
                             <th className="px-6 py-4">Metode / Baku Mutu</th>
                             <th className="px-4 py-4 w-[50px]"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {testResults.map((result, index) => (
                             <tr key={index} className="group hover:bg-indigo-50/30 transition-colors">
                                <td className="px-6 py-3">
                                   <input 
                                     value={result.parameter}
                                     onChange={(e) => handleUpdateParameter(index, "parameter", e.target.value)}
                                     placeholder="Nama Parameter"
                                     className="w-full bg-transparent border-none text-xs font-black text-slate-800 focus:ring-0 placeholder:text-slate-300 uppercase"
                                   />
                                </td>
                                <td className="px-6 py-3">
                                   <input 
                                     value={result.result}
                                     onChange={(e) => handleUpdateParameter(index, "result", e.target.value)}
                                     placeholder="Hasil"
                                     className="w-full h-9 bg-indigo-50/50 rounded-lg px-3 border-2 border-transparent focus:border-indigo-200 text-xs font-black text-indigo-600 outline-none text-center"
                                   />
                                </td>
                                <td className="px-6 py-3">
                                   <input 
                                     value={result.unit}
                                     onChange={(e) => handleUpdateParameter(index, "unit", e.target.value)}
                                     placeholder="mg/L"
                                     className="w-full h-9 bg-slate-50 rounded-lg px-3 border border-transparent text-[10px] font-bold text-slate-500 outline-none text-center"
                                   />
                                </td>
                                <td className="px-6 py-3">
                                   <input 
                                     value={result.method}
                                     onChange={(e) => handleUpdateParameter(index, "method", e.target.value)}
                                     placeholder="Metode Pengujian"
                                     className="w-full bg-transparent border-none text-[10px] font-medium text-slate-500 focus:ring-0 placeholder:text-slate-300"
                                   />
                                </td>
                                <td className="px-4 py-3">
                                   <button 
                                     onClick={() => handleRemoveParameter(index)}
                                     className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                   >
                                      <Trash2 className="h-4 w-4" />
                                   </button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>

                 {testResults.length === 0 && (
                    <div className="p-20 text-center">
                       <Layers className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Belum ada parameter terdaftar</p>
                    </div>
                 )}

                 <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                    <div className="flex flex-col gap-3">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan Tambahan LHU (Opsional)</Label>
                       <Textarea 
                         value={reportingNotes}
                         onChange={(e) => setReportingNotes(e.target.value)}
                         placeholder="Masukkan catatan hukum atau teknis yang akan muncul di dokumen LHU..."
                         className="min-h-[100px] rounded-3xl border-2 border-slate-100 p-6 font-medium text-xs text-slate-600 focus:border-indigo-200 bg-white"
                       />
                    </div>
                    <div className="mt-6 flex justify-end">
                       <Button 
                         onClick={handleSaveResults}
                         disabled={submitting}
                         className="h-12 bg-white hover:bg-slate-50 text-indigo-600 border-2 border-indigo-100 font-black uppercase text-[10px] tracking-widest rounded-xl px-10 shadow-sm flex items-center gap-3 transition-all active:scale-95"
                       >
                         <Save className="h-4 w-4" /> Simpan Draft Perubahan
                       </Button>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Right: Actions & Preview (The "Finalization") */}
        <div className="lg:col-span-3 space-y-6">
           <Card className="border-none shadow-2xl shadow-violet-900/10 rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-indigo-950 to-slate-900 text-white">
              <CardHeader className="p-8 pb-0">
                 <div className="h-14 w-14 rounded-2xl bg-indigo-600/30 flex items-center justify-center border-2 border-indigo-500/30 mb-6 shadow-2xl shadow-indigo-950">
                    <Sparkles className="h-7 w-7 text-indigo-400" />
                 </div>
                 <CardTitle className="text-xl font-black uppercase tracking-tight leading-tight">Penerbitan LHU</CardTitle>
                 <CardDescription className="text-indigo-400 font-bold text-[9px] uppercase tracking-[3px] mt-2">Final Step Verification</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                 <p className="text-indigo-200/70 text-[10px] leading-relaxed font-medium">
                    Sistem akan mengolah hasil parameter di samping menjadi dokumen sertifikat digital yang sah.
                 </p>
                 
                 {job.status !== 'completed' && (
                    <Button 
                      onClick={handleGenerateLHU}
                      disabled={submitting}
                      className="w-full h-16 bg-white hover:bg-indigo-50 text-indigo-950 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-indigo-950/40 flex items-center justify-center gap-3"
                    >
                       Preview LHU <Eye className="h-5 w-5" />
                    </Button>
                 )}

                 {job.certificate_url && (
                    <div className="bg-emerald-500/10 p-5 rounded-3xl border border-emerald-500/20 flex items-center justify-between group">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                             <FileCheck className="h-5 w-5" />
                          </div>
                          <div>
                             <p className="text-[9px] font-black uppercase tracking-widest">LHU Terbit</p>
                             <p className="text-[10px] font-bold text-emerald-400 font-mono tracking-tighter">FINALIZED</p>
                          </div>
                       </div>
                       <Link href={job.certificate_url} target="_blank" className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-indigo-600 transition-colors">
                          <Download className="h-4 w-4" />
                       </Link>
                    </div>
                 )}
              </CardContent>
           </Card>

           <div className="p-6 bg-indigo-50 rounded-[2rem] border-2 border-indigo-100 flex items-start gap-4 animate-pulse">
              <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-1" />
              <p className="text-[9px] text-indigo-700 font-black uppercase leading-relaxed">
                 Pastikan satuan (Unit) dan metode pengujian sudah sesuai dengan standar akreditasi KAN / ISO 17025.
              </p>
           </div>
        </div>
      </div>

      {/* Preview Dialog Premium */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-3xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-indigo-950 p-10 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-800/30 via-transparent to-transparent opacity-50" />
            <div className="relative z-10 space-y-4">
               <div className="h-16 w-16 rounded-3xl bg-indigo-600 flex items-center justify-center mx-auto shadow-2xl shadow-indigo-900/40 border-4 border-indigo-800">
                  <FileText className="h-8 w-8 text-white" />
               </div>
               <div>
                 <DialogTitle className="text-2xl font-black uppercase tracking-tight">Draf Laporan Hasil Uji</DialogTitle>
                 <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mt-1">Nomor Registrasi: {lhuNumber}</p>
               </div>
            </div>
          </div>
          <div className="p-10 bg-white space-y-8">
             <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Activity className="h-3 w-3 text-indigo-600" /> Ringkasan Data Rill
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                   {testResults.slice(0, 6).map((r, i) => (
                      <div key={i} className="flex flex-col">
                         <span className="text-[9px] font-bold text-slate-400 truncate uppercase">{r.parameter}</span>
                         <span className="text-sm font-black text-slate-800">{r.result || '-'} <span className="text-[10px] font-medium text-slate-400">{r.unit}</span></span>
                      </div>
                   ))}
                   {testResults.length > 6 && (
                      <div className="text-[9px] font-black text-indigo-600 flex items-center bg-indigo-50 px-3 py-1 rounded-lg self-center">+ {testResults.length - 6} LAINNYA</div>
                   )}
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline"
                  onClick={async () => {
                     const doc = <LHUPDF data={generatedLHU} />;
                     const blob = await pdf(doc).toBlob();
                     const url = URL.createObjectURL(blob);
                     window.open(url, '_blank');
                  }}
                  className="h-16 rounded-2xl border-2 border-slate-100 font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
                >
                   <Eye className="h-4 w-4 mr-2" /> Full Document
                </Button>
                <Button 
                  onClick={handlePublishWithLHU}
                  disabled={submitting}
                  className="h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3"
                >
                   TERBITKAN SEKARANG <Send className="h-4 w-4" />
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExternalLink({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
  );
}
