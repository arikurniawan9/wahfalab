// ============================================================================
// OPERATOR CREATE TRAVEL ORDER PAGE
// Surat Tugas Perjalanan Dinas untuk petugas lapangan
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChemicalLoader } from "@/components/ui";
import { createTravelOrder, getTravelOrderByAssignmentId } from "@/lib/actions/travel-order";
import { getAssignmentById } from "@/lib/actions/sampling";
import { ArrowLeft, Save, Truck, MapPin, Calendar, DollarSign, Utensils } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function OperatorCreateTravelOrderPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assignment, setAssignment] = useState<any>(null);
  const [existingTravelOrder, setExistingTravelOrder] = useState<any>(null);

  const [formData, setFormData] = useState({
    departure_date: "",
    return_date: "",
    destination: "",
    purpose: "",
    transportation_type: "",
    accommodation_type: "",
    daily_allowance: "",
    total_budget: "",
    notes: ""
  });

  useEffect(() => {
    loadData();
  }, [params.id]);

  async function loadData() {
    try {
      // Load assignment details
      const assignmentData = await getAssignmentById(params.id as string);
      setAssignment(assignmentData);
      
      // Auto-fill destination from assignment location
      if (assignmentData?.location) {
        setFormData(prev => ({
          ...prev,
          destination: assignmentData.location
        }));
      }

      // Check if travel order already exists
      const existingTO = await getTravelOrderByAssignmentId(params.id as string);
      if (existingTO) {
        setExistingTravelOrder(existingTO);
        toast.info("Surat tugas sudah ada, redirecting...");
        setTimeout(() => {
          router.push(`/operator/travel-orders/${existingTO.id}`);
        }, 2000);
      }
    } catch (error: any) {
      toast.error("Gagal memuat data", {
        description: error?.message
      });
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate
      if (!formData.departure_date || !formData.return_date) {
        toast.error("Tanggal berangkat & kembali wajib diisi");
        setSubmitting(false);
        return;
      }
      if (!formData.destination) {
        toast.error("Tujuan wajib diisi");
        setSubmitting(false);
        return;
      }
      if (!formData.purpose) {
        toast.error("Maksud & tujuan wajib diisi");
        setSubmitting(false);
        return;
      }

      const result = await createTravelOrder({
        assignment_id: params.id as string,
        departure_date: formData.departure_date,
        return_date: formData.return_date,
        destination: formData.destination,
        purpose: formData.purpose,
        transportation_type: formData.transportation_type || undefined,
        accommodation_type: formData.accommodation_type || undefined,
        daily_allowance: formData.daily_allowance ? parseFloat(formData.daily_allowance) : undefined,
        total_budget: formData.total_budget ? parseFloat(formData.total_budget) : undefined,
        notes: formData.notes || undefined
      });

      if (result.error) {
        toast.error(result.error);
        setSubmitting(false);
        return;
      }

      toast.success("✅ Surat tugas berhasil dibuat!");
      
      // Redirect to detail page
      setTimeout(() => {
        if (result.travelOrder) {
          router.push(`/operator/travel-orders/${result.travelOrder.id}`);
        }
      }, 1000);
    } catch (error: any) {
      console.error("Create travel order error:", error);
      toast.error("Gagal membuat surat tugas", {
        description: error?.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ChemicalLoader size="lg" />
      </div>
    );
  }

  if (existingTravelOrder) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ChemicalLoader size="lg" />
          <p className="mt-4 text-slate-600 font-medium">Mengalihkan ke surat tugas...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-600">Assignment tidak ditemukan</h2>
          <Link href="/operator/sampling">
            <Button className="mt-4">Kembali</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/operator/sampling">
          <Button variant="outline" size="icon" className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">Buat Surat Tugas Perjalanan</h1>
          <p className="text-slate-500 text-sm">Isi detail perjalanan dinas untuk petugas lapangan</p>
        </div>
      </div>

      {/* Assignment Info Card */}
      <Card className="mb-6 bg-emerald-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-emerald-900">
            <MapPin className="h-5 w-5" />
            Informasi Penugasan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Job Order</p>
              <p className="font-semibold text-slate-800">
                {assignment.job_order?.tracking_code || '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Petugas Lapangan</p>
              <p className="font-semibold text-slate-800">
                {assignment.field_officer?.full_name || '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Lokasi</p>
              <p className="font-semibold text-slate-800">{assignment.location}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">Jadwal</p>
              <p className="font-semibold text-slate-800">
                {new Date(assignment.scheduled_date).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Travel Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Tanggal Perjalanan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="departure_date" className="text-sm font-bold">
                  Tanggal Berangkat <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="departure_date"
                  type="datetime-local"
                  value={formData.departure_date}
                  onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="return_date" className="text-sm font-bold">
                  Tanggal Kembali <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="return_date"
                  type="datetime-local"
                  value={formData.return_date}
                  onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                  min={formData.departure_date}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Destination & Purpose */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              Tujuan & Maksud
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="destination" className="text-sm font-bold">
                Lokasi Tujuan <span className="text-red-500">*</span>
              </Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="Contoh: Jakarta, Bandung, Surabaya"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purpose" className="text-sm font-bold">
                Maksud & Tujuan <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Contoh: Pengambilan sampel air limbah di PT. ABC"
                rows={3}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Transportation & Accommodation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Transportation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                Transportasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="transportation_type" className="text-sm font-bold">
                  Jenis Transportasi
                </Label>
                <Input
                  id="transportation_type"
                  value={formData.transportation_type}
                  onChange={(e) => setFormData({ ...formData, transportation_type: e.target.value })}
                  placeholder="Contoh: Mobil, Pesawat, Kereta"
                />
              </div>
            </CardContent>
          </Card>

          {/* Accommodation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Utensils className="h-5 w-5 text-amber-600" />
                Akomodasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="accommodation_type" className="text-sm font-bold">
                  Jenis Akomodasi
                </Label>
                <Input
                  id="accommodation_type"
                  value={formData.accommodation_type}
                  onChange={(e) => setFormData({ ...formData, accommodation_type: e.target.value })}
                  placeholder="Contoh: Hotel, Tidak Perlu"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Rincian Biaya
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="daily_allowance" className="text-sm font-bold">
                  Uang Harian (Per Diem)
                </Label>
                <Input
                  id="daily_allowance"
                  type="number"
                  value={formData.daily_allowance}
                  onChange={(e) => setFormData({ ...formData, daily_allowance: e.target.value })}
                  placeholder="0"
                />
                <p className="text-[10px] text-slate-500">Uang saku per hari</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="total_budget" className="text-sm font-bold">
                  Total Estimasi Biaya
                </Label>
                <Input
                  id="total_budget"
                  type="number"
                  value={formData.total_budget}
                  onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
                  placeholder="0"
                />
                <p className="text-[10px] text-slate-500">Termasuk transport & akomodasi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Catatan Tambahan</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Catatan atau instruksi khusus lainnya (opsional)"
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-4 justify-end sticky bottom-0 bg-white/80 backdrop-blur-md border-t -mx-4 px-4 py-4">
          <Link href="/operator/sampling">
            <Button type="button" variant="outline">
              Batal
            </Button>
          </Link>
          <Button 
            type="submit" 
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Surat Tugas
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
