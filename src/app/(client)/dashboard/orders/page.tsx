// ============================================================================
// CLIENT ORDERS & INVOICES PAGE - v3.0 (Super Experience)
// Riwayat pesanan lengkap dengan akses cepat ke Invoice dan Sertifikat.
// ============================================================================

"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  CheckCircle,
  Clock,
  FlaskConical,
  MapPin,
  ClipboardCheck,
  FileText,
  FileCheck,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  DollarSign,
  X,
  CreditCard,
  ShieldCheck,
  Receipt,
  ExternalLink,
  Beaker,
  Truck,
  Activity,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { getJobOrders } from "@/lib/actions/jobs";
import { getProfile } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ChemicalLoader, LoadingOverlay } from "@/components/ui";
import { pdf } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/pdf/InvoicePDF";

const statusColors: Record<string, string> = {
  scheduled: 'bg-amber-50 text-amber-600 border-amber-100',
  sampling: 'bg-blue-50 text-blue-600 border-blue-100',
  analysis_ready: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  analysis: 'bg-purple-50 text-purple-600 border-purple-100',
  reporting: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  completed: 'bg-emerald-50 text-emerald-600 border-emerald-100'
};

const statusLabels: Record<string, string> = {
  scheduled: 'Antrean',
  sampling: 'Sampling',
  analysis_ready: 'Diterima Lab',
  analysis: 'Analisis Lab',
  reporting: 'Pelaporan',
  completed: 'Selesai'
};

const steps = [
  { id: 'scheduled', label: 'Antrean', icon: Clock },
  { id: 'sampling', label: 'Sampling', icon: Truck },
  { id: 'analysis_ready', label: 'BAST', icon: ClipboardCheck },
  { id: 'analysis', label: 'Lab', icon: Beaker },
  { id: 'reporting', label: 'Laporan', icon: FileText },
  { id: 'completed', label: 'Selesai', icon: FileCheck }
];

