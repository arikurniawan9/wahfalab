"use client";

import React, { useState, useEffect, useTransition } from "react";
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
  Users,
  Building2,
  Mail,
  Phone,
  Calendar,
  Eye,
  MapPin,
  Download,
  UserPlus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  X,
  ListTree,
  Building,
  Contact2,
  Save,
  Settings2,
  Lock,
  Info
} from "lucide-react";
import { LoadingOverlay, LoadingButton, TableSkeleton } from "@/components/ui";
import { getUsers, createOrUpdateUser, deleteUser, deleteManyUsers } from "@/lib/actions/users";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";

export default function CustomersDataPage() {
  const [data, setData] = useState<any>({ users: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isRegDialogOpen, setIsRegDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  
  const [viewingCustomer, setViewingCustomer] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { register, handleSubmit, reset, setValue: setRegValue } = useForm({
    defaultValues: {
      full_name: "",
      email: "",
      company_name: "",
      phone: "",
      address: ""
    }
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getUsers(page, limit, search, 'client');
      setData(result);
      setSelectedIds([]);
    } catch (error) { toast.error("Gagal memuat data pelanggan"); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => { loadData(); }, 300);
    return () => clearTimeout(timer);
  }, [page, limit, search]);

  const onRegisterSubmit = async (formData: any) => {
    setSubmitting(true);
    try {
      // Set default password '123456' for new customers
      await createOrUpdateUser({ ...formData, role: 'client', password: '123456' });
      setIsRegDialogOpen(false);
      reset();
      loadData();
      toast.success("Pelanggan baru terdaftar", {
        description: "Akses login default: 123456"
      });
    } catch (error: any) { toast.error(error.message); } 
    finally { setSubmitting(false); }
  };

  const onQuickUpdate = async () => {
    setSubmitting(true);
    try {
      const payload = { ...editData, role: 'client' };
      if (!payload.password) delete payload.password;
      const result = await createOrUpdateUser(payload, viewingCustomer.id);
      if (result.error) throw new Error(result.error);
      toast.success("Data pelanggan diperbarui");
      setIsEditMode(false);
      loadData();
      setViewingCustomer({ ...viewingCustomer, ...payload, password: "" });
    } catch (error: any) { toast.error(error.message); } 
    finally { setSubmitting(false); }
  };

  const handleCancelEdit = () => {
    if (viewingCustomer) {
      setEditData({
        full_name: viewingCustomer.full_name || "",
        email: viewingCustomer.email || "",
        company_name: viewingCustomer.company_name || "",
        phone: viewingCustomer.phone || "",
        address: viewingCustomer.address || "",
        password: ""
      });
    }
    setIsEditMode(false);
  };

  const openDetail = (customer: any) => {
    setViewingCustomer(customer);
    setEditData({
      full_name: customer.full_name || "",
      email: customer.email || "",
      company_name: customer.company_name || "",
      phone: customer.phone || "",
      address: customer.address || "",
      password: ""
    });
    setIsEditMode(false);
    setIsDetailDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteUserId) return;
    try {
      if (deleteUserId === "bulk") {
        await deleteManyUsers(selectedIds);
        toast.success(`${selectedIds.length} pelanggan berhasil dihapus`);
      } else {
        await deleteUser(deleteUserId);
        toast.success("Data pelanggan dihapus");
      }
      loadData();
      setDeleteUserId(null);
      setIsDetailDialogOpen(false);
    } catch (error) { toast.error("Gagal hapus data"); }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.users.length) setSelectedIds([]);
    else setSelectedIds(data.users.map((u: any) => u.id));
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(sid => sid !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleExport = () => {
    const csvData = data.users.map((u: any) => ({
      Nama: u.full_name, Email: u.email, Perusahaan: u.company_name || '-', Phone: u.phone || '-', Alamat: u.address || '-'
    }));
    const csvContent = "data:text/csv;charset=utf-8," + Object.keys(csvData[0]).join(",") + "\n" + csvData.map((row: any) => Object.values(row).join(",")).join("\n");
    const link = document.body.appendChild(document.createElement("a"));
    link.href = encodeURI(csvContent);
    link.download = `customers_wahfalab_${Date.now()}.csv`;
    link.click();
    document.body.removeChild(link);
    toast.success("Export berhasil");
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen font-[family-name:var(--font-geist-sans)] max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 rounded-xl shadow-sm"><Building2 className="h-5 w-5 text-blue-400" /></div>
          <div><h1 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">Customer Database</h1><p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.3em] mt-1 opacity-70">Client Relations & Records</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleExport} className="h-10 w-10 rounded-xl bg-white border-slate-200 shadow-sm text-slate-600 hover:text-blue-600 transition-all" title="Export CSV"><Download className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white border-slate-200 shadow-sm text-slate-600 hover:text-emerald-600 transition-all" onClick={loadData} title="Refresh Data"><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /></Button>
        </div>
      </div>

      <Card className="rounded-3xl bg-white shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden relative">
        {selectedIds.length > 0 && (
          <div className="absolute top-0 left-0 right-0 z-20 h-14 bg-slate-900 text-white flex items-center justify-between px-6 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3"><div className="h-7 w-7 rounded bg-blue-500 text-white flex items-center justify-center font-black text-xs">{selectedIds.length}</div><p className="text-[9px] font-black uppercase tracking-widest">Clients Selected</p></div>
            <div className="flex items-center gap-2"><Button variant="ghost" onClick={() => setSelectedIds([])} className="text-white/60 hover:text-white text-[8px] font-black uppercase">Cancel</Button><Button onClick={() => setDeleteUserId("bulk")} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg h-8 px-4 font-black text-[8px] uppercase tracking-widest active:scale-95 transition-all">Remove Selection</Button></div>
          </div>
        )}

        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" /><Input placeholder="Cari nama, email, atau perusahaan..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-12 h-11 bg-white border-none rounded-xl font-bold text-sm shadow-sm" /></div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={limit.toString()} onValueChange={(val) => { setLimit(parseInt(val)); setPage(1); }}><SelectTrigger className="w-full md:w-32 h-11 rounded-xl border-none bg-white font-black uppercase text-[9px] tracking-widest shadow-sm"><ListTree className="h-3.5 w-3.5 mr-2 text-slate-400" /><SelectValue placeholder="Limit" /></SelectTrigger><SelectContent className="rounded-xl border-none shadow-2xl"><SelectItem value="10" className="text-[9px] font-bold uppercase">10 Baris</SelectItem><SelectItem value="25" className="text-[9px] font-bold uppercase">25 Baris</SelectItem><SelectItem value="50" className="text-[9px] font-bold uppercase">50 Baris</SelectItem></SelectContent></Select>
            <Button size="icon" onClick={() => { reset(); setIsRegDialogOpen(true); }} className="h-11 w-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg active:scale-95 transition-all" title="Registrasi Customer Baru"><UserPlus className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="overflow-x-auto bg-white">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow className="border-b border-slate-100">
                <TableHead className="w-[50px] px-6 py-4 text-center"><Checkbox checked={selectedIds.length === data.users.length && data.users.length > 0} onCheckedChange={toggleSelectAll} /></TableHead>
                <TableHead className="px-6 py-4 font-bold text-slate-700 text-sm">Customer Name</TableHead>
                <TableHead className="px-6 py-4 font-bold text-slate-700 text-sm">Corporate Identity</TableHead>
                <TableHead className="px-6 py-4 font-bold text-slate-700 text-sm">Direct Contact</TableHead>
                <TableHead className="px-6 py-4 text-right font-bold text-slate-700 text-sm">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="p-0"><TableSkeleton rows={limit} className="p-6" /></TableCell></TableRow>
              ) : (
                data.users.map((user: any) => (
                  <TableRow key={user.id} className={cn("hover:bg-slate-50 transition-all border-b border-slate-50 last:border-none", selectedIds.includes(user.id) && "bg-blue-50/20")}>
                    <TableCell className="px-6 py-4 text-center"><Checkbox checked={selectedIds.includes(user.id)} onCheckedChange={() => toggleSelect(user.id)} /></TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0 text-blue-600 font-bold text-sm uppercase shadow-sm">{(user.full_name || 'C').charAt(0)}</div>
                        <div className="flex flex-col min-w-0"><span className="text-sm font-bold text-slate-900 truncate">{user.full_name}</span><span className="text-xs text-slate-500 truncate">{user.email}</span></div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4"><div className="flex items-center gap-2"><Building className="h-3 w-3 text-slate-400" /><span className="text-sm font-semibold text-slate-600 truncate max-w-[150px]">{user.company_name || "Personal"}</span></div></TableCell>
                    <TableCell className="px-6 py-4"><div className="flex items-center gap-2 text-emerald-600"><Phone className="h-3 w-3" /><span className="text-sm font-bold">{user.phone || "-"}</span></div></TableCell>
                    <TableCell className="px-6 py-4 text-right"><Button variant="ghost" size="sm" onClick={() => openDetail(user)} className="h-8 px-3 rounded-lg font-medium text-slate-600 hover:text-blue-600 transition-all gap-1.5"><Settings2 className="h-3 w-3" /> Manage</Button></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
          <p className="text-sm font-semibold text-slate-600">{data.total} Registered Clients</p>
          <div className="flex gap-1.5">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-white border-slate-200" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
            <div className="flex items-center px-3 text-sm font-semibold bg-white border border-slate-200 rounded-lg text-slate-700">{page} / {data.pages}</div>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-white border-slate-200" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </Card>

      {/* REGISTRATION DIALOG - COMPACT & AUTO-PASSWORD */}
      <Dialog open={isRegDialogOpen} onOpenChange={setIsRegDialogOpen}>
        <DialogContent showCloseButton={false} className="max-w-2xl rounded-2xl border-none p-0 overflow-hidden shadow-2xl bg-white">
          <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/20"><UserPlus className="h-5 w-5 text-blue-400" /></div>
              <div><DialogTitle className="text-sm font-black uppercase tracking-widest text-white">Customer Authorization</DialogTitle><DialogDescription className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-0.5">Add new client with auto-assigned password</DialogDescription></div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsRegDialogOpen(false)} className="text-white/20 hover:text-white rounded-lg h-8 w-8"><X className="h-4 w-4" /></Button>
          </div>

          <form onSubmit={handleSubmit(onRegisterSubmit)} className="p-6 bg-white space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2"><Contact2 className="h-3 w-3 text-blue-500" /><span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Main Profile</span></div>
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Identity Name</Label><Input {...register("full_name")} className="h-9 rounded-lg bg-slate-50 border-none font-bold text-xs px-3 focus-visible:ring-blue-500 shadow-inner" placeholder="e.g John Doe" required /></div>
                  <div className="space-y-1"><Label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Company Name</Label><Input {...register("company_name")} className="h-9 rounded-lg bg-slate-50 border-none font-bold text-xs px-3 shadow-inner" placeholder="e.g PT Wahfa Corp" /></div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2"><ShieldCheck className="h-3 w-3 text-emerald-500" /><span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Access Access</span></div>
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Login Email</Label><Input type="email" {...register("email")} className="h-9 rounded-lg bg-slate-50 border-none font-bold text-xs px-3 focus-visible:ring-blue-500 shadow-inner" placeholder="client@email.com" required /></div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2">
                    <Lock className="h-3 w-3 text-emerald-600" />
                    <p className="text-[8px] font-bold text-emerald-800 uppercase leading-tight">Password default '123456' akan diberikan otomatis.</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2"><Phone className="h-3 w-3 text-emerald-500" /><span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Contact & Address</span></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1"><Label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">No. WhatsApp</Label><Input {...register("phone")} className="h-9 rounded-lg bg-slate-50 border-none font-bold text-xs px-3 shadow-inner" placeholder="628..." required /></div>
                  <div className="md:col-span-2 space-y-1"><Label className="text-[8px] font-black uppercase text-slate-400 tracking-widest ml-1">Office/Home Address</Label><Textarea {...register("address")} className="min-h-[80px] rounded-lg bg-slate-50 border-none font-bold text-[10px] p-3 focus-visible:ring-blue-500 transition-all resize-none shadow-inner" placeholder="Full domicile address..." /></div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsRegDialogOpen(false)} className="flex-1 h-10 rounded-lg font-black text-slate-400 uppercase text-[9px] tracking-widest border-none hover:bg-slate-100 transition-all">Cancel</Button>
              <LoadingButton type="submit" loading={submitting} className="flex-[2] h-10 bg-slate-900 hover:bg-black text-white rounded-lg font-black uppercase text-[9px] tracking-[0.2em] shadow-xl active:scale-95 transition-all">Grant System Access</LoadingButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DETAIL MODAL - COMPACT VERSION */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => { setIsDetailDialogOpen(open); if (!open) setIsEditMode(false); }}>
        <DialogContent showCloseButton={false} className="max-w-xl rounded-2xl border-none p-0 overflow-hidden shadow-2xl bg-white">
          <div className="bg-slate-900 p-5 text-white relative">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center border-2 border-white/10 shadow-xl text-xl font-black overflow-hidden">{viewingCustomer?.full_name ? viewingCustomer.full_name.charAt(0).toUpperCase() : 'C'}</div>
                <div className="space-y-0.5">
                  <Badge className="bg-blue-500 text-white border-none text-[6px] font-black uppercase px-1 h-3 mb-1">Corporate Client</Badge>
                  <DialogTitle className="text-lg font-black uppercase tracking-tight text-white leading-none">{viewingCustomer?.full_name}</DialogTitle>
                  <div className="flex items-center gap-2 mt-1 text-slate-400 text-[7px] font-black uppercase tracking-widest"><Building className="h-2.5 w-2.5" /> {viewingCustomer?.company_name || "Personal"}</div>
                </div>
              </div>
              <div className="flex gap-1.5 self-start">{!isEditMode && <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setIsEditMode(true); }} className="text-white/20 hover:text-white rounded-lg h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>}<Button type="button" variant="ghost" size="icon" onClick={() => setIsDetailDialogOpen(false)} className="text-white/20 hover:text-white rounded-lg h-8 w-8"><X className="h-3.5 w-3.5" /></Button></div>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 bg-white">
            <div className="space-y-4">
              <QuickEditItem icon={User} label="Name" value={isEditMode ? editData.full_name : viewingCustomer?.full_name} isEdit={isEditMode} onChange={(val: string) => setEditData({...editData, full_name: val})} />
              <QuickEditItem icon={Building} label="Company" value={isEditMode ? editData.company_name : viewingCustomer?.company_name} isEdit={isEditMode} onChange={(val: string) => setEditData({...editData, company_name: val})} />
              <QuickEditItem icon={Mail} label="Email" value={isEditMode ? editData.email : viewingCustomer?.email} isEdit={isEditMode} onChange={(val: string) => setEditData({...editData, email: val})} />
            </div>
            <div className="space-y-4">
              <QuickEditItem icon={Phone} label="WhatsApp" value={isEditMode ? editData.phone : (viewingCustomer?.phone || "-")} isEdit={isEditMode} onChange={(val: string) => setEditData({...editData, phone: val})} />
              <div className="space-y-1"><span className="text-[7px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5"><MapPin className="h-2 w-2" /> Address</span>{isEditMode ? <Textarea value={editData.address} onChange={(e) => setEditData({...editData, address: e.target.value})} className="min-h-[60px] rounded-lg bg-slate-50 border-none font-bold text-[10px] p-2 focus-visible:ring-blue-500 transition-all resize-none shadow-inner" /> : <p className="text-[9px] font-bold text-slate-600 leading-relaxed uppercase bg-slate-50/50 p-2 rounded-lg border border-slate-100">{viewingCustomer?.address || "No address."}</p>}</div>
              {isEditMode && (<div className="space-y-1 animate-in fade-in slide-in-from-bottom-1"><span className="text-[7px] font-black uppercase text-rose-500 tracking-widest flex items-center gap-1.5 font-bold"><Lock className="h-2 w-2" /> Force Reset</span><Input type="password" placeholder="New pass..." value={editData.password} onChange={(e) => setEditData({...editData, password: e.target.value})} className="h-8 rounded-lg bg-rose-50/30 border-none font-bold text-[10px] px-3 shadow-inner" /></div>)}
            </div>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center px-5">
            <Button variant="outline" onClick={() => setDeleteUserId(viewingCustomer.id)} className="rounded-lg h-8 px-3 border-rose-100 text-rose-600 font-black uppercase text-[7px] tracking-widest"><Trash2 className="h-3 w-3" /></Button>
            <div className="flex gap-2">{isEditMode ? (<><Button variant="ghost" onClick={handleCancelEdit} disabled={submitting} className="h-8 font-black uppercase text-[8px] text-slate-400 rounded-lg">Cancel</Button><LoadingButton onClick={onQuickUpdate} loading={submitting} className="h-8 px-4 rounded-lg bg-blue-600 text-white font-black uppercase text-[8px] tracking-widest shadow-md">Save Changes</LoadingButton></>) : (<Button onClick={() => setIsDetailDialogOpen(false)} className="h-8 px-6 rounded-lg bg-slate-900 text-white font-black uppercase text-[8px] tracking-widest shadow-md">Close</Button>)}</div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}><AlertDialogContent className="rounded-2xl border-none p-8 shadow-2xl sm:max-w-sm bg-white"><AlertDialogHeader><div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-inner border border-rose-100"><ShieldAlert className="h-6 w-6" /></div><AlertDialogTitle className="text-base font-black text-center text-slate-900 uppercase">Revoke Access?</AlertDialogTitle><AlertDialogDescription className="text-center text-slate-400 font-bold uppercase text-[8px] mt-2 leading-relaxed">{deleteUserId === "bulk" ? `Hapus ${selectedIds.length} pelanggan terpilih?` : "Seluruh riwayat pelanggan ini akan tetap ada namun akses login akan dicabut."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="mt-6 gap-3"><AlertDialogCancel className="h-10 rounded-lg font-black text-[8px] uppercase flex-1 border-none bg-slate-100">Batal</AlertDialogCancel><Button onClick={confirmDelete} className="h-10 rounded-lg bg-rose-600 text-white font-black text-[8px] flex-1 shadow-md uppercase">Konfirmasi</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <LoadingOverlay isOpen={submitting} title="Syncing..." />
    </div>
  );
}

function QuickEditItem({ icon: Icon, label, value, isEdit, onChange }: any) {
  return (
    <div className="space-y-1">
      <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5"><Icon className="h-2 w-2" /> {label}</span>
      {isEdit ? <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 rounded-lg bg-slate-50 border-none font-bold text-[10px] px-3 focus-visible:ring-blue-500 transition-all shadow-inner" /> : <p className="text-[9px] font-black text-slate-700 uppercase truncate px-1">{value || "-"}</p>}
    </div>
  );
}
