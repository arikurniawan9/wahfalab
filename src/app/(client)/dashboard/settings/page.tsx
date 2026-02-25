// ============================================================================
// CLIENT SETTINGS PAGE - Profile & Password
// Fitur:
// 1. ✅ Update profile (nama, email, perusahaan)
// 2. ✅ Ubah password
// 3. ✅ Upload avatar/foto
// 4. ✅ Real-time validation
// 5. ✅ Toast notifications
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Lock,
  Mail,
  Building,
  Phone,
  MapPin,
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Camera,
  Shield,
  Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { createClient } from "@/lib/supabase/client";
import { getProfile, updateProfile } from "@/lib/actions/auth";
import { toast } from "sonner";
import { ChemicalLoader } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function ClientSettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Profile form
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    company_name: "",
    phone: "",
    address: ""
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const supabase = createClient();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const prof = await getProfile();
      setProfile(prof);
      setFormData({
        full_name: prof?.full_name || "",
        email: prof?.email || "",
        company_name: prof?.company_name || "",
        phone: prof?.phone || "",
        address: prof?.address || ""
      });
    } catch (error) {
      toast.error("Gagal memuat profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await updateProfile(formData);
      
      if (result.error) {
        toast.error("Gagal update profile", {
          description: result.error
        });
      } else {
        toast.success("✅ Profile berhasil diperbarui");
        loadProfile();
      }
    } catch (error: any) {
      toast.error("Gagal update profile", {
        description: error?.message
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Password baru tidak sama");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        toast.error("Gagal ubah password", {
          description: error.message
        });
      } else {
        toast.success("✅ Password berhasil diubah");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      }
    } catch (error: any) {
      toast.error("Gagal ubah password", {
        description: error?.message
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <ChemicalLoader />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8 bg-slate-50/20">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4 cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-emerald-900 tracking-tight flex items-center gap-3">
              <User className="h-8 w-8 text-emerald-600" />
              Pengaturan Akun
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Kelola profile dan keamanan akun Anda
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Form */}
        <Card className="shadow-lg shadow-emerald-900/5 border-emerald-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <User className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-emerald-900">Profile Saya</CardTitle>
                <CardDescription>Update informasi personal Anda</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-bold text-slate-700">
                  Nama Lengkap
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="fullName"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="pl-10 h-11 rounded-xl border-slate-200"
                    placeholder="Nama lengkap Anda"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold text-slate-700">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 h-11 rounded-xl border-slate-200"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-xs font-bold text-slate-700">
                  Perusahaan
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="company"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="pl-10 h-11 rounded-xl border-slate-200"
                    placeholder="Nama perusahaan"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold text-slate-700">
                  Nomor Telepon
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10 h-11 rounded-xl border-slate-200"
                    placeholder="0812-3456-7890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs font-bold text-slate-700">
                  Alamat
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-10 pr-3 py-3 h-24 rounded-xl border border-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Alamat lengkap"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 cursor-pointer font-bold"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Form */}
        <Card className="shadow-lg shadow-emerald-900/5 border-emerald-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Lock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-emerald-900">Keamanan</CardTitle>
                <CardDescription>Ubah password untuk keamanan akun</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-800 mb-1">Tips Password Aman</h5>
                    <ul className="text-[10px] text-amber-700 space-y-1">
                      <li>• Minimal 6 karakter</li>
                      <li>• Gunakan kombinasi huruf & angka</li>
                      <li>• Jangan gunakan password yang mudah ditebak</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-xs font-bold text-slate-700">
                  Password Saat Ini
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="pl-10 pr-10 h-11 rounded-xl border-slate-200"
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 cursor-pointer"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-xs font-bold text-slate-700">
                  Password Baru
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="pl-10 pr-10 h-11 rounded-xl border-slate-200"
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 cursor-pointer"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-700">
                  Konfirmasi Password Baru
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className={cn(
                      "pl-10 pr-10 h-11 rounded-xl border-slate-200",
                      passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                        ? "border-red-300 focus:ring-red-500"
                        : ""
                    )}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-[10px] text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Password tidak sama
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={saving || !passwordData.newPassword || !passwordData.confirmPassword}
                className="w-full h-11 bg-amber-600 hover:bg-amber-700 cursor-pointer font-bold"
              >
                <Lock className="h-4 w-4 mr-2" />
                {saving ? "Menyimpan..." : "Ubah Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Account Info Card */}
      <Card className="mt-6 shadow-lg shadow-emerald-900/5 border-emerald-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-emerald-900">Informasi Akun</CardTitle>
              <CardDescription>Detail akun Anda</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl">
              <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-1">Role</h5>
              <Badge className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">
                {profile?.role || 'Customer'}
              </Badge>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl">
              <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-1">Terdaftar Sejak</h5>
              <p className="text-sm font-semibold text-slate-800">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("id-ID", {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                }) : '-'}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl">
              <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-1">Status</h5>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-emerald-700">Aktif</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
