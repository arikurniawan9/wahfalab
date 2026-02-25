"use client";

import React, { useEffect, useState, use } from "react";
import { getAnalysisJobById, startAnalysis, saveAnalysisResults, uploadAnalysisPDF, uploadRawData, completeAnalysis } from "@/lib/actions/analyst";
import { createSampleHandover } from "@/lib/actions/handover";
import { getProfile } from "@/lib/actions/auth";
import { ChemicalLoader } from "@/components/ui";
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
  Download
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

  // Form state
  const [testResults, setTestResults] = useState<TestResult[]>([
    { parameter: "", result: "", unit: "", method: "", limit: "" }
  ]);
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

  // Confirmation dialog for sending to reporting
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Photo viewer
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<any[]>([]);

  useEffect(() => {
    async function loadJob() {
      try {
        const [data, prof] = await Promise.all([
          getAnalysisJobById(id),
          getProfile()
        ]);

        if (!data.success || !data.jobOrder) {
          toast.error(data.error || "Gagal memuat job order");
          return;
        }

        setJob(data.jobOrder);
        setProfile(prof);

        // Load handover with full details if exists
        if (data.jobOrder.sample_handover) {
          // Get fresh handover data with complete job_order details
          const { getHandoverByJobId } = await import('@/lib/actions/handover');
          const freshHandover = await getHandoverByJobId(id);
          if (freshHandover) {
            setHandover(freshHandover);
          }
        }

        // Load existing analysis data OR auto-populate from quotation
        if (data.jobOrder.lab_analysis) {
          setAnalysis(data.jobOrder.lab_analysis);
          const results = (data.jobOrder.lab_analysis.test_results as any) as TestResult[] || [];
          setTestResults(results.length > 0 ? results : [{ parameter: "", result: "", unit: "", method: "", limit: "" }]);
          setAnalysisNotes(data.jobOrder.lab_analysis.analysis_notes || "");
          setEquipmentUsed(Array.isArray(data.jobOrder.lab_analysis.equipment_used)
            ? data.jobOrder.lab_analysis.equipment_used.join(", ")
            : "");
          setSampleCondition(data.jobOrder.lab_analysis.sample_condition || "");
        } else {
          // Auto-populate parameters from quotation items
          const quotationItems = data.jobOrder.quotation?.items || [];
          const parametersFromQuotation: TestResult[] = [];

          quotationItems.forEach((item: any) => {
            const service = item.service;
            if (service?.parameters && Array.isArray(service.parameters)) {
              service.parameters.forEach((param: any) => {
                parametersFromQuotation.push({
                  parameter: param.name || param.parameter || "",
                  result: "",
                  unit: param.unit || "",
                  method: param.method || service.code || "",
                  limit: param.limit || param.max_limit || ""
                });
              });
            }

            // If no parameters in service, add service name as placeholder
            if (!service?.parameters || service.parameters.length === 0) {
              parametersFromQuotation.push({
                parameter: service?.name || item.service_name || "Parameter",
                result: "",
                unit: service?.unit || item.unit || "",
                method: service?.code || item.code || "",
                limit: ""
              });
            }
          });

          // Set test results with parameters from quotation
          if (parametersFromQuotation.length > 0) {
            setTestResults(parametersFromQuotation);
          }
        }
      } catch (error) {
        console.error("Failed to load job:", error);
        toast.error("Gagal memuat data job order");
      } finally {
        setLoading(false);
      }
    }
    loadJob();
  }, [id]);

  const handleAddParameter = () => {
    setTestResults([...testResults, { parameter: "", result: "", unit: "", method: "", limit: "" }]);
  };

  const handleRemoveParameter = (index: number) => {
    if (testResults.length === 1) return;
    setTestResults(testResults.filter((_, i) => i !== index));
  };

  const handleParameterChange = (index: number, field: keyof TestResult, value: string) => {
    const updated = [...testResults];
    updated[index][field] = value;
    setTestResults(updated);
  };

  const validateAnalysis = () => {
    const filledResults = testResults.filter(t => t.parameter && t.result);
    if (filledResults.length === 0) {
      toast.error("Minimal isi 1 parameter hasil analisis");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateAnalysis()) return;

    setSubmitting(true);
    try {
      const equipmentList = equipmentUsed.split(",").map(e => e.trim()).filter(e => e);

      await saveAnalysisResults(id, {
        test_results: testResults.filter(t => t.parameter),
        analysis_notes: analysisNotes,
        equipment_used: equipmentList,
        sample_condition: sampleCondition
      });

      toast.success("✅ Hasil analisis berhasil disimpan", {
        description: "Draft tersimpan, Anda dapat melanjutkan nanti"
      });
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan hasil analisis");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartAnalysis = async () => {
    setSubmitting(true);
    try {
      await startAnalysis(id);
      toast.success("✅ Analisis dimulai");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Gagal memulai analisis");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenConfirm = () => {
    if (!validateAnalysis()) return;
    setConfirmDialogOpen(true);
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      // Save first before completing
      const equipmentList = equipmentUsed.split(",").map(e => e.trim()).filter(e => e);
      await saveAnalysisResults(id, {
        test_results: testResults.filter(t => t.parameter),
        analysis_notes: analysisNotes,
        equipment_used: equipmentList,
        sample_condition: sampleCondition
      });

      // Then complete
      await completeAnalysis(id);

      toast.success("✅ Analisis selesai & dikirim ke Reporting!", {
        description: "Job order akan diteruskan ke staff reporting untuk pembuatan laporan",
        duration: 5000
      });

      router.push("/analyst/jobs");
    } catch (error: any) {
      toast.error(error.message || "Gagal menyelesaikan analisis");
    } finally {
      setSubmitting(false);
      setConfirmDialogOpen(false);
    }
  };

  // Get current analysis summary for confirmation dialog
  const getAnalysisSummary = () => {
    const filledParams = testResults.filter(t => t.parameter && t.result);
    const equipmentList = equipmentUsed.split(",").map(e => e.trim()).filter(e => e);
    
    return {
      parameterCount: filledParams.length,
      equipmentCount: equipmentList.length,
      hasSampleCondition: !!sampleCondition,
      hasNotes: !!analysisNotes,
      parameters: filledParams
    };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "pdf" | "raw") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      if (type === "pdf") {
        await uploadAnalysisPDF(id, formData);
        toast.success("✅ PDF hasil analisis berhasil diupload");
      } else {
        await uploadRawData(id, formData);
        toast.success("✅ Data mentah berhasil diupload");
      }
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Gagal upload file");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenHandover = () => {
    setHandoverDialogOpen(true);
  };

  const handleCreateHandover = async () => {
    if (!job || !profile) return;
    setSubmitting(true);
    try {
      const res = await createSampleHandover({
        job_order_id: job.id,
        sender_id: job.sampling_assignment?.field_officer_id || profile.id,
        receiver_id: profile.id,
        ...handoverData
      });

      if (res.success) {
        toast.success("✅ BAST Berhasil dibuat", {
          description: "Sampel telah diterima dan status berubah ke Analisis."
        });
        setHandoverDialogOpen(false);
        window.location.reload();
      } else {
        toast.error(res.error || "Gagal membuat BAST");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadBAST = async () => {
    if (!job) return;

    try {
      // Get fresh handover data with full job_order details
      const { getHandoverByJobId } = await import('@/lib/actions/handover');
      const freshHandover = await getHandoverByJobId(id);

      if (!freshHandover) {
        toast.error("Data BAST tidak ditemukan");
        return;
      }

      const blob = await pdf(<SampleHandoverPDF data={freshHandover} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `BAST-${job.tracking_code}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("✅ BAST berhasil diunduh");
    } catch (error) {
      toast.error("Gagal mengunduh BAST");
    }
  };

  const handleViewPhotos = () => {
    const photos = job?.sampling_assignment?.photos;
    if (photos && photos.length > 0) {
      setSelectedPhotos(Array.isArray(photos) ? photos : JSON.parse(photos));
      setPhotoDialogOpen(true);
    }
  };

  const getPhotoName = (photo: any, index: number) => {
    if (typeof photo === 'string') return `Foto ${index + 1}`;
    if (typeof photo === 'object' && photo.name) return photo.name;
    return `Foto ${index + 1}`;
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <ChemicalLoader />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-semibold text-slate-700">Job order tidak ditemukan</h2>
        <p className="text-sm text-slate-500 mt-2">
          Job order mungkin tidak ada atau Anda tidak memiliki akses.
        </p>
        <Link href="/analyst/jobs">
          <Button className="mt-4 cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
        </Link>
      </div>
    );
  }

  const statusColors: any = {
    sampling: "bg-blue-100 text-blue-700 border-blue-200",
    analysis: "bg-violet-100 text-violet-700 border-violet-200",
    analysis_done: "bg-emerald-100 text-emerald-700 border-emerald-200",
    reporting: "bg-amber-100 text-amber-700 border-amber-200"
  };

  const statusLabels: any = {
    sampling: "Menunggu Handover",
    analysis: "Sedang Analisis",
    analysis_done: "Selesai Analisis",
    reporting: "Ke Reporting"
  };

  // Workflow steps
  const workflowSteps = [
    { id: 1, name: "Sampling", icon: MapPin, completed: job.status !== 'sampling' && job.status !== 'scheduled' },
    { id: 2, name: "Handover", icon: PackageCheck, completed: !!handover || job.status !== 'sampling' },
    { id: 3, name: "Analisis", icon: FlaskConical, completed: job.status === 'analysis_done' || job.status === 'reporting' },
    { id: 4, name: "Reporting", icon: FileText, completed: job.status === 'reporting' || job.status === 'completed' }
  ];

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/analyst/jobs">
          <Button variant="ghost" size="sm" className="mb-4 cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">{job.tracking_code}</h1>
              <Badge className={cn("text-xs px-3 py-1.5 font-bold uppercase", statusColors[job.status])}>
                {statusLabels[job.status]}
              </Badge>
            </div>
            <p className="text-slate-500 text-sm">
              {job.quotation?.profile?.company_name || job.quotation?.profile?.full_name}
            </p>
          </div>
        </div>
      </div>

      {/* Workflow Progress */}
      <Card className="mb-6 border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {workflowSteps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all",
                    step.completed
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : job.status === 'analysis' && step.id === 3
                      ? "bg-violet-600 border-violet-600 text-white animate-pulse"
                      : "bg-white border-slate-300 text-slate-400"
                  )}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-wide",
                    step.completed ? "text-emerald-700" : "text-slate-500"
                  )}>
                    {step.name}
                  </span>
                </div>
                {index < workflowSteps.length - 1 && (
                  <div className={cn(
                    "flex-1 h-1 mx-4 rounded",
                    step.completed ? "bg-emerald-600" : "bg-slate-200"
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Analysis Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Analysis Input Form */}
          {(job.status === "analysis" || job.status === "analysis_done" || analysis) && (
            <Card className="border-violet-200 shadow-lg shadow-violet-900/5">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-white border-b border-violet-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-emerald-900 flex items-center gap-2">
                      <FlaskConical className="h-5 w-5 text-violet-600" />
                      Input Hasil Analisis
                    </CardTitle>
                    <CardDescription>
                      {testResults.length > 0 && testResults[0].parameter ? (
                        <span className="text-emerald-600 font-medium">
                          ✅ Parameter terisi otomatis dari penawaran ({testResults.length} parameter)
                        </span>
                      ) : (
                        "Masukkan parameter hasil uji laboratorium"
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-violet-300 text-violet-700">
                    {testResults.filter(t => t.parameter && t.result).length}/{testResults.length} Parameter Terisi
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Test Results Table */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left p-3 font-semibold text-slate-700 text-sm">Parameter</th>
                          <th className="text-left p-3 font-semibold text-slate-700 text-sm">Hasil</th>
                          <th className="text-left p-3 font-semibold text-slate-700 text-sm">Satuan</th>
                          <th className="text-left p-3 font-semibold text-slate-700 text-sm">Metode</th>
                          <th className="text-left p-3 font-semibold text-slate-700 text-sm">Batas Limit</th>
                          <th className="w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {testResults.map((result, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="p-2">
                              <Input
                                value={result.parameter}
                                onChange={(e) => handleParameterChange(index, "parameter", e.target.value)}
                                placeholder="Contoh: pH"
                                className="border-0 bg-transparent"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={result.result}
                                onChange={(e) => handleParameterChange(index, "result", e.target.value)}
                                placeholder="Hasil"
                                className="border-0 bg-transparent font-semibold text-emerald-700"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={result.unit}
                                onChange={(e) => handleParameterChange(index, "unit", e.target.value)}
                                placeholder="mg/L"
                                className="border-0 bg-transparent w-20"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={result.method}
                                onChange={(e) => handleParameterChange(index, "method", e.target.value)}
                                placeholder="SMEWW"
                                className="border-0 bg-transparent"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={result.limit}
                                onChange={(e) => handleParameterChange(index, "limit", e.target.value)}
                                placeholder="6-9"
                                className="border-0 bg-transparent"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveParameter(index)}
                                disabled={testResults.length === 1}
                                className="h-8 w-8 text-red-500 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Button
                  onClick={handleAddParameter}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" /> Tambah Parameter
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          {(job.status === "analysis" || job.status === "analysis_done" || analysis) && (
            <Card className="shadow-lg shadow-emerald-900/5">
              <CardHeader>
                <CardTitle className="text-emerald-900">Informasi Tambahan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sampleCondition">Kondisi Sampel</Label>
                  <Textarea
                    id="sampleCondition"
                    value={sampleCondition}
                    onChange={(e) => setSampleCondition(e.target.value)}
                    placeholder="Deskripsikan kondisi sampel..."
                    className="mt-1 min-h-[80px]"
                  />
                </div>

                <div>
                  <Label htmlFor="equipmentUsed">Peralatan yang Digunakan</Label>
                  <Input
                    id="equipmentUsed"
                    value={equipmentUsed}
                    onChange={(e) => setEquipmentUsed(e.target.value)}
                    placeholder="pH Meter, TDS Meter, Spectrophotometer"
                  />
                  <p className="text-xs text-slate-500 mt-1">Pisahkan dengan koma (,)</p>
                </div>

                <div>
                  <Label htmlFor="analysisNotes">Catatan Analis</Label>
                  <Textarea
                    id="analysisNotes"
                    value={analysisNotes}
                    onChange={(e) => setAnalysisNotes(e.target.value)}
                    placeholder="Catatan atau observasi khusus..."
                    className="mt-1 min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* File Upload */}
          {(job.status === "analysis" || job.status === "analysis_done" || analysis) && (
            <Card className="shadow-lg shadow-emerald-900/5">
              <CardHeader>
                <CardTitle className="text-emerald-900 flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Upload Dokumen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Hasil Analisis (PDF)</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileUpload(e, "pdf")}
                      disabled={submitting}
                      className="max-w-md"
                    />
                    {analysis?.result_pdf_url && (
                      <Button variant="outline" size="sm" asChild className="cursor-pointer">
                        <a href={analysis.result_pdf_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4 mr-2" /> Lihat
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Data Mentah (Foto/Dokumen)</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, "raw")}
                      disabled={submitting}
                      className="max-w-md"
                    />
                    {analysis?.raw_data_url && (
                      <Button variant="outline" size="sm" asChild className="cursor-pointer">
                        <a href={analysis.raw_data_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" /> Unduh
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Info & Actions */}
        <div className="space-y-6">
          {/* Sampling Info */}
          <Card className="shadow-lg shadow-emerald-900/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Informasi Sampling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Customer</Label>
                <p className="text-sm font-semibold text-slate-800 mt-1">
                  {job.quotation?.profile?.company_name || job.quotation?.profile?.full_name || "-"}
                </p>
              </div>
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Lokasi</Label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <p className="text-sm font-medium text-slate-700">{job.sampling_assignment?.location || "-"}</p>
                </div>
              </div>
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <p className="text-sm font-medium text-slate-700">
                    {job.sampling_assignment?.scheduled_date
                      ? new Date(job.sampling_assignment.scheduled_date).toLocaleDateString("id-ID")
                      : "-"}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Field Officer</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-slate-400" />
                  <p className="text-sm font-medium text-slate-700">{job.sampling_assignment?.field_officer?.full_name || "-"}</p>
                </div>
              </div>

              {/* Sampling Photos */}
              {job.sampling_assignment?.photos && job.sampling_assignment.photos.length > 0 && (
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase">Foto Sampling</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleViewPhotos}
                      className="h-6 text-xs cursor-pointer"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Lihat
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {job.sampling_assignment.photos.slice(0, 3).map((photo: any, idx: number) => {
                      const photoUrl = typeof photo === 'string' ? photo : photo.url;
                      return (
                        <a
                          key={idx}
                          href={photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-emerald-400 transition-all"
                        >
                          <img src={photoUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                        </a>
                      );
                    })}
                  </div>
                  {job.sampling_assignment.photos.length > 3 && (
                    <p className="text-xs text-slate-500 mt-2 text-center">
                      +{job.sampling_assignment.photos.length - 3} foto lainnya
                    </p>
                  )}
                </div>
              )}

              {/* Sampling Notes */}
              {job.sampling_assignment?.notes && (
                <div className="pt-3 border-t">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase">Catatan Sampling</Label>
                  <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded">{job.sampling_assignment.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card className="shadow-lg shadow-emerald-900/5 border-emerald-200">
            <CardHeader>
              <CardTitle className="text-emerald-900">Aksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Handover - Show when status is sampling and no handover yet */}
              {(job.status === "sampling" || job.status === "analysis_ready") && !handover && (
                <Button
                  onClick={handleOpenHandover}
                  disabled={submitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 cursor-pointer h-11"
                >
                  <PackageCheck className="mr-2 h-4 w-4" /> Terima Sampel (BAST)
                </Button>
              )}

              {/* Download BAST - Show when handover exists */}
              {handover && (
                <Button
                  onClick={handleDownloadBAST}
                  disabled={submitting}
                  variant="outline"
                  className="w-full cursor-pointer border-emerald-600 text-emerald-600 hover:bg-emerald-50 h-11"
                >
                  <FileText className="mr-2 h-4 w-4" /> Unduh BAST
                </Button>
              )}

              {/* Start Analysis - Show when analysis not started yet */}
              {!analysis && (job.status === "analysis" || job.status === "analysis_ready" || (job.status === "sampling" && handover)) && (
                <Button
                  onClick={handleStartAnalysis}
                  disabled={submitting}
                  className="w-full bg-violet-600 hover:bg-violet-700 cursor-pointer h-11"
                >
                  <FlaskConical className="mr-2 h-4 w-4" /> Mulai Analisis
                </Button>
              )}

              {/* Save Draft - Show when analysis exists or in progress */}
              {(analysis || job.status === "analysis") && (
                <Button
                  onClick={handleSave}
                  disabled={submitting}
                  variant="outline"
                  className="w-full cursor-pointer h-11"
                >
                  <Save className="mr-2 h-4 w-4" /> Simpan Draft
                </Button>
              )}

              {/* Complete & Send to Reporting - Show when analysis in progress or done */}
              {(job.status === "analysis" || job.status === "analysis_done") && (
                <Button
                  onClick={handleOpenConfirm}
                  disabled={submitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 cursor-pointer h-11"
                >
                  <Send className="mr-2 h-4 w-4" /> Selesai & Kirim ke Reporting
                </Button>
              )}

              {/* Info message when no actions available */}
              {job.status !== "sampling" && job.status !== "analysis" && job.status !== "analysis_done" && job.status !== "analysis_ready" && !handover && (
                <div className="text-center py-4 text-sm text-slate-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                  <p>Belum ada aksi yang tersedia</p>
                  <p className="text-xs mt-1">Job order masih dalam status {job.status}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Handover Modal */}
      <Dialog open={handoverDialogOpen} onOpenChange={setHandoverDialogOpen}>
        <DialogContent className="sm:max-w-xl p-0 border-none shadow-2xl rounded-3xl overflow-hidden">
          <div className="bg-emerald-700 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center border border-white/20">
                <PackageCheck className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-black uppercase tracking-widest">Serah Terima Sampel (BAST)</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setHandoverDialogOpen(false)} className="text-white/60 hover:text-white h-8 w-8"><X className="h-4 w-4" /></Button>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                  <PackageCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">{job?.tracking_code}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {job?.quotation?.profile?.company_name || job?.quotation?.profile?.full_name || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="sampleCondition" className="text-sm font-semibold">Kondisi Sampel</Label>
                <Select
                  value={handoverData.sample_condition}
                  onValueChange={(value) => setHandoverData({ ...handoverData, sample_condition: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih kondisi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Segel Utuh">Segel Utuh</SelectItem>
                    <SelectItem value="Segel Rusak">Segel Rusak</SelectItem>
                    <SelectItem value="Tanpa Segel">Tanpa Segel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sampleQty" className="text-sm font-semibold">Jumlah Sampel</Label>
                <Input
                  id="sampleQty"
                  type="number"
                  value={handoverData.sample_qty}
                  onChange={(e) => setHandoverData({ ...handoverData, sample_qty: parseInt(e.target.value) || 1 })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="sampleNotes" className="text-sm font-semibold">Catatan Tambahan</Label>
                <Textarea
                  id="sampleNotes"
                  value={handoverData.sample_notes}
                  onChange={(e) => setHandoverData({ ...handoverData, sample_notes: e.target.value })}
                  placeholder="Catatan kondisi sampel..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setHandoverDialogOpen(false)} disabled={submitting} className="flex-1">Batal</Button>
              <Button onClick={handleCreateHandover} disabled={submitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                {submitting ? "Memproses..." : "Terima Sampel"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Viewer Modal */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="sm:max-w-4xl p-0 border-none shadow-2xl rounded-3xl overflow-hidden max-h-[90vh]">
          <div className="bg-emerald-700 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center border border-white/20">
                <FileText className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-black uppercase tracking-widest">
                {job?.tracking_code} - Foto Sampling
              </DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPhotoDialogOpen(false)} className="text-white/60 hover:text-white h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {selectedPhotos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPhotos.map((photo: any, index: number) => {
                  const photoUrl = typeof photo === 'string' ? photo : photo.url;
                  const photoName = getPhotoName(photo, index);

                  return (
                    <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      <div className="absolute top-2 left-2 right-2 z-10 bg-gradient-to-r from-black/80 to-transparent text-white text-xs font-bold px-3 py-2 rounded-lg backdrop-blur-sm">
                        {photoName}
                      </div>
                      <img
                        src={photoUrl}
                        alt={photoName}
                        className="w-full h-auto object-cover aspect-video group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500">Tidak ada foto</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog - Send to Reporting */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md p-0 border-none shadow-2xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3">
              <Send className="h-8 w-8" />
            </div>
            <DialogTitle className="text-lg font-black uppercase tracking-widest">
              Kirim ke Reporting?
            </DialogTitle>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-bold mb-1">Pastikan semua data sudah benar:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-800">
                  <li>Parameter hasil analisis terisi</li>
                  <li>Kondisi sampel didokumentasikan</li>
                  <li>Catatan analis lengkap (jika ada)</li>
                </ul>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-slate-700 mb-3">Ringkasan Analisis:</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Parameter terisi:</span>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-700 font-bold">
                    {getAnalysisSummary().parameterCount} parameter
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Equipment:</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {getAnalysisSummary().equipmentCount} alat
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Kondisi sampel:</span>
                  <span className="text-sm font-semibold text-slate-700">
                    {sampleCondition || "-"}
                  </span>
                </div>
                {analysisNotes && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-xs text-slate-500 block mb-1">Catatan Analis:</span>
                    <p className="text-xs text-slate-700 italic line-clamp-2">{analysisNotes}</p>
                  </div>
                )}
              </div>
              
              {/* Parameter Preview */}
              {getAnalysisSummary().parameters.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Parameter yang diisi:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {getAnalysisSummary().parameters.map((param, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{param.parameter}</span>
                        <span className="text-slate-500">= {param.result} {param.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDialogOpen(false)}
                disabled={submitting}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                onClick={handleComplete}
                disabled={submitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Ya, Kirim
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
