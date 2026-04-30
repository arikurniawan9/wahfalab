"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  FileText, X, ChevronsUpDown, Check, MapPin, Car, Wrench, 
  Trash2, XCircle, CheckCircle, Lock, Info, AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { LoadingButton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { quotationSchema, getSearchScore } from "./constants";
import { PROCESSING_TEXT } from "@/lib/constants/loading";

interface QuotationFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  submitting: boolean;
  clients: any[];
  services: any[];
  equipment: any[];
  operationalCatalogs: any[];
  clientsLoading: boolean;
  servicesLoading: boolean;
  onAddClient: () => void;
}

export function QuotationForm({
  isOpen,
  onOpenChange,
  onSubmit,
  submitting,
  clients,
  services,
  equipment,
  operationalCatalogs,
  clientsLoading,
  servicesLoading,
  onAddClient
}: QuotationFormProps) {
  
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
      items: [{ service_id: "", equipment_id: "", qty: 1, price: 0, name: "", parameters: [] }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  
  // Local UI State
  const [isClientPopoverOpen, setIsClientPopoverOpen] = useState(false);
  const [openServiceIndex, setOpenServiceIndex] = useState<number | null>(null);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [serviceSearchQueries, setServiceSearchQueries] = useState<Record<number, string>>({});
  
  const [isPerdiemDialogOpen, setIsPerdiemDialogOpen] = useState(false);
  const [isTransportDialogOpen, setIsTransportDialogOpen] = useState(false);
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);

  // Watchers
  const watchedUserId = useWatch({ control, name: "user_id" });
  const watchedItems = useWatch({ control, name: "items" }) || [];
  const watchedUseTax = useWatch({ control, name: "use_tax" });
  const watchedDiscount = Number(useWatch({ control, name: "discount_amount" }) || 0);
  const watchedPerdiemPrice = useWatch({ control, name: "perdiem_price" }) || 0;
  const watchedPerdiemQty = useWatch({ control, name: "perdiem_qty" }) || 0;
  const watchedTransportPrice = useWatch({ control, name: "transport_price" }) || 0;
  const watchedTransportQty = useWatch({ control, name: "transport_qty" }) || 0;

  // Validation Logic
  const hasClientSelected = !!watchedUserId;
  const hasValidService = watchedItems.some(item => item?.service_id && Number(item?.price) > 0);
  const isFormValid = hasClientSelected && hasValidService;

  // Calculations
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

  // Filtering
  const filteredClients = useMemo(() => {
    const query = clientSearchQuery.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter(c => 
      (c.full_name?.toLowerCase().includes(query)) || 
      (c.company_name?.toLowerCase().includes(query))
    ).slice(0, 50);
  }, [clients, clientSearchQuery]);

  const getFilteredServices = (index: number) => {
    const query = (serviceSearchQueries[index] || "").trim().toLowerCase();
    if (!query) return services.slice(0, 50);
    return services.filter(s => 
      s.name?.toLowerCase().includes(query) || 
      s.category?.toLowerCase().includes(query)
    ).slice(0, 50);
  };

  const handleServiceChange = (index: number, serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setValue(`items.${index}.service_id`, serviceId);
      setValue(`items.${index}.price`, Number(service.price));
      setValue(`items.${index}.name`, service.name);
      if (service.parameters) {
        try {
          const params = typeof service.parameters === 'string' ? JSON.parse(service.parameters) : service.parameters;
          const paramNames = Array.isArray(params) ? params.map((p: any) => p.name || p.parameter) : [];
          setValue(`items.${index}.parameters`, paramNames);
        } catch (e) { setValue(`items.${index}.parameters`, []); }
      }
    }
  };

  const perdiemCatalogs = operationalCatalogs.filter(c => c.category === "perdiem");
  const transportCatalogs = operationalCatalogs.filter(c => c.category === "transport");

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-screen sm:max-h-[95vh] overflow-y-auto p-0 border-none shadow-2xl sm:rounded-3xl">
          <div className="bg-emerald-700 p-4 md:p-6 text-white sticky top-0 z-20 border-b border-emerald-600 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white border border-white/20"><FileText className="h-6 w-6" /></div>
                <div>
                   <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none">Buat Penawaran</DialogTitle>
                   <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mt-1">Digital Quotation Laboratorium</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-white/60 hover:text-white h-10 w-10 rounded-2xl"><X className="h-6 w-6" /></Button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-8 space-y-10 pb-32 sm:pb-8 bg-slate-50/20">
            {/* Step 01: Customer */}
            <section className="space-y-4">
              <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[3px] flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">01</span> Informasi Pelanggan
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm transition-all hover:border-emerald-500">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No. Dokumen</label>
                  <Input {...register("quotation_number")} readOnly className="h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono font-black text-emerald-700 text-base" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Klien</label>
                    <Button type="button" variant="link" size="sm" className="h-auto p-0 text-emerald-600 font-black text-[10px]" onClick={onAddClient}>+ BARU</Button>
                  </div>
                  <Controller control={control} name="user_id" render={({ field }) => (
                    <Popover open={isClientPopoverOpen} onOpenChange={setIsClientPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="h-14 w-full justify-between border-2 border-slate-100 rounded-2xl bg-slate-50/50 font-bold text-sm text-left">
                          <span className="truncate">
                            {field.value
                              ? (clients.find(c => c.id === field.value)?.full_name || "Pilih Klien...")
                              : "Pilih Klien..."}
                          </span>
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-slate-100 shadow-2xl z-50">
                        <Command>
                          <CommandInput value={clientSearchQuery} onValueChange={setClientSearchQuery} placeholder="Cari nama klien..." className="h-11 border-none focus:ring-0 font-bold text-xs" />
                          <CommandList className="max-h-[300px]">
                            <CommandGroup>
                              {filteredClients.map(client => (
                                <CommandItem key={client.id} value={`${client.full_name} ${client.company_name}`} onSelect={() => { field.onChange(client.id); setIsClientPopoverOpen(false); }} className="py-3 px-4 cursor-pointer border-b border-slate-50 last:border-none flex items-center justify-between">
                                  <div className="flex flex-col items-start">
                                    <span className="font-bold text-xs text-slate-800">{client.full_name}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{client.company_name || "Personal"}</span>
                                  </div>
                                  <Check className={cn("h-4 w-4 text-emerald-600", field.value === client.id ? "opacity-100" : "opacity-0")} />
                                </CommandItem>
                              ))}
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

            {/* Sequential Flow */}
            <div className={cn("space-y-10 transition-all duration-500", !hasClientSelected && "opacity-40 pointer-events-none grayscale blur-[1px]")}>
              {/* Step 02: Services */}
              <section className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[3px] flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">02</span> Layanan Lab
                  </h4>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ service_id: "", equipment_id: "", qty: 1, price: 0, name: "", parameters: [] })} className="h-10 rounded-xl border-2 border-emerald-100 text-emerald-700 font-black text-[10px] uppercase bg-white shadow-sm hover:scale-105 active:scale-95">+ ITEM</Button>
                </div>
                <div className="space-y-3">
                  {fields.map((field, index) => {
                    if (watchedItems[index]?.equipment_id) return null;
                    const filteredServices = getFilteredServices(index);
                    
                    return (
                      <div key={field.id} className="bg-white border-2 border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all space-y-4 group hover:scale-[1.01] hover:border-emerald-200">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                          <div className="md:col-span-6 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Pilih Layanan</label>
                            <Controller control={control} name={`items.${index}.service_id`} render={({ field }) => (
                              <Popover open={openServiceIndex === index} onOpenChange={(open) => setOpenServiceIndex(open ? index : null)}>
                                <PopoverTrigger asChild>
                                  <Button type="button" variant="outline" className="h-12 w-full justify-between border-2 border-slate-100 rounded-xl bg-slate-50/50 font-bold text-xs">
                                    <span className="truncate text-left">
                                      {field.value ? (services.find(s => s.id === field.value)?.name || "Pilih Layanan...") : "Cari Layanan..."}
                                    </span>
                                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-slate-100 shadow-2xl z-50">
                                  <Command>
                                    <CommandInput value={serviceSearchQueries[index] || ""} onValueChange={(val) => setServiceSearchQueries(prev => ({...prev, [index]: val}))} placeholder="Cari layanan..." className="h-11 border-none focus:ring-0 font-bold text-xs" />
                                    <CommandList className="max-h-[350px]">
                                      <CommandGroup>
                                        {filteredServices.map(service => (
                                          <CommandItem key={service.id} value={`${service.name} ${service.category}`} onSelect={() => { field.onChange(service.id); handleServiceChange(index, service.id); setOpenServiceIndex(null); }} className="py-3 px-4 cursor-pointer border-b border-slate-50 last:border-none flex items-center justify-between">
                                            <div className="flex flex-col items-start">
                                              <span className="font-bold text-xs text-slate-800">{service.name}</span>
                                              <span className="text-[10px] font-bold text-slate-400 uppercase">{service.category || "Umum"}</span>
                                            </div>
                                            <Check className={cn("h-4 w-4 text-emerald-600", field.value === service.id ? "opacity-100" : "opacity-0")} />
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            )} />
                          </div>
                          <div className="grid grid-cols-2 md:col-span-5 gap-3">
                             <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Qty</label><Input type="number" {...register(`items.${index}.qty`)} className="h-12 text-center font-black text-base border-2 border-slate-100 rounded-xl bg-slate-50/30" /></div>
                             <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Harga</label><Input type="number" {...register(`items.${index}.price`)} className="h-12 font-black text-emerald-700 text-sm border-2 border-slate-100 rounded-xl bg-slate-50/30" /></div>
                          </div>
                          <div className="md:col-span-1"><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="w-full h-12 text-slate-200 hover:text-red-500 transition-colors"><Trash2 className="h-5 w-5" /></Button></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Step 03: Field & Equipment */}
              <section className="space-y-4">
                <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[3px] flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">03</span> Biaya Lapangan & Sewa Alat
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 space-y-4 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-600" /><span className="text-xs font-black text-slate-800 uppercase">Perdiem</span></div><Button type="button" variant="outline" size="sm" onClick={() => setIsPerdiemDialogOpen(true)} className="h-7 rounded-lg border-2 border-emerald-100 text-emerald-700 font-black text-[8px] uppercase bg-white shadow-sm transition-all hover:bg-emerald-50">KATALOG</Button></div>
                    <Input {...register("perdiem_name")} placeholder="Nama perdiem..." className="h-10 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-[10px]" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><span className="text-[8px] font-black text-slate-400 uppercase ml-1">Harga</span><Input type="number" {...register("perdiem_price")} className="h-12 bg-slate-50 font-black text-sm border-2 border-slate-100 rounded-xl" /></div>
                      <div className="space-y-1"><span className="text-[8px] font-black text-slate-400 uppercase ml-1 text-center block">Hari</span><Input type="number" {...register("perdiem_qty")} className="h-12 bg-slate-50 text-center font-black text-base border-2 border-slate-100 rounded-xl" /></div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 space-y-4 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all">
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Car className="h-4 w-4 text-blue-600" /><span className="text-xs font-black text-slate-800 uppercase">Transport</span></div><Button type="button" variant="outline" size="sm" onClick={() => setIsTransportDialogOpen(true)} className="h-7 rounded-lg border-2 border-blue-100 text-blue-700 font-black text-[8px] uppercase bg-white shadow-sm transition-all hover:bg-blue-50">KATALOG</Button></div>
                    <Input {...register("transport_name")} placeholder="Tujuan transport..." className="h-10 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-[10px]" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><span className="text-[8px] font-black text-slate-400 uppercase ml-1">Harga</span><Input type="number" {...register("transport_price")} className="h-12 bg-slate-50 font-black text-sm border-2 border-slate-100 rounded-xl" /></div>
                      <div className="space-y-1"><span className="text-[8px] font-black text-slate-400 uppercase ml-1 text-center block">Qty</span><Input type="number" {...register("transport_qty")} className="h-12 bg-slate-50 text-center font-black text-base border-2 border-slate-100 rounded-xl" /></div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Step 04: Finalization */}
              <section className={cn("space-y-4 transition-all duration-500", !hasValidService && "opacity-40 pointer-events-none grayscale")}>
                <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[3px] flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">04</span> Finalisasi
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Diskon (Rp)</label>
                      <Input type="number" {...register("discount_amount")} className="h-14 font-black text-rose-600 text-lg rounded-2xl border-2 border-slate-200 bg-slate-50/50" placeholder="0" />
                    </div>
                    <Controller control={control} name="use_tax" render={({ field }) => (
                      <div className={cn("p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between", field.value ? "border-emerald-500 bg-emerald-50/10 shadow-lg" : "border-slate-100 bg-white")} onClick={() => setValue("use_tax", !field.value)}>
                        <div className="flex items-center gap-4">
                          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-all", field.value ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-300")}><CheckCircle className="h-6 w-6" /></div>
                          <div><p className="text-sm font-black text-slate-800 leading-none">Gunakan PPN 11%</p><p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Pajak Pertambahan Nilai</p></div>
                        </div>
                        <div className={cn("h-6 w-6 border-2 rounded-lg flex items-center justify-center", field.value ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-200 bg-white")}>{field.value && <Check className="h-4 w-4" />}</div>
                      </div>
                    )} />
                  </div>

                  <div className="bg-emerald-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border-4 border-emerald-900 flex flex-col justify-center min-h-[200px]">
                    <div className="relative space-y-5">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black opacity-40 uppercase tracking-[2px]"><span>Subtotal</span><span className="text-emerald-100 font-mono">Rp {totals.subtotalBeforeDiscount.toLocaleString("id-ID")}</span></div>
                        {watchedDiscount > 0 && <div className="flex justify-between items-center text-[10px] font-black text-rose-400/80 uppercase tracking-[2px]"><span>Potongan</span><span className="text-rose-400 font-mono">- Rp {watchedDiscount.toLocaleString("id-ID")}</span></div>}
                        {watchedUseTax && <div className="flex justify-between items-center text-[10px] font-black text-emerald-400/80 uppercase tracking-[2px]"><span>PPN 11%</span><span className="text-emerald-400 font-mono">+ Rp {totals.taxAmount.toLocaleString("id-ID")}</span></div>}
                      </div>
                      <div className="border-t border-white/10 pt-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-black text-emerald-300 uppercase tracking-[3px] leading-none">Grand Total</span>
                          <span className="text-4xl font-black font-mono tracking-tighter text-white drop-shadow-2xl">Rp {totals.grandTotal.toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer Actions */}
            <div className="fixed sm:sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t-2 border-slate-100 px-6 py-6 flex items-center justify-between z-30 rounded-t-3xl sm:rounded-none sm:rounded-b-3xl">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1">Estimasi Akhir</span>
                <span className="text-2xl font-black text-emerald-800 font-mono tracking-tighter leading-none">Rp {totals.grandTotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex gap-4">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="font-black text-slate-400 text-xs uppercase px-8 h-14 rounded-2xl border-2 border-transparent hover:border-slate-100">Batal</Button>
                <LoadingButton type="submit" loading={submitting} loadingText={PROCESSING_TEXT} disabled={!isFormValid} className={cn("bg-emerald-600 hover:bg-emerald-700 text-white font-black px-12 h-14 rounded-2xl shadow-xl text-xs tracking-[2px] uppercase transition-all active:scale-95 flex items-center gap-3", !isFormValid && "bg-slate-200 text-slate-400 shadow-none cursor-not-allowed")}>
                   {isFormValid ? <><Check className="h-4 w-4" /> SIMPAN DRAFT</> : <><Lock className="h-4 w-4" /> LENGKAPI DATA</>}
                </LoadingButton>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Catalog Dialogs */}
      <Dialog open={isPerdiemDialogOpen} onOpenChange={setIsPerdiemDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-emerald-700 p-6 text-white"><DialogTitle className="text-lg font-black uppercase tracking-widest">Katalog Perdiem</DialogTitle></DialogHeader>
          <div className="max-h-[400px] overflow-y-auto p-6 space-y-3 bg-slate-50">
            {perdiemCatalogs.map(catalog => (
              <div key={catalog.id} className="p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-emerald-200 cursor-pointer flex justify-between items-center group transition-all" onClick={() => { setValue("perdiem_name", catalog.name); setValue("perdiem_price", Number(catalog.price)); setValue("perdiem_qty", 1); setIsPerdiemDialogOpen(false); }}>
                <div><p className="font-black text-slate-800 uppercase text-xs">{catalog.name}</p></div>
                <span className="font-black text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all text-xs">Rp {Number(catalog.price).toLocaleString("id-ID")}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transport Dialog */}
      <Dialog open={isTransportDialogOpen} onOpenChange={setIsTransportDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-blue-700 p-6 text-white"><DialogTitle className="text-lg font-black uppercase tracking-widest">Katalog Transport</DialogTitle></DialogHeader>
          <div className="max-h-[400px] overflow-y-auto p-6 space-y-3 bg-slate-50">
            {transportCatalogs.map(catalog => (
              <div key={catalog.id} className="p-5 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-200 cursor-pointer flex justify-between items-center group transition-all" onClick={() => { setValue("transport_name", catalog.name); setValue("transport_price", Number(catalog.price)); setValue("transport_qty", 1); setIsTransportDialogOpen(false); }}>
                <div><p className="font-black text-slate-800 uppercase text-xs">{catalog.name}</p></div>
                <span className="font-black text-blue-700 bg-blue-100 px-4 py-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all text-xs">Rp {Number(catalog.price).toLocaleString("id-ID")}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
