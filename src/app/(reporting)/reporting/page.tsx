"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  FileText, Plus, Search, Filter, MoreVertical, 
  Eye, Download, Trash2, CheckCircle, Clock, 
  AlertCircle, ChevronLeft, ChevronRight, Beaker,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  getLabReports, 
  deleteLabReport 
} from "@/lib/actions/reporting";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChemicalLoader } from "@/components/ui";

export default function LabReportListPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getLabReports({ page, limit: 10, search });
      setData(result);
    } catch (error) {
      toast.error("Gagal memuat data laporan");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus laporan ini?")) return;
    try {
      const result = await deleteLabReport(id);
      if (result.success) {
        toast.success("Laporan dihapus");
        loadData();
      }
    } catch (error) {
      toast.error("Gagal menghapus");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge className="bg-slate-100 text-slate-600 border-none"><Clock className="w-3 h-3 mr-1" /> Draft</Badge>;
      case 'final': return <Badge className="bg-emerald-100 text-emerald-600 border-none"><CheckCircle className="w-3 h-3 mr-1" /> Final</Badge>;
      default: return <Badge className="bg-blue-100 text-blue-600 border-none">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-900/20">
            <FileText className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-emerald-950 tracking-tighter uppercase">Laporan Hasil Uji</h1>
            <p className="text-slate-500 text-sm font-medium">Manajemen LHU (Laporan Hasil Uji) dan data analisis laboratorium.</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Link href="/reporting/regulations" className="flex-1 md:flex-none">
            <Button variant="outline" className="w-full h-12 px-6 rounded-xl border-slate-200 font-bold uppercase text-[10px] tracking-widest gap-2">
              <BookOpen className="h-4 w-4" /> Baku Mutu
            </Button>
          </Link>
          <Link href="/reporting/new" className="flex-1 md:flex-none">
            <Button className="w-full h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-900/10 gap-2">
              <Plus className="h-4 w-4" /> Buat LHU Manual
            </Button>
          </Link>
          <Link href="/reporting/direct-requests" className="flex-1 md:flex-none">
            <Button variant="outline" className="w-full h-12 px-6 rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50 font-bold uppercase text-[10px] tracking-widest gap-2">
              <AlertCircle className="h-4 w-4" /> Direct LHU
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden group">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-inner">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Laporan</p>
              <p className="text-2xl font-black text-slate-900">{data.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden group">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Laporan Final</p>
              <p className="text-2xl font-black text-slate-900">
                {data.items.filter((i: any) => i.status === 'final').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden group">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 shadow-inner">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Laporan Draft</p>
              <p className="text-2xl font-black text-slate-900">
                {data.items.filter((i: any) => i.status === 'draft').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Cari No. LHU, Klien..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 bg-white border-slate-200 rounded-xl font-medium shadow-inner"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-slate-200 text-slate-400 hover:text-emerald-600 transition-all shadow-sm">
              <Filter className="h-5 w-5" />
            </Button>
            <div className="h-10 w-[1px] bg-slate-200 mx-1 hidden md:block" />
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" size="icon" disabled={page === 1} onClick={() => setPage(page - 1)}
                className="h-10 w-10 rounded-xl hover:bg-emerald-50 text-slate-400"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="text-xs font-black px-4 text-slate-400 uppercase tracking-widest">Hal {page} dari {data.pages}</span>
              <Button 
                variant="ghost" size="icon" disabled={page === data.pages} onClick={() => setPage(page + 1)}
                className="h-10 w-10 rounded-xl hover:bg-emerald-50 text-slate-400"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 flex justify-center"><ChemicalLoader /></div>
          ) : data.items.length === 0 ? (
            <div className="py-32 flex flex-col items-center text-center px-10">
              <div className="h-24 w-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
                <FileText className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Belum Ada Laporan</h3>
              <p className="text-slate-400 text-sm max-w-xs mt-2 font-medium italic">Silakan buat laporan hasil uji pertama Anda secara manual atau dari job order.</p>
              <Link href="/reporting/new" className="mt-8">
                <Button className="h-12 px-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-900/10">Mulai Buat LHU</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">No. LHU & Sampel</th>
                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Klien / Perusahaan</th>
                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal LHU</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.items.map((report: any) => (
                    <tr key={report.id} className="hover:bg-emerald-50/20 transition-all group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                            <Beaker className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-800 uppercase tracking-tight text-sm truncate">{report.report_number}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate max-w-[200px]">{report.sample_type || 'Jenis Sampel -'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-700 text-[13px]">{report.client_name || '-'}</p>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">{report.company_name || 'Personal'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="px-6 py-6 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(report.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl border-emerald-50 shadow-2xl">
                            <Link href={`/reporting/${report.id}`}>
                              <DropdownMenuItem className="rounded-lg p-3 text-[10px] font-bold uppercase tracking-widest gap-3"><Eye className="h-4 w-4 text-emerald-500" /> Lihat Detail</DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem className="rounded-lg p-3 text-[10px] font-bold uppercase tracking-widest gap-3 text-blue-600"><Download className="h-4 w-4" /> Unduh PDF</DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(report.id)}
                              className="rounded-lg p-3 text-[10px] font-bold uppercase tracking-widest gap-3 text-rose-500"
                            >
                              <Trash2 className="h-4 w-4" /> Hapus LHU
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
