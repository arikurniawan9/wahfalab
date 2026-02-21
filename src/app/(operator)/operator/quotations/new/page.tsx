// ============================================================================
// OPERATOR CREATE QUOTATION PAGE - Same as Admin
// Form untuk operator membuat penawaran baru (sama dengan admin)
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChemicalLoader } from "@/components/ui";
import {
  createQuotation,
  getNextInvoiceNumber
} from "@/lib/actions/quotation";
import { getProfile } from "@/lib/actions/auth";
import { getClients } from "@/lib/actions/users";
import { getAllServices } from "@/lib/actions/services";
import { getAllEquipment } from "@/lib/actions/equipment";
import { getAllOperationalCatalogs } from "@/lib/actions/operational-catalog";
import { Plus, X, Save, ArrowLeft, Trash2, MapPin, Car, Wrench, FileText, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useForm, useFieldArray, Controller } from "react-hook-form";

interface QuotationForm {
  quotation_number: string;
  user_id: string;
  subtotal: number;
  discount_amount: number;
  use_tax: boolean;
  tax_amount: number;
  total_amount: number;
  perdiem_name: string | null;
  perdiem_price: number;
  perdiem_qty: number;
  transport_name: string | null;
  transport_price: number;
  transport_qty: number;
  items: {
    service_id: string | null;
    equipment_id: string | null;
    qty: number;
    price: number;
    name?: string;
  }[];
}

