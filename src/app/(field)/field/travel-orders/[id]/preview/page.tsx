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
import { Skeleton } from "@/components/ui/skeleton";

export default function FieldTravelOrderPreviewPage() {
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

      // Load company profile - use logo from public folder
      const defaultCompany = {
        company_name: 'WahfaLab',
        address: null,
        phone: null,
        email: null,
        logo_url: '/logo-wahfalab.png',
        tagline: null,
        npwp: null
      };

      try {
        const companyResponse = await fetch('/api/company-profile');
        if (companyResponse.ok) {
          const companyData = await companyResponse.json();
          
          let logoUrl = '/logo-wahfalab.png';
          if (companyData.logo_url && companyData.logo_url.startsWith('http')) {
            logoUrl = companyData.logo_url;
          }
          
          setCompanyProfile({
            company_name: companyData.company_name || 'WahfaLab',
            address: companyData.address || null,
            phone: companyData.phone || null,
            email: companyData.email || null,
            logo_url: logoUrl,
            tagline: companyData.tagline || null,
            npwp: companyData.npwp || null
          });
        } else {
          setCompanyProfile(defaultCompany);
        }
      } catch (error) {
        console.error('Failed to load company profile:', error);
        setCompanyProfile(defaultCompany);
      }
    } catch (error) {
      console.error('Failed to load travel order:', error);
      toast.error("Gagal memuat data surat tugas");
    } finally {
      setLoading(false);
    }
  }

  const handleDownloadPdf = async () => {
    if (!travelOrder) return;

    setGeneratingPdf(true);
    try {
      // Prepare data with null checks
      const fieldOfficer = travelOrder.assignment?.field_officer || {};
      const jobOrder = travelOrder.assignment?.job_order || {};
      const quotation = jobOrder.quotation || {};
      const profile = quotation.profile || {};
      const items = quotation.items || [];

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
              field_officer: {
                full_name: fieldOfficer.full_name,
                email: fieldOfficer.email
              },
              job_order: {
                tracking_code: jobOrder.tracking_code,
                quotation: {
                  quotation_number: quotation.quotation_number,
                  total_amount: quotation.total_amount,
                  profile: {
                    full_name: profile.full_name,
                    company_name: profile.company_name
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
              field_officer: {
                full_name: fieldOfficer.full_name,
                email: fieldOfficer.email
              },
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

      // Download both PDFs
      const mainBlob = await pdf(mainPdfDoc).toBlob();
      const attachmentBlob = await pdf(attachmentPdfDoc).toBlob();

      // Download main PDF
      const url = URL.createObjectURL(mainBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Surat_Tugas-${travelOrder.document_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Download attachment
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
      console.error('PDF generation error:', error);
      toast.error("Gagal membuat PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-10 max-w-7xl mx-auto">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-[600px] rounded-lg" />
      </div>
    );
  }

  if (!travelOrder) {
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
    <div className="p-4 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/field/assignments">
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
                    field_officer: {
                      full_name: travelOrder.assignment?.field_officer?.full_name,
                      email: travelOrder.assignment?.field_officer?.email
                    },
                    job_order: {
                      tracking_code: travelOrder.assignment?.job_order?.tracking_code,
                      quotation: {
                        quotation_number: travelOrder.assignment?.job_order?.quotation?.quotation_number,
                        total_amount: travelOrder.assignment?.job_order?.quotation?.total_amount,
                        profile: {
                          full_name: travelOrder.assignment?.job_order?.quotation?.profile?.full_name,
                          company_name: travelOrder.assignment?.job_order?.quotation?.profile?.company_name
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
                    field_officer: {
                      full_name: travelOrder.assignment?.field_officer?.full_name,
                      email: travelOrder.assignment?.field_officer?.email
                    },
                    job_order: {
                      tracking_code: travelOrder.assignment?.job_order?.tracking_code,
                      quotation: {
                        quotation_number: travelOrder.assignment?.job_order?.quotation?.quotation_number,
                        total_amount: travelOrder.assignment?.job_order?.quotation?.total_amount,
                        profile: {
                          full_name: travelOrder.assignment?.job_order?.quotation?.profile?.full_name,
                          company_name: travelOrder.assignment?.job_order?.quotation?.profile?.company_name
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
