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
  Mail,
  Lock,
  X,
  Phone,
  Settings2,
  Save,
  RefreshCw,
  UserPlus,
  ShieldCheck,
  Download,
  ListTree,
  FlaskConical,
  DollarSign,
  Contact2,
  Eye,
  Plus,
  Check,
  MapPin
} from "lucide-react";
import { LoadingOverlay, LoadingButton, TableSkeleton } from "@/components/ui";
import { createOrUpdateUser, deleteUser, deleteManyUsers } from "@/lib/actions/users";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
// TODO: Replace Cloud Storage uploads with API endpoints/file upload utility
// import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const roleOptions = [
  { value: "admin", label: "Administrator", color: "bg-rose-50 text-rose-700 border-rose-100", icon: ShieldAlert },
  { value: "operator", label: "Operator", color: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: FileText },
  { value: "content_manager", label: "Content Manager", color: "bg-blue-50 text-blue-700 border-blue-100", icon: FileText },
  { value: "field_officer", label: "Petugas Lapangan", color: "bg-amber-50 text-amber-700 border-amber-100", icon: User },
  { value: "analyst", label: "Analis Laboratorium", color: "bg-violet-50 text-violet-700 border-violet-100", icon: FlaskConical },
  { value: "reporting", label: "Staff Reporting", color: "bg-indigo-50 text-indigo-700 border-indigo-100", icon: FileText },
  { value: "finance", label: "Keuangan", color: "bg-purple-50 text-purple-700 border-purple-100", icon: DollarSign }
];

