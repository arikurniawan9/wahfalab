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
  ExternalLink,
  Car
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
              assistants: travelOrder.assignment?.assistants ? travelOrder.assignment.assistants.map((ast: any) => ({
                full_name: ast.full_name,
                email: ast.email
              })) : [],
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
              assistants: travelOrder.assignment?.assistants ? travelOrder.assignment.assistants.map((ast: any) => ({
                full_name: ast.full_name,
                email: ast.email
              })) : [],
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

  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);

  const handleStatusUpdate = (status: string) => {
    startTransition(async () => {
      const result = await updateSamplingStatus(params.id as string, status, notes);
      if (result.error) {
        toast.error(result.error);
      } else {
        // User-friendly notification messages
        const statusMessages: Record<string, string> = {
          in_progress: "🚀 Sampling dimulai! Petugas sedang melaksanakan tugas.",
          completed: "✅ Sampling selesai! Invoice telah dibuat otomatis.",
          pending: "⏸️ Sampling ditunda. Status dikembalikan ke menunggu.",
          cancelled: "❌ Sampling dibatalkan."
        };

        toast.success(
          statusMessages[status] || `Status berhasil diubah ke ${status}`
        );

        // If completed and invoice was generated, store it and show link
        if (status === 'completed' && result.invoice) {
          setGeneratedInvoice(result.invoice);
          toast.success(
            `📄 Invoice ${result.invoice.invoice_number} telah dibuat`,
            {
              description: "Invoice dapat diunduh dan dikirim ke customer",
              duration: 5000,
            }
          );
        }

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
    <div className="bg-slate-50 min-h-screen pb-32">
      {/* Sticky Glassmorphism Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4 md:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/field" 
              className="h-10 w-10 bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-full flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-emerald-900 uppercase tracking-tight">
                  Detail Penugasan
                </h1>
                <Badge className={cn(
                  "text-[10px] h-6 px-3 font-bold uppercase tracking-widest rounded-full", 
                  statusColors[assignment.status] || statusColors.pending
                )}>
                  {statusLabels[assignment.status] || assignment.status}
                </Badge>
              </div>
              <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-1">
                <Package className="h-3 w-3" />
                {assignment.job_order.tracking_code}
              </p>
            </div>
          </div>
          
          {/* Quick Info Badges */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[11px] font-bold text-slate-700">
                {new Date(assignment.scheduled_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Info Cards Grid */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        {/* Location Card */}
        <Card className="rounded-2xl border-none shadow-md overflow-hidden">
          <div className="bg-emerald-600 h-2 w-full"></div>
          <CardHeader className="pb-2 bg-white">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-emerald-500" />
              Lokasi Sampling
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <p className="text-slate-800 font-bold text-sm leading-relaxed">{assignment.location}</p>
            
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Rencana:</span>
                <span className="font-bold text-slate-700">
                  {new Date(assignment.scheduled_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              {assignment.actual_date && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500"/> Aktual:</span>
                  <span className="font-black text-emerald-600">
                    {new Date(assignment.actual_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Job Order Card */}
        <Card className="rounded-2xl border-none shadow-md overflow-hidden">
          <div className="bg-blue-600 h-2 w-full"></div>
          <CardHeader className="pb-2 bg-white">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-400">
              <FileText className="h-3.5 w-3.5 text-blue-500" />
              Informasi Order
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white space-y-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Customer / Klien</p>
              <p className="text-sm font-black text-slate-800">
                {assignment.job_order.quotation.profile?.company_name || assignment.job_order.quotation.profile?.full_name || 'N/A'}
              </p>
              {assignment.job_order.quotation.profile?.company_name && (
                <p className="text-xs font-medium text-slate-500 mt-0.5">{assignment.job_order.quotation.profile?.full_name}</p>
              )}
            </div>
            
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded bg-blue-50 flex items-center justify-center shrink-0 mt-0.5"><Package className="h-3 w-3 text-blue-600"/></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Layanan Utama</p>
                <p className="text-xs font-bold text-slate-700 line-clamp-2">
                  {assignment.job_order.quotation.items?.[0]?.service?.name || 'Multi Layanan'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Field Officer Card */}
        <Card className="rounded-2xl border-none shadow-md overflow-hidden">
          <div className="bg-amber-500 h-2 w-full"></div>
          <CardHeader className="pb-2 bg-white">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-400">
              <User className="h-3.5 w-3.5 text-amber-500" />
              Petugas Lapangan
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white h-full pb-6 pt-2">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-black text-lg shadow-inner border-2 border-amber-50">
                  {assignment.field_officer?.full_name?.charAt(0).toUpperCase() || 'F'}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Petugas Utama</p>
                  <p className="font-black text-slate-800 text-sm">
                    {assignment.field_officer?.full_name || 'N/A'}
                  </p>
                </div>
              </div>

              {assignment.assistants && assignment.assistants.length > 0 && (
                <div className="flex flex-col gap-3 pt-3 border-t border-slate-50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asisten Petugas</p>
                  {assignment.assistants.map((ast: any) => (
                    <div key={ast.id} className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-base border border-slate-200 shadow-sm">
                        {ast.full_name?.charAt(0).toUpperCase() || 'A'}
                      </div>
                      <p className="font-bold text-slate-700 text-xs">
                        {ast.full_name || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Travel Order Card - Full Width */}
      {travelOrder && (
        <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-gradient-to-br from-emerald-50/50 to-white">
          <div className="bg-emerald-600/20 h-1 w-full"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-emerald-800">
              <FileText className="h-4 w-4 text-emerald-600" />
              Surat Tugas Perjalanan Dinas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 bg-white p-4 rounded-xl border border-emerald-100/50 shadow-sm">
              <div className="col-span-2 md:col-span-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Nomor Surat</p>
                <p className="font-mono text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded w-fit">{travelOrder.document_number}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Berangkat</p>
                <p className="text-sm font-black text-slate-800">
                  {new Date(travelOrder.departure_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Kembali</p>
                <p className="text-sm font-black text-slate-800">
                  {new Date(travelOrder.return_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="col-span-2 md:col-span-4 pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tujuan</p>
                <p className="text-sm font-bold text-slate-700 leading-snug">{travelOrder.destination}</p>
              </div>
            </div>
            
            {(travelOrder.transportation_type || travelOrder.daily_allowance) && (
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                {travelOrder.transportation_type && (
                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex-1">
                    <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center">
                      <Car className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Transportasi</p>
                      <p className="text-sm font-black text-slate-800">{travelOrder.transportation_type}</p>
                    </div>
                  </div>
                )}
                {travelOrder.daily_allowance && (
                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex-1">
                    <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Uang Harian</p>
                      <p className="text-sm font-black text-emerald-700">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(travelOrder.daily_allowance)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-3 mt-5 pt-5 border-t border-emerald-200/50">
              <Link href={`/field/travel-orders/${travelOrder.id}/preview`} target="_blank" className="flex-1">
                <Button variant="outline" className="w-full rounded-xl h-11 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-xs uppercase tracking-wider">
                  <FileText className="h-4 w-4 mr-2" />
                  Lihat Surat
                </Button>
              </Link>
              <Button
                variant="default"
                className="flex-1 rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/20"
                onClick={handleDownloadPdf}
                disabled={!travelOrder}
              >
                <Download className="h-4 w-4 mr-2" />
                Unduh PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Documentation */}
      <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-white">
        <CardHeader className="pb-4 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">
                  Dokumentasi Foto
                </CardTitle>
                <p className="text-[10px] font-bold text-emerald-600 mt-0.5 uppercase">
                  {assignment.photos?.length || 0} TERSIMPAN • {photos.length} BARU
                </p>
              </div>
            </div>
            {photos.length > 0 && (
              <Button
                size="sm"
                onClick={handleSavePhotoNames}
                className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Simpan Nama
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
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

      {/* Notes Section */}
      <Card className="rounded-2xl border-none shadow-md overflow-hidden bg-white mt-6 mb-24">
        <CardHeader className="pb-3 bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-700">
            <FileText className="h-4 w-4 text-slate-400" />
            Catatan Sampling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div>
            {assignment.notes ? (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed">{assignment.notes}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">Tidak ada catatan tugas.</p>
            )}
          </div>

          {assignment.status !== 'completed' && assignment.status !== 'cancelled' && (
            <div>
              <Label htmlFor="notes" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                Tambah / Update Catatan (Opsional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tuliskan kondisi lokasi, kendala, atau info penting lainnya di sini..."
                className="min-h-[120px] resize-none rounded-xl border-slate-200 focus:border-emerald-400 focus:ring-emerald-400 bg-slate-50/50"
              />
            </div>
          )}

          {assignment.status === 'completed' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-black text-emerald-900">Sampling Telah Selesai</p>
                  <p className="text-xs font-medium text-emerald-700">Terima kasih atas kerja keras Anda.</p>
                </div>
              </div>
            </div>
          )}
          
          {assignment.status === 'cancelled' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <Pause className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-sm font-black text-red-900">Penugasan Dibatalkan</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sticky Bottom Action Bar */}
      {assignment.status !== 'completed' && assignment.status !== 'cancelled' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 p-4 md:px-8 z-40 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3">
            {assignment.status === 'pending' && (
              <Button
                onClick={() => handleStatusUpdate('in_progress')}
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700 w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-900/20"
              >
                <Play className="h-5 w-5 mr-2" />
                Mulai Perjalanan & Sampling
              </Button>
            )}
            
            {assignment.status === 'in_progress' && (
              <>
                <Button
                  onClick={() => handleStatusUpdate('pending')}
                  disabled={isPending}
                  variant="outline"
                  className="sm:flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Tunda
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={isPending}
                  className="sm:flex-[3] bg-emerald-600 hover:bg-emerald-700 h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-900/20"
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Selesai & Laporkan Tugas
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
