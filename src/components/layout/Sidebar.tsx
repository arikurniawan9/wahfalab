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
  Bell,
  UserCheck,
  CreditCard,
  Banknote,
  Building2,
  User,
  BookOpen,
  Briefcase,
  Microscope,
  Map,
  Utensils,
  Shield,
  ClipboardCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { logout, getProfile } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { getPendingApprovalCount } from "@/lib/actions/approval";
import Image from "next/image";

const adminMenuItems = (pendingApprovals: number = 0) => [
  {
    group: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { icon: LayoutDashboard, label: "Beranda", href: "/admin" },
    ]
  },
  {
    group: "Penawaran & Order",
    icon: FileText,
    items: [
      { icon: FileText, label: "Penawaran Harga", href: "/admin/quotations" },
      { icon: Briefcase, label: "Progress Order", href: "/admin/jobs" },
      { icon: MapPin, label: "Penugasan", href: "/admin/sampling" },
      { icon: Bell, label: "Persetujuan", href: "/admin/approval-requests", 
        badge: pendingApprovals > 0 ? pendingApprovals : undefined },
    ]
  },
  {
    group: "Laboratorium",
    icon: Microscope,
    items: [
      { icon: FlaskConical, label: "Katalog Layanan", href: "/admin/services" },
      { icon: Tag, label: "Kategori", href: "/admin/categories" },
      { icon: BookOpen, label: "Regulasi", href: "/admin/regulations" },
      { icon: Wrench, label: "Sewa Alat", href: "/admin/equipment" },
    ]
  },
  {
    group: "Sampling",
    icon: Map,
    items: [
      { icon: Truck, label: "Biaya Transport", href: "/admin/transport-costs" },
      { icon: UserCheck, label: "Biaya Petugas Sampling", href: "/admin/engineer-costs" },
    ]
  },
  {
    group: "User",
    icon: Users,
    items: [
      { icon: Users, label: "Pengguna", href: "/admin/users" },
      { icon: UserCheck, label: "Customer", href: "/admin/customers" },
    ]
  },
  {
    group: "Settings",
    icon: Settings,
    items: [
      { icon: Building2, label: "Perusahaan", href: "/admin/settings/company" },
      { icon: User, label: "Profil Saya", href: "/admin/settings/profile" },
    ]
  },
];

const operatorMenuItems = [
  {
    group: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { icon: LayoutDashboard, label: "Beranda", href: "/operator" },
    ]
  },
  {
    group: "Penawaran & Order",
    icon: FileText,
    items: [
      { icon: FileText, label: "Penawaran Harga", href: "/operator/quotations" },
      { icon: Briefcase, label: "Progress Order", href: "/operator/jobs" },
    ]
  },
  {
    group: "Operasional",
    icon: Truck,
    items: [
      { icon: Truck, label: "Biaya Transport", href: "/operator/transport-costs" },
      { icon: UserCheck, label: "Biaya Petugas Sampling", href: "/operator/engineer-costs" },
    ]
  },
  {
    group: "Laboratorium",
    icon: Microscope,
    items: [
      { icon: FlaskConical, label: "Katalog Layanan", href: "/operator/services" },
      { icon: Tag, label: "Kategori", href: "/operator/categories" },
      { icon: Wrench, label: "Sewa Alat", href: "/operator/equipment" },
    ]
  },
];

const clientMenuItems = [
  {
    group: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { icon: LayoutDashboard, label: "Beranda", href: "/dashboard" },
      { icon: FileText, label: "Riwayat Order", href: "/dashboard/orders" },
      { icon: Settings, label: "Pengaturan", href: "/dashboard/settings" },
    ]
  },
];

const fieldOfficerMenuItems = [
  {
    group: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { icon: LayoutDashboard, label: "Beranda", href: "/field" },
      { icon: MapPin, label: "Tugas Sampling", href: "/field/assignments" },
    ]
  },
];

const analystMenuItems = [
  {
    group: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { icon: LayoutDashboard, label: "Beranda", href: "/analyst" },
      { icon: FlaskConical, label: "Analisis", href: "/analyst/jobs" },
    ]
  },
];

const reportingMenuItems = [
  {
    group: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { icon: LayoutDashboard, label: "Beranda", href: "/reporting" },
      { icon: FileText, label: "Laporan Hasil Uji", href: "/reporting/jobs" },
    ]
  },
];

