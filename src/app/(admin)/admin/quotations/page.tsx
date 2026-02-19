// ============================================================================
// OPTIMIZED QUOTATIONS PAGE - v2.0
// Fitur Optimasi:
// 1. ✅ Loading Modal saat menyimpan
// 2. ✅ AlertDialog untuk konfirmasi hapus
// 3. ✅ Export/Import CSV
// 4. ✅ Empty state yang lebih menarik
// 5. ✅ Filter by status
// 6. ✅ Stats bar (Total, Draft, Sent, Accepted, dll)
// 7. ✅ Bulk delete dengan validasi
// 8. ✅ Quick view detail
// ============================================================================

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
  Download,
  Upload,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  DollarSign
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
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";

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

const statusOptions = [
  { value: "all", label: "Semua Status", color: "bg-slate-100 text-slate-700" },
  { value: "draft", label: "Draft", color: "bg-slate-100 text-slate-700 border-slate-200", icon: FileText },
  { value: "sent", label: "Terkirim", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Send },
  { value: "accepted", label: "Diterima", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle },
  { value: "rejected", label: "Ditolak", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  { value: "paid", label: "Dibayar", color: "bg-purple-100 text-purple-700 border-purple-200", icon: DollarSign }
];

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
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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
    } catch (error: any) {
      toast.error("Gagal memuat data", {
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
    setShowSubmitModal(true);
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
        description: error?.message || "Silakan coba lagi"
      });
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const handleServiceChange = (index: number, serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setValue(`items.${index}.service_id`, serviceId);
      setValue(`items.${index}.price`, Number(service.price));
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteQuotation(deleteId);
      loadData();
      toast.success("Penawaran berhasil dihapus", {
        description: "Data telah dihapus permanen"
      });
      setDeleteId(null);
    } catch (error: any) {
      toast.error("Gagal menghapus penawaran", {
        description: error?.message || "Silakan coba lagi"
      });
    }
  };

  const handleBulkDelete = () => {
    setDeleteId("bulk");
  };

  const confirmBulkDelete = async () => {
    try {
      await deleteManyQuotations(selectedIds);
      loadData();
      toast.success(`${selectedIds.length} penawaran berhasil dihapus`);
      setDeleteId(null);
    } catch (error: any) {
      toast.error("Gagal menghapus penawaran", {
        description: error?.message || "Silakan coba lagi"
      });
    }
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

  // Export CSV
  const handleExport = () => {
    const headers = ["No. Penawaran", "Pelanggan", "Tanggal", "Status", "Total Amount", "Perusahaan"];
    const csvData = data.items.map((item: any) => [
      item.quotation_number,
      item.profile.full_name,
      new Date(item.date).toISOString().split('T')[0],
      item.status,
      item.total_amount,
      item.profile.company_name || "Personal"
    ]);
    
    const csv = [
      headers.join(","),
      ...csvData.map((row: string[]) => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quotations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Data berhasil diexport", {
      description: "File CSV telah diunduh"
    });
  };

  // Import CSV
  const handleImport = async () => {
    try {
      const lines = importData.trim().split("\n");
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
        // Simple import - create basic quotation
        await createQuotation({
          quotation_number: values[0],
          user_id: clients[0]?.id, // Use first client
          subtotal: parseFloat(values[4]) || 0,
          tax_amount: 0,
          total_amount: parseFloat(values[4]) || 0,
          items: []
        });
      }
      
      toast.success("Import berhasil", {
        description: `${lines.length - 1} penawaran berhasil diimport`
      });
      setIsImportDialogOpen(false);
      setImportData("");
      loadData();
    } catch (error: any) {
      toast.error("Gagal import data", {
        description: error?.message || "Format CSV tidak valid"
      });
    }
  };

  // Filter & Sort
  const getFilteredAndSortedData = () => {
    let filtered = [...data.items];
    
    // Search
    if (search) {
      filtered = filtered.filter(item => 
        item.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
        item.profile.full_name.toLowerCase().includes(search.toLowerCase()) ||
        item.profile.company_name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(item => item.status === filterStatus);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === "total") {
        comparison = Number(a.total_amount) - Number(b.total_amount);
      } else if (sortBy === "number") {
        comparison = a.quotation_number.localeCompare(b.quotation_number);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    return filtered;
  };

  const filteredItems = getFilteredAndSortedData();

  // Stats
  const stats = {
    total: data.items.length,
    draft: data.items.filter((i: any) => i.status === "draft").length,
    sent: data.items.filter((i: any) => i.status === "sent").length,
    accepted: data.items.filter((i: any) => i.status === "accepted").length,
    rejected: data.items.filter((i: any) => i.status === "rejected").length,
    paid: data.items.filter((i: any) => i.status === "paid").length
  };

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.color || "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getStatusIcon = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    const Icon = option?.icon || FileText;
    return <Icon className="h-3 w-3 mr-1" />;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'DRAFT';
      case 'sent': return 'TERKIRIM';
      case 'accepted': return 'DITERIMA';
      case 'rejected': return 'DITOLAK';
      case 'paid': return 'DIBAYAR';
      default: return status.toUpperCase();
    }
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header dengan Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Penawaran Harga</h1>
          <p className="text-slate-500 text-sm">Kelola semua quotation untuk pelanggan laboratorium.</p>
        </div>

        <div className="flex gap-2 flex-wrap w-full md:w-auto">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} className="animate-in fade-in zoom-in duration-200 cursor-pointer">
              <Trash2 className="mr-2 h-4 w-4" /> Hapus ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleExport} className="cursor-pointer">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)} className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button onClick={() => {
            reset();
            setIsDialogOpen(true);
          }} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 cursor-pointer flex-1 md:flex-none">
            <Plus className="mr-2 h-4 w-4" /> Buat Penawaran
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Draft</span>
          </div>
          <p className="text-2xl font-bold text-slate-700">{stats.draft}</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Send className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-blue-500">Terkirim</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{stats.sent}</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-500">Diterima</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{stats.accepted}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="h-4 w-4 text-red-400" />
            <span className="text-xs font-medium text-red-500">Ditolak</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
        </div>
        <div className="bg-white rounded-xl border border-purple-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-medium text-purple-500">Dibayar</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">{stats.paid}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 cursor-pointer">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {statusOptions.filter(opt => opt.value !== "all").map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 cursor-pointer">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Tanggal</SelectItem>
                <SelectItem value="total">Total Amount</SelectItem>
                <SelectItem value="number">No. Penawaran</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="cursor-pointer"
            >
              <svg className={`h-4 w-4 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </div>

          <div className="text-sm text-slate-500">
            {filteredItems.length} dari {data.total} penawaran
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
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
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
                        <FileText className="h-10 w-10 text-emerald-300" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-slate-700">Belum ada penawaran harga</p>
                        <p className="text-sm text-slate-500 mt-1">Mulai dengan membuat penawaran pertama Anda</p>
                      </div>
                      <Button
                        onClick={() => {
                          reset();
                          setIsDialogOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Buat Penawaran
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item: any) => (
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
                      {new Date(item.date).toLocaleDateString("id-ID", {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-700 px-4">
                      Rp {Number(item.total_amount).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge variant="outline" className={cn("capitalize", getStatusColor(item.status))}>
                        {getStatusIcon(item.status)}
                        {getStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center px-6">
                      <div className="flex justify-center gap-1">
                        <Link href={`/admin/quotations/${item.id}`}>
                          <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50 cursor-pointer">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 cursor-pointer">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-red-600 cursor-pointer">
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
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-10 text-center">
              <ChemicalLoader />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                <FileText className="h-8 w-8 text-emerald-300" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-700">Belum ada penawaran</p>
                <p className="text-xs text-slate-500 mt-1">Mulai dengan membuat penawaran</p>
              </div>
              <Button
                onClick={() => {
                  reset();
                  setIsDialogOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" /> Buat Penawaran
              </Button>
            </div>
          ) : (
            filteredItems.map((item: any) => (
              <div key={item.id} className="p-4 space-y-3 bg-white active:bg-slate-50">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-600" />
                      <h4 className="font-bold text-slate-900">{item.quotation_number}</h4>
                    </div>
                    <p className="text-sm text-slate-700">{item.profile.full_name}</p>
                    <p className="text-xs text-slate-400">{item.profile.company_name || "Personal"}</p>
                  </div>
                  <Badge variant="outline" className={cn("capitalize", getStatusColor(item.status))}>
                    {getStatusIcon(item.status)}
                    {getStatusLabel(item.status)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-xs text-slate-400">
                    {new Date(item.date).toLocaleDateString("id-ID", {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/quotations/${item.id}`}>
                      <Button variant="outline" size="sm" className="text-emerald-600 hover:bg-emerald-50 cursor-pointer">
                        <Eye className="h-4 w-4 mr-1" />
                        Detail
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-500 font-medium">
              Total {data.total} penawaran
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

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Konfirmasi Hapus
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="pt-4 text-sm text-muted-foreground">
                {deleteId === "bulk" ? (
                  <>
                    <p>Apakah Anda yakin ingin menghapus <strong className="text-slate-900">{selectedIds.length} penawaran</strong> terpilih?</p>
                    <p className="mt-2 text-sm text-amber-600 font-medium">⚠️ Tindakan ini tidak dapat dibatalkan.</p>
                  </>
                ) : (
                  <>
                    <p>Apakah Anda yakin ingin menghapus penawaran ini?</p>
                    <p className="mt-2 text-sm text-amber-600 font-medium">⚠️ Data akan dihapus permanen.</p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteId === "bulk" ? confirmBulkDelete : confirmDelete}
              className="bg-red-600 hover:bg-red-700 cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data CSV
            </DialogTitle>
            <DialogDescription>
              Paste data CSV dengan format: No. Penawaran, Pelanggan, Tanggal, Status, Total Amount, Perusahaan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg text-xs font-mono">
              <p className="font-semibold mb-1">Format:</p>
              <p>QT-001,John Doe,2025-02-19,draft,1000000,PT ABC</p>
            </div>
            <textarea
              className="w-full h-40 p-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Paste CSV data here..."
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} className="cursor-pointer">
              Batal
            </Button>
            <Button onClick={handleImport} className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Loading Modal */}
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
