// ============================================================================
// OPTIMIZED SERVICES PAGE - v2.0
// Fitur Optimasi:
// 1. ✅ Multi-input Parameters dengan tag (bisa hapus satu-satu)
// 2. ✅ Loading Modal saat menyimpan
// 3. ✅ Quick Edit harga di tabel
// 4. ✅ Export/Import CSV
// 5. ✅ Color scale untuk harga
// 6. ✅ Filter & Search advanced
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Search,
  Download,
  Upload,
  X,
  Check,
  AlertCircle,
  Tag,
  FileText
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { ChemicalLoader } from "@/components/ui";
import { getServices, createOrUpdateService, deleteService, deleteManyServices, getAllServices } from "@/lib/actions/services";
import { getAllCategories } from "@/lib/actions/categories";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Common parameter presets untuk laboratorium
const commonParameters = [
  "pH",
  "TSS",
  "BOD",
  "COD",
  "NH3",
  "Minyak & Lemak",
  "Fecal Coliform",
  "Total Coliform",
  "DO (Dissolved Oxygen)",
  "TDS",
  "Turbidity",
  "Suhu",
  "Konduktivitas",
  "Salinitas",
  "Nitrat",
  "Nitrit",
  "Phosphate",
  "Sulfida",
  "Klorin",
  "Ozon"
];

// Color scale untuk harga
const getPriceColor = (price: number, minPrice: number, maxPrice: number) => {
  const range = maxPrice - minPrice;
  if (range === 0) return "bg-white";
  
  const normalized = (price - minPrice) / range;
  
  if (normalized < 0.33) return "bg-emerald-50 text-emerald-700";
  if (normalized < 0.66) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
};

const getPriceBadgeColor = (price: number, minPrice: number, maxPrice: number) => {
  const range = maxPrice - minPrice;
  if (range === 0) return "bg-slate-100 text-slate-700";
  
  const normalized = (price - minPrice) / range;
  
  if (normalized < 0.33) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (normalized < 0.66) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
};

