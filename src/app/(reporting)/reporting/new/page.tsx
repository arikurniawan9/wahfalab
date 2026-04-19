"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Save, Plus, Trash2, 
  Beaker, ClipboardList, Book, 
  CheckCircle2, AlertCircle, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  getRegulations, 
  getRegulationDetail,
  createLabReport 
} from "@/lib/actions/reporting";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useForm, useFieldArray, Controller } from "react-hook-form";

interface LHUForm {
  report_number: string;
  sampling_date: string;
  received_date: string;
  analysis_date: string;
  client_name: string;
  company_name: string;
  address: string;
  sample_type: string;
  sample_origin: string;
  sample_code: string;
  regulation_id: string;
  items: {
    parameter: string;
    unit: string;
    standard_value: string;
    result_value: string;
    method: string;
    is_qualified: boolean;
  }[];
}

export default function NewLabReportPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [regulations, setRegulations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<LHUForm>({
    defaultValues: {
      report_number: `LHU-${Date.now()}`,
      items: []
    }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items"
  });

  const watchedRegulationId = watch("regulation_id");

  useEffect(() => {
    async function loadRegs() {
      const data = await getRegulations();
      setRegulations(data);
    }
    loadRegs();
  }, []);

  // Auto-populate items when regulation changes
  useEffect(() => {
    async function populateParameters() {
      if (watchedRegulationId && watchedRegulationId !== "manual") {
        const detail = await getRegulationDetail(watchedRegulationId);
        if (detail && detail.parameters) {
          const newItems = detail.parameters.map((p: any) => ({
            parameter: p.parameter,
            unit: p.unit,
            standard_value: p.standard_value,
            result_value: "",
            method: p.method,
            is_qualified: true
          }));
          replace(newItems);
        }
      }
    }
    populateParameters();
  }, [watchedRegulationId, replace]);

  const onSubmit = async (data: LHUForm) => {
    setLoading(true);
    try {
      const result = await createLabReport(data);
      if (result.success) {
        toast.success("LHU berhasil dibuat");
        router.push("/reporting");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: "Administrasi", icon: ClipboardList },
    { id: 2, title: "Detail Sampel", icon: Beaker },
    { id: 3, title: "Baku Mutu", icon: Book },
    { id: 4, title: "Hasil Analisis", icon: CheckCircle2 },
  ];

  return (
    <div className="p-4 md:p-10 space-y-8 max-w-5xl mx-auto pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/reporting">
          <Button variant="outline" size="icon" className="rounded-xl border-slate-200">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-emerald-950 tracking-tighter uppercase">Buat LHU Baru</h1>
          <p className="text-slate-500 text-sm">Pembuatan Laporan Hasil Uji (LHU) secara manual.</p>
        </div>
      </div>

      {/* Stepper UI */}
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
        {steps.map((s, idx) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => step > s.id && setStep(s.id)}>
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
                step === s.id ? "bg-emerald-600 text-white scale-110 shadow-emerald-900/20" : 
                step > s.id ? "bg-emerald-100 text-emerald-600" : "bg-slate-50 text-slate-300"
              )}>
                <s.icon className="h-5 w-5" />
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest",
                step === s.id ? "text-emerald-900" : "text-slate-400"
              )}>{s.title}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className="flex-1 h-[2px] bg-slate-100 mx-4">
                <div className={cn("h-full bg-emerald-500 transition-all duration-700", step > s.id ? "w-full" : "w-0")} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* STEP 1: Administrasi */}
        {step === 1 && (
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardContent className="p-8 md:p-12 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor LHU</label>
                  <Input {...register("report_number")} className="h-12 rounded-xl bg-slate-50 border-none font-black text-emerald-700 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Klien</label>
                  <Input {...register("client_name")} placeholder="Masukkan nama pemohon..." className="h-12 rounded-xl border-slate-200 text-sm font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Perusahaan</label>
                  <Input {...register("company_name")} placeholder="Nama instansi..." className="h-12 rounded-xl border-slate-200 text-sm font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat</label>
                  <Input {...register("address")} className="h-12 rounded-xl border-slate-200 text-sm font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                 <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tgl Sampling</label><Input type="date" {...register("sampling_date")} className="h-12 rounded-xl border-slate-200 text-xs font-bold" /></div>
                 <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tgl Diterima</label><Input type="date" {...register("received_date")} className="h-12 rounded-xl border-slate-200 text-xs font-bold" /></div>
                 <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tgl Analisis</label><Input type="date" {...register("analysis_date")} className="h-12 rounded-xl border-slate-200 text-xs font-bold" /></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Detail Sampel */}
        {step === 2 && (
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardContent className="p-8 md:p-12 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Sampel</label>
                  <Input {...register("sample_type")} placeholder="Contoh: Air Limbah, Udara Ambien..." className="h-12 rounded-xl border-slate-200 text-sm font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lokasi / Titik Sampling</label>
                  <Input {...register("sample_origin")} placeholder="Contoh: Outlet IPAL, Ruang Produksi..." className="h-12 rounded-xl border-slate-200 text-sm font-bold" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kode Sampel Internal</label>
                  <Input {...register("sample_code")} placeholder="Contoh: 001/S/WHL/2026" className="h-12 rounded-xl border-slate-200 font-mono text-sm" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Baku Mutu */}
        {step === 3 && (
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardContent className="p-8 md:p-12 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                   <Info className="h-6 w-6 text-emerald-600 shrink-0" />
                   <p className="text-xs font-medium text-emerald-800 leading-relaxed">Pilih standar regulasi sebagai acuan baku mutu. Sistem akan otomatis mengisi daftar parameter berdasarkan regulasi yang dipilih, namun Anda tetap bisa menambah atau menghapusnya secara manual.</p>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Regulasi Acuan</label>
                  <Controller
                    control={control}
                    name="regulation_id"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-white font-bold text-sm shadow-sm">
                          <SelectValue placeholder="Pilih standar baku mutu..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl shadow-2xl">
                          <SelectItem value="manual" className="font-bold py-3">TANPA REGULASI (INPUT MANUAL)</SelectItem>
                          {regulations.map(r => (
                            <SelectItem key={r.id} value={r.id} className="py-3 font-medium">{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Hasil Analisis */}
        {step === 4 && (
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
               <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Rincian Hasil Uji</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Input nilai hasil laboratorium dan status kepatuhan</p>
               </div>
               <Button type="button" onClick={() => append({ parameter: "", unit: "", standard_value: "", result_value: "", method: "", is_qualified: true })} className="rounded-xl bg-white border border-slate-200 text-emerald-600 hover:bg-emerald-50 font-bold text-[10px] uppercase h-10 px-6">
                 <Plus className="w-4 h-4 mr-2" /> Tambah Baris
               </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Parameter</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">Satuan</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-28">Baku Mutu</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32 text-emerald-600">Hasil Uji</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode</th>
                    <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20 text-center">Lulus?</th>
                    <th className="px-6 py-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {fields.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-20 text-center text-slate-400 text-xs italic font-medium uppercase tracking-widest">
                        Belum ada parameter. Klik "Tambah Baris" untuk memulai.
                      </td>
                    </tr>
                  )}
                  {fields.map((field, index) => (
                    <tr key={field.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3"><Input {...register(`items.${index}.parameter`)} className="h-9 text-xs font-bold border-slate-100" /></td>
                      <td className="px-4 py-3"><Input {...register(`items.${index}.unit`)} className="h-9 text-xs text-center border-slate-100" /></td>
                      <td className="px-4 py-3"><Input {...register(`items.${index}.standard_value`)} className="h-9 text-xs text-center border-slate-100 bg-slate-50/50" /></td>
                      <td className="px-4 py-3"><Input {...register(`items.${index}.result_value`)} className="h-9 text-xs text-center border-emerald-200 font-black text-emerald-700 focus:ring-emerald-500/20" /></td>
                      <td className="px-4 py-3"><Input {...register(`items.${index}.method`)} className="h-9 text-[10px] border-slate-100" /></td>
                      <td className="px-4 py-3 text-center">
                        <Controller
                          control={control}
                          name={`items.${index}.is_qualified`}
                          render={({ field }) => (
                            <button 
                              type="button" 
                              onClick={() => field.onChange(!field.value)}
                              className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center transition-all shadow-sm mx-auto",
                                field.value ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                              )}
                            >
                              {field.value ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            </button>
                          )}
                        />
                      </td>
                      <td className="px-6 py-3 text-right">
                         <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-slate-200 hover:text-rose-500 rounded-lg">
                           <Trash2 className="w-4 h-4" />
                         </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-6 flex items-center justify-between z-50">
           <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => step > 1 && setStep(step - 1)}
                className={cn("h-12 px-8 rounded-xl font-black text-slate-400 uppercase text-[10px] tracking-widest", step === 1 && "invisible")}
              >
                Kembali
              </Button>
              
              <div className="flex gap-4">
                {step < 4 ? (
                  <Button 
                    type="button" 
                    onClick={() => setStep(step + 1)}
                    className="h-12 px-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-900/20 active:scale-95 transition-all"
                  >
                    Lanjut Ke Step {step + 1}
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="h-12 px-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center gap-2"
                  >
                    {loading ? "Memproses..." : <><Save className="w-4 h-4" /> Simpan Laporan Final</>}
                  </Button>
                )}
              </div>
           </div>
        </div>
      </form>
    </div>
  );
}