export default function OperatorCreateQuotationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [operationalCatalogs, setOperationalCatalogs] = useState<any[]>([]);
  const [quotationNumber, setQuotationNumber] = useState("");
  
  // Dialog states
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isPerdiemDialogOpen, setIsPerdiemDialogOpen] = useState(false);
  const [isTransportDialogOpen, setIsTransportDialogOpen] = useState(false);
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuotationForm>({
    defaultValues: {
      quotation_number: "",
      user_id: "",
      subtotal: 0,
      discount_amount: 0,
      use_tax: true,
      tax_amount: 0,
      total_amount: 0,
      perdiem_name: null,
      perdiem_price: 0,
      perdiem_qty: 0,
      transport_name: null,
      transport_price: 0,
      transport_qty: 0,
      items: [{ service_id: null, equipment_id: null, qty: 1, price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const watchedPerdiemName = watch("perdiem_name");
  const watchedTransportName = watch("transport_name");
  const watchedDiscount = watch("discount_amount");
  const watchedUseTax = watch("use_tax");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [clientsData, servicesData, equipmentData, operationalData, nextNumber] = await Promise.all([
        getClients(),
        getAllServices(),
        getAllEquipment(),
        getAllOperationalCatalogs(),
        getNextInvoiceNumber(),
      ]);
      setClients(clientsData);
      setServices(servicesData);
      setEquipment(equipmentData);
      setOperationalCatalogs(operationalData);
      setQuotationNumber(nextNumber);
      setValue("quotation_number", nextNumber);
    } catch (error) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  // Calculate totals
  const subtotalBeforeDiscount = watchedItems.reduce((sum, item) => {
    return sum + (Number(item.price) * Number(item.qty));
  }, 0);

  const subtotalAfterDiscount = subtotalBeforeDiscount - watchedDiscount;
  const tax = watchedUseTax ? subtotalAfterDiscount * 0.11 : 0;
  const total = subtotalAfterDiscount + tax;

  const handleServiceChange = (index: number, serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setValue(`items.${index}.price`, Number(service.price));
    }
  };

  const onSubmit = async (data: QuotationForm) => {
    setSubmitting(true);
    try {
      // Validate required fields
      if (!data.user_id) {
        toast.error("❌ Pelanggan wajib dipilih!");
        return;
      }

      // Validate items - at least one service or equipment must be selected
      const hasValidItem = data.items.some(
        item => item.service_id || item.equipment_id
      );
      
      if (!hasValidItem) {
        toast.error("❌ Minimal pilih 1 layanan atau peralatan!");
        return;
      }

      // Validate each item has required fields
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        if (!item.service_id && !item.equipment_id) {
          toast.error(`❌ Item ${i + 1}: Pilih layanan atau peralatan!`);
          return;
        }
        if (!item.qty || item.qty < 1) {
          toast.error(`❌ Item ${i + 1}: Qty minimal 1!`);
          return;
        }
        if (!item.price || item.price < 0) {
          toast.error(`❌ Item ${i + 1}: Harga tidak valid!`);
          return;
        }
      }

      const profile = await getProfile();
      if (!profile?.id) {
        toast.error("User tidak ditemukan");
        return;
      }

      // Calculate totals server-side for safety
      const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.qty), 0) +
                       (data.perdiem_price * data.perdiem_qty) +
                       (data.transport_price * data.transport_qty);
      const afterDiscount = subtotal - data.discount_amount;
      const taxAmount = data.use_tax ? afterDiscount * 0.11 : 0;
      const totalAmount = afterDiscount + taxAmount;

      const formData = {
        quotation_number: data.quotation_number,
        user_id: data.user_id, // ← Gunakan user_id dari form (klien yang dipilih)
        subtotal: subtotal,
        discount_amount: data.discount_amount,
        use_tax: data.use_tax,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        perdiem_name: data.perdiem_name,
        perdiem_price: data.perdiem_price,
        perdiem_qty: data.perdiem_qty,
        transport_name: data.transport_name,
        transport_price: data.transport_price,
        transport_qty: data.transport_qty,
        items: data.items,
      };

      const result = await createQuotation(formData);

      if (result.success) {
        toast.success("✅ Penawaran berhasil dibuat");
        router.push("/operator/quotations");
      } else {
        toast.error("Gagal membuat penawaran");
      }
    } catch (error) {
      console.error("Error creating quotation:", error);
      toast.error("Terjadi kesalahan saat membuat penawaran");
    } finally {
      setSubmitting(false);
    }
  };

  const onInvalid = (errors: any) => {
    console.error("Form errors:", errors);
    toast.error("Mohon lengkapi semua field yang wajib diisi");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "n") {
        e.preventDefault();
        append({ service_id: null, equipment_id: null, qty: 1, price: 0 });
      }
      if (e.altKey && e.key === "p") {
        e.preventDefault();
        setIsPerdiemDialogOpen(true);
      }
      if (e.altKey && e.key === "t") {
        e.preventDefault();
        setIsTransportDialogOpen(true);
      }
      if (e.altKey && e.key === "e") {
        e.preventDefault();
        setIsEquipmentDialogOpen(true);
      }
      if (e.altKey && e.key === "k") {
        e.preventDefault();
        setIsCustomerDialogOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit(onSubmit, onInvalid)();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [append, handleSubmit, onSubmit, onInvalid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ChemicalLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/operator/quotations">
          <Button variant="outline" size="icon" className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">Buat Penawaran Baru</h1>
          <p className="text-slate-500 text-sm">Isi form di bawah untuk membuat penawaran</p>
        </div>
      </div>

      <Dialog open={true} onOpenChange={(open) => !open && router.push("/operator/quotations")}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl rounded-3xl">
          {/* Emerald Glassmorphism Header */}
          <div className="bg-emerald-700/80 backdrop-blur-md p-4 text-white sticky top-0 z-20 border-b border-emerald-600/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/20 shadow-inner">
                  <FileText className="h-4 w-4" />
                </div>
                <DialogTitle className="text-base font-black uppercase tracking-widest">Buat Penawaran Baru</DialogTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/operator/quotations")}
                className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl h-8 w-8 transition-all"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="p-6 space-y-6">
            {/* Step 1: Klien */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center text-[9px]">01</span>
                Informasi Pelanggan
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nomor Penawaran</label>
                  <Input {...register("quotation_number")} readOnly className="bg-slate-100 font-mono font-bold text-emerald-700 h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Pelanggan</label>
                    <Button type="button" variant="link" size="sm" className="h-auto p-0 text-emerald-600 font-bold text-[10px]" onClick={() => setIsCustomerDialogOpen(true)}>+ BARU (Alt+K)</Button>
                  </div>
                  <Controller
                    control={control}
                    name="user_id"
                    render={({ field }) => (
                      <Select value={field.value || ""} onValueChange={field.onChange}>
                        <SelectTrigger className="h-9 border-slate-300 bg-white text-xs"><SelectValue placeholder="Pilih klien..." /></SelectTrigger>
                        <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.full_name} - {c.company_name || "Personal"}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  />
                  {errors.user_id && <p className="text-[9px] text-red-500 font-bold">{errors.user_id.message as string}</p>}
                </div>
              </div>
            </div>

            {/* Step 2: Layanan */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center text-[9px]">02</span>
                  Layanan & Parameter
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ service_id: null, equipment_id: null, qty: 1, price: 0 })} className="border-emerald-600 text-emerald-700 font-bold h-7 text-[10px]">Tambah Item (Alt+N)</Button>
              </div>
              <div className="space-y-2">
                {fields.map((field, index) => {
                  if (watchedItems[index]?.equipment_id) return null;
                  return (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-white border border-slate-100 p-3 rounded-xl relative shadow-sm hover:border-emerald-200 transition-all">
                      <div className="md:col-span-6 space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Layanan Lab</label>
                        <Controller
                          control={control}
                          name={`items.${index}.service_id`}
                          render={({ field }) => (
                            <Select value={field.value || ""} onValueChange={(val) => { field.onChange(val); handleServiceChange(index, val); }}>
                              <SelectTrigger className="h-8 border-slate-200 text-xs"><SelectValue placeholder="Pilih layanan..." /></SelectTrigger>
                              <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>)}</SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1 text-center">
                        <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Qty</label>
                        <Input type="number" {...register(`items.${index}.qty`, { valueAsNumber: true })} className="h-8 text-center font-bold text-xs" />
                      </div>
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Harga (Rp)</label>
                        <Input type="number" {...register(`items.${index}.price`, { valueAsNumber: true })} className="h-8 font-bold text-emerald-700 text-xs" />
                      </div>
                      <div className="md:col-span-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="w-full h-8 text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Biaya Tambahan */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center text-[9px]">03</span>
                Biaya Tambahan
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Perdiem */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 shadow-sm relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="h-3 w-3 text-emerald-500" />
                      <span className="text-[11px] font-bold uppercase tracking-tight">Perdiem</span>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsPerdiemDialogOpen(true)} className="h-6 text-[8px] font-black border-emerald-300 text-emerald-700 bg-white">KATALOG (Alt+P)</Button>
                  </div>
                  {watchedPerdiemName && <p className="text-[9px] text-emerald-600 font-bold bg-emerald-100/50 px-2 py-0.5 rounded w-fit italic">{watchedPerdiemName}</p>}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><span className="text-[8px] font-bold text-slate-400">HARGA</span><Input type="number" {...register("perdiem_price", { valueAsNumber: true })} className="h-8 bg-white font-bold text-xs" /></div>
                    <div className="space-y-1"><span className="text-[8px] font-bold text-slate-400">HARI</span><Input type="number" {...register("perdiem_qty", { valueAsNumber: true })} className="h-8 bg-white text-center font-bold text-xs" /></div>
                  </div>
                </div>
                {/* Transport */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 shadow-sm relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Car className="h-3 w-3 text-blue-500" />
                      <span className="text-[11px] font-bold uppercase tracking-tight">Transport</span>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsTransportDialogOpen(true)} className="h-6 text-[8px] font-black border-blue-300 text-blue-700 bg-white">KATALOG (Alt+T)</Button>
                  </div>
                  {watchedTransportName && <p className="text-[9px] text-blue-600 font-bold bg-blue-100/50 px-2 py-0.5 rounded w-fit italic">{watchedTransportName}</p>}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><span className="text-[8px] font-bold text-slate-400">HARGA</span><Input type="number" {...register("transport_price", { valueAsNumber: true })} className="h-8 bg-white font-bold text-xs" /></div>
                    <div className="space-y-1"><span className="text-[8px] font-bold text-slate-400">QTY</span><Input type="number" {...register("transport_qty", { valueAsNumber: true })} className="h-8 bg-white text-center font-bold text-xs" /></div>
                  </div>
                </div>
              </div>

              {/* Equipment */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-[11px] uppercase tracking-tight">
                    <Wrench className="h-3 w-3 text-amber-500" />
                    Sewa Alat Tambahan
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsEquipmentDialogOpen(true)} className="h-6 text-[8px] font-black border-amber-300 text-amber-700 bg-white uppercase">Katalog Alat (Alt+E)</Button>
                </div>

                <div className="space-y-2">
                  {fields.filter((item: any) => item.equipment_id).length === 0 ? (
                    <div className="text-center py-2 bg-white/50 rounded-lg border border-dashed border-slate-300">
                      <span className="text-[10px] text-slate-400 italic">Belum ada alat dipilih...</span>
                    </div>
                  ) : (
                    fields.map((field, index) => {
                      if (!watchedItems[index]?.equipment_id) return null;
                      return (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end bg-white border border-slate-200 p-2 rounded-lg shadow-sm">
                          <div className="md:col-span-5 flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                              <Wrench className="h-3 w-3" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 truncate">{watchedItems[index]?.name}</span>
                          </div>
                          <div className="md:col-span-3">
                            <Input type="number" {...register(`items.${index}.price`, { valueAsNumber: true })} className="h-7 text-[10px] font-bold bg-slate-50 border-none" />
                          </div>
                          <div className="md:col-span-2">
                            <Input type="number" {...register(`items.${index}.qty`, { valueAsNumber: true })} className="h-7 text-[10px] font-bold text-center bg-slate-50 border-none" />
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-6 w-6 text-slate-300 hover:text-red-500"><XCircle className="h-3 w-3" /></Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Step 4: Pajak & Total */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[2px] flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center text-[9px]">04</span>
                Pajak & Total
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Diskon (Rp)</label>
                    <Input type="number" {...register("discount_amount", { valueAsNumber: true })} className="h-9 font-bold text-sm rounded-lg" />
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100">
                    <input
                      type="checkbox"
                      id="use_tax"
                      checked={watchedUseTax}
                      onChange={(e) => setValue("use_tax", e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="use_tax" className="text-xs font-bold text-slate-700 cursor-pointer">Gunakan Pajak PPN (11%)</label>
                  </div>
                </div>
                {/* INVOICE SUMMARY UI */}
                <div className="bg-emerald-950 p-6 rounded-[1.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center border-2 border-emerald-900">
                  <div className="relative space-y-2">
                    <div className="flex justify-between text-[10px] font-black opacity-50 uppercase tracking-[2px]"><span>Subtotal</span><span>Rp {subtotalBeforeDiscount.toLocaleString("id-ID")}</span></div>
                    <div className="flex justify-between text-[10px] font-black text-red-400 uppercase tracking-[2px]"><span>Diskon</span><span>- Rp {watchedDiscount.toLocaleString("id-ID")}</span></div>
                    {watchedUseTax && <div className="flex justify-between text-[10px] font-black text-emerald-400 uppercase tracking-[2px]"><span>Pajak 11%</span><span>Rp {tax.toLocaleString("id-ID")}</span></div>}
                    <div className="border-t border-white/10 pt-3 mt-2 flex justify-between items-end">
                      <span className="text-[10px] font-black text-emerald-300 uppercase tracking-[3px]">TOTAL</span>
                      <span className="text-2xl font-black font-mono tracking-tighter">Rp {total.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t -mx-6 px-8 py-4 mt-6 flex items-center justify-between z-30">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estimasi</span>
                <span className="text-xl font-black text-emerald-800 font-mono tracking-tight leading-none">Rp {total.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/operator/quotations")}
                  className="font-bold text-slate-400 text-xs uppercase px-6 h-10 rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-emerald-900/20 text-xs tracking-wide uppercase transition-all active:scale-95 group"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>PROSES...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center leading-none gap-1">
                      <span className="flex items-center gap-2">
                        SIMPAN DRAFT
                        <FileText className="h-4 w-4" />
                      </span>
                      <span className="text-[7px] opacity-60 font-bold tracking-[0.1em] hidden md:block lowercase">
                        [ ctrl + enter ]
                      </span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Dialog */}
      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle>Pilih Pelanggan</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2 py-4">
            {clients.map(c => (
              <div key={c.id} className="p-4 border rounded-2xl hover:bg-emerald-50 cursor-pointer flex justify-between items-center group"
                onClick={() => { setValue("user_id", c.id); setIsCustomerDialogOpen(false); }}>
                <div>
                  <p className="font-bold text-slate-800">{c.full_name}</p>
                  <p className="text-xs text-slate-500">{c.company_name || "Personal"}</p>
                </div>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all">Pilih</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Perdiem Dialog */}
      <Dialog open={isPerdiemDialogOpen} onOpenChange={setIsPerdiemDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle>Katalog Perdiem</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2 py-4">
            {operationalCatalogs.filter(c => c.category === 'perdiem').map(c => (
              <div key={c.id} className="p-4 border rounded-2xl hover:bg-emerald-50 cursor-pointer flex justify-between items-center group"
                onClick={() => { setValue("perdiem_name", c.name); setValue("perdiem_price", Number(c.price)); setValue("perdiem_qty", 1); setIsPerdiemDialogOpen(false); }}>
                <div><p className="font-bold text-slate-800">{c.name}</p><p className="text-xs text-slate-500">{c.location || c.perdiem_type}</p></div>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all">Rp {Number(c.price).toLocaleString("id-ID")}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transport Dialog */}
      <Dialog open={isTransportDialogOpen} onOpenChange={setIsTransportDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle>Katalog Transport</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2 py-4">
            {operationalCatalogs.filter(c => c.category === 'transport').map(c => (
              <div key={c.id} className="p-4 border rounded-2xl hover:bg-blue-50 cursor-pointer flex justify-between items-center group"
                onClick={() => { setValue("transport_name", c.name); setValue("transport_price", Number(c.price)); setValue("transport_qty", 1); setIsTransportDialogOpen(false); }}>
                <div><p className="font-bold text-slate-800">{c.name}</p><p className="text-xs text-slate-500">{c.unit || c.distance_category}</p></div>
                <span className="font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">Rp {Number(c.price).toLocaleString("id-ID")}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Equipment Dialog */}
      <Dialog open={isEquipmentDialogOpen} onOpenChange={setIsEquipmentDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl">
          <DialogHeader>
            <DialogTitle>Katalog Alat Laboratorium</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2 py-4 px-1">
            {equipment.map((eq: any) => {
              const isSelected = watchedItems.some((item: any) => item.equipment_id === eq.id);
              return (
                <div key={eq.id} className={cn("flex items-center justify-between p-4 border rounded-2xl hover:bg-amber-50 cursor-pointer transition-all", isSelected ? "bg-amber-50 border-amber-300 ring-1 ring-amber-300" : "bg-white border-slate-200")}
                  onClick={() => {
                    if (isSelected) {
                      const itemIndex = watchedItems.findIndex((item: any) => item.equipment_id === eq.id);
                      if (itemIndex > -1) remove(itemIndex);
                    } else {
                      append({ service_id: "", equipment_id: eq.id, qty: 1, price: Number(eq.price), name: eq.name });
                    }
                  }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{eq.name}</p>
                      <p className="text-xs text-slate-500">{eq.category || "Alat Laboratorium"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-all">Rp {Number(eq.price).toLocaleString("id-ID")}</span>
                    {isSelected && <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">Dipilih</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
