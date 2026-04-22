"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  FileText, Plus, Trash2, Check, X, MapPin, Car, Wrench, 
  DollarSign, CheckCircle, XCircle, UserPlus, Info, PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { LoadingButton } from "@/components/ui";
import { cn } from "@/lib/utils";

const quotationSchema = z.object({
  quotation_number: z.string().min(1, "Nomor penawaran wajib diisi"),
  title: z.string().min(3, "Judul pengujian wajib diisi").nullable().or(z.literal("")),
  user_id: z.string().min(1, "Pilih klien terlebih dahulu"),
  use_tax: z.boolean().default(true),
  discount_amount: z.coerce.number().min(0).default(0),
  perdiem_name: z.string().optional().nullable(),
  perdiem_price: z.coerce.number().default(0),
  perdiem_qty: z.coerce.number().default(0),
  transport_name: z.string().optional().nullable(),
  transport_price: z.coerce.number().default(0),
  transport_qty: z.coerce.number().default(0),
  items: z.array(z.object({
    service_id: z.string().optional().nullable(),
    equipment_id: z.string().optional().nullable(),
    qty: z.coerce.number().min(1).default(1),
    price: z.coerce.number().min(0).default(0),
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
  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(quotationSchema),
    mode: 'onChange',
    defaultValues: {
      quotation_number: nextQuotationNumber,
      title: "",
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

  const groupedServices = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    services.forEach(s => {
      const cat = s.category_ref?.name || s.category || "LAINNYA";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return groups;
  }, [services]);

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

  const { subtotal, taxAmount, total } = React.useMemo(() => {
    const iSubtotal = (watchedItems || []).reduce((acc: number, item: any) => acc + (Number(item.qty || 0) * Number(item.price || 0)), 0);
    const pTotal = Number(watchedPerdiemPrice || 0) * Number(watchedPerdiemQty || 0);
    const tTotal = Number(watchedTransportPrice || 0) * Number(watchedTransportQty || 0);
    const sub = iSubtotal + pTotal + tTotal - Number(watchedDiscount || 0);
    const taxVal = watchedUseTax ? sub * 0.11 : 0;
    return { subtotal: sub, taxAmount: taxVal, total: sub + taxVal };
  }, [watchedItems, watchedPerdiemPrice, watchedPerdiemQty, watchedTransportPrice, watchedTransportQty, watchedDiscount, watchedUseTax]);

  const [activeCatalog, setActiveCatalog] = useState<string | null>(null);

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
      <DialogContent showCloseButton={false} className="max-w-[95vw] lg:max-w-7xl h-[90vh] p-0 border-none shadow-2xl rounded-3xl overflow-hidden flex flex-col bg-white transition-all">
        
        {/* Header */}
        <div className="bg-emerald-900 px-6 sm:px-10 py-4 text-white shrink-0 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
          <div className="relative z-10 flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <FileText className="h-5 w-5 text-emerald-300" />
             </div>
             <div>
                <DialogTitle className="text-lg font-black uppercase tracking-tight leading-none">Draft Penawaran</DialogTitle>
                <DialogDescription className="text-[10px] text-emerald-300/60 font-bold uppercase tracking-widest mt-0.5">Landscape Editor Mode</DialogDescription>
             </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"><X className="h-5 w-5" /></Button>
        </div>

        {/* Form Content - 2 Columns on Desktop Landscape */}
        <div className="flex-1 overflow-hidden bg-slate-50/50">
          <form id="quotation-form" onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col lg:flex-row">
            
            {/* Left Side: Client & Services (60%) */}
            <div className="flex-1 lg:flex-[1.4] overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar border-r border-slate-200">
               
               {/* 01. Informasi Klien */}
               <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center">1</span>
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Informasi Klien</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                     <div className="md:col-span-4 space-y-1 text-left">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">No. Penawaran</label>
                        <Input {...register("quotation_number")} readOnly className="h-9 bg-slate-50 border-none font-mono font-black text-emerald-700 rounded-lg text-xs" />
                     </div>
                     <div className="md:col-span-8 space-y-1 text-left">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Pilih Customer <span className="text-rose-500">*</span></label>
                        <div className="flex gap-2">
                           <div className="flex-1">
                              <Controller
                                 control={control}
                                 name="user_id"
                                 render={({ field }) => (
                                    <Select value={field.value || ""} onValueChange={field.onChange}>
                                       <SelectTrigger className={cn("h-9 border-slate-200 rounded-lg font-bold text-[10px] uppercase", errors.user_id && "border-rose-300 bg-rose-50")}>
                                          <SelectValue placeholder="Klik mencari klien..." />
                                       </SelectTrigger>
                                       <SelectContent className="rounded-xl">
                                          {clients.map(c => <SelectItem key={c.id} value={c.id} className="text-[10px] font-bold uppercase">{c.full_name} — {c.company_name || "PERSONAL"}</SelectItem>)}
                                       </SelectContent>
                                    </Select>
                                 )}
                              />
                           </div>
                           <Button type="button" onClick={onAddCustomer} variant="outline" className="h-9 w-9 rounded-lg border-slate-200 text-emerald-600 shrink-0"><UserPlus className="h-4 w-4" /></Button>
                        </div>
                     </div>
                     <div className="md:col-span-12 space-y-1 text-left">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Judul Pekerjaan <span className="text-rose-500">*</span></label>
                        <Input {...register("title")} placeholder="Contoh: Analisa Berkala Kualitas Air" className={cn("h-9 border-slate-200 rounded-lg font-bold text-xs", errors.title && "border-rose-300")} />
                     </div>
                  </div>
               </div>

               {/* 02. Daftar Layanan */}
               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-5 w-5 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center">2</span>
                      <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Daftar Layanan Lab</h3>
                    </div>
                    <Button type="button" onClick={() => append({ service_id: "", equipment_id: "", qty: 1, price: 0 })} size="sm" className="h-8 rounded-lg bg-emerald-600 text-white font-black text-[9px] uppercase px-4 gap-2">
                      <PlusCircle className="h-3.5 w-3.5" /> Tambah Baris
                    </Button>
                  </div>

                  <div className="space-y-2">
                     {fields.map((field, index) => {
                        if (watchedItems[index]?.equipment_id) return null;
                        return (
                           <div key={field.id} className="bg-white border border-slate-200/60 p-3 rounded-xl shadow-sm transition-all text-left hover:border-emerald-300 group">
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                 <div className="md:col-span-7 space-y-1">
                                    <label className="text-[8px] font-black text-slate-300 uppercase ml-1">Layanan Pengujian</label>
                                    <Controller
                                       control={control}
                                       name={`items.${index}.service_id`}
                                       render={({ field }) => (
                                          <Select value={field.value || ""} onValueChange={(val) => { field.onChange(val); handleServiceChange(index, val); }}>
                                             <SelectTrigger className="h-9 border-slate-100 bg-slate-50 rounded-lg font-bold text-[10px] uppercase">
                                                <SelectValue placeholder="Pilih layanan..." />
                                             </SelectTrigger>
                                             <SelectContent className="rounded-xl max-h-[300px]">
                                                {Object.entries(groupedServices).map(([category, items]) => (
                                                   <React.Fragment key={category}>
                                                      <div className="px-3 py-1 bg-slate-50 text-[9px] font-black text-emerald-600 uppercase tracking-widest border-y border-slate-100 first:mt-0 mt-2">{category}</div>
                                                      {items.map(s => <SelectItem key={s.id} value={s.id} className="text-[10px] font-bold py-2">{s.name}</SelectItem>)}
                                                   </React.Fragment>
                                                ))}
                                             </SelectContent>
                                          </Select>
                                       )}
                                    />
                                    {(watchedItems[index]?.parameters?.length ?? 0) > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                         {watchedItems[index]?.parameters?.map((p: string, pi: number) => (
                                           <span key={pi} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[8px] font-black border border-emerald-100 uppercase">
                                             {p} <button type="button" onClick={() => handleRemoveParameter(index, pi)}><X className="h-2 w-2" /></button>
                                           </span>
                                         ))}
                                      </div>
                                    )}
                                 </div>
                                 <div className="md:col-span-2">
                                    <label className="text-[8px] font-black text-slate-300 uppercase block text-center mb-1">Qty</label>
                                    <Input type="number" {...register(`items.${index}.qty`)} className="h-9 text-center font-black text-xs bg-slate-50 border-none rounded-lg" />
                                 </div>
                                 <div className="md:col-span-2">
                                    <label className="text-[8px] font-black text-slate-300 uppercase ml-1 mb-1">Harga Unit</label>
                                    <Input type="number" {...register(`items.${index}.price`)} className="h-9 font-black text-xs text-emerald-700 bg-slate-50 border-none rounded-lg" />
                                 </div>
                                 <div className="md:col-span-1 flex justify-end">
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-slate-300 hover:text-rose-500 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>

            {/* Right Side: Ops, Equipment & Calculation (40%) */}
            <div className="flex-1 lg:flex-[1] overflow-y-auto p-6 sm:p-8 space-y-8 bg-white custom-scrollbar">
               
               {/* 03. Operasional */}
               <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center">3</span>
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Biaya Operasional</h3>
                  </div>
                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4 text-left">
                     <div className="space-y-2">
                        <div className="flex items-center justify-between">
                           <span className="font-black text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-emerald-500" /> Perdiem</span>
                           <Button type="button" variant="outline" size="sm" onClick={() => setActiveCatalog('perdiem')} className="h-6 px-2.5 text-[9px] font-black rounded-lg border-emerald-100 text-emerald-700">KATALOG</Button>
                        </div>
                        {watchedPerdiemName && <p className="text-[9px] font-bold text-emerald-600 uppercase truncate">{watchedPerdiemName}</p>}
                        <div className="grid grid-cols-2 gap-3">
                           <Input type="number" {...register("perdiem_price")} className="h-9 text-xs font-black bg-white border-slate-200 rounded-lg" placeholder="Harga" />
                           <Input type="number" {...register("perdiem_qty")} className="h-9 text-xs font-black bg-white border-slate-200 rounded-lg text-center" placeholder="Hari" />
                        </div>
                     </div>
                     <div className="space-y-2 pt-4 border-t border-slate-200/60">
                        <div className="flex items-center justify-between">
                           <span className="font-black text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-2"><Car className="h-3.5 w-3.5 text-blue-500" /> Transportasi</span>
                           <Button type="button" variant="outline" size="sm" onClick={() => setActiveCatalog('transport')} className="h-6 px-2.5 text-[9px] font-black rounded-lg border-blue-100 text-blue-700">KATALOG</Button>
                        </div>
                        {watchedTransportName && <p className="text-[9px] font-bold text-blue-600 uppercase truncate">{watchedTransportName}</p>}
                        <div className="grid grid-cols-2 gap-3">
                           <Input type="number" {...register("transport_price")} className="h-9 text-xs font-black bg-white border-slate-200 rounded-lg" placeholder="Harga" />
                           <Input type="number" {...register("transport_qty")} className="h-9 text-xs font-black bg-white border-slate-200 rounded-lg text-center" placeholder="Qty" />
                        </div>
                     </div>
                  </div>
               </div>

               {/* 04. Sewa Alat Lab */}
               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-5 w-5 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center">4</span>
                      <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Sewa Alat Lab</h3>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setActiveCatalog('equipment')} className="h-6 px-2.5 text-[9px] font-black rounded-lg border-amber-200 text-amber-700">PILIH ALAT</Button>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60 shadow-sm min-h-[140px] flex flex-col text-left">
                     {fields.filter(i => i.equipment_id).length === 0 ? (
                        <div className="flex-1 flex items-center justify-center opacity-20"><span className="text-[9px] font-black uppercase tracking-widest">Kosong</span></div>
                     ) : (
                        <div className="space-y-2">
                           {fields.map((field, index) => {
                              if (!watchedItems[index]?.equipment_id) return null;
                              return (
                                 <div key={field.id} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <span className="flex-1 text-[9px] font-black text-slate-700 uppercase truncate px-1">{watchedItems[index]?.name}</span>
                                    <Input type="number" {...register(`items.${index}.price`)} className="h-8 w-20 text-[10px] font-black border-none bg-slate-50 rounded-lg text-right" />
                                    <Input type="number" {...register(`items.${index}.qty`)} className="h-8 w-10 text-[10px] font-black border-none bg-slate-50 rounded-lg text-center" />
                                    <button type="button" onClick={() => remove(index)} className="text-slate-300 hover:text-rose-500 px-1"><XCircle className="h-3.5 w-3.5" /></button>
                                 </div>
                              );
                           })}
                        </div>
                     )}
                  </div>
               </div>

               {/* 05. Summary & Tax */}
               <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center">5</span>
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Ringkasan Tagihan</h3>
                  </div>
                  <div className="bg-emerald-950 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden text-left">
                     <div className="absolute top-0 right-0 p-8 opacity-5"><DollarSign className="h-24 w-24" /></div>
                     <div className="relative z-10 space-y-4">
                        <div className="space-y-3">
                           <div className="flex items-center justify-between text-left">
                              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest opacity-60">Subtotal</span>
                              <span className="text-sm font-black font-mono">Rp {subtotal.toLocaleString("id-ID")}</span>
                           </div>
                           <div className="flex items-center justify-between text-left border-b border-white/10 pb-3">
                              <div className="flex flex-col">
                                 <span className="text-[10px] font-black uppercase tracking-widest leading-none">Pajak PPN 11%</span>
                                 <span className="text-[8px] text-emerald-400 mt-1 uppercase font-bold">{watchedUseTax ? 'Aktif' : 'Non-Aktif'}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                 <span className="text-sm font-black font-mono text-emerald-400">{watchedUseTax ? `Rp ${taxAmount.toLocaleString("id-ID")}` : "Rp 0"}</span>
                                 <button type="button" onClick={() => setValue("use_tax", !watchedUseTax)} className={cn("h-4 w-8 rounded-full p-0.5 transition-all shadow-inner", watchedUseTax ? "bg-emerald-500" : "bg-white/20")}>
                                    <div className={cn("h-3 w-3 rounded-full bg-white transition-all", watchedUseTax ? "translate-x-4" : "translate-x-0")} />
                                 </button>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-1.5 text-left">
                           <label className="text-[9px] font-black text-emerald-500 uppercase tracking-widest opacity-60 ml-1">Diskon (IDR)</label>
                           <Input type="number" {...register("discount_amount")} className="h-10 bg-white/5 border-white/10 rounded-xl font-black text-rose-400 text-lg text-right" placeholder="0" />
                        </div>

                        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 flex flex-col justify-center shadow-inner">
                           <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1.5 leading-none">Total Akhir</p>
                           <p className="text-3xl font-black font-mono text-white tracking-tighter leading-none">Rp {total.toLocaleString("id-ID")}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </form>
        </div>

        {/* Footer Fixed */}
        <div className="px-8 py-5 border-t bg-white shrink-0 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.02)] relative z-50">
           <div className="text-left flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Due</span>
              <span className="text-2xl font-black text-emerald-950 font-mono tracking-tighter leading-none">Rp {total.toLocaleString("id-ID")}</span>
           </div>
           <div className="flex items-center gap-4">
              <Button type="button" variant="ghost" onClick={onClose} className="font-black text-slate-400 text-[10px] uppercase px-10 h-12 rounded-xl transition-all">Batal</Button>
              <LoadingButton 
                form="quotation-form" 
                type="submit" 
                loading={isSubmitting} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-12 h-12 rounded-xl text-[11px] uppercase tracking-widest shadow-2xl shadow-emerald-900/30 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Check className="h-5 w-5 stroke-[4px]" /> SIMPAN DATA
              </LoadingButton>
           </div>
        </div>

        {/* Catalog Dialogs */}
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
      <DialogContent className="max-w-md w-[90vw] rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-white">
        <div className={cn("p-6 text-white flex items-center gap-4", activeCatalog === 'perdiem' ? 'bg-emerald-600' : activeCatalog === 'transport' ? 'bg-blue-600' : 'bg-amber-600')}>
           <Icon className="h-6 w-6" />
           <DialogTitle className="text-lg font-black uppercase tracking-tight leading-none">{titles[activeCatalog]}</DialogTitle>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2 custom-scrollbar bg-slate-50/50">
           {items.map((c: any) => (
             <div key={c.id} onClick={() => onSelect(activeCatalog, c.id, c.price, c.name)} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer flex justify-between items-center transition-all group shadow-sm hover:shadow-md">
                <div className="text-left min-w-0 flex-1 pr-4">
                   <p className="text-[11px] font-black text-slate-800 uppercase truncate">{c.name}</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5 truncate">{isEquipment ? c.specification : c.location || c.unit}</p>
                </div>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 shadow-inner shrink-0">Rp {Number(c.price).toLocaleString("id-ID")}</span>
             </div>
           ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
