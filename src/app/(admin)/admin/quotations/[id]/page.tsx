"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  Printer,
  Trash2,
  FileText,
  User,
  Calendar,
  CreditCard,
  Truck,
  Users,
  Send,
  CheckCircle,
  XCircle,
  FileDown
} from "lucide-react";
import { toast } from "sonner";
import { getQuotationById, deleteQuotation, updateQuotationStatus } from "@/lib/actions/quotation";
import { ChemicalLoader } from "@/components/ui";
import Link from "next/link";
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
import { downloadQuotationPDF } from "@/lib/generate-quotation-pdf";
import { cn } from "@/lib/utils";

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadQuotation = async () => {
    setLoading(true);
    try {
      const result = await getQuotationById(params.id as string);
      if (result) {
        setQuotation(result);
      } else {
        toast.error("Penawaran tidak ditemukan");
        router.push("/admin/quotations");
      }
    } catch (error) {
      toast.error("Gagal memuat detail penawaran");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) loadQuotation();
  }, [params.id]);

  const handleDelete = () => {
    setIsDeleting(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteQuotation(quotation.id);
      toast.success("Penawaran berhasil dihapus");
      router.push("/admin/quotations");
    } catch (error) {
      toast.error("Gagal menghapus penawaran");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      await downloadQuotationPDF(quotation);
      toast.success("PDF berhasil diunduh");
    } catch (error) {
      toast.error("Gagal mengunduh PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await updateQuotationStatus(quotation.id, newStatus);
      toast.success(`Status berhasil diubah menjadi ${newStatus.toUpperCase()}`);
      setQuotation({ ...quotation, status: newStatus });
    } catch (error) {
      toast.error("Gagal mengubah status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-slate-100 text-slate-700 border-slate-200";
      case "sent": return "bg-blue-100 text-blue-700 border-blue-200";
      case "accepted": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      case "paid": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-slate-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft": return FileText;
      case "sent": return Send;
      case "accepted": return CheckCircle;
      case "rejected": return XCircle;
      case "paid": return CreditCard;
      default: return FileText;
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <ChemicalLoader />
      <p className="mt-4 text-slate-500">Memuat detail penawaran...</p>
    </div>
  );

  if (!quotation) return null;

  return (
    <div className="p-4 md:p-10 space-y-6 pb-24 md:pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/quotations">
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-emerald-900">{quotation.quotation_number}</h1>
            <p className="text-slate-500 text-sm">Dibuat pada {new Date(quotation.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="cursor-pointer">
                <FileDown className="mr-2 h-4 w-4" /> Ubah Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => handleStatusUpdate('draft')} className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4 text-slate-400" /> Draft
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusUpdate('accepted')} className="cursor-pointer">
                <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" /> Tandai Diterima
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusUpdate('rejected')} className="cursor-pointer">
                <XCircle className="mr-2 h-4 w-4 text-red-500" /> Tandai Ditolak
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleStatusUpdate('paid')} className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4 text-purple-500" /> Tandai Dibayar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Hapus
          </Button>

          <Button 
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isDownloading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Proses...</span>
              </div>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" /> Cetak PDF
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl shadow-emerald-900/5">
            <CardHeader className="border-b bg-emerald-50/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Daftar Item Layanan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500">
                    <th className="px-6 py-3 text-left font-semibold">Layanan</th>
                    <th className="px-6 py-3 text-center font-semibold">Qty</th>
                    <th className="px-6 py-3 text-right font-semibold">Harga Satuan</th>
                    <th className="px-6 py-3 text-right font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {quotation.items.map((item: any) => {
                    const itemName = item.service?.name || item.equipment?.name || "Item Tidak Dikenal";
                    const itemCategory = item.service?.category || "ALAT LAB";
                    
                    return (
                      <tr key={item.id}>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{itemName}</div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">{itemCategory}</div>
                        </td>
                        <td className="px-6 py-4 text-center">{item.qty}</td>
                        <td className="px-6 py-4 text-right">Rp {Number(item.price_snapshot).toLocaleString("id-ID")}</td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-700">
                          Rp {(item.qty * Number(item.price_snapshot)).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Additional Costs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-lg">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Biaya Perdiem</p>
                  <p className="font-bold text-slate-800">
                    Rp {Number(quotation.perdiem_price).toLocaleString("id-ID")} x {quotation.perdiem_qty} Hari
                  </p>
                  <p className="text-sm text-emerald-600 font-bold">Total: Rp {(Number(quotation.perdiem_price) * quotation.perdiem_qty).toLocaleString("id-ID")}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-lg">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Transport & Akomodasi</p>
                  <p className="font-bold text-slate-800">
                    Rp {Number(quotation.transport_price).toLocaleString("id-ID")} x {quotation.transport_qty} Vol
                  </p>
                  <p className="text-sm text-emerald-600 font-bold">Total: Rp {(Number(quotation.transport_price) * quotation.transport_qty).toLocaleString("id-ID")}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Informasi Klien</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-bold text-slate-800">{quotation.profile.full_name}</p>
                  <p className="text-xs text-slate-500">{quotation.profile.company_name || "Personal"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-slate-400" />
                <p className="text-sm text-slate-600">Dibuat: {new Date(quotation.created_at).toLocaleDateString("id-ID")}</p>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-slate-400" />
                <Badge className={getStatusColor(quotation.status)}>
                  {quotation.status.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-emerald-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <FileText size={100} />
            </div>
            <CardHeader>
              <CardTitle className="text-emerald-100 text-sm font-bold uppercase tracking-wider">Ringkasan Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="flex justify-between text-sm opacity-80">
                <span>Subtotal Item:</span>
                <span>Rp {Number(quotation.subtotal).toLocaleString("id-ID")}</span>
              </div>
              {Number(quotation.discount_amount) > 0 && (
                <div className="flex justify-between text-sm text-red-300">
                  <span>Diskon:</span>
                  <span>- Rp {Number(quotation.discount_amount).toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex justify-between text-sm opacity-80">
                <span>PPN (11%):</span>
                <span>{quotation.use_tax ? `Rp ${Number(quotation.tax_amount).toLocaleString("id-ID")}` : "Non-PPN"}</span>
              </div>
              <div className="border-t border-emerald-800 pt-4 mt-4">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold uppercase opacity-60">Total Akhir</span>
                  <span className="text-2xl font-bold">Rp {Number(quotation.total_amount).toLocaleString("id-ID")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={isDeleting} onOpenChange={(open) => !open && setIsDeleting(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Konfirmasi Hapus
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Apakah Anda yakin ingin menghapus penawaran <strong className="text-slate-900">{quotation?.quotation_number}</strong>?
              <p className="mt-2 text-sm text-amber-600 font-medium">⚠️ Tindakan ini tidak dapat dibatalkan.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={() => setIsDeleting(false)}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
