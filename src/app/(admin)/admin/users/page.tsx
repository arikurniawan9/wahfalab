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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  FileText,
  Users,
  ShieldAlert,
  UserCheck,
  Mail,
  Lock,
  X,
  Filter,
  Phone,
  Eye,
  Activity,
  MapPin,
  Settings2,
  Save,
  RefreshCw,
  UserPlus,
  ShieldCheck,
  Download,
  ListTree,
  FlaskConical,
  LayoutDashboard,
  DollarSign,
  Contact2
} from "lucide-react";
import { LoadingOverlay, LoadingButton, TableSkeleton } from "@/components/ui";
import { getUsers, createOrUpdateUser, deleteUser, deleteManyUsers } from "@/lib/actions/users";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";

const roleOptions = [
  { value: "admin", label: "Administrator", color: "bg-rose-50 text-rose-700 border-rose-100", icon: ShieldAlert },
  { value: "operator", label: "Operator", color: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: FileText },
  { value: "content_manager", label: "Content Manager", color: "bg-blue-50 text-blue-700 border-blue-100", icon: FileText },
  { value: "field_officer", label: "Petugas Lapangan", color: "bg-amber-50 text-amber-700 border-amber-100", icon: User },
  { value: "analyst", label: "Analis Laboratorium", color: "bg-violet-50 text-violet-700 border-violet-100", icon: FlaskConical },
  { value: "reporting", label: "Staff Reporting", color: "bg-indigo-50 text-indigo-700 border-indigo-100", icon: FileText },
  { value: "finance", label: "Keuangan", color: "bg-purple-50 text-purple-700 border-purple-100", icon: DollarSign }
];

