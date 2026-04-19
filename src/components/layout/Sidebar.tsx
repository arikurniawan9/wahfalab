"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  FlaskConical,
  LogOut,
  ChevronLeft,
  Settings,
  Tag,
  MapPin,
  Truck,
  Wrench,
  UserCheck,
  CreditCard,
  Banknote,
  Building2,
  User,
  BookOpen,
  Briefcase,
  Shield,
  Server,
  History,
  Globe,
  Database,
  HardDrive,
  Receipt,
  FileBarChart,
  LayoutGrid,
  Image as ImageIcon,
  Newspaper,
  Mail,
  ListTree,
  Activity,
  UserGroup
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logout, getProfile } from "@/lib/actions/auth";
import Image from "next/image";

// Definisi Struktur Menu Admin dengan Warna Ikon yang Berbeda
export const adminMenuItems = () => [
  {
    group: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Beranda", href: "/admin", color: "text-sky-400", bgColor: "bg-sky-500/10" },
    ]
  },
  {
    group: "Data Master",
    items: [
      { icon: FlaskConical, label: "Katalog Layanan", href: "/admin/services", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
      { icon: Tag, label: "Kategori Layanan", href: "/admin/categories", color: "text-teal-400", bgColor: "bg-teal-500/10" },
      { icon: BookOpen, label: "Regulasi & Baku Mutu", href: "/admin/regulations", color: "text-blue-400", bgColor: "bg-blue-500/10" },
      { icon: Wrench, label: "Inventaris Alat", href: "/admin/equipment", color: "text-orange-400", bgColor: "bg-orange-500/10" },
      { icon: UserCheck, label: "Database Customer", href: "/admin/customers", color: "text-indigo-400", bgColor: "bg-indigo-500/10" },
      { icon: Users, label: "Tim Lapangan", href: "/admin/assistants", color: "text-purple-400", bgColor: "bg-purple-500/10" },
    ]
  },
  {
    group: "Operasional Lab",
    items: [
      { icon: FileText, label: "Penawaran Harga", href: "/admin/quotations", color: "text-amber-400", bgColor: "bg-amber-500/10" },
      { icon: LayoutGrid, label: "Progress Order", href: "/admin/jobs", color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
      { icon: MapPin, label: "Penugasan Sampling", href: "/admin/sampling", color: "text-rose-400", bgColor: "bg-rose-500/10" },
      { icon: Truck, label: "Biaya Transport", href: "/admin/transport-costs", color: "text-yellow-400", bgColor: "bg-yellow-500/10" },
      { icon: UserCheck, label: "Biaya Petugas", href: "/admin/engineer-costs", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
    ]
  },
  {
    group: "Keuangan",
    items: [
      { icon: CreditCard, label: "Verifikasi Bayar", href: "/admin/finance/payments", color: "text-green-400", bgColor: "bg-green-500/10" },
      { icon: Receipt, label: "Laporan Invoice", href: "/admin/finance/invoices", color: "text-pink-400", bgColor: "bg-pink-500/10" },
      { icon: FileBarChart, label: "Arus Kas", href: "/admin/finance/cashflow", color: "text-blue-400", bgColor: "bg-blue-500/10" },
    ]
  },
  {
    group: "Sistem & Web",
    items: [
      { icon: Users, label: "Manajemen Staff", href: "/admin/users", color: "text-rose-400", bgColor: "bg-rose-500/10" },
      { icon: Building2, label: "Profil Perusahaan", href: "/admin/settings/company", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
      { icon: Globe, label: "Konten Website", href: "/admin/content-management", color: "text-sky-400", bgColor: "bg-sky-500/10" },
      { icon: HardDrive, label: "Infrastruktur", href: "/admin/settings/system", color: "text-slate-400", bgColor: "bg-slate-500/10" },
      { icon: History, label: "Audit Log", href: "/admin/settings/audit-logs", color: "text-blue-400", bgColor: "bg-blue-500/10" },
      { icon: User, label: "Profil Saya", href: "/admin/settings/profile", color: "text-purple-400", bgColor: "bg-purple-500/10" },
    ]
  },
];

export const contentManagerMenuItems = [
  {
    group: "Manajemen Konten",
    items: [
      { icon: LayoutDashboard, label: "Beranda", href: "/content-manager", color: "text-sky-400", bgColor: "bg-sky-500/10" },
      { icon: FileText, label: "Data Home", href: "/content-manager/home", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
      { icon: ListTree, label: "Manajemen Menu", href: "/content-manager/menus", color: "text-blue-400", bgColor: "bg-blue-500/10" },
      { icon: ImageIcon, label: "Galeri Foto", href: "/content-manager/gallery", color: "text-pink-400", bgColor: "bg-pink-500/10" },
      { icon: Newspaper, label: "Manajemen Berita", href: "/content-manager/news", color: "text-orange-400", bgColor: "bg-orange-500/10" },
      { icon: Mail, label: "Pesan Masuk", href: "/content-manager/messages", color: "text-indigo-400", bgColor: "bg-indigo-500/10" },
      { icon: User, label: "Profil Saya", href: "/content-manager/profile", color: "text-purple-400", bgColor: "bg-purple-500/10" },
    ]
  },
];

export const operatorMenuItems = [
  {
    group: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Beranda", href: "/operator", color: "text-sky-400", bgColor: "bg-sky-500/10" },
    ]
  },
  {
    group: "Penawaran & Order",
    items: [
      { icon: FileText, label: "Penawaran Harga", href: "/operator/quotations", color: "text-amber-400", bgColor: "bg-amber-500/10" },
      { icon: Briefcase, label: "Progress Order", href: "/operator/jobs", color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
    ]
  },
  {
    group: "Operasional",
    items: [
      { icon: Truck, label: "Biaya Transport", href: "/operator/transport-costs", color: "text-yellow-400", bgColor: "bg-yellow-500/10" },
      { icon: UserCheck, label: "Biaya Petugas Sampling", href: "/operator/engineer-costs", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
    ]
  },
  {
    group: "Laboratorium",
    items: [
      { icon: FlaskConical, label: "Katalog Layanan", href: "/operator/services", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
      { icon: Tag, label: "Kategori", href: "/operator/categories", color: "text-teal-400", bgColor: "bg-teal-500/10" },
      { icon: Wrench, label: "Sewa Alat", href: "/operator/equipment", color: "text-orange-400", bgColor: "bg-orange-500/10" },
      { icon: Users, label: "Asisten Lapangan", href: "/operator/assistants", color: "text-purple-400", bgColor: "bg-purple-500/10" },
    ]
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("WahfaLab");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRole() {
      const profile = await getProfile();
      setRole(profile?.role || null);
    }
    fetchRole();
  }, []);

  useEffect(() => {
    async function fetchCompanyProfile() {
      try {
        const response = await fetch('/api/company-profile');
        const data = await response.json();
        if (data) {
          setCompanyName(data.company_name || "WahfaLab");
          setLogoUrl(data.logo_url);
        }
      } catch (error) {
        console.error('Error fetching company profile:', error);
      }
    }
    fetchCompanyProfile();
  }, []);

  const menuItems = role === 'admin'
    ? adminMenuItems()
    : role === 'content_manager'
      ? contentManagerMenuItems
      : role === 'operator'
        ? operatorMenuItems
      : [];

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-emerald-950 !bg-emerald-950 text-white transition-all duration-300 border-r border-emerald-900/50 shadow-2xl sticky top-0 h-screen z-40",
        isCollapsed ? "w-20" : "w-72",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-24 h-6 w-6 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-800 z-[100] shadow-lg transition-transform active:scale-90"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform duration-500", isCollapsed && "rotate-180")} />
      </Button>
      
      <div className="flex-1 h-full overflow-y-auto overflow-x-visible custom-scrollbar bg-emerald-950 !bg-emerald-950">
        <NavContent 
          isCollapsed={isCollapsed} 
          menuItems={menuItems} 
          pathname={pathname} 
          companyName={companyName} 
          logoUrl={logoUrl} 
          logout={logout} 
        />
      </div>
    </aside>
  );
}

interface NavContentProps {
  isCollapsed: boolean;
  menuItems: any[];
  pathname: string;
  companyName: string;
  logoUrl: string | null;
  logout: () => Promise<void>;
  onItemClick?: () => void;
}

export function NavContent({ isCollapsed, menuItems, pathname, companyName, logoUrl, logout, onItemClick }: NavContentProps) {
  return (
    <div className="flex flex-col min-h-full py-6 bg-emerald-950 !bg-emerald-950">
      {/* Brand */}
      <div className={cn("px-6 mb-10 flex items-center gap-4", isCollapsed && "px-4 justify-center")}>
        <div className="relative h-11 w-11 shrink-0 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner overflow-hidden group">
          <Image 
            src={logoUrl || "/logo-wahfalab.png"} 
            alt="WahfaLab Logo" 
            fill 
            className="object-contain p-1.5 transition-transform group-hover:scale-110" 
          />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-lg font-black tracking-tight text-white truncate uppercase leading-tight" style={{ fontFamily: 'var(--font-montserrat)' }}>
              {companyName}
            </span>
            <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-[0.3em]">LIMS Control</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-6">
        {menuItems.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-2">
            {!isCollapsed && group.group && group.group !== "Overview" && (
              <div className="px-4 flex items-center gap-2 mb-1">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-[10px] font-black text-emerald-500/40 uppercase tracking-[0.2em]">{group.group}</span>
                <div className="h-px bg-white/10 flex-1" />
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item: any) => (
                <NavItem 
                  key={item.href} 
                  item={item} 
                  isCollapsed={isCollapsed} 
                  isActive={pathname === item.href} 
                  onItemClick={onItemClick} 
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 mt-auto pt-6 border-t border-white/10">
        <form action={logout}>
          <Button
            variant="ghost"
            onClick={onItemClick}
            className={cn(
              "w-full h-12 rounded-2xl justify-start text-emerald-100/60 hover:text-rose-400 hover:bg-rose-600/10 group transition-all duration-300",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
            {!isCollapsed && <span className="ml-3 font-bold uppercase text-[10px] tracking-widest">Logout System</span>}
          </Button>
        </form>
      </div>
    </div>
  );
}

function NavItem({ item, isCollapsed, isActive, onItemClick }: any) {
  return (
    <Link
      href={item.href}
      onClick={onItemClick}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-300 group relative",
        isActive
          ? "bg-emerald-600 text-white shadow-xl shadow-emerald-900/50"
          : "text-slate-300 hover:bg-white/5 hover:text-white",
        isCollapsed && "justify-center px-0 h-11 w-11 mx-auto mb-1"
      )}
      title={isCollapsed ? item.label : ""}
    >
      <div className={cn(
        "h-9 w-9 rounded-xl flex items-center justify-center transition-all shrink-0 shadow-inner border border-white/5",
        isActive ? "bg-white/20 border-white/20" : item.bgColor,
        isActive ? "scale-110" : "group-hover:scale-110"
      )}>
        <item.icon className={cn(
          "h-5 w-5 transition-all duration-300",
          isActive ? "text-white" : item.color
        )} />
      </div>
      
      {!isCollapsed && (
        <div className="flex items-center justify-between flex-1 overflow-hidden">
          <span className={cn(
            "font-bold truncate tracking-tight transition-all text-sm",
            isActive ? "translate-x-1" : "group-hover:translate-x-1"
          )}>{item.label}</span>
          {item.badge && (
            <span className="ml-2 px-1.5 py-0.5 text-[8px] font-black bg-emerald-500 text-white rounded shadow-sm">
              {item.badge}
            </span>
          )}
        </div>
      )}
      {isCollapsed && item.badge && (
        <span className="absolute top-2 right-2 h-2 w-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
      )}
      {isActive && !isCollapsed && (
        <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full shadow-[2px_0_10px_rgba(255,255,255,0.4)]" />
      )}
    </Link>
  );
}
