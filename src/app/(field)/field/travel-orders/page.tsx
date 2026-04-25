"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, RefreshCw, Search, Calendar, MapPin, ChevronRight, Download } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getProfile } from "@/lib/actions/auth";
import { getMyTravelOrders } from "@/lib/actions/travel-order";

export default function FieldTravelOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<any[]>([]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const profile = await getProfile();
      if (!profile?.id) {
        toast.error("Profil pengguna tidak ditemukan");
        return;
      }

      const data = await getMyTravelOrders(profile.id);
      setItems(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error?.message || "Gagal memuat surat tugas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item: any) => {
      const code = item.assignment?.job_order?.tracking_code?.toLowerCase() || "";
      const doc = item.document_number?.toLowerCase() || "";
      const destination = item.destination?.toLowerCase() || "";
      const purpose = item.purpose?.toLowerCase() || "";
      return code.includes(q) || doc.includes(q) || destination.includes(q) || purpose.includes(q);
    });
  }, [items, search]);

  return (
    <div className="p-3 md:p-6 pb-24 md:pb-6 max-w-4xl mx-auto space-y-4 animate-in fade-in duration-300">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <h1 className="text-sm font-black text-slate-800 uppercase tracking-tight">Surat Tugas</h1>
        </div>
        <button
          onClick={() => loadData(true)}
          className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
        >
          <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} /> {refreshing ? "..." : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white p-2 rounded-xl border border-slate-100">
          <p className="text-[8px] font-black text-slate-400 uppercase">Total Dokumen</p>
          <p className="text-lg font-black text-slate-800 leading-none mt-1">{items.length}</p>
        </div>
        <div className="bg-white p-2 rounded-xl border border-slate-100">
          <p className="text-[8px] font-black text-slate-400 uppercase">Siap Diunduh</p>
          <p className="text-lg font-black text-emerald-700 leading-none mt-1">
            {items.filter((item: any) => Boolean(item)).length}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
        <Input
          placeholder="Cari nomor surat / tracking / tujuan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 bg-white border-slate-100 rounded-xl text-xs font-medium focus-visible:ring-blue-500"
        />
      </div>

      <div className="space-y-2">
        {loading ? (
          Array(4)
            .fill(0)
            .map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-10 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Surat tugas belum tersedia
          </div>
        ) : (
          filteredItems.map((item: any) => (
            <Link key={item.id} href={`/field/travel-orders/${item.id}/preview`}>
              <Card className="group border border-slate-100 shadow-none hover:bg-slate-50 transition-colors cursor-pointer rounded-xl overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[9px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          {item.document_number}
                        </span>
                        <Badge className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border-none">
                          Surat Tugas
                        </Badge>
                      </div>
                      <p className="text-[11px] font-black text-slate-800 truncate">
                        {item.assignment?.job_order?.tracking_code || "-"}
                      </p>
                      <div className="flex items-center gap-1 text-slate-400 text-[9px] font-medium truncate">
                        <MapPin className="h-2.5 w-2.5 shrink-0" /> {item.destination || "-"}
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-2 shrink-0">
                      <p className="text-[9px] font-black text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        {item.departure_date
                          ? new Date(item.departure_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
                          : "-"}
                      </p>
                      <div className="flex items-center gap-1 text-blue-600">
                        <Download className="h-3 w-3" />
                        <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
