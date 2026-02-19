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
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Search, Wrench } from "lucide-react";
import { getEquipment, createOrUpdateEquipment, deleteEquipment, deleteManyEquipment } from "@/lib/actions/equipment";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ChemicalLoader } from "@/components/ui";

const availabilityStatusOptions = [
  { value: "available", label: "Tersedia", color: "bg-emerald-500" },
  { value: "rented", label: "Disewa", color: "bg-amber-500" },
  { value: "maintenance", label: "Perawatan", color: "bg-red-500" },
];

export default function EquipmentPage() {
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
      const result = await getEquipment(page, limit, search);
      setData(result);
      setSelectedIds([]);
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
    }, 500);
    return () => clearTimeout(timer);
  }, [page, limit, search]);

  const onSubmit = async (formData: any) => {
    setSubmitting(true);
    try {
      await createOrUpdateEquipment(formData, editingItem?.id);
      setIsDialogOpen(false);
      reset();
      setEditingItem(null);
      loadData();
      toast.success(editingItem ? "Alat diperbarui" : "Alat baru ditambahkan", {
        description: `Data ${formData.name} berhasil ${editingItem ? 'diperbarui' : 'ditambahkan'}`
      });
    } catch (error: any) {
      toast.error("Gagal menyimpan data alat", {
        description: error?.message || "Silakan coba lagi"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setValue("name", item.name);
    setValue("category", item.category);
    setValue("specification", item.specification);
    setValue("price", Number(item.price));
    setValue("unit", item.unit);
    setValue("availability_status", item.availability_status);
    setValue("quantity", item.quantity);
    setValue("description", item.description);
    setValue("image_url", item.image_url);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    toast.warning("Hapus Alat?", {
      description: "Data alat ini akan dihapus permanen.",
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            await deleteEquipment(id);
            loadData();
            toast.success("Alat berhasil dihapus", {
              description: "Data telah dihapus dari katalog"
            });
          } catch (error: any) {
            toast.error("Gagal menghapus alat", {
              description: error?.message || "Silakan coba lagi"
            });
          }
        }
      }
    });
  };

  const handleBulkDelete = async () => {
    toast.warning(`Hapus ${selectedIds.length} alat?`, {
      description: "Data akan dihapus permanen.",
      action: {
        label: "Hapus Masal",
        onClick: async () => {
          try {
            await deleteManyEquipment(selectedIds);
            loadData();
            toast.success(`${selectedIds.length} alat berhasil dihapus`, {
              description: "Data telah dihapus dari katalog"
            });
          } catch (error: any) {
            toast.error("Gagal menghapus data alat", {
              description: error?.message || "Silakan coba lagi"
            });
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

  const getStatusBadge = (status: string) => {
    const option = availabilityStatusOptions.find(opt => opt.value === status);
    if (!option) return null;
    return (
      <Badge variant="outline" className={`${option.color}/10 text-${option.color.replace('bg-', '')} border-${option.color.replace('bg-', '')}`}>
        {option.label}
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Sewa Alat</h1>
          <p className="text-slate-500 text-sm">Kelola katalog alat dan peralatan laboratorium yang tersedia untuk disewa.</p>
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
                <Plus className="mr-2 h-4 w-4" /> Tambah Alat
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-emerald-900 flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  {editingItem ? "Edit Alat" : "Tambah Alat Baru"}
                </DialogTitle>
                <DialogDescription>
                  Isi rincian alat dan peralatan laboratorium di bawah ini.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Nama Alat</label>
                    <Input {...register("name")} placeholder="Contoh: Gas Chromatograph" required className="focus-visible:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Kategori</label>
                    <Input {...register("category")} placeholder="Contoh: Instrumentasi" className="focus-visible:ring-emerald-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Spesifikasi</label>
                  <Input {...register("specification")} placeholder="Contoh: GC-2010 Plus, Shimadzu" className="focus-visible:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Harga Sewa (Rp)</label>
                    <Input {...register("price", { valueAsNumber: true })} type="number" placeholder="0" required className="focus-visible:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Satuan</label>
                    <Input {...register("unit")} placeholder="Contoh: hari" className="focus-visible:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Jumlah</label>
                    <Input {...register("quantity", { valueAsNumber: true })} type="number" placeholder="1" className="focus-visible:ring-emerald-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Status Ketersediaan</label>
                  <Select onValueChange={(val) => setValue("availability_status", val)} defaultValue={editingItem?.availability_status || "available"}>
                    <SelectTrigger className="cursor-pointer focus:ring-emerald-500">
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {availabilityStatusOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Deskripsi</label>
                  <textarea
                    {...register("description")}
                    className="w-full min-h-[80px] p-3 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    placeholder="Deskripsi alat..."
                  />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 w-full cursor-pointer" disabled={submitting}>
                    {submitting ? (
                      <span className="flex items-center justify-center">
                        <ChemicalLoader size="sm" />
                      </span>
                    ) : (
                      editingItem ? "Simpan Perubahan" : "Tambahkan ke Katalog"
                    )}
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
              placeholder="Cari nama alat atau kategori..."
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
                <TableHead className="font-bold text-emerald-900 px-4">Nama Alat</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Kategori</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Spesifikasi</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Harga Sewa</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Status</TableHead>
                <TableHead className="text-center font-bold text-emerald-900 px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex justify-center">
                      <ChemicalLoader />
                    </div>
                    <p className="mt-4 text-sm text-slate-500">Memuat data...</p>
                  </TableCell>
                </TableRow>
              ) : data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-slate-500">
                    Katalog alat masih kosong.
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-emerald-50/10 transition-colors">
                    <TableCell className="px-6">
                      <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
                    </TableCell>
                    <TableCell className="font-medium text-slate-800 px-4">{item.name}</TableCell>
                    <TableCell className="text-slate-600 px-4">{item.category || "-"}</TableCell>
                    <TableCell className="text-slate-500 text-sm px-4 max-w-xs truncate">{item.specification || "-"}</TableCell>
                    <TableCell className="text-emerald-700 font-bold px-4">
                      Rp {Number(item.price).toLocaleString("id-ID")} / {item.unit || "unit"}
                    </TableCell>
                    <TableCell className="px-4">
                      {getStatusBadge(item.availability_status)}
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
            <div className="p-10 text-center">
              <ChemicalLoader />
            </div>
          ) : data.items.length === 0 ? (
            <div className="p-10 text-center text-slate-500">Katalog alat masih kosong.</div>
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
                        <h4 className="font-bold text-slate-900">{item.name}</h4>
                        <p className="text-xs text-slate-500">{item.category || "Tidak ada kategori"}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[200px]">{item.specification}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-700">
                        Rp {Number(item.price).toLocaleString("id-ID")}
                      </p>
                      <p className="text-[10px] text-slate-400">/{item.unit || "unit"}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div>
                      {getStatusBadge(item.availability_status)}
                    </div>
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
            <p className="text-xs text-slate-500 font-medium">Total {data.total} alat terdaftar</p>
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
