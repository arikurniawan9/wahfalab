"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { pdf, PDFViewer } from "@react-pdf/renderer";
import { ArrowLeft, Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getTravelOrderById } from "@/lib/actions/travel-order";
import { getCompanyProfile } from "@/lib/actions/company";
import { TravelOrderPDF } from "@/components/pdf/TravelOrderPDF";

export default function AnalystTravelOrderPreviewPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [data, setData] = useState<{ travelOrder: any; companyProfile: any }>({
    travelOrder: null,
    companyProfile: null,
  });

  useEffect(() => {
    async function loadAllData() {
      setLoading(true);
      try {
        const [orderData, companyData] = await Promise.all([
          getTravelOrderById(params.id as string),
          getCompanyProfile(),
        ]);

        if (!orderData) {
          toast.error("Data surat tugas tidak ditemukan");
        }

        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const processUrl = (url: string | null) => {
          if (!url) return null;
          return url.startsWith("http") ? url : `${origin}${url}`;
        };

        const company = companyData
          ? {
              ...companyData,
              logo_url: processUrl(companyData.logo_url) || "/logo-wahfalab.png",
              signature_url: processUrl(companyData.signature_url),
              stamp_url: processUrl(companyData.stamp_url),
            }
          : null;

        setData({ travelOrder: orderData, companyProfile: company });
      } catch (error) {
        console.error("Failed to load travel order preview:", error);
        toast.error("Gagal memuat data surat tugas");
      } finally {
        setLoading(false);
      }
    }

    loadAllData();
  }, [params.id]);

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
          quotation_title: quotation.title,
          transportation_type: travelOrder.transportation_type,
          accommodation_type: travelOrder.accommodation_type,
          daily_allowance: travelOrder.daily_allowance,
          total_budget: travelOrder.total_budget,
          notes: travelOrder.notes,
          assignment: {
            field_officer: {
              full_name: fieldOfficer.full_name,
              email: fieldOfficer.email,
            },
            assistants,
            job_order: {
              tracking_code: jobOrder.tracking_code,
              quotation: {
                quotation_number: quotation.quotation_number,
                total_amount: quotation.total_amount,
                profile: {
                  full_name: profile.full_name,
                  company_name: profile.company_name,
                },
                items,
              },
            },
          },
          created_at: travelOrder.created_at,
        }}
        company={companyProfile}
      />
    );
  }, [data.companyProfile, data.travelOrder]);

  const handleDownloadPdf = async () => {
    if (!pdfDocument || !data.travelOrder) return;

    setGeneratingPdf(true);
    try {
      const blob = await pdf(pdfDocument).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Surat_Tugas-${data.travelOrder.document_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Surat tugas berhasil diunduh");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Gagal membuat PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-10 max-w-7xl mx-auto flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-sky-500" />
        <p className="animate-pulse font-bold text-slate-500">Menyiapkan preview surat tugas...</p>
      </div>
    );
  }

  if (!data.travelOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-600">Surat tugas tidak ditemukan</h2>
          <Link href="/analyst/jobs">
            <Button className="mt-4">Kembali</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 p-4 md:p-10">
      <div className="mb-8 flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/analyst/jobs">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tight text-slate-900 leading-none">
              Preview Surat Tugas
            </h1>
            <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">
              {data.travelOrder.document_number}
            </p>
          </div>
        </div>

        <Button
          onClick={handleDownloadPdf}
          disabled={generatingPdf || !pdfDocument}
          className="h-10 rounded-xl bg-sky-700 px-6 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-sky-900/20 hover:bg-sky-800"
        >
          {generatingPdf ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="mr-2 h-3.5 w-3.5" />
          )}
          {generatingPdf ? "Processing..." : "Unduh PDF"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="overflow-hidden rounded-[2.5rem] bg-slate-900 p-1 shadow-2xl ring-8 ring-slate-100">
          <div className="relative aspect-[1/1.414] overflow-hidden rounded-[2.2rem] bg-white">
            {!pdfDocument ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
              </div>
            ) : (
              <PDFViewer className="h-full w-full border-none" showToolbar={false}>
                {pdfDocument}
              </PDFViewer>
            )}
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border border-sky-100 bg-sky-50 p-6">
          <div className="rounded-lg bg-sky-100 p-2">
            <FileText className="h-5 w-5 text-sky-700" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-sky-900">Sumber Dokumen</h4>
            <p className="mt-1 text-xs leading-relaxed text-sky-800/80">
              Preview ini dirender langsung dari data travel order terbaru agar isi surat tugas analis selalu sama
              dengan yang dilihat petugas sampling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
