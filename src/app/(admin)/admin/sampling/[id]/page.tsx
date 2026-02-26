"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  User,
  FileText,
  Package,
  AlertTriangle,
  X,
  History,
  ShieldCheck,
  Zap,
  Clock,
  Briefcase
} from "lucide-react";
import Link from "next/link";
import { getAssignmentById } from "@/lib/actions/sampling";
import { deleteJobOrderWithPhotos } from "@/lib/actions/jobs";
import { cn } from "@/lib/utils";
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { ChemicalLoader, LoadingOverlay, LoadingButton } from "@/components/ui";

export default function AdminSamplingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePhotoModalOpen, setDeletePhotoModalOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    loadAssignment();
  }, [params.id]);

  async function loadAssignment() {
    try {
      const data = await getAssignmentById(params.id as string);
      setAssignment(data);
    } catch (error) {
      console.error('Failed to load assignment:', error);
      toast.error("Gagal memuat data sampling");
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteJobOrder = async () => {
    if (!assignment) return;
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteJobOrder = async () => {
    if (!assignment) return;
    
    setDeleting(true);
    setIsProcessing(true);
    try {
      const result = await deleteJobOrderWithPhotos(assignment.job_order_id);
      
      if (result.error) throw new Error(result.error);
      
      toast.success('Job Order dan dokumentasi berhasil dihapus');
      setIsDeleteModalOpen(false);
      router.push('/admin/sampling');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Gagal menghapus Job Order');
    } finally {
      setDeleting(false);
      setIsProcessing(false);
    }
  };

  const handleDeletePhoto = async (photoUrl: string, photoName: string) => {
    setPhotoToDelete({ url: photoUrl, name: photoName });
    setDeletePhotoModalOpen(true);
  };

  const confirmDeletePhoto = async () => {
    if (!photoToDelete || !assignment) return;

    setIsProcessing(true);
    try {
      const supabase = createClient();
      const fileName = photoToDelete.url.split('/').pop()?.split('?')[0];
      
      // Delete from storage
      if (fileName) {
        await supabase.storage
          .from('sampling-photos')
          .remove([fileName]);
      }
      
      // Delete from database
      const existingPhotos = assignment.photos || [];
      const updatedPhotos = existingPhotos.filter((p: { url: string; name: string } | string) => {
        const url = typeof p === 'string' ? p : p.url;
        return url !== photoToDelete.url;
      });
      
      // Update UI immediately
      setAssignment({
        ...assignment,
        photos: updatedPhotos
      });
      
      // Save to database in background
      const { saveSamplingPhotosWithNames } = await import('@/lib/actions/sampling');
      await saveSamplingPhotosWithNames(params.id as string, updatedPhotos as { url: string; name: string }[]);
      
      toast.success('Foto berhasil dihapus');
      setDeletePhotoModalOpen(false);
      setPhotoToDelete(null);
    } catch (error) {
      console.error('Delete photo error:', error);
      toast.error('Gagal menghapus foto');
      loadAssignment();
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <ChemicalLoader />
        <p className="mt-4 text-emerald-800 font-bold uppercase tracking-widest text-[10px] animate-pulse">Memuat Data Sampling...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <Card className="rounded-[2rem] border-none shadow-2xl">
          <CardContent className="py-20 text-center">
            <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-slate-300" />
            </div>
            <h2 className="text-2xl font-black text-slate-600 uppercase tracking-tight">Data Tidak Ditemukan</h2>
            <p className="text-slate-400 mt-2 font-medium">ID Record: {params.id}</p>
            <Link href="/admin/sampling">
              <Button className="mt-8 rounded-2xl h-12 px-8 bg-slate-900 font-bold text-xs uppercase tracking-widest shadow-xl">
                Kembali ke Daftar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    in_progress: "bg-blue-100 text-blue-700 border-blue-200",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-100 text-red-700 border-red-200"
  };

  const statusLabels: Record<string, string> = {
    pending: "Menunggu",
    in_progress: "Dalam Proses",
    completed: "Selesai",
    cancelled: "Dibatalkan"
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10">
      <LoadingOverlay isOpen={isProcessing} title="Memproses..." description="Mohon tunggu sebentar, sistem sedang memproses permintaan Anda" />
      
      {/* Header */}
      <div className="relative">
        <Link 
          href="/admin/sampling" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-all mb-8 text-xs font-black uppercase tracking-widest group"
        >
          <div className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center group-hover:border-emerald-200 group-hover:bg-emerald-50">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <span>KEMBALI KE SAMPLING</span>
        </Link>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-600/20 transform -rotate-3">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-emerald-900 tracking-tight flex items-center gap-3">
                    DETAIL SAMPLING
                </h1>
                <div className="flex items-center gap-3 mt-1">
                    <Badge className={cn(
                        "text-[10px] h-6 px-4 font-black uppercase tracking-[0.1em] border-2", 
                        statusColors[assignment.status] || statusColors.pending
                    )}>
                        {statusLabels[assignment.status] || assignment.status}
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID Record: {assignment.id.split('-')[0]}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="destructive"
              onClick={handleDeleteJobOrder}
              disabled={deleting}
              className="rounded-2xl h-14 px-8 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-red-900/20 border-none"
            >
              <Trash2 className="h-4 w-4 mr-3" />
              HAPUS JOB ORDER
            </Button>
          </div>
        </div>
      </div>

      {/* Primary Analytics Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Location Info */}
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden group">
          <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-[10px] font-black flex items-center gap-2 text-slate-400 uppercase tracking-widest">
              <MapPin className="h-4 w-4 text-emerald-600" />
              Lokasi Sampling
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <p className="text-slate-800 font-black text-lg leading-tight tracking-tight">{assignment.location}</p>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-tighter">
                    <Clock className="h-3.5 w-3.5" /> Jadwal
                </div>
                <span className="font-black text-slate-700">
                  {new Date(assignment.scheduled_date).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </span>
              </div>
              {assignment.actual_date && (
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase tracking-tighter">
                      <Zap className="h-3.5 w-3.5" /> Aktual
                  </div>
                  <span className="font-black text-emerald-600">
                    {new Date(assignment.actual_date).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Trace */}
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-[10px] font-black flex items-center gap-2 text-slate-400 uppercase tracking-widest">
              <Briefcase className="h-4 w-4 text-emerald-600" />
              Informasi Pekerjaan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between items-end border-b border-slate-100 pb-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tracking Code</p>
              <p className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                {assignment.job_order.tracking_code}
              </p>
            </div>
            <div className="flex justify-between items-end border-b border-slate-100 pb-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Layanan</p>
              <p className="text-xs font-black text-slate-800 text-right truncate max-w-[150px]">
                {assignment.job_order.quotation.items?.[0]?.service?.name || 
                 assignment.job_order.quotation.items?.[0]?.equipment?.name || 'MULTIPLE SERVICES'}
              </p>
            </div>
            <div className="flex justify-between items-end">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Klien</p>
              <p className="text-xs font-black text-slate-800 text-right">
                {assignment.job_order.quotation.profile?.company_name || 
                 assignment.job_order.quotation.profile?.full_name || 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Resource Info */}
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-[10px] font-black flex items-center gap-2 text-slate-400 uppercase tracking-widest">
              <User className="h-4 w-4 text-emerald-600" />
              Personel
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 bg-emerald-50/50 p-4 rounded-[1.5rem] border border-emerald-100">
              <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-900/20">
                {assignment.field_officer?.full_name?.charAt(0).toUpperCase() || 'F'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-800 text-sm tracking-tight truncate uppercase">
                  {assignment.field_officer?.full_name || 'N/A'}
                </p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  Field Officer
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2">
                <History className="h-3 w-3" /> Data Penugasan Terverifikasi
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Documentation */}
      <Card className="rounded-[3rem] border-none shadow-2xl overflow-hidden">
        <CardHeader className="pb-6 bg-slate-900 text-white border-b border-slate-800 p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                <ImageIcon className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-black uppercase tracking-tight">
                  DOKUMENTASI FOTO
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                        {assignment.photos?.length || 0} FOTO TERUPLOAD
                    </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 bg-white">
          {assignment.photos && assignment.photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {assignment.photos.map((photo: { url: string; name: string } | string, idx: number) => {
                const photoUrl = typeof photo === 'string' ? photo : photo.url;
                const photoName = typeof photo === 'string' ? `FOTO_${idx + 1}` : (photo.name || `FOTO_${idx + 1}`);
                
                return (
                  <div key={idx} className="group relative">
                    <div className="relative aspect-square rounded-[2rem] overflow-hidden border-2 border-slate-100 shadow-sm group-hover:shadow-2xl group-hover:border-emerald-500 transition-all duration-500 mb-3 bg-slate-50 cursor-pointer">
                      <img 
                        src={photoUrl} 
                        alt={photoName} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      
                      {/* Control Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-4">
                        <div className="flex items-center justify-between gap-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                          <Button
                            asChild
                            variant="secondary"
                            size="icon"
                            className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 text-white hover:bg-white/40 shadow-xl"
                          >
                            <a href={photoUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            onClick={() => handleDeletePhoto(photoUrl, photoName)}
                            variant="destructive"
                            size="icon"
                            className="h-10 w-10 rounded-xl bg-red-600 shadow-xl"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-slate-500 text-center uppercase tracking-widest truncate px-2" title={photoName}>
                      {photoName}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-24 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <div className="h-20 w-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-100">
                <ImageIcon className="h-10 w-10 text-slate-300" />
              </div>
              <p className="text-slate-500 font-black uppercase tracking-widest text-sm">BELUM ADA FOTO</p>
              <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-tight">
                FIELD OFFICER BELUM MENGUNGGAH FOTO DOKUMENTASI
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md p-0 border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <div className="bg-red-600 p-8 text-white text-center">
            <div className="mx-auto h-20 w-20 rounded-3xl bg-white/20 border border-white/20 flex items-center justify-center mb-4">
              <AlertTriangle className="h-10 w-10 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">HAPUS DATA</DialogTitle>
            <DialogDescription className="text-red-100 text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80">
              TINDAKAN INI TIDAK DAPAT DIBATALKAN
            </DialogDescription>
          </div>

          <div className="p-8 space-y-6 bg-white">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-900">
                  <p className="font-black uppercase tracking-wider mb-2">DATA YANG AKAN DIHAPUS:</p>
                  <ul className="space-y-2 font-bold uppercase tracking-tight opacity-80">
                    <li className="flex items-center gap-2">• JOB ORDER: {assignment?.job_order.tracking_code}</li>
                    <li className="flex items-center gap-2">• DOKUMENTASI: {assignment?.photos?.length || 0} FOTO</li>
                    <li className="flex items-center gap-2">• DATA SAMPLING TERKAIT</li>
                  </ul>
                </div>
              </div>
            </div>

            <p className="text-[9px] font-black text-center text-slate-400 uppercase tracking-widest">
              SEMUA DATA AKAN DIHAPUS SECARA PERMANEN DARI SISTEM
            </p>

            <DialogFooter className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
                className="flex-1 rounded-2xl h-12 font-black text-[10px] uppercase text-slate-400"
              >
                BATAL
              </Button>
              <LoadingButton
                variant="destructive"
                onClick={confirmDeleteJobOrder}
                loading={deleting}
                className="flex-1 rounded-2xl h-12 font-black text-[10px] uppercase shadow-lg shadow-red-900/20"
              >
                YA, HAPUS
              </LoadingButton>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Photo Confirmation Modal */}
      <Dialog open={deletePhotoModalOpen} onOpenChange={setDeletePhotoModalOpen}>
        <DialogContent className="sm:max-w-md p-0 border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
            <div className="bg-amber-500 p-8 text-white text-center">
                <div className="mx-auto h-20 w-20 rounded-3xl bg-white/20 border border-white/20 flex items-center justify-center mb-4">
                    <Trash2 className="h-10 w-10 text-white" />
                </div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">HAPUS FOTO</DialogTitle>
                <DialogDescription className="text-amber-50 text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80">KONFIRMASI PENGHAPUSAN FOTO</DialogDescription>
            </div>
            
            <div className="p-8 bg-white space-y-6">
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                    <div className="flex items-start gap-4">
                        <Trash2 className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-900">
                            <p className="font-black uppercase tracking-wider mb-1">FOTO TERIDENTIFIKASI:</p>
                            <p className="font-bold">
                                {photoToDelete?.name || 'FOTO_SAMPLING'}
                            </p>
                        </div>
                    </div>
                </div>

                <p className="text-[9px] font-black text-center text-slate-400 uppercase tracking-widest">
                    FOTO AKAN DIHAPUS DARI CLOUD STORAGE
                </p>

                <DialogFooter className="flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => setDeletePhotoModalOpen(false)}
                        className="flex-1 rounded-2xl h-12 font-black text-[10px] uppercase text-slate-400"
                    >
                        BATAL
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={confirmDeletePhoto}
                        className="flex-1 rounded-2xl h-12 font-black text-[10px] uppercase bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-900/20"
                    >
                        YA, HAPUS
                    </Button>
                </DialogFooter>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
