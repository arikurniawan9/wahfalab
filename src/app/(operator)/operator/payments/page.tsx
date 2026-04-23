"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Search,
  Eye
} from "lucide-react";
import Link from "next/link";
import { getAllPayments, processPayment } from "@/lib/actions/payment";
import { getBankAccounts } from "@/lib/actions/finance";
import { ChemicalLoader } from "@/components/ui";
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

export default function OperatorPaymentsPage() {
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
  const [bankAccountId, setBankAccountId] = useState("");
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
    loadBanks();
  }, [page, filterStatus]);

  async function loadData() {
    setLoading(true);
    const result = await getAllPayments(page, limit, filterStatus === "all" ? undefined : filterStatus);
    setData(result);
    setLoading(false);
  }

  async function loadBanks() {
    try {
      const banks = await getBankAccounts();
      setBankAccounts(banks);
    } catch (error) {
      console.error("Load banks error:", error);
    }
  }

  const handleProcessPayment = (payment: any) => {
    setSelectedPayment(payment);
    setPaymentMethod("cash");
    setTransferReference("");
    setBankAccountId("");
    setIsPaymentModalOpen(true);
  };

  const confirmProcessPayment = async () => {
    if (!selectedPayment) return;

    if (paymentMethod === "transfer" && !transferReference.trim()) {
      toast.error("Mohon isi nomor referensi transfer");
      return;
    }

    if (paymentMethod === "transfer" && !bankAccountId) {
      toast.error("Mohon pilih bank tujuan");
      return;
    }

    setProcessing(true);
    try {
      const result = await processPayment(
        selectedPayment.id,
        paymentMethod,
        paymentMethod === "transfer" ? transferReference : undefined,
        bankAccountId || undefined
      );

      if (result.error) throw new Error(result.error);

      toast.success("✅ Pembayaran berhasil diproses!");
      setIsPaymentModalOpen(false);
      loadData();
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

  const selectedBank = bankAccounts.find((bank) => bank.id === bankAccountId);
  const cashAccount = bankAccounts.find((bank) => bank.bank_name === 'Kas Tunai');

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-emerald-900 font-[family-name:var(--font-montserrat)] uppercase flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-emerald-600" />
          Manajemen Pembayaran
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola pembayaran customer dan proses tagihan
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Belum Bayar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {data.items?.filter((i: any) => i.payment_status === 'pending').length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              Lunas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {data.items?.filter((i: any) => i.payment_status === 'paid').length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              Total Tagihan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(data.items?.reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0) || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label className="text-sm font-medium whitespace-nowrap">Filter Status:</Label>
              <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Belum Bayar</SelectItem>
                  <SelectItem value="paid">Lunas</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Tagihan</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-20">
              <ChemicalLoader />
            </div>
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
                            href={`/operator/jobs/${item.job_order.id}`}
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
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleProcessPayment(item)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Proses
                              </Button>
                            )}
                            <Link href={`/operator/payments/${item.id}`}>
                              <Button size="sm" variant="ghost" className="text-xs h-8">
                                <Eye className="h-3 w-3" />
                              </Button>
                            </Link>
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
                <ChevronLeft className="h-4 w-4 mr-2" />
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
                <ChevronRight className="h-4 w-4 ml-2" />
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

              {/* Payment Method */}
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
                {paymentMethod === 'cash' && (
                  <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 mt-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Rekening Otomatis</p>
                    <p className="text-sm font-black text-amber-950 mt-1">
                      {cashAccount ? `${cashAccount.bank_name} - ${cashAccount.account_number}` : 'Kas Tunai'}
                    </p>
                    <p className="text-xs text-amber-700/70 mt-1">
                      Pembayaran cash akan dicatat ke rekening ini agar saldo kas tetap terkontrol.
                    </p>
                  </div>
                )}
              </div>

              {/* Transfer Reference */}
              {paymentMethod === "transfer" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Rekening Bank</Label>
                    <Select value={bankAccountId} onValueChange={setBankAccountId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih bank tujuan" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map(bank => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {bank.bank_name} - {bank.account_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      Pilih rekening tujuan agar saldo bank otomatis bertambah saat pembayaran diproses.
                    </p>
                    {selectedBank && (
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 mt-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Saldo Rekening</p>
                            <p className="text-sm font-black text-emerald-950 mt-1">
                              {selectedBank.bank_name} - {selectedBank.account_number}
                            </p>
                            <p className="text-[10px] font-bold text-emerald-700/70 mt-1">
                              {selectedBank.account_holder}
                            </p>
                          </div>
                          <Badge className="bg-white text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-[10px] font-black">
                            {formatCurrency(Number(selectedBank.balance || 0))}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
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
                    <p className="text-xs text-slate-500">
                      Masukkan nomor referensi/nomor transaksi transfer
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <DialogFooter className="gap-2 sm:gap-0">
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
                {processing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Konfirmasi Pembayaran
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Import icons
function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
