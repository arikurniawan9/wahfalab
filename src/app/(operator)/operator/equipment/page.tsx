// ============================================================================
// OPERATOR EQUIPMENT PAGE - READ ONLY
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
  Wrench,
  DollarSign,
  Eye,
  Package,
  Tag
} from "lucide-react";
import { ChemicalLoader } from "@/components/ui";
import { getAllEquipment } from "@/lib/actions/equipment";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function OperatorEquipmentPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getAllEquipment();
      setData(result);
    } catch (error: any) {
      toast.error("Gagal memuat data alat", {
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
                         (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filterCategory === "all" || item.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const categories = Array.from(new Set(data.map((i: any) => i.category).filter(Boolean)));

  const getPriceColor = (price: number) => {
    if (price >= 10000000) return "text-red-600 font-bold";
    if (price >= 5000000) return "text-orange-600 font-semibold";
    if (price >= 1000000) return "text-amber-600 font-medium";
    return "text-emerald-600";
  };

  const stats = {
    total: data.length,
    available: data.filter((i: any) => i.availability_status === 'available').length,
    in_use: data.filter((i: any) => i.availability_status === 'in_use').length,
    maintenance: data.filter((i: any) => i.availability_status === 'maintenance').length,
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Sewa Alat Laboratorium</h1>
          <p className="text-slate-500 text-sm">Katalog alat laboratorium yang tersedia untuk disewa (Read Only)</p>
        </div>
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 px-4 py-2 rounded-full font-bold text-xs">
          <Eye className="h-3 w-3 mr-2 inline" />
          VIEW ONLY
        </Badge>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Card className="border-none shadow-sm bg-emerald-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white shadow-sm shrink-0">
              <Wrench className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase opacity-60">Total Alat</p>
              <p className="text-xl font-black text-emerald-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-blue-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white shadow-sm shrink-0">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase opacity-60">Tersedia</p>
              <p className="text-xl font-black text-blue-900">{stats.available}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white shadow-sm shrink-0">
              <Tag className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase opacity-60">Dipakai</p>
              <p className="text-xl font-black text-amber-900">{stats.in_use}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white shadow-sm shrink-0">
              <Wrench className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase opacity-60">Maintenance</p>
              <p className="text-xl font-black text-red-900">{stats.maintenance}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-emerald-50/5 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              placeholder="Cari nama alat atau deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl h-10 border-slate-200 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48 h-10 rounded-xl border-slate-200 bg-white shadow-sm font-medium text-xs">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((cat: string) => (
                  <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 font-bold">
              <TableHead className="px-6 w-16 text-center">No</TableHead>
              <TableHead className="px-4">Nama Alat</TableHead>
              <TableHead className="px-4">Kategori</TableHead>
              <TableHead className="px-4">Spesifikasi</TableHead>
              <TableHead className="px-4 text-center">Status</TableHead>
              <TableHead className="px-4 text-right">Harga Sewa</TableHead>
              <TableHead className="px-4 text-center">Satuan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-6"><div className="h-4 w-4 bg-slate-200 animate-pulse rounded" /></TableCell>
                  <TableCell className="px-4"><div className="h-4 w-40 bg-slate-200 animate-pulse rounded" /></TableCell>
                  <TableCell className="px-4"><div className="h-4 w-32 bg-slate-200 animate-pulse rounded" /></TableCell>
                  <TableCell className="px-4"><div className="h-4 w-48 bg-slate-200 animate-pulse rounded" /></TableCell>
                  <TableCell className="px-4 text-center"><div className="h-6 w-20 bg-slate-200 animate-pulse rounded-full mx-auto" /></TableCell>
                  <TableCell className="px-4 text-right"><div className="h-4 w-20 bg-slate-200 animate-pulse rounded ml-auto" /></TableCell>
                  <TableCell className="px-4 text-center"><div className="h-4 w-16 bg-slate-200 animate-pulse rounded mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-slate-400 font-medium">
                  Data tidak ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item: any, idx: number) => (
                <TableRow key={item.id} className="hover:bg-emerald-50/5 transition-colors">
                  <TableCell className="px-6 text-center text-slate-400 text-xs font-bold">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold text-slate-800">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                      {item.category || 'Umum'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4">
                    <span className="text-sm text-slate-600 line-clamp-2">{item.specification || '-'}</span>
                  </TableCell>
                  <TableCell className="px-4 text-center">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] px-2 py-0.5",
                        item.availability_status === 'available' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                        item.availability_status === 'in_use' && "bg-amber-50 text-amber-700 border-amber-200",
                        item.availability_status === 'maintenance' && "bg-red-50 text-red-700 border-red-200"
                      )}
                    >
                      {item.availability_status === 'available' ? 'Tersedia' : 
                       item.availability_status === 'in_use' ? 'Dipakai' : 
                       'Maintenance'}
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
      </div>
    </div>
  );
}