const modules = [
  { id: "dashboard", label: "Dashboard", actions: ["view"] },
  { id: "quotations", label: "Penawaran Harga", actions: ["view", "create", "edit", "delete"] },
  { id: "jobs", label: "Progres Order", actions: ["view", "create", "edit", "delete"] },
  { id: "sampling", label: "Penugasan Sampling", actions: ["view", "create", "edit", "delete"] },
  { id: "customers", label: "Database Klien", actions: ["view", "create", "edit", "delete"] },
  { id: "finance", label: "Keuangan & Invoice", actions: ["view", "create", "edit", "delete"] },
  { id: "services", label: "Katalog Layanan", actions: ["view", "create", "edit", "delete"] },
  { id: "staff", label: "Manajemen Staff", actions: ["view", "create", "edit", "delete"] },
  { id: "content", label: "Konten Website", actions: ["view", "create", "edit", "delete"] },
  { id: "system", label: "Pengaturan Sistem", actions: ["view", "edit"] },
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
  const [userPermissions, setUserPermissions] = useState<any>({});
  
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterRole, setFilterRole] = useState<string>("all");

  // TODO: Replace with API call or server action for session user
  const getCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      return session?.user || null;
    } catch {
      return null;
    }
  };

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

  const loadUsers = async (pageOverride?: number) => {
    setLoading(true);
    try {
      const activePage = pageOverride ?? page;
      const params = new URLSearchParams({
        page: String(activePage),
        limit: String(limit),
        search,
      });

      const [result, user] = await Promise.all([
        fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" }).then(async (res) => {
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Gagal memuat data");
          return json;
        }),
        getCurrentUser()
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        !!target?.isContentEditable;

      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.key.toLowerCase() === "n") {
        if (isTyping) return;
        e.preventDefault();
        reset();
        setIsRegDialogOpen(true);
      }

      if (e.key === "Escape" && isRegDialogOpen) {
        setIsRegDialogOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRegDialogOpen, reset]);

  const onRegisterSubmit = async (formData: any) => {
    setSubmitting(true);
    try {
      const result = await createOrUpdateUser({ ...formData, password: '123456', permissions: {} });
      if (result.error) throw new Error(result.error);
      setIsRegDialogOpen(false);
      reset();
      setPage(1);
      await loadUsers(1);
      toast.success("Staff baru terdaftar", { description: "Password akses default: 123456" });
    } catch (error: any) { toast.error(error.message); } 
    finally { setSubmitting(false); }
  };

  const onQuickUpdate = async () => {
    setSubmitting(true);
    try {
      const payload = { ...editData, permissions: userPermissions };
      if (!payload.password) delete payload.password;
      const result = await createOrUpdateUser(payload, viewingUser.id);
      if (result.error) throw new Error(result.error);
      toast.success("Data & Hak Akses diperbarui");
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
      setUserPermissions(viewingUser.permissions || {});
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
    setUserPermissions(user.permissions || {});
    setIsEditMode(false);
    setIsDetailDialogOpen(true);
  };

  const togglePermission = (modId: string, action: string) => {
    if (!isEditMode) return;
    const current = [...(userPermissions[modId] || [])];
    const index = current.indexOf(action);
    if (index > -1) current.splice(index, 1);
    else current.push(action);
    
    setUserPermissions({ ...userPermissions, [modId]: current });
  };

  const toggleRow = (modId: string, actions: string[]) => {
    if (!isEditMode) return;
    const current = userPermissions[modId] || [];
    const allSelected = actions.every(a => current.includes(a));
    setUserPermissions({ ...userPermissions, [modId]: allSelected ? [] : actions });
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
          <div className="p-3 bg-emerald-900 rounded-2xl shadow-lg"><Users className="h-6 w-6 text-emerald-400" /></div>
          <div><h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Internal Personnel</h1><p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1.5 opacity-70">Control Center & System Access</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleExport} className="h-11 w-11 rounded-xl bg-white border-slate-200 shadow-sm hover:shadow-md transition-all text-slate-600 hover:text-emerald-600" title="Export CSV"><Download className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl bg-white border-slate-200 shadow-sm hover:shadow-md transition-all text-slate-600 hover:text-blue-600" onClick={loadUsers} title="Refresh Data"><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /></Button>
        </div>
      </div>

      <div className="rounded-[2.5rem] bg-white shadow-xl border border-slate-100 overflow-hidden relative">
        {selectedIds.length > 0 && (
          <div className="absolute top-0 left-0 right-0 z-20 h-16 bg-slate-900 text-white flex items-center justify-between px-8 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4"><div className="h-8 w-8 rounded-lg bg-emerald-500 text-slate-900 flex items-center justify-center font-black text-xs">{selectedIds.length}</div><p className="text-[10px] font-black uppercase tracking-widest">Personnel Selected</p></div>
            <div className="flex items-center gap-3"><Button variant="ghost" onClick={() => setSelectedIds([])} className="text-white/60 hover:text-white text-[9px] font-black uppercase">Cancel</Button><Button onClick={() => setDeleteUserId("bulk")} className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 px-6 font-black text-[9px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Permanently</Button></div>
          </div>
        )}

        <div className="p-6 bg-slate-50/80 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" /><Input placeholder="Cari nama, email, atau penugasan..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-12 h-12 bg-white border-none rounded-2xl font-bold text-sm focus-visible:ring-emerald-500 transition-all shadow-sm" /></div>
          <div className="flex gap-3 w-full md:w-auto">
            <Select value={limit.toString()} onValueChange={(val) => { setLimit(parseInt(val)); setPage(1); }}><SelectTrigger className="w-full md:w-32 h-12 rounded-2xl border-none bg-white font-black uppercase text-[9px] tracking-widest shadow-sm"><ListTree className="h-3.5 w-3.5 mr-2 text-slate-400" /><SelectValue placeholder="Limit" /></SelectTrigger><SelectContent className="rounded-2xl border-none shadow-2xl"><SelectItem value="10" className="text-[10px] font-bold uppercase tracking-widest">10 Baris</SelectItem><SelectItem value="25" className="text-[10px] font-bold uppercase tracking-widest">25 Baris</SelectItem><SelectItem value="50" className="text-[10px] font-bold uppercase tracking-widest">50 Baris</SelectItem></SelectContent></Select>
            <Button size="icon" onClick={() => { reset(); setIsRegDialogOpen(true); }} className="relative h-12 w-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl active:scale-95 transition-all" title="Registrasi Staff Baru (Alt+N)"><UserPlus className="h-5 w-5" /><span className="absolute -top-2 -right-2 hidden md:flex items-center rounded-md bg-slate-900 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-white shadow-lg">Alt+N</span></Button>
          </div>
        </div>

        <div className="overflow-x-auto bg-white">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100">
                <TableHead className="w-[60px] px-8 py-5 text-center"><Checkbox checked={selectedIds.length === data.users.length && data.users.length > 0} onCheckedChange={toggleSelectAll} /></TableHead>
                <TableHead className="px-6 py-5 font-bold text-slate-700 text-sm">Staff Profile</TableHead>
                <TableHead className="px-6 py-5 font-bold text-slate-700 text-sm">Access Role</TableHead>
                <TableHead className="px-6 py-5 font-bold text-slate-700 text-sm">WhatsApp</TableHead>
                <TableHead className="px-8 py-5 text-right font-bold text-slate-700 text-sm">Manage</TableHead>
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
                          <div className="h-11 w-11 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 text-slate-500 font-bold text-base uppercase overflow-hidden shadow-sm">{user.avatar_url ? <img src={user.avatar_url} className="h-full w-full object-cover" /> : (user.full_name || 'U').charAt(0)}</div>
                          <div className="flex flex-col min-w-0"><span className="text-base font-bold text-slate-900 truncate flex items-center gap-2">{user.full_name} {isSelf && <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-bold uppercase px-2 h-5">YOU</Badge>}</span><span className="text-sm text-slate-500 truncate">{user.email}</span></div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5"><div className="flex flex-col gap-1.5"><Badge variant="outline" className={cn("px-3 py-1 rounded-md font-bold text-sm flex items-center gap-2 w-fit border-none shadow-sm", roleInfo.color)}><roleInfo.icon className="h-3 w-3" />{roleInfo.label}</Badge></div></TableCell>
                      <TableCell className="px-6 py-5">{user.phone ? <span className="text-sm font-bold text-emerald-600">{user.phone}</span> : <span className="text-sm text-slate-400">-</span>}</TableCell>
                      <TableCell className="px-8 py-5 text-right"><Button variant="ghost" size="sm" onClick={() => openDetail(user)} className="h-10 px-5 rounded-lg font-semibold text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all gap-2"><Settings2 className="h-4 w-4" /> Manage</Button></TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-6 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <p className="text-sm font-semibold text-slate-600">Database: {data.total} Personnel Registered</p>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-white border-slate-200 shadow-sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="flex items-center px-5 text-sm font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 shadow-sm">{page} / {data.pages}</div>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl bg-white border-slate-200 shadow-sm" disabled={page === data.pages} onClick={() => setPage(p => Math.min(data.pages, p + 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* DETAIL & PERMISSION MODAL */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => { setIsDetailDialogOpen(open); if (!open) setIsEditMode(false); }}>
        <DialogContent showCloseButton={false} className="max-w-[95vw] sm:max-w-4xl rounded-[2.5rem] border-none p-0 overflow-hidden shadow-2xl bg-white">
          <div className="bg-slate-900 p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6 w-full">
              <div className="h-20 w-20 rounded-2xl bg-white/10 flex items-center justify-center border-2 border-white/10 shadow-xl text-2xl font-black overflow-hidden text-slate-300 shrink-0">{viewingUser?.avatar_url ? <img src={viewingUser.avatar_url} className="h-full w-full object-cover" /> : (viewingUser?.full_name || 'U').charAt(0).toUpperCase()}</div>
              <div className="space-y-1 text-left min-w-0 flex-1">
                <Badge className="bg-emerald-500 text-white border-none text-[7px] font-black uppercase px-1.5 h-4 mb-1 tracking-widest">Personnel Detail</Badge>
                <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none text-white truncate">{viewingUser?.full_name}</DialogTitle>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{viewingUser?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              {!isEditMode && <Button variant="ghost" size="icon" onClick={() => setIsEditMode(true)} className="text-white/30 hover:text-white hover:bg-white/10 rounded-lg h-10 w-10 transition-all active:scale-90"><Pencil className="h-5 w-5" /></Button>}
              <Button variant="ghost" size="icon" onClick={() => setIsDetailDialogOpen(false)} className="text-white/30 hover:text-white hover:bg-white/10 rounded-lg h-10 w-10 transition-all active:scale-90"><X className="h-5 w-5" /></Button>
            </div>
          </div>

          <Tabs defaultValue="info" className="w-full">
            <div className="bg-slate-50 border-b border-slate-100 px-8 py-2">
              <TabsList className="bg-transparent border-none p-0 gap-8 h-12">
                <TabsTrigger value="info" className="bg-transparent border-none shadow-none text-[10px] font-black uppercase tracking-widest text-slate-400 data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none px-0 transition-all">Identity Profile</TabsTrigger>
                <TabsTrigger value="access" className="bg-transparent border-none shadow-none text-[10px] font-black uppercase tracking-widest text-slate-400 data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none px-0 transition-all">Hak Akses Modul</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="info" className="p-8 m-0 space-y-8 bg-white min-h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><User className="h-3 w-3" /> Full Identity Name</label>{isEditMode ? <Input value={editData.full_name} onChange={(e) => setEditData({...editData, full_name: e.target.value})} className="h-12 rounded-2xl bg-white border border-slate-200 font-bold text-sm px-5" /> : <p className="text-sm font-black text-slate-700 uppercase px-1">{viewingUser?.full_name}</p>}</div>
                  <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Mail className="h-3 w-3" /> Business Email</label>{isEditMode ? <Input value={editData.email} onChange={(e) => setEditData({...editData, email: e.target.value})} className="h-12 rounded-2xl bg-white border border-slate-200 font-bold text-sm px-5" /> : <p className="text-sm font-black text-slate-700 uppercase px-1">{viewingUser?.email}</p>}</div>
                  <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Phone className="h-3 w-3" /> WhatsApp Contact</label>{isEditMode ? <Input value={editData.phone} onChange={(e) => setEditData({...editData, phone: e.target.value})} className="h-12 rounded-2xl bg-white border border-slate-200 font-bold text-sm px-5" /> : <p className="text-sm font-black text-slate-700 uppercase px-1">{viewingUser?.phone || "N/A"}</p>}</div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Contact2 className="h-3 w-3" /> Personnel Role</label>{isEditMode ? <Select value={editData.role} onValueChange={(val) => setEditData({...editData, role: val})}><SelectTrigger className="h-12 rounded-2xl bg-white border border-slate-200 font-bold text-sm px-5"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl border-none shadow-2xl">{roleOptions.map(opt => (<SelectItem key={opt.value} value={opt.value} className="text-xs font-bold uppercase">{opt.label}</SelectItem>))}</SelectContent></Select> : <Badge variant="outline" className={cn("px-3 py-1 rounded-md font-black text-[9px] uppercase tracking-widest border-none shadow-sm", getRoleInfo(viewingUser?.role || "").color)}>{getRoleInfo(viewingUser?.role || "").label}</Badge>}</div>
                  <div className="space-y-2"><label className="text-[9px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><MapPin className="h-3 w-3" /> Home Address</label>{isEditMode ? <Textarea value={editData.address} onChange={(e) => setEditData({...editData, address: e.target.value})} className="min-h-[100px] rounded-2xl border border-slate-200 font-bold text-xs p-4 resize-none shadow-sm" /> : <p className="text-[11px] font-bold text-slate-600 leading-relaxed uppercase bg-slate-50/50 p-4 rounded-2xl border border-slate-50">{viewingUser?.address || "No address data."}</p>}</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="access" className="p-0 m-0 bg-white min-h-[400px]">
              <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                <div className="flex items-center gap-4 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                  <div><h4 className="text-xs font-black uppercase tracking-widest">Matriks Hak Akses</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tentukan izin spesifik untuk setiap modul sistem</p></div>
                </div>
              </div>
              
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-b border-slate-100">
                      <TableHead className="px-8 py-4 font-black uppercase tracking-widest text-[9px] text-slate-400 w-[200px]">Modul Aplikasi</TableHead>
                      <TableHead className="px-4 py-4 font-black uppercase tracking-widest text-[9px] text-slate-400 text-center">Lihat</TableHead>
                      <TableHead className="px-4 py-4 font-black uppercase tracking-widest text-[9px] text-slate-400 text-center">Tambah</TableHead>
                      <TableHead className="px-4 py-4 font-black uppercase tracking-widest text-[9px] text-slate-400 text-center">Edit</TableHead>
                      <TableHead className="px-4 py-4 font-black uppercase tracking-widest text-[9px] text-slate-400 text-center">Hapus</TableHead>
                      <TableHead className="px-8 py-4 text-right font-black uppercase tracking-widest text-[9px] text-slate-400">Pilih Baris</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.map((mod) => {
                      const perms = userPermissions[mod.id] || [];
                      return (
                        <TableRow key={mod.id} className="hover:bg-slate-50 transition-all border-b border-slate-50">
                          <TableCell className="px-8 py-4"><span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{mod.label}</span></TableCell>
                          {["view", "create", "edit", "delete"].map((action) => (
                            <TableCell key={action} className="px-4 py-4 text-center">
                              {mod.actions.includes(action) ? (
                                <div 
                                  onClick={() => togglePermission(mod.id, action)}
                                  className={cn(
                                    "w-8 h-8 rounded-lg mx-auto flex items-center justify-center transition-all cursor-pointer border-2",
                                    perms.includes(action) ? "bg-emerald-600 border-emerald-600 text-white shadow-lg scale-110" : "bg-white border-slate-100 text-slate-200 hover:border-emerald-200 hover:text-emerald-300"
                                  )}
                                >
                                  {perms.includes(action) ? <Check className="h-4 w-4 stroke-[4px]" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                </div>
                              ) : (
                                <span className="text-[8px] font-black text-slate-200">N/A</span>
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="px-8 py-4 text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => toggleRow(mod.id, mod.actions)}
                              disabled={!isEditMode}
                              className={cn(
                                "h-8 px-4 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all",
                                mod.actions.every(a => perms.includes(a)) ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white border-slate-200 text-slate-400"
                              )}
                            >
                              {mod.actions.every(a => perms.includes(a)) ? "Full Access" : "Select Row"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
            <Button variant="outline" onClick={() => setDeleteUserId(viewingUser.id)} disabled={currentUser?.id === viewingUser?.id || submitting} className="rounded-2xl h-12 px-6 border-rose-100 text-rose-600 hover:bg-rose-50 font-black uppercase text-[10px] tracking-widest shadow-sm gap-2"><Trash2 className="h-4 w-4" /> Revoke Access</Button>
            <div className="flex gap-3">{isEditMode ? (<><Button variant="ghost" onClick={handleCancelEdit} disabled={submitting} className="h-12 rounded-2xl font-black uppercase text-[10px] text-slate-400 px-8 hover:bg-slate-200">Cancel</Button><LoadingButton onClick={onQuickUpdate} loading={submitting} className="h-12 px-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-900/20 active:scale-95 gap-2"><Save className="h-4 w-4" /> Save Authority</LoadingButton></>) : (<Button onClick={() => setIsDetailDialogOpen(false)} className="h-12 px-12 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95">Close</Button>)}</div>
          </div>
        </DialogContent>
      </Dialog>

      {/* REGISTRATION DIALOG */}
      <Dialog open={isRegDialogOpen} onOpenChange={setIsRegDialogOpen}>
        <DialogContent showCloseButton={false} className="max-w-2xl rounded-[2.5rem] border-none p-0 overflow-hidden shadow-2xl bg-white">
          <div className="bg-slate-900 p-7 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner"><UserPlus className="h-7 w-7 text-emerald-400" /></div>
              <div><DialogTitle className="text-xl font-black uppercase tracking-widest leading-none">Personnel Access</DialogTitle><DialogDescription className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5 opacity-80">Register new internal team personnel</DialogDescription></div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsRegDialogOpen(false)} className="text-white/30 hover:text-white rounded-lg h-10 w-10 transition-all active:scale-90"><X className="h-5 w-5" /></Button>
          </div>

          <form onSubmit={handleSubmit(onRegisterSubmit)} className="p-8 space-y-8 bg-white">
            <input type="hidden" {...register("role")} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2"><Contact2 className="h-3.5 w-3.5 text-emerald-600" /><span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Main Profile</span></div>
                <div className="space-y-4">
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</Label><Input {...register("full_name")} className="h-11 px-4 rounded-xl bg-slate-50 border-none font-bold text-sm shadow-inner focus-visible:ring-emerald-500" required /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Strategic Role</Label><Select onValueChange={(val) => setRegValue("role", val)} defaultValue="operator"><SelectTrigger className="h-11 px-4 rounded-xl bg-slate-50 border-none font-bold text-sm shadow-inner"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl border-none shadow-2xl bg-white">{roleOptions.map(opt => (<SelectItem key={opt.value} value={opt.value} className="text-xs font-bold uppercase py-2.5 border-b border-slate-50 last:border-none hover:bg-emerald-50">{opt.label}</SelectItem>))}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">WhatsApp</Label><Input {...register("phone")} className="h-11 px-4 rounded-xl bg-slate-50 border-none font-bold text-sm shadow-inner focus-visible:ring-emerald-500" placeholder="628..." /></div>
                </div>
              </div>
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2"><ShieldCheck className="h-3.5 w-3.5 text-blue-600" /><span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Security</span></div>
                <div className="space-y-4">
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Business Email</Label><Input type="email" {...register("email")} className="h-11 px-4 rounded-xl bg-slate-50 border-none font-bold text-sm shadow-inner focus-visible:ring-blue-500" required /></div>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-rose-600" /><p className="text-[8px] font-bold text-rose-800 uppercase leading-tight">Password default '123456' diberikan otomatis.</p></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Address</Label><Textarea {...register("address")} className="min-h-[85px] px-4 py-3 rounded-xl bg-slate-50 border-none font-bold text-xs resize-none shadow-inner focus-visible:ring-emerald-500" /></div>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-50 flex gap-4"><Button type="button" variant="ghost" onClick={() => setIsRegDialogOpen(false)} className="flex-1 h-12 rounded-xl font-black text-slate-400 uppercase text-[10px] tracking-widest border-none hover:bg-slate-100">Cancel</Button><LoadingButton type="submit" loading={submitting} className="flex-[2] h-12 bg-slate-900 hover:bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all"><UserPlus className="h-4 w-4 mr-2" /> Execute Registration</LoadingButton></div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}><AlertDialogContent className="rounded-[3rem] border-none p-12 shadow-2xl sm:max-w-sm bg-white"><AlertDialogHeader><div className="h-20 w-20 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-rose-100"><ShieldAlert className="h-10 w-10" /></div><AlertDialogTitle className="text-xl font-black text-center text-slate-900 uppercase tracking-tight">Access Revocation</AlertDialogTitle><AlertDialogDescription className="text-center text-slate-400 font-bold uppercase text-[10px] mt-3 leading-relaxed tracking-widest">{deleteUserId === "bulk" ? `Permanently remove ${selectedIds.length} personnel?` : "Revoking this personnel's access will terminate system sessions immediately."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter className="mt-10 gap-4"><AlertDialogCancel className="h-12 rounded-2xl font-black text-[10px] uppercase flex-1 border-none bg-slate-100">Abort</AlertDialogCancel><Button onClick={confirmDelete} className="h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] flex-1 shadow-xl active:scale-95 transition-all uppercase">Execute</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <LoadingOverlay isOpen={submitting} title="Syncing Database..." />
    </div>
  );
}
