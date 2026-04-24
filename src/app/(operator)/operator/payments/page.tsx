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
import { ChemicalLoader, LoadingOverlay } from "@/components/ui";
import { cn } from "@/lib/utils";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LOADING_COPY, PROCESSING_TEXT } from "@/lib/constants/loading";
import { OPERATOR_EMPTY_TEXT, OPERATOR_TOAST_TEXT } from "@/lib/constants/operator-copy";

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
  }, [page, filterStatus]);

  useEffect(() => {
    loadBanks();
  }, []);

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
      toast.error(OPERATOR_TOAST_TEXT.processFailed);
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

  if (loading) return <ChemicalLoader fullScreen />;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <OperatorPageHeader
        icon={DollarSign}
        title="Manajemen Pembayaran"
        description="Kelola pembayaran customer dan proses tagihan"
        statsLabel="Total Pembayaran"
        statsValue={data.total || 0}
        onRefresh={loadData}
        refreshing={loading}
        className="mb-6"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="rounded-2xl border-2 border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Belum Bayar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-black text-amber-600">
              {data.items?.filter((i: any) => i.payment_status === 'pending').length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              Lunas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-black text-emerald-600">
              {data.items?.filter((i: any) => i.payment_status === 'paid').length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-2 border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              Total Tagihan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-black text-blue-600">
              {formatCurrency(data.items?.reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0) || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 rounded-2xl border-2 border-slate-100 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label className="text-[11px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">Filter Status:</Label>
              <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-[190px] h-11 rounded-xl border-slate-200 bg-white shadow-sm text-xs font-medium">
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
      <Card className="rounded-[2.5rem] border border-slate-200 shadow-xl shadow-emerald-900/5 overflow-hidden">
        <CardHeader className="p-6 border-b bg-slate-50/50">
          <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-wider">Daftar Tagihan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="font-black text-slate-400 h-14 text-[10px] uppercase tracking-wider px-6">Invoice</TableHead>
                    <TableHead className="font-black text-slate-400 h-14 text-[10px] uppercase tracking-wider">Customer</TableHead>
                    <TableHead className="font-black text-slate-400 h-14 text-[10px] uppercase tracking-wider">Job Order</TableHead>
                    <TableHead className="font-black text-slate-400 h-14 text-[10px] uppercase tracking-wider text-right">Jumlah</TableHead>
                    <TableHead className="font-black text-slate-400 h-14 text-[10px] uppercase tracking-wider">Metode</TableHead>
                    <TableHead className="font-black text-slate-400 h-14 text-[10px] uppercase tracking-wider">Status</TableHead>
                    <TableHead className="font-black text-slate-400 h-14 text-[10px] uppercase tracking-wider">Tanggal</TableHead>
                    <TableHead className="text-center font-black text-slate-400 h-14 text-[10px] uppercase tracking-wider pr-6">Aksi</TableHead>
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
                            <p className="text-lg font-semibold text-slate-700">{OPERATOR_EMPTY_TEXT.noBill}</p>
                            <p className="text-sm text-slate-500 mt-1">Tagihan akan muncul setelah sampling selesai</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.items?.map((item: any) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/70">
                        <TableCell className="font-medium px-6 py-4">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-slate-400" />
                            <span className="font-mono text-sm">{item.invoice_number}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{item.job_order.quotation.profile.full_name}</span>
                            {item.job_order.quotation.profile.company_name && (
                              <span className="text-xs text-slate-500">{item.job_order.quotation.profile.company_name}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Link
                            href="/operator/jobs"
                            className="text-emerald-600 hover:underline text-sm font-mono"
                          >
                            {item.job_order.tracking_code}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <span className="font-semibold text-emerald-700">
                            {formatCurrency(parseFloat(item.amount))}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          {item.payment_method ? (
                            <Badge variant="outline" className="text-xs">
                              {item.payment_method === 'cash' ? '💵 Tunai' : '🏦 Transfer'}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge className={cn("text-[10px]", statusColors[item.payment_status])}>
                            {statusLabels[item.payment_status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 py-4">
                          {formatDate(item.created_at)}
                        </TableCell>
                        <TableCell className="text-center py-4 pr-6">
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

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-between m-6 mt-4 pt-5 border-t">
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
        <DialogContent className="sm:max-w-lg p-0 border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <DialogHeader className="bg-emerald-700 p-6 text-white border-b border-emerald-600/40">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none">
                  Proses Pembayaran
                </DialogTitle>
                <DialogDescription className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Invoice: {selectedPayment?.invoice_number}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 p-6 md:p-8 bg-slate-50/20 max-h-[72vh] overflow-y-auto">
            <div className="bg-white border-2 border-slate-100 rounded-2xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Customer</span>
                <span className="text-sm font-black text-slate-800 text-right">{selectedPayment?.job_order.quotation.profile.full_name}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Jumlah</span>
                <span className="text-base font-black text-emerald-700">
                  {formatCurrency(parseFloat(selectedPayment?.amount || 0))}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Metode Pembayaran</Label>
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger className="h-12 rounded-xl border-2 border-slate-100 bg-white font-bold">
                  <SelectValue placeholder="Pilih metode" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2 border-slate-100 shadow-xl">
                  <SelectItem value="cash" className="font-bold cursor-pointer">Tunai / Cash</SelectItem>
                  <SelectItem value="transfer" className="font-bold cursor-pointer">Transfer Bank</SelectItem>
                </SelectContent>
              </Select>
              {paymentMethod === 'cash' && (
                <div className="rounded-2xl border-2 border-amber-100 bg-amber-50/70 p-4 mt-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Rekening Otomatis</p>
                  <p className="text-sm font-black text-amber-950 mt-1">
                    {cashAccount ? `${cashAccount.bank_name} - ${cashAccount.account_number}` : 'Kas Tunai'}
                  </p>
                  <p className="text-xs text-amber-700/80 mt-1 font-medium">
                    Pembayaran cash akan dicatat ke rekening ini agar saldo kas tetap terkontrol.
                  </p>
                </div>
              )}
            </div>

            {paymentMethod === "transfer" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Rekening Bank</Label>
                  <Select value={bankAccountId} onValueChange={setBankAccountId}>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-slate-100 bg-white font-bold">
                      <SelectValue placeholder="Pilih bank tujuan" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 border-slate-100 shadow-xl">
                      {bankAccounts.map(bank => (
                        <SelectItem key={bank.id} value={bank.id} className="font-bold cursor-pointer">
                          {bank.bank_name} - {bank.account_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 font-medium">
                    Pilih rekening tujuan agar saldo bank otomatis bertambah saat pembayaran diproses.
                  </p>
                  {selectedBank && (
                    <div className="rounded-2xl border-2 border-emerald-100 bg-emerald-50/70 p-4 mt-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Saldo Rekening</p>
                          <p className="text-sm font-black text-emerald-950 mt-1">
                            {selectedBank.bank_name} - {selectedBank.account_number}
                          </p>
                          <p className="text-[10px] font-bold text-emerald-700/70 mt-1 uppercase tracking-wide">
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
                  <Label htmlFor="reference" className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Nomor Referensi Transfer
                  </Label>
                  <Input
                    id="reference"
                    value={transferReference}
                    onChange={(e) => setTransferReference(e.target.value)}
                    placeholder="Contoh: TRF123456789"
                    className="h-12 rounded-xl border-2 border-slate-100 bg-white font-semibold"
                  />
                  <p className="text-xs text-slate-500 font-medium">
                    Masukkan nomor referensi atau nomor transaksi transfer.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex-col sm:flex-row gap-3">
            <Button
              variant="ghost"
              onClick={() => setIsPaymentModalOpen(false)}
              disabled={processing}
              className="w-full sm:flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-emerald-700 hover:bg-emerald-50"
            >
              Batal
            </Button>
            <Button
              onClick={confirmProcessPayment}
              disabled={processing}
              className="w-full sm:flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-900/20"
            >
              {processing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                    {PROCESSING_TEXT}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Konfirmasi Pembayaran
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <LoadingOverlay isOpen={processing} title={OPERATOR_LOADING_COPY.title} description={OPERATOR_LOADING_COPY.description} variant="transparent" />
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


