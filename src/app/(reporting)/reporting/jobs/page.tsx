"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  FolderOpen,
  Search,
} from "lucide-react";
import { getMyReportingJobs } from "@/lib/actions/reporting";
import { REPORTING_STATUS_LABELS } from "@/lib/constants/workflow-copy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function ReportingJobsSkeleton() {
  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 via-emerald-50/10 to-slate-50 min-h-screen space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-36 rounded-xl" />
          <Skeleton className="h-11 w-40 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-none shadow-lg rounded-2xl bg-white">
            <CardContent className="p-5 flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-12 w-full sm:w-80 rounded-xl" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-6 md:px-8 py-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
                <Skeleton className="h-10 w-28 rounded-xl" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getStatusBadge(status: string) {
  const className =
    status === "analysis_done"
      ? "bg-amber-50 text-amber-700 border-amber-100"
      : status === "reporting"
        ? "bg-violet-50 text-violet-700 border-violet-100"
        : status === "completed"
          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
          : "bg-slate-50 text-slate-700 border-slate-100";

  return (
    <Badge className={cn("border px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider", className)}>
      {REPORTING_STATUS_LABELS[status as keyof typeof REPORTING_STATUS_LABELS] || status}
    </Badge>
  );
}

function getActionLabel(status: string) {
  if (status === "completed") return "Lihat Hasil";
  if (status === "reporting") return "Lanjutkan";
  return "Proses LHU";
}

export default function ReportingJobsPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadJobs() {
      try {
        const data = await getMyReportingJobs(1, 50);
        setJobs(data.jobOrders || []);
      } catch (error) {
        console.error("Failed to load jobs:", error);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return jobs;

    return jobs.filter((job: any) => {
      const customer = job.quotation?.profile?.company_name || job.quotation?.profile?.full_name || "";
      return [job.tracking_code, customer, job.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [jobs, search]);

  const stats = useMemo(() => {
    return {
      ready: jobs.filter((job) => job.status === "analysis_done").length,
      progress: jobs.filter((job) => job.status === "reporting").length,
      completed: jobs.filter((job) => job.status === "completed").length,
    };
  }, [jobs]);

  if (loading) return <ReportingJobsSkeleton />;

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 via-emerald-50/10 to-slate-50 min-h-screen space-y-6 pb-24 md:pb-8 animate-in fade-in duration-700">
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 via-teal-600/5 to-emerald-600/5 rounded-2xl blur-2xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl blur-sm opacity-50" />
              <div className="relative h-12 w-12 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl flex items-center justify-center text-white shadow-xl border-2 border-white/20">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                  Antrean Reporting
                </h1>
                <Badge className="bg-emerald-100 text-emerald-700 border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                  LHU
                </Badge>
              </div>
              <p className="text-slate-500 text-xs mt-1 font-medium">
                Proses job dari analis hingga penerbitan laporan hasil uji.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <Link href="/reporting/direct-requests" className="flex-1 lg:flex-none">
              <Button variant="outline" className="w-full h-11 px-5 rounded-xl border-2 border-slate-100 bg-white hover:bg-violet-50 text-slate-600 hover:text-violet-700 font-black uppercase text-[9px] tracking-widest gap-2 shadow-sm">
                <AlertCircle className="h-4 w-4" /> Direct LHU
              </Button>
            </Link>
            <Link href="/reporting" className="flex-1 lg:flex-none">
              <Button className="w-full h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9px] tracking-widest shadow-lg shadow-emerald-950/20 gap-2">
                <FolderOpen className="h-4 w-4" /> Arsip
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Siap Dibuat", value: stats.ready, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Dalam Proses", value: stats.progress, icon: FileText, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Selesai", value: stats.completed, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat) => (
          <Card key={stat.label} className="border-none shadow-lg shadow-slate-200/50 rounded-2xl bg-white overflow-hidden group hover:translate-y-[-2px] transition-all">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-inner", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em]">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter mt-0.5">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="p-6 md:p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-0.5">
            <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-emerald-600" /> Daftar Job Siap Reporting
            </CardTitle>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Reporting Queue System</p>
          </div>

          <div className="relative w-full lg:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
            <Input
              placeholder="Cari tracking atau customer..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-11 h-12 bg-white border-none shadow-inner rounded-xl font-bold text-xs focus-visible:ring-emerald-500 transition-all"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredJobs.length === 0 ? (
            <div className="py-28 flex flex-col items-center text-center px-6">
              <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-emerald-300" />
              </div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">Tidak ada job order</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm">
                Semua pekerjaan reporting yang tersedia akan tampil di daftar ini.
              </p>
              {search && (
                <Button onClick={() => setSearch("")} variant="outline" className="mt-6 h-10 rounded-xl border-slate-200 font-black uppercase text-[9px] tracking-widest px-6">
                  Reset Pencarian
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Job Order</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredJobs.map((job: any) => {
                    const customer = job.quotation?.profile?.company_name || job.quotation?.profile?.full_name || "-";
                    const email = job.quotation?.profile?.email || "Customer";

                    return (
                      <tr key={job.id} className="hover:bg-emerald-50/20 transition-all group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-slate-800 uppercase tracking-tight text-sm leading-none">{job.tracking_code}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Job Order</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="min-w-0">
                            <p className="font-black text-slate-700 text-xs uppercase tracking-tight truncate max-w-[220px]">{customer}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-1 truncate max-w-[220px]">{email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">{getStatusBadge(job.status)}</td>
                        <td className="px-8 py-5 text-right">
                          <Link href={`/reporting/jobs/${job.id}`}>
                            <Button className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[9px] tracking-widest px-4 shadow-lg shadow-emerald-900/15 gap-2">
                              {getActionLabel(job.status)}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
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
