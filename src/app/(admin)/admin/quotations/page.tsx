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
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  MoreVertical,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  DollarSign,
  Copy,
  Clock,
  FileSpreadsheet,
  UserPlus,
  Lock,
  Building2,
  Mail,
  User,
  MapPin,
  Calendar,
  Layers,
  RotateCcw,
  Send
 } from "lucide-react";
import { LoadingOverlay, LoadingButton, LazyPDFButton } from "@/components/ui";
import { TableSkeleton } from "@/components/ui/skeleton";
import { 
  getQuotations, 
  deleteQuotation, 
  createQuotation, 
  deleteManyQuotations, 
  getNextInvoiceNumber,
  cloneQuotation,
  updateQuotationStatus,
  getQuotationById,
  publishInvoiceRequest,
  sendQuotationToReportingDirect
} from "@/lib/actions/quotation";
import { getClients, createOrUpdateUser } from "@/lib/actions/users";
import { getAllServices } from "@/lib/actions/services";
import { getAllOperationalCatalogs } from "@/lib/actions/operational-catalog";
import { getAllEquipment } from "@/lib/actions/equipment";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { QuotationForm } from "@/components/admin/quotations/QuotationForm";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as XLSX from 'xlsx';

// Stat Card Component
function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    red: "bg-red-50 text-red-600 border-red-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
  };

  return (
    <Card className={cn("border-none shadow-sm rounded-xl", colors[color])}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-white shadow-sm shrink-0")}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase opacity-60 tracking-wider truncate">{title}</p>
          <p className="text-lg font-black tracking-tight leading-none">{value || 0}</p>
        </div>
      </CardContent>
    </Card>
  );
}

import { useRouter } from "next/navigation";

