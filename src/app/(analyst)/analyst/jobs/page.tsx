"use client";

import React, { useEffect, useState } from "react";
import { getMyAnalysisJobs } from "@/lib/actions/analyst";
import { ChemicalLoader } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  FlaskConical,
  Search,
  ArrowRight,
  Filter
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export default function AnalystJobsPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function loadJobs() {
      try {
        const status = statusFilter === "all" ? undefined : statusFilter;
        const data = await getMyAnalysisJobs(page, 20, status);
        setJobs(data.jobOrders || []);
        setTotal(data.total || 0);
      } catch (error) {
        console.error("Failed to load jobs:", error);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, [page, statusFilter]);

  const statusColors: any = {
    scheduled: "bg-slate-100 text-slate-700",
    sampling: "bg-blue-100 text-blue-700",
    analysis: "bg-violet-100 text-violet-700",
    analysis_done: "bg-emerald-100 text-emerald-700",
    reporting: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700"
  };

  const statusLabels: any = {
    scheduled: "Terjadwal",
    sampling: "Sampling",
    analysis: "Analisis",
    analysis_done: "Selesai Analisis",
    reporting: "Reporting",
    completed: "Selesai"
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Analisis Saya</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola job order analisis laboratorium Anda</p>
      </div>

      {/* Filters */}
      <Card className="mb-6 shadow-lg shadow-emerald-900/5">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari tracking code atau customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="analysis">Analisis</SelectItem>
                <SelectItem value="analysis_done">Selesai Analisis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card className="shadow-xl shadow-emerald-900/5">
        <CardHeader>
          <CardTitle className="text-emerald-900">Daftar Job Order</CardTitle>
          <CardDescription>Total {total} job order</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-20">
              <ChemicalLoader />
              <p className="text-sm text-slate-500 mt-4">Memuat data...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-20">
              <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <FlaskConical className="h-10 w-10 text-emerald-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">Tidak ada job order</h3>
              <p className="text-sm text-slate-500 mt-1">
                Job order akan muncul setelah ditugaskan oleh operator
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="font-bold text-emerald-900">Tracking Code</TableHead>
                  <TableHead className="font-bold text-emerald-900">Customer</TableHead>
                  <TableHead className="font-bold text-emerald-900">Lokasi Sampling</TableHead>
                  <TableHead className="font-bold text-emerald-900">Status</TableHead>
                  <TableHead className="font-bold text-emerald-900 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job: any) => (
                  <TableRow key={job.id} className="hover:bg-emerald-50/50">
                    <TableCell className="font-bold text-slate-900">{job.tracking_code}</TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {job.quotation?.profile?.company_name || job.quotation?.profile?.full_name || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {job.sampling_assignment?.location || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[job.status] || "bg-slate-100 text-slate-700"}>
                        {statusLabels[job.status] || job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/analyst/jobs/${job.id}`}>
                        <Button size="sm" className="cursor-pointer">
                          Lihat Detail
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
