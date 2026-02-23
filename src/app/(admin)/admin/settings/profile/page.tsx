"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Mail, Lock, Eye, EyeOff, Save, Shield } from "lucide-react";
import { getProfile, updateProfile, updatePassword } from "@/lib/actions/auth";
import { LoadingOverlay, LoadingButton } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ProfileSettingsPage() {
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
        toast.success("Profil berhasil diperbarui", {
          description: "Nama Anda telah diubah"
        });
        loadProfile();
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data", {
        description: "Silakan coba lagi"
      });
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

    if (passwordData.new_password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setLoading(true);

    try {
      const result = await updatePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Password berhasil diubah", {
          description: "Silakan login ulang dengan password baru"
        });
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: ""
        });
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal mengubah password", {
        description: "Silakan coba lagi"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordTextChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-emerald-900 font-[family-name:var(--font-montserrat)] uppercase">
          Profil Saya
        </h1>
        <p className="text-slate-500 text-sm">Kelola informasi dan keamanan akun Anda.</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Information */}
        <Card className="shadow-xl shadow-emerald-900/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg text-emerald-900">Informasi Profil</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Update nama dan email Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nama Lengkap
                  </Label>
                  <div className="relative">
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleChange("full_name", e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      required
                      className="pl-10 focus-visible:ring-emerald-500"
                    />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="email@wahfalab.com"
                      required
                      className="pl-10 focus-visible:ring-emerald-500"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                <Shield className="h-4 w-4" />
                <span>Role: <strong className="text-slate-700 capitalize">{profile?.role || "-"}</strong></span>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <LoadingButton
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 flex-1 cursor-pointer"
                  loading={loading}
                  loadingText="Menyimpan..."
                >
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Perubahan
                </LoadingButton>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="shadow-xl shadow-emerald-900/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg text-emerald-900">Ubah Password</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Ganti password untuk keamanan akun Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password Saat Ini
                </Label>
                <div className="relative">
                  <Input
                    id="current_password"
                    type={showPassword ? "text" : "password"}
                    value={passwordData.current_password}
                    onChange={(e) => handlePasswordTextChange("current_password", e.target.value)}
                    placeholder="Masukkan password saat ini"
                    required
                    className="pl-10 pr-10 focus-visible:ring-emerald-500"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new_password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password Baru
                  </Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.new_password}
                      onChange={(e) => handlePasswordTextChange("new_password", e.target.value)}
                      placeholder="Minimal 6 karakter"
                      required
                      className="pl-10 pr-10 focus-visible:ring-emerald-500"
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Konfirmasi Password Baru
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirm_password}
                      onChange={(e) => handlePasswordTextChange("confirm_password", e.target.value)}
                      placeholder="Ulangi password baru"
                      required
                      className="pl-10 pr-10 focus-visible:ring-emerald-500"
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <LoadingButton
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 flex-1 cursor-pointer"
                  loading={loading}
                  loadingText="Mengubah..."
                  disabled={loading || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Ubah Password
                </LoadingButton>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="shadow-xl shadow-emerald-900/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-lg text-emerald-900">Informasi Akun</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Detail akun Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-slate-500">Email</span>
              <span className="text-sm font-medium text-slate-900">{profile?.email || "-"}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-slate-500">Role</span>
              <span className="text-sm font-medium text-slate-900 capitalize">{profile?.role || "-"}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-500">Terdaftar Sejak</span>
              <span className="text-sm font-medium text-slate-900">
                {profile?.created_at 
                  ? new Date(profile.created_at).toLocaleDateString("id-ID", {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  : "-"
                }
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading Overlay */}
      <LoadingOverlay
        isOpen={loading}
        title="Menyimpan Data..."
        description="Profil Anda sedang disimpan"
        variant="default"
      />
    </div>
  );
}
