"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Users,
  Wand2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChemicalLoader } from "@/components/ui";
import { toast } from "sonner";
import { createSamplingAssignment } from "@/lib/actions/sampling";
import { getFieldOfficers, getJobOrderById, sendTravelOrderToField } from "@/lib/actions/jobs";
import { getFieldAssistants } from "@/lib/actions/field-assistant";
import { cn } from "@/lib/utils";
import { getDisplayJobNotes } from "@/lib/job-notes";

const statusLabel: Record<string, string> = {
  scheduled: "Terjadwal",
  sampling: "Sampling",
  analysis_ready: "Siap Analisis",
  analysis: "Analisis",
  analysis_done: "Selesai Analisis",
  reporting: "Pelaporan",
  completed: "Selesai",
  pending_payment: "Menunggu Pembayaran",
  paid: "Lunas",
};

const workflowSteps = [
  { key: "scheduled", label: "Penjadwalan" },
  { key: "sampling", label: "Sampling" },
  { key: "analysis_ready", label: "Siap Analisis" },
  { key: "analysis", label: "Analisis" },
  { key: "analysis_done", label: "Selesai Analisis" },
  { key: "reporting", label: "Pelaporan" },
  { key: "completed", label: "Selesai" }
];

export default function AdminJobDetailPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [sendingTravelOrder, setSendingTravelOrder] = useState(false);
  const [fieldOfficers, setFieldOfficers] = useState<any[]>([]);
  const [assistants, setAssistants] = useState<any[]>([]);
  const [assignDialogLoading, setAssignDialogLoading] = useState(false);
  const [assignForm, setAssignForm] = useState({
    field_officer_id: "",
    assistant_ids: [] as string[],
    scheduled_date: "",
    scheduled_time: "08:00",
    location: "",
    notes: ""
  });

  const loadJob = useCallback(async () => {
    setLoading(true);
    const data = await getJobOrderById(params.id as string);
    setJob(data);
    setLoading(false);
  }, [params.id]);

  const statusIndex = useMemo(() => {
    return workflowSteps.findIndex((step) => step.key === job?.status);
  }, [job?.status]);
  const displayNotes = getDisplayJobNotes(job?.notes);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const openAssignDialog = async () => {
    setAssignForm({
      field_officer_id: "",
      assistant_ids: [],
      scheduled_date: new Date().toISOString().split("T")[0],
      scheduled_time: "08:00",
      location: job?.quotation?.profile?.address || "",
      notes: ""
    });
    setAssignDialogOpen(true);

    if (fieldOfficers.length > 0 && assistants.length > 0) return;
    setAssignDialogLoading(true);
    try {
      const [officers, assistantList] = await Promise.all([getFieldOfficers(), getFieldAssistants()]);
      setFieldOfficers(officers || []);
      setAssistants(assistantList?.items || []);
    } catch (error) {
      toast.error("Gagal memuat daftar petugas lapangan");
    } finally {
      setAssignDialogLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!job?.id) return;
    if (!assignForm.field_officer_id || !assignForm.scheduled_date || !assignForm.location.trim()) {
      toast.error("Lengkapi petugas, jadwal, dan lokasi");
      return;
    }

    setSubmittingAssign(true);
    try {
      const scheduledDateTime = `${assignForm.scheduled_date}T${assignForm.scheduled_time}:00`;
      const result = await createSamplingAssignment({
        job_order_id: job.id,
        field_officer_id: assignForm.field_officer_id,
        assistant_ids: assignForm.assistant_ids,
        scheduled_date: scheduledDateTime,
        location: assignForm.location,
        notes: assignForm.notes || undefined
      });

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Penugasan lapangan berhasil dibuat");
      setAssignDialogOpen(false);
      await loadJob();
    } catch (error: any) {
      toast.error(error?.message || "Gagal membuat penugasan lapangan");
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleSendTravelOrder = async () => {
    if (!job?.id) return;
    if (!job.sampling_assignment) {
      toast.error("Belum ada penugasan petugas lapangan");
      return;
    }

    setSendingTravelOrder(true);
    try {
      const result = await sendTravelOrderToField(job.id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Surat tugas berhasil dikirim ke petugas lapangan");
    } catch (error: any) {
      toast.error(error?.message || "Gagal mengirim surat tugas");
    } finally {
      setSendingTravelOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <ChemicalLoader />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 md:p-10 space-y-6">
        <Link href="/admin/jobs">
          <Button variant="outline" className="rounded-lg">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Jobs
          </Button>
        </Link>
        <Card className="rounded-xl border-slate-200">
          <CardContent className="py-10 text-center text-slate-500 font-semibold">
            Data pemantauan tidak ditemukan.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_-20%,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_100%_0%,rgba(15,23,42,0.1),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <Link href="/admin/jobs">
            <Button variant="outline" className="rounded-xl border-slate-200 bg-white/80 backdrop-blur-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Jobs
            </Button>
          </Link>
          <Badge className="w-fit rounded-full bg-emerald-600 text-white border-emerald-600 px-4 py-1.5">
            {statusLabel[job.status] || job.status}
          </Badge>
        </div>

        <Card className="overflow-hidden border-0 shadow-xl shadow-slate-300/30">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 px-6 md:px-8 py-8 text-white">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-200">Admin Job Intelligence</p>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                    Pemantauan {job.tracking_code}
                  </h1>
                  <p className="text-sm text-slate-200/90">
                    Kontrol penugasan lapangan dan distribusi surat tugas dalam satu panel.
                  </p>
                </div>
                {!job.sampling_assignment ? (
                  <Button
                    onClick={openAssignDialog}
                    className="h-11 rounded-xl px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Tugas Lapangan
                  </Button>
                ) : (
                  <Button
                    onClick={handleSendTravelOrder}
                    disabled={sendingTravelOrder}
                    className="h-11 rounded-xl px-5 bg-white text-slate-900 hover:bg-slate-100 font-black disabled:opacity-60"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendingTravelOrder ? "Mengirim..." : "Kirim Surat Tugas"}
                  </Button>
                )}
              </div>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white">
              <Card className="border-slate-100 shadow-none bg-slate-50/60 rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Klien</p>
                  <p className="mt-1 font-black text-slate-800 truncate">
                    {job.quotation?.profile?.company_name || job.quotation?.profile?.full_name || "-"}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-slate-100 shadow-none bg-slate-50/60 rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Petugas Lapangan</p>
                  <p className="mt-1 font-black text-slate-800 truncate">
                    {job.sampling_assignment?.field_officer?.full_name || "Belum ditugaskan"}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-slate-100 shadow-none bg-slate-50/60 rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Jadwal Sampling</p>
                  <p className="mt-1 font-black text-slate-800 truncate">
                    {job.sampling_assignment?.scheduled_date
                      ? new Date(job.sampling_assignment.scheduled_date).toLocaleString("id-ID")
                      : "Belum dijadwalkan"}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-slate-100 shadow-none bg-slate-50/60 rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Quotation</p>
                  <p className="mt-1 font-black text-slate-800 truncate">
                    {job.quotation?.quotation_number || "-"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200/70 bg-white/90 backdrop-blur-sm shadow-lg shadow-slate-200/50">
          <CardHeader>
            <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              Progress Workflow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {workflowSteps.map((step, idx) => {
                const active = idx === statusIndex;
                const done = idx < statusIndex;
                return (
                  <div
                    key={step.key}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 transition-colors",
                      done && "border-emerald-300 bg-emerald-50",
                      active && "border-emerald-600 bg-emerald-600 text-white",
                      !done && !active && "border-slate-200 bg-white text-slate-500"
                    )}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.14em]">{step.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                {displayNotes && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 mt-1 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-black">Catatan Job</p>
                      <p className="font-semibold text-slate-700 whitespace-pre-line">{displayNotes}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-1 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-black">Tanggal Dibuat</p>
                    <p className="font-semibold">{new Date(job.created_at).toLocaleString("id-ID")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-1 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-black">Lokasi Sampling</p>
                    <p className="font-semibold">
                      {job.sampling_assignment?.location || job.quotation?.profile?.address || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-1 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-black">Kontak Klien</p>
                    <p className="font-semibold">{job.quotation?.profile?.full_name || "-"}</p>
                    <p className="text-sm text-slate-500">{job.quotation?.profile?.phone || "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-4 w-4 mt-1 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-black">Asisten</p>
                    <p className="font-semibold">
                      {job.sampling_assignment?.assistants?.length
                        ? job.sampling_assignment.assistants.map((a: any) => a.full_name).join(", ")
                        : "Tidak ada"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 mt-1 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-black">Status Penugasan</p>
                    <p className="font-semibold flex items-center gap-2">
                      {job.sampling_assignment ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Sudah ditugaskan
                        </>
                      ) : (
                        "Belum ditugaskan"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent showCloseButton={false} className="max-w-[95vw] sm:max-w-3xl rounded-xl border border-slate-200 p-0 overflow-hidden shadow-2xl bg-white">
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-5 md:p-6 text-white relative overflow-hidden border-b border-emerald-700/70">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500 rounded-full blur-[80px] opacity-20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500 rounded-full blur-[60px] opacity-20" />

            <div className="relative z-10 flex items-center gap-3">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-lg">
                <UserPlus className="h-6 w-6 md:h-7 md:w-7 text-emerald-300" />
              </div>
              <DialogHeader className="flex-1 min-w-0">
                <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tight text-white leading-none truncate">
                  Penugasan Personel
                </DialogTitle>
                <DialogDescription className="text-emerald-100 font-bold uppercase text-[9px] md:text-[10px] tracking-[0.18em] mt-1.5 opacity-90 truncate">
                  {job?.tracking_code} | {job?.quotation?.profile?.company_name || "-"}
                </DialogDescription>
              </DialogHeader>
            </div>

            <button
              onClick={() => setAssignDialogOpen(false)}
              className="absolute top-3 right-3 md:top-4 md:right-4 h-9 w-9 md:h-10 md:w-10 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center transition-all border border-white/10"
            >
              <X className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </button>
          </div>

          <div className="max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
            <div className="p-6 md:p-8 space-y-6 bg-gradient-to-b from-white via-slate-50/50 to-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    Petugas Utama *
                  </label>
                  <Select value={assignForm.field_officer_id} onValueChange={(v) => setAssignForm((prev) => ({ ...prev, field_officer_id: v }))}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white border-2 border-slate-200 font-bold text-sm px-5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
                      <SelectValue placeholder={assignDialogLoading ? "Memuat..." : "Pilih Petugas Utama"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl max-h-48">
                      {fieldOfficers.length === 0 && <SelectItem value="none" disabled>Tidak ada petugas</SelectItem>}
                      {fieldOfficers.map((officer: any) => (
                        <SelectItem key={officer.id} value={officer.id} className="text-sm font-bold py-3 px-4 rounded-xl mb-1 hover:bg-emerald-50 cursor-pointer">
                          {officer.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    Tanggal Target *
                  </label>
                  <Input
                    type="date"
                    value={assignForm.scheduled_date}
                    onChange={(e) => setAssignForm((prev) => ({ ...prev, scheduled_date: e.target.value }))}
                    className="h-14 rounded-2xl bg-white border-2 border-slate-200 font-bold text-sm px-5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    Waktu Penugasan
                  </label>
                  <Input
                    type="time"
                    value={assignForm.scheduled_time}
                    onChange={(e) => setAssignForm((prev) => ({ ...prev, scheduled_time: e.target.value }))}
                    className="h-14 rounded-2xl bg-white border-2 border-slate-200 font-bold text-sm px-5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-violet-100 flex items-center justify-center">
                      <MapPin className="h-3.5 w-3.5 text-violet-600" />
                    </div>
                    Lokasi Sampling
                  </label>
                  <Input
                    placeholder="Alamat lengkap penugasan"
                    value={assignForm.location}
                    onChange={(e) => setAssignForm((prev) => ({ ...prev, location: e.target.value }))}
                    className="h-14 rounded-2xl bg-white border-2 border-slate-200 font-bold text-sm px-5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <UserPlus className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    Asisten Lapangan (Opsional)
                  </label>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                    {assignForm.assistant_ids.length} terpilih
                  </span>
                </div>

                {assignDialogLoading && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-500">
                    Memuat data petugas dan asisten...
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-3 bg-slate-50/80 rounded-3xl border-2 border-slate-100">
                  {assistants.length > 0 ? (
                    assistants.map((assistant: any) => {
                      const isSelected = assignForm.assistant_ids.includes(assistant.id);
                      return (
                        <label
                          key={assistant.id}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 group",
                            isSelected
                              ? "bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-200/50 scale-[1.02]"
                              : "bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                          )}
                        >
                          <div className={cn(
                            "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                            isSelected ? "bg-emerald-500 border-emerald-500" : "border-slate-300 group-hover:border-emerald-400"
                          )}>
                            {isSelected && <Check className="h-4 w-4 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-bold truncate transition-colors", isSelected ? "text-emerald-900" : "text-slate-900")}>
                              {assistant.full_name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{assistant.phone || "Belum ada nomor"}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAssignForm((prev) => ({ ...prev, assistant_ids: [...prev.assistant_ids, assistant.id] }));
                              } else {
                                setAssignForm((prev) => ({ ...prev, assistant_ids: prev.assistant_ids.filter((id) => id !== assistant.id) }));
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      );
                    })
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                      <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <User className="h-8 w-8 opacity-50" />
                      </div>
                      <p className="text-sm font-bold text-slate-500">Tidak ada asisten lapangan tersedia</p>
                      <p className="text-xs text-slate-400 mt-1">Tambahkan asisten dari halaman Asisten Lapangan</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Info className="h-3.5 w-3.5 text-slate-600" />
                  </div>
                  Instruksi Penugasan
                </label>
                <textarea
                  className="w-full h-32 bg-white border-2 border-slate-200 rounded-3xl p-5 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-300 resize-none"
                  placeholder="Instruksi khusus untuk tim lapangan..."
                  value={assignForm.notes}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 md:p-8 bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <Button
                variant="ghost"
                onClick={() => setAssignDialogOpen(false)}
                className="flex-1 h-14 rounded-2xl font-black text-slate-400 uppercase text-[11px] tracking-widest border-2 border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all"
              >
                Batal
              </Button>
              <Button
                onClick={handleCreateAssignment}
                disabled={submittingAssign || assignDialogLoading}
                className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black uppercase text-[11px] tracking-widest shadow-xl shadow-emerald-900/20 transition-all active:scale-[0.98]"
              >
                {submittingAssign ? "Memproses..." : "Konfirmasi Penugasan"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

