"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  FileDown,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  MoreVertical,
  Eye,
  Trash,
  FileText,
  Users,
  Truck,
  Wrench
} from "lucide-react";
import { ChemicalLoader } from "@/components/ui";
import { getQuotations, deleteQuotation, createQuotation, deleteManyQuotations } from "@/lib/actions/quotation";
import { getClients } from "@/lib/actions/users";
import { getAllServices } from "@/lib/actions/services";
import { getOperationalCatalogs } from "@/lib/actions/operational-catalog";
import { getAllEquipment } from "@/lib/actions/equipment";
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
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const quotationSchema = z.object({
  quotation_number: z.string().min(1, "Wajib diisi"),
  user_id: z.string().min(1, "Pilih pelanggan"),
  use_tax: z.boolean().default(true),
  discount_amount: z.number().min(0).default(0),
  perdiem_price: z.number().min(0).default(0),
  perdiem_qty: z.number().min(0).default(0),
  transport_price: z.number().min(0).default(0),
  transport_qty: z.number().min(0).default(0),
  items: z.array(z.object({
    service_id: z.string().min(1).optional(),
    equipment_id: z.string().min(1).optional(),
    qty: z.number().min(1),
    price: z.number().min(0),
    name: z.string().optional(),
    specification: z.string().optional(),
    unit: z.string().optional(),
  })).min(1, "Minimal 1 item"),
});

