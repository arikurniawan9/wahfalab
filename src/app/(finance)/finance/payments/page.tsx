"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CreditCard,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Building,
  DollarSign,
  History,
  ShieldCheck,
  AlertCircle,
  RotateCcw
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { getAllPayments, processPayment } from "@/lib/actions/payment";
import { verifyPayment } from "@/lib/actions/invoice";
import { getBankAccounts } from "@/lib/actions/finance";
import { ChemicalLoader, PageSkeleton, LoadingOverlay } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export default function PaymentsVerificationPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState("");
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  
  // Modals
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [targetBankId, setTargetBankId] = useState("");

  useEffect(() => {
    loadData();
    loadBanks();
  }, [page]);

  async function loadData() {
    setLoading(true);
    try {
      const result = await getAllPayments(page, 10, 'pending');
      setData(result);
    } catch (error) {
      toast.error("Gagal memuat pembayaran");
    } finally {
      setLoading(false);
    }
  }

  async function loadBanks() {
    try {
      const banks = await getBankAccounts();
      setBankAccounts(banks);
    } catch (error) {}
  }

  const handleVerify = async (paymentId: string, approved: boolean) => {
    if (approved && !targetBankId) {
      toast.error("Mohon pilih Bank tujuan dana");
      return;
    }

    setProcessing(true);
    try {
      const result = await verifyPayment(paymentId, approved, approved ? targetBankId : undefined);
      if (result.error) throw new Error(result.error);
      
      toast.success(approved ? "✅ Pembayaran berhasil dikonfirmasi" : "❌ Pembayaran ditolak");
      setIsPreviewOpen(false);
      setTargetBankId("");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Gagal memproses verifikasi");
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
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRefresh = async () => {
    await Promise.all([loadData(), loadBanks()]);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="overflow-hidden rounded-3xl bg-emerald-900 shadow-xl border border-emerald-700/50">
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-500 p-4 md:p-5 text-white relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-[60px]" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                <CreditCard className="h-5 w-5 text-emerald-200" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-black tracking-tight text-white leading-none uppercase">
                  Verifikasi Pembayaran
                </h1>
                <p className="text-emerald-100/60 text-[10px] md:text-xs font-medium mt-1 uppercase tracking-widest">
                  Validasi bukti transfer pelanggan sebelum status lunas diaktifkan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
              <div className="hidden lg:block text-right border-r border-white/10 pr-4">
                <p className="text-emerald-300 text-[8px] font-bold uppercase tracking-widest mb-0.5">Menunggu Verifikasi</p>
                <p className="text-lg font-black text-white leading-none">
                  {data.total || 0} <span className="text-emerald-300 text-[10px] font-bold uppercase tracking-normal">Item</span>
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="h-8 px-3 rounded-lg bg-white/10 border-white/20 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest"
              >
                <RotateCcw className={cn("mr-1.5 h-3.5 w-3.5", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-900 border-none shadow-lg rounded-[24px] overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
          <ShieldCheck className="h-24 w-24 text-white rotate-12" />
        </div>
        <CardContent className="p-6 relative z-10 text-white">
          <div className="max-w-xl space-y-2">
            <h3 className="text-lg font-bold tracking-tight">Menunggu Verifikasi</h3>
            <p className="text-blue-100/70 text-xs leading-relaxed">
              Daftar di bawah menunjukkan pelanggan yang telah mengunggah bukti bayar. 
              Mohon periksa kecocokan nomor referensi dan jumlah dana sebelum menyetujui.
            </p>
            <div className="pt-2">
              <Badge className="bg-white/10 text-white border-white/20 px-3 py-1 rounded-full backdrop-blur-md uppercase text-[9px] font-bold tracking-widest">
                Security Standard: Payment Verification required
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Control Panel */}
      <Card className="border-slate-200 rounded-[20px] shadow-sm overflow-hidden">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cari nomor invoice atau nama pelanggan..." 
              className="pl-10 h-10 rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all text-xs font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="border-slate-200 rounded-[24px] shadow-sm overflow-hidden bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-4">
              <ChemicalLoader />
              <p className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-[0.3em] animate-pulse">Syncing Payment Proofs</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="text-left p-4 text-[9px] font-bold uppercase text-slate-500 tracking-widest">Invoice / Tagihan</th>
                    <th className="text-left p-4 text-[9px] font-bold uppercase text-slate-500 tracking-widest">Customer</th>
                    <th className="text-left p-4 text-[9px] font-bold uppercase text-slate-500 tracking-widest">Metode</th>
                    <th className="text-right p-4 text-[9px] font-bold uppercase text-slate-500 tracking-widest">Jumlah</th>
                    <th className="text-center p-4 text-[9px] font-bold uppercase text-slate-500 tracking-widest">Aksi Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
                            <CheckCircle className="h-6 w-6 text-slate-200" />
                          </div>
                          <p className="text-slate-400 text-xs font-medium italic">Tidak ada pembayaran yang butuh verifikasi</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.items.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                              <CreditCard className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 font-mono tracking-tight">{item.invoice_number}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {item.job_order.tracking_code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <p className="text-xs font-bold text-slate-800">{item.job_order.quotation.profile.full_name}</p>
                            <p className="text-[10px] text-slate-500">{item.job_order.quotation.profile.company_name || 'Personal Client'}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className="bg-slate-100 text-slate-600 border-none px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest">
                            {item.payment_method === 'transfer' ? '🏦 Bank Transfer' : '💵 Cash'}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <p className="text-xs font-bold text-emerald-700">{formatCurrency(Number(item.amount))}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{formatDate(item.created_at)}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              onClick={() => { setSelectedPayment(item); setIsPreviewOpen(true); }}
                              className="h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-widest shadow-md shadow-blue-100"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1.5" /> Cek Bukti
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Modal with Proof Preview */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-2xl rounded-[32px] overflow-hidden border-none p-0">
          <div className="bg-white">
            <div className="bg-blue-900 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Verifikasi Pembayaran</h3>
                <p className="text-blue-100/60 text-xs font-medium">Invoice: {selectedPayment?.invoice_number}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Image Preview */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bukti Transfer Fisik</Label>
                <div className="aspect-[3/4] rounded-3xl bg-slate-100 border-2 border-slate-50 overflow-hidden relative group">
                  {selectedPayment?.payment_proof_url ? (
                    <img 
                      src={selectedPayment.payment_proof_url} 
                      alt="Proof" 
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                      <AlertCircle className="h-10 w-10 mb-2 opacity-20" />
                      <p className="text-[10px] font-black uppercase">Bukti gambar tidak tersedia</p>
                    </div>
                  )}
                  <a 
                    href={selectedPayment?.payment_proof_url} 
                    target="_blank" 
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-[0.2em]"
                  >
                    Buka Gambar Penuh
                  </a>
                </div>
              </div>

              {/* Transaction Detail */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informasi Transaksi</Label>
                  <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-slate-100">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</p>
                      <p className="text-sm font-bold text-slate-800">{selectedPayment?.job_order.quotation.profile.full_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumlah Dana</p>
                      <p className="text-xl font-black text-emerald-700">{formatCurrency(Number(selectedPayment?.amount || 0))}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref. Transfer</p>
                      <p className="text-sm font-black text-blue-600 font-mono tracking-widest bg-blue-50 px-3 py-1 rounded-lg inline-block">
                        {selectedPayment?.transfer_reference || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dana Masuk Ke Bank</Label>
                  <Select value={targetBankId} onValueChange={setTargetBankId}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-slate-50">
                      <SelectValue placeholder="Pilih Bank Tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map(bank => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.bank_name} - {bank.account_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                  <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                    Pastikan dana sudah benar-benar masuk ke rekening WahfaLab sebelum menekan tombol "Setujui Pembayaran".
                  </p>
                </div>

                <div className="space-y-3 pt-4">
                  <Button 
                    onClick={() => handleVerify(selectedPayment?.id, true)}
                    disabled={processing}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl shadow-lg shadow-emerald-100 uppercase tracking-widest text-xs"
                  >
                    {processing ? "Memproses..." : "Setujui Pembayaran"}
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => handleVerify(selectedPayment?.id, false)}
                    disabled={processing}
                    className="w-full text-rose-600 hover:bg-rose-50 font-black h-12 rounded-2xl uppercase tracking-widest text-xs"
                  >
                    Tolak Bukti
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LoadingOverlay isOpen={processing} title="Verifikasi..." description="Sistem sedang mengupdate buku besar keuangan" />
      
      <div className="flex items-center justify-center gap-2 text-slate-300 py-4">
        <History className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-[0.5em]"> WahfaLab Secure Verification System </span>
      </div>
    </div>
  );
}
