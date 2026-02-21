import { pdf } from "@react-pdf/renderer";
import { QuotationDocument } from "@/components/pdf/QuotationDocument";
import { getQuotationById } from "@/lib/actions/quotation";

export async function generateQuotationPDF(quotation: any): Promise<Blob> {
  try {
    const blob = await pdf(
      <QuotationDocument data={quotation} />
    ).toBlob();

    return blob;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Gagal membuat PDF penawaran");
  }
}

export async function downloadQuotationPDF(quotationOrId: any, filename?: string) {
  try {
    // If passed ID string, fetch the quotation data first
    const quotation = typeof quotationOrId === 'string' 
      ? await getQuotationById(quotationOrId)
      : quotationOrId;

    const blob = await generateQuotationPDF(quotation);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || `Penawaran-${quotation.quotation_number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    throw error;
  }
}
