// ============================================================================
// OPTIMIZED SERVICES PAGE - v2.1
// Fitur:
// 1. ✅ Multi-input Parameters dengan tag sistem
// 2. ✅ Standardized LoadingOverlay & LoadingButton
// 3. ✅ Compact Layout (Header & Filters)
// 4. ✅ Responsive Mobile View
// 5. ✅ Quick Edit harga di tabel
// 6. ✅ Integrasi Regulasi dropdown
// ============================================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Filter
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
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { ChemicalLoader, LoadingOverlay, LoadingButton, TableSkeleton, EmptyState } from "@/components/ui";
import { getServices, createOrUpdateService, deleteService, deleteManyServices, updateServiceParameters } from "@/lib/actions/services";
import { getAllCategories } from "@/lib/actions/categories";
import { getAllRegulationsForDropdown } from "@/lib/actions/regulation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

// Common parameter presets untuk laboratorium
const commonParameters = [
  "pH", "TSS", "BOD", "COD", "NH3", "Minyak & Lemak", "TDS", "Suhu", "DO", "Nitrat", "Nitrit"
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
  const [data, setData] = useState<{ items: any[], total: number, pages: number }>({ items: [], total: 0, pages: 1 });
  const [categories, setCategories] = useState<any[]>([]);
  const [regulations, setRegulations] = useState<any[]>([]);
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
  const [importData, setImportData] = useState<string>("");
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickEditField, setQuickEditField] = useState<"price" | "parameters" | null>(null);
  const [quickEditPrice, setQuickEditPrice] = useState<number>(0);
  const [quickEditParams, setQuickEditParams] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);

  // Parameter input state
  const [parameterInput, setParameterInput] = useState("");
  const [parameterList, setParameterList] = useState<string[]>([]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sResult, cResult, rResult] = await Promise.all([
        getServices(page, limit, search),
        getAllCategories(),
        getAllRegulationsForDropdown()
      ]);
      setData(sResult);
      setCategories(cResult);
      setRegulations(rResult.regulations || []);
      setSelectedIds([]);
    } catch (error) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [loadData]);

  const onSubmit = (formData: any) => {
    setPendingFormData(formData);
    setIsSaveConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingFormData) return;
    
    setIsSaveConfirmOpen(false);
    setSubmitting(true);
    try {
      const parameters = parameterList.map(p => ({ name: p }));
      const result = await createOrUpdateService({
        ...pendingFormData,
        parameters: JSON.stringify(parameters)
      }, editingItem?.id);
      
      if (result.success) {
        setIsDialogOpen(false);
        reset();
        setEditingItem(null);
        setParameterList([]);
        loadData();
        toast.success(editingItem ? "Layanan diperbarui" : "Layanan baru ditambahkan");
      } else {
        toast.error(result.error || "Gagal menyimpan data");
      }
    } catch (error: any) {
      toast.error("Gagal menyimpan data", {
        description: error?.message || "Silakan coba lagi"
      });
    } finally {
      setSubmitting(false);
      setPendingFormData(null);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setValue("name", item.name);
    setValue("category_id", item.category_id);
    setValue("regulation_id", item.regulation_id);
    setValue("price", Number(item.price));
    setValue("unit", item.unit);
    setValue("regulation", item.regulation);
    
    if (item.parameters) {
      try {
        const params = typeof item.parameters === 'string' ? JSON.parse(item.parameters) : item.parameters;
        setParameterList(Array.isArray(params) ? params.map((p: any) => p.name) : []);
      } catch {
        setParameterList([]);
      }
    } else {
      setParameterList([]);
    }
    
    setIsDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    setSubmitting(true);
    try {
      const result = deleteItemId === "bulk" 
        ? await deleteManyServices(selectedIds)
        : await deleteService(deleteItemId);
        
      if (result.success) {
        loadData();
        toast.success("Layanan berhasil dihapus");
        setDeleteItemId(null);
        if (deleteItemId === "bulk") setSelectedIds([]);
      } else {
        toast.error(result.error || "Gagal menghapus data");
      }
    } catch (error) {
      toast.error("Gagal menghapus data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickEditSave = async (id: string) => {
    try {
      if (quickEditField === "price") {
        const result = await createOrUpdateService({ price: quickEditPrice }, id);
        if (result.success) {
          toast.success("Harga diperbarui");
          setQuickEditId(null);
          setQuickEditField(null);
          loadData();
        }
      } else if (quickEditField === "parameters") {
        const newParameters = quickEditParams.split(',').map(p => p.trim()).filter(p => p !== "");
        const result = await updateServiceParameters(id, newParameters);
        if (result.success) {
          toast.success("Parameter diperbarui");
          setQuickEditId(null);
          setQuickEditField(null);
          loadData();
        } else {
          toast.error(result.error || "Gagal memperbarui parameter");
        }
      }
    } catch (error) {
      toast.error("Gagal update data");
    }
  };

  const handleAddParameter = () => {
    const inputParts = parameterInput.split(',').map(p => p.trim()).filter(p => p !== "");
    if (inputParts.length === 0) return;
    
    const newParams = inputParts.filter(p => !parameterList.includes(p));
    if (newParams.length > 0) {
      setParameterList([...parameterList, ...newParams]);
      setParameterInput("");
    } else if (inputParts.length > 0) {
      toast.error("Parameter sudah ada");
    }
  };

  const handleRemoveParameter = (index: number) => {
    const newList = [...parameterList];
    newList.splice(index, 1);
    setParameterList(newList);
  };

  const handleSelectPreset = (param: string) => {
    if (!parameterList.includes(param)) {
      setParameterList([...parameterList, param]);
    } else {
      setParameterList(parameterList.filter(p => p !== param));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(i => i.id));
    }
  };

  const handleExport = () => {
    const headers = ["Kategori", "Nama Layanan", "Harga", "Unit", "Regulasi"];
    const csvData = data.items.map((item: any) => [
      item.category_ref?.name || item.category,
      item.name,
      item.price,
      item.unit || "",
      item.regulation_ref?.name || item.regulation || ""
    ]);
    const csv = [headers.join(","), ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `layanan-lab.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredItems = data.items.filter(item => {
    if (filterCategory !== "all" && item.category_id !== filterCategory) return false;
    return true;
  });

  const prices = data.items.map((item: any) => Number(item.price));
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-emerald-900 tracking-tight flex items-center gap-3">
          <FlaskConical className="h-8 w-8 text-emerald-600" />
          Katalog Layanan
        </h1>
        <p className="text-slate-500 text-sm mt-1">Kelola daftar pengujian dan parameter laboratorium.</p>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
          <Input
            placeholder="Cari layanan atau kategori..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 h-11 focus-visible:ring-emerald-500 rounded-lg"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={() => setDeleteItemId("bulk")} className="h-11 cursor-pointer">
              <Trash2 className="mr-2 h-4 w-4" /> Hapus ({selectedIds.length})
            </Button>
          )}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-11 cursor-pointer rounded-lg px-4 flex items-center gap-2">
                <Filter className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium">Filter</span>
                {filterCategory !== "all" && <span className="flex h-2 w-2 rounded-full bg-emerald-500" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Kategori</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="h-9 rounded-lg">
                      <SelectValue placeholder="Pilih Kategori..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="ghost" size="sm" className="w-full text-[10px] font-bold text-slate-400" onClick={() => setFilterCategory("all")}>RESET FILTER</Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" onClick={handleExport} size="icon" className="h-11 w-11 rounded-lg cursor-pointer" title="Export CSV">
            <Download className="h-5 w-5" />
          </Button>
          
          <Button 
            onClick={() => { reset(); setEditingItem(null); setParameterList([]); setIsDialogOpen(true); }} 
            size="icon"
            className="bg-emerald-600 hover:bg-emerald-700 shadow-lg cursor-pointer h-11 w-11 shrink-0"
            title="Tambah Layanan"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-emerald-50/10 flex items-center justify-between gap-4">
          <div className="text-sm font-medium text-slate-600">Daftar Layanan Laboratorium</div>
          <div className="text-sm text-slate-500">{data.items.length} dari {data.total} layanan</div>
        </div>

        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="w-12 px-6">
                  <Checkbox checked={data.items.length > 0 && selectedIds.length === data.items.length} onCheckedChange={() => {
                    if (selectedIds.length === data.items.length) setSelectedIds([]);
                    else setSelectedIds(data.items.map(i => i.id));
                  }} />
                </TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Kategori</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Nama Layanan</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Parameter</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Regulasi</TableHead>
                <TableHead className="text-right font-bold text-emerald-900 px-4">Harga</TableHead>
                <TableHead className="text-center font-bold text-emerald-900 px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="py-20"><TableSkeleton rows={5} /></TableCell></TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-20"><EmptyState title="Belum ada layanan" description="Klik ikon tambah untuk memulai." /></TableCell></TableRow>
              ) : (
                filteredItems.map((item: any) => {
                  const isQuickEditing = quickEditId === item.id;
                  const params = typeof item.parameters === 'string' ? JSON.parse(item.parameters || '[]') : (item.parameters || []);
                  
                  return (
                    <TableRow key={item.id} className={cn("hover:bg-emerald-50/10 transition-colors", getPriceBadgeColor(Number(item.price), minPrice, maxPrice))}>
                      <TableCell className="px-6">
                        <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => {
                          if (selectedIds.includes(item.id)) setSelectedIds(selectedIds.filter(id => id !== item.id));
                          else setSelectedIds([...selectedIds, item.id]);
                        }} />
                      </TableCell>
                      <TableCell className="px-4">
                        <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                          {item.category_ref?.name || item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-slate-800 px-4">{item.name}</TableCell>
                      <TableCell className="px-4">
                        {quickEditId === item.id && quickEditField === "parameters" ? (
                          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                            <Input
                              value={quickEditParams}
                              onChange={(e) => setQuickEditParams(e.target.value)}
                              className="h-8 text-[10px] py-0 px-2 min-w-[150px]"
                              placeholder="NO2, SO2, CO..."
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleQuickEditSave(item.id);
                                if (e.key === "Escape") { setQuickEditId(null); setQuickEditField(null); }
                              }}
                            />
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50" onClick={() => handleQuickEditSave(item.id)}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => { setQuickEditId(null); setQuickEditField(null); }}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <div className="flex flex-wrap gap-1">
                              {params.slice(0, 2).map((p: any, i: number) => (
                                <span key={i} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">{p.name}</span>
                              ))}
                              {params.length > 2 && <span className="text-[9px] text-slate-400">+{params.length - 2}</span>}
                            </div>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6 text-slate-300 opacity-0 group-hover:opacity-100 transition-all"
                              onClick={() => {
                                setQuickEditId(item.id);
                                setQuickEditField("parameters");
                                setQuickEditParams(params.map((p: any) => p.name).join(", "));
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-700">{item.regulation_ref?.name || item.regulation || "-"}</span>
                          {item.regulation_ref?.code && <span className="text-[9px] text-slate-400 font-mono">{item.regulation_ref.code}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-4">
                        {quickEditId === item.id && quickEditField === "price" ? (
                          <div className="flex items-center gap-2 justify-end animate-in fade-in slide-in-from-right-2 duration-200">
                            <Input type="number" value={quickEditPrice} onChange={(e) => setQuickEditPrice(Number(e.target.value))} className="w-32 h-8 text-right" autoFocus onKeyDown={(e) => {
                              if (e.key === "Enter") handleQuickEditSave(item.id);
                              if (e.key === "Escape") { setQuickEditId(null); setQuickEditField(null); }
                            }} />
                            <Button size="icon" variant="ghost" onClick={() => handleQuickEditSave(item.id)} className="text-emerald-600 h-8 w-8"><Check className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => { setQuickEditId(null); setQuickEditField(null); }} className="text-red-600 h-8 w-8"><X className="h-4 w-4" /></Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 justify-end group">
                            <span className="font-bold text-emerald-700">Rp {Number(item.price).toLocaleString("id-ID")}</span>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" onClick={() => { 
                              setQuickEditId(item.id); 
                              setQuickEditField("price");
                              setQuickEditPrice(Number(item.price)); 
                            }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center px-6">
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 cursor-pointer" onClick={() => handleEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 cursor-pointer" onClick={() => setDeleteItemId(item.id)}>
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
            <div className="p-10 text-center"><ChemicalLoader /></div>
          ) : filteredItems.length === 0 ? (
            <div className="p-10 text-center text-slate-500">Katalog masih kosong.</div>
          ) : (
            filteredItems.map((item: any) => {
              const isSelected = selectedIds.includes(item.id);
              const params = typeof item.parameters === 'string' ? JSON.parse(item.parameters || '[]') : (item.parameters || []);

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
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between group">
                            <div className="flex flex-wrap gap-1 flex-1">
                              {params.length === 0 ? (
                                <span className="text-[10px] text-slate-400 italic">Belum ada parameter</span>
                              ) : (
                                params.map((p: any, i: number) => (
                                  <span key={i} className="text-[8px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded border border-blue-100">{p.name}</span>
                                ))
                              )}
                            </div>
                            {quickEditId !== item.id && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-7 w-7 text-slate-300 hover:text-emerald-600"
                                onClick={() => {
                                  setQuickEditId(item.id);
                                  setQuickEditField("parameters");
                                  setQuickEditParams(params.map((p: any) => p.name).join(", "));
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>

                          {quickEditId === item.id && quickEditField === "parameters" && (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200" onClick={(e) => e.stopPropagation()}>
                              <Input
                                value={quickEditParams}
                                onChange={(e) => setQuickEditParams(e.target.value)}
                                className="h-8 text-[10px] py-0 px-2 flex-1"
                                placeholder="NO2, SO2, CO..."
                                autoFocus
                              />
                              <Button size="icon" className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleQuickEditSave(item.id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="outline" className="h-8 w-8 text-red-500" onClick={() => { setQuickEditId(null); setQuickEditField(null); }}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className="text-[9px] font-bold text-emerald-600 uppercase mt-1">{item.regulation_ref?.name || item.regulation || "-"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {quickEditId === item.id && quickEditField === "price" ? (
                        <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                          <Input type="number" value={quickEditPrice} onChange={(e) => setQuickEditPrice(Number(e.target.value))} className="w-20 h-7 text-[10px] px-1 text-right" autoFocus />
                          <Button size="icon" variant="ghost" onClick={() => handleQuickEditSave(item.id)} className="h-7 w-7 text-emerald-600"><Check className="h-3 w-3" /></Button>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-emerald-700 flex items-center gap-1 group" onClick={(e) => {
                          e.stopPropagation();
                          setQuickEditId(item.id);
                          setQuickEditField("price");
                          setQuickEditPrice(Number(item.price));
                        }}>
                          Rp {Number(item.price).toLocaleString("id-ID")}
                          <Pencil className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-slate-500">Unit: {item.unit || "-"}</span>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 cursor-pointer" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 cursor-pointer" onClick={() => setDeleteItemId(item.id)}>
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Baris:</span>
              <Select value={limit.toString()} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-8 w-16 text-xs rounded-xl border-slate-200 bg-white">
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 rounded-lg">{page} / {data.pages}</div>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-700 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2 text-xl font-bold">
                <FlaskConical className="h-6 w-6" />
                {editingItem ? "Edit Layanan" : "Layanan Baru"}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/80">Masukkan rincian layanan pengujian laboratorium.</DialogDescription>
            </DialogHeader>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 bg-white max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Kategori *</Label>
                <Select onValueChange={(val) => setValue("category_id", val)} defaultValue={watch("category_id")}>
                  <SelectTrigger className="h-11 rounded-xl cursor-pointer"><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                  <SelectContent>{categories.map(cat => <SelectItem key={cat.id} value={cat.id} className="cursor-pointer">{cat.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Regulasi / Baku Mutu</Label>
                <Select onValueChange={(val) => {
                  setValue("regulation_id", val);
                  const selectedReg = regulations.find(r => r.id === val);
                  if (selectedReg && selectedReg.parameters_list) {
                    setParameterList(selectedReg.parameters_list);
                  }
                }} defaultValue={watch("regulation_id")}>
                  <SelectTrigger className="h-11 rounded-xl cursor-pointer"><SelectValue placeholder="Pilih Regulasi" /></SelectTrigger>
                  <SelectContent>{regulations.map(reg => <SelectItem key={reg.id} value={reg.id} className="cursor-pointer">{reg.name} {reg.code && `(${reg.code})`}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Nama Layanan *</Label>
              <Input {...register("name")} placeholder="Contoh: Uji Logam Berat" required className="h-11 rounded-xl" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Harga (Rp) *</Label>
                <Input {...register("price", { valueAsNumber: true })} type="number" placeholder="0" required className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Satuan *</Label>
                <Input {...register("unit")} placeholder="Contoh: sample, titik" required className="h-11 rounded-xl" />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase text-slate-500">Parameter Uji (Tag System)</Label>
              <div className="flex gap-2">
                <Input
                  value={parameterInput}
                  onChange={(e) => setParameterInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddParameter(); } }}
                  placeholder="Ketik parameter (misal: pH, TSS) lalu Enter..."
                  className="h-11 rounded-xl"
                />
                <Button type="button" onClick={handleAddParameter} className="h-11 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 border-none"><Plus className="h-5 w-5" /></Button>
              </div>
              
              <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 min-h-[80px]">
                {parameterList.length === 0 && <p className="text-xs text-slate-400 italic m-auto">Belum ada parameter.</p>}
                {parameterList.map((param, index) => (
                  <Badge key={index} className="bg-blue-600 text-white pl-3 pr-1 py-1 rounded-lg flex items-center gap-1">
                    <span className="text-xs font-bold">{param}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveParameter(index)} className="h-5 w-5 text-blue-200 hover:text-white hover:bg-white/20 rounded-md"><X className="h-3 w-3" /></Button>
                  </Badge>
                ))}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preset Umum:</Label>
                <div className="flex flex-wrap gap-1.5">
                  {commonParameters.map(p => (
                    <Badge key={p} variant="outline" className={cn("cursor-pointer text-[10px] py-0 h-6 transition-all", parameterList.includes(p) ? "bg-emerald-100 border-emerald-300 text-emerald-700" : "bg-white text-slate-500 hover:bg-slate-50")} onClick={() => handleSelectPreset(p)}>
                      {parameterList.includes(p) && <Check className="h-2 w-2 mr-1" />} {p}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t gap-3 sticky bottom-0 bg-white">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 font-bold text-slate-400">Batal</Button>
              <LoadingButton type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl shadow-lg font-bold" loading={submitting} loadingText="Menyimpan...">
                {editingItem ? "Update Layanan" : "Simpan Layanan"}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteItemId !== null} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent className="sm:max-w-[425px] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600"><Trash2 className="h-5 w-5" /> Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription className="pt-4">
              {deleteItemId === "bulk" ? `Hapus ${selectedIds.length} layanan terpilih secara permanen?` : "Hapus layanan ini dari katalog secara permanen?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 rounded-xl">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Confirmation AlertDialog */}
      <AlertDialog open={isSaveConfirmOpen} onOpenChange={setIsSaveConfirmOpen}>
        <AlertDialogContent className="sm:max-w-[425px] rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-emerald-600">
              <Check className="h-5 w-5" />
              Konfirmasi Simpan
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-4">
              Apakah Anda yakin ingin menyimpan perubahan data layanan ini? Pastikan semua informasi sudah benar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSave}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer"
            >
              Ya, Simpan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LoadingOverlay isOpen={submitting} title="Memproses Data..." description="Mohon tunggu sebentar" />
    </div>
  );
}
