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
import { ChemicalLoader, LoadingOverlay, LoadingButton, EmptyState } from "@/components/ui";
import { 
  getFieldAssistants, 
  createFieldAssistant, 
  updateFieldAssistant, 
  deleteFieldAssistant 
} from "@/lib/actions/field-assistant";
import { toast } from "sonner";
import { OPERATOR_LOADING_COPY, PROCESSING_TEXT } from "@/lib/constants/loading";
import { OPERATOR_EMPTY_TEXT, OPERATOR_TOAST_TEXT } from "@/lib/constants/operator-copy";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";

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
      setAssistants(data?.items || []);
    } catch (error) {
      toast.error(OPERATOR_TOAST_TEXT.loadFailed);
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
      toast.error(error.message || OPERATOR_TOAST_TEXT.saveFailed);
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
      toast.error(OPERATOR_TOAST_TEXT.deleteFailed);
    }
  };

  const filteredAssistants = assistants.filter(a => 
    a.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (a.phone && a.phone.includes(search))
  );

  if (loading) return <ChemicalLoader fullScreen />;

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      <OperatorPageHeader
        icon={UsersIcon}
        title="Database Asisten Lapangan"
        description="Kelola data asisten untuk penugasan sampling"
        statsLabel="Total Asisten"
        statsValue={assistants.length}
        onRefresh={loadAssistants}
        refreshing={loading}
        actions={(
          <Button
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
            className="bg-white/10 border border-white/20 hover:bg-white/20 text-white h-9 px-4 rounded-xl shadow-none font-bold text-[10px] uppercase tracking-widest"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Asisten
          </Button>
        )}
      />

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
        <div className="p-6 border-b bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              placeholder="Cari nama atau no. telepon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-11 rounded-xl border-slate-200 bg-white focus-visible:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="font-black text-slate-400 h-14 uppercase text-[10px] tracking-wider px-8">Nama Lengkap</TableHead>
                <TableHead className="font-black text-slate-400 h-14 uppercase text-[10px] tracking-wider px-4">Kontak</TableHead>
                <TableHead className="font-black text-slate-400 h-14 uppercase text-[10px] tracking-wider px-4">Alamat</TableHead>
                <TableHead className="font-black text-slate-400 h-14 uppercase text-[10px] tracking-wider px-8 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssistants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-20 text-center">
                    <EmptyState 
                      title={OPERATOR_EMPTY_TEXT.noAssistant}
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
                        {!assistant.phone && !assistant.email && <span className="text-xs text-slate-400 italic">{OPERATOR_EMPTY_TEXT.noContact}</span>}
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
        <DialogContent className="sm:max-w-xl p-0 border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <DialogHeader className="bg-emerald-700 p-6 text-white border-b border-emerald-600/40">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center">
                <User className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none">
                  {editingAssistant ? "Edit" : "Tambah"} Asisten Lapangan
                </DialogTitle>
                <DialogDescription className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-1">
                  Kelola data petugas untuk administrasi dan surat tugas.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 p-6 md:p-8 bg-slate-50/20">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nama Lengkap</Label>
              <Input 
                value={formData.full_name} 
                onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                placeholder="Nama asisten..." 
                required 
                className="h-12 rounded-xl border-2 border-slate-100 bg-white font-semibold"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">No. Telepon / WA</Label>
                <Input 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  placeholder="0812..." 
                  className="h-12 rounded-xl border-2 border-slate-100 bg-white font-semibold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email (Opsional)</Label>
                <Input 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  type="email" 
                  placeholder="email@example.com" 
                  className="h-12 rounded-xl border-2 border-slate-100 bg-white font-semibold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Alamat Lengkap</Label>
              <Input 
                value={formData.address} 
                onChange={(e) => setFormData({...formData, address: e.target.value})} 
                placeholder="Alamat domisili..." 
                className="h-12 rounded-xl border-2 border-slate-100 bg-white font-semibold"
              />
            </div>
            <DialogFooter className="pt-4 flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                disabled={submitting}
                className="w-full sm:flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-emerald-700 hover:bg-emerald-50"
              >
                Batal
              </Button>
              <LoadingButton
                type="submit"
                className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-900/20"
                loading={submitting}
                loadingText={PROCESSING_TEXT}
              >
                {editingAssistant ? "Simpan Perubahan" : "Tambahkan Data"}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <LoadingOverlay isOpen={submitting} title={OPERATOR_LOADING_COPY.title} description={OPERATOR_LOADING_COPY.description} variant="transparent" />
    </div>
  );
}