export default function ClientOrdersPage() {
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const supabase = createClient();

  const loadOrders = async (showRefreshToast = false) => {
    if (showRefreshToast) setRefreshing(true);
    else setLoading(true);

    try {
      const [prof, jobsData] = await Promise.all([
        getProfile(),
        getJobOrders(1, 100)
      ]);

      setProfile(prof);
      const { data: { user } } = await supabase.auth.getUser();
      
      const filteredOrders = (jobsData.items || []).filter(
        (o: any) => {
          return o.quotation?.profile?.id === prof?.id || 
                 o.quotation?.profile?.email === user?.email || 
                 o.quotation?.user_id === user?.id;
        }
      );
      
      setOrders(filteredOrders);

      if (showRefreshToast) {
        toast.success("Data diperbarui");
      }
    } catch (error: any) {
      console.error('Load orders error:', error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const matchesSearch = search === "" ||
        order.tracking_code.toLowerCase().includes(search.toLowerCase()) ||
        order.quotation?.items?.[0]?.service?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || order.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, filterStatus]);

  const handleDownloadInvoice = async (order: any) => {
    if (!order.invoice) {
        toast.error("Invoice belum tersedia");
        return;
    }

    setIsDownloadingPdf(true);
    try {
      // Ensure we have window origin for absolute asset paths
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      
      const companyProfile = {
        company_name: 'WahfaLab',
        address: 'Jl. Laboratorium No. 123',
        phone: '+62 812-3456-7890',
        email: 'info@wahfalab.com',
        logo_url: `${origin}/logo-wahfalab.png`, // Use absolute URL
        npwp: '01.234.567.8-901.000'
      };

      const items = order.quotation?.items?.map((item: any) => ({
        service_name: item.service?.name || item.equipment?.name || 'Layanan',
        quantity: Number(item.qty || 1),
        unit_price: Number(item.price_snapshot || 0),
        subtotal: Number((item.qty || 1) * (item.price_snapshot || 0))
      })) || [];

      const pdfData = {
        invoice_number: String(order.invoice.invoice_number),
        quotation_number: order.quotation?.quotation_number || '-',
        tracking_code: String(order.tracking_code),
        issue_date: order.invoice.created_at || new Date().toISOString(),
        due_date: order.invoice.due_date || new Date().toISOString(),
        amount: Number(order.invoice.amount || 0),
        payment_status: String(order.invoice.status || 'draft'),
        customer: {
          full_name: order.quotation?.profile?.full_name || 'Pelanggan',
          company_name: order.quotation?.profile?.company_name || '-',
          email: order.quotation?.profile?.email || '-',
          phone: order.quotation?.profile?.phone || '-',
          address: order.quotation?.profile?.address || '-'
        },
        items,
        company: companyProfile
      };

      // Generate the PDF blob
      const blob = await pdf(<InvoicePDF data={pdfData} />).toBlob();
      
      if (!blob) throw new Error("Gagal membuat data binary PDF");

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${order.invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("✅ Invoice berhasil diunduh");
    } catch (error: any) {
      console.error('PDF generation error detail:', error);
      toast.error(`Gagal membuat PDF invoice: ${error.message || 'Unknown error'}`);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <ChemicalLoader />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 bg-slate-50/20 space-y-10">
      <LoadingOverlay isOpen={isDownloadingPdf} title="Menyiapkan Dokumen..." description="Sistem sedang men-generate file PDF Anda" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <Link href="/dashboard" className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2 mb-2 hover:translate-x-[-4px] transition-transform">
            <ArrowLeft className="h-3 w-3" /> Kembali ke Panel
          </Link>
          <h1 className="text-3xl font-black text-emerald-900 tracking-tight flex items-center gap-3">
            <History className="h-8 w-8 text-emerald-600" />
            RIWAYAT PESANAN
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.1em] opacity-80">Pantau seluruh riwayat pengujian dan administrasi Anda</p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadOrders(true)}
          disabled={refreshing}
          className="h-11 px-6 rounded-2xl border-slate-200 bg-white font-bold text-xs gap-2 shadow-sm"
        >
          <RefreshCw className={cn("h-4 w-4 text-emerald-600", refreshing && "animate-spin")} />
          Update Data
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari tracking code atau jenis layanan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12 rounded-2xl border-slate-200 focus-visible:ring-emerald-500"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-48 h-12 rounded-2xl border-slate-200 font-bold text-xs">
              <SelectValue placeholder="Status Pesanan" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">Semua Status</SelectItem>
              {Object.entries(statusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50">
            <CardContent className="py-32 text-center flex flex-col items-center gap-6">
                <div className="h-24 w-24 rounded-full bg-slate-50 flex items-center justify-center border-4 border-white shadow-lg">
                    <History className="h-10 w-10 text-slate-200" />
                </div>
                <div className="space-y-1">
                    <p className="font-black text-slate-800 text-lg uppercase tracking-widest">Belum ada pesanan</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Riwayat pesanan Anda akan muncul di sini</p>
                </div>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order: any) => (
            <Card key={order.id} className="rounded-[2rem] border-none shadow-md hover:shadow-xl transition-all overflow-hidden group">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  {/* Status Indicator Sidebar */}
                  <div className={cn("w-full lg:w-40 p-6 flex flex-col items-center justify-center gap-3 lg:border-r border-slate-100", statusColors[order.status])}>
                    <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                        {React.createElement(steps.find(s => s.id === order.status)?.icon || Activity, { className: "h-6 w-6" })}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">
                        {statusLabels[order.status] || order.status}
                    </span>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 p-8 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">{order.tracking_code}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-tight">
                                {order.quotation?.items?.[0]?.service?.name || 'Uji Laboratorium Analisis'}
                            </h4>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}
                                className="flex-1 md:flex-none h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border-slate-200"
                            >
                                <Eye className="h-4 w-4 mr-2 text-emerald-600" /> Detail
                            </Button>
                            
                            {order.invoice && (
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleDownloadInvoice(order)}
                                    className="flex-1 md:flex-none h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border-blue-100 text-blue-600 hover:bg-blue-50"
                                >
                                    <Receipt className="h-4 w-4 mr-2" /> Invoice
                                </Button>
                            )}

                            {order.certificate_url && (
                                <Button 
                                    size="sm" 
                                    onClick={() => window.open(order.certificate_url, '_blank')}
                                    className="flex-1 md:flex-none h-10 rounded-xl font-black text-[10px] uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/20"
                                >
                                    <Download className="h-4 w-4 mr-2" /> Sertifikat
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50">
                        <WorkflowTimeline status={order.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-6 pt-2">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                            <div>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Total Biaya</p>
                                <p className="text-xs font-black text-slate-700">Rp {Number(order.quotation?.total_amount || 0).toLocaleString("id-ID")}</p>
                            </div>
                        </div>
                        {order.invoice && (
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-blue-500" />
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Status Bayar</p>
                                    <Badge className={cn("text-[8px] font-black uppercase h-5", order.invoice.status === 'paid' ? "bg-emerald-500 text-white" : "bg-blue-50 text-blue-600 border border-blue-100")}>
                                        {order.invoice.status === 'paid' ? 'LUNAS' : 'MENUNGGU PEMBAYARAN'}
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Order Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-xl p-0 border-none shadow-2xl rounded-[3rem] overflow-hidden">
          <div className="bg-slate-900 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-8">
                <Button variant="ghost" size="icon" onClick={() => setIsDetailOpen(false)} className="text-white/40 hover:text-white hover:bg-white/10 rounded-2xl h-12 w-12"><X className="h-6 w-6" /></Button>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/20 transform rotate-3">
                <Activity className="h-8 w-8 text-slate-900" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight">STATUS PESANAN</DialogTitle>
                <div className="flex items-center gap-3 mt-1">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-black uppercase tracking-widest">{selectedOrder?.tracking_code}</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8 bg-white">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Tgl Order</p>
                    <p className="text-sm font-black text-slate-800">{new Date(selectedOrder?.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Biaya</p>
                    <p className="text-sm font-black text-emerald-700">Rp {Number(selectedOrder?.quotation?.total_amount || 0).toLocaleString("id-ID")}</p>
                </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Pelacakan Progres</p>
                <div className="flex justify-center py-2">
                    <WorkflowTimeline status={selectedOrder?.status || ''} />
                </div>
                <p className="mt-8 text-xs font-bold text-emerald-600 uppercase tracking-widest animate-pulse">
                    {statusLabels[selectedOrder?.status] || 'MEMPROSES'}
                </p>
            </div>

            {selectedOrder?.invoice && (
                <div className={cn("p-6 rounded-[2rem] flex items-center justify-between shadow-xl", selectedOrder.invoice.status === 'paid' ? "bg-emerald-900 text-white shadow-emerald-900/20" : "bg-blue-600 text-white shadow-blue-900/20")}>
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                            <Receipt className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-tight">{selectedOrder.invoice.status === 'paid' ? 'TAGIHAN LUNAS' : 'TAGIHAN TERSEDIA'}</p>
                            <p className="text-[10px] opacity-80 font-bold uppercase">{selectedOrder.invoice.invoice_number}</p>
                        </div>
                    </div>
                    <Button onClick={() => handleDownloadInvoice(selectedOrder)} className="bg-white text-slate-900 hover:bg-slate-100 font-black text-[10px] uppercase h-12 px-6 rounded-xl">Unduh PDF</Button>
                </div>
            )}
          </div>

          <DialogFooter className="p-6 bg-slate-50 border-t flex gap-3">
            <Button variant="outline" onClick={() => setIsDetailOpen(false)} className="flex-1 font-black text-[10px] uppercase h-12 rounded-2xl border-slate-300">Tutup</Button>
            <Button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase h-12 rounded-2xl shadow-xl shadow-slate-900/20 gap-2">
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                Bantuan CS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Visual Workflow Timeline
function WorkflowTimeline({ status }: { status: string }) {
  const stages = [
    { id: 1, name: "Order", icon: FileText, complete: true },
    { id: 2, name: "Sampling", icon: Truck, complete: ["sampling", "analysis_ready", "analysis", "reporting", "completed"].includes(status) },
    { id: 3, name: "BAST", icon: ClipboardCheck, complete: ["analysis_ready", "analysis", "reporting", "completed"].includes(status) },
    { id: 4, name: "Lab", icon: Beaker, complete: ["analysis", "reporting", "completed"].includes(status) },
    { id: 5, name: "Laporan", icon: FileText, complete: ["reporting", "completed"].includes(status) },
    { id: 6, name: "Selesai", icon: FileCheck, complete: status === "completed" },
  ];

  const getStatusColor = (stage: any) => {
    if (stage.complete) return "bg-emerald-500 text-white border-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.4)]";
    if (stage.id === stages.findIndex(s => !s.complete) + 1) return "bg-amber-500 text-white border-amber-600 animate-pulse";
    return "bg-slate-100 text-slate-300 border-slate-200";
  };

  return (
    <div className="flex items-center gap-1 min-w-[200px] justify-center">
      {stages.map((stage, index) => (
        <React.Fragment key={stage.id}>
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all duration-500",
              getStatusColor(stage)
            )}>
              <stage.icon className="h-4 w-4" />
            </div>
            <span className={cn(
              "text-[7px] font-black uppercase tracking-tighter transition-colors",
              stage.complete ? "text-emerald-600" : stage.id === stages.findIndex(s => !s.complete) + 1 ? "text-amber-600" : "text-slate-300"
            )}>
              {stage.name}
            </span>
          </div>
          {index < stages.length - 1 && (
            <div className={cn(
              "w-4 md:w-8 h-0.5 transition-all duration-1000 mb-3",
              stage.complete ? "bg-emerald-500" : "bg-slate-100"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// Re-using same style components
function StatCard({ title, value, icon: Icon, color, description }: { title: string; value: number; icon: any; color: string; description: string; }) {
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100"
  };

  return (
    <div className={cn("bg-white p-5 rounded-[2rem] shadow-sm border-2 transition-all hover:shadow-md flex flex-col items-center text-center gap-3", colorClasses[color] || colorClasses.slate)}>
      <div className="p-2.5 rounded-2xl bg-white shadow-sm shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase opacity-60 tracking-widest leading-none mb-1">{title}</p>
        <p className="text-2xl font-black tracking-tighter leading-none">{value}</p>
        <p className="text-[8px] font-bold opacity-50 mt-1 truncate">{description}</p>
      </div>
    </div>
  );
}
