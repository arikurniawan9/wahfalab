"use client";

import React, { useEffect, useState } from "react";
import { getAnalystDashboard, getMyAnalysisJobs } from "@/lib/actions/analyst";
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
  CheckCircle,
  Clock,
  FileText,
  ArrowRight,
  Search
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function AnalystDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getAnalystDashboard();
        setDashboard(data);
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
      title: "Pending",
      value: dashboard?.stats?.pending || 0,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      description: "Menunggu analisis"
    },
    {
      title: "Dalam Analisis",
      value: dashboard?.stats?.inProgress || 0,
      icon: FlaskConical,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      description: "Sedang dianalisis"
    },
    {
      title: "Selesai",
      value: dashboard?.stats?.done || 0,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      description: "Analisis selesai"
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
        <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Dashboard Analis</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola dan lacak analisis sampel laboratorium Anda</p>
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

      {/* Recent Jobs */}
      <Card className="shadow-xl shadow-emerald-900/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-emerald-900">Job Order Terbaru</CardTitle>
              <CardDescription>Daftar job order yang ditugaskan kepada Anda</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari tracking code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dashboard?.recentJobs && dashboard.recentJobs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="font-bold text-emerald-900">Tracking Code</TableHead>
                  <TableHead className="font-bold text-emerald-900">Customer</TableHead>
                  <TableHead className="font-bold text-emerald-900">Layanan</TableHead>
                  <TableHead className="font-bold text-emerald-900">Status</TableHead>
                  <TableHead className="font-bold text-emerald-900 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.recentJobs.map((job: any) => {
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
                    <TableRow key={job.id} className="hover:bg-emerald-50/50">
                      <TableCell className="font-bold text-slate-900">{job.tracking_code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-slate-900">
                            {job.quotation?.profile?.company_name || job.quotation?.profile?.full_name || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.quotation?.items?.[0]?.service?.name || "-"}
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
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-20">
              <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <FlaskConical className="h-10 w-10 text-emerald-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">Belum ada job order</h3>
              <p className="text-sm text-slate-500 mt-1">
                Job order akan muncul setelah sampling selesai dilakukan
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
