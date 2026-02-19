// ============================================================================
// OPTIMIZED USERS PAGE - v2.0
// Fitur Optimasi:
// 1. ✅ Loading Modal saat menyimpan
// 2. ✅ AlertDialog untuk konfirmasi hapus
// 3. ✅ Export/Import CSV
// 4. ✅ Empty state yang lebih menarik
// 5. ✅ Filter by role
// 6. ✅ Badge "ANDA" untuk user yang sedang login
// 7. ✅ Bulk delete dengan validasi (tidak bisa hapus diri sendiri)
// ============================================================================

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
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Upload,
  User,
  Shield,
  Users as UsersIcon
} from "lucide-react";
import { ChemicalLoader } from "@/components/ui";
import { getUsers, createOrUpdateUser, deleteUser, deleteManyUsers } from "@/lib/actions/users";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { cn } from "@/lib/utils";

const roleOptions = [
  { value: "admin", label: "Administrator", color: "bg-red-100 text-red-700 border-red-200", icon: Shield },
  { value: "operator", label: "Petugas / Operator", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: UsersIcon },
  { value: "field_officer", label: "Petugas Lapangan", color: "bg-blue-100 text-blue-700 border-blue-200", icon: User },
  { value: "client", label: "Pelanggan", color: "bg-slate-100 text-slate-700 border-slate-200", icon: User }
];

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
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<string>("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const supabase = createClient();

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      role: "operator"
    }
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [result, { data: { user } }] = await Promise.all([
        getUsers(page, limit, search),
        supabase.auth.getUser()
      ]);
      setData(result);
      setCurrentUser(user);
      setSelectedIds([]);
    } catch (error: any) {
      toast.error("Gagal memuat data pengguna", {
        description: error?.message || "Silakan refresh halaman"
      });
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
    setShowSubmitModal(true);
    setSubmitting(true);
    try {
      await createOrUpdateUser(formData, editingUser?.id);
      setIsDialogOpen(false);
      reset();
      setEditingUser(null);
      loadUsers();
      toast.success(editingUser ? "User berhasil diperbarui" : "User baru berhasil dibuat", {
        description: `${formData.full_name} (${formData.role})`
      });
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data", {
        description: "Silakan coba lagi"
      });
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setValue("full_name", user.full_name);
    setValue("email", user.email);
    setValue("role", user.role);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteUserId(id);
  };

  const confirmDelete = async () => {
    if (!deleteUserId) return;
    try {
      await deleteUser(deleteUserId);
      loadUsers();
      toast.success("User berhasil dihapus", {
        description: "Data telah dihapus dari sistem"
      });
      setDeleteUserId(null);
    } catch (error: any) {
      toast.error("Gagal menghapus user", {
        description: error?.message || "Silakan coba lagi"
      });
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.includes(currentUser?.id)) {
      toast.error("Anda tidak bisa menghapus akun sendiri", {
        description: "Hapus user lain terlebih dahulu"
      });
      return;
    }
    setDeleteUserId("bulk");
  };

  const confirmBulkDelete = async () => {
    try {
      await deleteManyUsers(selectedIds);
      loadUsers();
      toast.success(`${selectedIds.length} user berhasil dihapus`);
      setDeleteUserId(null);
    } catch (error: any) {
      toast.error("Gagal menghapus user", {
        description: error?.message || "Silakan coba lagi"
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === data.users.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.users.filter((u: any) => u.id !== currentUser?.id).map((u: any) => u.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Export CSV
  const handleExport = () => {
    const headers = ["Nama Lengkap", "Email", "Role", "Tanggal Dibuat"];
    const csvData = data.users.map((user: any) => [
      user.full_name,
      user.email,
      user.role,
      new Date(user.created_at).toISOString().split('T')[0]
    ]);
    
    const csv = [
      headers.join(","),
      ...csvData.map((row: string[]) => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Data berhasil diexport", {
      description: "File CSV telah diunduh"
    });
  };

  // Import CSV
  const handleImport = async () => {
    try {
      const lines = importData.trim().split("\n");
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
        await createOrUpdateUser({
          full_name: values[0],
          email: values[1],
          password: "default123", // Default password
          role: values[2] || "operator"
        });
      }
      
      toast.success("Import berhasil", {
        description: `${lines.length - 1} user berhasil diimport`
      });
      setIsImportDialogOpen(false);
      setImportData("");
      loadUsers();
    } catch (error: any) {
      toast.error("Gagal import data", {
        description: error?.message || "Format CSV tidak valid"
      });
    }
  };

  // Filter & Sort
  const getFilteredAndSortedData = () => {
    let filtered = [...data.users];
    
    // Search
    if (search) {
      filtered = filtered.filter(user => 
        user.full_name.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Filter by role
    if (filterRole !== "all") {
      filtered = filtered.filter(user => user.role === filterRole);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.full_name.localeCompare(b.full_name);
      } else if (sortBy === "email") {
        comparison = (a.email || "").localeCompare(b.email || "");
      } else if (sortBy === "created_at") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    return filtered;
  };

  const filteredUsers = getFilteredAndSortedData();

  const getRoleBadgeColor = (role: string) => {
    const option = roleOptions.find(opt => opt.value === role);
    return option?.color || "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getRoleIcon = (role: string) => {
    const option = roleOptions.find(opt => opt.value === role);
    const Icon = option?.icon || User;
    return <Icon className="h-3 w-3 mr-1" />;
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header dengan Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Manajemen Pengguna</h1>
          <p className="text-slate-500 text-sm">Kelola data admin, petugas, dan pelanggan laboratorium.</p>
        </div>

        <div className="flex gap-2 flex-wrap w-full md:w-auto">
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              className="animate-in fade-in zoom-in duration-200 cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Hapus ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleExport} className="cursor-pointer">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)} className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button onClick={() => {
            reset();
            setEditingUser(null);
            setIsDialogOpen(true);
          }} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 cursor-pointer flex-1 md:flex-none">
            <Plus className="mr-2 h-4 w-4" /> Tambah User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-40 cursor-pointer">
                <SelectValue placeholder="Filter Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role</SelectItem>
                {roleOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 cursor-pointer">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nama</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="created_at">Tanggal</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="cursor-pointer"
            >
              <svg className={`h-4 w-4 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </div>

          <div className="text-sm text-slate-500">
            {filteredUsers.length} dari {data.total} pengguna
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
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
                    checked={data.users.length > 0 && selectedIds.length === data.users.filter((u: any) => u.id !== currentUser?.id).length}
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
                    <div className="flex justify-center">
                      <ChemicalLoader />
                    </div>
                    <p className="mt-4 text-sm text-slate-500">Memuat data...</p>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
                        <User className="h-10 w-10 text-emerald-300" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-slate-700">Tidak ada data user</p>
                        <p className="text-sm text-slate-500 mt-1">Mulai dengan menambahkan user pertama Anda</p>
                      </div>
                      <Button
                        onClick={() => setIsDialogOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Tambah User
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user: any) => {
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
                      <TableCell className="px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800">{user.full_name}</span>
                            {isSelf && (
                              <Badge variant="outline" className="ml-2 bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px]">
                                ANDA
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 px-4">{user.email || "-"}</TableCell>
                      <TableCell className="px-4">
                        <Badge variant="outline" className={cn("capitalize", getRoleBadgeColor(user.role))}>
                          {getRoleIcon(user.role)}
                          {user.role === 'field_officer' ? 'Petugas Lapangan' : user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm px-4">
                        {new Date(user.created_at).toLocaleDateString("id-ID", {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
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
            <div className="p-10 text-center flex flex-col items-center justify-center">
              <div className="flex justify-center mb-4">
                <ChemicalLoader />
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                <User className="h-8 w-8 text-emerald-300" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-700">Tidak ada data user</p>
                <p className="text-xs text-slate-500 mt-1">Mulai dengan menambahkan user</p>
              </div>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" /> Tambah User
              </Button>
            </div>
          ) : (
            filteredUsers.map((user: any) => {
              const isSelf = currentUser?.id === user.id;
              const isSelected = selectedIds.includes(user.id);
              return (
                <div
                  key={user.id}
                  className={cn("p-4 space-y-3 transition-colors", isSelected ? 'bg-emerald-50/50' : 'bg-white active:bg-slate-50')}
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
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 flex items-center">
                            {user.full_name}
                            {isSelf && <Badge className="ml-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none text-[9px]">ANDA</Badge>}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">{user.email || "-"}</p>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("capitalize", getRoleBadgeColor(user.role))}>
                      {getRoleIcon(user.role)}
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          reset();
          setEditingUser(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-emerald-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              {editingUser ? "Edit" : "Tambah"} User Baru
            </DialogTitle>
            <DialogDescription>
              Masukkan informasi pengguna di bawah ini.
            </DialogDescription>
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
                {editingUser ? "Simpan Perubahan" : "Buat User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteUserId !== null} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Konfirmasi Hapus
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="pt-4 text-sm text-muted-foreground">
                {deleteUserId === "bulk" ? (
                  <>
                    <p>Apakah Anda yakin ingin menghapus <strong className="text-slate-900">{selectedIds.length} user</strong> terpilih?</p>
                    <p className="mt-2 text-sm text-amber-600 font-medium">⚠️ Tindakan ini tidak dapat dibatalkan.</p>
                  </>
                ) : (
                  <>
                    <p>Apakah Anda yakin ingin menghapus user ini?</p>
                    <p className="mt-2 text-sm text-amber-600 font-medium">⚠️ Data akan dihapus permanen dari sistem.</p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUserId === "bulk" ? confirmBulkDelete : confirmDelete}
              className="bg-red-600 hover:bg-red-700 cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Data CSV
            </DialogTitle>
            <DialogDescription>
              Paste data CSV dengan format: Nama Lengkap, Email, Role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg text-xs font-mono">
              <p className="font-semibold mb-1">Format:</p>
              <p>Nama Lengkap,Email,Role</p>
              <p className="text-slate-500">John Doe,john@example.com,operator</p>
              <p className="text-slate-500">Jane Smith,jane@example.com,client</p>
            </div>
            <textarea
              className="w-full h-40 p-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Paste CSV data here..."
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={handleImport}
              className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
            >
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Loading Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-200">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-lg font-semibold text-slate-800">Menyimpan Data...</p>
            <p className="text-sm text-slate-500">Mohon tunggu sebentar</p>
          </div>
        </div>
      )}
    </div>
  );
}
