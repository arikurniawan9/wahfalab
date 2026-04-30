"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  getQuotations, 
  deleteQuotation, 
  createQuotation, 
  cloneQuotation,
  updateQuotationStatus,
  publishInvoiceRequest,
  sendQuotationToReportingDirect
} from "@/lib/actions/quotation";
import { getClients, createOrUpdateUser } from "@/lib/actions/users";
import { getProfile } from "@/lib/actions/auth";
import { getAllServices } from "@/lib/actions/services";
import { getAllOperationalCatalogs } from "@/lib/actions/operational-catalog";
import { getAllEquipment } from "@/lib/actions/equipment";
import { toast } from "sonner";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { QuotationTable } from "@/components/operator/quotations/QuotationTable";
import { QuotationForm } from "@/components/operator/quotations/QuotationForm";
import { OPERATOR_TOAST_TEXT } from "@/lib/constants/operator-copy";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Clock,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function OperatorQuotationListPage() {
  const router = useRouter();
  
  // Data State
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [operationalCatalogs, setOperationalCatalogs] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  // UI State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [publishingInvoice, setPublishingInvoice] = useState(false);
  const [sendingToReportingId, setSendingToReportingId] = useState<string | null>(null);

  // Load Data
  const loadReferenceData = useCallback(async () => {
    try {
      const [cResult, sResult, oResult, eResult, prof] = await Promise.all([
        getClients(),
        getAllServices(),
        getAllOperationalCatalogs(),
        getAllEquipment(),
        getProfile()
      ]);
      setClients(cResult);
      setServices(sResult);
      setOperationalCatalogs(oResult);
      setEquipment(eResult);
      setUserProfile(prof);
    } catch (error) {
      toast.error(OPERATOR_TOAST_TEXT.syncFailed);
    }
  }, []);

  const loadQuotationsData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const qResult = await getQuotations({ page, limit, search, status: filterStatus });
      setData(qResult);
    } catch (error) {
      toast.error(OPERATOR_TOAST_TEXT.syncFailed);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, search, filterStatus]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    loadQuotationsData();
  }, [loadQuotationsData]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), 500);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Handlers
  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateQuotationStatus(id, status);
      toast.success("Status diperbarui");
      loadQuotationsData(true);
    } catch (error) { toast.error("Gagal update status"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus penawaran ini secara permanen?")) return;
    try {
      await deleteQuotation(id, userProfile?.id, userProfile?.role);
      toast.success("Penawaran dihapus");
      loadQuotationsData(true);
    } catch (error) { toast.error("Gagal menghapus"); }
  };

  const handleClone = async (id: string) => {
    try {
      await cloneQuotation(id);
      toast.success("Penawaran diduplikasi");
      loadQuotationsData(true);
    } catch (error) { toast.error("Gagal menduplikasi"); }
  };

  const handlePublishInvoice = async (id: string) => {
    setPublishingInvoice(true);
    try {
      const res = await publishInvoiceRequest(id);
      if (res.error) throw new Error(res.error);
      toast.success("Permintaan invoice diterbitkan");
      loadQuotationsData(true);
    } catch (error: any) { toast.error(error.message); }
    finally { setPublishingInvoice(false); }
  };

  const handleSendToReporting = async (id: string) => {
    setSendingToReportingId(id);
    try {
      await sendQuotationToReportingDirect(id);
      toast.success("Dikirim ke reporting direct");
      loadQuotationsData(true);
    } catch (error) { toast.error("Gagal mengirim"); }
    finally { setSendingToReportingId(null); }
  };

  const handleFormSubmit = async (formData: any) => {
    setSubmitting(true);
    try {
      const res = await createQuotation(formData);
      if (res.success) {
        toast.success("Penawaran berhasil dibuat");
        setIsFormOpen(false);
        loadQuotationsData(true);
      }
    } catch (error) { toast.error("Gagal membuat penawaran"); }
    finally { setSubmitting(false); }
  };

  const stats = useMemo(() => {
    // In a real app, these would come from the API
    return [
      { label: "DRAFT / SENT", value: data.statusCounts?.draft || 0, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
      { label: "DITERIMA", value: data.statusCounts?.accepted || 0, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
      { label: "DITOLAK", value: data.statusCounts?.rejected || 0, icon: XCircle, color: "text-rose-600", bg: "bg-rose-50" },
      { label: "LUNAS", value: data.statusCounts?.paid || 0, icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
    ];
  }, [data.statusCounts]);

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      <OperatorPageHeader 
        icon={FileText}
        title="Manajemen Penawaran" 
        description="Kelola seluruh dokumen penawaran harga klien secara terpusat."
        actions={
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="h-12 bg-white text-emerald-900 hover:bg-emerald-50 font-black uppercase text-[10px] tracking-widest gap-2 rounded-xl shadow-lg shadow-emerald-950/20"
          >
            <Plus className="h-4 w-4" /> BUAT PENAWARAN BARU
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden group hover:translate-y-[-4px] transition-all bg-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
              </div>
              <div className={cn("p-4 rounded-2xl transition-all group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <QuotationTable 
        data={data}
        loading={loading}
        refreshing={refreshing}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onRefresh={() => loadQuotationsData(true)}
        onStatusUpdate={handleStatusUpdate}
        onDelete={handleDelete}
        onClone={handleClone}
        onPublishInvoice={handlePublishInvoice}
        onSendToReporting={handleSendToReporting}
        publishingInvoice={publishingInvoice}
        sendingToReportingId={sendingToReportingId}
      />

      <QuotationForm 
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        submitting={submitting}
        clients={clients}
        services={services}
        equipment={equipment}
        operationalCatalogs={operationalCatalogs}
        clientsLoading={false}
        servicesLoading={false}
        onAddClient={() => router.push("/operator/users")}
      />
    </div>
  );
}
