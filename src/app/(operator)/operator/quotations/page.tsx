// ============================================================================
// OPERATOR QUOTATIONS PAGE - v1.0
// Fitur:
// 1. ✅ List Penawaran (Read Only)
// 2. ✅ Update Status (Accepted/Rejected)
// 3. ✅ Stats Bar Ringkas
// 4. ❌ No Create, No Delete, No Duplicate (Restricted to Admin)
// ============================================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  MoreVertical,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  DollarSign,
  Clock,
  Download
} from "lucide-react";
import { ChemicalLoader } from "@/components/ui";
import {
  getQuotations,
  updateQuotationStatus
} from "@/lib/actions/quotation";
import { downloadQuotationPDF } from "@/lib/generate-quotation-pdf";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

// Stat Card Component
function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    red: "bg-red-50 text-red-600 border-red-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  return (
    <Card className={cn("border-none shadow-sm", colors[color])}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={cn("p-2 rounded-xl bg-white shadow-sm shrink-0")}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase opacity-60 tracking-wider truncate">{title}</p>
          <p className="text-lg font-black tracking-tight leading-none">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const statusOptions = [
  { value: "all", label: "Semua Status", color: "bg-slate-100 text-slate-700" },
  { value: "draft", label: "Draft", color: "bg-slate-100 text-slate-700 border-slate-200", icon: FileText },
  { value: "accepted", label: "Diterima", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
  { value: "rejected", label: "Ditolak", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  { value: "paid", label: "Dibayar", color: "bg-purple-100 text-purple-700 border-purple-200", icon: DollarSign }
];

export default function OperatorQuotationPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false); // Start with false
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getQuotations({ page, limit, search, status: filterStatus });
      setData(res);
    } catch (error) {
      toast.error("Gagal memuat data penawaran");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filterStatus]);

  useEffect(() => {
    // Load data after component mounts (non-blocking)
    const timer = setTimeout(() => {
      loadData();
    }, 100); // Small delay to let UI render first
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const res = await updateQuotationStatus(id, newStatus);
      if (res.success) {
        toast.success(`Penawaran berhasil di-${newStatus}`);
        loadData();
      }
    } catch (error: any) {
      toast.error("Gagal update status");
    }
  };

  const handlePrintPDF = async (id: string) => {
    try {
      await downloadQuotationPDF(id);
    } catch (error) {
      toast.error("Gagal mencetak PDF");
    }
  };

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.color || "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
      case 'sent': return 'DRAFT';
      case 'accepted': return 'DITERIMA';
      case 'rejected': return 'DITOLAK';
      case 'paid': return 'DIBAYAR';
      default: return status.toUpperCase();
    }
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Penawaran Harga</h1>
          <p className="text-slate-500 text-sm">Monitor dan proses persetujuan penawaran klien.</p>
        </div>
        <Link href="/operator/quotations/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200">
            <FileText className="mr-2 h-4 w-4" />
            Buat Penawaran
          </Button>
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <StatCard title="Total" value={data.total} icon={FileText} color="emerald" />
        <StatCard title="Draft" value={data.items.filter((i: any) => i.status === 'draft' || i.status === 'sent').length} icon={Clock} color="amber" />
        <StatCard title="Diterima" value={data.items.filter((i: any) => i.status === 'accepted').length} icon={CheckCircle} color="blue" />
        <StatCard title="Ditolak" value={data.items.filter((i: any) => i.status === 'rejected').length} icon={XCircle} color="red" />
        <StatCard title="Lunas" value={data.items.filter((i: any) => i.status === 'paid').length} icon={DollarSign} color="purple" />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-emerald-50/5 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              placeholder="Cari nomor penawaran atau klien..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 rounded-xl h-10 border-slate-200 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 h-10 rounded-xl border-slate-200 bg-white shadow-sm font-medium text-xs">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 font-bold">
              <TableHead className="px-6 w-16 text-center">No</TableHead>
              <TableHead className="px-4">No. Penawaran</TableHead>
              <TableHead className="px-4">Klien</TableHead>
              <TableHead className="px-4 text-right">Total Tagihan</TableHead>
              <TableHead className="px-4 text-center">Status</TableHead>
              <TableHead className="px-6 text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 && !loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-400 font-medium">Data tidak ditemukan.</TableCell></TableRow>
            ) : loading ? (
              // Skeleton loading
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-6"><div className="h-4 w-4 bg-slate-200 animate-pulse rounded" /></TableCell>
                  <TableCell className="px-4"><div className="h-4 w-32 bg-slate-200 animate-pulse rounded" /></TableCell>
                  <TableCell className="px-4"><div className="h-4 w-40 bg-slate-200 animate-pulse rounded" /></TableCell>
                  <TableCell className="px-4 text-right"><div className="h-4 w-24 bg-slate-200 animate-pulse rounded ml-auto" /></TableCell>
                  <TableCell className="px-4 text-center"><div className="h-6 w-20 bg-slate-200 animate-pulse rounded-full mx-auto" /></TableCell>
                  <TableCell className="px-6 text-center"><div className="h-9 w-20 bg-slate-200 animate-pulse rounded-xl mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              data.items.map((item: any, idx: number) => (
                <TableRow key={item.id} className="hover:bg-emerald-50/5 transition-colors">
                  <TableCell className="px-6 text-center text-slate-400 text-xs font-bold">{(page - 1) * limit + idx + 1}</TableCell>
                  <TableCell className="font-bold text-emerald-900 px-4">{item.quotation_number}</TableCell>
                  <TableCell className="px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-sm">
                        {item.profile.full_name || item.profile.company_name || 'Unknown'}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">
                        {item.profile.company_name && item.profile.full_name 
                          ? item.profile.company_name 
                          : item.profile.full_name 
                          ? "Personal" 
                          : "Unknown"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-700 px-4">Rp {Number(item.total_amount).toLocaleString("id-ID")}</TableCell>
                  <TableCell className="px-4 text-center">
                    <Badge variant="outline" className={cn("capitalize text-[10px] px-3 py-1 rounded-full", getStatusColor(item.status))}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center px-6">
                    <div className="flex justify-center gap-2">
                      <Link href={`/operator/quotations/${item.id}`}>
                        <Button variant="ghost" size="icon" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-9 w-9 rounded-xl transition-all active:scale-90" title="Lihat Detail">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handlePrintPDF(item.id)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-9 w-9 rounded-xl transition-all active:scale-90" 
                        title="Cetak PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {(item.status === 'draft' || item.status === 'sent') && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all active:scale-90">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-2xl shadow-xl border-slate-100 p-2">
                            <DropdownMenuItem onClick={() => handleStatusUpdate(item.id, 'accepted')} className="rounded-xl cursor-pointer py-2.5 focus:bg-emerald-50 focus:text-emerald-700">
                              <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" /> Tandai Diterima
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(item.id, 'rejected')} className="rounded-xl cursor-pointer py-2.5 focus:bg-red-50 focus:text-red-700">
                              <XCircle className="mr-2 h-4 w-4 text-red-500" /> Tandai Ditolak
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="p-4 border-t flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-500 font-medium">Total {data.total} penawaran</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Tampil:</span>
              <Select value={limit.toString()} onValueChange={(val) => { setLimit(parseInt(val)); setPage(1); }}>
                <SelectTrigger className="h-9 w-[75px] bg-white text-xs cursor-pointer rounded-xl border-slate-200"><SelectValue placeholder={limit.toString()} /></SelectTrigger>
                <SelectContent className="rounded-xl"><SelectItem value="10">10</SelectItem><SelectItem value="30">30</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9 w-9 rounded-xl cursor-pointer border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-95" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="flex items-center px-4 text-xs font-bold bg-white border border-slate-200 rounded-xl shadow-sm text-slate-600">{page} / {data.pages}</div>
            <Button variant="outline" size="sm" className="h-9 w-9 rounded-xl cursor-pointer border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-95" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}