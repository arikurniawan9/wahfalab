// ============================================================================
// PREMIUM FIELD ASSIGNMENT DETAIL - v3.2
// Optimized for mobile-first operational precision and high-end lab aesthetics.
// ============================================================================

"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, MapPin, Calendar, Clock, CheckCircle2, Play, Pause, Upload,
  Image as ImageIcon, FileText, User, Download, Package, ExternalLink,
  Car, Receipt, Info, Trash2, Camera, ShieldCheck, ChevronRight, X, Building, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { 
  getAssignmentById, 
  updateSamplingStatus, 
  saveSamplingPhotosWithNames,
  uploadSamplingPdf,
  deleteSamplingPdf,
  uploadSamplingPhotos,
  deleteSamplingPhoto
} from "@/lib/actions/sampling";
import { getTravelOrderByAssignmentId } from "@/lib/actions/travel-order";
// TODO: Implement file upload API route for sampling photos
// import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { pdf } from "@react-pdf/renderer";
import { TravelOrderPDF } from "@/components/pdf/TravelOrderPDF";
import { TravelOrderAttachment } from "@/components/pdf/TravelOrderAttachment";
import { ChemicalLoader, LoadingOverlay, PageSkeleton } from "@/components/ui";
import { PremiumPageWrapper, PremiumCard } from "@/components/layout/PremiumPageWrapper";

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any; theme: string }> = {
  pending: { label: 'Tugas Baru', color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock, theme: 'border-amber-100' },
  in_progress: { label: 'Sampling Aktif', color: 'text-blue-600', bg: 'bg-blue-50', icon: Play, theme: 'border-blue-100' },
  completed: { label: 'Selesai', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2, theme: 'border-emerald-100' },
  cancelled: { label: 'Dibatalkan', color: 'text-rose-600', bg: 'bg-rose-50', icon: X, theme: 'border-rose-100' }
};

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [assignment, setAssignment] = useState<any>(null);
  const [travelOrder, setTravelOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [storageConfig, setStorageConfig] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<{ url: string; name: string }[]>([]);
  const [photoNames, setPhotoNames] = useState<Record<string, string>>({});
  const [removedPhotoUrls, setRemovedPhotoUrls] = useState<string[]>([]);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const pdfInputRef = React.useRef<HTMLInputElement>(null);
  // TODO: Use supabase client alternative for storage - implement via API routes
  // const supabase = createClient();

  const loadData = useCallback(async () => {
    try {
      const [assignmentData, travelOrderData] = await Promise.all([
        getAssignmentById(params.id as string),
        getTravelOrderByAssignmentId(params.id as string)
      ]);
      setAssignment(assignmentData);
      setTravelOrder(travelOrderData);
      if (assignmentData?.notes) setNotes(assignmentData.notes);
    } catch (error) {
      toast.error("Gagal sinkronisasi data");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const loadStorageConfig = async () => {
      try {
        const response = await fetch("/api/company-profile", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        setStorageConfig({
          provider: data.upload_storage_provider || "supabase",
          publicPath: data.upload_storage_public_path || "",
          externalUrl: data.upload_storage_external_url || "",
          note: data.upload_storage_note || "",
        });
      } catch {
        setStorageConfig(null);
      }
    };

    loadStorageConfig();
  }, []);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error("Hanya file PDF yang diizinkan");
      return;
    }

    setUploadingPdf(true);
    try {
      const result = await uploadSamplingPdf(params.id as string, file);
      if (result.error) throw new Error(result.error);
      toast.success("Dokumen PDF berhasil diunggah");
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Gagal mengunggah PDF");
    } finally {
      setUploadingPdf(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleDeletePdf = async () => {
    if (!window.confirm("Hapus dokumen PDF ini?")) return;
    try {
      const result = await deleteSamplingPdf(params.id as string);
      if (result.error) throw new Error(result.error);
      toast.success("Dokumen PDF dihapus");
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleStatusUpdate = (status: string) => {
    startTransition(async () => {
      const result = await updateSamplingStatus(params.id as string, status, notes);
      if (result.error) toast.error(result.error);
      else {
        toast.success(`Status diperbarui: ${status.replace('_', ' ')}`);
        loadData();
      }
    });
  };

  const handleConfirmStartSampling = async () => {
    setIsStarting(true);
    try {
      const result = await updateSamplingStatus(params.id as string, "in_progress", notes);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Sampling dimulai");
      setIsStartModalOpen(false);
      loadData();
    } catch (error) {
      toast.error("Gagal memulai sampling");
    } finally {
      setIsStarting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    toast.info("Sedang mengunggah foto...");
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("files", file));

      const result = await uploadSamplingPhotos(params.id as string, formData);
      if (result.error || !result.photos) {
        throw new Error(result.error || "Gagal upload foto");
      }

      setPhotos([...photos, ...result.photos]);
      toast.success(`${result.photos.length} foto berhasil diunggah`);
    } catch (error: any) {
      toast.error(error.message || "Gagal upload foto");
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const handleRemovePhoto = (url: string) => {
    setRemovedPhotoUrls(prev => [...prev, url]);
    toast.info("Foto ditandai untuk dihapus. Klik 'Simpan Semua' untuk mempermanenkan.");
  };

  const handleSaveAllData = async () => {
    try {
      if (removedPhotoUrls.length > 0) {
        await Promise.all(removedPhotoUrls.map((url) => deleteSamplingPhoto(url)));
      }

      // Sinkronkan foto yang sudah ada dan yang baru, filter yang ditandai hapus
      const allPhotos = [...(assignment.photos || []), ...photos]
        .filter((p: any) => {
          const url = typeof p === 'string' ? p : p.url;
          return !removedPhotoUrls.includes(url);
        })
        .map((p: any) => {
          const url = typeof p === 'string' ? p : p.url;
          const name = photoNames[url] || (typeof p === 'object' ? p.name : "");
          return { url, name };
        });

      const result = await saveSamplingPhotosWithNames(params.id as string, allPhotos);
      if (result.error) throw new Error(result.error);
      
      toast.success("Dokumentasi & Foto Berhasil Diperbarui");
      setPhotos([]);
      setPhotoNames({});
      setRemovedPhotoUrls([]);
      loadData();
    } catch (e) { 
      toast.error("Gagal menyimpan data"); 
    }
  };

  if (loading) return <div className="p-8"><PageSkeleton /></div>;
  if (!assignment) return <div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest">Tugas tidak ditemukan</div>;

  const cfg = statusConfig[assignment.status] || statusConfig.pending;
  const isLocked = assignment.status === 'pending';
  const perihalPengujian = assignment.job_order?.quotation?.title || "Perihal pengujian belum diisi";
  const layananSampling = Array.from(
    new Set(
      (assignment.job_order?.quotation?.items || [])
        .map((item: any) => item?.service?.name)
        .filter(Boolean)
    )
  ) as string[];
  const storageLabel =
    storageConfig?.provider === "public"
      ? "Project / Public"
      : storageConfig?.provider === "google_drive"
        ? "Google Drive"
        : storageConfig?.provider === "google_form"
          ? "Google Form"
          : "Supabase Storage";
  const storageHint =
    storageConfig?.provider === "public"
      ? storageConfig?.publicPath || "disimpan ke folder public"
      : storageConfig?.provider === "google_drive"
        ? storageConfig?.externalUrl || "mode manual Google Drive"
        : storageConfig?.provider === "google_form"
          ? storageConfig?.externalUrl || "mode manual Google Form"
          : "storage utama sistem";
  const storageBadgeClass =
    storageConfig?.provider === "public"
      ? "bg-blue-600 text-white"
      : storageConfig?.provider === "google_drive"
        ? "bg-violet-600 text-white"
        : storageConfig?.provider === "google_form"
          ? "bg-orange-600 text-white"
          : "bg-emerald-600 text-white";
  const isExternalFormMode = storageConfig?.provider === "google_form";

  return (
    <PremiumPageWrapper className="pb-56 md:pb-40 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/50">
      {/* Header Premium (Sticky) */}
      <div className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-100 p-3 md:p-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-between gap-3 md:gap-4">
          <div className="flex items-start sm:items-center gap-3 md:gap-4 min-w-0">
            <Link href="/field">
              <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-slate-50 text-slate-400 hover:text-emerald-600 transition-all">
                <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-lg md:text-2xl font-black text-emerald-950 uppercase tracking-tight leading-none pt-1">Detail Tugas</h1>
                <Badge className={cn("font-black text-[9px] px-3 py-1 rounded-full border-none shadow-sm", cfg.bg, cfg.color)}>{cfg.label}</Badge>
              </div>
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.16em] mt-1.5 flex items-center gap-1.5 truncate">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                {assignment.job_order.tracking_code}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shrink-0">
             <div className="px-4 py-2"><p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Rencana</p><p className="text-xs font-black text-slate-700">{new Date(assignment.scheduled_date).toLocaleDateString('id-ID')}</p></div>
          </div>
        </div>
      </div>

      <div className="p-3 md:p-10 max-w-7xl mx-auto space-y-5 md:space-y-8">
        {/* Row 1: Core Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8">
          <div className="lg:col-span-8 space-y-5 md:space-y-8">
            {/* Status Alert */}
            <AnimatePresence>
              {isLocked && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 h-40 w-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                  <div className="relative z-10 flex items-start gap-4 md:gap-6">
                    <div className="h-12 w-12 md:h-16 md:w-16 rounded-2xl md:rounded-3xl bg-white/20 flex items-center justify-center border-2 border-white/20 shadow-inner shrink-0 transform rotate-3"><Info className="h-6 w-6 md:h-8 md:w-8" /></div>
                    <div>
                      <h3 className="text-base md:text-xl font-black uppercase tracking-tight leading-none mb-2">Segera Konfirmasi Tugas</h3>
                      <p className="text-blue-50/80 text-[11px] md:text-xs font-medium leading-relaxed max-w-md">Silakan klik tombol Mulai Perjalanan di bagian bawah layar untuk membuka akses pengisian foto dan catatan sampling rill.</p>
                      <Button
                        onClick={() => setIsStartModalOpen(true)}
                        className="md:hidden mt-4 h-10 px-4 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-black text-[10px] uppercase tracking-wider"
                      >
                        Konfirmasi Tugas
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Location & Client Information */}
            <PremiumCard className="border-none shadow-2xl shadow-emerald-900/5 rounded-3xl md:rounded-[2.5rem] overflow-hidden bg-white">
               <CardHeader className="bg-slate-50/50 p-5 md:p-8 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3 md:gap-4">
                     <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-emerald-100 text-emerald-600"><MapPin className="h-5 w-5 md:h-6 md:w-6" /></div>
                     <div><CardTitle className="text-lg md:text-xl font-black uppercase tracking-tight text-emerald-950 leading-none">Lokasi & Klien</CardTitle><p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase mt-1.5 tracking-widest">Informasi rute penugasan</p></div>
                  </div>
                  <Badge variant="outline" className="border-2 border-slate-100 rounded-xl px-3 md:px-4 py-1.5 font-black text-[9px] md:text-[10px] text-slate-400">TARGET: {new Date(assignment.scheduled_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</Badge>
               </CardHeader>
               <CardContent className="p-5 md:p-8 space-y-5 md:space-y-8">
                  <div className="p-4 md:p-6 bg-emerald-50/60 rounded-2xl md:rounded-[2rem] border border-emerald-100 space-y-4">
                     <div>
                        <p className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-[2px] mb-2">Perihal Pengujian</p>
                        <h3 className="text-base md:text-lg font-black leading-tight text-emerald-950">{perihalPengujian}</h3>
                     </div>
                     <div>
                        <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[2px] mb-2">Layanan Yang Akan Disampling</p>
                        {layananSampling.length === 0 ? (
                          <p className="text-xs font-bold text-slate-400 uppercase">Belum ada layanan terdaftar</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {layananSampling.map((layanan, idx) => (
                              <Badge key={`${layanan}-${idx}`} variant="outline" className="bg-white border-emerald-200 text-emerald-700 font-black text-[10px] uppercase px-3 py-1 rounded-full">
                                {layanan}
                              </Badge>
                            ))}
                          </div>
                        )}
                     </div>
                  </div>

                  <div className="p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-[2rem] border-2 border-white shadow-inner flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group">
                     <div>
                        <p className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-[2px] mb-2">Tujuan Pengambilan Sampel</p>
                        <h3 className="text-sm md:text-lg font-black leading-tight uppercase text-slate-800">{assignment.location}</h3>
                     </div>
                     <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(assignment.location)}`, '_blank')}
                        className="rounded-xl border-emerald-200 text-emerald-700 font-black text-[10px] uppercase h-10 px-4 bg-white shadow-sm hover:bg-emerald-600 hover:text-white transition-all w-full md:w-auto shrink-0"
                      >
                        <MapPin className="h-3 w-3 mr-2" /> Buka Google Maps
                      </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="flex items-center gap-4 p-5 bg-white border-2 border-slate-50 rounded-2xl hover:border-blue-100 transition-all group">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><User className="h-6 w-6" /></div>
                        <div><p className="text-[10px] font-black text-slate-400 uppercase">Kontak Klien</p><p className="font-black text-slate-800 text-sm">{assignment.job_order.quotation.profile?.full_name}</p></div>
                     </div>
                     <div className="flex items-center gap-4 p-5 bg-white border-2 border-slate-50 rounded-2xl hover:border-indigo-100 transition-all group">
                        <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><Building className="h-6 w-6" /></div>
                        <div><p className="text-[10px] font-black text-slate-400 uppercase">Perusahaan</p><p className="font-black text-slate-800 text-sm truncate max-w-[150px]">{assignment.job_order.quotation.profile?.company_name || '-'}</p></div>
                     </div>
                  </div>
               </CardContent>
            </PremiumCard>

            {/* Documentation Section (Blurred if Pending) */}
            <div className={cn("transition-all duration-700", isLocked && "opacity-40 grayscale blur-[2px] pointer-events-none")}>
               <PremiumCard className="border-none shadow-2xl shadow-emerald-900/5 rounded-3xl md:rounded-[2.5rem] overflow-hidden bg-white">
                  <CardHeader className="bg-slate-50/50 p-5 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                     <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-amber-100 text-amber-600"><Camera className="h-5 w-5 md:h-6 md:w-6" /></div>
                        <div className="space-y-1">
                          <CardTitle className="text-lg md:text-xl font-black uppercase tracking-tight text-emerald-950 leading-none">Dokumentasi</CardTitle>
                          <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase mt-1.5 tracking-widest">Bukti pengambilan sampel rill</p>
                          {storageConfig && (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <Badge className={cn("text-[8px] font-black uppercase px-2.5 py-1 rounded-full border-none", storageBadgeClass)}>
                                Penyimpanan: {storageLabel}
                              </Badge>
                              <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wider">{storageHint}</span>
                            </div>
                          )}
                          {isExternalFormMode && (
                            <div className="mt-3 rounded-2xl border border-orange-100 bg-orange-50 p-3 space-y-2">
                              <p className="text-[9px] font-black text-orange-700 uppercase tracking-widest">
                                Mode form eksternal aktif
                              </p>
                              <p className="text-[10px] text-orange-700/80 font-medium">
                                Upload file langsung dimatikan. Gunakan form yang disediakan admin untuk pengumpulan file / link.
                              </p>
                              {storageConfig?.externalUrl && (
                                <Button
                                  type="button"
                                  onClick={() => window.open(storageConfig.externalUrl, "_blank")}
                                  className="h-9 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-[9px] uppercase tracking-widest"
                                >
                                  Buka Form Eksternal
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                     </div>
                     <div className="flex w-full md:w-auto items-center gap-2 flex-wrap">
                        {photos.length > 0 && <Button onClick={handleSaveAllData} className="h-10 px-4 md:px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase rounded-xl flex-1 md:flex-none">Simpan Semua</Button>}
                         <label htmlFor="photo-upload" className={cn(
                           "h-10 px-4 md:px-6 border-2 font-black text-[10px] uppercase rounded-xl flex items-center justify-center transition-all flex-1 md:flex-none",
                           isExternalFormMode ? "bg-orange-50 border-orange-100 text-orange-700 hover:bg-orange-100" : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                         )}><Upload className="h-4 w-4 mr-2" /> {isExternalFormMode ? "Form Eksternal" : "Upload"}</label>
                        <input type="file" id="photo-upload" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                     </div>
                  </CardHeader>
                  <CardContent className="p-5 md:p-8 space-y-5 md:space-y-8">
                     {(!assignment.photos?.length && !photos.length) ? (
                        <div className="py-20 text-center space-y-4">
                           <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto border-2 border-dashed border-slate-200"><ImageIcon className="h-10 w-10 text-slate-200" /></div>
                           <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Belum ada foto dokumentasi</p>
                        </div>
                     ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                           {/* Render existing & new photos beautifully */}
                           {[...(assignment.photos || []), ...photos]
                            .filter((p: any) => {
                              const url = typeof p === 'string' ? p : p.url;
                              return !removedPhotoUrls.includes(url);
                            })
                            .map((p: any, idx: number) => {
                              const url = typeof p === 'string' ? p : p.url;
                              const currentName = typeof p === 'object' ? p.name : (photoNames[url] || "");
                              
                              return (
                                <div key={idx} className="space-y-2 relative group/item">
                                  <div className="group relative aspect-video rounded-2xl overflow-hidden border-4 border-white shadow-md hover:shadow-xl transition-all duration-500">
                                     <img src={url} className="w-full h-full object-cover" />
                                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => window.open(url, '_blank')}>
                                          <ExternalLink className="h-6 w-6" />
                                        </Button>
                                     </div>
                                  </div>

                                  {/* Quick Delete Button */}
                                  <button 
                                    onClick={() => handleRemovePhoto(url)}
                                    className="absolute -top-2 -right-2 h-8 w-8 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-700 transition-all z-10 border-2 border-white scale-0 group-hover/item:scale-100"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>

                                  <Input 
                                    placeholder="Beri nama foto..."
                                    value={photoNames[url] || currentName}
                                    onChange={(e) => setPhotoNames({...photoNames, [url]: e.target.value})}
                                    className="h-9 text-[10px] font-bold uppercase tracking-tight rounded-xl bg-slate-50 border-none focus-visible:ring-emerald-500"
                                  />
                                </div>
                              );
                           })}
                        </div>
                     )}
                     
                     <div className="space-y-3">
                        <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Catatan Operasional</Label>
                        <Textarea 
                          value={notes} 
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Ketik kondisi lingkungan atau kendala teknis di sini..."
                          className="rounded-[1.5rem] bg-slate-50 border-none min-h-[120px] focus-visible:ring-emerald-500 font-medium text-sm p-6"
                        />
                     </div>
                  </CardContent>
               </PremiumCard>

            {/* PDF Results / Signed Travel Order Section */}
               <PremiumCard className="border-none shadow-2xl shadow-emerald-900/5 rounded-3xl md:rounded-[2.5rem] overflow-hidden bg-white mt-5 md:mt-8">
                  <CardHeader className="bg-slate-50/50 p-5 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                     <div className="flex items-center gap-3 md:gap-4">
                        <div className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-blue-100 text-blue-600"><FileText className="h-5 w-5 md:h-6 md:w-6" /></div>
                        <div>
                          <CardTitle className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900 leading-none">Berkas Hasil Sampling</CardTitle>
                          <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase mt-1.5 tracking-widest">Upload Surat Tugas / Laporan Lapangan (PDF)</p>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent className="p-5 md:p-8">
                    {assignment.signed_travel_order_url ? (
                      <div className="p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-[2rem] border-2 border-white shadow-inner flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Dokumen Tersedia</p>
                            <h4 className="text-sm font-black text-slate-800 uppercase truncate max-w-[200px]">Hasil_Sampling_{assignment.job_order.tracking_code}.pdf</h4>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                          <Button 
                            variant="outline"
                            onClick={() => window.open(assignment.signed_travel_order_url, '_blank')}
                            className="rounded-xl border-slate-200 font-black text-[10px] uppercase h-10 px-4 bg-white flex-1 md:flex-none"
                          >
                            <Download className="h-3 w-3 mr-2" /> Lihat PDF
                          </Button>
                          <Button 
                            variant="ghost"
                            onClick={handleDeletePdf}
                            className="rounded-xl text-rose-600 hover:bg-rose-50 font-black text-[10px] uppercase h-10 px-4 flex-1 md:flex-none"
                          >
                            <Trash2 className="h-3 w-3 mr-2" /> Hapus
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => !isLocked && pdfInputRef.current?.click()}
                        className={cn(
                          "py-10 md:py-12 border-2 border-dashed rounded-2xl md:rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all",
                          isLocked ? "border-slate-100 opacity-50 cursor-not-allowed" : "border-slate-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 group"
                        )}
                      >
                        <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center border-2 border-white shadow-inner group-hover:bg-blue-100 transition-colors">
                          {uploadingPdf ? <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" /> : <Upload className="h-8 w-8 text-slate-300 group-hover:text-blue-500" />}
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Klik untuk upload hasil sampling</p>
                          {storageConfig && (
                              <p className={cn("text-[9px] font-bold uppercase mt-1 tracking-widest", storageConfig?.provider === "google_drive" ? "text-violet-500" : storageConfig?.provider === "public" ? "text-blue-500" : storageConfig?.provider === "google_form" ? "text-orange-500" : "text-emerald-500")}>
                                Mode aktif: {storageLabel}
                              </p>
                            )}
                           {isExternalFormMode && storageConfig?.externalUrl && (
                             <Button
                               type="button"
                               onClick={() => window.open(storageConfig.externalUrl, "_blank")}
                               className="mt-3 h-9 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-[9px] uppercase tracking-widest"
                             >
                               Buka Form Eksternal
                             </Button>
                           )}
                          <p className="text-[9px] font-bold text-slate-300 uppercase mt-1">Format: PDF (Maks. 5MB)</p>
                        </div>
                        <input 
                          type="file" 
                          ref={pdfInputRef} 
                          onChange={handlePdfUpload} 
                          accept="application/pdf" 
                          className="hidden" 
                        />
                      </div>
                    )}
                  </CardContent>
               </PremiumCard>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-5 md:space-y-8">
            {/* Travel Order Quick Look */}
            {travelOrder && (
              <Card className="border-none shadow-2xl shadow-blue-900/5 rounded-3xl md:rounded-[2.5rem] overflow-hidden bg-blue-950 text-white">
                 <CardHeader className="p-5 md:p-8">
                    <div className="flex items-center gap-4 mb-5 md:mb-6">
                       <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center border-2 border-blue-500 shadow-xl"><FileText className="h-6 w-6" /></div>
                       <div><CardTitle className="text-lg font-black uppercase tracking-tight">Surat Tugas</CardTitle><p className="text-blue-400 font-bold text-[10px] uppercase">SPPD Digital Terbit</p></div>
                    </div>
                    <div className="bg-blue-900/50 p-5 rounded-2xl border border-blue-800/50 space-y-4">
                       <div className="flex justify-between items-center"><span className="text-[10px] font-black text-blue-400 uppercase">Nomor Dokumen</span><span className="font-mono text-xs font-bold text-blue-200">{travelOrder.document_number}</span></div>
                       <div className="flex justify-between items-center"><span className="text-[10px] font-black text-blue-400 uppercase">Uang Harian</span><span className="font-black text-emerald-400 text-sm">Rp {Number(travelOrder.daily_allowance).toLocaleString('id-ID')}</span></div>
                    </div>
                    <Button onClick={() => window.open(`/field/travel-orders/${travelOrder.id}/preview`, '_blank')} className="w-full h-14 bg-white hover:bg-blue-50 text-blue-900 font-black uppercase tracking-widest rounded-2xl shadow-xl mt-6">LIHAT BERKAS <ChevronRight className="ml-2 h-4 w-4" /></Button>
                 </CardHeader>
              </Card>
            )}

            {/* Team Members Card */}
            <Card className="border-none shadow-2xl shadow-emerald-900/5 rounded-3xl md:rounded-[2.5rem] overflow-hidden bg-white">
               <CardContent className="p-5 md:p-8 space-y-6">
                  <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                     <User className="h-4 w-4 text-emerald-600" /> Personel Bertugas
                  </h3>
                  <div className="space-y-4">
                     <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black">{assignment.field_officer?.full_name?.charAt(0)}</div>
                        <div><p className="text-[10px] font-black text-emerald-600 uppercase">Petugas Utama</p><p className="text-xs font-bold text-slate-800">{assignment.field_officer?.full_name}</p></div>
                     </div>
                     {assignment.assistants?.map((ast: any) => (
                        <div key={ast.id} className="flex items-center gap-4 p-4 bg-white border-2 border-slate-50 rounded-2xl">
                           <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black">{ast.full_name?.charAt(0)}</div>
                           <div><p className="text-[10px] font-black text-slate-400 uppercase">Asisten</p><p className="text-xs font-bold text-slate-800">{ast.full_name}</p></div>
                        </div>
                     ))}
                  </div>
               </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Action Bar (Responsive Mobile) */}
      {!['completed', 'cancelled'].includes(assignment.status) && (
        <div className="fixed bottom-[5.5rem] md:bottom-0 left-0 right-0 p-4 md:p-8 z-[60] pointer-events-none">
           <div className="max-w-xl mx-auto pointer-events-auto">
              <div className="bg-white/85 backdrop-blur-2xl border-2 border-slate-100 rounded-3xl md:rounded-[2.5rem] p-3 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col sm:flex-row gap-2.5 md:gap-3">
                 {assignment.status === 'pending' ? (
                    <Button 
                      onClick={() => setIsStartModalOpen(true)}
                      className="w-full h-14 md:h-16 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-xl md:rounded-2xl shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 transition-all active:scale-95 text-[11px] md:text-sm"
                    >
                       Mulai Perjalanan & Sampling <Play className="h-5 w-5 md:h-6 md:w-6" />
                    </Button>
                 ) : (
                    <>
                       <Button 
                         variant="ghost"
                         onClick={() => handleStatusUpdate('pending')}
                         className="flex-1 h-14 md:h-16 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[11px] md:text-xs text-slate-400 border-2 border-slate-50"
                       >
                          Tunda Tugas
                       </Button>
                       <Button 
                         onClick={() => handleStatusUpdate('completed')}
                         className="flex-[2] h-14 md:h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-xl md:rounded-2xl shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3 text-[11px] md:text-sm"
                       >
                          Sampling Selesai <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" />
                       </Button>
                    </>
                 )}
              </div>
           </div>
        </div>
      )}

      <Dialog open={isStartModalOpen} onOpenChange={(open) => !isStarting && setIsStartModalOpen(open)}>
        <DialogContent className="sm:max-w-md rounded-3xl md:rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-blue-600 p-6 md:p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center border-2 border-white/20">
                <Play className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Mulai Sampling?</DialogTitle>
                <DialogDescription className="text-blue-100 text-[10px] font-bold uppercase tracking-widest">
                  Status akan berubah menjadi sampling aktif
                </DialogDescription>
              </div>
            </div>
          </div>
          <div className="p-5 md:p-8 space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Detail Tugas</p>
              <p className="text-xs font-black text-slate-800">{assignment?.job_order?.tracking_code}</p>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{perihalPengujian}</p>
            </div>
          </div>
          <DialogFooter className="p-5 md:p-8 bg-slate-50 border-t flex gap-3 md:gap-4">
            <Button
              variant="ghost"
              disabled={isStarting}
              onClick={() => setIsStartModalOpen(false)}
              className="flex-1 font-black text-[10px] uppercase h-12 md:h-14 rounded-xl md:rounded-2xl text-slate-400"
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirmStartSampling}
              disabled={isStarting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase h-12 md:h-14 rounded-xl md:rounded-2xl shadow-xl shadow-blue-900/20"
            >
              {isStarting ? "Memproses..." : "Ya, Mulai Sekarang"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PremiumPageWrapper>
  );
}
