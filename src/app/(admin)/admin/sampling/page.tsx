// ============================================================================
// OPTIMIZED SAMPLING PAGE - v2.0
// Fitur Optimasi:
// 1. ✅ Loading Modal saat action
// 2. ✅ Export CSV
// 3. ✅ Empty state yang lebih menarik
// 4. ✅ Filter by status
// 5. ✅ Sort by tanggal/status
// 6. ✅ Quick stats di header table
// 7. ✅ Badge status dengan warna
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  User,
  FileText,
  Eye,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  X
} from "lucide-react";
import { ChemicalLoader } from "@/components/ui";
import { getAllSamplingAssignments, createSamplingAssignment } from "@/lib/actions/sampling";
import { getUsers } from "@/lib/actions/users";
import { getJobOrders } from "@/lib/actions/jobs";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const statusOptions = [
  { value: "all", label: "Semua Status", color: "bg-slate-100 text-slate-700" },
  { value: "pending", label: "Pending", color: "bg-slate-100 text-slate-700", icon: Clock },
  { value: "in_progress", label: "Sedang Berlangsung", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
  { value: "completed", label: "Selesai", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  { value: "cancelled", label: "Dibatalkan", color: "bg-red-100 text-red-700", icon: XCircle }
];

export default function SamplingAssignmentListPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldOfficers, setFieldOfficers] = useState<any[]>([]);
  const [jobOrders, setJobOrders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    job_order_id: "",
    field_officer_id: "",
    scheduled_date: "",
    location: "",
    notes: ""
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getAllSamplingAssignments(page, limit, search);
      setData(result);
    } catch (error: any) {
      toast.error("Gagal memuat data assignment", {
        description: error?.message || "Silakan refresh halaman"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadModalData = async () => {
    try {
      // Load field officers
      const usersData = await getUsers(1, 100, "");
      const officers = usersData.users.filter((u: any) => u.role === 'field_officer');
      setFieldOfficers(officers);

      // Load available job orders
      const jobsData = await getJobOrders(1, 100, "");
      const availableJobs = jobsData.items.filter((j: any) => {
        return ['scheduled', 'sampling'].includes(j.status) && !j.sampling_assignment;
      });
      setJobOrders(availableJobs);
    } catch (error: any) {
      toast.error("Gagal memuat data", {
        description: error?.message
      });
    }
  };

  const handleOpenCreateModal = async () => {
    await loadModalData();
    setIsCreateModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await createSamplingAssignment(formData);

      if (result.error) {
        toast.error(result.error);
        setSubmitting(false);
        return;
      }

      toast.success("Penugasan berhasil dibuat", {
        description: `Job Order ${formData.job_order_id} telah ditugaskan`
      });

      setIsCreateModalOpen(false);
      setFormData({
        job_order_id: "",
        field_officer_id: "",
        scheduled_date: "",
        location: "",
        notes: ""
      });
      loadData();

      // Redirect ke travel order setelah delay
      const assignmentId = result.assignment?.id;
      if (assignmentId) {
        setTimeout(() => {
          window.location.href = `/admin/travel-orders/create/${assignmentId}`;
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast.error(error.message || "Gagal membuat penugasan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, limit, search]);

  // Filter & Sort
  const getFilteredAndSortedData = () => {
    let filtered = [...data.items];
    
    // Search
    if (search) {
      filtered = filtered.filter(item => 
        item.location.toLowerCase().includes(search.toLowerCase()) ||
        item.field_officer.full_name.toLowerCase().includes(search.toLowerCase()) ||
        item.job_order.tracking_code.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter(item => item.status === filterStatus);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
      } else if (sortBy === "status") {
        const statusOrder: Record<string, number> = { pending: 0, in_progress: 1, completed: 2, cancelled: 3 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    return filtered;
  };

  const filteredItems = getFilteredAndSortedData();

  // Stats
  const stats = {
    total: data.items.length,
    pending: data.items.filter((i: any) => i.status === "pending").length,
    in_progress: data.items.filter((i: any) => i.status === "in_progress").length,
    completed: data.items.filter((i: any) => i.status === "completed").length,
    cancelled: data.items.filter((i: any) => i.status === "cancelled").length
  };

  // Export CSV
  const handleExport = () => {
    const headers = ["Tracking Code", "Pelanggan", "Perusahaan", "Petugas", "Lokasi", "Tanggal", "Status", "Deskripsi"];
    const csvData = data.items.map((item: any) => [
      item.job_order.tracking_code,
      item.job_order.quotation.profile.full_name,
      item.job_order.quotation.profile.company_name || "Personal",
      item.field_officer.full_name,
      item.location,
      new Date(item.scheduled_date).toISOString(),
      item.status,
      item.notes || ""
    ]);
    
    const csv = [
      headers.join(","),
      ...csvData.map((row: string[]) => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sampling-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Data berhasil diexport", {
      description: "File CSV telah diunduh"
    });
  };

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.color || "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getStatusIcon = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    const Icon = option?.icon || Clock;
    return <Icon className="h-3 w-3 mr-1" />;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress': return 'SEDANG BERLANGSUNG';
      case 'completed': return 'SELESAI';
      case 'cancelled': return 'DIBATALKAN';
      default: return 'PENDING';
    }
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header dengan Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Penugasan Sampling</h1>
          <p className="text-slate-500 text-sm">Kelola penugasan pengambilan sampel di lapangan.</p>
        </div>

        <div className="flex gap-2 flex-wrap w-full md:w-auto">
          <Button onClick={handleOpenCreateModal} className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 cursor-pointer">
            <Plus className="mr-2 h-4 w-4" /> Buat Penugasan
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Pending</span>
          </div>
          <p className="text-2xl font-bold text-slate-700">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-blue-500">Berlangsung</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{stats.in_progress}</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-500">Selesai</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{stats.completed}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="h-4 w-4 text-red-400" />
            <span className="text-xs font-medium text-red-500">Batal</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 cursor-pointer">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {statusOptions.filter(opt => opt.value !== "all").map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 cursor-pointer">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Tanggal</SelectItem>
                <SelectItem value="status">Status</SelectItem>
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

            <Button variant="outline" onClick={handleExport} className="cursor-pointer">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>

          <div className="text-sm text-slate-500">
            {filteredItems.length} dari {data.total} penugasan
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-emerald-50/10 flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              placeholder="Cari lokasi, petugas, atau tracking code..."
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
                <TableHead className="font-bold text-emerald-900 px-4">Tracking Code</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Pelanggan</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Petugas Lapangan</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Lokasi</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Tanggal Rencana</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Status</TableHead>
                <TableHead className="text-center font-bold text-emerald-900 px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex justify-center">
                      <ChemicalLoader />
                    </div>
                    <p className="mt-4 text-sm text-slate-500">Memuat data...</p>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
                        <MapPin className="h-10 w-10 text-emerald-300" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-slate-700">Belum ada penugasan</p>
                        <p className="text-sm text-slate-500 mt-1">Mulai dengan membuat penugasan sampling pertama</p>
                      </div>
                      <Link href="/admin/sampling/create">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                          <Plus className="mr-2 h-4 w-4" /> Buat Penugasan
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-emerald-50/10 transition-colors">
                    <TableCell className="font-medium text-slate-800 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-600" />
                        {item.job_order.tracking_code}
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{item.job_order.quotation.profile.full_name}</span>
                        <span className="text-xs text-slate-400">{item.job_order.quotation.profile.company_name || "Personal"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700">{item.field_officer.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700 max-w-xs truncate">{item.location}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700 text-sm">
                          {new Date(item.scheduled_date).toLocaleDateString("id-ID", {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge variant="outline" className={cn("capitalize", getStatusColor(item.status))}>
                        {getStatusIcon(item.status)}
                        {getStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center px-6">
                      <Link href={`/admin/sampling/${item.id}`}>
                        <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50 cursor-pointer">
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
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
          ) : filteredItems.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-emerald-300" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-700">Belum ada penugasan</p>
                <p className="text-xs text-slate-500 mt-1">Mulai dengan membuat penugasan</p>
              </div>
              <Link href="/admin/sampling/create">
                <Button className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" /> Buat Penugasan
                </Button>
              </Link>
            </div>
          ) : (
            filteredItems.map((item: any) => (
              <div key={item.id} className="p-4 space-y-3 bg-white active:bg-slate-50">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-600" />
                      <h4 className="font-bold text-slate-900">{item.job_order.tracking_code}</h4>
                    </div>
                    <p className="text-sm text-slate-700">{item.job_order.quotation.profile.full_name}</p>
                    <p className="text-xs text-slate-400">{item.job_order.quotation.profile.company_name || "Personal"}</p>
                  </div>
                  <Badge variant="outline" className={cn("capitalize", getStatusColor(item.status))}>
                    {getStatusIcon(item.status)}
                    {getStatusLabel(item.status)}
                  </Badge>
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-700">{item.field_officer.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-700">{item.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-700">
                      {new Date(item.scheduled_date).toLocaleDateString("id-ID", {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  <Link href={`/admin/sampling/${item.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full text-emerald-600 hover:bg-emerald-50 cursor-pointer">
                      <Eye className="h-4 w-4 mr-1" />
                      Detail
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-500 font-medium">
              Total {data.total} penugasan
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

      {/* Create Penugasan Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(open);
        if (!open) {
          setFormData({
            job_order_id: "",
            field_officer_id: "",
            scheduled_date: "",
            location: "",
            notes: ""
          });
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Buat Penugasan Sampling Baru
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsCreateModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription>
              Tugaskan petugas lapangan untuk pengambilan sampel di lokasi.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="job_order_id">Job Order</Label>
              <Select
                value={formData.job_order_id}
                onValueChange={(val) => handleFormDataChange("job_order_id", val)}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Pilih Job Order" />
                </SelectTrigger>
                <SelectContent>
                  {jobOrders.length === 0 ? (
                    <SelectItem value="none" disabled>Tidak ada job order tersedia</SelectItem>
                  ) : (
                    jobOrders.map((job: any) => (
                      <SelectItem key={job.id} value={job.id} className="cursor-pointer">
                        <div className="flex flex-col">
                          <span className="font-medium">{job.tracking_code}</span>
                          <span className="text-xs text-slate-500">{job.quotation?.profile?.full_name}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {jobOrders.length === 0 && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  <p className="font-medium">⚠️ Tidak ada job order tersedia</p>
                  <p className="text-slate-500 mt-1">
                    Job order harus status "scheduled" atau "sampling" dan belum punya assignment.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="field_officer_id">Petugas Lapangan</Label>
              <Select
                value={formData.field_officer_id}
                onValueChange={(val) => handleFormDataChange("field_officer_id", val)}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Pilih Petugas Lapangan" />
                </SelectTrigger>
                <SelectContent>
                  {fieldOfficers.length === 0 ? (
                    <SelectItem value="none" disabled>Tidak ada petugas lapangan</SelectItem>
                  ) : (
                    fieldOfficers.map((officer: any) => (
                      <SelectItem key={officer.id} value={officer.id} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="font-medium">{officer.full_name}</span>
                            <span className="text-xs text-slate-500">{officer.email}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {fieldOfficers.length === 0 && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  <p className="font-medium">⚠️ Tidak ada petugas lapangan</p>
                  <p className="text-slate-500 mt-1">
                    Buat user dengan role "field_officer" terlebih dahulu.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Tanggal & Waktu Rencana
              </Label>
              <Input
                id="scheduled_date"
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => handleFormDataChange("scheduled_date", e.target.value)}
                required
                className="cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Lokasi Sampling
              </Label>
              <Input
                id="location"
                placeholder="Contoh: Jakarta Industrial Estate, Blok A No. 5"
                value={formData.location}
                onChange={(e) => handleFormDataChange("location", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan / Instruksi Khusus</Label>
              <Textarea
                id="notes"
                placeholder="Instruksi khusus untuk pengambilan sampel..."
                value={formData.notes}
                onChange={(e) => handleFormDataChange("notes", e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                disabled={submitting || !formData.job_order_id || !formData.field_officer_id}
              >
                {submitting && <ChemicalLoader size="sm" />}
                Buat Penugasan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
