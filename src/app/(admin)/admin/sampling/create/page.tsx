"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeft, MapPin, Calendar, User } from "lucide-react";
import Link from "next/link";
import { createSamplingAssignment } from "@/lib/actions/sampling";
import { getUsers } from "@/lib/actions/users";
import { getJobOrders } from "@/lib/actions/jobs";

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fieldOfficers, setFieldOfficers] = useState<any[]>([]);
  const [jobOrders, setJobOrders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    job_order_id: "",
    field_officer_id: "",
    scheduled_date: "",
    location: "",
    notes: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // Load field officers
    const usersData = await getUsers(1, 100, "");
    const officers = usersData.users.filter((u: any) => u.role === 'field_officer');
    setFieldOfficers(officers);

    // Load all job orders (not just scheduled)
    const jobsData = await getJobOrders(1, 100, "");
    // Filter: show jobs that are scheduled OR in sampling status, and don't have assignment yet
    // For now, show all jobs that can be assigned
    const availableJobs = jobsData.items.filter((j: any) => {
      // Show jobs with status: scheduled, sampling (for re-assignment)
      return ['scheduled', 'sampling'].includes(j.status);
    });
    setJobOrders(availableJobs);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createSamplingAssignment(formData);
      
      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }
      
      toast.success("Assignment berhasil dibuat");
      
      // Redirect ke halaman create travel order dengan assignment ID
      const assignmentId = result.assignment?.id;
      if (assignmentId) {
        router.push(`/admin/travel-orders/create/${assignmentId}`);
      } else {
        toast.error("Assignment ID tidak ditemukan");
        router.push("/admin");
      }
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast.error(error.message || "Gagal membuat assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8">
      <div className="mb-6">
        <Link href="/admin" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Kembali</span>
        </Link>
        <h1 className="text-2xl font-bold text-emerald-900 font-[family-name:var(--font-montserrat)] uppercase">
          Buat Assignment Sampling
        </h1>
        <p className="text-slate-500 text-sm">Assign petugas lapangan untuk pengambilan sampel.</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Informasi Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job_order_id">Job Order</Label>
              <Select
                value={formData.job_order_id}
                onValueChange={(val) => handleChange("job_order_id", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Job Order" />
                </SelectTrigger>
                <SelectContent>
                  {jobOrders.length === 0 ? (
                    <SelectItem value="none" disabled>Tidak ada job order tersedia</SelectItem>
                  ) : (
                    jobOrders.map((job: any) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.tracking_code} - {job.quotation?.profile?.full_name} ({job.status})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {jobOrders.length === 0 && (
                <div className="text-xs text-amber-600 space-y-1">
                  <p>Tidak ada job order yang tersedia untuk sampling.</p>
                  <p className="text-slate-500">
                    Job order harus memiliki status <strong>"scheduled"</strong> atau <strong>"sampling"</strong> untuk bisa di-assign.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="field_officer_id">Petugas Lapangan</Label>
              <Select
                value={formData.field_officer_id}
                onValueChange={(val) => handleChange("field_officer_id", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Petugas" />
                </SelectTrigger>
                <SelectContent>
                  {fieldOfficers.length === 0 ? (
                    <SelectItem value="none" disabled>Tidak ada petugas lapangan</SelectItem>
                  ) : (
                    fieldOfficers.map((officer: any) => (
                      <SelectItem key={officer.id} value={officer.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {officer.full_name} - {officer.email}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {fieldOfficers.length === 0 && (
                <p className="text-xs text-amber-600">
                  Tidak ada user dengan role field_officer. Buat user terlebih dahulu.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Tanggal Rencana
              </Label>
              <Input
                id="scheduled_date"
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => handleChange("scheduled_date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Lokasi Sampling
              </Label>
              <Input
                id="location"
                placeholder="Contoh: Jakarta Industrial Estate, Blok A No. 5"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                placeholder="Instruksi khusus untuk pengambilan sampel..."
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                disabled={loading || !formData.job_order_id || !formData.field_officer_id}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Buat Assignment
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
  );
}
