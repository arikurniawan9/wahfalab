// ============================================================================
// OPERATOR QUOTATION DETAIL PAGE
// Halaman detail quotation untuk operator (read-only + cetak PDF)
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChemicalLoader } from "@/components/ui";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Percent,
  Package,
  Truck,
  Utensils
} from "lucide-react";
import { getQuotationById, updateQuotationStatus } from "@/lib/actions/quotation";
import { downloadQuotationPDF } from "@/lib/generate-quotation-pdf";
import { cn } from "@/lib/utils";

export default function OperatorQuotationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadQuotation();
    }
  }, [params.id]);

  async function loadQuotation() {
    try {
      const data = await getQuotationById(params.id as string);
      setQuotation(data);
    } catch (error) {
      toast.error("Gagal memuat data penawaran");
    } finally {
      setLoading(false);
    }
  }

  const handlePrintPDF = async () => {
    try {
      await downloadQuotationPDF(quotation);
    } catch (error) {
      toast.error("Gagal mencetak PDF");
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      await updateQuotationStatus(quotation.id, newStatus);
      toast.success(`Penawaran berhasil di-${newStatus === 'accepted' ? 'terima' : 'tolak'}`);
      loadQuotation();
    } catch (error) {
      toast.error("Gagal update status");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
      case 'sent': return "bg-slate-100 text-slate-700 border-slate-200";
      case 'accepted': return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case 'rejected': return "bg-red-100 text-red-700 border-red-200";
      case 'paid': return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'DRAFT';
      case 'sent': return 'TERKIRIM';
      case 'accepted': return 'DITERIMA';
      case 'rejected': return 'DITOLAK';
      case 'paid': return 'DIBAYAR';
      default: return status.toUpperCase();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ChemicalLoader size="lg" />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-600">Penawaran tidak ditemukan</h2>
          <Link href="/operator/quotations">
            <Button className="mt-4">Kembali</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/operator/quotations">
            <Button variant="outline" size="icon" className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-emerald-900">{quotation.quotation_number}</h1>
            <p className="text-slate-500 text-sm">Detail Penawaran</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrintPDF}
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Download className="mr-2 h-4 w-4" />
            Cetak PDF
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-6">
        <Badge
          variant="outline"
          className={cn(
            "text-sm px-4 py-2 rounded-full font-bold",
            getStatusColor(quotation.status)
          )}
        >
          {getStatusLabel(quotation.status)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Customer & Items */}
        <div className="md:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Informasi Klien
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">Nama Klien</p>
                <p className="font-semibold text-slate-800">{quotation.profile.full_name}</p>
              </div>
              {quotation.profile.company_name && (
                <div>
                  <p className="text-sm text-slate-500">Perusahaan</p>
                  <p className="font-semibold text-slate-800">{quotation.profile.company_name}</p>
                </div>
              )}
              {quotation.profile.email && (
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-semibold text-slate-800">{quotation.profile.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-600" />
                Item Penawaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quotation.items.map((item: any, idx: number) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {item.service?.name || item.equipment?.name || 'Item'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.qty} x Rp {item.price_snapshot?.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-emerald-700">
                      Rp {(item.qty * item.price_snapshot).toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Operational Costs */}
          {(quotation.perdiem_name || quotation.transport_name) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Biaya Operasional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quotation.perdiem_name && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Utensils className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-semibold text-slate-800">{quotation.perdiem_name}</p>
                        <p className="text-xs text-slate-500">
                          {quotation.perdiem_qty} hari x Rp {quotation.perdiem_price?.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-slate-700">
                      Rp {(quotation.perdiem_price * quotation.perdiem_qty).toLocaleString('id-ID')}
                    </p>
                  </div>
                )}
                {quotation.transport_name && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-slate-800">{quotation.transport_name}</p>
                        <p className="text-xs text-slate-500">
                          {quotation.transport_qty} x Rp {quotation.transport_price?.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-slate-700">
                      Rp {(quotation.transport_price * quotation.transport_qty).toLocaleString('id-ID')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="bg-emerald-50 border-emerald-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Ringkasan Biaya
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold">
                  Rp {quotation.subtotal?.toLocaleString('id-ID')}
                </span>
              </div>
              {quotation.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span className="flex items-center gap-1">
                    <Percent className="h-3 w-3" /> Diskon
                  </span>
                  <span className="font-semibold">
                    - Rp {quotation.discount_amount?.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              {quotation.use_tax && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Pajak (10%)</span>
                  <span className="font-semibold">
                    Rp {quotation.tax_amount?.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              <div className="border-t-2 border-emerald-300 pt-3 flex justify-between text-xl font-bold text-emerald-900">
                <span>Total</span>
                <span>
                  Rp {quotation.total_amount?.toLocaleString('id-ID')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/operator/quotations/${quotation.id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="mr-2 h-4 w-4" />
                  Lihat Detail
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={handlePrintPDF}
              >
                <Download className="mr-2 h-4 w-4" />
                Cetak PDF
              </Button>
              {(quotation.status === 'draft' || quotation.status === 'sent') && (
                <>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleStatusUpdate('accepted')}
                    disabled={updating}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {updating ? 'Memproses...' : 'Terima Penawaran'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={updating}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Tolak Penawaran
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-slate-50">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal</span>
                  <span className="font-semibold">
                    {new Date(quotation.date).toLocaleDateString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dibuat</span>
                  <span className="font-semibold">
                    {new Date(quotation.created_at).toLocaleDateString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <Badge className={getStatusColor(quotation.status)} variant="outline">
                    {getStatusLabel(quotation.status)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
