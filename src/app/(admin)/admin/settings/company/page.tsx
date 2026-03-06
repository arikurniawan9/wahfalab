"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Upload, Trash2, Building2, MapPin, Phone, Mail, Globe, 
  FileText, CheckCircle, Image as ImageIcon, Sparkles,
  Info, MessageSquare, ExternalLink, ShieldCheck, RefreshCw,
  X,
  Camera
} from "lucide-react";
import { getCompanyProfile, updateCompanyProfile, uploadCompanyLogo, deleteCompanyLogo } from "@/lib/actions/company";
import Image from "next/image";
import { LoadingOverlay, LoadingButton } from "@/components/ui";
import { PageSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    company_name: "",
    address: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    tagline: "",
    npwp: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = async () => {
    setFetching(true);
    try {
      const data = await getCompanyProfile();
      if (data) {
        setProfile(data);
        setFormData({
          company_name: data.company_name || "",
          address: data.address || "",
          phone: data.phone || "",
          whatsapp: data.whatsapp || "",
          email: data.email || "",
          website: data.website || "",
          tagline: data.tagline || "",
          npwp: data.npwp || ""
        });
      }
    } catch (error) {
      toast.error("Gagal memuat data perusahaan");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateCompanyProfile(formData);
      if (result.error) throw new Error(result.error);
      toast.success("Profil berhasil diperbarui", {
        description: "Data perusahaan telah disinkronkan ke seluruh sistem."
      });
      loadProfile();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const result = await uploadCompanyLogo(file);
      if (result.error) throw new Error(result.error);
      toast.success("Logo branding berhasil diperbarui");
      loadProfile();
    } catch (error: any) {
      toast.error(error.message || "Gagal upload logo");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteLogo = async () => {
    if (!window.confirm("Hapus logo perusahaan?")) return;
    
    setLoading(true);
    try {
      const result = await deleteCompanyLogo();
      if (result.error) throw new Error(result.error);
      toast.success("Logo berhasil dihapus");
      loadProfile();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10"><PageSkeleton /></div>;

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8 bg-slate-50/20 font-[family-name:var(--font-geist-sans)] max-w-7xl mx-auto">
      {/* Header Premium */}
      <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-900 rounded-xl shadow-inner">
            <Building2 className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Profil Institusi</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1.5 opacity-70">Identitas & Branding WahfaLab</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl font-black text-[9px] uppercase tracking-widest gap-2 h-10 px-4 bg-white" onClick={loadProfile}>
            <RefreshCw className={cn("h-3.5 w-3.5 text-slate-600", fetching && "animate-spin")} /> Segarkan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Logo & Branding */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="rounded-2xl border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
            <CardHeader className="p-6 border-b bg-slate-50/50">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <ImageIcon className="h-3 w-3 text-emerald-600" /> Visual Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="relative group mx-auto">
                <div className="aspect-square rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative shadow-inner group-hover:border-emerald-400 transition-all">
                  {profile?.logo_url || profile?.logo ? (
                    <Image
                      src={profile.logo_url || profile.logo}
                      alt="Company Logo"
                      fill
                      className="object-contain p-8"
                    />
                  ) : (
                    <div className="text-center space-y-2 opacity-30">
                      <ImageIcon className="h-12 w-12 mx-auto" />
                      <p className="text-[9px] font-black uppercase tracking-widest">Logo Belum Ada</p>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3">
                    <Button variant="secondary" size="sm" className="rounded-xl h-9 font-black text-[9px] uppercase tracking-widest" onClick={() => fileInputRef.current?.click()}>
                      <Camera className="h-3.5 w-3.5 mr-2" /> Ganti Logo
                    </Button>
                    {(profile?.logo_url || profile?.logo) && (
                      <Button variant="destructive" size="sm" className="rounded-xl h-9 font-black text-[9px] uppercase tracking-widest bg-rose-600" onClick={handleDeleteLogo}>
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Hapus
                      </Button>
                    )}
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
              </div>
              
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-emerald-800 leading-relaxed uppercase tracking-tight">
                  Gunakan logo transparan (PNG/SVG) untuk hasil cetak dokumen yang lebih profesional.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
            <CardHeader className="p-6 border-b bg-emerald-900">
              <CardTitle className="text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-emerald-400" /> Status Sertifikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Sesuai</span>
                <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-md">VERIFIED</Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sinkronisasi</span>
                <span className="text-[10px] font-bold text-slate-600 uppercase">REAL-TIME</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Form & Preview */}
        <div className="lg:col-span-8 space-y-8">
          <Card className="rounded-2xl border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
            <CardHeader className="p-8 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">Informasi Utama</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Data identitas resmi perusahaan</CardDescription>
              </div>
              <Building2 className="h-6 w-6 text-slate-100" />
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section: Identitas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nama Perusahaan</Label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <Input value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} className="h-12 pl-12 rounded-xl bg-slate-50 border-none font-bold text-sm focus-visible:ring-emerald-500 transition-all" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Slogan / Tagline</Label>
                    <div className="relative">
                      <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <Input value={formData.tagline} onChange={(e) => setFormData({...formData, tagline: e.target.value})} className="h-12 pl-12 rounded-xl bg-slate-50 border-none font-bold text-sm focus-visible:ring-emerald-500 transition-all" />
                    </div>
                  </div>
                </div>

                {/* Section: Kontak */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Resmi</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-12 pl-12 rounded-xl bg-slate-50 border-none font-bold text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">No. Telepon</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="h-12 pl-12 rounded-xl bg-slate-50 border-none font-bold text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">WhatsApp</Label>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <Input value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} className="h-12 pl-12 rounded-xl bg-slate-50 border-none font-bold text-sm" />
                    </div>
                  </div>
                </div>

                {/* Section: Web & Legal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Situs Web</Label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <Input value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} className="h-12 pl-12 rounded-xl bg-slate-50 border-none font-bold text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">NPWP Institusi</Label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <Input value={formData.npwp} onChange={(e) => setFormData({...formData, npwp: e.target.value})} className="h-12 pl-12 rounded-xl bg-slate-50 border-none font-bold text-sm" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Alamat Korespondensi</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 h-4 w-4 text-slate-300" />
                    <Textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="min-h-[100px] pl-12 rounded-xl bg-slate-50 border-none font-bold text-sm resize-none" />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={loadProfile} className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400">Batalkan</Button>
                  <LoadingButton type="submit" loading={loading} className="h-12 px-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-xl shadow-emerald-900/20 active:scale-95 transition-all">
                    Simpan Profil Perusahaan
                  </LoadingButton>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Letterhead Preview Section - PREMIUM */}
          <Card className="rounded-2xl border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
            <CardHeader className="p-6 border-b bg-slate-900 text-white flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-emerald-400" /> Live Letterhead Preview
                </CardTitle>
              </div>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[8px] font-black uppercase">Document View</Badge>
            </CardHeader>
            <CardContent className="p-10 bg-slate-100/50">
              <div className="max-w-3xl mx-auto bg-white shadow-2xl rounded-sm p-10 min-h-[250px] border-t-[6px] border-emerald-600 relative overflow-hidden">
                {/* Realistic Letterhead Design */}
                <div className="flex items-start justify-between gap-10 border-b-2 border-slate-900 pb-6 mb-6">
                  <div className="w-24 h-24 relative bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                    {(profile?.logo_url || profile?.logo) ? (
                      <Image src={profile.logo_url || profile.logo} alt="Logo" fill className="object-contain p-2" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-slate-200" />
                    )}
                  </div>
                  <div className="flex-1 text-right space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{formData.company_name || "NAMA PERUSAHAAN"}</h3>
                    <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.3em]">{formData.tagline || "Tagline Perusahaan Disini"}</p>
                    <div className="pt-2 space-y-0.5">
                      <p className="text-[9px] font-bold text-slate-500 leading-relaxed max-w-[300px] ml-auto">{formData.address || "Alamat lengkap perusahaan"}</p>
                      <p className="text-[9px] font-bold text-slate-700">T: {formData.phone || "-"} | WA: {formData.whatsapp || "-"}</p>
                      <p className="text-[9px] font-bold text-emerald-700 underline underline-offset-2">{formData.email || "info@domain.com"} | {formData.website || "www.domain.com"}</p>
                    </div>
                  </div>
                </div>
                
                {/* Mock Content */}
                <div className="space-y-2 opacity-10">
                  <div className="h-3 w-1/3 bg-slate-200 rounded" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="h-3 w-full bg-slate-100 rounded" />
                  <div className="h-3 w-2/3 bg-slate-100 rounded" />
                </div>
              </div>
              <p className="text-center mt-6 text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Simulasi tampilan header pada dokumen PDF Penawaran & Invoice</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <LoadingOverlay isOpen={loading} title="Sinkronisasi Selesai..." description="Memperbarui identitas institusi Anda" />
    </div>
  );
}
