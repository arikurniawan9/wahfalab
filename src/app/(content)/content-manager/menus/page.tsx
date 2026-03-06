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
  updateLandingPageConfig
} from "@/lib/actions/system";
import { toast } from "sonner";
import { 
  Save, 
  Plus, 
  Trash2, 
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
  GripHorizontal,
  ChevronRight,
  Eye,
  CheckCircle2,
  ListTree,
  X,
  Shield,
  Globe,
  MapPin,
  Building,
  Files,
  Zap,
  Dna,
  Search,
  Database,
  Truck,
  Box,
  LifeBuoy,
  Info,
  HelpCircle,
  Stethoscope,
  Activity,
  Droplets,
  Wind,
  ChevronDown,
  Heart
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
import { Button } from "@/components/ui/button";
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
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const AVAILABLE_ICONS = [
  { name: "Home", icon: Home },
  { name: "Award", icon: Award },
  { name: "Briefcase", icon: Briefcase },
  { name: "Shield", icon: Shield },
  { name: "Scale", icon: Scale },
  { name: "Globe", icon: Globe },
  { name: "MapPin", icon: MapPin },
  { name: "Building", icon: Building },
  { name: "ImageIcon", icon: ImageIcon },
  { name: "Phone", icon: Phone },
  { name: "Newspaper", icon: Newspaper },
  { name: "Files", icon: Files },
  { name: "Zap", icon: Zap },
  { name: "Dna", icon: Dna },
  { name: "Beaker", icon: Beaker },
  { name: "FlaskConical", icon: FlaskConical },
  { name: "Microscope", icon: Microscope },
  { name: "TestTubeDiagonal", icon: TestTubeDiagonal },
  { name: "Search", icon: Search },
  { name: "Database", icon: Database },
  { name: "Truck", icon: Truck },
  { name: "Box", icon: Box },
  { name: "LifeBuoy", icon: LifeBuoy },
  { name: "Info", icon: Info },
  { name: "HelpCircle", icon: HelpCircle },
  { name: "Stethoscope", icon: Stethoscope },
  { name: "Activity", icon: Activity },
  { name: "Droplets", icon: Droplets },
  { name: "Wind", icon: Wind },
  { name: "Clock", icon: Clock },
  { name: "Heart", icon: Heart },
  { name: "ShieldCheck", icon: ShieldCheck }
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

export default function MenuManagerPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    async function loadConfig() {
      const result = await getLandingPageConfig();
      if (result.error) {
        toast.error("Gagal memuat konfigurasi");
      } else {
        let parsedMenus = typeof result.navbar_menus === 'string' ? JSON.parse(result.navbar_menus) : (result.navbar_menus || []);
        
        // Add internal IDs for sorting
        parsedMenus = parsedMenus.map((m: any, i: number) => ({ ...m, _id: m._id || `menu-${Date.now()}-${i}` }));

        setConfig({ ...result, navbar_menus: parsedMenus });
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
    
    // Clean up internal _id before saving
    const cleanMenus = config.navbar_menus.map(({ _id, ...rest }: any) => rest);
    
    const result = await updateLandingPageConfig({
      ...config,
      navbar_menus: cleanMenus
    });

    if (result.success) {
      toast.success("Navigasi menu berhasil diperbarui!");
      setIsDirty(false);
    } else {
      toast.error("Gagal memperbarui: " + result.error);
    }
    setSubmitting(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = config.navbar_menus.findIndex((item: any) => item._id === active.id);
      const newIndex = config.navbar_menus.findIndex((item: any) => item._id === over?.id);
      handleUpdate({ ...config, navbar_menus: arrayMove(config.navbar_menus, oldIndex, newIndex) });
    }
  };

  if (loading) return <ChemicalLoader fullScreen />;

  return (
    <div className="p-4 md:p-10 space-y-10 pb-32 relative">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3" /> Konfigurasi Navigasi
            </span>
          </div>
          <h1 className="text-4xl font-black text-emerald-900 uppercase tracking-tight font-[family-name:var(--font-montserrat)]">
            Manajemen <span className="text-emerald-500">Menu</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">
            Atur struktur navigasi landing page dan menu mobile.
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

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daftar Link Navigasi Utama</span>
          <Button onClick={() => handleUpdate({ ...config, navbar_menus: [...(config.navbar_menus || []), { _id: `menu-${Date.now()}`, label: "Menu Baru", href: "/", icon: "Home", is_dropdown: false, sub_menus: [] }] })} className="bg-emerald-600 text-white rounded-xl px-6 h-10 font-black uppercase text-[10px]">
            <Plus className="h-4 w-4 mr-2" /> Tambah Menu Utama
          </Button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={config.navbar_menus.map((m: any) => m._id)} strategy={verticalListSortingStrategy}>
            <div className="bg-white rounded-[2.5rem] border-2 border-emerald-50 shadow-xl shadow-emerald-900/5 overflow-hidden">
              <div className="p-2 space-y-2">
                {config.navbar_menus.map((menu: any, idx: number) => (
                  <SortableItem key={menu._id} id={menu._id} isDraggingClass="bg-emerald-50 scale-[1.01] shadow-2xl">
                    <MenuRow 
                      menu={menu} 
                      onRemove={() => handleUpdate({ ...config, navbar_menus: config.navbar_menus.filter((_: any, i: number) => i !== idx) })}
                      onChange={(field: string, val: any) => {
                        const newList = [...config.navbar_menus];
                        newList[idx] = { ...newList[idx], [field]: val };
                        handleUpdate({ ...config, navbar_menus: newList });
                      }}
                    />
                  </SortableItem>
                ))}
                
                {config.navbar_menus.length === 0 && (
                  <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100 m-4">
                    <ListTree className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Belum ada menu navigasi ditambahkan</p>
                  </div>
                )}
              </div>
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* STICKY SAVE BAR */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 transform ${isDirty ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <div className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center gap-3 pr-8 border-r border-white/10">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Perubahan Belum Disimpan</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => window.location.reload()} className="h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 text-white/60">Batalkan</Button>
            <LoadingButton onClick={handleSave} loading={submitting} className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 h-12 px-10 rounded-xl font-black uppercase tracking-widest text-[10px]">
              Simpan Navigasi
            </LoadingButton>
          </div>
        </div>
      </div>

      <LoadingOverlay isOpen={submitting} title="Menyimpan Navigasi..." description="Struktur menu sedang diperbarui secara real-time" />
    </div>
  );
}

// Internal Component: MenuRow
function MenuRow({ menu, onRemove, onChange, dragHandleProps }: any) {
  return (
    <div className="p-4 rounded-[2rem] hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group space-y-4">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div {...dragHandleProps} className="p-3 bg-white rounded-2xl shadow-sm text-slate-300 hover:text-emerald-600 cursor-grab active:cursor-grabbing"><GripHorizontal className="h-5 w-5" /></div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 w-full">
          <div className="space-y-1">
            <Label className="text-[8px] font-black uppercase text-slate-400 ml-1">Label Menu</Label>
            <Input value={menu.label} onChange={(e) => onChange('label', e.target.value)} className="h-10 rounded-xl font-bold text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[8px] font-black uppercase text-slate-400 ml-1">Link (href)</Label>
            <Input value={menu.href} onChange={(e) => onChange('href', e.target.value)} className="h-10 rounded-xl font-medium text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[8px] font-black uppercase text-slate-400 ml-1">Ikon</Label>
            <Select value={menu.icon} onValueChange={(val) => onChange('icon', val)}>
              <SelectTrigger className="h-10 rounded-xl bg-white border-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-2xl">
                {AVAILABLE_ICONS.map((item) => (
                  <SelectItem key={item.name} value={item.name} className="rounded-xl"><div className="flex items-center gap-3"><item.icon className="h-4 w-4" /><span className="text-xs font-bold">{item.name}</span></div></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-3 h-full pb-1">
            <Button 
              variant={menu.is_dropdown ? "default" : "outline"} 
              size="sm" 
              onClick={() => onChange('is_dropdown', !menu.is_dropdown)}
              className={`flex-1 h-10 rounded-xl font-black uppercase text-[9px] ${menu.is_dropdown ? 'bg-emerald-600' : 'border-slate-200 text-slate-400'}`}
            >
              {menu.is_dropdown ? "Dropdown Aktif" : "Single Link"}
            </Button>
            <Button variant="ghost" size="icon" onClick={onRemove} className="text-slate-300 hover:text-red-500 rounded-full h-10 w-10 shrink-0"><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {menu.is_dropdown && (
        <div className="pl-12 md:pl-20 pr-4 py-4 bg-emerald-50/30 rounded-[1.5rem] border border-emerald-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600/60">Sub-menus</span>
            <Button onClick={() => onChange('sub_menus', [...(menu.sub_menus || []), { label: "Sub Menu", href: "/", icon: "ChevronRight" }])} variant="ghost" size="sm" className="h-7 text-[8px] font-black uppercase text-emerald-600 hover:bg-emerald-100 rounded-lg">
              <Plus className="h-3 w-3 mr-1" /> Tambah Sub
            </Button>
          </div>
          <div className="space-y-2">
            {(menu.sub_menus || []).map((sub: any, sIdx: number) => (
              <div key={sIdx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <Input value={sub.label} onChange={(e) => {
                  const newSubs = [...menu.sub_menus];
                  newSubs[sIdx].label = e.target.value;
                  onChange('sub_menus', newSubs);
                }} placeholder="Label" className="h-8 rounded-lg text-[10px] font-bold" />
                <Input value={sub.href} onChange={(e) => {
                  const newSubs = [...menu.sub_menus];
                  newSubs[sIdx].href = e.target.value;
                  onChange('sub_menus', newSubs);
                }} placeholder="Href" className="h-8 rounded-lg text-[10px]" />
                <div className="flex gap-2">
                  <Select value={sub.icon} onValueChange={(val) => {
                    const newSubs = [...menu.sub_menus];
                    newSubs[sIdx].icon = val;
                    onChange('sub_menus', newSubs);
                  }}>
                    <SelectTrigger className="h-8 rounded-lg bg-white border-slate-200 font-bold text-[10px] flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {[...AVAILABLE_ICONS, { name: "ChevronRight", icon: ChevronRight }].map((item) => (
                        <SelectItem key={item.name} value={item.name} className="rounded-lg"><div className="flex items-center gap-2"><item.icon className="h-3.5 w-3.5" /><span className="text-[10px] font-bold">{item.name}</span></div></SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => onChange('sub_menus', menu.sub_menus.filter((_: any, i: number) => i !== sIdx))} className="h-8 w-8 text-red-300 hover:text-red-500"><X className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
