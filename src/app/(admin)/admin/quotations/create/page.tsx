"use client";

import React, { useState, useEffect } from "react";
import { QuotationFormPage } from "@/components/admin/quotations/QuotationFormPage";
import { getClients } from "@/lib/actions/users";
import { getAllServices } from "@/lib/actions/services";
import { getAllOperationalCatalogs } from "@/lib/actions/operational-catalog";
import { getAllEquipment } from "@/lib/actions/equipment";
import { createQuotation, getNextInvoiceNumber } from "@/lib/actions/quotation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LoadingOverlay } from "@/components/ui";

export default function CreateQuotationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [masterData, setMasterData] = useState<any>({
    clients: [],
    services: [],
    operationalCatalogs: [],
    equipment: [],
    nextQuotationNumber: ""
  });

  useEffect(() => {
    async function loadMasterData() {
      try {
        const [clients, services, catalogs, equip, nextNum] = await Promise.all([
          getClients(),
          getAllServices(),
          getAllOperationalCatalogs(),
          getAllEquipment(),
          getNextInvoiceNumber()
        ]);
        setMasterData({
          clients,
          services,
          operationalCatalogs: catalogs,
          equipment: equip,
          nextQuotationNumber: nextNum
        });
      } catch (error) {
        toast.error("Gagal memuat data referensi");
      } finally {
        setLoading(false);
      }
    }
    loadMasterData();
  }, []);

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      const result = await createQuotation(data);
      if (result.success) {
        toast.success("Penawaran berhasil disimpan");
        router.push("/admin/quotations");
        router.refresh();
      }
    } catch (error) {
      toast.error("Gagal menyimpan penawaran");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingOverlay isOpen={true} title="Memuat Workspace..." />;

  return (
    <QuotationFormPage 
      title="Buat Penawaran Baru"
      clients={masterData.clients}
      services={masterData.services}
      operationalCatalogs={masterData.operationalCatalogs}
      equipment={masterData.equipment}
      nextQuotationNumber={masterData.nextQuotationNumber}
      onSubmit={handleSubmit}
      isSubmitting={submitting}
    />
  );
}
