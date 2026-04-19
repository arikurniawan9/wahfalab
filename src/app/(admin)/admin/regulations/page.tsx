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
  Search,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  ChevronDown,
  X,
  RotateCcw,
  Save,
  Tag,
  Info,
  FlaskConical,
  Download,
  Upload
} from "lucide-react";
import { ChemicalLoader, LoadingOverlay, LoadingButton, TableSkeleton, EmptyState } from "@/components/ui";
import {
  getRegulations,
  createOrUpdateRegulation,
  deleteRegulation,
  importRegulations,
  type RegulationInput
} from "@/lib/actions/regulation";
import { toast } from "sonner";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  const [editingItem, setEditingItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<RegulationInput>({
    name: "",
    description: "",
    status: "active",
    parameter_tags: []
  });
  const [parameterInput, setParameterInput] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

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
      description: item.description || "",
      status: item.status || "active",
      parameter_tags: (item.parameters || []).map((p: any) => p.parameter)
    });
    
    // Scroll to form on mobile
    if (window.innerWidth < 1024) {
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleReset = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      status: "active",
      parameter_tags: []
    });
    setParameterInput("");
  };

  const addParameter = () => {
    const val = parameterInput.trim();
    if (!val) return;
    
    const inputParts = val.split(',').map(p => p.trim()).filter(p => p !== "");
    const currentTags = formData.parameter_tags || [];
    const newTags = [...currentTags];
    
    inputParts.forEach(tag => {
      if (!newTags.includes(tag)) {
        newTags.push(tag);
      }
    });

    setFormData({ ...formData, parameter_tags: newTags });
    setParameterInput("");
  };

  const removeParameter = (tag: string) => {
    setFormData({
      ...formData,
      parameter_tags: (formData.parameter_tags || []).filter(t => t !== tag)
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nama regulasi wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createOrUpdateRegulation(formData, editingItem?.id);
      
      if (result.success) {
        handleReset();
        loadData();
        toast.success(editingItem ? "Regulasi berhasil diperbarui" : "Regulasi berhasil ditambahkan");
      } else {
        toast.error(result.error || "Gagal menyimpan data");
      }
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan sistem");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    const headers = ["Name", "Description", "Parameters", "Status"];
    const csvData = (data?.items || []).map((item: any) => [
      item.name,
      item.description || "",
      (item.parameters || []).map((p: any) => p.parameter).join(", "),
      item.status
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `wahfalab-regulations-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Data berhasil diekspor ke CSV");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubmitting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split("\n").filter(r => r.trim() !== "");
        if (rows.length < 2) {
          toast.error("File CSV kosong atau tidak valid");
          return;
        }

        const headers = rows[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
        
        const jsonData = rows.slice(1).map(row => {
          const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
          const obj: any = {};
          headers.forEach((header, i) => {
            obj[header] = values[i];
          });
          return obj;
        });

        const result = await importRegulations(jsonData);
        if (result.success) {
          toast.success(`Impor Selesai: ${result.successCount} berhasil, ${result.errorCount} gagal.`);
          loadData();
        } else {
          toast.error(result.error || "Gagal mengimpor data");
        }
      } catch (error: any) {
        toast.error("Format file tidak valid: " + error.message);
      } finally {
        setSubmitting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleDelete = (id: string) => {
    setDeleteItemId(id);
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    try {
      const result = await deleteRegulation(deleteItemId);
      if (result.success) {
        loadData();
        toast.success("Regulasi berhasil dihapus");
      } else {
        toast.error(result.error);
      }
      setDeleteItemId(null);
    } catch (error: any) {
      toast.error("Gagal menghapus regulasi");
    }
  };

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    if (!option) return null;
    return (
      <Badge variant="outline" className={cn("capitalize rounded-lg px-3 py-1", option.color)}>
        {option.label}
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-8 lg:p-10 pb-24 md:pb-10">
      {/* Compact Header Section with Contrast Green Theme */}
      <div className="mb-6 overflow-hidden rounded-3xl bg-emerald-900 shadow-xl border border-emerald-700/50">
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-500 p-4 md:p-5 text-white relative overflow-hidden">
          {/* Light Green Decorative Glows */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-[60px]" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                <FileText className="h-5 w-5 text-emerald-200" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-black tracking-tight text-white leading-none">
                  Manajemen Regulasi
                </h1>
                <p className="text-emerald-100/60 text-[10px] md:text-xs font-medium mt-1">
                  Pusat kendali standar baku mutu laboratorium WahfaLab.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="hidden lg:block text-right border-r border-white/10 pr-4">
                <p className="text-emerald-300 text-[8px] font-bold uppercase tracking-widest mb-0.5">Status Katalog</p>
                <p className="text-lg font-black text-white leading-none">{data.total} <span className="text-emerald-300 text-[10px] font-bold uppercase tracking-normal">Item</span></p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white/10 border-white/20 hover:bg-white/20 text-white rounded-xl h-9 px-4 backdrop-blur-md transition-all text-xs font-bold"
                onClick={() => loadData()}
              >
                <RotateCcw className={cn("h-3.5 w-3.5 mr-2", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: FORM */}
        <div ref={formRef} className="lg:col-span-1 space-y-6">
          <Card className="rounded-3xl border-none shadow-xl shadow-emerald-900/5 overflow-hidden sticky top-24">
            <CardContent className="p-6">
              <form onSubmit={onSubmit} className="space-y-6">
                {/* Mode Indicator */}
                <div className={cn(
                  "flex items-center gap-2 p-3 rounded-2xl text-xs font-bold uppercase tracking-wider mb-2",
                  editingItem ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                )}>
                  {editingItem ? <RotateCcw className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {editingItem ? "Mode Perbarui Data" : "Tambah Data Baru"}
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nama Regulasi / Aturan *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Misal: PPRI No. 22 Tahun 2021"
                    className="h-12 rounded-xl focus:ring-emerald-500 border-slate-200 shadow-sm"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Daftar Parameter (Cepat)</Label>
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
                      placeholder="Ketik lalu Enter..."
                      className="h-12 rounded-xl focus:ring-emerald-500 border-slate-200 shadow-sm"
                    />
                    <Button 
                      type="button" 
                      onClick={addParameter} 
                      className="h-12 w-12 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 border-none shrink-0 transition-all shadow-sm"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 min-h-[120px] max-h-[250px] overflow-y-auto custom-scrollbar">
                    {(formData.parameter_tags || []).length === 0 && (
                      <div className="flex flex-col items-center justify-center m-auto text-center space-y-2 opacity-40">
                        <Tag className="h-6 w-6 text-slate-400" />
                        <p className="text-[10px] text-slate-500 font-medium px-4 leading-tight">
                          Belum ada parameter.<br/>Ketik nama parameter di atas untuk menambahkan.
                        </p>
                      </div>
                    )}
                    {(formData.parameter_tags || []).map((tag, index) => (
                      <Badge key={index} className="bg-white border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 pl-3 pr-1 py-1.5 rounded-lg flex items-center gap-2 transition-all group shadow-sm">
                        <span className="text-xs font-bold">{tag}</span>
                        <X 
                          className="h-3.5 w-3.5 cursor-pointer text-slate-300 group-hover:text-red-500" 
                          onClick={() => removeParameter(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Deskripsi Tambahan</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Catatan mengenai regulasi ini..."
                    className="rounded-xl border-slate-200 shadow-sm min-h-[80px] focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Status Operasional</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 shadow-sm bg-white">
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active" className="cursor-pointer">Aktif</SelectItem>
                      <SelectItem value="inactive" className="cursor-pointer">Tidak Aktif</SelectItem>
                      <SelectItem value="draft" className="cursor-pointer">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 flex gap-3">
                  {editingItem && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleReset} 
                      className="h-12 rounded-xl flex-1 font-bold text-slate-500 border-slate-200 hover:bg-slate-50 transition-all"
                    >
                      Batal
                    </Button>
                  )}
                  <LoadingButton 
                    type="submit" 
                    className={cn(
                      "h-12 rounded-xl font-bold shadow-lg flex-[2] transition-all duration-300",
                      editingItem 
                        ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" 
                        : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                    )}
                    loading={submitting}
                    loadingText={editingItem ? "Memperbarui..." : "Menyimpan..."}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingItem ? "Update Regulasi" : "Simpan Regulasi"}
                  </LoadingButton>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: TABLE */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[2rem] border-none shadow-xl shadow-emerald-900/5 overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-lg font-bold text-slate-800">Daftar Katalog Regulasi</CardTitle>
                <CardDescription className="text-[11px] font-medium text-slate-400">Total {data.total} regulasi terdaftar dalam sistem.</CardDescription>
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    placeholder="Cari regulasi..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9 h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-emerald-500 transition-all"
                  />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImport}
                  />
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 w-10 rounded-xl cursor-pointer shadow-sm border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                    title="Impor CSV"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleExport}
                    className="h-10 w-10 rounded-xl cursor-pointer shadow-sm border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                    title="Ekspor CSV"
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className="h-10 w-10 cursor-pointer rounded-xl border-slate-200 text-slate-500 hover:text-emerald-600 transition-all">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-4 rounded-2xl shadow-2xl border-none" align="end">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-slate-400">Urutkan</Label>
                          <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="h-9 rounded-lg border-slate-100">
                              <SelectValue placeholder="Pilih..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="name">Nama Regulasi</SelectItem>
                              <SelectItem value="created_at">Tanggal Input</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-slate-400">Status</Label>
                          <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="h-9 rounded-lg border-slate-100">
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
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="h-10 w-10 rounded-xl cursor-pointer shadow-sm border-slate-200 text-slate-500"
                    title={`Urutkan ${sortOrder === "asc" ? "Menurun" : "Menaik"}`}
                  >
                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", sortOrder === "asc" && "rotate-180")} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none">
                      <TableHead className="font-black text-slate-400 h-14 px-6 text-[10px] uppercase tracking-wider">Informasi Regulasi</TableHead>
                      <TableHead className="font-black text-slate-400 h-14 px-4 text-center text-[10px] uppercase tracking-wider">Layanan</TableHead>
                      <TableHead className="font-black text-slate-400 h-14 px-4 text-center text-[10px] uppercase tracking-wider">Status</TableHead>
                      <TableHead className="font-black text-slate-400 h-14 px-6 text-center text-[10px] uppercase tracking-wider">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={4} className="py-20"><TableSkeleton rows={5} /></TableCell></TableRow>
                    ) : data.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-20 text-center">
                          <EmptyState title="Katalog Kosong" description="Tidak ada regulasi yang ditemukan sesuai pencarian Anda." />
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.items.map((item: any) => (
                        <TableRow key={item.id} className={cn(
                          "transition-all duration-300 border-b border-slate-50",
                          editingItem?.id === item.id ? "bg-blue-50/40" : "hover:bg-slate-50/30"
                        )}>
                          <TableCell className="px-6 py-5">
                            <div className="space-y-3">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                              </div>
                              
                              <div className="flex flex-wrap gap-1.5">
                                {(item.parameters || []).length === 0 ? (
                                  <span className="text-[10px] text-slate-400 italic font-medium flex items-center gap-1">
                                    <Info className="h-3 w-3" /> Tanpa parameter
                                  </span>
                                ) : (
                                  (item.parameters || []).slice(0, 5).map((p: any, i: number) => (
                                    <Badge key={i} variant="secondary" className="text-[9px] font-bold bg-white text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md shadow-sm">
                                      {p.parameter}
                                    </Badge>
                                  ))
                                )}
                                {(item.parameters || []).length > 5 && (
                                  <Badge className="text-[9px] font-black text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100 px-2 py-0.5 rounded-md shadow-sm">
                                    +{(item.parameters || []).length - 5}
                                  </Badge>
                                )}
                              </div>
                              
                              {item.description && (
                                <p className="text-[10px] text-slate-400 line-clamp-1 italic max-w-xs">{item.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center px-4">
                            <div className="flex flex-col items-center justify-center">
                              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center mb-1">
                                <FlaskConical className="h-4 w-4 text-slate-400" />
                              </div>
                              <span className="text-xs font-black text-slate-600">{item._count?.services || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center px-4">
                            {getStatusBadge(item.status)}
                          </TableCell>
                          <TableCell className="text-center px-6">
                            <div className="flex justify-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-xl transition-all"
                                onClick={() => handleEdit(item)}
                                title="Edit Regulasi"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-xl transition-all"
                                onClick={() => handleDelete(item.id)}
                                title="Hapus Permanen"
                              >
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

              {/* Pagination */}
              <div className="p-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/30">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Tampilkan</p>
                  <Select value={limit.toString()} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                    <SelectTrigger className="h-9 w-20 text-xs rounded-xl border-slate-200 bg-white shadow-sm font-bold">
                      <SelectValue placeholder={limit.toString()} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10" className="font-bold">10</SelectItem>
                      <SelectItem value="25" className="font-bold">25</SelectItem>
                      <SelectItem value="50" className="font-bold">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-10 px-4 rounded-xl border-slate-200 bg-white shadow-sm font-bold text-slate-500 hover:bg-slate-50"
                    disabled={page === 1} 
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Sebelumnya
                  </Button>
                  <div className="text-xs font-black px-5 py-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200">
                    {page} <span className="opacity-60 mx-1">/</span> {data.totalPages || 1}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-10 px-4 rounded-xl border-slate-200 bg-white shadow-sm font-bold text-slate-500 hover:bg-slate-50"
                    disabled={page === data.totalPages} 
                    onClick={() => setPage(p => p + 1)}
                  >
                    Selanjutnya
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteItemId !== null} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <div className="h-16 w-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mb-6 border border-red-100 shadow-inner">
              <Trash2 className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-slate-800 leading-tight">
              Hapus Regulasi dari Katalog?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 pt-2 text-sm leading-relaxed">
              Tindakan ini tidak dapat dibatalkan. Regulasi akan dihapus secara permanen beserta seluruh daftar parameternya dari sistem WahfaLab.
              <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700 text-xs font-bold leading-relaxed">
                ⚠️ PERINGATAN: Pastikan regulasi ini tidak sedang digunakan oleh layanan aktif manapun agar tidak merusak data pelaporan.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 pt-8">
            <AlertDialogCancel className="rounded-2xl h-14 border-slate-200 text-slate-500 font-bold px-6">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 rounded-2xl h-14 px-8 font-black shadow-xl shadow-red-200 transition-all active:scale-95"
            >
              YA, HAPUS PERMANEN
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Full Page Overlay for initial loading if needed */}
      {submitting && <LoadingOverlay isOpen={submitting} title="Proses Data..." description="Sedang mensinkronkan data dengan database WahfaLab." />}
    </div>
  );
}
