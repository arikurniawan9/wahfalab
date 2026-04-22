"use client";

import React, { useState, useEffect } from "react";
import { QuotationFormPage } from "@/components/admin/quotations/QuotationFormPage";
import { getClients } from "@/lib/actions/users";
import { getAllServices } from "@/lib/actions/services";
import { getAllOperationalCatalogs } from "@/lib/actions/operational-catalog";
import { getAllEquipment } from "@/lib/actions/equipment";
import { updateQuotation, getQuotationById } from "@/lib/actions/quotation";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { LoadingOverlay } from "@/components/ui";

export default function EditQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [masterData, setMasterData] = useState<any>({
    clients: [],
    services: [],
    operationalCatalogs: [],
    equipment: [],
    initialData: null
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [clients, services, catalogs, equip, currentQuo] = await Promise.all([
          getClients(),
          getAllServices(),
          getAllOperationalCatalogs(),
          getAllEquipment(),
          getQuotationById(id)
        ]);

        // Map initial data correctly for the form
        const mappedData = {
           ...currentQuo,
           items: currentQuo.items.map((item: any) => ({
              service_id: item.service?.id || null,
              equipment_id: item.equipment?.id || null,
              qty: item.qty,
              price: item.price_snapshot,
              name: item.equipment?.name || item.service?.name,
              parameters: item.parameter_snapshot ? (typeof item.parameter_snapshot === 'string' ? JSON.parse(item.parameter_snapshot) : item.parameter_snapshot) : []
           }))
        };

        setMasterData({
          clients,
          services,
          operationalCatalogs: catalogs,
          equipment: equip,
          initialData: mappedData
        });
      } catch (error) {
        toast.error("Gagal memuat data penawaran");
        router.push("/admin/quotations");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, router]);

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      const result = await updateQuotation(id, data);
      if (result.success) {
        toast.success("Penawaran berhasil diperbarui");
        router.push("/admin/quotations");
        router.refresh();
      }
    } catch (error) {
      toast.error("Gagal memperbarui penawaran");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingOverlay isOpen={true} title="Menyiapkan Editor..." />;

  return (
    <QuotationFormPage 
      title={`Edit Penawaran: ${masterData.initialData?.quotation_number}`}
      initialData={masterData.initialData}
      clients={masterData.clients}
      services={masterData.services}
      operationalCatalogs={masterData.operationalCatalogs}
      equipment={masterData.equipment}
      nextQuotationNumber={masterData.initialData?.quotation_number}
      onSubmit={handleSubmit}
      isSubmitting={submitting}
    />
  );
}
