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
    <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1 opacity-70 group-hover:text-emerald-600 transition-colors">
      <Keyboard className="h-2 w-2" /> {children}
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
  const watchedTransportPrice = Number(watch("transport_price")) || 0;
  const watchedTransportQty = watch("transport_qty") || 0;
  const watchedPerdiemName = watch("perdiem_name");
  const watchedTransportName = watch("transport_name");
  const watchedUserId = watch("user_id");

  const selectedClient = clients.find(c => c.id === watchedUserId);

  const itemsSubtotal = watchedItems.reduce((acc: number, item: any) => acc + (Number(item.qty || 0) * Number(item.price || 0)), 0);
  const perdiemTotal = Number(watchedPerdiemPrice) * Number(watchedPerdiemQty);
  const transportTotal = Number(watchedTransportPrice) * Number(watchedTransportQty);
  const subtotalBeforeDiscount = itemsSubtotal + perdiemTotal + transportTotal;
  const subtotal = subtotalBeforeDiscount - Number(watchedDiscount);
  const tax = watchedUseTax ? subtotal * 0.11 : 0;
  const total = subtotal + tax;

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="max-w-[95vw] lg:max-w-[85vw] h-[90vh] p-0 border-none shadow-2xl rounded-2xl overflow-hidden flex flex-col">
        {/* Header (Accessible with DialogTitle) */}
        <div className="bg-emerald-900 px-6 py-4 flex items-center justify-between text-white shrink-0 border-b border-white/10 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black uppercase tracking-widest leading-none">Draft Penawaran Baru</DialogTitle>
              <DialogDescription className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest mt-1 opacity-60 italic">Workspace Editor</DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex gap-2 mr-4 border-r border-white/10 pr-4">
              <div className="text-right">
                <p className="text-[8px] font-black text-emerald-300/50 uppercase tracking-widest leading-none">Total Tagihan</p>
                <p className="text-lg font-black font-mono leading-none">Rp {total.toLocaleString("id-ID")}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl"><X className="h-5 w-5" /></Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <form id="quotation-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 bg-white scrollbar-thin">
            
            {/* Step 1: Klien */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[3px] flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px]">01</span>
                  Administrasi Klien
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">No. Penawaran</label>
                  <Input {...register("quotation_number")} readOnly className="bg-white border-slate-100 font-mono font-black text-emerald-700 h-11 rounded-xl text-sm" />
                </div>
                <div className="space-y-2 flex flex-col">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1">Pilih Klien</label>
                  <div className="flex gap-3 items-start">
                    <div className="flex-1">
                      <Controller
                        control={control}
                        name="user_id"
                        render={({ field }) => (
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger className="h-11 border-slate-100 bg-white rounded-xl font-bold text-xs"><SelectValue placeholder="Cari klien..." /></SelectTrigger>
                            <SelectContent className="rounded-xl border-emerald-50 shadow-2xl">
                              {clients.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold py-3">{c.full_name} — {c.company_name || "PERSONAL"}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="flex flex-col items-center group">
                      <Button type="button" size="icon" onClick={onAddCustomer} className="h-11 w-11 rounded-xl bg-white border border-slate-200 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                        <UserPlus className="h-5 w-5" />
                      </Button>
                      <ShortcutLabel>Alt+K</ShortcutLabel>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Step 2: Layanan */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[3px] flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px]">02</span>
                  Layanan Pengujian
                </h4>
                <div className="flex flex-col items-center group">
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ service_id: "", equipment_id: "", qty: 1, price: 0 })} className="h-10 px-6 rounded-xl border-emerald-200 text-emerald-700 font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">
                    TAMBAH ITEM
                  </Button>
                  <ShortcutLabel>Alt+N</ShortcutLabel>
                </div>
              </div>
              <div className="space-y-4">
                {fields.map((field, index) => {
                  if (watchedItems[index]?.equipment_id) return null;
                  return (
                    <div key={field.id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:border-emerald-300 transition-all space-y-4 group">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                        <div className="lg:col-span-7 space-y-2">
                          <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-2">Layanan Lab</label>
                          <Controller
                            control={control}
                            name={`items.${index}.service_id`}
                            render={({ field }) => (
                              <Select value={field.value || ""} onValueChange={(val) => { field.onChange(val); handleServiceChange(index, val); }}>
                                <SelectTrigger className="h-10 border-slate-50 bg-slate-50/50 rounded-xl font-bold text-[11px] group-hover:bg-white"><SelectValue placeholder="Pilih Layanan..." /></SelectTrigger>
                                <SelectContent className="rounded-xl border-emerald-50">{services.map(s => <SelectItem key={s.id} value={s.id} className="text-xs font-bold">{s.name}</SelectItem>)}</SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        <div className="lg:col-span-2 space-y-2">
                          <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest text-center w-full block">Qty</label>
                          <Input type="number" {...register(`items.${index}.qty`)} className="h-10 text-center font-black bg-slate-50/50 border-none rounded-xl group-hover:bg-white" />
                        </div>
                        <div className="lg:col-span-3 space-y-2 flex items-center gap-2">
                          <div className="flex-1 space-y-2">
                            <label className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-2">Harga</label>
                            <Input type="number" {...register(`items.${index}.price`)} className="h-10 font-black text-emerald-600 bg-slate-50/50 border-none rounded-xl text-xs group-hover:bg-white" />
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-9 w-9 text-slate-200 hover:text-rose-500 rounded-lg mt-6"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Step 3: Biaya Ops */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[3px] flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px]">03</span>
                  Biaya Ops & Alat
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Perdiem */}
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-700">
                      <MapPin className="h-4 w-4 text-emerald-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Perdiem</span>
                    </div>
                    <div className="flex flex-col items-center group">
                      <Button type="button" variant="outline" size="sm" onClick={() => setActiveCatalog('perdiem')} className="h-8 px-4 text-[8px] font-black border-emerald-200 text-emerald-700 bg-white rounded-lg shadow-sm hover:bg-emerald-600 hover:text-white transition-all">KATALOG</Button>
                      <ShortcutLabel>Alt+P</ShortcutLabel>
                    </div>
                  </div>
                  {watchedPerdiemName && <p className="text-[9px] text-emerald-600 font-black bg-emerald-100/50 px-2 py-1 rounded-lg w-fit uppercase tracking-tighter">{watchedPerdiemName}</p>}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><span className="text-[8px] font-black text-slate-400 uppercase ml-1">Harga</span><Input type="number" {...register("perdiem_price", { valueAsNumber: true })} className="h-9 bg-white rounded-xl font-black text-xs border-slate-100" /></div>
                    <div className="space-y-1.5"><span className="text-[8px] font-black text-slate-400 uppercase ml-1 text-center block">Hari</span><Input type="number" {...register("perdiem_qty", { valueAsNumber: true })} className="h-9 bg-white text-center font-black text-xs border-slate-100" /></div>
                  </div>
                </div>

                {/* Transport */}
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-700">
                      <Car className="h-4 w-4 text-blue-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Transport</span>
                    </div>
                    <div className="flex flex-col items-center group">
                      <Button type="button" variant="outline" size="sm" onClick={() => setActiveCatalog('transport')} className="h-8 px-4 text-[8px] font-black border-emerald-200 text-emerald-700 bg-white rounded-lg shadow-sm hover:bg-blue-600 hover:text-white transition-all">KATALOG</Button>
                      <ShortcutLabel>Alt+T</ShortcutLabel>
                    </div>
                  </div>
                  {watchedTransportName && <p className="text-[9px] text-blue-600 font-black bg-blue-100/50 px-2 py-1 rounded-lg w-fit uppercase tracking-tighter">{watchedTransportName}</p>}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><span className="text-[8px] font-black text-slate-400 uppercase ml-1">Harga</span><Input type="number" {...register("transport_price", { valueAsNumber: true })} className="h-9 bg-white rounded-xl font-black text-xs border-slate-100" /></div>
                    <div className="space-y-1.5"><span className="text-[8px] font-black text-slate-400 uppercase ml-1 text-center block">Qty</span><Input type="number" {...register("transport_qty", { valueAsNumber: true })} className="h-9 bg-white text-center font-black text-xs border-slate-100" /></div>
                  </div>
                </div>
              </div>

              {/* Equipment */}
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-emerald-950">
                    <Wrench className="h-4 w-4 text-amber-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sewa Alat Lab</span>
                  </div>
                  <div className="flex flex-col items-center group">
                    <Button type="button" variant="outline" size="sm" onClick={() => setActiveCatalog('equipment')} className="h-8 px-4 text-[8px] font-black border-amber-200 text-amber-800 bg-white rounded-xl hover:bg-amber-600 hover:text-white transition-all">KATALOG ALAT</Button>
                    <ShortcutLabel>Alt+E</ShortcutLabel>
                  </div>
                </div>
                <div className="space-y-3">
                  {fields.filter((item: any) => item.equipment_id).length === 0 ? (
                    <div className="text-center py-8 bg-white/50 rounded-xl border-2 border-dashed border-slate-200"><span className="text-[9px] text-slate-400 font-black uppercase italic">Belum ada alat dipilih</span></div>
                  ) : (
                    fields.map((field, index) => {
                      if (!watchedItems[index]?.equipment_id) return null;
                      return (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white border border-slate-100 p-4 rounded-xl shadow-sm group">
                          <div className="md:col-span-6 flex items-center gap-3"><Wrench className="h-3.5 w-3.5 text-amber-600" /><span className="text-[10px] font-black text-emerald-950 uppercase truncate">{watchedItems[index]?.name}</span></div>
                          <div className="md:col-span-3"><Input type="number" {...register(`items.${index}.price`, { valueAsNumber: true })} className="h-8 text-xs font-black bg-slate-50 border-none rounded-lg text-right" /></div>
                          <div className="md:col-span-2"><Input type="number" {...register(`items.${index}.qty`, { valueAsNumber: true })} className="h-8 text-xs font-black text-center bg-slate-50 border-none rounded-lg" /></div>
                          <div className="md:col-span-1 flex justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-slate-200 hover:text-rose-500"><XCircle className="h-4 w-4" /></Button></div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>

            {/* Step 4: Summary Inputs */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[3px] flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px]">04</span>
                  Diskon & Pajak
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nominal Diskon (Rp)</label>
                  <Input type="number" {...register("discount_amount", { valueAsNumber: true })} className="h-11 font-black text-sm rounded-xl bg-slate-50 border-none shadow-inner px-4 text-emerald-600" />
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-inner group cursor-pointer flex items-center justify-between" onClick={() => setValue("use_tax", !watchedUseTax)}>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", watchedUseTax ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400")}>
                      {watchedUseTax ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    </div>
                    <label className="text-[10px] font-black text-slate-700 cursor-pointer uppercase tracking-widest">Gunakan Pajak PPN (11%)</label>
                  </div>
                  <Checkbox id="use_tax" checked={watchedUseTax} className="h-5 w-5 rounded-md data-[state=checked]:bg-emerald-600" />
                </div>
              </div>
            </section>
          </form>

          {/* Right Side: LIVE PREVIEW */}
          <div className="hidden lg:flex w-[380px] bg-slate-50 border-l border-slate-200 p-8 flex-col shrink-0">
            <div className="mb-8 space-y-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">Preview</h3>
              <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[2px]">Real-time Calculation</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-xl border border-white space-y-8 flex-1 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600" />
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-300 uppercase">Customer</p>
                    <p className="text-[11px] font-black text-emerald-950 uppercase truncate max-w-[160px]">{selectedClient?.full_name || "—"}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase truncate max-w-[160px]">{selectedClient?.company_name || "Personal Client"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-emerald-600 uppercase">No. Penawaran</p>
                    <p className="text-[10px] font-mono font-bold text-slate-600">{nextQuotationNumber}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[8px] font-black text-slate-300 uppercase border-b pb-2">Billing Details</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-tighter"><span>Layanan Lab ({watchedItems.filter(i=>i.service_id).length})</span><span>Rp {itemsSubtotal.toLocaleString()}</span></div>
                    {perdiemTotal > 0 && <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-tighter"><span>Uang Harian</span><span>Rp {perdiemTotal.toLocaleString()}</span></div>}
                    {transportTotal > 0 && <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-tighter"><span>Transportasi</span><span>Rp {transportTotal.toLocaleString()}</span></div>}
                    {watchedDiscount > 0 && <div className="flex justify-between text-[9px] font-black text-rose-500 uppercase tracking-tighter"><span>Potongan Diskon</span><span>-Rp {watchedDiscount.toLocaleString()}</span></div>}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-dashed border-slate-100">
                <div className="text-right">
                  <span className="text-[8px] font-black text-emerald-600 uppercase block mb-1 tracking-widest">Grand Total (Est)</span>
                  <span className="text-2xl font-black font-mono tracking-tighter text-emerald-950 leading-none">Rp {total.toLocaleString("id-ID")}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-md"><DollarSign className="h-4 w-4" /></div>
                  <div className="flex flex-col"><span className="text-[8px] font-black text-emerald-700 uppercase">Draf Penawaran</span><span className="text-[9px] font-bold text-emerald-600/70 uppercase">Ready to Save</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-8 py-6 flex items-center justify-between shrink-0">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Estimasi</span>
            <span className="text-2xl font-black text-emerald-950 font-mono tracking-tighter leading-none">Rp {total.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex gap-4">
            <Button type="button" variant="ghost" onClick={onClose} className="font-black text-slate-400 text-[10px] uppercase px-8 h-12 rounded-xl hover:bg-slate-100 transition-colors">Batal</Button>
            <div className="flex flex-col items-center group">
              <LoadingButton form="quotation-form" type="submit" loading={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-12 h-14 rounded-xl shadow-xl shadow-emerald-900/20 text-[11px] tracking-widest uppercase transition-all active:scale-95 group">
                <Check className="h-4 w-4 mr-2" /> SIMPAN PENAWARAN
              </LoadingButton>
              <ShortcutLabel>ctrl + enter</ShortcutLabel>
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
  const titles: any = { perdiem: 'Katalog Perdiem', transport: 'Katalog Transport', equipment: 'Katalog Alat Lab' };
  const icons: any = { perdiem: MapPin, transport: Car, equipment: Wrench };
  const Icon = icons[activeCatalog];

  return (
    <Dialog open={!!activeCatalog} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] rounded-xl p-0 overflow-hidden border-none shadow-2xl">
        <div className={cn("p-6 text-white flex items-center gap-4", activeCatalog === 'perdiem' ? 'bg-emerald-600' : activeCatalog === 'transport' ? 'bg-blue-600' : 'bg-amber-600')}>
          <Icon className="h-6 w-6" />
          <DialogTitle className="text-base font-black uppercase tracking-widest">{titles[activeCatalog]}</DialogTitle>
          <DialogDescription className="sr-only">Pilih data dari katalog {activeCatalog}</DialogDescription>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-6 space-y-3 bg-white scrollbar-thin">
          {items.map((c: any) => (
            <div key={c.id} className="p-5 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer flex justify-between items-center group transition-all"
              onClick={() => onSelect(activeCatalog, c.id, c.price, c.name)}>
              <div><p className="font-black text-emerald-950 uppercase tracking-tighter text-sm">{c.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{isEquipment ? c.specification : c.location || c.unit}</p></div>
              <span className="font-black text-emerald-700 bg-slate-50 group-hover:bg-white border border-slate-100 px-4 py-2 rounded-lg transition-all text-xs shadow-sm">
                Rp {Number(c.price).toLocaleString("id-ID")}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
