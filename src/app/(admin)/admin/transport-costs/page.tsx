// ============================================================================
// OPTIMIZED TRANSPORT COSTS PAGE - v2.0
// Fitur Optimasi:
// 1. ✅ Input dinamis kombinasi (nama + jarak + harga)
// 2. ✅ Quick edit di tabel
// 3. ✅ Export/Import CSV
// 4. ✅ History log perubahan
// 5. ✅ Deteksi duplikasi
// 6. ✅ Color scale untuk harga
// 7. ✅ Kalkulator estimasi sederhana
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
  Truck,
  Download,
  Upload,
  History,
  X,
  Check,
  AlertCircle,
  Calculator,
  MapPin,
  DollarSign
} from "lucide-react";
import { ChemicalLoader } from "@/components/ui";
import {
  getOperationalCatalogs,
  deleteOperationalCatalog,
  createOperationalCatalog,
  updateOperationalCatalog,
  getAllOperationalCatalogs,
  updatePrice,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Schema dengan validasi ketat
const transportSchema = z.object({
  category: z.enum(["transport"]),
  name: z.string().min(1, "Nama wajib diisi"),
  description: z.string().optional(),
  unit: z.string().min(1, "Satuan wajib diisi"),
  items: z.array(z.object({
    distance_category: z.string().min(1, "Kategori jarak wajib diisi"),
    price: z.number().min(1, "Harga harus lebih dari 0"),
  })).min(1, "Minimal 1 item harga"),
});

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

// Preset distance categories
const distanceCategories = [
  "Dekat (< 50km)",
  "Sedang (50-200km)",
  "Jauh (> 200km)",
  "Dalam Kota",
  "Luar Kota",
  "Luar Provinsi",
  "Luar Negeri"
];

export default function TransportCostsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickEditPrice, setQuickEditPrice] = useState<number>(0);
  const [search, setSearch] = useState("");
  const [filterDistance, setFilterDistance] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [importData, setImportData] = useState<string>("");

  // Auto-suggest options
  const [distanceSuggestions, setDistanceSuggestions] = useState<string[]>(distanceCategories);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors }, trigger } = useForm({
    resolver: zodResolver(transportSchema),
    defaultValues: {
      category: "transport",
      name: "",
      description: "",
      unit: "trip",
      items: [{ distance_category: "", price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = watch("items");

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getAllOperationalCatalogs();
      const transportItems = result.filter((item: any) => item.category === "transport");
      setData(transportItems);
      
      // Extract suggestions from existing data
      const distances = Array.from(new Set(transportItems.map((item: any) => item.distance_category).filter(Boolean))) as string[];
      
      setDistanceSuggestions([...new Set([...distanceCategories, ...distances])]);
    } catch (error) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Deteksi duplikasi
  const checkDuplicates = (items: any[], name: string) => {
    const duplicates: string[] = [];
    items.forEach((item, idx) => {
      items.forEach((otherItem, otherIdx) => {
        if (idx !== otherIdx && item.distance_category === otherItem.distance_category) {
          const key = item.distance_category;
          if (!duplicates.includes(key)) {
            duplicates.push(key);
          }
        }
      });
    });
    return duplicates;
  };

  const onSubmit = async (formData: any) => {
    // Validasi manual setiap field
    const isValid = await trigger();
    if (!isValid) {
      toast.error("Form belum lengkap", {
        description: "Mohon lengkapi semua field yang wajib diisi"
      });
      return;
    }

    // Cek duplikasi
    const duplicates = checkDuplicates(formData.items, formData.name);
    if (duplicates.length > 0) {
      const confirmed = window.confirm(
        `Ditemukan ${duplicates.length} kombinasi duplikat:\n- ${duplicates.join('\n- ')}\n\nLanjutkan?`
      );
      if (!confirmed) return;
    }

    setShowSubmitModal(true);
    setSubmitting(true);
    try {
      if (selectedItem) {
        // Update - catat history
        const relatedItems = data.filter((d: any) => d.name === selectedItem.name);
        for (const item of relatedItems) {
          await createHistory(item.id, "update", Number(item.price), 0);
          await deleteOperationalCatalog(item.id);
        }
      }
      
      // Create new entries
      for (const item of formData.items) {
        await createOperationalCatalog({
          ...formData,
          ...item,
          transport_mode: null, // Set null untuk sementara
          category: "transport"
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
    const relatedItems = data.filter((d: any) => d.name === item.name && d.category === "transport");

    setSelectedItem(item);
    setValue("category", "transport");
    setValue("name", item.name);
    setValue("description", item.description || "");
    setValue("unit", item.unit);

    const items = relatedItems.map((d: any) => ({
      distance_category: d.distance_category || "",
      price: Number(d.price)
    }));

    // Reset field array dengan cara yang benar
    reset({
      category: "transport",
      name: item.name,
      description: item.description || "",
      unit: item.unit,
      items: items
    });

    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setShowSubmitModal(true);
    try {
      const relatedItems = data.filter((d: any) => d.name === selectedItem.name && d.category === "transport");
      for (const item of relatedItems) {
        await createHistory(item.id, "delete", Number(item.price), 0);
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

  // Quick Edit Handler
  const handleQuickEdit = (item: any) => {
    setQuickEditId(item.id);
    setQuickEditPrice(Number(item.price));
  };

  const handleQuickEditSave = async (id: string, oldPrice: number, newPrice: number) => {
    try {
      // Catat history
      await fetch('/api/operational-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catalog_id: id,
          action: "quick_edit",
          old_price: oldPrice,
          new_price: newPrice
        })
      });
      
      // Update harga
      await updatePrice(id, newPrice);
      
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

  // History
  const createHistory = async (catalogId: string, action: string, oldPrice: number | null, newPrice: number | null) => {
    try {
      const response = await fetch('/api/operational-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catalog_id: catalogId,
          action,
          old_price: oldPrice,
          new_price: newPrice
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to create history:', error);
    }
  };

  const openHistory = (item: any) => {
    setSelectedItem(item);
    setIsHistoryOpen(true);
  };

  // Export CSV
  const handleExport = () => {
    const headers = ["Nama", "Kategori Jarak", "Mode Transport", "Harga", "Satuan", "Deskripsi"];
    const csvData = data.map(item => [
      item.name,
      item.distance_category,
      item.transport_mode,
      item.price,
      item.unit,
      item.description || ""
    ]);
    
    const csv = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transport-costs-${new Date().toISOString().split('T')[0]}.csv`;
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
        
        await createOperationalCatalog({
          category: "transport",
          name: rowData.nama,
          distance_category: rowData.kategori_jarak,
          transport_mode: rowData.mode_transport,
          price: parseFloat(rowData.harga),
          unit: rowData.satuan || "trip",
          description: rowData.deskripsi || ""
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

  // Calculator Handler
  const [calcFrom, setCalcFrom] = useState("");
  const [calcTo, setCalcTo] = useState("");
  const [calcDistance, setCalcDistance] = useState<number>(0);
  const [calcResult, setCalcResult] = useState<number | null>(null);

  const handleCalculate = () => {
    // Simple estimation logic (can be enhanced with Google Maps API later)
    const basePrice = 5000; // Rp 5,000 per km
    
    const estimatedPrice = calcDistance * basePrice;
    setCalcResult(estimatedPrice);
  };

  // Filter & Sort
  const getFilteredAndSortedData = () => {
    let filtered = [...data];
    
    // Search
    if (search) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase()) ||
        item.distance_category?.toLowerCase().includes(search.toLowerCase()) ||
        item.transport_mode?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Filter by distance
    if (filterDistance !== "all") {
      filtered = filtered.filter(item => item.distance_category === filterDistance);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "price") {
        comparison = Number(a.price) - Number(b.price);
      } else if (sortBy === "distance") {
        comparison = (a.distance_category || "").localeCompare(b.distance_category || "");
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    return filtered;
  };

  const filteredData = getFilteredAndSortedData();
  const groupedData = filteredData.reduce((acc, item) => {
    const key = item.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const distances = Array.from(new Set(data.map(item => item.distance_category).filter(Boolean)));
  
  const prices = data.map(item => Number(item.price));
  const minPrice = Math.min(...prices, 0);
  const maxPrice = Math.max(...prices, 0);

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header dengan Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Biaya Transport & Akomodasi</h1>
          <p className="text-slate-500 text-sm">Kelola biaya transportasi dan akomodasi dengan fitur lengkap.</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setIsCalculatorOpen(true)} className="cursor-pointer">
            <Calculator className="mr-2 h-4 w-4" /> Kalkulator
          </Button>
          <Button variant="outline" onClick={handleExport} className="cursor-pointer">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)} className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button onClick={() => {
            reset();
            setSelectedItem(null);
            setIsDialogOpen(true);
          }} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 cursor-pointer">
            <Plus className="mr-2 h-4 w-4" /> Tambah Data
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold text-slate-800">Total Tarif</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{Object.keys(groupedData).length}</p>
            <p className="text-xs text-slate-500">Nama tarif berbeda</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-slate-800">Kategori Jarak</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{distances.length}</p>
            <p className="text-xs text-slate-500">Kategori terdaftar</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-slate-800">Range Harga</span>
            </div>
            <p className="text-lg font-bold text-purple-700">
              Rp {(minPrice/1000).toFixed(0)}k - Rp {(maxPrice/1000).toFixed(0)}k
            </p>
            <p className="text-xs text-slate-500">Per {data[0]?.unit || "trip"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Select value={filterDistance} onValueChange={setFilterDistance}>
              <SelectTrigger className="w-40 cursor-pointer">
                <SelectValue placeholder="Filter Jarak" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jarak</SelectItem>
                {distances.map(dist => (
                  <SelectItem key={dist} value={dist}>{dist}</SelectItem>
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
                <SelectItem value="distance">Jarak</SelectItem>
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
            {filteredData.length} dari {data.length} data
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-emerald-50/5 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              placeholder="Cari nama tarif, jarak, atau mode transport..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 focus-visible:ring-emerald-500 rounded-xl"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="font-bold text-emerald-900">Nama Tarif</TableHead>
              <TableHead className="font-bold text-emerald-900">Kategori Jarak</TableHead>
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
            ) : groupedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-slate-500">
                  Belum ada data biaya transport & akomodasi.
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(groupedData).map(([name, items]) => (
                <React.Fragment key={name}>
                  {(items as any[]).map((item: any, idx: number) => {
                    const priceColor = getPriceBadgeColor(Number(item.price), minPrice, maxPrice);
                    const isQuickEditing = quickEditId === item.id;

                    return (
                      <TableRow key={item.id} className={cn("hover:bg-emerald-50/10 transition-colors", getPriceColor(Number(item.price), minPrice, maxPrice))}>
                        {idx === 0 && (
                          <TableCell 
                            rowSpan={(items as any[]).length} 
                            className="px-4 align-top border-b border-slate-100 bg-white/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                <Truck className="h-4 w-4" />
                              </div>
                              <span className="font-medium text-slate-800">{name}</span>
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="px-4">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <MapPin className="h-3 w-3 mr-1" />
                            {item.distance_category || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm px-4 max-w-xs truncate">
                          {item.description || "-"}
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
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-slate-600 px-4">{item.unit}</TableCell>
                        {idx === 0 && (
                          <TableCell 
                            rowSpan={(items as any[]).length} 
                            className="text-center px-4 align-top border-b border-slate-100 bg-white/50"
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
                                <DropdownMenuItem onClick={() => openHistory(item)} className="cursor-pointer">
                                  <History className="mr-2 h-4 w-4" /> History
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600 cursor-pointer"
                                >
                                  <Trash className="mr-2 h-4 w-4" /> Hapus
                                </DropdownMenuItem>
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
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          reset();
          setSelectedItem(null);
        }
      }}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-emerald-900 flex items-center gap-2">
              {selectedItem ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {selectedItem ? "Edit" : "Tambah"} Biaya Transport
            </DialogTitle>
            <DialogDescription>
              Masukkan nama tarif dan kombinasi kategori jarak, mode transport, dan harga.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Tarif</Label>
              <Input
                {...register("name")}
                placeholder="Contoh: Tiket Pesawat, Transport Darat, Hotel"
                className="focus-visible:ring-emerald-500"
              />
              {errors.name && <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.name.message}
              </p>}
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
                placeholder="Contoh: trip, hari, malam"
                defaultValue="trip"
                className="focus-visible:ring-emerald-500"
              />
              {errors.unit && <p className="text-sm text-red-500">{errors.unit.message}</p>}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  Kombinasi Harga
                  {errors.items && <span className="text-xs text-red-500">{errors.items.message}</span>}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                  onClick={() => append({ distance_category: "", price: 0 })}
                >
                  <Plus className="h-3 w-3 mr-1" /> Tambah Kombinasi
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-end p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex-[2] space-y-1">
                    <Label className="text-xs">Kategori Jarak</Label>
                    <Select 
                      onValueChange={(val) => setValue(`items.${index}.distance_category`, val)}
                      defaultValue={watchedItems[index]?.distance_category}
                    >
                      <SelectTrigger className="bg-white cursor-pointer h-9">
                        <SelectValue placeholder="Pilih jarak..." />
                      </SelectTrigger>
                      <SelectContent>
                        {distanceSuggestions.map((dist) => (
                          <SelectItem key={dist} value={dist} className="cursor-pointer">
                            {dist}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.items?.[index]?.distance_category && (
                      <p className="text-xs text-red-500">{errors.items[index]?.distance_category?.message}</p>
                    )}
                  </div>
                  <div className="w-32 space-y-1">
                    <Label className="text-xs">Harga</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      {...register(`items.${index}.price`, { valueAsNumber: true })}
                      className="bg-white focus-visible:ring-emerald-500"
                    />
                    {errors.items?.[index]?.price && (
                      <p className="text-xs text-red-500">{errors.items[index]?.price?.message}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-400 hover:text-red-600 hover:bg-red-50 cursor-pointer shrink-0"
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

      {/* Delete Dialog */}
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

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data CSV
            </DialogTitle>
            <DialogDescription>
              Paste data CSV dengan format: Nama, Kategori Jarak, Mode Transport, Harga, Satuan, Deskripsi
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg text-xs font-mono">
              <p className="font-semibold mb-1">Format:</p>
              <p>Nama,Kategori Jarak,Mode Transport,Harga,Satuan,Deskripsi</p>
              <p className="text-slate-500">Tiket Pesawat,Dekat (&lt; 50km),Pesawat Udara,500000,trip,</p>
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

      {/* History Sheet */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              History Perubahan
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="text-sm text-slate-500">
              History perubahan harga untuk <strong>{selectedItem?.name}</strong>
            </div>
            <div className="text-center py-8 text-slate-400">
              <History className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Belum ada history</p>
              <p className="text-xs">Perubahan akan tercatat di sini</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Calculator Sheet */}
      <Sheet open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Kalkulator Estimasi Transport
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Dari Kota</Label>
              <Input
                placeholder="Contoh: Jakarta"
                value={calcFrom}
                onChange={(e) => setCalcFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Ke Kota</Label>
              <Input
                placeholder="Contoh: Bandung"
                value={calcTo}
                onChange={(e) => setCalcTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Jarak (km)</Label>
              <Input
                type="number"
                placeholder="Contoh: 150"
                value={calcDistance}
                onChange={(e) => setCalcDistance(Number(e.target.value))}
              />
              <p className="text-xs text-slate-500">*Estimasi jarak manual (akan auto-calculate dengan Google Maps API)</p>
            </div>
            <Button onClick={handleCalculate} className="w-full bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
              <Calculator className="mr-2 h-4 w-4" /> Hitung Estimasi
            </Button>

            {calcResult !== null && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-emerald-800 font-semibold mb-1">Estimasi Biaya:</p>
                <p className="text-2xl font-bold text-emerald-700">Rp {calcResult.toLocaleString("id-ID")}</p>
                <p className="text-xs text-emerald-600 mt-2">
                  *Estimasi berdasarkan {calcDistance} km (Rp 5,000/km)
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

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
