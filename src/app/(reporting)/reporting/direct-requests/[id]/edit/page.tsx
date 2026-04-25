"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoadingOverlay } from "@/components/ui";
import { QuotationFormPage } from "@/components/admin/quotations/QuotationFormPage";
import { getClients } from "@/lib/actions/users";
import { getAllServices } from "@/lib/actions/services";
import { getAllOperationalCatalogs } from "@/lib/actions/operational-catalog";
import { getAllEquipment } from "@/lib/actions/equipment";
import { getQuotationById, updateQuotation } from "@/lib/actions/quotation";

function parseParameterSnapshot(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  if (typeof value !== "string") return [];

  const raw = value.trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "name" in item && typeof (item as any).name === "string") {
            return (item as any).name;
          }
          return "";
        })
        .filter((item) => item.trim().length > 0);
    }
  } catch {
    // Legacy format: comma-separated values
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function ReportingEditDirectQuotationPage() {
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
        const [clients, services, catalogs, equipment, currentQuotation] = await Promise.all([
          getClients(),
          getAllServices(),
          getAllOperationalCatalogs(),
          getAllEquipment(),
          getQuotationById(id)
        ]);

        const mappedData = {
          ...currentQuotation,
          items: (currentQuotation?.items || []).map((item: any) => ({
            service_id: item.service?.id || null,
            equipment_id: item.equipment?.id || null,
            qty: Number(item.qty || 1),
            price: Number(item.price_snapshot || 0),
            name: item.equipment?.name || item.service?.name || "",
            parameters: parseParameterSnapshot(item.parameter_snapshot),
          })),
        };

        setMasterData({
          clients,
          services,
          operationalCatalogs: catalogs,
          equipment,
          initialData: mappedData
        });
      } catch (error) {
        toast.error("Gagal memuat data penawaran");
        router.push("/reporting/direct-requests");
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
      if ((result as any)?.success) {
        toast.success("Penawaran berhasil diperbarui");
        router.push("/reporting/direct-requests");
        router.refresh();
      }
    } catch (error) {
      toast.error("Gagal memperbarui penawaran");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingOverlay isOpen={true} title="Menyiapkan editor penawaran..." />;
  }

  return (
    <QuotationFormPage
      title={`Edit Direct LHU: ${masterData.initialData?.quotation_number || ""}`}
      initialData={masterData.initialData}
      clients={masterData.clients}
      services={masterData.services}
      operationalCatalogs={masterData.operationalCatalogs}
      equipment={masterData.equipment}
      nextQuotationNumber={masterData.initialData?.quotation_number || ""}
      onSubmit={handleSubmit}
      isSubmitting={submitting}
    />
  );
}
