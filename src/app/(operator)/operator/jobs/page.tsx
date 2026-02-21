// ============================================================================
// OPERATOR JOB PROGRESS PAGE
// Fitur:
// 1. List semua job orders dengan progress
// 2. Update progress pekerjaan (Sampling, Analisis, Reporting, Selesai)
// 3. Upload sertifikat saat selesai
// 4. Filter & Search
// 5. Stats by status
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
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Eye,
  FileCheck,
  TestTube,
  Truck,
  FileText,
  FileDown,
  MessageSquare,
  CheckCircle,
  Clock,
  Calendar,
  User,
  MapPin,
  Plus,
  X,
  Save,
  Printer
} from "lucide-react";
import { ChemicalLoader } from "@/components/ui";
import { getJobOrders, updateJobStatus, uploadCertificate } from "@/lib/actions/jobs";
import { createSamplingAssignment } from "@/lib/actions/sampling";
import { createTravelOrder } from "@/lib/actions/travel-order";
import { getUsers } from "@/lib/actions/users";
import { getProfile } from "@/lib/actions/auth";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const statusOptions = [
  { value: "all", label: "Semua Status", color: "bg-slate-100 text-slate-700" },
  { value: "scheduled", label: "Dijadwalkan", color: "bg-slate-100 text-slate-600", icon: Clock },
  { value: "sampling", label: "Sampling", color: "bg-blue-100 text-blue-700", icon: Truck },
  { value: "analysis", label: "Analisis", color: "bg-amber-100 text-amber-700", icon: TestTube },
  { value: "reporting", label: "Pelaporan", color: "bg-indigo-100 text-indigo-700", icon: FileText },
  { value: "completed", label: "Selesai", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle }
];

