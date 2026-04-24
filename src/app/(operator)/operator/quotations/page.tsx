// ============================================================================
// PREMIUM QUOTATIONS MANAGEMENT - v3.7 (DYNAMIC PARAMETERS)
// Optimized for speed, precision, and dynamic lab parameter management.
// ============================================================================

"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  MoreVertical,
  Eye,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  DollarSign,
  Truck,
  Wrench,
  Copy,
  MapPin,
  Car,
  X,
  Clock,
  Check,
  AlertCircle,
  RefreshCw,
  Filter,
  Layers,
  Printer,
  ArrowRight,
  Lock,
  Beaker,
  Calendar,
  Send,
  ChevronsUpDown
} from "lucide-react";
import { ChemicalLoader, LoadingOverlay, LoadingButton } from "@/components/ui";
import { 
  getQuotations, 
  deleteQuotation, 
  createQuotation, 
  getNextInvoiceNumber,
  cloneQuotation,
  updateQuotationStatus,
  publishInvoiceRequest
  } from "@/lib/actions/quotation";
import { getClients, createOrUpdateUser } from "@/lib/actions/users";
import { getProfile } from "@/lib/actions/auth";
import { getAllServices } from "@/lib/actions/services";
import { getAllOperationalCatalogs } from "@/lib/actions/operational-catalog";
import { getAllEquipment } from "@/lib/actions/equipment";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LOADING_COPY, PROCESSING_TEXT } from "@/lib/constants/loading";
import { OPERATOR_EMPTY_TEXT, OPERATOR_TOAST_TEXT } from "@/lib/constants/operator-copy";

const quotationSchema = z.object({
  quotation_number: z.string().min(1, "Nomor penawaran wajib diisi"),
  sampling_location: z.string().optional().nullable(),
  user_id: z.string().min(1, "Pilih pelanggan"),
  use_tax: z.boolean().default(true),
  discount_amount: z.coerce.number().default(0),
  perdiem_name: z.string().optional().nullable(),
  perdiem_price: z.coerce.number().default(0),
  perdiem_qty: z.coerce.number().default(0),
  transport_name: z.string().optional().nullable(),
  transport_price: z.coerce.number().default(0),
  transport_qty: z.coerce.number().default(0),
  items: z.array(z.object({
    service_id: z.string().optional().nullable(),
    equipment_id: z.string().optional().nullable(),
    qty: z.coerce.number().default(1),
    price: z.coerce.number().default(0),
    name: z.string().optional().nullable(),
    parameters: z.array(z.string()).optional(),
  })).default([]),
});

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  draft: { label: 'DRAFT', color: 'text-slate-600', bg: 'bg-slate-100', icon: FileText },
  sent: { label: 'DIKIRIM', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock },
  accepted: { label: 'DITERIMA', color: 'text-emerald-600', bg: 'bg-emerald-100', icon: CheckCircle },
  rejected: { label: 'DITOLAK', color: 'text-rose-600', bg: 'bg-rose-100', icon: XCircle },
  paid: { label: 'LUNAS', color: 'text-purple-600', bg: 'bg-purple-100', icon: DollarSign }
};

function getSearchScore(text: string, query: string) {
  const source = text.toLowerCase();
  const target = query.toLowerCase();
  if (!target) return 1;
  if (source === target) return 120;
  if (source.startsWith(target)) return 90;
  if (source.includes(` ${target}`)) return 70;
  if (source.includes(target)) return 50;
  return 0;
}

