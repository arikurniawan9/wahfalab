"use client";

import React, { useState, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  History,
  Search,
  FileSpreadsheet,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  FlaskConical,
  User,
  Package,
  Wrench,
  Building,
  Wallet,
  Calendar
} from "lucide-react";
import { getFinancialRecords, getBankAccounts } from "@/lib/actions/finance";
import { getCompanyProfile } from "@/lib/actions/company";
import { ChemicalLoader, PageSkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const categoryIcons: Record<string, any> = {
  lab_service: FlaskConical,
  salary: User,
  office_supply: Package,
  maintenance: Wrench,
  operational: Building,
  other: Wallet
};

export default function TransactionsHistoryPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<any>("all");
  const [filterBank, setFilterBank] = useState<string>("all");
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [exporting, setExporting] = useState<null | "excel" | "pdf">(null);

  useEffect(() => {
    loadData();
  }, [page, filterType, filterBank]);

  useEffect(() => {
    loadBanks();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const type = filterType === "all" ? undefined : filterType;
      const bankAccountId = filterBank === "all" ? undefined : filterBank;
      const result = await getFinancialRecords(page, 15, type, undefined, bankAccountId);
      setData(result);
    } catch (error) {
      console.error("Load transactions error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadBanks() {
    try {
      const banks = await getBankAccounts();
      setBankAccounts(banks);
    } catch (error) {
      console.error("Load banks error:", error);
    }
  }

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

  const getFilteredExportItems = async () => {
    const type = filterType === "all" ? undefined : filterType;
    const bankAccountId = filterBank === "all" ? undefined : filterBank;
    const result = await getFinancialRecords(1, 5000, type, undefined, bankAccountId);

    if (result?.error) {
      throw new Error(result.error);
    }

    return (result?.items || []) as Array<any>;
  };

  const getExportMeta = () => {
    const bankName = filterBank === "all"
      ? "semua-rekening"
      : (bankAccounts.find((bank) => bank.id === filterBank)?.account_number || "rekening");
    const typeName = filterType === "all" ? "semua" : filterType;
    const stamp = new Date().toISOString().slice(0, 10);

    return {
      typeLabel: filterType === "all" ? "Semua" : filterType === "income" ? "Pemasukan" : "Pengeluaran",
      bankLabel: filterBank === "all"
        ? "Semua Rekening"
        : `${bankAccounts.find((bank) => bank.id === filterBank)?.bank_name || "Rekening"} - ${bankAccounts.find((bank) => bank.id === filterBank)?.account_number || "-"}`,
      filenameBase: `riwayat-transaksi-${typeName}-${bankName}-${stamp}`
    };
  };

  const downloadExcel = async () => {
    setExporting("excel");
    try {
      const [XLSX, items] = await Promise.all([
        import("xlsx"),
        getFilteredExportItems()
      ]);

      if (items.length === 0) {
        toast.info("Tidak ada data transaksi untuk diexport");
        return;
      }

      const rows = items.map((tr: any) => ({
        Tanggal: new Date(tr.transaction_date).toISOString(),
        Jenis: tr.type === "income" ? "Pemasukan" : "Pengeluaran",
        Kategori: String(tr.category || "").replace(/_/g, " "),
        Deskripsi: tr.description,
        Jumlah: Number(tr.amount || 0),
        Rekening: tr.bank_account ? `${tr.bank_account.bank_name} - ${tr.bank_account.account_number}` : "-",
        Handler: tr.handler?.full_name || "System"
      }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Riwayat");
      XLSX.writeFile(workbook, `${getExportMeta().filenameBase}.xlsx`);
      toast.success("Export Excel berhasil");
    } catch (error: any) {
      console.error("Export excel failed", error);
      toast.error(error?.message || "Gagal export Excel");
    } finally {
      setExporting(null);
    }
  };

  const downloadPdf = async () => {
    setExporting("pdf");
    try {
      const [items, company, TransactionLedgerPDF] = await Promise.all([
        getFilteredExportItems(),
        getCompanyProfile(),
        import("@/components/pdf/TransactionLedgerPDF")
      ]);

      if (items.length === 0) {
        toast.info("Tidak ada data transaksi untuk diexport");
        return;
      }

      const totalIncome = items
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const totalExpense = items
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const meta = getExportMeta();

      const blob = await pdf(
        <TransactionLedgerPDF.TransactionLedgerPDF
          company={company}
          filters={{
            type: meta.typeLabel,
            bank: meta.bankLabel,
            generatedAt: new Date().toISOString()
          }}
          summary={{
            totalIncome,
            totalExpense,
            netMovement: totalIncome - totalExpense,
            transactionCount: items.length
          }}
          transactions={items}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${meta.filenameBase}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Export PDF berhasil");
    } catch (error: any) {
      console.error("Export pdf failed", error);
      toast.error(error?.message || "Gagal export PDF");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-emerald-950 font-[family-name:var(--font-montserrat)] uppercase tracking-tight flex items-center gap-3">
            <div className="h-10 w-2 bg-emerald-600 rounded-full" />
            Riwayat Transaksi
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1 ml-5">
            Buku besar digital untuk semua arus kas WahfaLab
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={downloadExcel}
            disabled={exporting !== null}
            className="rounded-xl border-emerald-200 text-emerald-600 font-bold text-xs uppercase tracking-widest h-12 px-6"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {exporting === "excel" ? "Exporting..." : "Download Excel"}
          </Button>
          <Button
            variant="outline"
            onClick={downloadPdf}
            disabled={exporting !== null}
            className="rounded-xl border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-widest h-12 px-6"
          >
            <FileText className="mr-2 h-4 w-4" />
            {exporting === "pdf" ? "Exporting..." : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Control Panel */}
      <Card className="border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari deskripsi, invoice, atau kategori..." 
                className="pl-10 h-12 rounded-2xl border-slate-100 bg-slate-50 focus:bg-white transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl">
              <Button 
                variant={filterType === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => { setFilterType('all'); setPage(1); }}
                className={cn("rounded-xl px-4 text-[10px] font-black uppercase tracking-widest h-10", filterType === 'all' ? "bg-white text-emerald-950 shadow-sm" : "text-slate-500")}
              >
                Semua
              </Button>
              <Button 
                variant={filterType === 'income' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => { setFilterType('income'); setPage(1); }}
                className={cn("rounded-xl px-4 text-[10px] font-black uppercase tracking-widest h-10", filterType === 'income' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500")}
              >
                Pemasukan
              </Button>
              <Button 
                variant={filterType === 'expense' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => { setFilterType('expense'); setPage(1); }}
                className={cn("rounded-xl px-4 text-[10px] font-black uppercase tracking-widest h-10", filterType === 'expense' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500")}
              >
                Pengeluaran
              </Button>
            </div>
              <div className="min-w-[220px]">
                <Select value={filterBank} onValueChange={(v) => { setFilterBank(v); setPage(1); }}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white">
                  <SelectValue placeholder="Filter Bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Bank</SelectItem>
                  {bankAccounts.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      {bank.bank_name} - {bank.account_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Table */}
      <Card className="border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-40 flex flex-col items-center justify-center space-y-8 bg-slate-50/20">
              <ChemicalLoader />
              <div className="flex flex-col items-center gap-2">
                <p className="text-[12px] font-black text-emerald-950/40 uppercase tracking-[0.6em] animate-pulse">Scanning Master Ledger</p>
                <div className="h-1 w-48 bg-emerald-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 animate-[loading_1.5s_infinite]" />
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Transaksi</th>
                    <th className="text-left p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Kategori</th>
                    <th className="text-left p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Deskripsi</th>
                    <th className="text-left p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Waktu</th>
                    <th className="text-right p-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-slate-400 italic font-medium">Belum ada riwayat transaksi</td>
                    </tr>
                  ) : (
                    data.items.map((tr: any) => {
                      const Icon = categoryIcons[tr.category] || Wallet;
                      return (
                        <tr key={tr.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="p-6">
                            <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                              tr.type === 'income' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                            )}>
                              {tr.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                <Icon className="h-4 w-4 text-slate-500" />
                              </div>
                              <Badge className={cn(
                                "text-[9px] font-black uppercase px-2 py-0.5 border-none",
                                tr.type === 'income' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                              )}>
                                {tr.category.replace('_', ' ')}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-6">
                            <p className="text-sm font-bold text-slate-900 line-clamp-1">{tr.description}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                              Handler: {tr.handler?.full_name || 'System Auto-Log'}
                            </p>
                            {tr.bank_account && (
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                                <Building className="h-3 w-3 text-emerald-500" />
                                Rekening: {tr.bank_account.bank_name} - {tr.bank_account.account_number}
                              </p>
                            )}
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-2 text-slate-500">
                              <Calendar className="h-3 w-3" />
                              <span className="text-xs font-bold">{formatDate(tr.transaction_date)}</span>
                            </div>
                          </td>
                          <td className="p-6 text-right">
                            <span className={cn(
                              "text-sm font-black",
                              tr.type === 'income' ? "text-emerald-600" : "text-rose-600"
                            )}>
                              {tr.type === 'income' ? '+' : '-'} {formatCurrency(Number(tr.amount))}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="p-6 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl font-bold text-xs"
              >
                Sebelumnya
              </Button>
              <span className="text-xs font-black uppercase text-slate-400 tracking-widest">
                Halaman {page} Dari {data.pages}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="rounded-xl font-bold text-xs"
              >
                Berikutnya
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-center gap-2 text-slate-300 py-4">
        <History className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-[0.5em]"> WahfaLab Master Ledger Protection </span>
      </div>
    </div>
  );
}
