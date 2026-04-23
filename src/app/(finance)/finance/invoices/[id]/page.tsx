"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { pdf } from "@react-pdf/renderer";
import {
  ArrowLeft,
  Download,
  Send,
  Printer,
  CreditCard,
  Calendar,
  FileText,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Receipt,
  X
} from "lucide-react";
import Link from "next/link";
import { getInvoiceById, sendInvoiceToCustomer, updateInvoiceStatus } from "@/lib/actions/invoice";
import { InvoicePDF } from "@/components/pdf/InvoicePDF";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { ChemicalLoader, LoadingOverlay, LoadingButton } from "@/components/ui";
type InvoicePdfData = React.ComponentProps<typeof InvoicePDF>["data"];

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  sent: "bg-blue-100 text-blue-700 border-blue-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  overdue: "bg-amber-100 text-amber-700 border-amber-200"
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Terkirim",
  paid: "Lunas",
  cancelled: "Dibatalkan",
  overdue: "Jatuh Tempo"
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isPaidModalOpen, setIsPaidModalOpen] = useState(false);

  useEffect(() => {
    loadInvoice();
  }, [params.id]);

  async function loadInvoice() {
    setLoading(true);
    try {
      const result = await getInvoiceById(params.id as string);
      if (result.error) {
        toast.error(result.error);
        router.push("/finance/invoices");
        return;
      }
      setInvoice(result);
    } catch (error) {
      console.error('Load invoice error:', error);
      toast.error("Gagal memuat invoice");
    } finally {
      setLoading(false);
    }
  }

  const handleDownloadPdf = async () => {
    if (!invoice) return;

    try {
      const companyProfile = {
        company_name: 'WahfaLab',
        address: 'Jl. Laboratorium No. 123',
        phone: '+62 812-3456-7890',
        email: 'info@wahfalab.com',
        logo_url: '/logo-wahfalab.png',
        npwp: '01.234.567.8-901.000'
      };

      const invoicePdfData: InvoicePdfData = {
        invoice_number: invoice.invoice_number,
        amount: Number(invoice.amount || 0),
        status: String(invoice.status || "draft"),
        due_date: String(invoice.due_date || new Date().toISOString()),
        paid_at: invoice.paid_at,
        created_at: String(invoice.created_at || new Date().toISOString()),
        notes: invoice.notes || null,
        job_order: {
          tracking_code: invoice.job_order?.tracking_code || "-",
          quotation: {
            quotation_number: invoice.job_order?.quotation?.quotation_number || "-",
            subtotal: Number(invoice.job_order?.quotation?.subtotal || 0),
            tax_amount: Number(invoice.job_order?.quotation?.tax_amount || 0),
            use_tax: Boolean(invoice.job_order?.quotation?.use_tax),
            total_amount: Number(invoice.job_order?.quotation?.total_amount || invoice.amount || 0),
            perdiem_price: invoice.job_order?.quotation?.perdiem_price ?? null,
            perdiem_qty: invoice.job_order?.quotation?.perdiem_qty ?? null,
            perdiem_name: invoice.job_order?.quotation?.perdiem_name ?? null,
            transport_price: invoice.job_order?.quotation?.transport_price ?? null,
            transport_qty: invoice.job_order?.quotation?.transport_qty ?? null,
            transport_name: invoice.job_order?.quotation?.transport_name ?? null,
            profile: {
              full_name: invoice.job_order?.quotation?.profile?.full_name || null,
              company_name: invoice.job_order?.quotation?.profile?.company_name || null,
              email: invoice.job_order?.quotation?.profile?.email || null,
              phone: invoice.job_order?.quotation?.profile?.phone || null,
              address: invoice.job_order?.quotation?.profile?.address || null
            },
            items: (invoice.job_order?.quotation?.items || []).map((item: any, idx: number) => ({
              id: String(item.id || idx),
              qty: Number(item.qty || 1),
              price_snapshot: Number(item.price_snapshot || 0),
              parameter_snapshot: item.parameter_snapshot || null,
              service: item.service ? {
                name: item.service.name,
                category: item.service.category || null,
                regulation: item.service.regulation || item.service.regulation_ref?.name || null
              } : null,
              equipment: item.equipment ? { name: item.equipment.name } : null
            }))
          }
        }
      };

      const blob = await pdf(<InvoicePDF data={invoicePdfData} company={companyProfile} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("✅ Invoice berhasil diunduh");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("Gagal membuat PDF invoice");
    }
  };

  const handleSendToCustomer = () => {
    if (!invoice) return;
    const customerEmail = invoice.job_order?.quotation?.profile?.email;
    if (!customerEmail) {
      toast.error("Email customer tidak tersedia");
      return;
    }
    setIsSendModalOpen(true);
  };

  const confirmSendToCustomer = async () => {
    const customerEmail = invoice.job_order?.quotation?.profile?.email;
    setSending(true);
    try {
      const result = await sendInvoiceToCustomer(invoice.id, customerEmail);
      if (result.error) throw new Error(result.error);
      
      toast.success("✅ Invoice berhasil dikirim ke customer");
      setIsSendModalOpen(false);
      loadInvoice();
    } catch (error) {
      toast.error("Gagal mengirim invoice");
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsPaid = () => {
    if (!invoice) return;
    setIsPaidModalOpen(true);
  };

  const confirmMarkAsPaid = async () => {
    setMarkingPaid(true);
    try {
      const result = await updateInvoiceStatus(invoice.id, 'paid');
      if (result.error) throw new Error(result.error);
      
      toast.success("✅ Invoice ditandai sebagai lunas");
      setIsPaidModalOpen(false);
      loadInvoice();
    } catch (error) {
      toast.error("Gagal mengubah status invoice");
    } finally {
      setMarkingPaid(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <ChemicalLoader />
        <p className="mt-4 text-emerald-800 font-bold uppercase tracking-widest text-[10px] animate-pulse">Memuat Data Invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-4 md:p-8">
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Invoice tidak ditemukan</p>
            <Link href="/finance/invoices">
              <Button variant="link" className="mt-2">Kembali</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/finance/invoices"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-all mb-4 text-xs font-black uppercase tracking-widest group"
        >
          <div className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-emerald-200 group-hover:bg-emerald-50">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <span>KEMBALI KE DAFTAR INVOICE</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-emerald-900 uppercase">
                Detail Invoice
              </h1>
              <Badge className={cn(
                "text-[10px] h-6 px-3 font-bold uppercase tracking-wide",
                statusColors[invoice.status] || statusColors.draft
              )}>
                {statusLabels[invoice.status] || invoice.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Receipt className="h-4 w-4" />
              <span className="font-mono">{invoice.invoice_number}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadPdf}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-12 px-6 font-bold text-xs uppercase"
            >
              <Download className="h-4 w-4 mr-2" />
              Unduh PDF
            </Button>
            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
              <>
                <Button
                  onClick={handleSendToCustomer}
                  disabled={sending}
                  variant="outline"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 rounded-2xl h-12 px-6 font-bold text-xs uppercase"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Kirim ke Customer
                </Button>
                <Button
                  onClick={handleMarkAsPaid}
                  variant="outline"
                  className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-2xl h-12 px-6 font-bold text-xs uppercase"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Tandai Lunas
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid gap-6 grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="rounded-[2rem] border-none shadow-lg shadow-slate-200/50 bg-emerald-50/50">
          <CardContent className="p-6 text-center flex flex-col items-center gap-2">
            <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Jumlah Tagihan</p>
            <p className="text-xl font-black text-emerald-700">{formatCurrency(Number(invoice.amount))}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-lg shadow-slate-200/50">
          <CardContent className="p-6 text-center flex flex-col items-center gap-2">
            <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <Calendar className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Jatuh Tempo</p>
            <p className="text-lg font-black text-slate-800">{formatDate(invoice.due_date)}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-lg shadow-slate-200/50">
          <CardContent className="p-6 text-center flex flex-col items-center gap-2">
            <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <Building className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer</p>
            <p className="text-sm font-black text-slate-800 truncate w-full">{invoice.job_order?.quotation?.profile?.full_name || 'N/A'}</p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-lg shadow-slate-200/50">
          <CardContent className="p-6 text-center flex flex-col items-center gap-2">
            <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Job Order</p>
            <p className="text-sm font-black text-purple-600 font-mono">{invoice.job_order?.tracking_code || 'N/A'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Sections */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            {/* Customer Details */}
            <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle className="text-[10px] font-black flex items-center gap-2 text-slate-400 uppercase tracking-widest">
                        <User className="h-4 w-4 text-emerald-600" />
                        Informasi Customer
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
                                <Mail className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Alamat Email</p>
                                <p className="text-sm font-black text-slate-800 truncate">{invoice.job_order.quotation.profile.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
                                <Phone className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Nomor Telepon</p>
                                <p className="text-sm font-black text-slate-800">{invoice.job_order.quotation.profile.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 md:col-span-2">
                            <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
                                <MapPin className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Alamat Lengkap</p>
                                <p className="text-sm font-bold text-slate-700 leading-relaxed">{invoice.job_order.quotation.profile.address}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle className="text-[10px] font-black flex items-center gap-2 text-slate-400 uppercase tracking-widest">
                        <CreditCard className="h-4 w-4 text-emerald-600" />
                        Rincian Layanan & Biaya
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/30">
                                    <th className="text-left py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Layanan</th>
                                    <th className="text-center py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</th>
                                    <th className="text-right py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoice.job_order?.quotation?.items?.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-5 px-8">
                                            <p className="text-sm font-black text-slate-800">{item.service?.name || item.equipment?.name || 'Layanan'}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{formatCurrency(Number(item.unit_price || item.price || 0))} / Unit</p>
                                        </td>
                                        <td className="py-5 px-4 text-center">
                                            <Badge variant="outline" className="bg-slate-50 font-black text-xs h-7 min-w-[30px] justify-center">{item.quantity || 1}</Badge>
                                        </td>
                                        <td className="py-5 px-8 text-right font-black text-sm text-slate-900">
                                            {formatCurrency(Number(item.subtotal || item.total || 0))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-emerald-900 text-white">
                                    <td colSpan={2} className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 text-right">TOTAL TAGIHAN AKHIR</td>
                                    <td className="py-6 px-8 text-xl font-black text-right">{formatCurrency(Number(invoice.amount))}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            {/* History Card */}
            <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                    <CardTitle className="text-[10px] font-black flex items-center gap-2 text-slate-400 uppercase tracking-widest">
                        <Clock className="h-4 w-4 text-slate-400" />
                        Log Aktivitas Invoice
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="space-y-8 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                        <div className="flex items-start gap-4 relative z-10">
                            <div className="h-8 w-8 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                                <FileText className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Invoice Dibuat</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{formatDateTime(invoice.created_at)}</p>
                            </div>
                        </div>
                        {invoice.status === 'sent' && (
                            <div className="flex items-start gap-4 relative z-10">
                                <div className="h-8 w-8 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                                    <Send className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Terkirim ke Klien</p>
                                    <p className="text-[10px] font-bold text-blue-500 mt-0.5">Berhasil Terkirim</p>
                                </div>
                            </div>
                        )}
                        {invoice.status === 'paid' && invoice.paid_at && (
                            <div className="flex items-start gap-4 relative z-10">
                                <div className="h-8 w-8 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                                    <CheckCircle className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Status Lunas</p>
                                    <p className="text-[10px] font-bold text-emerald-600 mt-0.5">{formatDateTime(invoice.paid_at)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* SEND TO CUSTOMER MODAL */}
      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent className="sm:max-w-md p-0 border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <div className="bg-blue-600 p-8 text-white text-center">
            <div className="mx-auto h-20 w-20 rounded-3xl bg-white/20 border border-white/20 flex items-center justify-center mb-4">
              <Send className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Kirim Invoice</DialogTitle>
            <DialogDescription className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80">
              Konfirmasi Pengiriman Elektronik
            </DialogDescription>
          </div>

          <div className="p-8 space-y-6 bg-white">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900">
                  <p className="font-black uppercase tracking-wider mb-2">TARGET PENGIRIMAN:</p>
                  <p className="font-bold text-sm">{invoice?.job_order?.quotation?.profile?.email}</p>
                  <p className="mt-1 opacity-70">Invoice akan dikirimkan dalam format PDF melalui sistem email.</p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsSendModalOpen(false)}
                disabled={sending}
                className="flex-1 rounded-2xl h-12 font-black text-[10px] uppercase text-slate-400"
              >
                Batal
              </Button>
              <LoadingButton
                onClick={confirmSendToCustomer}
                loading={sending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase shadow-lg shadow-blue-900/20"
              >
                Ya, Kirim Sekarang
              </LoadingButton>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* MARK AS PAID MODAL */}
      <Dialog open={isPaidModalOpen} onOpenChange={setIsPaidModalOpen}>
        <DialogContent className="sm:max-w-md p-0 border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <div className="bg-emerald-600 p-8 text-white text-center">
            <div className="mx-auto h-20 w-20 rounded-3xl bg-white/20 border border-white/20 flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Konfirmasi Pelunasan</DialogTitle>
            <DialogDescription className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80">
              Pembaruan Status Finansial
            </DialogDescription>
          </div>

          <div className="p-8 space-y-6 bg-white">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-4">
                <DollarSign className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900">
                  <p className="font-black uppercase tracking-wider mb-2">DETAIL TRANSAKSI:</p>
                  <p className="font-bold text-sm">{formatCurrency(Number(invoice?.amount))}</p>
                  <p className="mt-1 opacity-70 text-[10px]">Tindakan ini akan menandai invoice sebagai LUNAS dan memperbarui status Job Order.</p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsPaidModalOpen(false)}
                disabled={markingPaid}
                className="flex-1 rounded-2xl h-12 font-black text-[10px] uppercase text-slate-400"
              >
                Batal
              </Button>
              <LoadingButton
                onClick={confirmMarkAsPaid}
                loading={markingPaid}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase shadow-lg shadow-emerald-900/20"
              >
                Konfirmasi Lunas
              </LoadingButton>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <LoadingOverlay isOpen={sending || markingPaid} title="Memproses..." description="Sistem sedang memperbarui data transaksi" />
    </div>
  );
}
