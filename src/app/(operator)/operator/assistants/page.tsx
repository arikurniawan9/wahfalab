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
  X
} from "lucide-react";
import { LoadingOverlay, LoadingButton, EmptyState } from "@/components/ui";
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

export default function OperatorAssistantManagementPage() {
  const [assistants, setAssistants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  
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

  const filteredAssistants = assistants.filter(a => 
    a.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (a.phone && a.phone.includes(search))
  );

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900 uppercase flex items-center gap-3">
            <UsersIcon className="h-6 w-6 text-emerald-600" />
            Database Asisten Lapangan
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola data asisten untuk penugasan sampling (Operasional).
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 h-11 px-6 rounded-2xl shadow-lg shadow-emerald-900/20 font-bold text-xs uppercase tracking-wider"
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Asisten
        </Button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
        <div className="p-6 border-b bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              placeholder="Cari nama atau no. telepon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 rounded-xl border-slate-200 focus-visible:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest px-8">Nama Lengkap</TableHead>
                <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest px-4">Kontak</TableHead>
                <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest px-4">Alamat</TableHead>
                <TableHead className="font-black text-slate-900 uppercase text-[10px] tracking-widest px-8 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={4} className="py-8 px-8"><div className="h-10 bg-slate-100 animate-pulse rounded-xl" /></TableCell></TableRow>
                ))
              ) : filteredAssistants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-20 text-center">
                    <EmptyState 
                      title="Belum ada data asisten" 
                      description="Tambahkan asisten lapangan untuk mulai menugaskan mereka bersama petugas utama."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssistants.map((assistant) => (
                  <TableRow key={assistant.id} className="hover:bg-emerald-50/10 transition-colors">
                    <TableCell className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                          {assistant.full_name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-800">{assistant.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex flex-col gap-1">
                        {assistant.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Phone className="h-3 w-3 text-slate-400" /> {assistant.phone}
                          </div>
                        )}
                        {assistant.email && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Mail className="h-3 w-3 text-slate-400" /> {assistant.email}
                          </div>
                        )}
                        {!assistant.phone && !assistant.email && <span className="text-xs text-slate-400 italic">Tidak ada kontak</span>}
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600 max-w-[200px]">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate" title={assistant.address}>{assistant.address || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(assistant)} className="h-9 w-9 text-emerald-600 hover:bg-emerald-100 rounded-xl">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(assistant.id)} className="h-9 w-9 text-red-500 hover:bg-red-50 rounded-xl">
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
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-md rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-emerald-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              {editingAssistant ? "Edit" : "Tambah"} Asisten Lapangan
            </DialogTitle>
            <DialogDescription>
              Data ini hanya untuk kelengkapan administrasi & surat tugas.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-emerald-600">Nama Lengkap</Label>
              <Input 
                value={formData.full_name} 
                onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                placeholder="Nama asisten..." 
                required 
                className="h-12 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-emerald-600">No. Telepon / WA</Label>
                <Input 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  placeholder="0812..." 
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-emerald-600">Email (Opsional)</Label>
                <Input 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  type="email" 
                  placeholder="email@example.com" 
                  className="h-12 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-emerald-600">Alamat Lengkap</Label>
              <Input 
                value={formData.address} 
                onChange={(e) => setFormData({...formData, address: e.target.value})} 
                placeholder="Alamat domisili..." 
                className="h-12 rounded-xl"
              />
            </div>
            <DialogFooter className="pt-4">
              <LoadingButton
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-emerald-900/20"
                loading={submitting}
              >
                {editingAssistant ? "Simpan Perubahan" : "Tambahkan Data"}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
