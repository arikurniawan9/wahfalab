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
  Layers, Search, RefreshCw, Info, BookOpen
} from "lucide-react";
import Link from "next/link";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
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
  const [regulations, setRegulations] = useState<any[]>([]);
  const [selectedReg, setSelectedReg] = useState<string>("");
  const [lhuNumber, setLhuNumber] = useState("");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [generatedLHU, setGeneratedLHU] = useState<any>(null);

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

      // Initialize results
      if (jobOrder.lab_analysis?.test_results && jobOrder.lab_analysis.test_results.length > 0) {
        setTestResults(jobOrder.lab_analysis.test_results);
      } else {
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

  const handleApplyRegulation = async (regId: string) => {
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
              parameter: regParam.parameter,
              result: "",
              unit: regParam.unit || "",
              method: regParam.method || "",
              limit: regParam.standard_value
            });
          }
        });
        
        setTestResults(updatedResults);
        toast.success(`Baku mutu dari ${detail.name} berhasil diterapkan`);
      }
    } catch (error) {
      toast.error("Gagal menerapkan baku mutu");
    }
  };

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
        analysis_notes: reportingNotes
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
        
        <div className="flex items-center gap-4">
           <div className="flex flex-col items-end gap-1 mr-4">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Auto-Fill Baku Mutu</label>
              <Select value={selectedReg} onValueChange={(val) => { setSelectedReg(val); handleApplyRegulation(val); }}>
                 <SelectTrigger className="h-10 w-64 rounded-xl border-slate-200 bg-white font-bold text-xs">
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
           <Card className="border-none shadow-2xl shadow-indigo-900/5 rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-900/20">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight text-emerald-950">Hasil Parameter Uji</CardTitle>
                    <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Input data hasil laboratorium untuk sertifikat LHU</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                   <Button 
                     onClick={handleAddParameter}
                     className="rounded-xl bg-indigo-600 text-white font-black text-[10px] uppercase h-10 px-4 shadow-lg shadow-indigo-900/20"
                   >
                     <Plus className="mr-2 h-3 w-3" /> Tambah Baris
                   </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                          <tr>
                             <th className="px-6 py-4">Parameter Pengujian</th>
                             <th className="px-4 py-4 w-[100px] text-center">Satuan</th>
                             <th className="px-4 py-4 w-[120px] text-center">Baku Mutu</th>
                             <th className="px-6 py-4 w-[140px] text-center text-indigo-600">Hasil Uji</th>
                             <th className="px-6 py-4">Metode Analisis</th>
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
                                     placeholder="Parameter"
                                     className="w-full bg-transparent border-none text-xs font-black text-slate-800 focus:ring-0 placeholder:text-slate-300 uppercase"
                                   />
                                </td>
                                <td className="px-4 py-3">
                                   <input 
                                     value={result.unit}
                                     onChange={(e) => handleUpdateParameter(index, "unit", e.target.value)}
                                     placeholder="Satuan"
                                     className="w-full h-9 bg-slate-50 rounded-lg px-2 border border-transparent text-[10px] font-bold text-slate-500 outline-none text-center"
                                   />
                                </td>
                                <td className="px-4 py-3">
                                   <input 
                                     value={result.limit}
                                     onChange={(e) => handleUpdateParameter(index, "limit", e.target.value)}
                                     placeholder="Limit"
                                     className="w-full h-9 bg-amber-50/50 rounded-lg px-2 border border-transparent text-[10px] font-black text-amber-700 outline-none text-center"
                                   />
                                </td>
                                <td className="px-6 py-3">
                                   <input 
                                     value={result.result}
                                     onChange={(e) => handleUpdateParameter(index, "result", e.target.value)}
                                     placeholder="Hasil Uji"
                                     className="w-full h-10 bg-indigo-50/50 rounded-xl px-3 border-2 border-indigo-100 focus:border-indigo-400 text-xs font-black text-indigo-700 outline-none text-center shadow-inner"
                                   />
                                </td>
                                <td className="px-6 py-3">
                                   <input 
                                     value={result.method}
                                     onChange={(e) => handleUpdateParameter(index, "method", e.target.value)}
                                     placeholder="Metode"
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

                 <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex-1 w-full space-y-3">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan Tambahan LHU</Label>
                       <Textarea 
                         value={reportingNotes}
                         onChange={(e) => setReportingNotes(e.target.value)}
                         placeholder="Masukkan catatan khusus..."
                         className="min-h-[80px] rounded-2xl border-slate-200 p-4 font-medium text-xs bg-white"
                       />
                    </div>
                    <div className="flex flex-col gap-3 min-w-[200px]">
                       <Button 
                         onClick={handleSaveResults}
                         disabled={submitting}
                         className="h-12 bg-white hover:bg-indigo-50 text-indigo-600 border-2 border-indigo-100 font-black uppercase text-[10px] tracking-widest rounded-xl px-8 shadow-sm flex items-center gap-3"
                       >
                         <Save className="h-4 w-4" /> Simpan Draft
                       </Button>
                       <Button 
                         onClick={handleGenerateLHU}
                         disabled={submitting}
                         className="h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-[2px] rounded-xl px-8 shadow-xl shadow-indigo-900/20 flex items-center gap-3"
                       >
                         Preview LHU <Eye className="h-4 w-4" />
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
               <DialogTitle className="text-2xl font-black uppercase tracking-tight">Draf Laporan Hasil Uji</DialogTitle>
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
                   <Printer className="h-4 w-4 mr-2" /> Full Document
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
