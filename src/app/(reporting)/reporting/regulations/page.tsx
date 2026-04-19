"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  BookOpen, Plus, Search, MoreVertical, 
  Eye, Edit, Trash2, Book, Beaker,
  ChevronLeft, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  getRegulations
} from "@/lib/actions/reporting";
import { toast } from "sonner";
import { ChemicalLoader } from "@/components/ui";

export default function RegulationListPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getRegulations();
      setData(result);
    } catch (error) {
      toast.error("Gagal memuat data regulasi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <Link href="/reporting">
            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-slate-200 text-slate-400 hover:text-emerald-600 transition-all">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-emerald-950 tracking-tighter uppercase">Baku Mutu Parameter</h1>
            <p className="text-slate-500 text-sm font-medium">Pengelolaan standar regulasi dan ambang batas parameter pengujian.</p>
          </div>
        </div>
        <Link href="/reporting/regulations/new">
          <Button className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-900/10 gap-2">
            <Plus className="h-4 w-4" /> Tambah Regulasi
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="p-8 border-b bg-slate-50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              placeholder="Cari nama regulasi atau kategori..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 h-12 bg-white border border-slate-200 rounded-xl font-medium shadow-inner px-4 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 flex justify-center"><ChemicalLoader /></div>
          ) : filteredData.length === 0 ? (
            <div className="py-32 flex flex-col items-center text-center px-10">
              <div className="h-24 w-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
                <Book className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Regulasi Kosong</h3>
              <p className="text-slate-400 text-sm max-w-xs mt-2 font-medium italic">Belum ada standar baku mutu yang terdaftar di sistem.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
              {filteredData.map((reg) => (
                <Card key={reg.id} className="border-2 border-slate-50 hover:border-emerald-100 hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden group">
                  <CardHeader className="p-6 bg-slate-50/50 group-hover:bg-emerald-50/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="text-[9px] font-black border-slate-200 uppercase tracking-widest bg-white">
                        {reg.category || 'UMUM'}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-tight mt-4 line-clamp-2 min-h-[40px]">
                      {reg.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Total Parameter</span>
                      <span className="text-emerald-600 font-black">{reg._count?.parameters || 0} ITEMS</span>
                    </div>
                    <div className="h-[2px] w-full bg-slate-50" />
                    <div className="flex gap-2 pt-2">
                      <Link href={`/reporting/regulations/${reg.id}`} className="flex-1">
                        <Button variant="outline" className="w-full h-10 rounded-xl text-[9px] font-black uppercase tracking-widest border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                          Lihat Detail
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 hover:text-rose-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
