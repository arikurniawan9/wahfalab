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
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Tag,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { ChemicalLoader } from "@/components/ui";
import {
  getRegulations,
  createOrUpdateRegulation,
  deleteRegulation,
  type RegulationInput
} from "@/lib/actions/regulation";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "all", label: "Semua Status", color: "bg-slate-100 text-slate-700" },
  { value: "active", label: "Aktif", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  { value: "inactive", label: "Tidak Aktif", color: "bg-red-100 text-red-700", icon: XCircle },
  { value: "draft", label: "Draft", color: "bg-amber-100 text-amber-700", icon: Clock },
];

export default function RegulationsPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [formData, setFormData] = useState<RegulationInput>({
    name: "",
    code: "",
    description: "",
    published_date: "",
    effective_date: "",
    status: "active",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getRegulations(page, limit, search, filterStatus);
      setData(result);
    } catch (error: any) {
      toast.error("Gagal memuat data regulasi", {
        description: error?.message || "Silakan refresh halaman"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, limit, search, filterStatus]);

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code || "",
      description: item.description || "",
      published_date: item.published_date ? new Date(item.published_date).toISOString().split('T')[0] : "",
      effective_date: item.effective_date ? new Date(item.effective_date).toISOString().split('T')[0] : "",
      status: item.status || "active",
    });
    setIsDialogOpen(true);
  };

  const handleReset = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      published_date: "",
      effective_date: "",
      status: "active",
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowSubmitModal(true);
    setSubmitting(true);
    try {
      await createOrUpdateRegulation(formData, editingItem?.id);
      setIsDialogOpen(false);
      handleReset();
      setEditingItem(null);
      loadData();
      toast.success(editingItem ? "Regulasi berhasil diperbarui" : "Regulasi berhasil ditambahkan", {
        description: formData.name
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

  const handleDelete = (id: string) => {
    setDeleteItemId(id);
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;
    try {
      const result = await deleteRegulation(deleteItemId);
      if (result.error) {
        toast.error(result.error);
      } else {
        loadData();
        toast.success("Regulasi berhasil dihapus", {
          description: "Data telah dihapus dari katalog"
        });
      }
      setDeleteItemId(null);
    } catch (error: any) {
      toast.error("Gagal menghapus regulasi", {
        description: error?.message || "Silakan coba lagi"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    if (!option) return null;
    return (
      <Badge variant="outline" className={cn("capitalize", option.color)}>
        {option.label}
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Regulasi</h1>
            <p className="text-slate-500 text-sm">Kelola regulasi dan standar layanan laboratorium.</p>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500" />
              <Input
                placeholder="Cari nama regulasi, kode, atau deskripsi..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 h-11 focus-visible:ring-emerald-500 rounded-lg"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 h-11 cursor-pointer">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  handleReset();
                  setEditingItem(null);
                  setIsDialogOpen(true);
                }}
                className="h-11 w-11 rounded-lg cursor-pointer shadow-lg shadow-emerald-100 bg-emerald-600 hover:bg-emerald-700"
                title="Tambah Regulasi"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-bold text-emerald-900 px-4">Nama Regulasi</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Kode</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Deskripsi</TableHead>
                <TableHead className="text-center font-bold text-emerald-900 px-4">Parameter</TableHead>
                <TableHead className="text-center font-bold text-emerald-900 px-4">Status</TableHead>
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
              ) : data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
                        <FileText className="h-10 w-10 text-emerald-300" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-slate-700">Belum ada regulasi</p>
                        <p className="text-sm text-slate-500 mt-1">Mulai dengan menambahkan regulasi pertama</p>
                      </div>
                      <Button
                        onClick={() => setIsDialogOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Tambah Regulasi
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-emerald-50/10 transition-colors">
                    <TableCell className="px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800">{item.name}</span>
                          {item.description && (
                            <p className="text-xs text-slate-500 truncate max-w-xs">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {item.code || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm px-4 max-w-xs truncate">
                      {item.description || "-"}
                    </TableCell>
                    <TableCell className="text-center px-4">
                      <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                        <Tag className="h-3 w-3 mr-1" />
                        {item._count?.parameters || 0} Parameter
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center px-4">
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell className="text-center px-6">
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:bg-red-50 cursor-pointer"
                          onClick={() => handleDelete(item.id)}
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
        <div className="p-4 border-t flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-500 font-medium">
              Total {data.total} regulasi
            </p>
          </div>
          <div className="flex items-center gap-2">
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
          handleReset();
          setEditingItem(null);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-emerald-900 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {editingItem ? "Edit" : "Tambah"} Regulasi Baru
            </DialogTitle>
            <DialogDescription>
              Isi rincian regulasi dan standar di bawah ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Nama Regulasi *</label>
                <Input
                  {...{ value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }) }}
                  placeholder="Contoh: SNI 8557:2018"
                  required
                  className="focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Kode Regulasi</label>
                <Input
                  {...{ value: formData.code, onChange: (e) => setFormData({ ...formData, code: e.target.value }) }}
                  placeholder="Contoh: SNI-8557-2018"
                  className="focus-visible:ring-emerald-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Deskripsi</label>
              <Textarea
                {...{ value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }) }}
                placeholder="Deskripsi regulasi..."
                className="min-h-[80px] focus-visible:ring-emerald-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Tanggal Publikasi</label>
                <Input
                  type="date"
                  {...{ value: formData.published_date, onChange: (e) => setFormData({ ...formData, published_date: e.target.value }) }}
                  className="focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Tanggal Efektif</label>
                <Input
                  type="date"
                  {...{ value: formData.effective_date, onChange: (e) => setFormData({ ...formData, effective_date: e.target.value }) }}
                  className="focus-visible:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Status</label>
                <Select
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                  defaultValue={formData.status || "active"}
                >
                  <SelectTrigger className="cursor-pointer focus:ring-emerald-500">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.filter(opt => opt.value !== "all").map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 cursor-pointer" disabled={submitting}>
                {editingItem ? "Simpan Perubahan" : "Tambahkan Regulasi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteItemId !== null} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Konfirmasi Hapus
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-4">
              <div>
                Apakah Anda yakin ingin menghapus regulasi ini?
                <div className="mt-2 text-sm text-amber-600 font-medium">⚠️ Data akan dihapus permanen dari katalog.</div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="cursor-pointer">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Loading Modal */}
      <Dialog open={showSubmitModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="flex flex-col items-center gap-4 py-4">
                <ChemicalLoader size="lg" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-emerald-900">Menyimpan Data</p>
                  <p className="text-sm text-slate-500 mt-1">Mohon tunggu sebentar</p>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