export default function OperatorQuotationListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [operationalCatalogs, setOperationalCatalogs] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPerdiemDialogOpen, setIsPerdiemDialogOpen] = useState(false);
  const [isTransportDialogOpen, setIsTransportDialogOpen] = useState(false);
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [publishingInvoice, setPublishingInvoice] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmInvoiceQuotationId, setConfirmInvoiceQuotationId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isClientPopoverOpen, setIsClientPopoverOpen] = useState(false);
  const [openServiceIndex, setOpenServiceIndex] = useState<number | null>(null);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [clientDebouncedQuery, setClientDebouncedQuery] = useState("");
  const [serviceSearchQueries, setServiceSearchQueries] = useState<Record<number, string>>({});
  const [serviceDebouncedQueries, setServiceDebouncedQueries] = useState<Record<number, string>>({});
  const clientSearchInputRef = useRef<HTMLInputElement | null>(null);
  const serviceSearchInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const selectedClientItemRef = useRef<HTMLDivElement | null>(null);
  const selectedServiceItemRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const serviceDebounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const clientDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedQuotationRef = useRef(false);

  const { register, control, handleSubmit, setValue, getValues, reset, formState: { errors } } = useForm({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      quotation_number: "INV-",
      sampling_location: "",
      user_id: "",
      use_tax: true,
      discount_amount: 0,
      perdiem_name: "",
      perdiem_price: 0,
      perdiem_qty: 0,
      transport_name: "",
      transport_price: 0,
      transport_qty: 0,
      items: [{ service_id: "", equipment_id: "", qty: 1, price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const watchedUserId = useWatch({ control, name: "user_id" });
  const watchedItems = useWatch({ control, name: "items" }) || [];
  const watchedUseTax = useWatch({ control, name: "use_tax" });
  const watchedDiscount = Number(useWatch({ control, name: "discount_amount" }) || 0);
  const watchedPerdiemPrice = useWatch({ control, name: "perdiem_price" }) || 0;
  const watchedPerdiemQty = useWatch({ control, name: "perdiem_qty" }) || 0;
  const watchedTransportPrice = useWatch({ control, name: "transport_price" }) || 0;
  const watchedTransportQty = useWatch({ control, name: "transport_qty" }) || 0;

  const hasClientSelected = !!watchedUserId;
  const hasValidService = watchedItems.some(item => item?.service_id && Number(item?.price) > 0);
  const hasFieldCostsFilled = (Number(watchedPerdiemPrice) > 0 && Number(watchedPerdiemQty) > 0) || (Number(watchedTransportPrice) > 0 && Number(watchedTransportQty) > 0);
  const isFormValid = hasClientSelected && hasValidService && hasFieldCostsFilled;

  const totals = useMemo(() => {
    const itemsSubtotal = watchedItems.reduce((acc: number, item: any) => acc + (Number(item?.qty || 0) * Number(item?.price || 0)), 0);
    const perdiemTotal = Number(watchedPerdiemPrice) * Number(watchedPerdiemQty);
    const transportTotal = Number(watchedTransportPrice) * Number(watchedTransportQty);
    const subtotalBeforeDiscount = itemsSubtotal + perdiemTotal + transportTotal;
    const subtotal = subtotalBeforeDiscount - Number(watchedDiscount);
    const taxAmount = watchedUseTax ? subtotal * 0.11 : 0;
    const grandTotal = subtotal + taxAmount;

    return { subtotalBeforeDiscount, taxAmount, grandTotal };
  }, [watchedItems, watchedUseTax, watchedDiscount, watchedPerdiemPrice, watchedPerdiemQty, watchedTransportPrice, watchedTransportQty]);

  const loadReferenceData = useCallback(async () => {
    setClientsLoading(true);
    setServicesLoading(true);
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
    } catch (error: any) {
      toast.error(OPERATOR_TOAST_TEXT.syncFailed);
    } finally {
      setClientsLoading(false);
      setServicesLoading(false);
    }
  }, []);

  const loadQuotationsData = useCallback(async (showRefreshToast = false) => {
    if (!hasLoadedQuotationRef.current) setLoading(true);
    else setRefreshing(true);

    try {
      const qResult = await getQuotations(page, limit, search);
      setData(qResult);
      hasLoadedQuotationRef.current = true;
      if (showRefreshToast) toast.success(OPERATOR_TOAST_TEXT.dataUpdated);
    } catch (error: any) {
      toast.error(OPERATOR_TOAST_TEXT.syncFailed);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    loadQuotationsData();
    const interval = setInterval(() => loadQuotationsData(), 60000);
    return () => { clearInterval(interval); };
  }, [loadQuotationsData]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    if (isDialogOpen) {
      getNextInvoiceNumber().then(num => setValue("quotation_number", num));
    }
  }, [isDialogOpen, setValue]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isDialogOpen || !event.altKey) return;
      const key = event.key.toLowerCase();

      if (key === "k") {
        event.preventDefault();
        setIsClientPopoverOpen(true);
        setTimeout(() => clientSearchInputRef.current?.focus(), 0);
      }

      if (key === "n") {
        event.preventDefault();
        const items = (getValues("items") || []) as Array<{ equipment_id?: string; service_id?: string }>;
        const candidateIndex = items.findIndex((item) => !item?.equipment_id && !item?.service_id);
        const targetIndex = candidateIndex === -1 ? items.length : candidateIndex;

        if (candidateIndex === -1) {
          append({ service_id: "", equipment_id: "", qty: 1, price: 0 });
        }

        setOpenServiceIndex(targetIndex);
        setTimeout(() => serviceSearchInputRefs.current[targetIndex]?.focus(), 0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [append, getValues, isDialogOpen]);

  const highlightSearchMatch = (text: string, query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return text;

    const source = text || "";
    const lowerSource = source.toLowerCase();
    const lowerQuery = trimmed.toLowerCase();
    const matchIndex = lowerSource.indexOf(lowerQuery);

    if (matchIndex === -1) return source;

    const before = source.slice(0, matchIndex);
    const match = source.slice(matchIndex, matchIndex + trimmed.length);
    const after = source.slice(matchIndex + trimmed.length);

    return (
      <>
        {before}
        <span className="bg-emerald-100 text-emerald-800 rounded px-0.5">{match}</span>
        {after}
      </>
    );
  };

  const handleServiceChange = (index: number, serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setValue(`items.${index}.service_id`, serviceId);
      setValue(`items.${index}.price`, Number(service.price));
      if (service.parameters) {
        try {
          const params = typeof service.parameters === 'string' ? JSON.parse(service.parameters) : service.parameters;
          const paramNames = Array.isArray(params) ? params.map((p: any) => p.name || p.parameter) : [];
          setValue(`items.${index}.parameters`, paramNames);
        } catch (e) { setValue(`items.${index}.parameters`, []); }
      } else { setValue(`items.${index}.parameters`, []); }
    }
  };

  const removeParameter = (itemIndex: number, paramIndex: number) => {
    const currentParams = getValues(`items.${itemIndex}.parameters`) || [];
    const updatedParams = currentParams.filter((_: any, i: number) => i !== paramIndex);
    setValue(`items.${itemIndex}.parameters`, updatedParams);
  };

  const onSubmit = (formData: any) => {
    setPendingFormData(formData);
    setIsSaveConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingFormData) return;
    setIsSaveConfirmOpen(false);
    setSubmitting(true);
    try {
      const result = await createQuotation({
        ...pendingFormData,
        subtotal: totals.subtotalBeforeDiscount,
        tax_amount: totals.taxAmount,
        total_amount: totals.grandTotal
      });
      if (result.success) {
        toast.success("Penawaran Disimpan (DRAFT)");
        setIsDialogOpen(false);
        reset();
        loadQuotationsData();
      }
    } catch (error: any) { toast.error("Gagal menyimpan penawaran"); }
    finally { setSubmitting(false); }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateQuotationStatus(id, status);
      toast.success("Status diperbarui");
      loadQuotationsData();
    } catch (error: any) { toast.error("Gagal update status"); }
  };

  const handlePublishInvoiceRequest = async (quotationId: string) => {
    try {
      setPublishingInvoice(true);
      const result = await publishInvoiceRequest(quotationId);
      if (result.error) throw new Error(result.error);
      toast.success(result.invoiceCreated ? "Invoice draft tersedia untuk finance" : "Permintaan invoice dikirim ke finance");
       loadQuotationsData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menerbitkan permintaan invoice");
    } finally {
      setPublishingInvoice(false);
      setConfirmInvoiceQuotationId(null);
    }
  };

  const [customerData, setCustomerData] = useState({ full_name: "", email: "", company_name: "", address: "", password: "123456" });
  const handleCreateCustomer = async () => {
    if (!customerData.full_name || !customerData.email) return toast.error("Nama dan Email wajib diisi");
    setSubmitting(true);
    try {
      await createOrUpdateUser({ ...customerData, role: 'client' });
      toast.success("Customer baru berhasil ditambahkan");
      setIsCustomerDialogOpen(false);
      const cResult = await getClients();
      setClients(cResult);
      setCustomerData({ full_name: "", email: "", company_name: "", address: "", password: "123456" });
    } catch (error: any) { toast.error("Gagal menambahkan customer"); }
    finally { setSubmitting(false); }
  };

  const filteredItems = useMemo(() => {
    let filtered = [...data.items];
    if (filterStatus !== "all") filtered = filtered.filter(item => item.status === filterStatus);
    return filtered;
  }, [data.items, filterStatus]);

  const stats = useMemo(() => ({
    total: data.total,
    draft: data.items.filter((i: any) => i.status === 'draft' || i.status === 'sent').length,
    accepted: data.items.filter((i: any) => i.status === 'accepted').length,
    rejected: data.items.filter((i: any) => i.status === 'rejected').length,
    paid: data.items.filter((i: any) => i.status === 'paid').length,
  }), [data]);

  const perdiemCatalogs = useMemo(
    () => operationalCatalogs.filter((catalog: any) => catalog.category === "perdiem"),
    [operationalCatalogs]
  );
  const transportCatalogs = useMemo(
    () => operationalCatalogs.filter((catalog: any) => catalog.category === "transport"),
    [operationalCatalogs]
  );

  const filteredClients = useMemo(() => {
    const query = clientDebouncedQuery.trim().toLowerCase();
    if (!query) return clients;
    return [...clients]
      .map((client) => {
        const name = client.full_name || "";
        const company = client.company_name || "";
        const score = Math.max(getSearchScore(name, query), getSearchScore(company, query));
        return { client, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || (a.client.full_name || "").localeCompare(b.client.full_name || ""))
      .map((entry) => entry.client);
  }, [clients, clientDebouncedQuery]);

  const getFilteredServices = useCallback((index: number) => {
    const query = (serviceDebouncedQueries[index] || "").trim().toLowerCase();
    if (!query) return services;
    return [...services]
      .map((service) => {
        const name = service.name || "";
        const category = service.category_ref?.name || service.category || "";
        const score = Math.max(getSearchScore(name, query), getSearchScore(category, query));
        return { service, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || (a.service.name || "").localeCompare(b.service.name || ""))
      .map((entry) => entry.service);
  }, [services, serviceDebouncedQueries]);

  const CommandListSkeleton = ({ count = 5 }: { count?: number }) => (
    <div className="p-3 space-y-2">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="rounded-xl border border-slate-100 p-3">
          <Skeleton className="h-3.5 w-2/3 rounded" />
          <Skeleton className="mt-2 h-2.5 w-1/3 rounded" />
        </div>
      ))}
    </div>
  );

  useEffect(() => {
    if (searchParams.get("create") !== "1") return;
    reset();
    setIsDialogOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("create");
    const nextUrl = params.toString() ? `/operator/quotations?${params.toString()}` : "/operator/quotations";
    router.replace(nextUrl);
  }, [reset, router, searchParams]);

  useEffect(() => {
    if (clientDebounceTimer.current) clearTimeout(clientDebounceTimer.current);
    clientDebounceTimer.current = setTimeout(() => {
      setClientDebouncedQuery(clientSearchQuery);
    }, 180);
    return () => {
      if (clientDebounceTimer.current) clearTimeout(clientDebounceTimer.current);
    };
  }, [clientSearchQuery]);

  useEffect(() => {
    if (!isClientPopoverOpen) return;
    const timeout = setTimeout(() => {
      clientSearchInputRef.current?.focus();
      selectedClientItemRef.current?.scrollIntoView({ block: "nearest" });
    }, 0);
    return () => clearTimeout(timeout);
  }, [isClientPopoverOpen, watchedUserId, filteredClients.length]);

  useEffect(() => {
    if (openServiceIndex === null) return;
    const timeout = setTimeout(() => {
      serviceSearchInputRefs.current[openServiceIndex]?.focus();
      selectedServiceItemRefs.current[openServiceIndex]?.scrollIntoView({ block: "nearest" });
    }, 0);
    return () => clearTimeout(timeout);
  }, [openServiceIndex, watchedItems]);

  if (loading) return <ChemicalLoader fullScreen />;

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 max-w-7xl mx-auto space-y-10 bg-slate-50/30">
      <OperatorPageHeader
        icon={FileText}
        title="Manajemen Penawaran"
        description="Kelola penawaran harga digital laboratorium"
        statsLabel="Total Penawaran"
        statsValue={data.total}
        onRefresh={() => loadQuotationsData(true)}
        refreshing={refreshing}
        actions={(
          <Button onClick={() => { reset(); setIsDialogOpen(true); }} className="bg-white/10 border border-white/20 hover:bg-white/20 text-white h-9 px-4 rounded-xl shadow-none font-bold text-[10px] uppercase tracking-widest">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Baru
          </Button>
        )}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Order" value={stats.total} icon={Layers} color="emerald" active={filterStatus === "all"} onClick={() => setFilterStatus("all")} />
        <StatCard title="Draft" value={stats.draft} icon={FileText} color="amber" active={filterStatus === "draft"} onClick={() => setFilterStatus("draft")} />
        <StatCard title="Diterima" value={stats.accepted} icon={CheckCircle} color="blue" active={filterStatus === "accepted"} onClick={() => setFilterStatus("accepted")} />
        <StatCard title="Ditolak" value={stats.rejected} icon={XCircle} color="red" active={filterStatus === "rejected"} onClick={() => setFilterStatus("rejected")} />
        <StatCard title="Lunas" value={stats.paid} icon={DollarSign} color="purple" active={filterStatus === "paid"} onClick={() => setFilterStatus("paid")} />
      </div>

      {/* Main Table Container */}
      <Card className="border-none shadow-2xl shadow-emerald-900/5 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="p-4 md:p-8 border-b bg-slate-50/50 flex flex-col md:flex-row gap-4 md:gap-6 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
              <input placeholder="Cari nomor penawaran..." value={searchInput} onChange={(e) => { setSearchInput(e.target.value); setPage(1); }} className="w-full h-12 md:h-14 pl-12 pr-4 bg-white border-2 border-slate-100 rounded-xl md:rounded-2xl shadow-sm focus:border-emerald-500 outline-none font-medium text-sm transition-all" />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
               <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-12 md:h-14 w-full md:w-48 rounded-xl md:rounded-2xl border-2 border-slate-100 bg-white font-bold text-xs uppercase transition-all">
                    <Filter className="h-4 w-4 mr-2 text-emerald-600" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-2 border-slate-100 shadow-2xl">
                    <SelectItem value="all" className="font-bold text-xs">Semua Status</SelectItem>
                    {Object.keys(statusConfig).map(key => (
                      <SelectItem key={key} value={key} className="font-bold text-xs uppercase">{statusConfig[key].label}</SelectItem>
                    ))}
                  </SelectContent>
               </Select>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="min-w-full">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-left">
                <tr>
                  <th className="px-4 md:px-8 h-14 font-black text-slate-400 uppercase text-[10px] tracking-wider">Dokumen</th>
                  <th className="px-4 md:px-6 h-14 font-black text-slate-400 uppercase text-[10px] tracking-wider hidden sm:table-cell">Klien</th>
                  <th className="px-4 md:px-6 h-14 text-right font-black text-slate-400 uppercase text-[10px] tracking-wider">Tagihan</th>
                  <th className="px-4 md:px-6 h-14 text-center font-black text-slate-400 uppercase text-[10px] tracking-wider hidden xs:table-cell">Status</th>
                  <th className="px-4 md:px-8 h-14 text-center font-black text-slate-400 uppercase text-[10px] tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredItems.length === 0 ? (
                  <tr><td colSpan={5} className="py-24 text-center text-slate-400 font-black uppercase text-xs tracking-widest">{OPERATOR_EMPTY_TEXT.dataNotFoundCaps}</td></tr>
                ) : (
                  filteredItems.map((item) => {
                    const cfg = statusConfig[item.status] || statusConfig.draft;
                    const Icon = cfg.icon;
                    const latestJobOrder = item.job_orders?.[0];
                    const invoiceRequested = !!latestJobOrder?.notes?.includes("[INVOICE_REQUESTED]");
                    const hasInvoice = !!latestJobOrder?.invoice;
                    return (
                      <tr key={item.id} className="group hover:bg-emerald-50/30 transition-all cursor-default">
                        <td className="px-4 md:px-8 py-4 md:py-6">
                          <div className="flex flex-col">
                            <span className="font-mono text-xs md:text-sm font-black text-emerald-700 bg-emerald-100/50 px-2 md:px-3 py-1 rounded-lg w-fit mb-1 md:mb-2">{item.quotation_number}</span>
                            <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase"><Calendar className="h-3 w-3" />{new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 md:py-6 hidden sm:table-cell">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800 text-sm truncate max-w-[150px]">{item.profile?.full_name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1.5 mt-1 truncate max-w-[150px]"><Layers className="h-3 w-3 text-emerald-600" />{item.profile?.company_name || 'Personal'}</span>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 md:py-6 text-right font-black text-emerald-950 text-sm md:text-base whitespace-nowrap">
                           Rp {Number(item.total_amount).toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 md:px-6 py-4 md:py-6 text-center hidden xs:table-cell">
                           <Badge className={cn("font-black text-[8px] md:text-[9px] px-2 md:px-3 py-1 rounded-full border-none shadow-sm", cfg.bg, cfg.color)}>
                              {cfg.label}
                           </Badge>
                        </td>
                        <td className="px-4 md:px-8 py-4 md:py-6">
                          <div className="flex items-center justify-center gap-1 md:gap-2">
                             {item.status === 'draft' && (
                              <Button 
                                onClick={() => handleStatusUpdate(item.id, 'sent')}
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] uppercase h-9 px-4 rounded-xl shadow-lg shadow-blue-900/20 mr-2 transition-all active:scale-95"
                              >
                                <Send className="h-3 w-3 mr-1.5" /> Kirim
                              </Button>
                             )}
                              {item.status === 'accepted' && latestJobOrder && !hasInvoice && (
                                <Button
                                  onClick={() => setConfirmInvoiceQuotationId(item.id)}
                                  disabled={invoiceRequested || publishingInvoice}
                                  size="sm"
                                  className={cn(
                                    "font-black text-[9px] uppercase h-9 px-4 rounded-xl transition-all active:scale-95",
                                   invoiceRequested
                                     ? "bg-slate-100 text-slate-500 hover:bg-slate-100"
                                     : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
                                 )}
                               >
                                 <Send className="h-3 w-3 mr-1.5" />
                                 {invoiceRequested ? "Terkirim" : "Invoice"}
                               </Button>
                             )}
                             <Link href={`/operator/quotations/${item.id}`}><Button variant="ghost" size="icon" className="h-8 md:h-10 w-8 md:w-10 rounded-lg md:rounded-xl hover:bg-emerald-100 text-emerald-600 transition-all"><Eye className="h-4 w-4" /></Button></Link>
                             <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 md:h-10 w-8 md:w-10 rounded-lg md:rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-2 border-slate-100 p-2 shadow-2xl">
                                <DropdownMenuItem className="rounded-xl font-bold text-xs cursor-pointer px-4 py-3"><Printer className="mr-2 h-4 w-4" /> Cetak Penawaran</DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => cloneQuotation(item.id).then(() => loadQuotationsData())} className="rounded-xl font-bold text-xs cursor-pointer px-4 py-3"><Copy className="mr-2 h-4 w-4" /> Duplikasi</DropdownMenuItem>
                                 <DropdownMenuSeparator />
                                 <DropdownMenuItem onClick={() => handleStatusUpdate(item.id, 'accepted')} className="rounded-xl font-bold text-xs cursor-pointer px-4 py-3 text-emerald-600"><CheckCircle className="mr-2 h-4 w-4" /> Tandai Diterima</DropdownMenuItem>
                                 {item.status === 'accepted' && latestJobOrder && !hasInvoice && (
                                   <>
                                     <DropdownMenuSeparator />
                                     <DropdownMenuItem onClick={() => setConfirmInvoiceQuotationId(item.id)} disabled={invoiceRequested || publishingInvoice} className="rounded-xl font-bold text-xs cursor-pointer px-4 py-3 text-blue-600 disabled:text-slate-400">
                                       <Send className="mr-2 h-4 w-4" /> {invoiceRequested ? 'Permintaan Terkirim' : 'Terbitkan Invoice'}
                                     </DropdownMenuItem>
                                   </>
                                 )}
                                 <DropdownMenuSeparator />
                                 <DropdownMenuItem onClick={() => setDeleteId(item.id)} className="rounded-xl font-bold text-xs cursor-pointer px-4 py-3 text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>
                               </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-xl shadow-emerald-900/5 border border-slate-100 gap-4">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Total {data.total} Dokumen</p>
         <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-10 w-10 rounded-xl border-slate-200 transition-all active:scale-90" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="h-10 px-5 flex items-center justify-center bg-emerald-50 rounded-xl text-xs font-black text-emerald-900 border border-emerald-100">{page} / {data.pages}</div>
            <Button variant="outline" size="sm" className="h-10 w-10 rounded-xl border-slate-200 transition-all active:scale-90" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
         </div>
      </div>

      <AlertDialog open={confirmInvoiceQuotationId !== null} onOpenChange={(open) => !open && setConfirmInvoiceQuotationId(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl max-w-md">
          <div className="bg-blue-700 p-7 text-white text-center">
            <Send className="h-10 w-10 mx-auto mb-3 opacity-80" />
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">Terbitkan Permintaan Invoice?</AlertDialogTitle>
            <AlertDialogDescription className="text-blue-100 text-xs font-bold uppercase tracking-wider mt-2">
              Notifikasi ke finance
            </AlertDialogDescription>
          </div>
          <div className="p-7 bg-white">
            <p className="text-slate-500 text-sm text-center font-medium leading-relaxed">
              Permintaan ini akan dikirim ke tim finance. Invoice draft tersedia setelah proses sampling selesai.
            </p>
          </div>
          <AlertDialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex-col sm:flex-row gap-3">
            <AlertDialogCancel className="w-full sm:flex-1 rounded-xl h-12 font-black text-slate-500 uppercase text-[10px] border-2 border-slate-100 hover:bg-white">Batal</AlertDialogCancel>
            <Button
              onClick={() => confirmInvoiceQuotationId && handlePublishInvoiceRequest(confirmInvoiceQuotationId)}
              disabled={publishingInvoice}
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl h-12 font-black text-white uppercase text-[10px] shadow-lg shadow-blue-900/20"
            >
              {publishingInvoice ? "Memproses..." : "Terbitkan"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CREATE QUOTATION DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-screen sm:max-h-[95vh] overflow-y-auto p-0 border-none shadow-2xl sm:rounded-3xl">
          <div className="bg-emerald-700 p-4 md:p-6 text-white sticky top-0 z-20 border-b border-emerald-600 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/20 flex items-center justify-center text-white border border-white/20"><FileText className="h-5 w-5 md:h-6 md:w-6" /></div>
                <div><DialogTitle className="text-lg md:text-xl font-black uppercase tracking-tight leading-none">Buat Penawaran</DialogTitle><p className="text-emerald-200 text-[8px] md:text-[10px] font-bold uppercase tracking-widest mt-1">Digital Quotation Laboratorium</p></div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)} className="text-white/60 hover:text-white h-10 w-10 rounded-2xl"><X className="h-6 w-6" /></Button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-8 space-y-10 pb-32 sm:pb-8 bg-slate-50/20">
            {/* Step 01: Customer */}
            <section className="space-y-4">
              <h4 className="text-[10px] md:text-[11px] font-black text-emerald-600 uppercase tracking-[2px] md:tracking-[3px] flex items-center gap-3"><span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">01</span> Informasi Pelanggan</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border-2 border-slate-100 shadow-sm transition-all hover:border-emerald-500">
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No. Dokumen</label><Input {...register("quotation_number")} readOnly className="h-12 md:h-14 bg-slate-50 border-2 border-slate-100 rounded-xl md:rounded-2xl font-mono font-black text-emerald-700 text-sm md:text-base" /></div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Klien</label><Button type="button" variant="link" size="sm" className="h-auto p-0 text-emerald-600 font-black text-[10px]" onClick={() => setIsCustomerDialogOpen(true)}>+ BARU (Alt+K)</Button></div>
                  <Controller control={control} name="user_id" render={({ field }) => (
                    <Popover
                      open={isClientPopoverOpen}
                      onOpenChange={(open) => {
                        setIsClientPopoverOpen(open);
                        if (!open) {
                          setClientSearchQuery("");
                          setClientDebouncedQuery("");
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="h-12 md:h-14 w-full justify-between border-2 border-slate-100 rounded-xl md:rounded-2xl bg-slate-50/50 font-bold text-xs md:text-sm text-left">
                          <span className="truncate">
                            {field.value
                              ? (() => {
                                  const selected = clients.find((client) => client.id === field.value);
                                  return selected ? `${selected.full_name} - ${selected.company_name || "Personal"}` : "Pilih Klien...";
                                })()
                              : "Pilih Klien..."}
                          </span>
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-slate-100 shadow-2xl z-50">
                        <Command className="rounded-xl">
                          <CommandInput
                            ref={clientSearchInputRef}
                            value={clientSearchQuery}
                            onValueChange={setClientSearchQuery}
                            placeholder="Cari nama klien..."
                            className="h-11 border-none focus:ring-0 font-bold text-xs"
                          />
                          <CommandList className="max-h-[300px] overflow-y-auto text-left">
                            {!clientsLoading && (
                              <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                {filteredClients.length} hasil
                              </div>
                            )}
                            <CommandGroup>
                              {clientsLoading ? (
                                <CommandListSkeleton />
                              ) : filteredClients.length === 0 ? (
                                <div className="px-4 py-8 text-center">
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    {clientDebouncedQuery ? "Klien tidak ditemukan" : "Data klien belum tersedia"}
                                  </p>
                                  <p className="mt-2 text-[10px] font-semibold text-slate-400">
                                    {clientDebouncedQuery
                                      ? "Coba kata kunci lain atau tambah klien baru."
                                      : "Tambahkan klien baru untuk mulai membuat penawaran."}
                                  </p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-4 h-8 rounded-lg border-emerald-100 text-emerald-700 text-[10px] font-black uppercase"
                                    onClick={() => {
                                      setIsClientPopoverOpen(false);
                                      setIsCustomerDialogOpen(true);
                                    }}
                                  >
                                    + Tambah Klien
                                  </Button>
                                </div>
                              ) : (
                                filteredClients.map((client) => (
                                  <CommandItem
                                    key={client.id}
                                    value={`${client.full_name} ${client.company_name || ""}`}
                                    ref={field.value === client.id ? selectedClientItemRef : undefined}
                                    onSelect={() => {
                                      field.onChange(client.id);
                                      setIsClientPopoverOpen(false);
                                    }}
                                    className="py-3 px-4 cursor-pointer border-b border-slate-50 last:border-none flex items-center justify-between"
                                  >
                                    <div className="flex flex-col items-start">
                                      <span className="font-bold text-xs text-slate-800">{highlightSearchMatch(client.full_name || "-", clientSearchQuery)}</span>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">{highlightSearchMatch(client.company_name || "Personal", clientSearchQuery)}</span>
                                    </div>
                                    <Check className={cn("h-4 w-4 text-emerald-600", field.value === client.id ? "opacity-100" : "opacity-0")} />
                                  </CommandItem>
                                ))
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lokasi Sampling</label>
                  <textarea {...register("sampling_location")} rows={3} placeholder="Lokasi sampling / titik pengambilan contoh..." className="w-full rounded-xl border-2 border-slate-100 bg-white px-4 py-3 text-xs font-bold text-slate-700 outline-none shadow-sm resize-none" />
                </div>
              </div>
            </section>

            {/* Sequential Flow Logic */}
            <div className={cn("space-y-10 transition-all duration-500", !hasClientSelected && "opacity-40 pointer-events-none grayscale blur-[1px]")}>
              
              {/* Step 02: Services */}
              <section className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-[10px] md:text-[11px] font-black text-emerald-600 uppercase tracking-[2px] md:tracking-[3px] flex items-center gap-3"><span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">02</span> Layanan Lab</h4>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ service_id: "", equipment_id: "", qty: 1, price: 0 })} className="h-9 md:h-10 rounded-lg md:rounded-xl border-2 border-emerald-100 text-emerald-700 font-black text-[9px] md:text-[10px] uppercase bg-white shadow-sm transition-all hover:scale-105 active:scale-95">+ ITEM (Alt+N)</Button>
                </div>
                <div className="space-y-3">
                  {fields.map((field, index) => {
                    if (watchedItems[index]?.equipment_id) return null;
                    const selectedServiceId = watchedItems[index]?.service_id;
                    const selectedService = services.find(s => s.id === selectedServiceId);
                    const filteredServices = getFilteredServices(index);
                    
                    return (
                      <div key={field.id} className="bg-white border-2 border-slate-100 p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all space-y-4 group hover:scale-[1.01] hover:border-emerald-200">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                          <div className="md:col-span-6 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Pilih Layanan</label>
                            <Controller control={control} name={`items.${index}.service_id`} render={({ field }) => (
                              <Popover
                                open={openServiceIndex === index}
                                  onOpenChange={(open) => {
                                    setOpenServiceIndex(open ? index : null);
                                    if (!open) {
                                      setServiceSearchQueries((prev) => ({ ...prev, [index]: "" }));
                                      setServiceDebouncedQueries((prev) => ({ ...prev, [index]: "" }));
                                      if (serviceDebounceTimers.current[index]) {
                                        clearTimeout(serviceDebounceTimers.current[index]);
                                        delete serviceDebounceTimers.current[index];
                                      }
                                    }
                                  }}
                                >
                                <PopoverTrigger asChild>
                                  <Button type="button" variant="outline" className="h-12 w-full justify-between border-2 border-slate-100 rounded-xl bg-slate-50/50 font-bold text-xs">
                                    <span className="truncate text-left">
                                      {field.value ? (services.find((service) => service.id === field.value)?.name || "Pilih Layanan...") : "Cari Layanan..."}
                                    </span>
                                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-slate-100 shadow-2xl z-50">
                                  <Command className="rounded-xl text-left">
                                    <CommandInput
                                      ref={(node) => {
                                        serviceSearchInputRefs.current[index] = node;
                                      }}
                                      value={serviceSearchQueries[index] || ""}
                                      onValueChange={(value) => {
                                        setServiceSearchQueries((prev) => ({ ...prev, [index]: value }));
                                        if (serviceDebounceTimers.current[index]) {
                                          clearTimeout(serviceDebounceTimers.current[index]);
                                        }
                                        serviceDebounceTimers.current[index] = setTimeout(() => {
                                          setServiceDebouncedQueries((prev) => ({ ...prev, [index]: value }));
                                        }, 180);
                                      }}
                                      placeholder="Cari nama layanan..."
                                      className="h-11 border-none focus:ring-0 font-bold text-xs"
                                    />
                                    <CommandList className="max-h-[350px] overflow-y-auto text-left">
                                      {!servicesLoading && (
                                        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                          {filteredServices.length} hasil
                                        </div>
                                      )}
                                      <CommandGroup>
                                        {servicesLoading ? (
                                          <CommandListSkeleton count={6} />
                                        ) : filteredServices.length === 0 ? (
                                          <div className="px-4 py-8 text-center">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                              {serviceDebouncedQueries[index] ? "Layanan tidak ditemukan" : "Belum ada layanan aktif"}
                                            </p>
                                            <p className="mt-2 text-[10px] font-semibold text-slate-400">
                                              {serviceDebouncedQueries[index]
                                                ? "Coba kata kunci lain untuk pencarian layanan."
                                                : "Tambahkan layanan terlebih dahulu di master layanan."}
                                            </p>
                                          </div>
                                        ) : (
                                          filteredServices.map((service) => (
                                            <CommandItem
                                              key={service.id}
                                              value={`${service.name} ${service.category_ref?.name || service.category || ""}`}
                                              ref={field.value === service.id ? (node) => { selectedServiceItemRefs.current[index] = node; } : undefined}
                                              onSelect={() => {
                                                field.onChange(service.id);
                                                handleServiceChange(index, service.id);
                                                setOpenServiceIndex(null);
                                              }}
                                              className="py-3 px-4 cursor-pointer border-b border-slate-50 last:border-none flex items-center justify-between"
                                            >
                                              <div className="flex flex-col items-start">
                                                <span className="font-bold text-xs text-slate-800">{highlightSearchMatch(service.name || "-", serviceSearchQueries[index] || "")}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{highlightSearchMatch(service.category_ref?.name || service.category || "Umum", serviceSearchQueries[index] || "")}</span>
                                              </div>
                                              <Check className={cn("h-4 w-4 text-emerald-600", field.value === service.id ? "opacity-100" : "opacity-0")} />
                                            </CommandItem>
                                          ))
                                        )}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            )} />
                            {selectedService && (
                              <div className="flex items-center gap-2 mt-1 ml-1"><div className="h-1 w-1 rounded-full bg-emerald-500" /><p className="text-[9px] font-black text-emerald-700 uppercase italic">{(selectedService.regulation || selectedService.regulation_ref?.name) || '-'}</p></div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:col-span-5 gap-3">
                             <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Qty</label><Input type="number" {...register(`items.${index}.qty`)} className="h-12 text-center font-black text-base border-2 border-slate-100 rounded-xl bg-slate-50/30" /></div>
                             <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Harga</label><Input type="number" {...register(`items.${index}.price`)} className="h-12 font-black text-emerald-700 text-sm border-2 border-slate-100 rounded-xl bg-slate-50/30" /></div>
                          </div>
                          <div className="md:col-span-1"><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="w-full h-12 text-slate-200 hover:text-red-500 transition-colors"><Trash2 className="h-5 w-5" /></Button></div>
                        </div>

                        {/* Parameter Tags with Dynamic Removal */}
                        {(watchedItems?.[index]?.parameters?.length ?? 0) > 0 && (
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-50 mt-2">
                            {watchedItems?.[index]?.parameters?.map((p: any, pIdx: number) => (
                              <Badge key={pIdx} variant="secondary" className="bg-blue-50 text-blue-600 font-bold text-[9px] uppercase border-blue-100 h-7 pl-3 pr-1 rounded-lg shadow-sm hover:bg-blue-100 transition-all group/tag flex items-center gap-1.5">
                                {p}
                                <button 
                                  type="button" 
                                  onClick={() => removeParameter(index, pIdx)}
                                  className="h-5 w-5 rounded-md flex items-center justify-center text-blue-300 hover:bg-blue-200 hover:text-blue-700 transition-colors ml-1"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Step 03: Field & Equipment */}
              <section className="space-y-4">
                <h4 className="text-[10px] md:text-[11px] font-black text-emerald-600 uppercase tracking-[2px] md:tracking-[3px] flex items-center gap-3"><span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">03</span> Biaya Lapangan & Sewa Alat</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border-2 border-slate-100 space-y-4 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all hover:scale-[1.02] hover:border-emerald-200">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-600" /><span className="text-xs font-black text-slate-800 uppercase">Perdiem</span></div><Button type="button" variant="outline" size="sm" onClick={() => setIsPerdiemDialogOpen(true)} className="h-7 rounded-lg border-2 border-emerald-100 text-emerald-700 font-black text-[8px] uppercase bg-white shadow-sm transition-all hover:bg-emerald-50">KATALOG (Alt+P)</Button></div>
                    <Input {...register("perdiem_name")} placeholder="Nama perdiem..." className="h-10 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-[10px]" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><span className="text-[8px] font-black text-slate-400 uppercase ml-1">Harga</span><Input type="number" {...register("perdiem_price")} className="h-12 bg-slate-50 font-black text-sm border-2 border-slate-100 rounded-xl" /></div>
                      <div className="space-y-1"><span className="text-[8px] font-black text-slate-400 uppercase ml-1 text-center block">Hari</span><Input type="number" {...register("perdiem_qty")} className="h-12 bg-slate-50 text-center font-black text-base border-2 border-slate-100 rounded-xl" /></div>
                    </div>
                  </div>
                  <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border-2 border-slate-100 space-y-4 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all hover:scale-[1.02] hover:border-blue-200">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Car className="h-4 w-4 text-blue-600" /><span className="text-xs font-black text-slate-800 uppercase">Transport</span></div><Button type="button" variant="outline" size="sm" onClick={() => setIsTransportDialogOpen(true)} className="h-7 rounded-lg border-2 border-blue-100 text-blue-700 font-black text-[8px] uppercase bg-white shadow-sm transition-all hover:bg-blue-50">KATALOG (Alt+T)</Button></div>
                    <Input {...register("transport_name")} placeholder="Tujuan transport..." className="h-10 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-[10px]" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><span className="text-[8px] font-black text-slate-400 uppercase ml-1">Harga</span><Input type="number" {...register("transport_price")} className="h-12 bg-slate-50 font-black text-sm border-2 border-slate-100 rounded-xl" /></div>
                      <div className="space-y-1"><span className="text-[8px] font-black text-slate-400 uppercase ml-1 text-center block">Qty</span><Input type="number" {...register("transport_qty")} className="h-12 bg-slate-50 text-center font-black text-base border-2 border-slate-100 rounded-xl" /></div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/50 p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border-2 border-dashed border-amber-200 space-y-4 shadow-sm hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-amber-100 pb-4">
                    <div className="flex items-center gap-2 md:gap-3 text-amber-900 font-black text-xs md:text-sm uppercase"><Wrench className="h-4 w-4 md:h-5 md:w-5 text-amber-600" /> Sewa Alat Tambahan</div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsEquipmentDialogOpen(true)} className="h-8 md:h-10 rounded-lg md:rounded-xl border-2 border-amber-200 text-amber-700 font-black text-[8px] md:text-[10px] uppercase bg-white shadow-sm transition-all hover:bg-amber-100 active:scale-95">KATALOG ALAT (Alt+E)</Button>
                  </div>
                  <div className="space-y-3">
                    {watchedItems.filter((item: any) => item?.equipment_id).length === 0 ? (
                      <div className="text-center py-4 md:py-6"><span className="text-[9px] md:text-[10px] text-amber-600 font-bold uppercase tracking-widest opacity-50 italic">Belum ada sewa alat</span></div>
                    ) : (
                      fields.map((field, index) => {
                        if (!watchedItems[index]?.equipment_id) return null;
                        return (
                          <div key={field.id} className="bg-white border-2 border-amber-100 p-4 rounded-xl md:rounded-2xl shadow-sm space-y-3 hover:shadow-xl transition-all hover:scale-[1.01] hover:border-amber-300">
                            <div className="flex justify-between items-center"><span className="text-[10px] font-black text-amber-900 truncate uppercase">{watchedItems[index]?.name}</span><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-amber-200 hover:text-red-500"><XCircle className="h-4 w-4" /></Button></div>
                            <div className="grid grid-cols-2 gap-3">
                               <div className="space-y-1"><span className="text-[8px] font-black text-amber-400 uppercase tracking-widest ml-1">Harga</span><Input type="number" {...register(`items.${index}.price`)} className="h-10 text-xs font-black bg-amber-50/30 border-none rounded-lg" /></div>
                               <div className="space-y-1"><span className="text-[8px] font-black text-amber-400 uppercase tracking-widest text-center block">Qty</span><Input type="number" {...register(`items.${index}.qty`)} className="h-10 text-center font-black bg-amber-50/30 border-none rounded-lg" /></div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </section>

              {/* Step 04: Finalization */}
              <section className={cn("space-y-4 transition-all duration-500", !hasValidService && "opacity-40 pointer-events-none grayscale")}>
                <h4 className="text-[10px] md:text-[11px] font-black text-emerald-600 uppercase tracking-[3px] flex items-center gap-3"><span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">04</span> Finalisasi Biaya</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                  <div className="space-y-4 md:space-y-6 bg-white p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:shadow-xl transition-all hover:border-emerald-200">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Potongan Diskon (Rp)</label>
                      <Input type="number" {...register("discount_amount")} className="h-12 md:h-14 font-black text-rose-600 text-base md:text-lg rounded-xl md:rounded-2xl border-2 border-slate-200 bg-slate-50/50 transition-all focus:bg-white" placeholder="0" />
                    </div>
                    <Controller
                      control={control}
                      name="use_tax"
                      render={({ field }) => (
                        <div 
                          className={cn(
                            "p-4 md:p-6 rounded-2xl md:rounded-3xl border-2 transition-all cursor-pointer group flex items-center justify-between",
                            field.value 
                              ? "border-emerald-500 bg-emerald-50/10 shadow-lg shadow-emerald-900/5" 
                              : "border-slate-100 bg-white hover:border-slate-200"
                          )} 
                          onClick={() => setValue("use_tax", !field.value, { shouldDirty: true, shouldValidate: true })}
                        >
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className={cn(
                              "h-8 w-8 md:h-10 md:w-10 rounded-xl flex items-center justify-center transition-all",
                              field.value ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "bg-slate-100 text-slate-300"
                            )}>
                              <CheckCircle className="h-5 w-5 md:h-6 md:w-6" />
                            </div>
                            <div>
                              <p className="text-xs md:text-sm font-black text-slate-800 leading-none">Gunakan PPN 11%</p>
                              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Pajak Pertambahan Nilai</p>
                            </div>
                          </div>
                          {/* Checkbox made purely visual to prevent event bubbling conflicts */}
                          <div className={cn(
                            "h-6 w-6 border-2 rounded-lg flex items-center justify-center transition-all",
                            field.value ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-200 bg-white"
                          )}>
                            {field.value && <Check className="h-4 w-4" />}
                          </div>
                        </div>
                      )}
                    />

                  </div>

                <div className="bg-emerald-950 p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border-4 border-emerald-900 group hover:shadow-emerald-900/40 transition-all flex flex-col justify-center min-h-[200px]">
                  <div className="absolute -top-20 -right-20 h-64 w-64 bg-emerald-600 rounded-full opacity-20 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
                  <div className="relative space-y-5">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black opacity-40 uppercase tracking-[2px]"><span>Subtotal</span><span className="text-emerald-100 font-mono">Rp {totals.subtotalBeforeDiscount.toLocaleString("id-ID")}</span></div>
                      {watchedDiscount > 0 && <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black text-rose-400/80 uppercase tracking-[2px]"><span>Potongan</span><span className="text-rose-400 font-mono">- Rp {watchedDiscount.toLocaleString("id-ID")}</span></div>}
                      {watchedUseTax && <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black text-emerald-400/80 uppercase tracking-[2px]"><span>PPN 11%</span><span className="text-emerald-400 font-mono">+ Rp {totals.taxAmount.toLocaleString("id-ID")}</span></div>}
                    </div>
                    <div className="border-t border-white/10 pt-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] md:text-[11px] font-black text-emerald-300 uppercase tracking-[3px] leading-none">Grand Total</span>
                        <span className="text-[7px] md:text-[8px] text-emerald-500/60 font-bold uppercase tracking-widest italic mb-3">Final Laboratory Quote</span>
                        <span className="text-2xl xs:text-3xl md:text-4xl font-black font-mono tracking-tighter text-white drop-shadow-2xl break-all leading-none">
                          Rp {totals.grandTotal.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </section>
            </div>

            {/* Bottom Bar */}
            <div className="fixed sm:sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t-2 border-slate-100 px-4 md:px-10 py-4 md:py-6 flex items-center justify-between z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-3xl sm:rounded-none sm:rounded-b-3xl">
              <div className="flex flex-col">
                <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[2px] leading-none mb-1">Estimasi Akhir</span>
                <span className="text-lg md:text-2xl font-black text-emerald-800 font-mono tracking-tighter leading-none">Rp {totals.grandTotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex gap-2 md:gap-4">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-black text-slate-400 text-[10px] md:text-xs uppercase px-4 md:px-8 h-10 md:h-14 rounded-xl md:rounded-2xl border-2 border-transparent hover:border-slate-100">Batal</Button>
                <LoadingButton type="submit" loading={submitting} loadingText={PROCESSING_TEXT} disabled={!isFormValid} className={cn("bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 md:px-12 h-10 md:h-14 rounded-xl md:rounded-2xl shadow-xl shadow-emerald-900/30 text-[10px] md:text-xs tracking-[1px] md:tracking-[2px] uppercase transition-all active:scale-95 flex items-center gap-2 md:gap-3", !isFormValid && "bg-slate-200 text-slate-400 shadow-none cursor-not-allowed")}>
                   {isFormValid ? <><Check className="h-4 w-4" /> SIMPAN DRAFT</> : <><Lock className="h-4 w-4" /> DATA BELUM LENGKAP</>}
                </LoadingButton>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODALS */}
      <Dialog open={isPerdiemDialogOpen} onOpenChange={setIsPerdiemDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-emerald-700 p-6 text-white border-b border-emerald-600/40">
            <DialogTitle className="text-lg font-black uppercase tracking-widest">Katalog Perdiem</DialogTitle>
            <DialogDescription className="text-emerald-200 text-[10px] font-bold uppercase tracking-wider">
              Pilih biaya harian petugas
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[420px] overflow-y-auto space-y-3 p-6 bg-slate-50">
            {perdiemCatalogs.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Belum ada katalog perdiem</p>
              </div>
            ) : (
              perdiemCatalogs.map((catalog: any) => (
                <div key={catalog.id} className="p-5 bg-white border-2 border-slate-100 rounded-2xl hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer flex justify-between items-center group transition-all" onClick={() => { setValue("perdiem_name", catalog.name); setValue("perdiem_price", Number(catalog.price)); setValue("perdiem_qty", 1, { shouldValidate: true }); setIsPerdiemDialogOpen(false); }}>
                  <div><p className="font-black text-slate-800 uppercase text-xs">{catalog.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase mt-1 italic">{catalog.location}</p></div>
                  <span className="font-black text-emerald-700 bg-emerald-100 px-4 py-2 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all text-xs">Rp {Number(catalog.price).toLocaleString("id-ID")}</span>
                </div>
              ))
            )}
          </div>
          <DialogFooter className="p-5 bg-slate-50 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsPerdiemDialogOpen(false)} className="w-full h-11 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-emerald-700 hover:bg-emerald-50">Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTransportDialogOpen} onOpenChange={setIsTransportDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-blue-700 p-6 text-white border-b border-blue-600/40">
            <DialogTitle className="text-lg font-black uppercase tracking-widest">Katalog Transport</DialogTitle>
            <DialogDescription className="text-blue-200 text-[10px] font-bold uppercase tracking-wider">
              Pilih biaya perjalanan lapangan
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[420px] overflow-y-auto space-y-3 p-6 bg-slate-50">
            {transportCatalogs.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Belum ada katalog transport</p>
              </div>
            ) : (
              transportCatalogs.map((catalog: any) => (
                <div key={catalog.id} className="p-5 bg-white border-2 border-slate-100 rounded-2xl hover:bg-blue-50 hover:border-blue-200 cursor-pointer flex justify-between items-center group transition-all" onClick={() => { setValue("transport_name", catalog.name); setValue("transport_price", Number(catalog.price)); setValue("transport_qty", 1, { shouldValidate: true }); setIsTransportDialogOpen(false); }}>
                  <div><p className="font-black text-slate-800 uppercase text-xs">{catalog.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase mt-1 italic">{catalog.unit}</p></div>
                  <span className="font-black text-blue-700 bg-blue-100 px-4 py-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all text-xs">Rp {Number(catalog.price).toLocaleString("id-ID")}</span>
                </div>
              ))
            )}
          </div>
          <DialogFooter className="p-5 bg-slate-50 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsTransportDialogOpen(false)} className="w-full h-11 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-blue-700 hover:bg-blue-50">Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEquipmentDialogOpen} onOpenChange={setIsEquipmentDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-amber-600 p-6 text-white border-b border-amber-500/40">
            <DialogTitle className="text-lg font-black uppercase tracking-widest">Katalog Alat</DialogTitle>
            <DialogDescription className="text-amber-100 text-[10px] font-bold uppercase tracking-wider">
              Pilih alat yang dibutuhkan
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[450px] overflow-y-auto space-y-3 p-6 bg-slate-50">
            {equipment.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Belum ada data alat</p>
              </div>
            ) : (
              equipment.map((eq) => {
                const isSelected = watchedItems.some((item: any) => item?.equipment_id === eq.id);
                return (
                  <div key={eq.id} className={cn("flex items-center justify-between p-5 bg-white border-2 rounded-[1.5rem] hover:bg-amber-50 cursor-pointer transition-all", isSelected ? "border-amber-500 shadow-lg scale-[1.02]" : "border-slate-100")}
                    onClick={() => {
                      if (isSelected) { const itemIndex = watchedItems.findIndex((item: any) => item?.equipment_id === eq.id); if (itemIndex > -1) remove(itemIndex); }
                      else { append({ service_id: "", equipment_id: eq.id, qty: 1, price: Number(eq.price), name: eq.name }); }
                      setIsEquipmentDialogOpen(false);
                    }}>
                    <div className="flex items-center gap-4"><div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", isSelected ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-400")}><Wrench className="h-6 w-6" /></div><div><p className="font-black text-slate-800 text-xs uppercase">{eq.name}</p></div></div>
                    <div className="text-right"><p className="font-black text-amber-700 text-sm">Rp {Number(eq.price).toLocaleString("id-ID")}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">per {eq.unit}</p></div>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter className="p-5 bg-slate-50 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsEquipmentDialogOpen(false)} className="w-full h-11 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-amber-700 hover:bg-amber-50">Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-emerald-700 p-8 text-white border-b border-emerald-600/40"><DialogTitle className="text-xl font-black uppercase tracking-tight leading-none">Klien Baru</DialogTitle><DialogDescription className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-1">Tambah data pelanggan dengan cepat</DialogDescription></DialogHeader>
          <div className="p-8 space-y-5 bg-slate-50/20">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Lengkap</label><Input placeholder="Nama pelanggan" value={customerData.full_name} onChange={(e) => setCustomerData({...customerData, full_name: e.target.value})} className="h-12 rounded-xl border-2 border-slate-100 bg-white" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Aktif</label><Input type="email" placeholder="nama@email.com" value={customerData.email} onChange={(e) => setCustomerData({...customerData, email: e.target.value})} className="h-12 rounded-xl border-2 border-slate-100 bg-white" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nama Instansi</label><Input placeholder="PT. Nama Perusahaan" value={customerData.company_name} onChange={(e) => setCustomerData({...customerData, company_name: e.target.value})} className="h-12 rounded-xl border-2 border-slate-100 bg-white" /></div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsCustomerDialogOpen(false)} className="w-full sm:flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-emerald-700 hover:bg-emerald-50">Batal</Button>
              <Button onClick={handleCreateCustomer} className="w-full sm:flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-900/20 text-[10px]">Simpan Pelanggan</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isSaveConfirmOpen} onOpenChange={setIsSaveConfirmOpen}>
        <AlertDialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-600 p-8 text-white text-center"><CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" /><AlertDialogTitle className="text-2xl font-black uppercase tracking-tight">Simpan?</AlertDialogTitle></div>
          <div className="p-8 bg-white flex flex-col gap-6">
             <p className="text-slate-500 text-sm text-center font-medium">Simpan penawaran ini sebagai <span className="font-black text-emerald-700">DRAFT</span>?</p>
             <div className="flex flex-col sm:flex-row gap-3"><AlertDialogCancel className="w-full sm:flex-1 h-12 rounded-xl font-black text-[10px] uppercase border-2 border-slate-100 text-slate-500 hover:bg-slate-50">Batal</AlertDialogCancel><AlertDialogAction onClick={handleConfirmSave} className="w-full sm:flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black text-[10px] uppercase shadow-lg shadow-emerald-900/20">Ya, Simpan</AlertDialogAction></div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-rose-600 p-8 text-white text-center"><Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" /><AlertDialogTitle className="text-2xl font-black uppercase tracking-tight">Hapus?</AlertDialogTitle></div>
          <div className="p-8 bg-white flex flex-col gap-6">
             <p className="text-slate-500 text-sm text-center font-medium">Tindakan ini tidak dapat dibatalkan.</p>
             <div className="flex flex-col sm:flex-row gap-3"><AlertDialogCancel className="w-full sm:flex-1 h-12 rounded-xl font-black text-[10px] uppercase border-2 border-slate-100 text-slate-500 hover:bg-slate-50">Batal</AlertDialogCancel><AlertDialogAction onClick={async () => { if (deleteId) { await deleteQuotation(deleteId, userProfile?.id, userProfile?.role); loadQuotationsData(); setDeleteId(null); } }} className="w-full sm:flex-1 h-12 rounded-xl bg-rose-600 hover:bg-rose-700 font-black text-[10px] uppercase shadow-lg shadow-rose-900/20">Ya, Hapus</AlertDialogAction></div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <LoadingOverlay isOpen={submitting} title={OPERATOR_LOADING_COPY.title} description={OPERATOR_LOADING_COPY.description} variant="transparent" />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, active, onClick }: any) {
  const styles: any = { emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", amber: "bg-amber-50 text-amber-600 border-amber-100", blue: "bg-blue-50 text-blue-600 border-blue-100", red: "bg-rose-50 text-rose-600 border-rose-100", purple: "bg-purple-50 text-purple-600 border-purple-100" };
  return (
    <div onClick={onClick} className={cn("cursor-pointer border-2 transition-all duration-300 rounded-[1.5rem] overflow-hidden group p-5 flex flex-col gap-3 bg-white hover:shadow-xl hover:shadow-emerald-900/5 hover:scale-[1.02] hover:border-emerald-200", active ? "border-emerald-600 shadow-xl scale-105" : "border-slate-50 hover:border-emerald-200 shadow-sm")}>
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110", styles[color])}><Icon className="h-5 w-5" /></div>
      <div><p className="text-2xl font-black text-slate-800 leading-none mb-1">{value}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</p></div>
    </div>
  );
}

