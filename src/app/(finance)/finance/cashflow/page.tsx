"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Banknote,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Wallet,
  ArrowRightLeft
} from "lucide-react";
import { getFinancialSummary, getMonthlyTrend } from "@/lib/actions/finance";
import { ChemicalLoader, PageSkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function CashflowPage() {
  const [summary, setSummary] = useState<any>({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [trend, setTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [sum, monthly] = await Promise.all([
          getFinancialSummary(),
          getMonthlyTrend(12) // Ambil data 1 tahun
        ]);
        setSummary(sum);
        setTrend(monthly);
      } catch (error) {
        console.error("Load cashflow error:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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
        <p className="text-[10px] font-black text-emerald-900/40 uppercase tracking-[0.4em] animate-pulse">Menghitung Saldo Kas</p>
      </div>
    </div>
  );

  const profitMargin = summary.totalIncome > 0 
    ? ((summary.totalIncome - summary.totalExpense) / summary.totalIncome * 100).toFixed(1)
    : "0";

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-emerald-950 font-[family-name:var(--font-montserrat)] uppercase tracking-tight flex items-center gap-3">
            <div className="h-10 w-2 bg-emerald-600 rounded-full" />
            Arus Kas & Saldo
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1 ml-5">
            Analisis profitabilitas dan posisi kas laboratorium
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-widest">
            <Filter className="mr-2 h-4 w-4" /> Filter Periode
          </Button>
          <Button variant="outline" className="rounded-xl border-emerald-200 text-emerald-600 font-bold text-xs uppercase tracking-widest">
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Hero Balance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-2 bg-white border-slate-200 shadow-xl rounded-[32px] overflow-hidden">
          <CardContent className="p-10 flex flex-col justify-center h-full space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Saldo Saat Ini</span>
            </div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter">
              {formatCurrency(summary.balance)}
            </h2>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-700 border-none px-3 py-1 text-[10px] font-black uppercase">
                Safe Liquidity
              </Badge>
              <span className="text-xs text-slate-400 font-medium italic">Data sinkron dengan invoice lab</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-100 shadow-sm rounded-[32px]">
          <CardContent className="p-8 flex flex-col justify-center h-full space-y-4">
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Profit Margin</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-emerald-900">{profitMargin}%</span>
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-xs text-emerald-700/60 font-medium">Efisiensi operasional sistem</p>
            <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full" style={{ width: `${Math.max(0, parseFloat(profitMargin))}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50 border-rose-100 shadow-sm rounded-[32px]">
          <CardContent className="p-8 flex flex-col justify-center h-full space-y-4">
            <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Rasio Pengeluaran</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-rose-900">
                {summary.totalIncome > 0 ? (summary.totalExpense / summary.totalIncome * 100).toFixed(0) : 0}%
              </span>
              <TrendingDown className="h-5 w-5 text-rose-600" />
            </div>
            <p className="text-xs text-rose-700/60 font-medium">Terhadap total pemasukan</p>
            <div className="w-full bg-rose-200 h-2 rounded-full overflow-hidden">
              <div className="bg-rose-600 h-full" style={{ width: `${Math.min(100, (summary.totalIncome > 0 ? summary.totalExpense / summary.totalIncome * 100 : 0))}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Chart Area */}
      <Card className="border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
        <CardHeader className="p-8 bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-3">
            <PieChart className="h-5 w-5 text-emerald-600" />
            Performa Keuangan Bulanan
          </CardTitle>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase text-slate-500">Pemasukan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-rose-400" />
              <span className="text-[10px] font-black uppercase text-slate-500">Pengeluaran</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10">
          <div className="h-80 flex items-end justify-between gap-2 md:gap-4 relative pt-10">
            {/* Legend for Axis */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] font-black text-slate-300 pointer-events-none">
              <span>MAKS</span>
              <span>50%</span>
              <span>0</span>
            </div>
            
            {trend.map((t, idx) => {
              const maxVal = Math.max(...trend.map(item => Math.max(item.income, item.expense)));
              const incHeight = (t.income / maxVal) * 100;
              const expHeight = (t.expense / maxVal) * 100;
              const isPositive = t.income >= t.expense;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-4 group">
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    <div 
                      className="w-3 md:w-6 bg-emerald-500/80 rounded-t-md hover:bg-emerald-600 transition-all cursor-help"
                      style={{ height: `${incHeight}%` }}
                      title={`Pemasukan: ${formatCurrency(t.income)}`}
                    />
                    <div 
                      className="w-3 md:w-6 bg-rose-400/80 rounded-t-md hover:bg-rose-500 transition-all cursor-help"
                      style={{ height: `${expHeight}%` }}
                      title={`Pengeluaran: ${formatCurrency(t.expense)}`}
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter truncate w-12 text-center">
                      {t.month}
                    </span>
                    <Badge className={cn(
                      "text-[8px] font-black border-none px-1.5",
                      isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {isPositive ? '+' : '-'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Audit Log / Simple Table Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-slate-200 rounded-[32px] p-8 space-y-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-emerald-900 flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-emerald-600" /> Sumber Pemasukan Terbesar
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl">
              <span className="text-xs font-bold text-emerald-800">Layanan Laboratorium</span>
              <span className="text-sm font-black text-emerald-700">Utama</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
              <span className="text-xs font-bold text-slate-600">Sewa Peralatan Lab</span>
              <span className="text-sm font-black text-slate-400">Sekunder</span>
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 rounded-[32px] p-8 space-y-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-rose-900 flex items-center gap-2">
            <ArrowDownRight className="h-4 w-4 text-rose-600" /> Alokasi Pengeluaran Terbesar
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-rose-50 rounded-2xl">
              <span className="text-xs font-bold text-rose-800">Gaji Karyawan (Payroll)</span>
              <span className="text-sm font-black text-rose-700">Tinggi</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
              <span className="text-xs font-bold text-slate-600">Pemeliharaan Alat</span>
              <span className="text-sm font-black text-slate-400">Sedang</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-center gap-2 text-slate-400 py-4">
        <ArrowRightLeft className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">WahfaLab Finance Analysis System v1.0</span>
      </div>
    </div>
  );
}
