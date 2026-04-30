"use client";

import React from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Eye,
  Download,
  Printer,
  Copy,
  Trash2,
  CheckCircle,
  XCircle,
  Send,
  FileText,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  Clock,
  Car
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { statusConfig } from "./constants";
import { Card, CardContent } from "@/components/ui/card";

interface QuotationTableProps {
  data: any;
  loading: boolean;
  refreshing: boolean;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
  searchInput: string;
  setSearchInput: (val: string) => void;
  filterStatus: string;
  setFilterStatus: (val: string) => void;
  onRefresh: () => void;
  onStatusUpdate: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onClone: (id: string) => void;
  onPublishInvoice: (id: string) => void;
  onSendToReporting: (id: string) => void;
  publishingInvoice: boolean;
  sendingToReportingId: string | null;
}

export function QuotationTable({
  data,
  loading,
  refreshing,
  page,
  setPage,
  limit,
  setLimit,
  searchInput,
  setSearchInput,
  filterStatus,
  setFilterStatus,
  onRefresh,
  onStatusUpdate,
  onDelete,
  onClone,
  onPublishInvoice,
  onSendToReporting,
  publishingInvoice,
  sendingToReportingId
}: QuotationTableProps) {
  
  const filteredItems = filterStatus === "all" 
    ? data.items 
    : data.items.filter((i: any) => i.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <Card className="shadow-xl shadow-slate-200/50 border-none rounded-[2rem] overflow-hidden bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full lg:w-auto">
              <div className="relative group w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  placeholder="Cari nomor atau klien..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-12 h-12 bg-slate-50 border-none rounded-xl font-bold text-xs focus-visible:ring-emerald-500 transition-all"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-12 w-full sm:w-48 bg-slate-50 border-none rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 px-6">
                  <SelectValue placeholder="STATUS" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 font-bold text-xs">
                  <SelectItem value="all">SEMUA STATUS</SelectItem>
                  <SelectItem value="draft">DRAFT</SelectItem>
                  <SelectItem value="sent">DIKIRIM</SelectItem>
                  <SelectItem value="accepted">DITERIMA</SelectItem>
                  <SelectItem value="rejected">DITOLAK</SelectItem>
                  <SelectItem value="paid">LUNAS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh} 
                disabled={refreshing}
                className="rounded-xl border-slate-100 bg-white shadow-sm h-12 px-6 font-black text-[10px] uppercase tracking-widest gap-2 hover:bg-emerald-50 hover:text-emerald-600 transition-all flex-1 lg:flex-none"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} /> {refreshing ? "SINKRON..." : "REFRESH"}
              </Button>
              <div className="flex items-center bg-slate-50 rounded-xl p-1 shadow-inner h-12">
                <Button variant="ghost" size="icon" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="h-10 w-10 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-white"><ChevronLeft className="h-5 w-5" /></Button>
                <div className="px-4 text-[10px] font-black text-emerald-950 uppercase tracking-tighter">HALAMAN {page} DARI {data.pages || 1}</div>
                <Button variant="ghost" size="icon" onClick={() => setPage(Math.min(data.pages || 1, page + 1))} disabled={page >= (data.pages || 1)} className="h-10 w-10 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-white"><ChevronRight className="h-5 w-5" /></Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Container */}
      <Card className="shadow-2xl shadow-slate-200/50 border-none rounded-[2.5rem] overflow-hidden bg-white">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-none bg-slate-50/50 h-16">
                <TableHead className="font-black text-[10px] uppercase text-slate-400 pl-10">Penawaran & Klien</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-400 text-center">Status</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-400">Total Biaya</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-400">Order Terkait</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-400 text-right pr-10">Opsi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-50">
              {filteredItems.map((item: any) => {
                const config = statusConfig[item.status] || statusConfig.draft;
                const jobOrder = item.job_orders?.[0];
                const invoice = jobOrder?.invoice;

                return (
                  <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-all border-none">
                    <TableCell className="pl-10 py-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 shadow-sm">{item.quotation_number}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <div className="font-black text-slate-800 text-sm uppercase leading-none tracking-tight">{item.profile?.company_name || item.profile?.full_name || "-"}</div>
                        {item.title && <div className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1.5 uppercase italic"><FileText className="h-3 w-3 opacity-50" /> {item.title}</div>}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 gap-3 group-hover:bg-white transition-all shadow-sm">
                        <config.icon className={cn("h-4 w-4", config.color)} />
                        <span className={cn("font-black text-[10px] uppercase tracking-widest", config.color)}>{config.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 tracking-tighter">Rp {Number(item.total_amount).toLocaleString('id-ID')}</span>
                        <div className="flex items-center gap-1.5 mt-1.5 opacity-60">
                          <Badge variant="outline" className="text-[8px] font-black border-slate-100 px-1.5">{item.items?.length || 0} ITEM</Badge>
                          {item.use_tax && <Badge variant="outline" className="text-[8px] font-black bg-blue-50 text-blue-600 border-none px-1.5">PPN</Badge>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {jobOrder ? (
                        <div className="flex flex-col gap-2">
                           <div className="flex items-center gap-2">
                              <Badge className="bg-emerald-950 text-emerald-400 border-none font-mono text-[9px] px-2 py-1 rounded-lg">#{jobOrder.tracking_code}</Badge>
                              <Badge className={cn("text-[8px] font-black uppercase border-none px-2", 
                                jobOrder.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              )}>{jobOrder.status}</Badge>
                           </div>
                           {invoice && (
                              <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg w-fit">
                                <DollarSign className="h-3 w-3 text-emerald-600" />
                                <span className="text-[9px] font-black text-slate-500 uppercase">{invoice.invoice_number}</span>
                                <Badge className={cn("text-[7px] border-none px-1.5 leading-none", 
                                  invoice.status === 'paid' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                                )}>{invoice.status}</Badge>
                              </div>
                           )}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300 uppercase italic tracking-widest opacity-60">No Active Order</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all"><MoreVertical className="h-5 w-5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl border-slate-100 shadow-2xl z-50">
                          <div className="px-3 py-2 border-b border-slate-50 mb-2">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Main Actions</p>
                          </div>
                          <Link href={`/operator/quotations/${item.id}`} passHref>
                            <DropdownMenuItem className="rounded-xl py-3 focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer transition-all">
                              <Eye className="h-4 w-4 mr-3 opacity-70" /> <span className="text-xs font-black uppercase">Detail & Review</span>
                            </DropdownMenuItem>
                          </Link>
                          
                          <DropdownMenuItem 
                            onClick={() => window.open(`/api/pdf/quotation/${item.id}`, '_blank')}
                            className="rounded-xl py-3 focus:bg-slate-50 cursor-pointer transition-all"
                          >
                            <Download className="h-4 w-4 mr-3 opacity-70" /> <span className="text-xs font-black uppercase">Unduh PDF</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem 
                            onClick={() => onClone(item.id)}
                            className="rounded-xl py-3 focus:bg-slate-50 cursor-pointer transition-all"
                          >
                            <Copy className="h-4 w-4 mr-3 opacity-70" /> <span className="text-xs font-black uppercase">Duplikasi (Clone)</span>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="my-2 bg-slate-50" />
                          <div className="px-3 py-2 mb-1">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status Workflow</p>
                          </div>
                          
                          {item.status === 'draft' && (
                             <DropdownMenuItem onClick={() => onStatusUpdate(item.id, 'sent')} className="rounded-xl py-3 text-blue-600 focus:bg-blue-50 focus:text-blue-700 font-bold uppercase text-[10px] cursor-pointer">
                                <Send className="h-3.5 w-3.5 mr-3" /> Tandai Terkirim (Sent)
                             </DropdownMenuItem>
                          )}
                          
                          {item.status === 'sent' && (
                             <DropdownMenuItem onClick={() => onStatusUpdate(item.id, 'accepted')} className="rounded-xl py-3 text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 font-bold uppercase text-[10px] cursor-pointer">
                                <CheckCircle className="h-3.5 w-3.5 mr-3" /> Terima (Accepted)
                             </DropdownMenuItem>
                          )}
                          
                          {item.status === 'sent' && (
                             <DropdownMenuItem onClick={() => onStatusUpdate(item.id, 'rejected')} className="rounded-xl py-3 text-rose-600 focus:bg-rose-50 focus:text-rose-700 font-bold uppercase text-[10px] cursor-pointer">
                                <XCircle className="h-3.5 w-3.5 mr-3" /> Tolak (Rejected)
                             </DropdownMenuItem>
                          )}

                          {item.status === 'accepted' && !invoice && (
                             <DropdownMenuItem 
                                onClick={() => onPublishInvoice(item.id)}
                                disabled={publishingInvoice}
                                className="rounded-xl py-3 text-amber-600 focus:bg-amber-50 focus:text-amber-700 font-bold uppercase text-[10px] cursor-pointer"
                             >
                                <DollarSign className="h-3.5 w-3.5 mr-3" /> {publishingInvoice ? "Memproses..." : "Terbitkan Invoice"}
                             </DropdownMenuItem>
                          )}

                          {item.status === 'accepted' && jobOrder?.status === 'scheduled' && (
                             <DropdownMenuItem 
                                onClick={() => onSendToReporting(item.id)}
                                disabled={sendingToReportingId === item.id}
                                className="rounded-xl py-3 text-violet-600 focus:bg-violet-50 focus:text-violet-700 font-bold uppercase text-[10px] cursor-pointer"
                             >
                                <RefreshCw className={cn("h-3.5 w-3.5 mr-3", sendingToReportingId === item.id && "animate-spin")} /> {sendingToReportingId === item.id ? "Memproses..." : "Direct Reporting"}
                             </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator className="my-2 bg-slate-50" />
                          <DropdownMenuItem onClick={() => onDelete(item.id)} className="rounded-xl py-3 text-rose-500 focus:bg-rose-50 focus:text-rose-600 cursor-pointer transition-all">
                            <Trash2 className="h-4 w-4 mr-3 opacity-70" /> <span className="text-xs font-black uppercase tracking-widest">Hapus Permanen</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-32 text-center bg-slate-50/20">
                     <div className="flex flex-col items-center justify-center">
                        <div className="h-24 w-24 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center mb-6 group hover:scale-110 transition-all border border-slate-100">
                          <FileText className="h-10 w-10 text-slate-100 group-hover:text-emerald-100 transition-colors" />
                        </div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Data Kosong</h3>
                        <p className="text-[9px] font-bold text-slate-300 mt-3 uppercase tracking-[0.2em] max-w-[250px] mx-auto leading-relaxed">
                          Tidak ditemukan data penawaran yang sesuai dengan kriteria filter saat ini.
                        </p>
                     </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
