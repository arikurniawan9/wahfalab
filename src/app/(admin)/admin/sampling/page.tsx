"use client";

import React, { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  User,
  FileText,
  Eye
} from "lucide-react";
import { ChemicalLoader } from "@/components/ui";
import { getAllSamplingAssignments } from "@/lib/actions/sampling";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export default function SamplingAssignmentListPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getAllSamplingAssignments(page, limit, search);
      setData(result);
    } catch (error) {
      toast.error("Gagal memuat data assignment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, limit, search]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-slate-100 text-slate-700 border-slate-200";
      case "in_progress": return "bg-blue-100 text-blue-700 border-blue-200";
      case "completed": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "cancelled": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Penugasan Sampling</h1>
          <p className="text-slate-500 text-sm">Kelola penugasan pengambilan sampel di lapangan.</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Link href="/admin/sampling/create">
            <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 cursor-pointer">
              <Plus className="mr-2 h-4 w-4" /> Buat Penugasan
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden transition-all duration-300">
        <div className="p-5 border-b bg-emerald-50/10 flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input
              placeholder="Cari lokasi, petugas, atau tracking code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 focus-visible:ring-emerald-500 rounded-xl"
            />
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-bold text-emerald-900 px-4">Tracking Code</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Pelanggan</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Petugas Lapangan</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Lokasi</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Tanggal Rencana</TableHead>
                <TableHead className="font-bold text-emerald-900 px-4">Status</TableHead>
                <TableHead className="text-center font-bold text-emerald-900 px-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <div className="flex justify-center">
                      <ChemicalLoader />
                    </div>
                    <p className="mt-4 text-sm text-slate-500">Memuat data...</p>
                  </TableCell>
                </TableRow>
              ) : data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20 text-slate-500">
                    Belum ada penugasan sampling.
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-emerald-50/10 transition-colors">
                    <TableCell className="font-medium text-slate-800 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-600" />
                        {item.job_order.tracking_code}
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{item.job_order.quotation.profile.full_name}</span>
                        <span className="text-xs text-slate-400">{item.job_order.quotation.profile.company_name || "Personal"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700">{item.field_officer.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700 max-w-xs truncate">{item.location}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700 text-sm">
                          {new Date(item.scheduled_date).toLocaleDateString("id-ID", {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge variant="outline" className={getStatusColor(item.status)}>
                        {item.status === 'in_progress' ? 'SEDANG BERLANGSUNG' : 
                         item.status === 'completed' ? 'SELESAI' :
                         item.status === 'cancelled' ? 'DIBATALKAN' : 'PENDING'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center px-6">
                      <Link href={`/admin/sampling/${item.id}`}>
                        <Button variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50 cursor-pointer">
                          <Eye className="h-4 w-4 mr-1" />
                          Detail
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-10 text-center flex flex-col items-center justify-center">
              <div className="flex justify-center mb-4">
                <ChemicalLoader />
              </div>
            </div>
          ) : data.items.length === 0 ? (
            <div className="p-10 text-center text-slate-500">Belum ada penugasan sampling.</div>
          ) : (
            data.items.map((item: any) => (
              <div key={item.id} className="p-4 space-y-3 bg-white active:bg-slate-50">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-600" />
                      <h4 className="font-bold text-slate-900">{item.job_order.tracking_code}</h4>
                    </div>
                    <p className="text-sm text-slate-700">{item.job_order.quotation.profile.full_name}</p>
                    <p className="text-xs text-slate-400">{item.job_order.quotation.profile.company_name || "Personal"}</p>
                  </div>
                  <Badge variant="outline" className={getStatusColor(item.status)}>
                    {item.status === 'in_progress' ? 'SEDANG BERLANGSUNG' : 
                     item.status === 'completed' ? 'SELESAI' :
                     item.status === 'cancelled' ? 'DIBATALKAN' : 'PENDING'}
                  </Badge>
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-700">{item.field_officer.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-700">{item.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-700">
                      {new Date(item.scheduled_date).toLocaleDateString("id-ID", {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  <Link href={`/admin/sampling/${item.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full text-emerald-600 hover:bg-emerald-50 cursor-pointer">
                      <Eye className="h-4 w-4 mr-1" />
                      Detail
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-500 font-medium">
              Total {data.total} penugasan
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Tampil:</span>
              <Select value={limit.toString()} onValueChange={(val) => {
                setLimit(parseInt(val));
                setPage(1);
              }}>
                <SelectTrigger className="h-8 w-[70px] bg-white text-xs cursor-pointer">
                  <SelectValue placeholder={limit.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10" className="cursor-pointer">10</SelectItem>
                  <SelectItem value="30" className="cursor-pointer">30</SelectItem>
                  <SelectItem value="50" className="cursor-pointer">50</SelectItem>
                  <SelectItem value="100" className="cursor-pointer">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg cursor-pointer"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center px-4 text-xs font-bold bg-white border border-slate-200 rounded-lg shadow-sm">
              {page} / {data.pages}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg cursor-pointer"
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