export default function QuotationListPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [operationalCatalogs, setOperationalCatalogs] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPerdiemDialogOpen, setIsPerdiemDialogOpen] = useState(false);
  const [isTransportDialogOpen, setIsTransportDialogOpen] = useState(false);
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      quotation_number: `QT-${Date.now()}`,
      user_id: "",
      use_tax: true,
      discount_amount: 0,
      perdiem_price: 0,
      perdiem_qty: 0,
      transport_price: 0,
      transport_qty: 0,
      items: [{ service_id: "", equipment_id: "", qty: 1, price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = watch("items");
  const watchedUseTax = watch("use_tax");
  const watchedDiscount = watch("discount_amount") || 0;
  const watchedPerdiemPrice = watch("perdiem_price") || 0;
  const watchedPerdiemQty = watch("perdiem_qty") || 0;
  const watchedTransportPrice = watch("transport_price") || 0;
  const watchedTransportQty = watch("transport_qty") || 0;

  const itemsSubtotal = watchedItems.reduce((acc, item) => acc + (item.qty * item.price || 0), 0);
  const perdiemTotal = watchedPerdiemPrice * watchedPerdiemQty;
  const transportTotal = watchedTransportPrice * watchedTransportQty;
  
  const subtotalBeforeDiscount = itemsSubtotal + perdiemTotal + transportTotal;
  const subtotal = subtotalBeforeDiscount - watchedDiscount;
  const tax = watchedUseTax ? subtotal * 0.11 : 0;
  const total = subtotal + tax;

  const loadData = async () => {
    setLoading(true);
    try {
      const [qResult, cResult, sResult, oResult, eResult] = await Promise.all([
        getQuotations(page, limit, search),
        getClients(),
        getAllServices(),
        getOperationalCatalogs(1, 100, ""),
        getAllEquipment()
      ]);
      setData(qResult);
      setClients(cResult);
      setServices(sResult);
      setOperationalCatalogs(oResult);
      setEquipment(eResult);
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
      await createQuotation({
        ...formData,
        subtotal: subtotalBeforeDiscount,
        tax_amount: tax,
        total_amount: total
      });
      toast.success("Penawaran berhasil dibuat", {
        description: `No. Penawaran: ${formData.quotation_number}`
      });
      setIsDialogOpen(false);
      reset();
      loadData();
    } catch (error: any) {
      toast.error("Gagal menyimpan penawaran", {
        description: error?.message || "Terjadi kesalahan saat menyimpan data"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleServiceChange = (index: number, serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setValue(`items.${index}.service_id`, serviceId);
      setValue(`items.${index}.price`, Number(service.price));
    }
  };

  const handleDelete = async (id: string) => {
    toast.warning("Hapus Penawaran?", {
      description: "Data ini akan dihapus permanen.",
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            await deleteQuotation(id);
            toast.success("Penawaran berhasil dihapus");
            loadData();
          } catch (error) {
            toast.error("Gagal menghapus penawaran");
          }
        }
      }
    });
  };

  const handleBulkDelete = async () => {
    toast.warning(`Hapus ${selectedIds.length} penawaran?`, {
      description: "Data akan dihapus permanen.",
      action: {
        label: "Hapus Masal",
        onClick: async () => {
          try {
            await deleteManyQuotations(selectedIds);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-slate-100 text-slate-700";
      case "sent": return "bg-blue-100 text-blue-700";
      case "accepted": return "bg-emerald-100 text-emerald-700";
      case "rejected": return "bg-red-100 text-red-700";
      default: return "bg-slate-100";
    }
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Penawaran Harga</h1>
          <p className="text-slate-500 text-sm">Kelola semua quotation untuk pelanggan laboratorium.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} className="animate-in fade-in zoom-in duration-200">
              <Trash2 className="mr-2 h-4 w-4" /> Hapus ({selectedIds.length})
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) reset();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 cursor-pointer flex-1 md:flex-none">
                <Plus className="mr-2 h-4 w-4" /> Buat Penawaran
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-emerald-900 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Buat Penawaran Harga Baru
                </DialogTitle>
                <DialogDescription>
                  Silakan pilih pelanggan dan tambahkan layanan yang diminta.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">No. Penawaran</label>
                    <Input {...register("quotation_number")} placeholder="QT-XXXXXX" required className="focus-visible:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Pilih Pelanggan</label>
                    <Select onValueChange={(val) => setValue("user_id", val)}>
                      <SelectTrigger className="cursor-pointer focus:ring-emerald-500">
                        <SelectValue placeholder="Pilih Pelanggan" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id} className="cursor-pointer">
                            {client.full_name} ({client.company_name || "Personal"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-emerald-800">Daftar Item</h3>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 cursor-pointer" onClick={() => setIsEquipmentDialogOpen(true)}>
                        <Wrench className="mr-2 h-3 w-3" /> Sewa Alat
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 cursor-pointer" onClick={() => append({ service_id: "", equipment_id: "", qty: 1, price: 0 })}>
                        <Plus className="mr-2 h-3 w-3" /> Tambah Manual
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {fields.map((field, index) => {
                      const item = watchedItems[index];
                      const isEquipment = !!item?.equipment_id;
                      const eq = equipment.find((e: any) => e.id === item?.equipment_id);
                      const svc = services.find((s: any) => s.id === item?.service_id);

                      return (
                        <div key={field.id} className="flex flex-col md:flex-row gap-3 items-end bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex-1 w-full space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">
                              {isEquipment ? "Alat" : "Layanan"}
                            </label>
                            {isEquipment ? (
                              <div className="h-10 flex items-center px-3 bg-white rounded-md border">
                                <span className="font-medium text-slate-800">{eq?.name || "Alat"}</span>
                              </div>
                            ) : (
                              <Select onValueChange={(val) => handleServiceChange(index, val)}>
                                <SelectTrigger className="bg-white cursor-pointer focus:ring-emerald-500">
                                  <SelectValue placeholder="Pilih Layanan" />
                                </SelectTrigger>
                                <SelectContent>
                                  {services.map(s => (
                                    <SelectItem key={s.id} value={s.id} className="cursor-pointer">
                                      [{s.category}] {s.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <div className="w-full md:w-20 space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Qty</label>
                            <Input
                              type="number"
                              {...register(`items.${index}.qty`, { valueAsNumber: true })}
                              className="bg-white focus-visible:ring-emerald-500"
                            />
                          </div>
                          <div className="w-full md:w-32 space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Harga Satuan</label>
                            <Input
                              type="number"
                              {...register(`items.${index}.price`, { valueAsNumber: true })}
                              className="bg-white focus-visible:ring-emerald-500"
                            />
                          </div>
                          <div className="w-full md:w-32 space-y-1 text-right">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Subtotal</label>
                            <div className="h-10 flex items-center justify-end px-3 font-semibold text-emerald-700">
                              {(watchedItems[index]?.qty * watchedItems[index]?.price || 0).toLocaleString("id-ID")}
                            </div>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer" onClick={() => remove(index)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-emerald-800">Biaya Operasional Lapangan</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Biaya Perdiem (Engineer/2 Orang)</label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                          onClick={() => setIsPerdiemDialogOpen(true)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Pilih dari Katalog
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            type="number"
                            {...register("perdiem_price", { valueAsNumber: true })}
                            placeholder="Harga/Hari"
                            className="bg-white focus-visible:ring-emerald-500"
                          />
                        </div>
                        <div className="w-20">
                          <Input
                            type="number"
                            {...register("perdiem_qty", { valueAsNumber: true })}
                            placeholder="Hari"
                            className="bg-white focus-visible:ring-emerald-500"
                          />
                        </div>
                      </div>
                      <div className="text-right text-xs font-semibold text-emerald-700">
                        Total: Rp {perdiemTotal.toLocaleString("id-ID")}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase text-slate-400">Transportasi & Akomodasi</label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                          onClick={() => setIsTransportDialogOpen(true)}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Pilih dari Katalog
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            type="number"
                            {...register("transport_price", { valueAsNumber: true })}
                            placeholder="Harga/Satuan"
                            className="bg-white focus-visible:ring-emerald-500"
                          />
                        </div>
                        <div className="w-20">
                          <Input
                            type="number"
                            {...register("transport_qty", { valueAsNumber: true })}
                            placeholder="Vol"
                            className="bg-white focus-visible:ring-emerald-500"
                          />
                        </div>
                      </div>
                      <div className="text-right text-xs font-semibold text-emerald-700">
                        Total: Rp {transportTotal.toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-3 pt-4 border-t">
                  <div className="flex justify-between w-full md:w-80 text-sm items-center">
                    <span className="text-slate-500 font-medium">Subtotal Biaya:</span>
                    <span className="font-semibold">Rp {subtotalBeforeDiscount.toLocaleString("id-ID")}</span>
                  </div>
                  
                  <div className="flex justify-between w-full md:w-80 text-sm items-center">
                    <span className="text-slate-500 font-medium">Diskon Khusus:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Rp</span>
                      <Input 
                        type="number" 
                        {...register("discount_amount", { valueAsNumber: true })} 
                        className="h-8 w-32 text-right font-semibold text-red-600 focus-visible:ring-red-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between w-full md:w-80 text-sm items-center">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="use_tax" 
                        checked={watchedUseTax} 
                        onCheckedChange={(checked) => setValue("use_tax", checked === true)} 
                      />
                      <label htmlFor="use_tax" className="text-slate-500 font-medium cursor-pointer">PPN (11%)</label>
                    </div>
                    <span className={`font-semibold ${!watchedUseTax ? 'text-slate-300 line-through' : ''}`}>
                      Rp {tax.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="flex justify-between w-full md:w-80 text-lg font-bold text-emerald-900 border-t pt-2 mt-2">
                    <span>TOTAL AKHIR:</span>
                    <span>Rp {total.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 shadow-lg shadow-emerald-200 cursor-pointer" disabled={submitting}>
                    {submitting && <ChemicalLoader size="sm" />}
                    Simpan & Selesaikan Penawaran
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Perdiem Selection Dialog */}
          <Dialog open={isPerdiemDialogOpen} onOpenChange={setIsPerdiemDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-emerald-900 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Pilih Biaya Perdiem dari Katalog
                </DialogTitle>
                <DialogDescription>
                  Pilih tarif perdiem engineer yang sudah dikonfigurasi.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
                {operationalCatalogs.filter((c: any) => c.category === "perdiem").length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>Belum ada data perdiem di katalog.</p>
                    <Link href="/admin/engineer-costs" className="text-emerald-600 hover:underline text-sm font-medium mt-2 inline-block">
                      Tambah data di menu Biaya Engineer →
                    </Link>
                  </div>
                ) : (
                  operationalCatalogs
                    .filter((c: any) => c.category === "perdiem")
                    .map((catalog: any) => (
                      <div
                        key={catalog.id}
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer"
                        onClick={() => {
                          setValue("perdiem_price", Number(catalog.price));
                          setValue("perdiem_qty", 1);
                          setIsPerdiemDialogOpen(false);
                          toast.success(`"${catalog.name}" dipilih`);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{catalog.name}</p>
                            <p className="text-xs text-slate-500">{catalog.description || "Tidak ada deskripsi"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-700">Rp {Number(catalog.price).toLocaleString("id-ID")}</p>
                          <p className="text-xs text-slate-400">/{catalog.unit}</p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Transport Selection Dialog */}
          <Dialog open={isTransportDialogOpen} onOpenChange={setIsTransportDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-emerald-900 flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Pilih Biaya Transport dari Katalog
                </DialogTitle>
                <DialogDescription>
                  Pilih tarif transportasi dan akomodasi yang sudah dikonfigurasi.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
                {operationalCatalogs.filter((c: any) => c.category === "transport").length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Truck className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>Belum ada data transport di katalog.</p>
                    <Link href="/admin/transport-costs" className="text-emerald-600 hover:underline text-sm font-medium mt-2 inline-block">
                      Tambah data di menu Biaya Transport →
                    </Link>
                  </div>
                ) : (
                  operationalCatalogs
                    .filter((c: any) => c.category === "transport")
                    .map((catalog: any) => (
                      <div
                        key={catalog.id}
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer"
                        onClick={() => {
                          setValue("transport_price", Number(catalog.price));
                          setValue("transport_qty", 1);
                          setIsTransportDialogOpen(false);
                          toast.success(`"${catalog.name}" dipilih`);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <Truck className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{catalog.name}</p>
                            <p className="text-xs text-slate-500">{catalog.description || "Tidak ada deskripsi"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-700">Rp {Number(catalog.price).toLocaleString("id-ID")}</p>
                          <p className="text-xs text-slate-400">/{catalog.unit}</p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Equipment Selection Dialog */}
          <Dialog open={isEquipmentDialogOpen} onOpenChange={setIsEquipmentDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-emerald-900 flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Pilih Alat dari Katalog
                </DialogTitle>
                <DialogDescription>
                  Pilih alat dan peralatan laboratorium yang ingin disewa.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
                {equipment.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Wrench className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>Belum ada alat di katalog.</p>
                    <Link href="/admin/equipment" className="text-emerald-600 hover:underline text-sm font-medium mt-2 inline-block">
                      Tambah data di menu Sewa Alat →
                    </Link>
                  </div>
                ) : (
                  equipment
                    .filter((eq: any) => eq.availability_status === "available")
                    .map((eq: any) => (
                      <div
                        key={eq.id}
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer"
                        onClick={() => {
                          try {
                            append({
                              service_id: "",
                              equipment_id: eq.id,
                              qty: 1,
                              price: Number(eq.price),
                              name: eq.name,
                              specification: eq.specification,
                              unit: eq.unit
                            });
                            setIsEquipmentDialogOpen(false);
                            toast.success("Alat berhasil ditambahkan", {
                              description: `${eq.name} telah ditambahkan ke penawaran`
                            });
                          } catch (error) {
                            toast.error("Gagal menambahkan alat", {
                              description: "Silakan coba lagi"
                            });
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <Wrench className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{eq.name}</p>
                            <p className="text-xs text-slate-500">{eq.specification || eq.category || "Tidak ada spesifikasi"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-700">Rp {Number(eq.price).toLocaleString("id-ID")}</p>
                          <p className="text-xs text-slate-400">/{eq.unit || "unit"}</p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden transition-all duration-300">
        <div className="p-5 border-b bg-emerald-50/5 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input 
              placeholder="Cari nomor penawaran atau klien..." 
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
              <TableRow className="bg-slate-50/80">
                <TableHead className="w-12 px-6">
                  <Checkbox 
                    checked={data.items.length > 0 && selectedIds.length === data.items.length} 
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-[150px] font-bold text-emerald-900 px-4">No. Penawaran</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Klien</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Tanggal</TableHead>
                                    <TableHead className="text-right font-bold text-emerald-900 px-4">Total Amount</TableHead>
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
                                    Belum ada penawaran harga yang dibuat.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                data.items.map((item: any) => (
                                  <TableRow key={item.id} className="hover:bg-emerald-50/10 transition-colors">
                                    <TableCell className="px-6">
                                      <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
                                    </TableCell>
                                    <TableCell className="font-bold text-emerald-900 px-4">{item.quotation_number}</TableCell>
                                    <TableCell className="px-4">
                                      <div className="flex flex-col">
                                        <span className="font-medium text-slate-800">{item.profile.full_name}</span>
                                        <span className="text-xs text-slate-400">{item.profile.company_name || "Personal"}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600 text-sm px-4">
                                      {new Date(item.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-900 px-4">
                                      Rp {Number(item.total_amount).toLocaleString("id-ID")}
                                    </TableCell>
                                    <TableCell className="px-4">
                                      <Badge variant="secondary" className={getStatusColor(item.status)}>
                                        {item.status.toUpperCase()}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-center px-6">
                                      <div className="flex justify-center gap-1">
                                        <Link href={`/admin/quotations/${item.id}`}>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 cursor-pointer">
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                        </Link>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 cursor-pointer">
                                              <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem className="text-emerald-600 cursor-pointer font-medium">
                                              <FileDown className="mr-2 h-4 w-4" /> Unduh PDF
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-red-600 cursor-pointer font-medium">
                                              <Trash2 className="mr-2 h-4 w-4" /> Hapus Permanen
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
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
            <div className="p-10 text-center text-slate-500">Belum ada penawaran.</div>
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
                        <h4 className="font-bold text-emerald-900">{item.quotation_number}</h4>
                        <p className="text-sm font-medium text-slate-800">{item.profile.full_name}</p>
                        <p className="text-[10px] text-slate-400">{item.profile.company_name || "Personal"}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={getStatusColor(item.status)}>
                      {item.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-end pt-2 border-t border-slate-50 mt-2">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-400">Total Penawaran</p>
                      <p className="text-sm font-bold text-slate-900">
                        Rp {Number(item.total_amount).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/admin/quotations/${item.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 cursor-pointer">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 cursor-pointer">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-emerald-600 font-medium cursor-pointer">
                            <FileDown className="mr-2 h-4 w-4" /> Unduh PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-red-600 font-medium cursor-pointer">
                            <Trash2 className="mr-2 h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-500 font-medium">
              Total <span className="text-emerald-700">{data.total}</span> data penawaran
            </p>
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
