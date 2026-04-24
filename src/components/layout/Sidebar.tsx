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
  ChevronDown,
  Tag,
  MapPin,
  Truck,
  Wrench,
  UserCheck,
  CreditCard,
  Building2,
  User,
  BookOpen,
  Briefcase,
  History,
  Globe,
  HardDrive,
  Receipt,
  FileBarChart,
  LayoutGrid,
  Image as ImageIcon,
  Newspaper,
  Mail,
  ListTree,
  Activity,
  Database,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logout, getProfile } from "@/lib/actions/auth";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Struktur Menu
export const adminMenuItems = () => [
  {
    id: "overview",
    group: "Overview",
    icon: LayoutDashboard,
    items: [
      { icon: LayoutDashboard, label: "Beranda", href: "/admin", color: "text-sky-400", bgColor: "bg-sky-500/10" },
    ]
  },
  {
    id: "master",
    group: "Data Master",
    icon: Database,
    items: [
      { icon: Tag, label: "Kategori Layanan", href: "/admin/categories", color: "text-teal-400", bgColor: "bg-teal-500/10" },
      { icon: FlaskConical, label: "Katalog Layanan", href: "/admin/services", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
      { icon: BookOpen, label: "Regulasi & Baku Mutu", href: "/admin/regulations", color: "text-blue-400", bgColor: "bg-blue-500/10" },
      { icon: Wrench, label: "Inventaris Alat", href: "/admin/equipment", color: "text-orange-400", bgColor: "bg-orange-500/10" },
      { icon: UserCheck, label: "Database Customer", href: "/admin/customers", color: "text-indigo-400", bgColor: "bg-indigo-500/10" },
      { icon: Users, label: "Tim Lapangan", href: "/admin/assistants", color: "text-purple-400", bgColor: "bg-purple-500/10" },
    ]
  },
  {
    id: "operational",
    group: "Operasional Lab",
    icon: Activity,
    items: [
      { icon: FileText, label: "Penawaran Harga", href: "/admin/quotations", color: "text-amber-400", bgColor: "bg-amber-500/10" },
      { icon: LayoutGrid, label: "Progress Order", href: "/admin/jobs", color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
      { icon: MapPin, label: "Penugasan Sampling", href: "/admin/sampling", color: "text-rose-400", bgColor: "bg-rose-500/10" },
      { icon: Truck, label: "Biaya Transport", href: "/admin/transport-costs", color: "text-yellow-400", bgColor: "bg-yellow-500/10" },
      { icon: UserCheck, label: "Biaya Petugas", href: "/admin/engineer-costs", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
    ]
  },
  {
    id: "finance",
    group: "Keuangan",
    icon: CreditCard,
    items: [
      { icon: Banknote, label: "Dashboard Keuangan", href: "/admin/finance", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
      { icon: Building2, label: "Daftar Bank", href: "/admin/finance/settings/banks", color: "text-sky-400", bgColor: "bg-sky-500/10" },
      { icon: Wallet, label: "Kas Tunai", href: "/admin/finance/settings/cash", color: "text-amber-400", bgColor: "bg-amber-500/10" },
      { icon: ArrowUpRight, label: "Pemasukan", href: "/admin/finance/income", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
      { icon: ArrowDownRight, label: "Pengeluaran", href: "/admin/finance/expense", color: "text-rose-400", bgColor: "bg-rose-500/10" },
      { icon: History, label: "Riwayat Transaksi", href: "/admin/finance/transactions", color: "text-violet-400", bgColor: "bg-violet-500/10" },
      { icon: CreditCard, label: "Verifikasi Bayar", href: "/admin/finance/payments", color: "text-green-400", bgColor: "bg-green-500/10" },
      { icon: Receipt, label: "Laporan Invoice", href: "/admin/finance/invoices", color: "text-pink-400", bgColor: "bg-pink-500/10" },
      { icon: FileBarChart, label: "Arus Kas", href: "/admin/finance/cashflow", color: "text-blue-400", bgColor: "bg-blue-500/10" },
    ]
  },
  {
    id: "system",
    group: "Sistem & Web",
    icon: Settings,
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

export const operatorMenuItems = [
  {
    id: "overview",
    group: "Overview",
    icon: LayoutDashboard,
    items: [
      { icon: LayoutDashboard, label: "Beranda", href: "/operator", color: "text-sky-400", bgColor: "bg-sky-500/10" },
    ]
  },
  {
    id: "orders",
    group: "Penawaran & Order",
    icon: FileText,
    items: [
      { icon: FileText, label: "Penawaran Harga", href: "/operator/quotations", color: "text-amber-400", bgColor: "bg-amber-500/10" },
      { icon: Briefcase, label: "Progress Order", href: "/operator/jobs", color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
    ]
  },
  {
    id: "ops",
    group: "Operasional",
    icon: Truck,
    items: [
      { icon: Truck, label: "Biaya Transport", href: "/operator/transport-costs", color: "text-yellow-400", bgColor: "bg-yellow-500/10" },
      { icon: UserCheck, label: "Biaya Petugas Sampling", href: "/operator/engineer-costs", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
    ]
  },
  {
    id: "lab",
    group: "Laboratorium",
    icon: FlaskConical,
    items: [
      { icon: Tag, label: "Kategori", href: "/operator/categories", color: "text-teal-400", bgColor: "bg-teal-500/10" },
      { icon: FlaskConical, label: "Katalog Layanan", href: "/operator/services", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
      { icon: Wrench, label: "Sewa Alat", href: "/operator/equipment", color: "text-orange-400", bgColor: "bg-orange-500/10" },
      { icon: Users, label: "Asisten Lapangan", href: "/operator/assistants", color: "text-purple-400", bgColor: "bg-purple-500/10" },
    ]
  },
];

export const financeMenuItems = () => [
  {
    id: "finance",
    group: "Keuangan",
    icon: CreditCard,
    items: [
      { icon: Banknote, label: "Dashboard Keuangan", href: "/finance", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
      { icon: Building2, label: "Daftar Bank", href: "/finance/settings/banks", color: "text-sky-400", bgColor: "bg-sky-500/10" },
      { icon: Wallet, label: "Kas Tunai", href: "/finance/settings/cash", color: "text-amber-400", bgColor: "bg-amber-500/10" },
      { icon: ArrowUpRight, label: "Pemasukan", href: "/finance/income", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
      { icon: ArrowDownRight, label: "Pengeluaran", href: "/finance/expense", color: "text-rose-400", bgColor: "bg-rose-500/10" },
      { icon: History, label: "Riwayat Transaksi", href: "/finance/transactions", color: "text-violet-400", bgColor: "bg-violet-500/10" },
      { icon: CreditCard, label: "Verifikasi Bayar", href: "/finance/payments", color: "text-green-400", bgColor: "bg-green-500/10" },
      { icon: Receipt, label: "Laporan Invoice", href: "/finance/invoices", color: "text-pink-400", bgColor: "bg-pink-500/10" },
      { icon: FileBarChart, label: "Arus Kas", href: "/finance/cashflow", color: "text-blue-400", bgColor: "bg-blue-500/10" },
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
    : role === 'operator'
      ? operatorMenuItems
      : role === 'finance'
        ? financeMenuItems()
        : [];

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-emerald-950 text-white transition-all duration-500 ease-in-out border-r border-emerald-900/50 shadow-[10px_0_30px_rgba(0,0,0,0.3)] sticky top-0 h-screen z-40",
        isCollapsed ? "w-20" : "w-72",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 h-7 w-7 rounded-full bg-emerald-500 text-white hover:bg-emerald-400 border-2 border-emerald-950 z-[100] shadow-xl transition-all duration-300 active:scale-90"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform duration-500", isCollapsed && "rotate-180")} />
      </Button>
      
      <div className="flex-1 h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
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
  logout: () => Promise<void> | void;
  onItemClick?: () => void;
}

export function NavContent({ isCollapsed, menuItems, pathname, companyName, logoUrl, logout, onItemClick }: NavContentProps) {
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const activeGroupId = menuItems.find(group =>
    group.items.some((item: any) => pathname === item.href)
  )?.id;

  useEffect(() => {
    if (isCollapsed) return;
    setOpenGroups(activeGroupId ? [activeGroupId] : []);
  }, [activeGroupId, isCollapsed]);

  const toggleGroup = (groupId: string) => {
    if (isCollapsed) return; // Prevent accordion in collapsed mode
    setOpenGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId) 
        : [...prev, groupId]
    );
  };

  return (
    <div className="flex flex-col min-h-full py-8">
      {/* Brand Logo */}
      <div className={cn("px-6 mb-12 flex items-center gap-4 transition-all duration-500", isCollapsed && "px-4 justify-center")}>
        <div className="relative h-12 w-12 shrink-0 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl overflow-hidden group">
          <Image src={logoUrl || "/logo-wahfalab.png"} alt="Logo" fill className="object-contain p-2 transition-transform duration-700 group-hover:scale-125 group-hover:rotate-6" />
        </div>
        {!isCollapsed && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col min-w-0">
            <span className="text-xl font-black tracking-tighter text-white uppercase leading-none font-[family-name:var(--font-montserrat)]">{companyName}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em]">LIMS CONTROL</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-2">
        {menuItems.map((group) => {
          const isOpen = openGroups.includes(group.id);
          const hasActiveItem = group.items.some((item: any) => pathname === item.href);

          // Render Floating Menu if Collapsed
          if (isCollapsed) {
            return (
              <DropdownMenu key={group.id}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center justify-center h-12 w-12 mx-auto rounded-2xl transition-all duration-300 group relative",
                      hasActiveItem ? "bg-emerald-600 shadow-lg shadow-emerald-900/50" : "hover:bg-white/5"
                    )}
                  >
                    <group.icon className={cn("h-5 w-5", hasActiveItem ? "text-white" : "text-emerald-400")} />
                    {hasActiveItem && (
                      <div className="absolute left-[-4px] w-1 h-4 bg-emerald-400 rounded-r-full" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" sideOffset={16} className="bg-emerald-950 border-emerald-900 text-white min-w-[200px] p-2 rounded-2xl shadow-2xl z-[150]">
                  <div className="px-3 py-2 mb-1 border-b border-white/5">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{group.group}</p>
                  </div>
                  {group.items.map((item: any) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        onClick={onItemClick}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer mb-1",
                          pathname === item.href ? "bg-emerald-600 text-white" : "hover:bg-white/5 text-emerald-100/60 hover:text-white"
                        )}
                      >
                        <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", item.bgColor)}>
                           <item.icon className={cn("h-3.5 w-3.5", item.color)} />
                        </div>
                        <span className="text-[11px] font-bold">{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          // Normal Accordion Mode
          return (
            <div key={group.id} className="space-y-1">
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group",
                  isOpen || hasActiveItem ? "text-white" : "text-emerald-100/40 hover:text-white hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center transition-all shrink-0 border border-white/5",
                  hasActiveItem ? "bg-emerald-600 shadow-lg shadow-emerald-900/50 border-emerald-500" : "bg-white/5 group-hover:bg-white/10"
                )}>
                  <group.icon className={cn("h-5 w-5", hasActiveItem ? "text-white" : "text-emerald-400")} />
                </div>
                <div className="flex items-center justify-between flex-1">
                  <span className="font-black text-[11px] uppercase tracking-wider">{group.group}</span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-300 text-emerald-500/50", isOpen && "rotate-180")} />
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden pl-4 pr-2 space-y-1">
                    {group.items.map((item: any) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onItemClick}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 relative group",
                          pathname === item.href ? "text-white bg-emerald-600/20 shadow-inner" : "text-emerald-100/50 hover:text-white hover:bg-white/5"
                        )}
                      >
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-white/5", item.bgColor, "group-hover:scale-110")}>
                          <item.icon className={cn("h-4 w-4", item.color)} />
                        </div>
                        <span className="font-bold text-[11px] tracking-tight">{item.label}</span>
                        {pathname === item.href && (
                           <motion.div layoutId="active-pill-v3" className="absolute left-[-4px] w-1 h-4 bg-emerald-400 rounded-r-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                        )}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="px-4 mt-auto pt-8 space-y-3">
         <div className={cn("p-3 rounded-2xl bg-white/5 border border-white/5", isCollapsed && "p-1 bg-transparent border-none")}>
            <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
               <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white shadow-lg border border-emerald-400/30">
                  <User className="h-5 w-5" />
               </div>
               {!isCollapsed && (
                 <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-black text-white uppercase tracking-tighter">Current Session</span>
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active Access</span>
                 </div>
               )}
            </div>
         </div>
        <form action={async () => { await logout(); if (onItemClick) onItemClick(); }}>
          <Button variant="ghost" type="submit" className={cn("w-full h-12 rounded-2xl justify-start text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 transition-all", isCollapsed && "justify-center px-0")}>
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span className="ml-3 font-black uppercase text-[10px] tracking-[0.2em]">Exit System</span>}
          </Button>
        </form>
      </div>
    </div>
  );
}
