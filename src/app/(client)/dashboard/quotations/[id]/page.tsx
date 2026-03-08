// ============================================================================
// CLIENT QUOTATION DETAIL - v1.0
// Halaman rincian penawaran harga untuk pelanggan dengan fitur persetujuan.
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChemicalLoader } from "@/components/ui";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Percent,
  Package,
  ShieldCheck,
  Calendar,
  User,
  MapPin,
  Layers,
  Printer,
  ChevronRight,
  Info
} from "lucide-react";
import { getQuotationById, updateQuotationStatus } from "@/lib/actions/quotation";
import { downloadQuotationPDF } from "@/lib/generate-quotation-pdf";
import { cn } from "@/lib/utils";

export default function ClientQuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      loadQuotation();
    }
  }, [id]);

  async function loadQuotation() {
    try {
      const data = await getQuotationById(id);
      setQuotation(data);
    } catch (error) {
      toast.error("Gagal memuat data penawaran");
    } finally {
      setLoading(false);
    }
  }

  const handlePrintPDF = async () => {
    try {
      await downloadQuotationPDF(quotation);
    } catch (error) {
      toast.error("Gagal mencetak PDF");
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === 'rejected' && !confirm("Yakin ingin menolak penawaran ini?")) return;
    
    setUpdating(true);
    try {
      await updateQuotationStatus(id, newStatus);
      toast.success(newStatus === 'accepted' ? "Penawaran Berhasil Disetujui!" : "Penawaran Telah Ditolak");
      if (newStatus === 'accepted') {
        router.push('/dashboard');
      } else {
        loadQuotation();
      }
    } catch (error) {
      toast.error("Gagal memproses permintaan");
    } finally {
      setUpdating(false);
    }
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    draft: { label: 'MENUNGGU', color: 'text-slate-600', bg: 'bg-slate-100', icon: FileText },
    sent: { label: 'MENUNGGU PERSETUJUAN', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock },
    accepted: { label: 'TELAH DISETUJUI', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle },
    rejected: { label: 'DITOLAK', color: 'text-rose-600', bg: 'bg-rose-100', icon: XCircle },
    paid: { label: 'LUNAS', color: 'text-purple-600', bg: 'bg-purple-100', icon: DollarSign }
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><ChemicalLoader /></div>;
  if (!quotation) return <div className="p-10 text-center">Data tidak ditemukan atau Anda tidak memiliki akses.</div>;

  const cfg = statusConfig[quotation.status] || statusConfig.draft;

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm bg-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
               <h1 className="text-2xl md:text-3xl font-black text-emerald-950 tracking-tight uppercase font-[family-name:var(--font-montserrat)]">RINCIAN PENAWARAN</h1>
               <Badge className={cn("font-black text-[9px] px-3 py-1 rounded-full border-none shadow-sm hidden xs:flex", cfg.bg, cfg.color)}>{cfg.label}</Badge>
            </div>
            <p className="text-slate-500 text-sm font-medium">#{quotation.quotation_number} • {new Date(quotation.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handlePrintPDF}
          className="h-12 px-6 rounded-2xl border-2 border-blue-100 text-blue-600 font-black text-xs uppercase tracking-widest hover:bg-blue-50 bg-white shadow-sm transition-all"
        >
          <Download className="mr-2 h-4 w-4" /> Unduh Dokumen (PDF)
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Status Alert for SENT status */}
          {quotation.status === 'sent' && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-100 rounded-[2rem] p-6 flex items-start gap-4 shadow-sm">
               <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                  <Info className="h-6 w-6" />
               </div>
               <div>
                  <h4 className="text-amber-900 font-black text-sm uppercase tracking-tight">Menunggu Persetujuan Anda</h4>
                  <p className="text-amber-800/70 text-xs font-medium leading-relaxed mt-1">
                    Mohon periksa rincian layanan dan biaya di bawah ini. Jika sudah sesuai, silakan klik tombol **Setujui** untuk memulai proses pengujian laboratorium.
                  </p>
               </div>
            </div>
          )}

          {/* Customer & Enterprise Info */}
          <Card className="border-none shadow-xl shadow-emerald-900/5 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
               <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner"><User className="h-6 w-6" /></div>
                  <CardTitle className="text-lg font-black uppercase tracking-widest text-emerald-950">Data Pemohon</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Kontak</p>
                     <p className="font-black text-slate-800 text-base">{quotation.profile.full_name}</p>
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Terdaftar</p>
                     <p className="font-bold text-slate-600 text-sm">{quotation.profile.email || '-'}</p>
                  </div>
               </div>
               <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-white shadow-inner group">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] mb-2">Instansi / Perusahaan</p>
                  <h3 className="text-lg font-black leading-tight uppercase text-slate-800">{quotation.profile.company_name || 'Personal Account'}</h3>
                  <div className="mt-3 flex items-start gap-2">
                     <MapPin className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
                     <p className="text-xs font-bold text-slate-400 leading-relaxed italic">{quotation.profile.address || 'Alamat tidak terdata'}</p>
                  </div>
               </div>
            </CardContent>
          </Card>

          {/* Laboratory Services List */}
          <Card className="border-none shadow-xl shadow-emerald-900/5 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
               <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-600 shadow-inner"><Layers className="h-6 w-6" /></div>
                  <CardTitle className="text-lg font-black uppercase tracking-widest text-emerald-950">Layanan Pengujian</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
               {quotation.items.map((item: any, idx: number) => {
                 const isService = !!item.service;
                 return (
                  <div key={item.id} className="p-6 bg-white border-2 border-slate-50 rounded-[2rem] hover:border-emerald-100 transition-all">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                           <span className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400">{idx + 1}</span>
                           <h4 className="font-black text-slate-800 text-base uppercase tracking-tight">{item.service?.name || item.equipment?.name || 'Item'}</h4>
                        </div>
                        
                        {isService && (
                          <div className="flex items-center gap-2 ml-11">
                             <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                             <p className="text-[10px] font-black text-emerald-700 uppercase italic tracking-widest">
                                {(item.service.regulation || item.service.regulation_ref?.name) || 'Standar WahfaLab Quality'}
                             </p>
                          </div>
                        )}

                        {isService && item.parameter_snapshot && (
                          <div className="flex flex-wrap gap-2 pt-3 ml-11">
                            {item.parameter_snapshot.split(", ").map((p: string, pIdx: number) => (
                              <Badge key={pIdx} variant="secondary" className="bg-blue-50 text-blue-600 font-bold text-[9px] uppercase border-blue-100 h-6 px-2.5 rounded-lg shadow-sm">
                                {p}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex flex-col justify-center min-w-[150px] border-t md:border-t-0 md:border-l border-slate-50 pt-4 md:pt-0 md:pl-6">
                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-[2px]">Estimasi Biaya</p>
                         <p className="font-black text-emerald-700 text-lg leading-none mt-1">Rp {(item.qty * item.price_snapshot).toLocaleString('id-ID')}</p>
                         <p className="text-[10px] font-bold text-slate-400 mt-1">{item.qty} Unit x Rp {item.price_snapshot?.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  </div>
                 );
               })}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Financial Summary */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="bg-emerald-950 p-8 md:p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border-4 border-emerald-900 group">
            <div className="absolute -top-20 -right-20 h-64 w-64 bg-emerald-600 rounded-full opacity-20 blur-3xl" />
            <div className="relative space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black opacity-40 uppercase tracking-[2px]"><span>Subtotal</span><span className="text-emerald-100 font-mono">Rp {quotation.subtotal?.toLocaleString('id-ID')}</span></div>
                {quotation.discount_amount > 0 && <div className="flex justify-between items-center text-[10px] font-black text-rose-400/80 uppercase tracking-[2px]"><span>Diskon</span><span className="text-rose-400 font-mono">- Rp {quotation.discount_amount?.toLocaleString('id-ID')}</span></div>}
                {quotation.use_tax && <div className="flex justify-between items-center text-[10px] font-black text-emerald-400/80 uppercase tracking-[2px]"><span>PPN 11%</span><span className="text-emerald-400 font-mono">+ Rp {quotation.tax_amount?.toLocaleString('id-ID')}</span></div>}
              </div>
              <div className="border-t-2 border-white/10 pt-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-black text-emerald-300 uppercase tracking-[4px] leading-none">Grand Total</span>
                  <span className="text-[8px] text-emerald-500/60 font-bold uppercase tracking-widest italic mb-4">Nominal Yang Harus Dibayar</span>
                  <span className="text-3xl md:text-4xl font-black font-mono tracking-tighter text-white drop-shadow-2xl">Rp {quotation.total_amount?.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Decision Card (Only for sent status) */}
          {(quotation.status === 'sent') && (
            <Card className="border-none shadow-2xl shadow-emerald-900/5 rounded-[2.5rem] overflow-hidden bg-white">
               <CardContent className="p-8 space-y-6 text-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2 text-emerald-600 shadow-inner">
                     <ShieldCheck className="h-8 w-8" />
                  </div>
                  <div>
                     <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">Konfirmasi Dokumen</h3>
                     <p className="text-slate-400 text-xs font-medium mt-2">Pastikan data pengujian sudah sesuai dengan kebutuhan perusahaan Anda.</p>
                  </div>
                  
                  <div className="space-y-3 pt-4">
                     <Button 
                       onClick={() => handleStatusUpdate('accepted')}
                       disabled={updating}
                       className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                     >
                        Setujui Penawaran <CheckCircle className="h-5 w-5" />
                     </Button>
                     <Button 
                       variant="outline"
                       onClick={() => handleStatusUpdate('rejected')}
                       disabled={updating}
                       className="w-full h-14 border-2 border-rose-50 text-rose-600 font-black uppercase tracking-widest rounded-2xl hover:bg-rose-50 transition-all active:scale-95"
                     >
                        Tolak / Revisi <XCircle className="h-5 w-5" />
                     </Button>
                  </div>
               </CardContent>
            </Card>
          )}

          {/* Timeline & Info Info */}
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
             <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-4">
                   <span>Log Aktivitas</span>
                   <Calendar className="h-3.5 w-3.5" />
                </div>
                <div className="space-y-4">
                   <div className="flex gap-4">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase">Dokumen Diterbitkan</p>
                         <p className="text-xs font-bold text-slate-700 mt-0.5">{new Date(quotation.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase">Update Status Terakhir</p>
                         <p className="text-xs font-bold text-slate-700 mt-0.5">{new Date(quotation.updated_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                      </div>
                   </div>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
