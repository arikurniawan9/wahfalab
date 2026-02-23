"use client";

import React, { useEffect, useState } from "react";
import { getReportingDashboard, getMyReportingJobs, getJobsReadyForReporting } from "@/lib/actions/reporting";
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
  FileText,
  CheckCircle,
  Clock,
  ArrowRight,
  Search,
  User
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function ReportingDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [readyJobs, setReadyJobs] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [dashData, readyData] = await Promise.all([
          getReportingDashboard(),
          getJobsReadyForReporting(1, 5)
        ]);
        setDashboard(dashData);
        setReadyJobs(readyData.jobOrders || []);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <ChemicalLoader />
      </div>
    );
  }

  const statsCards = [
    {
      title: "Menunggu Reporting",
      value: dashboard?.stats?.pending || 0,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      description: "Siap diterbitkan LHU"
    },
    {
      title: "Dalam Proses",
      value: dashboard?.stats?.inProgress || 0,
      icon: FileText,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      description: "Sedang dibuat LHU"
    },
    {
      title: "Selesai",
      value: dashboard?.stats?.done || 0,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      description: "LHU terbit"
    },
    {
      title: "Total",
      value: dashboard?.stats?.total || 0,
      icon: FileText,
      color: "text-slate-600",
      bgColor: "bg-slate-50",
      description: "Semua job order"
    }
  ];

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Dashboard Reporting</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola penerbitan Laporan Hasil Uji (LHU)</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-10">
        {statsCards.map((stat, index) => (
          <Card key={index} className="shadow-lg shadow-emerald-900/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
              <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Jobs Ready for Reporting */}
      <Card className="shadow-xl shadow-emerald-900/5 mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-emerald-900">Menunggu Reporting</CardTitle>
              <CardDescription>Job order yang siap diterbitkan LHU</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {readyJobs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="font-bold text-emerald-900">Tracking Code</TableHead>
                  <TableHead className="font-bold text-emerald-900">Customer</TableHead>
                  <TableHead className="font-bold text-emerald-900">Analis</TableHead>
                  <TableHead className="font-bold text-emerald-900">Tanggal Selesai</TableHead>
                  <TableHead className="font-bold text-emerald-900 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readyJobs.map((job: any) => (
                  <TableRow key={job.id} className="hover:bg-emerald-50/50">
                    <TableCell className="font-bold text-slate-900">{job.tracking_code}</TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {job.quotation?.profile?.company_name || job.quotation?.profile?.full_name || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        {job.lab_analysis?.analyst?.full_name || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {job.analysis_done_at 
                        ? new Date(job.analysis_done_at).toLocaleDateString("id-ID")
                        : "-"
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/reporting/jobs/${job.id}`}>
                        <Button size="sm" className="cursor-pointer">
                          Buat LHU
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">Tidak ada job menunggu</h3>
              <p className="text-sm text-slate-500 mt-1">
                Job akan muncul setelah analis menyelesaikan analisis
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card className="shadow-xl shadow-emerald-900/5">
        <CardHeader>
          <CardTitle className="text-emerald-900">Job Order Saya</CardTitle>
          <CardDescription>Riwayat job order yang Anda tangani</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboard?.recentJobs && dashboard.recentJobs.length > 0 ? (
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
                {dashboard.recentJobs.map((job: any) => (
                  <TableRow key={job.id} className="hover:bg-emerald-50/50">
                    <TableCell className="font-bold text-slate-900">{job.tracking_code}</TableCell>
                    <TableCell>
                      {job.quotation?.profile?.company_name || job.quotation?.profile?.full_name || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        job.status === "completed" 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-violet-100 text-violet-700"
                      }>
                        {job.status === "completed" ? "Selesai" : "Dalam Proses"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/reporting/jobs/${job.id}`}>
                        <Button size="sm" className="cursor-pointer">
                          Lihat Detail
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">Belum ada job order</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
