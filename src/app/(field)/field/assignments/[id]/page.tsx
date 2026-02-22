"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Play,
  Pause,
  Upload,
  Image as ImageIcon,
  FileText,
  User,
  Download,
  Package,
  Building,
  Receipt,
  Trash2,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { getAssignmentById, updateSamplingStatus, saveSamplingPhotosWithNames } from "@/lib/actions/sampling";
import { getTravelOrderByAssignmentId } from "@/lib/actions/travel-order";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { pdf } from "@react-pdf/renderer";
import { TravelOrderPDF } from "@/components/pdf/TravelOrderPDF";
import { TravelOrderAttachment } from "@/components/pdf/TravelOrderAttachment";

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [assignment, setAssignment] = useState<any>(null);
  const [travelOrder, setTravelOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<{ url: string; name: string }[]>([]);
  const [photoNames, setPhotoNames] = useState<Record<string, string>>({});
  const supabase = createClient();

  useEffect(() => {
    async function loadAssignment() {
      try {
        const [assignmentData, travelOrderData] = await Promise.all([
          getAssignmentById(params.id as string),
          getTravelOrderByAssignmentId(params.id as string)
        ]);
        setAssignment(assignmentData);
        setTravelOrder(travelOrderData);
        
        // Pre-populate notes if exists
        if (assignmentData?.notes) {
          setNotes(assignmentData.notes);
        }
      } catch (error) {
        console.error('Failed to load assignment:', error);
        toast.error("Gagal memuat data assignment");
      } finally {
        setLoading(false);
      }
    }
    loadAssignment();
  }, [params.id]);

  const handleDownloadPdf = async () => {
    if (!travelOrder) return;

    try {
      // Prepare data with null checks
      const fieldOfficer = travelOrder.assignment?.field_officer || {};
      const jobOrder = travelOrder.assignment?.job_order || {};
      const quotation = jobOrder.quotation || {};
      const profile = quotation.profile || {};
      const items = quotation.items || [];

      // Default company profile
      const companyProfile = {
        company_name: 'WahfaLab',
        address: null,
        phone: null,
        email: null,
        logo_url: '/logo-wahfalab.png',
        tagline: null,
        npwp: null
      };

      // Create main PDF document
      const mainPdfDoc = (
        <TravelOrderPDF
          data={{
            document_number: travelOrder.document_number,
            departure_date: travelOrder.departure_date,
            return_date: travelOrder.return_date,
            destination: travelOrder.destination,
            purpose: travelOrder.purpose,
            transportation_type: travelOrder.transportation_type,
            accommodation_type: travelOrder.accommodation_type,
            daily_allowance: travelOrder.daily_allowance,
            total_budget: travelOrder.total_budget,
            notes: travelOrder.notes,
            assignment: {
              field_officer: {
                full_name: fieldOfficer.full_name,
                email: fieldOfficer.email
              },
              job_order: {
                tracking_code: jobOrder.tracking_code,
                quotation: {
                  quotation_number: quotation.quotation_number,
                  total_amount: quotation.total_amount,
                  profile: {
                    full_name: profile.full_name,
                    company_name: profile.company_name
                  }
                }
              }
            },
            created_at: travelOrder.created_at,
          }}
          company={companyProfile}
        />
      );

      // Create attachment PDF document
      const attachmentPdfDoc = (
        <TravelOrderAttachment
          data={{
            document_number: travelOrder.document_number,
            departure_date: travelOrder.departure_date,
            return_date: travelOrder.return_date,
            destination: travelOrder.destination,
            purpose: travelOrder.purpose,
            transportation_type: travelOrder.transportation_type,
            accommodation_type: travelOrder.accommodation_type,
            daily_allowance: travelOrder.daily_allowance,
            total_budget: travelOrder.total_budget,
            notes: travelOrder.notes,
            assignment: {
              field_officer: {
                full_name: fieldOfficer.full_name,
                email: fieldOfficer.email
              },
              job_order: {
                tracking_code: jobOrder.tracking_code,
                quotation: {
                  quotation_number: quotation.quotation_number,
                  total_amount: quotation.total_amount,
                  profile: {
                    full_name: profile.full_name,
                    company_name: profile.company_name
                  },
                  items: items
                }
              }
            },
            created_at: travelOrder.created_at,
          }}
          company={companyProfile}
        />
      );

      // Generate and download PDFs
      const mainBlob = await pdf(mainPdfDoc).toBlob();
      const attachmentBlob = await pdf(attachmentPdfDoc).toBlob();

      // Download main PDF
      const url = URL.createObjectURL(mainBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Surat_Tugas-${travelOrder.document_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Download attachment
      const attachmentUrl = URL.createObjectURL(attachmentBlob);
      const attachmentLink = document.createElement('a');
      attachmentLink.href = attachmentUrl;
      attachmentLink.download = `Lampiran-${travelOrder.document_number}.pdf`;
      document.body.appendChild(attachmentLink);
      attachmentLink.click();
      document.body.removeChild(attachmentLink);
      URL.revokeObjectURL(attachmentUrl);

      toast.success("✅ Surat tugas & lampiran berhasil diunduh");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("Gagal membuat PDF");
    }
  };

  const handleStatusUpdate = (status: string) => {
    startTransition(async () => {
      const result = await updateSamplingStatus(params.id as string, status, notes);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Status berhasil diubah ke ${status}`);
        router.push("/field");
        router.refresh();
      }
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadPromises = Array.from(files).map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${params.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('sampling-photos')
        .upload(fileName, file);

      if (error) {
        toast.error(`Gagal upload foto: ${error.message}`);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('sampling-photos')
        .getPublicUrl(fileName);

      return {
        url: publicUrl,
        name: file.name.replace(/\.[^/.]+$/, '') // Remove extension
      };
    });

    const results = (await Promise.all(uploadPromises)).filter(Boolean) as { url: string; name: string }[];
    
    if (results.length > 0) {
      setPhotos([...photos, ...results]);
      
      // Initialize photo names
      const newNames: Record<string, string> = {};
      results.forEach((photo, idx) => {
        newNames[photo.url] = `Foto ${photos.length + idx + 1}`;
      });
      setPhotoNames({ ...photoNames, ...newNames });
      
      toast.success(`${results.length} foto berhasil diupload`);
    }
  };

  const handlePhotoNameChange = (url: string, newName: string) => {
    setPhotoNames(prev => ({
      ...prev,
      [url]: newName
    }));
  };

  const handleSavePhotoNames = async () => {
    try {
      // Combine existing photos from DB with new photos
      const existingPhotos = assignment.photos || [];
      const existingPhotoUrls = new Set(existingPhotos.map((p: { url: string; name: string } | string) => 
        typeof p === 'string' ? p : p.url
      ));
      
      // Filter out photos that are already saved
      const newPhotos = photos.filter(p => !existingPhotoUrls.has(p.url));
      
      // Merge: existing photos + new photos with names
      const allPhotos = [
        ...existingPhotos,
        ...newPhotos.map(p => ({
          url: p.url,
          name: photoNames[p.url] || p.name
        }))
      ];
      
      // Remove duplicates based on URL
      const uniquePhotos = allPhotos.filter(
        (photo, index, self) => 
          index === self.findIndex(p => {
            const pUrl = typeof p === 'string' ? p : p.url;
            const photoUrl = typeof photo === 'string' ? photo : photo.url;
            return pUrl === photoUrl;
          })
      );
      
      // Call server action
      const result = await saveSamplingPhotosWithNames(params.id as string, uniquePhotos);
      
      if (result.error) throw new Error(result.error);
      
      // Update UI immediately - optimistic update
      setAssignment({
        ...assignment,
        photos: uniquePhotos
      });
      
      // Clear local state after successful save
      setPhotos([]);
      setPhotoNames({});
      
      toast.success('Nama foto berhasil disimpan');
    } catch (error) {
      console.error('Save photo names error:', error);
      toast.error('Gagal menyimpan nama foto');
    }
  };

  const handleDeletePhoto = async (photoUrl: string, photoName: string) => {
    // Quick confirmation
    if (!confirm(`Hapus foto "${photoName}"?`)) return;

    try {
      // Remove from local state first (optimistic update)
      setPhotos(prev => prev.filter(p => p.url !== photoUrl));
      
      // Also delete from Supabase Storage
      const supabase = createClient();
      const fileName = photoUrl.split('/').pop()?.split('?')[0];
      
      if (fileName) {
        await supabase.storage
          .from('sampling-photos')
          .remove([fileName]);
      }
      
      toast.success('Foto berhasil dihapus');
    } catch (error) {
      console.error('Delete photo error:', error);
      toast.error('Gagal menghapus foto');
    }
  };

  const handleDeleteSavedPhoto = async (photoUrl: string, photoName: string) => {
    if (!confirm(`Hapus foto "${photoName}" secara permanen?`)) return;

    try {
      const supabase = createClient();
      const fileName = photoUrl.split('/').pop()?.split('?')[0];
      
      // Delete from storage
      if (fileName) {
        await supabase.storage
          .from('sampling-photos')
          .remove([fileName]);
      }
      
      // Delete from database - optimistic update
      const existingPhotos = assignment.photos || [];
      const updatedPhotos = existingPhotos.filter((p: { url: string; name: string } | string) => {
        const url = typeof p === 'string' ? p : p.url;
        return url !== photoUrl;
      });
      
      // Update UI immediately
      setAssignment({
        ...assignment,
        photos: updatedPhotos
      });
      
      // Save to database in background
      await saveSamplingPhotosWithNames(params.id as string, updatedPhotos as { url: string; name: string }[]);
      
      toast.success('Foto berhasil dihapus');
    } catch (error) {
      console.error('Delete photo error:', error);
      toast.error('Gagal menghapus foto');
      // Reload only if error to sync state
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
        <Skeleton className="h-64 rounded-lg mt-6" />
        <Skeleton className="h-48 rounded-lg mt-6" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-4 md:p-8">
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Assignment tidak ditemukan</p>
            <Link href="/field">
              <Button variant="link" className="mt-2">Kembali</Button>
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/field" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors mb-4 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Dashboard</span>
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-emerald-900 font-[family-name:var(--font-montserrat)] uppercase">
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
          
          {/* Quick Info */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-xs text-slate-500">Tanggal Rencana</p>
                <p className="text-sm font-semibold text-slate-800">
                  {new Date(assignment.scheduled_date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-xs text-slate-500">Lokasi</p>
                <p className="text-sm font-semibold text-slate-800 truncate max-w-[150px]">
                  {assignment.location}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {/* Location Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
              <MapPin className="h-4 w-4 text-emerald-600" />
              Lokasi Sampling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-800 font-medium leading-relaxed">{assignment.location}</p>
            
            <div className="pt-2 border-t border-slate-100">
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
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-medium text-slate-800">
                  {assignment.job_order.quotation.profile?.full_name || 
                   assignment.job_order.quotation.profile?.company_name || 'N/A'}
                </p>
              </div>
            </div>
            
            {assignment.job_order.quotation.quotation_number && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Penawaran</p>
                <div className="flex items-center gap-1">
                  <Receipt className="h-3 w-3 text-slate-400" />
                  <p className="text-xs font-medium text-slate-600">
                    {assignment.job_order.quotation.quotation_number}
                  </p>
                </div>
              </div>
            )}
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

      {/* Travel Order Card - Full Width */}
      {travelOrder && (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-900">
              <FileText className="h-4 w-4 text-emerald-600" />
              Surat Tugas Perjalanan Dinas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Nomor Surat</p>
                <p className="font-mono text-sm font-bold text-emerald-700">{travelOrder.document_number}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Berangkat</p>
                <p className="text-sm font-medium text-slate-800">
                  {new Date(travelOrder.departure_date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Kembali</p>
                <p className="text-sm font-medium text-slate-800">
                  {new Date(travelOrder.return_date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Tujuan</p>
                <p className="text-sm font-medium text-slate-800 truncate">{travelOrder.destination}</p>
              </div>
            </div>
            
            {(travelOrder.transportation_type || travelOrder.daily_allowance) && (
              <div className="flex flex-wrap gap-4 pt-3 border-t border-emerald-200">
                {travelOrder.transportation_type && (
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Transportasi</p>
                      <p className="text-sm font-medium text-slate-800">{travelOrder.transportation_type}</p>
                    </div>
                  </div>
                )}
                {travelOrder.daily_allowance && (
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Uang Harian</p>
                      <p className="text-sm font-bold text-emerald-600">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0
                        }).format(travelOrder.daily_allowance)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-2 mt-4 pt-4 border-t border-emerald-200">
              <Link href={`/field/travel-orders/${travelOrder.id}/preview`} target="_blank" className="flex-1 md:flex-none">
                <Button variant="outline" size="sm" className="w-full">
                  <FileText className="h-3 w-3 mr-2" />
                  Preview
                </Button>
              </Link>
              <Button
                variant="default"
                size="sm"
                className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700"
                onClick={handleDownloadPdf}
                disabled={!travelOrder}
              >
                <Download className="h-3 w-3 mr-2" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Documentation */}
      <Card className="mb-6 border-emerald-200/50 shadow-md">
        <CardHeader className="pb-3 bg-gradient-to-r from-emerald-50 to-white border-b border-emerald-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-emerald-900">
                  Dokumentasi Foto
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  {assignment.photos?.length || 0} foto tersimpan • {photos.length} foto baru
                </p>
              </div>
            </div>
            {photos.length > 0 && (
              <Button
                size="sm"
                onClick={handleSavePhotoNames}
                className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 shadow-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Simpan Nama
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Existing Photos */}
          {(assignment.photos?.length || 0) > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></div>
                  Foto Tersimpan
                </Label>
                <Badge variant="secondary" className="text-xs">
                  {assignment.photos?.length || 0} foto
                </Badge>
              </div>
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
                              onClick={() => handleDeleteSavedPhoto(photoUrl, photoName)}
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
            </div>
          )}

          {/* New Photos to Upload */}
          {photos.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                  Foto Baru (Belum Disimpan)
                </Label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {photos.length} foto
                  </Badge>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm('Hapus semua foto yang belum disimpan?')) {
                        setPhotos([]);
                        setPhotoNames({});
                      }
                    }}
                    className="h-7 text-[10px] px-2"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Hapus Semua
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {photos.map((photo, idx) => (
                  <div key={photo.url} className="group relative">
                    <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-amber-300 shadow-sm group-hover:shadow-lg group-hover:border-amber-400 transition-all duration-300 mb-2 bg-amber-50/30">
                      <img 
                        src={photo.url} 
                        alt={photoNames[photo.url] || photo.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Badge className="bg-amber-500 text-white text-[10px] h-5 px-1.5 shadow-lg">
                          Baru
                        </Badge>
                        <button
                          onClick={() => handleDeletePhoto(photo.url, photoNames[photo.url] || photo.name)}
                          className="h-6 w-6 bg-red-500/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                          title="Hapus foto"
                        >
                          <Trash2 className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={photoNames[photo.url] || photo.name}
                        onChange={(e) => handlePhotoNameChange(photo.url, e.target.value)}
                        className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="Nama foto..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Area */}
          {assignment.status !== 'completed' && assignment.status !== 'cancelled' && (
            <div className="border-t border-emerald-100 pt-5 mt-5">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Upload className="h-4 w-4 text-emerald-600" />
                  Upload Foto Baru
                </Label>
                <Badge variant="secondary" className="text-xs bg-slate-100">
                  Max 5MB per file
                </Badge>
              </div>
              
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              
              <label htmlFor="photo-upload">
                <div className="border-2 border-dashed border-emerald-200 rounded-xl p-6 text-center hover:border-emerald-400 hover:bg-emerald-50/50 transition-all cursor-pointer group">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        Klik untuk upload foto
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        JPG, PNG, WEBP • Multiple files
                      </p>
                    </div>
                  </div>
                </div>
              </label>
              
              {photos.length > 0 && (
                <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm">💡</span>
                    </div>
                    <div>
                      <p className="text-xs text-amber-900 font-medium">
                        Beri nama untuk setiap foto
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Setelah upload, beri nama yang deskriptif untuk setiap foto, lalu klik tombol <strong>"Simpan Nama"</strong> di atas.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Empty State */}
          {!assignment.photos?.length && photos.length === 0 && (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm font-medium">Belum ada foto dokumentasi</p>
              <p className="text-slate-400 text-xs mt-1">Upload foto untuk mendokumentasikan sampling</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes & Actions */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-700">
            Catatan Sampling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-slate-500 mb-2 block">Catatan Assignment</Label>
            {assignment.notes ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{assignment.notes}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Tidak ada catatan</p>
            )}
          </div>

          {assignment.status !== 'completed' && assignment.status !== 'cancelled' && (
            <div>
              <Label htmlFor="notes" className="text-xs text-slate-500 mb-2 block">
                Tambah / Update Catatan
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan pengambilan sampel, kondisi lokasi, dll..."
                className="min-h-[100px] resize-none"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            {assignment.status === 'pending' && (
              <Button
                onClick={() => handleStatusUpdate('in_progress')}
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
              >
                <Play className="h-4 w-4 mr-2" />
                Mulai Sampling
              </Button>
            )}
            {assignment.status === 'in_progress' && (
              <>
                <Button
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Selesai Sampling
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('pending')}
                  disabled={isPending}
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Tunda
                </Button>
              </>
            )}
            <Button 
              variant="outline" 
              onClick={() => router.push('/field')}
              className="flex-1 sm:flex-none"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </div>
          
          {assignment.status === 'completed' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">Sampling telah selesai dilaksanakan</p>
              </div>
            </div>
          )}
          
          {assignment.status === 'cancelled' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <Pause className="h-5 w-5" />
                <p className="text-sm font-medium">Sampling telah dibatalkan</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
