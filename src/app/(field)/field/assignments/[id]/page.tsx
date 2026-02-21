"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
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
  Download
} from "lucide-react";
import Link from "next/link";
import { getAssignmentById, updateSamplingStatus } from "@/lib/actions/sampling";
import { getTravelOrderByAssignmentId } from "@/lib/actions/travel-order";
import { createClient } from "@/lib/supabase/client";
import prisma from "@/lib/prisma";

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [assignment, setAssignment] = useState<any>(null);
  const [travelOrder, setTravelOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadAssignment() {
      const [assignmentData, travelOrderData] = await Promise.all([
        getAssignmentById(params.id as string),
        getTravelOrderByAssignmentId(params.id as string)
      ]);
      setAssignment(assignmentData);
      setTravelOrder(travelOrderData);
      setLoading(false);
    }
    loadAssignment();
  }, [params.id]);

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
      const fileName = `${params.id}-${Date.now()}.${fileExt}`;
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

      return publicUrl;
    });

    const urls = (await Promise.all(uploadPromises)).filter(Boolean) as string[];
    setPhotos([...photos, ...urls]);
    toast.success(`${urls.length} foto berhasil diupload`);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
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

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8">
      <div className="mb-6">
        <Link href="/field" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Kembali</span>
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-emerald-900 font-[family-name:var(--font-montserrat)] uppercase">
            Detail Sampling
          </h1>
          <Badge className={cn("text-[10px] h-6 px-3 font-bold uppercase", statusColors[assignment.status] || statusColors.pending)}>
            {assignment.status}
          </Badge>
        </div>
        <p className="text-slate-500 text-sm mt-1">{assignment.job_order.tracking_code}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-600" />
              Informasi Lokasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-slate-500">Lokasi Sampling</Label>
              <p className="font-medium text-slate-800">{assignment.location}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Tanggal Rencana
                </Label>
                <p className="font-medium text-slate-800 text-sm">
                  {new Date(assignment.scheduled_date).toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              {assignment.actual_date && (
                <div>
                  <Label className="text-xs text-slate-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Tanggal Aktual
                  </Label>
                  <p className="font-medium text-slate-800 text-sm">
                    {new Date(assignment.actual_date).toLocaleDateString('id-ID', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs text-slate-500">Petugas</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-8 w-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                  {assignment.field_officer?.full_name?.charAt(0) || 'F'}
                </div>
                <div>
                  <p className="font-medium text-slate-800 text-sm">{assignment.field_officer?.full_name || 'N/A'}</p>
                  <p className="text-xs text-slate-500">{assignment.field_officer?.email || 'N/A'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              Informasi Job Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-slate-500">Tracking Code</Label>
              <p className="font-medium text-emerald-600">{assignment.job_order.tracking_code}</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Layanan</Label>
              <p className="font-medium text-slate-800">
                {assignment.job_order.quotation.items[0]?.service?.name || 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-xs text-slate-500">Customer</Label>
              <p className="font-medium text-slate-800">
                {assignment.job_order.quotation.profile?.full_name || 'N/A'}
              </p>
            </div>
            {assignment.job_order.quotation.quotation_number && (
              <div>
                <Label className="text-xs text-slate-500">Nomor Penawaran</Label>
                <p className="font-medium text-slate-800 text-sm">
                  {assignment.job_order.quotation.quotation_number}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {travelOrder && (
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                Surat Tugas Perjalanan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-slate-500">Nomor Surat</Label>
                <p className="font-medium text-emerald-600">{travelOrder.document_number}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Berangkat</Label>
                  <p className="font-medium text-slate-800 text-sm">
                    {new Date(travelOrder.departure_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Kembali</Label>
                  <p className="font-medium text-slate-800 text-sm">
                    {new Date(travelOrder.return_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Tujuan</Label>
                <p className="font-medium text-slate-800">{travelOrder.destination}</p>
              </div>
              {travelOrder.transportation_type && (
                <div>
                  <Label className="text-xs text-slate-500">Transportasi</Label>
                  <p className="font-medium text-slate-800">{travelOrder.transportation_type}</p>
                </div>
              )}
              {travelOrder.daily_allowance && (
                <div>
                  <Label className="text-xs text-slate-500">Uang Harian</Label>
                  <p className="font-medium text-emerald-600">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0
                    }).format(travelOrder.daily_allowance)}
                  </p>
                </div>
              )}
              <div className="pt-2 flex gap-2">
                <Link href={`/admin/travel-orders/${travelOrder.id}/preview`} target="_blank" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <FileText className="h-3 w-3 mr-2" />
                    Preview PDF
                  </Button>
                </Link>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    // Direct download trigger
                    const link = document.createElement('a');
                    link.href = `/admin/travel-orders/${travelOrder.id}/preview`;
                    link.target = '_blank';
                    link.click();
                  }}
                >
                  <Download className="h-3 w-3 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-emerald-600" />
            Dokumentasi Foto
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignment.photos && (assignment.photos as string[]).length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-4">
              {(assignment.photos as string[]).map((photo: string, idx: number) => (
                <a
                  key={idx}
                  href={photo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square rounded-lg overflow-hidden border border-slate-200 hover:border-emerald-400 transition-colors"
                >
                  <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}
          
          {assignment.status !== 'completed' && assignment.status !== 'cancelled' && (
            <div className="border-t pt-4">
              <Label className="text-xs text-slate-500 mb-2 block">Upload Foto Baru</Label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload">
                  <Button type="button" variant="outline" size="sm" asChild className="cursor-pointer">
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Foto
                    </span>
                  </Button>
                </label>
                {photos.length > 0 && (
                  <span className="text-xs text-slate-500">{photos.length} foto baru</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Catatan Sampling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-slate-500">Catatan Assignment</Label>
            {assignment.notes ? (
              <p className="text-sm text-slate-700 mt-1 p-3 bg-slate-50 rounded-lg">{assignment.notes}</p>
            ) : (
              <p className="text-sm text-slate-400 italic mt-1">Tidak ada catatan</p>
            )}
          </div>

          {assignment.status !== 'completed' && assignment.status !== 'cancelled' && (
            <div>
              <Label htmlFor="notes" className="text-xs text-slate-500">Tambah Catatan</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan pengambilan sampel..."
                className="mt-1 min-h-[100px]"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-4">
            {assignment.status === 'pending' && (
              <Button
                onClick={() => handleStatusUpdate('in_progress')}
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700"
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
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Selesai Sampling
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('pending')}
                  disabled={isPending}
                  variant="outline"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Tunda
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => router.push('/field')}>
              Kembali
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}
