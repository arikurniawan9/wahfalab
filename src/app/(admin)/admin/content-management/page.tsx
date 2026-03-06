"use client";

import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  getLandingPageConfig, 
  updateLandingPageConfig 
} from "@/lib/actions/system";
import { toast } from "sonner";
import { 
  Save, 
  Plus, 
  Trash2, 
  LayoutDashboard, 
  LayoutPanelLeft,
  ArrowRight,
  ShieldCheck,
  Clock,
  Beaker,
  FlaskConical,
  Microscope,
  TestTubeDiagonal,
  Award,
  Briefcase,
  Scale,
  Image as ImageIcon,
  Phone,
  Newspaper,
  Home
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ChemicalLoader, LoadingOverlay, LoadingButton } from "@/components/ui";

const AVAILABLE_ICONS = [
  { name: "ShieldCheck", icon: ShieldCheck },
  { name: "Clock", icon: Clock },
  { name: "Beaker", icon: Beaker },
  { name: "FlaskConical", icon: FlaskConical },
  { name: "Microscope", icon: Microscope },
  { name: "TestTubeDiagonal", icon: TestTubeDiagonal },
  { name: "Award", icon: Award },
  { name: "Briefcase", icon: Briefcase },
  { name: "Scale", icon: Scale },
  { name: "ImageIcon", icon: ImageIcon },
  { name: "Phone", icon: Phone },
  { name: "Newspaper", icon: Newspaper },
  { name: "Home", icon: Home }
];