export default function QuotationListPage() {
  const router = useRouter();
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1, statusCounts: {} });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [publishingInvoice, setPublishingInvoice] = useState(false);
  const [sendingToReportingId, setSendingToReportingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmInvoiceQuotationId, setConfirmInvoiceQuotationId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const qResult = await getQuotations({ 
        page, 
        limit, 
        search, 
        status: filterStatus === "all" ? undefined : filterStatus,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined
      });
      
      setData(qResult);
      setSelectedIds([]);
    } catch (error: any) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filterStatus, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportExcel = () => {
    if (data.items.length === 0) return toast.error("Tidak ada data untuk di-export");
    
    const quotationStatusLabels: Record<string, string> = {
      draft: "Draft",
      accepted: "Diterima",
      rejected: "Ditolak",
      paid: "Lunas",
    };

    const excelData = data.items.map((i: any) => ({
      "No. Penawaran": i.quotation_number,
      "Tanggal": new Date(i.created_at).toLocaleDateString('id-ID'),
      "Nama Klien": i.profile.full_name,
      "Perusahaan": i.profile.company_name || "PERORANGAN",
      "Subtotal": i.subtotal,
      "Diskon": i.discount_amount,
      "Pajak": i.tax_amount,
      "Total Tagihan": i.total_amount,
      "Status": quotationStatusLabels[i.status] || i.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Quotations");
    XLSX.writeFile(workbook, `WahfaLab_Penawaran_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Excel berhasil diunduh");
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      if (deleteId === "bulk") await deleteManyQuotations(selectedIds);
      else await deleteQuotation(deleteId);
      loadData();
      toast.success("Data dihapus");
      setDeleteId(null);
    } catch (error: any) {
      toast.error("Gagal menghapus");
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelectAll = () => setSelectedIds(selectedIds.length === data.items.length ? [] : data.items.map((i: any) => i.id));
  const toggleSelect = (id: string) => setSelectedIds(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateQuotationStatus(id, status);
      toast.success("Status diperbarui");
      loadData();
    } catch (error) { toast.error("Gagal update"); }
  };

  const handlePublishInvoiceRequest = async (quotationId: string) => {
    try {
      setPublishingInvoice(true);
      const result = await publishInvoiceRequest(quotationId);
      if (result.error) throw new Error(result.error);
      toast.success(result.invoiceCreated ? "Invoice draft tersedia untuk finance" : "Permintaan invoice dikirim ke finance");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Gagal menerbitkan permintaan invoice");
    } finally {
      setPublishingInvoice(false);
      setConfirmInvoiceQuotationId(null);
    }
  };

  const handleSendDirectToReporting = async (quotationId: string) => {
    try {
      setSendingToReportingId(quotationId);
      const result = await sendQuotationToReportingDirect(quotationId);
      if ((result as any)?.error) {
        throw new Error((result as any).error);
      }
      toast.success((result as any)?.alreadySent ? "Penawaran sudah pernah dikirim ke reporting direct" : "Penawaran dikirim ke reporting direct");
      loadData();
    } catch (error: any) {
      toast.error(error?.message || "Gagal mengirim ke reporting");
    } finally {
      setSendingToReportingId(null);
    }
  };

  const statusCounts = data.statusCounts || {};
  const quotationStatusLabels: Record<string, string> = {
    draft: "Draft",
    accepted: "Diterima",
    rejected: "Ditolak",
    paid: "Lunas",
  };
  const statusTabs = [
    { value: "all", label: "Semua" },
    { value: "draft", label: quotationStatusLabels.draft },
    { value: "accepted", label: quotationStatusLabels.accepted },
    { value: "rejected", label: quotationStatusLabels.rejected },
    { value: "paid", label: quotationStatusLabels.paid },
  ];

  return (
    <div className="px-4 md:px-10 pt-2 md:pt-4 pb-24 md:pb-10 bg-slate-50/30 min-h-screen">
      {/* Compact Header Section */}
      <div className="mb-6 overflow-hidden rounded-3xl bg-emerald-900 shadow-xl border border-emerald-700/50 text-left">
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-500 p-4 md:p-5 text-white relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-400/20 rounded-full blur-[60px]" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner shrink-0">
                <FileText className="h-5 w-5 text-emerald-200" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-black tracking-tight text-white leading-none">Penawaran Harga</h1>
                <p className="text-emerald-100/60 text-[10px] md:text-xs font-medium mt-1">Manajemen dokumen penawaran klien laboratorium.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 hover:bg-white/20 text-white rounded-xl h-9 px-4 backdrop-blur-md transition-all text-xs font-bold" onClick={() => loadData()}>
                <RotateCcw className={cn("h-3.5 w-3.5 mr-2", loading && "animate-spin")} /> Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        <StatCard title="Total Penawaran" value={statusCounts.total} icon={Layers} color="emerald" />
        <StatCard title="Draft" value={statusCounts.draft} icon={Clock} color="amber" />
        <StatCard title="Diterima" value={statusCounts.accepted} icon={CheckCircle} color="blue" />
        <StatCard title="Ditolak" value={statusCounts.rejected} icon={XCircle} color="red" />
        <StatCard title="Lunas" value={statusCounts.paid} icon={DollarSign} color="purple" />
      </div>

      {/* Modern Status Tabs */}
      <div className="mb-6 flex flex-col gap-4">
         <Tabs value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setPage(1); }} className="w-full">
            <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <TabsList className="inline-flex min-w-max flex-nowrap bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner h-auto gap-1">
                 {statusTabs.map((status) => (
                    <TabsTrigger 
                      key={status.value}
                      value={status.value} 
                      style={{ backgroundColor: filterStatus === status.value ? "#059669" : "transparent", color: filterStatus === status.value ? "white" : undefined }}
                      className={cn(
                        "min-h-10 min-w-[92px] rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border border-transparent",
                        filterStatus === status.value ? "shadow-lg shadow-emerald-900/20" : "text-slate-500 hover:text-emerald-600"
                      )}
                    >
                      {status.label}
                    </TabsTrigger>
                 ))}
              </TabsList>
            </div>
         </Tabs>

      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-5 border-b flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between bg-white text-left">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Cari penawaran..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-11 h-12 bg-slate-50 border-none rounded-2xl text-xs font-bold" />
          </div>
          <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row xl:items-center xl:justify-end">
            <div className="flex items-center gap-2 bg-slate-50 px-4 h-12 rounded-2xl border border-slate-100 shrink-0 xl:h-11 xl:px-3.5 xl:rounded-xl">
              <Calendar className="h-4 w-4 text-emerald-500 shrink-0" />
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="h-8 w-full min-w-0 border-none bg-transparent text-[10px] font-black p-0 focus-visible:ring-0 xl:w-28" />
              <span className="text-[10px] font-black text-slate-300 mx-1 shrink-0">s/d</span>
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="h-8 w-full min-w-0 border-none bg-transparent text-[10px] font-black p-0 focus-visible:ring-0 xl:w-28" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 xl:flex xl:items-center">
              {selectedIds.length > 0 && (
                <Button variant="destructive" onClick={() => setDeleteId("bulk")} className="h-12 w-full px-6 rounded-2xl font-black text-[10px] uppercase gap-2 xl:h-11 xl:w-auto xl:px-4 xl:rounded-xl xl:text-[9px]"><Trash2 className="h-4 w-4" /> Hapus {selectedIds.length}</Button>
              )}
              <Button onClick={handleExportExcel} variant="outline" className="h-12 w-full px-5 rounded-2xl bg-white border-slate-200 text-emerald-700 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 transition-all gap-2 shadow-sm xl:h-11 xl:w-auto xl:px-4 xl:rounded-xl xl:text-[9px]">
                <FileSpreadsheet className="h-4 w-4" /> Excel
              </Button>
              <Button onClick={() => router.push("/admin/quotations/create")} title="Buat Baru" aria-label="Buat penawaran baru" className="h-12 w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/10 transition-all active:scale-95 xl:h-11 xl:w-11 xl:px-0 xl:rounded-xl">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100">
                <TableHead className="w-12 pl-6"><Checkbox checked={data.items.length > 0 && selectedIds.length === data.items.length} onCheckedChange={toggleSelectAll} /></TableHead>
                <TableHead className="px-4 py-5 font-black uppercase tracking-widest text-[9px] text-slate-400 text-left">Penawaran</TableHead>
                <TableHead className="px-4 py-5 font-black uppercase tracking-widest text-[9px] text-slate-400 text-left">Informasi Klien</TableHead>
                <TableHead className="px-4 py-5 font-black uppercase tracking-widest text-[9px] text-slate-400 text-right">Total</TableHead>
                <TableHead className="px-4 py-5 font-black uppercase tracking-widest text-[9px] text-slate-400 text-center">Status</TableHead>
                <TableHead className="px-6 py-5 font-black uppercase tracking-widest text-[9px] text-slate-400 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="p-0"><TableSkeleton rows={limit} className="p-8" /></TableCell></TableRow>
              ) : data.items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-24"><Layers className="h-16 w-16 text-slate-100 mx-auto mb-4" /><p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Data tidak ditemukan</p></TableCell></TableRow>
              ) : (
                data.items.map((item: any) => {
                  const latestJobOrder = item.job_orders?.[0];
                  const invoiceRequested = !!latestJobOrder?.notes?.includes("[INVOICE_REQUESTED]");
                  const hasInvoice = !!latestJobOrder?.invoice;
                  const directReportingSent = !!latestJobOrder?.notes?.includes("[DIRECT_REPORTING_ONLY]");
                  return (
                  <TableRow key={item.id} className="hover:bg-emerald-50/30 transition-all border-b border-slate-50 group">
                    <TableCell className="pl-6"><Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} /></TableCell>
                    <TableCell className="px-4 text-left">
                       <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900">{item.quotation_number}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                       </div>
                    </TableCell>
                    <TableCell className="px-4 text-left">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-700 uppercase text-[11px] leading-none">{item.profile.full_name}</span>
                        <span className="text-[9px] font-bold text-emerald-600 uppercase mt-1 tracking-widest">{item.profile.company_name || "PERORANGAN"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-4 font-black text-slate-900 text-xs italic">Rp {Number(item.total_amount).toLocaleString("id-ID")}</TableCell>
                    <TableCell className="px-4 text-center">
                      <Badge variant="outline" className={cn("text-[9px] font-black tracking-widest px-3 py-1 rounded-lg uppercase shadow-sm", 
                        item.status === 'draft' ? "bg-amber-50 text-amber-600 border-amber-200" : 
                        item.status === 'accepted' ? "bg-blue-50 text-blue-600 border-blue-200" : 
                        item.status === 'rejected' ? "bg-rose-50 text-rose-600 border-rose-200" :
                        "bg-emerald-50 text-emerald-600 border-emerald-200")}>
                        {quotationStatusLabels[item.status] || item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center px-6">
                      <div className="flex justify-center gap-2">
                             {item.status === 'accepted' && latestJobOrder && !hasInvoice && (
                            <Button
                              onClick={() => setConfirmInvoiceQuotationId(item.id)}
                             disabled={invoiceRequested || publishingInvoice}
                             variant={invoiceRequested ? "outline" : "default"}
                             className={cn(
                                "h-9 rounded-xl px-3 text-[9px] font-black uppercase tracking-widest",
                               invoiceRequested
                                 ? "border-slate-200 bg-slate-100 text-slate-500"
                                 : "bg-blue-600 hover:bg-blue-700 text-white"
                             )}
                           >
                             <Send className="h-3.5 w-3.5 mr-1.5" />
                              {invoiceRequested ? "Terkirim" : "Invoice"}
                            </Button>
                          )}
                          {item.status === 'accepted' && (
                            <Button
                              onClick={() => handleSendDirectToReporting(item.id)}
                              disabled={sendingToReportingId === item.id || directReportingSent}
                              className={cn(
                                "h-9 rounded-xl px-3 text-[9px] font-black uppercase tracking-widest",
                                directReportingSent
                                  ? "border-slate-200 bg-slate-100 text-slate-500"
                                  : "bg-violet-600 hover:bg-violet-700 text-white"
                              )}
                            >
                              <Send className="h-3.5 w-3.5 mr-1.5" />
                              {sendingToReportingId === item.id ? "Mengirim..." : directReportingSent ? "Direct Terkirim" : "Direct LHU"}
                            </Button>
                          )}
                          <Link href={`/admin/quotations/${item.id}`}><Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 hover:bg-emerald-600 hover:text-white"><Eye className="h-4 w-4" /></Button></Link>
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 hover:text-emerald-600"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-100 shadow-2xl z-[100]">
                             <DropdownMenuItem onClick={() => router.push(`/admin/quotations/${item.id}/edit`)} className="rounded-xl p-3 text-[10px] font-black uppercase"><FileText className="mr-2 h-4 w-4" /> Edit Data</DropdownMenuItem>
                              {item.status !== 'accepted' && (
                                <DropdownMenuItem onClick={() => handleStatusUpdate(item.id, 'accepted')} className="rounded-xl p-3 text-[10px] font-black uppercase text-emerald-600"><CheckCircle className="mr-2 h-4 w-4" /> Terima</DropdownMenuItem>
                              )}
                            {item.status === 'accepted' && latestJobOrder && !hasInvoice && (
                              <DropdownMenuItem onClick={() => setConfirmInvoiceQuotationId(item.id)} disabled={invoiceRequested || publishingInvoice} className="rounded-xl p-3 text-[10px] font-black uppercase text-blue-600 disabled:text-slate-400">
                                <Send className="mr-2 h-4 w-4" /> {invoiceRequested ? 'Permintaan Terkirim' : 'Terbitkan Invoice'}
                              </DropdownMenuItem>
                            )}
                            {item.status === 'accepted' && (
                              <DropdownMenuItem
                                onClick={() => handleSendDirectToReporting(item.id)}
                                disabled={sendingToReportingId === item.id || directReportingSent}
                                className="rounded-xl p-3 text-[10px] font-black uppercase text-violet-700 disabled:text-slate-400"
                              >
                                <Send className="mr-2 h-4 w-4" />
                                {sendingToReportingId === item.id ? "Mengirim..." : directReportingSent ? "Direct Sudah Terkirim" : "Kirim Direct LHU"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setDeleteId(item.id)} className="rounded-xl p-3 text-[10px] font-black uppercase text-rose-600"> <Trash2 className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )})
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-6 border-t flex items-center justify-between bg-slate-50/50">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total {data.total} Penawaran</p>
          <div className="flex gap-3">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-2xl bg-white border-slate-200" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="flex items-center px-6 h-10 text-[10px] font-black bg-white border border-slate-200 rounded-2xl text-emerald-950 tracking-widest">{page} / {data.pages}</div>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-2xl bg-white border-slate-200" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-10 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase text-center">Hapus Data?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-500 text-sm py-4">Data yang dihapus tidak dapat dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-4">
            <AlertDialogCancel className="rounded-2xl h-14 flex-1 font-black text-slate-400 uppercase text-[10px]">Batal</AlertDialogCancel>
            <Button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 rounded-2xl h-14 flex-1 font-black text-white uppercase text-[10px]">Ya, Hapus</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmInvoiceQuotationId !== null} onOpenChange={(open) => !open && setConfirmInvoiceQuotationId(null)}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-10 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase text-center">Terbitkan Permintaan Invoice?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-500 text-sm py-4">
              Permintaan ini akan dikirim ke finance. Invoice draft akan tersedia setelah sampling selesai.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-4">
            <AlertDialogCancel className="rounded-2xl h-14 flex-1 font-black text-slate-400 uppercase text-[10px]">Batal</AlertDialogCancel>
            <Button
              onClick={() => confirmInvoiceQuotationId && handlePublishInvoiceRequest(confirmInvoiceQuotationId)}
              disabled={publishingInvoice}
              className="bg-blue-600 hover:bg-blue-700 rounded-2xl h-14 flex-1 font-black text-white uppercase text-[10px]"
            >
              {publishingInvoice ? "Memproses..." : "Terbitkan"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LoadingOverlay isOpen={deleting} title="Menghapus Data..." />
    </div>
  );
}
