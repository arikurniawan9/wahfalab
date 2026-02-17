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

export default function TravelOrderPreviewPage() {
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

  if (loading || !travelOrder) {
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

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8 h-screen flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/admin/travel-orders/${params.id}`} className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Kembali</span>
        </Link>
        <Button
          onClick={handleDownloadPdf}
          disabled={generatingPdf}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Download className="h-4 w-4 mr-2" />
          {generatingPdf ? "Generating..." : "Download PDF"}
        </Button>
      </div>

      <div className="flex-1 border rounded-lg overflow-hidden">
        <PDFViewer className="w-full h-full" style={{ width: "100%", height: "100%" }}>
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
        </PDFViewer>
      </div>
    </div>
  );
}
