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
  X, Camera, User, PenTool, Award
} from "lucide-react";
import { 
  getCompanyProfile, 
  updateCompanyProfile, 
  uploadCompanyLogo, 
  deleteCompanyFile,
  uploadCompanySignature,
  uploadCompanyStamp
} from "@/lib/actions/company";
import Image from "next/image";
import { LoadingOverlay, LoadingButton } from "@/components/ui";
import { PageSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    company_name: "",
    address: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    tagline: "",
    npwp: "",
    leader_name: ""
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

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
          npwp: data.npwp || "",
          leader_name: data.leader_name || ""
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
      toast.success("Profil berhasil diperbarui");
      loadProfile();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'signature' | 'stamp') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB");
      return;
    }

    setUploadingType(type);
    try {
      let result;
      if (type === 'logo') result = await uploadCompanyLogo(file);
      else if (type === 'signature') result = await uploadCompanySignature(file);
      else result = await uploadCompanyStamp(file);

      if (result.error) throw new Error(result.error);
      toast.success(`${type === 'logo' ? 'Logo' : type === 'signature' ? 'Tanda Tangan' : 'Stempel'} berhasil diperbarui`);
      loadProfile();
    } catch (error: any) {
      toast.error(error.message || "Gagal upload file");
    } finally {
      setUploadingType(null);
      if (e.target) e.target.value = "";
    }
  };

  const handleDeleteFile = async (type: 'logo' | 'signature' | 'stamp') => {
    if (!window.confirm(`Hapus ${type === 'logo' ? 'logo' : type === 'signature' ? 'tanda tangan' : 'stempel'}?`)) return;
    
    setLoading(true);
    try {
      const result = await deleteCompanyFile(type);
      if (result.error) throw new Error(result.error);
      toast.success("File berhasil dihapus");
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
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1.5 opacity-70">Identitas & Legalisasi WahfaLab</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl font-black text-[9px] uppercase tracking-widest gap-2 h-10 px-4 bg-white" onClick={loadProfile}>
            <RefreshCw className={cn("h-3.5 w-3.5 text-slate-600", fetching && "animate-spin")} /> Segarkan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Logo, Signature, Stamp */}
        <div className="lg:col-span-4 space-y-8">
          {/* Logo Card */}
          <Card className="rounded-2xl border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
            <CardHeader className="p-6 border-b bg-slate-50/50">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <ImageIcon className="h-3 w-3 text-emerald-600" /> Logo Institusi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="relative group aspect-square rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative shadow-inner">
                {profile?.logo_url ? (
                  <Image src={profile.logo_url} alt="Logo" fill className="object-contain p-6" />
                ) : (
                  <ImageIcon className="h-12 w-12 opacity-20" />
                )}
                <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                  <Button variant="secondary" size="sm" className="rounded-xl h-8 text-[9px] font-black uppercase" onClick={() => logoInputRef.current?.click()} disabled={uploadingType === 'logo'}>
                    {uploadingType === 'logo' ? 'Loading...' : 'Upload Logo'}
                  </Button>
                  {profile?.logo_url && (
                    <Button variant="destructive" size="sm" className="rounded-xl h-8 text-[9px] font-black uppercase" onClick={() => handleDeleteFile('logo')}>Hapus</Button>
                  )}
                </div>
              </div>
              <input type="file" ref={logoInputRef} onChange={(e) => handleFileUpload(e, 'logo')} accept="image/*" className="hidden" />
            </CardContent>
          </Card>

          {/* Signature & Stamp Card */}
          <Card className="rounded-2xl border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
            <CardHeader className="p-6 border-b bg-slate-50/50">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <PenTool className="h-3 w-3 text-emerald-600" /> Legalisasi Digital
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Signature Upload */}
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Tanda Tangan Digital</Label>
                <div className="relative group aspect-[3/2] rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                  {profile?.signature_url ? (
                    <Image src={profile.signature_url} alt="Signature" fill className="object-contain p-4" />
                  ) : (
                    <PenTool className="h-8 w-8 opacity-10" />
                  )}
                  <div className="absolute inset-0 bg-emerald-950/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                    <Button variant="secondary" size="sm" className="rounded-lg h-7 text-[8px] font-black uppercase" onClick={() => signatureInputRef.current?.click()}>Upload TTD</Button>
                    {profile?.signature_url && <Button variant="destructive" size="sm" className="rounded-lg h-7 text-[8px] font-black uppercase" onClick={() => handleDeleteFile('signature')}>Hapus</Button>}
                  </div>
                </div>
                <input type="file" ref={signatureInputRef} onChange={(e) => handleFileUpload(e, 'signature')} accept="image/*" className="hidden" />
              </div>

              {/* Stamp Upload */}
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Stempel Resmi (Opsional)</Label>
                <div className="relative group aspect-square w-32 mx-auto rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                  {profile?.stamp_url ? (
                    <Image src={profile.stamp_url} alt="Stamp" fill className="object-contain p-4" />
                  ) : (
                    <Award className="h-8 w-8 opacity-10" />
                  )}
                  <div className="absolute inset-0 bg-emerald-950/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                    <Button variant="secondary" size="sm" className="rounded-lg h-7 text-[8px] font-black uppercase" onClick={() => stampInputRef.current?.click()}>Upload Stempel</Button>
                    {profile?.stamp_url && <Button variant="destructive" size="sm" className="rounded-lg h-7 text-[8px] font-black uppercase" onClick={() => handleDeleteFile('stamp')}>Hapus</Button>}
                  </div>
                </div>
                <input type="file" ref={stampInputRef} onChange={(e) => handleFileUpload(e, 'stamp')} accept="image/*" className="hidden" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Main Form */}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nama Perusahaan</Label>
                    <Input value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-sm focus-visible:ring-emerald-500" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nama Kepala / Direktur</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <Input value={formData.leader_name} onChange={(e) => setFormData({...formData, leader_name: e.target.value})} placeholder="Nama lengkap beserta gelar..." className="h-12 pl-12 rounded-xl bg-slate-50 border-none font-bold text-sm focus-visible:ring-emerald-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Slogan / Tagline</Label>
                  <Input value={formData.tagline} onChange={(e) => setFormData({...formData, tagline: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-sm" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Resmi</Label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">No. Telepon</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">WhatsApp</Label>
                    <Input value={formData.whatsapp} onChange={(e) => setFormData({...formData, whatsapp: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Situs Web</Label>
                    <Input value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">NPWP Institusi</Label>
                    <Input value={formData.npwp} onChange={(e) => setFormData({...formData, npwp: e.target.value})} className="h-12 rounded-xl bg-slate-50 border-none font-bold text-sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Alamat Korespondensi</Label>
                  <Textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="min-h-[100px] rounded-xl bg-slate-50 border-none font-bold text-sm resize-none p-4" />
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

          {/* Letterhead Preview - Updated with Signature & Stamp */}
          <Card className="rounded-2xl border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
            <CardHeader className="p-6 border-b bg-slate-900 text-white flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-emerald-400" /> Live Document Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10 bg-slate-100/50">
              <div className="max-w-3xl mx-auto bg-white shadow-2xl rounded-sm p-10 min-h-[400px] border-t-[6px] border-emerald-600 relative overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between gap-10 border-b-2 border-slate-900 pb-6 mb-10">
                  <div className="w-20 h-20 relative bg-slate-50 rounded flex items-center justify-center shrink-0">
                    {profile?.logo_url ? <Image src={profile.logo_url} alt="Logo" fill className="object-contain p-2" /> : <ImageIcon className="h-8 w-8 text-slate-200" />}
                  </div>
                  <div className="flex-1 text-left space-y-1">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{formData.company_name || "NAMA PERUSAHAAN"}</h3>
                    <p className="text-[9px] font-bold text-slate-500 leading-relaxed">{formData.address || "Alamat lengkap perusahaan"}</p>
                    <p className="text-[9px] font-bold text-slate-700">T: {formData.phone || "-"} | E: {formData.email || "-"}</p>
                  </div>
                </div>
                
                {/* Content Body Mock */}
                <div className="flex-1 space-y-4">
                  <div className="h-4 w-1/2 bg-slate-100 rounded mx-auto mb-8" />
                  <div className="space-y-2 opacity-10">
                    <div className="h-3 w-full bg-slate-200 rounded" />
                    <div className="h-3 w-full bg-slate-200 rounded" />
                    <div className="h-3 w-2/3 bg-slate-200 rounded" />
                  </div>
                </div>

                {/* Signature Area Preview */}
                <div className="mt-10 flex justify-end">
                  <div className="w-48 text-center relative">
                    <p className="text-[9px] font-bold text-slate-400 mb-12">Cianjur, {new Date().toLocaleDateString('id-ID')}</p>
                    
                    {/* Digital Signature & Stamp Overlay */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full h-20 flex items-center justify-center pointer-events-none">
                      {profile?.signature_url && <div className="relative w-32 h-16 z-10 opacity-90"><Image src={profile.signature_url} alt="TTD" fill className="object-contain" /></div>}
                      {profile?.stamp_url && <div className="absolute top-0 right-0 w-20 h-20 z-0 opacity-40 mix-blend-multiply"><Image src={profile.stamp_url} alt="Stempel" fill className="object-contain" /></div>}
                    </div>

                    <p className="text-[10px] font-black text-slate-900 border-t border-slate-900 pt-1 uppercase">
                      {formData.leader_name || "NAMA KEPALA"}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Kepala Operasional</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <LoadingOverlay isOpen={loading || uploadingType !== null} title="Sedang Memproses..." description="Menyimpan perubahan identitas resmi perusahaan Anda." />
    </div>
  );
}
