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

import React, { useState, useEffect, useRef } from "react";
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
import { ChemicalLoader, LoadingOverlay, LoadingButton } from "@/components/ui";
import { getEquipment, createOrUpdateEquipment, deleteEquipment, deleteManyEquipment } from "@/lib/actions/equipment";
import { getCategories, createOrUpdateCategory } from "@/lib/actions/categories";
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
import * as XLSX from "xlsx";
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickEditPrice, setQuickEditPrice] = useState<number>(0);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [categories, setCategories] = useState<any[]>([]);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [equipmentResult, categoriesResult] = await Promise.all([
        getEquipment(page, limit, search),
        getCategories()
      ]);
      setData(equipmentResult);
      setCategories(categoriesResult.items || []);
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
        description: `${formData.name} berhasil ${editingItem ? 'diperbarui' : 'ditambahkan'}`
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
    setValue("availability_status", item.availability_status);
    setValue("quantity", item.quantity);
    setValue("description", item.description);
    setValue("image_url", item.image_url);
    setIsDialogOpen(true);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Nama kategori tidak boleh kosong");
      return;
    }

    const trimmedName = newCategoryName.trim();
    
    // Cek apakah kategori sudah ada
    const existingCategory = categories.find(
      (cat: any) => cat.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingCategory) {
      toast.error("Kategori sudah ada", {
        description: `"${trimmedName}" sudah terdaftar dalam katalog`
      });
      return;
    }

    setCreatingCategory(true);
    try {
      await createOrUpdateCategory({ name: trimmedName });
      toast.success("Kategori berhasil dibuat", {
        description: `"${trimmedName}" telah ditambahkan`
      });
      setNewCategoryName("");
      setIsCategoryDialogOpen(false);
      // Reload categories
      const categoriesResult = await getCategories();
      setCategories(categoriesResult.items || []);
      // Set the new category as selected
      setValue("category", trimmedName);
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat kategori");
    } finally {
      setCreatingCategory(false);
    }
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
    const headers = ["Nama Alat", "Kategori", "Spesifikasi", "Harga", "Status", "Jumlah", "Deskripsi"];
    const csvData = data.items.map((item: any) => [
      item.name,
      item.category,
      item.specification,
      item.price,
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

  const handleDownloadTemplate = () => {
    const templateHeaders = [
      "Nama",
      "Kategori",
      "Spesifikasi",
      "Harga",
      "Status",
      "Jumlah",
      "Deskripsi",
      "Unit",
      "Image URL"
    ];
    const templateRow = [
      "Gas Chromatograph",
      "Instrumentasi",
      "GC-2010 Plus",
      "500000",
      "available",
      "1",
      "Alat untuk analisis sampel",
      "unit",
      ""
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([templateHeaders, templateRow]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Equipment Template");
    XLSX.writeFile(workbook, `template-equipment-${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Template berhasil diunduh");
  };

  const resetImportState = () => {
    setImportFile(null);
    if (importFileRef.current) {
      importFileRef.current.value = "";
    }
  };

  const parseImportRows = async (file: File) => {
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith(".csv")) {
      const text = await file.text();
      const workbook = XLSX.read(text, { type: "string" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      return XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "" });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "" });
  };

  // Import Excel/CSV
  const handleImport = async () => {
    try {
      if (!importFile) {
        toast.error("Pilih file Excel atau CSV terlebih dahulu");
        return;
      }

      const rows = await parseImportRows(importFile);
      if (!rows || rows.length < 2) {
        toast.error("File tidak memiliki data yang valid");
        return;
      }

      const headerRow = rows[0].map((cell) => String(cell).trim().toLowerCase());
      const getValue = (row: any[], keys: string[], fallbackIndex?: number) => {
        for (const key of keys) {
          const idx = headerRow.findIndex((header) => header === key);
          if (idx !== -1) return row[idx];
        }
        return fallbackIndex !== undefined ? row[fallbackIndex] : "";
      };

      let successCount = 0;
      let errorCount = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] || [];
        const name = String(getValue(row, ["nama alat", "nama", "name"], 0)).trim();
        if (!name) continue;

        try {
          await createOrUpdateEquipment({
            name,
            category: String(getValue(row, ["kategori", "category"], 1)).trim(),
            specification: String(getValue(row, ["spesifikasi", "specification"], 2)).trim(),
            price: parseFloat(String(getValue(row, ["harga sewa", "harga", "price"], 3))) || 0,
            availability_status: String(getValue(row, ["status", "availability_status"], 4)).trim() || "available",
            quantity: parseInt(String(getValue(row, ["jumlah", "quantity"], 5))) || 1,
            description: String(getValue(row, ["deskripsi", "description"], 6)).trim(),
            unit: String(getValue(row, ["unit", "satuan"], 7)).trim() || "unit",
            image_url: String(getValue(row, ["image_url", "url gambar", "gambar"], 8)).trim(),
          });
          successCount++;
        } catch {
          errorCount++;
        }
      }

      toast.success("Import berhasil", {
        description: `${successCount} alat berhasil diimport${errorCount > 0 ? `, ${errorCount} gagal` : ""}`
      });
      setIsImportDialogOpen(false);
      resetImportState();
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
      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Sewa Alat</h1>
            <p className="text-slate-500 text-sm">Kelola katalog alat dan peralatan laboratorium yang tersedia untuk disewa.</p>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
              <Input
                placeholder="Cari nama alat, kategori, atau deskripsi..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 h-11 focus-visible:ring-emerald-500 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleBulkDelete}
                  className="h-11 w-11 rounded-lg animate-in fade-in zoom-in duration-200 cursor-pointer shadow-sm"
                  title={`Hapus ${selectedIds.length} alat terpilih`}
                >
                  <Trash2 className="h-5 w-5" />
                  <span className="sr-only">Hapus ({selectedIds.length})</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={handleExport}
                className="h-11 w-11 rounded-lg cursor-pointer shadow-sm hover:bg-emerald-50 hover:border-emerald-200"
                title="Export CSV"
              >
                <Download className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsImportDialogOpen(true)}
                className="h-11 w-11 rounded-lg cursor-pointer shadow-sm hover:bg-emerald-50 hover:border-emerald-200"
                title="Import CSV"
              >
                <Upload className="h-5 w-5" />
              </Button>
              <Button
                onClick={() => {
                  reset();
                  setEditingItem(null);
                  setIsDialogOpen(true);
                }}
                className="h-11 w-11 rounded-lg cursor-pointer shadow-lg shadow-emerald-100 bg-emerald-600 hover:bg-emerald-700"
                title="Tambah Alat"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-emerald-50/10 flex items-center justify-between gap-4">
          <div className="text-sm font-medium text-slate-600">
            Daftar Katalog Alat Laboratorium
          </div>
          <div className="text-sm text-slate-500">
            {filteredItems.length} dari {data.total} alat
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
                <div className="flex gap-2">
                  <Select onValueChange={(val) => setValue("category", val)} defaultValue={watch("category")}>
                    <SelectTrigger className="flex-1 cursor-pointer focus:ring-emerald-500">
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.name} className="cursor-pointer">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCategoryDialogOpen(true)}
                    className="h-10 w-10 cursor-pointer hover:bg-emerald-50 hover:border-emerald-200"
                    title="Buat Kategori Baru"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Spesifikasi</label>
              <Input {...register("specification")} placeholder="Contoh: GC-2010 Plus, Shimadzu" className="focus-visible:ring-emerald-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Harga Sewa (Rp)</label>
                <Input {...register("price", { valueAsNumber: true })} type="number" placeholder="0" required className="focus-visible:ring-emerald-500" />
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
              <LoadingButton type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 cursor-pointer" loading={submitting} loadingText="Menyimpan...">
                {editingItem ? "Simpan Perubahan" : "Tambahkan ke Katalog"}
              </LoadingButton>
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
              Import Data Excel / CSV
            </DialogTitle>
            <DialogDescription>
              Pilih file Excel atau CSV dengan kolom: Nama, Kategori, Spesifikasi, Harga, Status, Jumlah, Deskripsi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">Format kolom</p>
                  <p className="text-xs text-slate-500">Nama, Kategori, Spesifikasi, Harga, Status, Jumlah, Deskripsi</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={handleDownloadTemplate}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Template
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => importFileRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Pilih File
                  </Button>
                </div>
              </div>
              <input
                ref={importFileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              <div className="rounded-lg border border-dashed border-emerald-200 bg-white p-3 text-xs text-slate-600">
                {importFile ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{importFile.name}</p>
                      <p className="text-slate-500">
                        {Math.round(importFile.size / 1024)} KB
                      </p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={resetImportState} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      Hapus
                    </Button>
                  </div>
                ) : (
                  <p>Belum ada file dipilih. Format yang didukung: .xlsx, .xls, .csv</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsImportDialogOpen(false);
                resetImportState();
              }}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={handleImport}
              disabled={!importFile}
              className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
            >
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => {
        setIsCategoryDialogOpen(open);
        if (!open) {
          setNewCategoryName("");
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-emerald-900 flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Buat Kategori Baru
            </DialogTitle>
            <DialogDescription>
              Tambahkan kategori baru untuk alat dan peralatan laboratorium.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Nama Kategori</label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Contoh: Instrumentasi, Spektrofotometri, dll"
                className="focus-visible:ring-emerald-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateCategory();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCategoryDialogOpen(false)}
                className="flex-1 cursor-pointer"
              >
                Batal
              </Button>
              <LoadingButton
                onClick={handleCreateCategory}
                disabled={creatingCategory || !newCategoryName.trim()}
                loading={creatingCategory}
                loadingText="Membuat..."
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" /> Buat Kategori
              </LoadingButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Loading Overlays */}
      <LoadingOverlay
        isOpen={submitting}
        title="Menyimpan Data..."
        description="Alat sedang disimpan ke katalog"
        variant="default"
      />
      
      <LoadingOverlay
        isOpen={creatingCategory}
        title="Menyimpan Kategori..."
        description="Kategori baru sedang dibuat"
        variant="default"
      />
    </div>
  );
}
