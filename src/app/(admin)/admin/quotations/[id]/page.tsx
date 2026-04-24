"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Printer,
  Trash2,
  FileText,
  User,
  Calendar,
  CreditCard,
  Truck,
  Users,
  Send,
  CheckCircle,
  XCircle,
  FileDown,
  Clock,
  Banknote,
  MoreVertical,
  Beaker,
  Scale,
  History,
  DollarSign,
  Wrench,
  MapPin,
  ExternalLink,
  Building2,
  Mail,
  Contact2
} from "lucide-react";
import { toast } from "sonner";
import { getQuotationById, deleteQuotation, updateQuotationStatus } from "@/lib/actions/quotation";
import { LoadingOverlay, LoadingButton } from "@/components/ui";
import { PageSkeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { downloadQuotationPDF } from "@/lib/generate-quotation-pdf";
import { cn } from "@/lib/utils";

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const statusLabelMap: Record<string, string> = {
    draft: "Draft",
    accepted: "Diterima",
    rejected: "Ditolak",
    paid: "Lunas",
  };

  const loadQuotation = async () => {
    setLoading(true);
    try {
      const result = await getQuotationById(params.id as string);
      if (result) {
        setQuotation(result);
      } else {
        toast.error("Penawaran tidak ditemukan");
        router.push("/admin/quotations");
      }
    } catch (error) {
      toast.error("Gagal memuat detail penawaran");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) loadQuotation();
  }, [params.id]);

  const confirmDelete = async () => {
    setSubmitting(true);
    try {
      await deleteQuotation(quotation.id);
      toast.success("Penawaran berhasil dihapus");
      router.push("/admin/quotations");
    } catch (error) {
      toast.error("Gagal menghapus penawaran");
    } finally {
      setSubmitting(false);
      setIsDeleting(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      await downloadQuotationPDF(quotation);
      toast.success("PDF berhasil diunduh");
    } catch (error) {
      toast.error("Gagal mengunduh PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setSubmitting(true);
    try {
      await updateQuotationStatus(quotation.id, newStatus);
      toast.success(`Status berhasil diubah menjadi ${statusLabelMap[newStatus] || newStatus}`);
      setQuotation({ ...quotation, status: newStatus });
    } catch (error) {
      toast.error("Gagal mengubah status");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "draft": return { color: "bg-slate-100 text-slate-700 border-slate-200", icon: Clock, label: "Draft" };
      case "accepted": return { color: "bg-emerald-100 text-emerald-700 border-emerald-200 shadow-emerald-900/5", icon: CheckCircle, label: "Diterima" };
      case "rejected": return { color: "bg-rose-100 text-rose-700 border-rose-200", icon: XCircle, label: "Ditolak" };
      case "paid": return { color: "bg-purple-100 text-purple-700 border-purple-200", icon: DollarSign, label: "Lunas" };
      default: return { color: "bg-slate-100 text-slate-700 border-slate-200", icon: FileText, label: status };
    }
  };

  if (loading) return <div className="p-10"><PageSkeleton /></div>;
  if (!quotation) return null;

  const statusCfg = getStatusConfig(quotation.status);

  return (
    <div className="p-4 md:p-10 bg-slate-50/30 min-h-screen space-y-10 pb-24 md:pb-10 font-[family-name:var(--font-geist-sans)]">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <Link href="/admin/quotations">
            <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-emerald-600 transition-all">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div className="space-y-1">
            <div className="flex flex-col gap-1">
              <Badge className={cn("px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest border", statusCfg.color)}>
                <statusCfg.icon className="h-3 w-3 mr-2" /> {statusCfg.label}
              </Badge>
              {quotation.title && (
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                  {quotation.title}
                </h1>
              )}
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                {quotation.quotation_number}
              </p>
            </div>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" /> Diterbitkan: {new Date(quotation.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 font-bold uppercase text-[10px] tracking-widest bg-white shadow-sm hover:bg-slate-50 transition-all">
                <FileDown className="mr-2 h-4 w-4 text-emerald-600" /> Atur Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border-emerald-50 shadow-2xl">
              <DropdownMenuItem onClick={() => handleStatusUpdate('draft')} className="rounded-xl p-3 text-[10px] font-bold uppercase tracking-widest"><FileText className="mr-3 h-4 w-4 text-slate-400" /> Kembalikan ke Draft</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusUpdate('accepted')} className="rounded-xl p-3 text-[10px] font-bold uppercase tracking-widest"><CheckCircle className="mr-3 h-4 w-4 text-emerald-500" /> Tandai Diterima</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusUpdate('rejected')} className="rounded-xl p-3 text-[10px] font-bold uppercase tracking-widest text-rose-600"><XCircle className="mr-3 h-4 w-4 text-rose-500" /> Tandai Ditolak</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-50" />
              <DropdownMenuItem onClick={() => handleStatusUpdate('paid')} className="rounded-xl p-3 text-[10px] font-bold uppercase tracking-widest"><DollarSign className="mr-3 h-4 w-4 text-purple-500" /> Tandai Lunas/Dibayar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" onClick={() => setIsDeleting(true)} className="h-12 w-12 rounded-2xl border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all">
            <Trash2 className="h-5 w-5" />
          </Button>

          <Button 
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="h-12 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-900/10 active:scale-95 transition-all"
          >
            {isDownloading ? (
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <><Printer className="mr-2 h-4 w-4" /> Cetak PDF</>
            )}
          </Button>
        </div>
      </div>

      {/* Timeline Status */}
      <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          {[
            { key: 'draft', label: 'Draft', icon: FileText, date: quotation.created_at },
            { key: 'accepted', label: 'Diterima', icon: CheckCircle, date: quotation.status === 'accepted' || quotation.status === 'paid' ? quotation.updated_at : null },
            { key: 'paid', label: 'Pembayaran', icon: Banknote, date: quotation.status === 'paid' ? quotation.updated_at : null }
          ].map((step, idx, arr) => {
            const isActive = quotation.status === step.key || (step.key === 'draft' && quotation.status !== 'rejected') || (step.key === 'accepted' && quotation.status === 'paid');
            const isCompleted = (step.key === 'draft' && quotation.status !== 'draft') || (step.key === 'accepted' && quotation.status === 'paid');
            
            return (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center gap-3 flex-1">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 shadow-inner",
                    isActive ? "bg-emerald-600 border-emerald-500 text-white scale-110 shadow-emerald-900/20" : "bg-slate-50 border-slate-100 text-slate-300"
                  )}>
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className={cn("text-[10px] font-black uppercase tracking-widest", isActive ? "text-emerald-900" : "text-slate-400")}>{step.label}</p>
                    {step.date && <p className="text-[8px] font-bold text-slate-300 uppercase mt-0.5">{new Date(step.date).toLocaleDateString("id-ID")}</p>}
                  </div>
                </div>
                {idx < arr.length - 1 && (
                  <div className="hidden md:block flex-1 h-0.5 bg-slate-100 relative">
                    <div className={cn("absolute inset-0 bg-emerald-500 transition-all duration-1000", isCompleted ? "w-full" : "w-0")} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-[2rem] border-none shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
            <CardHeader className="p-8 border-b bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                    <Beaker className="h-6 w-6 text-emerald-600" /> Daftar Layanan Lab
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Rincian parameter pengujian dan alat</CardDescription>
                </div>
                <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-700 font-black text-[10px] uppercase tracking-widest">
                  {quotation.items.length} Items
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Item</th>
                      <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Qty</th>
                      <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Satuan</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {quotation.items.map((item: any) => {
                      const itemName = item.service?.name || item.equipment?.name || "Item Tidak Dikenal";
                      return (
                        <tr key={item.id} className="hover:bg-emerald-50/20 transition-all group">
                          <td className="px-8 py-6">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                                  {item.equipment ? <Wrench className="h-4 w-4" /> : <Beaker className="h-4 w-4" />}
                                </div>
                                <span className="font-black text-slate-800 uppercase tracking-tight text-sm">{itemName}</span>
                              </div>
                              <div className="flex items-center gap-3 pl-11">
                                {item.equipment && (
                                  <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-widest">ALAT LAB</span>
                                )}
                                {(item.service?.regulation || item.service?.regulation_ref?.name) && (
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Scale className="h-3 w-3" /> {item.service?.regulation || item.service?.regulation_ref?.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-center font-black text-slate-900 text-sm">{item.qty}</td>
                          <td className="px-6 py-6 text-right font-bold text-slate-500 text-[13px]">Rp {Number(item.price_snapshot).toLocaleString("id-ID")}</td>
                          <td className="px-8 py-6 text-right">
                            <span className="font-black text-emerald-700 text-sm">
                              Rp {(item.qty * Number(item.price_snapshot)).toLocaleString("id-ID")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Additional Costs Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden group hover:border-emerald-200 border-2 border-transparent transition-all">
              <CardContent className="p-8 flex items-center gap-6">
                <div className="h-16 w-16 rounded-[1.5rem] bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                  <Users className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Biaya Uang Harian</p>
                  <p className="font-black text-slate-800 text-lg tracking-tight leading-none uppercase">
                    Rp {Number(quotation.perdiem_price).toLocaleString("id-ID")}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="outline" className="text-[9px] font-black border-slate-100 text-slate-400">{quotation.perdiem_qty} HARI</Badge>
                    <span className="text-emerald-600 font-black text-sm">Total: Rp {(Number(quotation.perdiem_price) * quotation.perdiem_qty).toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden group hover:border-blue-200 border-2 border-transparent transition-all">
              <CardContent className="p-8 flex items-center gap-6">
                <div className="h-16 w-16 rounded-[1.5rem] bg-orange-50 text-orange-600 flex items-center justify-center shadow-inner group-hover:bg-orange-600 group-hover:text-white transition-all duration-500">
                  <Truck className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Transport & Akomodasi</p>
                  <p className="font-black text-slate-800 text-lg tracking-tight leading-none uppercase">
                    Rp {Number(quotation.transport_price).toLocaleString("id-ID")}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="outline" className="text-[9px] font-black border-slate-100 text-slate-400">{quotation.transport_qty} UNIT</Badge>
                    <span className="text-emerald-600 font-black text-sm">Total: Rp {(Number(quotation.transport_price) * quotation.transport_qty).toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar Sticky Info */}
        <div className="space-y-8">
          <Card className="rounded-[2rem] border-none shadow-2xl bg-white overflow-hidden group/klien">
            <CardHeader className="p-6 border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <Contact2 className="h-4 w-4 text-emerald-600" /> Profil Pelanggan
              </CardTitle>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-5">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Nama Lengkap</span>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none">{quotation.profile.full_name}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-sm">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Perusahaan</span>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter leading-none">{quotation.profile.company_name || "Personal Client"}</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100 shadow-sm">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Alamat Email</span>
                    <p className="text-[11px] font-bold text-slate-500 lowercase leading-none">{quotation.profile.email || "-"}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-dashed border-slate-100">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block mb-3">Alamat Klien</span>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(quotation.profile.address || "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 group/map hover:bg-emerald-50 hover:border-emerald-200 transition-all cursor-pointer"
                  >
                    <div className="h-8 w-8 rounded-lg bg-white text-emerald-600 flex items-center justify-center shrink-0 border border-slate-100 group-hover/map:scale-110 transition-transform shadow-sm">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] font-bold text-slate-600 leading-relaxed line-clamp-2 uppercase italic tracking-tighter">
                        {quotation.profile.address || "Alamat belum diatur"}
                      </p>
                      <span className="text-[7px] font-black text-emerald-600 flex items-center gap-1 uppercase tracking-widest opacity-0 group-hover/map:opacity-100 transition-opacity">
                        Buka di Google Maps <ExternalLink className="h-2 w-2" />
                      </span>
                    </div>
                  </a>
                </div>

                <div className="pt-4 border-t border-dashed border-slate-100">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block mb-3">Lokasi Sampling</span>
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="h-8 w-8 rounded-lg bg-white text-emerald-600 flex items-center justify-center shrink-0 border border-slate-100 shadow-sm">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[10px] font-bold text-slate-600 leading-relaxed line-clamp-2 uppercase italic tracking-tighter">
                        {quotation.sampling_location || "Lokasi sampling belum diatur"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-none shadow-[0_30px_60px_-15px_rgba(6,78,59,0.3)] bg-emerald-950 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500 rounded-full blur-[100px] opacity-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-400 rounded-full blur-[80px] opacity-10" />
            
            <CardHeader className="p-8 pb-4 relative z-10">
              <CardTitle className="text-emerald-300 text-[10px] font-black uppercase tracking-[4px]">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-5 relative z-10">
              <div className="space-y-3">
                <div className="flex justify-between text-[11px] font-bold text-white/40 uppercase tracking-widest">
                  <span>Subtotal Item</span>
                  <span className="text-white/80 font-mono">Rp {Number(quotation.subtotal).toLocaleString("id-ID")}</span>
                </div>
                {Number(quotation.discount_amount) > 0 && (
                  <div className="flex justify-between text-[11px] font-black text-rose-400 uppercase tracking-widest">
                    <span>Potongan Diskon</span>
                    <span className="font-mono">- Rp {Number(quotation.discount_amount).toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between text-[11px] font-bold text-white/40 uppercase tracking-widest pb-4">
                  <span>PPN 11%</span>
                  <span className="text-white/80 font-mono">{quotation.use_tax ? `Rp ${Number(quotation.tax_amount).toLocaleString("id-ID")}` : "0"}</span>
                </div>
              </div>
              
              <div className="border-t border-white/10 pt-6 mt-2 flex flex-col gap-2">
                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-[6px] animate-pulse">Grand Total</span>
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-black font-mono tracking-tighter text-white">
                    Rp {Number(quotation.total_amount).toLocaleString("id-ID")}
                  </span>
                  <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/10 shadow-lg">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={isDeleting} onOpenChange={(open) => !open && setIsDeleting(false)}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-10">
          <AlertDialogHeader>
            <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-6 border border-rose-100 shadow-inner">
              <Trash2 className="h-10 w-10" />
            </div>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight text-center text-slate-900">Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-500 font-medium py-4">
              Apakah Anda yakin ingin menghapus penawaran <strong className="text-slate-900">{quotation?.quotation_number}</strong>? Data akan dihapus permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-4 mt-6">
            <AlertDialogCancel className="rounded-2xl h-14 flex-1 font-black text-slate-400 uppercase text-[10px] tracking-widest border-none hover:bg-slate-50">Batal</AlertDialogCancel>
            <LoadingButton
              loading={submitting}
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
              className="bg-rose-600 hover:bg-rose-700 rounded-2xl h-14 flex-1 font-black text-white uppercase text-[10px] tracking-widest shadow-xl shadow-rose-900/20"
            >
              Ya, Hapus Data
            </LoadingButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LoadingOverlay 
        isOpen={submitting} 
        title="Sinkronisasi Database..." 
        description="Mohon tunggu sebentar, data sedang diproses" 
      />
    </div>
  );
}
