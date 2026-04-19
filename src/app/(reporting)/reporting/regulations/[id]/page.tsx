"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, BookOpen, Beaker, ShieldCheck, 
  Info, Edit, Trash2, Plus, List,
  Layers, CheckCircle2, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  getRegulationDetail 
} from "@/lib/actions/reporting";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChemicalLoader } from "@/components/ui";

export default function RegulationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [regulation, setRegulation] = useState<any>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getRegulationDetail(id);
        if (data) {
          setRegulation(data);
        } else {
          toast.error("Regulasi tidak ditemukan");
        }
      } catch (error) {
        toast.error("Gagal memuat data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><ChemicalLoader /></div>;
  if (!regulation) return (
    <div className="p-10 text-center space-y-4">
      <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300"><Info className="h-10 w-10" /></div>
      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Regulasi Tidak Ditemukan</h2>
      <Link href="/reporting/regulations">
        <Button variant="outline" className="rounded-xl border-slate-200 uppercase text-[10px] font-black tracking-widest mt-4">Kembali ke Daftar</Button>
      </Link>
    </div>
  );

  const filteredParameters = regulation.parameters?.filter((p: any) => 
    p.parameter.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-10 space-y-10 max-w-7xl mx-auto pb-24">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex items-center gap-6">
          <Link href="/reporting/regulations">
            <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white border-2 border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 transition-all shadow-sm">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
               <Badge className="bg-emerald-600 text-white font-black text-[9px] uppercase tracking-[2px] px-3 py-1 rounded-full border-none">Baku Mutu Resmi</Badge>
               <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{regulation.category || 'Umum'}</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{regulation.name}</h1>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/reporting/regulations/${id}/edit`}>
            <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 font-bold uppercase text-[10px] tracking-widest gap-2 bg-white shadow-sm">
              <Edit className="h-4 w-4" /> Edit Regulasi
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: General Info Card */}
        <div className="lg:col-span-4 space-y-8">
           <Card className="border-none shadow-2xl shadow-emerald-900/5 rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-8 pb-4">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Info className="h-4 w-4 text-emerald-600" /> Deskripsi Standar
                 </h3>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                 <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                       {regulation.description || "Tidak ada deskripsi tambahan untuk regulasi ini."}
                    </p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                       <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Parameter</p>
                       <p className="text-xl font-black text-emerald-950">{regulation.parameters?.length || 0}</p>
                    </div>
                    <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100/50">
                       <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Status</p>
                       <p className="text-[11px] font-black text-blue-950 uppercase tracking-tight flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" /> ACTIVE
                       </p>
                    </div>
                 </div>

                 <div className="pt-4 space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="h-2 w-2 rounded-full bg-emerald-500" />
                       <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Dibuat: {new Date(regulation.created_at).toLocaleDateString("id-ID")}</p>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <div className="p-8 bg-emerald-950 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 space-y-4 text-center">
                 <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto border border-white/20">
                    <Beaker className="h-7 w-7 text-emerald-400" />
                 </div>
                 <div>
                    <h4 className="font-black uppercase tracking-tight text-lg">Lab Verification</h4>
                    <p className="text-[10px] font-medium text-emerald-300/60 uppercase tracking-widest mt-1">Official Threshold Standards</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Right: Parameters List Table */}
        <div className="lg:col-span-8">
           <Card className="border-none shadow-2xl shadow-emerald-900/5 rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                 <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-900/20">
                       <List className="h-5 w-5" />
                    </div>
                    <div>
                       <CardTitle className="text-xl font-black uppercase tracking-tight text-emerald-950">Daftar Parameter</CardTitle>
                       <CardDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Nilai ambang batas dan metode analisis resmi</CardDescription>
                    </div>
                 </div>
                 <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input 
                      placeholder="Cari parameter..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 h-10 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                 </div>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100">
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">No</th>
                             <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Parameter Uji</th>
                             <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Satuan</th>
                             <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Baku Mutu</th>
                             <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode Analisis</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {filteredParameters?.map((param: any, index: number) => (
                             <tr key={param.id} className="hover:bg-emerald-50/20 transition-all group">
                                <td className="px-8 py-6">
                                   <span className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                      {index + 1}
                                   </span>
                                </td>
                                <td className="px-6 py-6">
                                   <p className="font-black text-slate-800 uppercase tracking-tight text-sm">{param.parameter}</p>
                                </td>
                                <td className="px-6 py-6 text-center">
                                   <Badge variant="outline" className="border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500 rounded-lg h-7 px-3">
                                      {param.unit || '-'}
                                   </Badge>
                                </td>
                                <td className="px-6 py-6 text-center">
                                   <span className="font-black text-emerald-700 text-sm tracking-tight">{param.standard_value || '-'}</span>
                                </td>
                                <td className="px-8 py-6">
                                   <div className="flex items-start gap-2">
                                      <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                                      <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase italic">
                                         {param.method || 'SOP Internal Lab'}
                                      </p>
                                   </div>
                                </td>
                             </tr>
                          ))}
                          {filteredParameters?.length === 0 && (
                            <tr>
                               <td colSpan={5} className="py-20 text-center">
                                  <Layers className="h-10 w-10 text-slate-100 mx-auto mb-3" />
                                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Parameter tidak ditemukan</p>
                               </td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
