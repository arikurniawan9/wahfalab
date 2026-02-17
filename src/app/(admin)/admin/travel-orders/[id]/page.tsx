"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  FileText,
  Calendar,
  MapPin,
  User,
  DollarSign,
  Printer
} from "lucide-react";
import Link from "next/link";
import { getTravelOrderById } from "@/lib/actions/travel-order";
import { pdf } from "@react-pdf/renderer";
import { TravelOrderPDF } from "@/components/pdf/TravelOrderPDF";

export default function TravelOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [travelOrder, setTravelOrder] = useState<any>(null);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const data = await getTravelOrderById(params.id as string);
      setTravelOrder(data);

      // Load company profile
      const companyResponse = await fetch('/api/company-profile');
      const companyData = await companyResponse.json();
      setCompanyProfile(companyData);
    } catch (error) {
      toast.error("Gagal memuat data surat tugas");
    } finally {
      setLoading(false);
    }
  }

  const handleDownloadPdf = async () => {
    if (!travelOrder) return;

    setGeneratingPdf(true);
    try {
      const pdfDoc = (
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
            assignment: travelOrder.assignment,
            created_at: travelOrder.created_at
          }}
          company={companyProfile}
        />
      );

      const blob = await pdf(pdfDoc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${travelOrder.document_number.replace(/\//g, "_")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("PDF berhasil diunduh");
    } catch (error) {
      toast.error("Gagal generate PDF");
      console.error(error);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-200 rounded w-1/4 mx-auto"></div>
              <div className="h-32 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!travelOrder) {
    return (
      <div className="p-4 md:p-8">
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Surat tugas tidak ditemukan</p>
            <Link href="/admin">
              <Button variant="link" className="mt-2">Kembali</Button>
            </Link>
          </CardContent>
        </Card>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-emerald-900 font-[family-name:var(--font-montserrat)] uppercase">
              Surat Tugas Perjalanan
            </h1>
            <p className="text-slate-500 text-sm">{travelOrder.document_number}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Download className="h-4 w-4 mr-2" />
              {generatingPdf ? "Generating..." : "Download PDF"}
            </Button>
            <Link href={`/admin/travel-orders/${params.id}/preview`}>
              <Button variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Petugas Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-600" />
              Data Petugas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-500">Nama</p>
              <p className="font-medium text-slate-800">
                {travelOrder.assignment.field_officer.full_name}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="font-medium text-slate-800">
                {travelOrder.assignment.field_officer.email}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Jabatan</p>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                Petugas Lapangan
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Perjalanan Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-600" />
              Detail Perjalanan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-500">Tanggal Berangkat</p>
              <p className="font-medium text-slate-800">
                {formatDate(travelOrder.departure_date)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Tanggal Kembali</p>
              <p className="font-medium text-slate-800">
                {formatDate(travelOrder.return_date)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Lokasi Tujuan</p>
              <p className="font-medium text-slate-800 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {travelOrder.destination}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Job Order Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              Informasi Job Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-500">Tracking Code</p>
              <p className="font-medium text-emerald-600">
                {travelOrder.assignment.job_order.tracking_code}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Customer</p>
              <p className="font-medium text-slate-800">
                {travelOrder.assignment.job_order.quotation.profile.full_name}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Maksud & Tujuan</p>
              <p className="text-sm text-slate-700">{travelOrder.purpose}</p>
            </div>
          </CardContent>
        </Card>

        {/* Budget Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Rincian Biaya
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {travelOrder.transportation_type && (
              <div>
                <p className="text-xs text-slate-500">Transportasi</p>
                <p className="font-medium text-slate-800">
                  {travelOrder.transportation_type}
                </p>
              </div>
            )}
            {travelOrder.accommodation_type && (
              <div>
                <p className="text-xs text-slate-500">Akomodasi</p>
                <p className="font-medium text-slate-800">
                  {travelOrder.accommodation_type}
                </p>
              </div>
            )}
            {travelOrder.daily_allowance && (
              <div>
                <p className="text-xs text-slate-500">Uang Harian</p>
                <p className="font-medium text-slate-800">
                  {formatCurrency(travelOrder.daily_allowance)}
                </p>
              </div>
            )}
            {travelOrder.total_budget && (
              <div>
                <p className="text-xs text-slate-500">Total Estimasi</p>
                <p className="font-medium text-emerald-600">
                  {formatCurrency(travelOrder.total_budget)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {travelOrder.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Catatan Tambahan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">{travelOrder.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Timeline */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
              <div>
                <p className="text-sm font-medium text-slate-800">Dibuat</p>
                <p className="text-xs text-slate-500">{formatDate(travelOrder.created_at)}</p>
              </div>
            </div>
            {travelOrder.updated_at !== travelOrder.created_at && (
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Terakhir Diupdate</p>
                  <p className="text-xs text-slate-500">{formatDate(travelOrder.updated_at)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
