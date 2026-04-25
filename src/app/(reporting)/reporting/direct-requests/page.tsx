"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChemicalLoader } from "@/components/ui";
import {
  acceptDirectReportingTask,
  cloneQuotation,
  getDirectReportingTasks,
} from "@/lib/actions/quotation";
import { toast } from "sonner";
import { CheckCircle, Copy, Edit3, Eye, Search } from "lucide-react";

export default function ReportingDirectRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDirectReportingTasks(1, 50, search);
      setData(result || { items: [], total: 0, pages: 1 });
    } catch (error) {
      toast.error("Gagal memuat antrean direct reporting");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAcceptTask = async (jobOrderId: string) => {
    try {
      setProcessingId(jobOrderId);
      const result = await acceptDirectReportingTask(jobOrderId);
      if ((result as any)?.error) throw new Error((result as any).error);
      toast.success("Tugas direct reporting diterima");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Gagal menerima tugas");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDuplicateForEdit = async (quotationId: string) => {
    try {
      setProcessingId(quotationId);
      const result = await cloneQuotation(quotationId);
      if (!(result as any)?.success || !(result as any)?.id) {
        throw new Error("Gagal menduplikasi penawaran");
      }
      toast.success("Draft duplikasi berhasil dibuat");
      router.push(`/reporting/direct-requests/${(result as any).id}/edit`);
    } catch (error: any) {
      toast.error(error?.message || "Gagal duplikasi");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 space-y-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-black text-emerald-950 tracking-tight">Antrean Direct Reporting</h1>
        <p className="text-slate-500 text-sm">
          Penawaran diterima dari admin/operator untuk diproses langsung oleh reporting tanpa sampling dan analisis.
        </p>
      </div>

      <Card className="shadow-xl shadow-emerald-900/5">
        <CardHeader className="border-b bg-slate-50/40">
          <CardTitle className="text-emerald-900 text-base">Daftar Tugas Direct</CardTitle>
          <div className="relative mt-3">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Cari tracking code / nomor penawaran / klien..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center">
              <ChemicalLoader />
            </div>
          ) : data.items.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm font-semibold">
              Tidak ada antrean direct reporting.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-slate-400 font-black">Tracking</th>
                    <th className="px-4 py-4 text-[10px] uppercase tracking-widest text-slate-400 font-black">Penawaran</th>
                    <th className="px-4 py-4 text-[10px] uppercase tracking-widest text-slate-400 font-black">Klien</th>
                    <th className="px-4 py-4 text-[10px] uppercase tracking-widest text-slate-400 font-black">Status</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-slate-400 font-black text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((job: any) => {
                    const accepted = !!job.notes?.includes("[DIRECT_REPORTING_ACCEPTED]");
                    return (
                      <tr key={job.id} className="hover:bg-emerald-50/40">
                        <td className="px-6 py-4 font-mono text-xs font-black text-emerald-700">{job.tracking_code}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800 text-xs">{job.quotation?.quotation_number}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                              Total Rp {Number(job.quotation?.total_amount || 0).toLocaleString("id-ID")}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700 text-sm">{job.quotation?.profile?.full_name || "-"}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                              {job.quotation?.profile?.company_name || "Personal"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={accepted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}>
                            {accepted ? "Diterima Reporting" : "Menunggu Diterima"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {!accepted && (
                              <Button
                                size="sm"
                                onClick={() => handleAcceptTask(job.id)}
                                disabled={processingId === job.id}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase"
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                                {processingId === job.id ? "Memproses..." : "Terima"}
                              </Button>
                            )}
                            <Link href={`/reporting/direct-requests/${job.quotation_id}/edit`}>
                              <Button size="sm" variant="outline" className="text-[10px] font-black uppercase">
                                <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Edit Asli
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDuplicateForEdit(job.quotation_id)}
                              disabled={processingId === job.quotation_id}
                              className="text-[10px] font-black uppercase"
                            >
                              <Copy className="h-3.5 w-3.5 mr-1.5" /> Duplikasi
                            </Button>
                            <Link href={`/reporting/jobs/${job.id}`}>
                              <Button size="icon" variant="ghost" className="h-9 w-9">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
