"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  FileText,
  Search,
  Download,
  Send,
  CreditCard,
  Calendar,
  Building,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import Link from "next/link";
import { getAllInvoices, getInvoiceStats } from "@/lib/actions/invoice";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  sent: "bg-blue-100 text-blue-700 border-blue-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  overdue: "bg-amber-100 text-amber-700 border-amber-200"
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Terkirim",
  paid: "Lunas",
  cancelled: "Dibatalkan",
  overdue: "Jatuh Tempo"
};

export default function InvoicesPage() {
  const router = useRouter();
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [stats, setStats] = useState<any>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    loadStats();
  }, [page, statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const result = await getAllInvoices(
        page,
        limit,
        statusFilter === "all" ? undefined : statusFilter,
        search || undefined
      );
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setData(result);
    } catch (error) {
      console.error('Load invoices error:', error);
      toast.error("Gagal memuat invoice");
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const result = await getInvoiceStats();
      if (!result.error) {
        setStats(result);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  }

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-emerald-900 font-[family-name:var(--font-montserrat)] uppercase flex items-center gap-3">
          <FileText className="h-6 w-6 text-emerald-600" />
          Daftar Invoice
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola dan monitor semua invoice pembayaran
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-800">{stats.total || 0}</p>
            <p className="text-xs text-slate-500">Semua invoice</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">
              Draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-slate-700">{stats.draft || 0}</p>
            <p className="text-xs text-slate-500">Belum dikirim</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">
              Terkirim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{stats.sent || 0}</p>
            <p className="text-xs text-slate-500">Menunggu pembayaran</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">
              Lunas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{stats.paid || 0}</p>
            <p className="text-xs text-slate-500">
              {formatCurrency(stats.paidAmount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600">
              Jatuh Tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{stats.overdue || 0}</p>
            <p className="text-xs text-slate-500">Perlu ditindaklanjuti</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4 text-emerald-600" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nomor invoice, tracking code, atau customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Terkirim</SelectItem>
                <SelectItem value="paid">Lunas</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700">
              Cari
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Semua Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-slate-500 text-sm mt-3">Memuat invoice...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left py-3 px-4 text-sm font-bold text-emerald-900">Invoice</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-emerald-900">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-emerald-900">Job Order</th>
                    <th className="text-right py-3 px-4 text-sm font-bold text-emerald-900">Jumlah</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-emerald-900">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-emerald-900">Jatuh Tempo</th>
                    <th className="text-center py-3 px-4 text-sm font-bold text-emerald-900">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-20">
                        <div className="flex flex-col items-center gap-4">
                          <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
                            <FileText className="h-10 w-10 text-slate-300" />
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold text-slate-700">Belum ada invoice</p>
                            <p className="text-sm text-slate-500 mt-1">
                              Invoice akan dibuat otomatis setelah sampling selesai
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.items?.map((item: any) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-slate-400" />
                            <span className="font-mono text-sm font-medium text-slate-800">
                              {item.invoice_number}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-800">
                              {item.job_order?.quotation?.profile?.full_name || '-'}
                            </span>
                            {item.job_order?.quotation?.profile?.company_name && (
                              <span className="text-xs text-slate-500">
                                {item.job_order.quotation.profile.company_name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/finance/jobs/${item.job_order?.id}`}
                            className="text-emerald-600 hover:underline text-sm font-mono"
                          >
                            {item.job_order?.tracking_code || '-'}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm font-bold text-emerald-700">
                            {formatCurrency(Number(item.amount))}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={cn(
                            "text-[10px] font-bold uppercase",
                            statusColors[item.status] || statusColors.draft
                          )}>
                            {statusLabels[item.status] || item.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span className="text-sm text-slate-600">
                              {formatDate(item.due_date)}
                            </span>
                            {new Date(item.due_date) < new Date() && item.status !== 'paid' && (
                              <Clock className="h-3 w-3 text-amber-600" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link href={`/finance/invoices/${item.id}`}>
                              <Button size="sm" variant="outline" className="h-8 text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                Detail
                              </Button>
                            </Link>
                            {item.status !== 'paid' && item.status !== 'cancelled' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                                title="Kirim ke Customer"
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Sebelumnya
              </Button>
              <span className="text-sm text-slate-600">
                Halaman {page} dari {data.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
              >
                Berikutnya
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
