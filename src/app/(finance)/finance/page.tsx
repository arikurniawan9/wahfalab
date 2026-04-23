"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  History,
  CreditCard,
  FileText,
  PlusCircle,
  AlertCircle,
  FlaskConical,
  User,
  Package,
  Wrench,
  Building,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { createFinancialRecord, getFinancialSummary, getMonthlyTrend, getFinancialRecords, getBankAccounts, isFinancePeriodLocked } from "@/lib/actions/finance";
import { getInvoiceStats } from "@/lib/actions/invoice";
import { ChemicalLoader, PageSkeleton, LoadingOverlay } from "@/components/ui";
import { cn } from "@/lib/utils";

const incomeCategories = [
  { value: 'lab_service', label: 'Layanan Lab', icon: FlaskConical },
  { value: 'other', label: 'Lain-lain', icon: Wallet },
];

const expenseCategories = [
  { value: 'salary', label: 'Gaji Karyawan', icon: User },
  { value: 'office_supply', label: 'ATK & Kantor', icon: Package },
  { value: 'maintenance', label: 'Perawatan Alat', icon: Wrench },
  { value: 'operational', label: 'Operasional Lapangan', icon: Building },
  { value: 'other', label: 'Lain-lain', icon: Wallet },
];

export default function FinanceDashboardPage() {
  const [summary, setSummary] = useState<any>({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [invoiceStats, setInvoiceStats] = useState<any>({});
  const [trend, setTrend] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [dashboardPeriodLock, setDashboardPeriodLock] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('income');
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'other',
    bank_account_id: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [modalPeriodLock, setModalPeriodLock] = useState<any>(null);
  const [checkingModalPeriodLock, setCheckingModalPeriodLock] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    void loadModalPeriodLockStatus(formData.date);
  }, [isModalOpen, formData.date]);

  async function loadAllData() {
    setLoading(true);
    try {
      const [sum, stats, history, monthly, banks, lockStatus] = await Promise.all([
        getFinancialSummary(),
        getInvoiceStats(),
        getFinancialRecords(1, 5),
        getMonthlyTrend(6),
        getBankAccounts(),
        isFinancePeriodLocked(new Date())
      ]);

      setSummary(sum);
      setInvoiceStats(stats);
      setRecentTransactions(history.items || []);
      setTrend(monthly);
      setBankAccounts(banks);
      setDashboardPeriodLock(lockStatus || null);
    } catch (error) {
      console.error("Load dashboard data error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadModalPeriodLockStatus(targetDate: string) {
    setCheckingModalPeriodLock(true);
    try {
      const status = await isFinancePeriodLocked(targetDate);
      setModalPeriodLock(status || null);
    } catch (error) {
      setModalPeriodLock(null);
    } finally {
      setCheckingModalPeriodLock(false);
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

  const handleOpenModal = (type: 'income' | 'expense') => {
    const today = new Date().toISOString().split('T')[0];
    setModalType(type);
    setFormData({
      amount: '',
      description: '',
      category: 'other',
      bank_account_id: '',
      date: today
    });
    void loadModalPeriodLockStatus(today);
    setIsModalOpen(true);
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description || !formData.bank_account_id) {
      toast.error("Mohon lengkapi data transaksi dan pilih Bank");
      return;
    }
    if (modalPeriodLock?.isLocked) {
      toast.error(
        `Periode ${formatPeriodLabel(modalPeriodLock.period)} terkunci.${modalPeriodLock.reason ? ` Alasan: ${modalPeriodLock.reason}` : ""}`
      );
      return;
    }

    setProcessing(true);
    try {
      const result = await createFinancialRecord({
        type: modalType,
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        bank_account_id: formData.bank_account_id,
        date: new Date(formData.date)
      });

      if (result.error) throw new Error(result.error);

      toast.success(`✅ ${modalType === 'income' ? 'Pemasukan' : 'Pengeluaran'} berhasil dicatat`);
      setIsModalOpen(false);
      loadAllData();
    } catch (error: any) {
      toast.error(error.message || "Gagal mencatat transaksi");
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

  if (loading) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 space-y-6">
      <ChemicalLoader />
      <div className="flex flex-col items-center gap-2">
        <p className="text-[10px] font-black text-emerald-900/40 uppercase tracking-[0.4em] animate-pulse">Memuat Arus Kas</p>
        <div className="h-1 w-32 bg-emerald-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
        </div>
      </div>
    </div>
  );

  const categories = modalType === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-950 font-[family-name:var(--font-montserrat)] uppercase tracking-tight flex items-center gap-3">
            <div className="h-8 w-1.5 bg-emerald-600 rounded-full" />
            Financial Hub
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1 ml-4">
            Overview Arus Kas & Analisis Keuangan Laboratorium
          </p>
        </div>
        <div className="flex flex-col items-stretch md:items-end gap-2">
          <div className="flex gap-2">
            <Button 
              onClick={() => handleOpenModal('income')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-5 rounded-xl shadow-md shadow-emerald-200 text-xs"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Pemasukan
            </Button>
            <Button 
              onClick={() => handleOpenModal('expense')}
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50 font-bold h-10 px-5 rounded-xl text-xs"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Pengeluaran
            </Button>
          </div>
          <Badge
            className={cn(
              "text-[9px] font-bold uppercase tracking-widest w-fit border",
              dashboardPeriodLock?.isLocked
                ? "bg-rose-50 text-rose-700 border-rose-100"
                : "bg-emerald-50 text-emerald-700 border-emerald-100"
            )}
          >
            {dashboardPeriodLock?.isLocked
              ? `Periode ${formatPeriodLabel(dashboardPeriodLock?.period)} terkunci`
              : `Periode ${formatPeriodLabel(dashboardPeriodLock?.period)} terbuka`}
          </Badge>
        </div>
      </div>

      {/* Main Stats: The "Buku Besar" Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 border-none shadow-xl rounded-[24px] overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet className="h-32 w-32 text-white rotate-12" />
          </div>
          <CardContent className="p-8 relative z-10 text-white">
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-1">
                <p className="text-emerald-200/80 text-[10px] font-bold uppercase tracking-widest">Total Arus Kas / Saldo</p>
                <h2 className="text-4xl font-bold font-mono tracking-tighter">
                  {formatCurrency(summary.balance)}
                </h2>
              </div>
              <Badge className="bg-white/10 text-white border-white/20 px-3 py-1 rounded-full backdrop-blur-md text-[9px] font-bold">
                Updated Today
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-400/20 flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-emerald-200/80 text-[10px] font-bold uppercase tracking-widest">Total Pemasukan</span>
                </div>
                <p className="text-xl font-bold">{formatCurrency(summary.totalIncome)}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-rose-400/20 flex items-center justify-center">
                    <ArrowDownRight className="h-4 w-4 text-rose-400" />
                  </div>
                  <span className="text-emerald-200/80 text-[10px] font-bold uppercase tracking-widest">Total Pengeluaran</span>
                </div>
                <p className="text-xl font-bold">{formatCurrency(summary.totalExpense)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="border-amber-200 bg-amber-50/50 rounded-[20px] shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center shadow-inner">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest mb-1">Piutang Tertahan</p>
                <p className="text-xl font-bold text-amber-900">{formatCurrency(invoiceStats.pendingAmount || 0)}</p>
                <p className="text-[10px] text-amber-600/70 font-medium">{invoiceStats.overdue || 0} invoice jatuh tempo</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50 rounded-[20px] shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center shadow-inner">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-blue-700 uppercase tracking-widest mb-1">Invoice Bulan Ini</p>
                <p className="text-xl font-bold text-blue-900">{invoiceStats.total || 0}</p>
                <p className="text-[10px] text-blue-600/70 font-medium">Monitoring Penagihan Lab</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Visual Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simple Bar Chart for Income vs Expense */}
        <Card className="lg:col-span-2 border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Tren Keuangan (6 Bulan Terakhir)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {trend.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs italic">
                Data tren belum tersedia
              </div>
            ) : (
              <div className="flex items-end justify-between gap-4 h-48 mt-2">
                {trend.map((data: any, idx: number) => {
                  const maxAmount = Math.max(...trend.map(t => Math.max(t.income, t.expense)));
                  const incomeHeight = (data.income / maxAmount) * 100;
                  const expenseHeight = (data.expense / maxAmount) * 100;
                  
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full">
                      <div className="flex-1 w-full flex items-end justify-center gap-1">
                        <div 
                          className="w-3 bg-emerald-500 rounded-t-md transition-all duration-500 hover:bg-emerald-600 cursor-pointer" 
                          style={{ height: `${incomeHeight}%` }}
                          title={`Income: ${formatCurrency(data.income)}`}
                        />
                        <div 
                          className="w-3 bg-rose-400 rounded-t-md transition-all duration-500 hover:bg-rose-500 cursor-pointer" 
                          style={{ height: `${expenseHeight}%` }}
                          title={`Expense: ${formatCurrency(data.expense)}`}
                        />
                      </div>
                      <span className="text-[9px] font-bold uppercase text-slate-500 tracking-tighter">
                        {data.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex justify-center gap-4 mt-8 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Pemasukan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Pengeluaran</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-slate-200 rounded-[24px] shadow-sm overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-3">
              <History className="h-4 w-4 text-slate-600" />
              Riwayat Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {recentTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">Belum ada transaksi</div>
              ) : (
                recentTransactions.map((tr: any) => (
                  <div key={tr.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
                        tr.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                      )}>
                        {tr.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 line-clamp-1">{tr.description}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          {tr.category.replace('_', ' ')} • {new Date(tr.transaction_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </p>
                        {tr.bank_account && (
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            Bank: {tr.bank_account.bank_name} - {tr.bank_account.account_number}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-xs font-bold",
                        tr.type === 'income' ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {tr.type === 'income' ? '+' : '-'} {formatCurrency(Number(tr.amount))}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {recentTransactions.length > 0 && (
              <div className="p-4 bg-slate-50/50 text-center">
                <Link href="/finance/transactions">
                  <Button variant="link" className="text-[9px] font-bold uppercase text-emerald-700 tracking-widest p-0 h-auto">
                    Lihat Semua Transaksi
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-center gap-2 text-slate-400 py-2">
        <CreditCard className="h-3.5 w-3.5" />
        <span className="text-[9px] font-bold uppercase tracking-[0.2em]">WahfaLab Finance Security Standard</span>
      </div>

      {/* Quick Transaction Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
          <div className={cn(
            "p-8 text-white flex justify-between items-center",
            modalType === 'income' ? "bg-emerald-600" : "bg-rose-600"
          )}>
            <div>
              <DialogTitle className="text-xl font-bold uppercase tracking-tight">
                Catat {modalType === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              </DialogTitle>
              <DialogDescription className="text-white/70 text-xs font-medium mt-1">
                Data akan langsung memperbarui arus kas laboratorium
              </DialogDescription>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              {modalType === 'income' ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
            </div>
          </div>

          <form onSubmit={handleTransactionSubmit} className="p-8 space-y-6 bg-white">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pilih Bank</Label>
                <Select 
                  value={formData.bank_account_id} 
                  onValueChange={(v) => setFormData({...formData, bank_account_id: v})}
                >
                  <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:ring-emerald-500">
                    <SelectValue placeholder="Pilih Bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map(bank => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.bank_name} - {bank.account_number}
                      </SelectItem>
                    ))}
                    {bankAccounts.length === 0 && (
                      <div className="p-2 text-xs text-slate-400">Belum ada bank terdaftar</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kategori</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData({...formData, category: v})}
                >
                  <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:ring-emerald-500">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {(modalType === 'income' ? incomeCategories : expenseCategories).map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="h-4 w-4 text-slate-500" />
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jumlah (IDR)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                  <Input 
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0"
                    className="pl-12 h-12 rounded-xl border-slate-100 bg-slate-50 text-lg font-bold focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Keterangan</Label>
                <Input 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Contoh: Pembayaran invoice lab"
                  className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</Label>
                <Input 
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:ring-emerald-500"
                />
                <div className={cn(
                  "rounded-xl border px-3 py-2.5 text-[10px]",
                  checkingModalPeriodLock
                    ? "border-slate-200 bg-slate-50 text-slate-500"
                    : modalPeriodLock?.isLocked
                      ? "border-rose-100 bg-rose-50 text-rose-700"
                      : "border-emerald-100 bg-emerald-50 text-emerald-700"
                )}>
                  {checkingModalPeriodLock ? (
                    <p className="font-bold">Memeriksa status lock periode...</p>
                  ) : modalPeriodLock?.isLocked ? (
                    <div className="space-y-1">
                      <p className="font-black uppercase tracking-widest flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Periode {formatPeriodLabel(modalPeriodLock.period)} terkunci
                      </p>
                      <p className="font-medium">{modalPeriodLock.reason || "Periode ditutup oleh admin/finance."}</p>
                    </div>
                  ) : (
                    <p className="font-bold">Periode {formatPeriodLabel(modalPeriodLock?.period)} terbuka untuk posting.</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="submit"
                disabled={processing || checkingModalPeriodLock || Boolean(modalPeriodLock?.isLocked)}
                className={cn(
                  "w-full text-white font-bold h-14 rounded-2xl shadow-lg uppercase tracking-widest text-xs",
                  modalType === 'income' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" : "bg-rose-600 hover:bg-rose-700 shadow-rose-100"
                )}
              >
                Simpan Transaksi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <LoadingOverlay 
        isOpen={processing} 
        variant="fullscreen"
        title="Menyimpan Transaksi" 
        description="Sedang memperbarui buku besar keuangan WahfaLab secara real-time" 
      />

      {/* Footer / Info */}
      <div className="flex items-center justify-center gap-2 text-slate-400 py-4">
        <CreditCard className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">WahfaLab Finance Security Standard</span>
      </div>
    </div>
  );
}
