// ============================================================================
// ADMIN APPROVAL REQUESTS PAGE
// Halaman admin untuk approve/reject permintaan operator
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
  User,
  Calendar
} from "lucide-react";
import { ChemicalLoader } from "@/components/ui";
import {
  getApprovalRequests,
  approveRequest,
  rejectRequest,
  getPendingApprovalCount
} from "@/lib/actions/approval";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
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
    <Card className={cn("border-none shadow-sm", colors[color])}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn("p-3 rounded-xl bg-white shadow-sm shrink-0")}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase opacity-60 tracking-wider truncate">{title}</p>
          <p className="text-2xl font-black tracking-tight leading-none">{value}</p>
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
      case 'pending': return 'Menunggu';
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      default: return status.toUpperCase();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ChemicalLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">Permintaan Persetujuan</h1>
          <p className="text-slate-500 text-sm">Kelola permintaan edit/hapus dari operator</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Menunggu" value={stats.pending} icon={Clock} color="amber" />
        <StatCard title="Disetujui" value={stats.approved} icon={CheckCircle} color="emerald" />
        <StatCard title="Ditolak" value={stats.rejected} icon={XCircle} color="red" />
        <StatCard title="Total" value={stats.pending + stats.approved + stats.rejected} icon={FileText} color="blue" />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b bg-emerald-50/5 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex gap-2 shrink-0">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 h-10 rounded-xl border-slate-200 bg-white shadow-sm font-medium text-xs">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="approved">Disetujui</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
                <SelectItem value="all">Semua</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 font-bold">
              <TableHead className="px-6 w-16 text-center">No</TableHead>
              <TableHead className="px-4">Tipe</TableHead>
              <TableHead className="px-4">Pemohon</TableHead>
              <TableHead className="px-4">Entitas</TableHead>
              <TableHead className="px-4">Alasan</TableHead>
              <TableHead className="px-4 text-center">Status</TableHead>
              <TableHead className="px-4 text-center">Tanggal</TableHead>
              <TableHead className="px-6 text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-20 text-slate-400 font-medium">
                  Tidak ada permintaan
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((item: any, idx: number) => (
                <TableRow key={item.id} className="hover:bg-emerald-50/5 transition-colors">
                  <TableCell className="px-6 text-center text-slate-400 text-xs font-bold">
                    {idx + 1}
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center gap-2">
                      {getRequestTypeIcon(item.request_type)}
                      <span className="font-semibold text-sm capitalize">
                        {item.request_type === 'edit' ? 'Edit' : 'Hapus'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-slate-800">
                        {item.requester.full_name || 'Unknown'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {item.requester.role}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span className="font-mono text-xs">{item.entity_type}:</span>
                      <span className="font-semibold text-xs truncate max-w-[150px]">
                        {item.entity_id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 max-w-[200px]">
                    <p className="text-xs text-slate-600 truncate">{item.reason}</p>
                  </TableCell>
                  <TableCell className="px-4 text-center">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] px-3 py-1 rounded-full font-bold",
                        getStatusColor(item.status)
                      )}
                    >
                      {getStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleDateString('id-ID')}
                      </div>
                      {item.reviewed_at && (
                        <div className="text-[10px] text-slate-400">
                          {new Date(item.reviewed_at).toLocaleDateString('id-ID')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center px-6">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openViewDialog(item)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-9 w-9 rounded-xl"
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
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-9 w-9 rounded-xl"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openRejectDialog(item)}
                            disabled={processing}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 w-9 rounded-xl"
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Permintaan</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Tipe Permintaan</Label>
                  <p className="font-semibold capitalize">{selectedRequest.request_type}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Status</Label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {getStatusLabel(selectedRequest.status)}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Pemohon</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-slate-400" />
                  <p className="font-semibold">{selectedRequest.requester.full_name}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Entitas</Label>
                <p className="font-mono text-sm">{selectedRequest.entity_type} - {selectedRequest.entity_id}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Alasan</Label>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg mt-1">
                  {selectedRequest.reason}
                </p>
              </div>
              {selectedRequest.rejection_reason && (
                <div>
                  <Label className="text-xs text-slate-500">Alasan Penolakan</Label>
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg mt-1">
                    {selectedRequest.rejection_reason}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-xs text-slate-500">Dibuat</Label>
                  <p className="text-sm">{new Date(selectedRequest.created_at).toLocaleString('id-ID')}</p>
                </div>
                {selectedRequest.reviewed_at && (
                  <div>
                    <Label className="text-xs text-slate-500">Ditinjau</Label>
                    <p className="text-sm">{new Date(selectedRequest.reviewed_at).toLocaleString('id-ID')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Tolak Permintaan
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menolak permintaan ini? Operator akan mendapat notifikasi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Alasan Penolakan *</Label>
            <Textarea
              id="reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Jelaskan alasan penolakan..."
              className="mt-2"
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectDialogOpen(false)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRequest && handleReject(selectedRequest.id)}
              disabled={processing || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? 'Memproses...' : 'Tolak Permintaan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
