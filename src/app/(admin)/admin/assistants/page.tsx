"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  User,
  Users as UsersIcon,
  Phone,
  MapPin,
  Mail,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  PlusCircle
} from "lucide-react";
import { ChemicalLoader, LoadingOverlay, LoadingButton, EmptyState } from "@/components/ui";
import { 
  getFieldAssistants, 
  createFieldAssistant, 
  updateFieldAssistant, 
  deleteFieldAssistant 
} from "@/lib/actions/field-assistant";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function AssistantManagementPage() {
  const [assistants, setAssistants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: ""
  });

  const loadAssistants = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFieldAssistants();
      setAssistants(data);
    } catch (error) {
      toast.error("Gagal memuat data asisten");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssistants();
  }, [loadAssistants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingAssistant) {
        await updateFieldAssistant(editingAssistant.id, formData);
        toast.success("Asisten berhasil diperbarui");
      } else {
        await createFieldAssistant(formData);
        toast.success("Asisten baru berhasil ditambahkan");
      }
      setIsDialogOpen(false);
      resetForm();
      loadAssistants();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      phone: "",
      email: "",
      address: ""
    });
    setEditingAssistant(null);
  };

  const handleEdit = (assistant: any) => {
    setEditingAssistant(assistant);
    setFormData({
      full_name: assistant.full_name,
      phone: assistant.phone || "",
      email: assistant.email || "",
      address: assistant.address || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data asisten ini?")) return;
    try {
      await deleteFieldAssistant(id);
      toast.success("Asisten berhasil dihapus");
      loadAssistants();
    } catch (error: any) {
      toast.error("Gagal menghapus asisten");
    }
  };

  const filteredItems = useMemo(() => {
    return assistants.filter(a => 
      a.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (a.phone && a.phone.includes(search)) ||
      (a.email && a.email.toLowerCase().includes(search.toLowerCase()))
    );
  }, [assistants, search]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredItems.slice(startIndex, startIndex + limit);
  }, [filteredItems, page, limit]);

  const totalPages = Math.ceil(filteredItems.length / limit);

  // Helper function to format WA link
  const formatWALink = (phone: string) => {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, "");
    // If starts with 0, replace with 62
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    }
    // If it doesn't start with 62 or +62, and is quite short, might need more logic
    // but for ID context, 0 -> 62 is the most common
    return `https://wa.me/${cleaned}`;
  };

  if (loading && assistants.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <ChemicalLoader />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-emerald-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-emerald-600" />
            DATABASE ASISTEN LAPANGAN
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] opacity-80">
            Kelola data personel asisten untuk kebutuhan administrasi & surat tugas
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 h-11 px-6 shadow-lg shadow-emerald-900/20"
        >
          <PlusCircle className="h-4 w-4" />
          Tambah Asisten
        </Button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-200 overflow-hidden">
        <div className="p-8 border-b bg-gradient-to-br from-slate-50 to-white">
          <div className="relative max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              placeholder="Cari nama, email, atau no. telepon..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-12 h-14 rounded-2xl border-slate-200 bg-white shadow-inner focus-visible:ring-emerald-500 font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none">
                <TableHead className="px-8 py-5 font-black text-slate-900 uppercase text-[10px] tracking-[0.2em]">Data Personel</TableHead>
                <TableHead className="px-4 py-5 font-black text-slate-900 uppercase text-[10px] tracking-[0.2em]">Informasi Kontak</TableHead>
                <TableHead className="px-4 py-5 font-black text-slate-900 uppercase text-[10px] tracking-[0.2em]">Alamat Domisili</TableHead>
                <TableHead className="px-8 py-5 font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={4} className="py-10 px-8"><div className="h-14 bg-slate-50 animate-pulse rounded-2xl" /></TableCell></TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-32 text-center">
                    <EmptyState 
                      title="Data asisten tidak ditemukan" 
                      description="Belum ada data asisten yang sesuai dengan kriteria pencarian Anda."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((assistant) => (
                  <TableRow key={assistant.id} className="group hover:bg-emerald-50/10 transition-all border-slate-100/60">
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm shadow-sm border border-emerald-50 group-hover:scale-110 transition-transform">
                          {assistant.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-black text-slate-800 tracking-tight">{assistant.full_name}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Assistant Field Officer</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex flex-col gap-2">
                        {assistant.phone && (
                          <a 
                            href={formatWALink(assistant.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-blue-50/50 px-2 py-1.5 rounded-lg border border-blue-100 w-fit hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all cursor-pointer"
                            title="Hubungi via WhatsApp Web"
                          >
                            <Phone className="h-3 w-3 text-blue-500" /> {assistant.phone}
                          </a>
                        )}
                        {assistant.email && (
                          <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500 ml-1">
                            <Mail className="h-3 w-3 text-slate-300" /> {assistant.email}
                          </div>
                        )}
                        {!assistant.phone && !assistant.email && (
                          <span className="text-[10px] font-bold text-slate-300 uppercase italic">Tanpa Kontak</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-start gap-2 max-w-[250px]">
                        <MapPin className="h-3.5 w-3.5 text-slate-300 mt-0.5 shrink-0" />
                        <span className="text-xs font-medium text-slate-500 leading-relaxed" title={assistant.address}>
                          {assistant.address || "Alamat belum diatur"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 text-right">
                      <div className="flex justify-end gap-2 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(assistant)} 
                          className="h-9 w-9 text-emerald-600 hover:bg-emerald-100 rounded-xl bg-white border border-slate-100 shadow-sm"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(assistant.id)} 
                          className="h-9 w-9 text-red-500 hover:bg-red-50 rounded-xl bg-white border border-slate-100 shadow-sm"
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

        {/* Pagination Footer */}
        <div className="p-8 bg-slate-50/80 border-t flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Record: {filteredItems.length} Assistants</span>
            <div className="h-4 w-[1px] bg-slate-300 hidden md:block" />
            <div className="hidden md:flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Database Sync Active</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-11 w-11 rounded-2xl border-slate-200 shadow-sm bg-white" 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="h-11 px-6 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-900 shadow-sm">
              {page} / {totalPages || 1}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-11 w-11 rounded-2xl border-slate-200 shadow-sm bg-white" 
              disabled={page === totalPages || totalPages === 0} 
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* DIALOG FORM */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-xl p-0 border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <div className="bg-emerald-700 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center border border-white/20">
                <User className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black uppercase tracking-tight">
                  {editingAssistant ? "Perbarui Data" : "Registrasi Asisten"}
                </DialogTitle>
                <DialogDescription className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest">
                  Personal Database Management
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)} className="text-white/60 hover:text-white rounded-xl">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Nama Lengkap</Label>
                <Input 
                  value={formData.full_name} 
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                  placeholder="Masukkan nama lengkap asisten..." 
                  required 
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">No. Telepon / WA</Label>
                  <Input 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    placeholder="Contoh: 08123456789" 
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Email (Opsional)</Label>
                  <Input 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    type="email" 
                    placeholder="asisten@wahfalab.com" 
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Alamat Domisili</Label>
                <Input 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                  placeholder="Alamat lengkap domisili saat ini..." 
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/50"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="flex-1 font-black text-[10px] uppercase h-12 rounded-2xl text-slate-400">
                Batal
              </Button>
              <LoadingButton
                type="submit"
                loading={submitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase h-12 rounded-2xl shadow-lg shadow-emerald-900/20"
              >
                {editingAssistant ? "Simpan Perubahan" : "Konfirmasi Registrasi"}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <LoadingOverlay isOpen={submitting} title="Menyimpan Data..." description="Sedang mensinkronisasi data personel ke database" />
    </div>
  );
}
