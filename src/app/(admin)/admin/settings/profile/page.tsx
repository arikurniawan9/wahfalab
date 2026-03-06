"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  User, Mail, Lock, Eye, EyeOff, Save, Shield, 
  Camera, BadgeCheck, Calendar, ShieldAlert,
  ChevronRight,
  LogOut,
  CameraIcon,
  ShieldCheck,
  Phone,
  MapPin,
  TextQuote
} from "lucide-react";
import { getProfile, updateProfile, updatePassword, logout } from "@/lib/actions/auth";
import { LoadingOverlay, LoadingButton } from "@/components/ui";
import { PageSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: ""
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProfile = async () => {
    setFetching(true);
    try {
      const data = await getProfile();
      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || ""
        });
      }
    } catch (error) {
      toast.error("Gagal memuat data profil");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateProfile(formData);
      if (result.error) throw new Error(result.error);
      toast.success("Profil berhasil diperbarui");
      loadProfile();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar (Maks 2MB)");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      await updateProfile({ ...formData, avatar_url: publicUrl });
      toast.success("Foto profil berhasil diperbarui");
      loadProfile();
    } catch (error: any) {
      toast.error("Gagal mengunggah foto: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    setLoading(true);
    try {
      const result = await updatePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      if (result.error) throw new Error(result.error);
      toast.success("Password berhasil diubah");
      setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah password");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10"><PageSkeleton /></div>;

  return (
    <div className="p-4 md:p-10 pb-24 md:pb-10 bg-slate-50/30 min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Header Ramping */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-emerald-950 uppercase tracking-tight">Pengaturan Akun</h1>
          <p className="text-slate-500 text-sm font-medium">Kelola identitas publik dan keamanan akses sistem Anda.</p>
        </div>
        <Button variant="outline" onClick={() => logout()} className="h-11 px-6 rounded-xl border-slate-200 font-black text-[10px] uppercase tracking-widest text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all">
          <LogOut className="h-4 w-4 mr-2" /> Keluar Sesi
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* LEFT: Profile & Avatar */}
        <div className="lg:col-span-7 space-y-8">
          <Card className="rounded-2xl border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
            <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                  <User className="h-6 w-6 text-emerald-600" /> Profil Publik
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Informasi dasar yang terlihat di sistem</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-8 md:p-10 space-y-10">
              {/* Avatar Section Premium */}
              <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Avatar className="h-28 w-28 rounded-3xl border-4 border-white shadow-2xl transition-transform duration-500 group-hover:scale-105">
                    <AvatarImage src={profile?.avatar_url} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-3xl font-black">
                      {(profile?.full_name || 'U').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <CameraIcon className="text-white h-8 w-8" />
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleUploadAvatar} accept="image/*" className="hidden" />
                </div>
                <div className="flex-1 space-y-3 text-center md:text-left">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{profile?.full_name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{profile?.role?.replace('_', ' ')} • WAHFALAB STAFF</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-9 px-5 rounded-xl border-slate-200 bg-white font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                    Ganti Foto Profil
                  </Button>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 group-focus-within:text-emerald-600 transition-colors">Nama Lengkap</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <Input 
                        value={formData.full_name} 
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                        className="h-12 pl-12 rounded-xl bg-slate-50 border-none font-bold text-sm focus-visible:ring-emerald-500 transition-all" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2 group">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 group-focus-within:text-emerald-600 transition-colors">Email Bisnis</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <Input 
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                        className="h-12 pl-12 rounded-xl bg-slate-50 border-none font-bold text-sm focus-visible:ring-emerald-500 transition-all" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2 group">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 group-focus-within:text-emerald-600 transition-colors">No. Telepon / WhatsApp</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <Input 
                        type="text"
                        maxLength={13}
                        value={formData.phone} 
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ""); // Hanya angka
                          setFormData({...formData, phone: value});
                        }} 
                        placeholder="62812xxxxxx"
                        className="h-12 pl-12 rounded-xl bg-slate-50 border-none font-bold text-sm focus-visible:ring-emerald-500 transition-all" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 group">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 group-focus-within:text-emerald-600 transition-colors">Alamat Tempat Tinggal</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 h-4 w-4 text-slate-300" />
                    <Textarea 
                      value={formData.address} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})} 
                      placeholder="Masukkan alamat lengkap..."
                      className="min-h-[100px] pl-12 rounded-xl bg-slate-50 border-none font-bold text-sm focus-visible:ring-emerald-500 transition-all resize-none" 
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex justify-end">
                  <LoadingButton 
                    type="submit" 
                    loading={loading} 
                    className="h-12 px-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-xl shadow-emerald-900/20 active:scale-95 transition-all"
                  >
                    <Save className="h-4 w-4 mr-3" /> Simpan Perubahan
                  </LoadingButton>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Security & Info */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="rounded-2xl border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
            <CardHeader className="p-8 border-b bg-rose-50/30">
              <CardTitle className="text-xl font-black text-rose-900 uppercase tracking-tight flex items-center gap-3">
                <Lock className="h-6 w-6 text-rose-600" /> Keamanan Sesi
              </CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mt-1">Ganti password secara berkala</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleUpdatePassword} className="space-y-5">
                <div className="space-y-2 group">
                  <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Password Saat Ini</Label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      value={passwordData.current_password} 
                      onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})} 
                      className="h-11 rounded-xl bg-slate-50 border-none font-bold focus-visible:ring-rose-500 px-4" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2 group">
                  <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Password Baru</Label>
                  <div className="relative">
                    <Input 
                      type={showNewPassword ? "text" : "password"} 
                      value={passwordData.new_password} 
                      onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})} 
                      className="h-11 rounded-xl bg-slate-50 border-none font-bold focus-visible:ring-rose-500 px-4" 
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600">
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2 group">
                  <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Ulangi Password Baru</Label>
                  <Input 
                    type="password" 
                    value={passwordData.confirm_password} 
                    onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})} 
                    className="h-11 rounded-xl bg-slate-50 border-none font-bold focus-visible:ring-rose-500 px-4" 
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 bg-slate-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg mt-4 active:scale-95 transition-all"
                >
                  Perbarui Kata Sandi
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-xl shadow-emerald-900/5 bg-emerald-900 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-[80px] opacity-20" />
            <CardContent className="p-8 space-y-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
                  <ShieldCheck className="h-6 w-6 text-emerald-300" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300/60">Tingkat Akses</p>
                  <h4 className="text-xl font-black uppercase tracking-tight">{profile?.role?.replace('_', ' ')}</h4>
                </div>
              </div>
              <div className="space-y-4 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-300/60"><Calendar className="h-3.5 w-3.5" /><span className="text-[9px] font-black uppercase tracking-widest">Bergabung</span></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    {profile?.created_at ? format(new Date(profile.created_at), "dd MMMM yyyy", { locale: id }) : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-300/60"><BadgeCheck className="h-3.5 w-3.5" /><span className="text-[9px] font-black uppercase tracking-widest">Status Akun</span></div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-md">VERIFIED</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <LoadingOverlay isOpen={loading} title="Memproses..." description="Sedang memperbarui keamanan akun Anda" />
    </div>
  );
}
