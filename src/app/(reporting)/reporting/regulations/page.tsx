"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Beaker,
  BookOpen,
  FileText,
  FolderOpen,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getRegulations } from "@/lib/actions/reporting";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function RegulationListSkeleton() {
  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 via-emerald-50/10 to-slate-50 min-h-screen space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-32 rounded-xl" />
          <Skeleton className="h-11 w-40 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="border-none shadow-lg rounded-2xl bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-12 w-full sm:w-80 rounded-xl" />
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="rounded-2xl border border-slate-100 bg-white p-5 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <Skeleton className="h-11 w-11 rounded-xl" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function normalizeCategory(value?: string | null) {
  return value?.trim() || "Umum";
}

export default function RegulationListPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getRegulations();
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      toast.error("Gagal memuat data regulasi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return data;

    return data.filter((item) =>
      [item.name, item.category, item.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [data, search]);

  const stats = useMemo(() => {
    const categories = new Set(data.map((item) => normalizeCategory(item.category).toLowerCase()));
    const parameters = data.reduce((total, item) => total + Number(item._count?.parameters || 0), 0);

    return {
      total: data.length,
      categories: categories.size,
      parameters,
    };
  }, [data]);

  if (loading) return <RegulationListSkeleton />;

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 via-emerald-50/10 to-slate-50 min-h-screen space-y-6 pb-24 md:pb-8 animate-in fade-in duration-700">
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-teal-600/5 to-emerald-600/5 rounded-2xl blur-2xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/reporting">
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-2 border-slate-100 bg-white text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 shadow-sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl blur-sm opacity-50" />
              <div className="relative h-12 w-12 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl flex items-center justify-center text-white shadow-xl border-2 border-white/20">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                  Baku Mutu Parameter
                </h1>
                <Badge className="bg-emerald-100 text-emerald-700 border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                  Regulasi
                </Badge>
              </div>
              <p className="text-slate-500 text-xs mt-1 font-medium">
                Pengelolaan standar regulasi dan ambang batas parameter pengujian.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <Link href="/reporting/jobs" className="flex-1 lg:flex-none">
              <Button variant="outline" className="w-full h-11 px-5 rounded-xl border-2 border-slate-100 bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-black uppercase text-[9px] tracking-widest gap-2 shadow-sm">
                <FolderOpen className="h-4 w-4" /> Antrean
              </Button>
            </Link>
            <Link href="/reporting/regulations/new" className="flex-1 lg:flex-none">
              <Button className="w-full h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9px] tracking-widest shadow-lg shadow-emerald-950/20 gap-2">
                <Plus className="h-4 w-4" /> Tambah
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Regulasi", value: stats.total, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Kategori Aktif", value: stats.categories, icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Parameter", value: stats.parameters, icon: Beaker, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat) => (
          <Card key={stat.label} className="border-none shadow-lg shadow-slate-200/50 rounded-2xl bg-white overflow-hidden group hover:translate-y-[-2px] transition-all">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-inner", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em]">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter mt-0.5">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-0.5">
            <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" /> Daftar Standar Baku Mutu
            </CardTitle>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Regulatory Threshold System</p>
          </div>

          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <Input
              placeholder="Cari nama, kategori, atau deskripsi..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-11 h-12 bg-white border-none shadow-inner rounded-xl font-bold text-xs focus-visible:ring-emerald-500 transition-all"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredData.length === 0 ? (
            <div className="py-28 flex flex-col items-center text-center px-6">
              <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-emerald-300" />
              </div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Regulasi Kosong</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm">
                Belum ada standar baku mutu yang sesuai dengan pencarian.
              </p>
              {search && (
                <Button onClick={() => setSearch("")} variant="outline" className="mt-6 h-10 rounded-xl border-slate-200 font-black uppercase text-[9px] tracking-widest px-6">
                  Reset Pencarian
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 p-5 md:p-8">
              {filteredData.map((regulation) => {
                const parameterCount = Number(regulation._count?.parameters || 0);

                return (
                  <Card key={regulation.id} className="border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-900/10 transition-all duration-300 rounded-2xl overflow-hidden group bg-white">
                    <CardHeader className="p-5 bg-slate-50/50 group-hover:bg-emerald-50/40 transition-colors border-b border-slate-50">
                      <div className="flex justify-between items-start gap-3">
                        <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="text-[9px] font-black border-slate-200 uppercase tracking-widest bg-white text-slate-500 max-w-[130px] truncate">
                          {normalizeCategory(regulation.category)}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-tight mt-4 line-clamp-2 min-h-[40px]">
                        {regulation.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>Total Parameter</span>
                        <span className="text-emerald-600 font-black">{parameterCount} Items</span>
                      </div>
                      <div className="h-px w-full bg-slate-100" />
                      <div className="flex gap-2">
                        <Link href={`/reporting/regulations/${regulation.id}`} className="flex-1">
                          <Button variant="outline" className="w-full h-10 rounded-xl text-[9px] font-black uppercase tracking-widest border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-all gap-2">
                            Detail <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Link href={`/reporting/regulations/${regulation.id}/edit`}>
                          <Button className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9px] tracking-widest px-4 shadow-lg shadow-emerald-900/15">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