export default function OperatorJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modal states
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [nextStatus, setNextStatus] = useState<string>("");
  const [statusNote, setStatusNote] = useState<string>("");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Assign modal states
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [fieldOfficers, setFieldOfficers] = useState<any[]>([]);
  const [assignFormData, setAssignFormData] = useState({
    job_order_id: "",
    field_officer_id: "",
    scheduled_date: "",
    scheduled_time: "08:00",
    location: "",
    notes: ""
  });
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const supabase = createClient();

  const loadData = async (searchQuery: string = search) => {
    setLoading(true);
    try {
      const result = await getJobOrders(page, 100, searchQuery);
      setJobs(result);
    } catch (error) {
      toast.error("Gagal memuat data", {
        description: "Silakan refresh halaman"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const loadFieldOfficers = async () => {
    try {
      const usersData = await getUsers(1, 100, "");
      const officers = usersData.users.filter((u: any) => u.role === 'field_officer');
      setFieldOfficers(officers);
    } catch (error: any) {
      toast.error("Gagal memuat petugas lapangan", {
        description: error?.message
      });
    }
  };

  const openAssignDialog = async (job: any) => {
    setSelectedJob(job);
    setAssignFormData({
      job_order_id: job.id,
      field_officer_id: "",
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: "08:00",
      location: job.quotation?.profile?.address || "",
      notes: ""
    });
    await loadFieldOfficers();
    setIsAssignDialogOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedJob) return;
    if (!assignFormData.field_officer_id) {
      toast.error("Petugas lapangan wajib dipilih");
      return;
    }
    if (!assignFormData.scheduled_date) {
      toast.error("Tanggal jadwal wajib diisi");
      return;
    }
    if (!assignFormData.location) {
      toast.error("Lokasi sampling wajib diisi");
      return;
    }

    setAssignSubmitting(true);
    try {
      // 1. Create sampling assignment
      const assignmentResult = await createSamplingAssignment({
        ...assignFormData,
        scheduled_date: `${assignFormData.scheduled_date}T${assignFormData.scheduled_time}:00`
      });
      
      if (assignmentResult.error) {
        toast.error(assignmentResult.error);
        setAssignSubmitting(false);
        return;
      }

      const assignmentId = assignmentResult.assignment?.id;

      if (!assignmentId) {
        toast.error("Gagal mendapatkan ID assignment");
        setAssignSubmitting(false);
        return;
      }

      // 2. Auto-create travel order with minimal data
      const travelOrderData = {
        assignment_id: assignmentId,
        departure_date: `${assignFormData.scheduled_date}T${assignFormData.scheduled_time}:00`,
        return_date: `${assignFormData.scheduled_date}T17:00:00`,
        destination: assignFormData.location,
        purpose: assignFormData.notes || `Sampling untuk ${selectedJob.tracking_code}`,
        transportation_type: undefined,
        accommodation_type: undefined,
        daily_allowance: undefined,
        total_budget: undefined,
        notes: undefined
      };

      await createTravelOrder(travelOrderData);

      toast.success("✅ Penugasan berhasil dibuat & surat tugas diterbitkan!");
      
      // Reset & close
      setAssignFormData({
        job_order_id: "",
        field_officer_id: "",
        scheduled_date: "",
        scheduled_time: "08:00",
        location: "",
        notes: ""
      });
      setIsAssignDialogOpen(false);
      
      // Reload data
      loadData();
    } catch (error: any) {
      console.error("Assign error:", error);
      toast.error("Gagal membuat penugasan", {
        description: error?.message
      });
    } finally {
      setAssignSubmitting(false);
    }
  };

  const openStatusDialog = (job: any, status: string) => {
    setSelectedJob(job);
    setNextStatus(status);
    setStatusNote("");
    setCertificateFile(null);
    setIsStatusDialogOpen(true);
  };

  const confirmStatusUpdate = async () => {
    if (!selectedJob) return;

    setSubmitting(true);
    try {
      let certificateUrl = null;

      // Upload sertifikat jika status Selesai dan ada file
      if (nextStatus === 'completed' && certificateFile) {
        const fileExt = certificateFile.name.split('.').pop();
        const fileName = `${selectedJob.tracking_code}-${Date.now()}.${fileExt}`;
        const filePath = `certificates/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('lab-documents')
          .upload(filePath, certificateFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('lab-documents')
          .getPublicUrl(filePath);

        certificateUrl = publicUrl;
      }

      await updateJobStatus(selectedJob.id, nextStatus, statusNote);

      // Upload certificate URL ke database
      if (certificateUrl) {
        await uploadCertificate(selectedJob.id, certificateUrl);
      }

      toast.success(`Progress ${selectedJob.tracking_code} berhasil diperbarui`, {
        description: `Status: ${nextStatus.toUpperCase()}`
      });

      setIsStatusDialogOpen(false);
      setCertificateFile(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui progress");
    } finally {
      setSubmitting(false);
    }
  };

  const getJobStatusBadge = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    const Icon = option?.icon;
    
    return (
      <Badge className={cn("border-none gap-1", option?.color)}>
        {Icon && <Icon className="h-3 w-3" />}
        {option?.label || status.toUpperCase()}
      </Badge>
    );
  };

  // Filter jobs by status
  const getFilteredJobs = () => {
    let filtered = [...jobs.items];

    // Search filter
    if (search) {
      filtered = filtered.filter(job =>
        job.tracking_code.toLowerCase().includes(search.toLowerCase()) ||
        job.quotation?.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        job.quotation?.items?.[0]?.service?.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(job => job.status === filterStatus);
    }

    return filtered;
  };

  const filteredJobs = getFilteredJobs();

  // Stats
  const stats = {
    total: jobs.items.length,
    scheduled: jobs.items.filter((j: any) => j.status === "scheduled").length,
    sampling: jobs.items.filter((j: any) => j.status === "sampling").length,
    analysis: jobs.items.filter((j: any) => j.status === "analysis").length,
    reporting: jobs.items.filter((j: any) => j.status === "reporting").length,
    completed: jobs.items.filter((j: any) => j.status === "completed").length
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Progress Pekerjaan</h1>
          <p className="text-slate-500 text-sm">Pantau dan update progress pekerjaan laboratorium.</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Dijadwalkan</span>
          </div>
          <p className="text-2xl font-bold text-slate-700">{stats.scheduled}</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="h-4 w-4 text-blue-400" />
            <span className="text-xs font-medium text-blue-500">Sampling</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{stats.sampling}</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TestTube className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-medium text-amber-500">Analisis</span>
          </div>
          <p className="text-2xl font-bold text-amber-700">{stats.analysis}</p>
        </div>
        <div className="bg-white rounded-xl border border-indigo-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-medium text-indigo-500">Pelaporan</span>
          </div>
          <p className="text-2xl font-bold text-indigo-700">{stats.reporting}</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-500">Selesai</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{stats.completed}</p>
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
          </div>

          <div className="text-sm text-slate-500">
            {filteredJobs.length} dari {jobs.total} pekerjaan
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-emerald-50/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              placeholder="Cari kode tracking, customer, atau layanan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 focus-visible:ring-emerald-500 rounded-xl"
            />
          </div>
        </div>

        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="w-[180px] font-bold text-emerald-900 px-6">Kode Tracking</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Pekerjaan</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Customer</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Tanggal</TableHead>
                <TableHead className="text-center font-bold text-emerald-900 px-4">Progress</TableHead>
                <TableHead className="text-center font-bold text-emerald-900 px-6">Petugas Lapangan</TableHead>
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
              ) : filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
                        <Clock className="h-10 w-10 text-emerald-300" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-slate-700">Belum ada pekerjaan</p>
                        <p className="text-sm text-slate-500 mt-1">Pekerjaan akan muncul setelah ada pesanan</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map((job: any) => (
                  <TableRow key={job.id} className="hover:bg-emerald-50/10 transition-colors">
                    <TableCell className="px-6 font-mono font-bold text-emerald-700">
                      {job.tracking_code}
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">
                          {job.quotation?.items?.[0]?.service?.name || 'Uji Lab'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {job.quotation?.items?.[0]?.service?.category || 'Layanan'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700">
                            {job.quotation?.profile?.full_name || job.quotation?.profile?.company_name || '-'}
                          </span>
                          {job.quotation?.profile?.company_name && job.quotation?.profile?.full_name && (
                            <span className="text-xs text-slate-500">
                              {job.quotation?.profile?.company_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {new Date(job.created_at).toLocaleDateString("id-ID", {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 text-center">
                      {getJobStatusBadge(job.status)}
                    </TableCell>
                    <TableCell className="px-6 text-center">
                      {/* Tombol Tugaskan Petugas - untuk job yang belum punya assignment */}
                      {!job.sampling_assignment ? (
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => openAssignDialog(job)}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Tugaskan Petugas
                        </Button>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <User className="h-3 w-3 mr-1" />
                            {job.sampling_assignment.field_officer?.full_name || 'Assigned'}
                          </Badge>
                          {/* Download PDF Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            title="Unduh Surat Tugas"
                            onClick={() => {
                              // Navigate to travel order preview (operator version)
                              const travelOrderId = job.sampling_assignment?.travel_order?.id;
                              if (travelOrderId) {
                                window.open(`/operator/travel-orders/${travelOrderId}/preview`, '_blank');
                              } else {
                                toast.error("Surat tugas belum tersedia");
                              }
                            }}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
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
            <div className="p-10 text-center">
              <ChemicalLoader />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                <Clock className="h-8 w-8 text-emerald-300" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-700">Belum ada pekerjaan</p>
                <p className="text-xs text-slate-500 mt-1">Pekerjaan akan muncul setelah ada pesanan</p>
              </div>
            </div>
          ) : (
            filteredJobs.map((job: any) => (
              <div key={job.id} className="p-4 space-y-3 bg-white active:bg-slate-50">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-600" />
                      <h4 className="font-mono font-bold text-slate-900">{job.tracking_code}</h4>
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      {job.quotation?.items?.[0]?.service?.name || 'Uji Lab'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <User className="h-3 w-3" />
                      {job.quotation?.profile?.full_name || '-'}
                    </div>
                  </div>
                  <div className="ml-2">
                    {getJobStatusBadge(job.status)}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-xs text-slate-400">
                    {new Date(job.created_at).toLocaleDateString("id-ID", {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={job.status === 'sampling' ? 'text-blue-600 bg-blue-50' : 'text-slate-300'}
                      onClick={() => openStatusDialog(job, 'sampling')}
                    >
                      <Truck className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={job.status === 'analysis' ? 'text-amber-600 bg-amber-50' : 'text-slate-300'}
                      onClick={() => openStatusDialog(job, 'analysis')}
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={job.status === 'reporting' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300'}
                      onClick={() => openStatusDialog(job, 'reporting')}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={job.status === 'completed' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300'}
                      onClick={() => openStatusDialog(job, 'completed')}
                    >
                      <FileCheck className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Update Status dengan Catatan */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-emerald-900">Update Progress Pekerjaan</DialogTitle>
            <DialogDescription>
              Masukkan catatan untuk status <span className="font-bold uppercase text-emerald-600">{nextStatus}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* Job Info */}
            {selectedJob && (
              <div className="bg-slate-50 p-3 rounded-lg space-y-1">
                <p className="text-xs font-mono font-bold text-emerald-700">{selectedJob.tracking_code}</p>
                <p className="text-sm font-bold text-slate-800">
                  {selectedJob.quotation?.items?.[0]?.service?.name || 'Uji Lab'}
                </p>
                <p className="text-xs text-slate-500">
                  {selectedJob.quotation?.profile?.full_name}
                </p>
              </div>
            )}

            {/* Status Note */}
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-400" />
                Catatan Pengerjaan
              </label>
              <Textarea
                placeholder="Contoh: Sampel telah diambil di lokasi A dengan kondisi baik..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="min-h-[120px] rounded-2xl focus-visible:ring-emerald-500 border-slate-200"
              />
            </div>

            {/* Certificate Upload for Completed Status */}
            {nextStatus === 'completed' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <FileDown className="h-4 w-4 text-emerald-600" />
                  Unggah Sertifikat (PDF)
                </label>
                <div className="border-2 border-dashed border-emerald-100 rounded-2xl p-6 text-center hover:bg-emerald-50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="cert-upload"
                  />
                  <label htmlFor="cert-upload" className="cursor-pointer">
                    {certificateFile ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold">
                        <FileCheck className="h-5 w-5" />
                        {certificateFile.name}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm text-slate-600 font-medium">Klik untuk pilih file sertifikat</p>
                        <p className="text-[10px] text-slate-400">Hanya file PDF (Maks. 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              className="rounded-xl cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={confirmStatusUpdate}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-8 cursor-pointer"
              disabled={submitting}
            >
              {submitting ? <ChemicalLoader size="sm" /> : "Simpan Progress"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ASSIGN FIELD OFFICER MODAL */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center text-emerald-600 border border-emerald-600/30">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-emerald-900">Tugaskan Petugas Lapangan</DialogTitle>
                <DialogDescription className="text-xs">
                  Buat penugasan sampling & terbitkan surat tugas otomatis
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Job Info */}
            <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 uppercase">Informasi Job Order</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 text-xs">Tracking Code:</span>
                  <p className="font-semibold text-slate-800">{selectedJob?.tracking_code || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-xs">Customer:</span>
                  <p className="font-semibold text-slate-800">{selectedJob?.quotation?.profile?.full_name || '-'}</p>
                </div>
              </div>
            </div>

            {/* Field Officer Selection */}
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600" />
                Petugas Lapangan <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={assignFormData.field_officer_id} 
                onValueChange={(val) => setAssignFormData({ ...assignFormData, field_officer_id: val })}
              >
                <SelectTrigger className="h-10 border-slate-300">
                  <SelectValue placeholder="Pilih petugas lapangan..." />
                </SelectTrigger>
                <SelectContent>
                  {fieldOfficers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      Tidak ada petugas lapangan tersedia.
                    </div>
                  ) : (
                    fieldOfficers.map((officer) => (
                      <SelectItem key={officer.id} value={officer.id} className="text-xs">
                        {officer.full_name} - {officer.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Scheduled Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  Tanggal <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={assignFormData.scheduled_date}
                  onChange={(e) => setAssignFormData({ ...assignFormData, scheduled_date: e.target.value })}
                  className="h-10 border-slate-300"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  Jam <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="time"
                  value={assignFormData.scheduled_time}
                  onChange={(e) => setAssignFormData({ ...assignFormData, scheduled_time: e.target.value })}
                  className="h-10 border-slate-300"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                Lokasi Sampling <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={assignFormData.location}
                onChange={(e) => setAssignFormData({ ...assignFormData, location: e.target.value })}
                placeholder="Alamat lengkap lokasi sampling"
                className="min-h-[80px] border-slate-300"
                rows={3}
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                Catatan Tambahan
              </Label>
              <Textarea
                value={assignFormData.notes}
                onChange={(e) => setAssignFormData({ ...assignFormData, notes: e.target.value })}
                placeholder="Instruksi khusus atau catatan tambahan (opsional)"
                className="min-h-[60px] border-slate-300"
                rows={2}
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <p className="font-bold mb-1">Surat Tugas Akan Diterbitkan Otomatis</p>
                  <p className="text-blue-600">Setelah penugasan dibuat, surat tugas perjalanan akan otomatis diterbitkan dan dapat diunduh untuk petugas lapangan.</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t -mx-6 px-6 py-4 mt-6">
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAssignDialogOpen(false)}
                className="font-bold text-slate-400 text-xs uppercase px-6 h-10 rounded-xl"
              >
                Batal
              </Button>
              <Button
                onClick={handleAssignSubmit}
                disabled={assignSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-emerald-900/20 text-xs tracking-wide uppercase transition-all active:scale-95 flex-1"
              >
                {assignSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>MEMPROSES...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center leading-none gap-1">
                    <span className="flex items-center gap-2">
                      BUAT PENUGASAN & SURAT TUGAS
                      <Save className="h-4 w-4" />
                    </span>
                    <span className="text-[7px] opacity-60 font-bold tracking-[0.1em]">
                      [ Auto-generate travel order ]
                    </span>
                  </div>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper for className
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
