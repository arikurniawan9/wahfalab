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
  TrendingUp,
  PlusCircle,
  History,
  ArrowUpRight,
  Search,
  Calendar,
  Wallet,
  FlaskConical,
  CreditCard,
  User,
  Loader2,
  CheckCircle,
  ShieldCheck,
  Lock
} from "lucide-react";
import { getFinancialRecords, createFinancialRecord, getBankAccounts, isFinancePeriodLocked } from "@/lib/actions/finance";
import { ChemicalLoader, PageSkeleton, LoadingOverlay } from "@/components/ui";
import { cn } from "@/lib/utils";

const incomeCategories = [
  { value: 'lab_service', label: 'Layanan Lab (Utama)', icon: FlaskConical },
  { value: 'other', label: 'Pendapatan Lain-lain', icon: Wallet },
];

export default function IncomeManagementPage() {
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
      const result = await getFinancialRecords(page, 10, 'income');
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
        type: 'income',
        category: category as any,
        amount: parseFloat(amount),
        description,
        date: new Date(date),
        bank_account_id: bankAccountId
      });

      if (result.error) throw new Error(result.error);

      toast.success("✅ Pemasukan berhasil dicatat!");
      setAmount("");
      setDescription("");
      setBankAccountId(bankAccounts[0]?.id || "");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Gagal mencatat pemasukan");
    } finally {
      setTimeout(() => setProcessing(false), 500);
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

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-emerald-950 font-[family-name:var(--font-montserrat)] uppercase tracking-tight flex items-center gap-3">
            <div className="h-10 w-2 bg-emerald-600 rounded-full" />
            Pemasukan
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1 ml-5">
            Monitor pendapatan lab dan sumber pemasukan lainnya
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Entry */}
        <Card className="border-emerald-100 shadow-xl rounded-[32px] overflow-hidden bg-emerald-50/10">
          <CardHeader className="bg-emerald-50/50 p-8 border-b border-emerald-100">
            <CardTitle className="text-lg font-black text-emerald-900 flex items-center gap-3">
              <PlusCircle className="h-5 w-5 text-emerald-600" />
              CATAT PEMASUKAN MANUAL
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Rekening Bank</Label>
                <Select value={bankAccountId} onValueChange={setBankAccountId}>
                  <SelectTrigger className="h-12 rounded-xl border-emerald-100 bg-white focus:ring-emerald-200">
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
                  <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Saldo Rekening</p>
                        <p className="mt-1 text-sm font-black text-emerald-950">
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
                <Label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Kategori Pemasukan</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12 rounded-xl border-emerald-100 bg-white focus:ring-emerald-200">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeCategories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="h-4 w-4 text-emerald-600" />
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Jumlah Pemasukan (IDR)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-emerald-600">Rp</span>
                  <Input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="pl-12 h-12 rounded-xl border-emerald-100 bg-white text-lg font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Keterangan / Deskripsi</Label>
                <Input 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Pendapatan Bunga Bank"
                  className="h-12 rounded-xl border-emerald-100 bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Tanggal Transaksi</Label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                  <Input 
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-12 h-12 rounded-xl border-emerald-100 bg-white"
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
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl shadow-lg shadow-emerald-200 uppercase tracking-widest text-xs"
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
              RIWAYAT PEMASUKAN
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
                <p className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest">Sinkronisasi Pemasukan</p>
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
                        <td colSpan={4} className="p-20 text-center text-slate-400 italic">Belum ada catatan pemasukan</td>
                      </tr>
                    ) : (
                      data.items.map((tr: any) => (
                        <tr key={tr.id} className="hover:bg-emerald-50/30 transition-colors group">
                          <td className="p-6">
                            <span className="text-xs font-bold text-slate-600">
                              {new Date(tr.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </td>
                          <td className="p-6">
                            <Badge className={cn(
                              "text-[9px] font-black uppercase px-2 py-0.5 border-none",
                              tr.category === 'lab_service' ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                            )}>
                              {tr.category === 'lab_service' && <FlaskConical className="h-2 w-2 mr-1 inline" />}
                              {tr.category.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-6">
                            <p className="text-sm font-bold text-slate-800">{tr.description}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                              {tr.category === 'lab_service' ? <ShieldCheck className="h-3 w-3 text-blue-500" /> : <User className="h-3 w-3" />}
                              {tr.category === 'lab_service' ? 'Verifikasi Sistem' : `Oleh: ${tr.handler?.full_name || 'System'}`}
                            </p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                              <CreditCard className="h-3 w-3 text-emerald-500" />
                              Rekening: {tr.bank_account?.bank_name} - {tr.bank_account?.account_number}
                            </p>
                          </td>
                          <td className="p-6 text-right">
                            <span className="text-sm font-black text-emerald-600">
                              + {formatCurrency(Number(tr.amount))}
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

      <LoadingOverlay isOpen={processing} title="Menyimpan Data..." description="Sedang memperbarui buku besar pemasukan" />
    </div>
  );
}
