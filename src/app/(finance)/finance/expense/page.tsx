"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  TrendingDown,
  PlusCircle,
  History,
  ArrowDownRight,
  Search,
  Calendar,
  Wallet,
  Building,
  User,
  Wrench,
  Package,
  CheckCircle,
  XCircle,
  Loader2,
  Lock,
  RotateCcw
} from "lucide-react";
import { getFinancialRecords, createFinancialRecord, getBankAccounts, isFinancePeriodLocked } from "@/lib/actions/finance";
import { ChemicalLoader, PageSkeleton, LoadingOverlay } from "@/components/ui";
import { cn } from "@/lib/utils";

const expenseCategories = [
  { value: 'salary', label: 'Gaji Karyawan', icon: User },
  { value: 'office_supply', label: 'ATK & Kantor', icon: Package },
  { value: 'maintenance', label: 'Perawatan Alat', icon: Wrench },
  { value: 'operational', label: 'Operasional Lapangan', icon: Building },
  { value: 'other', label: 'Lain-lain', icon: Wallet },
];

export default function ExpenseManagementPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState("");
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);

  // Form states
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankAccountId, setBankAccountId] = useState("");
  const [periodLock, setPeriodLock] = useState<any>(null);
  const [checkingPeriodLock, setCheckingPeriodLock] = useState(false);

  useEffect(() => {
    loadData();
    loadBanks();
  }, [page]);

  useEffect(() => {
    void loadPeriodLockStatus(date);
  }, [date]);

  async function loadData() {
    setLoading(true);
    try {
      const result = await getFinancialRecords(page, 10, 'expense');
      setData(result);
    } catch (error) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  async function loadBanks() {
    try {
      const banks = await getBankAccounts();
      setBankAccounts(banks);
      if (!bankAccountId && banks.length > 0) {
        setBankAccountId(banks[0].id);
      }
    } catch (error) {
      toast.error("Gagal memuat daftar bank");
    }
  }

  async function loadPeriodLockStatus(targetDate: string) {
    setCheckingPeriodLock(true);
    try {
      const status = await isFinancePeriodLocked(targetDate);
      setPeriodLock(status || null);
    } catch (error) {
      setPeriodLock(null);
    } finally {
      setCheckingPeriodLock(false);
    }
  }

  const formatPeriodLabel = (period?: string) => {
    if (!period) return "-";
    try {
      return new Date(`${period}-01T00:00:00`).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric"
      });
    } catch (error) {
      return period;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !bankAccountId) return toast.error("Mohon lengkapi data dan pilih bank");
    if (periodLock?.isLocked) {
      toast.error(
        `Periode ${formatPeriodLabel(periodLock.period)} terkunci.${periodLock.reason ? ` Alasan: ${periodLock.reason}` : ""}`
      );
      return;
    }

    setProcessing(true);
    try {
      const result = await createFinancialRecord({
        type: 'expense',
        category: category as any,
        amount: parseFloat(amount),
        description,
        date: new Date(date),
        bank_account_id: bankAccountId
      });

      if (result.error) throw new Error(result.error);

      toast.success("✅ Pengeluaran berhasil dicatat!");
      setAmount("");
      setDescription("");
      setBankAccountId(bankAccounts[0]?.id || "");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Gagal mencatat pengeluaran");
    } finally {
      setProcessing(true);
      // Brief delay for effect
      setTimeout(() => {
        setProcessing(false);
      }, 500);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const selectedBank = bankAccounts.find((bank) => bank.id === bankAccountId);
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
                <TrendingDown className="h-5 w-5 text-rose-200" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-black tracking-tight text-white leading-none uppercase">
                  Pengeluaran
                </h1>
                <p className="text-emerald-100/60 text-[10px] md:text-xs font-medium mt-1 uppercase tracking-widest">
                  Kelola pengeluaran kas dan biaya operasional.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
              <div className="hidden lg:block text-right border-r border-white/10 pr-4">
                <p className="text-emerald-300 text-[8px] font-bold uppercase tracking-widest mb-0.5">Total Catatan</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Entry */}
        <Card className="border-rose-100 shadow-xl rounded-[32px] overflow-hidden">
          <CardHeader className="bg-rose-50/50 p-8 border-b border-rose-100">
            <CardTitle className="text-lg font-black text-rose-900 flex items-center gap-3">
              <PlusCircle className="h-5 w-5 text-rose-600" />
              CATAT PENGELUARAN
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-rose-800 uppercase tracking-widest">Rekening Bank</Label>
                <Select value={bankAccountId} onValueChange={setBankAccountId}>
                  <SelectTrigger className="h-12 rounded-xl border-rose-100 bg-rose-50/20 focus:ring-rose-200">
                    <SelectValue placeholder="Pilih rekening bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map(bank => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.bank_name} - {bank.account_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBank && (
                  <div className="mt-3 rounded-2xl border border-rose-100 bg-rose-50/70 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-700">Saldo Rekening</p>
                        <p className="mt-1 text-sm font-black text-rose-950">
                          {selectedBank.bank_name} - {selectedBank.account_number}
                        </p>
                        <p className="text-[10px] font-bold text-rose-700/70 mt-1">
                          {selectedBank.account_holder}
                        </p>
                      </div>
                      <Badge className="bg-white text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-[10px] font-black">
                        {formatCurrency(Number(selectedBank.balance || 0))}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-rose-800 uppercase tracking-widest">Kategori Biaya</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12 rounded-xl border-rose-100 bg-rose-50/20 focus:ring-rose-200">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="h-4 w-4 text-rose-600" />
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-rose-800 uppercase tracking-widest">Jumlah Pengeluaran (IDR)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-rose-600">Rp</span>
                  <Input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="pl-12 h-12 rounded-xl border-rose-100 bg-rose-50/20 text-lg font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-rose-800 uppercase tracking-widest">Keterangan / Deskripsi</Label>
                <Input 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Gaji Analis Bulan Februari"
                  className="h-12 rounded-xl border-rose-100 bg-rose-50/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-rose-800 uppercase tracking-widest">Tanggal Transaksi</Label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-400" />
                  <Input 
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-12 h-12 rounded-xl border-rose-100 bg-rose-50/20"
                  />
                </div>
                <div className={cn(
                  "rounded-xl border px-3 py-2.5 text-[10px]",
                  checkingPeriodLock
                    ? "border-slate-200 bg-slate-50 text-slate-500"
                    : periodLock?.isLocked
                      ? "border-rose-100 bg-rose-50 text-rose-700"
                      : "border-emerald-100 bg-emerald-50 text-emerald-700"
                )}>
                  {checkingPeriodLock ? (
                    <p className="font-bold">Memeriksa status lock periode...</p>
                  ) : periodLock?.isLocked ? (
                    <div className="space-y-1">
                      <p className="font-black uppercase tracking-widest flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Periode {formatPeriodLabel(periodLock.period)} terkunci
                      </p>
                      <p className="font-medium">
                        {periodLock.reason || "Periode ditutup oleh admin/finance."}
                      </p>
                    </div>
                  ) : (
                    <p className="font-bold">Periode {formatPeriodLabel(periodLock?.period)} terbuka untuk posting.</p>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={processing || checkingPeriodLock || Boolean(periodLock?.isLocked)}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black h-14 rounded-2xl shadow-lg shadow-rose-200 uppercase tracking-widest text-xs"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "SIMPAN TRANSAKSI"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History List */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm rounded-[32px] overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-3">
              <History className="h-5 w-5 text-slate-600" />
              RIWAYAT PENGELUARAN
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari Riwayat..." 
                className="pl-9 h-10 rounded-xl bg-slate-50 border-none text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-20 flex flex-col items-center justify-center space-y-4">
                <ChemicalLoader />
                <p className="text-[10px] font-black text-rose-800/40 uppercase tracking-widest">Memuat Riwayat</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="text-left p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Tanggal</th>
                      <th className="text-left p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Kategori</th>
                      <th className="text-left p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Deskripsi</th>
                      <th className="text-right p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-20 text-center text-slate-400 italic">Belum ada catatan pengeluaran</td>
                      </tr>
                    ) : (
                      data.items.map((tr: any) => (
                        <tr key={tr.id} className="hover:bg-rose-50/30 transition-colors group">
                          <td className="p-6">
                            <span className="text-xs font-bold text-slate-600">
                              {new Date(tr.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </td>
                          <td className="p-6">
                            <Badge className="bg-rose-100 text-rose-700 text-[9px] font-black uppercase px-2 py-0.5 border-none">
                              {tr.category.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-6">
                            <p className="text-sm font-bold text-slate-800">{tr.description}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                              <User className="h-3 w-3" /> Oleh: {tr.handler?.full_name || 'System'}
                            </p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                              <Building className="h-3 w-3 text-rose-500" />
                              Rekening: {tr.bank_account?.bank_name} - {tr.bank_account?.account_number}
                            </p>
                          </td>
                          <td className="p-6 text-right">
                            <span className="text-sm font-black text-rose-600">
                              - {formatCurrency(Number(tr.amount))}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination */}
            {data.pages > 1 && (
              <div className="p-6 border-t border-slate-50 flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl"
                >
                  Kembali
                </Button>
                <span className="text-xs font-black uppercase text-slate-500">Halaman {page} / {data.pages}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                  disabled={page === data.pages}
                  className="rounded-xl"
                >
                  Berikutnya
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <LoadingOverlay isOpen={processing} title="Menyimpan Data..." description="Sedang memperbarui buku besar keuangan" />
    </div>
  );
}
