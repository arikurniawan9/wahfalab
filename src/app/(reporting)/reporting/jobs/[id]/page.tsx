"use client";

import React, { useEffect, useState, use } from "react";
import { getReportingJobById, uploadLHUPDF, publishLabReport, generateLHU } from "@/lib/actions/reporting";
import { ChemicalLoader, LoadingButton } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Upload, CheckCircle, Eye, Download, Edit2, Sparkles, X } from "lucide-react";
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

export default function ReportingJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [lhuData, setLhuData] = useState<any>(null);
  const [lhuNumber, setLhuNumber] = useState("");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [generatedLHU, setGeneratedLHU] = useState<any>(null);

  useEffect(() => {
    async function loadJob() {
      try {
        const data = await getReportingJobById(id);
        console.log('Load job response:', data);
        
        if (!data.success || !data.jobOrder) {
          console.error('Failed to load job:', data.error);
          toast.error(data.error || "Gagal memuat job order");
          return;
        }
        
        setJob(data.jobOrder);
      } catch (error) {
        console.error("Failed to load job:", error);
        toast.error("Gagal memuat data job order: " + (error as any)?.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    loadJob();
  }, [id]);

  const handleGenerateLHU = async () => {
    setSubmitting(true);
    try {
      const result = await generateLHU(id);
      
      if (result.success && result.lhuNumber) {
        setLhuNumber(result.lhuNumber);
        setGeneratedLHU(result.lhuData);
        setPreviewDialogOpen(true);
        toast.success("✅ LHU berhasil di-generate!", {
          description: "Silakan preview dan terbitkan LHU"
        });
      } else {
        toast.error(result.error || "Gagal generate LHU");
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal generate LHU");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadLHU = async () => {
    if (!generatedLHU) {
      toast.error("Data LHU belum di-generate");
      return;
    }

    try {
      console.log('Generating LHU PDF...');
      console.log('LHU Data:', JSON.stringify(generatedLHU, null, 2));
      
      const doc = <LHUPDF data={generatedLHU} />;
      const blob = await pdf(doc).toBlob();
      
      console.log('PDF blob created:', blob);
      
      if (!blob || blob.size === 0) {
        throw new Error("PDF blob tidak berhasil dibuat atau kosong");
      }

      console.log('PDF size:', blob.size, 'bytes');

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `LHU-${generatedLHU.lhu_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("✅ LHU berhasil diunduh");
    } catch (error: any) {
      console.error('Download LHU error:', error);
      console.error('Error stack:', error.stack);
      toast.error("Gagal mengunduh LHU: " + (error.message || "Unknown error"));
    }
  };

  const handlePublishWithLHU = async () => {
    if (!generatedLHU) return;

    setSubmitting(true);
    try {
      // First, generate and upload the PDF
      const blob = await pdf(<LHUPDF data={generatedLHU} />).toBlob();
      
      // Upload to Supabase Storage
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      
      const fileName = `lhu/${generatedLHU.lhu_number}-${id}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Update job order with LHU URL and publish
      const { publishLabReportWithLHU } = await import('@/lib/actions/reporting');
      const result = await publishLabReportWithLHU(id, publicUrl, generatedLHU.lhu_number);

      if (result.success) {
        toast.success(`✅ LHU ${generatedLHU.lhu_number} berhasil diterbitkan!`);
        router.push("/reporting");
      } else {
        toast.error(result.error || "Gagal menerbitkan LHU");
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal menerbitkan LHU");
    } finally {
      setSubmitting(false);
      setPreviewDialogOpen(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const result = await uploadLHUPDF(id, formData);
      if (result.success) {
        toast.success("LHU PDF berhasil diupload");
        router.refresh();
      } else {
        toast.error(result.error || "Gagal upload LHU");
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal upload LHU");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm("Yakin ingin menerbitkan LHU ini? Job order akan ditandai selesai dan dikirim ke operator.")) return;
    
    setSubmitting(true);
    try {
      const result = await publishLabReport(id);
      if (result.success) {
        toast.success(`LHU berhasil diterbitkan dengan nomor ${result.lhuNumber}`);
        router.push("/reporting");
      } else {
        toast.error(result.error || "Gagal menerbitkan LHU");
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal menerbitkan LHU");
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
        <Link href="/reporting/jobs">
          <Button className="mt-4 cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
        </Link>
      </div>
    );
  }

  const statusColors: any = {
    analysis_done: "bg-amber-100 text-amber-700",
    reporting: "bg-violet-100 text-violet-700",
    completed: "bg-emerald-100 text-emerald-700"
  };

  const statusLabels: any = {
    analysis_done: "Menunggu LHU",
    reporting: "Proses LHU",
    completed: "LHU Terbit"
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="mb-6">
        <Link href="/reporting/jobs">
          <Button variant="ghost" size="sm" className="mb-4 cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">{job.tracking_code}</h1>
            <p className="text-slate-500 text-sm mt-1">Penerbitan Laporan Hasil Uji</p>
          </div>
          <Badge className={`text-sm px-4 py-2 ${statusColors[job.status] || "bg-slate-100 text-slate-700"}`}>
            {statusLabels[job.status] || job.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Job Info */}
        <Card className="shadow-xl shadow-emerald-900/5">
          <CardHeader>
            <CardTitle className="text-emerald-900">Informasi Job Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-500 text-xs">Customer</Label>
              <div className="font-medium text-slate-900">
                {job.quotation?.profile?.company_name || job.quotation?.profile?.full_name || "-"}
              </div>
            </div>
            <div>
              <Label className="text-slate-500 text-xs">Analis</Label>
              <div className="font-medium text-slate-900">
                {job.lab_analysis?.analyst?.full_name || "-"}
              </div>
            </div>
            <div>
              <Label className="text-slate-500 text-xs">Tanggal Analisis Selesai</Label>
              <div className="font-medium text-slate-900">
                {job.analysis_done_at 
                  ? new Date(job.analysis_done_at).toLocaleDateString("id-ID", { 
                      day: 'numeric', month: 'long', year: 'numeric' 
                    })
                  : "-"
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results Summary */}
        <Card className="shadow-xl shadow-emerald-900/5">
          <CardHeader>
            <CardTitle className="text-emerald-900 flex items-center gap-2">
              <FileText className="h-5 w-5" /> Hasil Analisis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {job.lab_analysis?.test_results && Array.isArray(job.lab_analysis.test_results) && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-2 font-semibold">Parameter</th>
                      <th className="text-left p-2 font-semibold">Hasil</th>
                      <th className="text-left p-2 font-semibold">Limit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {job.lab_analysis.test_results.map((result: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2">{result.parameter}</td>
                        <td className="p-2 font-medium">{result.result} {result.unit}</td>
                        <td className="p-2">{result.limit || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {job.lab_analysis?.analysis_notes && (
              <div>
                <Label className="text-slate-500 text-xs">Catatan Analis</Label>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg mt-1">
                  {job.lab_analysis.analysis_notes}
                </p>
              </div>
            )}

            {job.lab_analysis?.result_pdf_url && (
              <div>
                <Label className="text-slate-500 text-xs">PDF Hasil Analisis</Label>
                <div className="mt-1">
                  <a 
                    href={job.lab_analysis.result_pdf_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:underline text-sm flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" /> Lihat PDF Hasil Analisis
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* LHU Upload & Publish */}
      <Card className="mt-6 shadow-xl shadow-emerald-900/5 border-emerald-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-emerald-900 flex items-center gap-2">
                <FileText className="h-5 w-5" /> Penerbitan LHU
              </CardTitle>
              <CardDescription>Pilih metode penerbitan LHU</CardDescription>
            </div>
            <Badge variant="outline" className="border-emerald-300 text-emerald-700">
              {job.status === "completed" ? "✅ Selesai" : "⏳ Belum Terbit"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Option 1: Auto-Generate LHU */}
          {job.status !== "completed" && !job.certificate_url && (
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-10 w-10 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-violet-900 text-sm">Auto-Generate LHU</h4>
                  <p className="text-xs text-violet-700 mt-1">
                    LHU otomatis dibuat dengan data dari hasil analisis
                  </p>
                </div>
              </div>
              <Button
                onClick={handleGenerateLHU}
                disabled={submitting || job.status !== "analysis_done"}
                className="w-full bg-violet-600 hover:bg-violet-700 cursor-pointer"
              >
                <Sparkles className="mr-2 h-4 w-4" /> 
                {submitting ? "Memproses..." : "🚀 Generate LHU Otomatis"}
              </Button>
              {job.status !== "analysis_done" && (
                <p className="text-xs text-violet-600 mt-2">
                  ⚠️ Job order harus dalam status "Menunggu LHU" (analysis_done)
                </p>
              )}
            </div>
          )}

          {/* Option 2: Manual Upload */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">2</div>
              <Label className="text-sm font-semibold">Upload Manual (Opsional)</Label>
            </div>
            <div className="mt-2 flex items-center gap-4">
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={submitting || job.status === "completed"}
                className="max-w-md"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Format: PDF, Max size: 10MB
            </p>
          </div>

          {/* LHU Uploaded Status */}
          {job.certificate_url && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-emerald-900 text-sm">
                    {job.notes?.includes("LHU") ? job.notes.replace("LHU Published: ", "") : "LHU Telah Diupload"}
                  </h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    File LHU telah siap untuk diterbitkan
                  </p>
                  <a
                    href={job.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:underline text-sm inline-flex items-center gap-1 mt-2"
                  >
                    <Eye className="h-4 w-4" /> Preview LHU
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Publish Button */}
          {job.status !== "completed" && job.certificate_url && (
            <div className="pt-4 border-t">
              <Button
                onClick={handlePublish}
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 cursor-pointer h-11"
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Terbitkan LHU & Selesai
              </Button>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Setelah diterbitkan, job order akan ditandai selesai dan notifikasi akan dikirim ke operator
              </p>
            </div>
          )}

          {/* Completed Status */}
          {job.status === "completed" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
              <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <h4 className="font-semibold text-emerald-900">
                {job.notes?.includes("LHU") ? `LHU ${job.notes.replace("LHU Published: ", "")}` : "LHU Telah Diterbitkan"}
              </h4>
              <p className="text-sm text-emerald-700 mt-1">
                Job order ini telah selesai dan LHU telah dikirim ke operator
              </p>
              {job.certificate_url && (
                <a
                  href={job.certificate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline text-sm inline-flex items-center gap-1 mt-3"
                >
                  <Download className="h-4 w-4" /> Unduh LHU
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-3xl p-0 border-none shadow-2xl rounded-3xl overflow-hidden max-h-[90vh]">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/20">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black uppercase tracking-widest">
                  Preview LHU
                </DialogTitle>
                <DialogDescription className="text-xs text-white/80 mt-0.5">
                  {lhuNumber}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPreviewDialogOpen(false)} className="text-white/60 hover:text-white h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
            {/* LHU Info Preview */}
            {generatedLHU && (
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h4 className="font-semibold text-emerald-900 text-sm mb-3">Informasi LHU:</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Nomor LHU:</span>
                      <p className="font-semibold text-emerald-700">{generatedLHU.lhu_number}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Customer:</span>
                      <p className="font-semibold text-emerald-700">{generatedLHU.customer.full_name}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Tracking Code:</span>
                      <p className="font-semibold text-emerald-700">{generatedLHU.tracking_code}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Parameter:</span>
                      <p className="font-semibold text-emerald-700">{generatedLHU.analysis.test_results?.length || 0} item</p>
                    </div>
                  </div>
                </div>

                {/* Test Results Preview */}
                {generatedLHU.analysis.test_results && generatedLHU.analysis.test_results.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left p-2 font-semibold">Parameter</th>
                          <th className="text-left p-2 font-semibold">Hasil</th>
                          <th className="text-left p-2 font-semibold">Limit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {generatedLHU.analysis.test_results.slice(0, 5).map((result: any, idx: number) => (
                          <tr key={idx}>
                            <td className="p-2">{result.parameter}</td>
                            <td className="p-2 font-medium">{result.result} {result.unit}</td>
                            <td className="p-2">{result.limit || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {generatedLHU.analysis.test_results.length > 5 && (
                      <p className="text-xs text-slate-500 p-2 text-center">
                        +{generatedLHU.analysis.test_results.length - 5} parameter lainnya
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewDialogOpen(false)}
              disabled={submitting}
              className="flex-1"
            >
              Tutup
            </Button>
            <Button
              onClick={handleDownloadLHU}
              disabled={submitting}
              variant="outline"
              className="flex-1 border-violet-300 text-violet-700 hover:bg-violet-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Unduh PDF
            </Button>
            <Button
              onClick={handlePublishWithLHU}
              disabled={submitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {submitting ? "Memproses..." : "Terbitkan LHU"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
