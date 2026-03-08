"use client";

import React, { useState, useEffect, useCallback, useMemo, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  Users as UsersIcon,
  Phone,
  MapPin,
  Mail,
  X,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  UserPlus,
  Download,
  ListTree,
  Save,
  Contact2,
  Settings2,
  Lock
} from "lucide-react";
import { LoadingOverlay, LoadingButton, TableSkeleton } from "@/components/ui";
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
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function AssistantManagementPage() {
  const [assistants, setAssistants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  
  // Modals state
  const [isRegDialogOpen, setIsRegDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [viewingAssistant, setViewingAssistant] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadAssistants = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFieldAssistants();
      setAssistants(data);
      setSelectedIds([]);
    } catch (error) {
      toast.error("Gagal memuat data asisten");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssistants();
  }, [loadAssistants]);

  const onRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    setSubmitting(true);
    try {
      await createFieldAssistant(data as any);
      setIsRegDialogOpen(false);
      loadAssistants();
      toast.success("Asisten baru terdaftar");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onQuickUpdate = async () => {
    setSubmitting(true);
    try {
      await updateFieldAssistant(viewingAssistant.id, editData);
      toast.success("Data asisten diperbarui");
      setIsEditMode(false);
      loadAssistants();
      setViewingAssistant({ ...viewingAssistant, ...editData });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    if (viewingAssistant) {
      setEditData({
        full_name: viewingAssistant.full_name || "",
        phone: viewingAssistant.phone || "",
        email: viewingAssistant.email || "",
        address: viewingAssistant.address || ""
      });
    }
    setIsEditMode(false);
  };

  const openDetail = (assistant: any) => {
    setViewingAssistant(assistant);
    setEditData({
      full_name: assistant.full_name || "",
      phone: assistant.phone || "",
      email: assistant.email || "",
      address: assistant.address || ""
    });
    setIsEditMode(false);
    setIsDetailDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      if (deleteId === "bulk") {
        for (const id of selectedIds) {
          await deleteFieldAssistant(id);
        }
        toast.success(`${selectedIds.length} asisten dihapus`);
      } else {
        await deleteFieldAssistant(deleteId);
        toast.success("Data dihapus");
      }
      loadAssistants();
      setDeleteId(null);
      setIsDetailDialogOpen(false);
    } catch (error) {
      toast.error("Gagal hapus data");
    }
  };

  const handleExport = () => {
    const csvData = filteredItems.map((a: any) => ({
      Nama: a.full_name, Phone: a.phone || '-', Email: a.email || '-', Alamat: a.address || '-'
    }));
    const csvContent = "data:text/csv;charset=utf-8," + Object.keys(csvData[0]).join(",") + "\n" + csvData.map((row: any) => Object.values(row).join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `assistants_wahfalab_${Date.now()}.csv`);
    link.click();
    toast.success("Export berhasil");
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedItems.length) setSelectedIds([]);
    else setSelectedIds(paginatedItems.map((a: any) => a.id));
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(sid => sid !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const filteredItems = useMemo(() => {
    return assistants.filter(a => 
      a.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (a.phone && a.phone.includes(search)) ||
      (a.email && a.email.toLowerCase().includes(search.toLowerCase()))
    );
  }, [assistants, search]);

  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredItems.slice(startIndex, startIndex + limit);
  }, [filteredItems, page, limit]);

  const totalPages = Math.ceil(filteredItems.length / limit);

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen font-[family-name:var(--font-geist-sans)] max-w-7xl mx-auto">
      {/* Header Ramping */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 rounded-xl shadow-sm"><UsersIcon className="h-5 w-5 text-amber-400" /></div>
          <div><h1 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Field Personnel</h1><p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.3em] mt-1 opacity-70">Asisten Lapangan & Sampling</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleExport} className="h-10 w-10 rounded-xl bg-white border-slate-200 shadow-sm text-slate-600 hover:text-amber-600 transition-all" title="Export CSV"><Download className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white border-slate-200 shadow-sm text-slate-600 hover:text-blue-600 transition-all" onClick={loadAssistants} title="Refresh Data"><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /></Button>
        </div>
      </div>

      <Card className="rounded-3xl bg-white shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden relative">
        {/* MULTI-DELETE TOOLBAR */}
        {selectedIds.length > 0 && (
          <div className="absolute top-0 left-0 right-0 z-20 h-14 bg-slate-900 text-white flex items-center justify-between px-6 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3"><div className="h-7 w-7 rounded bg-amber-500 text-slate-900 flex items-center justify-center font-black text-xs">{selectedIds.length}</div><p className="text-[9px] font-black uppercase tracking-widest">Personnel Selected</p></div>
            <div className="flex items-center gap-2"><Button variant="ghost" onClick={() => setSelectedIds([])} className="text-white/60 hover:text-white text-[8px] font-black uppercase">Cancel</Button><Button onClick={() => setDeleteId("bulk")} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg h-8 px-4 font-black text-[8px] uppercase tracking-widest active:scale-95 transition-all">Remove Selection</Button></div>
          </div>
        )}

        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" /><Input placeholder="Cari personel..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-12 h-11 bg-white border-none rounded-xl font-bold text-sm shadow-sm" /></div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={limit.toString()} onValueChange={(val) => { setLimit(parseInt(val)); setPage(1); }}><SelectTrigger className="w-full md:w-32 h-11 rounded-xl border-none bg-white font-black uppercase text-[9px] tracking-widest shadow-sm"><ListTree className="h-3.5 w-3.5 mr-2 text-slate-400" /><SelectValue placeholder="Limit" /></SelectTrigger><SelectContent className="rounded-xl border-none shadow-2xl"><SelectItem value="10" className="text-[9px] font-bold uppercase">10 Baris</SelectItem><SelectItem value="25" className="text-[9px] font-bold uppercase">25 Baris</SelectItem><SelectItem value="50" className="text-[9px] font-bold uppercase">50 Baris</SelectItem></SelectContent></Select>
            <Button size="icon" onClick={() => { setViewingAssistant(null); setIsRegDialogOpen(true); }} className="h-11 w-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-lg active:scale-95 transition-all" title="Tambah Personel Baru"><UserPlus className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="overflow-x-auto bg-white">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow className="border-b border-slate-100">
                <TableHead className="w-[50px] px-6 py-4 text-center"><Checkbox checked={selectedIds.length === paginatedItems.length && paginatedItems.length > 0} onCheckedChange={toggleSelectAll} /></TableHead>
                <TableHead className="px-6 py-4 font-bold text-slate-700 text-sm">Assistant Info</TableHead>
                <TableHead className="px-6 py-4 font-bold text-slate-700 text-sm">Contact</TableHead>
                <TableHead className="px-6 py-4 font-bold text-slate-700 text-sm">Location</TableHead>
                <TableHead className="px-6 py-4 text-right font-bold text-slate-700 text-sm">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="p-0"><TableSkeleton rows={limit} className="p-6" /></TableCell></TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-32 bg-white"><UsersIcon className="h-16 w-16 text-slate-100 mx-auto mb-4" /><p className="text-slate-300 font-black uppercase tracking-widest text-[11px]">No assistants found</p></TableCell></TableRow>
              ) : (
                paginatedItems.map((assistant) => (
                  <TableRow key={assistant.id} className={cn("hover:bg-slate-50 transition-all border-b border-slate-50 last:border-none", selectedIds.includes(assistant.id) && "bg-amber-50/20")}>
                    <TableCell className="px-6 py-4 text-center"><Checkbox checked={selectedIds.includes(assistant.id)} onCheckedChange={() => toggleSelect(assistant.id)} /></TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100 shrink-0 text-amber-600 font-black text-xs">{(assistant.full_name || 'A').charAt(0)}</div>
                        <div className="flex flex-col min-w-0"><span className="text-sm font-bold text-slate-900 truncate">{assistant.full_name}</span><span className="text-xs text-slate-500 truncate">{assistant.email || "No Email"}</span></div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4"><div className="flex items-center gap-2 text-emerald-600"><Phone className="h-3 w-3" /><span className="text-sm font-bold">{assistant.phone || "-"}</span></div></TableCell>
                    <TableCell className="px-6 py-4"><div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-slate-400" /><span className="text-sm font-semibold text-slate-600 truncate max-w-[150px]">{assistant.address || "N/A"}</span></div></TableCell>
                    <TableCell className="px-6 py-4 text-right"><Button variant="ghost" size="sm" onClick={() => openDetail(assistant)} className="h-8 px-3 rounded-lg font-medium text-slate-600 hover:text-amber-600 transition-all gap-1.5"><Settings2 className="h-3 w-3" /> Manage</Button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
          <p className="text-sm font-semibold text-slate-600">Total {filteredItems.length} Personnel</p>
          <div className="flex gap-1.5">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-white border-slate-200" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
            <div className="flex items-center px-3 text-sm font-semibold bg-white border border-slate-200 rounded-lg text-slate-700">{page} / {totalPages || 1}</div>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-white border-slate-200" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </Card>

      {/* REGISTRATION DIALOG */}
      <Dialog open={isRegDialogOpen} onOpenChange={setIsRegDialogOpen}>
        <DialogContent showCloseButton={false} className="max-w-2xl rounded-2xl border-none p-0 overflow-hidden shadow-2xl bg-white">
          <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/20"><UserPlus className="h-5 w-5 text-amber-400" /></div>
              <div><DialogTitle className="text-sm font-black uppercase tracking-widest text-white">Assistant Authorization</DialogTitle><DialogDescription className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Register new field & sampling team member</DialogDescription></div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsRegDialogOpen(false)} className="text-white/20 hover:text-white rounded-lg h-8 w-8"><X className="h-4 w-4" /></Button>
          </div>
          <form onSubmit={onRegisterSubmit} className="p-6 bg-white space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2"><Contact2 className="h-3 w-3 text-amber-500" /><span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Basic Profile</span></div>
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Identity Name</Label><Input name="full_name" className="h-9 rounded-lg bg-slate-50 border-none font-bold text-xs px-3 focus-visible:ring-amber-500 shadow-inner" placeholder="e.g Alexander Pierce" required /></div>
                  <div className="space-y-1"><Label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Official Email</Label><Input type="email" name="email" className="h-9 rounded-lg bg-slate-50 border-none font-bold text-xs px-3 focus-visible:ring-blue-500 shadow-inner" placeholder="name@email.com" /></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2"><Phone className="h-3 w-3 text-emerald-500" /><span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Contact & Address</span></div>
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">WhatsApp</Label><Input name="phone" className="h-9 rounded-lg bg-slate-50 border-none font-bold text-xs px-3 shadow-inner" placeholder="628..." required /></div>
                  <div className="space-y-1"><Label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Domicile Address</Label><Input name="address" className="h-9 rounded-lg bg-slate-50 border-none font-bold text-xs px-3 shadow-inner" placeholder="Complete address..." /></div>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-50 flex gap-3"><Button type="button" variant="ghost" onClick={() => setIsRegDialogOpen(false)} className="flex-1 h-10 rounded-lg font-black text-slate-400 uppercase text-[9px] tracking-widest border-none hover:bg-slate-100 transition-all">Cancel</Button><LoadingButton type="submit" loading={submitting} className="flex-[2] h-10 bg-slate-900 hover:bg-black text-white rounded-lg font-black uppercase text-[9px] tracking-[0.2em] shadow-xl active:scale-95 transition-all">Execute Registration</LoadingButton></div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DETAIL MODAL */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => { setIsDetailDialogOpen(open); if (!open) setIsEditMode(false); }}>
        <DialogContent showCloseButton={false} className="max-w-xl rounded-2xl border-none p-0 overflow-hidden shadow-2xl bg-white">
          <div className="bg-slate-900 p-5 text-white relative"><div className="flex items-center justify-between relative z-10"><div className="flex items-center gap-4"><div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center border-2 border-white/10 shadow-xl text-xl font-black overflow-hidden">{viewingAssistant?.full_name ? viewingAssistant.full_name.charAt(0).toUpperCase() : 'A'}</div><div className="space-y-0.5"><Badge className="bg-amber-500 text-white border-none text-[6px] font-black uppercase px-1 h-3 mb-1">Field Assistant</Badge><DialogTitle className="text-lg font-black uppercase tracking-tight text-white leading-none">{viewingAssistant?.full_name}</DialogTitle><div className="flex items-center gap-2 mt-1 text-slate-400 text-[7px] font-black uppercase tracking-widest"><ShieldCheck className="h-2.5 w-2.5 text-amber-400" /> Active Personnel</div></div></div><div className="flex gap-1.5 self-start">{!isEditMode && <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setIsEditMode(true); }} className="text-white/20 hover:text-white rounded-lg h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>}<Button type="button" variant="ghost" size="icon" onClick={() => setIsDetailDialogOpen(false)} className="text-white/20 hover:text-white rounded-lg h-8 w-8"><X className="h-3.5 w-3.5" /></Button></div></div></div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 bg-white">
            <div className="space-y-4">
              <QuickEditItem icon={User} label="Name" value={isEditMode ? editData.full_name : viewingAssistant?.full_name} isEdit={isEditMode} onChange={(val: string) => setEditData({...editData, full_name: val})} />
              <QuickEditItem icon={Mail} label="Email" value={isEditMode ? editData.email : viewingAssistant?.email} isEdit={isEditMode} onChange={(val: string) => setEditData({...editData, email: val})} />
              <QuickEditItem icon={Phone} label="WhatsApp" value={isEditMode ? editData.phone : (viewingAssistant?.phone || "-")} isEdit={isEditMode} onChange={(val: string) => setEditData({...editData, phone: val})} />
            </div>
            <div className="space-y-4">
              <div className="space-y-1"><span className="text-[7px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5"><MapPin className="h-2 w-2" /> Address</span>{isEditMode ? <Textarea value={editData.address} onChange={(e) => setEditData({...editData, address: e.target.value})} className="min-h-[60px] rounded-lg bg-slate-50 border-none font-bold text-[10px] p-2 focus-visible:ring-amber-500 transition-all resize-none shadow-inner" /> : <p className="text-[9px] font-bold text-slate-600 leading-relaxed uppercase bg-slate-50/50 p-2 rounded-lg border border-slate-50">{viewingAssistant?.address || "No address."}</p>}</div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2.5"><ShieldAlert className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" /><p className="text-[8px] font-bold text-amber-800 leading-normal uppercase tracking-tight">Personnel activity is logged for travel order compliance.</p></div>
            </div>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center px-5">
            <Button variant="outline" onClick={() => setDeleteId(viewingAssistant.id)} className="rounded-lg h-8 px-3 border-rose-100 text-rose-600 font-black uppercase text-[7px] tracking-widest"><Trash2 className="h-3 w-3" /></Button>
            <div className="flex gap-2">{isEditMode ? (<><Button variant="ghost" onClick={handleCancelEdit} disabled={submitting} className="h-8 font-black uppercase text-[8px] text-slate-400 rounded-lg">Cancel</Button><LoadingButton onClick={onQuickUpdate} loading={submitting} className="h-8 px-4 rounded-lg bg-amber-600 text-white font-black uppercase text-[8px] tracking-widest shadow-md">Save Changes</LoadingButton></>) : (<Button onClick={() => setIsDetailDialogOpen(false)} className="h-8 px-6 rounded-lg bg-slate-900 text-white font-black uppercase text-[8px] tracking-widest shadow-md">Close</Button>)}</div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}><AlertDialogContent className="rounded-2xl border-none p-8 shadow-2xl sm:max-w-sm bg-white"><AlertDialogHeader><div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-inner border border-rose-100"><ShieldAlert className="h-6 w-6" /></div><AlertDialogTitle className="text-base font-black text-center text-slate-900 uppercase">Delete Record?</AlertDialogTitle><AlertDialogDescription className="text-center text-slate-400 font-bold uppercase text-[8px] mt-2 leading-relaxed">{deleteId === "bulk" ? `Hapus ${selectedIds.length} personel terpilih?` : "Menghapus personel ini akan menghilangkan seluruh datanya secara permanen."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="mt-6 gap-3"><AlertDialogCancel className="h-10 rounded-lg font-black text-[8px] uppercase flex-1 border-none bg-slate-100">Batal</AlertDialogCancel><Button onClick={confirmDelete} className="h-10 rounded-lg bg-rose-600 text-white font-black text-[8px] flex-1 shadow-md uppercase">Konfirmasi</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <LoadingOverlay isOpen={submitting} title="Syncing..." />
    </div>
  );
}

function QuickEditItem({ icon: Icon, label, value, isEdit, onChange }: any) {
  return (
    <div className="space-y-1">
      <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5"><Icon className="h-2 w-2" /> {label}</span>
      {isEdit ? <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 rounded-lg bg-slate-50 border-none font-bold text-[10px] px-3 focus-visible:ring-amber-500 transition-all shadow-inner" /> : <p className="text-[9px] font-black text-slate-700 uppercase truncate px-1">{value || "-"}</p>}
    </div>
  );
}
