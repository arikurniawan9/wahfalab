"use client";

import React, { useState, useEffect } from "react";
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
  Send,
  CreditCard,
  Calendar,
  Clock,
  BellRing,
  ArrowRight,
  RotateCcw
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getAllInvoices, getInvoiceStats, getPendingInvoiceRequests, sendInvoiceToCustomer } from "@/lib/actions/invoice";
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
  const pathname = usePathname();
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [pendingRequests, setPendingRequests] = useState<any>({ items: [], total: 0, pages: 1 });
  const [stats, setStats] = useState<any>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  const baseInvoicePath = pathname.startsWith('/admin/')
    ? '/admin/finance/invoices'
    : '/finance/invoices';

  useEffect(() => {
    loadData();
    loadPendingRequests();
    loadStats();
  }, [page, statusFilter]);

  async function loadData(pageOverride?: number) {
    setLoading(true);
    try {
      const result = await getAllInvoices(
        pageOverride ?? page,
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

  async function loadPendingRequests(pageOverride?: number) {
    try {
      const result = await getPendingInvoiceRequests(pageOverride ?? page, limit, search || undefined);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setPendingRequests(result);
    } catch (error) {
      console.error('Load pending invoice requests error:', error);
      toast.error("Gagal memuat permintaan invoice");
    }
  }

  const handleSearch = () => {
    setPage(1);
    loadData(1);
    loadPendingRequests(1);
  };

  const handleRefreshAll = async () => {
    await Promise.all([loadData(), loadPendingRequests(), loadStats()]);
  };

  const handleSendInvoice = async (item: any) => {
    try {
      setSendingInvoiceId(item.id);
      const customerEmail = item.job_order?.quotation?.profile?.email;
      if (!customerEmail) {
        throw new Error("Email customer belum tersedia");
      }

      const result = await sendInvoiceToCustomer(item.id, customerEmail);
      if (result.error) throw new Error(result.error);

      toast.success("Invoice berhasil diterbitkan ke customer");
      await loadData();
      await loadStats();
    } catch (error: any) {
      toast.error(error.message || "Gagal menerbitkan invoice");
    } finally {
      setSendingInvoiceId(null);
    }
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

  const getRequestMeta = (notes?: string | null) => {
    const line = notes?.split('\n').find((entry) => entry.includes('[INVOICE_REQUESTED]'));
    if (!line) return null;

    const requesterMatch = line.match(/by=(.+?) at=/);
    const requestedAtMatch = line.match(/at=(.+)$/);

    return {
      requestedBy: requesterMatch?.[1] || '-',
      requestedAt: requestedAtMatch?.[1] || null
    };
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="overflow-hidden rounded-3xl bg-emerald-900 shadow-xl border border-emerald-700/50">
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-500 p-4 md:p-5 text-white relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-[60px]" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                <FileText className="h-5 w-5 text-emerald-200" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-black tracking-tight text-white leading-none uppercase">
                  Daftar Invoice
                </h1>
                <p className="text-emerald-100/60 text-[10px] md:text-xs font-medium mt-1 uppercase tracking-widest">
                  Kelola dan monitor semua invoice pembayaran.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="hidden lg:block text-right border-r border-white/10 pr-4">
                <p className="text-emerald-300 text-[8px] font-bold uppercase tracking-widest mb-0.5">Total Invoice</p>
                <p className="text-lg font-black text-white leading-none">
                  {stats.total || 0} <span className="text-emerald-300 text-[10px] font-bold uppercase tracking-normal">Item</span>
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshAll}
                className="h-8 px-3 rounded-lg bg-white/10 border-white/20 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest"
              >
                <RotateCcw className={cn("mr-1.5 h-3.5 w-3.5", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
      <Card>
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

      <Card className="border-amber-200 bg-amber-50/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-amber-900">
            <BellRing className="h-4 w-4 text-amber-600" />
            Permintaan Invoice Masuk
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.items?.length === 0 ? (
            <div className="rounded-lg border border-dashed border-amber-200 bg-white/70 px-4 py-8 text-center">
              <p className="text-sm font-medium text-slate-700">Belum ada permintaan invoice yang menunggu.</p>
              <p className="mt-1 text-xs text-slate-500">
                Permintaan dari admin atau operator akan muncul di sini sebelum invoice draft dibuat.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.items.map((item: any) => {
                const requestMeta = getRequestMeta(item.notes);
                const customerName = item.quotation?.profile?.company_name || item.quotation?.profile?.full_name || "-";
                const readyToIssue = ['analysis_ready', 'analysis', 'analysis_done', 'reporting', 'completed', 'pending_payment', 'paid'].includes(item.status);

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 uppercase text-[10px] font-bold">
                          Permintaan Baru
                        </Badge>
                        <span className="font-mono text-xs text-slate-500">
                          {item.quotation?.quotation_number || "-"}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">{customerName}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>Job: {item.tracking_code}</span>
                        <span>Progress: {item.status}</span>
                        <span>Diminta oleh: {requestMeta?.requestedBy || "-"}</span>
                        <span>
                          Waktu: {requestMeta?.requestedAt ? formatDate(requestMeta.requestedAt) : "-"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        "border text-[10px] font-bold uppercase",
                        readyToIssue
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-600"
                      )}>
                        {readyToIssue ? "Siap Buat Draft" : "Menunggu Sampling Selesai"}
                      </Badge>
                      <div className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                        Ditampilkan setelah draft invoice dibuat
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
            <>
              {data.items?.length === 0 ? (
                <div className="text-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
                      <FileText className="h-10 w-10 text-slate-300" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-slate-700">Belum ada invoice</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Invoice draft akan muncul di sini setelah permintaan invoice diterbitkan dan progres sampling selesai
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="md:hidden divide-y divide-slate-100">
                    {data.items?.map((item: any) => (
                      <div key={item.id} className="py-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-mono text-xs font-bold text-slate-700">{item.invoice_number}</p>
                            <p className="text-sm font-semibold text-slate-800 mt-1">
                              {item.job_order?.quotation?.profile?.full_name || '-'}
                            </p>
                            {item.job_order?.quotation?.profile?.company_name && (
                              <p className="text-xs text-slate-500">
                                {item.job_order.quotation.profile.company_name}
                              </p>
                            )}
                          </div>
                          <Badge className={cn(
                            "text-[10px] font-bold uppercase",
                            statusColors[item.status] || statusColors.draft
                          )}>
                            {statusLabels[item.status] || item.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-slate-400 uppercase font-bold tracking-wide">Job Order</p>
                            <Link href={`${baseInvoicePath}/${item.id}`} className="text-emerald-600 font-mono hover:underline">
                              {item.job_order?.tracking_code || '-'}
                            </Link>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-400 uppercase font-bold tracking-wide">Jumlah</p>
                            <p className="font-bold text-emerald-700">{formatCurrency(Number(item.amount))}</p>
                          </div>
                          <div className="col-span-2 flex items-center gap-2 text-slate-600">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span>{formatDate(item.due_date)}</span>
                            {new Date(item.due_date) < new Date() && item.status !== 'paid' && (
                              <Clock className="h-3 w-3 text-amber-600" />
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link href={`${baseInvoicePath}/${item.id}`} className="flex-1">
                            <Button size="sm" variant="outline" className="h-8 text-xs w-full">
                              <FileText className="h-3 w-3 mr-1" />
                              Detail
                            </Button>
                          </Link>
                          {item.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => handleSendInvoice(item)}
                              disabled={sendingInvoiceId === item.id}
                              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                              title="Terbitkan Invoice"
                            >
                              <Send className="h-3 w-3 mr-1" />
                              {sendingInvoiceId === item.id ? 'Mengirim...' : 'Terbitkan'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block overflow-x-auto">
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
                        {data.items?.map((item: any) => (
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
                                href={`${baseInvoicePath}/${item.id}`}
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
                                <Link href={`${baseInvoicePath}/${item.id}`}>
                                  <Button size="sm" variant="outline" className="h-8 text-xs">
                                    <FileText className="h-3 w-3 mr-1" />
                                    Detail
                                  </Button>
                                </Link>
                                {item.status === 'draft' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleSendInvoice(item)}
                                    disabled={sendingInvoiceId === item.id}
                                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                                    title="Terbitkan Invoice"
                                  >
                                    <Send className="h-3 w-3 mr-1" />
                                    {sendingInvoiceId === item.id ? 'Mengirim...' : 'Terbitkan'}
                                  </Button>
                                )}
                                {item.status !== 'paid' && item.status !== 'cancelled' && item.status !== 'draft' && (
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
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
