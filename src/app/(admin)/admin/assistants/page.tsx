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
  User,
  Users,
  Phone,
  MapPin,
  Mail,
  Download,
  RotateCcw,
  Save,
  ChevronLeft,
  ChevronRight,
  Contact2,
  ShieldCheck,
  X,
  Eye,
  Info,
  Calendar
} from "lucide-react";
import { ChemicalLoader, LoadingOverlay, LoadingButton, TableSkeleton, EmptyState } from "@/components/ui";
import { 
  getFieldAssistants, 
  createFieldAssistant, 
  updateFieldAssistant, 
  deleteFieldAssistant 
} from "@/lib/actions/field-assistant";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

export default function AssistantManagementPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: ""
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getFieldAssistants(page, limit, search);
      setData(result);
    } catch (error: any) {
      toast.error("Gagal memuat data asisten", {
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

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      full_name: item.full_name || "",
      email: item.email || "",
      phone: item.phone || "",
      address: item.address || ""
    });
    
    // Scroll to form on mobile
    if (window.innerWidth < 1024) {
      formRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleReset = () => {
    setEditingItem(null);
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      address: ""
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      toast.error("Nama lengkap wajib diisi");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Nomor WhatsApp wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const result = editingItem 
        ? await updateFieldAssistant(editingItem.id, formData)
        : await createFieldAssistant(formData);
      
      if (result.success) {
        handleReset();
        loadData();
        toast.success(editingItem ? "Data asisten diperbarui" : "Asisten baru terdaftar");
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
    const headers = ["Nama Lengkap", "Email", "WhatsApp", "Alamat"];
    const csvData = (data?.items || []).map((item: any) => [
      item.full_name,
      item.email || "-",
      item.phone || "-",
      item.address || "-"
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row: (string | number)[]) => row.map((cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `wahfalab-assistants-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Data asisten berhasil diekspor");
  };

  const handleDelete = (id: string) => {
    setDeleteItemId(id);
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    try {
      const result = await deleteFieldAssistant(deleteItemId);
      if (result.success) {
        loadData();
        toast.success("Data asisten berhasil dihapus");
      } else {
        toast.error(result.error || "Gagal menghapus data");
      }
      setDeleteItemId(null);
      setViewingItem(null);
    } catch (error: any) {
      toast.error("Gagal menghapus data");
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-10 pb-24 md:pb-10">
      {/* Compact Header Section with Contrast Green Theme */}
      <div className="mb-6 overflow-hidden rounded-3xl bg-emerald-900 shadow-xl border border-emerald-700/50">
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-500 p-4 md:p-5 text-white relative overflow-hidden">
          {/* Light Green Decorative Glows */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-[60px]" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                <Users className="h-5 w-5 text-emerald-200" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-black tracking-tight text-white leading-none uppercase">
                  Field Personnel
                </h1>
                <p className="text-emerald-100/60 text-[10px] md:text-xs font-medium mt-1 uppercase tracking-widest">
                  Manajemen Asisten Lapangan & Tim Sampling.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="hidden lg:block text-right border-r border-white/10 pr-4">
                <p className="text-emerald-300 text-[8px] font-bold uppercase tracking-widest mb-0.5">Total Personel</p>
                <p className="text-lg font-black text-white leading-none">{data.total} <span className="text-emerald-300 text-[10px] font-bold uppercase tracking-normal">Orang</span></p>
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
              <form onSubmit={onSubmit} className="space-y-5">
                {/* Mode Indicator */}
                <div className={cn(
                  "flex items-center gap-2 p-3 rounded-2xl text-xs font-bold uppercase tracking-wider mb-2",
                  editingItem ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                )}>
                  {editingItem ? <Pencil className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {editingItem ? "Perbarui Data Personel" : "Daftarkan Personel Baru"}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nama Lengkap *</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <Input
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Misal: Alexander Pierce"
                        className="pl-10 h-12 rounded-xl focus:ring-emerald-500 border-slate-200 shadow-sm font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email (Opsional)</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@email.com"
                        className="pl-10 h-12 rounded-xl focus:ring-emerald-500 border-slate-200 shadow-sm font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nomor WhatsApp *</Label>
                    <div className="relative group">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="628..."
                        className="pl-10 h-12 rounded-xl focus:ring-emerald-500 border-slate-200 shadow-sm font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Alamat Domisili</Label>
                    <div className="relative group">
                      <MapPin className="absolute left-3 top-4 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <Textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Alamat lengkap personel..."
                        className="pl-10 min-h-[100px] rounded-xl focus:ring-emerald-500 border-slate-200 shadow-sm font-bold resize-none py-3"
                      />
                    </div>
                  </div>
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
                      "h-12 rounded-xl font-bold shadow-lg flex-[2] transition-all duration-300 uppercase tracking-widest text-[10px]",
                      editingItem 
                        ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" 
                        : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                    )}
                    loading={submitting}
                    loadingText={editingItem ? "Memperbarui..." : "Menyimpan..."}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingItem ? "Update Personel" : "Simpan Personel"}
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
                <CardTitle className="text-lg font-bold text-slate-800">Daftar Tim Lapangan</CardTitle>
                <CardDescription className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter">Menampilkan {data.items.length} personel aktif saat ini.</CardDescription>
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-64 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    placeholder="Cari nama atau kontak..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9 h-11 rounded-xl bg-slate-50 border-none focus-visible:ring-emerald-500 transition-all font-medium"
                  />
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleExport}
                  className="h-10 w-10 rounded-xl cursor-pointer shadow-sm border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all shrink-0"
                  title="Ekspor CSV"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none">
                      <TableHead className="font-black text-slate-400 h-14 px-6 text-[10px] uppercase tracking-wider">Info Personel</TableHead>
                      <TableHead className="font-black text-slate-400 h-14 px-4 text-[10px] uppercase tracking-wider">Kontak</TableHead>
                      <TableHead className="font-black text-slate-400 h-14 px-6 text-center text-[10px] uppercase tracking-wider">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={3} className="py-20"><TableSkeleton rows={5} /></TableCell></TableRow>
                    ) : data.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-20 text-center">
                          <EmptyState title="Personel Kosong" description="Tidak ada data asisten yang ditemukan." />
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.items.map((item: any) => (
                        <TableRow key={item.id} className={cn(
                          "transition-all duration-300 border-b border-slate-50",
                          editingItem?.id === item.id ? "bg-blue-50/40" : "hover:bg-slate-50/30"
                        )}>
                          <TableCell className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 font-black text-xs">
                                {item.full_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-sm leading-none">{item.full_name}</span>
                                <span className="text-[10px] text-slate-400 font-medium mt-1">{item.email || "Tidak ada email"}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4">
                            <div className="flex items-center gap-2 text-emerald-600">
                              <Phone className="h-3 w-3" />
                              <span className="text-xs font-bold">{item.phone || "-"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center px-6">
                            <div className="flex justify-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all"
                                onClick={() => setViewingItem(item)}
                                title="Detail"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                                onClick={() => handleEdit(item)}
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 text-red-500 hover:bg-red-100 rounded-xl transition-all"
                                onClick={() => handleDelete(item.id)}
                                title="Hapus"
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
                    className="h-10 px-4 rounded-xl border-slate-200 bg-white shadow-sm font-bold text-slate-500"
                    disabled={page === 1} 
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Prev
                  </Button>
                  <div className="text-xs font-black px-5 py-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200">
                    {page} <span className="opacity-60 mx-1">/</span> {data.pages || 1}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-10 px-4 rounded-xl border-slate-200 bg-white shadow-sm font-bold text-slate-500"
                    disabled={page === data.pages} 
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DETAIL MODAL */}
      <Dialog open={viewingItem !== null} onOpenChange={(open) => !open && setViewingItem(null)}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-w-lg bg-white animate-in zoom-in-95 duration-300">
          {/* Modal Header with Profile Accent */}
          <div className="relative h-32 bg-emerald-900 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-600" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl" />
            
            <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-3xl bg-white p-1 shadow-2xl translate-y-8">
                  <div className="h-full w-full rounded-[1.2rem] bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-3xl border border-emerald-100">
                    {viewingItem?.full_name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="mb-2">
                  <Badge className="bg-emerald-400 text-emerald-950 font-black uppercase text-[8px] tracking-widest px-2 mb-1.5 border-none">Personel Aktif</Badge>
                  <DialogTitle className="text-xl font-black text-white leading-none uppercase tracking-tight">
                    {viewingItem?.full_name}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Detail informasi untuk personel {viewingItem?.full_name}
                  </DialogDescription>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-14 p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-emerald-500" /> Email Resmi
                </Label>
                <p className="text-sm font-bold text-slate-700 px-1 truncate">{viewingItem?.email || "-"}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-emerald-500" /> WhatsApp
                </Label>
                <p className="text-sm font-bold text-slate-700 px-1">{viewingItem?.phone || "-"}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-emerald-500" /> Lokasi Domisili
              </Label>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-600 leading-relaxed italic">
                  "{viewingItem?.address || "Alamat belum dilengkapi."}"
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
              <div className="h-8 w-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Info className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-amber-700 tracking-wider leading-none mb-1">Catatan Sistem</p>
                <p className="text-[9px] font-bold text-amber-600/70 leading-normal uppercase">Data ini digunakan otomatis untuk penerbitan Surat Tugas (STPC) & Surat Perjalanan Dinas.</p>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setViewingItem(null)}
                className="flex-1 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                Tutup
              </Button>
              <Button 
                onClick={() => {
                  handleEdit(viewingItem);
                  setViewingItem(null);
                }}
                className="flex-1 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-100"
              >
                <Pencil className="h-4 w-4 mr-2" /> Edit Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteItemId !== null} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <div className="h-16 w-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mb-6 border border-red-100 shadow-inner">
              <Trash2 className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-slate-800 leading-tight uppercase">
              Hapus Personel?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 pt-2 text-sm leading-relaxed">
              Tindakan ini tidak dapat dibatalkan. Seluruh data terkait asisten ini akan dihapus secara permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 pt-8">
            <AlertDialogCancel className="rounded-2xl h-14 border-slate-200 text-slate-500 font-bold px-6">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 rounded-2xl h-14 px-8 font-black shadow-xl shadow-red-200 transition-all active:scale-95"
            >
              YA, HAPUS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Full Page Overlay for initial loading if needed */}
      {submitting && <LoadingOverlay isOpen={submitting} title="Sinkronisasi Data..." description="Sedang menyimpan perubahan personel." />}
    </div>
  );
}

// Helper icons that were missing
function UserPlus(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}
