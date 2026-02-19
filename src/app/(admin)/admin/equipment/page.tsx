// ============================================================================
// OPTIMIZED EQUIPMENT PAGE - v2.0
// Fitur Optimasi:
// 1. ✅ Loading Modal saat menyimpan
// 2. ✅ AlertDialog untuk konfirmasi hapus
// 3. ✅ Export/Import CSV
// 4. ✅ Empty state yang lebih menarik
// 5. ✅ Quick Edit harga di tabel
// 6. ✅ Color scale untuk availability status
// 7. ✅ Filter & Search advanced
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Wrench,
  Download,
  Upload,
  X,
  Check,
  AlertCircle,
  Tag,
  DollarSign
} from "lucide-react";
import { ChemicalLoader } from "@/components/ui";
import { getEquipment, createOrUpdateEquipment, deleteEquipment, deleteManyEquipment } from "@/lib/actions/equipment";
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
import { cn } from "@/lib/utils";
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
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<string>("");
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickEditPrice, setQuickEditPrice] = useState<number>(0);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { register, handleSubmit, reset, setValue, watch } = useForm();

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
    setShowSubmitModal(true);
    setSubmitting(true);
    try {
      await createOrUpdateEquipment(formData, editingItem?.id);
      setIsDialogOpen(false);
      reset();
      setEditingItem(null);
      loadData();
      toast.success(editingItem ? "Alat diperbarui" : "Alat baru ditambahkan", {
        description: `${formData.name} berhasil ${editingItem ? 'diperbarui' : 'ditambahkan'}`
      });
    } catch (error: any) {
      toast.error("Gagal menyimpan data alat", {
        description: error?.message || "Silakan coba lagi"
      });
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
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

  const handleDelete = (id: string) => {
    setDeleteItemId(id);
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    try {
      await deleteEquipment(deleteItemId);
      loadData();
      toast.success("Alat berhasil dihapus", {
        description: "Data telah dihapus dari katalog"
      });
      setDeleteItemId(null);
    } catch (error: any) {
      toast.error("Gagal menghapus alat", {
        description: error?.message || "Silakan coba lagi"
      });
    }
  };

  const handleBulkDelete = () => {
    setDeleteItemId("bulk");
  };

  const confirmBulkDelete = async () => {
    try {
      await deleteManyEquipment(selectedIds);
      loadData();
      toast.success(`${selectedIds.length} alat berhasil dihapus`, {
        description: "Data telah dihapus dari katalog"
      });
      setDeleteItemId(null);
    } catch (error: any) {
      toast.error("Gagal menghapus data alat", {
        description: error?.message || "Silakan coba lagi"
      });
    }
  };

  // Quick Edit Handler
  const handleQuickEdit = (item: any) => {
    setQuickEditId(item.id);
    setQuickEditPrice(Number(item.price));
  };

  const handleQuickEditSave = async (id: string, oldPrice: number, newPrice: number) => {
    try {
      await createOrUpdateEquipment({ price: newPrice }, id);
      toast.success("Harga berhasil diperbarui", {
        description: `Rp ${oldPrice.toLocaleString()} → Rp ${newPrice.toLocaleString()}`
      });
      setQuickEditId(null);
      loadData();
    } catch (error: any) {
      toast.error("Gagal update harga", {
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
    const headers = ["Nama Alat", "Kategori", "Spesifikasi", "Harga", "Unit", "Status", "Jumlah", "Deskripsi"];
    const csvData = data.items.map((item: any) => [
      item.name,
      item.category,
      item.specification,
      item.price,
      item.unit,
      item.availability_status,
      item.quantity,
      item.description || ""
    ]);
    
    const csv = [
      headers.join(","),
      ...csvData.map((row: any[]) => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `equipment-${new Date().toISOString().split('T')[0]}.csv`;
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
        await createOrUpdateEquipment({
          name: values[0],
          category: values[1],
          specification: values[2],
          price: parseFloat(values[3]),
          unit: values[4] || "unit",
          availability_status: values[5] || "available",
          quantity: parseInt(values[6]) || 1,
          description: values[7] || ""
        });
      }
      
      toast.success("Import berhasil", {
        description: `${lines.length - 1} alat berhasil diimport`
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
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(item => item.availability_status === filterStatus);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "price") {
        comparison = Number(a.price) - Number(b.price);
      } else if (sortBy === "quantity") {
        comparison = (a.quantity || 0) - (b.quantity || 0);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    return filtered;
  };

  const filteredItems = getFilteredAndSortedData();

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
      {/* Header dengan Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Sewa Alat</h1>
          <p className="text-slate-500 text-sm">Kelola katalog alat dan peralatan laboratorium yang tersedia untuk disewa.</p>
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
            setEditingItem(null);
            setIsDialogOpen(true);
          }} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 cursor-pointer flex-1 md:flex-none">
            <Plus className="mr-2 h-4 w-4" /> Tambah Alat
          </Button>
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
                {availabilityStatusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 cursor-pointer">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nama</SelectItem>
                <SelectItem value="price">Harga</SelectItem>
                <SelectItem value="quantity">Jumlah</SelectItem>
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
            {filteredItems.length} dari {data.total} alat
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-emerald-50/10 flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              placeholder="Cari nama alat, kategori, atau deskripsi..."
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
                <TableHead className="text-right font-bold text-emerald-900 px-4">Harga Sewa</TableHead>
                <TableHead className="text-center font-bold text-emerald-900 px-4">Status</TableHead>
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
                        <Wrench className="h-10 w-10 text-emerald-300" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-slate-700">Belum ada alat</p>
                        <p className="text-sm text-slate-500 mt-1">Mulai dengan menambahkan alat pertama Anda</p>
                      </div>
                      <Button
                        onClick={() => setIsDialogOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Tambah Alat
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item: any) => {
                  const isQuickEditing = quickEditId === item.id;
                  return (
                    <TableRow key={item.id} className="hover:bg-emerald-50/10 transition-colors">
                      <TableCell className="px-6">
                        <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <Wrench className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800">{item.name}</span>
                            {item.description && (
                              <p className="text-xs text-slate-500 truncate max-w-xs">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {item.category || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm px-4 max-w-xs truncate">
                        {item.specification || "-"}
                      </TableCell>
                      <TableCell className="text-right px-4">
                        {isQuickEditing ? (
                          <div className="flex items-center gap-2 justify-end">
                            <Input
                              type="number"
                              value={quickEditPrice}
                              onChange={(e) => setQuickEditPrice(Number(e.target.value))}
                              className="w-32 h-8 text-right"
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-emerald-600"
                              onClick={() => handleQuickEditSave(item.id, Number(item.price), quickEditPrice)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600"
                              onClick={() => setQuickEditId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 justify-end">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              Rp {Number(item.price).toLocaleString("id-ID")}
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-slate-400 hover:text-emerald-600"
                              onClick={() => handleQuickEdit(item)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center px-4">
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
                  );
                })
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
                <Wrench className="h-8 w-8 text-emerald-300" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-700">Belum ada alat</p>
                <p className="text-xs text-slate-500 mt-1">Mulai dengan menambahkan alat</p>
              </div>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" /> Tambah Alat
              </Button>
            </div>
          ) : (
            filteredItems.map((item: any) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={cn("p-4 space-y-3 transition-colors", isSelected ? 'bg-emerald-50/50' : 'bg-white active:bg-slate-50')}
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
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                          <Wrench className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">
                              {item.category || "No category"}
                            </Badge>
                            {getStatusBadge(item.availability_status)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-700">
                        Rp {Number(item.price).toLocaleString("id-ID")}
                      </p>
                      <p className="text-[10px] text-slate-400">/{item.unit || "unit"}</p>
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

        {/* Pagination */}
        <div className="p-4 border-t flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-500 font-medium">Total {data.total} alat</p>
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          reset();
          setEditingItem(null);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-emerald-900 flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              {editingItem ? "Edit" : "Tambah"} Alat Baru
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
              <Select onValueChange={(val) => setValue("availability_status", val)} defaultValue={watch("availability_status") || "available"}>
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
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 cursor-pointer" disabled={submitting}>
                {editingItem ? "Simpan Perubahan" : "Tambahkan ke Katalog"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteItemId !== null} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Konfirmasi Hapus
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="pt-4 text-sm text-muted-foreground">
                {deleteItemId === "bulk" ? (
                  <>
                    <p>Apakah Anda yakin ingin menghapus <strong className="text-slate-900">{selectedIds.length} alat</strong> terpilih?</p>
                    <p className="mt-2 text-sm text-amber-600 font-medium">⚠️ Tindakan ini tidak dapat dibatalkan.</p>
                  </>
                ) : (
                  <>
                    <p>Apakah Anda yakin ingin menghapus alat ini?</p>
                    <p className="mt-2 text-sm text-amber-600 font-medium">⚠️ Data akan dihapus permanen dari katalog.</p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteItemId === "bulk" ? confirmBulkDelete : confirmDelete}
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
              Paste data CSV dengan format: Nama, Kategori, Spesifikasi, Harga, Unit, Status, Jumlah, Deskripsi
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg text-xs font-mono">
              <p className="font-semibold mb-1">Format:</p>
              <p>Nama,Kategori,Spesifikasi,Harga,Unit,Status,Jumlah,Deskripsi</p>
              <p className="text-slate-500">Gas Chromatograph,Instrumentasi,GC-2010 Plus,500000,hari,available,1,Alat untuk...</p>
            </div>
            <textarea
              className="w-full h-40 p-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Paste CSV data here..."
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={handleImport}
              className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
            >
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
