"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  Plus,
  Check,
  MapPin,
  Clock,
} from "lucide-react";
import { LoadingOverlay, LoadingButton, TableSkeleton } from "@/components/ui";
import { createOrUpdateUser, deleteUser, deleteManyUsers } from "@/lib/actions/users";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const roleOptions = [
  { value: "admin", label: "Administrator", color: "bg-rose-50 text-rose-700 border-rose-100", icon: ShieldAlert },
  { value: "operator", label: "Operator", color: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: FileText },
  { value: "content_manager", label: "Content Manager", color: "bg-blue-50 text-blue-700 border-blue-100", icon: FileText },
  { value: "field_officer", label: "Petugas Lapangan", color: "bg-amber-50 text-amber-700 border-amber-100", icon: User },
  { value: "analyst", label: "Analis Laboratorium", color: "bg-violet-50 text-violet-700 border-violet-100", icon: FlaskConical },
  { value: "reporting", label: "Staff Reporting", color: "bg-indigo-50 text-indigo-700 border-indigo-100", icon: FileText },
  { value: "finance", label: "Keuangan", color: "bg-purple-50 text-purple-700 border-purple-100", icon: DollarSign },
] as const;

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
] as const;

type UserItem = {
  id: string;
  full_name?: string;
  email?: string;
  role?: string;
  phone?: string;
  address?: string;
  avatar_url?: string;
  permissions?: Record<string, string[]>;
};

