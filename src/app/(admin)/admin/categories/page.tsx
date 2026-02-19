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
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Search, Tag } from "lucide-react";
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

export default function CategoriesPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { register, handleSubmit, reset, setValue } = useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getCategories(page, limit, search);
      setData(result);
      setSelectedIds([]);
    } catch (error) {
      toast.error("Gagal memuat data kategori");
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
    setSubmitting(true);
    try {
      await createOrUpdateCategory(formData, editingItem?.id);
      setIsDialogOpen(false);
      reset();
      setEditingItem(null);
      loadData();
      toast.success(editingItem ? "Kategori diperbarui" : "Kategori baru ditambahkan");
    } catch (error: any) {
      toast.error("Gagal menyimpan data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setValue("name", item.name);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    toast.warning("Hapus Kategori?", {
      description: "Data ini akan dihapus permanen.",
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            await deleteCategory(id);
            loadData();
            toast.success("Kategori dihapus");
          } catch (error) {
            toast.error("Gagal menghapus data");
          }
        }
      }
    });
  };

  const handleBulkDelete = async () => {
    toast.warning(`Hapus ${selectedIds.length} kategori?`, {
      description: "Data akan dihapus permanen.",
      action: {
        label: "Hapus Masal",
        onClick: async () => {
          try {
            await deleteManyCategories(selectedIds);
            loadData();
            toast.success("Data berhasil dihapus");
          } catch (error) {
            toast.error("Gagal menghapus beberapa data");
          }
        }
      }
    });
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

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">Kategori Layanan</h1>
          <p className="text-slate-500 text-sm">Kelola pengelompokan layanan laboratorium.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} className="animate-in fade-in zoom-in duration-200">
              <Trash2 className="mr-2 h-4 w-4" /> Hapus ({selectedIds.length})
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              reset();
              setEditingItem(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 cursor-pointer flex-1 md:flex-none">
                <Plus className="mr-2 h-4 w-4" /> Tambah Kategori
              </Button>
            </DialogTrigger>
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
                  <Input {...register("name")} placeholder="Contoh: Udara Ambien" required className="focus-visible:ring-emerald-500" />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 w-full cursor-pointer" disabled={submitting}>
                    {submitting && <ChemicalLoader size="sm" />}
                    {editingItem ? "Simpan Perubahan" : "Buat Kategori"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b bg-emerald-50/10 flex items-center justify-between gap-4">
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
                  <TableCell colSpan={5} className="text-center py-20 text-slate-500 font-sans">
                    Belum ada kategori.
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-emerald-50/10 transition-colors">
                    <TableCell className="px-6">
                      <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
                    </TableCell>
                    <TableCell className="font-bold text-slate-800 px-4">{item.name}</TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-emerald-700">{item._count.services}</span>
                        <span className="text-xs text-slate-400">layanan</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm px-4">
                      {new Date(item.created_at).toLocaleDateString("id-ID")}
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
            <div className="p-10 text-center text-slate-500">Belum ada kategori.</div>
          ) : (
            data.items.map((item: any) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div 
                  key={item.id} 
                  className={`p-4 space-y-3 transition-colors ${isSelected ? 'bg-emerald-50/50' : 'bg-white active:bg-slate-50'}`}
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
                      <div>
                        <h4 className="font-bold text-slate-900">{item.name}</h4>
                        <p className="text-[10px] text-slate-400">
                          Dibuat: {new Date(item.created_at).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-700">{item._count.services}</span>
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
    </div>
  );
}
