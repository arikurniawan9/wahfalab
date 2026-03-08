// ============================================================================
// PREMIUM ANALYST PRECISION INTERFACE - v4.0
// Engineered for maximum speed and scientific accuracy.
// ============================================================================

"use client";

import React, { useEffect, useState, use, useCallback } from "react";
import { 
  getAnalysisJobById, 
  startAnalysis, 
  saveAnalysisResults, 
  uploadAnalysisPDF, 
  uploadRawData, 
  completeAnalysis 
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

  // Form state
  const [analysisNotes, setAnalysisNotes] = useState("");
  const [equipmentUsed, setEquipmentUsed] = useState("");
  const [sampleCondition, setSampleCondition] = useState("");

  // Handover state
  const [handoverDialogOpen, setHandoverDialogOpen] = useState(false);
  const [handoverData, setHandoverData] = useState({
    sample_condition: "Segel Utuh",
    sample_qty: 1,
    sample_notes: ""
  });
  const [handover, setHandover] = useState<any>(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
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
        setEquipmentUsed(Array.isArray(result.jobOrder.lab_analysis.equipment_used)
          ? result.jobOrder.lab_analysis.equipment_used.join(", ")
          : "");
        setSampleCondition(result.jobOrder.lab_analysis.sample_condition || "");
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "pdf" | "raw") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (type === "pdf") {
        const res = await uploadAnalysisPDF(id, formData);
        if (res.success) {
          toast.success("✅ Berkas analisis tersimpan");
          setAnalysis((prev: any) => ({ ...prev, result_pdf_url: res.url }));
        }
      } else {
        const res = await uploadRawData(id, formData);
        if (res.success) {
          toast.success("✅ Data mentah tersimpan");
          setAnalysis((prev: any) => ({ ...prev, raw_data_url: res.url }));
        }
      }
      loadData();
    } catch (error: any) {
      toast.error("Gagal mengunggah file");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await saveAnalysisResults(id, {
        analysis_notes: analysisNotes,
        equipment_used: equipmentUsed.split(",").map(e => e.trim()).filter(e => e),
        sample_condition: sampleCondition
      });
      toast.success("✅ Draft progres lab berhasil disimpan");
    } catch (error: any) {
      toast.error("Gagal menyimpan draft");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      // Save first
      await saveAnalysisResults(id, {
        analysis_notes: analysisNotes,
        equipment_used: equipmentUsed.split(",").map(e => e.trim()).filter(e => e),
        sample_condition: sampleCondition
      });
      // Then complete
      await completeAnalysis(id);
      toast.success("✅ Analisis Selesai. Notifikasi dikirim ke tim Reporting.");
      router.push("/analyst/jobs");
    } catch (error: any) {
      toast.error("Gagal mengirim hasil analisis");
    } finally {
      setSubmitting(false);
      setConfirmDialogOpen(false);
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
      toast.success("✅ Serah terima sampel berhasil");
      setHandoverDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Gagal serah terima");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><ChemicalLoader /></div>;
  if (!job) return <div className="p-10 text-center">Data tidak ditemukan.</div>;

  const currentStatus = statusConfig[job.status] || statusConfig.analysis;

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-10 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-700">
      <LoadingOverlay isOpen={submitting} title="Memproses Data Lab..." description="Sinkronisasi berkas dan hasil ke basis data WahfaLab" />

      {/* Ramping Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push('/analyst/jobs')} 
            className="h-10 w-10 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
               <span className="font-mono text-xs font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded uppercase tracking-tighter">#{job.tracking_code}</span>
               {job.invoice?.invoice_number && <Badge className="bg-emerald-100 text-emerald-700 border-none text-[8px] font-black">{job.invoice.invoice_number}</Badge>}
            </div>
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight font-[family-name:var(--font-montserrat)] leading-none">
               Lab Performance Dashboard
            </h1>
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
        <div className="lg:col-span-3 space-y-6">
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

           {job.sampling_assignment?.signed_travel_order_url && (
              <Button 
                onClick={() => window.open(job.sampling_assignment.signed_travel_order_url, '_blank')} 
                className="w-full h-12 bg-emerald-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-emerald-900/10"
              >
                 SURAT TUGAS PDF <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
           )}
        </div>

        {/* Middle Column: Scope & Lab Data */}
        <div className="lg:col-span-6 space-y-6">
           <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100 flex flex-row items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-violet-100 text-violet-600"><FlaskConical className="h-5 w-5" /></div>
                    <div>
                       <CardTitle className="text-base font-black uppercase text-slate-800 tracking-tight">Cakupan Pengujian</CardTitle>
                       <CardDescription className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Daftar parameter wajib</CardDescription>
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

           <Card className="border-none shadow-sm rounded-[2.5rem] bg-white">
              <CardHeader className="p-6">
                 <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-emerald-600" /> Lembar Kerja Analis
                 </h3>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kondisi Fisik Sampel</Label>
                       <Textarea 
                         value={sampleCondition} 
                         onChange={(e) => setSampleCondition(e.target.value)}
                         className="rounded-2xl bg-slate-50 border-none min-h-[100px] text-xs font-medium focus-visible:ring-violet-500 p-4"
                         placeholder="Warna, Bau, Endapan, Segel, dll..."
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Peralatan Utama</Label>
                       <Textarea 
                         value={equipmentUsed} 
                         onChange={(e) => setEquipmentUsed(e.target.value)}
                         className="rounded-2xl bg-slate-50 border-none min-h-[100px] text-xs font-medium focus-visible:ring-violet-500 p-4"
                         placeholder="Peralatan lab yang digunakan..."
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan Teknis Pengujian</Label>
                    <Textarea 
                      value={analysisNotes} 
                      onChange={(e) => setAnalysisNotes(e.target.value)}
                      className="rounded-2xl bg-slate-50 border-none min-h-[120px] text-xs font-medium focus-visible:ring-violet-500 p-6"
                      placeholder="Input narasi hasil pengujian sementara di sini..."
                    />
                 </div>
                 <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={submitting} className="h-12 bg-white hover:bg-slate-50 text-slate-800 font-black uppercase text-[10px] tracking-widest rounded-xl border-2 border-slate-100 shadow-sm flex items-center gap-2 px-8">
                       <Save className="h-4 w-4" /> Simpan Draft
                    </Button>
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Right Column: Uploads & Actions */}
        <div className="lg:col-span-3 space-y-6">
           {/* Upload Zone Premium */}
           <Card className="border-none shadow-sm rounded-[2.5rem] bg-indigo-950 text-white overflow-hidden">
              <CardHeader className="p-6 pb-2">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-900 border border-indigo-800"><Upload className="h-5 w-5 text-indigo-400" /></div>
                    <CardTitle className="text-sm font-black uppercase tracking-tight">Berkas Analisis</CardTitle>
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
                               className="bg-indigo-900/50 border-none text-[10px] text-indigo-200 file:bg-indigo-600 file:text-white file:border-none file:rounded-lg file:mr-2 file:px-2 file:py-1 cursor-pointer h-10"
                             />
                             {analysis?.result_pdf_url && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                   <div className="h-6 w-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white"><FileCheck className="h-3 w-3" /></div>
                                   <Link href={analysis.result_pdf_url} target="_blank" className="text-white hover:text-indigo-300"><Eye className="h-4 w-4" /></Link>
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
                               className="bg-indigo-900/50 border-none text-[10px] text-indigo-200 file:bg-indigo-600 file:text-white file:border-none file:rounded-lg file:mr-2 file:px-2 file:py-1 cursor-pointer h-10"
                             />
                             {analysis?.raw_data_url && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                   <div className="h-6 w-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white"><FileCheck className="h-3 w-3" /></div>
                                   <Link href={analysis.raw_data_url} target="_blank" className="text-white hover:text-indigo-300"><Eye className="h-4 w-4" /></Link>
                                </div>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
              </CardContent>
           </Card>

           {/* Main Action Hub */}
           <Card className="border-none shadow-2xl shadow-emerald-900/5 rounded-[2.5rem] bg-white">
              <CardContent className="p-8 space-y-6 text-center">
                 <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center justify-center gap-2 mb-4">
                    <Activity className="h-4 w-4 text-emerald-600" /> Operasional Lab
                 </h3>
                 
                 {!job.sample_handover ? (
                    <div className="space-y-4">
                       <div className="p-6 bg-amber-50 rounded-[2rem] border-2 border-amber-100">
                          <AlertCircle className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                          <h4 className="text-xs font-black text-amber-900 uppercase leading-tight mb-2">Peringatan SOP</h4>
                          <p className="text-[9px] text-amber-700 font-bold uppercase leading-relaxed">Lakukan serah terima (BAST) sebelum memulai analisis.</p>
                       </div>
                       <Button 
                         onClick={() => setHandoverDialogOpen(true)}
                         className="w-full h-16 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-900/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                       >
                          TERIMA SAMPEL <PackageCheck className="h-6 w-6" />
                       </Button>
                    </div>
                 ) : (
                    <div className="space-y-4">
                       <div className="p-6 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100 space-y-4">
                          <div className="flex items-center justify-center gap-3">
                             <ShieldCheck className="h-5 w-5 text-emerald-600" />
                             <span className="text-xs font-black text-emerald-950 uppercase tracking-tight">BAST Tervalidasi</span>
                          </div>
                          <Button 
                            variant="outline"
                            onClick={async () => {
                               const doc = <SampleHandoverPDF data={handover || job.sample_handover} company={companyProfile} />;
                               const blob = await pdf(doc).toBlob();
                               const url = URL.createObjectURL(blob);
                               window.open(url, '_blank');
                            }}
                            className="w-full rounded-xl border-emerald-200 text-emerald-700 font-black text-[9px] uppercase h-10 bg-white hover:bg-emerald-50 transition-colors"
                          >
                             CETAK BAST <Download className="ml-2 h-3 w-3" />
                          </Button>
                       </div>

                       {job.status === 'analysis_ready' ? (
                          <Button 
                            onClick={async () => {
                               setSubmitting(true);
                               try { await startAnalysis(id); toast.success("Analisis Dimulai"); loadData(); }
                               catch (e) { toast.error("Gagal memulai"); }
                               finally { setSubmitting(false); }
                            }}
                            className="w-full h-16 bg-violet-600 hover:bg-violet-700 text-white font-black uppercase tracking-widest text-[10px] md:text-xs rounded-2xl shadow-xl shadow-violet-900/20 flex items-center justify-center gap-2"
                          >
                             MULAI KERJA LAB <FlaskConical className="h-5 w-5 shrink-0" />
                          </Button>
                       ) : ["analysis_done", "reporting", "completed"].includes(job.status) ? (
                          <div className="space-y-3">
                             <Button 
                               disabled
                               className="w-full h-16 bg-slate-100 text-emerald-600 font-black uppercase tracking-widest text-[10px] md:text-xs rounded-2xl border-2 border-emerald-100 flex items-center justify-center gap-2 px-2"
                             >
                                <CheckCircle className="h-5 w-5 shrink-0" /> <span className="truncate">BERHASIL DIKIRIM</span>
                             </Button>
                             <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                                <Info className="h-4 w-4 text-emerald-600 shrink-0" />
                                <p className="text-[9px] text-emerald-700 font-bold uppercase leading-tight text-left">Data pengujian telah diteruskan ke tim Reporting untuk proses penerbitan LHU.</p>
                             </div>
                          </div>
                       ) : (
                          <Button 
                            onClick={() => setConfirmDialogOpen(true)}
                            disabled={submitting}
                            className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] md:text-xs rounded-2xl shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 px-2"
                          >
                             <span className="truncate">KIRIM KE REPORTING</span> <Send className="h-5 w-5 shrink-0" />
                          </Button>
                       )}
                    </div>
                 )}
              </CardContent>
           </Card>
        </div>
      </div>

      {/* Handover Dialog */}
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
             <Button onClick={handleHandoverSubmit} disabled={submitting} className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-emerald-900/20 gap-3">
                TERIMA & TERBITKAN BAST <ShieldCheck className="h-5 w-5" />
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
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Kirim ke Reporting?</DialogTitle>
                <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]">Verifikasi Kelengkapan Berkas</p>
             </div>
          </div>
          <div className="p-8 bg-white space-y-6">
             <div className="space-y-3">
                <div className={cn("p-4 rounded-2xl border flex items-center justify-between", (analysis?.result_pdf_url || job?.lab_analysis?.result_pdf_url) ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100")}>
                   <div className="flex items-center gap-3">
                      <FileText className={cn("h-4 w-4", (analysis?.result_pdf_url || job?.lab_analysis?.result_pdf_url) ? "text-emerald-600" : "text-slate-300")} />
                      <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">Laporan Lab (PDF)</span>
                   </div>
                   {(analysis?.result_pdf_url || job?.lab_analysis?.result_pdf_url) ? <Badge className="bg-emerald-500 text-white text-[8px] px-3">READY</Badge> : <Badge variant="outline" className="text-[8px] px-3">KOSONG</Badge>}
                </div>
                <div className={cn("p-4 rounded-2xl border flex items-center justify-between", (sampleCondition && equipmentUsed) ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100")}>
                   <div className="flex items-center gap-3">
                      <Beaker className={cn("h-4 w-4", (sampleCondition && equipmentUsed) ? "text-emerald-600" : "text-slate-300")} />
                      <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">Lembar Kerja</span>
                   </div>
                   {(sampleCondition && equipmentUsed) ? <Badge className="bg-emerald-500 text-white text-[8px] px-3">LENGKAP</Badge> : <Badge variant="outline" className="text-[8px] px-3">INPUT</Badge>}
                </div>
             </div>
             <p className="text-center text-slate-500 text-[10px] leading-relaxed font-bold uppercase tracking-tight italic">
                Pastikan seluruh data rill telah sesuai. Setelah dikirim, Anda tidak dapat mengubah data ini lagi.
             </p>
             <Button onClick={handleComplete} disabled={submitting} className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] md:text-xs rounded-2xl shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3">
                KONFIRMASI SELESAI <Send className="h-5 w-5 shrink-0" />
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Preview Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 border-none">
          <div className="relative aspect-video flex flex-wrap justify-center gap-4 p-10 overflow-y-auto">
             <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white hover:bg-white/20 z-50" onClick={() => setPhotoDialogOpen(false)}><X className="h-6 w-6" /></Button>
             {selectedPhotos.map((photo: any, idx: number) => (
                <div key={idx} className="h-[400px] aspect-square rounded-2xl overflow-hidden border-4 border-white/10">
                   <img src={typeof photo === 'string' ? photo : photo.url} className="w-full h-full object-contain" alt="Preview" />
                </div>
             ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
