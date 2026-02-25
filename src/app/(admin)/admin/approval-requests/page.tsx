// ============================================================================
// ADMIN APPROVAL REQUESTS PAGE - Optimized & Standardized
// Halaman admin untuk approve/reject permintaan operator
// ============================================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Trash2,
  Edit2,
  Eye,
  AlertCircle,
  Calendar,
  X
} from "lucide-react";
import { ChemicalLoader, LoadingOverlay, LoadingButton } from "@/components/ui";
import {
  getApprovalRequests,
  approveRequest,
  rejectRequest
} from "@/lib/actions/approval";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    red: "bg-red-50 text-red-600 border-red-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
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

export default function AdminApprovalRequestsPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getApprovalRequests(1, 50, filterStatus);
      setData(res);
      
      // Load stats
      const [pending, approved, rejected] = await Promise.all([
        getApprovalRequests(1, 1, 'pending').then(r => r.total),
        getApprovalRequests(1, 1, 'approved').then(r => r.total),
        getApprovalRequests(1, 1, 'rejected').then(r => r.total),
      ]);
      setStats({ pending, approved, rejected });
    } catch (error) {
      toast.error("Gagal memuat data permintaan");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (id: string) => {
    setProcessing(true);
    try {
      const res = await approveRequest(id, 'admin');
      if (res.success) {
        toast.success(res.message);
        loadData();
        if (selectedRequest?.id === id) setViewDialogOpen(false);
      }
    } catch (error) {
      toast.error("Gagal menyetujui permintaan");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    setProcessing(true);
    try {
      const res = await rejectRequest(id, 'admin', rejectReason);
      if (res.success) {
        toast.success(res.message);
        setRejectDialogOpen(false);
        setRejectReason("");
        loadData();
        if (selectedRequest?.id === id) setViewDialogOpen(false);
      }
    } catch (error) {
      toast.error("Gagal menolak permintaan");
    } finally {
      setProcessing(false);
    }
  };

  const openViewDialog = (request: any) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const openRejectDialog = (request: any) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'edit': return <Edit2 className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return "bg-amber-100 text-amber-700 border-amber-200";
      case 'approved': return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case 'rejected': return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'MENUNGGU';
      case 'approved': return 'DISETUJUI';
      case 'rejected': return 'DITOLAK';
      default: return status.toUpperCase();
    }
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-emerald-900 tracking-tight">Permintaan Persetujuan</h1>
          <p className="text-slate-500 text-sm">Kelola permintaan edit/hapus data dari operator.</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard title="Menunggu" value={stats.pending} icon={Clock} color="amber" />
        <StatCard title="Disetujui" value={stats.approved} icon={CheckCircle} color="emerald" />
        <StatCard title="Ditolak" value={stats.rejected} icon={XCircle} color="red" />
        <StatCard title="Total" value={stats.pending + stats.approved + stats.rejected} icon={FileText} color="blue" />
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-emerald-50/10 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40 h-11 rounded-xl border-slate-200 bg-white focus:ring-emerald-500 cursor-pointer">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending" className="cursor-pointer">Menunggu</SelectItem>
                <SelectItem value="approved" className="cursor-pointer">Disetujui</SelectItem>
                <SelectItem value="rejected" className="cursor-pointer">Ditolak</SelectItem>
                <SelectItem value="all" className="cursor-pointer">Semua</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 text-right">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
               Total {data.total} Permintaan
             </span>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="px-6 w-16 text-center font-bold text-emerald-900">No</TableHead>
              <TableHead className="px-4 font-bold text-emerald-900">Tipe</TableHead>
              <TableHead className="px-4 font-bold text-emerald-900">Pemohon</TableHead>
              <TableHead className="px-4 font-bold text-emerald-900">Entitas</TableHead>
              <TableHead className="px-4 font-bold text-emerald-900">Status</TableHead>
              <TableHead className="px-4 text-center font-bold text-emerald-900">Tanggal</TableHead>
              <TableHead className="px-6 text-center font-bold text-emerald-900">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
               Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7} className="py-4 px-6"><div className="h-10 bg-slate-50 animate-pulse rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Clock className="h-10 w-10 text-emerald-300" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-slate-700">Tidak ada permintaan</p>
                      <p className="text-sm text-slate-500 mt-1">Belum ada permintaan persetujuan yang ditemukan.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((item: any, idx: number) => (
                <TableRow key={item.id} className="hover:bg-emerald-50/5 transition-colors group">
                  <TableCell className="px-6 text-center text-slate-400 text-xs font-black">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-2 rounded-lg",
                        item.request_type === 'edit' ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
                      )}>
                        {getRequestTypeIcon(item.request_type)}
                      </div>
                      <span className="font-bold text-xs uppercase tracking-tight">
                        {item.request_type === 'edit' ? 'Edit Data' : 'Hapus Data'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-slate-800">
                        {item.requester.full_name || 'Unknown'}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-black">
                        {item.requester.role}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.entity_type}</span>
                      <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded w-fit">
                        {item.entity_id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 text-center">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[9px] px-3 py-1 rounded-full font-black border-2",
                        getStatusColor(item.status)
                      )}
                    >
                      {getStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-slate-700">
                        {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">
                        {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center px-6">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openViewDialog(item)}
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-9 w-9 rounded-xl transition-all active:scale-90"
                        title="Lihat Detail"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {item.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleApprove(item.id)}
                            disabled={processing}
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-9 w-9 rounded-xl transition-all active:scale-90"
                            title="Setujui"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openRejectDialog(item)}
                            disabled={processing}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 w-9 rounded-xl transition-all active:scale-90"
                            title="Tolak"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl p-0 border-none shadow-2xl rounded-3xl overflow-hidden">
          {/* Emerald Glassmorphism Header */}
          <div className="bg-emerald-700/80 backdrop-blur-md p-4 text-white border-b border-emerald-600/50 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/20 shadow-inner">
                <FileText className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-black uppercase tracking-widest">Detail Permintaan</DialogTitle>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setViewDialogOpen(false)} 
              className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl h-8 w-8 transition-all"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {selectedRequest && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Informasi Pemohon</label>
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold uppercase">
                        {selectedRequest.requester.full_name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{selectedRequest.requester.full_name}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">{selectedRequest.requester.role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Tipe & Status</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col gap-1">
                         <span className="text-[9px] font-black text-slate-400 uppercase">Tipe</span>
                         <span className="font-bold text-xs uppercase tracking-tight capitalize">{selectedRequest.request_type}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col gap-1">
                         <span className="text-[9px] font-black text-slate-400 uppercase">Status</span>
                         <Badge variant="outline" className={cn("text-[9px] px-2 py-0 rounded-full font-black border-2 w-fit", getStatusColor(selectedRequest.status))}>
                           {getStatusLabel(selectedRequest.status)}
                         </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Target Entitas</label>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                       <div className="flex justify-between items-center">
                         <span className="text-[9px] font-black text-slate-400 uppercase">{selectedRequest.entity_type}</span>
                         <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">{selectedRequest.entity_id}</span>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Alasan Permintaan</label>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 italic text-xs text-slate-600 min-h-[80px]">
                      "{selectedRequest.reason}"
                    </div>
                  </div>
                </div>
              </div>

              {selectedRequest.rejection_reason && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-red-600 uppercase tracking-wider">Alasan Penolakan</label>
                  <div className="bg-red-50 p-3 rounded-2xl border border-red-100 text-red-700 text-xs font-medium italic">
                    "{selectedRequest.rejection_reason}"
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Dibuat Pada</span>
                  <span className="text-xs font-bold text-slate-700">{new Date(selectedRequest.created_at).toLocaleString('id-ID')}</span>
                </div>
                {selectedRequest.reviewed_at && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Ditinjau Pada</span>
                    <span className="text-xs font-bold text-slate-700">{new Date(selectedRequest.reviewed_at).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-4 bg-slate-50 border-t flex items-center justify-end gap-3">
             <Button variant="ghost" onClick={() => setViewDialogOpen(false)} className="font-bold text-slate-400 text-xs uppercase px-6 h-10 rounded-xl">Tutup</Button>
             {selectedRequest?.status === 'pending' && (
               <div className="flex gap-2">
                 <Button
                    onClick={() => openRejectDialog(selectedRequest)}
                    className="bg-red-50 text-red-600 hover:bg-red-100 font-bold px-6 h-10 rounded-xl text-xs uppercase border border-red-100"
                  >
                    Tolak
                  </Button>
                  <LoadingButton
                    onClick={() => handleApprove(selectedRequest.id)}
                    loading={processing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 h-10 rounded-xl shadow-lg shadow-emerald-900/20 text-xs uppercase tracking-wide"
                  >
                    Setujui
                  </LoadingButton>
               </div>
             )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent className="p-0 border-none shadow-2xl rounded-3xl overflow-hidden max-w-md">
          <div className="bg-red-600 p-4 text-white flex items-center gap-3">
             <AlertCircle className="h-5 w-5" />
             <AlertDialogTitle className="text-base font-black uppercase tracking-widest">Tolak Permintaan</AlertDialogTitle>
          </div>
          <div className="p-6 space-y-4">
            <AlertDialogDescription className="text-sm font-medium text-slate-600">
              Apakah Anda yakin ingin menolak permintaan ini? Silakan berikan alasan penolakan untuk operator.
            </AlertDialogDescription>
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-[10px] font-black text-red-600 uppercase tracking-wider">Alasan Penolakan *</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Data sudah sesuai, atau alasan lainnya..."
                className="rounded-xl border-slate-200 bg-slate-50/50 focus:ring-red-500 resize-none min-h-[100px]"
              />
            </div>
          </div>
          <div className="p-4 bg-slate-50 border-t flex items-center justify-end gap-3">
            <AlertDialogCancel onClick={() => setRejectDialogOpen(false)} className="font-bold text-slate-400 text-xs uppercase px-6 h-10 rounded-xl border-none hover:bg-transparent">Batal</AlertDialogCancel>
            <LoadingButton
              onClick={() => selectedRequest && handleReject(selectedRequest.id)}
              loading={processing}
              disabled={!rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white font-black px-6 h-10 rounded-xl shadow-lg shadow-red-900/20 text-xs uppercase"
            >
              Tolak Permintaan
            </LoadingButton>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Loading Overlay */}
      <LoadingOverlay 
        isOpen={processing} 
        title="Memproses Persetujuan..." 
        description="Mohon tunggu sebentar, status data sedang diperbarui" 
      />
    </div>
  );
}
