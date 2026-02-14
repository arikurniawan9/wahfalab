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
import { 
  Plus, 
  Loader2, 
  Search,
  Eye,
  FileText,
  CreditCard,
  CheckCircle2,
  Clock,
  TestTube,
  Truck,
  FileCheck,
  Trash2,
  UserPlus,
  FileDown,
  MessageSquare,
  Banknote
} from "lucide-react";
import { getQuotations, createQuotation, processPayment, getNextInvoiceNumber } from "@/lib/actions/quotation";
import { getJobOrders, updateJobStatus } from "@/lib/actions/jobs";
import { getClients, createOrUpdateUser } from "@/lib/actions/users";
import { getAllServices } from "@/lib/actions/services";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { QuotationDocument } from "@/components/pdf/QuotationDocument";
import { Textarea } from "@/components/ui/textarea";

const quotationSchema = z.object({
  quotation_number: z.string().min(1, "Wajib diisi"),
  user_id: z.string().min(1, "Pilih pelanggan"),
  items: z.array(z.object({
    service_id: z.string().min(1),
    qty: z.number().min(1),
    price: z.number().min(0),
  })).min(1, "Minimal 1 item"),
});

export default function OperatorJobsPage() {
  const [activeTab, setActiveTab] = useState("registrasi");
  const [quotations, setQuotations] = useState<any>({ items: [], total: 0 });
  const [jobs, setJobs] = useState<any>({ items: [], total: 0 });
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  
  // Modals
  const [isRegDialogOpen, setIsRegDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [nextStatus, setNextStatus] = useState<string>("");
  const [statusNote, setStatusNote] = useState<string>("");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  const { register, control, handleSubmit, watch, setValue, reset } = useForm({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      quotation_number: `INV-${Date.now()}`,
      user_id: "",
      items: [{ service_id: "", qty: 1, price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const total = watchedItems.reduce((acc, item) => acc + (item.qty * item.price), 0) * 1.11;

  const loadData = async (searchQuery: string = search) => {
    setLoading(true);
    try {
      const [qResult, jResult, cResult, sResult] = await Promise.all([
        getQuotations(1, 100, searchQuery),
        getJobOrders(1, 100, searchQuery),
        getClients(),
        getAllServices()
      ]);
      setQuotations(qResult);
      setJobs(jResult);
      setClients(cResult);
      setServices(sResult);
    } catch (error) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isRegDialogOpen) {
      getNextInvoiceNumber().then(num => setValue("quotation_number", num));
    }
  }, [isRegDialogOpen, setValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const onRegisterSubmit = async (formData: any) => {
    setSubmitting(true);
    try {
      await createQuotation({ ...formData, subtotal: total/1.11, tax_amount: total*0.11, total_amount: total });
      toast.success("Draft pendaftaran disimpan");
      setIsRegDialogOpen(false);
      reset();
      loadData();
    } catch (error) {
      toast.error("Gagal menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async (method: string) => {
    setSubmitting(true);
    try {
      await processPayment(selectedQuotation.id, method);
      toast.success(`Pembayaran ${method} Berhasil!`);
      setIsPaymentDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error("Gagal memproses pembayaran");
    } finally {
      setSubmitting(false);
    }
  };

  const openStatusDialog = (job: any, status: string) => {
    setSelectedJob(job);
    setNextStatus(status);
    setStatusNote("");
    setIsStatusDialogOpen(true);
  };

  const confirmStatusUpdate = async () => {
    setSubmitting(true);
    try {
      let certificateUrl = null;

      // Jika status diset Selesai, unggah file sertifikat
      if (nextStatus === 'completed' && certificateFile) {
        const fileExt = certificateFile.name.split('.').pop();
        const fileName = `${selectedJob.tracking_code}-${Date.now()}.${fileExt}`;
        const filePath = `certificates/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('lab-documents') // Nama bucket di Supabase
          .upload(filePath, certificateFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('lab-documents')
          .getPublicUrl(filePath);
        
        certificateUrl = publicUrl;
      }

      await updateJobStatus(selectedJob.id, nextStatus, statusNote);
      
      // Jika ada URL sertifikat, simpan ke database (buat action baru jika perlu, tapi kita bisa update JobOrder)
      if (certificateUrl) {
        const { uploadCertificate } = await import("@/lib/actions/jobs");
        await uploadCertificate(selectedJob.id, certificateUrl);
      }

      toast.success(`Status ${selectedJob.tracking_code} berhasil diperbarui`);
      setIsStatusDialogOpen(false);
      setCertificateFile(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Gagal memperbarui status");
    } finally {
      setSubmitting(false);
    }
  };

  // Handler Customer Baru
  const onUserSubmit = async (formData: any) => {
    setSubmitting(true);
    try {
      await createOrUpdateUser({ ...formData, role: 'client' });
      toast.success("Customer baru didaftarkan");
      setIsUserDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Gagal");
    } finally {
      setSubmitting(false);
    }
  };

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled": return <Badge className="bg-slate-100 text-slate-600 border-none">DIJADWALKAN</Badge>;
      case "sampling": return <Badge className="bg-blue-100 text-blue-700 border-none">SAMPLING</Badge>;
      case "analysis": return <Badge className="bg-amber-100 text-amber-700 border-none">ANALISIS</Badge>;
      case "reporting": return <Badge className="bg-indigo-100 text-indigo-700 border-none">PELAPORAN</Badge>;
      case "completed": return <Badge className="bg-emerald-100 text-emerald-700 border-none">SELESAI</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-900 tracking-tight font-[family-name:var(--font-montserrat)]">Pekerjaan Lab</h1>
        <p className="text-slate-500 text-sm">Kelola pendaftaran dan pantau progres uji laboratorium.</p>
      </div>

      <Tabs defaultValue="registrasi" className="space-y-6">
        <TabsList className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
          <TabsTrigger value="registrasi" className="rounded-xl px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Pendaftaran & Kasir</TabsTrigger>
          <TabsTrigger value="tracking" className="rounded-xl px-6 py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Progres Pekerjaan</TabsTrigger>
        </TabsList>

        <TabsContent value="registrasi">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Daftar Faktur</h2>
            <Button onClick={() => setIsRegDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"><Plus className="mr-2 h-4 w-4" /> Pendaftaran Baru</Button>
          </div>
          <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-slate-50/50">
                <TableHead className="px-6 font-bold text-emerald-900">No. Faktur</TableHead>
                <TableHead className="px-4 font-bold text-emerald-900">Customer</TableHead>
                <TableHead className="px-4 font-bold text-emerald-900">Status</TableHead>
                <TableHead className="px-6 text-center font-bold text-emerald-900">Aksi</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                : quotations.items.map((item: any) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/50">
                    <TableCell className="px-6 font-bold text-emerald-900">{item.quotation_number}</TableCell>
                    <TableCell className="px-4">
                      <p className="font-medium">{item.profile.full_name}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{item.profile.company_name || "Personal"}</p>
                    </TableCell>
                    <TableCell className="px-4">{item.status === 'paid' ? <Badge className="bg-emerald-500 text-white border-none">LUNAS</Badge> : <Badge variant="outline">DRAFT</Badge>}</TableCell>
                    <TableCell className="px-6 text-center">
                      <div className="flex justify-center gap-2">
                        {item.status === 'draft' && <Button size="sm" className="bg-amber-500 hover:bg-amber-600 h-8" onClick={() => { setSelectedQuotation(item); setIsPaymentDialogOpen(true); }}><CreditCard className="h-3 w-3 mr-1" /> Bayar</Button>}
                        {item.items && (
                          <PDFDownloadLink document={<QuotationDocument data={item} />} fileName={`${item.quotation_number}.pdf`}>
                            {({ loading }) => <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" disabled={loading}><FileDown className="h-4 w-4" /></Button>}
                          </PDFDownloadLink>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="tracking">
          <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-slate-50/50">
                <TableHead className="px-6 font-bold text-emerald-900">Kode Tracking</TableHead>
                <TableHead className="px-4 font-bold text-emerald-900">Pekerjaan</TableHead>
                <TableHead className="px-4 font-bold text-emerald-900 text-center">Progres</TableHead>
                <TableHead className="px-6 text-center font-bold text-emerald-900">Update Progres</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-emerald-600" /></TableCell></TableRow>
                : jobs.items.map((job: any) => (
                  <TableRow key={job.id} className="hover:bg-slate-50/50">
                    <TableCell className="px-6 font-mono font-bold text-emerald-700">{job.tracking_code}</TableCell>
                    <TableCell className="px-4">
                      <p className="font-bold text-slate-800">{job.quotation.items[0]?.service?.name || 'Uji Lab'}</p>
                      <p className="text-[10px] text-slate-400 uppercase">Customer: {job.quotation.profile.full_name}</p>
                    </TableCell>
                    <TableCell className="px-4 text-center">{getJobStatusBadge(job.status)}</TableCell>
                    <TableCell className="px-6 text-center">
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" title="Sampling" className={job.status === 'sampling' ? 'text-blue-600 bg-blue-50' : 'text-slate-300'} onClick={() => openStatusDialog(job, 'sampling')}><Truck className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Analisis" className={job.status === 'analysis' ? 'text-amber-600 bg-amber-50' : 'text-slate-300'} onClick={() => openStatusDialog(job, 'analysis')}><TestTube className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Reporting" className={job.status === 'reporting' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300'} onClick={() => openStatusDialog(job, 'reporting')}><FileText className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Selesai" className={job.status === 'completed' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300'} onClick={() => openStatusDialog(job, 'completed')}><FileCheck className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Update Status dengan Catatan */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-emerald-900">Update Progres Kerja</DialogTitle>
            <DialogDescription>Masukkan catatan pengerjaan untuk status <span className="font-bold uppercase text-emerald-600">{nextStatus}</span></DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-400" />
                Catatan / Bukti Pengerjaan
              </label>
              <Textarea 
                placeholder="Misal: Sampel telah diambil di titik koordinat A..." 
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="min-h-[120px] rounded-2xl focus-visible:ring-emerald-500 border-slate-200"
              />
            </div>

            {nextStatus === 'completed' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <FileDown className="h-4 w-4 text-emerald-600" />
                  Unggah Sertifikat PDF
                </label>
                <div className="border-2 border-dashed border-emerald-100 rounded-2xl p-6 text-center hover:bg-emerald-50 transition-colors">
                  <input 
                    type="file" 
                    accept=".pdf" 
                    onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                    className="hidden" 
                    id="cert-upload"
                  />
                  <label htmlFor="cert-upload" className="cursor-pointer">
                    {certificateFile ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold">
                        <FileCheck className="h-5 w-5" />
                        {certificateFile.name}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm text-slate-600 font-medium">Klik untuk pilih file sertifikat</p>
                        <p className="text-[10px] text-slate-400">Hanya file PDF (Maks. 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)} className="rounded-xl">Batal</Button>
            <Button onClick={confirmStatusUpdate} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-8" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan Progres"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Pendaftaran Baru & Pembayaran (Sama seperti sebelumnya) */}
      <Dialog open={isRegDialogOpen} onOpenChange={setIsRegDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-emerald-900 flex items-center gap-2"><FileText className="h-5 w-5" /> Pendaftaran Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onRegisterSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">No. Faktur</label>
                <Input {...register("quotation_number")} placeholder="Otomatis..." readOnly className="bg-slate-50 font-mono font-bold text-emerald-700" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between"><label className="text-xs font-bold text-slate-400 uppercase">Customer</label><button type="button" onClick={() => setIsUserDialogOpen(true)} className="text-[10px] text-emerald-600 font-bold hover:underline">Customer Baru</button></div>
                <Select onValueChange={(val) => setValue("user_id", val)} key={clients.length}>
                  <SelectTrigger className="cursor-pointer"><SelectValue placeholder="Pilih Customer" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b pb-2"><h3 className="text-sm font-bold text-emerald-800">Daftar Layanan</h3><Button type="button" variant="outline" size="sm" onClick={() => append({ service_id: "", qty: 1, price: 0 })}>+ Item</Button></div>
              {fields.map((f, i) => (
                <div key={f.id} className="flex gap-2 items-end bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <Select onValueChange={(v) => { const s = services.find(x => x.id === v); setValue(`items.${i}.service_id`, v); setValue(`items.${i}.price`, Number(s.price)); }}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Pilih Layanan" /></SelectTrigger>
                      <SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>[{s.category_ref?.name || s.category}] {s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Input type="number" {...register(`items.${i}.qty`, { valueAsNumber: true })} className="w-20 bg-white" />
                  <Button type="button" variant="ghost" className="text-red-400" onClick={() => remove(i)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
            <DialogFooter className="pt-4"><Button type="submit" className="bg-emerald-600 w-full h-12 rounded-xl shadow-lg shadow-emerald-100" disabled={submitting}>Simpan Draft Pendaftaran</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl">
          <DialogHeader><DialogTitle className="text-emerald-900 flex items-center gap-2"><UserPlus className="h-5 w-5" /> Customer Baru</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); onUserSubmit(Object.fromEntries(new FormData(e.currentTarget))); }} className="space-y-4 py-4">
            <Input name="full_name" placeholder="Nama Lengkap" required />
            <Input name="email" type="email" placeholder="Email" required />
            <Input name="company_name" placeholder="Nama Perusahaan" />
            <Input name="password" type="password" defaultValue="user123456" />
            <DialogFooter className="pt-4"><Button type="submit" className="w-full bg-emerald-600 rounded-xl h-11" disabled={submitting}>Daftarkan Customer</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl">
          <DialogHeader><DialogTitle className="text-xl font-bold text-emerald-900">Konfirmasi Pembayaran</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-6">
            <Button variant="outline" className="h-24 flex flex-col gap-2 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50" onClick={() => handlePayment('Tunai')}><Banknote className="h-8 w-8 text-emerald-600" /><span>Tunai</span></Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2 rounded-2xl hover:border-blue-500 hover:bg-blue-50" onClick={() => handlePayment('Transfer')}><CreditCard className="h-8 w-8 text-blue-600" /><span>Transfer</span></Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
