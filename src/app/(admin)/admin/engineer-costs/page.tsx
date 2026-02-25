// ============================================================================
// OPTIMIZED SAMPLING PERSONNEL COSTS PAGE - v2.1
// Fitur:
// 1. ✅ Penamaan sesuai 'Biaya Petugas Sampling'
// 2. ✅ Input Wilayah/Lokasi yang fleksibel
// 3. ✅ Grouping berdasarkan Tipe Petugas
// 4. ✅ Quick edit harga & Export/Import
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
  Plus,
  Trash2,
  Search,
  MoreVertical,
  Edit,
  Trash,
  Users,
  MapPin,
  Clock,
  Tag,
  Download,
  Upload,
  History,
  X,
  Check,
  AlertCircle,
  Filter,
  ChevronDown,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { ChemicalLoader } from "@/components/ui";
import { LoadingOverlay, LoadingButton, TableSkeleton, EmptyState } from "@/components/ui";
import {
  getOperationalCatalogs,
  deleteOperationalCatalog,
  createOperationalCatalog,
  updateOperationalCatalog,
  getAllOperationalCatalogs,
  updatePrice,
  updateLocation,
  getHistory
} from "@/lib/actions/operational-catalog";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
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
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";

// Schema dengan fokus pada Wilayah/Lokasi
const operationalSchema = z.object({
  category: z.enum(["perdiem"]),
  name: z.string().min(1, "Nama tipe petugas wajib diisi"),
  description: z.string().optional(),
  unit: z.string().min(1, "Satuan wajib diisi"),
  items: z.array(z.object({
    location: z.string().min(1, "Wilayah/Lokasi wajib diisi"),
    price: z.number().min(1, "Harga harus lebih dari 0"),
  })).min(1, "Minimal 1 item harga"),
});

const getPriceBadgeColor = (price: number, minPrice: number, maxPrice: number) => {
  const range = maxPrice - minPrice;
  if (range === 0) return "bg-slate-100 text-slate-700";
  const normalized = (price - minPrice) / range;
  if (normalized < 0.33) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (normalized < 0.66) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
};

