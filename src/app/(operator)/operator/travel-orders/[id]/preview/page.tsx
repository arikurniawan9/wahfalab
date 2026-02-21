"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { getTravelOrderById } from "@/lib/actions/travel-order";
import { pdf, PDFViewer } from "@react-pdf/renderer";
import { TravelOrderPDF } from "@/components/pdf/TravelOrderPDF";
import { TravelOrderAttachment } from "@/components/pdf/TravelOrderAttachment";

export default function OperatorTravelOrderPreviewPage() {
  const params = useParams();
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
              field_officer: travelOrder.assignment?.field_officer,
              job_order: {
                tracking_code: travelOrder.assignment?.job_order?.tracking_code,
                quotation: {
                  quotation_number: travelOrder.assignment?.job_order?.quotation?.quotation_number,
                  profile: {
                    full_name: travelOrder.assignment?.job_order?.quotation?.profile?.full_name,
                    company_name: travelOrder.assignment?.job_order?.quotation?.profile?.company_name,
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
              field_officer: travelOrder.assignment?.field_officer,
              job_order: {
                tracking_code: travelOrder.assignment?.job_order?.tracking_code,
                quotation: {
                  quotation_number: travelOrder.assignment?.job_order?.quotation?.quotation_number,
                  total_amount: travelOrder.assignment?.job_order?.quotation?.total_amount,
                  profile: {
                    full_name: travelOrder.assignment?.job_order?.quotation?.profile?.full_name,
                    company_name: travelOrder.assignment?.job_order?.quotation?.profile?.company_name,
                  },
                  items: travelOrder.assignment?.job_order?.quotation?.items || []
                }
              }
            },
            created_at: travelOrder.created_at,
          }}
          company={companyProfile}
        />
      );

      // Merge both PDFs
      const mainBlob = await pdf(mainPdfDoc).toBlob();
      const attachmentBlob = await pdf(attachmentPdfDoc).toBlob();
      
      // Create combined PDF (for now, download separately)
      const url = URL.createObjectURL(mainBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Surat_Tugas-${travelOrder.document_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Also download attachment
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
      toast.error("Gagal membuat PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Memuat surat tugas...</p>
        </div>
      </div>
    );
  }

  if (!travelOrder) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-600">Surat tugas tidak ditemukan</h2>
          <Link href="/operator/jobs">
            <Button className="mt-4">Kembali</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/operator/jobs">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
          >
            <Download className="mr-2 h-4 w-4" />
            {generatingPdf ? "Mengunduh..." : "Unduh PDF"}
          </Button>
        </div>
      </div>

      {/* PDF Preview - Main Document */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-6">
        <div className="p-4 border-b bg-emerald-50/5">
          <h1 className="text-xl font-bold text-emerald-900">Surat Tugas Perjalanan Dinas</h1>
          <p className="text-sm text-slate-500 mt-1">{travelOrder.document_number}</p>
        </div>
        <div className="p-6">
          <div className="aspect-[1/1.414] w-full max-w-4xl mx-auto">
            <PDFViewer className="w-full h-full rounded-lg border border-slate-200">
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
                    field_officer: travelOrder.assignment?.field_officer,
                    job_order: {
                      tracking_code: travelOrder.assignment?.job_order?.tracking_code,
                      quotation: {
                        quotation_number: travelOrder.assignment?.job_order?.quotation?.quotation_number,
                        total_amount: travelOrder.assignment?.job_order?.quotation?.total_amount,
                        profile: {
                          full_name: travelOrder.assignment?.job_order?.quotation?.profile?.full_name,
                          company_name: travelOrder.assignment?.job_order?.quotation?.profile?.company_name,
                        }
                      }
                    }
                  },
                  created_at: travelOrder.created_at,
                }}
                company={companyProfile}
              />
            </PDFViewer>
          </div>
        </div>
      </div>

      {/* PDF Preview - Attachment */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b bg-amber-50/5">
          <h1 className="text-xl font-bold text-amber-900">Lampiran - Daftar Pengujian</h1>
          <p className="text-sm text-slate-500 mt-1">Detail job order dan daftar pengujian</p>
        </div>
        <div className="p-6">
          <div className="aspect-[1/1.414] w-full max-w-4xl mx-auto">
            <PDFViewer className="w-full h-full rounded-lg border border-slate-200">
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
                    field_officer: travelOrder.assignment?.field_officer,
                    job_order: {
                      tracking_code: travelOrder.assignment?.job_order?.tracking_code,
                      quotation: {
                        quotation_number: travelOrder.assignment?.job_order?.quotation?.quotation_number,
                        total_amount: travelOrder.assignment?.job_order?.quotation?.total_amount,
                        profile: {
                          full_name: travelOrder.assignment?.job_order?.quotation?.profile?.full_name,
                          company_name: travelOrder.assignment?.job_order?.quotation?.profile?.company_name,
                        },
                        items: travelOrder.assignment?.job_order?.quotation?.items || []
                      }
                    }
                  },
                  created_at: travelOrder.created_at,
                }}
                company={companyProfile}
              />
            </PDFViewer>
          </div>
        </div>
      </div>
    </div>
  );
}