export default function ContentManagementPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    async function loadConfig() {
      const result = await getLandingPageConfig();
      if (result.error) {
        toast.error("Gagal memuat konfigurasi: " + result.error);
      } else {
        // Ensure features is an array
        const parsedFeatures = typeof result.features === 'string' 
          ? JSON.parse(result.features) 
          : (result.features || []);
        
        setConfig({
          ...result,
          features: parsedFeatures
        });
      }
      setLoading(false);
    }
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSubmitting(true);
    const result = await updateLandingPageConfig(config);
    if (result.success) {
      toast.success("Halaman depan berhasil diperbarui!");
    } else {
      toast.error("Gagal memperbarui: " + result.error);
    }
    setSubmitting(false);
  };

  const handleFeatureChange = (index: number, field: string, value: string) => {
    const newFeatures = [...config.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setConfig({ ...config, features: newFeatures });
  };

  const addFeature = () => {
    if (config.features.length >= 6) {
      toast.warning("Maksimal 6 fitur saja agar tampilan tetap rapi.");
      return;
    }
    const newFeatures = [
      ...config.features, 
      { icon: "ShieldCheck", title: "Fitur Baru", description: "Deskripsi fitur baru" }
    ];
    setConfig({ ...config, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    const newFeatures = config.features.filter((_: any, i: number) => i !== index);
    setConfig({ ...config, features: newFeatures });
  };

  if (loading) return <ChemicalLoader fullScreen />;

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-emerald-900 uppercase tracking-tight font-[family-name:var(--font-montserrat)]">
            Pengelolaan Konten Halaman Depan
          </h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">
            Sesuaikan tampilan website publik WahfaLab secara dinamis.
          </p>
        </div>
        <LoadingButton 
          onClick={handleSave} 
          loading={submitting}
          loadingText="Menyimpan..."
          className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 rounded-2xl shadow-lg shadow-emerald-900/20 font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
        >
          <Save className="h-5 w-5 mr-2" />
          Simpan Perubahan
        </LoadingButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* HERO SECTION CONFIG */}
        <Card className="border-2 border-emerald-100/50 shadow-xl shadow-emerald-900/5 overflow-hidden rounded-[2rem]">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100/50 p-6 md:p-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-600">
                <LayoutPanelLeft className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-emerald-900 uppercase tracking-tight">Hero Section</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Bagian Utama Halaman Depan</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Judul Utama (Gunakan & untuk Baris Baru)</Label>
              <Input 
                value={config.hero_title} 
                onChange={(e) => setConfig({...config, hero_title: e.target.value})}
                placeholder="Contoh: Solusi Terpercaya untuk & Analisis Kimia"
                className="h-12 rounded-2xl border-slate-200 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Deskripsi Hero</Label>
              <Textarea 
                value={config.hero_description} 
                onChange={(e) => setConfig({...config, hero_description: e.target.value})}
                placeholder="Masukkan deskripsi singkat perusahaan..."
                className="min-h-[100px] rounded-2xl border-slate-200 font-medium leading-relaxed"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Teks Tombol (CTA)</Label>
                <Input 
                  value={config.hero_cta_text} 
                  onChange={(e) => setConfig({...config, hero_cta_text: e.target.value})}
                  className="h-12 rounded-2xl border-slate-200 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Link Tombol</Label>
                <Input 
                  value={config.hero_cta_link} 
                  onChange={(e) => setConfig({...config, hero_cta_link: e.target.value})}
                  className="h-12 rounded-2xl border-slate-200 font-bold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">URL Gambar Hero (Opsional)</Label>
              <Input 
                value={config.hero_image_url || ""} 
                onChange={(e) => setConfig({...config, hero_image_url: e.target.value})}
                placeholder="Kosongkan untuk menggunakan animasi Beaker default"
                className="h-12 rounded-2xl border-slate-200 font-bold"
              />
              <p className="text-[10px] text-slate-400 italic">Gunakan link gambar eksternal atau upload ke Supabase Storage terlebih dahulu.</p>
            </div>
          </CardContent>
        </Card>

        {/* FEATURES SECTION CONFIG */}
        <Card className="border-2 border-emerald-100/50 shadow-xl shadow-emerald-900/5 overflow-hidden rounded-[2rem]">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100/50 p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-600">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-emerald-900 uppercase tracking-tight">Keunggulan Kami</CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Maksimal 6 Fitur</CardDescription>
                </div>
              </div>
              <Button 
                onClick={addFeature}
                variant="outline"
                size="sm"
                className="h-10 rounded-xl border-emerald-200 text-emerald-600 font-black uppercase tracking-widest text-[10px]"
              >
                <Plus className="h-3 w-3 mr-2" /> Tambah Fitur
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6 max-h-[600px] overflow-y-auto">
            {config.features.map((feature: any, idx: number) => (
              <div key={idx} className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 relative group transition-all hover:bg-white hover:shadow-md">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeFeature(idx)}
                  className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ikon</Label>
                    <Select 
                      value={feature.icon} 
                      onValueChange={(val) => handleFeatureChange(idx, "icon", val)}
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-emerald-100">
                        {AVAILABLE_ICONS.map((item) => (
                          <SelectItem key={item.name} value={item.name} className="rounded-xl focus:bg-emerald-50 focus:text-emerald-700">
                            <div className="flex items-center gap-2">
                              <item.icon className="h-4 w-4" />
                              <span className="text-xs font-bold">{item.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Judul Fitur</Label>
                    <Input 
                      value={feature.title} 
                      onChange={(e) => handleFeatureChange(idx, "title", e.target.value)}
                      className="h-12 rounded-2xl border-slate-200 font-bold bg-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deskripsi Fitur</Label>
                  <Input 
                    value={feature.description} 
                    onChange={(e) => handleFeatureChange(idx, "description", e.target.value)}
                    className="h-12 rounded-2xl border-slate-200 font-medium bg-white"
                  />
                </div>
              </div>
            ))}
            
            {config.features.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-[2rem]">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Belum ada fitur yang ditambahkan.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* PREVIEW NOTICE */}
      <div className="bg-amber-50 border-2 border-amber-100 p-6 rounded-[2rem] flex items-center gap-4">
        <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-500">
          <Newspaper className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-amber-900 font-black uppercase tracking-tight">Catatan Preview</h4>
          <p className="text-amber-700/80 text-xs font-medium leading-relaxed">
            Perubahan yang Anda simpan akan langsung diterapkan pada halaman publik. Silakan buka tab baru ke <a href="/" target="_blank" className="underline font-black hover:text-amber-900 transition-colors">wahfalab.com</a> untuk melihat hasilnya.
          </p>
        </div>
      </div>
      
      {/* Loading Overlay */}
      <LoadingOverlay
        isOpen={submitting}
        title="Menyimpan Perubahan..."
        description="Konten halaman depan sedang diperbarui secara real-time"
        variant="default"
      />
    </div>
  );
}