export default function EngineerCostsPage() {
  const [data, setData] = useState<{ items: any[], total: number, pages: number }>({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickEditField, setQuickEditField] = useState<"price" | "location" | null>(null);
  const [quickEditPrice, setQuickEditPrice] = useState<number>(0);
  const [quickEditLocation, setQuickEditLocation] = useState<string>("");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<string>("");

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors }, trigger } = useForm({
    resolver: zodResolver(operationalSchema),
    defaultValues: {
      category: "perdiem",
      name: "",
      description: "",
      unit: "orang/hari",
      items: [{ location: "", price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getOperationalCatalogs(page, limit, search, "perdiem");
      setData(result);
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
    const isValid = await trigger();
    if (!isValid) return;

    setSubmitting(true);
    try {
      if (selectedItem) {
        const relatedItems = data.items.filter((d: any) => d.name === selectedItem.name);
        for (const item of relatedItems) {
          await deleteOperationalCatalog(item.id);
        }
      }

      for (const item of formData.items) {
        await createOperationalCatalog({
          ...formData,
          ...item,
          perdiem_type: "sampling_fee", // Identifier internal baru
          category: "perdiem"
        });
      }

      toast.success("Data berhasil disimpan");
      setIsDialogOpen(false);
      reset();
      loadData();
    } catch (error: any) {
      toast.error("Gagal menyimpan data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: any) => {
    const relatedItems = data.items.filter((d: any) => d.name === item.name);
    setSelectedItem(item);
    reset({
      category: "perdiem",
      name: item.name,
      description: item.description || "",
      unit: item.unit,
      items: relatedItems.map((d: any) => ({
        location: d.location || "",
        price: Number(d.price)
      }))
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      const relatedItems = data.items.filter((d: any) => d.name === selectedItem.name);
      for (const item of relatedItems) {
        await deleteOperationalCatalog(item.id);
      }
      toast.success("Data berhasil dihapus");
      setIsDeleteDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error("Gagal menghapus data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickEditSave = async (id: string) => {
    try {
      if (quickEditField === "price") {
        await updatePrice(id, quickEditPrice);
        toast.success("Harga diperbarui");
      } else if (quickEditField === "location") {
        await updateLocation(id, quickEditLocation);
        toast.success("Lokasi diperbarui");
      }
      setQuickEditId(null);
      setQuickEditField(null);
      loadData();
    } catch (error: any) {
      toast.error(`Gagal update ${quickEditField === "price" ? "harga" : "lokasi"}`);
    }
  };

  const handleExport = () => {
    const headers = ["Nama Petugas", "Wilayah/Lokasi", "Harga", "Satuan"];
    const csvData = data.items.map(item => [item.name, item.location, item.price, item.unit]);
    const csv = [headers.join(","), ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `biaya-petugas-sampling.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const groupedData = data.items.reduce((acc, item) => {
    const key = item.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const prices = data.items.map(item => Number(item.price));
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-emerald-900 tracking-tight flex items-center gap-3">
          <UserCheck className="h-8 w-8 text-emerald-600" />
          Biaya Petugas Sampling
        </h1>
        <p className="text-slate-500 text-sm mt-1">Kelola tarif personel sampling berdasarkan wilayah/lokasi kerja.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
          <Input
            placeholder="Cari nama petugas atau wilayah..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 h-11 focus-visible:ring-emerald-500 rounded-lg"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={handleExport} className="cursor-pointer h-11 flex-1 md:flex-none">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button 
            onClick={() => { reset(); setSelectedItem(null); setIsDialogOpen(true); }} 
            size="icon"
            className="bg-emerald-600 hover:bg-emerald-700 shadow-lg cursor-pointer h-11 w-11 shrink-0"
            title="Tambah Petugas"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="font-bold text-emerald-900 px-6">Tipe Petugas</TableHead>
              <TableHead className="font-bold text-emerald-900">Wilayah / Lokasi</TableHead>
              <TableHead className="text-right font-bold text-emerald-900">Harga per Unit</TableHead>
              <TableHead className="text-center font-bold text-emerald-900">Satuan</TableHead>
              <TableHead className="text-center font-bold text-emerald-900">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="py-20"><TableSkeleton rows={5} /></TableCell></TableRow>
            ) : Object.keys(groupedData).length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-20"><EmptyState title="Belum ada data" description="Klik Tambah Petugas untuk memulai." /></TableCell></TableRow>
            ) : (
              (Object.entries(groupedData) as [string, any[]][]).map(([name, items]) => (
                <React.Fragment key={name}>
                  {items.map((item: any, idx: number) => {
                    const isQuickEditingPrice = quickEditId === item.id && quickEditField === "price";
                    const isQuickEditingLocation = quickEditId === item.id && quickEditField === "location";

                    return (
                      <TableRow key={item.id} className="hover:bg-emerald-50/10 transition-colors">
                        {idx === 0 && (
                          <TableCell rowSpan={items.length} className="px-6 align-top border-r border-slate-100 bg-white/50">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                                {name.substring(0,2).toUpperCase()}
                              </div>
                              <span className="font-bold text-slate-800">{name}</span>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          {isQuickEditingLocation ? (
                            <div className="flex items-center gap-2">
                              <Input 
                                value={quickEditLocation} 
                                onChange={(e) => setQuickEditLocation(e.target.value)} 
                                className="h-8 text-sm" 
                                autoFocus 
                              />
                              <Button size="icon" variant="ghost" onClick={() => handleQuickEditSave(item.id)} className="text-emerald-600 h-8 w-8"><Check className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => { setQuickEditId(null); setQuickEditField(null); }} className="text-red-600 h-8 w-8"><X className="h-4 w-4" /></Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                <MapPin className="h-3 w-3 mr-1" /> {item.location || "-"}
                              </Badge>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 text-slate-400 hover:text-emerald-600" 
                                onClick={() => { 
                                  setQuickEditId(item.id); 
                                  setQuickEditField("location");
                                  setQuickEditLocation(item.location || ""); 
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isQuickEditingPrice ? (
                            <div className="flex items-center gap-2 justify-end">
                              <Input type="number" value={quickEditPrice} onChange={(e) => setQuickEditPrice(Number(e.target.value))} className="w-32 h-8 text-right" autoFocus />
                              <Button size="icon" variant="ghost" onClick={() => handleQuickEditSave(item.id)} className="text-emerald-600 h-8 w-8"><Check className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => { setQuickEditId(null); setQuickEditField(null); }} className="text-red-600 h-8 w-8"><X className="h-4 w-4" /></Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 justify-end">
                              <Badge variant="outline" className={cn("font-bold", getPriceBadgeColor(Number(item.price), minPrice, maxPrice))}>
                                Rp {Number(item.price).toLocaleString("id-ID")}
                              </Badge>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 text-slate-400 hover:text-emerald-600" 
                                onClick={() => { 
                                  setQuickEditId(item.id); 
                                  setQuickEditField("price");
                                  setQuickEditPrice(Number(item.price)); 
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-slate-500 text-sm">{item.unit}</TableCell>
                        {idx === 0 && (
                          <TableCell rowSpan={items.length} className="text-center align-top border-l border-slate-100">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="cursor-pointer"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(item)} className="cursor-pointer"><Edit className="mr-2 h-4 w-4" /> Edit Group</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setSelectedItem(item); setIsDeleteDialogOpen(true); }} className="text-red-600 cursor-pointer"><Trash className="mr-2 h-4 w-4" /> Hapus Semua</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {!loading && data.total > 0 && (
          <div className="p-5 border-t bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-xs font-medium text-slate-500">
                Menampilkan <span className="text-slate-900 font-bold">{data.items.length}</span> dari <span className="text-slate-900 font-bold">{data.total}</span> data
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Baris:</span>
                <Select value={limit.toString()} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                  <SelectTrigger className="h-8 w-16 text-xs rounded-xl border-slate-200">
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
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 w-9 rounded-xl cursor-pointer border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-95" 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center px-4 text-xs font-bold bg-white border border-slate-200 rounded-xl shadow-sm text-slate-600">
                {page} / {data.pages}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 w-9 rounded-xl cursor-pointer border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-95" 
                disabled={page === data.pages} 
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-emerald-900 flex items-center gap-2">
              <UserCheck className="h-5 w-5" /> {selectedItem ? "Edit" : "Tambah"} Biaya Petugas Sampling
            </DialogTitle>
            <DialogDescription>Input tipe petugas dan kombinasi harga berdasarkan wilayah.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Tipe Petugas</Label>
                <Input {...register("name")} placeholder="Contoh: Engineer Senior / Petugas Sampling" className="rounded-xl" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Satuan</Label>
                <Input {...register("unit")} placeholder="Contoh: orang/hari" className="rounded-xl" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-emerald-700 font-bold uppercase text-[10px] tracking-widest">Kombinasi Wilayah & Harga</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ location: "", price: 0 })} className="h-7 text-[10px] border-emerald-200 text-emerald-700"><Plus className="h-3 w-3 mr-1" /> Tambah Wilayah</Button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-end p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-2">
                  <div className="flex-[2] space-y-1">
                    <Label className="text-[10px] text-slate-500 font-bold">WILAYAH / LOKASI</Label>
                    <Input {...register(`items.${index}.location`)} placeholder="Contoh: Jawa Barat / Ring 1" className="bg-white h-10" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px] text-slate-500 font-bold">HARGA (RP)</Label>
                    <Input type="number" {...register(`items.${index}.price`, { valueAsNumber: true })} className="bg-white h-10 font-bold text-emerald-700" />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1} className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50"><X className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>

            <DialogFooter><LoadingButton type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl shadow-lg" loading={submitting}>{selectedItem ? "Update Data" : "Simpan Data"}</LoadingButton></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl">
          <DialogHeader><DialogTitle className="text-red-600 flex items-center gap-2"><Trash2 className="h-5 w-5" /> Hapus Data</DialogTitle><DialogDescription>Anda yakin ingin menghapus semua data <strong>{selectedItem?.name}</strong>?</DialogDescription></DialogHeader>
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-xl flex-1">Batal</Button><Button variant="destructive" onClick={handleDelete} disabled={submitting} className="rounded-xl flex-1">Hapus</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <LoadingOverlay isOpen={submitting} title="Memproses Data..." description="Mohon tunggu sebentar" />
    </div>
  );
}
