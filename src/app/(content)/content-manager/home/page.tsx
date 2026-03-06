"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  LayoutPanelLeft,
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
  Home,
  Upload,
  Loader2,
  Heart,
  GripHorizontal,
  ChevronRight,
  Eye,
  Info,
  CheckCircle2
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ChemicalLoader, LoadingOverlay, LoadingButton } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

// Drag and Drop
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  rectSortingStrategy,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

// Reusable Sortable Wrapper
function SortableItem({ id, children, isDraggingClass = "border-emerald-500 ring-2 ring-emerald-100" }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 1 };
  
  return (
    <div ref={setNodeRef} style={style} className={`${isDragging ? isDraggingClass : ""}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, { dragHandleProps: { ...attributes, ...listeners } });
        }
        return child;
      })}
    </div>
  );
}

export default function EnhancedDataHomePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    async function loadConfig() {
      const result = await getLandingPageConfig();
      if (result.error) {
        toast.error("Gagal memuat konfigurasi");
      } else {
        const parsedFeatures = typeof result.features === 'string' ? JSON.parse(result.features) : (result.features || []);
        let parsedBanners = typeof result.banners === 'string' ? JSON.parse(result.banners) : (result.banners || []);
        let parsedPortfolio = typeof result.portfolio === 'string' ? JSON.parse(result.portfolio) : (result.portfolio || []);
        
        // Add internal IDs for sorting
        parsedBanners = parsedBanners.map((b: any, i: number) => ({ ...b, _id: b._id || `banner-${Date.now()}-${i}` }));
        parsedPortfolio = parsedPortfolio.map((p: any, i: number) => ({ ...p, _id: p._id || `port-${Date.now()}-${i}` }));

        setConfig({ ...result, features: parsedFeatures, banners: parsedBanners, portfolio: parsedPortfolio });
      }
      setLoading(false);
    }
    loadConfig();
  }, []);

  const handleUpdate = useCallback((newConfig: any) => {
    setConfig(newConfig);
    setIsDirty(true);
  }, []);

  const handleSave = async () => {
    setSubmitting(true);
    const cleanConfig = {
      ...config,
      banners: config.banners.map(({ _id, ...rest }: any) => rest),
      portfolio: config.portfolio.map(({ _id, ...rest }: any) => rest)
    };

    const result = await updateLandingPageConfig(cleanConfig);
    if (result.success) {
      toast.success("Halaman depan berhasil diperbarui!", {
        description: "Cache landing page telah di-refresh otomatis."
      });
      setIsDirty(false);
    } else {
      toast.error("Gagal memperbarui: " + result.error);
    }
    setSubmitting(false);
  };

  const handleDragEnd = (event: DragEndEvent, type: 'banners' | 'portfolio') => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = config[type].findIndex((item: any) => item._id === active.id);
      const newIndex = config[type].findIndex((item: any) => item._id === over?.id);
      handleUpdate({ ...config, [type]: arrayMove(config[type], oldIndex, newIndex) });
    }
  };

  const handleImageUpload = async (type: 'banners' | 'portfolio', index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIdx(type === 'banners' ? index : index + 1000);
    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadLocalImage(formData);
    if (result.success) {
      const newList = [...config[type]];
      newList[index] = { ...newList[index], [type === 'banners' ? 'image_url' : 'logo_url']: result.url };
      handleUpdate({ ...config, [type]: newList });
      toast.success("Media berhasil diunggah!");
    } else {
      toast.error("Gagal unggah: " + result.error);
    }
    setUploadingIdx(null);
  };

  if (loading) return <ChemicalLoader fullScreen />;

  return (
    <div className="p-4 md:p-10 space-y-10 pb-32 relative">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3" /> Konfigurasi Aktif
            </span>
          </div>
          <h1 className="text-4xl font-black text-emerald-900 uppercase tracking-tight font-[family-name:var(--font-montserrat)]">
            Home <span className="text-emerald-500">Editor</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">
            Personalisasi visual dan konten utama WahfaLab.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/" target="_blank">
            <Button variant="outline" className="h-14 px-6 rounded-2xl border-slate-200 font-bold uppercase tracking-widest text-[10px] hover:bg-white hover:border-emerald-500 group transition-all">
              <Eye className="h-4 w-4 mr-2 text-slate-400 group-hover:text-emerald-500" /> Lihat Live
            </Button>
          </Link>
          <LoadingButton 
            onClick={handleSave} 
            loading={submitting}
            disabled={!isDirty}
            className="bg-emerald-600 hover:bg-emerald-700 h-14 px-10 rounded-2xl shadow-xl shadow-emerald-900/20 font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:grayscale disabled:opacity-50"
          >
            <Save className="h-5 w-5 mr-2" />
            Simpan Perubahan
          </LoadingButton>
        </div>
      </div>

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="bg-slate-100/50 p-1.5 rounded-3xl h-auto mb-8 border border-slate-200/50 w-full md:w-fit overflow-x-auto justify-start">
          <TabsTrigger value="hero" className="rounded-2xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 font-black uppercase tracking-widest text-[10px]">
            <LayoutPanelLeft className="h-4 w-4 mr-2" /> Hero & Info
          </TabsTrigger>
          <TabsTrigger value="features" className="rounded-2xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 font-black uppercase tracking-widest text-[10px]">
            <Award className="h-4 w-4 mr-2" /> Keunggulan
          </TabsTrigger>
          <TabsTrigger value="banners" className="rounded-2xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 font-black uppercase tracking-widest text-[10px]">
            <ImageIcon className="h-4 w-4 mr-2" /> Slider Banners
          </TabsTrigger>
          <TabsTrigger value="mitra" className="rounded-2xl px-8 py-3 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 font-black uppercase tracking-widest text-[10px]">
            <Briefcase className="h-4 w-4 mr-2" /> Logo Mitra
          </TabsTrigger>
        </TabsList>

        {/* HERO TAB */}
        <TabsContent value="hero" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="border-2 border-emerald-50 rounded-[2.5rem] shadow-xl shadow-emerald-900/5 overflow-hidden">
                <CardHeader className="bg-emerald-50/30 p-8 border-b border-emerald-50">
                  <CardTitle className="text-xl font-black uppercase text-emerald-900">Hero Section</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest text-emerald-600/60">Teks Utama Landing Page</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Judul Utama (Gunakan & untuk Baris Baru)</Label>
                    <Input 
                      value={config.hero_title} 
                      onChange={(e) => handleUpdate({...config, hero_title: e.target.value})}
                      className="h-14 rounded-2xl border-slate-200 font-bold text-lg px-6 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deskripsi Hero</Label>
                    <Textarea 
                      value={config.hero_description} 
                      onChange={(e) => handleUpdate({...config, hero_description: e.target.value})}
                      className="min-h-[120px] rounded-2xl border-slate-200 font-medium leading-relaxed px-6 py-4"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teks Tombol CTA</Label>
                      <Input value={config.hero_cta_text} onChange={(e) => handleUpdate({...config, hero_cta_text: e.target.value})} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Link Tujuan</Label>
                      <Input value={config.hero_cta_link} onChange={(e) => handleUpdate({...config, hero_cta_link: e.target.value})} className="h-12 rounded-xl" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-8">
              <Card className="border-2 border-slate-100 rounded-[2.5rem] bg-slate-900 text-white overflow-hidden h-fit">
                <CardHeader className="p-8 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-black uppercase tracking-tight">Simulator Preview</CardTitle>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-black uppercase leading-tight">
                      {config.hero_title.split('&').map((t: string, i: number) => (
                        <React.Fragment key={i}>
                          {t} {i < config.hero_title.split('&').length - 1 && <br className="hidden md:block" />}
                        </React.Fragment>
                      ))}
                    </h3>
                    <p className="text-xs text-white/60 font-medium line-clamp-4 leading-relaxed">
                      {config.hero_description}
                    </p>
                    <div className="pt-4">
                      <Button className="bg-emerald-500 hover:bg-emerald-600 rounded-full font-black uppercase text-[10px] px-8 h-12">
                        {config.hero_cta_text}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex items-start gap-4">
                <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-1" />
                <p className="text-[11px] text-emerald-800/70 font-medium leading-relaxed italic">
                  Gunakan karakter <span className="font-bold">&</span> pada judul untuk memaksa teks pindah ke baris baru pada tampilan desktop.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* FEATURES TAB */}
        <TabsContent value="features" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center justify-between px-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total: {config.features.length} / 6 Keunggulan</p>
            <Button 
              onClick={() => {
                if (config.features.length >= 6) return toast.warning("Maksimal 6 fitur.");
                handleUpdate({ ...config, features: [...config.features, { icon: "ShieldCheck", title: "Fitur Baru", description: "Deskripsi fitur baru" }] });
              }}
              className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-xl px-6 h-10 font-black uppercase text-[10px] shadow-none"
            >
              <Plus className="h-4 w-4 mr-2" /> Tambah Fitur
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {config.features.map((feature: any, idx: number) => (
              <Card key={idx} className="border-2 border-emerald-50 rounded-[2.5rem] group hover:border-emerald-200 transition-all shadow-lg shadow-emerald-900/5">
                <CardContent className="p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600">
                      {React.createElement((AVAILABLE_ICONS.find(i => i.name === feature.icon)?.icon || ShieldCheck) as any, { className: "h-6 w-6" })}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleUpdate({ ...config, features: config.features.filter((_: any, i: number) => i !== idx) })} className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Ikon</Label>
                      <Select value={feature.icon} onValueChange={(val) => {
                        const newFeatures = [...config.features];
                        newFeatures[idx] = { ...newFeatures[idx], icon: val };
                        handleUpdate({ ...config, features: newFeatures });
                      }}>
                        <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {AVAILABLE_ICONS.map((item) => (
                            <SelectItem key={item.name} value={item.name} className="rounded-xl"><div className="flex items-center gap-3"><item.icon className="h-4 w-4" /><span className="text-xs font-bold">{item.name}</span></div></SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Judul</Label>
                      <Input value={feature.title} onChange={(e) => {
                        const newFeatures = [...config.features];
                        newFeatures[idx] = { ...newFeatures[idx], title: e.target.value };
                        handleUpdate({ ...config, features: newFeatures });
                      }} className="font-bold text-emerald-900 h-10 px-4 rounded-xl border-slate-100 bg-slate-50/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Deskripsi</Label>
                      <Input value={feature.description} onChange={(e) => {
                        const newFeatures = [...config.features];
                        newFeatures[idx] = { ...newFeatures[idx], description: e.target.value };
                        handleUpdate({ ...config, features: newFeatures });
                      }} className="text-xs font-medium text-slate-500 h-10 px-4 rounded-xl border-slate-100 bg-slate-50/50" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* BANNERS TAB */}
        <TabsContent value="banners" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Tarik kartu untuk mengatur urutan slider</span>
            </div>
            <Button onClick={() => handleUpdate({ ...config, banners: [...(config.banners || []), { _id: `banner-${Date.now()}`, image_url: "", title: "Judul Baru", subtitle: "Deskripsi" }] })} className="bg-emerald-600 text-white rounded-xl px-6 h-10 font-black uppercase text-[10px]">
              <Plus className="h-4 w-4 mr-2" /> Tambah Banner
            </Button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'banners')}>
            <SortableContext items={config.banners.map((b: any) => b._id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {config.banners.map((banner: any, idx: number) => (
                  <SortableItem key={banner._id} id={banner._id}>
                    <BannerCard 
                      banner={banner} 
                      onRemove={() => handleUpdate({ ...config, banners: config.banners.filter((_: any, i: number) => i !== idx) })} 
                      onChange={(field: string, val: string) => {
                        const newList = [...config.banners];
                        newList[idx] = { ...newList[idx], [field]: val };
                        handleUpdate({ ...config, banners: newList });
                      }}
                      onUpload={(e: any) => handleImageUpload('banners', idx, e)}
                      isUploading={uploadingIdx === idx}
                    />
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </TabsContent>

        {/* MITRA TAB */}
        <TabsContent value="mitra" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className="border-2 border-emerald-50 rounded-[2.5rem] shadow-xl shadow-emerald-900/5 overflow-hidden mb-8">
            <CardHeader className="bg-emerald-50/30 p-8 border-b border-emerald-50">
              <CardTitle className="text-xl font-black uppercase text-emerald-900">Pengaturan Seksi Mitra</CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-widest text-emerald-600/60">Judul dan Deskripsi Bagian Portofolio/Mitra</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Judul Seksi Mitra</Label>
                <Input 
                  value={config.portfolio_title || ""} 
                  onChange={(e) => handleUpdate({...config, portfolio_title: e.target.value})}
                  className="h-12 rounded-xl border-slate-200 font-bold"
                  placeholder="Contoh: Mitra Industri & Klien Kami"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deskripsi Seksi Mitra</Label>
                <Textarea 
                  value={config.portfolio_description || ""} 
                  onChange={(e) => handleUpdate({...config, portfolio_description: e.target.value})}
                  className="min-h-[100px] rounded-xl border-slate-200 font-medium"
                  placeholder="Masukkan deskripsi singkat tentang kerjasama mitra..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold text-slate-400">Urutan logo mitra di bagian bawah landing page</span>
            <Button onClick={() => handleUpdate({ ...config, portfolio: [...(config.portfolio || []), { _id: `port-${Date.now()}`, name: "Mitra Baru", logo_url: "", industry: "Sektor Industri" }] })} className="bg-emerald-600 text-white rounded-xl px-6 h-10 font-black uppercase text-[10px]">
              <Plus className="h-4 w-4 mr-2" /> Tambah Mitra
            </Button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'portfolio')}>
            <SortableContext items={config.portfolio.map((p: any) => p._id)} strategy={verticalListSortingStrategy}>
              <div className="bg-white rounded-[2.5rem] border-2 border-emerald-50 shadow-xl shadow-emerald-900/5 overflow-hidden">
                <div className="p-2 space-y-2">
                  {config.portfolio.map((item: any, idx: number) => (
                    <SortableItem key={item._id} id={item._id} isDraggingClass="bg-emerald-50 scale-[1.01] shadow-2xl">
                      <MitraRow 
                        item={item} 
                        onRemove={() => handleUpdate({ ...config, portfolio: config.portfolio.filter((_: any, i: number) => i !== idx) })}
                        onChange={(field: string, val: string) => {
                          const newList = [...config.portfolio];
                          newList[idx] = { ...newList[idx], [field]: val };
                          handleUpdate({ ...config, portfolio: newList });
                        }}
                        onUpload={(e: any) => handleImageUpload('portfolio', idx, e)}
                        isUploading={uploadingIdx === idx + 1000}
                      />
                    </SortableItem>
                  ))}
                </div>
              </div>
            </SortableContext>
          </DndContext>
        </TabsContent>
      </Tabs>

      {/* STICKY SAVE BAR */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 transform ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <div className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-3 pr-8 border-r border-white/10">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Ada Perubahan Belum Disimpan</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => window.location.reload()} className="h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 text-white/60">Batalkan</Button>
            <LoadingButton onClick={handleSave} loading={submitting} className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 h-12 px-10 rounded-xl font-black uppercase tracking-widest text-[10px]">
              Simpan Semua
            </LoadingButton>
          </div>
        </div>
      </div>

      <LoadingOverlay isOpen={submitting} title="Menyimpan Konfigurasi..." description="Halaman depan sedang diperbarui dan cache sedang di-refresh" />
    </div>
  );
}

// Internal Component: BannerCard
function BannerCard({ banner, onRemove, onChange, onUpload, isUploading, dragHandleProps }: any) {
  return (
    <Card className="border-2 border-slate-100 rounded-[2.5rem] overflow-hidden bg-white group transition-all">
      <div className="aspect-[16/9] relative overflow-hidden bg-slate-100">
        {banner.image_url ? (
          <img src={banner.image_url} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="h-12 w-12" /></div>
        )}
        <div {...dragHandleProps} className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg cursor-grab active:cursor-grabbing text-emerald-600"><GripHorizontal className="h-4 w-4" /></div>
        <Button variant="destructive" size="icon" onClick={onRemove} className="absolute top-4 right-4 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></Button>
      </div>
      <CardContent className="p-6 space-y-4">
        <div className="flex gap-2">
          <Input value={banner.image_url} onChange={(e) => onChange('image_url', e.target.value)} placeholder="URL Gambar..." className="h-10 rounded-xl text-xs font-bold bg-slate-50 border-none" />
          <div className="relative">
            <input type="file" id={`up-${banner._id}`} className="hidden" accept="image/*" onChange={onUpload} disabled={isUploading} />
            <Button asChild variant="outline" className="h-10 w-10 p-0 rounded-xl border-emerald-200 text-emerald-600 shrink-0 cursor-pointer"><label htmlFor={`up-${banner._id}`}>{isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</label></Button>
          </div>
        </div>
        <Input value={banner.title} onChange={(e) => onChange('title', e.target.value)} placeholder="Judul Banner" className="h-10 rounded-xl font-black uppercase text-[10px] tracking-widest border-slate-100" />
        <Input value={banner.subtitle} onChange={(e) => onChange('subtitle', e.target.value)} placeholder="Sub-judul Banner" className="h-10 rounded-xl text-[10px] font-medium text-slate-500 border-slate-100" />
      </CardContent>
    </Card>
  );
}

// Internal Component: MitraRow
function MitraRow({ item, onRemove, onChange, onUpload, isUploading, dragHandleProps }: any) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-[2rem] hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
      <div {...dragHandleProps} className="p-3 bg-white rounded-2xl shadow-sm text-slate-300 hover:text-emerald-600 cursor-grab active:cursor-grabbing"><GripHorizontal className="h-5 w-5" /></div>
      <div className="h-16 w-32 rounded-2xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center p-2 shrink-0">
        {item.logo_url ? <img src={item.logo_url} alt="Logo" className="max-h-full max-w-full object-contain" /> : <Briefcase className="h-6 w-6 text-slate-200" />}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 w-full">
        <div className="space-y-1">
          <Label className="text-[8px] font-black uppercase text-slate-400 ml-1">Nama Perusahaan</Label>
          <Input value={item.name} onChange={(e) => onChange('name', e.target.value)} className="h-10 rounded-xl font-bold text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-[8px] font-black uppercase text-slate-400 ml-1">Industri / Sektor</Label>
          <Input value={item.industry} onChange={(e) => onChange('industry', e.target.value)} className="h-10 rounded-xl font-medium text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-[8px] font-black uppercase text-slate-400 ml-1">Ganti Logo</Label>
          <div className="flex gap-2">
            <Input value={item.logo_url} onChange={(e) => onChange('logo_url', e.target.value)} className="h-10 rounded-xl text-[10px] font-mono text-slate-400" />
            <input type="file" id={`pt-${item._id}`} className="hidden" accept="image/*" onChange={onUpload} disabled={isUploading} />
            <Button asChild variant="outline" className="h-10 w-10 p-0 rounded-xl border-emerald-200 text-emerald-600 shrink-0"><label htmlFor={`pt-${item._id}`}>{isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</label></Button>
          </div>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove} className="text-slate-300 hover:text-red-500 rounded-full h-12 w-12"><Trash2 className="h-5 w-5" /></Button>
    </div>
  );
}
