// ============================================================================
// CUSTOMERS DATA PAGE
// Halaman khusus untuk mengelola data customer/pelanggan
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  Users,
  Building,
  Mail,
  Phone,
  Calendar
} from "lucide-react";
import { ChemicalLoader } from "@/components/ui";
import { getUsers, createOrUpdateUser, deleteUser } from "@/lib/actions/users";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function CustomersDataPage() {
  const [data, setData] = useState<any>({ users: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getUsers(page, limit, search);
      // Filter only client role
      const filtered = {
        ...result,
        users: result.users.filter((u: any) => u.role === 'client')
      };
      setData(filtered);
    } catch (error) {
      console.error('Load customers error:', error);
      toast.error("Gagal memuat data customer");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData: any) => {
    setSubmitting(true);
    
    try {
      await createOrUpdateUser(editingUser?.id, formData);
      
      toast.success(editingUser ? "Customer berhasil diupdate" : "Customer berhasil ditambahkan");
      setIsDialogOpen(false);
      reset();
      setEditingUser(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setValue("full_name", user.full_name);
    setValue("email", user.email);
    setValue("role", user.role);
    setValue("company_name", user.company_name);
    setValue("address", user.address);
    setValue("phone", user.phone);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;

    try {
      await deleteUser(deleteUserId);
      toast.success("Customer berhasil dihapus");
      setDeleteUserId(null);
      loadData();
    } catch (error) {
      toast.error("Gagal menghapus customer");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const filteredUsers = data.users?.filter((user: any) => {
    const searchLower = search.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.company_name?.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-emerald-900 font-[family-name:var(--font-montserrat)] uppercase flex items-center gap-3">
              <Users className="h-6 w-6 text-emerald-600" />
              Data Customer
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Kelola data pelanggan dan customer laboratorium
            </p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" /> Tambah Customer
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                Total Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600">{data.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-600" />
                Perusahaan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {new Set(data.users?.filter((u: any) => u.company_name).map((u: any) => u.company_name)).size || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <User className="h-4 w-4 text-purple-600" />
                Personal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">
                {data.users?.filter((u: any) => !u.company_name).length || 0}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden mb-6">
        <div className="p-5 border-b bg-emerald-50/10 flex items-center justify-between gap-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              placeholder="Cari nama, email, atau perusahaan..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 focus-visible:ring-emerald-500 rounded-xl"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-bold text-emerald-900 px-4">Customer</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Email</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Perusahaan</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Telepon</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Tanggal Daftar</TableHead>
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
                        <p className="text-lg font-semibold text-slate-700">Tidak ada customer</p>
                        <p className="text-sm text-slate-500 mt-1">Mulai dengan menambahkan customer pertama</p>
                      </div>
                      <Button
                        onClick={() => setIsDialogOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Tambah Customer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user: any) => (
                  <TableRow key={user.id} className="hover:bg-emerald-50/10 transition-colors">
                    <TableCell className="px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{user.full_name}</p>
                          {user.company_name && (
                            <p className="text-xs text-slate-500">{user.company_name}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      {user.company_name ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          <Building className="h-3 w-3 mr-1" />
                          Perusahaan
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                          <User className="h-3 w-3 mr-1" />
                          Personal
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="h-4 w-4 text-slate-400" />
                        {user.phone || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {formatDate(user.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center px-6">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(user)}
                          className="text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteUserId(user.id)}
                          className="text-red-600 hover:bg-red-50 cursor-pointer"
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

        {/* Pagination */}
        {data.pages > 1 && (
          <div className="flex items-center justify-between p-5 border-t bg-slate-50/50">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                Menampilkan {data.users.length} dari {data.total} customer
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-3">
                Halaman {page} dari {data.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
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
              {editingUser ? "Edit" : "Tambah"} Customer Baru
            </DialogTitle>
            <DialogDescription>
              Masukkan informasi customer di bawah ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap *</Label>
              <Input 
                id="full_name"
                {...register("full_name", { required: true })} 
                placeholder="Masukkan nama lengkap" 
                className="focus-visible:ring-emerald-500" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email"
                {...register("email", { required: true })} 
                type="email" 
                placeholder="email@customer.com" 
                className="focus-visible:ring-emerald-500" 
              />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input 
                  id="password"
                  {...register("password", { required: true, minLength: 6 })} 
                  type="password" 
                  placeholder="Minimal 6 karakter" 
                  className="focus-visible:ring-emerald-500" 
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="company_name">Nama Perusahaan</Label>
              <Input 
                id="company_name"
                {...register("company_name")} 
                placeholder="PT. Nama Perusahaan" 
                className="focus-visible:ring-emerald-500" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telepon</Label>
              <Input 
                id="phone"
                {...register("phone")} 
                placeholder="0812-3456-7890" 
                className="focus-visible:ring-emerald-500" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Input 
                id="address"
                {...register("address")} 
                placeholder="Alamat lengkap" 
                className="focus-visible:ring-emerald-500" 
              />
            </div>
            
            {/* Hidden role field - always set to client */}
            <input type="hidden" {...register("role")} value="client" />
            
            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 cursor-pointer" 
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    {editingUser ? "Simpan Perubahan" : "Buat Customer"}
                  </>
                )}
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
                <p>Apakah Anda yakin ingin menghapus customer ini?</p>
                <p className="mt-2 text-sm text-amber-600 font-medium">⚠️ Data akan dihapus permanen dari sistem.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
