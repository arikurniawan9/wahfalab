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
  FileDown, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Search,
  MoreVertical,
  Eye,
  Trash,
  FileText
} from "lucide-react";
import { getQuotations, deleteQuotation, createQuotation, deleteManyQuotations } from "@/lib/actions/quotation";
import { getClients } from "@/lib/actions/users";
import { getAllServices } from "@/lib/actions/services";
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
  items: z.array(z.object({
    service_id: z.string().min(1),
    qty: z.number().min(1),
    price: z.number().min(0),
  })).min(1, "Minimal 1 item"),
});

export default function QuotationListPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      quotation_number: `QT-${Date.now()}`,
      user_id: "",
      items: [{ service_id: "", qty: 1, price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = watch("items");
  const subtotal = watchedItems.reduce((acc, item) => acc + (item.qty * item.price), 0);
  const tax = subtotal * 0.11;
  const total = subtotal + tax;

  const loadData = async () => {
    setLoading(true);
    try {
      const [qResult, cResult, sResult] = await Promise.all([
        getQuotations(page, limit, search),
        getClients(),
        getAllServices()
      ]);
      setData(qResult);
      setClients(cResult);
      setServices(sResult);
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
        subtotal,
        tax_amount: tax,
        total_amount: total
      });
      toast.success("Penawaran berhasil dibuat");
      setIsDialogOpen(false);
      reset();
      loadData();
    } catch (error) {
      toast.error("Gagal menyimpan penawaran");
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
                    <h3 className="font-bold text-emerald-800">Daftar Item Layanan</h3>
                    <Button type="button" variant="outline" size="sm" className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 cursor-pointer" onClick={() => append({ service_id: "", qty: 1, price: 0 })}>
                      <Plus className="mr-2 h-3 w-3" /> Tambah Item
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex flex-col md:flex-row gap-3 items-end bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex-1 w-full space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Layanan</label>
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
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2 pt-4 border-t">
                  <div className="flex justify-between w-full md:w-64 text-sm">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="font-semibold">Rp {subtotal.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between w-full md:w-64 text-sm">
                    <span className="text-slate-500">PPN (11%):</span>
                    <span className="font-semibold">Rp {tax.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between w-full md:w-64 text-lg font-bold text-emerald-900 border-t pt-2 mt-2">
                    <span>TOTAL:</span>
                    <span>Rp {total.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 shadow-lg shadow-emerald-200 cursor-pointer" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan & Selesaikan Penawaran
                  </Button>
                </DialogFooter>
              </form>
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
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
                                    <p className="mt-2 text-sm text-slate-500">Memuat data...</p>
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
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 cursor-pointer">
                                          <Eye className="h-4 w-4" />
                                        </Button>
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
            <div className="p-10 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
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
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 cursor-pointer">
                        <Eye className="h-4 w-4" />
                      </Button>
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
