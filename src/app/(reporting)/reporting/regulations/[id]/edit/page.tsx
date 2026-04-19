"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  X, Save, Plus, Trash2, 
  BookOpen, Settings, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  getRegulationDetail, 
  updateRegulation 
} from "@/lib/actions/reporting";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { ChemicalLoader } from "@/components/ui";

interface RegulationForm {
  name: string;
  category: string;
  description: string;
  parameters: {
    parameter: string;
    unit: string;
    standard_value: string;
    method: string;
  }[];
}

export default function EditRegulationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<RegulationForm>({
    defaultValues: {
      name: "",
      category: "AIR",
      description: "",
      parameters: []
    }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "parameters"
  });

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getRegulationDetail(id);
        if (data) {
          reset({
            name: data.name,
            category: data.category || "AIR",
            description: data.description || "",
            parameters: data.parameters || []
          });
        }
      } catch (error) {
        toast.error("Gagal memuat data regulasi");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, reset]);

  const onSubmit = async (data: RegulationForm) => {
    setSubmitting(true);
    try {
      const result = await updateRegulation(id, data);
      if (result.success) {
        toast.success("✅ Regulasi berhasil diperbarui");
        router.push(`/reporting/regulations/${id}`);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="fixed inset-0 z-50 bg-white flex items-center justify-center"><ChemicalLoader /></div>;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 md:p-10 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 relative">
        {/* Header Modal */}
        <div className="bg-indigo-950 p-8 md:p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32" />
          <div className="relative z-10 flex justify-between items-start">
             <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                   <RefreshCw className="h-7 w-7 text-indigo-400" />
                </div>
                <div>
                   <h2 className="text-2xl font-black uppercase tracking-tight leading-none">Edit Regulasi</h2>
                   <p className="text-indigo-400/60 text-[10px] font-bold uppercase tracking-[3px] mt-2">Update Standard & Thresholds</p>
                </div>
             </div>
             <Link href={`/reporting/regulations/${id}`}>
                <Button variant="ghost" size="icon" className="rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all">
                   <X className="h-6 w-6" />
                </Button>
             </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 md:p-12 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Regulasi / Peraturan</label>
                   <Input 
                     {...register("name", { required: true })} 
                     className="h-12 rounded-2xl border-slate-200 font-bold text-sm px-5"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Matriks</label>
                   <Controller
                     control={control}
                     name="category"
                     render={({ field }) => (
                       <Select value={field.value} onValueChange={field.onChange}>
                         <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold text-sm">
                           <SelectValue placeholder="Pilih kategori..." />
                         </SelectTrigger>
                         <SelectContent className="rounded-2xl border-indigo-50 shadow-2xl">
                           <SelectItem value="AIR" className="font-bold py-3">AIR LIMBAH / BERSIH</SelectItem>
                           <SelectItem value="UDARA" className="font-bold py-3">UDARA EMISI / AMBIEN</SelectItem>
                           <SelectItem value="TANAH" className="font-bold py-3">TANAH / SEDIMEN</SelectItem>
                           <SelectItem value="KEBISINGAN" className="font-bold py-3">KEBISINGAN / GETARAN</SelectItem>
                         </SelectContent>
                       </Select>
                     )}
                   />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi / Ruang Lingkup</label>
                <Textarea 
                  {...register("description")} 
                  className="h-full min-h-[120px] rounded-[2rem] border-slate-200 font-medium text-xs p-6"
                />
             </div>
          </div>

          <div className="space-y-6">
             <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <div className="flex items-center gap-3">
                   <Settings className="h-5 w-5 text-indigo-600" />
                   <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Parameter Standard</h3>
                </div>
                <Button 
                  type="button" 
                  onClick={() => append({ parameter: "", unit: "", standard_value: "", method: "" })}
                  className="rounded-xl bg-slate-50 hover:bg-indigo-50 text-indigo-600 font-black text-[10px] uppercase h-10 px-6 border border-slate-100"
                >
                  <Plus className="w-4 h-4 mr-2" /> Tambah Baris
                </Button>
             </div>

             <div className="max-h-[350px] overflow-y-auto pr-2 space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-3 items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group">
                     <div className="col-span-4 space-y-1">
                        <Input {...register(`parameters.${index}.parameter`)} className="h-10 text-xs font-bold border-transparent focus:border-indigo-200 bg-white shadow-sm rounded-xl" />
                     </div>
                     <div className="col-span-2 space-y-1">
                        <Input {...register(`parameters.${index}.unit`)} className="h-10 text-xs text-center border-transparent focus:border-indigo-200 bg-white shadow-sm rounded-xl" />
                     </div>
                     <div className="col-span-2 space-y-1">
                        <Input {...register(`parameters.${index}.standard_value`)} className="h-10 text-xs text-center border-transparent focus:border-indigo-200 bg-white shadow-sm rounded-xl font-black text-indigo-700" />
                     </div>
                     <div className="col-span-3 space-y-1">
                        <Input {...register(`parameters.${index}.method`)} className="h-10 text-[10px] border-transparent focus:border-indigo-200 bg-white shadow-sm rounded-xl" />
                     </div>
                     <div className="col-span-1 flex justify-center">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => remove(index)}
                          className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                           <Trash2 className="h-4 w-4" />
                        </Button>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="pt-6 flex justify-end gap-4 border-t border-slate-50">
             <Link href={`/reporting/regulations/${id}`}>
                <Button type="button" variant="ghost" className="h-14 px-10 rounded-2xl font-black text-slate-400 uppercase text-[10px] tracking-widest hover:bg-slate-50">Batal</Button>
             </Link>
             <Button 
               type="submit" 
               disabled={submitting}
               className="h-14 px-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-indigo-900/20 active:scale-95 transition-all flex items-center gap-3"
             >
                {submitting ? "Memperbarui..." : <><Save className="w-5 h-5" /> Simpan Perubahan</>}
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
