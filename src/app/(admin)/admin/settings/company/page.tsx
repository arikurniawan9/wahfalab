"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, Trash2, Building2, MapPin, Phone, Mail, Globe, FileText } from "lucide-react";
import { getCompanyProfile, updateCompanyProfile, uploadCompanyLogo, deleteCompanyLogo } from "@/lib/actions/company";
import Image from "next/image";

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await getCompanyProfile();
      setProfile(data);
      if (data) {
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
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await updateCompanyProfile(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profil perusahaan berhasil diperbarui");
        loadProfile();
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("File harus berupa gambar (PNG, JPG, SVG)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const result = await uploadCompanyLogo(file);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Logo berhasil diupload");
        loadProfile();
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal upload logo");
    } finally {
      setUploadingLogo(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleDeleteLogo = async () => {
    toast.warning("Hapus Logo?", {
      description: "Logo akan dihapus dari sistem.",
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            const result = await deleteCompanyLogo();
            if (result.error) {
              toast.error(result.error);
            } else {
              toast.success("Logo berhasil dihapus");
              loadProfile();
            }
          } catch (error) {
            toast.error("Gagal menghapus logo");
          }
        },
      },
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-emerald-900 font-[family-name:var(--font-montserrat)] uppercase">
          Pengaturan Perusahaan
        </h1>
        <p className="text-slate-500 text-sm">Kelola informasi dan branding perusahaan Anda.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Logo Upload Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Logo Perusahaan</CardTitle>
            <CardDescription className="text-xs">
              Upload logo untuk digunakan di seluruh aplikasi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-square rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden relative">
              {profile?.logo_url ? (
                <>
                  <Image
                    src={profile.logo_url}
                    alt="Company Logo"
                    fill
                    className="object-contain p-4"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white"
                      onClick={handleDeleteLogo}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Belum ada logo</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                id="logo-upload"
              />
              <label htmlFor="logo-upload">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full cursor-pointer"
                  disabled={uploadingLogo}
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingLogo ? "Uploading..." : "Upload Logo"}
                  </span>
                </Button>
              </label>
              <p className="text-xs text-slate-500 text-center">
                Format: PNG, JPG, SVG (Max 5MB)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Company Info Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Informasi Perusahaan</CardTitle>
            <CardDescription className="text-xs">
              Lengkapi data perusahaan untuk keperluan dokumen resmi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Nama Perusahaan
                  </Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleChange("company_name", e.target.value)}
                    placeholder="WahfaLab"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={formData.tagline}
                    onChange={(e) => handleChange("tagline", e.target.value)}
                    placeholder="Laboratorium Analisis & Kalibrasi"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Alamat Lengkap
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Jl. Laboratorium No. 123, Jakarta, Indonesia"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telepon
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="(021) 1234-5678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => handleChange("whatsapp", e.target.value)}
                    placeholder="+62 812-3456-7890"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="info@wahfalab.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="https://wahfalab.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="npwp" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  NPWP
                </Label>
                <Input
                  id="npwp"
                  value={formData.npwp}
                  onChange={(e) => handleChange("npwp", e.target.value)}
                  placeholder="00.000.000.0-000.000"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Perubahan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      company_name: profile?.company_name || "",
                      address: profile?.address || "",
                      phone: profile?.phone || "",
                      whatsapp: profile?.whatsapp || "",
                      email: profile?.email || "",
                      website: profile?.website || "",
                      tagline: profile?.tagline || "",
                      npwp: profile?.npwp || ""
                    });
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Preview Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
          <CardDescription className="text-xs">
            Contoh tampilan logo dan informasi perusahaan di dokumen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-slate-50">
            <div className="flex items-start gap-4 mb-4">
              {profile?.logo_url ? (
                <Image
                  src={profile.logo_url}
                  alt="Logo Preview"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              ) : (
                <div className="w-20 h-20 bg-slate-200 rounded flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-slate-400" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-emerald-900">
                  {formData.company_name || "Nama Perusahaan"}
                </h3>
                <p className="text-sm text-slate-500">
                  {formData.tagline || "Tagline Perusahaan"}
                </p>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2 text-sm">
              {formData.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                  <span className="text-slate-700">{formData.address}</span>
                </div>
              )}
              {formData.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{formData.phone}</span>
                </div>
              )}
              {formData.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{formData.email}</span>
                </div>
              )}
              {formData.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-700">{formData.website}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
