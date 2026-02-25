// ============================================================================
// STABLE QUOTATIONS PAGE (OPERATOR) - v3.0 (Simplified Layout)
// Refactored to match Admin UX with Operator restrictions.
// Fitur:
// 1. ✅ No Tabs (Single Page Form) - Fix Infinite Loop Error
// 2. ✅ Katalog Selection (Perdiem, Transport, Alat)
// 3. ✅ Tambah Customer Baru Langsung
// 4. ✅ Keyboard Shortcuts (Alt+N, Alt+P, Alt+T, Alt+E, Alt+K, Ctrl+Enter)
// 5. ✅ Duplicate & Status Update
// ============================================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  MoreVertical,
  Eye,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  DollarSign,
  Truck,
  Wrench,
  Copy,
  MapPin,
  Car,
  X,
  Clock,
  Check,
  AlertCircle
} from "lucide-react";
import { ChemicalLoader, LoadingOverlay, LoadingButton } from "@/components/ui";
import { 
  getQuotations, 
  deleteQuotation, 
  createQuotation, 
  getNextInvoiceNumber,
  cloneQuotation,
  updateQuotationStatus
} from "@/lib/actions/quotation";
import { getClients, createOrUpdateUser } from "@/lib/actions/users";
import { getProfile } from "@/lib/actions/auth";
import { getAllServices } from "@/lib/actions/services";
import { getAllOperationalCatalogs } from "@/lib/actions/operational-catalog";
import { getAllEquipment } from "@/lib/actions/equipment";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

// Stat Card Component
function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    red: "bg-red-50 text-red-600 border-red-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  return (
    <Card className={cn("border-none shadow-sm", colors[color])}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={cn("p-2 rounded-xl bg-white shadow-sm shrink-0")}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase opacity-60 tracking-wider truncate">{title}</p>
          <p className="text-lg font-black tracking-tight leading-none">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const quotationSchema = z.object({
  quotation_number: z.string().min(1, "Nomor penawaran wajib diisi"),
  user_id: z.string().optional().nullable(),
  use_tax: z.boolean().default(true),
  discount_amount: z.coerce.number().default(0),
  perdiem_name: z.string().optional().nullable(),
  perdiem_price: z.coerce.number().default(0),
  perdiem_qty: z.coerce.number().default(0),
  transport_name: z.string().optional().nullable(),
  transport_price: z.coerce.number().default(0),
  transport_qty: z.coerce.number().default(0),
  items: z.array(z.object({
    service_id: z.string().optional().nullable(),
    equipment_id: z.string().optional().nullable(),
    qty: z.coerce.number().default(1),
    price: z.coerce.number().default(0),
    name: z.string().optional().nullable(),
    parameters: z.array(z.string()).optional(),
  })).default([]),
});

