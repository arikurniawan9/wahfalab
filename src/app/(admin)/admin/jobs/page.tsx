// ============================================================================
// ADMIN JOB PROGRESS DASHBOARD - v1.0
// Powerful dashboard to monitor all active job orders and their stages.
// ============================================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Briefcase,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Clock,
  CheckCircle,
  FlaskConical,
  MapPin,
  FileText,
  AlertCircle,
  ArrowRight,
  ClipboardCheck
} from "lucide-react";
import { ChemicalLoader, LoadingOverlay } from "@/components/ui";
import { getJobOrders } from "@/lib/actions/jobs";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Stat Card Component
function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <Card className={cn("border-none shadow-sm transition-all hover:shadow-md", colors[color])}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn("p-2.5 rounded-xl bg-white shadow-sm shrink-0")}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase opacity-60 tracking-wider truncate">{title}</p>
          <p className="text-xl font-black tracking-tight leading-none">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const statusOptions = [
  { value: "all", label: "Semua Status", color: "bg-slate-100 text-slate-700" },
  { value: "scheduled", label: "Terjadwal", color: "bg-blue-100 text-blue-700", icon: Clock },
  { value: "sampling", label: "Sampling", color: "bg-amber-100 text-amber-700", icon: MapPin },
  { value: "analysis", label: "Analisis Lab", color: "bg-indigo-100 text-indigo-700", icon: FlaskConical },
  { value: "reporting", label: "Pelaporan", color: "bg-purple-100 text-purple-700", icon: FileText },
  { value: "completed", label: "Selesai", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
];

export default function AdminJobProgressPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getJobOrders(page, limit, search);
      setData(result);
    } catch (error: any) {
      toast.error("Gagal memuat data progress pekerjaan");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [loadData]);

  const getStatusInfo = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option || statusOptions[0];
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'scheduled': return 20;
      case 'sampling': return 40;
      case 'analysis': return 60;
      case 'reporting': return 80;
      case 'completed': return 100;
      default: return 0;
    }
  };

  const filteredItems = filterStatus === "all" 
    ? data.items 
    : data.items.filter((item: any) => item.status === filterStatus);

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-emerald-600" />
            Progres Pekerjaan
          </h1>
          <p className="text-slate-500 text-sm italic font-medium">Pantau setiap tahapan pekerjaan dari penawaran hingga sertifikat.</p>
        </div>
      </div>

      {/* Workflow Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        <StatCard title="Terjadwal" value={data.items.filter((i:any) => i.status === 'scheduled').length} icon={Clock} color="blue" />
        <StatCard title="Sampling" value={data.items.filter((i:any) => i.status === 'sampling').length} icon={MapPin} color="amber" />
        <StatCard title="Analisis" value={data.items.filter((i:any) => i.status === 'analysis').length} icon={FlaskConical} color="indigo" />
        <StatCard title="Pelaporan" value={data.items.filter((i:any) => i.status === 'reporting').length} icon={FileText} color="purple" />
        <StatCard title="Selesai" value={data.items.filter((i:any) => i.status === 'completed').length} icon={CheckCircle} color="emerald" />
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[2rem] shadow-2xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
        {/* Table Header / Filter */}
        <div className="p-6 border-b bg-emerald-50/10 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              placeholder="Cari tracking code, no. penawaran, atau klien..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-11 h-12 focus-visible:ring-emerald-500 rounded-2xl border-slate-200 bg-white"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48 h-12 rounded-2xl border-slate-200 bg-white font-bold text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3" />
                  <SelectValue placeholder="Filter Status" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-200">
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium cursor-pointer">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 border-none">
              <TableHead className="px-6 py-4 font-black text-emerald-900 uppercase text-[10px] tracking-widest">Job Info</TableHead>
              <TableHead className="px-4 py-4 font-black text-emerald-900 uppercase text-[10px] tracking-widest">Klien / Perusahaan</TableHead>
              <TableHead className="px-4 py-4 font-black text-emerald-900 uppercase text-[10px] tracking-widest">Layanan Utama</TableHead>
              <TableHead className="px-4 py-4 font-black text-emerald-900 uppercase text-[10px] tracking-widest">Status & Progres</TableHead>
              <TableHead className="px-6 py-4 font-black text-emerald-900 uppercase text-[10px] tracking-widest text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-slate-100">
                  <TableCell colSpan={5} className="py-8 px-6">
                    <div className="h-12 bg-slate-50 animate-pulse rounded-2xl" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-24">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Briefcase className="h-10 w-10 text-emerald-200" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-700">Tidak ada data pekerjaan</p>
                      <p className="text-sm text-slate-400">Silakan sesuaikan pencarian atau filter Anda.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item: any) => {
                const statusInfo = getStatusInfo(item.status);
                const progress = getProgressPercentage(item.status);
                
                return (
                  <TableRow key={item.id} className="group hover:bg-emerald-50/5 transition-all border-slate-100">
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            {item.tracking_code}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {item.quotation.quotation_number}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-800">{item.quotation.profile.full_name}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                          {item.quotation.profile.company_name || "Personal"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                          <FlaskConical className="h-4 w-4 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 line-clamp-1">
                          {item.quotation.items[0]?.service?.name || "Multiple Services"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="space-y-2 min-w-[180px]">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className={cn("text-[9px] font-black border-2 py-0 px-2", statusInfo.color)}>
                            {statusInfo.label.toUpperCase()}
                          </Badge>
                          <span className="text-[10px] font-black text-slate-400">{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-500",
                              progress === 100 ? "bg-emerald-500" : "bg-emerald-600"
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center px-6">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/admin/quotations/${item.quotation_id}`}>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-emerald-600 hover:bg-emerald-100 transition-all active:scale-90" title="Lihat Detail Penawaran">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </Link>
                        {item.sampling_assignment && (
                          <Link href={`/admin/sampling/${item.sampling_assignment.id}`}>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-amber-600 hover:bg-amber-100 transition-all active:scale-90" title="Lihat Penugasan Sampling">
                              <MapPin className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Footer info */}
        <div className="p-6 bg-slate-50/50 border-t flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total {data.total} Jobs Found</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 rounded-xl border-slate-200 hover:bg-emerald-50 text-emerald-600"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="h-9 px-4 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-xs font-black text-emerald-900">
              {page} / {data.pages}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 rounded-xl border-slate-200 hover:bg-emerald-50 text-emerald-600"
              disabled={page === data.pages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
