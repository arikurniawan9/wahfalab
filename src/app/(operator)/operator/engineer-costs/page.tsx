// ============================================================================
// OPERATOR ENGINEER COSTS PAGE - READ ONLY
// Fitur:
// 1. ✅ View Only (No Create, Edit, Delete)
// 2. ✅ Search & Filter
// 3. ✅ Color-coded pricing
// 4. ✅ Stats cards
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
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
  Search,
  MapPin,
  DollarSign,
  Eye,
  Utensils,
  User
} from "lucide-react";
import { ChemicalLoader } from "@/components/ui";
import { getAllOperationalCatalogs } from "@/lib/actions/operational-catalog";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function OperatorEngineerCostsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getAllOperationalCatalogs();
      const perdiemData = result.filter((item: any) => item.category === 'perdiem');
      setData(perdiemData);
    } catch (error: any) {
      toast.error("Gagal memuat data engineer", {
        description: error?.message || "Silakan refresh halaman"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const filteredData = data.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                         (item.location && item.location.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filterType === "all" || item.perdiem_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredData.length / limit);
  const paginatedData = filteredData.slice((page - 1) * limit, page * limit);

  const getPriceColor = (price: number) => {
    if (price >= 500000) return "text-red-600 font-bold";
    if (price >= 300000) return "text-orange-600 font-semibold";
    if (price >= 150000) return "text-amber-600 font-medium";
    return "text-emerald-600";
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Biaya Engineer</h1>
          <p className="text-slate-500 text-sm">Katalog perdiem engineer (Read Only)</p>
        </div>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-4 py-2 rounded-full font-bold text-xs">
          <Eye className="h-3 w-3 mr-2 inline" />
          VIEW ONLY
        </Badge>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-emerald-50/5 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              placeholder="Cari nama atau lokasi..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 rounded-xl h-10 border-slate-200 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <Select value={filterType} onValueChange={(val) => {
              setFilterType(val);
              setPage(1);
            }}>
              <SelectTrigger className="w-48 h-10 rounded-xl border-slate-200 bg-white shadow-sm font-medium text-xs">
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="harian">Harian</SelectItem>
                <SelectItem value="mingguan">Mingguan</SelectItem>
                <SelectItem value="bulanan">Bulanan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 font-bold">
              <TableHead className="px-6 w-16 text-center">No</TableHead>
              <TableHead className="px-4">Nama Engineer</TableHead>
              <TableHead className="px-4">Lokasi</TableHead>
              <TableHead className="px-4">Tipe</TableHead>
              <TableHead className="px-4 text-right">Harga</TableHead>
              <TableHead className="px-4 text-center">Satuan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center">
                    <ChemicalLoader />
                    <p className="mt-4 text-emerald-800 font-bold uppercase tracking-widest text-[10px] animate-pulse">Memuat Katalog Biaya Engineer...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-slate-400 font-medium">
                  Data tidak ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item: any, idx: number) => (
                <TableRow key={item.id} className="hover:bg-emerald-50/5 transition-colors">
                  <TableCell className="px-6 text-center text-slate-400 text-xs font-bold">
                    {(page - 1) * limit + idx + 1}
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold text-slate-800">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span className="text-sm text-slate-600">{item.location || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 uppercase">
                      {item.perdiem_type || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 text-right">
                    <span className={cn("font-mono", getPriceColor(Number(item.price)))}>
                      Rp {Number(item.price).toLocaleString('id-ID')}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 text-center">
                    <span className="text-xs text-slate-500 uppercase">{item.unit}</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="p-4 border-t flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-500 font-medium">Total {filteredData.length} data</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Tampil:</span>
              <Select value={limit.toString()} onValueChange={(val) => {
                setLimit(parseInt(val));
                setPage(1);
              }}>
                <SelectTrigger className="h-8 w-[70px] bg-white text-xs cursor-pointer">
                  <SelectValue placeholder={limit.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10" className="cursor-pointer">10</SelectItem>
                  <SelectItem value="25" className="cursor-pointer">25</SelectItem>
                  <SelectItem value="50" className="cursor-pointer">50</SelectItem>
                  <SelectItem value="100" className="cursor-pointer">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 rounded-lg cursor-pointer" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center px-4 text-xs font-bold bg-white border border-slate-200 rounded-lg shadow-sm">
              {page} / {totalPages || 1}
            </div>
            <Button variant="outline" size="sm" className="h-8 rounded-lg cursor-pointer" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
