"use client";

import React, { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { pdf } from "@react-pdf/renderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChemicalLoader } from "@/components/ui";
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Banknote, History, Wallet, Building, Calendar, Download, FilterX, FileSpreadsheet, FileText, RotateCcw } from "lucide-react";
import { getBankAccounts, getBankLedgerDetails } from "@/lib/actions/finance";
import { getCompanyProfile } from "@/lib/actions/company";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function BankDetailPage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const bankId = params?.id;
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  };
  const getDefaultEndDate = () => new Date().toISOString().split("T")[0];
  const basePath = pathname.startsWith('/admin/')
    ? '/admin/finance/settings/banks'
    : '/finance/settings/banks';

  const [loading, setLoading] = useState(true);
  const [bank, setBank] = useState<any>(null);
  const [summary, setSummary] = useState<any>({ totalIncome: 0, totalExpense: 0, netMovement: 0, transactionCount: 0 });
  const [transactions, setTransactions] = useState<any>({ items: [], total: 0, pages: 1 });
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [transactionType, setTransactionType] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    if (!bankId) return;
    loadData();
  }, [bankId, startDate, endDate, transactionType]);

  async function loadData() {
    setLoading(true);
    try {
      const [banks, tx] = await Promise.all([
        getBankAccounts(),
        getBankLedgerDetails(bankId, startDate || undefined, endDate || undefined, transactionType)
      ]);

      setBank(banks.find((item: any) => item.id === bankId) || null);
      setTransactions(tx);
      setSummary({
        totalIncome: tx.totalIncome || 0,
        totalExpense: tx.totalExpense || 0,
        netMovement: tx.netMovement || 0,
        transactionCount: tx.total || 0
      });
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);

  const downloadCsv = () => {
    const rows = [
      ['Tanggal', 'Jenis', 'Kategori', 'Deskripsi', 'Jumlah', 'Rekening', 'Pemilik', 'Handler'],
      ...transactions.items.map((tr: any) => [
        new Date(tr.transaction_date).toISOString(),
        tr.type,
        tr.category,
        tr.description,
        String(Number(tr.amount)),
        tr.bank_account?.account_number || '',
        tr.bank_account?.account_holder || '',
        tr.handler?.full_name || 'System'
      ])
    ]

    const csv = rows
      .map((row: Array<string | number | null | undefined>) => row.map((value: string | number | null | undefined) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mutasi-${selectedBank?.account_number || bankId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  };

  const downloadExcel = async () => {
    const XLSX = await import("xlsx");

    const rows = transactions.items.map((tr: any) => ({
      Tanggal: new Date(tr.transaction_date).toISOString(),
      Jenis: tr.type === "income" ? "Masuk" : "Keluar",
      Kategori: String(tr.category || "").replace(/_/g, " "),
      Deskripsi: tr.description,
      Jumlah: Number(tr.amount || 0),
      Rekening: tr.bank_account?.account_number || "",
      Pemilik: tr.bank_account?.account_holder || "",
      Handler: tr.handler?.full_name || "System"
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mutasi");
    XLSX.writeFile(workbook, `mutasi-${selectedBank?.account_number || bankId}.xlsx`);
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
          bank={selectedBank}
          summary={summary}
          transactions={transactions.items}
          startDate={startDate || undefined}
          endDate={endDate || undefined}
          isCashAccount={isCashAccount}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mutasi-${selectedBank?.account_number || bankId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export PDF", error);
      toast.error("Gagal export PDF");
    }
  };

  const resetFilter = () => {
    setStartDate(getDefaultStartDate());
    setEndDate(getDefaultEndDate());
    setTransactionType("all");
  };

  const selectedBank = bank;
  const isCashAccount = selectedBank?.account_number === 'CASH-001';

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="overflow-hidden rounded-3xl bg-emerald-900 shadow-xl border border-emerald-700/50">
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-500 p-4 md:p-5 text-white relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-[60px]" />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                  {selectedBank?.account_number === "CASH-001" ? (
                    <Wallet className="h-5 w-5 text-amber-200" />
                  ) : (
                    <Building className="h-5 w-5 text-emerald-200" />
                  )}
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-black tracking-tight text-white leading-none uppercase">
                    Mutasi Rekening
                  </h1>
                  <p className="text-emerald-100/70 text-[10px] md:text-xs font-medium mt-1 uppercase tracking-widest">
                    Rincian arus masuk dan keluar setiap rekening
                  </p>
                </div>
              </div>

              <div className="self-end sm:self-auto text-right border-r border-white/10 pr-3">
                <p className="text-emerald-300 text-[8px] font-bold uppercase tracking-widest mb-0.5">Total Transaksi</p>
                <p className="text-lg font-black text-white leading-none">
                  {summary.transactionCount || 0} <span className="text-emerald-300 text-[10px] font-bold uppercase tracking-normal">Item</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <ChemicalLoader />
        </div>
      ) : !selectedBank ? (
        <Card className="rounded-[24px] border-dashed border-slate-200">
          <CardContent className="p-12 text-center text-slate-500">
            Rekening tidak ditemukan.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className={cn(
            "rounded-[24px] md:rounded-[28px] shadow-sm overflow-hidden",
            isCashAccount ? "border-amber-100 bg-amber-50/70" : "border-emerald-100 bg-emerald-50/60"
          )}>
            <CardContent className="p-5 md:p-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div className="space-y-3 md:space-y-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white flex items-center justify-center shadow-sm border",
                    isCashAccount ? "border-amber-100" : "border-emerald-100"
                  )}>
                    {isCashAccount ? <Wallet className="h-5 w-5 md:h-6 md:w-6 text-amber-600" /> : <Building className="h-5 w-5 md:h-6 md:w-6 text-emerald-600" />}
                  </div>
                  <div>
                    <p className={cn(
                      "text-[9px] md:text-[10px] font-black uppercase tracking-widest",
                      isCashAccount ? "text-amber-700" : "text-emerald-700"
                    )}>
                      {isCashAccount ? 'Kas Sistem' : 'Rekening'}
                    </p>
                    <h2 className={cn(
                      "text-lg md:text-2xl font-black leading-tight",
                      isCashAccount ? "text-amber-950" : "text-emerald-950"
                    )}>
                      {selectedBank.bank_name}
                    </h2>
                    <p className={cn(
                      "text-[10px] md:text-xs font-bold",
                      isCashAccount ? "text-amber-700/70" : "text-emerald-700/70"
                    )}>
                      {selectedBank.account_number}
                    </p>
                  </div>
                </div>
                <p className={cn(
                  "text-xs md:text-sm font-medium",
                  isCashAccount ? "text-amber-900/70" : "text-emerald-900/70"
                )}>
                  Pemilik: <span className="font-black">{selectedBank.account_holder}</span>
                </p>
                {isCashAccount && (
                  <p className="max-w-xl text-[10px] md:text-xs leading-relaxed font-medium text-amber-900/70">
                    Ini adalah rekening sistem untuk transaksi tunai. Semua pemasukan dan pengeluaran cash dicatat di sini agar audit kas tetap jelas.
                  </p>
                )}
                {selectedBank.account_number === 'CASH-001' && (
                  <Badge className="bg-amber-100 text-amber-800 border-none text-[8px] md:text-[9px] font-black uppercase w-fit">
                    Rekening Sistem
                  </Badge>
                )}
              </div>

              <div className="text-left md:text-right pt-4 md:pt-0 border-t md:border-t-0 border-emerald-100/50">
                <p className={cn(
                  "text-[9px] md:text-[10px] font-black uppercase tracking-widest",
                  isCashAccount ? "text-amber-700" : "text-emerald-700"
                )}>
                  Saldo Saat Ini
                </p>
                <p className={cn(
                  "text-2xl md:text-4xl font-black mt-1 md:mt-2",
                  isCashAccount ? "text-amber-950" : "text-emerald-950"
                )}>
                  {formatCurrency(Number(selectedBank.balance || 0))}
                </p>
                <p className={cn(
                  "text-[10px] md:text-xs mt-1",
                  isCashAccount ? "text-amber-700/70" : "text-emerald-700/70"
                )}>
                  {isCashAccount ? 'Saldo kas fisik dicatat sistem' : 'Saldo aktual rekening'}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <Card className="rounded-[20px] md:rounded-[24px] border-emerald-100 bg-white shadow-sm">
              <CardContent className="p-4 md:p-5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-emerald-700">Total Masuk</p>
                  <p className="mt-1 md:mt-2 text-lg md:text-xl font-black text-emerald-950">{formatCurrency(Number(summary.totalIncome || 0))}</p>
                </div>
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5 md:h-6 md:w-6 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-[20px] md:rounded-[24px] border-rose-100 bg-white shadow-sm">
              <CardContent className="p-4 md:p-5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-rose-700">Total Keluar</p>
                  <p className="mt-1 md:mt-2 text-lg md:text-xl font-black text-rose-950">{formatCurrency(Number(summary.totalExpense || 0))}</p>
                </div>
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-rose-50 flex items-center justify-center">
                  <ArrowDownRight className="h-5 w-5 md:h-6 md:w-6 text-rose-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-[20px] md:rounded-[24px] border-slate-100 bg-white shadow-sm">
              <CardContent className="p-4 md:p-5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-700">Net Movement</p>
                  <p className={cn(
                    "mt-1 md:mt-2 text-lg md:text-xl font-black",
                    Number(summary.netMovement || 0) >= 0 ? "text-emerald-950" : "text-rose-950"
                  )}>
                    {formatCurrency(Number(summary.netMovement || 0))}
                  </p>
                </div>
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-slate-50 flex items-center justify-center">
                  <Banknote className="h-5 w-5 md:h-6 md:w-6 text-slate-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-[22px] md:rounded-[28px] border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="p-4 md:p-6 border-b border-slate-100">
              <div className="flex flex-col gap-5 md:gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2.5">
                    <History className="h-4 w-4 md:h-5 md:w-5 text-emerald-600" />
                    Mutasi Terkini
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Total {summary.transactionCount || 0} transaksi {transactionType === 'all' ? 'tercatat' : transactionType === 'income' ? 'masuk' : 'keluar'}
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Jenis</label>
                      <div className="grid grid-cols-3 rounded-xl border border-slate-200 bg-slate-50/50 p-1 w-full sm:w-fit">
                        {[
                          { key: 'all', label: 'Semua' },
                          { key: 'income', label: 'Masuk' },
                          { key: 'expense', label: 'Keluar' }
                        ].map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setTransactionType(item.key as 'all' | 'income' | 'expense')}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all text-center",
                              transactionType === item.key
                                ? "bg-white text-emerald-700 shadow-sm ring-1 ring-black/5"
                                : "text-slate-500 hover:text-slate-800"
                            )}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 lg:flex lg:gap-3">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Dari</label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="h-9 rounded-xl border-slate-200 bg-white text-xs focus-visible:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sampai</label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="h-9 rounded-xl border-slate-200 bg-white text-xs focus-visible:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-end">
                      <Button 
                        variant="outline" 
                        onClick={resetFilter} 
                        className="h-9 w-full lg:w-auto rounded-xl border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50"
                      >
                        <FilterX className="mr-2 h-3.5 w-3.5" /> Reset
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button onClick={downloadCsv} variant="outline" className="h-9 rounded-xl border-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-50 justify-center">
                      <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
                    </Button>
                    <Button onClick={downloadExcel} variant="outline" className="h-9 rounded-xl border-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-50 justify-center">
                      <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Excel
                    </Button>
                    <Button onClick={downloadPdf} variant="outline" className="h-9 rounded-xl border-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-50 justify-center">
                      <FileText className="mr-1.5 h-3.5 w-3.5" /> PDF
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {transactions.items.length === 0 ? (
                <div className="p-20 text-center text-slate-400 italic">Belum ada mutasi pada rekening ini.</div>
              ) : (
                <>
                  {/* Mobile View: Card List */}
                  <div className="block md:hidden divide-y divide-slate-100">
                    {transactions.items.map((tr: any) => (
                      <div key={tr.id} className="p-4 space-y-3 active:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start">
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
                            tr.type === 'income' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          )}>
                            {tr.type === 'income' ? 'Masuk' : 'Keluar'}
                          </Badge>
                        </div>
                        
                        <div className="flex justify-between items-end">
                          <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest break-words">
                              {tr.category.replace('_', ' ')}
                            </p>
                            <p className="text-[9px] font-medium text-slate-500">
                              Oleh: <span className="font-bold">{tr.handler?.full_name || 'System'}</span>
                            </p>
                          </div>
                          <span className={cn(
                            "text-sm sm:text-base font-black tracking-tight whitespace-nowrap pl-2",
                            tr.type === 'income' ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {tr.type === 'income' ? '+' : '-'} {formatCurrency(Number(tr.amount))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View: Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left p-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Tanggal</th>
                          <th className="text-left p-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Jenis</th>
                          <th className="text-left p-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Deskripsi</th>
                          <th className="text-right p-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {transactions.items.map((tr: any) => (
                          <tr key={tr.id} className="hover:bg-slate-50/60 transition-colors">
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
                                tr.type === 'income' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                              )}>
                                {tr.type === 'income' ? 'Masuk' : 'Keluar'}
                              </Badge>
                            </td>
                            <td className="p-5">
                              <p className="text-sm font-bold text-slate-900">{tr.description}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                {tr.category.replace('_', ' ')} • {tr.handler?.full_name || 'System'}
                              </p>
                            </td>
                            <td className="p-5 text-right">
                              <span className={cn(
                                "text-sm font-black",
                                tr.type === 'income' ? "text-emerald-600" : "text-rose-600"
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
