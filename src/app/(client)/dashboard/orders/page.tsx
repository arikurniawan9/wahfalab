"use client";

import React, { useState, useEffect } from "react";
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
import { 
  Loader2, 
  Search,
  FileDown,
  History,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { getQuotations } from "@/lib/actions/quotation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { QuotationDocument } from "@/components/pdf/QuotationDocument";

export default function OrderHistoryPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // On real production, we would add user_id filter to the server action
      const result = await getQuotations(page, limit, search);
      
      // Client-side filter for demonstration
      const filteredItems = result.items.filter((item: any) => item.user_id === user?.id);
      
      setData({
        ...result,
        items: filteredItems,
        total: filteredItems.length
      });
    } catch (error) {
      toast.error("Gagal memuat riwayat pesanan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadData(), 500);
    return () => clearTimeout(timer);
  }, [page, limit, search]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft": return <Badge variant="outline" className="text-[10px]">MENUNGGU PEMBAYARAN</Badge>;
      case "paid": return <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] font-bold">LUNAS & DIPROSES</Badge>;
      case "completed": return <Badge className="bg-blue-100 text-blue-700 border-none text-[10px] font-bold">SELESAI</Badge>;
      default: return <Badge variant="secondary" className="text-[10px]">{status.toUpperCase()}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-emerald-900 tracking-tight font-[family-name:var(--font-montserrat)] uppercase flex items-center gap-2">
          <History className="h-6 w-6" />
          Riwayat Pesanan
        </h1>
        <p className="text-slate-500 text-xs font-medium">Daftar seluruh transaksi dan sertifikat Anda.</p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b bg-emerald-50/10">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <Input 
              placeholder="Cari nomor faktur..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 focus-visible:ring-emerald-500 rounded-xl"
            />
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="px-6 font-bold text-emerald-900">No. Faktur</TableHead>
                <TableHead className="px-4 font-bold text-emerald-900">Tanggal</TableHead>
                <TableHead className="px-4 font-bold text-emerald-900">Total Biaya</TableHead>
                <TableHead className="px-4 font-bold text-emerald-900">Status</TableHead>
                <TableHead className="px-6 text-center font-bold text-emerald-900">Dokumen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-emerald-600" /></TableCell></TableRow>
              ) : data.items.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-400 italic text-sm">Anda belum memiliki riwayat pesanan.</TableCell></TableRow>
              ) : (
                data.items.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-emerald-50/5 transition-colors">
                    <TableCell className="px-6 font-bold text-emerald-900">{item.quotation_number}</TableCell>
                    <TableCell className="px-4 text-slate-600 text-xs">
                      {new Date(item.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="px-4 font-bold text-slate-900">
                      Rp {Number(item.total_amount).toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="px-4">{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="px-6 text-center">
                      <PDFDownloadLink
                        document={<QuotationDocument data={item} />}
                        fileName={`${item.quotation_number}.pdf`}
                      >
                        {({ loading }) => (
                          <Button variant="ghost" size="sm" className="h-8 text-emerald-600 hover:bg-emerald-50 font-bold text-[10px]" disabled={loading}>
                            <FileDown className="h-3 w-3 mr-1" /> FAKTUR
                          </Button>
                        )}
                      </PDFDownloadLink>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {data.items.map((item: any) => (
            <div key={item.id} className="p-4 space-y-3 bg-white active:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm">{item.quotation_number}</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">
                    {new Date(item.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                {getStatusBadge(item.status)}
              </div>
              <div className="flex justify-between items-center pt-2">
                <p className="text-sm font-bold text-slate-900">Rp {Number(item.total_amount).toLocaleString("id-ID")}</p>
                <PDFDownloadLink
                  document={<QuotationDocument data={item} />}
                  fileName={`${item.quotation_number}.pdf`}
                >
                  <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold border-emerald-100 text-emerald-700">
                    <FileDown className="h-3 w-3 mr-1" /> UNDUH FAKTUR
                  </Button>
                </PDFDownloadLink>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Simple */}
        <div className="p-4 border-t flex items-center justify-between bg-slate-50/50">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Halaman {page} dari {data.pages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
