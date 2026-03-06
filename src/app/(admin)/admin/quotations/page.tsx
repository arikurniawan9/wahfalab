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
  MapPin
} from "lucide-react";
import { LoadingOverlay, LoadingButton } from "@/components/ui";
import { TableSkeleton } from "@/components/ui/skeleton";
import { 
  getQuotations, 
  deleteQuotation, 
  createQuotation, 
  deleteManyQuotations, 
  getNextInvoiceNumber,
  cloneQuotation,
  updateQuotationStatus
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { QuotationForm } from "@/components/admin/quotations/QuotationForm";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
          <p className="text-lg font-black tracking-tight leading-none">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const statusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "draft", label: "Draft" },
  { value: "accepted", label: "Diterima" },
  { value: "rejected", label: "Ditolak" },
  { value: "paid", label: "Dibayar" }
];

export default function QuotationListPage() {
  const [data, setData] = useState<any>({ items: [], total: 0, pages: 1 });
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [operationalCatalogs, setOperationalCatalogs] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [nextQuoNum, setNextQuoNum] = useState("INV-");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [qResult, cResult, sResult, oResult, eResult, nextNum] = await Promise.all([
        getQuotations({ page, limit, search, status: filterStatus === "all" ? undefined : filterStatus }),
        getClients(),
        getAllServices(),
        getAllOperationalCatalogs(),
        getAllEquipment(),
        getNextInvoiceNumber()
      ]);
      
      setData(qResult);
      setClients(cResult);
      setServices(sResult);
      setOperationalCatalogs(oResult);
      setEquipment(eResult);
      setNextQuoNum(nextNum);
      setSelectedIds([]);
    } catch (error: any) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportCSV = () => {
    if (data.items.length === 0) return toast.error("Tidak ada data");
    const headers = ["No Penawaran", "Klien", "Perusahaan", "Total", "Status"];
    const rows = data.items.map((i: any) => [i.quotation_number, i.profile.full_name, i.profile.company_name, i.total_amount, i.status]);
    const csv = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map((e: any) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `quotations_${Date.now()}.csv`;
    link.click();
  };

  const handleCreateQuotation = async (formData: any) => {
    setSubmitting(true);
    try {
      const result = await createQuotation(formData);
      if (result.success) {
        toast.success("Penawaran berhasil disimpan");
        setIsDialogOpen(false);
        loadData();
      }
    } catch (error: any) {
      toast.error("Gagal menyimpan penawaran");
    } finally {
      setSubmitting(false);
    }
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

  const [customerData, setCustomerData] = useState({ full_name: "", email: "", company_name: "", address: "" });
  const handleCreateCustomer = async () => {
    if (!customerData.full_name || !customerData.email) return toast.error("Nama & Email wajib");
    setSubmitting(true);
    try {
      await createOrUpdateUser({ ...customerData, role: 'client', password: 'password123' });
      toast.success("Customer ditambahkan");
      setIsCustomerDialogOpen(false);
      setCustomerData({ full_name: "", email: "", company_name: "", address: "" });
      const cResult = await getClients();
      setClients(cResult);
    } catch (error: any) {
      toast.error("Gagal tambah customer");
    } finally {
      setSubmitting(false);
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

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 bg-slate-50/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Penawaran Harga</h1>
          <p className="text-slate-500 text-xs font-medium">Manajemen dokumen penawaran klien laboratorium.</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard title="Total" value={data.total} icon={FileText} color="emerald" />
        <StatCard title="Draft" value={data.items.filter((i: any) => i.status === 'draft').length} icon={Clock} color="amber" />
        <StatCard title="Diterima" value={data.items.filter((i: any) => i.status === 'accepted').length} icon={CheckCircle} color="blue" />
        <StatCard title="Ditolak" value={data.items.filter((i: any) => i.status === 'rejected').length} icon={XCircle} color="red" />
        <StatCard title="Lunas" value={data.items.filter((i: any) => i.status === 'paid').length} icon={DollarSign} color="purple" />
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-4 border-b flex flex-col md:flex-row gap-4 items-center bg-white">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Cari nomor atau klien..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 h-10 bg-slate-50 border-none rounded-xl text-xs font-medium"
            />
          </div>
          
          <TooltipProvider>
            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
              <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setPage(1); }}>
                <SelectTrigger className="w-full md:w-40 h-10 rounded-xl border-slate-100 bg-slate-50 font-bold uppercase text-[9px] tracking-widest">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-emerald-50">
                  {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value} className="text-[9px] font-bold uppercase">{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>

              {selectedIds.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="destructive" onClick={() => setDeleteId("bulk")} className="h-10 px-4 rounded-xl animate-in zoom-in duration-300 font-black text-[10px] gap-2">
                      <Trash2 className="h-4 w-4" />
                      <span>{selectedIds.length}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-[10px] font-bold uppercase">Hapus Semua Terpilih</p></TooltipContent>
                </Tooltip>
              )}

              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleExportCSV} className="h-10 w-10 p-0 rounded-xl border-slate-200 bg-white hover:bg-slate-50 transition-all">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-[10px] font-bold uppercase">Export ke CSV</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={async () => { 
                      const num = await getNextInvoiceNumber();
                      setNextQuoNum(num);
                      setIsDialogOpen(true); 
                    }} className="h-10 w-10 p-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/10 active:scale-95 transition-all">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-[10px] font-bold uppercase">Buat Penawaran Baru</p></TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100">
                <TableHead className="w-12 pl-6"><Checkbox checked={data.items.length > 0 && selectedIds.length === data.items.length} onCheckedChange={toggleSelectAll} /></TableHead>
                <TableHead className="px-4 py-4 font-black uppercase tracking-widest text-[9px] text-slate-400">No. Penawaran</TableHead>
                <TableHead className="px-4 py-4 font-black uppercase tracking-widest text-[9px] text-slate-400">Informasi Klien</TableHead>
                <TableHead className="px-4 py-4 font-black uppercase tracking-widest text-[9px] text-slate-400 text-right">Tagihan</TableHead>
                <TableHead className="px-4 py-4 font-black uppercase tracking-widest text-[9px] text-slate-400 text-center">Status</TableHead>
                <TableHead className="px-6 py-4 font-black uppercase tracking-widest text-[9px] text-slate-400 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="p-0"><TableSkeleton rows={limit} className="p-6" /></TableCell></TableRow>
              ) : data.items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-24"><FileText className="h-10 w-10 text-slate-100 mx-auto mb-3" /><p className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Data tidak ditemukan</p></TableCell></TableRow>
              ) : (
                data.items.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-emerald-50/20 transition-all group">
                    <TableCell className="pl-6"><Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={() => toggleSelect(item.id)} /></TableCell>
                    <TableCell className="font-bold text-slate-900 px-4">{item.quotation_number}</TableCell>
                    <TableCell className="px-4">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-700 uppercase tracking-tighter text-[11px]">{item.profile.full_name}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">{item.profile.company_name || "PERSONAL"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-black text-emerald-700 px-4 text-xs">Rp {Number(item.total_amount).toLocaleString("id-ID")}</TableCell>
                    <TableCell className="px-4 text-center">
                      <Badge variant="outline" className={cn("text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase", 
                        item.status === 'draft' ? "bg-amber-50 text-amber-700 border-amber-100 animate-pulse" : 
                        item.status === 'accepted' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-500")}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center px-6">
                      <div className="flex justify-center gap-1.5">
                        <Link href={`/admin/quotations/${item.id}`}><Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-slate-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"><Eye className="h-3.5 w-3.5" /></Button></Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-emerald-600"><MoreVertical className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl border-emerald-50 shadow-xl">
                            <DropdownMenuItem onClick={() => cloneQuotation(item.id).then(() => loadData())} className="rounded-lg p-2 text-[9px] font-bold uppercase tracking-widest"><Copy className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Duplikasi</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusUpdate(item.id, 'accepted')} className="rounded-lg p-2 text-[9px] font-bold uppercase tracking-widest"><CheckCircle className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Terima</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(item.id, 'rejected')} className="rounded-lg p-2 text-[9px] font-bold uppercase tracking-widest text-rose-600"><XCircle className="mr-2 h-3.5 w-3.5" /> Tolak</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteId(item.id)} className="rounded-lg p-2 text-[9px] font-bold uppercase tracking-widest text-rose-600"><Trash2 className="mr-2 h-3.5 w-3.5" /> Hapus</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 border-t flex items-center justify-between bg-slate-50/50">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total {data.total} Data</p>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-white border-slate-200" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
            <div className="flex items-center px-4 text-[9px] font-black bg-white border border-slate-200 rounded-lg text-emerald-900 tracking-widest">{page} / {data.pages}</div>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg bg-white border-slate-200" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </div>

      {/* RENDER MODAL COMPONENT */}
      <QuotationForm 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleCreateQuotation}
        clients={clients}
        services={services}
        operationalCatalogs={operationalCatalogs}
        equipment={equipment}
        nextQuotationNumber={nextQuoNum}
        isSubmitting={submitting}
        onAddCustomer={() => setIsCustomerDialogOpen(true)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-6">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100"><Trash2 className="h-6 w-6" /></div>
            <AlertDialogTitle className="text-lg font-black uppercase text-center text-slate-900">Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-500 text-xs py-2">Data yang sudah dihapus tidak dapat dikembalikan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl h-10 flex-1 font-bold text-slate-400 uppercase text-[9px]">Batal</AlertDialogCancel>
            <Button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 rounded-xl h-10 flex-1 font-black text-white uppercase text-[9px] shadow-lg shadow-rose-900/20">Ya, Hapus</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ADD CUSTOMER MODAL - COMPACT & RESPONSIVE VERSION */}
      <AlertDialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <AlertDialogContent className="max-w-[400px] w-[90vw] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-600 p-4 text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center border border-white/20">
              <UserPlus className="h-4 w-4" />
            </div>
            <div>
              <AlertDialogTitle className="text-sm font-black uppercase tracking-widest leading-none">Registrasi Klien</AlertDialogTitle>
              <p className="text-[8px] text-emerald-100 font-bold uppercase mt-1 opacity-70">Input data profil pelanggan baru</p>
            </div>
          </div>

          <div className="p-5 space-y-4 bg-white max-h-[70vh] overflow-y-auto">
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3">
              <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <p className="text-[10px] font-bold text-amber-700 leading-tight">
                Password default: <span className="bg-amber-200 px-1.5 py-0.5 rounded font-black text-amber-900">123456</span>
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                  <User className="h-2.5 w-2.5 text-emerald-500" /> Nama Lengkap *
                </label>
                <Input 
                  placeholder="Nama lengkap klien..." 
                  value={customerData.full_name} 
                  onChange={(e) => setCustomerData({...customerData, full_name: e.target.value})} 
                  className="h-9 rounded-xl bg-slate-50 border-none font-bold text-[11px] focus-visible:ring-emerald-500 transition-all px-4" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                  <Mail className="h-2.5 w-2.5 text-emerald-500" /> Alamat Email *
                </label>
                <Input 
                  type="email" 
                  placeholder="email@example.com" 
                  value={customerData.email} 
                  onChange={(e) => setCustomerData({...customerData, email: e.target.value})} 
                  className="h-9 rounded-xl bg-slate-50 border-none font-bold text-[11px] focus-visible:ring-emerald-500 transition-all px-4" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                  <Building2 className="h-2.5 w-2.5 text-emerald-500" /> Nama Perusahaan
                </label>
                <Input 
                  placeholder="PT / CV / Instansi..." 
                  value={customerData.company_name} 
                  onChange={(e) => setCustomerData({...customerData, company_name: e.target.value})} 
                  className="h-9 rounded-xl bg-slate-50 border-none font-bold text-[11px] focus-visible:ring-emerald-500 transition-all px-4" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                  <MapPin className="h-2.5 w-2.5 text-emerald-500" /> Alamat Lengkap
                </label>
                <Input 
                  placeholder="Alamat kantor / rumah..." 
                  value={customerData.address} 
                  onChange={(e) => setCustomerData({...customerData, address: e.target.value})} 
                  className="h-9 rounded-xl bg-slate-50 border-none font-bold text-[11px] focus-visible:ring-emerald-500 transition-all px-4" 
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
            <AlertDialogCancel className="rounded-xl h-10 flex-1 font-black text-slate-400 uppercase text-[9px] border-none hover:bg-slate-200 transition-all">Batal</AlertDialogCancel>
            <LoadingButton 
              loading={submitting} 
              onClick={handleCreateCustomer} 
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-10 flex-1 font-black text-white uppercase text-[9px] shadow-md shadow-emerald-900/10 active:scale-95 transition-all"
            >
              SIMPAN KLIEN
            </LoadingButton>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <LoadingOverlay isOpen={submitting || deleting} title="Sinkronisasi Database..." />
    </div>
  );
}
