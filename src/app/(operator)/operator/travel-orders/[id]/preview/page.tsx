"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTravelOrderById } from "@/lib/actions/travel-order";
import { pdf, PDFViewer } from "@react-pdf/renderer";
import { TravelOrderPDF } from "@/components/pdf/TravelOrderPDF";
import { TravelOrderAttachment } from "@/components/pdf/TravelOrderAttachment";
import { OPERATOR_LOADING_COPY, PROCESSING_TEXT } from "@/lib/constants/loading";
import { OPERATOR_EMPTY_TEXT, OPERATOR_TOAST_TEXT } from "@/lib/constants/operator-copy";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { ChemicalLoader, LoadingOverlay } from "@/components/ui";

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

      // Load company profile - use simpler approach
      const defaultCompany = {
        company_name: 'Perusahaan',
        address: null,
        phone: null,
        email: null,
        logo_url: null,
        tagline: null,
        npwp: null
      };

      try {
        const companyResponse = await fetch('/api/company-profile');
        if (companyResponse.ok) {
          const companyData = await companyResponse.json();
          
          setCompanyProfile({
            company_name: companyData.company_name?.trim() || 'Perusahaan',
            address: companyData.address || null,
            phone: companyData.phone || null,
            email: companyData.email || null,
            logo_url: companyData.logo_url || null,
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
      toast.error(OPERATOR_TOAST_TEXT.travelOrderLoadFailed);
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
            quotation_title: quotation.title,
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
                }              }
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
            quotation_title: quotation.title,
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

      toast.success(OPERATOR_TOAST_TEXT.travelOrderDownloadSuccess);
    } catch (error) {
      toast.error(OPERATOR_TOAST_TEXT.pdfGenerateFailed);
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return <ChemicalLoader fullScreen />;
  }

  if (!travelOrder) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-600">{OPERATOR_EMPTY_TEXT.travelOrderNotFound}</h2>
          <Link href="/operator/jobs">
            <Button className="mt-4">Kembali</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10">
      <OperatorPageHeader
        icon={FileText}
        title="Pratinjau Surat Tugas"
        description="Preview dan unduh dokumen perjalanan dinas"
        statsLabel="No Dokumen"
        statsValue={travelOrder.document_number || "-"}
        className="mb-6"
        actions={(
          <div className="flex items-center gap-2">
            <Link href="/operator/jobs">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 hover:bg-white/20 text-white rounded-xl h-9 px-4 backdrop-blur-md transition-all text-xs font-bold">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Kembali
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white rounded-xl h-9 px-4 backdrop-blur-md transition-all text-xs font-bold"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {generatingPdf ? PROCESSING_TEXT : "Unduh PDF"}
            </Button>
          </div>
        )}
      />

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
      <LoadingOverlay isOpen={generatingPdf} title={OPERATOR_LOADING_COPY.title} description={OPERATOR_LOADING_COPY.description} variant="transparent" />
    </div>
  );
}


