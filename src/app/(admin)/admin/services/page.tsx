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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2, FlaskConical, Search } from "lucide-react";
import { getServices, createOrUpdateService, deleteService, deleteManyServices } from "@/lib/actions/services";
import { getAllCategories } from "@/lib/actions/categories";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function ServicesPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [categories, setCategories] = useState<any[]>([]);
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
      const [sResult, cResult] = await Promise.all([
        getServices(page, limit, search),
        getAllCategories()
      ]);
      setData(sResult);
      setCategories(cResult);
      setSelectedIds([]);
    } catch (error) {
      toast.error("Gagal memuat data");
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
      await createOrUpdateService(formData, editingItem?.id);
      setIsDialogOpen(false);
      reset();
      setEditingItem(null);
      loadData();
      toast.success(editingItem ? "Layanan diperbarui" : "Layanan baru ditambahkan");
    } catch (error: any) {
      toast.error("Gagal menyimpan data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setValue("name", item.name);
    setValue("category_id", item.category_id);
    setValue("price", Number(item.price));
    setValue("unit", item.unit);
    setValue("regulation", item.regulation);
    setValue("parameters", item.parameters ? JSON.stringify(item.parameters) : "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    toast.warning("Hapus Layanan?", {
      description: "Data katalog ini akan dihapus permanen.",
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            await deleteService(id);
            loadData();
            toast.success("Layanan dihapus");
          } catch (error) {
            toast.error("Gagal menghapus data");
          }
        }
      }
    });
  };

  const handleBulkDelete = async () => {
    toast.warning(`Hapus ${selectedIds.length} layanan?`, {
      description: "Data akan dihapus permanen dari katalog.",
      action: {
        label: "Hapus Masal",
        onClick: async () => {
          try {
            await deleteManyServices(selectedIds);
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
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Katalog Layanan</h1>
          <p className="text-slate-500 text-sm">Kelola daftar pengujian dan parameter laboratorium.</p>
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
                <Plus className="mr-2 h-4 w-4" /> Tambah Layanan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-emerald-900 flex items-center gap-2">
                  <FlaskConical className="h-5 w-5" />
                  {editingItem ? "Edit Layanan" : "Tambah Layanan Baru"}
                </DialogTitle>
                <DialogDescription>
                  Isi rincian layanan laboratorium di bawah ini.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Pilih Kategori</label>
                    <Select onValueChange={(val) => setValue("category_id", val)} defaultValue={editingItem?.category_id}>
                      <SelectTrigger className="cursor-pointer focus:ring-emerald-500">
                        <SelectValue placeholder="Pilih Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id} className="cursor-pointer">
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Nama Layanan</label>
                    <Input {...register("name")} placeholder="Contoh: Uji Logam Berat" required className="focus-visible:ring-emerald-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Harga (Rp)</label>
                    <Input {...register("price", { valueAsNumber: true })} type="number" placeholder="0" required className="focus-visible:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Satuan / Unit</label>
                    <Input {...register("unit")} placeholder="Contoh: mg/L" className="focus-visible:ring-emerald-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Regulasi / Baku Mutu</label>
                  <Input {...register("regulation")} placeholder="Contoh: Permenkes No. 492" className="focus-visible:ring-emerald-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-emerald-700">Parameter (JSON - Opsional)</label>
                  <textarea 
                    {...register("parameters")} 
                    className="w-full min-h-[100px] p-3 text-xs font-mono border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    placeholder='[{"name": "pH", "max": 8.5}]'
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 w-full cursor-pointer" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingItem ? "Simpan Perubahan" : "Tambahkan ke Katalog"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden transition-all duration-300">
        <div className="p-5 border-b bg-emerald-50/10 flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input 
              placeholder="Cari kategori atau nama layanan..." 
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
                <TableHead className="font-bold text-emerald-900 px-4">Kategori</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Nama Layanan</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Harga</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Unit</TableHead>
                <TableHead className="text-center font-bold text-emerald-900 px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
                  </TableCell>
                </TableRow>
              ) : data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-slate-500">
                    Katalog masih kosong.
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-emerald-50/10 transition-colors">
                    <TableCell className="px-6">
                      <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                        {item.category_ref?.name || item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-800 px-4">{item.name}</TableCell>
                    <TableCell className="text-emerald-700 font-bold px-4">
                      Rp {Number(item.price).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm px-4">{item.unit || "-"}</TableCell>
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
            <div className="p-10 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
            </div>
          ) : data.items.length === 0 ? (
            <div className="p-10 text-center text-slate-500">Katalog masih kosong.</div>
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
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-[9px] border-emerald-200 text-emerald-700 bg-emerald-50">
                          {item.category_ref?.name || item.category}
                        </Badge>
                        <h4 className="font-bold text-slate-900">{item.name}</h4>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-emerald-700">
                      Rp {Number(item.price).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-slate-500">Unit: {item.unit || "-"}</span>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 cursor-pointer" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 cursor-pointer" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-500 font-medium">Total {data.total} layanan terdaftar</p>
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
