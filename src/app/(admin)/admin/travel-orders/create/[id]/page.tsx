"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Calendar, MapPin, DollarSign } from "lucide-react";
import Link from "next/link";
import { createTravelOrder, getTravelOrderByAssignmentId } from "@/lib/actions/travel-order";
import { getAssignmentById } from "@/lib/actions/sampling";

export default function CreateTravelOrderPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
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
  }, []);

  async function loadData() {
    try {
      // Load assignment
      const assignmentData = await getAssignmentById(params.id as string);
      if (!assignmentData) {
        toast.error("Assignment tidak ditemukan");
        router.push("/admin");
        return;
      }
      setAssignment(assignmentData);

      // Set default destination from assignment
      setFormData(prev => ({
        ...prev,
        destination: assignmentData.location || ""
      }));

      // Check if travel order already exists
      const existingTO = await getTravelOrderByAssignmentId(params.id as string);
      if (existingTO) {
        setExistingTravelOrder(existingTO);
        toast.info("Surat tugas sudah ada, Anda dapat mengedit data");
        setFormData({
          departure_date: existingTO.departure_date ? new Date(existingTO.departure_date).toISOString().slice(0, 16) : "",
          return_date: existingTO.return_date ? new Date(existingTO.return_date).toISOString().slice(0, 16) : "",
          destination: existingTO.destination || "",
          purpose: existingTO.purpose || "",
          transportation_type: existingTO.transportation_type || "",
          accommodation_type: existingTO.accommodation_type || "",
          daily_allowance: existingTO.daily_allowance?.toString() || "",
          total_budget: existingTO.total_budget?.toString() || "",
          notes: existingTO.notes || ""
        });
      }
    } catch (error) {
      toast.error("Gagal memuat data");
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createTravelOrder({
        assignment_id: params.id as string,
        ...formData,
        daily_allowance: formData.daily_allowance ? parseFloat(formData.daily_allowance) : undefined,
        total_budget: formData.total_budget ? parseFloat(formData.total_budget) : undefined
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Surat tugas berhasil dibuat");
        router.push(`/admin/travel-orders/${result.travelOrder?.id}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal membuat surat tugas");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!assignment) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8">
      <div className="mb-6">
        <Link href="/admin" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Kembali</span>
        </Link>
        <h1 className="text-2xl font-bold text-emerald-900 font-[family-name:var(--font-montserrat)] uppercase">
          {existingTravelOrder ? 'Edit' : 'Buat'} Surat Tugas Perjalanan
        </h1>
        <p className="text-slate-500 text-sm">
          {existingTravelOrder ? 'Edit' : 'Generate'} surat tugas untuk {assignment.field_officer?.full_name}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Informasi Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label className="text-xs text-slate-500">Petugas Lapangan</Label>
                <p className="font-medium text-slate-800">{assignment.field_officer?.full_name}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Tracking Code</Label>
                <p className="font-medium text-emerald-600">{assignment.job_order.tracking_code}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Customer</Label>
                <p className="font-medium text-slate-800">{assignment.job_order.quotation.profile?.full_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-600" />
              Detail Perjalanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="departure_date">Tanggal Berangkat</Label>
                  <Input
                    id="departure_date"
                    type="datetime-local"
                    value={formData.departure_date}
                    onChange={(e) => handleChange("departure_date", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="return_date">Tanggal Kembali</Label>
                  <Input
                    id="return_date"
                    type="datetime-local"
                    value={formData.return_date}
                    onChange={(e) => handleChange("return_date", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Lokasi Tujuan
                </Label>
                <Input
                  id="destination"
                  placeholder="Contoh: Jakarta Industrial Estate"
                  value={formData.destination}
                  onChange={(e) => handleChange("destination", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Maksud & Tujuan</Label>
                <Textarea
                  id="purpose"
                  placeholder="Pengambilan sampel air limbah untuk analisis parameter kimia..."
                  value={formData.purpose}
                  onChange={(e) => handleChange("purpose", e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="transportation_type">Transportasi</Label>
                  <Input
                    id="transportation_type"
                    placeholder="Contoh: Mobil Dinas / Motor"
                    value={formData.transportation_type}
                    onChange={(e) => handleChange("transportation_type", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accommodation_type">Akomodasi</Label>
                  <Input
                    id="accommodation_type"
                    placeholder="Contoh: Hotel / Tidak perlu"
                    value={formData.accommodation_type}
                    onChange={(e) => handleChange("accommodation_type", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="daily_allowance" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Uang Harian
                  </Label>
                  <Input
                    id="daily_allowance"
                    type="number"
                    placeholder="0"
                    value={formData.daily_allowance}
                    onChange={(e) => handleChange("daily_allowance", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_budget" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total Estimasi Biaya
                  </Label>
                  <Input
                    id="total_budget"
                    type="number"
                    placeholder="0"
                    value={formData.total_budget}
                    onChange={(e) => handleChange("total_budget", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan Tambahan</Label>
                <Textarea
                  id="notes"
                  placeholder="Instruksi khusus atau catatan penting..."
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {existingTravelOrder ? 'Simpan Perubahan' : 'Buat Surat Tugas'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
