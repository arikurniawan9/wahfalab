"use client";

import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  getLandingPageConfig, 
  updateLandingPageConfig,
  uploadLocalImage
} from "@/lib/actions/system";
import { toast } from "sonner";
import { 
  Save, 
  Plus, 
  Trash2, 
  Image as ImageIcon,
  Upload,
  Loader2,
  Camera
} from "lucide-react";
import { ChemicalLoader, LoadingOverlay, LoadingButton } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function GalleryManagerPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  useEffect(() => {
    async function loadConfig() {
      const result = await getLandingPageConfig();
      if (result.error) {
        toast.error("Gagal memuat konfigurasi: " + result.error);
      } else {
        setConfig({
          ...result,
          gallery: Array.isArray(result.gallery) ? result.gallery : JSON.parse(result.gallery || "[]")
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
      toast.success("Galeri berhasil diperbarui!");
    } else {
      toast.error("Gagal memperbarui: " + result.error);
    }
    setSubmitting(false);
  };

  const addGalleryItem = () => {
    const newGallery = [
      ...(config.gallery || []), 
      { image_url: "", caption: "Deskripsi Foto", category: "Umum" }
    ];
    setConfig({ ...config, gallery: newGallery });
  };

  const handleGalleryChange = (index: number, field: string, value: string) => {
    const newGallery = [...config.gallery];
    newGallery[index] = { ...newGallery[index], [field]: value };
    setConfig({ ...config, gallery: newGallery });
  };

  const removeGalleryItem = (index: number) => {
    const newGallery = config.gallery.filter((_: any, i: number) => i !== index);
    setConfig({ ...config, gallery: newGallery });
  };

  const handleGalleryUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIdx(index);
    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadLocalImage(formData);
    if (result.success) {
      handleGalleryChange(index, "image_url", result.url || "");
      toast.success("Foto berhasil diunggah!");
    } else {
      toast.error("Gagal unggah: " + result.error);
    }
    setUploadingIdx(null);
  };

  if (loading) return <ChemicalLoader fullScreen />;

  return (
    <div className="p-4 md:p-10 space-y-8 pb-24 md:pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-emerald-900 uppercase tracking-tight font-[family-name:var(--font-montserrat)]">
            Manajemen Galeri
          </h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">
            Kelola foto fasilitas, kegiatan, dan dokumentasi WahfaLab.
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

      <Card className="border-2 border-emerald-100/50 shadow-xl shadow-emerald-900/5 overflow-hidden rounded-[2rem]">
        <CardHeader className="bg-emerald-50/50 border-b border-emerald-100/50 p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-600">
                <Camera className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-emerald-900 uppercase tracking-tight">Koleksi Foto</CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70">Foto akan muncul di halaman publik /gallery</CardDescription>
              </div>
            </div>
            <Button 
              onClick={addGalleryItem}
              variant="outline"
              size="sm"
              className="h-10 rounded-xl border-emerald-200 text-emerald-600 font-black uppercase tracking-widest text-[10px]"
            >
              <Plus className="h-3 w-3 mr-2" /> Tambah Foto
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(config.gallery || []).map((item: any, idx: number) => (
              <div key={idx} className="p-6 rounded-[2rem] bg-slate-50 border border-slate-200 space-y-4 relative group transition-all hover:bg-white hover:shadow-md">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeGalleryItem(idx)}
                  className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                
                <div className="aspect-video w-full rounded-2xl bg-slate-200 overflow-hidden relative border-2 border-white shadow-sm">
                  {item.image_url ? (
                    <img src={item.image_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <input 
                      type="file" 
                      id={`gallery-upload-${idx}`}
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleGalleryUpload(idx, e)}
                    />
                    <label htmlFor={`gallery-upload-${idx}`} className="cursor-pointer p-3 bg-white rounded-full text-emerald-600 hover:scale-110 transition-transform">
                      {uploadingIdx === idx ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Upload className="h-5 w-5" />
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kategori</Label>
                    <Input 
                      value={item.category} 
                      onChange={(e) => handleGalleryChange(idx, "category", e.target.value)}
                      placeholder="Misal: Fasilitas, Kegiatan"
                      className="h-10 rounded-xl border-slate-200 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Keterangan / Caption</Label>
                    <Input 
                      value={item.caption} 
                      onChange={(e) => handleGalleryChange(idx, "caption", e.target.value)}
                      placeholder="Tulis deskripsi singkat..."
                      className="h-10 rounded-xl border-slate-200 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {(config.gallery || []).length === 0 && (
            <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-[3rem]">
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Belum ada foto. Tambahkan foto dokumentasi untuk menarik minat pelanggan.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <LoadingOverlay
        isOpen={submitting}
        title="Menyimpan Galeri..."
        description="Data galeri sedang diperbarui secara real-time"
        variant="default"
      />
    </div>
  );
}
