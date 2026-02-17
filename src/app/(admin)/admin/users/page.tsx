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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { getUsers, createOrUpdateUser, deleteUser, deleteManyUsers } from "@/lib/actions/users";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function UserManagementPage() {
  const [data, setData] = useState<any>({ users: [], total: 0, pages: 1 });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const supabase = createClient();

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      role: "operator"
    }
  });

  const roleOptions = [
    { value: "admin", label: "Administrator", color: "bg-red-100 text-red-700 border-red-200" },
    { value: "operator", label: "Petugas / Operator", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    { value: "field_officer", label: "Petugas Lapangan", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { value: "client", label: "Pelanggan", color: "bg-slate-100 text-slate-700 border-slate-200" }
  ];

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'operator': return 'default';
      case 'field_officer': return 'secondary';
      default: return 'secondary';
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [result, { data: { user } }] = await Promise.all([
        getUsers(page, limit, search),
        supabase.auth.getUser()
      ]);
      setData(result);
      setCurrentUser(user);
      setSelectedIds([]); // Clear selection on load
    } catch (error) {
      toast.error("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, limit, search]);

  const onSubmit = async (formData: any) => {
    setSubmitting(true);
    try {
      await createOrUpdateUser(formData, editingUser?.id);
      setIsDialogOpen(false);
      reset();
      setEditingUser(null);
      loadUsers();
      toast.success(editingUser ? "User berhasil diperbarui" : "User baru berhasil dibuat");
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setValue("full_name", user.full_name);
    setValue("email", user.email);
    setValue("role", user.role);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    toast.warning("Hapus User?", {
      description: "Tindakan ini tidak dapat dibatalkan.",
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            await deleteUser(id);
            loadUsers();
            toast.success("User berhasil dihapus");
          } catch (error) {
            toast.error("Gagal menghapus user");
          }
        },
      },
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.includes(currentUser?.id)) {
      toast.error("Anda tidak bisa menghapus akun sendiri dalam pilihan massal");
      return;
    }

    toast.warning(`Hapus ${selectedIds.length} user?`, {
      description: "Data akan dihapus permanen dari sistem.",
      action: {
        label: "Hapus Masal",
        onClick: async () => {
          try {
            await deleteManyUsers(selectedIds);
            loadUsers();
            toast.success("Data berhasil dihapus");
          } catch (error) {
            toast.error("Gagal menghapus beberapa data");
          }
        }
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.users.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.users.map((u: any) => u.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Manajemen Pengguna</h1>
          <p className="text-slate-500 text-sm">Kelola data admin, petugas, dan pelanggan laboratorium.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          {selectedIds.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              className="animate-in fade-in zoom-in duration-200"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Hapus ({selectedIds.length})
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              reset();
              setEditingUser(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 cursor-pointer flex-1 md:flex-none">
                <Plus className="mr-2 h-4 w-4" /> Tambah User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-emerald-900">{editingUser ? "Edit User" : "Tambah User Baru"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Nama Lengkap</label>
                  <Input {...register("full_name")} placeholder="Masukkan nama lengkap" required className="focus-visible:ring-emerald-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Email</label>
                  <Input {...register("email")} type="email" placeholder="email@wahfalab.com" required className="focus-visible:ring-emerald-500" />
                </div>
                {!editingUser && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Password</label>
                    <Input {...register("password")} type="password" placeholder="Minimal 6 karakter" required className="focus-visible:ring-emerald-500" />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Role</label>
                  <Select
                    onValueChange={(val) => setValue("role", val)}
                    defaultValue={editingUser?.role || "operator"}
                  >
                    <SelectTrigger className="focus:ring-emerald-500 cursor-pointer">
                      <SelectValue placeholder="Pilih Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin" className="cursor-pointer">Administrator</SelectItem>
                      <SelectItem value="operator" className="cursor-pointer">Petugas / Operator</SelectItem>
                      <SelectItem value="field_officer" className="cursor-pointer">Petugas Lapangan</SelectItem>
                      <SelectItem value="client" className="cursor-pointer">Pelanggan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 cursor-pointer" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingUser ? "Simpan Perubahan" : "Buat User"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden transition-all duration-300">
        <div className="p-5 border-b bg-emerald-50/10 flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input 
              placeholder="Cari nama atau email..." 
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 focus-visible:ring-emerald-500 rounded-xl"
            />
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="w-12 px-6">
                  <Checkbox 
                    checked={data.users.length > 0 && selectedIds.length === data.users.length} 
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Nama</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Email</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Role</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Tanggal Dibuat</TableHead>
                <TableHead className="text-center font-bold text-emerald-900 px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
                  </TableCell>
                </TableRow>
              ) : data.users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-slate-500 font-sans">
                    Tidak ada data user.
                  </TableCell>
                </TableRow>
              ) : (
                data.users.map((user: any) => {
                  const isSelf = currentUser?.id === user.id;
                  return (
                    <TableRow key={user.id} className="hover:bg-emerald-50/10 transition-colors">
                      <TableCell className="px-6">
                        <Checkbox 
                          checked={selectedIds.includes(user.id)} 
                          onCheckedChange={() => toggleSelect(user.id)}
                          disabled={isSelf}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-slate-800 px-4">
                        {user.full_name} {isSelf && <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px]">ANDA</Badge>}
                      </TableCell>
                      <TableCell className="text-slate-600 px-4">{user.email || "-"}</TableCell>
                      <TableCell className="px-4">
                        <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                          {user.role === 'field_officer' ? 'Petugas Lapangan' : user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm px-4">
                        {new Date(user.created_at).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="text-center px-6">
                        <div className="flex justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 cursor-pointer" 
                            onClick={() => handleEdit(user)}
                            disabled={isSelf}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:bg-red-50 cursor-pointer" 
                            onClick={() => handleDelete(user.id)}
                            disabled={isSelf}
                          >
                            <Trash2 className="h-4 w-4" />
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

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-10 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
            </div>
          ) : data.users.length === 0 ? (
            <div className="p-10 text-center text-slate-500 font-sans">Tidak ada data user.</div>
          ) : (
            data.users.map((user: any) => {
              const isSelf = currentUser?.id === user.id;
              const isSelected = selectedIds.includes(user.id);
              return (
                <div 
                  key={user.id} 
                  className={`p-4 space-y-3 transition-colors ${isSelected ? 'bg-emerald-50/50' : 'bg-white active:bg-slate-50'}`}
                  onClick={() => !isSelf && toggleSelect(user.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <Checkbox 
                        checked={isSelected} 
                        onCheckedChange={() => toggleSelect(user.id)}
                        disabled={isSelf}
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 flex items-center">
                          {user.full_name}
                          {isSelf && <Badge className="ml-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none text-[9px]">ANDA</Badge>}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">{user.email || "-"}</p>
                      </div>
                    </div>
                    <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                      {user.role === 'field_officer' ? 'Petugas Lapangan' : user.role}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] text-slate-400">
                      Terdaftar: {new Date(user.created_at).toLocaleDateString("id-ID")}
                    </span>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                        onClick={() => handleEdit(user)}
                        disabled={isSelf}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:bg-red-50 cursor-pointer"
                        onClick={() => handleDelete(user.id)}
                        disabled={isSelf}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-500 font-medium">
              Total {data.total} pengguna
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Tampil:</span>
              <Select value={limit.toString()} onValueChange={(val) => {
                setLimit(parseInt(val));
                setPage(1);
              }}>
                <SelectTrigger className="h-8 w-[70px] bg-white text-xs cursor-pointer">
                  <SelectValue placeholder={limit.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10" className="cursor-pointer">10</SelectItem>
                  <SelectItem value="30" className="cursor-pointer">30</SelectItem>
                  <SelectItem value="50" className="cursor-pointer">50</SelectItem>
                  <SelectItem value="100" className="cursor-pointer">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 rounded-lg cursor-pointer"
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center px-4 text-xs font-bold bg-white border border-slate-200 rounded-lg shadow-sm">
              {page} / {data.pages}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 rounded-lg cursor-pointer"
              disabled={page === data.pages} 
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
