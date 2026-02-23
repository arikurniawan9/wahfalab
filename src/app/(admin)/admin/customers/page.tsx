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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  Calendar,
  Eye,
  MapPin,
  Download,
  Upload
} from "lucide-react";
import { LoadingOverlay, LoadingButton, TableSkeleton, EmptyState } from "@/components/ui";
import { getUsers, createOrUpdateUser, deleteUser, deleteManyUsers } from "@/lib/actions/users";
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewingCustomer, setViewingCustomer] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<string>("");

  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const allUsersResult = await getUsers(1, 1000, '');
      const allCustomers = allUsersResult.users.filter((u: any) => u.role === 'client');
      
      // Filter berdasarkan search
      let filteredUsers = allCustomers;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredUsers = allCustomers.filter((u: any) => 
          u.full_name?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower) ||
          u.company_name?.toLowerCase().includes(searchLower)
        );
      }
      
      // Pagination manual
      const startIndex = (page - 1) * limit;
      const paginatedUsers = filteredUsers.slice(startIndex, startIndex + limit);
      
      setData({
        users: paginatedUsers,
        total: filteredUsers.length,
        pages: Math.ceil(filteredUsers.length / limit)
      });
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
      console.log('Submitting customer data:', formData);
      console.log('Editing user:', editingUser?.id);
      
      await createOrUpdateUser(formData, editingUser?.id);

      toast.success(editingUser ? "Customer berhasil diupdate" : "Customer berhasil ditambahkan");
      setIsDialogOpen(false);
      reset();
      setEditingUser(null);
      loadData();
    } catch (error: any) {
      console.error('Submit customer error:', error);
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setValue("full_name", user.full_name || "");
    setValue("email", user.email || "");
    setValue("role", "client");
    setValue("company_name", user.company_name || "");
    setValue("phone", user.phone || "");
    setValue("address", user.address || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;

    try {
      if (deleteUserId === "bulk") {
        await deleteManyUsers(selectedIds);
        toast.success(`${selectedIds.length} customer berhasil dihapus`);
      } else {
        await deleteUser(deleteUserId);
        toast.success("Customer berhasil dihapus");
      }
      setDeleteUserId(null);
      setSelectedIds([]);
      loadData();
    } catch (error) {
      toast.error("Gagal menghapus customer");
    }
  };

  const handleViewDetail = (user: any) => {
    setViewingCustomer(user);
    setIsDetailDialogOpen(true);
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
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    setDeleteUserId("bulk");
  };

  const handleExport = () => {
    const headers = ["Nama Lengkap", "Email", "Perusahaan", "Telepon", "Alamat", "Tanggal Dibuat"];
    const csvData = data.users.map((user: any) => [
      user.full_name,
      user.email,
      user.company_name || "-",
      user.phone || "-",
      user.address || "-",
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
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Data berhasil diexport", {
      description: "File CSV telah diunduh"
    });
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

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900 font-[family-name:var(--font-montserrat)] uppercase flex items-center gap-3">
            <Users className="h-6 w-6 text-emerald-600" />
            Data Customer
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola data pelanggan dan customer laboratorium
          </p>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
            <Input
              placeholder="Cari nama, email, atau perusahaan..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 h-11 focus-visible:ring-emerald-500 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Button
              onClick={() => setIsDialogOpen(true)}
              size="icon"
              className="bg-emerald-600 hover:bg-emerald-700 h-11 w-11 cursor-pointer shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
              title="Tambah Customer"
            >
              <Plus className="h-5 w-5" />
            </Button>
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                size="icon"
                onClick={handleBulkDelete}
                className="h-11 w-11 rounded-lg cursor-pointer shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 animate-in fade-in zoom-in duration-200"
                title={`Hapus ${selectedIds.length} customer terpilih`}
              >
                <Trash2 className="h-5 w-5" />
                <span className="sr-only">Hapus ({selectedIds.length})</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={handleExport}
              className="h-11 w-11 rounded-lg cursor-pointer shadow-sm hover:bg-emerald-50 hover:border-emerald-200 hover:scale-105 transition-all duration-200"
              title="Export CSV"
            >
              <Download className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="w-12 px-6">
                  <Checkbox
                    checked={selectedIds.length > 0 && selectedIds.length === data.users.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
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
                  <TableCell colSpan={7} className="text-center py-20">
                    <TableSkeleton rows={5} />
                  </TableCell>
                </TableRow>
              ) : data.users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <EmptyState
                      title="Tidak ada customer"
                      description="Mulai dengan menambahkan customer pertama"
                      action={
                        <Button
                          onClick={() => setIsDialogOpen(true)}
                          className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                        >
                          <Plus className="mr-2 h-4 w-4" /> Tambah Customer
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                data.users.map((user: any) => (
                  <TableRow key={user.id} className="hover:bg-emerald-50/10 transition-colors">
                    <TableCell className="px-6">
                      <Checkbox
                        checked={selectedIds.includes(user.id)}
                        onCheckedChange={() => toggleSelect(user.id)}
                      />
                    </TableCell>
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
                          onClick={() => handleViewDetail(user)}
                          className="text-blue-600 hover:bg-blue-50 cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
        {data.total > 0 && (
          <div className="flex flex-col md:flex-row items-center justify-between p-5 border-t bg-slate-50/50 gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                Menampilkan <strong className="text-slate-900">{Math.min(data.users.length, data.total)}</strong> dari <strong className="text-slate-900">{data.total}</strong> customer
              </span>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Tampilkan:</span>
                <Select
                  value={limit.toString()}
                  onValueChange={(value) => {
                    setLimit(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[80px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="cursor-pointer"
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium px-3 py-1 bg-white rounded-md border">
                  Halaman {page} dari {data.pages}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(data.pages)}
                disabled={page === data.pages}
                className="cursor-pointer"
              >
                Last
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
              <LoadingButton
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                loading={submitting}
                loadingText="Menyimpan..."
              >
                {editingUser ? "Simpan Perubahan" : "Buat Customer"}
              </LoadingButton>
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
                    <p className="text-lg font-semibold text-slate-700 mb-2">
                      Hapus {selectedIds.length} customer terpilih?
                    </p>
                    <p>Apakah Anda yakin ingin menghapus {selectedIds.length} customer ini?</p>
                    <p className="mt-2 text-sm text-amber-600 font-medium">⚠️ Data akan dihapus permanen dari sistem.</p>
                  </>
                ) : (
                  <>
                    <p>Apakah Anda yakin ingin menghapus customer ini?</p>
                    <p className="mt-2 text-sm text-amber-600 font-medium">⚠️ Data akan dihapus permanen dari sistem.</p>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" /> 
              {deleteUserId === "bulk" ? `Hapus ${selectedIds.length}` : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Customer Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => {
        setIsDetailDialogOpen(open);
        if (!open) {
          setViewingCustomer(null);
        }
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-emerald-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              Detail Customer
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap data customer
            </DialogDescription>
          </DialogHeader>
          {viewingCustomer && (
            <div className="space-y-6 py-4">
              {/* Profile Section */}
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{viewingCustomer.full_name}</h3>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs mt-1">
                    {viewingCustomer.role === 'client' ? 'Customer' : viewingCustomer.role}
                  </Badge>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-600" />
                  Informasi Kontak
                </h4>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{viewingCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-600">{viewingCustomer.phone || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Company Information */}
              {(viewingCustomer.company_name || viewingCustomer.address) && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Building className="h-4 w-4 text-emerald-600" />
                  Informasi Perusahaan
                  </h4>
                  <div className="grid gap-3">
                    {viewingCustomer.company_name && (
                      <div className="flex items-start gap-3 text-sm">
                        <Building className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div>
                          <span className="text-slate-500 block">Perusahaan</span>
                          <span className="text-slate-800 font-medium">{viewingCustomer.company_name}</span>
                        </div>
                      </div>
                    )}
                    {viewingCustomer.address && (
                      <div className="flex items-start gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div>
                          <span className="text-slate-500 block">Alamat</span>
                          <span className="text-slate-800">{viewingCustomer.address}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Registration Date */}
              <div className="space-y-2 pt-4 border-t">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  Informasi Pendaftaran
                </h4>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">Terdaftar sejak: {formatDate(viewingCustomer.created_at)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDetailDialogOpen(false)}
              className="cursor-pointer"
            >
              Tutup
            </Button>
            <Button
              onClick={() => {
                setIsDetailDialogOpen(false);
                handleEdit(viewingCustomer);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
            >
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loading Overlay */}
      <LoadingOverlay
        isOpen={submitting}
        title="Menyimpan Data..."
        description="Customer sedang disimpan"
        variant="default"
      />
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
