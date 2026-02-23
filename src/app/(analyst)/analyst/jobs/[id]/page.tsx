"use client";

import React, { useEffect, useState, use } from "react";
import { getAnalysisJobById, startAnalysis, saveAnalysisResults, uploadAnalysisPDF, uploadRawData, completeAnalysis } from "@/lib/actions/analyst";
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
  Trash2
} from "lucide-react";
import Link from "next/link";

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
  
  // Form state
  const [testResults, setTestResults] = useState<TestResult[]>([
    { parameter: "", result: "", unit: "", method: "", limit: "" }
  ]);
  const [analysisNotes, setAnalysisNotes] = useState("");
  const [equipmentUsed, setEquipmentUsed] = useState("");
  const [sampleCondition, setSampleCondition] = useState("");

  useEffect(() => {
    async function loadJob() {
      try {
        const data = await getAnalysisJobById(id);
        if (data.jobOrder) {
          setJob(data.jobOrder);
          if (data.jobOrder.lab_analysis) {
            setAnalysis(data.jobOrder.lab_analysis);
            const results = (data.jobOrder.lab_analysis.test_results as any) as TestResult[] || [];
            setTestResults(results.length > 0 ? results : [{ parameter: "", result: "", unit: "", method: "", limit: "" }]);
            setAnalysisNotes(data.jobOrder.lab_analysis.analysis_notes || "");
            setEquipmentUsed(Array.isArray(data.jobOrder.lab_analysis.equipment_used) 
              ? data.jobOrder.lab_analysis.equipment_used.join(", ") 
              : "");
            setSampleCondition(data.jobOrder.lab_analysis.sample_condition || "");
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

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const equipmentList = equipmentUsed.split(",").map(e => e.trim()).filter(e => e);
      
      await saveAnalysisResults(id, {
        test_results: testResults.filter(t => t.parameter),
        analysis_notes: analysisNotes,
        equipment_used: equipmentList,
        sample_condition: sampleCondition
      });
      
      toast.success("Hasil analisis berhasil disimpan");
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
      toast.success("Analisis dimulai");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Gagal memulai analisis");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm("Yakin ingin menyelesaikan analisis ini? Job order akan diteruskan ke staff reporting.")) return;
    
    setSubmitting(true);
    try {
      await completeAnalysis(id);
      toast.success("Analisis selesai diteruskan ke reporting");
      router.push("/analyst");
    } catch (error: any) {
      toast.error(error.message || "Gagal menyelesaikan analisis");
    } finally {
      setSubmitting(false);
    }
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
        toast.success("PDF hasil analisis berhasil diupload");
      } else {
        await uploadRawData(id, formData);
        toast.success("Data mentah berhasil diupload");
      }
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Gagal upload file");
    } finally {
      setSubmitting(false);
    }
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
        <Link href="/analyst/jobs">
          <Button className="mt-4 cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
        </Link>
      </div>
    );
  }

  const statusColors: any = {
    scheduled: "bg-slate-100 text-slate-700",
    sampling: "bg-blue-100 text-blue-700",
    analysis: "bg-violet-100 text-violet-700",
    analysis_done: "bg-emerald-100 text-emerald-700",
    reporting: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700"
  };

  const statusLabels: any = {
    scheduled: "Terjadwal",
    sampling: "Sampling",
    analysis: "Analisis",
    analysis_done: "Selesai Analisis",
    reporting: "Reporting",
    completed: "Selesai"
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="mb-6">
        <Link href="/analyst/jobs">
          <Button variant="ghost" size="sm" className="mb-4 cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">{job.tracking_code}</h1>
            <p className="text-slate-500 text-sm mt-1">Detail Analisis Laboratorium</p>
          </div>
          <Badge className={`text-sm px-4 py-2 ${statusColors[job.status] || "bg-slate-100 text-slate-700"}`}>
            {statusLabels[job.status] || job.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Job Info */}
        <Card className="md:col-span-2 shadow-xl shadow-emerald-900/5">
          <CardHeader>
            <CardTitle className="text-emerald-900">Informasi Sampling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-slate-500 text-xs">Customer</Label>
                <div className="font-medium text-slate-900">
                  {job.quotation?.profile?.company_name || job.quotation?.profile?.full_name || "-"}
                </div>
              </div>
              <div>
                <Label className="text-slate-500 text-xs">Tanggal Sampling</Label>
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {job.sampling_assignment?.scheduled_date 
                    ? new Date(job.sampling_assignment.scheduled_date).toLocaleDateString("id-ID")
                    : "-"
                  }
                </div>
              </div>
              <div>
                <Label className="text-slate-500 text-xs">Lokasi Sampling</Label>
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {job.sampling_assignment?.location || "-"}
                </div>
              </div>
              <div>
                <Label className="text-slate-500 text-xs">Field Officer</Label>
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {job.sampling_assignment?.field_officer?.full_name || "-"}
                </div>
              </div>
            </div>

            {job.sampling_assignment?.notes && (
              <div>
                <Label className="text-slate-500 text-xs">Catatan Sampling</Label>
                <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg mt-1">
                  {job.sampling_assignment.notes}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="shadow-xl shadow-emerald-900/5">
          <CardHeader>
            <CardTitle className="text-emerald-900">Aksi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {job.status === "sampling" && (
              <Button 
                onClick={handleStartAnalysis} 
                disabled={submitting}
                className="w-full bg-violet-600 hover:bg-violet-700 cursor-pointer"
              >
                <FlaskConical className="mr-2 h-4 w-4" /> Mulai Analisis
              </Button>
            )}
            
            {(job.status === "analysis" || job.status === "analysis_done") && (
              <>
                <Button 
                  onClick={handleSave} 
                  disabled={submitting}
                  variant="outline"
                  className="w-full cursor-pointer"
                >
                  <Save className="mr-2 h-4 w-4" /> Simpan Draft
                </Button>
                <Button 
                  onClick={handleComplete} 
                  disabled={submitting || !analysis}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Selesai & Lanjut
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analysis Form */}
      {(job.status === "analysis" || job.status === "analysis_done" || analysis) && (
        <>
          <Card className="mt-6 shadow-xl shadow-emerald-900/5">
            <CardHeader>
              <CardTitle className="text-emerald-900 flex items-center gap-2">
                <FlaskConical className="h-5 w-5" /> Hasil Analisis
              </CardTitle>
              <CardDescription>Input hasil uji parameter laboratorium</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Test Results Table */}
              <div className="border rounded-lg overflow-hidden">
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
                            className="border-0"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={result.result}
                            onChange={(e) => handleParameterChange(index, "result", e.target.value)}
                            placeholder="Hasil"
                            className="border-0"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={result.unit}
                            onChange={(e) => handleParameterChange(index, "unit", e.target.value)}
                            placeholder="Contoh: mg/L"
                            className="border-0"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={result.method}
                            onChange={(e) => handleParameterChange(index, "method", e.target.value)}
                            placeholder="Contoh: SMEWW"
                            className="border-0"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={result.limit}
                            onChange={(e) => handleParameterChange(index, "limit", e.target.value)}
                            placeholder="Contoh: 6-9"
                            className="border-0"
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

          {/* Additional Info */}
          <Card className="mt-6 shadow-xl shadow-emerald-900/5">
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
                  placeholder="Deskripsikan kondisi sampel saat diterima..."
                  className="mt-1 min-h-[80px]"
                />
              </div>
              
              <div>
                <Label htmlFor="equipmentUsed">Peralatan yang Digunakan</Label>
                <Input
                  id="equipmentUsed"
                  value={equipmentUsed}
                  onChange={(e) => setEquipmentUsed(e.target.value)}
                  placeholder="Pisahkan dengan koma (,)"
                />
                <p className="text-xs text-slate-500 mt-1">Contoh: pH Meter, TDS Meter, Spectrophotometer</p>
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

          {/* File Upload */}
          <Card className="mt-6 shadow-xl shadow-emerald-900/5">
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
                    <a 
                      href={analysis.result_pdf_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline text-sm"
                    >
                      Lihat PDF
                    </a>
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
                    <a 
                      href={analysis.raw_data_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline text-sm"
                    >
                      Lihat File
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
