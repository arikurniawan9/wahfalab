// ============================================================================
// PREMIUM QUOTATION DETAIL - v3.1
// Engineered for crystal clear document visibility and operational precision.
// ============================================================================

"use client";

import React, { useState, useEffect, use } from "react";
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
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Percent,
  Package,
  Truck,
  Utensils,
  Layers,
  Calendar,
  User,
  ShieldCheck,
  Beaker,
  Printer,
  ChevronRight,
  MapPin
} from "lucide-react";
import { getQuotationById, updateQuotationStatus } from "@/lib/actions/quotation";
import { downloadQuotationPDF } from "@/lib/generate-quotation-pdf";
import { cn } from "@/lib/utils";

export default function OperatorQuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
    setUpdating(true);
    try {
      await updateQuotationStatus(quotation.id, newStatus);
      toast.success(`Dokumen resmi di-${newStatus === 'accepted' ? 'terima' : 'tolak'}`);
      loadQuotation();
    } catch (error) {
      toast.error("Gagal update status");
    } finally {
      setUpdating(false);
    }
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    draft: { label: 'DRAFT', color: 'text-slate-600', bg: 'bg-slate-100', icon: FileText },
    sent: { label: 'DIKIRIM', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock },
    accepted: { label: 'DITERIMA', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle },
    rejected: { label: 'DITOLAK', color: 'text-rose-600', bg: 'bg-rose-100', icon: XCircle },
    paid: { label: 'LUNAS', color: 'text-purple-600', bg: 'bg-purple-100', icon: DollarSign }
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><ChemicalLoader /></div>;
  if (!quotation) return <div className="p-10 text-center">Dokumen tidak ditemukan.</div>;

  const cfg = statusConfig[quotation.status] || statusConfig.draft;

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 max-w-7xl mx-auto space-y-10">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <Link href="/operator/quotations">
            <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-2 border-slate-100 hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
               <h1 className="text-3xl font-black text-emerald-950 tracking-tighter uppercase font-[family-name:var(--font-montserrat)]">{quotation.quotation_number}</h1>
               <Badge className={cn("font-black text-[10px] px-3 py-1 rounded-full border-none shadow-sm", cfg.bg, cfg.color)}>{cfg.label}</Badge>
            </div>
            {quotation.title && (
              <p className="text-emerald-700 text-sm font-black uppercase tracking-tight mb-1 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 w-fit">
                {quotation.title}
              </p>
            )}
            <p className="text-slate-500 text-sm font-medium italic">Manajemen berkas penawaran digital laboratorium.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handlePrintPDF}
            className="h-12 px-6 rounded-2xl border-2 border-blue-100 text-blue-600 font-black text-xs uppercase tracking-widest hover:bg-blue-50 bg-white shadow-sm transition-all"
          >
            <Printer className="mr-2 h-4 w-4" /> Cetak Penawaran
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Customer Card */}
          <Card className="border-none shadow-2xl shadow-emerald-900/5 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
               <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600 shadow-inner"><User className="h-6 w-6" /></div>
                  <div>
                     <CardTitle className="text-xl font-black uppercase tracking-tight text-emerald-950">Informasi Klien</CardTitle>
                     <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Detail entitas pemohon layanan</p>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                     <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Nama Lengkap</p>
                     <p className="font-black text-slate-800 text-base">{quotation.profile.full_name}</p>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                     <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Kontak Email</p>
                     <p className="font-bold text-slate-600 text-sm">{quotation.profile.email || '-'}</p>
                  </div>
               </div>
               <div className="p-5 bg-white rounded-[2rem] border-2 border-slate-50 relative overflow-hidden group">
                  <div className="relative z-10">
                     <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] mb-3">Instansi / Perusahaan</p>
                     <h3 className="text-xl font-black leading-tight uppercase text-slate-800 group-hover:text-emerald-700 transition-colors">{quotation.profile.company_name || 'Personal Account'}</h3>
                     <div className="mt-4 flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-slate-400 leading-relaxed italic">{quotation.profile.address || 'Alamat tidak terdata'}</p>
                     </div>
                  </div>
               </div>
            </CardContent>
          </Card>

          {/* Items Card */}
          <Card className="border-none shadow-2xl shadow-emerald-900/5 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-row items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-600 shadow-inner"><Layers className="h-6 w-6" /></div>
                  <div>
                     <CardTitle className="text-xl font-black uppercase tracking-tight text-emerald-950">Daftar Layanan</CardTitle>
                     <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Rincian parameter pengujian laboratorium</p>
                  </div>
               </div>
               <Badge variant="outline" className="h-8 rounded-xl border-2 border-slate-100 px-4 font-black text-[10px]">{quotation.items.length} ITEMS</Badge>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
               {quotation.items.map((item: any, idx: number) => {
                 const isService = !!item.service;
                 return (
                  <div key={item.id} className="p-6 bg-white border-2 border-slate-100 rounded-[2rem] hover:shadow-xl hover:border-emerald-100 transition-all group">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                           <span className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">{idx + 1}</span>
                           <h4 className="font-black text-slate-800 text-base uppercase tracking-tight">{item.service?.name || item.equipment?.name || 'Item'}</h4>
                        </div>
                        
                        {/* REGULATION DISPLAY */}
                        {isService && (
                          <div className="flex items-center gap-2 ml-8">
                             <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                             <p className="text-[10px] font-black text-emerald-700 uppercase italic tracking-widest">
                                {(item.service.regulation || item.service.regulation_ref?.name) || 'Standar Umum Laboratory'}
                             </p>
                          </div>
                        )}

                        {/* PARAMETERS DISPLAY */}
                        {isService && item.parameter_snapshot && (
                          <div className="flex flex-wrap gap-2 pt-3 pl-8">
                            {item.parameter_snapshot.split(", ").map((p: string, pIdx: number) => (
                              <Badge key={pIdx} variant="secondary" className="bg-blue-50 text-blue-600 font-bold text-[9px] uppercase border-blue-100 h-6 px-2.5 rounded-lg shadow-sm">
                                {p}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right flex flex-col justify-center min-w-[150px]">
                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-[2px]">Subtotal Item</p>
                         <p className="font-black text-emerald-700 text-lg leading-none mt-1">Rp {(item.qty * item.price_snapshot).toLocaleString('id-ID')}</p>
                         <p className="text-[10px] font-bold text-slate-400 mt-1">{item.qty} Unit x Rp {item.price_snapshot?.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  </div>
                 );
               })}
            </CardContent>
          </Card>

          {/* Operational Costs Card */}
          {(quotation.perdiem_name || quotation.transport_name) && (
            <Card className="border-none shadow-2xl shadow-emerald-900/5 rounded-[2.5rem] overflow-hidden bg-white">
               <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {quotation.perdiem_name && (
                    <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-amber-600"><Utensils className="h-6 w-6" /></div>
                          <div><p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Perdiem</p><p className="font-black text-slate-800 text-sm truncate max-w-[120px]">{quotation.perdiem_name}</p></div>
                       </div>
                       <div className="text-right"><p className="font-black text-slate-800 text-sm leading-none">Rp {(quotation.perdiem_price * quotation.perdiem_qty).toLocaleString('id-ID')}</p><p className="text-[9px] font-bold text-slate-400 mt-1">{quotation.perdiem_qty} Hari</p></div>
                    </div>
                  )}
                  {quotation.transport_name && (
                    <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-blue-600"><Truck className="h-6 w-6" /></div>
                          <div><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Transport</p><p className="font-black text-slate-800 text-sm truncate max-w-[120px]">{quotation.transport_name}</p></div>
                       </div>
                       <div className="text-right"><p className="font-black text-slate-800 text-sm leading-none">Rp {(quotation.transport_price * quotation.transport_qty).toLocaleString('id-ID')}</p><p className="text-[9px] font-bold text-slate-400 mt-1">{quotation.transport_qty} Unit</p></div>
                    </div>
                  )}
               </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar - Summary & Action */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="bg-emerald-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border-4 border-emerald-900 group">
            <div className="absolute -top-20 -right-20 h-64 w-64 bg-emerald-600 rounded-full opacity-20 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
            <div className="relative space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-black opacity-40 uppercase tracking-[2px]"><span>Subtotal</span><span className="text-emerald-100">Rp {quotation.subtotal?.toLocaleString('id-ID')}</span></div>
                {quotation.discount_amount > 0 && <div className="flex justify-between items-center text-[10px] font-black text-rose-400/80 uppercase tracking-[2px]"><span>Diskon</span><span className="text-rose-400">- Rp {quotation.discount_amount?.toLocaleString('id-ID')}</span></div>}
                {quotation.use_tax && <div className="flex justify-between items-center text-[10px] font-black text-emerald-400/80 uppercase tracking-[2px]"><span>PPN 11%</span><span className="text-emerald-400">+ Rp {quotation.tax_amount?.toLocaleString('id-ID')}</span></div>}
              </div>
              <div className="border-t-2 border-white/10 pt-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] md:text-[12px] font-black text-emerald-300 uppercase tracking-[4px] leading-none">Grand Total</span>
                  <span className="text-[8px] md:text-[10px] text-emerald-500/60 font-bold uppercase tracking-widest italic mb-4">Official Document Amount</span>
                  <span className="text-3xl md:text-4xl font-black font-mono tracking-tighter text-white drop-shadow-2xl">Rp {quotation.total_amount?.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions Sidebar */}
          <Card className="border-none shadow-2xl shadow-emerald-900/5 rounded-[2.5rem] overflow-hidden bg-white">
             <CardContent className="p-8 space-y-6">
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2 mb-2">
                   <ShieldCheck className="h-4 w-4 text-emerald-600" /> Operasional Status
                </h3>
                
                {(quotation.status === 'draft' || quotation.status === 'sent') ? (
                   <div className="space-y-3">
                      <Button 
                        onClick={() => handleStatusUpdate('accepted')}
                        disabled={updating}
                        className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                      >
                         Terima Penawaran <CheckCircle className="h-5 w-5" />
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleStatusUpdate('rejected')}
                        disabled={updating}
                        className="w-full h-14 border-2 border-rose-50 text-rose-600 font-black uppercase tracking-widest rounded-2xl hover:bg-rose-50 transition-all active:scale-95"
                      >
                         Tolak Penawaran <XCircle className="h-5 w-5" />
                      </Button>
                   </div>
                ) : (
                   <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 flex flex-col items-center text-center gap-3">
                      <div className={cn("h-16 w-16 rounded-full flex items-center justify-center text-white shadow-lg", cfg.bg.replace('bg-', 'bg-').replace('100', '600'))}>
                         <cfg.icon className="h-8 w-8" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Saat Ini</p>
                         <p className={cn("font-black text-lg uppercase", cfg.color)}>{cfg.label}</p>
                      </div>
                   </div>
                )}

                <div className="pt-4 border-t border-slate-50 space-y-4">
                   <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span>Timeline Dokumen</span>
                      <Calendar className="h-3 w-3" />
                   </div>
                   <div className="space-y-3">
                      <div className="flex items-center gap-3">
                         <div className="h-2 w-2 rounded-full bg-emerald-500" />
                         <p className="text-[11px] font-bold text-slate-600">Dibuat: {new Date(quotation.created_at).toLocaleDateString('id-ID')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="h-2 w-2 rounded-full bg-slate-300" />
                         <p className="text-[11px] font-bold text-slate-600">Terakhir: {new Date(quotation.updated_at).toLocaleDateString('id-ID')}</p>
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