const statusOptions = [
  { value: "all", label: "Semua Status", color: "bg-slate-100 text-slate-700" },
  { value: "draft", label: "Draft", color: "bg-slate-100 text-slate-700 border-slate-200", icon: FileText },
  { value: "accepted", label: "Diterima", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
  { value: "rejected", label: "Ditolak", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  { value: "paid", label: "Dibayar", color: "bg-purple-100 text-purple-700 border-purple-200", icon: DollarSign }
];

export default function OperatorQuotationListPage() {
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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Form Hooks
  const { register, control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(quotationSchema),
    mode: 'onChange',
    defaultValues: {
      quotation_number: "INV-",
      user_id: "",
      use_tax: true,
      discount_amount: 0,
      perdiem_name: "",
      perdiem_price: 0,
      perdiem_qty: 0,
      transport_name: "",
      transport_price: 0,
      transport_qty: 0,
      items: [{ service_id: "", equipment_id: "", qty: 1, price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  // Watches for Calculations
  const watchedItems = watch("items") || [];
  const watchedUseTax = watch("use_tax");
  const watchedDiscount = Number(watch("discount_amount")) || 0;
  const watchedPerdiemPrice = Number(watch("perdiem_price")) || 0;
  const watchedPerdiemQty = watch("perdiem_qty") || 0;
  const watchedTransportPrice = Number(watch("transport_price")) || 0;
  const watchedTransportQty = watch("transport_qty") || 0;
  const watchedPerdiemName = watch("perdiem_name");
  const watchedTransportName = watch("transport_name");

  // Logic Calculations
  const itemsSubtotal = watchedItems.reduce((acc: number, item: any) => acc + (Number(item.qty || 0) * Number(item.price || 0)), 0);
  const perdiemTotal = Number(watchedPerdiemPrice) * Number(watchedPerdiemQty);
  const transportTotal = Number(watchedTransportPrice) * Number(watchedTransportQty);
  const subtotalBeforeDiscount = itemsSubtotal + perdiemTotal + transportTotal;
  const subtotal = subtotalBeforeDiscount - Number(watchedDiscount);
  const tax = watchedUseTax ? subtotal * 0.11 : 0;
  const total = subtotal + tax;

  // Keyboard Shortcuts Logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDialogOpen) return;
      
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(onSubmit)();
        return;
      }

      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'n': 
            e.preventDefault();
            append({ service_id: "", equipment_id: "", qty: 1, price: 0 }); 
            break;
          case 'p': 
            e.preventDefault();
            setIsPerdiemDialogOpen(true); 
            break;
          case 't': 
            e.preventDefault();
            setIsTransportDialogOpen(true); 
            break;
          case 'e': 
            e.preventDefault();
            setIsEquipmentDialogOpen(true); 
            break;
          case 'k': 
            e.preventDefault();
            setIsCustomerDialogOpen(true); 
            break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDialogOpen, handleSubmit, append]);

  const [customerData, setCustomerData] = useState({
    full_name: "",
    email: "",
    company_name: "",
    address: "",
    password: "123456"
  });

  const handleCreateCustomer = async () => {
    if (!customerData.full_name || !customerData.email) {
      toast.error("Nama dan Email wajib diisi");
      return;
    }
    setSubmitting(true);
    try {
      await createOrUpdateUser({ ...customerData, role: 'client' });
      toast.success("Customer baru berhasil ditambahkan");
      setIsCustomerDialogOpen(false);
      const cResult = await getClients();
      setClients(cResult);
      setCustomerData({ full_name: "", email: "", company_name: "", address: "", password: "123456" });
    } catch (error: any) {
      toast.error("Gagal menambahkan customer", { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = (formData: any) => {
    if (!formData.user_id || formData.user_id === "") {
      toast.error("Data Belum Lengkap", { description: "Silakan pilih pelanggan terlebih dahulu." });
      return;
    }

    const servicesItems = formData.items.filter((item: any) => item.service_id);
    const equipmentItems = formData.items.filter((item: any) => item.equipment_id);

    if (servicesItems.length === 0) {
      toast.error("Layanan Wajib Diisi", { description: "Harap tambahkan minimal 1 layanan laboratorium." });
      return;
    }

    const hasIncompleteService = servicesItems.some((item: any) => !item.service_id || Number(item.price) <= 0);
    if (hasIncompleteService) {
      toast.error("Layanan Belum Lengkap", { description: "Pastikan semua baris layanan sudah dipilih dan harga sudah terisi." });
      return;
    }

    if (equipmentItems.length > 0) {
      const hasIncompleteEquipment = equipmentItems.some((item: any) => Number(item.price) <= 0);
      if (hasIncompleteEquipment) {
        toast.error("Harga Alat Belum Terisi", { description: "Ada sewa alat yang harganya masih 0 atau kosong." });
        return;
      }
    }

    if (!formData.perdiem_name || formData.perdiem_name.trim() === "") {
      toast.error("Perdiem Wajib Diisi", { description: "Harap pilih atau isi keterangan Perdiem (Bisa via Katalog)." });
      return;
    }
    if (Number(formData.perdiem_price) <= 0 || Number(formData.perdiem_qty) <= 0) {
      toast.error("Detail Perdiem Tidak Valid", { description: "Harga dan hari perdiem harus lebih dari 0." });
      return;
    }

    if (!formData.transport_name || formData.transport_name.trim() === "") {
      toast.error("Transport Wajib Diisi", { description: "Harap pilih atau isi keterangan Transport (Bisa via Katalog)." });
      return;
    }
    if (Number(formData.transport_price) <= 0 || Number(formData.transport_qty) <= 0) {
      toast.error("Detail Transport Tidak Valid", { description: "Harga dan qty transport harus lebih dari 0." });
      return;
    }

    setPendingFormData(formData);
    setIsSaveConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingFormData) return;
    
    setIsSaveConfirmOpen(false);
    setSubmitting(true);
    try {
      const result = await createQuotation({
        ...pendingFormData,
        subtotal: subtotalBeforeDiscount,
        tax_amount: tax,
        total_amount: total
      });
      
      if (result.success) {
        toast.success("Penawaran berhasil disimpan", { description: "Status otomatis menjadi DRAFT" });
        setIsDialogOpen(false);
        reset();
        loadData();
      }
    } catch (error: any) {
      toast.error("Gagal menyimpan penawaran", { description: error?.message || "Silakan coba lagi" });
    } finally {
      setSubmitting(false);
      setPendingFormData(null);
    }
  };

  const onInvalid = (errors: any) => {
    console.error("Hook Form Errors:", errors);
    toast.error("Form Belum Lengkap", { description: "Mohon periksa kembali inputan Anda, pastikan data wajib sudah terisi." });
  };

  const handleServiceChange = (index: number, serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setValue(`items.${index}.service_id`, serviceId);
      setValue(`items.${index}.price`, Number(service.price));
      
      if (service.parameters) {
        try {
          const params = typeof service.parameters === 'string' ? JSON.parse(service.parameters) : service.parameters;
          const paramNames = Array.isArray(params) ? params.map((p: any) => p.name) : [];
          setValue(`items.${index}.parameters`, paramNames);
        } catch (e) {
          setValue(`items.${index}.parameters`, []);
        }
      } else {
        setValue(`items.${index}.parameters`, []);
      }
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [qResult, cResult, sResult, oResult, eResult, prof] = await Promise.all([
        getQuotations(page, limit, search),
        getClients(),
        getAllServices(),
        getAllOperationalCatalogs(),
        getAllEquipment(),
        getProfile()
      ]);
      
      setData(qResult);
      setClients(cResult);
      setServices(sResult);
      setOperationalCatalogs(oResult);
      setEquipment(eResult);
      setUserProfile(prof);
    } catch (error: any) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (isDialogOpen) {
      getNextInvoiceNumber().then(num => setValue("quotation_number", num));
    }
  }, [isDialogOpen, setValue]);

  const handleDelete = (id: string) => setDeleteId(id);
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await deleteQuotation(deleteId, userProfile?.id, userProfile?.role);
      if (res.success) {
        toast.success(res.message || "Penawaran dihapus");
        loadData();
      }
      setDeleteId(null);
    } catch (error: any) {
      toast.error("Gagal menghapus");
    }
  };

  const handleClone = async (id: string) => {
    try {
      const result = await cloneQuotation(id);
      if (result.success) { toast.success("Duplikasi berhasil"); loadData(); }
    } catch (error: any) {
      toast.error("Gagal duplikasi");
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateQuotationStatus(id, status);
      toast.success("Status diperbarui");
      loadData();
    } catch (error: any) {
      toast.error("Gagal update status");
    }
  };

  const getFilteredAndSortedData = () => {
    let filtered = [...data.items];
    if (search) {
      filtered = filtered.filter(item => 
        item.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
        item.profile.full_name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter(item => item.status === filterStatus);
    }
    filtered.sort((a, b) => {
      let comp = 0;
      if (sortBy === "date") comp = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortBy === "total") comp = Number(a.total_amount) - Number(b.total_amount);
      else if (sortBy === "number") comp = a.quotation_number.localeCompare(b.quotation_number);
      return sortOrder === "asc" ? comp : -comp;
    });
    return filtered;
  };

  const filteredItems = getFilteredAndSortedData();

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.color || "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': 
      case 'sent': return 'DRAFT';
      case 'accepted': return 'DITERIMA';
      case 'rejected': return 'DITOLAK';
      case 'paid': return 'DIBAYAR';
      default: return status.toUpperCase();
    }
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Penawaran Harga</h1>
          <p className="text-slate-500 text-sm">Kelola penawaran harga laboratorium (Operator).</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <StatCard title="Total" value={data.total} icon={FileText} color="emerald" />
        <StatCard title="Draft" value={data.items.filter((i: any) => i.status === 'draft' || i.status === 'sent').length} icon={Clock} color="amber" />
        <StatCard title="Diterima" value={data.items.filter((i: any) => i.status === 'accepted').length} icon={CheckCircle} color="blue" />
        <StatCard title="Ditolak" value={data.items.filter((i: any) => i.status === 'rejected').length} icon={XCircle} color="red" />
        <StatCard title="Lunas" value={data.items.filter((i: any) => i.status === 'paid').length} icon={DollarSign} color="purple" />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-emerald-50/5 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              placeholder="Cari nomor penawaran atau klien..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 h-11 focus-visible:ring-emerald-500 rounded-lg"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-end">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40 h-11 rounded-lg border-slate-200 bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <Button 
              onClick={() => { reset(); setIsDialogOpen(true); }} 
              size="icon"
              className="bg-emerald-600 hover:bg-emerald-700 shadow-lg cursor-pointer h-11 w-11 shrink-0"
              title="Buat Penawaran Baru"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 font-bold">
              <TableHead className="w-12 px-6">No</TableHead>
              <TableHead className="px-4">No. Penawaran</TableHead>
              <TableHead className="px-4">Klien</TableHead>
              <TableHead className="px-4 text-right">Total Tagihan</TableHead>
              <TableHead className="px-4 text-center">Status</TableHead>
              <TableHead className="px-6 text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="py-4"><div className="h-10 bg-slate-50 animate-pulse rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : filteredItems.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-400">Data tidak ditemukan.</TableCell></TableRow>
            ) : (
              filteredItems.map((item: any, idx: number) => (
                <TableRow key={item.id} className="hover:bg-emerald-50/5">
                  <TableCell className="px-6 text-slate-400 text-xs font-bold">{idx + 1 + (page - 1) * limit}</TableCell>
                  <TableCell className="font-bold text-emerald-900 px-4">{item.quotation_number}</TableCell>
                  <TableCell className="px-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-800">{item.profile.full_name}</span>
                      <span className="text-[10px] text-slate-400 uppercase">{item.profile.company_name || "Personal"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-700 px-4">Rp {Number(item.total_amount).toLocaleString("id-ID")}</TableCell>
                  <TableCell className="px-4 text-center">
                    <Badge variant="outline" className={cn("capitalize text-[10px]", getStatusColor(item.status))}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center px-6">
                    <div className="flex justify-center gap-2">
                      <Link href={`/operator/quotations/${item.id}`}>
                        <Button variant="ghost" size="icon" className="text-emerald-600 hover:bg-emerald-50 h-9 w-9 rounded-xl transition-all active:scale-90" title="Lihat Detail">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all active:scale-90">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleClone(item.id)}><Copy className="mr-2 h-4 w-4" /> Duplikasi</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStatusUpdate(item.id, 'accepted')}>Tandai Diterima</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Hapus
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

        <div className="p-4 border-t flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-500 font-medium">Total {data.total} penawaran</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9 w-9 rounded-xl border-slate-200 hover:bg-emerald-50 text-emerald-600" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="flex items-center px-4 text-xs font-bold bg-white border border-slate-200 rounded-xl shadow-sm text-slate-600">{page} / {data.pages}</div>
            <Button variant="outline" size="sm" className="h-9 w-9 rounded-xl border-slate-200 hover:bg-emerald-50 text-emerald-600" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* CREATE QUOTATION DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-3xl">
          <div className="bg-emerald-700/80 backdrop-blur-md p-4 text-white sticky top-0 z-20 border-b border-emerald-600/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/20 shadow-inner">
                  <FileText className="h-4 w-4" />
                </div>
                <DialogTitle className="text-base font-black uppercase tracking-widest">Buat Penawaran Baru</DialogTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)} className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl h-8 w-8 transition-all"><X className="h-4 w-4" /></Button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="p-6 space-y-6">
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center text-[9px]">01</span>
                Informasi Pelanggan
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nomor Penawaran</label>
                  <Input {...register("quotation_number")} readOnly className="bg-slate-100 font-mono font-bold text-emerald-700 h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Pelanggan</label>
                    <Button type="button" variant="link" size="sm" className="h-auto p-0 text-emerald-600 font-bold text-[10px]" onClick={() => setIsCustomerDialogOpen(true)}>+ BARU (Alt+K)</Button>
                  </div>
                  <Controller
                    control={control}
                    name="user_id"
                    render={({ field }) => (
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger className="h-9 border-slate-300 bg-white text-xs"><SelectValue placeholder="Pilih klien..." /></SelectTrigger>
                        <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.full_name} - {c.company_name || "Personal"}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center text-[9px]">02</span>
                  Layanan & Parameter
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ service_id: "", equipment_id: "", qty: 1, price: 0 })} className="border-emerald-600 text-emerald-700 font-bold h-7 text-[10px]">Tambah Item (Alt+N)</Button>
              </div>
              <div className="space-y-2">
                {fields.map((field, index) => {
                  if (watchedItems[index]?.equipment_id) return null;
                  const itemParams = watchedItems[index]?.parameters || [];
                  return (
                    <div key={field.id} className="bg-white border border-slate-100 p-4 rounded-2xl relative shadow-sm hover:border-emerald-200 transition-all space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-6 space-y-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Layanan Lab</label>
                          <Controller
                            control={control}
                            name={`items.${index}.service_id`}
                            render={({ field }) => (
                              <Select value={field.value || ""} onValueChange={(val) => { field.onChange(val); handleServiceChange(index, val); }}>
                                <SelectTrigger className="h-9 border-slate-200 text-xs"><SelectValue placeholder="Pilih layanan..." /></SelectTrigger>
                                <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}</SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1 text-center"><label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Qty</label><Input type="number" {...register(`items.${index}.qty`)} className="h-9 text-center font-bold text-xs" /></div>
                        <div className="md:col-span-3 space-y-1"><label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Harga (Rp)</label><Input type="number" {...register(`items.${index}.price`)} className="h-9 font-bold text-emerald-700 text-xs" /></div>
                        <div className="md:col-span-1"><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="w-full h-9 text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button></div>
                      </div>
                      {itemParams.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {itemParams.map((param: string, pIdx: number) => (
                            <Badge key={`${index}-${pIdx}`} variant="secondary" className="text-[8px] font-bold bg-blue-50 text-blue-600 border border-blue-100 pl-2 pr-1 py-0.5 rounded-md flex items-center gap-1 group/tag">
                              {param}
                              <button type="button" onClick={() => { const newList = [...itemParams]; newList.splice(pIdx, 1); setValue(`items.${index}.parameters`, newList); }} className="hover:bg-blue-200 rounded-sm p-0.5 transition-colors"><X className="h-2 w-2" /></button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center text-[9px]">03</span>
                Biaya Tambahan
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 shadow-sm relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700"><MapPin className="h-3 w-3 text-emerald-500" /><span className="text-[11px] font-bold uppercase tracking-tight">Perdiem</span></div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsPerdiemDialogOpen(true)} className="h-6 text-[8px] font-black border-emerald-300 text-emerald-700 bg-white">KATALOG (Alt+P)</Button>
                  </div>
                  {watchedPerdiemName && <p className="text-[9px] text-emerald-600 font-bold bg-emerald-100/50 px-2 py-0.5 rounded w-fit italic">{watchedPerdiemName}</p>}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><span className="text-[8px] font-bold text-slate-400">HARGA</span><Input type="number" {...register("perdiem_price")} className="h-8 bg-white font-bold text-xs" /></div>
                    <div className="space-y-1"><span className="text-[8px] font-bold text-slate-400">HARI</span><Input type="number" {...register("perdiem_qty")} className="h-8 bg-white text-center font-bold text-xs" /></div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 shadow-sm relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700"><Car className="h-3 w-3 text-blue-500" /><span className="text-[11px] font-bold uppercase tracking-tight">Transport</span></div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsTransportDialogOpen(true)} className="h-6 text-[8px] font-black border-blue-300 text-blue-700 bg-white">KATALOG (Alt+T)</Button>
                  </div>
                  {watchedTransportName && <p className="text-[9px] text-blue-600 font-bold bg-blue-100/50 px-2 py-0.5 rounded w-fit italic">{watchedTransportName}</p>}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><span className="text-[8px] font-bold text-slate-400">HARGA</span><Input type="number" {...register("transport_price")} className="h-8 bg-white font-bold text-xs" /></div>
                    <div className="space-y-1"><span className="text-[8px] font-bold text-slate-400">QTY</span><Input type="number" {...register("transport_qty")} className="h-8 bg-white text-center font-bold text-xs" /></div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-[11px] uppercase tracking-tight"><Wrench className="h-3 w-3 text-amber-500" /> Sewa Alat Tambahan</div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsEquipmentDialogOpen(true)} className="h-6 text-[8px] font-black border-amber-300 text-amber-700 bg-white uppercase">Katalog Alat (Alt+E)</Button>
                </div>
                <div className="space-y-2">
                  {fields.filter((item: any) => item.equipment_id).length === 0 ? (
                    <div className="text-center py-2 bg-white/50 rounded-lg border border-dashed border-slate-300"><span className="text-[10px] text-slate-400 italic">Belum ada alat dipilih...</span></div>
                  ) : (
                    fields.map((field, index) => {
                      if (!watchedItems[index]?.equipment_id) return null;
                      return (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end bg-white border border-slate-200 p-2 rounded-lg shadow-sm">
                          <div className="md:col-span-5 flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center text-amber-600 shrink-0"><Wrench className="h-3 w-3" /></div>
                            <span className="text-[10px] font-bold text-slate-700 truncate">{watchedItems[index]?.name}</span>
                          </div>
                          <div className="md:col-span-3"><Input type="number" {...register(`items.${index}.price`)} className="h-7 text-[10px] font-bold bg-slate-50 border-none" /></div>
                          <div className="md:col-span-2"><Input type="number" {...register(`items.${index}.qty`)} className="h-7 text-[10px] font-bold text-center bg-slate-50 border-none" /></div>
                          <div className="md:col-span-2 flex justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-6 w-6 text-slate-300 hover:text-red-500"><XCircle className="h-3 w-3" /></Button></div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center text-[9px]">04</span>
                Pajak & Total
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diskon (Rp)</label><Input type="number" {...register("discount_amount")} className="h-9 font-bold text-sm rounded-lg" /></div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100">
                    <Checkbox id="use_tax" checked={watchedUseTax} onCheckedChange={(val) => setValue("use_tax", val === true)} className="h-4 w-4" />
                    <label htmlFor="use_tax" className="text-xs font-bold text-slate-700 cursor-pointer">Gunakan Pajak PPN (11%)</label>
                  </div>
                </div>
                <div className="bg-emerald-950 p-6 rounded-[1.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center border-2 border-emerald-900">
                  <div className="relative space-y-2">
                    <div className="flex justify-between text-[10px] font-black opacity-50 uppercase tracking-[2px]"><span>Subtotal</span><span>Rp {subtotalBeforeDiscount.toLocaleString("id-ID")}</span></div>
                    <div className="flex justify-between text-[10px] font-black text-red-400 uppercase tracking-[2px]"><span>Diskon</span><span>- Rp {watchedDiscount.toLocaleString("id-ID")}</span></div>
                    {watchedUseTax && <div className="flex justify-between text-[10px] font-black text-emerald-400 uppercase tracking-[2px]"><span>Pajak 11%</span><span>Rp {tax.toLocaleString("id-ID")}</span></div>}
                    <div className="border-t border-white/10 pt-3 mt-2 flex justify-between items-end">
                      <span className="text-[10px] font-black text-emerald-300 uppercase tracking-[3px]">TOTAL</span>
                      <span className="text-2xl font-black font-mono tracking-tighter">Rp {total.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t -mx-6 px-8 py-4 mt-6 flex items-center justify-between z-30">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estimasi</span>
                <span className="text-xl font-black text-emerald-800 font-mono tracking-tight leading-none">Rp {total.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold text-slate-400 text-xs uppercase px-6 h-10 rounded-xl">Batal</Button>
                <LoadingButton type="submit" loading={submitting} loadingText="MEMPROSES..." className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-emerald-900/20 text-xs tracking-wide uppercase transition-all active:scale-95 group">
                  <div className="flex flex-col items-center leading-none gap-1">
                    <span className="flex items-center gap-2">SIMPAN DRAFT <FileText className="h-4 w-4" /></span>
                    <span className="text-[7px] opacity-60 font-bold tracking-[0.1em] hidden md:block lowercase">[ ctrl + enter ]</span>
                  </div>
                </LoadingButton>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="sm:max-w-[425px] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600"><Trash2 className="h-5 w-5" /> Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="pt-4 text-sm text-muted-foreground">
                <p>Apakah Anda yakin ingin menghapus penawaran ini?</p>
                <p className="mt-2 text-sm text-amber-600 font-medium italic flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Catatan: Penghapusan oleh Operator memerlukan persetujuan Admin.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 rounded-xl cursor-pointer"><Trash2 className="mr-2 h-4 w-4" /> Ya, Ajukan Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Catalog Dialogs */}
      <Dialog open={isPerdiemDialogOpen} onOpenChange={setIsPerdiemDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl"><DialogHeader><DialogTitle>Katalog Perdiem</DialogTitle></DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2 py-4">
            {operationalCatalogs.filter(c => c.category === 'perdiem').map(c => (
              <div key={c.id} className="p-4 border rounded-2xl hover:bg-emerald-50 cursor-pointer flex justify-between items-center group"
                onClick={() => { setValue("perdiem_name", c.name); setValue("perdiem_price", Number(c.price)); setValue("perdiem_qty", 1); setIsPerdiemDialogOpen(false); }}>
                <div><p className="font-bold text-slate-800">{c.name}</p><p className="text-xs text-slate-500">{c.location}</p></div>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all">Rp {Number(c.price).toLocaleString("id-ID")}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTransportDialogOpen} onOpenChange={setIsTransportDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl"><DialogHeader><DialogTitle>Katalog Transport</DialogTitle></DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2 py-4">
            {operationalCatalogs.filter(c => c.category === 'transport').map(c => (
              <div key={c.id} className="p-4 border rounded-2xl hover:bg-blue-50 cursor-pointer flex justify-between items-center group"
                onClick={() => { setValue("transport_name", c.name); setValue("transport_price", Number(c.price)); setValue("transport_qty", 1); setIsTransportDialogOpen(false); }}>
                <div><p className="font-bold text-slate-800">{c.name}</p><p className="text-xs text-slate-500">{c.unit}</p></div>
                <span className="font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">Rp {Number(c.price).toLocaleString("id-ID")}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEquipmentDialogOpen} onOpenChange={setIsEquipmentDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl"><DialogHeader><DialogTitle>Katalog Alat Laboratorium</DialogTitle></DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2 py-4 px-1">
            {equipment.map((eq) => {
              const isSelected = watchedItems.some((item: any) => item.equipment_id === eq.id);
              return (
                <div key={eq.id} className={cn("flex items-center justify-between p-4 border rounded-2xl hover:bg-amber-50 cursor-pointer transition-all", isSelected ? "bg-amber-50 border-amber-300 ring-1 ring-amber-300" : "bg-white border-slate-200")}
                  onClick={() => {
                    if (isSelected) {
                      const itemIndex = watchedItems.findIndex((item: any) => item.equipment_id === eq.id);
                      if (itemIndex > -1) remove(itemIndex);
                    } else {
                      append({ service_id: "", equipment_id: eq.id, qty: 1, price: Number(eq.price), name: eq.name });
                    }
                    setIsEquipmentDialogOpen(false);
                  }}>
                  <div className="flex items-center gap-4"><div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", isSelected ? "bg-amber-200 text-amber-700" : "bg-slate-100 text-slate-400")}><Wrench className="h-6 w-6" /></div>
                    <div><p className="font-bold text-slate-800">{eq.name}</p><p className="text-xs text-slate-500 font-medium">{eq.specification}</p></div></div>
                  <div className="text-right"><p className="font-black text-amber-700">Rp {Number(eq.price).toLocaleString("id-ID")}</p><p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">per {eq.unit}</p></div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isSaveConfirmOpen} onOpenChange={setIsSaveConfirmOpen}>
        <AlertDialogContent className="sm:max-w-[425px] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-emerald-600"><Check className="h-5 w-5" /> Konfirmasi Simpan</AlertDialogTitle>
            <AlertDialogDescription className="pt-4">Apakah Anda yakin ingin menyimpan penawaran ini? Pastikan semua rincian sudah benar.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer">Ya, Simpan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LoadingOverlay isOpen={submitting} title="Menyimpan Penawaran..." description="Mohon tunggu sebentar, penawaran sedang diproses" />

      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl">
          <DialogHeader><DialogTitle>Tambah Customer Baru</DialogTitle><DialogDescription>Masukkan data lengkap pelanggan baru.<span className="block mt-2 text-xs font-bold text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">Password default: 123456</span></DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><label className="text-sm font-medium">Nama Lengkap *</label><Input placeholder="John Doe" value={customerData.full_name} onChange={(e) => setCustomerData({...customerData, full_name: e.target.value})} className="rounded-xl" /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Email *</label><Input type="email" placeholder="john@example.com" value={customerData.email} onChange={(e) => setCustomerData({...customerData, email: e.target.value})} className="rounded-xl" /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Nama Perusahaan</label><Input placeholder="PT. XYZ" value={customerData.company_name} onChange={(e) => setCustomerData({...customerData, company_name: e.target.value})} className="rounded-xl" /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Alamat</label><Input placeholder="Jl. XYZ No. 123..." value={customerData.address} onChange={(e) => setCustomerData({...customerData, address: e.target.value})} className="rounded-xl" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsCustomerDialogOpen(false)} className="rounded-xl">Batal</Button><LoadingButton onClick={handleCreateCustomer} loading={submitting} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-8">Simpan Customer</LoadingButton></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
