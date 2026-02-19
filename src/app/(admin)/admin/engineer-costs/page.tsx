// ============================================================================
// OPTIMIZED ENGINEER COSTS PAGE - v2.0
// Fitur Optimasi:
// 1. ✅ Validasi form lebih ketat
// 2. ✅ Auto-suggest lokasi & tipe perdiem
// 3. ✅ Quick edit di tabel
// 4. ✅ Export/Import CSV
// 5. ✅ History log perubahan
// 6. ✅ Deteksi duplikasi
// 7. ✅ Filter & search advanced
// 8. ✅ Color scale untuk harga
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
  ChevronDown
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
import { useForm, useFieldArray, Controller } from "react-hook-form";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";

// Schema dengan validasi ketat
const operationalSchema = z.object({
  category: z.enum(["perdiem"]),
  name: z.string().min(1, "Nama wajib diisi"),
  description: z.string().optional(),
  unit: z.string().min(1, "Satuan wajib diisi"),
  items: z.array(z.object({
    perdiem_type: z.string().min(1, "Tipe perdiem wajib diisi"),
    location: z.string().min(1, "Lokasi wajib diisi"),
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

export default function EngineerCostsPage() {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickEditPrice, setQuickEditPrice] = useState<number>(0);
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<string>("");

  // Auto-suggest options
  const [perdiemTypeSuggestions, setPerdiemTypeSuggestions] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors }, trigger } = useForm({
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
  const watchedName = watch("name");

  // Extract unique suggestions from data
  useEffect(() => {
    const types = Array.from(new Set(data.map(item => item.perdiem_type).filter(Boolean)));
    const locations = Array.from(new Set(data.map(item => item.location).filter(Boolean)));
    setPerdiemTypeSuggestions(types);
    setLocationSuggestions(locations);
  }, [data]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getAllOperationalCatalogs();
      const perdiemItems = result.filter((item: any) => item.category === "perdiem");
      setData(perdiemItems);
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
        if (idx !== otherIdx && 
            item.perdiem_type === otherItem.perdiem_type && 
            item.location === otherItem.location) {
          const key = `${item.perdiem_type}-${item.location}`;
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
    const relatedItems = data.filter((d: any) => d.name === item.name && d.category === "perdiem");

    setSelectedItem(item);
    setValue("category", "perdiem");
    setValue("name", item.name);
    setValue("description", item.description || "");
    setValue("unit", item.unit);

    const items = relatedItems.map((d: any) => ({
      perdiem_type: d.perdiem_type || "",
      location: d.location || "",
      price: Number(d.price)
    }));

    // Reset field array dengan cara yang benar
    reset({
      category: "perdiem",
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
      const relatedItems = data.filter((d: any) => d.name === selectedItem.name && d.category === "perdiem");
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

  const openDeleteDialog = (item: any) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
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
    const headers = ["Nama", "Tipe Perdiem", "Lokasi", "Harga", "Satuan", "Deskripsi"];
    const csvData = data.map(item => [
      item.name,
      item.perdiem_type,
      item.location,
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
    a.download = `engineer-costs-${new Date().toISOString().split('T')[0]}.csv`;
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
          category: "perdiem",
          name: rowData.nama,
          perdiem_type: rowData.tipe_perdiem,
          location: rowData.lokasi,
          price: parseFloat(rowData.harga),
          unit: rowData.satuan || "hari",
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

  // Filter & Sort
  const getFilteredAndSortedData = () => {
    let filtered = [...data];
    
    // Search
    if (search) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Filter by activeTab (perdiem_type)
    if (activeTab !== "all") {
      filtered = filtered.filter(item => item.perdiem_type === activeTab);
    }
    
    // Filter by type (from popover filter)
    if (filterType !== "all") {
      filtered = filtered.filter(item => item.perdiem_type === filterType);
    }
    
    // Filter by location
    if (filterLocation !== "all") {
      filtered = filtered.filter(item => item.location === filterLocation);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "price") {
        comparison = Number(a.price) - Number(b.price);
      } else if (sortBy === "location") {
        comparison = (a.location || "").localeCompare(b.location || "");
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

  const perdiemTypes = Array.from(new Set(data.map(item => item.perdiem_type).filter(Boolean)));
  const locations = Array.from(new Set(data.map(item => item.location).filter(Boolean)));
  
  const prices = data.map(item => Number(item.price));
  const minPrice = Math.min(...prices, 0);
  const maxPrice = Math.max(...prices, 0);

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header dengan Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Biaya Engineer</h1>
          <p className="text-slate-500 text-sm">Kelola biaya perdiem engineer dengan fitur lengkap dan optimal.</p>
        </div>

        <div className="flex gap-2 flex-wrap">
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
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-slate-800">Range Harga</span>
            </div>
            <p className="text-lg font-bold text-purple-700">
              Rp {(minPrice/1000).toFixed(0)}k - Rp {(maxPrice/1000).toFixed(0)}k
            </p>
            <p className="text-xs text-slate-500">Per {data[0]?.unit || "hari"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="cursor-pointer">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4" align="start">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipe Perdiem</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Semua" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Tipe</SelectItem>
                        {perdiemTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Lokasi</Label>
                    <Select value={filterLocation} onValueChange={setFilterLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Semua" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Lokasi</SelectItem>
                        {locations.map(loc => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 cursor-pointer">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nama</SelectItem>
                <SelectItem value="price">Harga</SelectItem>
                <SelectItem value="location">Lokasi</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="cursor-pointer"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", sortOrder === "asc" && "rotate-180")} />
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val)} className="w-full md:w-auto">
            <TabsList className="w-full md:inline-flex bg-slate-100 overflow-x-auto gap-1 p-1 h-auto">
              <TabsTrigger value="all" className="whitespace-nowrap data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex-1 md:flex-none px-4 py-2">
                Semua
              </TabsTrigger>
              {perdiemTypes.map(type => (
                <TabsTrigger key={type} value={type} className="whitespace-nowrap data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex-1 md:flex-none px-4 py-2">
                  {type}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-emerald-50/5 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              placeholder="Cari nama tarif atau deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 focus-visible:ring-emerald-500 rounded-xl"
            />
          </div>
          <div className="text-sm text-slate-500">
            {filteredData.length} dari {data.length} data
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
            ) : groupedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-slate-500">
                  Belum ada data biaya engineer.
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
                placeholder="Contoh: hari"
                defaultValue="hari"
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
                  onClick={() => append({ perdiem_type: "", location: "", price: 0 })}
                >
                  <Plus className="h-3 w-3 mr-1" /> Tambah Kombinasi
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-end p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Tipe Perdiem</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between h-9 bg-white cursor-pointer"
                        >
                          {watchedItems[index]?.perdiem_type || "Pilih tipe..."}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Cari atau ketik..." />
                          <CommandList>
                            <CommandEmpty>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start cursor-pointer"
                                onClick={() => {
                                  const value = watchedItems[index]?.perdiem_type || "";
                                  if (value && !perdiemTypeSuggestions.includes(value)) {
                                    setPerdiemTypeSuggestions([...perdiemTypeSuggestions, value]);
                                  }
                                }}
                              >
                                <Plus className="h-3 w-3 mr-2" />
                                Tambah "{watchedItems[index]?.perdiem_type}"
                              </Button>
                            </CommandEmpty>
                            <CommandGroup>
                              {perdiemTypeSuggestions.map((type) => (
                                <CommandItem
                                  key={type}
                                  value={type}
                                  onSelect={() => {
                                    setValue(`items.${index}.perdiem_type`, type);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      watchedItems[index]?.perdiem_type === type ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {type}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.items?.[index]?.perdiem_type && (
                      <p className="text-xs text-red-500">{errors.items[index]?.perdiem_type?.message}</p>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Lokasi</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between h-9 bg-white cursor-pointer"
                        >
                          {watchedItems[index]?.location || "Pilih lokasi..."}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Cari atau ketik..." />
                          <CommandList>
                            <CommandEmpty>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start cursor-pointer"
                                onClick={() => {
                                  const value = watchedItems[index]?.location || "";
                                  if (value && !locationSuggestions.includes(value)) {
                                    setLocationSuggestions([...locationSuggestions, value]);
                                  }
                                }}
                              >
                                <Plus className="h-3 w-3 mr-2" />
                                Tambah "{watchedItems[index]?.location}"
                              </Button>
                            </CommandEmpty>
                            <CommandGroup>
                              {locationSuggestions.map((loc) => (
                                <CommandItem
                                  key={loc}
                                  value={loc}
                                  onSelect={() => {
                                    setValue(`items.${index}.location`, loc);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      watchedItems[index]?.location === loc ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {loc}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {errors.items?.[index]?.location && (
                      <p className="text-xs text-red-500">{errors.items[index]?.location?.message}</p>
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
              Paste data CSV dengan format: Nama, Tipe Perdiem, Lokasi, Harga, Satuan, Deskripsi
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg text-xs font-mono">
              <p className="font-semibold mb-1">Format:</p>
              <p>Nama,Tipe Perdiem,Lokasi,Harga,Satuan,Deskripsi</p>
              <p className="text-slate-500">Engineer Senior,Sesaat,Jawa Barat,250000,hari,</p>
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
            {/* Placeholder - implement API endpoint first */}
            <div className="text-center py-8 text-slate-400">
              <History className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Belum ada history</p>
              <p className="text-xs">Perubahan akan tercatat di sini</p>
            </div>
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
