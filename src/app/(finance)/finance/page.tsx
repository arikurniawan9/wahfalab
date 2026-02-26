"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Wallet,
  Banknote,
  FileText
} from "lucide-react";
import Link from "next/link";
import { getAllPayments, processPayment, cancelPayment, getPendingPaymentsCount } from "@/lib/actions/payment";
import { verifyPayment } from "@/lib/actions/invoice";
import { ChemicalLoader, PageSkeleton, LoadingOverlay } from "@/components/ui";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200"
};

const statusLabels: Record<string, string> = {
  pending: "Belum Bayar",
  paid: "Lunas",
  cancelled: "Dibatalkan"
};

export default function FinanceDashboardPage() {
  const [stats, setStats] = useState({
    pending: 0,
    paid: 0,
    cancelled: 0,
    total: 0,
    totalRevenue: 0,
    pendingAmount: 0
  });
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Payment modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">("cash");
  const [transferReference, setTransferReference] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
    loadStats();
  }, [page, filterStatus]);

  async function loadData() {
    setLoading(true);
    try {
      const result = await getAllPayments(page, limit, filterStatus === "all" ? undefined : filterStatus);
      setData(result);
    } catch (error) {
      console.error('Load payments error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const allData = await getAllPayments(1, 1000);
      const items = allData.items || [];
      
      const pending = items.filter((i: any) => i.payment_status === 'pending');
      const paid = items.filter((i: any) => i.payment_status === 'paid');
      const cancelled = items.filter((i: any) => i.payment_status === 'cancelled');
      
      setStats({
        pending: pending.length,
        paid: paid.length,
        cancelled: cancelled.length,
        total: items.length,
        totalRevenue: paid.reduce((sum: number, i: any) => sum + parseFloat(i.amount || 0), 0),
        pendingAmount: pending.reduce((sum: number, i: any) => sum + parseFloat(i.amount || 0), 0)
      });
    } catch (error) {
      console.error('Load stats error:', error);
    }
  }

  const handleProcessPayment = (payment: any) => {
    setSelectedPayment(payment);
    setPaymentMethod(payment.payment_method || "cash");
    setTransferReference(payment.transfer_reference || "");
    setIsPaymentModalOpen(true);
  };

  const handleVerify = async (paymentId: string, approved: boolean) => {
    setProcessing(true);
    try {
      const result = await verifyPayment(paymentId, approved);
      if (result.error) throw new Error(result.error);
      toast.success(approved ? 'Pembayaran berhasil dikonfirmasi' : 'Pembayaran ditolak');
      setIsPaymentModalOpen(false);
      loadData();
      loadStats();
    } catch (error: any) {
      toast.error(error.message || 'Gagal memproses verifikasi');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelPayment = async (payment: any) => {
    if (!confirm(`Batalkan tagihan ${payment.invoice_number}?`)) return;

    try {
      const result = await cancelPayment(payment.id);
      if (result.error) throw new Error(result.error);
      toast.success('Tagihan berhasil dibatalkan');
      loadData();
      loadStats();
    } catch (error) {
      toast.error('Gagal membatalkan tagihan');
    }
  };

  const confirmProcessPayment = async () => {
    if (!selectedPayment) return;

    if (paymentMethod === "transfer" && !transferReference.trim()) {
      toast.error("Mohon isi nomor referensi transfer");
      return;
    }

    setProcessing(true);
    try {
      const result = await processPayment(
        selectedPayment.id,
        paymentMethod,
        paymentMethod === "transfer" ? transferReference : undefined
      );

      if (result.error) throw new Error(result.error);

      toast.success("✅ Pembayaran berhasil diproses!");
      setIsPaymentModalOpen(false);
      loadData();
      loadStats();
    } catch (error) {
      toast.error("Gagal memproses pembayaran");
    } finally {
      setProcessing(false);
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
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-emerald-900 font-[family-name:var(--font-montserrat)] uppercase flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-emerald-600" />
          Dashboard Keuangan
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola pembayaran dan monitor keuangan laboratorium
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="border-amber-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Belum Bayar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              <p className="text-xs text-amber-700">
                Total: {formatCurrency(stats.pendingAmount)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              Lunas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p className="text-2xl font-bold text-emerald-600">{stats.paid}</p>
              <p className="text-xs text-emerald-700">
                Total: {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Total Tagihan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-xs text-blue-700">
                Semua tagihan
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-purple-600" />
              Pendapatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-xs text-purple-700">
                Total pendapatan bulan ini
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700">Tagihan Pending</p>
                <p className="text-xs text-slate-500">{stats.pending} tagihan menunggu pembayaran</p>
              </div>
              <Button
                size="sm"
                onClick={() => setFilterStatus('pending')}
                variant="outline"
                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              >
                Lihat
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Banknote className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700">Proses Pembayaran</p>
                <p className="text-xs text-slate-500">Terima pembayaran customer</p>
              </div>
              <Link href="/finance/payments">
                <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                  Buka
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700">Laporan Keuangan</p>
                <p className="text-xs text-slate-500">Lihat semua transaksi</p>
              </div>
              <Link href="/finance/transactions">
                <Button size="sm" variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                  Buka
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Tagihan Terbaru</CardTitle>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Belum Bayar</SelectItem>
                <SelectItem value="paid">Lunas</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
          <PageSkeleton />
        ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="font-bold text-emerald-900">Invoice</TableHead>
                    <TableHead className="font-bold text-emerald-900">Customer</TableHead>
                    <TableHead className="font-bold text-emerald-900">Job Order</TableHead>
                    <TableHead className="font-bold text-emerald-900 text-right">Jumlah</TableHead>
                    <TableHead className="font-bold text-emerald-900">Metode</TableHead>
                    <TableHead className="font-bold text-emerald-900">Status</TableHead>
                    <TableHead className="font-bold text-emerald-900">Tanggal</TableHead>
                    <TableHead className="text-center font-bold text-emerald-900">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-20">
                        <div className="flex flex-col items-center gap-4">
                          <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
                            <DollarSign className="h-10 w-10 text-slate-300" />
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-slate-700">Belum ada tagihan</p>
                            <p className="text-sm text-slate-500 mt-1">Tagihan akan muncul setelah sampling selesai</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.items?.map((item: any) => (
                      <TableRow key={item.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-slate-400" />
                            <span className="font-mono text-sm">{item.invoice_number}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{item.job_order.quotation.profile.full_name}</span>
                            {item.job_order.quotation.profile.company_name && (
                              <span className="text-xs text-slate-500">{item.job_order.quotation.profile.company_name}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/finance/jobs/${item.job_order.id}`}
                            className="text-emerald-600 hover:underline text-sm font-mono"
                          >
                            {item.job_order.tracking_code}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-emerald-700">
                            {formatCurrency(parseFloat(item.amount))}
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.payment_method ? (
                            <Badge variant="outline" className="text-xs">
                              {item.payment_method === 'cash' ? '💵 Tunai' : '🏦 Transfer'}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-[10px]", statusColors[item.payment_status])}>
                            {statusLabels[item.payment_status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {formatDate(item.created_at)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {item.payment_status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleProcessPayment(item)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Proses
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCancelPayment(item)}
                                  className="text-red-600 hover:bg-red-50 text-xs h-8"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            {item.payment_status === 'paid' && (
                              <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Lunas
                              </Badge>
                            )}
                            {item.payment_status === 'cancelled' && (
                              <Badge className="bg-red-100 text-red-700 text-xs">
                                <XCircle className="h-3 w-3 mr-1" />
                                Batal
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Sebelumnya
              </Button>
              <span className="text-sm text-slate-600">
                Halaman {page} dari {data.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
              >
                Berikutnya
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Processing Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col gap-4">
            {/* Icon */}
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>

            {/* Header */}
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-bold text-emerald-900">
                Proses Pembayaran
              </DialogTitle>
              <DialogDescription className="text-center text-sm">
                Invoice: {selectedPayment?.invoice_number}
              </DialogDescription>
            </DialogHeader>

            {/* Content */}
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Customer:</span>
                  <span className="text-sm font-medium">{selectedPayment?.job_order.quotation.profile.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Jumlah:</span>
                  <span className="text-sm font-bold text-emerald-700">
                    {formatCurrency(parseFloat(selectedPayment?.amount || 0))}
                  </span>
                </div>
              </div>

              {/* Payment Proof (If exists) */}
              {selectedPayment?.payment_proof_url && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Bukti Transfer Pelanggan</Label>
                  <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-200 group bg-slate-100">
                    <img 
                      src={selectedPayment.payment_proof_url} 
                      alt="Bukti Transfer" 
                      className="w-full h-full object-contain"
                    />
                    <a 
                      href={selectedPayment.payment_proof_url} 
                      target="_blank" 
                      className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black tracking-widest uppercase"
                    >
                      Perbesar Bukti
                    </a>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-[10px] text-blue-700 font-black uppercase">Referensi: {selectedPayment.transfer_reference || '-'}</p>
                  </div>
                </div>
              )}

              {/* Payment Method (Only if no proof yet) */}
              {!selectedPayment?.payment_proof_url && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Metode Pembayaran</Label>
                    <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih metode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">💵 Tunai / Cash</SelectItem>
                        <SelectItem value="transfer">🏦 Transfer Bank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentMethod === "transfer" && (
                    <div className="space-y-2">
                      <Label htmlFor="reference" className="text-sm font-medium">
                        Nomor Referensi Transfer
                      </Label>
                      <Input
                        id="reference"
                        value={transferReference}
                        onChange={(e) => setTransferReference(e.target.value)}
                        placeholder="Contoh: TRF123456789"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Actions */}
            <DialogFooter className="gap-2 pt-4">
              {selectedPayment?.payment_proof_url ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleVerify(selectedPayment.id, false)}
                    disabled={processing}
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Tolak Bukti
                  </Button>
                  <Button
                    onClick={() => handleVerify(selectedPayment.id, true)}
                    disabled={processing}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {processing ? "Memproses..." : "Setujui & Lunas"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsPaymentModalOpen(false)}
                    disabled={processing}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={confirmProcessPayment}
                    disabled={processing}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {processing ? "Memproses..." : "Konfirmasi Bayar"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <LoadingOverlay isOpen={processing} title="Memproses..." description="Sistem sedang memverifikasi data pembayaran" />
    </div>
  );
}
