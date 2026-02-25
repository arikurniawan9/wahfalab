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
  Search,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Tag,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Filter,
  ChevronDown
} from "lucide-react";
import { ChemicalLoader, LoadingOverlay, LoadingButton, TableSkeleton, EmptyState } from "@/components/ui";
import {
  getRegulations,
  createOrUpdateRegulation,
  deleteRegulation,
  updateParametersList,
  type RegulationInput
} from "@/lib/actions/regulation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "all", label: "Semua Status", color: "bg-slate-100 text-slate-700" },
  { value: "active", label: "Aktif", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  { value: "inactive", label: "Tidak Aktif", color: "bg-red-100 text-red-700", icon: XCircle },
  { value: "draft", label: "Draft", color: "bg-amber-100 text-amber-700", icon: Clock },
];

export default function RegulationsPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickEditValue, setQuickEditValue] = useState("");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [formData, setFormData] = useState<RegulationInput>({
    name: "",
    code: "",
    parameters_list: [],
    status: "active",
  });

  const [parameterInput, setParameterInput] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getRegulations(page, limit, search, filterStatus, sortBy, sortOrder);
      setData(result);
    } catch (error: any) {
      toast.error("Gagal memuat data regulasi", {
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
  }, [page, limit, search, filterStatus, sortBy, sortOrder]);

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code || "",
      parameters_list: item.parameters_list || [],
      status: item.status || "active",
    });
    setIsDialogOpen(true);
  };

  const handleReset = () => {
    setFormData({
      name: "",
      code: "",
      parameters_list: [],
      status: "active",
    });
    setParameterInput("");
  };

  const addParameter = () => {
    if (!parameterInput.trim()) return;
    
    // Split by comma and trim each item
    const inputParts = parameterInput.split(',').map(p => p.trim()).filter(p => p !== "");
    
    if (inputParts.length === 0) return;

    const currentList = formData.parameters_list || [];
    const newParams = inputParts.filter(p => !currentList.includes(p));
    
    if (newParams.length === 0) {
      if (inputParts.length > 0) toast.error("Parameter sudah ada");
      return;
    }

    setFormData({
      ...formData,
      parameters_list: [...currentList, ...newParams]
    });
    setParameterInput("");
  };

  const removeParameter = (index: number) => {
    const newList = [...(formData.parameters_list || [])];
    newList.splice(index, 1);
    setFormData({ ...formData, parameters_list: newList });
  };

  const handleQuickEditSave = async (id: string) => {
    try {
      // Parse the comma-separated string back into an array
      const newParameters = quickEditValue.split(',').map(p => p.trim()).filter(p => p !== "");
      
      const result = await updateParametersList(id, newParameters);
      if (result.success) {
        toast.success("Parameter berhasil diperbarui");
        setQuickEditId(null);
        loadData();
      } else {
        toast.error(result.error || "Gagal memperbarui parameter");
      }
    } catch (error: any) {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await createOrUpdateRegulation(formData, editingItem?.id);
      
      if (result.success) {
        setIsDialogOpen(false);
        handleReset();
        setEditingItem(null);
        loadData();
        toast.success(editingItem ? "Regulasi berhasil diperbarui" : "Regulasi berhasil ditambahkan", {
          description: formData.name
        });
      } else {
        toast.error(result.error || "Gagal menyimpan data");
      }
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan sistem", {
        description: "Silakan coba lagi"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteItemId(id);
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    try {
      const result = await deleteRegulation(deleteItemId);
      if (result.error) {
        toast.error(result.error);
      } else {
        loadData();
        toast.success("Regulasi berhasil dihapus", {
          description: "Data telah dihapus dari katalog"
        });
      }
      setDeleteItemId(null);
    } catch (error: any) {
      toast.error("Gagal menghapus regulasi", {
        description: error?.message || "Silakan coba lagi"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    if (!option) return null;
    return (
      <Badge variant="outline" className={cn("capitalize", option.color)}>
        {option.label}
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-emerald-900 tracking-tight flex items-center gap-3">
          <FileText className="h-8 w-8 text-emerald-600" />
          Regulasi
        </h1>
        <p className="text-slate-500 text-sm mt-1">Kelola regulasi dan standar standar baku mutu laboratorium.</p>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
          <Input
            placeholder="Cari nama regulasi, kode, atau deskripsi..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 h-11 focus-visible:ring-emerald-500 rounded-lg"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-11 cursor-pointer rounded-lg px-4 flex items-center gap-2">
                <Filter className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium">Filter</span>
                {(filterStatus !== "all" || sortBy !== "created_at") && (
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Urutkan Berdasarkan</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-9 rounded-lg">
                      <SelectValue placeholder="Pilih..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nama Regulasi</SelectItem>
                      <SelectItem value="code">Kode Regulasi</SelectItem>
                      <SelectItem value="created_at">Tanggal Input</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-9 rounded-lg">
                      <SelectValue placeholder="Pilih Status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-[10px] font-bold text-slate-400 hover:text-emerald-600"
                  onClick={() => {
                    setFilterStatus("all");
                    setSortBy("created_at");
                    setSortOrder("desc");
                  }}
                >
                  RESET FILTER
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="h-11 w-11 rounded-lg cursor-pointer shadow-sm"
            title={`Urutkan ${sortOrder === "asc" ? "Menurun" : "Menaik"}`}
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", sortOrder === "asc" && "rotate-180")} />
          </Button>

          <Button
            onClick={() => {
              handleReset();
              setEditingItem(null);
              setIsDialogOpen(true);
            }}
            size="icon"
            className="h-11 w-11 shrink-0 bg-emerald-600 hover:bg-emerald-700 shadow-lg cursor-pointer"
            title="Tambah Regulasi"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-emerald-50/10 flex items-center justify-between gap-4">
          <div className="text-sm font-medium text-slate-600">
            Daftar Regulasi & Baku Mutu
          </div>
          <div className="text-sm text-slate-500">
            {data.items.length} dari {data.total} regulasi
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-bold text-emerald-900 px-6">Nama Regulasi</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Kode</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Parameter</TableHead>
                <TableHead className="text-center font-bold text-emerald-900 px-4">Status</TableHead>
                <TableHead className="text-center font-bold text-emerald-900 px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="py-20"><TableSkeleton rows={5} /></TableCell></TableRow>
              ) : data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <EmptyState title="Belum ada regulasi" description="Tambahkan regulasi baku mutu pertama Anda." />
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-emerald-50/10 transition-colors">
                    <TableCell className="px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-slate-800">{item.name}</span>
                          
                          {quickEditId === item.id ? (
                            <div className="flex items-center gap-2 mt-1 animate-in fade-in slide-in-from-left-2 duration-200">
                              <Input
                                value={quickEditValue}
                                onChange={(e) => setQuickEditValue(e.target.value)}
                                className="h-8 text-[10px] py-0 px-2 min-w-[200px]"
                                placeholder="NO2, SO2, CO..."
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleQuickEditSave(item.id);
                                  if (e.key === "Escape") setQuickEditId(null);
                                }}
                              />
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50" onClick={() => handleQuickEditSave(item.id)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => setQuickEditId(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group mt-1">
                              <div className="flex flex-wrap gap-1">
                                {(item.parameters_list || []).length === 0 ? (
                                  <span className="text-[10px] text-slate-400 italic">Belum ada parameter</span>
                                ) : (
                                  <>
                                    {(item.parameters_list || []).slice(0, 3).map((p: string, i: number) => (
                                      <span key={i} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md border border-slate-200">{p}</span>
                                    ))}
                                    {(item.parameters_list || []).length > 3 && (
                                      <span className="text-[9px] text-slate-400">+{item.parameters_list.length - 3} lagi</span>
                                    )}
                                  </>
                                )}
                              </div>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 text-slate-300 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-all"
                                onClick={() => {
                                  setQuickEditId(item.id);
                                  setQuickEditValue((item.parameters_list || []).join(", "));
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">{item.code || "-"}</code>
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-bold">
                        {item.parameters_list?.length || 0} Parameter
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center px-4">
                      {getStatusBadge(item.status)}
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
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View Card List */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-10 text-center"><ChemicalLoader /></div>
          ) : data.items.map((item: any) => (
            <div key={item.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 leading-tight">{item.name}</h4>
                    <p className="text-[10px] font-mono text-slate-500 mt-1">{item.code || "Tanpa Kode"}</p>
                  </div>
                </div>
                {getStatusBadge(item.status)}
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between group">
                  <div className="flex flex-wrap gap-1 flex-1">
                    {(item.parameters_list || []).length === 0 ? (
                      <span className="text-[10px] text-slate-400 italic">Belum ada parameter</span>
                    ) : (
                      (item.parameters_list || []).map((p: string, i: number) => (
                        <span key={i} className="text-[9px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-100">{p}</span>
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
                        setQuickEditValue((item.parameters_list || []).join(", "));
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {quickEditId === item.id && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Input
                      value={quickEditValue}
                      onChange={(e) => setQuickEditValue(e.target.value)}
                      className="h-8 text-[10px] py-0 px-2 flex-1"
                      placeholder="NO2, SO2, CO..."
                      autoFocus
                    />
                    <Button size="icon" className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleQuickEditSave(item.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8 text-red-500" onClick={() => setQuickEditId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Badge variant="outline" className="text-[10px] font-bold border-blue-200 text-blue-700 bg-blue-50">
                  {item.parameters_list?.length || 0} Parameter
                </Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-emerald-600" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-500 font-medium">Total {data.total} regulasi</p>
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
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          handleReset();
          setEditingItem(null);
        }
      }}>
        <DialogContent className="sm:max-w-[550px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-700 p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2 text-xl font-bold">
                <FileText className="h-6 w-6" />
                {editingItem ? "Edit Regulasi" : "Regulasi Baru"}
              </DialogTitle>
              <DialogDescription className="text-emerald-100/80">
                Masukkan detail standar baku mutu yang akan digunakan sebagai referensi pengujian.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <form onSubmit={onSubmit} className="p-6 space-y-5 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Nama Regulasi *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: SNI 8557:2018"
                  required
                  className="h-11 rounded-xl focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Kode Regulasi</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Contoh: SNI-8557-2018"
                  className="h-11 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase text-slate-500">Parameter Uji (Tag System)</Label>
              <div className="flex gap-2">
                <Input
                  value={parameterInput}
                  onChange={(e) => setParameterInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addParameter();
                    }
                  }}
                  placeholder="Ketik parameter (misal: NO2) lalu Enter..."
                  className="h-11 rounded-xl focus:ring-emerald-500"
                />
                <Button type="button" onClick={addParameter} className="h-11 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 border-none">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200 min-h-[100px]">
                {formData.parameters_list?.length === 0 && (
                  <p className="text-xs text-slate-400 italic m-auto text-center">Belum ada parameter.<br/>Tambahkan parameter utama dari regulasi ini.</p>
                )}
                {formData.parameters_list?.map((param, index) => (
                  <Badge key={index} className="bg-emerald-600 hover:bg-emerald-700 text-white pl-3 pr-1 py-1 rounded-lg flex items-center gap-1 transition-all animate-in zoom-in duration-200">
                    <span className="text-xs font-bold">{param}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeParameter(index)}
                      className="h-5 w-5 text-emerald-200 hover:text-white hover:bg-white/20 rounded-md"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Status Aktif</Label>
              <Select
                onValueChange={(val) => setFormData({ ...formData, status: val })}
                defaultValue={formData.status || "active"}
              >
                <SelectTrigger className="h-11 rounded-xl cursor-pointer">
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.filter(opt => opt.value !== "all").map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4 border-t gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-12 font-bold text-slate-400">Batal</Button>
              <LoadingButton type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl shadow-lg font-bold" loading={submitting} loadingText="Menyimpan...">
                {editingItem ? "Update Regulasi" : "Simpan Regulasi"}
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
            <AlertDialogDescription className="pt-4">
              <div>
                Apakah Anda yakin ingin menghapus regulasi ini?
                <div className="mt-2 text-sm text-amber-600 font-medium">⚠️ Data akan dihapus permanen dari katalog.</div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Loading Overlay */}
      <LoadingOverlay
        isOpen={submitting}
        title="Menyimpan Data..."
        description="Regulasi sedang disimpan"
        variant="default"
      />
    </div>
  );
}