export default function ServicesPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [categories, setCategories] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickEditPrice, setQuickEditPrice] = useState<number>(0);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // Parameter input state
  const [parameterInput, setParameterInput] = useState("");
  const [parameterList, setParameterList] = useState<string[]>([]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [sResult, cResult] = await Promise.all([
        getServices(page, limit, search),
        getAllCategories()
      ]);
      setData(sResult);
      setCategories(cResult);
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
    setShowSubmitModal(true);
    setSubmitting(true);
    try {
      // Convert parameter list to JSON
      const parameters = parameterList.map(p => ({ name: p }));
      
      await createOrUpdateService({
        ...formData,
        parameters: JSON.stringify(parameters)
      }, editingItem?.id);
      
      setIsDialogOpen(false);
      reset();
      setEditingItem(null);
      setParameterList([]);
      loadData();
      
      toast.success(editingItem ? "Layanan diperbarui" : "Layanan baru ditambahkan", {
        description: `${formData.name} dengan ${parameterList.length} parameter`
      });
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
    setEditingItem(item);
    setValue("name", item.name);
    setValue("category_id", item.category_id);
    setValue("price", Number(item.price));
    setValue("unit", item.unit);
    setValue("regulation", item.regulation);
    
    // Parse parameters dari JSON atau string biasa
    if (item.parameters) {
      try {
        const params = typeof item.parameters === 'string' ? JSON.parse(item.parameters) : item.parameters;
        const paramNames = Array.isArray(params) ? params.map((p: any) => p.name) : [];
        setParameterList(paramNames);
      } catch (e) {
        // Jika bukan JSON, coba parse sebagai comma-separated string
        if (typeof item.parameters === 'string') {
          setParameterList(item.parameters.split(',').map((s: string) => s.trim()).filter(Boolean));
        } else {
          setParameterList([]);
        }
      }
    } else {
      setParameterList([]);
    }
    
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setDeleteItemId(id);
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    try {
      await deleteService(deleteItemId);
      loadData();
      toast.success("Layanan dihapus", {
        description: "Data telah dihapus dari katalog"
      });
      setDeleteItemId(null);
    } catch (error: any) {
      toast.error("Gagal menghapus data", {
        description: error?.message || "Silakan coba lagi"
      });
    }
  };

  const handleBulkDelete = async () => {
    setDeleteItemId("bulk");
  };

  const confirmBulkDelete = async () => {
    try {
      await deleteManyServices(selectedIds);
      loadData();
      toast.success(`${selectedIds.length} layanan berhasil dihapus`);
      setDeleteItemId(null);
    } catch (error: any) {
      toast.error("Gagal menghapus beberapa data", {
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
      await createOrUpdateService({ price: newPrice }, id);
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

  // Parameter handlers
  const handleAddParameter = () => {
    if (parameterInput.trim() && !parameterList.includes(parameterInput.trim())) {
      setParameterList([...parameterList, parameterInput.trim()]);
      setParameterInput("");
    }
  };

  const handleRemoveParameter = (index: number) => {
    setParameterList(parameterList.filter((_, i) => i !== index));
  };

  const handleSelectPreset = (param: string) => {
    if (!parameterList.includes(param)) {
      setParameterList([...parameterList, param]);
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
    const headers = ["Kategori", "Nama Layanan", "Harga", "Unit", "Regulasi", "Parameters"];
    const csvData = data.items.map((item: any) => {
      const params = item.parameters ? 
        (typeof item.parameters === 'string' ? item.parameters : JSON.stringify(item.parameters)) 
        : "";
      return [
        item.category_ref?.name || item.category,
        item.name,
        item.price,
        item.unit || "",
        item.regulation || "",
        params
      ];
    });
    
    const csv = [
      headers.join(","),
      ...csvData.map((row: any[]) => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `services-${new Date().toISOString().split('T')[0]}.csv`;
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
      const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
        const rowData: any = {};
        headers.forEach((h, idx) => {
          rowData[h.toLowerCase().replace(" ", "_")] = values[idx];
        });
        
        await createOrUpdateService({
          category_id: rowData.kategori,
          name: rowData.nama_layanan,
          price: parseFloat(rowData.harga),
          unit: rowData.unit || "sample",
          regulation: rowData.regulasi || "",
          parameters: rowData.parameters || "[]"
        });
      }
      
      toast.success("Import berhasil", {
        description: `${lines.length - 1} data berhasil diimport`
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
        item.category_ref?.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Filter by category
    if (filterCategory !== "all") {
      filtered = filtered.filter(item => item.category_id === filterCategory);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "price") {
        comparison = Number(a.price) - Number(b.price);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    return filtered;
  };

  const filteredItems = getFilteredAndSortedData();
  
  const prices = data.items.map((item: any) => Number(item.price));
  const minPrice = Math.min(...prices, 0);
  const maxPrice = Math.max(...prices, 0);

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header dengan Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Katalog Layanan</h1>
          <p className="text-slate-500 text-sm">Kelola daftar pengujian dan parameter laboratorium.</p>
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
            setParameterList([]);
            setIsDialogOpen(true);
          }} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 cursor-pointer flex-1 md:flex-none">
            <Plus className="mr-2 h-4 w-4" /> Tambah Layanan
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40 cursor-pointer">
                <SelectValue placeholder="Filter Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
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
            {filteredItems.length} dari {data.total} layanan
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-emerald-50/10 flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              placeholder="Cari kategori atau nama layanan..."
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
                <TableHead className="font-bold text-emerald-900 px-4">Kategori</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Nama Layanan</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Parameter</TableHead>
                <TableHead className="text-right font-bold text-emerald-900 px-4">Harga</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Unit</TableHead>
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
                  <TableCell colSpan={7} className="text-center py-20 text-slate-500">
                    Katalog masih kosong.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item: any) => {
                  const priceColor = getPriceBadgeColor(Number(item.price), minPrice, maxPrice);
                  const isQuickEditing = quickEditId === item.id;
                  const paramCount = item.parameters ? 
                    (() => {
                      try {
                        const params = typeof item.parameters === 'string' ? JSON.parse(item.parameters) : item.parameters;
                        return Array.isArray(params) ? params.length : 0;
                      } catch {
                        // Jika bukan JSON, hitung dari comma-separated string
                        return typeof item.parameters === 'string' ? item.parameters.split(',').filter(Boolean).length : 0;
                      }
                    })() : 0;

                  return (
                    <TableRow key={item.id} className={cn("hover:bg-emerald-50/10 transition-colors", getPriceColor(Number(item.price), minPrice, maxPrice))}>
                      <TableCell className="px-6">
                        <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
                      </TableCell>
                      <TableCell className="px-4">
                        <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                          {item.category_ref?.name || item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-800 px-4">{item.name}</TableCell>
                      <TableCell className="px-4">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Tag className="h-3 w-3 mr-1" />
                          {paramCount} parameter
                        </Badge>
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
                            <Badge variant="outline" className={priceColor}>
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
                      <TableCell className="text-slate-500 text-sm px-4">{item.unit || "-"}</TableCell>
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
            <div className="p-10 text-center text-slate-500">Katalog masih kosong.</div>
          ) : (
            filteredItems.map((item: any) => {
              const isSelected = selectedIds.includes(item.id);
              const paramCount = item.parameters ? 
                (() => {
                  try {
                    const params = typeof item.parameters === 'string' ? JSON.parse(item.parameters) : item.parameters;
                    return Array.isArray(params) ? params.length : 0;
                  } catch {
                    return typeof item.parameters === 'string' ? item.parameters.split(',').filter(Boolean).length : 0;
                  }
                })() : 0;

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
                        <Badge variant="outline" className="text-[9px] border-emerald-200 text-emerald-700 bg-emerald-50">
                          {item.category_ref?.name || item.category}
                        </Badge>
                        <h4 className="font-bold text-slate-900">{item.name}</h4>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Tag className="h-3 w-3 mr-1" />
                          {paramCount} parameter
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-emerald-700">
                      Rp {Number(item.price).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-slate-500">Unit: {item.unit || "-"}</span>
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
            <p className="text-xs text-slate-500 font-medium">Total {data.total} layanan terdaftar</p>
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
          setParameterList([]);
        }
      }}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-emerald-900 flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              {editingItem ? "Edit" : "Tambah"} Layanan Baru
            </DialogTitle>
            <DialogDescription>
              Isi rincian layanan laboratorium di bawah ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Pilih Kategori</label>
                <Select onValueChange={(val) => setValue("category_id", val)} defaultValue={editingItem?.category_id}>
                  <SelectTrigger className="cursor-pointer focus:ring-emerald-500">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id} className="cursor-pointer">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Nama Layanan</label>
                <Input {...register("name")} placeholder="Contoh: Uji Logam Berat" required className="focus-visible:ring-emerald-500" />
                {errors.name && <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.name.message as string}
                </p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Harga (Rp)</label>
                <Input {...register("price", { valueAsNumber: true })} type="number" placeholder="0" required className="focus-visible:ring-emerald-500" />
                {errors.price && <p className="text-sm text-red-500">{errors.price.message as string}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Satuan / Unit</label>
                <Input {...register("unit")} placeholder="Contoh: sample, mg/L" className="focus-visible:ring-emerald-500" />
                {errors.unit && <p className="text-sm text-red-500">{errors.unit.message as string}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Regulasi / Baku Mutu</label>
              <Input {...register("regulation")} placeholder="Contoh: Permenkes No. 492" className="focus-visible:ring-emerald-500" />
            </div>

            {/* Multi-input Parameters dengan Tag */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Parameter Pengujian
                </label>
                <span className="text-xs text-slate-500">{parameterList.length} parameter</span>
              </div>

              {/* Input dengan auto-suggest */}
              <div className="flex gap-2">
                <Input
                  value={parameterInput}
                  onChange={(e) => setParameterInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddParameter();
                    }
                  }}
                  placeholder="Ketik parameter (contoh: pH, TSS, COD)"
                  className="flex-1 focus-visible:ring-emerald-500"
                />
                <Button type="button" onClick={handleAddParameter} className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Parameter Tags dengan Close Button */}
              {parameterList.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  {parameterList.map((param, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 flex items-center gap-2"
                    >
                      {param}
                      <button
                        type="button"
                        onClick={() => handleRemoveParameter(index)}
                        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Preset Parameters */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Parameter Umum (klik untuk tambah):</label>
                <div className="flex flex-wrap gap-2">
                  {commonParameters.map((param) => (
                    <Badge
                      key={param}
                      variant="outline"
                      className={cn(
                        "cursor-pointer transition-colors",
                        parameterList.includes(param)
                          ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                      onClick={() => handleSelectPreset(param)}
                    >
                      {parameterList.includes(param) && <Check className="h-3 w-3 mr-1" />}
                      {param}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 cursor-pointer" disabled={submitting}>
                {editingItem ? "Simpan Perubahan" : "Tambahkan ke Katalog"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data CSV
            </DialogTitle>
            <DialogDescription>
              Paste data CSV dengan format: Kategori, Nama Layanan, Harga, Unit, Regulasi, Parameters
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg text-xs font-mono">
              <p className="font-semibold mb-1">Format:</p>
              <p>Kategori,Nama Layanan,Harga,Unit,Regulasi,Parameters</p>
              <p className="text-slate-500">{"Air Limbah,Uji Fisika,150000,sample,Permenkes 492,\"[{\"name\":\"pH\"},{\"name\":\"TSS\"}]\""}</p>
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

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteItemId !== null} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Konfirmasi Hapus
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-4">
              {deleteItemId === "bulk" ? (
                <>
                  Apakah Anda yakin ingin menghapus <strong className="text-slate-900">{selectedIds.length} layanan</strong> terpilih?
                  <p className="mt-2 text-sm text-amber-600 font-medium">⚠️ Tindakan ini tidak dapat dibatalkan.</p>
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin menghapus layanan ini?
                  <p className="mt-2 text-sm text-amber-600 font-medium">⚠️ Data akan dihapus permanen dari katalog.</p>
                </>
              )}
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
