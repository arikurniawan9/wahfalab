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
  Plus,
  Trash2,
  Search,
  MoreVertical,
  Edit,
  Trash,
  Truck
} from "lucide-react";
import { ChemicalLoader } from "@/components/ui";
import {
  getOperationalCatalogs,
  deleteOperationalCatalog,
  createOperationalCatalog,
  updateOperationalCatalog
} from "@/lib/actions/operational-catalog";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const operationalSchema = z.object({
  category: z.enum(["transport"]),
  name: z.string().min(1, "Nama wajib diisi"),
  description: z.string().optional(),
  price: z.number().min(0, "Harga harus >= 0"),
  unit: z.string().min(1, "Satuan wajib diisi"),
});

export default function TransportCostsPage() {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(operationalSchema),
    defaultValues: {
      category: "transport",
      name: "",
      description: "",
      price: 0,
      unit: "trip",
    }
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getOperationalCatalogs(page, limit, search);
      const transportItems = result.filter((item: any) => item.category === "transport");
      setData(transportItems);
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
      if (selectedItem) {
        await updateOperationalCatalog(selectedItem.id, { ...formData, category: "transport" });
        toast.success("Data berhasil diperbarui");
      } else {
        await createOperationalCatalog({ ...formData, category: "transport" });
        toast.success("Data berhasil ditambahkan");
      }
      setIsDialogOpen(false);
      setSelectedItem(null);
      reset();
      loadData();
    } catch (error) {
      toast.error("Gagal menyimpan data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setValue("category", item.category);
    setValue("name", item.name);
    setValue("description", item.description || "");
    setValue("price", Number(item.price));
    setValue("unit", item.unit);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await deleteOperationalCatalog(selectedItem.id);
      toast.success("Data berhasil dihapus");
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      loadData();
    } catch (error) {
      toast.error("Gagal menghapus data");
    }
  };

  const openDeleteDialog = (item: any) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Biaya Transport & Akomodasi</h1>
          <p className="text-slate-500 text-sm">Kelola biaya transportasi dan akomodasi untuk penawaran laboratorium.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            reset();
            setSelectedItem(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100">
              <Plus className="mr-2 h-4 w-4" /> Tambah Data
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-emerald-900 flex items-center gap-2">
                {selectedItem ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {selectedItem ? "Edit" : "Tambah"} Biaya Transport
              </DialogTitle>
              <DialogDescription>
                Masukkan informasi biaya transportasi dan akomodasi lapangan.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Tarif</Label>
                <Input
                  {...register("name")}
                  placeholder="Contoh: Transport Dalam Kota"
                  className="focus-visible:ring-emerald-500"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Textarea
                  {...register("description")}
                  placeholder="Deskripsi singkat"
                  className="focus-visible:ring-emerald-500 min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Harga</Label>
                  <Input
                    type="number"
                    {...register("price", { valueAsNumber: true })}
                    placeholder="0"
                    className="focus-visible:ring-emerald-500"
                  />
                  {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Satuan</Label>
                  <Input
                    {...register("unit")}
                    placeholder="Contoh: trip, hari, unit"
                    className="focus-visible:ring-emerald-500"
                  />
                  {errors.unit && <p className="text-sm text-red-500">{errors.unit.message}</p>}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={submitting}
                >
                  {submitting && <ChemicalLoader size="sm" />}
                  {selectedItem ? "Perbarui" : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-emerald-50/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              placeholder="Cari nama atau deskripsi..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 focus-visible:ring-emerald-500 rounded-xl"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="font-bold text-emerald-900">Nama</TableHead>
              <TableHead className="font-bold text-emerald-900">Deskripsi</TableHead>
              <TableHead className="text-right font-bold text-emerald-900">Harga</TableHead>
              <TableHead className="text-center font-bold text-emerald-900">Satuan</TableHead>
              <TableHead className="text-center font-bold text-emerald-900">Aksi</TableHead>
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
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-slate-500">
                  Belum ada data biaya transport & akomodasi.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item: any) => (
                <TableRow key={item.id} className="hover:bg-emerald-50/10 transition-colors">
                  <TableCell className="px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <Truck className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-slate-800">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm px-4 max-w-xs truncate">
                    {item.description || "-"}
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-900 px-4">
                    Rp {Number(item.price).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-center text-slate-600 px-4">{item.unit}</TableCell>
                  <TableCell className="text-center px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 cursor-pointer">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEdit(item)} className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(item)}
                          className="text-red-600 cursor-pointer"
                        >
                          <Trash className="mr-2 h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Konfirmasi Hapus
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
