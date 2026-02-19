// ============================================================================
// OPTIMIZED CATEGORIES PAGE - v2.0
// Fitur Optimasi:
// 1. ✅ Loading Modal saat menyimpan
// 2. ✅ AlertDialog untuk konfirmasi hapus
// 3. ✅ Export/Import CSV
// 4. ✅ Empty state yang lebih menarik
// 5. ✅ UX improvements
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Search, Tag, Download, Upload } from "lucide-react";
import { ChemicalLoader } from "@/components/ui";
import { getCategories, createOrUpdateCategory, deleteCategory, deleteManyCategories } from "@/lib/actions/categories";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export default function CategoriesPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<string>("");

  const { register, handleSubmit, reset, setValue } = useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getCategories(page, limit, search);
      setData(result);
      setSelectedIds([]);
    } catch (error: any) {
      toast.error("Gagal memuat data kategori", {
        description: error?.message || "Silakan refresh halaman"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, limit, search]);

  const onSubmit = async (formData: any) => {
    setShowSubmitModal(true);
    setSubmitting(true);
    try {
      await createOrUpdateCategory(formData, editingItem?.id);
      setIsDialogOpen(false);
      reset();
      setEditingItem(null);
      loadData();
      toast.success(editingItem ? "Kategori diperbarui" : "Kategori baru ditambahkan", {
        description: `${formData.name} berhasil ${editingItem ? 'diperbarui' : 'ditambahkan'}`
      });
    } catch (error: any) {
      toast.error("Gagal menyimpan data kategori", {
        description: error?.message || "Silakan coba lagi"
      });
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setValue("name", item.name);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteItemId(id);
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    try {
      await deleteCategory(deleteItemId);
      loadData();
      toast.success("Kategori dihapus", {
        description: "Data telah dihapus permanen"
      });
      setDeleteItemId(null);
    } catch (error: any) {
      toast.error("Gagal menghapus kategori", {
        description: error?.message || "Silakan coba lagi"
      });
    }
  };

  const handleBulkDelete = () => {
    setDeleteItemId("bulk");
  };

  const confirmBulkDelete = async () => {
    try {
      await deleteManyCategories(selectedIds);
      loadData();
      toast.success(`${selectedIds.length} kategori berhasil dihapus`);
      setDeleteItemId(null);
    } catch (error: any) {
      toast.error("Gagal menghapus kategori", {
        description: error?.message || "Silakan coba lagi"
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.items.map((i: any) => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Export CSV
  const handleExport = () => {
    const headers = ["Nama Kategori", "Jumlah Layanan", "Tanggal Dibuat"];
    const csvData = data.items.map((item: any) => [
      item.name,
      item._count.services,
      new Date(item.created_at).toISOString().split('T')[0]
    ]);
    
    const csv = [
      headers.join(","),
      ...csvData.map((row: string[]) => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `categories-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Data berhasil diexport", {
      description: "File CSV telah diunduh"
    });
  };

  // Import CSV
  const handleImport = async () => {
    try {
      const lines = importData.trim().split("\n");
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
        await createOrUpdateCategory({ name: values[0] });
      }
      
      toast.success("Import berhasil", {
        description: `${lines.length - 1} kategori berhasil diimport`
      });
      setIsImportDialogOpen(false);
      setImportData("");
      loadData();
    } catch (error: any) {
      toast.error("Gagal import data", {
        description: error?.message || "Format CSV tidak valid"
      });
    }
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header dengan Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Kategori Layanan</h1>
          <p className="text-slate-500 text-sm">Kelola pengelompokan layanan laboratorium.</p>
        </div>

        <div className="flex gap-2 flex-wrap w-full md:w-auto">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} className="animate-in fade-in zoom-in duration-200 cursor-pointer">
              <Trash2 className="mr-2 h-4 w-4" /> Hapus ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleExport} className="cursor-pointer">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)} className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button onClick={() => {
            reset();
            setEditingItem(null);
            setIsDialogOpen(true);
          }} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 cursor-pointer flex-1 md:flex-none">
            <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-emerald-50/10 flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              placeholder="Cari kategori..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 focus-visible:ring-emerald-500 rounded-xl"
            />
          </div>
          <div className="text-sm text-slate-500">
            {data.items.length} dari {data.total} kategori
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="w-12 px-6">
                  <Checkbox
                    checked={data.items.length > 0 && selectedIds.length === data.items.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Nama Kategori</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Jumlah Layanan</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Tanggal Dibuat</TableHead>
                <TableHead className="text-center font-bold text-emerald-900 px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <div className="flex justify-center">
                      <ChemicalLoader />
                    </div>
                    <p className="mt-4 text-sm text-slate-500">Memuat data...</p>
                  </TableCell>
                </TableRow>
              ) : data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
                        <Tag className="h-10 w-10 text-emerald-300" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-slate-700">Belum ada kategori</p>
                        <p className="text-sm text-slate-500 mt-1">Mulai dengan menambahkan kategori layanan pertama Anda</p>
                      </div>
                      <Button
                        onClick={() => setIsDialogOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-emerald-50/10 transition-colors">
                    <TableCell className="px-6">
                      <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <Tag className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-slate-800">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                          {item._count.services}
                        </div>
                        <span className="text-xs text-slate-500">layanan</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm px-4">
                      {new Date(item.created_at).toLocaleDateString("id-ID", {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-center px-6">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 cursor-pointer" onClick={() => handleEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 cursor-pointer" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-10 text-center flex flex-col items-center justify-center">
              <div className="flex justify-center mb-4">
                <ChemicalLoader />
              </div>
            </div>
          ) : data.items.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                <Tag className="h-8 w-8 text-emerald-300" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-700">Belum ada kategori</p>
                <p className="text-xs text-slate-500 mt-1">Mulai dengan menambahkan kategori</p>
              </div>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
              </Button>
            </div>
          ) : (
            data.items.map((item: any) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={cn("p-4 space-y-3 transition-colors", isSelected ? 'bg-emerald-50/50' : 'bg-white active:bg-slate-50')}
                  onClick={() => toggleSelect(item.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(item.id)}
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                          <Tag className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{item.name}</h4>
                          <p className="text-[10px] text-slate-400">
                            Dibuat: {new Date(item.created_at).toLocaleDateString("id-ID")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                          {item._count.services}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Layanan</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-1 pt-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 cursor-pointer" onClick={() => handleEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 cursor-pointer" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-500 font-medium">Total {data.total} kategori</p>
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
                  <SelectItem value="30" className="cursor-pointer">30</SelectItem>
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
              {page} / {data.pages}
            </div>
            <Button variant="outline" size="sm" className="h-8 rounded-lg cursor-pointer" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          reset();
          setEditingItem(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-emerald-900 flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {editingItem ? "Edit Kategori" : "Tambah Kategori Baru"}
            </DialogTitle>
            <DialogDescription>
              Masukkan nama kategori layanan di bawah ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Nama Kategori</label>
              <Input {...register("name")} placeholder="Contoh: Udara Ambien, Air Limbah" required className="focus-visible:ring-emerald-500" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 cursor-pointer" disabled={submitting}>
                {editingItem ? "Simpan Perubahan" : "Buat Kategori"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteItemId !== null} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Konfirmasi Hapus
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="pt-4 text-sm text-muted-foreground">
                {deleteItemId === "bulk" ? (
                  <>
                    <p>Apakah Anda yakin ingin menghapus <strong className="text-slate-900">{selectedIds.length} kategori</strong> terpilih?</p>
                    <p className="mt-2 text-sm text-amber-600 font-medium">⚠️ Tindakan ini tidak dapat dibatalkan.</p>
                  </>
                ) : (
                  <>
                    <p>Apakah Anda yakin ingin menghapus kategori ini?</p>
                    <p className="mt-2 text-sm text-amber-600 font-medium">⚠️ Data akan dihapus permanen.</p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteItemId === "bulk" ? confirmBulkDelete : confirmDelete}
              className="bg-red-600 hover:bg-red-700 cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data CSV
            </DialogTitle>
            <DialogDescription>
              Paste data CSV dengan format: Nama Kategori
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg text-xs font-mono">
              <p className="font-semibold mb-1">Format:</p>
              <p>Nama Kategori</p>
              <p className="text-slate-500">Udara Ambien</p>
              <p className="text-slate-500">Air Limbah</p>
              <p className="text-slate-500">Makanan Minuman</p>
            </div>
            <textarea
              className="w-full h-40 p-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Paste CSV data here..."
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={handleImport}
              className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
            >
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Loading Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-200">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-lg font-semibold text-slate-800">Menyimpan Data...</p>
            <p className="text-sm text-slate-500">Mohon tunggu sebentar</p>
          </div>
        </div>
      )}
    </div>
  );
}
