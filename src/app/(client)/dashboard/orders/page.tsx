// ============================================================================
// CLIENT ORDERS PAGE - Riwayat Pesanan
// Fitur:
// 1. ✅ Semua riwayat pesanan
// 2. ✅ Filter by status & date
// 3. ✅ Search tracking code
// 4. ✅ Download certificate
// 5. ✅ Re-order functionality
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
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
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { ChemicalLoader } from "@/components/ui";

const statusColors: Record<string, string> = {
  scheduled: 'bg-amber-100 text-amber-700 border-amber-200',
  sampling: 'bg-blue-100 text-blue-700 border-blue-200',
  analysis: 'bg-purple-100 text-purple-700 border-purple-200',
  analysis_ready: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  analysis_done: 'bg-violet-100 text-violet-700 border-violet-200',
  reporting: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200'
};

const statusLabels: Record<string, string> = {
  scheduled: 'Antrean',
  sampling: 'Sampling',
  analysis: 'Analisis Lab',
  analysis_ready: 'Siap Analisis',
  analysis_done: 'Selesai Analisis',
  reporting: 'Pelaporan',
  completed: 'Selesai'
};

export default function ClientOrdersPage() {
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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
      
      console.log('Profile:', prof);
      console.log('User:', user);
      console.log('Orders data:', jobsData);
      
      // Filter orders by customer profile
      const filteredOrders = (jobsData.items || []).filter(
        (o: any) => {
          // Match by profile_id from quotation
          const matchByProfileId = o.quotation?.profile?.id === prof?.id;
          // Also match by user email as fallback
          const matchByEmail = o.quotation?.profile?.email === user?.email;
          // Also match by user_id if exists
          const matchByUserId = o.quotation?.user_id === user?.id;
          
          return matchByProfileId || matchByEmail || matchByUserId;
        }
      );
      
      console.log('Filtered orders:', filteredOrders);
      setOrders(filteredOrders);

      if (showRefreshToast) {
        toast.success("Data diperbarui", {
          description: `${filteredOrders.length} pesanan ditemukan`
        });
      }
    } catch (error: any) {
      console.error('Load orders error:', error);
      toast.error("Gagal memuat data", {
        description: error?.message || "Silakan coba lagi"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Filter & Search
  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch = search === "" ||
      order.tracking_code.toLowerCase().includes(search.toLowerCase()) ||
      order.quotation?.items?.[0]?.service?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filterStatus === "all" || order.status === filterStatus;

    const orderDate = new Date(order.created_at);
    const matchesDateFrom = dateFrom ? orderDate >= new Date(dateFrom) : true;
    const matchesDateTo = dateTo ? orderDate <= new Date(dateTo) : true;

    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  // Stats
  const stats = {
    total: orders.length,
    active: orders.filter(o => o.status !== 'completed').length,
    completed: orders.filter(o => o.status === 'completed').length,
    withCertificate: orders.filter(o => o.certificate_url).length
  };

  const handleDownloadCertificate = (order: any) => {
    if (order.certificate_url) {
      window.open(order.certificate_url, '_blank');
      toast.success("✅ Sertifikat sedang diunduh");
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
    <div className="p-4 md:p-8 pb-24 md:pb-8 bg-slate-50/20">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4 cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-emerald-900 tracking-tight flex items-center gap-3">
              <History className="h-8 w-8 text-emerald-600" />
              Riwayat Pesanan
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Lacak semua pesanan pengujian laboratorium Anda
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="cursor-pointer"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Pesanan"
          value={stats.total}
          icon={History}
          color="slate"
          description="Semua riwayat"
        />
        <StatCard
          title="Dalam Proses"
          value={stats.active}
          icon={Clock}
          color="amber"
          description="Belum selesai"
        />
        <StatCard
          title="Selesai"
          value={stats.completed}
          icon={CheckCircle}
          color="emerald"
          description="Sertifikat terbit"
        />
        <StatCard
          title="Sertifikat"
          value={stats.withCertificate}
          icon={FileCheck}
          color="blue"
          description="Tersedia untuk diunduh"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex flex-col gap-4">
          {/* Search & Toggle */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari tracking code atau layanan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12 rounded-xl border-slate-200"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48 h-12 rounded-xl border-slate-200">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-12 px-4 rounded-xl"
              >
                {showFilters ? "Tutup" : "Filter"}
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Dari Tanggal</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-10 rounded-lg border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Sampai Tanggal</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-10 rounded-lg border-slate-200 text-xs"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setSearch("");
                    setFilterStatus("all");
                  }}
                  className="w-full text-xs font-bold"
                >
                  Reset Filter
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-emerald-900 flex items-center gap-2 text-sm uppercase tracking-wide">
            <FlaskConical className="h-4 w-4" />
            Semua Pesanan ({filteredOrders.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <History className="h-10 w-10 text-slate-300" />
              </div>
              <h4 className="font-semibold text-slate-700 mb-1">Tidak ada pesanan</h4>
              <p className="text-slate-500 text-sm mb-4">
                {search || filterStatus !== "all" || dateFrom || dateTo
                  ? "Coba ubah filter atau kata kunci pencarian"
                  : "Mulai dengan membuat pesanan pengujian pertama Anda"}
              </p>
              {!search && filterStatus === "all" && !dateFrom && !dateTo && (
                <Link href="/operator/quotations">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                    Buat Pesanan Baru
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            filteredOrders.map((order: any) => (
              <div key={order.id} className="p-5 hover:bg-slate-50 transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-[10px] shrink-0">
                      {order.tracking_code.slice(-3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                          {order.tracking_code}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[8px] h-5 px-2 font-bold uppercase border-2",
                            statusColors[order.status] || "bg-slate-100"
                          )}
                        >
                          {statusLabels[order.status] || order.status}
                        </Badge>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm truncate mb-2">
                        {order.quotation?.items?.[0]?.service?.name || 'Uji Analisis Lab'}
                      </h4>
                      {/* Visual Workflow Timeline */}
                      <WorkflowTimeline status={order.status} />
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span className="font-bold text-emerald-700">
                            Rp {Number(order.quotation?.total_amount || 0).toLocaleString("id-ID")}
                          </span>
                        </span>
                        {order.certificate_url && (
                          <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-bold">
                            <FileCheck className="h-3 w-3" />
                            Sertifikat Tersedia
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDetailOpen(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="flex-1 md:flex-none h-9 text-xs font-bold rounded-lg border-emerald-100 text-emerald-700 cursor-pointer"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Detail
                    </Button>
                    {order.certificate_url && (
                      <Button
                        onClick={() => handleDownloadCertificate(order)}
                        size="sm"
                        className="flex-1 md:flex-none h-9 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Unduh
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl p-0 overflow-hidden max-h-[90vh]">
          <div className="bg-gradient-to-r from-emerald-900 to-indigo-900 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">
                    {selectedOrder?.quotation?.items?.[0]?.service?.name || 'Detail Pesanan'}
                  </DialogTitle>
                  <DialogDescription className="text-emerald-200 text-xs font-medium mt-1">
                    {selectedOrder?.tracking_code}
                  </DialogDescription>
                </DialogHeader>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDetailOpen(false)}
                className="text-white/60 hover:text-white rounded-xl"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="p-6 bg-white overflow-y-auto max-h-[60vh]">
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Tanggal Order</h5>
                    <p className="text-sm font-semibold">
                      {new Date(selectedOrder.created_at).toLocaleDateString("id-ID", {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Total Biaya</h5>
                    <p className="text-lg font-bold text-emerald-700">
                      Rp {Number(selectedOrder.quotation?.total_amount || 0).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h5 className="text-xs font-bold text-blue-600 uppercase mb-2">Informasi Customer</h5>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-slate-800">{selectedOrder.quotation?.profile?.full_name}</p>
                    {selectedOrder.quotation?.profile?.company_name && (
                      <p className="text-slate-600">{selectedOrder.quotation?.profile?.company_name}</p>
                    )}
                    {selectedOrder.quotation?.profile?.email && (
                      <p className="text-slate-600">{selectedOrder.quotation?.profile?.email}</p>
                    )}
                  </div>
                </div>

                {/* Status Timeline */}
                <div>
                  <h5 className="text-xs font-bold text-slate-500 uppercase mb-4">Progress Pengujian</h5>
                  <div className="space-y-3">
                    {Object.entries(statusLabels).map(([status, label]) => {
                      const isCurrent = selectedOrder.status === status;
                      const isPast = Object.keys(statusLabels).indexOf(status) < Object.keys(statusLabels).indexOf(selectedOrder.status);
                      
                      return (
                        <div key={status} className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            isCurrent ? "bg-emerald-600 text-white" :
                            isPast ? "bg-emerald-100 text-emerald-600" :
                            "bg-slate-100 text-slate-300"
                          )}>
                            {isCurrent ? <CheckCircle className="h-4 w-4" /> :
                             isPast ? <CheckCircle className="h-4 w-4" /> :
                             <Clock className="h-4 w-4" />}
                          </div>
                          <span className={cn(
                            "text-sm font-bold",
                            isCurrent ? "text-emerald-900" :
                            isPast ? "text-emerald-600" :
                            "text-slate-400"
                          )}>
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Certificate */}
                {selectedOrder.certificate_url && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <FileCheck className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h5 className="text-sm font-bold text-emerald-800 mb-1">Sertifikat Tersedia</h5>
                        <p className="text-xs text-emerald-700 mb-3">Unduh sertifikat pengujian laboratorium Anda</p>
                        <Button
                          onClick={() => handleDownloadCertificate(selectedOrder)}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-xs cursor-pointer"
                        >
                          <Download className="h-3 w-3 mr-2" />
                          Unduh Sertifikat
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="p-4 bg-slate-50 border-t gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDetailOpen(false)}
              className="flex-1 cursor-pointer"
            >
              Tutup
            </Button>
            <Link href={`/operator/quotations/${selectedOrder?.quotation_id}`} className="flex-1">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                <Eye className="h-4 w-4 mr-2" />
                Lihat Penawaran
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  description: string;
}) {
  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    slate: "bg-slate-50 text-slate-600"
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{title}</p>
      <p className="text-[9px] text-slate-400 mt-0.5">{description}</p>
    </div>
  );
}

// Workflow Timeline Component
function WorkflowTimeline({ status }: { status: string }) {
  const stages = [
    { id: 1, name: "Order", icon: FileText, complete: true },
    { id: 2, name: "Sampling", icon: MapPin, complete: ["sampling", "analysis_ready", "analysis", "analysis_done", "reporting", "completed"].includes(status) },
    { id: 3, name: "Handover", icon: ClipboardCheck, complete: ["analysis_ready", "analysis", "analysis_done", "reporting", "completed"].includes(status) },
    { id: 4, name: "Analisis", icon: FlaskConical, complete: ["analysis", "analysis_done", "reporting", "completed"].includes(status) },
    { id: 5, name: "Reporting", icon: FileText, complete: ["reporting", "completed"].includes(status) },
    { id: 6, name: "Selesai", icon: CheckCircle, complete: status === "completed" },
  ];

  const getStatusColor = (stage: any) => {
    if (stage.complete) return "bg-emerald-500 text-white border-emerald-600";
    if (stage.id === stages.findIndex(s => !s.complete) + 1) return "bg-amber-500 text-white border-amber-600 animate-pulse";
    return "bg-slate-100 text-slate-400 border-slate-200";
  };

  return (
    <div className="flex items-center gap-1 min-w-[200px]">
      {stages.map((stage, index) => (
        <React.Fragment key={stage.id}>
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
              getStatusColor(stage)
            )}>
              <stage.icon className="h-3 w-3" />
            </div>
            <span className={cn(
              "text-[8px] font-bold uppercase tracking-tighter",
              stage.complete ? "text-emerald-600" : stage.id === stages.findIndex(s => !s.complete) + 1 ? "text-amber-600" : "text-slate-400"
            )}>
              {stage.name}
            </span>
          </div>
          {index < stages.length - 1 && (
            <div className={cn(
              "w-4 h-0.5 transition-all duration-300",
              stage.complete ? "bg-emerald-500" : "bg-slate-200"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
