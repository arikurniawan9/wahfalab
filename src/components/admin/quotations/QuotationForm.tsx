"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  FileText, Plus, Trash2, Check, X, MapPin, Car, Wrench, 
  DollarSign, Keyboard, Info, CheckCircle, XCircle, Search, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { LoadingButton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const quotationSchema = z.object({
  quotation_number: z.string().min(1, "Nomor penawaran wajib diisi"),
  user_id: z.string().min(1, "Pilih klien terlebih dahulu"),
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
  })).min(1, "Minimal harus ada 1 item"),
});

interface QuotationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  clients: any[];
  services: any[];
  operationalCatalogs: any[];
  equipment: any[];
  nextQuotationNumber: string;
  isSubmitting: boolean;
  onAddCustomer: () => void;
}

function ShortcutLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 hidden md:flex items-center gap-1 opacity-70 group-hover:text-emerald-600 transition-colors">
      <Keyboard className="h-2.5 w-2.5" /> {children}
    </span>
  );
}

export function QuotationForm({
  isOpen,
  onClose,
  onSubmit,
  clients,
  services,
  operationalCatalogs,
  equipment,
  nextQuotationNumber,
  isSubmitting,
  onAddCustomer
}: QuotationFormProps) {
  const { register, control, handleSubmit, setValue, watch, reset } = useForm({
    resolver: zodResolver(quotationSchema),
    mode: 'onChange',
    defaultValues: {
      quotation_number: nextQuotationNumber,
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

  useEffect(() => {
    if (isOpen && nextQuotationNumber) {
      setValue("quotation_number", nextQuotationNumber);
    }
  }, [isOpen, nextQuotationNumber, setValue]);

  const watchedItems = watch("items") || [];
  const watchedUseTax = watch("use_tax");
  const watchedDiscount = Number(watch("discount_amount")) || 0;
  const watchedPerdiemPrice = Number(watch("perdiem_price")) || 0;
  const watchedPerdiemQty = watch("perdiem_qty") || 0;
  const watchedPerdiemName = watch("perdiem_name");
  const watchedTransportPrice = Number(watch("transport_price")) || 0;
  const watchedTransportQty = watch("transport_qty") || 0;
  const watchedTransportName = watch("transport_name");
  const watchedUserId = watch("user_id");

  const selectedClient = clients.find(c => c.id === watchedUserId);

  const { total } = React.useMemo(() => {
    const iSubtotal = (watchedItems || []).reduce((acc: number, item: any) => acc + (Number(item.qty || 0) * Number(item.price || 0)), 0);
    const pTotal = Number(watchedPerdiemPrice || 0) * Number(watchedPerdiemQty || 0);
    const tTotal = Number(watchedTransportPrice || 0) * Number(watchedTransportQty || 0);
    const sub = iSubtotal + pTotal + tTotal - Number(watchedDiscount || 0);
    const taxVal = watchedUseTax ? sub * 0.11 : 0;
    return { total: sub + taxVal };
  }, [watchedItems, watchedPerdiemPrice, watchedPerdiemQty, watchedTransportPrice, watchedTransportQty, watchedDiscount, watchedUseTax]);

  const [activeCatalog, setActiveCatalog] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(onSubmit)();
      }
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'n': e.preventDefault(); append({ service_id: "", equipment_id: "", qty: 1, price: 0 }); break;
          case 'p': e.preventDefault(); setActiveCatalog('perdiem'); break;
          case 't': e.preventDefault(); setActiveCatalog('transport'); break;
          case 'e': e.preventDefault(); setActiveCatalog('equipment'); break;
          case 'k': e.preventDefault(); onAddCustomer(); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSubmit, append, onSubmit, onAddCustomer]);

  const handleServiceChange = (index: number, serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setValue(`items.${index}.service_id`, serviceId);
      setValue(`items.${index}.price`, Number(service.price));
      if (service.parameters) {
        try {
          const params = typeof service.parameters === 'string' ? JSON.parse(service.parameters) : service.parameters;
          setValue(`items.${index}.parameters`, Array.isArray(params) ? params.map((p: any) => p.name) : []);
        } catch (e) { setValue(`items.${index}.parameters`, []); }
      }
    }
  };

  const handleRemoveParameter = (itemIndex: number, paramIndex: number) => {
    const currentParams = [...(watchedItems[itemIndex]?.parameters || [])];
    currentParams.splice(paramIndex, 1);
    setValue(`items.${itemIndex}.parameters`, currentParams);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-[100vw] sm:max-w-[95vw] lg:max-w-[65vw] h-full sm:h-[90vh] p-0 border-none shadow-2xl rounded-none sm:rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-emerald-900 px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between text-white shrink-0 border-b border-white/10 shadow-lg">
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm sm:text-xl font-black uppercase tracking-widest leading-none truncate">Draft Penawaran Baru</DialogTitle>
              <DialogDescription className="text-[9px] sm:text-xs text-emerald-200 font-bold uppercase tracking-widest mt-1 opacity-60 italic truncate">Workspace Editor</DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex flex-col items-end mr-4 border-r border-white/10 pr-6">
              <p className="text-[10px] font-black text-emerald-300/50 uppercase tracking-widest leading-none mb-1">Total Tagihan</p>
              <p className="text-xl font-black font-mono leading-none">Rp {total.toLocaleString("id-ID")}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 sm:h-10 sm:w-10 text-white/60 hover:text-white hover:bg-white/10 rounded-xl"><X className="h-5 w-5 sm:h-6 sm:w-6" /></Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <form id="quotation-form" onSubmit={handleSubmit(onSubmit)} className="h-full overflow-y-auto p-4 sm:p-8 md:p-12 space-y-10 sm:space-y-14 bg-white scrollbar-thin">
            
            {/* Step 1: Klien */}
            <section className="space-y-6 sm:space-y-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 sm:pb-5">
                <h4 className="text-xs sm:text-sm font-black text-emerald-600 uppercase tracking-[2px] sm:tracking-[3px] flex items-center gap-3 sm:gap-4">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] sm:text-xs">01</span>
                  Klien
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 bg-slate-50/50 p-5 sm:p-8 rounded-2xl border border-slate-100 shadow-inner">
                <div className="space-y-2 sm:space-y-3">
                  <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">No. Penawaran</label>
                  <Input {...register("quotation_number")} readOnly className="bg-white border-slate-100 font-mono font-black text-emerald-700 h-11 sm:h-12 rounded-xl text-sm sm:text-base px-4 sm:px-5" />
                </div>
                <div className="space-y-2 sm:space-y-3 flex flex-col">
                  <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Pilih Klien</label>
                  <div className="flex gap-3 sm:gap-4 items-start">
                    <div className="flex-1">
                      <Controller
                        control={control}
                        name="user_id"
                        render={({ field }) => (
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger className="h-11 sm:h-12 border-slate-100 bg-white rounded-xl font-bold text-xs sm:text-sm px-4 sm:px-5"><SelectValue placeholder="Cari klien..." /></SelectTrigger>
                            <SelectContent className="rounded-xl border-emerald-50 shadow-2xl">
                              {clients.map(c => <SelectItem key={c.id} value={c.id} className="text-sm font-bold py-3 px-4">{c.full_name} — {c.company_name || "PERSONAL"}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="flex flex-col items-center group">
                      <Button type="button" size="icon" onClick={onAddCustomer} className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-white border border-slate-200 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm shrink-0">
                        <UserPlus className="h-5 w-5 sm:h-6 sm:w-6" />
                      </Button>
                      <ShortcutLabel>Alt+K</ShortcutLabel>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Step 2: Layanan */}
            <section className="space-y-6 sm:space-y-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 sm:pb-5">
                <h4 className="text-xs sm:text-sm font-black text-emerald-600 uppercase tracking-[2px] sm:tracking-[3px] flex items-center gap-3 sm:gap-4">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] sm:text-xs">02</span>
                  Layanan
                </h4>
                <div className="flex flex-col items-center group">
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ service_id: "", equipment_id: "", qty: 1, price: 0 })} className="h-10 sm:h-11 px-5 sm:px-8 rounded-xl border-emerald-200 text-emerald-700 font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">
                    TAMBAH
                  </Button>
                  <ShortcutLabel>Alt+N</ShortcutLabel>
                </div>
              </div>
              <div className="space-y-5 sm:space-y-6">
                {fields.map((field, index) => {
                  if (watchedItems[index]?.equipment_id) return null;
                  return (
                    <div key={field.id} className="bg-white border border-slate-100 p-4 sm:p-6 rounded-2xl shadow-sm hover:border-emerald-300 transition-all space-y-4 sm:space-y-5 group">
                      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-6 items-end">
                        <div className="w-full lg:col-span-7 space-y-2 sm:space-y-3 text-left">
                          <label className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">Layanan Lab</label>
                          <Controller
                            control={control}
                            name={`items.${index}.service_id`}
                            render={({ field }) => (
                              <Select value={field.value || ""} onValueChange={(val) => { field.onChange(val); handleServiceChange(index, val); }}>
                                <SelectTrigger className="h-11 sm:h-12 border-slate-50 bg-slate-50/50 rounded-xl font-bold text-xs sm:text-sm group-hover:bg-white px-4 sm:px-5"><SelectValue placeholder="Pilih Layanan..." /></SelectTrigger>
                                <SelectContent className="rounded-xl border-emerald-50 max-h-[300px]">{services.map(s => <SelectItem key={s.id} value={s.id} className="text-sm font-bold py-3 px-4">{s.name}</SelectItem>)}</SelectContent>
                              </Select>
                            )}
                          />
                          
                          {/* Display Regulation & Parameters */}
                          {(() => {
                            const service = services.find(s => s.id === watchedItems[index]?.service_id);
                            const regulationText = service?.regulation_ref?.name || service?.regulation;
                            const hasParams = (watchedItems[index]?.parameters?.length ?? 0) > 0;
                            if (!regulationText && !hasParams) return null;
                            return (
                              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
                                {regulationText && <span className="inline-block text-[9px] sm:text-[10px] font-black text-emerald-700 uppercase tracking-tight bg-emerald-50 px-3 py-1 rounded-md border border-emerald-100/50">{regulationText}</span>}
                                {hasParams && (
                                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {watchedItems[index]?.parameters?.map((param: string, pIdx: number) => (
                                      <span key={pIdx} className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-md bg-blue-500 text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-tighter group/param hover:bg-blue-600 transition-all shadow-sm">
                                        {param}
                                        <button type="button" onClick={() => handleRemoveParameter(index, pIdx)} className="text-blue-100 hover:text-white transition-colors"><X className="h-2.5 w-2.5 sm:h-3 sm:w-3" /></button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        
                        <div className="w-full flex gap-4 lg:grid lg:col-span-5 items-end">
                          <div className="flex-1 lg:col-span-4 space-y-2 sm:space-y-3">
                            <label className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest text-center w-full block">Qty</label>
                            <Input type="number" {...register(`items.${index}.qty`)} className="h-11 sm:h-12 text-center font-black text-sm sm:text-base bg-slate-50/50 border-none rounded-xl group-hover:bg-white" />
                          </div>
                          <div className="flex-[2] lg:col-span-6 space-y-2 sm:space-y-3 text-left">
                            <label className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">Harga</label>
                            <Input type="number" {...register(`items.${index}.price`)} className="h-11 sm:h-12 font-black text-emerald-600 bg-slate-50/50 border-none rounded-xl text-xs sm:text-sm px-4 group-hover:bg-white" />
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-11 w-11 text-slate-200 hover:text-rose-500 rounded-xl shrink-0"><Trash2 className="h-5 w-5" /></Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Step 3: Biaya Ops */}
            <section className="space-y-6 sm:space-y-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 sm:pb-5">
                <h4 className="text-xs sm:text-sm font-black text-emerald-600 uppercase tracking-[2px] sm:tracking-[3px] flex items-center gap-3 sm:gap-4">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] sm:text-xs">03</span>
                  Operasional
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                {/* Perdiem */}
                <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-100 space-y-4 sm:space-y-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group/perdiem">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4 text-slate-700">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 group-hover/perdiem:scale-110 transition-transform" />
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Perdiem / Engineer</span>
                    </div>
                    <div className="flex flex-col items-center group">
                      <Button type="button" variant="outline" size="sm" onClick={() => setActiveCatalog('perdiem')} className="h-8 sm:h-9 px-4 sm:px-5 text-[9px] sm:text-[10px] font-black border-emerald-200 text-emerald-700 bg-white rounded-xl shadow-sm hover:bg-emerald-600 hover:text-white transition-all">KATALOG</Button>
                      <ShortcutLabel>Alt+P</ShortcutLabel>
                    </div>
                  </div>
                  {watchedPerdiemName && <p className="text-[10px] sm:text-[11px] text-emerald-600 font-black bg-emerald-100/50 px-3 py-1.5 rounded-lg w-fit uppercase tracking-tighter shadow-sm">{watchedPerdiemName}</p>}
                  <div className="grid grid-cols-2 gap-4 sm:gap-5">
                    <div className="space-y-1.5 sm:space-y-2"><span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase ml-1">Harga</span><Input type="number" {...register("perdiem_price", { valueAsNumber: true })} className="h-10 sm:h-11 bg-slate-50 border-none group-hover/perdiem:bg-white transition-colors rounded-xl font-black text-xs sm:text-sm px-4" /></div>
                    <div className="space-y-1.5 sm:space-y-2"><span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase ml-1 text-center block">Hari</span><Input type="number" {...register("perdiem_qty", { valueAsNumber: true })} className="h-10 sm:h-11 bg-slate-50 border-none group-hover/perdiem:bg-white transition-colors text-center font-black text-xs sm:text-sm rounded-xl px-4" /></div>
                  </div>
                </div>

                {/* Transport */}
                <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-100 space-y-4 sm:space-y-5 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group/transport">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4 text-slate-700">
                      <Car className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 group-hover/transport:scale-110 transition-transform" />
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Transport</span>
                    </div>
                    <div className="flex flex-col items-center group">
                      <Button type="button" variant="outline" size="sm" onClick={() => setActiveCatalog('transport')} className="h-8 sm:h-9 px-4 sm:px-5 text-[9px] sm:text-[10px] font-black border-blue-200 text-blue-700 bg-white rounded-xl shadow-sm hover:bg-blue-600 hover:text-white transition-all">KATALOG</Button>
                      <ShortcutLabel>Alt+T</ShortcutLabel>
                    </div>
                  </div>
                  {watchedTransportName && <p className="text-[10px] sm:text-[11px] text-blue-600 font-black bg-blue-100/50 px-3 py-1.5 rounded-lg w-fit uppercase tracking-tighter shadow-sm">{watchedTransportName}</p>}
                  <div className="grid grid-cols-2 gap-4 sm:gap-5">
                    <div className="space-y-1.5 sm:space-y-2"><span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase ml-1">Harga</span><Input type="number" {...register("transport_price", { valueAsNumber: true })} className="h-10 sm:h-11 bg-slate-50 border-none group-hover/transport:bg-white transition-colors rounded-xl font-black text-xs sm:text-sm px-4" /></div>
                    <div className="space-y-1.5 sm:space-y-2"><span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase ml-1 text-center block">Qty</span><Input type="number" {...register("transport_qty", { valueAsNumber: true })} className="h-10 sm:h-11 bg-slate-50 border-none group-hover/transport:bg-white transition-colors text-center font-black text-xs sm:text-sm rounded-xl px-4" /></div>
                  </div>
                </div>
              </div>

              {/* Equipment */}
              <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-100 space-y-6 sm:space-y-8 shadow-sm hover:border-amber-300 hover:shadow-md transition-all group/equipment">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4 text-emerald-950">
                    <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 group-hover/equipment:rotate-12 transition-transform" />
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Sewa Alat</span>
                  </div>
                  <div className="flex flex-col items-center group">
                    <Button type="button" variant="outline" size="sm" onClick={() => setActiveCatalog('equipment')} className="h-8 sm:h-9 px-4 sm:px-6 text-[9px] sm:text-[10px] font-black border-amber-200 text-amber-800 bg-white rounded-xl shadow-sm hover:bg-amber-600 hover:text-white transition-all">KATALOG</Button>
                    <ShortcutLabel>Alt+E</ShortcutLabel>
                  </div>
                </div>
                <div className="space-y-4">
                  {fields.filter((item: any) => item.equipment_id).length === 0 ? (
                    <div className="text-center py-8 sm:py-10 bg-white/50 rounded-xl border-2 border-dashed border-slate-200"><span className="text-[10px] sm:text-[11px] text-slate-400 font-black uppercase italic tracking-widest">Kosong</span></div>
                  ) : (
                    fields.map((field, index) => {
                      if (!watchedItems[index]?.equipment_id) return null;
                      return (
                        <div key={field.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-center bg-white border border-slate-100 p-4 sm:p-5 rounded-2xl shadow-sm group">
                          <div className="sm:col-span-6 flex items-center gap-3 sm:gap-4"><Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" /><span className="text-xs font-black text-emerald-950 uppercase truncate">{watchedItems[index]?.name}</span></div>
                          <div className="flex gap-3 sm:contents">
                            <div className="flex-1 sm:col-span-3"><Input type="number" {...register(`items.${index}.price`, { valueAsNumber: true })} className="h-9 sm:h-10 text-xs sm:text-sm font-black bg-slate-50 border-none rounded-lg text-right px-3 sm:px-4" /></div>
                            <div className="w-16 sm:col-span-2"><Input type="number" {...register(`items.${index}.qty`, { valueAsNumber: true })} className="h-9 sm:h-10 text-xs sm:text-sm font-black text-center bg-slate-50 border-none rounded-lg" /></div>
                            <div className="sm:col-span-1 flex justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-9 w-9 sm:h-10 sm:w-10 text-slate-200 hover:text-rose-500 shrink-0"><XCircle className="h-4 w-4 sm:h-5 sm:w-5" /></Button></div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>

            {/* Step 4: Summary */}
            <section className="space-y-6 sm:space-y-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 sm:pb-5">
                <h4 className="text-xs sm:text-sm font-black text-emerald-600 uppercase tracking-[2px] sm:tracking-[3px] flex items-center gap-3 sm:gap-4">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] sm:text-xs">04</span>
                  Finansial
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pb-20 sm:pb-0">
                <div className="space-y-2 sm:space-y-3 text-left">
                  <label className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Diskon (Rp)</label>
                  <Input type="number" {...register("discount_amount", { valueAsNumber: true })} className="h-11 sm:h-12 font-black text-sm sm:text-base rounded-xl bg-slate-50 border-none shadow-inner px-4 sm:px-5 text-emerald-600" />
                </div>
                
                <button type="button" onClick={() => setValue("use_tax", !watchedUseTax)}
                  className={cn("p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between w-full text-left group", watchedUseTax ? "bg-emerald-50/50 border-emerald-100 shadow-sm" : "bg-slate-50 border-slate-100 shadow-inner hover:bg-slate-100/50")}>
                  <div className="flex items-center gap-3 sm:gap-4 text-left">
                    <div className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300", watchedUseTax ? "bg-emerald-600 text-white shadow-lg scale-110" : "bg-slate-200 text-slate-400")}>
                      {watchedUseTax ? <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" /> : <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] sm:text-xs font-black text-slate-700 uppercase tracking-widest leading-none">Pajak PPN</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mt-1">Tarif 11%</span>
                    </div>
                  </div>
                  <div className={cn("h-6 w-6 sm:h-7 sm:w-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300", watchedUseTax ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-200")}>{watchedUseTax && <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[4px]" />}</div>
                </button>
              </div>
            </section>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 sm:px-10 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between shrink-0 gap-6 sm:gap-0">
          <div className="flex flex-col items-center sm:items-start gap-1 w-full sm:w-auto border-b sm:border-none pb-4 sm:pb-0">
            <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Estimasi Total Tagihan</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono tracking-tighter leading-none">Rp {total.toLocaleString("id-ID")}</span>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose} 
              className="flex-1 sm:flex-none font-black text-slate-400 text-xs uppercase px-8 h-14 rounded-2xl hover:bg-slate-200 transition-all border border-transparent hover:border-slate-300"
            >
              Batal
            </Button>
            
            <div className="flex-1 sm:flex-none flex flex-col items-center sm:items-end">
              <LoadingButton 
                form="quotation-form" 
                type="submit" 
                loading={isSubmitting} 
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black px-12 h-14 rounded-2xl shadow-xl shadow-emerald-900/20 text-xs tracking-widest uppercase transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Check className="h-5 w-5" /> 
                <span>Simpan Penawaran</span>
              </LoadingButton>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2 hidden sm:block opacity-40 italic">Shortcut: ctrl + enter</span>
            </div>
          </div>
        </div>

        <CatalogDialog activeCatalog={activeCatalog} onClose={() => setActiveCatalog(null)} catalogs={operationalCatalogs} equipment={equipment} onSelect={(field: string, val: string, price: any, name: string) => {
          if (field === 'equipment') append({ service_id: "", equipment_id: val, qty: 1, price: Number(price), name });
          else { setValue(`${field}_name` as any, name); setValue(`${field}_price` as any, Number(price)); setValue(`${field}_qty` as any, 1); }
          setActiveCatalog(null);
        }} />
      </DialogContent>
    </Dialog>
  );
}

function CatalogDialog({ activeCatalog, onClose, catalogs, equipment, onSelect }: any) {
  if (!activeCatalog) return null;
  const isEquipment = activeCatalog === 'equipment';
  const items = isEquipment ? equipment : catalogs.filter((c: any) => c.category === activeCatalog);
  const titles: any = { perdiem: 'Perdiem', transport: 'Transport', equipment: 'Alat Lab' };
  const icons: any = { perdiem: MapPin, transport: Car, equipment: Wrench };
  const Icon = icons[activeCatalog];

  return (
    <Dialog open={!!activeCatalog} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-[550px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-white h-auto max-h-[85vh] flex flex-col">
        <div className={cn("p-5 sm:p-8 text-white flex items-center gap-4 sm:gap-5 shrink-0", activeCatalog === 'perdiem' ? 'bg-emerald-600' : activeCatalog === 'transport' ? 'bg-blue-600' : 'bg-amber-600')}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center border border-white/20 shadow-inner shrink-0">
            <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="min-w-0">
            <DialogTitle className="text-base sm:text-lg font-black uppercase tracking-widest leading-none truncate">{titles[activeCatalog]}</DialogTitle>
            <DialogDescription className="text-[9px] sm:text-[10px] text-white/60 font-bold uppercase mt-1 sm:mt-1.5 tracking-widest truncate">Direktori Sistem</DialogDescription>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-3 sm:space-y-4 bg-white scrollbar-thin">
          {items.map((c: any) => (
            <div 
              key={c.id} 
              className={cn(
                "p-4 sm:p-6 border rounded-2xl cursor-pointer flex justify-between items-center group transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.02]",
                activeCatalog === 'perdiem' ? 'border-slate-100 hover:border-emerald-400 hover:bg-emerald-50/30' : 
                activeCatalog === 'transport' ? 'border-slate-100 hover:border-blue-400 hover:bg-blue-50/30' : 
                'border-slate-100 hover:border-amber-400 hover:bg-amber-50/30'
              )}
              onClick={() => onSelect(activeCatalog, c.id, c.price, c.name)}
            >
              <div className="space-y-1 min-w-0 flex-1 pr-4 text-left">
                <p className="font-black text-emerald-950 uppercase tracking-tighter text-sm sm:text-base truncate">{c.name}</p>
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none truncate">{isEquipment ? c.specification : c.location || c.unit}</p>
              </div>
              <span className={cn(
                "font-black border px-3 sm:px-5 py-2 sm:py-3 rounded-xl transition-all text-xs sm:text-sm shadow-inner shrink-0",
                activeCatalog === 'perdiem' ? 'text-emerald-700 bg-emerald-50 border-emerald-100 group-hover:bg-white group-hover:border-emerald-200' :
                activeCatalog === 'transport' ? 'text-blue-700 bg-blue-50 border-blue-100 group-hover:bg-white group-hover:border-blue-200' :
                'text-amber-700 bg-amber-50 border-amber-100 group-hover:bg-white group-hover:border-amber-200'
              )}>
                Rp {Number(c.price).toLocaleString("id-ID")}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
