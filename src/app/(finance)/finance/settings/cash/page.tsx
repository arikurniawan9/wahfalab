"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { pdf } from "@react-pdf/renderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChemicalLoader } from "@/components/ui";
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  History,
  Wallet,
  Download,
  FilterX,
  FileSpreadsheet,
  FileText,
  Calendar,
  RotateCcw,
  Lock,
  LockOpen
} from "lucide-react";
import {
  getBankLedgerDetails,
  getCashAccount,
  getCashClosingEntries,
  saveCashClosing,
  getFinancePeriodLocks,
  isFinancePeriodLocked,
  setFinancePeriodLock
} from "@/lib/actions/finance";
import { getCompanyProfile } from "@/lib/actions/company";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PERIOD_LOCK_HISTORY_LIMITS = [3, 6, 12] as const;

export default function CashSummaryPage() {
  const pathname = usePathname();
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  };
  const getDefaultEndDate = () => new Date().toISOString().split("T")[0];
  const getTodayDate = () => new Date().toISOString().split("T")[0];
  const getCurrentPeriod = () => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit"
    }).formatToParts(new Date());
    const year = parts.find((part) => part.type === "year")?.value || "0000";
    const month = parts.find((part) => part.type === "month")?.value || "00";
    return `${year}-${month}`;
  };

  const [loading, setLoading] = useState(true);
  const [cashAccount, setCashAccount] = useState<any>(null);
  const [summary, setSummary] = useState<any>({ totalIncome: 0, totalExpense: 0, netMovement: 0, transactionCount: 0 });
  const [audit, setAudit] = useState<any>({
    openingBalance: 0,
    closingBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    netMovement: 0
  });
  const [dailyAudit, setDailyAudit] = useState<Array<any>>([]);
  const [transactions, setTransactions] = useState<any>({ items: [], total: 0, pages: 1 });
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [transactionType, setTransactionType] = useState<'all' | 'income' | 'expense'>('all');
  const [closingDate, setClosingDate] = useState(getTodayDate());
  const [physicalBalance, setPhysicalBalance] = useState("");
  const [closingReason, setClosingReason] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [closingSubmitting, setClosingSubmitting] = useState(false);
  const [closingHistory, setClosingHistory] = useState<Array<any>>([]);
  const [latestClosing, setLatestClosing] = useState<any>(null);
  const [lockPeriod, setLockPeriod] = useState(getCurrentPeriod());
  const [lockReason, setLockReason] = useState("");
  const [periodLock, setPeriodLock] = useState<any>(null);
  const [periodLockHistory, setPeriodLockHistory] = useState<Array<any>>([]);
  const [periodLockSubmitting, setPeriodLockSubmitting] = useState(false);
  const [lockHistoryLimit, setLockHistoryLimit] = useState<(typeof PERIOD_LOCK_HISTORY_LIMITS)[number]>(12);
  const basePath = pathname.startsWith("/admin/")
    ? "/admin/finance/settings/banks"
    : "/finance/settings/banks";

  useEffect(() => {
    loadData();
  }, [startDate, endDate, transactionType]);

  useEffect(() => {
    void Promise.all([
      loadCashClosingData(),
      loadPeriodLockData(getCurrentPeriod())
    ]);
  }, []);

  useEffect(() => {
    void loadPeriodLockData(lockPeriod);
  }, [lockPeriod]);

  useEffect(() => {
    void loadPeriodLockHistory(lockHistoryLimit);
  }, [lockHistoryLimit]);

  async function loadData() {
    setLoading(true);
    try {
      const [cash, ledger] = await Promise.all([
        getCashAccount(),
        getBankLedgerDetails("CASH-001", startDate || undefined, endDate || undefined, transactionType)
      ]);

      setCashAccount(cash);
      setTransactions(ledger);
      setSummary({
        totalIncome: ledger.totalIncome || 0,
        totalExpense: ledger.totalExpense || 0,
        netMovement: ledger.netMovement || 0,
        transactionCount: ledger.total || 0
      });
      setAudit({
        openingBalance: ledger.audit?.openingBalance ?? ledger.openingBalance ?? 0,
        closingBalance: ledger.audit?.closingBalance ?? ledger.closingBalance ?? Number(cash?.balance || 0),
        totalIncome: ledger.audit?.totalIncome ?? 0,
        totalExpense: ledger.audit?.totalExpense ?? 0,
        netMovement: ledger.audit?.netMovement ?? 0
      });
      setDailyAudit(Array.isArray(ledger.audit?.dailySummary) ? ledger.audit.dailySummary : []);
    } finally {
      setLoading(false);
    }
  }

  async function loadCashClosingData() {
    try {
      const result = await getCashClosingEntries(20);
      const items = Array.isArray(result?.items) ? result.items : [];
      setClosingHistory(items);
      setLatestClosing(items[0] || null);
    } catch (error) {
      console.error("Load cash closing history error:", error);
    }
  }

  async function loadPeriodLockData(targetPeriod: string) {
    try {
      const status = await isFinancePeriodLocked(`${targetPeriod}-01`);
      setPeriodLock(status || null);
    } catch (error) {
      console.error("Load period lock error:", error);
    }
  }

  async function loadPeriodLockHistory(limit: number) {
    try {
      const history = await getFinancePeriodLocks(limit);
      if (history && Array.isArray((history as any).items)) {
        setPeriodLockHistory((history as any).items);
      } else {
        setPeriodLockHistory([]);
      }
    } catch (error) {
      console.error("Load period lock history error:", error);
      setPeriodLockHistory([]);
    }
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(amount);

  const formatPeriodLabel = (period: string) => {
    try {
      return new Date(`${period}-01T00:00:00`).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric"
      });
    } catch (error) {
      return period;
    }
  };

  const downloadPeriodLockCsv = () => {
    if (periodLockHistory.length === 0) {
      toast.error("Belum ada data histori lock periode");
      return;
    }

    const rows = [
      ["Periode", "Status", "Alasan", "PIC", "Waktu Update"],
      ...periodLockHistory.map((item: any) => [
        item.period,
        item.isLocked ? "LOCKED" : "UNLOCKED",
        item.reason || "",
        item.updatedByName || "",
        item.updatedAt ? new Date(item.updatedAt).toISOString() : ""
      ])
    ];

    const csv = rows
      .map((row: Array<string | number | null | undefined>) => row.map((value: string | number | null | undefined) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `histori-lock-periode-${lockHistoryLimit}-bulan.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCsv = () => {
    const rows = [
      ["Tanggal", "Jenis", "Kategori", "Deskripsi", "Jumlah", "Pemilik", "Handler"],
      ...transactions.items.map((tr: any) => [
        new Date(tr.transaction_date).toISOString(),
        tr.type,
        tr.category,
        tr.description,
        String(Number(tr.amount)),
        tr.bank_account?.account_holder || "",
        tr.handler?.full_name || "System"
      ])
    ];

    const csv = rows
      .map((row: Array<string | number | null | undefined>) => row.map((value: string | number | null | undefined) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kas-tunai-${startDate || "all"}-${endDate || "all"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = async () => {
    const XLSX = await import("xlsx");
    const rows = transactions.items.map((tr: any) => ({
      Tanggal: new Date(tr.transaction_date).toISOString(),
      Jenis: tr.type === "income" ? "Masuk" : "Keluar",
      Kategori: String(tr.category || "").replace(/_/g, " "),
      Deskripsi: tr.description,
      Jumlah: Number(tr.amount || 0),
      Pemilik: tr.bank_account?.account_holder || "",
      Handler: tr.handler?.full_name || "System"
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Kas Tunai");
    XLSX.writeFile(workbook, `kas-tunai-${startDate || "all"}-${endDate || "all"}.xlsx`);
  };

  const downloadPdf = async () => {
    try {
      const [company, BankLedgerPDF] = await Promise.all([
        getCompanyProfile(),
        import("@/components/pdf/BankLedgerPDF")
      ]);

      const blob = await pdf(
        <BankLedgerPDF.BankLedgerPDF
          company={company}
          bank={cashAccount}
          summary={summary}
          transactions={transactions.items}
          startDate={startDate || undefined}
          endDate={endDate || undefined}
          isCashAccount
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kas-tunai-${startDate || "all"}-${endDate || "all"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export cash PDF", error);
      toast.error("Gagal export PDF");
    }
  };

  const resetFilter = () => {
    setStartDate(getDefaultStartDate());
    setEndDate(getDefaultEndDate());
    setTransactionType("all");
  };

  const systemBalance = Number(cashAccount?.balance || 0);
  const physicalBalanceNumber = physicalBalance === "" ? systemBalance : Number(physicalBalance);
  const closingDifference = Number.isFinite(physicalBalanceNumber) ? physicalBalanceNumber - systemBalance : 0;
  const selectedClosing = closingHistory.find((item) => item.date === closingDate) || null;

  useEffect(() => {
    if (periodLock?.period !== lockPeriod) return;
    if (periodLock?.isLocked) {
      setLockReason(String(periodLock.reason || ""));
      return;
    }
    setLockReason("");
  }, [lockPeriod, periodLock?.period, periodLock?.isLocked, periodLock?.reason]);

  useEffect(() => {
    if (selectedClosing) {
      setPhysicalBalance(String(Number(selectedClosing.physicalBalance || 0)));
      setClosingReason(String(selectedClosing.discrepancyReason || ""));
      setClosingNotes(String(selectedClosing.notes || ""));
      return;
    }

    if (cashAccount) {
      setPhysicalBalance(String(Number(cashAccount.balance || 0)));
      setClosingReason("");
      setClosingNotes("");
    }
  }, [closingDate, selectedClosing?.id, cashAccount?.id]);

  const submitCashClosing = async () => {
    if (!closingDate) {
      toast.error("Tanggal penutupan wajib diisi");
      return;
    }

    const physical = Number(physicalBalance);
    if (!Number.isFinite(physical) || physical < 0) {
      toast.error("Saldo fisik tidak valid");
      return;
    }

    if (physical !== systemBalance && !closingReason.trim()) {
      toast.error("Alasan selisih wajib diisi jika saldo fisik berbeda");
      return;
    }

    setClosingSubmitting(true);
    try {
      const result = await saveCashClosing({
        date: closingDate,
        physicalBalance: physical,
        discrepancyReason: closingReason,
        notes: closingNotes
      });

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result?.updated ? "Penutupan kas diperbarui" : "Penutupan kas disimpan");
      await Promise.all([loadData(), loadCashClosingData()]);
    } catch (error: any) {
      toast.error(error?.message || "Gagal menyimpan penutupan kas");
    } finally {
      setClosingSubmitting(false);
    }
  };

  const submitPeriodLock = async (shouldLock: boolean) => {
    if (!lockPeriod) {
      toast.error("Periode wajib diisi");
      return;
    }

    const reason = lockReason.trim();
    if (shouldLock && !reason) {
      toast.error("Alasan lock periode wajib diisi");
      return;
    }

    setPeriodLockSubmitting(true);
    try {
      const result = await setFinancePeriodLock({
        period: lockPeriod,
        isLocked: shouldLock,
        reason: shouldLock ? reason : ""
      });

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(shouldLock ? "Periode berhasil dikunci" : "Periode berhasil dibuka");
      await Promise.all([
        loadPeriodLockData(lockPeriod),
        loadPeriodLockHistory(lockHistoryLimit)
      ]);
    } catch (error: any) {
      toast.error(error?.message || "Gagal memproses lock periode");
    } finally {
      setPeriodLockSubmitting(false);
    }
  };

  const isCashAccount = true;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="overflow-hidden rounded-3xl bg-emerald-900 shadow-xl border border-emerald-700/50">
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-500 p-4 md:p-5 text-white relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-[60px]" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                <Wallet className="h-5 w-5 text-emerald-200" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-black tracking-tight text-white leading-none">
                  Kas Tunai
                </h1>
                <p className="text-emerald-100/60 text-[10px] md:text-xs font-medium mt-1 uppercase tracking-widest">
                  Audit pencatatan kas fisik masuk dan keluar.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
              <div className="hidden lg:block text-right border-r border-white/10 pr-4">
                <p className="text-emerald-300 text-[8px] font-bold uppercase tracking-widest mb-0.5">Total Transaksi</p>
                <p className="text-lg font-black text-white leading-none">
                  {summary.transactionCount || 0} <span className="text-emerald-300 text-[10px] font-bold uppercase tracking-normal">Item</span>
                </p>
              </div>
              <Link href={basePath} className="w-fit">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded-lg bg-white/10 border-white/20 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Kembali
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                className="h-8 px-3 rounded-lg bg-white/10 border-white/20 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest"
              >
                <RotateCcw className={cn("mr-1.5 h-3.5 w-3.5", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <ChemicalLoader />
        </div>
      ) : (
        <>
          <Card className="rounded-[24px] md:rounded-[28px] shadow-sm overflow-hidden border-amber-100 bg-amber-50/70">
            <CardContent className="p-5 md:p-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="space-y-3 md:space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white flex items-center justify-center shadow-sm border border-amber-100">
                    <Wallet className="h-5 w-5 md:h-6 md:w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-amber-700">Kas Sistem</p>
                    <h2 className="text-lg md:text-2xl font-black text-amber-950">
                      {cashAccount?.bank_name || "Kas Tunai"}
                    </h2>
                    <p className="text-[10px] md:text-xs font-bold text-amber-700/70">
                      {cashAccount?.account_number || "CASH-001"}
                    </p>
                  </div>
                </div>
                <p className="text-xs md:text-sm font-medium text-amber-900/70">
                  Pemilik: <span className="font-black">{cashAccount?.account_holder || "WahfaLab"}</span>
                </p>
                <p className="max-w-xl text-[10px] md:text-xs leading-relaxed font-medium text-amber-900/70">
                  Halaman ini khusus untuk kas fisik. Semua transaksi cash masuk dan keluar dicatat di sini agar audit kas harian lebih jelas.
                </p>
                <Badge className="bg-amber-100 text-amber-800 border-none text-[8px] md:text-[9px] font-black uppercase w-fit">
                  Rekening Sistem
                </Badge>
              </div>

              <div className="text-left md:text-right pt-4 md:pt-0 border-t md:border-t-0 border-amber-200/70">
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-amber-700">Saldo Kas Saat Ini</p>
                <p className="text-2xl md:text-4xl font-black mt-1 md:mt-2 text-amber-950">
                  {formatCurrency(Number(cashAccount?.balance || 0))}
                </p>
                <p className="text-[10px] md:text-xs mt-1 text-amber-700/70">
                  Saldo fisik yang dicatat oleh sistem
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <Card className="rounded-[24px] border-amber-100 bg-white shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Kas Masuk</p>
                  <p className="mt-2 text-xl font-black text-amber-950">{formatCurrency(Number(summary.totalIncome || 0))}</p>
                </div>
                <ArrowUpRight className="h-6 w-6 text-amber-600" />
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-rose-100 bg-white shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-700">Kas Keluar</p>
                  <p className="mt-2 text-xl font-black text-rose-950">{formatCurrency(Number(summary.totalExpense || 0))}</p>
                </div>
                <ArrowDownRight className="h-6 w-6 text-rose-600" />
              </CardContent>
            </Card>
            <Card className="rounded-[24px] border-slate-100 bg-white shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Net Movement</p>
                  <p className={cn(
                    "mt-2 text-xl font-black",
                    Number(summary.netMovement || 0) >= 0 ? "text-emerald-950" : "text-rose-950"
                  )}>
                    {formatCurrency(Number(summary.netMovement || 0))}
                  </p>
                </div>
                <Banknote className="h-6 w-6 text-slate-500" />
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[22px] md:rounded-[28px] border-amber-100 shadow-sm overflow-hidden">
            <CardHeader className="p-4 md:p-6 border-b border-amber-100 bg-amber-50/60">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <CardTitle className="text-base md:text-lg font-bold text-amber-950 flex items-center gap-2.5">
                  <Wallet className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                  Penutupan Kas Harian
                </CardTitle>
                {latestClosing && (
                  <Badge className="bg-amber-100 text-amber-800 border-none text-[9px] font-black uppercase tracking-widest w-fit">
                    Closing Terakhir {new Date(`${latestClosing.date}T00:00:00`).toLocaleDateString("id-ID")}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-amber-800/80 mt-1">
                Catat saldo fisik kas di akhir hari untuk kontrol selisih dan audit internal.
              </p>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="rounded-[18px] border-amber-100 bg-white shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tanggal Closing</label>
                        <Input
                          type="date"
                          value={closingDate}
                          onChange={(e) => setClosingDate(e.target.value)}
                          className="h-10 rounded-xl border-slate-200 bg-white text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Saldo Fisik</label>
                        <Input
                          type="number"
                          min={0}
                          value={physicalBalance}
                          onChange={(e) => setPhysicalBalance(e.target.value)}
                          className="h-10 rounded-xl border-slate-200 bg-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Saldo Sistem</p>
                        <p className="text-xs font-black text-slate-700 mt-1">{formatCurrency(systemBalance)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Saldo Fisik</p>
                        <p className="text-xs font-black text-slate-700 mt-1">{formatCurrency(physicalBalanceNumber || 0)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Selisih</p>
                        <p className={cn(
                          "text-xs font-black mt-1",
                          closingDifference === 0 ? "text-emerald-700" : "text-rose-700"
                        )}>
                          {formatCurrency(closingDifference)}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={submitCashClosing}
                      disabled={closingSubmitting}
                      className="h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-widest w-full"
                    >
                      {closingSubmitting ? "Menyimpan..." : selectedClosing ? "Update Closing Kas" : "Simpan Closing Kas"}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="rounded-[18px] border-amber-100 bg-white shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Alasan Selisih (Wajib jika selisih)</label>
                      <Textarea
                        value={closingReason}
                        onChange={(e) => setClosingReason(e.target.value)}
                        className="min-h-[84px] rounded-xl border-slate-200 bg-white text-xs resize-none"
                        placeholder="Contoh: uang kecil belum dicatat, pembulatan, atau kesalahan input sebelumnya."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Catatan Penutupan</label>
                      <Textarea
                        value={closingNotes}
                        onChange={(e) => setClosingNotes(e.target.value)}
                        className="min-h-[84px] rounded-xl border-slate-200 bg-white text-xs resize-none"
                        placeholder="Catatan tambahan untuk audit, misalnya kondisi kas fisik atau tindak lanjut."
                      />
                    </div>
                    {selectedClosing && (
                      <Badge className="bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-black uppercase tracking-widest w-fit">
                        Data closing tanggal ini sudah ada, aksi simpan akan update data.
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[22px] md:rounded-[28px] border-amber-100 shadow-sm overflow-hidden">
            <CardHeader className="p-4 md:p-6 border-b border-amber-100 bg-amber-50/40">
              <CardTitle className="text-base md:text-lg font-bold text-amber-950 flex items-center gap-2.5">
                <History className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                Riwayat Closing Kas
              </CardTitle>
              <p className="text-xs text-amber-800/80 mt-1">
                Menampilkan histori penutupan kas harian beserta selisih dan keterangan.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {closingHistory.length === 0 ? (
                <div className="p-12 text-center text-slate-400 italic">
                  Belum ada data penutupan kas harian.
                </div>
              ) : (
                <>
                  <div className="md:hidden divide-y divide-slate-100">
                    {closingHistory.map((item: any) => (
                      <div key={item.id} className="p-4 space-y-2">
                        <p className="text-xs font-black text-slate-700">
                          {new Date(`${item.date}T00:00:00`).toLocaleDateString("id-ID")}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <p className="text-slate-400 uppercase font-black">Sistem</p>
                            <p className="font-bold text-slate-700">{formatCurrency(Number(item.systemBalance || 0))}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 uppercase font-black">Fisik</p>
                            <p className="font-bold text-slate-700">{formatCurrency(Number(item.physicalBalance || 0))}</p>
                          </div>
                        </div>
                        <p className={cn(
                          "text-[10px] font-black uppercase",
                          Number(item.difference || 0) === 0 ? "text-emerald-700" : "text-rose-700"
                        )}>
                          Selisih: {formatCurrency(Number(item.difference || 0))}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          PIC: <span className="font-bold">{item.closedByName || "System"}</span>
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-amber-50 border-b border-amber-100">
                          <th className="text-left p-4 text-[10px] font-black uppercase text-amber-700 tracking-widest">Tanggal</th>
                          <th className="text-right p-4 text-[10px] font-black uppercase text-amber-700 tracking-widest">Saldo Sistem</th>
                          <th className="text-right p-4 text-[10px] font-black uppercase text-amber-700 tracking-widest">Saldo Fisik</th>
                          <th className="text-right p-4 text-[10px] font-black uppercase text-amber-700 tracking-widest">Selisih</th>
                          <th className="text-left p-4 text-[10px] font-black uppercase text-amber-700 tracking-widest">PIC</th>
                          <th className="text-left p-4 text-[10px] font-black uppercase text-amber-700 tracking-widest">Alasan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {closingHistory.map((item: any) => (
                          <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                            <td className="p-4 text-xs font-bold text-slate-700">
                              {new Date(`${item.date}T00:00:00`).toLocaleDateString("id-ID")}
                            </td>
                            <td className="p-4 text-right text-xs font-bold text-slate-700">{formatCurrency(Number(item.systemBalance || 0))}</td>
                            <td className="p-4 text-right text-xs font-bold text-slate-700">{formatCurrency(Number(item.physicalBalance || 0))}</td>
                            <td className={cn(
                              "p-4 text-right text-xs font-black",
                              Number(item.difference || 0) === 0 ? "text-emerald-700" : "text-rose-700"
                            )}>
                              {formatCurrency(Number(item.difference || 0))}
                            </td>
                            <td className="p-4 text-xs font-bold text-slate-600">{item.closedByName || "System"}</td>
                            <td className="p-4 text-xs text-slate-500">
                              {item.discrepancyReason || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[22px] md:rounded-[28px] border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/70">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <CardTitle className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2.5">
                  <Lock className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                  Lock Periode Akuntansi
                </CardTitle>
                <Badge
                  className={cn(
                    "text-[9px] font-black uppercase tracking-widest w-fit border-none",
                    periodLock?.isLocked
                      ? "bg-rose-100 text-rose-700"
                      : "bg-emerald-100 text-emerald-700"
                  )}
                >
                  {periodLock?.isLocked ? "Periode Terkunci" : "Periode Terbuka"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Saat periode dikunci, posting transaksi keuangan pada bulan tersebut akan ditolak untuk menjaga integritas audit.
              </p>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <Card className="rounded-[18px] border-slate-200 bg-white shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Periode</label>
                      <Input
                        type="month"
                        value={lockPeriod}
                        onChange={(e) => setLockPeriod(e.target.value)}
                        className="h-10 rounded-xl border-slate-200 bg-white text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Alasan Lock (Wajib saat lock)
                      </label>
                      <Textarea
                        value={lockReason}
                        onChange={(e) => setLockReason(e.target.value)}
                        className="min-h-[84px] rounded-xl border-slate-200 bg-white text-xs resize-none"
                        placeholder="Contoh: Rekonsiliasi bulanan sudah final dan periode ditutup."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button
                        onClick={() => submitPeriodLock(true)}
                        disabled={periodLockSubmitting || Boolean(periodLock?.isLocked)}
                        className="h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-widest"
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Lock
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => submitPeriodLock(false)}
                        disabled={periodLockSubmitting || !periodLock?.isLocked}
                        className="h-10 rounded-xl border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest"
                      >
                        <LockOpen className="mr-2 h-4 w-4" />
                        Unlock
                      </Button>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-[10px] space-y-1">
                      <p className="font-black uppercase tracking-widest text-slate-500">
                        Status {formatPeriodLabel(lockPeriod)}
                      </p>
                      <p className={cn("font-black", periodLock?.isLocked ? "text-rose-700" : "text-emerald-700")}>
                        {periodLock?.isLocked ? "Terkunci" : "Terbuka"}
                      </p>
                      <p className="text-slate-500">
                        PIC: <span className="font-bold text-slate-700">{periodLock?.updatedByName || "-"}</span>
                      </p>
                      <p className="text-slate-500">
                        Update:{" "}
                        <span className="font-bold text-slate-700">
                          {periodLock?.updatedAt
                            ? new Date(periodLock.updatedAt).toLocaleString("id-ID")
                            : "-"}
                        </span>
                      </p>
                      {periodLock?.isLocked && (
                        <p className="text-slate-600">
                          Alasan: <span className="font-bold">{periodLock?.reason || "-"}</span>
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[18px] border-slate-200 bg-white shadow-sm xl:col-span-2 overflow-hidden">
                  <CardHeader className="px-4 py-3 border-b border-slate-100 bg-slate-50 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <CardTitle className="text-sm font-bold text-slate-800">Riwayat Lock Periode</CardTitle>
                      <Button
                        onClick={downloadPeriodLockCsv}
                        variant="outline"
                        className="h-8 rounded-lg border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest w-full sm:w-auto"
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Export CSV
                      </Button>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-white p-1 w-full sm:w-auto">
                        {PERIOD_LOCK_HISTORY_LIMITS.map((limit) => (
                          <button
                            key={limit}
                            type="button"
                            onClick={() => setLockHistoryLimit(limit)}
                            className={cn(
                              "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-colors",
                              lockHistoryLimit === limit
                                ? "bg-amber-600 text-white"
                                : "text-slate-500 hover:text-slate-800"
                            )}
                          >
                            {limit} Bulan
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-slate-500">
                        Menampilkan {periodLockHistory.length} periode terakhir
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {periodLockHistory.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 italic text-sm">
                        Belum ada histori lock periode.
                      </div>
                    ) : (
                      <>
                        <div className="md:hidden divide-y divide-slate-100">
                          {periodLockHistory.map((item: any) => (
                            <div key={item.id} className="p-4 space-y-1.5">
                              <p className="text-xs font-black text-slate-700">{formatPeriodLabel(item.period)}</p>
                              <p
                                className={cn(
                                  "text-[10px] font-black uppercase",
                                  item.isLocked ? "text-rose-700" : "text-emerald-700"
                                )}
                              >
                                {item.isLocked ? "Locked" : "Unlocked"}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                PIC: <span className="font-bold">{item.updatedByName || "-"}</span>
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {item.updatedAt ? new Date(item.updatedAt).toLocaleString("id-ID") : "-"}
                              </p>
                              {item.reason && (
                                <p className="text-[10px] text-slate-600">
                                  Alasan: <span className="font-bold">{item.reason}</span>
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full min-w-[680px]">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="text-left p-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Periode</th>
                                <th className="text-left p-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Status</th>
                                <th className="text-left p-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">PIC</th>
                                <th className="text-left p-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Waktu</th>
                                <th className="text-left p-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Alasan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {periodLockHistory.map((item: any) => (
                                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="p-4 text-xs font-bold text-slate-700">{formatPeriodLabel(item.period)}</td>
                                  <td
                                    className={cn(
                                      "p-4 text-xs font-black uppercase",
                                      item.isLocked ? "text-rose-700" : "text-emerald-700"
                                    )}
                                  >
                                    {item.isLocked ? "Locked" : "Unlocked"}
                                  </td>
                                  <td className="p-4 text-xs font-bold text-slate-600">{item.updatedByName || "-"}</td>
                                  <td className="p-4 text-xs text-slate-500">
                                    {item.updatedAt ? new Date(item.updatedAt).toLocaleString("id-ID") : "-"}
                                  </td>
                                  <td className="p-4 text-xs text-slate-500">{item.reason || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-amber-100 shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-amber-100 bg-amber-50/60">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <CardTitle className="text-lg font-bold text-amber-950 flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-amber-600" />
                  Audit Periode Kas Tunai
                </CardTitle>
                {transactionType !== "all" && (
                  <Badge className="bg-amber-100 text-amber-800 border-none text-[9px] font-black uppercase tracking-widest w-fit">
                    Audit tetap hitung semua transaksi
                  </Badge>
                )}
              </div>
              <p className="text-xs text-amber-800/80 mt-1">
                Ringkasan saldo awal, mutasi periode, dan saldo akhir untuk rentang tanggal yang dipilih.
              </p>
            </CardHeader>
            <CardContent className="p-5 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="rounded-[20px] border-amber-100 bg-white shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Saldo Awal</p>
                    <p className="mt-2 text-xl font-black text-amber-950">{formatCurrency(Number(audit.openingBalance || 0))}</p>
                  </CardContent>
                </Card>
                <Card className="rounded-[20px] border-slate-100 bg-white shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Mutasi Periode</p>
                    <p className={cn(
                      "mt-2 text-xl font-black",
                      Number(audit.netMovement || 0) >= 0 ? "text-emerald-950" : "text-rose-950"
                    )}>
                      {formatCurrency(Number(audit.netMovement || 0))}
                    </p>
                  </CardContent>
                </Card>
                <Card className="rounded-[20px] border-amber-100 bg-white shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Saldo Akhir</p>
                    <p className="mt-2 text-xl font-black text-amber-950">{formatCurrency(Number(audit.closingBalance || 0))}</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[22px] md:rounded-[28px] border-amber-100 shadow-sm overflow-hidden">
            <CardHeader className="p-4 md:p-6 border-b border-amber-100 bg-amber-50/40">
              <CardTitle className="text-base md:text-lg font-bold text-amber-950 flex items-center gap-2.5">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                Mutasi Harian Kas Tunai
              </CardTitle>
              <p className="text-xs text-amber-800/80 mt-1">
                Breakdown harian untuk memudahkan audit saldo awal dan saldo akhir setiap hari.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {dailyAudit.length === 0 ? (
                <div className="p-12 text-center text-slate-400 italic">
                  Belum ada mutasi harian pada periode yang dipilih.
                </div>
              ) : (
                <>
                  <div className="md:hidden space-y-2 p-4">
                    {[...dailyAudit].reverse().map((day: any) => (
                      <Card key={day.date} className="rounded-xl border-amber-100 bg-white shadow-sm">
                        <CardContent className="p-3 space-y-2">
                          <p className="text-xs font-black text-amber-900">
                            {new Date(`${day.date}T00:00:00`).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <p className="text-slate-400 uppercase font-black">Saldo Awal</p>
                              <p className="font-bold text-slate-700">{formatCurrency(Number(day.openingBalance || 0))}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 uppercase font-black">Saldo Akhir</p>
                              <p className="font-bold text-slate-700">{formatCurrency(Number(day.closingBalance || 0))}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 uppercase font-black">Masuk</p>
                              <p className="font-black text-amber-700">{formatCurrency(Number(day.totalIncome || 0))}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 uppercase font-black">Keluar</p>
                              <p className="font-black text-rose-700">{formatCurrency(Number(day.totalExpense || 0))}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full min-w-[860px]">
                    <thead>
                      <tr className="bg-amber-50 border-b border-amber-100">
                        <th className="text-left p-4 text-[10px] font-black uppercase text-amber-700 tracking-widest">Tanggal</th>
                        <th className="text-right p-4 text-[10px] font-black uppercase text-amber-700 tracking-widest">Saldo Awal</th>
                        <th className="text-right p-4 text-[10px] font-black uppercase text-amber-700 tracking-widest">Kas Masuk</th>
                        <th className="text-right p-4 text-[10px] font-black uppercase text-amber-700 tracking-widest">Kas Keluar</th>
                        <th className="text-right p-4 text-[10px] font-black uppercase text-amber-700 tracking-widest">Net</th>
                        <th className="text-right p-4 text-[10px] font-black uppercase text-amber-700 tracking-widest">Saldo Akhir</th>
                        <th className="text-right p-4 text-[10px] font-black uppercase text-amber-700 tracking-widest">Jml Transaksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {[...dailyAudit].reverse().map((day: any) => (
                        <tr key={day.date} className="hover:bg-amber-50/30 transition-colors">
                          <td className="p-4 text-xs font-bold text-slate-700 whitespace-nowrap">
                            {new Date(`${day.date}T00:00:00`).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>
                          <td className="p-4 text-right text-xs font-bold text-slate-700">{formatCurrency(Number(day.openingBalance || 0))}</td>
                          <td className="p-4 text-right text-xs font-black text-amber-700">{formatCurrency(Number(day.totalIncome || 0))}</td>
                          <td className="p-4 text-right text-xs font-black text-rose-700">{formatCurrency(Number(day.totalExpense || 0))}</td>
                          <td className={cn(
                            "p-4 text-right text-xs font-black",
                            Number(day.netMovement || 0) >= 0 ? "text-emerald-700" : "text-rose-700"
                          )}>
                            {formatCurrency(Number(day.netMovement || 0))}
                          </td>
                          <td className="p-4 text-right text-xs font-bold text-slate-700">{formatCurrency(Number(day.closingBalance || 0))}</td>
                          <td className="p-4 text-right text-xs font-bold text-slate-500">{Number(day.transactionCount || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[22px] md:rounded-[28px] border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="p-4 md:p-6 border-b border-slate-100">
              <div className="flex flex-col gap-5 md:gap-6">
                <CardTitle className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2.5">
                  <History className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                  Mutasi Kas Tunai
                </CardTitle>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Jenis Transaksi</label>
                    <div className="grid grid-cols-3 rounded-xl border border-slate-200 bg-white p-1 w-full sm:w-fit shadow-sm">
                      {[
                        { key: "all", label: "Semua" },
                        { key: "income", label: "Masuk" },
                        { key: "expense", label: "Keluar" }
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setTransactionType(item.key as 'all' | 'income' | 'expense')}
                          className={cn(
                            "px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors text-center",
                            transactionType === item.key
                              ? "bg-amber-600 text-white"
                              : "text-slate-500 hover:text-slate-800"
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Dari Tanggal</label>
                      <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 rounded-xl border-slate-200 bg-white text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sampai</label>
                      <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 rounded-xl border-slate-200 bg-white text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <Button variant="outline" onClick={resetFilter} className="h-10 rounded-xl border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest justify-center">
                      <FilterX className="mr-2 h-4 w-4" /> Reset
                    </Button>
                    <Button onClick={downloadCsv} variant="outline" className="h-10 rounded-xl border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-widest justify-center">
                      <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    <Button onClick={downloadExcel} className="h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-widest justify-center">
                      <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
                    </Button>
                    <Button onClick={downloadPdf} variant="outline" className="h-10 rounded-xl border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest justify-center">
                      <FileText className="mr-2 h-4 w-4" /> Export PDF
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Total {summary.transactionCount || 0} transaksi {transactionType === 'all' ? 'tercatat' : transactionType === 'income' ? 'masuk' : 'keluar'} pada kas tunai
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {transactions.items.length === 0 ? (
                <div className="p-20 text-center text-slate-400 italic">Belum ada mutasi kas pada periode ini.</div>
              ) : (
                <>
                  <div className="md:hidden divide-y divide-slate-100">
                    {transactions.items.map((tr: any) => (
                      <div key={tr.id} className="p-4 space-y-3 active:bg-amber-50/40 transition-colors">
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                {new Date(tr.transaction_date).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            <h3 className="text-sm font-black text-slate-900 leading-tight break-words">
                              {tr.description}
                            </h3>
                          </div>
                          <Badge className={cn(
                            "text-[8px] font-black uppercase px-1.5 py-0 border-none shrink-0",
                            tr.type === 'income' ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-700"
                          )}>
                            {tr.type === 'income' ? 'Masuk' : 'Keluar'}
                          </Badge>
                        </div>

                        <div className="flex justify-between items-end gap-2">
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest break-words">
                              {String(tr.category || "").replace(/_/g, " ")}
                            </p>
                            <p className="text-[9px] font-medium text-slate-500">
                              Oleh: <span className="font-bold">{tr.handler?.full_name || "System"}</span>
                            </p>
                          </div>
                          <span className={cn(
                            "text-sm font-black tracking-tight whitespace-nowrap pl-2",
                            tr.type === 'income' ? "text-amber-600" : "text-rose-600"
                          )}>
                            {tr.type === 'income' ? '+' : '-'} {formatCurrency(Number(tr.amount))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-amber-50 border-b border-amber-100">
                        <th className="text-left p-5 text-[10px] font-black uppercase text-amber-700 tracking-widest">Tanggal</th>
                        <th className="text-left p-5 text-[10px] font-black uppercase text-amber-700 tracking-widest">Jenis</th>
                        <th className="text-left p-5 text-[10px] font-black uppercase text-amber-700 tracking-widest">Deskripsi</th>
                        <th className="text-right p-5 text-[10px] font-black uppercase text-amber-700 tracking-widest">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.items.map((tr: any) => (
                        <tr key={tr.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="p-5 text-xs font-bold text-slate-600 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-slate-400" />
                              {new Date(tr.transaction_date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="p-5">
                            <Badge className={cn(
                              "text-[9px] font-black uppercase px-2 py-0.5 border-none",
                              tr.type === 'income' ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-700"
                            )}>
                              {tr.type === 'income' ? 'Masuk' : 'Keluar'}
                            </Badge>
                          </td>
                          <td className="p-5">
                            <p className="text-sm font-bold text-slate-900">{tr.description}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                              {String(tr.category || "").replace(/_/g, " ")} - {tr.handler?.full_name || "System"}
                            </p>
                          </td>
                          <td className="p-5 text-right">
                            <span className={cn(
                              "text-sm font-black",
                              tr.type === 'income' ? "text-amber-600" : "text-rose-600"
                            )}>
                              {tr.type === 'income' ? '+' : '-'} {formatCurrency(Number(tr.amount))}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
