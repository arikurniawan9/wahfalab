"use client";

import React, { useEffect, useState } from "react";
import { getMyReportingJobs } from "@/lib/actions/reporting";
import { ChemicalLoader } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { REPORTING_STATUS_LABELS } from "@/lib/constants/workflow-copy";

export default function ReportingJobsPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);

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

  const statusColors: any = {
    analysis_done: "bg-amber-100 text-amber-700",
    reporting: "bg-violet-100 text-violet-700",
    completed: "bg-emerald-100 text-emerald-700"
  };

  const statusLabels: any = {
    ...REPORTING_STATUS_LABELS
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      <div className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Antrean Reporting</h1>
            <p className="text-slate-500 text-sm mt-1">Proses job dari analis hingga penerbitan LHU</p>
          </div>
          <Link href="/reporting/direct-requests">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl h-10 px-5">
              Antrean LHU Langsung
            </Button>
          </Link>
        </div>
      </div>

      <Card className="shadow-xl shadow-emerald-900/5">
        <CardHeader>
            <CardTitle className="text-emerald-900">Daftar Job Siap Reporting</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-20">
              <ChemicalLoader />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-20">
              <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-10 w-10 text-emerald-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">Tidak ada job order</h3>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="font-bold text-emerald-900">Tracking Code</TableHead>
                  <TableHead className="font-bold text-emerald-900">Customer</TableHead>
                  <TableHead className="font-bold text-emerald-900">Status</TableHead>
                  <TableHead className="font-bold text-emerald-900 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job: any) => (
                  <TableRow key={job.id} className="hover:bg-emerald-50/50">
                    <TableCell className="font-bold text-slate-900">{job.tracking_code}</TableCell>
                    <TableCell>
                      {job.quotation?.profile?.company_name || job.quotation?.profile?.full_name || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[job.status] || "bg-slate-100 text-slate-700"}>
                        {statusLabels[job.status] || job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/reporting/jobs/${job.id}`}>
                        <Button size="sm" className="cursor-pointer">
                           {job.status === "completed" ? "Lihat Hasil" : job.status === "reporting" ? "Lanjutkan LHU" : "Proses LHU"}
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
