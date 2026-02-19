"use client";

import React, { useState, lazy, Suspense, ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { ChemicalLoader } from "@/components/ui";

// Lazy load the PDF document component
const QuotationDocument = lazy(() => 
  import("@/components/pdf/QuotationDocument").then(mod => ({
    default: mod.QuotationDocument as ComponentType<any>
  }))
);

// Lazy load PDFDownloadLink
const LazyPDFDownloadLink = lazy(() =>
  import("@react-pdf/renderer").then((mod) => ({
    default: mod.PDFDownloadLink,
  }))
);

interface LazyPDFButtonProps {
  data: any;
  fileName: string;
  className?: string;
}

export function LazyPDFButton({ data, fileName, className = "" }: LazyPDFButtonProps) {
  return (
    <Suspense fallback={<ChemicalLoader size="sm" />}>
      <LazyPDFDownloadLink
        document={<QuotationDocument data={data} />}
        fileName={fileName}
      >
        {({ loading }) => (
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 text-emerald-600 hover:bg-emerald-50 font-bold text-[10px] ${className}`}
            disabled={loading}
          >
            {loading ? (
              <ChemicalLoader size="sm" />
            ) : (
              <>
                <FileDown className="h-3 w-3 mr-1" /> FAKTUR
              </>
            )}
          </Button>
        )}
      </LazyPDFDownloadLink>
    </Suspense>
  );
}

// Fallback component for loading state
export function PDFButtonFallback() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 text-emerald-600 hover:bg-emerald-50 font-bold text-[10px]"
      disabled
    >
      <ChemicalLoader size="sm" />
    </Button>
  );
}
