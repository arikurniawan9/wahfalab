// ============================================================================
// OPERATOR CATEGORIES PAGE - Read Only
// Operator hanya bisa melihat kategori layanan (tidak bisa edit/delete)
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
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Tag
} from "lucide-react";
import { ChemicalLoader } from "@/components/ui";
import { getAllCategories } from "@/lib/actions/categories";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_EMPTY_TEXT, OPERATOR_TOAST_TEXT } from "@/lib/constants/operator-copy";

export default function OperatorCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const loadData = async () => {
    setLoading(true);
    try {
      const categoriesData = await getAllCategories();
      setCategories(categoriesData);
    } catch (error: any) {
      toast.error(OPERATOR_TOAST_TEXT.loadFailed, {
        description: error?.message || "Silakan coba lagi"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter & Search
  const filteredCategories = categories.filter((category: any) => {
    return search === "" ||
      category.name.toLowerCase().includes(search.toLowerCase());
  });

  const totalPages = Math.ceil(filteredCategories.length / limit);
  const paginatedCategories = filteredCategories.slice((page - 1) * limit, page * limit);

  if (loading) return <ChemicalLoader fullScreen />;

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 bg-slate-50/20">
      <OperatorPageHeader
        icon={Tag}
        title="Kategori Layanan"
        description="Daftar kategori pengujian laboratorium"
        statsLabel="Total Kategori"
        statsValue={categories.length}
        onRefresh={loadData}
        refreshing={loading}
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm p-4 md:p-5 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl border-slate-200 bg-white focus-visible:ring-emerald-500"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSearch("")}
            className="h-11 w-11 rounded-xl border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
        <div className="p-6 border-b bg-slate-50/50">
          <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Tag className="h-4 w-4" />
            Daftar Kategori {filteredCategories.length > 0 && `(${filteredCategories.length})`}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="font-black text-slate-400 h-14 px-4 text-[10px] uppercase tracking-wider">Nama Kategori</TableHead>
                <TableHead className="text-right font-black text-slate-400 h-14 px-4 text-[10px] uppercase tracking-wider">Jumlah Layanan</TableHead>
                <TableHead className="text-center font-black text-slate-400 h-14 px-6 text-[10px] uppercase tracking-wider">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
                        <Tag className="h-10 w-10 text-slate-300" />
                      </div>
                      <div className="text-center">
                        <h4 className="font-semibold text-slate-700 mb-1">{OPERATOR_EMPTY_TEXT.noCategory}</h4>
                        <p className="text-slate-500 text-sm">
                          {search
                            ? "Coba ubah kata kunci pencarian"
                            : OPERATOR_EMPTY_TEXT.noCategoryRegistered}
                        </p>
                        {search && (
                          <Button
                            variant="outline"
                            onClick={() => setSearch("")}
                            className="mt-2 cursor-pointer"
                          >
                            Reset Pencarian
                          </Button>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCategories.map((category: any) => (
                  <TableRow key={category.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-slate-800 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <Tag className="h-4 w-4" />
                        </div>
                        {category.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-4">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {category._count?.services || 0} layanan
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center px-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsDetailOpen(true);
                        }}
                        className="text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-500 font-medium">Total {filteredCategories.length} kategori</p>
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

      {/* Category Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[560px] p-0 border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <DialogHeader className="bg-emerald-700 p-6 text-white border-b border-emerald-600/40">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center">
                <Tag className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none">
                  Detail Kategori
                </DialogTitle>
                <DialogDescription className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Informasi lengkap kategori layanan
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedCategory && (
            <div className="space-y-5 p-6 md:p-8 bg-slate-50/20 max-h-[70vh] overflow-y-auto">
              <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Kategori</h5>
                <p className="text-xl font-black text-slate-800 leading-none">
                  {selectedCategory.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Jumlah Layanan</h5>
                  <p className="text-2xl font-black text-emerald-700 leading-none">
                    {selectedCategory._count?.services || 0}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tanggal Dibuat</h5>
                  <p className="text-sm font-black text-slate-800">
                    {new Date(selectedCategory.created_at).toLocaleDateString("id-ID", {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Services in this category */}
              {selectedCategory.services && selectedCategory.services.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Layanan dalam Kategori Ini ({selectedCategory.services.length})
                  </h5>
                  <div className="space-y-2">
                    {selectedCategory.services.map((service: any) => (
                      <div key={service.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-slate-700 uppercase tracking-tight">
                            {service.name}
                          </p>
                          <p className="text-xs font-black text-emerald-700">
                            Rp {Number(service.price).toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setIsDetailOpen(false)}
              className="w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-emerald-700 hover:bg-emerald-50"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

