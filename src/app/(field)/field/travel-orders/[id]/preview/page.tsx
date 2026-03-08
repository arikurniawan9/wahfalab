"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { getTravelOrderById } from "@/lib/actions/travel-order";
import { getCompanyProfile } from "@/lib/actions/company";
import { pdf, PDFViewer } from "@react-pdf/renderer";
import { TravelOrderPDF } from "@/components/pdf/TravelOrderPDF";
import { Skeleton } from "@/components/ui/skeleton";

export default function FieldTravelOrderPreviewPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ travelOrder: any; companyProfile: any }>({
    travelOrder: null,
    companyProfile: null
  });
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    async function loadAllData() {
      setLoading(true);
      try {
        // OPTIMASI 1: Ambil data secara PARALEL untuk kecepatan maksimal
        const [orderData, companyData] = await Promise.all([
          getTravelOrderById(params.id as string),
          getCompanyProfile()
        ]);

        if (!orderData) {
          toast.error("Data surat tugas tidak ditemukan");
        }

        // OPTIMASI 2: Proses URL logo/ttd/stempel secara terpusat
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const processUrl = (url: string | null) => {
          if (!url) return null;
          return url.startsWith('http') ? url : `${origin}${url}`;
        };

        const company = companyData ? {
          ...companyData,
          logo_url: processUrl(companyData.logo_url) || '/logo-wahfalab.png',
          signature_url: processUrl(companyData.signature_url),
          stamp_url: processUrl(companyData.stamp_url),
        } : null;

        setData({ travelOrder: orderData, companyProfile: company });
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    }

    loadAllData();
  }, [params.id]);

  // OPTIMASI 3: Memoize dokumen PDF agar tidak render ulang saat state lain berubah
  const pdfDocument = useMemo(() => {
    if (!data.travelOrder || !data.companyProfile) return null;

    const { travelOrder, companyProfile } = data;
    const fieldOfficer = travelOrder.assignment?.field_officer || {};
    const jobOrder = travelOrder.assignment?.job_order || {};
    const quotation = jobOrder.quotation || {};
    const profile = quotation.profile || {};
    const items = quotation.items || [];
    const assistants = travelOrder.assignment?.assistants || [];

    return (
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
            assistants: assistants,
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
  }, [data.travelOrder, data.companyProfile]);

  const handleDownloadPdf = async () => {
    if (!pdfDocument || !data.travelOrder) return;

    setGeneratingPdf(true);
    try {
      const blob = await pdf(pdfDocument).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Surat_Tugas-${data.travelOrder.document_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("✅ Surat tugas berhasil diunduh");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("Gagal membuat PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-10 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">Menyiapkan Dokumen Digital...</p>
      </div>
    );
  }

  if (!data.travelOrder) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-600">Surat tugas tidak ditemukan</h2>
          <Link href="/field">
            <Button className="mt-4">Kembali</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Link href="/field/assignments">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">Preview Surat Tugas</h1>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{data.travelOrder.document_number}</p>
          </div>
        </div>
        
        <Button
          onClick={handleDownloadPdf}
          disabled={generatingPdf || !pdfDocument}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-900/20"
        >
          {generatingPdf ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="mr-2 h-3.5 w-3.5" />
          )}
          {generatingPdf ? "Processing..." : "Unduh PDF"}
        </Button>
      </div>

      {/* Main Preview Area */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-slate-900 p-1 rounded-[2.5rem] shadow-2xl overflow-hidden ring-8 ring-slate-100">
          <div className="bg-white rounded-[2.2rem] overflow-hidden aspect-[1/1.414] relative">
            {!pdfDocument ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
              </div>
            ) : (
              <PDFViewer className="w-full h-full border-none" showToolbar={false}>
                {pdfDocument}
              </PDFViewer>
            )}
          </div>
        </div>
        
        {/* Info Box */}
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-start gap-4">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <FileText className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest">Informasi Cetak</h4>
            <p className="text-xs text-emerald-700/80 mt-1 leading-relaxed">
              Dokumen ini dioptimalkan untuk ukuran kertas <strong>A4</strong>. Gunakan pengaturan "Fit to Page" saat mencetak jika konten terlihat terlalu dekat dengan margin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