const financeMenuItems = [
  {
    group: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { icon: LayoutDashboard, label: "Beranda", href: "/finance" },
    ]
  },
  {
    group: "Pembayaran",
    icon: CreditCard,
    items: [
      { icon: CreditCard, label: "Pembayaran Masuk", href: "/finance/payments" },
      { icon: Banknote, label: "Transaksi", href: "/finance/transactions" },
    ]
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("WahfaLab");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const supabase = createClient();

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

  useEffect(() => {
    async function fetchPendingApprovals() {
      if (role === 'admin') {
        try {
          const count = await getPendingApprovalCount();
          setPendingApprovals(count);
        } catch (error) {
          console.error('Error fetching pending approvals:', error);
        }
      }
    }
    fetchPendingApprovals();
    
    // Poll every 30 seconds for new approvals
    const interval = setInterval(fetchPendingApprovals, 30000);
    return () => clearInterval(interval);
  }, [role]);

  const menuItems = role === 'admin'
    ? adminMenuItems(pendingApprovals)
    : role === 'operator'
      ? operatorMenuItems
      : role === 'field_officer'
        ? fieldOfficerMenuItems
        : role === 'analyst'
          ? analystMenuItems
          : role === 'reporting'
            ? reportingMenuItems
            : role === 'finance'
              ? financeMenuItems
              : role === 'client'
                ? clientMenuItems
                : []; // Don't show any menu if role is null/unknown

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-emerald-950 text-white transition-all duration-300 border-r border-emerald-900 sticky top-0 h-screen",
          isCollapsed ? "w-20" : "w-64",
          className
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-900 z-50 shadow-md"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
        </Button>
        <NavContent 
          isCollapsed={isCollapsed} 
          menuItems={menuItems} 
          pathname={pathname} 
          companyName={companyName} 
          logoUrl={logoUrl} 
          logout={logout} 
        />
      </aside>
    </>
  );
}

// Move NavContent outside of Sidebar component
interface NavContentProps {
  isCollapsed: boolean;
  menuItems: any[];
  pathname: string;
  companyName: string;
  logoUrl: string | null;
  logout: () => Promise<void>;
}

function NavContent({ isCollapsed, menuItems, pathname, companyName, logoUrl, logout }: NavContentProps) {
  return (
    <div className="flex flex-col h-full py-4">
      <div className={cn("px-6 mb-8 flex items-center gap-3", isCollapsed && "px-4 justify-center")}>
        {logoUrl ? (
          <div className="relative h-10 w-10">
            <Image
              src={logoUrl}
              alt="Logo"
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <img src="/logo-wahfalab.png" alt="Logo" className="h-10 w-auto brightness-0 invert" />
        )}
        {!isCollapsed && (
          <span className="text-xl font-bold tracking-tighter text-white" style={{ fontFamily: 'var(--font-montserrat)' }}>
            {companyName}
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-6 px-3 overflow-y-auto">
        {menuItems.map((group, groupIndex) => (
          <div key={groupIndex}>
            {!isCollapsed && group.group && (
              <div className="flex items-center gap-2 px-3 mb-2">
                {group.icon && <group.icon className="h-3 w-3 text-emerald-400" />}
                <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  {group.group}
                </h3>
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item: any) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                    pathname === item.href
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                      : "text-emerald-100 hover:bg-emerald-800/50 hover:text-white",
                    isCollapsed && "justify-center px-0"
                  )}
                  title={isCollapsed ? item.label : ""}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", pathname === item.href ? "text-white" : "text-emerald-400 group-hover:text-emerald-200")} />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1">
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        typeof item.badge === 'number' ? (
                          <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full min-w-[20px] text-center">
                            {item.badge}
                          </span>
                        ) : (
                          <span className="ml-2 px-2 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded uppercase">
                            {item.badge}
                          </span>
                        )
                      )}
                    </div>
                  )}
                  {isCollapsed && item.badge && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 mt-auto border-t border-emerald-800 pt-4">
        <form action={logout}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-emerald-100 hover:text-white hover:bg-emerald-800 group",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0 group-hover:translate-x-1 transition-transform" />
            {!isCollapsed && <span className="ml-3">Keluar</span>}
          </Button>
        </form>
      </div>
    </div>
  );
}
