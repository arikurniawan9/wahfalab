"use client";

import React, { useEffect, useState, use } from "react";
import { getReportingJobById, uploadLHUPDF, publishLabReport } from "@/lib/actions/reporting";
import { ChemicalLoader } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Upload, CheckCircle, Eye } from "lucide-react";
import Link from "next/link";

export default function ReportingJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    async function loadJob() {
      try {
        const data = await getReportingJobById(id);
        if (data.jobOrder) {
          setJob(data.jobOrder);
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
      <Card className="mt-6 shadow-xl shadow-emerald-900/5">
        <CardHeader>
          <CardTitle className="text-emerald-900 flex items-center gap-2">
            <FileText className="h-5 w-5" /> Penerbitan LHU
          </CardTitle>
          <CardDescription>Upload dan terbitkan Laporan Hasil Uji</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Upload LHU (PDF)</Label>
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

          {job.certificate_url && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-emerald-900 text-sm">LHU Telah Diupload</h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    File LHU telah diupload dan siap untuk diterbitkan
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

          {job.status !== "completed" && job.certificate_url && (
            <div className="pt-4 border-t">
              <Button 
                onClick={handlePublish} 
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Terbitkan LHU & Selesai
              </Button>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Setelah diterbitkan, job order akan ditandai selesai dan notifikasi akan dikirim ke operator
              </p>
            </div>
          )}

          {job.status === "completed" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
              <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <h4 className="font-semibold text-emerald-900">LHU Telah Diterbitkan</h4>
              <p className="text-sm text-emerald-700 mt-1">
                Job order ini telah selesai dan LHU telah dikirim ke operator
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
