"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, FileText, Download, Edit, 
  Printer, CheckCircle2, AlertCircle,
  Beaker, Calendar, User, Building2,
  MapPin, ShieldCheck, List
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  getLabReportById 
} from "@/lib/actions/reporting";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChemicalLoader } from "@/components/ui";
import { pdf } from "@react-pdf/renderer";
import { LHUDocument } from "@/components/pdf/LHUDocument";

export default function LabReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getLabReportById(id);
        if (data) {
          setReport(data);
        } else {
          toast.error("Laporan tidak ditemukan");
        }
      } catch (error) {
        toast.error("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!report) return;
    setIsDownloading(true);
    try {
      const doc = <LHUDocument data={report} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `LHU-${report.report_number}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("PDF berhasil diunduh");
    } catch (error) {
      toast.error("Gagal mengunduh PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><ChemicalLoader /></div>;
  if (!report) return <div className="p-10 text-center">Laporan tidak ditemukan.</div>;

  return (
    <div className="p-4 md:p-10 space-y-10 max-w-7xl mx-auto pb-24">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex items-center gap-6">
          <Link href="/reporting">
            <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white border-2 border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 transition-all shadow-sm">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
               <Badge className="bg-emerald-600 text-white font-black text-[9px] uppercase tracking-[2px] px-3 py-1 rounded-full border-none shadow-sm">OFFICIAL LHU</Badge>
               <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" /> {report.status === 'final' ? 'FINALIZED DOCUMENT' : 'DRAFT'}
               </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{report.report_number}</h1>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-900/10 gap-2 transition-all active:scale-95"
          >
            {isDownloading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Printer className="h-4 w-4" />}
            Cetak PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
           {/* Client & Sample Info Cards */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-2xl shadow-emerald-900/5 rounded-[2.5rem] overflow-hidden bg-white">
                 <CardHeader className="p-8 pb-4 border-b border-slate-50">
                    <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                       <User className="h-4 w-4 text-emerald-600" /> Informasi Klien
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 space-y-4">
                    <div>
                       <p className="text-sm font-black text-slate-800 uppercase">{report.client_name || "-"}</p>
                       <div className="flex items-center gap-2 mt-1">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          <p className="text-[10px] font-bold text-slate-500 uppercase">{report.company_name || "Personal Client"}</p>
                       </div>
                    </div>
                    <div className="pt-4 border-t border-slate-50 flex gap-2">
                       <MapPin className="h-4 w-4 text-slate-300 shrink-0" />
                       <p className="text-[10px] font-medium text-slate-400 leading-relaxed italic">{report.address || "Alamat tidak tercatat"}</p>
                    </div>
                 </CardContent>
              </Card>

              <Card className="border-none shadow-2xl shadow-emerald-900/5 rounded-[2.5rem] overflow-hidden bg-white">
                 <CardHeader className="p-8 pb-4 border-b border-slate-50">
                    <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                       <Beaker className="h-4 w-4 text-emerald-600" /> Detail Sampel
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <p className="text-[9px] font-black text-slate-300 uppercase mb-1">Jenis Sampel</p>
                          <p className="text-xs font-black text-slate-700 uppercase">{report.sample_type || "-"}</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-slate-300 uppercase mb-1">Kode Sampel</p>
                          <p className="text-xs font-black text-emerald-600 font-mono">{report.sample_code || "-"}</p>
                       </div>
                    </div>
                    <div className="pt-4 border-t border-slate-50">
                       <p className="text-[9px] font-black text-slate-300 uppercase mb-1">Asal / Titik Sampling</p>
                       <p className="text-xs font-bold text-slate-600">{report.sample_origin || "-"}</p>
                    </div>
                 </CardContent>
              </Card>
           </div>

           {/* Test Results Table */}
           <Card className="border-none shadow-2xl shadow-emerald-900/5 rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-8 border-b bg-slate-50/50">
                 <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-900/20">
                       <List className="h-5 w-5" />
                    </div>
                    <div>
                       <CardTitle className="text-xl font-black uppercase tracking-tight text-emerald-950">Hasil Analisis Laboratorium</CardTitle>
                       <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Data parameter hasil pengujian rill</p>
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100">
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Parameter</th>
                             <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Satuan</th>
                             <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Baku Mutu</th>
                             <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Hasil Uji</th>
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Kepatuhan</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {report.items?.map((item: any, idx: number) => (
                             <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-6">
                                   <p className="font-black text-slate-800 text-sm uppercase">{item.parameter}</p>
                                   <p className="text-[9px] font-medium text-slate-400 mt-1 uppercase italic">{item.method || "SOP Internal"}</p>
                                </td>
                                <td className="px-6 py-6 text-center">
                                   <Badge variant="outline" className="border-slate-100 bg-white text-[10px] font-bold text-slate-500 rounded-lg">
                                      {item.unit || "-"}
                                   </Badge>
                                </td>
                                <td className="px-6 py-6 text-center font-bold text-slate-400 text-xs">{item.standard_value || "-"}</td>
                                <td className="px-6 py-6 text-center">
                                   <span className={cn(
                                      "font-black text-sm",
                                      item.is_qualified === false ? "text-rose-600" : "text-emerald-700"
                                   )}>
                                      {item.result_value}
                                   </span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                   {item.is_qualified === false ? (
                                      <div className="flex items-center justify-center gap-1.5 text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100 mx-auto w-fit">
                                         <AlertCircle className="h-3 w-3" />
                                         <span className="text-[9px] font-black uppercase tracking-widest">NOT PASSED</span>
                                      </div>
                                   ) : (
                                      <div className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 mx-auto w-fit">
                                         <CheckCircle2 className="h-3 w-3" />
                                         <span className="text-[9px] font-black uppercase tracking-widest">COMPLIED</span>
                                      </div>
                                   )}
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-8">
           <Card className="border-none shadow-2xl shadow-emerald-900/5 rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-8 pb-4">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-600" /> Timeline Laporan
                 </h3>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                 <div className="space-y-4">
                    <div className="flex items-start gap-4">
                       <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 shrink-0"><Calendar className="h-4 w-4" /></div>
                       <div>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tgl Terbit LHU</p>
                          <p className="text-xs font-black text-slate-700">{new Date(report.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 shrink-0"><ShieldCheck className="h-4 w-4" /></div>
                       <div>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Regulasi Acuan</p>
                          <p className="text-xs font-black text-slate-700 uppercase">{report.regulation?.name || "Standard Custom"}</p>
                       </div>
                    </div>
                 </div>
                 
                 <div className="pt-6 border-t border-slate-50">
                    <Link href={`/reporting/new?id=${report.id}`}>
                       <Button variant="outline" className="w-full h-14 rounded-2xl border-2 border-slate-100 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                          <Edit className="h-4 w-4 mr-2" /> Edit Laporan
                       </Button>
                    </Link>
                 </div>
              </CardContent>
           </Card>

           <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-3xl" />
              <div className="relative z-10 space-y-4">
                 <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-900/40">
                    <ShieldCheck className="h-6 w-6 text-white" />
                 </div>
                 <div>
                    <h4 className="font-black uppercase tracking-tight text-lg leading-tight">Digital Verification</h4>
                    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-1">Dokumen ini diterbitkan secara sah oleh sistem WahfaLab.</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
