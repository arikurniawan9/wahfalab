"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  FileText, Plus, Trash2, Check, X, MapPin, Car, Wrench, 
  DollarSign, CheckCircle, XCircle, UserPlus, Info, PlusCircle, Search,
  ChevronLeft, LayoutDashboard, Database, Activity, Calculator,
  ChevronsUpDown,
  Building2,
  User,
  FlaskConical,
  RotateCcw,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingButton } from "@/components/ui";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const quotationSchema = z.object({
  quotation_number: z.string().min(1, "Nomor penawaran wajib diisi"),
  title: z.string().min(3, "Judul pengujian wajib diisi").nullable().or(z.literal("")),
  sampling_location: z.string().optional().nullable(),
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
    description: z.string().optional().nullable(),
    parameters: z.array(z.string()).optional(),
  })).min(1, "Minimal harus ada 1 item"),
});

interface QuotationFormPageProps {
  initialData?: any;
  clients: any[];
  services: any[];
  operationalCatalogs: any[];
  equipment: any[];
  nextQuotationNumber: string;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  title: string;
}

function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1 animate-in fade-in duration-300"><XCircle className="h-3 w-3" /> {message}</p>;
}

export function QuotationFormPage({
  initialData,
  clients,
  services,
  operationalCatalogs,
  equipment,
  nextQuotationNumber,
  onSubmit,
  isSubmitting,
  title
}: QuotationFormPageProps) {
  const router = useRouter();
  const [isClientPopoverOpen, setIsClientPopoverOpen] = useState(false);
  const [openServiceIndex, setOpenServiceIndex] = useState<number | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);
  
  const { register, control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    resolver: zodResolver(quotationSchema),
    mode: 'onChange',
    defaultValues: initialData || {
      quotation_number: nextQuotationNumber,
      title: "",
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

  const handleReset = () => {
    reset({
      quotation_number: nextQuotationNumber,
      title: "",
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
    });
    toast.success("Form telah dikosongkan");
  };

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

  const watchedItems = watch("items") || [];
  const watchedUseTax = watch("use_tax");
  const watchedDiscount = Number(watch("discount_amount")) || 0;
  const watchedPerdiemPrice = Number(watch("perdiem_price")) || 0;
  const watchedPerdiemVol = watch("perdiem_qty") || 0;
  const watchedPerdiemName = watch("perdiem_name");
  const watchedTransportPrice = Number(watch("transport_price")) || 0;
  const watchedTransportVol = watch("transport_qty") || 0;
  const watchedTransportName = watch("transport_name");
  const watchedUserId = watch("user_id");

  const { subtotal, taxAmount, total } = React.useMemo(() => {
    const iSubtotal = (watchedItems || []).reduce((acc: number, item: any) => acc + (Number(item.qty || 0) * Number(item.price || 0)), 0);
    const pTotal = Number(watchedPerdiemPrice || 0) * Number(watchedPerdiemVol || 0);
    const tTotal = Number(watchedTransportPrice || 0) * Number(watchedTransportVol || 0);
    const sub = iSubtotal + pTotal + tTotal - Number(watchedDiscount || 0);
    const taxVal = watchedUseTax ? sub * 0.11 : 0;
    return { subtotal: sub, taxAmount: taxVal, total: sub + taxVal };
  }, [watchedItems, watchedPerdiemPrice, watchedPerdiemVol, watchedTransportPrice, watchedTransportVol, watchedDiscount, watchedUseTax]);

  const [activeCatalog, setActiveCatalog] = useState<{field: string, type: string} | null>(null);

  // Keyboard Shortcuts Logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcut if active element is an input (to allow normal typing)
      // unless it's the specific global shortcuts we want to allow everywhere
      const isInputActive = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || "");

      // Ctrl + K to Open Customer Search
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsClientPopoverOpen(true);
      }

      // Ctrl + Enter to Save (Allow even if input is active)
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(onPreSubmit)();
      }

      // Alt shortcuts (Only if not typing in an input, to avoid conflicts)
      if (e.altKey && !isInputActive) {
        switch (e.key.toLowerCase()) {
          case 'p': e.preventDefault(); setActiveCatalog({field: 'perdiem', type: 'perdiem'}); break;
          case 't': e.preventDefault(); setActiveCatalog({field: 'transport', type: 'transport'}); break;
          case 'e': e.preventDefault(); setActiveCatalog({field: 'equipment', type: 'equipment'}); break;
          case 'n': e.preventDefault(); append({ service_id: "", equipment_id: "", qty: 1, price: 0, name: "" }); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, append]);

  const handleServiceChange = (index: number, serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setValue(`items.${index}.service_id`, serviceId, { shouldValidate: true });
      setValue(`items.${index}.price`, Number(service.price));
      setValue(`items.${index}.name`, service.name);
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

  const onPreSubmit = (data: any) => {
    const finalData = {
      ...data,
      subtotal: Math.floor(subtotal),
      tax_amount: Math.floor(taxAmount),
      total_amount: Math.floor(total)
    };
    setPendingData(finalData);
    setIsConfirmModalOpen(true);
  };

  const confirmSubmit = async () => {
    setIsConfirmModalOpen(false);
    if (pendingData) {
      await onSubmit(pendingData);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 text-left">
      {/* Top Navbar Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
         <div className="max-w-6xl mx-auto flex items-center justify-between text-left">
            <div className="flex items-center gap-4">
               <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl hover:bg-slate-100"><ChevronLeft className="h-5 w-5" /></Button>
               <div className="h-8 w-px bg-slate-200 mx-2" />
               <div className="flex flex-col text-left">
                  <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">{title}</h1>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Quotation Management System</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="text-right hidden md:block border-r border-slate-200 pr-6 mr-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 text-right">Final Amount</p>
                  <p className="text-xl font-black text-emerald-700 font-mono leading-none text-right">Rp {Math.floor(total).toLocaleString("id-ID")}</p>
               </div>
            </div>
         </div>
      </div>

      <main className="flex-1 p-6 sm:p-10">
         <form id="quotation-form" onSubmit={handleSubmit(onPreSubmit)} className="max-w-6xl mx-auto space-y-10 pb-20">
            
            {/* 01. Informasi Dasar */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden text-left">
               <div className="bg-emerald-600 px-6 py-3 flex items-center justify-between text-left">
                 <div className="flex items-center gap-2 text-left">
                    <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center shadow-inner">
                       <Database className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest text-left">01. Informasi Dasar</span>
                 </div>
               </div>

               <div className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* No Dokumen Field */}
                     <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block text-left">No. Dokumen</label>
                        <div className="flex items-center gap-3 h-12 px-5 bg-slate-50 rounded-xl border border-transparent shadow-inner">
                           <FileText className="h-4 w-4 text-emerald-500/60 shrink-0" />
                           <input {...register("quotation_number")} readOnly className="flex-1 bg-transparent border-none outline-none font-mono font-black text-emerald-700 text-xs cursor-not-allowed" />
                        </div>
                     </div>
                     <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Customer / Klien <span className="text-rose-500">*</span></label>
                        <Controller
                           control={control}
                           name="user_id"
                           render={({ field }) => (
                              <Popover open={isClientPopoverOpen} onOpenChange={setIsClientPopoverOpen}>
                                 <PopoverTrigger asChild>
                                    <Button
                                       variant="outline"
                                       role="combobox"
                                       className={cn(
                                          "w-full h-12 flex items-center gap-3 px-5 rounded-xl border transition-all shadow-inner text-left overflow-hidden group",
                                          errors.user_id ? "border-rose-300 bg-rose-50/30" : "border-slate-200 bg-white hover:bg-slate-50"
                                       )}
                                    >
                                       <User className="h-4 w-4 text-emerald-500 shrink-0" />
                                       <span className={cn("flex-1 min-w-0 truncate font-black text-[11px] uppercase", !field.value ? "text-slate-400" : "text-slate-700")}>
                                          {field.value
                                             ? clients.find((c) => c.id === field.value)?.full_name
                                             : "Klik mencari nama klien..."}
                                       </span>
                                       <Kbd>CTRL+K</Kbd>
                                       <ChevronsUpDown className="h-4 w-4 text-slate-300 shrink-0" />
                                    </Button>
                                 </PopoverTrigger>
                                 <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-slate-200 shadow-2xl z-50">
                                    <Command className="rounded-xl">
                                       <CommandInput placeholder="Ketik nama klien..." className="h-12 border-none focus:ring-0 font-bold" />
                                       <CommandList className="max-h-[300px] overflow-y-auto custom-scrollbar text-left">
                                          <CommandEmpty className="py-6 text-center text-xs font-bold text-slate-400 uppercase tracking-widest text-left">Customer tidak ditemukan</CommandEmpty>
                                          <CommandGroup>
                                             {clients.map((c) => (
                                                <CommandItem key={c.id} value={c.full_name + " " + (c.company_name || "")} onSelect={() => { setValue("user_id", c.id, { shouldValidate: true }); setIsClientPopoverOpen(false); }} className="flex flex-col items-start gap-1 py-3 px-4 aria-selected:bg-emerald-50 aria-selected:text-emerald-900 cursor-pointer border-b border-slate-50 last:border-none text-left">
                                                   <div className="flex items-center justify-between w-full text-left"><span className="font-black uppercase text-[10px] text-left">{c.full_name}</span>{field.value === c.id && <Check className="h-4 w-4 text-emerald-600" />}</div>
                                                   <div className="flex items-center gap-1.5 opacity-60 text-left"><Building2 className="h-3 w-3" /><span className="text-[9px] font-bold uppercase tracking-tighter text-left">{c.company_name || "PERSONAL CUSTOMER"}</span></div>
                                                </CommandItem>
                                             ))}
                                          </CommandGroup>
                                       </CommandList>
                                    </Command>
                                 </PopoverContent>
                              </Popover>
                           )}
                        />
                        <ErrorMessage message={errors.user_id?.message as string} />
                     </div>
                  </div>
                   <div className="space-y-2 text-left">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block text-left">Judul Pengujian / Perihal <span className="text-rose-500">*</span></label>
                     <div className={cn("flex items-center gap-4 px-5 h-12 rounded-xl bg-slate-50 border-none transition-all shadow-inner focus-within:ring-2 focus-within:ring-emerald-500/20", errors.title && "bg-rose-50")}>
                        <Search className="h-4 w-4 text-emerald-500/60 shrink-0" />
                        <input {...register("title")} placeholder="Ketik judul atau perihal pengujian..." className="flex-1 bg-transparent border-none outline-none font-bold text-xs text-slate-700 placeholder:text-slate-300" />
                     </div>
                     <ErrorMessage message={errors.title?.message as string} />
                   </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="md:col-span-2 space-y-2 text-left">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block text-left">Lokasi Sampling</label>
                         <textarea
                           {...register("sampling_location")}
                          rows={3}
                          placeholder="Lokasi sampling / titik pengambilan contoh..."
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 outline-none shadow-inner focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none"
                        />
                      </div>
                   </div>
                 </div>
              </div>

            {/* 02. Daftar Layanan Lab */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden text-left">
               <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-lg"><Activity className="h-4 w-4" /></div>
                     <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest text-left">02. Layanan Pengujian</span>
                  </div>
                  <div className="flex flex-col items-center">
                     <Button type="button" onClick={() => append({ service_id: "", equipment_id: "", qty: 1, price: 0, name: "" })} className="h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase gap-2 shadow-lg shadow-emerald-900/10 transition-all active:scale-95">
                        <PlusCircle className="h-4 w-4" /> Tambah Baris
                     </Button>
                     <Kbd>ALT+N</Kbd>
                  </div>
                  </div>               
               <div className="overflow-x-auto">
                  <Table>
                     <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-none text-left">
                           <TableHead className="pl-8 py-4 font-black uppercase tracking-widest text-[9px] text-slate-400 text-left">Layanan & Parameter</TableHead>
                           <TableHead className="py-4 font-black uppercase tracking-widest text-[9px] text-slate-400 text-center w-24">Vol</TableHead>
                           <TableHead className="py-4 font-black uppercase tracking-widest text-[9px] text-slate-400 w-48 text-left">Harga Unit</TableHead>
                           <TableHead className="py-4 font-black uppercase tracking-widest text-[9px] text-slate-400 text-right w-48">Subtotal</TableHead>
                           <TableHead className="pr-8 py-4 w-12"></TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {fields.map((field: any, index) => {
                           if (watchedItems[index]?.equipment_id) return null;
                           return (
                              <TableRow key={field.id} className="hover:bg-slate-50/50 transition-all border-b border-slate-50">
                                 <TableCell className="pl-8 py-5 align-top text-left">
                                    <div className="space-y-3 text-left">
                                       <Controller
                                          control={control}
                                          name={`items.${index}.service_id`}
                                          render={({ field }) => (
                                             <Popover open={openServiceIndex === index} onOpenChange={(open) => setOpenServiceIndex(open ? index : null)}>
                                                <PopoverTrigger asChild>
                                                   <button type="button" className={cn("w-full h-11 flex items-center gap-3 px-4 rounded-xl border transition-all text-left overflow-hidden", !field.value ? "text-slate-400 border-slate-200 bg-white" : "text-emerald-900 border-emerald-100 bg-emerald-50/20")}>
                                                      <FlaskConical className="h-4 w-4 text-emerald-500 shrink-0" />
                                                      <span className="flex-1 min-w-0 truncate font-black text-[10px] uppercase text-left">{field.value ? services.find((s) => s.id === field.value)?.name : "Cari layanan pengujian..."}</span>
                                                      <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                                                   </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-slate-100 shadow-2xl z-50">
                                                   <Command className="rounded-xl text-left">
                                                      <CommandInput placeholder="Cari nama layanan..." className="h-12 border-none focus:ring-0 font-bold" />
                                                      <CommandList className="max-h-[350px] overflow-y-auto custom-scrollbar text-left">
                                                         <CommandEmpty className="py-6 text-center text-xs font-bold text-slate-400 uppercase text-left">Layanan tidak ditemukan</CommandEmpty>
                                                         {Object.entries(groupedServices).map(([category, items]) => (
                                                            <CommandGroup key={category} heading={<span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest px-2 text-left block">{category}</span>}>
                                                               {items.map(s => (
                                                                  <CommandItem key={s.id} value={s.name} onSelect={() => { handleServiceChange(index, s.id); setOpenServiceIndex(null); }} className="py-3 px-4 aria-selected:bg-emerald-50 aria-selected:text-emerald-900 cursor-pointer border-b border-slate-50 last:border-none flex items-center justify-between text-left">
                                                                     <div className="flex flex-col gap-0.5 min-w-0 flex-1 text-left"><span className="font-black uppercase text-[10px] truncate block text-left">{s.name}</span><span className="text-[8px] font-bold opacity-50 truncate block text-left">{s.regulation_ref?.name || s.regulation || "General Standards"}</span></div>
                                                                     {field.value === s.id && <Check className="ml-3 h-4 w-4 text-emerald-600 shrink-0" />}
                                                                  </CommandItem>
                                                               ))}
                                                            </CommandGroup>
                                                         ))}
                                                      </CommandList>
                                                   </Command>
                                                </PopoverContent>
                                             </Popover>
                                          )}
                                       />
                                       {(watchedItems[index]?.parameters?.length ?? 0) > 0 && (
                                         <div className="flex flex-wrap gap-1.5 ml-1 text-left">
                                            {watchedItems[index]?.parameters?.map((p: string, pi: number) => (
                                              <span key={pi} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-100 text-slate-600 text-[8px] font-black shadow-sm group/tag transition-all hover:border-emerald-200 uppercase">{p} <button type="button" onClick={() => handleRemoveParameter(index, pi)} className="text-slate-300 hover:text-rose-500 transition-colors"><X className="h-2.5 w-2.5" /></button></span>
                                            ))}
                                         </div>
                                       )}
                                    </div>
                                 </TableCell>
                                 <TableCell className="py-5 align-top"><div className="h-11 flex items-center justify-center bg-slate-50 rounded-xl shadow-inner px-2"><input type="number" {...register(`items.${index}.qty`)} className="w-full bg-transparent border-none outline-none font-black text-xs text-center" /></div></TableCell>
                                 <TableCell className="py-5 align-top">
                                    <div className="h-11 flex items-center gap-2 px-4 bg-slate-50 rounded-xl shadow-inner">
                                       <span className="text-[9px] font-black text-emerald-600 opacity-40 shrink-0">Rp</span>
                                       <input type="number" {...register(`items.${index}.price`)} className="flex-1 bg-transparent border-none outline-none font-black text-xs text-emerald-700" />
                                    </div>
                                 </TableCell>
                                 <TableCell className="py-5 align-top text-right pr-4"><div className="h-11 flex flex-col justify-center text-right"><p className="font-black text-xs text-slate-900 leading-none text-right">Rp {(Number(watchedItems[index]?.price || 0) * Number(watchedItems[index]?.qty || 1)).toLocaleString("id-ID")}</p><p className="text-[8px] font-bold text-slate-300 uppercase mt-1 tracking-tighter text-right">Line Total</p></div></TableCell>
                                 <TableCell className="py-5 pr-8 align-top text-right"><div className="h-11 flex items-center justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-9 w-9 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                              </TableRow>
                           );
                        })}
                     </TableBody>
                  </Table>
               </div>
            </div>

            {/* 03 & 04. Operasional & Sewa Alat */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
               <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden text-left flex flex-col">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                     <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-lg"><MapPin className="h-4 w-4" /></div>
                     <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest text-left">03. Biaya Operasional</span>
                  </div>
                  <div className="p-8 space-y-8 flex-1 text-left">
                     <div className="space-y-4 text-left">
                        <div className="flex items-center justify-between text-left">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Perdiem / Engineer</label>
                           <div className="flex items-center gap-2">
                              <Kbd>ALT+P</Kbd>
                              <Button type="button" variant="outline" size="sm" onClick={() => setActiveCatalog({field: 'perdiem', type: 'perdiem'})} className="h-7 px-3 text-[9px] font-black rounded-lg border-emerald-100 text-emerald-700 uppercase">Katalog</Button>
                           </div>
                        </div>
                        {watchedPerdiemName && <p className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 uppercase truncate text-left">{watchedPerdiemName}</p>}
                        <div className="grid grid-cols-2 gap-4">
                           <div className="flex items-center gap-2 h-11 px-4 bg-slate-50 rounded-xl shadow-inner border border-transparent">
                              <span className="text-[9px] font-black text-emerald-600 opacity-40 shrink-0">Rp</span>
                              <input type="number" {...register("perdiem_price")} className="flex-1 bg-transparent border-none outline-none font-black text-xs text-emerald-700" placeholder="Harga" />
                           </div>
                           <div className="h-11 px-4 bg-slate-50 rounded-xl shadow-inner border border-transparent">
                              <input type="number" {...register("perdiem_qty")} className="w-full h-full bg-transparent border-none outline-none font-black text-xs text-center" placeholder="Hari" />
                           </div>
                        </div>
                     </div>
                     <div className="space-y-4 pt-6 border-t border-slate-100 text-left">
                        <div className="flex items-center justify-between text-left">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Car className="h-3.5 w-3.5 text-blue-500" /> Transportasi</label>
                           <div className="flex items-center gap-2">
                              <Kbd>ALT+T</Kbd>
                              <Button type="button" variant="outline" size="sm" onClick={() => setActiveCatalog({field: 'transport', type: 'transport'})} className="h-7 px-3 text-[9px] font-black rounded-lg border-blue-100 text-blue-700 uppercase">Katalog</Button>
                           </div>
                        </div>
                        {watchedTransportName && <p className="text-[9px] font-black text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 uppercase truncate text-left">{watchedTransportName}</p>}
                        <div className="grid grid-cols-2 gap-4">
                           <div className="flex items-center gap-2 h-11 px-4 bg-slate-50 rounded-xl shadow-inner border border-transparent">
                              <span className="text-[9px] font-black text-emerald-600 opacity-40 shrink-0">Rp</span>
                              <input type="number" {...register("transport_price")} className="flex-1 bg-transparent border-none outline-none font-black text-xs text-emerald-700" placeholder="Harga" />
                           </div>
                           <div className="h-11 px-4 bg-slate-50 rounded-xl shadow-inner border border-transparent">
                              <input type="number" {...register("transport_qty")} className="w-full h-full bg-transparent border-none outline-none font-black text-xs text-center" placeholder="Vol" />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden text-left flex flex-col">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                     <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-lg"><Wrench className="h-4 w-4" /></div>
                     <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest text-left">04. Sewa Alat</span>
                     <div className="ml-auto flex items-center gap-2">
                        <Kbd>ALT+E</Kbd>
                        <Button type="button" variant="outline" size="sm" onClick={() => setActiveCatalog({field: 'equipment', type: 'equipment'})} className="h-7 px-3 text-[9px] font-black rounded-lg border-amber-200 text-amber-700 uppercase shadow-sm">Buka Katalog</Button>
                     </div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col min-h-[220px] text-left">
                     {watchedItems.filter((i: any) => i.equipment_id).length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-20 italic font-bold text-[10px] uppercase tracking-widest text-left">Belum ada sewa alat</div>
                     ) : (
                        <div className="space-y-3 text-left">
                           {fields.map((field: any, index) => {
                              if (!watchedItems[index]?.equipment_id) return null;
                              return (
                                 <div key={field.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-right-4 duration-300 group text-left">
                                    <div className="flex-1 min-w-0 text-left">
                                       <p className="text-[10px] font-black text-slate-700 uppercase truncate leading-none mb-1 text-left">{watchedItems[index]?.name}</p>
                                       <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter text-left">{watchedItems[index]?.description || "Equipment Rental"}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                       <div className="flex items-center gap-2 h-10 px-3 bg-white border border-slate-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                                          <span className="text-[9px] font-black text-emerald-600/40 uppercase shrink-0">Rp</span>
                                          <input type="number" {...register(`items.${index}.price`)} className="w-24 bg-transparent border-none outline-none font-black text-[10px] text-emerald-700 text-right" />
                                       </div>
                                       <div className="flex items-center h-10 px-2 bg-white border border-slate-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                                          <input type="number" {...register(`items.${index}.qty`)} className="w-10 bg-transparent border-none outline-none font-black text-[10px] text-center" placeholder="Vol" />
                                       </div>
                                       <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-9 w-9 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all shrink-0">
                                          <Trash2 className="h-4 w-4" />
                                       </Button>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* 05. Summary Section */}
            <div className="bg-emerald-950 rounded-[2.5rem] p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden text-left border-4 border-white shadow-emerald-900/20">
               <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
               
               <div className="relative z-10 flex items-center gap-3 mb-10 border-l-4 border-emerald-500 pl-4">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">05</span>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest text-left">Kalkulasi Tagihan Akhir</h3>
               </div>

               <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 items-center text-left">
                  <div className="space-y-6 flex flex-col justify-center text-left">
                     <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] opacity-60 ml-1 text-left block">Potongan Diskon (IDR)</label>
                        <div className="flex items-center gap-3 h-12 px-5 bg-white/5 border border-white/10 rounded-2xl transition-all focus-within:ring-2 focus-within:ring-rose-500/30">
                           <span className="text-xs font-black text-rose-400 shrink-0 text-left">Rp</span>
                           <input type="number" {...register("discount_amount")} className="flex-1 bg-transparent border-none outline-none font-black text-rose-400 text-lg text-right placeholder:text-rose-400/20" placeholder="0" />
                        </div>
                     </div>
                     <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl transition-all hover:bg-white/10">
                        <div className="flex flex-col text-left">
                           <span className="text-[11px] font-black uppercase tracking-widest text-left">Pajak PPN 11%</span>
                           <span className="text-[9px] font-bold text-emerald-400 opacity-60 text-left">Status: {watchedUseTax ? 'AKTIF' : 'OFF'}</span>
                        </div>
                        <button type="button" onClick={() => setValue("use_tax", !watchedUseTax)} className={cn("h-6 w-11 rounded-full p-1 transition-all shadow-inner", watchedUseTax ? "bg-emerald-600" : "bg-white/10")}><div className={cn("h-4 w-4 rounded-full bg-white transition-all shadow-md", watchedUseTax ? "translate-x-5" : "translate-x-0")} /></button>
                     </div>
                  </div>

                  <div className="space-y-6 md:border-l md:border-white/10 md:pl-10 flex flex-col justify-center text-left">
                     <div className="space-y-1 text-left">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest opacity-60 text-left block">Subtotal Gross</p>
                        <p className="text-2xl font-black font-mono tracking-tighter text-left">Rp {Math.floor(subtotal).toLocaleString("id-ID")}</p>
                     </div>
                     <div className="space-y-1 pt-4 border-t border-white/5 text-left">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest opacity-60 text-left block">Nilai Pajak PPN</p>
                        <p className="text-2xl font-black font-mono tracking-tighter text-emerald-400 text-left">{watchedUseTax ? `+ Rp ${Math.floor(taxAmount).toLocaleString("id-ID")}` : "Rp 0"}</p>
                     </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 flex flex-col justify-center text-center shadow-inner h-full min-h-[160px]">
                     <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-3 text-center">Grand Total Akhir</p>
                     <p className="text-2xl md:text-3xl font-black font-mono text-white tracking-tighter italic drop-shadow-xl text-center">Rp {Math.floor(total).toLocaleString("id-ID")}</p>
                  </div>
               </div>
            </div>
         </form>
      </main>

      {/* Action Footer - Fixed & Prominent */}
      <div className="px-8 sm:px-12 py-7 border-t bg-white shrink-0 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] sticky bottom-0 z-40">
         <div className="text-left flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-1">Total Tagihan Akhir</span>
            <span className="text-2xl font-black text-emerald-950 font-mono tracking-tighter text-left">Rp {Math.floor(total).toLocaleString("id-ID")}</span>
         </div>
         <div className="flex items-center gap-4 w-full sm:w-auto">
            <Button type="button" variant="ghost" onClick={handleReset} className="flex-1 sm:flex-none font-black text-rose-500 text-[10px] uppercase px-10 h-14 rounded-2xl hover:bg-rose-50 transition-all border border-rose-100 shadow-sm flex items-center gap-2"><RotateCcw className="h-3.5 w-3.5" /> Reset Form</Button>
            <Button type="button" variant="ghost" onClick={() => router.back()} className="flex-1 sm:flex-none font-black text-slate-400 text-[10px] uppercase px-8 h-14 rounded-2xl hover:bg-slate-100 transition-all border border-slate-100">Batal</Button>
            <div className="flex flex-col items-center">
               <LoadingButton form="quotation-form" type="submit" loading={isSubmitting} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-black px-14 h-14 rounded-2xl text-[11px] uppercase tracking-widest shadow-2xl shadow-emerald-900/30 transition-all active:scale-95 flex items-center justify-center gap-3 border-b-4 border-emerald-800">
                  <Check className="h-5 w-5 stroke-[4px]" /> SIMPAN PENAWARAN
               </LoadingButton>
               <Kbd>CTRL + ENTER</Kbd>
            </div>
         </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-white text-left">
          <div className="bg-emerald-600 p-8 text-white relative overflow-hidden text-left">
             <div className="absolute top-0 right-0 p-8 opacity-10"><AlertCircle className="h-32 w-32" /></div>
             <DialogHeader className="relative z-10 text-left">
                <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white text-left">Konfirmasi Penawaran</DialogTitle>
                <DialogDescription className="text-emerald-100 text-xs font-bold uppercase tracking-widest mt-2 opacity-80 text-left">Mohon tinjau rincian penawaran sebelum menyimpan.</DialogDescription>
             </DialogHeader>
          </div>

          <div className="p-8 space-y-6 bg-white max-h-[60vh] overflow-y-auto custom-scrollbar text-left">
             <div className="grid grid-cols-2 gap-8 text-left">
                <div className="space-y-1 text-left">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left block">No. Penawaran</p>
                   <p className="text-sm font-black text-slate-900 text-left">{pendingData?.quotation_number}</p>
                </div>
                <div className="space-y-1 text-left">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left block">Customer</p>
                   <p className="text-sm font-black text-slate-900 text-left">{clients.find(c => c.id === pendingData?.user_id)?.full_name}</p>
                </div>
                <div className="col-span-2 space-y-1 text-left">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left block">Judul Pekerjaan</p>
                   <p className="text-sm font-bold text-slate-700 text-left">{pendingData?.title}</p>
                </div>
             </div>

             <div className="border-t border-slate-100 pt-6 text-left">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 text-left block">Ringkasan Layanan & Biaya</p>
                <div className="space-y-3 text-left">
                   {pendingData?.items.filter((i:any) => !i.equipment_id).map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-xs text-left">
                         <span className="text-slate-600 font-bold text-left">{item.name || "Layanan Lab"} (x{item.qty})</span>
                         <span className="font-mono font-black text-slate-900 text-right">Rp {(item.price * item.qty).toLocaleString("id-ID")}</span>
                      </div>
                   ))}
                   {(Number(pendingData?.perdiem_price) > 0) && (
                      <div className="flex justify-between items-center text-xs text-left">
                         <span className="text-slate-600 font-bold text-left">Biaya Perdiem (x{pendingData.perdiem_qty})</span>
                         <span className="font-mono font-black text-slate-900 text-right">Rp {(pendingData.perdiem_price * pendingData.perdiem_qty).toLocaleString("id-ID")}</span>
                      </div>
                   )}
                   {(Number(pendingData?.transport_price) > 0) && (
                      <div className="flex justify-between items-center text-xs text-left">
                         <span className="text-slate-600 font-bold text-left">Biaya Transportasi (x{pendingData.transport_qty})</span>
                         <span className="font-mono font-black text-slate-900 text-right">Rp {(pendingData.transport_price * pendingData.transport_qty).toLocaleString("id-ID")}</span>
                      </div>
                   )}
                </div>
             </div>

             <div className="bg-slate-900 rounded-2xl p-6 text-white text-left">
                <div className="flex justify-between items-center text-left">
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-60 text-left">Total Tagihan Akhir</span>
                   <span className="text-2xl font-black font-mono text-emerald-400 text-right">Rp {Math.floor(total).toLocaleString("id-ID")}</span>
                </div>
             </div>
          </div>

          <div className="p-6 border-t bg-slate-50 flex gap-4">
             <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)} className="flex-1 h-14 rounded-2xl font-black text-slate-400 uppercase text-[10px]">Periksa Kembali</Button>
             <LoadingButton loading={isSubmitting} onClick={confirmSubmit} className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] shadow-xl shadow-emerald-900/20">Konfirmasi & Simpan</LoadingButton>
          </div>
        </DialogContent>
      </Dialog>
      
      <CatalogDialog activeCatalog={activeCatalog} onClose={() => setActiveCatalog(null)} catalogs={operationalCatalogs} equipment={equipment} onSelect={(field: string, val: string, price: any, name: string, spec: string) => {
        if (field === 'equipment') append({ service_id: "", equipment_id: val, qty: 1, price: Number(price), name, description: spec });
        else { setValue(`${field}_name` as any, name); setValue(`${field}_price` as any, Number(price)); setValue(`${field}_qty` as any, 1); }
        setActiveCatalog(null);
      }} />
    </div>
  );
}

/**
 * High-contrast mechanical key component for keyboard shortcuts
 */
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center px-2 py-1.5 min-w-[3rem] rounded-lg border-b-[4px] border-slate-950 bg-slate-900 text-[10px] font-black text-white shadow-xl transition-all group-hover:bg-emerald-600 group-hover:border-emerald-800 uppercase leading-none pointer-events-none select-none mx-2 animate-in fade-in zoom-in duration-500 hover:scale-110">
      {children}
    </span>
  );
}

function CatalogDialog({ activeCatalog, onClose, catalogs, equipment, onSelect }: any) {
  if (!activeCatalog) return null;
  const isEquipment = activeCatalog.type === 'equipment';
  const items = isEquipment ? equipment : catalogs.filter((c: any) => c.category === activeCatalog.type);
  const titles: any = { perdiem: 'Katalog Perdiem', transport: 'Katalog Transport', equipment: 'Direktori Alat' };
  const icons: any = { perdiem: MapPin, transport: Car, equipment: Wrench };
  const colors: any = { perdiem: 'bg-emerald-600', transport: 'bg-blue-600', equipment: 'bg-amber-600' };
  const Icon = icons[activeCatalog.type as keyof typeof icons];

  return (
    <Dialog open={!!activeCatalog} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-[90vw] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl bg-white text-left">
        <div className={cn("p-6 text-white flex items-center gap-4 relative overflow-hidden text-left", colors[activeCatalog.type as keyof typeof colors])}>
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl text-left" />
           <Icon className="h-7 w-7 relative z-10 text-left" />
           <DialogTitle className="text-xl font-black uppercase tracking-tight relative z-10 text-left">{titles[activeCatalog.type as keyof typeof titles]}</DialogTitle>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2 custom-scrollbar bg-slate-50/50 text-left">
           {items.map((c: any) => (
             <div key={c.id} onClick={() => onSelect(activeCatalog.field, c.id, c.price, c.name, isEquipment ? c.specification : (c.location || c.unit))} className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer flex justify-between items-center transition-all group shadow-sm hover:shadow-md text-left">
                <div className="text-left min-w-0 flex-1 pr-4">
                   <p className="text-[11px] font-black text-slate-800 uppercase truncate group-hover:text-emerald-700 text-left">{c.name}</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1 truncate text-left">{isEquipment ? c.specification : c.location || c.unit}</p>
                </div>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 shadow-inner shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all">Rp {Number(c.price).toLocaleString("id-ID")}</span>
             </div>
           ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
