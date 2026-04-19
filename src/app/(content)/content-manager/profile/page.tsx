"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Mail, Lock, Eye, EyeOff, Save, Shield } from "lucide-react";
import { getProfile, updateProfile, updatePasswordAction } from "@/lib/actions/auth";
import { LoadingOverlay, LoadingButton } from "@/components/ui";

export default function ContentManagerProfilePage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: ""
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await getProfile();
      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          email: data.email || ""
        });
      }
    } catch (error) {
      toast.error("Gagal memuat data profil");
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateProfile(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profil berhasil diperbarui");
        loadProfile();
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Password baru tidak cocok");
      return;
    }
    setLoading(true);
    try {
      const result = await updatePasswordAction({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Password berhasil diubah");
        setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-10 space-y-8 pb-24 md:pb-10">
      <div>
        <h1 className="text-2xl font-black text-emerald-900 uppercase tracking-tight font-[family-name:var(--font-montserrat)]">
          Profil Saya
        </h1>
        <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">
          Kelola informasi akun Content Manager Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-2 border-emerald-100/50 shadow-xl shadow-emerald-900/5 overflow-hidden rounded-[2rem]">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100/50 p-6 md:p-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-600">
                <User className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-emerald-900 uppercase tracking-tight">Informasi Dasar</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Update Nama & Email</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Nama Lengkap</Label>
                <div className="relative">
                  <Input 
                    value={formData.full_name} 
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="h-12 rounded-2xl border-slate-200 pl-11 font-bold"
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Email Login</Label>
                <div className="relative">
                  <Input 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    type="email"
                    className="h-12 rounded-2xl border-slate-200 pl-11 font-bold"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-800">Role Akun</span>
                <span className="text-xs font-black uppercase tracking-widest bg-white px-3 py-1 rounded-lg text-emerald-600 shadow-sm border border-emerald-100">
                  {profile?.role || "Content Manager"}
                </span>
              </div>
              <LoadingButton
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-2xl font-black uppercase tracking-widest"
                loading={loading}
              >
                <Save className="mr-2 h-4 w-4" /> Simpan Profil
              </LoadingButton>
            </form>
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-100 shadow-xl shadow-slate-900/5 overflow-hidden rounded-[2rem]">
          <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 md:p-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-emerald-900 uppercase tracking-tight">Keamanan</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ubah Password Akun</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6">
            <form onSubmit={handlePasswordChangeSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Password Saat Ini</Label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                    className="h-12 rounded-2xl border-slate-200 pl-11 font-bold"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Password Baru</Label>
                <div className="relative">
                  <Input 
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                    className="h-12 rounded-2xl border-slate-200 pl-11 font-bold"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Konfirmasi Password Baru</Label>
                <div className="relative">
                  <Input 
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                    className="h-12 rounded-2xl border-slate-200 pl-11 font-bold"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>
              <LoadingButton
                type="submit"
                variant="outline"
                className="w-full border-slate-200 h-12 rounded-2xl font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"
                loading={loading}
              >
                Ganti Password
              </LoadingButton>
            </form>
          </CardContent>
        </Card>
      </div>

      <LoadingOverlay
        isOpen={loading}
        title="Sedang Memproses..."
        description="Mohon tunggu sebentar sementara kami memperbarui akun Anda."
      />
    </div>
  );
}
