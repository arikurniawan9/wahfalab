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
  X
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

export default function AdminSamplingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  
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
      toast.error("Gagal memuat data assignment");
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
    try {
      const result = await deleteJobOrderWithPhotos(assignment.job_order_id);
      
      if (result.error) throw new Error(result.error);
      
      toast.success('Job Order dan foto dokumentasi berhasil dihapus');
      setIsDeleteModalOpen(false);
      router.push('/admin/sampling');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Gagal menghapus Job Order');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeletePhoto = async (photoUrl: string, photoName: string) => {
    setPhotoToDelete({ url: photoUrl, name: photoName });
    setDeletePhotoModalOpen(true);
  };

  const confirmDeletePhoto = async () => {
    if (!photoToDelete || !assignment) return;

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
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24" />
          <div className="h-8 w-64" />
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-slate-600">Assignment tidak ditemukan</h2>
            <Link href="/admin/sampling">
              <Button className="mt-4">Kembali</Button>
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
    in_progress: "Sedang Dilaksanakan",
    completed: "Selesai",
    cancelled: "Dibatalkan"
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/admin/sampling" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors mb-4 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Sampling</span>
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-emerald-900 uppercase">
                Detail Sampling
              </h1>
              <Badge className={cn(
                "text-[10px] h-6 px-3 font-bold uppercase tracking-wide", 
                statusColors[assignment.status] || statusColors.pending
              )}>
                {statusLabels[assignment.status] || assignment.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Package className="h-4 w-4" />
              <span className="font-mono">{assignment.job_order.tracking_code}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleDeleteJobOrder}
              disabled={deleting}
              className="shadow-sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Menghapus...' : 'Hapus Job Order'}
            </Button>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {/* Location Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
              <MapPin className="h-4 w-4 text-emerald-600" />
              Lokasi Sampling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-800 font-medium leading-relaxed">{assignment.location}</p>
            <div className="pt-2 border-t border-slate-100 mt-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span className="text-slate-600">Rencana:</span>
                <span className="font-medium">
                  {new Date(assignment.scheduled_date).toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
              {assignment.actual_date && (
                <div className="flex items-center gap-2 text-sm mt-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-slate-600">Aktual:</span>
                  <span className="font-medium text-emerald-600">
                    {new Date(assignment.actual_date).toLocaleDateString('id-ID', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Job Order Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
              <FileText className="h-4 w-4 text-emerald-600" />
              Job Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Tracking Code</p>
              <p className="font-mono text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">
                {assignment.job_order.tracking_code}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Layanan</p>
              <p className="text-sm font-medium text-slate-800">
                {assignment.job_order.quotation.items?.[0]?.service?.name || 
                 assignment.job_order.quotation.items?.[0]?.equipment?.name || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Customer</p>
              <p className="text-sm font-medium text-slate-800">
                {assignment.job_order.quotation.profile?.full_name || 
                 assignment.job_order.quotation.profile?.company_name || 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Field Officer Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
              <User className="h-4 w-4 text-emerald-600" />
              Petugas Lapangan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {assignment.field_officer?.full_name?.charAt(0).toUpperCase() || 'F'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">
                  {assignment.field_officer?.full_name || 'N/A'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {assignment.field_officer?.email || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Photo Documentation */}
      <Card className="border-emerald-200/50 shadow-md">
        <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-emerald-900">
                  Bukti Dokumentasi Foto
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  {assignment.photos?.length || 0} foto terupload
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {assignment.photos && assignment.photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {assignment.photos.map((photo: { url: string; name: string } | string, idx: number) => {
                const photoUrl = typeof photo === 'string' ? photo : photo.url;
                const photoName = typeof photo === 'string' ? `Foto ${idx + 1}` : (photo.name || `Foto ${idx + 1}`);
                
                return (
                  <div key={idx} className="group relative">
                    <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-200 shadow-sm group-hover:shadow-lg group-hover:border-emerald-400 transition-all duration-300 mb-2 bg-slate-50">
                      <img 
                        src={photoUrl} 
                        alt={photoName} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                      
                      {/* Overlay with actions */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between gap-2">
                          <a
                            href={photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 w-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                            title="Buka foto"
                          >
                            <ExternalLink className="h-4 w-4 text-slate-700" />
                          </a>
                          <button
                            onClick={() => handleDeletePhoto(photoUrl, photoName)}
                            className="h-8 w-8 bg-red-500/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                            title="Hapus foto"
                          >
                            <Trash2 className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-slate-700 text-center truncate px-1" title={photoName}>
                      {photoName}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm font-medium">Belum ada foto dokumentasi</p>
              <p className="text-slate-400 text-xs mt-1">
                Petugas lapangan belum mengupload foto
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Job Order Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col gap-4">
            {/* Icon */}
            <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>

            {/* Header */}
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-bold text-red-600">
                Hapus Job Order?
              </DialogTitle>
              <DialogDescription className="text-center text-sm">
                Tindakan ini tidak dapat dibatalkan
              </DialogDescription>
            </DialogHeader>

            {/* Content */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-900">
                  <p className="font-semibold mb-1">Yang akan dihapus:</p>
                  <ul className="list-disc list-inside space-y-1 text-red-700">
                    <li>Job Order {assignment?.job_order.tracking_code}</li>
                    <li>{assignment?.photos?.length || 0} foto dokumentasi</li>
                    <li>Data sampling assignment</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Warning */}
            <p className="text-xs text-center text-slate-600">
              Semua foto akan dihapus dari penyimpanan secara permanen
            </p>

            {/* Actions */}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteJobOrder}
                disabled={deleting}
                className="flex-1"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Ya, Hapus
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Photo Confirmation Modal */}
      <Dialog open={deletePhotoModalOpen} onOpenChange={setDeletePhotoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col gap-4">
            {/* Icon */}
            <div className="mx-auto h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
              <Trash2 className="h-8 w-8 text-amber-600" />
            </div>

            {/* Header */}
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-bold text-amber-600">
                Hapus Foto?
              </DialogTitle>
            </DialogHeader>

            {/* Content */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Trash2 className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold mb-1">Foto yang akan dihapus:</p>
                  <p className="text-amber-700 font-medium">
                    {photoToDelete?.name || 'Foto'}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <p className="text-xs text-center text-slate-600">
              Foto akan dihapus dari penyimpanan secara permanen
            </p>

            {/* Actions */}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setDeletePhotoModalOpen(false)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeletePhoto}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Ya, Hapus
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
