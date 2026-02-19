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
  Users,
  MapPin,
  Clock,
  Tag
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
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";

const operationalSchema = z.object({
  category: z.enum(["perdiem"]),
  name: z.string().min(1, "Nama wajib diisi"),
  description: z.string().optional(),
  unit: z.string().min(1, "Satuan wajib diisi"),
  items: z.array(z.object({
    perdiem_type: z.string().min(1, "Tipe perdiem wajib diisi"),
    location: z.string().min(1, "Lokasi wajib diisi"),
    price: z.number().min(0, "Harga harus >= 0"),
  })).min(1, "Minimal 1 item harga"),
});

export default function EngineerCostsPage() {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(operationalSchema),
    defaultValues: {
      category: "perdiem",
      name: "",
      description: "",
      unit: "hari",
      items: [{ perdiem_type: "", location: "", price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = watch("items");

  // Get unique perdiem types and locations from data
  const perdiemTypes = Array.from(new Set(data.map(item => item.perdiem_type).filter(Boolean)));
  const locations = Array.from(new Set(data.map(item => item.location).filter(Boolean)));

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getOperationalCatalogs(page, 100, search);
      const perdiemItems = result.filter((item: any) => item.category === "perdiem");
      setData(perdiemItems);
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
    setShowSubmitModal(true);
    setSubmitting(true);
    try {
      if (selectedItem) {
        // Update existing - delete old items first, then create new ones
        await deleteOperationalCatalog(selectedItem.id);
      }
      
      // Create new entries for each item
      for (const item of formData.items) {
        await createOperationalCatalog({
          ...formData,
          ...item,
          category: "perdiem"
        });
      }
      
      toast.success("Data berhasil disimpan", {
        description: `${formData.name} dengan ${formData.items.length} kombinasi harga`
      });
      setIsDialogOpen(false);
      setSelectedItem(null);
      reset();
      loadData();
    } catch (error: any) {
      toast.error("Gagal menyimpan data", {
        description: error?.message || "Silakan coba lagi"
      });
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const handleEdit = (item: any) => {
    // Find all items with same name
    const relatedItems = data.filter((d: any) => d.name === item.name && d.category === "perdiem");
    
    setSelectedItem(item);
    setValue("category", "perdiem");
    setValue("name", item.name);
    setValue("description", item.description || "");
    setValue("unit", item.unit);
    
    // Set all related items
    const items = relatedItems.map((d: any) => ({
      perdiem_type: d.perdiem_type || "",
      location: d.location || "",
      price: Number(d.price)
    }));
    
    // Clear existing and add new
    while (fields.length > 0) {
      remove(0);
    }
    items.forEach((item: any) => append(item));
    
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setShowSubmitModal(true);
    try {
      // Delete all items with same name
      const relatedItems = data.filter((d: any) => d.name === selectedItem.name && d.category === "perdiem");
      for (const item of relatedItems) {
        await deleteOperationalCatalog(item.id);
      }
      toast.success("Data berhasil dihapus", {
        description: "Semua kombinasi harga telah dihapus"
      });
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      loadData();
    } catch (error: any) {
      toast.error("Gagal menghapus data", {
        description: error?.message || "Silakan coba lagi"
      });
    } finally {
      setShowSubmitModal(false);
    }
  };

  const openDeleteDialog = (item: any) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const filteredData = activeTab === "all" 
    ? data 
    : data.filter(item => item.perdiem_type === activeTab);

  const groupedData = filteredData.reduce((acc, item) => {
    const key = item.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Biaya Engineer</h1>
          <p className="text-slate-500 text-sm">Kelola biaya perdiem engineer dengan tipe dan lokasi yang fleksibel.</p>
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
          <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-emerald-900 flex items-center gap-2">
                {selectedItem ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {selectedItem ? "Edit" : "Tambah"} Biaya Engineer
              </DialogTitle>
              <DialogDescription>
                Masukkan nama tarif dan kombinasi tipe perdiem, lokasi, dan harga.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Tarif</Label>
                <Input
                  {...register("name")}
                  placeholder="Contoh: Engineer Senior, Engineer Junior"
                  className="focus-visible:ring-emerald-500"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Input
                  {...register("description")}
                  placeholder="Deskripsi singkat"
                  className="focus-visible:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Satuan</Label>
                <Input
                  {...register("unit")}
                  placeholder="Contoh: hari"
                  defaultValue="hari"
                  className="focus-visible:ring-emerald-500"
                />
                {errors.unit && <p className="text-sm text-red-500">{errors.unit.message}</p>}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Kombinasi Harga</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                    onClick={() => append({ perdiem_type: "", location: "", price: 0 })}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Tambah Kombinasi
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-end p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Tipe Perdiem</Label>
                      <Input
                        placeholder="Contoh: Sesaat, 24 Jam"
                        {...register(`items.${index}.perdiem_type`)}
                        className="bg-white focus-visible:ring-emerald-500"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Lokasi</Label>
                      <Input
                        placeholder="Contoh: Jawa Barat, Jakarta"
                        {...register(`items.${index}.location`)}
                        className="bg-white focus-visible:ring-emerald-500"
                      />
                    </div>
                    <div className="w-32 space-y-1">
                      <Label className="text-xs">Harga</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        {...register(`items.${index}.price`, { valueAsNumber: true })}
                        className="bg-white focus-visible:ring-emerald-500"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer shrink-0"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={submitting}
                >
                  {selectedItem ? "Perbarui" : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold text-slate-800">Total Tarif</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{Object.keys(groupedData).length}</p>
            <p className="text-xs text-slate-500">Nama tarif berbeda</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-slate-800">Tipe Perdiem</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{perdiemTypes.length}</p>
            <p className="text-xs text-slate-500">Tipe yang terdaftar</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-amber-600" />
              <span className="font-semibold text-slate-800">Lokasi</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{locations.length}</p>
            <p className="text-xs text-slate-500">Lokasi yang terdaftar</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Perdiem Types */}
      {perdiemTypes.length > 0 && (
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val)} className="mb-6">
          <TabsList className="grid w-full md:w-auto grid-cols-2 md:inline-grid bg-slate-100">
            <TabsTrigger value="all" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              Semua Tipe
            </TabsTrigger>
            {perdiemTypes.map(type => (
              <TabsTrigger key={type} value={type} className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                {type}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-emerald-50/5 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              placeholder="Cari nama tarif..."
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
              <TableHead className="font-bold text-emerald-900">Nama Tarif</TableHead>
              <TableHead className="font-bold text-emerald-900">Tipe Perdiem</TableHead>
              <TableHead className="font-bold text-emerald-900">Lokasi</TableHead>
              <TableHead className="font-bold text-emerald-900">Deskripsi</TableHead>
              <TableHead className="text-right font-bold text-emerald-900">Harga</TableHead>
              <TableHead className="text-center font-bold text-emerald-900">Satuan</TableHead>
              <TableHead className="text-center font-bold text-emerald-900">Aksi</TableHead>
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
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-slate-500">
                  Belum ada data biaya engineer.
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(groupedData).map(([name, items]) => (
                <React.Fragment key={name}>
                  {(items as any[]).map((item: any, idx: number) => (
                    <TableRow key={item.id} className="hover:bg-emerald-50/10 transition-colors">
                      {idx === 0 && (
                        <TableCell 
                          rowSpan={(items as any[]).length} 
                          className="px-4 align-top border-b border-slate-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                              <Users className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-slate-800">{name}</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="px-4">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Clock className="h-3 w-3 mr-1" />
                          {item.perdiem_type || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4">
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          <MapPin className="h-3 w-3 mr-1" />
                          {item.location || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm px-4 max-w-xs truncate">
                        {item.description || "-"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900 px-4">
                        Rp {Number(item.price).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-center text-slate-600 px-4">{item.unit}</TableCell>
                      {idx === 0 && (
                        <TableCell className="text-center px-4 align-top border-b border-slate-100"
                          rowSpan={(items as any[]).length}
                        >
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
                      )}
                    </TableRow>
                  ))}
                </React.Fragment>
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
              Apakah Anda yakin ingin menghapus "{selectedItem?.name}"? Semua kombinasi harga akan dihapus.
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

      {/* Submit Loading Modal - Fixed at root level with highest z-index */}
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
