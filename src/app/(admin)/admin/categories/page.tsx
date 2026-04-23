"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Tag,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Save,
  Info,
  Layers,
  FlaskConical,
  X,
  FileText
} from "lucide-react";
import { ChemicalLoader, LoadingOverlay, LoadingButton, TableSkeleton, EmptyState } from "@/components/ui";
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  deleteManyCategories 
} from "@/lib/actions/categories";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function CategoriesPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: ""
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getCategories(page, limit, search);
      setData(result);
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

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name
    });
    
    // Scroll to form on mobile
    if (window.innerWidth < 1024) {
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleReset = () => {
    setEditingItem(null);
    setFormData({
      name: ""
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nama kategori wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const result = editingItem 
        ? await updateCategory(editingItem.id, formData)
        : await createCategory(formData);
      
      if (result.success) {
        handleReset();
        loadData();
        toast.success(editingItem ? "Kategori diperbarui" : "Kategori ditambahkan");
      } else {
        toast.error(result.error || "Gagal menyimpan data");
      }
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan sistem");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    const headers = ["Name", "Services Count", "Created At"];
    const csvData = (data?.items || []).map((item: any) => [
      item.name,
      item._count?.services || 0,
      new Date(item.created_at).toISOString()
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row: (string | number)[]) => row.map((cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `wahfalab-categories-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Data kategori berhasil diekspor");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubmitting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split("\n").filter(r => r.trim() !== "");
        if (rows.length < 2) {
          toast.error("File CSV kosong atau tidak valid");
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        // Simple sequential import for categories
        for (let i = 1; i < rows.length; i++) {
          const name = rows[i].split(",")[0].trim().replace(/^"|"$/g, "");
          if (name) {
            const res = await createCategory({ name });
            if (res.success) successCount++; else errorCount++;
          }
        }

        toast.success(`Impor Selesai: ${successCount} berhasil, ${errorCount} gagal.`);
        loadData();
      } catch (error: any) {
        toast.error("Format file tidak valid: " + error.message);
      } finally {
        setSubmitting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleDelete = (id: string) => {
    setDeleteItemId(id);
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    try {
      const result = await deleteCategory(deleteItemId);
      if (result.success) {
        loadData();
        toast.success("Kategori berhasil dihapus");
      } else {
        toast.error(result.error || "Gagal menghapus kategori");
      }
      setDeleteItemId(null);
    } catch (error: any) {
      toast.error("Gagal menghapus kategori");
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-10 pb-24 md:pb-10">
      {/* Compact Header Section with Contrast Green Theme */}
      <div className="mb-6 overflow-hidden rounded-3xl bg-emerald-900 shadow-xl border border-emerald-700/50">
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-500 p-4 md:p-5 text-white relative overflow-hidden">
          {/* Light Green Decorative Glows */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-[60px]" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                <Layers className="h-5 w-5 text-emerald-200" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-black tracking-tight text-white leading-none">
                  Manajemen Kategori
                </h1>
                <p className="text-emerald-100/60 text-[10px] md:text-xs font-medium mt-1">
                  Pengelompokan jenis layanan laboratorium WahfaLab.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="hidden lg:block text-right border-r border-white/10 pr-4">
                <p className="text-emerald-300 text-[8px] font-bold uppercase tracking-widest mb-0.5">Total Data</p>
                <p className="text-lg font-black text-white leading-none">{data.total} <span className="text-emerald-300 text-[10px] font-bold uppercase tracking-normal">Kategori</span></p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white/10 border-white/20 hover:bg-white/20 text-white rounded-xl h-9 px-4 backdrop-blur-md transition-all text-xs font-bold"
                onClick={() => loadData()}
              >
                <RotateCcw className={cn("h-3.5 w-3.5 mr-2", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: FORM */}
        <div ref={formRef} className="lg:col-span-1 space-y-6">
          <Card className="rounded-3xl border-none shadow-xl shadow-emerald-900/5 overflow-hidden sticky top-24">
            <CardContent className="p-6">
              <form onSubmit={onSubmit} className="space-y-6">
                {/* Mode Indicator */}
                <div className={cn(
                  "flex items-center gap-2 p-3 rounded-2xl text-xs font-bold uppercase tracking-wider mb-2",
                  editingItem ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                )}>
                  {editingItem ? <RotateCcw className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingItem ? "Perbarui Kategori" : "Tambah Kategori Baru"}
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nama Kategori *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Misal: Udara Ambien, Air Bersih"
                    className="h-12 rounded-xl focus:ring-emerald-500 border-slate-200 shadow-sm"
                    required
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  {editingItem && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleReset} 
                      className="h-12 rounded-xl flex-1 font-bold text-slate-500 border-slate-200 hover:bg-slate-50 transition-all"
                    >
                      Batal
                    </Button>
                  )}
                  <LoadingButton 
                    type="submit" 
                    className={cn(
                      "h-12 rounded-xl font-bold shadow-lg flex-[2] transition-all duration-300",
                      editingItem 
                        ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" 
                        : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                    )}
                    loading={submitting}
                    loadingText={editingItem ? "Memperbarui..." : "Menyimpan..."}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingItem ? "Update Kategori" : "Simpan Kategori"}
                  </LoadingButton>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: TABLE */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[2rem] border-none shadow-xl shadow-emerald-900/5 overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-lg font-bold text-slate-800">Daftar Kategori Layanan</CardTitle>
                <CardDescription className="text-[11px] font-medium text-slate-400">Menampilkan {data.items.length} kategori saat ini.</CardDescription>
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    placeholder="Cari nama kategori..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9 h-11 rounded-xl bg-slate-50 border-none focus-visible:ring-emerald-500 transition-all"
                  />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImport}
                  />
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 w-10 rounded-xl cursor-pointer shadow-sm border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                    title="Impor CSV"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleExport}
                    className="h-10 w-10 rounded-xl cursor-pointer shadow-sm border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    title="Ekspor CSV"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none">
                      <TableHead className="font-black text-slate-400 h-14 px-6 text-[10px] uppercase tracking-wider">Nama Kategori</TableHead>
                      <TableHead className="font-black text-slate-400 h-14 px-4 text-center text-[10px] uppercase tracking-wider">Jumlah Layanan</TableHead>
                      <TableHead className="font-black text-slate-400 h-14 px-6 text-center text-[10px] uppercase tracking-wider">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={3} className="py-20"><TableSkeleton rows={5} /></TableCell></TableRow>
                    ) : data.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-20 text-center">
                          <EmptyState title="Kategori Kosong" description="Tidak ada kategori yang ditemukan." />
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.items.map((item: any) => (
                        <TableRow key={item.id} className={cn(
                          "transition-all duration-300 border-b border-slate-50",
                          editingItem?.id === item.id ? "bg-blue-50/40" : "hover:bg-slate-50/30"
                        )}>
                          <TableCell className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                <Tag className="h-4 w-4" />
                              </div>
                              <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center px-4">
                            <div className="flex flex-col items-center justify-center">
                              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mb-1">
                                <FlaskConical className="h-4 w-4 text-slate-400" />
                              </div>
                              <span className="text-xs font-black text-slate-600">{item._count?.services || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center px-6">
                            <div className="flex justify-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                                onClick={() => handleEdit(item)}
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 text-red-500 hover:bg-red-100 rounded-xl transition-all"
                                onClick={() => handleDelete(item.id)}
                                title="Hapus"
                              >
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

              {/* Pagination */}
              <div className="p-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/30">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Tampilkan</p>
                  <Select value={limit.toString()} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                    <SelectTrigger className="h-9 w-20 text-xs rounded-xl border-slate-200 bg-white shadow-sm font-bold">
                      <SelectValue placeholder={limit.toString()} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10" className="font-bold">10</SelectItem>
                      <SelectItem value="25" className="font-bold">25</SelectItem>
                      <SelectItem value="50" className="font-bold">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-10 px-4 rounded-xl border-slate-200 bg-white shadow-sm font-bold text-slate-500"
                    disabled={page === 1} 
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Prev
                  </Button>
                  <div className="text-xs font-black px-5 py-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200">
                    {page} <span className="opacity-60 mx-1">/</span> {data.totalPages || 1}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-10 px-4 rounded-xl border-slate-200 bg-white shadow-sm font-bold text-slate-500"
                    disabled={page === data.totalPages} 
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteItemId !== null} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <div className="h-16 w-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mb-6 border border-red-100 shadow-inner">
              <Trash2 className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-slate-800 leading-tight">
              Hapus Kategori?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 pt-2 text-sm leading-relaxed">
              Tindakan ini tidak dapat dibatalkan. Pastikan kategori ini tidak memiliki layanan aktif.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 pt-8">
            <AlertDialogCancel className="rounded-2xl h-14 border-slate-200 text-slate-500 font-bold px-6">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 rounded-2xl h-14 px-8 font-black shadow-xl shadow-red-200 transition-all active:scale-95"
            >
              YA, HAPUS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Full Page Overlay for initial loading if needed */}
      {submitting && <LoadingOverlay isOpen={submitting} title="Sinkronisasi Data..." description="Sedang menyimpan perubahan kategori." />}
    </div>
  );
}