export default function UserManagementPage() {
  const [data, setData] = useState<any>({ users: [], total: 0, pages: 1 });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [isRegDialogOpen, setIsRegDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterRole, setFilterRole] = useState<string>("all");

  const supabase = createClient();
  const { register, handleSubmit, reset, setValue: setRegValue } = useForm({
    defaultValues: {
      full_name: "",
      email: "",
      password: "123456",
      phone: "",
      address: "",
      role: "operator"
    }
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [result, { data: { user } }] = await Promise.all([
        getUsers(page, limit, search, filterRole, 'client'),
        supabase.auth.getUser()
      ]);
      setData(result);
      setCurrentUser(user);
      setSelectedIds([]);
    } catch (error: any) { toast.error("Gagal memuat data"); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = setTimeout(() => { loadUsers(); }, 300);
    return () => clearTimeout(timer);
  }, [page, limit, search, filterRole]);

  const onRegisterSubmit = async (formData: any) => {
    setSubmitting(true);
    try {
      // Ensure default password is sent
      await createOrUpdateUser({ ...formData, password: '123456' });
      setIsRegDialogOpen(false);
      reset();
      loadUsers();
      toast.success("Staff baru terdaftar", {
        description: "Password akses default: 123456"
      });
    } catch (error: any) { toast.error(error.message); } 
    finally { setSubmitting(false); }
  };

  const onQuickUpdate = async () => {
    setSubmitting(true);
    try {
      const payload = { ...editData };
      if (!payload.password) delete payload.password;
      const result = await createOrUpdateUser(payload, viewingUser.id);
      if (result.error) throw new Error(result.error);
      toast.success("Data berhasil diperbarui");
      setIsEditMode(false);
      loadUsers();
      setViewingUser({ ...viewingUser, ...payload, password: "" });
    } catch (error: any) { toast.error(error.message); } 
    finally { setSubmitting(false); }
  };

  const handleCancelEdit = () => {
    if (viewingUser) {
      setEditData({
        full_name: viewingUser.full_name || "",
        email: viewingUser.email || "",
        phone: viewingUser.phone || "",
        address: viewingUser.address || "",
        role: viewingUser.role || "operator",
        password: ""
      });
    }
    setIsEditMode(false);
  };

  const openDetail = (user: any) => {
    setViewingUser(user);
    setEditData({
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      role: user.role || "operator",
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
        toast.success(`${selectedIds.length} staff dihapus`);
      } else {
        await deleteUser(deleteUserId);
        toast.success("Akses dicabut");
      }
      loadUsers();
      setDeleteUserId(null);
      setIsDetailDialogOpen(false);
    } catch (error) { toast.error("Gagal hapus user"); }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.users.length) setSelectedIds([]);
    else setSelectedIds(data.users.map((u: any) => u.id).filter((id: string) => id !== currentUser?.id));
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(sid => sid !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleExport = () => {
    const csvData = data.users.map((u: any) => ({
      Nama: u.full_name, Email: u.email, Role: u.role, Phone: u.phone || '-', Address: u.address || '-'
    }));
    const csvContent = "data:text/csv;charset=utf-8," + Object.keys(csvData[0]).join(",") + "\n" + csvData.map((row: any) => Object.values(row).join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `staff_wahfalab_${Date.now()}.csv`);
    link.click();
    toast.success("Export berhasil");
  };

  const getRoleInfo = (role: string) => {
    return roleOptions.find(opt => opt.value === role) || roleOptions[1];
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-[family-name:var(--font-geist-sans)] max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-900 rounded-2xl shadow-[0_10px_20px_rgba(6,78,59,0.2)]"><Users className="h-6 w-6 text-emerald-400" /></div>
          <div><h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Internal Personnel</h1><p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1.5 opacity-70">Control Center & System Access</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleExport} className="h-11 w-11 rounded-xl bg-white border-slate-200 shadow-sm hover:shadow-md transition-all text-slate-600 hover:text-emerald-600" title="Export CSV"><Download className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl bg-white border-slate-200 shadow-sm hover:shadow-md transition-all text-slate-600 hover:text-blue-600" onClick={loadUsers} title="Refresh Data"><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /></Button>
        </div>
      </div>

      <div className="rounded-[2.5rem] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden relative">
        {selectedIds.length > 0 && (
          <div className="absolute top-0 left-0 right-0 z-20 h-16 bg-slate-900 text-white flex items-center justify-between px-8 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4"><div className="h-8 w-8 rounded-lg bg-emerald-500 text-slate-900 flex items-center justify-center font-black text-xs">{selectedIds.length}</div><p className="text-[10px] font-black uppercase tracking-widest">Personnel Selected</p></div>
            <div className="flex items-center gap-3"><Button variant="ghost" onClick={() => setSelectedIds([])} className="text-white/60 hover:text-white text-[9px] font-black uppercase">Cancel</Button><Button onClick={() => setDeleteUserId("bulk")} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 px-6 font-black text-[9px] uppercase tracking-widest shadow-xl shadow-rose-900/20 active:scale-95 transition-all"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Permanently</Button></div>
          </div>
        )}

        <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" /><Input placeholder="Cari nama, email, atau penugasan..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-12 h-12 bg-white border-none rounded-2xl font-bold text-sm focus-visible:ring-emerald-500 transition-all shadow-sm" /></div>
          <div className="flex gap-3 w-full md:w-auto">
            <Select value={limit.toString()} onValueChange={(val) => { setLimit(parseInt(val)); setPage(1); }}><SelectTrigger className="w-full md:w-32 h-12 rounded-2xl border-none bg-white font-black uppercase text-[9px] tracking-widest shadow-sm"><ListTree className="h-3.5 w-3.5 mr-2 text-slate-400" /><SelectValue placeholder="Limit" /></SelectTrigger><SelectContent className="rounded-2xl border-none shadow-2xl"><SelectItem value="10" className="text-[10px] font-bold uppercase tracking-widest">10 Baris</SelectItem><SelectItem value="25" className="text-[10px] font-bold uppercase tracking-widest">25 Baris</SelectItem><SelectItem value="50" className="text-[10px] font-bold uppercase tracking-widest">50 Baris</SelectItem><SelectItem value="100" className="text-[10px] font-bold uppercase tracking-widest">100 Baris</SelectItem></SelectContent></Select>
            <Button size="icon" onClick={() => { reset(); setIsRegDialogOpen(true); }} className="h-12 w-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-900/20 active:scale-95 transition-all" title="Registrasi Staff Baru"><UserPlus className="h-5 w-5" /></Button>
          </div>
        </div>

        <div className="overflow-x-auto bg-white">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100">
                <TableHead className="w-[60px] px-8 py-5 text-center"><Checkbox checked={selectedIds.length === data.users.length && data.users.length > 0} onCheckedChange={toggleSelectAll} /></TableHead>
                <TableHead className="px-6 py-5 font-black uppercase tracking-widest text-[9px] text-slate-400">Staff Profile</TableHead>
                <TableHead className="px-6 py-5 font-black uppercase tracking-widest text-[9px] text-slate-400">Access Role</TableHead>
                <TableHead className="px-6 py-5 font-black uppercase tracking-widest text-[9px] text-slate-400">WhatsApp</TableHead>
                <TableHead className="px-8 py-5 text-right font-black uppercase tracking-widest text-[9px] text-slate-400">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="p-0"><TableSkeleton rows={limit} className="p-8" /></TableCell></TableRow>
              ) : (
                data.users.map((user: any) => {
                  const roleInfo = getRoleInfo(user.role);
                  const isSelf = currentUser?.id === user.id;
                  return (
                    <TableRow key={user.id} className={cn("hover:bg-slate-50 transition-all group border-b border-slate-50 last:border-none", selectedIds.includes(user.id) && "bg-emerald-50/30")}>
                      <TableCell className="px-8 py-5 text-center"><Checkbox checked={selectedIds.includes(user.id)} onCheckedChange={() => toggleSelect(user.id)} disabled={isSelf} /></TableCell>
                      <TableCell className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="h-11 w-11 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 text-slate-500 font-black text-sm uppercase overflow-hidden shadow-sm">{user.avatar_url ? <img src={user.avatar_url} className="h-full w-full object-cover" /> : (user.full_name || 'U').charAt(0)}</div>
                            <div className={cn("absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm", user.is_online ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                          </div>
                          <div className="flex flex-col min-w-0"><span className="text-[13px] font-black text-slate-900 truncate flex items-center gap-2">{user.full_name} {isSelf && <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[7px] font-black uppercase px-1.5 h-4 tracking-tighter">YOU</Badge>}</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{user.email}</span></div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5"><div className="flex flex-col gap-1.5"><Badge variant="outline" className={cn("px-2.5 py-0.5 rounded-md font-black text-[8px] tracking-[0.1em] flex items-center gap-1.5 w-fit border-none", roleInfo.color)}><roleInfo.icon className="h-2.5 w-2.5" />{roleInfo.label}</Badge>{user.last_sign_in_at && <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest ml-1">Sesi: {format(new Date(user.last_sign_in_at), "HH:mm • dd MMM")}</span>}</div></TableCell>
                      <TableCell className="px-6 py-5">{user.phone ? <a href={`https://wa.me/${user.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors group/wa"><div className="p-2 bg-emerald-50 rounded-xl group-hover/wa:bg-emerald-100 transition-colors"><Phone className="h-3 w-3" /></div><span className="text-[11px] font-black tracking-tighter">{user.phone}</span></a> : <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic ml-1">Not Set</span>}</TableCell>
                      <TableCell className="px-8 py-5 text-right"><Button variant="ghost" size="sm" onClick={() => openDetail(user)} className="h-10 px-5 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all gap-2"><Settings2 className="h-4 w-4" /> Manage</Button></TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-6 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Capacity: {data.total} Personnel Registered</p>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-white border-slate-200" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="flex items-center px-5 text-[10px] font-black bg-white border border-slate-200 rounded-xl text-slate-700 tracking-widest shadow-sm">{page} / {data.pages}</div>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-white border-slate-200" disabled={page === data.pages} onClick={() => setPage(p => Math.min(data.pages, p + 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => { setIsDetailDialogOpen(open); if (!open) setIsEditMode(false); }}>
        <DialogContent showCloseButton={false} className="max-w-xl rounded-[2.5rem] border-none p-0 overflow-hidden shadow-2xl bg-white">
          <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-24 -mt-24 blur-3xl z-0" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="h-20 w-20 rounded-2xl bg-white/10 flex items-center justify-center border-2 border-white/10 shadow-xl text-2xl font-black overflow-hidden text-slate-300">{viewingUser?.avatar_url ? <img src={viewingUser.avatar_url} className="h-full w-full object-cover" /> : (viewingUser?.full_name || 'U').charAt(0).toUpperCase()}</div>
                  <div className={cn("absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-900", viewingUser?.is_online ? "bg-emerald-500 animate-pulse" : "bg-slate-500")} />
                </div>
                <div className="space-y-1 text-left">
                  <Badge className="bg-emerald-500 text-white border-none text-[7px] font-black uppercase px-1.5 h-4 mb-1 tracking-widest">Personnel Detail</Badge>
                  <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none text-white">{viewingUser?.full_name}</DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {isEditMode ? (
                      <Select value={editData.role} onValueChange={(val) => setEditData({...editData, role: val})}><SelectTrigger className="h-7 px-3 rounded-lg bg-white/10 border-none text-white font-black text-[8px] uppercase w-40"><SelectValue placeholder="Role" /></SelectTrigger><SelectContent className="rounded-xl border-none shadow-2xl">{roleOptions.map(opt => (<SelectItem key={opt.value} value={opt.value} className="text-[10px] font-bold uppercase">{opt.label}</SelectItem>))}</SelectContent></Select>
                    ) : (
                      <Badge variant="outline" className={cn("px-2 py-0 h-4 rounded-md font-black text-[7px] uppercase tracking-widest border-none", getRoleInfo(viewingUser?.role || "").color)}>{getRoleInfo(viewingUser?.role || "").label}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start">{!isEditMode && <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setIsEditMode(true); }} className="text-white/30 hover:text-white hover:bg-white/10 rounded-lg h-9 w-9 transition-all active:scale-90"><Pencil className="h-4 w-4" /></Button>}<Button type="button" variant="ghost" size="icon" onClick={() => setIsDetailDialogOpen(false)} className="text-white/30 hover:text-white hover:bg-white/10 rounded-lg h-9 w-9 transition-all active:scale-90"><X className="h-4 w-4" /></Button></div>
            </div>
          </div>
          <div className="p-8 space-y-8 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <QuickEditItem icon={User} label="Full Identity Name" value={isEditMode ? editData.full_name : viewingUser?.full_name} isEdit={isEditMode} onChange={(val: string) => setEditData({...editData, full_name: val})} />
                <QuickEditItem icon={Mail} label="Business Email" value={isEditMode ? editData.email : viewingUser?.email} isEdit={isEditMode} onChange={(val: string) => setEditData({...editData, email: val})} />
                <QuickEditItem icon={Phone} label="Direct WhatsApp" value={isEditMode ? editData.phone : (viewingUser?.phone || "N/A")} isEdit={isEditMode} onChange={(val: string) => setEditData({...editData, phone: val})} />
              </div>
              <div className="space-y-6">
                <div className="space-y-2"><span className="text-[8px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><MapPin className="h-2.5 w-2.5" /> Domicile Address</span>{isEditMode ? <Textarea value={editData.address} onChange={(e) => setEditData({...editData, address: e.target.value})} className="min-h-[100px] rounded-2xl bg-white border border-slate-200 font-bold text-xs p-4 focus-visible:ring-emerald-500 transition-all resize-none shadow-sm" /> : <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase bg-slate-50/50 p-4 rounded-2xl border border-slate-50">{viewingUser?.address || "No address data."}</p>}</div>
                {isEditMode && (<div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300"><span className="text-[8px] font-black uppercase text-rose-500 tracking-widest flex items-center gap-2 font-bold"><Lock className="h-2.5 w-2.5" /> Force Reset Password</span><Input type="password" placeholder="Set new password..." value={editData.password} onChange={(e) => setEditData({...editData, password: e.target.value})} className="h-11 rounded-2xl bg-rose-50/30 border-none font-bold text-xs px-4 focus-visible:ring-rose-500 shadow-inner" /></div>)}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3 shadow-sm"><div className="flex justify-between items-center"><span className="text-[8px] font-black text-slate-400 uppercase">Live Connectivity</span><span className={cn("text-[8px] font-black uppercase", viewingUser?.is_online ? "text-emerald-600" : "text-slate-400")}>{viewingUser?.is_online ? "ONLINE" : "OFFLINE"}</span></div><div className="flex justify-between items-center"><span className="text-[8px] font-black text-slate-400 uppercase">Last Interaction</span><span className="text-[10px] font-bold text-slate-700">{viewingUser?.last_sign_in_at ? format(new Date(viewingUser.last_sign_in_at), "HH:mm • dd MMM yy") : "-"}</span></div></div>
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <Button variant="outline" onClick={() => setDeleteUserId(viewingUser.id)} disabled={currentUser?.id === viewingUser?.id || submitting} className="rounded-2xl h-11 px-6 border-rose-100 text-rose-600 hover:bg-rose-50 font-black uppercase text-[10px] tracking-widest transition-all gap-2 shadow-sm"><Trash2 className="h-4 w-4" /> Revoke Access</Button>
            <div className="flex gap-3">{isEditMode ? (<><Button variant="ghost" onClick={handleCancelEdit} disabled={submitting} className="h-11 rounded-2xl font-black uppercase text-[10px] text-slate-400 hover:bg-slate-200 px-6">Cancel</Button><LoadingButton onClick={onQuickUpdate} loading={submitting} className="h-11 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-900/20 active:scale-95 transition-all gap-2"><Save className="h-4 w-4" /> Commit Changes</LoadingButton></>) : (<Button onClick={() => setIsDetailDialogOpen(false)} className="h-11 px-10 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Close</Button>)}</div>
          </div>
        </DialogContent>
      </Dialog>

      {/* REGISTRATION DIALOG - POWERFUL & COMPLETE */}
      <Dialog open={isRegDialogOpen} onOpenChange={setIsRegDialogOpen}>
        <DialogContent showCloseButton={false} className="max-w-2xl rounded-[2.5rem] border-none p-0 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.3)] bg-white">
          <div className="bg-slate-900 p-6 md:p-7 text-white relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full -mr-24 -mt-24 blur-3xl" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
                <UserPlus className="h-6 w-6 md:h-7 md:w-7 text-emerald-400" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-black uppercase tracking-widest leading-none text-white">Personnel Access</DialogTitle>
                <DialogDescription className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5 opacity-80">
                  Register new internal team personnel
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsRegDialogOpen(false)} className="absolute right-4 top-4 text-white/30 hover:text-white rounded-lg h-9 w-9 transition-all active:scale-90"><X className="h-4 w-4" /></Button>
          </div>

          <form onSubmit={handleSubmit(onRegisterSubmit)} className="p-8 space-y-8 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                  <Contact2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Main Profile</span>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</Label><Input {...register("full_name")} className="h-11 px-4 rounded-xl bg-slate-50 border-none font-bold text-sm focus-visible:ring-emerald-500 shadow-inner" placeholder="e.g. Alexander Pierce" required /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Strategic Role</Label><Select onValueChange={(val) => setRegValue("role", val)} defaultValue="operator"><SelectTrigger className="h-11 px-4 rounded-xl bg-slate-50 border-none font-bold text-sm shadow-inner focus:ring-emerald-500"><SelectValue placeholder="Assign Role" /></SelectTrigger><SelectContent className="rounded-xl border-none shadow-2xl bg-white">{roleOptions.map(opt => (<SelectItem key={opt.value} value={opt.value} className="text-xs font-bold uppercase py-2.5 border-b border-slate-50 last:border-none hover:bg-emerald-50">{opt.label}</SelectItem>))}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">WhatsApp</Label><Input {...register("phone")} className="h-11 px-4 rounded-xl bg-slate-50 border-none font-bold text-sm shadow-inner focus-visible:ring-emerald-500" placeholder="628..." /></div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Access & Security</span>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Email</Label><Input type="email" {...register("email")} className="h-11 px-4 rounded-xl bg-slate-50 border-none font-bold text-sm focus-visible:ring-blue-500 shadow-inner" placeholder="name@wahfalab.com" required /></div>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-rose-600" />
                    <p className="text-[8px] font-bold text-rose-800 uppercase leading-tight">Password default '123456' akan diberikan otomatis.</p>
                  </div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Home Address</Label><Textarea {...register("address")} className="min-h-[85px] px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-xs focus-visible:ring-emerald-500 transition-all resize-none shadow-inner" placeholder="Complete address..." /></div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50 flex gap-4">
              <Button type="button" variant="ghost" onClick={() => setIsRegDialogOpen(false)} className="flex-1 h-12 rounded-xl font-black text-slate-400 uppercase text-[10px] tracking-widest border-none hover:bg-slate-100 transition-all">Cancel</Button>
              <LoadingButton type="submit" loading={submitting} className="flex-[2] h-12 bg-slate-900 hover:bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                <UserPlus className="h-4 w-4 mr-2" /> Execute Registration
              </LoadingButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}><AlertDialogContent className="rounded-[3rem] border-none p-12 shadow-2xl sm:max-w-sm bg-white"><AlertDialogHeader><div className="h-20 w-20 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-rose-100"><ShieldAlert className="h-10 w-10" /></div><AlertDialogTitle className="text-xl font-black text-center text-slate-900 uppercase tracking-tight">Access Revocation</AlertDialogTitle><AlertDialogDescription className="text-center text-slate-400 font-bold uppercase text-[10px] mt-3 leading-relaxed tracking-widest">{deleteUserId === "bulk" ? `Permanently remove ${selectedIds.length} personnel?` : "Revoking this personnel's access will terminate all system sessions immediately."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="mt-10 gap-4"><AlertDialogCancel className="h-12 rounded-2xl font-black text-[10px] uppercase flex-1 border-none bg-slate-100">Abort</AlertDialogCancel><Button onClick={confirmDelete} className="h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] flex-1 shadow-xl shadow-rose-900/20 active:scale-95 transition-all uppercase">Execute</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <LoadingOverlay isOpen={submitting} title="Syncing..." />
    </div>
  );
}

function QuickEditItem({ icon: Icon, label, value, isEdit, onChange }: any) {
  return (
    <div className="space-y-2">
      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Icon className="h-3 w-3" /> {label}</span>
      {isEdit ? <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-2xl bg-white border border-slate-200 font-bold text-xs px-4 focus-visible:ring-emerald-500 transition-all shadow-inner" /> : <p className="text-[11px] font-black text-slate-700 uppercase truncate px-1">{value || "-"}</p>}
    </div>
  );
}
