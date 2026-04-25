"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Cloud, FolderUp, Link2, Save, FileText, Globe, HardDrive, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getCompanyProfile, updateCompanyProfile } from "@/lib/actions/company";

type UploadProvider = "supabase" | "public" | "google_drive" | "google_form";

export default function UploadStorageSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [formData, setFormData] = useState({
    upload_storage_provider: "supabase" as UploadProvider,
    upload_storage_public_path: "",
    upload_storage_external_url: "",
    upload_storage_note: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [data, healthResponse] = await Promise.all([
          getCompanyProfile(),
          fetch("/api/upload-storage-health", { cache: "no-store" }).then(async (res) => {
            if (!res.ok) return null;
            return res.json();
          }).catch(() => null),
        ]);
        setProfile(data);
        setHealth(healthResponse);
        setFormData({
          upload_storage_provider: (data?.upload_storage_provider || "supabase") as UploadProvider,
          upload_storage_public_path: data?.upload_storage_public_path || "",
          upload_storage_external_url: data?.upload_storage_external_url || "",
          upload_storage_note: data?.upload_storage_note || "",
        });
      } catch (error: any) {
        toast.error(error?.message || "Gagal memuat konfigurasi storage");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateCompanyProfile(formData);
      if (result.error) throw new Error(result.error);
      toast.success("Konfigurasi storage berhasil disimpan");
      const fresh = await getCompanyProfile();
      setProfile(fresh);
    } catch (error: any) {
      toast.error(error?.message || "Gagal menyimpan konfigurasi");
    } finally {
      setSaving(false);
    }
  };

  const providerMeta: Record<UploadProvider, { title: string; description: string; icon: any; accent: string }> = {
    supabase: {
      title: "Supabase Storage",
      description: "Default untuk file proyek dan hasil upload terstruktur.",
      icon: Cloud,
      accent: "text-emerald-700",
    },
    public: {
      title: "Project / Public",
      description: "File disimpan ke folder public project untuk kebutuhan lokal/standalone.",
      icon: HardDrive,
      accent: "text-blue-700",
    },
    google_drive: {
      title: "Google Drive",
      description: "Upload file ke folder Drive via service account. Isi folder URL/ID di bawah.",
      icon: FolderUp,
      accent: "text-violet-700",
    },
    google_form: {
      title: "Google Form",
      description: "Arahkan pengguna ke form Google untuk pengumpulan file/link eksternal.",
      icon: Link2,
      accent: "text-orange-700",
    },
  };

  const activeMeta = providerMeta[formData.upload_storage_provider];
  const ActiveIcon = activeMeta.icon;
  const googleDriveStatus = health?.googleDrive;

  if (loading) {
    return <div className="p-8 text-sm font-bold text-slate-500">Memuat konfigurasi storage...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/admin/settings/system">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-white border border-slate-100">
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Upload Storage</h1>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[9px] font-black">
                Admin Settings
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Atur tujuan penyimpanan file upload untuk alur petugas lapangan, analis, dan dokumen lain.
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest px-5"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900">Provider Penyimpanan</CardTitle>
              <CardDescription className="text-xs font-medium text-slate-500">
                Pilih tujuan utama file upload. Opsi ini akan dipakai pada halaman upload petugas dan analis.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mode Penyimpanan</Label>
                <Select
                  value={formData.upload_storage_provider}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, upload_storage_provider: value as UploadProvider }))}
                >
                  <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold">
                    <SelectValue placeholder="Pilih provider" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="supabase">Supabase Storage</SelectItem>
                    <SelectItem value="public">Project / Public</SelectItem>
                    <SelectItem value="google_drive">Google Drive</SelectItem>
                    <SelectItem value="google_form">Google Form</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-slate-50/60 p-5 flex items-start gap-4">
                <div className={cn("h-11 w-11 rounded-2xl bg-white flex items-center justify-center shadow-sm", activeMeta.accent)}>
                  <ActiveIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Mode Aktif</p>
                  <h3 className="font-black text-slate-900">{activeMeta.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{activeMeta.description}</p>
                  {formData.upload_storage_provider === "google_drive" && googleDriveStatus && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className={cn(
                        "text-[8px] font-black uppercase px-2.5 py-1 rounded-full border-none",
                        googleDriveStatus.envReady && googleDriveStatus.folderReady ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                      )}>
                        {googleDriveStatus.envReady && googleDriveStatus.folderReady ? "Google Drive Siap" : "Google Drive Belum Siap"}
                      </Badge>
                      {!googleDriveStatus.envReady && (
                        <Badge className="bg-rose-600 text-white text-[8px] font-black uppercase px-2.5 py-1 rounded-full border-none">
                          Env Drive belum terisi
                        </Badge>
                      )}
                      {!googleDriveStatus.folderReady && (
                        <Badge className="bg-amber-600 text-white text-[8px] font-black uppercase px-2.5 py-1 rounded-full border-none">
                          Folder Drive belum diisi
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Path Lokal / Public</Label>
                  <Input
                    value={formData.upload_storage_public_path}
                    onChange={(e) => setFormData((prev) => ({ ...prev, upload_storage_public_path: e.target.value }))}
                    placeholder="Contoh: /uploads/lab atau public/uploads"
                    className="h-12 rounded-2xl bg-slate-50 border-none font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Link Eksternal</Label>
                  <Input
                    value={formData.upload_storage_external_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, upload_storage_external_url: e.target.value }))}
                    placeholder="Google Drive folder URL/ID atau Google Form URL"
                    className="h-12 rounded-2xl bg-slate-50 border-none font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Catatan Operasional</Label>
                <Textarea
                  value={formData.upload_storage_note}
                  onChange={(e) => setFormData((prev) => ({ ...prev, upload_storage_note: e.target.value }))}
                  placeholder="Contoh: file foto lapangan disimpan ke folder khusus, file analis ke Drive, dll."
                  className="min-h-[120px] rounded-2xl bg-slate-50 border-none font-medium"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 bg-gradient-to-br from-slate-900 to-emerald-950 text-white overflow-hidden">
            <CardHeader className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-white/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black uppercase tracking-tight">Catatan Penting</CardTitle>
                  <CardDescription className="text-emerald-100/70 text-xs">
                    Pengaturan ini belum memindahkan file lama otomatis. Ini hanya menyiapkan jalur upload berikutnya.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/60 mb-2">Gunakan untuk</p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-white/10 text-white border-white/10">Foto Lapangan</Badge>
                  <Badge className="bg-white/10 text-white border-white/10">File Analisis</Badge>
                  <Badge className="bg-white/10 text-white border-white/10">Lampiran LHU</Badge>
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/60 mb-1">Status Tersimpan</p>
                <p className="text-sm font-black">{profile?.upload_storage_provider || "supabase"}</p>
                <p className="text-[11px] text-emerald-100/70 mt-1 truncate">
                  {profile?.upload_storage_external_url || profile?.upload_storage_public_path || "Belum ada target tambahan"}
                </p>
                {health?.provider === "google_drive" && (
                  <p className="text-[10px] text-emerald-100/80 mt-2 uppercase tracking-wider">
                    {health.googleDrive?.envReady && health.googleDrive?.folderReady
                      ? "Google Drive siap dipakai"
                      : "Google Drive belum siap, cek env dan folder target"}
                  </p>
                )}
                {health?.provider === "google_drive" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={cn("text-[8px] font-black uppercase px-2.5 py-1 rounded-full border-none", health.googleDrive?.envReady ? "bg-emerald-600 text-white" : "bg-rose-600 text-white")}>
                      {health.googleDrive?.envReady ? "Env OK" : "Env Missing"}
                    </Badge>
                    <Badge className={cn("text-[8px] font-black uppercase px-2.5 py-1 rounded-full border-none", health.googleDrive?.folderReady ? "bg-emerald-600 text-white" : "bg-amber-600 text-white")}>
                      {health.googleDrive?.folderReady ? "Folder OK" : "Folder Missing"}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-lg bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-black uppercase tracking-tight text-slate-900">Panduan Singkat</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3 text-sm text-slate-600">
              <p>1. `supabase` untuk penyimpanan terstruktur yang paling aman untuk aplikasi.</p>
              <p>2. `public` untuk file lokal pada project atau server mandiri.</p>
              <p>3. `google_drive` jika file ingin diupload ke folder Drive tertentu. Siapkan `GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL` dan `GOOGLE_DRIVE_PRIVATE_KEY`.</p>
              <p>4. `google_form` jika upload dilakukan melalui form eksternal. Mode ini masih referensi/manual.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
