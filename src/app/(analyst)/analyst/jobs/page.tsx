"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getMyAnalysisJobs } from "@/lib/actions/analyst";
import { ChemicalLoader, LoadingOverlay, LoadingButton } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  FlaskConical,
  Search,
  ArrowRight,
  Filter,
  PackageCheck,
  MapPin,
  Calendar,
  AlertCircle,
  X,
  FileText,
  User
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
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
import { createSampleHandover, getHandoverByJobId } from "@/lib/actions/handover";
import { getProfile } from "@/lib/actions/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { SampleHandoverPDF } from "@/components/pdf/SampleHandoverPDF";

export default function AnalystJobsPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [profile, setProfile] = useState<any>(null);

  // Handover Modal State
  const [handoverDialogOpen, setHandoverDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [handoverData, setHandoverData] = useState({
    sample_condition: "Segel Utuh",
    sample_qty: 1,
    sample_notes: ""
  });
  
  // Photo Viewer State
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [photoTitle, setPhotoTitle] = useState("");

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const status = statusFilter === "all" ? undefined : statusFilter;
      const [data, prof] = await Promise.all([
        getMyAnalysisJobs(page, 50, status),
        getProfile()
      ]);
      setJobs(data.jobOrders || []);
      setTotal(data.total || 0);
      setProfile(prof);
    } catch (error) {
      console.error("Failed to load jobs:", error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleOpenHandover = (job: any) => {
    setSelectedJob(job);
    setHandoverDialogOpen(true);
  };

  const handleViewPhotos = (job: any) => {
    const photos = job.sampling_assignment?.photos;
    if (photos && photos.length > 0) {
      setSelectedPhotos(Array.isArray(photos) ? photos : JSON.parse(photos));
      setPhotoTitle(`${job.tracking_code} - Foto Sampling`);
      setSelectedJob(job); // Set selected job for photo dialog
      setPhotoDialogOpen(true);
    }
  };

  const getPhotoName = (photo: any, index: number) => {
    if (typeof photo === 'string') return `Foto ${index + 1}`;
    if (typeof photo === 'object' && photo.name) return photo.name;
    return `Foto ${index + 1}`;
  };

  const handleCreateHandover = async () => {
    if (!selectedJob || !profile) return;
    setSubmitting(true);
    try {
      const res = await createSampleHandover({
        job_order_id: selectedJob.id,
        sender_id: selectedJob.sampling_assignment?.field_officer_id || profile.id, // Fallback if no FO
        receiver_id: profile.id,
        ...handoverData
      });

      if (res.success) {
        toast.success("BAST Berhasil dibuat", {
          description: "Sampel telah diterima dan status berubah ke Analisis."
        });
        setHandoverDialogOpen(false);
        loadJobs();
      } else {
        toast.error(res.error || "Gagal membuat BAST");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setSubmitting(false);
    }
  };

  const statusColors: any = {
    scheduled: "bg-slate-100 text-slate-700",
    sampling: "bg-blue-100 text-blue-700 border-blue-200",
    analysis_ready: "bg-emerald-100 text-emerald-700 border-emerald-200 animate-pulse",
    analysis: "bg-violet-100 text-violet-700 border-violet-200",
    analysis_done: "bg-emerald-100 text-emerald-700 border-emerald-200",
    reporting: "bg-amber-100 text-amber-700 border-amber-200",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200"
  };

  const statusLabels: any = {
    scheduled: "Terjadwal",
    sampling: "Sampling",
    analysis_ready: "Siap Analisis",
    analysis: "Analisis",
    analysis_done: "Selesai Analisis",
    reporting: "Reporting",
    completed: "Selesai"
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-emerald-600" />
            Antrean Analisis
          </h1>
          <p className="text-slate-500 text-sm mt-1">Kelola sampel dan hasil pengujian laboratorium Anda.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
           <div className="text-right">
              <p className="text-[10px] font-black text-emerald-600 uppercase leading-none">Analis</p>
              <p className="text-xs font-bold text-emerald-900">{profile?.full_name}</p>
           </div>
           <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-black">
              {profile?.full_name?.charAt(0)}
           </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 mb-8 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari tracking code atau customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-11 rounded-2xl border-slate-200"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 h-11 rounded-2xl border-slate-200 bg-white font-bold text-xs">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="sampling">Siap Terima (Sampling)</SelectItem>
            <SelectItem value="analysis">Sedang Analisis</SelectItem>
            <SelectItem value="analysis_done">Selesai Analisis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jobs Table Container */}
      <div className="bg-white rounded-[2rem] shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="px-6 font-black text-emerald-900 uppercase text-[10px] tracking-widest">Tracking Code</TableHead>
              <TableHead className="px-4 font-black text-emerald-900 uppercase text-[10px] tracking-widest">Customer</TableHead>
              <TableHead className="px-4 font-black text-emerald-900 uppercase text-[10px] tracking-widest">Lokasi Sampling</TableHead>
              <TableHead className="px-4 font-black text-emerald-900 uppercase text-[10px] tracking-widest">Foto Sampling</TableHead>
              <TableHead className="px-4 font-black text-emerald-900 uppercase text-[10px] tracking-widest">Status</TableHead>
              <TableHead className="px-6 font-black text-emerald-900 uppercase text-[10px] tracking-widest text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5} className="py-6 px-6"><div className="h-10 bg-slate-50 animate-pulse rounded-xl" /></TableCell></TableRow>
              ))
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-24">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
                      <FlaskConical className="h-10 w-10 text-emerald-200" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-700">Tidak ada antrean</p>
                      <p className="text-sm text-slate-400">Pekerjaan akan muncul di sini setelah petugas lapangan selesai.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job: any) => (
                <TableRow key={job.id} className="hover:bg-emerald-50/5 transition-all group border-slate-100">
                  <TableCell className="px-6 font-mono text-xs font-black text-emerald-700">{job.tracking_code}</TableCell>
                  <TableCell className="px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-slate-800">{job.quotation?.profile?.company_name || job.quotation?.profile?.full_name || "-"}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{job.quotation?.profile?.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span className="truncate max-w-[150px]">{job.sampling_assignment?.location || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    {job.sampling_assignment?.photos && job.sampling_assignment.photos.length > 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPhotos(job)}
                        className="h-8 text-xs font-bold text-emerald-600 border-emerald-200 hover:bg-emerald-50 cursor-pointer"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        {Array.isArray(job.sampling_assignment.photos) ? job.sampling_assignment.photos.length : 0} Foto
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Tidak ada foto</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4">
                    <Badge variant="outline" className={cn("text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border-2", statusColors[job.status])}>
                      {statusLabels[job.status] || job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 text-right">
                    <div className="flex justify-end gap-2">
                      {job.status === 'sampling' ? (
                        <Button 
                          size="sm" 
                          onClick={() => handleOpenHandover(job)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl h-9 px-4 shadow-lg shadow-emerald-900/20"
                        >
                          <PackageCheck className="mr-2 h-4 w-4" />
                          Terima Sampel
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          {job.sample_handover && (
                            <PDFDownloadLink
                              document={<SampleHandoverPDF data={job.sample_handover} />}
                              fileName={`BAST-${job.tracking_code}.pdf`}
                            >
                              {({ loading }) => (
                                <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50" title="Cetak BAST">
                                  <FileText className="h-4 w-4" />
                                </Button>
                              )}
                            </PDFDownloadLink>
                          )}
                          <Link href={`/analyst/jobs/${job.id}`}>
                            <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50 font-bold text-[10px] uppercase rounded-xl h-9 px-4">
                              Input Hasil
                              <ArrowRight className="ml-2 h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Photo Viewer Dialog */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="sm:max-w-4xl p-0 border-none shadow-2xl rounded-3xl overflow-hidden max-h-[90vh]">
          <div className="bg-emerald-700 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center border border-white/20">
                <FileText className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-black uppercase tracking-widest">{photoTitle}</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPhotoDialogOpen(false)} className="text-white/60 hover:text-white h-8 w-8"><X className="h-4 w-4" /></Button>
          </div>

          {/* Sampling Info Banner */}
          {selectedJob && (
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 border-b border-emerald-100">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Lokasi</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedJob.sampling_assignment?.location || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Tanggal</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {selectedJob.sampling_assignment?.scheduled_date
                        ? new Date(selectedJob.sampling_assignment.scheduled_date).toLocaleDateString('id-ID')
                        : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Petugas</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {selectedJob.sampling_assignment?.field_officer?.full_name || '-'}
                    </p>
                  </div>
                </div>
              </div>
              {selectedJob.sampling_assignment?.notes && (
                <div className="mt-3 p-3 bg-white/60 rounded-lg border border-emerald-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Catatan Sampling</p>
                  <p className="text-sm text-slate-700">{selectedJob.sampling_assignment.notes}</p>
                </div>
              )}
            </div>
          )}

          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {selectedPhotos.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">Tidak ada foto yang diunggah</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPhotos.map((photo: any, index: number) => {
                  const photoUrl = typeof photo === 'string' ? photo : photo.url;
                  const photoName = getPhotoName(photo, index);
                  
                  return (
                    <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      <div className="absolute top-2 left-2 right-2 z-10 bg-gradient-to-r from-black/80 to-transparent text-white text-xs font-bold px-3 py-2 rounded-lg backdrop-blur-sm">
                        {photoName}
                      </div>
                      {photoUrl.includes('.pdf') || photoUrl.includes('application/pdf') ? (
                        <div className="aspect-video flex items-center justify-center bg-white">
                          <FileText className="h-12 w-12 text-red-500" />
                        </div>
                      ) : (
                        <img
                          src={photoUrl}
                          alt={photoName}
                          className="w-full h-auto object-cover aspect-video group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2UyZThmMCIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                          }}
                        />
                      )}
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 text-xs cursor-pointer shadow-lg"
                          onClick={() => window.open(photoUrl, '_blank')}
                        >
                          Buka
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedPhotos.length > 0 && (
              <div className="mt-4 text-center text-sm text-slate-500 font-medium">
                📸 Total {selectedPhotos.length} foto sampling diunggah
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Handover Modal */}
      <Dialog open={handoverDialogOpen} onOpenChange={setHandoverDialogOpen}>
        <DialogContent className="sm:max-w-xl p-0 border-none shadow-2xl rounded-3xl overflow-hidden">
          <div className="bg-emerald-700 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center border border-white/20">
                <PackageCheck className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-black uppercase tracking-widest">Serah Terima Sampel (BAST)</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setHandoverDialogOpen(false)} className="text-white/60 hover:text-white h-8 w-8"><X className="h-4 w-4" /></Button>
          </div>

          <div className="p-6 space-y-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                  <PackageCheck className="h-6 w-6 text-emerald-600" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Job Order</p>
                  <p className="text-lg font-black text-slate-800 leading-none">{selectedJob?.tracking_code}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Kondisi Sampel / Segel</Label>
                <Select value={handoverData.sample_condition} onValueChange={(val) => setHandoverData({...handoverData, sample_condition: val})}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 border-slate-200">
                    <SelectValue placeholder="Pilih Kondisi..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Segel Utuh">Segel Utuh</SelectItem>
                    <SelectItem value="Segel Rusak">Segel Rusak</SelectItem>
                    <SelectItem value="Tanpa Segel">Tanpa Segel</SelectItem>
                    <SelectItem value="Wadah Pecah/Bocor">Wadah Pecah/Bocor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Jumlah Wadah (Unit)</Label>
                <Input 
                  type="number" 
                  value={handoverData.sample_qty} 
                  onChange={(e) => setHandoverData({...handoverData, sample_qty: parseInt(e.target.value) || 1})}
                  className="h-11 rounded-xl bg-slate-50/50 border-slate-200 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Catatan Serah Terima</Label>
              <Textarea 
                placeholder="Misal: Sampel diterima dalam box pendingin (Coolbox)..."
                value={handoverData.sample_notes}
                onChange={(e) => setHandoverData({...handoverData, sample_notes: e.target.value})}
                className="rounded-xl bg-slate-50/50 border-slate-200 resize-none min-h-[100px]"
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
               <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
               <p className="text-[10px] text-amber-700 font-medium leading-tight uppercase tracking-tighter">
                 Dengan mengklik "Konfirmasi Terima", Anda menyatakan sampel telah diterima secara fisik dan siap untuk diuji.
               </p>
            </div>
          </div>

          <DialogFooter className="p-4 bg-slate-50 border-t flex gap-3">
            <Button variant="ghost" onClick={() => setHandoverDialogOpen(false)} className="flex-1 font-black text-[10px] uppercase h-11 rounded-xl text-slate-400">Batal</Button>
            <LoadingButton 
              onClick={handleCreateHandover}
              loading={submitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase h-11 rounded-xl shadow-lg shadow-emerald-900/20"
            >
              Konfirmasi Terima
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LoadingOverlay isOpen={submitting} title="Memproses BAST..." description="Mohon tunggu, status pekerjaan sedang diperbarui" />
    </div>
  );
}
