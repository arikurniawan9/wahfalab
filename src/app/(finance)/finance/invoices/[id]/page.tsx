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
  Receipt
} from "lucide-react";
import Link from "next/link";
import { getInvoiceById, sendInvoiceToCustomer, updateInvoiceStatus } from "@/lib/actions/invoice";
import { InvoicePDF } from "@/components/pdf/InvoicePDF";
import { cn } from "@/lib/utils";

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

      const items = invoice.job_order?.quotation?.items?.map((item: any) => ({
        service_name: item.service?.name || item.equipment?.name || 'Layanan',
        quantity: item.quantity || 1,
        unit_price: Number(item.unit_price || item.price || 0),
        subtotal: Number(item.subtotal || item.total || 0)
      })) || [];

      const pdfData = {
        invoice_number: invoice.invoice_number,
        quotation_number: invoice.job_order?.quotation?.quotation_number,
        tracking_code: invoice.job_order?.tracking_code || '-',
        issue_date: invoice.created_at,
        due_date: invoice.due_date,
        amount: Number(invoice.amount),
        payment_status: invoice.status,
        payment_method: invoice.payment_method,
        paid_at: invoice.paid_at,
        customer: {
          full_name: invoice.job_order?.quotation?.profile?.full_name,
          company_name: invoice.job_order?.quotation?.profile?.company_name,
          email: invoice.job_order?.quotation?.profile?.email,
          phone: invoice.job_order?.quotation?.profile?.phone,
          address: invoice.job_order?.quotation?.profile?.address
        },
        items,
        company: companyProfile
      };

      const blob = await pdf(<InvoicePDF data={pdfData} />).toBlob();
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

  const handleSendToCustomer = async () => {
    if (!invoice) return;

    const customerEmail = invoice.job_order?.quotation?.profile?.email;
    if (!customerEmail) {
      toast.error("Email customer tidak tersedia");
      return;
    }

    if (!confirm(`Kirim invoice ke ${customerEmail}?`)) return;

    setSending(true);
    try {
      const result = await sendInvoiceToCustomer(invoice.id, customerEmail);
      if (result.error) throw new Error(result.error);
      
      toast.success("✅ Invoice berhasil dikirim ke customer");
      loadInvoice();
    } catch (error) {
      toast.error("Gagal mengirim invoice");
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice) return;

    if (!confirm("Tandai invoice ini sebagai lunas?")) return;

    try {
      const result = await updateInvoiceStatus(invoice.id, 'paid');
      if (result.error) throw new Error(result.error);
      
      toast.success("✅ Invoice ditandai sebagai lunas");
      loadInvoice();
    } catch (error) {
      toast.error("Gagal mengubah status invoice");
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="mb-6 space-y-2">
          <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="h-48 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-48 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-48 bg-slate-200 rounded-lg animate-pulse" />
        </div>
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
          className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors mb-4 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Invoice</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-emerald-900 font-[family-name:var(--font-montserrat)] uppercase">
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
              className="bg-emerald-600 hover:bg-emerald-700"
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
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? "Mengirim..." : "Kirim ke Customer"}
                </Button>
                <Button
                  onClick={handleMarkAsPaid}
                  variant="outline"
                  className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Amount Card */}
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-900">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Jumlah Tagihan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-700">
              {formatCurrency(Number(invoice.amount))}
            </p>
          </CardContent>
        </Card>

        {/* Due Date Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
              <Calendar className="h-4 w-4 text-amber-600" />
              Jatuh Tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-slate-800">
              {formatDate(invoice.due_date)}
            </p>
            {new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' && (
              <Badge className="mt-2 bg-amber-100 text-amber-700 text-[10px]">
                <Clock className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Customer Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
              <Building className="h-4 w-4 text-blue-600" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-semibold text-slate-800 truncate">
              {invoice.job_order?.quotation?.profile?.full_name || 'N/A'}
            </p>
            {invoice.job_order?.quotation?.profile?.company_name && (
              <p className="text-xs text-slate-500 truncate mt-1">
                {invoice.job_order?.quotation?.profile?.company_name}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Job Order Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
              <FileText className="h-4 w-4 text-purple-600" />
              Job Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-mono text-purple-600 font-semibold">
              {invoice.job_order?.tracking_code || 'N/A'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {invoice.job_order?.quotation?.quotation_number || ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-600" />
            Informasi Customer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {invoice.job_order?.quotation?.profile?.email && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-800">
                    {invoice.job_order.quotation.profile.email}
                  </p>
                </div>
              </div>
            )}
            {invoice.job_order?.quotation?.profile?.phone && (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Telepon</p>
                  <p className="text-sm font-medium text-slate-800">
                    {invoice.job_order.quotation.profile.phone}
                  </p>
                </div>
              </div>
            )}
            {invoice.job_order?.quotation?.profile?.address && (
              <div className="flex items-center gap-3 md:col-span-2">
                <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Alamat</p>
                  <p className="text-sm font-medium text-slate-800">
                    {invoice.job_order.quotation.profile.address}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-600" />
            Rincian Layanan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">No</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Layanan</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Qty</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Harga Satuan</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {invoice.job_order?.quotation?.items?.map((item: any, index: number) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-3 px-4 text-sm text-slate-600">{index + 1}</td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-800">
                      {item.service?.name || item.equipment?.name || 'Layanan'}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-slate-600">{item.quantity || 1}</td>
                    <td className="py-3 px-4 text-sm text-right text-slate-600">
                      {formatCurrency(Number(item.unit_price || item.price || 0))}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium text-emerald-700">
                      {formatCurrency(Number(item.subtotal || item.total || 0))}
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Tidak ada item
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-50">
                  <td colSpan={4} className="py-4 px-4 text-sm font-bold text-emerald-900 text-right">
                    Total
                  </td>
                  <td className="py-4 px-4 text-lg font-bold text-emerald-700 text-right">
                    {formatCurrency(Number(invoice.amount))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Timeline / History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-600" />
            Riwayat Invoice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">Invoice Dibuat</p>
                <p className="text-xs text-slate-500">{formatDateTime(invoice.created_at)}</p>
              </div>
            </div>
            {invoice.status === 'sent' && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <Send className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">Dikirim ke Customer</p>
                  <p className="text-xs text-slate-500">Status: Terkirim</p>
                </div>
              </div>
            )}
            {invoice.status === 'paid' && invoice.paid_at && (
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">Dibayar / Lunas</p>
                  <p className="text-xs text-slate-500">{formatDateTime(invoice.paid_at)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