function generateTempPassword(length = 12) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export default function UserManagementPage() {
  const [data, setData] = useState<{ users: UserItem[]; total: number; pages: number }>({ users: [], total: 0, pages: 1 });
  const [currentUser, setCurrentUser] = useState<{ id?: string } | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>("all");

  const [isRegDialogOpen, setIsRegDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const [viewingUser, setViewingUser] = useState<UserItem | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [userPermissions, setUserPermissions] = useState<Record<string, string[]>>({});

  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { register, handleSubmit, reset, setValue: setRegValue } = useForm({
    defaultValues: {
      full_name: "",
      email: "",
      password: generateTempPassword(),
      phone: "",
      address: "",
      role: "operator",
    },
  });

  const getCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      return session?.user || null;
    } catch {
      return null;
    }
  };

  const loadUsers = async (pageOverride?: number) => {
    setLoading(true);
    try {
      const activePage = pageOverride ?? page;
      const params = new URLSearchParams({
        page: String(activePage),
        limit: String(limit),
        search,
      });

      if (filterRole !== "all") {
        params.set("role", filterRole);
      }

      const [result, user] = await Promise.all([
        fetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" }).then(async (res) => {
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Gagal memuat data");
          return json;
        }),
        getCurrentUser(),
      ]);
      setData(result);
      setCurrentUser(user);
      setSelectedIds([]);
    } catch {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, limit, search, filterRole]);

  const openRegisterModal = () => {
    reset({
      full_name: "",
      email: "",
      password: generateTempPassword(),
      phone: "",
      address: "",
      role: "operator",
    });
    setIsRegDialogOpen(true);
  };

  const onRegisterSubmit = async (formData: any) => {
    setSubmitting(true);
    try {
      const tempPassword = formData.password || generateTempPassword();
      const result = await createOrUpdateUser({ ...formData, password: tempPassword, permissions: {} });
      if (result.error) throw new Error(result.error);
      setIsRegDialogOpen(false);
      setPage(1);
      await loadUsers(1);
      toast.success("Staff baru terdaftar", { description: `Password sementara: ${tempPassword}` });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onQuickUpdate = async () => {
    if (!viewingUser) return;
    setSubmitting(true);
    try {
      const payload = { ...editData, permissions: userPermissions };
      if (!payload.password) delete payload.password;
      const result = await createOrUpdateUser(payload, viewingUser.id);
      if (result.error) throw new Error(result.error);
      toast.success("Data & hak akses diperbarui");
      setIsEditMode(false);
      void loadUsers();
      setViewingUser({ ...viewingUser, ...payload, password: "" });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = (user: UserItem) => {
    setViewingUser(user);
    setEditData({
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      role: user.role || "operator",
      password: "",
    });
    setUserPermissions(user.permissions || {});
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
      setDeleteUserId(null);
      setIsDetailDialogOpen(false);
      void loadUsers();
    } catch {
      toast.error("Gagal hapus user");
    }
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
    const allSelected = actions.every((a) => current.includes(a));
    setUserPermissions({ ...userPermissions, [modId]: allSelected ? [] : actions });
  };

  const toggleSelectAll = () => {
    const selectableIds = data.users.map((u) => u.id).filter((id) => id !== currentUser?.id);
    if (selectedIds.length === selectableIds.length) setSelectedIds([]);
    else setSelectedIds(selectableIds);
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter((sid) => sid !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleExport = () => {
    if (data.users.length === 0) {
      toast.error("Tidak ada data untuk export");
      return;
    }

    const csvData = data.users.map((u) => ({
      Nama: u.full_name,
      Email: u.email,
      Role: u.role,
      Phone: u.phone || "-",
      Address: u.address || "-",
    }));

    const csvContent =
      "data:text/csv;charset=utf-8," +
      Object.keys(csvData[0]).join(",") +
      "\n" +
      csvData.map((row: any) => Object.values(row).join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `staff_wahfalab_${Date.now()}.csv`);
    link.click();
    toast.success("Export berhasil");
  };

  const getRoleInfo = (role?: string) => roleOptions.find((opt) => opt.value === role) || roleOptions[1];

  const internalCount = useMemo(() => data.users.length, [data.users]);

  return (
    <div className="min-h-screen space-y-6 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 p-4 md:p-8">
      <header className="relative overflow-hidden rounded-3xl border border-emerald-100/60 bg-white p-6 shadow-sm md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_42%)]" />
        <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Manajemen Staff</h1>
              <p className="mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Clock className="h-3 w-3" />
                Kelola akun internal dan kontrol hak akses sistem
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleExport} className="h-10 w-10 rounded-xl">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => void loadUsers()} className="h-10 w-10 rounded-xl">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button onClick={openRegisterModal} className="h-10 rounded-xl bg-emerald-600 px-4 font-bold hover:bg-emerald-700">
              <Plus className="mr-1 h-4 w-4" />
              Staff Baru
            </Button>
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-100 bg-slate-50/70 p-4 md:grid-cols-[1fr_auto_auto] md:p-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari nama, email, atau perusahaan"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border-slate-200 bg-white pl-10"
            />
          </div>

          <Select
            value={filterRole}
            onValueChange={(value) => {
              setFilterRole(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full rounded-xl md:w-52">
              <ShieldCheck className="mr-2 h-4 w-4 text-slate-400" />
              <SelectValue placeholder="Filter role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Role</SelectItem>
              {roleOptions.filter((r) => r.value !== "admin").map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(limit)}
            onValueChange={(val) => {
              setLimit(parseInt(val, 10));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full rounded-xl md:w-32">
              <ListTree className="mr-2 h-4 w-4 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 rows</SelectItem>
              <SelectItem value="25">25 rows</SelectItem>
              <SelectItem value="50">50 rows</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[44px]">
                  <Checkbox
                    checked={internalCount > 0 && selectedIds.length === data.users.filter((u) => u.id !== currentUser?.id).length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Profil</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <TableSkeleton rows={limit} className="p-4" />
                  </TableCell>
                </TableRow>
              ) : data.users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-slate-500">
                    Tidak ada data staff.
                  </TableCell>
                </TableRow>
              ) : (
                data.users.map((user) => {
                  const roleInfo = getRoleInfo(user.role);
                  const isSelf = currentUser?.id === user.id;
                  return (
                    <TableRow key={user.id} className={cn(selectedIds.includes(user.id) && "bg-emerald-50/40")}> 
                      <TableCell>
                        <Checkbox checked={selectedIds.includes(user.id)} onCheckedChange={() => toggleSelect(user.id)} disabled={isSelf} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 font-bold uppercase text-slate-700">
                            {(user.full_name || "U").charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-slate-900">
                              {user.full_name}
                              {isSelf && (
                                <Badge className="ml-2 border-0 bg-emerald-100 text-emerald-700">You</Badge>
                              )}
                            </div>
                            <p className="truncate text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("border", roleInfo.color)}>
                          <roleInfo.icon className="mr-1 h-3 w-3" />
                          {roleInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{user.phone || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button asChild variant="outline" className="h-9 rounded-lg">
                            <Link href={`/admin/users/${user.id}/history`}>Histori</Link>
                          </Button>
                          <Button variant="ghost" className="h-9 rounded-lg" onClick={() => openDetail(user)}>
                            <Settings2 className="mr-1 h-4 w-4" />
                            Manage
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 p-4 sm:flex-row">
          <p className="text-sm text-slate-600">Total: {data.total} staff</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm">
              {page} / {data.pages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-lg"
              disabled={page === data.pages}
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => { setIsDetailDialogOpen(open); if (!open) setIsEditMode(false); }}>
        <DialogContent showCloseButton={false} className="max-h-[90vh] w-[94vw] max-w-3xl overflow-y-auto rounded-2xl p-0">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-5 py-4 text-white">
            <div>
              <DialogTitle className="text-lg font-bold">Manage Staff</DialogTitle>
              <DialogDescription className="text-xs text-slate-300">Atur profil dan izin modul.</DialogDescription>
            </div>
            <Button size="icon" variant="ghost" className="text-white" onClick={() => setIsDetailDialogOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Tabs defaultValue="info" className="w-full">
            <div className="border-b border-slate-100 px-4 pt-2">
              <TabsList className="h-10 bg-transparent p-0">
                <TabsTrigger value="info">Profil</TabsTrigger>
                <TabsTrigger value="access">Hak Akses</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="info" className="m-0 space-y-4 p-4 md:p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs">Nama</Label>
                  {isEditMode ? (
                    <Input value={editData.full_name || ""} onChange={(e) => setEditData({ ...editData, full_name: e.target.value })} className="mt-1" />
                  ) : (
                    <p className="mt-1 text-sm font-semibold text-slate-800">{viewingUser?.full_name}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  {isEditMode ? (
                    <Input value={editData.email || ""} onChange={(e) => setEditData({ ...editData, email: e.target.value })} className="mt-1" />
                  ) : (
                    <p className="mt-1 text-sm font-semibold text-slate-800">{viewingUser?.email}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs">Role</Label>
                  {isEditMode ? (
                    <Select value={editData.role || "operator"} onValueChange={(val) => setEditData({ ...editData, role: val })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 text-sm font-semibold text-slate-800">{getRoleInfo(viewingUser?.role).label}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs">WhatsApp</Label>
                  {isEditMode ? (
                    <Input value={editData.phone || ""} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} className="mt-1" />
                  ) : (
                    <p className="mt-1 text-sm font-semibold text-slate-800">{viewingUser?.phone || "-"}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Alamat</Label>
                  {isEditMode ? (
                    <Textarea value={editData.address || ""} onChange={(e) => setEditData({ ...editData, address: e.target.value })} className="mt-1" />
                  ) : (
                    <p className="mt-1 text-sm text-slate-700">{viewingUser?.address || "-"}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="access" className="m-0 p-4 md:p-5">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Modul</TableHead>
                      <TableHead className="text-center">View</TableHead>
                      <TableHead className="text-center">Create</TableHead>
                      <TableHead className="text-center">Edit</TableHead>
                      <TableHead className="text-center">Delete</TableHead>
                      <TableHead className="text-right">Baris</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.map((mod) => {
                      const perms = userPermissions[mod.id] || [];
                      return (
                        <TableRow key={mod.id}>
                          <TableCell className="font-medium">{mod.label}</TableCell>
                          {["view", "create", "edit", "delete"].map((action) => (
                            <TableCell key={action} className="text-center">
                              {mod.actions.includes(action as any) ? (
                                <button
                                  type="button"
                                  disabled={!isEditMode}
                                  onClick={() => togglePermission(mod.id, action)}
                                  className={cn(
                                    "inline-flex h-7 w-7 items-center justify-center rounded-md border text-xs",
                                    perms.includes(action)
                                      ? "border-emerald-600 bg-emerald-600 text-white"
                                      : "border-slate-300 bg-white text-slate-400"
                                  )}
                                >
                                  {perms.includes(action) ? <Check className="h-3 w-3" /> : "-"}
                                </button>
                              ) : (
                                <span className="text-xs text-slate-300">N/A</span>
                              )}
                            </TableCell>
                          ))}
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" disabled={!isEditMode} onClick={() => toggleRow(mod.id, [...mod.actions])}>
                              {mod.actions.every((a) => perms.includes(a)) ? "Uncheck" : "Check all"}
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

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
            <Button variant="outline" className="border-rose-200 text-rose-700" onClick={() => viewingUser && setDeleteUserId(viewingUser.id)}>
              <Trash2 className="mr-1 h-4 w-4" /> Hapus
            </Button>
            <div className="flex gap-2">
              {viewingUser && (
                <Button asChild variant="outline">
                  <Link href={`/admin/users/${viewingUser.id}/history`}>Lihat Histori</Link>
                </Button>
              )}
              {isEditMode ? (
                <>
                  <Button variant="ghost" onClick={() => setIsEditMode(false)}>Batal</Button>
                  <LoadingButton loading={submitting} onClick={onQuickUpdate} className="bg-emerald-600 hover:bg-emerald-700">
                    <Save className="mr-1 h-4 w-4" /> Simpan
                  </LoadingButton>
                </>
              ) : (
                <Button onClick={() => setIsEditMode(true)}>
                  <Pencil className="mr-1 h-4 w-4" /> Edit
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isRegDialogOpen} onOpenChange={setIsRegDialogOpen}>
        <DialogContent showCloseButton={false} className="w-[94vw] max-w-xl rounded-2xl p-0">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-5 py-4 text-white">
            <div>
              <DialogTitle className="text-lg font-bold">Tambah Staff</DialogTitle>
              <DialogDescription className="text-xs text-slate-300">Akun staff baru akan dibuat dengan password sementara.</DialogDescription>
            </div>
            <Button size="icon" variant="ghost" className="text-white" onClick={() => setIsRegDialogOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit(onRegisterSubmit)} className="space-y-4 p-5">
            <input type="hidden" {...register("role")} />
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Nama</Label>
                <Input {...register("full_name")} required className="mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input {...register("email")} type="email" required className="mt-1" />
              </div>
              <div>
                <Label>Role</Label>
                <Select onValueChange={(val) => setRegValue("role", val)} defaultValue="operator">
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roleOptions.filter((r) => r.value !== "admin").map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input {...register("phone")} className="mt-1" />
              </div>
              <div className="md:col-span-2">
                <Label>Password sementara</Label>
                <Input {...register("password")} required className="mt-1 font-mono" />
              </div>
              <div className="md:col-span-2">
                <Label>Alamat</Label>
                <Textarea {...register("address")} className="mt-1" />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setRegValue("password", generateTempPassword())}>
                Generate Password
              </Button>
              <LoadingButton type="submit" loading={submitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                Simpan
              </LoadingButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Akun</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteUserId === "bulk"
                ? `Hapus permanen ${selectedIds.length} akun staff?`
                : "Akun ini akan dihapus permanen dari sistem."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <Button className="bg-rose-600 hover:bg-rose-700" onClick={confirmDelete}>Hapus</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LoadingOverlay isOpen={submitting} title="Menyimpan perubahan..." />
    </div>
  );
}
